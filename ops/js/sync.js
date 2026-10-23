  // ☁ 여러 컴퓨터 공유 — 이 기기에 저장되는 cafesui.* 내용을 Firebase(ops 컬렉션)에도 같이 쓰고, 다른 컴퓨터에서 바뀐 건 받아온다.
  //   · 저장 키 하나 = 문서 하나 (id = 키). 마지막에 쓴 쪽이 이긴다.
  //   · 로그인(cafesui.me)과 잠금 상태는 기기마다 따로. 비밀번호(cafesui.pin.*)는 같이 공유해서 한 번 정하면 어느 컴퓨터에서나 통한다.
  //   · Firebase가 없거나(오프라인·차단) 익명 로그인이 꺼져 있으면 이 기기에만 저장하고 위에 표시만 한다.
  (function () {
    var LOCAL_ONLY = /^cafesui\.(me|unlocked|device|syncstate|ui\..*)$/;
    var origSet = Storage.prototype.setItem, origRem = Storage.prototype.removeItem;
    // 큰 묶음(레시피)은 기기 저장소에 넣지 않고 메모리에만 — 10/6 사고: 레시피가 기기 저장 한도를 넘겨 그 뒤 저장이 서버로 안 감
    var MEMK = /^cafesui\.recipe\./, mem = {};
    window.__CS_MEM = mem;
    try { var mk = []; for (var mi = 0; mi < localStorage.length; mi++) { var mkk = localStorage.key(mi); if (MEMK.test(mkk)) mk.push(mkk); } mk.forEach(function (x) { origRem.call(localStorage, x); }); } catch (e) {}
    // 기기 저장소가 꽉 차면 이 기기 자동 백업(오래된 것부터)을 지워 자리를 만든다 — 기록 자체(서버에 있음)는 안 지운다
    function freeSpace() {
      var snaps = [], lls = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("cafesui.ui.snap.") === 0) snaps.push(k); else if (k.indexOf("cafesui.ui.lastlog.") === 0) lls.push(k); } } catch (e) { return false; }
      snaps.sort(); lls.sort();
      if (snaps.length > 1) { origRem.call(localStorage, snaps[0]); return true; }
      if (lls.length > 3) { origRem.call(localStorage, lls[0]); return true; }
      return false;
    }
    window.__CS_FREE = freeSpace;
    function safeSet(k, v) {
      for (var t = 0; t < 12; t++) {
        try { origSet.call(localStorage, k, v); return true; }
        catch (e) { if (!freeSpace()) return false; }
      }
      return false;
    }
    var pending = {}, timers = {}, remote = {}, sent = {}, applying = false, ready = false, first = true, changed = false, changedKeys = [];
    var inflight = 0, retryT = {};
    var boot = {};   // 화면 열 때 이 기기에 있던 값 — 이것과 같은 저장은 「내가 고친 것」이 아니다
    try { for (var bi = 0; bi < localStorage.length; bi++) { var bk = localStorage.key(bi); if (bk.indexOf("cafesui.") === 0 && !LOCAL_ONLY.test(bk)) boot[bk] = localStorage.getItem(bk); } } catch (e) {}
    var RESCUE = /^cafesui\.(log|todo|stock|att)\.2026-10-0[67]$|^cafesui\.(daynotes|weekrep\.2026-10-05|clean\.2026-10)$/;
    var rescue = false; try { rescue = !localStorage.getItem("cafesui.ui.fix1006") && Date.now() < new Date(2026, 9, 10).getTime(); } catch (e) {}
    // 10/23 v0924-249 사고: sync.js 문법 오류로 몇 분 동안 서버 저장이 멈춤 — 그 사이 이 기기에만 남은 글을 한 번만 서버 값에 「빈 칸 채우기 · 글 합치기」로 올린다
    if (!rescue) try { if (!localStorage.getItem("cafesui.ui.fix1023") && Date.now() < new Date(2026, 9, 27).getTime()) { rescue = true; RESCUE = /^cafesui\.(log|todo|stock|att)\.2026-10-23$|^cafesui\.(week\.2026-10-19|clean\.2026-10|qc\.2026)$/; } } catch (e) {}
    var dirtyBoot = {};   // 지난번에 못 보낸 저장 — 이건 서버보다 이 기기가 맞다
    try { dirtyBoot = JSON.parse(localStorage.getItem("cafesui.ui.dirty") || "{}") || {}; } catch (e) {}
    var state = { s: "off", msg: "" };
    window.__CS_SYNC = state;
    // 아직 서버로 못 보낸 저장 — 이 기기에 표시해 두고, 다음에 열 때 서버 값 대신 이 기기 값을 올린다 (저장한 건 무조건 남긴다)
    var DIRTYK = "cafesui.ui.dirty";
    function dirtyGet() { try { return JSON.parse(localStorage.getItem(DIRTYK) || "{}") || {}; } catch (e) { return {}; } }
    function dirtySet(o) { safeSet(DIRTYK, JSON.stringify(o)); }
    function markDirty(k) { var o = dirtyGet(); o[k] = Date.now(); dirtySet(o); }
    function clearDirty(k) { var o = dirtyGet(); if (k in o) { delete o[k]; dirtySet(o); } baseDel(k); }
    // 고치기 시작할 때의 서버 값(base) — 보낼 때 서버 최신값과 견줘 「이 기기에서 바꾼 칸만」 얹는다 (옛 화면이 남의 글을 통째로 덮는 사고 방지)
    var BASEK = "cafesui.ui.dirtybase", baseOf = {};
    try { baseOf = JSON.parse(localStorage.getItem(BASEK) || "{}") || {}; } catch (e) { baseOf = {}; }
    var bootBase = {}; Object.keys(baseOf).forEach(function (k) { bootBase[k] = baseOf[k]; });
    function baseSave() { safeSet(BASEK, JSON.stringify(baseOf)); }
    function baseDel(k) { if (k in baseOf) { delete baseOf[k]; baseSave(); } }
    function baseMark(k) {
      if (k in baseOf) return;
      baseOf[k] = (k in remote) ? (remote[k] == null ? "" : remote[k]) : (k in boot ? boot[k] : "");
      if (String(baseOf[k]).length < 200000) baseSave();
    }
    function objOf(v) { try { var o = JSON.parse(v); return o && typeof o === "object" && !Array.isArray(o) ? o : null; } catch (e) { return null; } }
    function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
    function blank(v) { return v == null || (typeof v === "string" && !v.trim()) || (typeof v === "object" && !Object.keys(v).length); }
    function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
    // 둘 다 고친 글 칸 — 한쪽이 다른 쪽을 품으면 긴 쪽, 아니면 내 글 + 서버에만 있는 줄 (아무 글도 버리지 않는다)
    function joinText(m, s) {
      if (m.indexOf(s) >= 0) return m; if (s.indexOf(m) >= 0) return s;
      var NL = String.fromCharCode(10), ml = m.split(NL);
      var add = s.split(NL).filter(function (ln) { return ln.trim() && ml.indexOf(ln) < 0; });
      return add.length ? m + NL + add.join(NL) : m;
    }
    function both(bv, mv, sv, x, path, known) {
      if (same(mv, sv)) return mv;
      if (isObj(mv) && isObj(sv)) return merge3(known ? (isObj(bv) ? bv : {}) : null, mv, sv, path + "." + x);
      // 목록(메모 달력 줄처럼 객체 목록) — 내가 더한 것 · 뺀 것만 서버 목록에 반영 (다른 기기가 더한 줄도 남긴다)
      if (Array.isArray(mv) && Array.isArray(sv) && mv.concat(sv).every(isObj)) {
        var bs = known && Array.isArray(bv) ? bv : [], has = function (a, x) { return a.some(function (y) { return same(x, y); }); };
        var added = mv.filter(function (x) { return !has(bs, x); }), removed = known ? bs.filter(function (x) { return !has(mv, x); }) : [];
        return sv.filter(function (x) { return !has(removed, x); }).concat(added.filter(function (x) { return !has(sv, x); }));
      }
      if (mv === undefined) return sv;            // 나는 지웠는데 다른 기기가 고쳤다 — 고친 걸 살린다
      if (sv === undefined) return mv;
      if (typeof mv === "string" && typeof sv === "string" && /(^|\.)f$/.test(path)) return joinText(mv, sv);
      return known ? mv : sv;
    }
    function merge3(b, m, s, path) {
      var out = {}, seen = {}, ks = Object.keys(m).concat(Object.keys(s), b ? Object.keys(b) : []);
      ks.forEach(function (x) {
        if (seen[x]) return; seen[x] = 1;
        var mv = m[x], sv = s[x], r;
        if (b) {
          var bv = b[x];
          if (same(mv, bv)) r = sv; else if (same(sv, bv)) r = mv; else r = both(bv, mv, sv, x, path, true);
        } else {
          // 고치기 전 모습을 모를 때(오래 못 보낸 저장): 서버에 아예 없는 칸만 이 기기 값으로 채운다 — 서버에서 일부러 비운 칸을 옛 글로 되살리지 않게
          if (!(x in s)) r = mv; else if (blank(mv)) r = sv; else r = both(undefined, mv, sv, x, path, false);
        }
        if (r !== undefined) out[x] = r;
      });
      return out;
    }
    // base: 고치기 전 서버 값("" = 없었음 · null = 모름) · mine: 이 기기 값 · theirs: 지금 서버 값
    function mergeVal(base, mine, theirs) {
      if (theirs == null || theirs === mine) return mine;
      if (base != null && theirs === base) return mine;
      var m = objOf(mine), t = objOf(theirs); if (!m || !t) return mine;
      var b = base == null ? null : (base === "" ? {} : objOf(base));
      if (base != null && !b) b = {};
      return JSON.stringify(merge3(b, m, t, ""));
    }
    window.__CS_MERGE = mergeVal;
    // 일지 지킴(10/23 사고 — 가게 컴퓨터에 남은 1시간 전 모습이 저장할 때마다 서버 글을 지움): 서버에 있는 칸을 비우거나,
    // 서버 글의 앞부분만 남기고 30자 넘게 잘라 내는 저장은 받지 않고 서버 글을 그대로 둔다 (지운 글은 「🕘 저장 기록」으로도 남음)
    function guardLog(out, cur) {
      var o = objOf(out), c = objOf(cur); if (!o || !c || !c.f) return out;
      var of = o.f || (o.f = {}), cf = c.f, ch = false;
      Object.keys(cf).forEach(function (x) {
        var sv = String(cf[x] == null ? "" : cf[x]), mv = String(of[x] == null ? "" : of[x]);
        if (!sv.trim() || mv === sv) return;
        var cut = !mv.trim() || (sv.length - mv.length >= 30 && sv.indexOf(mv) >= 0);
        if (!cut) return;
        of[x] = sv; ch = true;
        ["by", "bl", "ow"].forEach(function (y) { if (c[y] && c[y][x] != null) { o[y] = o[y] || {}; o[y][x] = c[y][x]; } });
      });
      return ch ? JSON.stringify(o) : out;
    }
    function wipeCount(out, cur) {
      var o = objOf(out), c = objOf(cur); if (!o || !c || !c.f) return 0;
      var of = o.f || {}, n = 0;
      Object.keys(c.f).forEach(function (x) { var sv = String(c.f[x] == null ? "" : c.f[x]), mv = String(of[x] == null ? "" : of[x]); if (sv.trim() && mv !== sv && (!mv.trim() || (sv.length - mv.length >= 30 && sv.indexOf(mv) >= 0))) n++; });
      return n;
    }
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
      if (this === localStorage && MEMK.test(k)) { mem[k] = String(v); if (!applying) queue(k, String(v)); return; }
      if (this !== localStorage) return origSet.call(this, k, v);
      // 기기가 꽉 차도 서버로는 꼭 보낸다 (자리를 만들어 다시 시도 · 그래도 안 되면 서버에만)
      var okLocal = safeSet(k, v);
      if (applying || k.indexOf("cafesui.") !== 0 || LOCAL_ONLY.test(k)) { if (!okLocal) throw new DOMException("기기 저장 공간이 꽉 찼습니다", "QuotaExceededError"); return; }
      if (!ready && boot[k] === String(v)) return;   // 아직 서버 값을 못 받았는데 열 때 값 그대로 다시 저장한 것 — 서버 값을 기다린다
      baseMark(k); markDirty(k); queue(k, String(v));
    };
    Storage.prototype.removeItem = function (k) {
      origRem.call(this, k);
      if (this === localStorage && !applying && k.indexOf("cafesui.") === 0 && !LOCAL_ONLY.test(k)) { baseDel(k); markDirty(k); queue(k, null); }
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

    var busy = {}, held = {}, bootPush = {};
    // 일지 저장 기록 (10/23 사장님 「1번」 — 지워져도 되살릴 수 있게) — 서버 ops/「hist.log.<날짜>」 한 문서에 쌓는다.
    // 이름이 cafesui. 로 시작하지 않아 기기 저장소에는 안 들어감(기기 꽉 참 사고 방지) · 서버 규칙상 v · by · t 모양만.
    // 기록 하나 = {at, who, dev, ch: 바뀐 칸 글, rm: 없어진 칸, was: 짧아지거나 지워진 칸의 바로 전 글} · 90초에 한 번(지워지면 바로)
    var histLast = {}, histPrev = {}, histT = {};
    function histRec(k, out) {
      if (k.indexOf("cafesui.log.") !== 0 || out == null) return;
      var o = objOf(out); if (!o) return;
      var f = o.f || {}, prev = histPrev[k], last = histLast[k], now = Date.now(), ch = {}, was = {}, rm = [], shrink = false;
      histPrev[k] = f;
      var bs = last || {};
      Object.keys(f).forEach(function (x) { if (bs[x] !== f[x]) ch[x] = f[x]; });
      Object.keys(bs).forEach(function (x) { if (!(x in f)) rm.push(x); });
      if (prev) Object.keys(prev).forEach(function (x) { var pv = String(prev[x] || ""), nv = String(f[x] || ""); if (pv.trim() && nv.indexOf(pv) < 0 && (!nv.trim() || pv.length - nv.length >= 8)) { was[x] = pv; shrink = true; }   /* 오타 몇 글자 지운 건 빼고 · 칸이 비었거나 8자 넘게 줄었을 때 */ });
      if (!Object.keys(ch).length && !rm.length && !shrink) return;
      if (!shrink && last && now - (histT[k] || 0) < 90000) return;
      histLast[k] = f; histT[k] = now;
      var me = ""; try { me = localStorage.getItem("cafesui.me") || ""; } catch (e) {}
      var e = { at: now, who: me, dev: dev, ch: ch }; if (rm.length) e.rm = rm; if (shrink) e.was = was; if (!last) e.full = 1;
      var ref = col.doc("hist.log." + k.slice(12));
      db.runTransaction(function (tx) {
        return tx.get(ref).then(function (doc) {
          var a = []; try { a = JSON.parse((doc.exists && (doc.data() || {}).v) || "[]") || []; } catch (e2) { a = []; }
          a.push(e); var sv = JSON.stringify(a);
          while (sv.length > 700000 && a.length > 1) { a.shift(); sv = JSON.stringify(a); }
          tx.set(ref, { v: sv, by: dev, t: firebase.firestore.FieldValue.serverTimestamp() });
        });
      }).catch(function () {});
    }
    window.__CS_HIST = function (date) { return col.doc("hist.log." + date).get().then(function (d) { try { return JSON.parse((d.exists && (d.data() || {}).v) || "[]") || []; } catch (e) { return []; } }); };
    function flush(k) {
      if (!ready) return;                       // 연결되면 한꺼번에 보낸다
      if (!(k in pending)) return;
      if (busy[k]) return;                      // 같은 칸을 보내는 중 — 끝나면 이어서 보낸다
      var v = pending[k]; delete pending[k];
      clearTimeout(retryT[k]);
      if (remote[k] === v) { clearDirty(k); setStatus(state.s === "err" ? "on" : state.s); return; }   // 서버와 같으면 안 보냄
      var bs = (k in baseOf) ? baseOf[k] : null;
      var useTx = v !== null && objOf(v) && k.indexOf("cafesui.presence.") !== 0 && !MEMK.test(k) && db.runTransaction;
      sent[k] = v;
      inflight++; busy[k] = 1;
      var ref = col.doc(k), p;
      if (v === null) p = ref.delete().then(function () { return null; });
      else if (!useTx) p = ref.set({ v: v, by: dev, t: firebase.firestore.FieldValue.serverTimestamp() }).then(function () { return v; });
      else p = db.runTransaction(function (tx) {
        return tx.get(ref).then(function (doc) {
          var cur = doc.exists ? (doc.data() || {}).v : null;
          var out = mergeVal(bs, v, cur == null ? null : cur);
          if (k.indexOf("cafesui.log.") === 0 && (bootPush[k] || wipeCount(out, cur) >= 2)) out = guardLog(out, cur);   /* 한 번 저장에 글 있는 칸이 2개 넘게 비거나 크게 줄면 사람이 친 게 아니라 옛 모습이 덮는 것(10/23 세 번) — 서버 글을 지킨다 */   /* 일지 지킴은 「켤 때 못 보낸 옛 값을 올리는」 경우에만 — 사람이 칸에서 지우고 고친 건 그대로 받는다 (10/23: 지킴이 일부러 줄인 글까지 되돌려 글이 두 번 붙고 고친 글이 사라졌음) */
          tx.set(ref, { v: out, by: dev, t: firebase.firestore.FieldValue.serverTimestamp() });
          return out;
        });
      });
      p.then(function (out) {
        inflight--; busy[k] = 0;
        remote[k] = out; sent[k] = out; delete bootPush[k];
        try { histRec(k, out); } catch (eh) {}
        if (!(k in pending)) {
          clearDirty(k);
          // 서버에 있던 다른 기기 글까지 합쳐졌다 — 이 기기에도 넣고 화면에 알린다
          var lv = null; try { lv = localStorage.getItem(k); } catch (e) {}
          if (out !== null && lv === v && out !== v) {
            applying = true; safeSet(k, out); applying = false;
            try { window.dispatchEvent(new CustomEvent("cs:remote", { detail: { keys: [k] } })); } catch (e) {}
          }
          if (held[k]) {   // 보내는 동안 다른 기기 값이 왔었다 — 지금 서버 값을 다시 읽어 (그 사이 이 기기가 또 안 고쳤으면) 넣는다
            delete held[k];
            ref.get().then(function (doc) {
              if ((k in pending) || busy[k] || !doc.exists) return;
              var dv = (doc.data() || {}).v, lv2 = null; try { lv2 = localStorage.getItem(k); } catch (e) {}
              remote[k] = dv; sent[k] = dv;
              if (dv != null && lv2 === out && dv !== out) {
                applying = true; safeSet(k, dv); applying = false;
                try { window.dispatchEvent(new CustomEvent("cs:remote", { detail: { keys: [k] } })); } catch (e) {}
              }
            }).catch(function () {});
          }
        } else { delete held[k]; baseOf[k] = v; baseSave(); flush(k); }   // 그 사이 또 고친 것 — 방금 보낸 값을 기준으로 이어서 (다음 보내기가 서버 최신 값과 합침)
        setStatus("on");
      }).catch(function (e) {
        inflight--; busy[k] = 0;
        if (!(k in pending)) pending[k] = v;    // 실패 — 다시 보낸다
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

    // ⚠ 경고 띠 — ① 저장이 1분 넘게 서버에 안 올라감 ② 새 버전이 나왔는데 이 컴퓨터는 옛 버전 (10/9: 오래 켜 둔 컴퓨터는 옛 버전이라 저장이 안 되던 일)
    function warnBar(id, html, cls) {
      var el = document.getElementById(id);
      if (!html) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement("div"); el.id = id; el.className = "cswarn " + (cls || ""); document.body.insertBefore(el, document.body.firstChild); }
      el.innerHTML = html;
    }
    setInterval(function () {
      var o = dirtyGet(), old = Object.keys(o).filter(function (k) { return Date.now() - (o[k] || 0) > 60000; }).length;
      warnBar("csWarnSave", old ? "⚠ 저장한 내용 <b>" + old + "건</b>이 1분 넘게 서버(다른 컴퓨터)로 안 올라갔습니다 — 인터넷을 확인하고 이 띠를 눌러 주세요 · <u>이 화면을 닫거나 새로고침하지 마세요</u>" : "", "bad");
      var b = document.getElementById("csWarnSave"); if (b && !b.__w) { b.__w = 1; b.addEventListener("click", function () { flushNow(); }); }
    }, 15000);
    var verNow = (function () { var m = String((document.getElementById("verTag") || {}).textContent || "").match(/v0924-(\d+)/); return m ? +m[1] : 0; });
    var verAsked = false;
    function checkVer() {
      if (!window.fetch || verAsked) return;
      fetch(location.pathname + "?vc=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
        var m = String(t).match(/id="verTag"[^>]*>v0924-(\d+)</), cur = verNow(); if (!m || !cur || +m[1] <= cur) return; // 화면 버전 칸에서만 읽기 (주석 속 버전 글자 말고)
        verAsked = true;
        // 캐시 때문에 옛 화면이 다시 열려도 같은 버전으로는 한 번만 자동 새로고침 (무한 새로고침 방지)
        var tried = ""; try { tried = sessionStorage.getItem("cs.vertry") || ""; } catch (e) {}
        function go() {
          try { sessionStorage.setItem("cs.vertry", m[1]); } catch (e) {}
          try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {}
          flushNow();
          var t0 = Date.now();
          (function w() { if ((inflight === 0 && !Object.keys(pending).length) || Date.now() - t0 > 6000) location.replace(location.pathname + "?nv=" + m[1] + location.hash); else setTimeout(w, 150); })();
        }
        warnBar("csWarnVer", "🔄 새 버전(v0924-" + m[1] + ")이 나왔습니다 — " + (tried === m[1] ? "<u>눌러서 새로 열기</u> (적던 것은 저장됩니다)" : "적던 것은 저장하고 곧 새로 엽니다 · <u>지금 새로 열기</u>"), "ver");
        var b = document.getElementById("csWarnVer"); if (b) b.addEventListener("click", go);
        if (tried !== m[1]) (function wait() { if (idle()) go(); else setTimeout(wait, 5000); })();
      }).catch(function () {});
    }
    setTimeout(checkVer, 20000); setInterval(checkVer, 10 * 60000);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") checkVer(); });

    setStatus("wait");
    firebase.auth().signInAnonymously().then(function () {
      col.onSnapshot({ includeMetadataChanges: false }, function (snap) {
        var fromCache = !!(snap.metadata && snap.metadata.fromCache);
        var dirty = first ? dirtyGet() : null;
        var memKeys = [];
        applying = true;
        try { snap.docChanges().forEach(function (ch) { try {
          var k = ch.doc.id, d = ch.doc.data() || {};
          if (k.indexOf("cafesui.") !== 0 || LOCAL_ONLY.test(k)) return;
          if (MEMK.test(k)) {
            if (k in pending) return;
            if (ch.type === "removed") { remote[k] = null; delete mem[k]; } else { remote[k] = d.v; if (mem[k] === d.v) return; mem[k] = d.v; }
            memKeys.push(k); return;   // 새로 읽기 알림은 안 띄운다 (레시피 화면만 다시 그림)
          }
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
          // 보내는 중(트랜잭션)에 온 다른 기기 값은 기기에 덮지 않는다 — 10/23 사고: 사장님 기기가 같은 일지를 쓰는 사이,
          // 항아님 기기가 보내는 동안 도착한 「방금 쓴 칸이 없는」 값이 기기 저장을 덮고, 다음 칸을 쓰면 방금 쓴 칸이 지워졌음.
          // 보내기가 끝나면 서버의 최신 값(내 글 + 다른 기기 글 합친 것)을 다시 읽어 넣는다
          if (busy[k]) { held[k] = 1; return; }
          if (first && dirtyBoot[k] && local !== d.v) { if (!(k in bootBase)) baseOf[k] = null; pending[k] = local; bootPush[k] = 1; return; }
          // 10/6 사고 되살리기(한 번만): 그날 저장이 서버로 못 갔다 — 이 기기에만 남은 10/6 · 10/7 글을 서버 값에 「빈 칸 채우기 · 글 합치기」로 올린다
          if (first && rescue && local !== null && local !== d.v && RESCUE.test(k) && objOf(local) && objOf(d.v)) { baseOf[k] = null; pending[k] = local; bootPush[k] = 1; markDirty(k); return; }   // 지난번에 못 보낸 저장 — 서버 값에 이 기기에서 바꾼 칸만 얹어 올린다 (base 모르면 빈 칸만 채움)
          if (!first && d.by === dev && (k in sent) && d.v !== sent[k]) return;   // 내가 전에 보낸 게 늦게 돌아온 것 (지금 값이 더 새것)
          if (local !== d.v) { if (!safeSet(k, d.v)) return; changed = true; changedKeys.push(k); }
        } catch (e1) {} }); } finally { applying = false; }   // 한 칸이 실패해도 멈추지 않는다 (예전엔 여기서 멈춰 그 뒤 저장이 서버로 안 갔음)
        if (first && rescue) { rescue = false; try { origSet.call(localStorage, "cafesui.ui.fix1006", "1"); origSet.call(localStorage, "cafesui.ui.fix1023", "1"); } catch (e) {} }
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
            if (lv !== remote[k3]) { pending[k3] = lv; bootPush[k3] = 1; } else clearDirty(k3);
          });
          Object.keys(pending).forEach(flush);
        }
        setStatus(state.s === "err" ? "err" : "on", state.msg);
        if (memKeys.length) { try { window.dispatchEvent(new CustomEvent("cs:mem", { detail: { keys: memKeys } })); } catch (e) {} }
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
          if (lv !== remote[k]) { pending[k] = lv; bootPush[k] = 1; }
        });
        if (Object.keys(pending).length) flushNow(); else setStatus(state.s, state.msg);
      }, 30000);
    }).catch(function (e) {
      setStatus("err", e.code === "auth/operation-not-allowed" ? "Firebase에서 익명 로그인 켜기 필요" : (e.code === "auth/network-request-failed" ? "인터넷 연결 없음" : e.message));
    });
  })();
