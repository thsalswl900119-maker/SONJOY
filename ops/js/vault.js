// 관리자 탭 「🔐 계정 · 연락처 모음」 폴더 (11/3 사장님)
// 보안: 저장소 · 서버가 둘 다 공개라서 아이디 · 비밀번호 글은 코드에 넣지 않는다.
//       서버에는 레시피와 같은 비밀번호로 잠근 글(cafesui.recipe.vault · AES-GCM)만 있고, 화면에서만 푼다.
//       cafesui.recipe.* 이름이라 기기 저장소에는 안 들어가고 메모리에만(sync.js MEMK) · 자동 백업에도 안 들어간다.
(function () {
  var C = window.crypto && window.crypto.subtle;
  var PRE = "cafesui.recipe.", VK = PRE + "vault", KEYK = "cafesui.ui.rk";
  var key = null, data = null, editing = false;
  function J(k) { try { var m = window.__CS_MEM; return JSON.parse((m && k in m ? m[k] : localStorage.getItem(k)) || "null"); } catch (e) { return null; } }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function canEdit() { var m = me(); return m === "사장님" || m === "정항아"; }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
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

  var box = null;
  function mount() {
    var slot = document.getElementById("mgVaultSlot"); if (!slot || slot.__vt) return;
    slot.__vt = 1;
    slot.innerHTML = '<details class="mgvault" id="mgVault"><summary><span class="mvic">🔐</span><b>계정 · 고객센터 · 설정 모음</b><small>잠긴 폴더 · 레시피 비밀번호로 열기</small></summary><div class="mvbody" id="mvBody"></div></details>';
    box = document.getElementById("mvBody");
    document.getElementById("mgVault").addEventListener("toggle", function () { if (this.open) draw(); });
    box.addEventListener("click", onClick);
    draw();
  }
  function lockHtml(msg, bad) {
    return '<div class="mvlock"><p>레시피와 같은 비밀번호로 열어요. 아이디 · 비밀번호가 들어 있어서 서버에는 잠근 글만 있습니다.</p>' +
      '<div class="mvrow"><input type="password" id="mvPw" autocomplete="off" placeholder="레시피 비밀번호" aria-label="레시피 비밀번호"><button type="button" class="mvbtn pri" data-a="open">열기</button></div>' +
      '<label class="mvkeep"><input type="checkbox" id="mvKeep"> 이 기기에서 기억하기 (가게 기기만 · 개인 휴대폰은 끄기)</label>' +
      '<p class="mvmsg' + (bad ? " bad" : "") + '">' + esc(msg || "") + '</p></div>';
  }
  // 한 줄 → 링크 · 전화 · 메일을 누를 수 있게
  function lineHtml(t) {
    var s = esc(t);
    s = s.replace(/\[([^\]\s]+@[^\]\s]+)\]\(mailto:[^)]+\)/g, "$1");
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    s = s.replace(/(^|[\s(/:])([\w.+-]+@[\w-]+\.[\w.]+)/g, '$1<a href="mailto:$2">$2</a>');
    s = s.replace(/(^|[^\d.])(1[5-9]\d{2}-\d{4})(?!\d)/g, '$1<a href="tel:$2">$2</a>');
    return s;
  }
  function view() {
    var t = (data && data.t) || "", lines = t.split("\n"), h = "";
    lines.forEach(function (ln, i) {
      if (/^\s*[—\-─━=]{6,}\s*$/.test(ln)) { h += '<hr class="mvhr">'; return; }
      if (!ln.trim()) { h += '<div class="mvsp"></div>'; return; }
      h += '<div class="mvln"><span class="mvt">' + lineHtml(ln) + '</span><button type="button" class="mvcp" data-a="cp" data-i="' + i + '" title="이 줄 복사">📋</button></div>';
    });
    return '<div class="mvtools"><span class="mvwho">' + (data && data.at ? "마지막 고침 " + esc(nim(data.by)) + " · " + esc(data.at) : "") + '</span>' +
      (canEdit() ? '<button type="button" class="mvbtn" data-a="edit">✏ 고치기</button>' : "") +
      '<button type="button" class="mvbtn" data-a="hide">🔒 닫기</button></div>' +
      '<div class="mvlist">' + (h || '<p class="mvmsg">아직 적은 내용이 없어요</p>') + '</div>' +
      '<p class="mvnote">줄 끝 📋 = 그 줄 복사 · 이 화면을 캡쳐해서 단톡방에 올리지 마세요</p>';
  }
  function editHtml() {
    return '<p class="mvnote">한 줄에 하나씩 · 구분선은 ———— · 저장하면 다시 잠가서 서버에 올라갑니다</p>' +
      '<textarea id="mvTa" class="mvta" spellcheck="false">' + esc((data && data.t) || "") + '</textarea>' +
      '<div class="mvtools"><button type="button" class="mvbtn pri" data-a="save">✔ 저장</button><button type="button" class="mvbtn" data-a="cancel">취소</button></div>';
  }
  function draw(msg, bad) {
    if (!box) return;
    if (!C) { box.innerHTML = '<p class="mvmsg bad">이 브라우저에서는 열 수 없습니다 (주소가 https 인지 확인)</p>'; return; }
    if (!key) { box.innerHTML = lockHtml(msg, bad); return; }
    if (editing) return;
    box.innerHTML = view();
  }
  function load(k) {
    var o = J(VK);
    if (!o) { key = k; data = { t: "" }; draw(); return Promise.resolve(); }
    return dec(k, o).then(function (t) { key = k; try { data = JSON.parse(t); } catch (e) { data = { t: t }; } draw(); }, function () { key = null; draw("이 폴더를 열 수 없습니다 · 비밀번호가 바뀌었는지 확인해 주세요", true); });
  }
  var tried = "";
  function auto() {
    if (key || !C) return;
    var st = J(KEYK), m = J(PRE + "meta"); if (!st || !m || st.s !== m.s) return;
    var sig = st.k + "|" + (J(VK) ? J(VK).i : ""); if (tried === sig) return; tried = sig;
    C.importKey("raw", ub(st.k), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]).then(check).then(load).catch(function () {});
  }
  function unlock() {
    var pwEl = document.getElementById("mvPw"); var pw = (pwEl && pwEl.value || "").trim(); if (!pw) { if (pwEl) pwEl.focus(); return; }
    var m = J(PRE + "meta"); if (!m) { draw("서버에서 받는 중입니다 · 잠시 뒤 다시 눌러 주세요", true); return; }
    var keep = document.getElementById("mvKeep") && document.getElementById("mvKeep").checked;
    var cands = [pw, pw.replace(/\s+/g, "")];
    (function next(i) {
      if (i >= cands.length) { draw("비밀번호가 맞지 않습니다", true); return; }
      derive(cands[i], m).then(check).then(function (k) {
        if (keep) C.exportKey("raw", k).then(function (raw) { try { localStorage.setItem(KEYK, JSON.stringify({ s: m.s, k: bu(raw) })); } catch (e) {} }, function () {});
        return load(k);
      }, function () { next(i + 1); });
    })(0);
  }
  function copy(t) {
    var done = function () { try { if (window.__CS_TOAST) window.__CS_TOAST("복사했어요"); } catch (e) {} };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { prompt("복사해서 쓰세요", t); });
    else prompt("복사해서 쓰세요", t);
  }
  function onClick(e) {
    var b = e.target.closest && e.target.closest("[data-a]"); if (!b) return;
    var a = b.dataset.a;
    if (a === "open") unlock();
    else if (a === "hide") { key = null; data = null; editing = false; var d = document.getElementById("mgVault"); if (d) d.open = false; draw(); }
    else if (a === "cp") { var ln = ((data && data.t) || "").split("\n")[+b.dataset.i] || ""; copy(ln.replace(/\[([^\]]+)\]\(mailto:[^)]+\)/g, "$1").trim()); }
    else if (a === "edit") { if (!canEdit()) return; editing = true; box.innerHTML = editHtml(); var ta = document.getElementById("mvTa"); if (ta) { ta.style.height = Math.max(240, ta.scrollHeight + 8) + "px"; ta.focus(); } }
    else if (a === "cancel") { editing = false; draw(); }
    else if (a === "save") {
      if (!key || !canEdit()) return;
      var t = document.getElementById("mvTa").value.replace(/\s+$/, "");
      var nd = { t: t, by: me(), at: new Date().toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) };
      encr(key, JSON.stringify(nd)).then(function (o) {
        return dec(key, o).then(function (back) { if (back !== JSON.stringify(nd)) throw new Error("verify"); try { localStorage.setItem(VK, JSON.stringify(o)); } catch (e) {} data = nd; editing = false; draw(); });
      }).catch(function () { alert("저장하지 못했어요 · 다시 눌러 주세요"); });
    }
  }
  document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target && e.target.id === "mvPw") { e.preventDefault(); unlock(); } });
  // 다른 기기에서 바뀌거나 처음 받으면 (sync.js → cs:mem)
  window.addEventListener("cs:mem", function (e) {
    var ks = (e.detail && e.detail.keys) || [];
    if (ks.indexOf(VK) >= 0 && key && !editing) load(key);
    if (!key && (ks.indexOf(PRE + "meta") >= 0 || ks.indexOf(VK) >= 0)) auto();
  });
  // 관리자 탭 내용은 처음 열 때 불러오므로 자리가 생기면 붙인다
  function tryMount() { mount(); if (box && !key) auto(); }
  tryMount();
  if (window.MutationObserver) {
    var t = null, mo = new MutationObserver(function () { if (t) return; t = setTimeout(function () { t = null; tryMount(); }, 400); });
    var pn = document.getElementById("tp15"); if (pn) mo.observe(pn, { childList: true, subtree: true });
  }
})();
