// 관리자 탭 「📨 지원자 면접」 (11/16 사장님 「지원자 답이 아예 넘어오게」)
// 지원자 페이지(/SONJOY/hire/)는 로그인 없이 열리고, 답을 공개 열쇠(RSA-OAEP)로 잠가 서버 ops/「hire.a.<시각>-<무작위>」에 쓴다.
// 서버 · 저장소가 공개라 잠근 글만 있다. 여는 열쇠(개인 열쇠)는 레시피 비밀번호로 다시 잠가 cafesui.recipe.hirekey { pub, pk }에 둔다
// (cafesui.recipe.* = 기기 저장소 · 자동 백업에 안 들어가고 메모리에만 · 레시피 비밀번호를 바꾸면 recipe.js가 pk도 다시 잠근다).
(function () {
  var C = window.crypto && window.crypto.subtle;
  var PRE = "cafesui.recipe.", HK = PRE + "hirekey", KEYK = "cafesui.ui.rk";
  var LINK = "https://thsalswl900119-maker.github.io/SONJOY/hire/";
  var key = null, priv = null, rows = null, box = null, busy = false;
  // 판단점(11/20 사장님 「실제 면접에서 좋고 나쁨을 가를 수 있게」): 서버 ops/「hire.q.<코드>」(지원자별) · 「hire.q.default」(기본 질문)의 r = 공개 열쇠로 잠근 { items:[{q, good[], bad[], ask}], focus[] }
  var sets = {};
  function J(k) { try { var m = window.__CS_MEM; return JSON.parse((m && k in m ? m[k] : localStorage.getItem(k)) || "null"); } catch (e) { return null; } }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function canSee() { var m = me(); return m === "사장님" || m === "정항아"; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function ub(s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function bu(u) { var s = ""; u = new Uint8Array(u); for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function derive(pw, meta) {
    return C.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]).then(function (b) {
      return C.deriveKey({ name: "PBKDF2", salt: ub(meta.s), iterations: meta.it || 250000, hash: "SHA-256" }, b, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    });
  }
  function dec(k, o) { return C.decrypt({ name: "AES-GCM", iv: ub(o.i) }, k, ub(o.c)).then(function (b) { return new TextDecoder().decode(b); }); }
  function encr(k, text) { var iv = crypto.getRandomValues(new Uint8Array(12)); return C.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(text)).then(function (c) { return { i: bu(iv), c: bu(c) }; }); }
  function check(k) { var m = J(PRE + "meta"); if (!m || !m.chk) return Promise.reject(new Error("nometa")); return dec(k, m.chk).then(function (t) { if (t !== "cafesui-recipe-ok") throw new Error("bad"); return k; }); }
  function toast(t) { try { if (window.__CS_TOAST) window.__CS_TOAST(t); } catch (e) {} }
  function copy(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast("복사했어요"); }, function () { prompt("복사해서 쓰세요", t); });
    else prompt("복사해서 쓰세요", t);
  }
  function when(iso) { var d = new Date(iso); if (isNaN(d)) return ""; return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }

  function norm(t) { return String(t || "").replace(/\s+/g, "").replace(/[「」"'·.,?!()~]/g, ""); }
  function judgeOf(d, i) {
    var q = norm((d.qs || [])[i]); if (!q) return null;
    var cands = [];
    if (d.k && sets[d.k] && sets[d.k].items) cands = cands.concat(sets[d.k].items);
    if (sets["default"] && sets["default"].items) cands = cands.concat(sets["default"].items);
    for (var j = 0; j < cands.length; j++) { var c = norm(cands[j].q); if (c && q.indexOf(c) >= 0) return cands[j]; }
    return null;
  }
  function judgeHtml(j) {
    if (!j) return "";
    function li(a) { return (a || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join(""); }
    return '<div class="hrjudge">' + (j.good && j.good.length ? '<div class="hjg"><b>좋은 신호</b><ul>' + li(j.good) + '</ul></div>' : "") +
      (j.bad && j.bad.length ? '<div class="hjb"><b>아쉬운 신호</b><ul>' + li(j.bad) + '</ul></div>' : "") +
      (j.ask ? '<div class="hja"><b>2차에서 물어볼 것</b> ' + esc(j.ask) + '</div>' : "") + '</div>';
  }
  function linkHtml() {
    return '<div class="hrlink"><b>지원자에게 보낼 링크</b><span class="hrurl">' + LINK + '</span><button type="button" class="mvbtn pri" data-a="cplink">📋 링크 복사</button></div>' +
      '<p class="mvnote">카톡 · 문자로 이 링크만 보내면 돼요. 지원자는 로그인 없이 답을 쓰고 「제출하기」를 누르면 여기로 들어옵니다.</p>';
  }
  function draw(msg, bad) {
    if (!box) return;
    if (!canSee()) { box.innerHTML = '<p class="mvmsg">사장님 · 정항아님만 볼 수 있어요</p>'; return; }
    if (!C) { box.innerHTML = '<p class="mvmsg bad">이 브라우저에서는 열 수 없습니다</p>'; return; }
    var hk = J(HK);
    if (!key) {
      box.innerHTML = (hk ? linkHtml() : "") +
        '<div class="mvlock"><p>지원자 답은 잠겨 있어요. 레시피와 같은 비밀번호로 열어요.</p>' +
        '<div class="mvrow"><input type="password" id="hrPw" autocomplete="off" placeholder="레시피 비밀번호" aria-label="레시피 비밀번호"><button type="button" class="mvbtn pri" data-a="open">열기</button></div>' +
        '<p class="mvmsg' + (bad ? " bad" : "") + '">' + esc(msg || "") + '</p></div>';
      return;
    }
    if (!hk) {
      box.innerHTML = '<div class="mvlock"><p><b>처음 한 번만</b> — 지원자 답을 잠글 열쇠를 만들어요. 만든 뒤에 링크를 보내 주세요.</p>' +
        '<button type="button" class="mvbtn pri" data-a="setup">🔑 지원자 답 받기 시작</button><p class="mvmsg' + (bad ? " bad" : "") + '">' + esc(msg || "") + '</p></div>';
      return;
    }
    var h = linkHtml() + '<div class="mvtools"><span class="mvwho">' + (rows ? "받은 답 " + rows.length + "개" : "읽는 중…") + '</span><button type="button" class="mvbtn" data-a="reload">🔄 새로 읽기</button><button type="button" class="mvbtn" data-a="hide">🔒 닫기</button></div>';
    if (msg) h += '<p class="mvmsg' + (bad ? " bad" : "") + '">' + esc(msg) + '</p>';
    if (rows && !rows.length) h += '<p class="mvmsg">아직 들어온 답이 없어요</p>';
    (rows || []).forEach(function (r, ri) {
      if (r.err) { h += '<div class="hrcard"><p class="mvmsg bad">' + esc(r.id) + ' · 열 수 없는 답 (열쇠가 다를 수 있어요)</p></div>'; return; }
      var d = r.d, qa = "";
      (d.qs || []).forEach(function (q, i) {
        var a = (d.a && d.a[i]) || "";
        qa += '<div class="hrqa"><div class="hrq"><span>' + (i + 1) + '</span>' + (d.tags && d.tags[i] ? '<em>' + esc(d.tags[i]) + '</em>' : "") + esc(q) + '</div><div class="hra' + (a.trim() ? "" : " empty") + '">' + (a.trim() ? esc(a) : "비움") + '</div>' + judgeHtml(judgeOf(d, i)) + '</div>';
      });
      var fs = [].concat((d.k && sets[d.k] && sets[d.k].focus) || [], (sets["default"] && sets["default"].focus) || []);
      var fh = fs.length ? '<div class="hrfocus"><b>이 지원자 볼 점</b><ul>' + fs.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul></div>' : "";
      h += '<details class="hrcard"' + (ri === 0 ? " open" : "") + '><summary><b>' + esc(d.name || "이름 없음") + '</b><span>' + esc(when(d.at)) + ' 제출' + (d.k ? ' · 맞춤 질문' : '') + '</span></summary>' +
        '<div class="hrbody">' + fh + qa + '<div class="mvtools"><button type="button" class="mvbtn" data-a="cp" data-i="' + ri + '">📋 이 답 전체 복사</button></div></div></details>';
    });
    box.innerHTML = h;
  }
  function loadPriv() {
    var hk = J(HK); if (!hk || !hk.pk || !key) return Promise.resolve(null);
    return dec(key, hk.pk).then(function (t) { return C.importKey("jwk", JSON.parse(t), { name: "RSA-OAEP", hash: "SHA-256" }, false, ["decrypt"]); });
  }
  function authed() {
    return new Promise(function (res, rej) {
      if (!window.firebase || !firebase.auth) return rej(new Error("nofb"));
      if (firebase.auth().currentUser) return res();
      var off = firebase.auth().onAuthStateChanged(function (u) { if (u) { off(); res(); } });
      setTimeout(function () { rej(new Error("timeout")); }, 15000);
    });
  }
  function fetchRows() {
    if (busy || !key) return; busy = true; rows = null; draw();
    var FP = firebase.firestore.FieldPath;
    authed().then(loadPriv).then(function (pk) {
      priv = pk; if (!priv) throw new Error("nopriv");
      return firebase.firestore().collection("ops").where(FP.documentId(), ">=", "hire.a.").where(FP.documentId(), "<=", "hire.a.\uf8ff").get();
    }).then(function (snap) {
      var list = []; snap.forEach(function (doc) { list.push({ id: doc.id, v: (doc.data() || {}).v }); });
      return Promise.all(list.map(function (r) {
        var o; try { o = JSON.parse(r.v); } catch (e) { return { id: r.id, err: 1 }; }
        return C.decrypt({ name: "RSA-OAEP" }, priv, ub(o.ek)).then(function (raw) {
          return C.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
        }).then(function (ak) { return C.decrypt({ name: "AES-GCM", iv: ub(o.i) }, ak, ub(o.c)); })
          .then(function (b) { return { id: r.id, d: JSON.parse(new TextDecoder().decode(b)) }; }, function () { return { id: r.id, err: 1 }; });
      }));
    }).then(function (rs) {
      rs.sort(function (a, b) { return a.id < b.id ? 1 : -1; });
      var ks = ["default"]; rs.forEach(function (r) { if (r.d && r.d.k && ks.indexOf(r.d.k) < 0 && /^[a-z0-9]{6,24}$/.test(r.d.k)) ks.push(r.d.k); });
      return Promise.all(ks.map(function (k) {
        if (sets[k]) return null;
        return firebase.firestore().collection("ops").doc("hire.q." + k).get().then(function (snap) {
          var o = JSON.parse((snap.exists && snap.data().v) || "null"); if (!o || !o.r) return;
          return C.decrypt({ name: "RSA-OAEP" }, priv, ub(o.r.ek)).then(function (raw) { return C.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]); })
            .then(function (ak) { return C.decrypt({ name: "AES-GCM", iv: ub(o.r.i) }, ak, ub(o.r.c)); })
            .then(function (b) { sets[k] = JSON.parse(new TextDecoder().decode(b)); });
        }).catch(function () {});
      })).then(function () { return rs; });
    }).then(function (rs) {
      rows = rs; busy = false; draw();
    }).catch(function (e) { busy = false; rows = []; draw("답을 읽지 못했어요 · 🔄 새로 읽기를 눌러 주세요 (" + (e && e.message || "") + ")", true); });
  }
  function opened(k) { key = k; draw(); if (J(HK)) fetchRows(); }
  var tried = "";
  function auto() {
    if (key || !C || !canSee()) return;
    var st = J(KEYK), m = J(PRE + "meta"); if (!st || !m || st.s !== m.s) return;
    if (tried === st.k) return; tried = st.k;
    C.importKey("raw", ub(st.k), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]).then(check).then(opened).catch(function () {});
  }
  function unlock() {
    var el = document.getElementById("hrPw"), pw = (el && el.value || "").trim(); if (!pw) { if (el) el.focus(); return; }
    var m = J(PRE + "meta"); if (!m) { draw("서버에서 받는 중입니다 · 잠시 뒤 다시 눌러 주세요", true); return; }
    var cands = [pw, pw.replace(/\s+/g, "")];
    (function next(i) {
      if (i >= cands.length) { draw("비밀번호가 맞지 않습니다", true); return; }
      derive(cands[i], m).then(check).then(opened, function () { next(i + 1); });
    })(0);
  }
  function setup() {
    if (!key || J(HK)) { draw(); return; }
    C.generateKey({ name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"]).then(function (kp) {
      return Promise.all([C.exportKey("jwk", kp.publicKey), C.exportKey("jwk", kp.privateKey)]);
    }).then(function (ks) {
      return encr(key, JSON.stringify(ks[1])).then(function (pk) {
        var o = { pub: ks[0], pk: pk, by: me(), at: new Date().toISOString() };
        localStorage.setItem(HK, JSON.stringify(o));
        rows = []; draw("준비됐어요 · 이제 링크를 보내 주세요");
      });
    }).catch(function () { draw("열쇠를 만들지 못했어요 · 다시 눌러 주세요", true); });
  }
  function textOf(r) {
    var d = r.d, t = "■ 카페스이 1차 면접 · " + (d.name || "") + " · " + when(d.at) + " 제출\n";
    (d.qs || []).forEach(function (q, i) { t += "\n" + (i + 1) + ". " + q + "\n→ " + ((d.a && d.a[i]) || "(비움)") + "\n"; });
    return t;
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-a]"); if (!b || !box.contains(b)) return;
    var a = b.dataset.a;
    if (a === "open") unlock();
    else if (a === "setup") setup();
    else if (a === "reload") fetchRows();
    else if (a === "cplink") copy(LINK);
    else if (a === "cp") { var r = rows && rows[+b.dataset.i]; if (r && r.d) copy(textOf(r)); }
    else if (a === "hide") { key = null; priv = null; rows = null; sets = {}; tried = "x"; draw(); }
  }
  function mount() {
    var slot = document.getElementById("mgHireSlot"); if (!slot || slot.__hr) return;
    slot.__hr = 1;
    slot.innerHTML = '<div class="mgvault hrwrap"><div class="hrhead"><span class="mvic">📨</span><b>지원자 1차 면접 답</b><small>지원자가 링크에서 쓴 답이 잠긴 채로 들어와요</small></div><div class="mvbody" id="hrBody"></div></div>';
    box = document.getElementById("hrBody");
    box.addEventListener("click", onClick);
    box.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target && e.target.id === "hrPw") { e.preventDefault(); unlock(); } });
    var btn = document.querySelector('#tp15 .mgt[data-m="hire"]'); if (btn) btn.hidden = !canSee();
    draw(); auto();
  }
  window.addEventListener("cs:mem", function (e) {
    var ks = (e.detail && e.detail.keys) || [];
    if (!key && (ks.indexOf(PRE + "meta") >= 0 || ks.indexOf(HK) >= 0)) auto();
    else if (key && ks.indexOf(HK) >= 0 && !rows) fetchRows();
    else if (box && !key) draw();
  });
  mount();
  /* 바로 가기 주소 …/ops/#hire = 관리자 → 📨 지원자 면접 (11/16 사장님 「지원자 답을 보고 싶다」) */
  if (location.hash === "#hire") {
    var tries = 0;
    (function go() {
      var t = document.querySelector('.tab[data-p="tp15"]');
      if (t && document.getElementById("tp15").hidden) t.click();
      var b = document.querySelector('#tp15 .mgt[data-m="hire"]');
      if (b && !b.hidden) { b.click(); var s = document.getElementById("mgHireSlot"); if (s) s.scrollIntoView({ block: "start" }); return; }
      if (++tries < 60) setTimeout(go, 500);
    })();
  }
  if (window.MutationObserver) {
    var t = null, mo = new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; mount(); }, 400); });
    var pn = document.getElementById("tp15"); if (pn) mo.observe(pn, { childList: true, subtree: true });
  }
})();
