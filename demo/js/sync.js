  // ☁ 여러 컴퓨터 공유 — 이 기기에 저장되는 cafesui.* 내용을 Firebase(ops 컬렉션)에도 같이 쓰고, 다른 컴퓨터에서 바뀐 건 받아온다.
  //   · 저장 키 하나 = 문서 하나 (id = 키). 마지막에 쓴 쪽이 이긴다.
  //   · 로그인(cafesui.me)과 잠금 상태는 기기마다 따로. 비밀번호(cafesui.pin.*)는 같이 공유해서 한 번 정하면 어느 컴퓨터에서나 통한다.
  //   · Firebase가 없거나(오프라인·차단) 익명 로그인이 꺼져 있으면 이 기기에만 저장하고 위에 표시만 한다.
  (function () {
    var LOCAL_ONLY = /^cafesui\.(me|unlocked|device|syncstate|ui\..*)$/;
    var origSet = Storage.prototype.setItem, origRem = Storage.prototype.removeItem;
    var pending = {}, timers = {}, remote = {}, sent = {}, applying = false, ready = false, first = true, changed = false, changedKeys = [];
    var inflight = 0, retryT = {};
    var boot = {};   // 화면 열 때 이 기기에 있던 값 — 이것과 같은 저장은 「내가 고친 것」이 아니다
    try { for (var bi = 0; bi < localStorage.length; bi++) { var bk = localStorage.key(bi); if (bk.indexOf("cafesui.") === 0 && !LOCAL_ONLY.test(bk)) boot[bk] = localStorage.getItem(bk); } } catch (e) {}
    var dirtyBoot = {};   // 지난번에 못 보낸 저장 — 이건 서버보다 이 기기가 맞다
    try { dirtyBoot = JSON.parse(localStorage.getItem("cafesui.ui.dirty") || "{}") || {}; } catch (e) {}
    var state = { s: "off", msg: "" };
    window.__CS_SYNC = state;
    // 아직 서버로 못 보낸 저장 — 이 기기에 표시해 두고, 다음에 열 때 서버 값 대신 이 기기 값을 올린다 (저장한 건 무조건 남긴다)
    var DIRTYK = "cafesui.ui.dirty";
    function dirtyGet() { try { return JSON.parse(localStorage.getItem(DIRTYK) || "{}") || {}; } catch (e) { return {}; } }
    function dirtySet(o) { try { origSet.call(localStorage, DIRTYK, JSON.stringify(o)); } catch (e) {} }
    function markDirty(k) { var o = dirtyGet(); o[k] = Date.now(); dirtySet(o); }
    function clearDirty(k) { var o = dirtyGet(); if (k in o) { delete o[k]; dirtySet(o); } }
    function dirtyCount() { return Object.keys(dirtyGet()).length; }
    function setStatus(s, msg) {
      state.s = s; state.msg = msg || "";
      var el = document.getElementById("syncState");
      if (!el) return;
      var n = dirtyCount();
      el.className = "syncst " + s + (n ? " dirty" : "");
      el.textContent = s === "on" ? (n ? "☁ 보내는 중 · " + n + "건 남음" : "☁ 컴퓨터끼리 공유 중")
                     : s === "wait" ? "☁ 연결 중…"
                     : s === "err" ? "☁ 공유 안 됨 · " + (msg || "") + (n ? " · 안 보낸 저장 " + n + "건 (다시 시도 중)" : "")
                     : "☁ 이 기기에만 저장 (공유 꺼짐)";
      el.title = (msg ? msg + " · " : "") + "이 기기 번호 " + (window.__CS_DEV || "");
    }
    document.addEventListener("DOMContentLoaded", function () { setStatus(state.s, state.msg); });
    var cfg = window.FIREBASE_CONFIG;
    if (!window.firebase || !cfg || !cfg.apiKey) { setStatus("off", "Firebase 파일을 못 읽었습니다"); return; }

    // 이 기기의 저장을 가로채서 서버에도 보낸다
    Storage.prototype.setItem = function (k, v) {
      origSet.call(this, k, v);
      if (this !== localStorage || applying || k.indexOf("cafesui.") !== 0 || LOCAL_ONLY.test(k)) return;
      if (!ready && boot[k] === String(v)) return;   // 아직 서버 값을 못 받았는데 열 때 값 그대로 다시 저장한 것 — 서버 값을 기다린다
      markDirty(k); queue(k, String(v));
    };
    Storage.prototype.removeItem = function (k) {
      origRem.call(this, k);
      if (this === localStorage && !applying && k.indexOf("cafesui.") === 0 && !LOCAL_ONLY.test(k)) { markDirty(k); queue(k, null); }
    };
    function queue(k, v) {
      pending[k] = v;
      clearTimeout(timers[k]);
      timers[k] = setTimeout(function () { flush(k); }, 400);
    }
    // 기기 번호 — 브라우저마다 다르게. 백업 되살리기로 같은 번호가 복사됐을 수 있어 한 번은 새로 만든다
    var dev = null;
    try { dev = localStorage.getItem("cafesui.device"); if (!localStorage.getItem("cafesui.ui.dev2")) dev = null; } catch (e) {}
    if (!dev) { dev = "d" + Math.random().toString(36).slice(2, 8); try { origSet.call(localStorage, "cafesui.device", dev); origSet.call(localStorage, "cafesui.ui.dev2", "1"); } catch (e) {} }
    window.__CS_DEV = dev;

    var app, db, col;
    try {
      app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      db = firebase.firestore(); col = db.collection("ops");
      // 오프라인 큐 — 창을 닫거나 인터넷이 끊겨도 보내려던 저장을 브라우저가 기억했다가 다음에 보낸다
      try { var pp = db.enablePersistence && db.enablePersistence({ synchronizeTabs: true }); if (pp && pp.catch) pp.catch(function () {}); } catch (e) {}
    } catch (e) { setStatus("err", e.message); return; }

    function flush(k) {
      if (!ready) return;                       // 연결되면 한꺼번에 보낸다
      if (!(k in pending)) return;
      var v = pending[k]; delete pending[k];
      clearTimeout(retryT[k]);
      if (remote[k] === v) { clearDirty(k); setStatus(state.s === "err" ? "on" : state.s); return; }   // 서버와 같으면 안 보냄
      remote[k] = v; sent[k] = v;
      inflight++;
      var p = (v === null) ? col.doc(k).delete()
                           : col.doc(k).set({ v: v, by: dev, t: firebase.firestore.FieldValue.serverTimestamp() });
      p.then(function () {
        inflight--;
        if (!(k in pending)) clearDirty(k);     // 그 사이 또 고쳤으면 그건 다음 전송에서 지운다
        setStatus("on");
      }).catch(function (e) {
        inflight--;
        if (!(k in pending)) pending[k] = v;    // 실패 — 다시 보낸다
        if (remote[k] === v) remote[k] = undefined;
        setStatus("err", e.message);
        clearTimeout(retryT[k]); retryT[k] = setTimeout(function () { flush(k); }, 8000);
      });
    }
    function flushNow() {   // 기다리지 않고 지금 다 보낸다 (창 닫기 · 새로고침 직전)
      Object.keys(timers).forEach(function (k) { clearTimeout(timers[k]); });
      Object.keys(pending).forEach(flush);
    }
    window.__CS_SYNC_FLUSH = flushNow;
    window.addEventListener("pagehide", function () { try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {} flushNow(); });
    window.addEventListener("beforeunload", function () { try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {} flushNow(); });
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") { try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {} flushNow(); } });
    function idle() {
      var a = document.activeElement;
      var typing = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT") && a.type !== "checkbox" && a.type !== "date";
      var dirty = window.__CS_SCHED_DIRTY && Object.keys(window.__CS_SCHED_DIRTY).some(function (k) { return window.__CS_SCHED_DIRTY[k]; });
      return !typing && !dirty && (Date.now() - lastInput > 4000);
    }
    var lastInput = 0;
    ["input", "change", "keydown", "pointerdown"].forEach(function (ev) { document.addEventListener(ev, function () { lastInput = Date.now(); }, true); });
    function reloadSafely() {
      // 새로 읽기 전에 이 기기에서 적은 것을 전부 보내고, 서버가 받았다고 할 때까지(최대 6초) 기다린다
      try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {}
      flushNow();
      var t0 = Date.now();
      (function wait() {
        if ((inflight === 0 && !Object.keys(pending).length) || Date.now() - t0 > 6000) { location.reload(); return; }
        setTimeout(wait, 150);
      })();
    }
    window.__CS_RELOAD = reloadSafely;
    document.addEventListener("DOMContentLoaded", function () { var el = document.getElementById("syncState"); if (el) el.addEventListener("click", reloadSafely); });
    var noticeT = null;
    function notifyChange() {
      // 다른 컴퓨터에서 바뀐 게 있다 — 쓰는 중이 아니면 바로 새로 읽고, 쓰는 중이면 위에 버튼만 띄운다
      clearTimeout(noticeT);
      noticeT = setTimeout(function tick() {
        if (idle()) { reloadSafely(); return; }
        var b = document.getElementById("newVer");
        if (b) { b.hidden = false; b.textContent = "🔄 다른 컴퓨터에서 바뀐 내용이 있어요 — 손을 떼면 자동으로 새로 읽습니다 (적던 것은 저장됩니다)";
          b.onclick = reloadSafely; }
        noticeT = setTimeout(tick, 5000);   // 쓰는 중이면 5초마다 다시 본다
      }, 1200);
    }

    setStatus("wait");
    firebase.auth().signInAnonymously().then(function () {
      col.onSnapshot({ includeMetadataChanges: false }, function (snap) {
        var fromCache = !!(snap.metadata && snap.metadata.fromCache);
        var dirty = first ? dirtyGet() : null;
        applying = true;
        snap.docChanges().forEach(function (ch) {
          var k = ch.doc.id, d = ch.doc.data() || {};
          if (k.indexOf("cafesui.") !== 0 || LOCAL_ONLY.test(k)) return;
          var local = null; try { local = localStorage.getItem(k); } catch (e) {}
          if (ch.type === "removed") {
            remote[k] = null;
            if (k in pending) return;
            if (first && dirtyBoot[k]) { if (local !== null) pending[k] = local; return; }   // 이 기기에서 적은 게 서버로 못 갔다 — 살린다
            if (local !== null) { origRem.call(localStorage, k); changed = true; changedKeys.push(k); }
            return;
          }
          remote[k] = d.v;
          if (first && !dirtyBoot[k] && (k in pending) && d.v !== boot[k]) {
            // 서버 값을 받기 전에 이 화면이 저장한 게 있는데, 서버는 그 사이 다른 컴퓨터가 고쳐 둔 상태 — 서버가 맞다.
            // 화면에는 cs:remote로 알려서 다시 그리고, 적던 칸은 각 화면이 합쳐서 다시 저장한다.
            delete pending[k]; clearTimeout(timers[k]); clearDirty(k);
          }
          if (k in pending) return;                                   // 지금 이 기기가 고치는 중
          if (first && dirtyBoot[k] && local !== d.v) { pending[k] = local; return; }   // 지난번에 못 보낸 저장 — 서버 값 대신 이 기기 값을 올린다
          if (!first && d.by === dev && (k in sent) && d.v !== sent[k]) return;   // 내가 전에 보낸 게 늦게 돌아온 것 (지금 값이 더 새것)
          if (local !== d.v) { origSet.call(localStorage, k, d.v); changed = true; changedKeys.push(k); }
        });
        applying = false;
        if (first) {
          first = false; ready = true;
          // 서버에 없는 이 기기 내용은 올린다 (캐시가 아니라 서버에서 온 첫 응답일 때만)
          if (!fromCache) {
            try {
              for (var i = 0; i < localStorage.length; i++) {
                var k2 = localStorage.key(i);
                if (k2.indexOf("cafesui.") !== 0 || LOCAL_ONLY.test(k2) || (k2 in remote)) continue;
                pending[k2] = localStorage.getItem(k2);
              }
            } catch (e) {}
          }
          // 지난번에 못 보낸 저장도 다시 올린다
          Object.keys(dirty || {}).forEach(function (k3) {
            if (LOCAL_ONLY.test(k3) || (k3 in pending)) return;
            var lv = null; try { lv = localStorage.getItem(k3); } catch (e) {}
            if (lv === null && !(k3 in remote)) { clearDirty(k3); return; }
            if (lv !== remote[k3]) pending[k3] = lv; else clearDirty(k3);
          });
          Object.keys(pending).forEach(flush);
        }
        setStatus(state.s === "err" ? "err" : "on", state.msg);
        if (changed) {
          changed = false;
          var presKeys = changedKeys.filter(function (k) { return k.indexOf("cafesui.presence.") === 0; });
          var dataKeys = changedKeys.filter(function (k) { return k.indexOf("cafesui.presence.") !== 0; });
          changedKeys = [];
          if (presKeys.length) { try { window.dispatchEvent(new CustomEvent("cs:presence", { detail: { keys: presKeys } })); } catch (e) {} }
          if (dataKeys.length) {
            // 열려 있는 화면에 알려서, 쓰는 중인 칸만 빼고 새 내용으로 바꿔 끼운다 (예전 내용으로 덮어쓰는 사고 방지)
            try { window.dispatchEvent(new CustomEvent("cs:remote", { detail: { keys: dataKeys } })); } catch (e) {}
            notifyChange();
          }
        }
      }, function (e) { setStatus("err", e.code === "permission-denied" ? "규칙(ops) 게시 필요" : e.message); });
      // 못 보낸 게 남아 있으면 30초마다 다시 시도한다
      setInterval(function () {
        if (!ready) return;
        var o = dirtyGet();
        Object.keys(o).forEach(function (k) {
          if (k in pending) return;
          var lv = null; try { lv = localStorage.getItem(k); } catch (e) {}
          if (lv !== remote[k]) pending[k] = lv;
        });
        if (Object.keys(pending).length) flushNow(); else setStatus(state.s, state.msg);
      }, 30000);
    }).catch(function (e) {
      setStatus("err", e.code === "auth/operation-not-allowed" ? "Firebase에서 익명 로그인 켜기 필요" : (e.code === "auth/network-request-failed" ? "인터넷 연결 없음" : e.message));
    });
  })();
