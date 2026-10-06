// 레시피 — 노션 「카페스이 Manual · 제품별 레시피」를 옮긴 것.
// 보안: 이 저장소는 공개라서 레시피 글은 코드에 넣지 않는다. 서버(cafesui.recipe.*)에는 비밀번호로 잠근(AES-GCM) 글만 있고,
//       비밀번호를 넣은 기기에서만 화면에서 풀어 본다. 풀린 글은 어디에도 저장하지 않는다(화면에만).
(function () {
  var box = document.getElementById("rcBox"); if (!box) return;
  var C = window.crypto && window.crypto.subtle;
  var PRE = "cafesui.recipe.", KEYK = "cafesui.ui.rk";   // ui.* 는 이 기기에만 (서버로 안 감)
  var SECS = [["egg", "🥧 에그타르트"], ["cake", "🎂 과일케이크"], ["bingsu", "🍧 빙수 (26년 ver.)"], ["coffee", "☕ 커피"], ["drink", "🥤 음료"], ["jam", "🫙 과일청"], ["etc", "🍰 티라미수 · 기타"]];
  var lockEl = document.getElementById("rcLock"), mainEl = document.getElementById("rcMain"), navEl = document.getElementById("rcNav"),
      bodyEl = document.getElementById("rcBody"), msgEl = document.getElementById("rcMsg"), pwEl = document.getElementById("rcPw"),
      whoEl = document.getElementById("rcWho"), toolEl = document.getElementById("rcTools");
  var key = null, cur = "egg", jamSub = "grapefruit", plain = {};
  // 레시피는 기기 저장소가 아니라 메모리(sync.js __CS_MEM)에만 — 기기 저장 한도를 넘기지 않게
  function J(k) { try { var m = window.__CS_MEM; return JSON.parse((m && k in m ? m[k] : localStorage.getItem(k)) || "null"); } catch (e) { return null; } }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
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
  function say(t, bad) { msgEl.textContent = t || ""; msgEl.className = "rcmsg" + (bad ? " bad" : ""); }
  function showLock(t, bad) { key = null; plain = {}; lockEl.hidden = false; mainEl.hidden = true; bodyEl.innerHTML = ""; say(t, bad); }
  // 풀기
  function open(k) {
    key = k; plain = {};
    var jobs = SECS.map(function (s) { var o = J(PRE + s[0]); return o ? dec(k, o).then(function (t) { plain[s[0]] = t; }, function () {}) : Promise.resolve(); });
    return Promise.all(jobs).then(function () { lockEl.hidden = true; mainEl.hidden = false; say(""); draw(); });
  }
  function unlock() {
    if (!C) { say("이 브라우저에서는 레시피를 열 수 없습니다 (주소가 https 인지 확인)", true); return; }
    var m = J(PRE + "meta"); if (!m) { say("레시피를 아직 서버에서 받는 중입니다 · 잠시 뒤 다시 눌러 주세요", true); return; }
    var pw = (pwEl.value || "").trim(); if (!pw) { pwEl.focus(); return; }
    say("여는 중…");
    var cands = variants(pw), err = null;
    // 휴대폰 입력 실수(한글 자판 · 자동 대문자 · 긴 줄표 · 띄어쓰기)도 한 번씩 맞춰 본다
    (function next(i) {
      if (i >= cands.length) {
        say(err && err.name !== "OperationError" && err.message !== "bad" ? "열다가 오류가 났습니다 (" + (err.name || "") + " " + (err.message || "") + ") · 화면을 새로고침한 뒤 다시 해 주세요" : "비밀번호가 맞지 않습니다 · 「보기」를 눌러 적은 글자를 확인해 주세요", true);
        return;
      }
      derive(cands[i], m).then(check).then(function (k) {
        pwEl.value = "";
        if (document.getElementById("rcKeep").checked) C.exportKey("raw", k).then(function (raw) { try { localStorage.setItem(KEYK, JSON.stringify({ s: m.s, k: bu(raw) })); } catch (e) {} }, function () {});
        return open(k).catch(function (e) { say("열다가 오류가 났습니다 (" + (e && e.message || e) + ")", true); });
      }, function (e) { err = e; next(i + 1); });
    })(0);
  }
  // 두벌식 한글 자판으로 친 글자 → 같은 자리의 영문 글자 (예: 퍼ㅓㄷ → vjje)
  var CHO = ["r","R","s","e","E","f","a","q","Q","t","T","d","w","W","c","z","x","v","g"],
      JUNG = ["k","o","i","O","j","p","u","P","h","hk","ho","hl","y","n","nj","np","nl","b","m","ml","l"],
      JONG = ["","r","R","rt","s","sw","sg","e","f","fr","fa","fq","ft","fx","fv","fg","a","q","qt","t","T","d","w","c","z","x","v","g"],
      JAMO = { "ㄱ":"r","ㄲ":"R","ㄳ":"rt","ㄴ":"s","ㄵ":"sw","ㄶ":"sg","ㄷ":"e","ㄸ":"E","ㄹ":"f","ㄺ":"fr","ㄻ":"fa","ㄼ":"fq","ㄽ":"ft","ㄾ":"fx","ㄿ":"fv","ㅀ":"fg","ㅁ":"a","ㅂ":"q","ㅃ":"Q","ㅄ":"qt","ㅅ":"t","ㅆ":"T","ㅇ":"d","ㅈ":"w","ㅉ":"W","ㅊ":"c","ㅋ":"z","ㅌ":"x","ㅍ":"v","ㅎ":"g",
        "ㅏ":"k","ㅐ":"o","ㅑ":"i","ㅒ":"O","ㅓ":"j","ㅔ":"p","ㅕ":"u","ㅖ":"P","ㅗ":"h","ㅘ":"hk","ㅙ":"ho","ㅚ":"hl","ㅛ":"y","ㅜ":"n","ㅝ":"nj","ㅞ":"np","ㅟ":"nl","ㅠ":"b","ㅡ":"m","ㅢ":"ml","ㅣ":"l" };
  function hanToKey(t) {
    return t.replace(/[\uAC00-\uD7A3\u3131-\u3163]/g, function (ch) {
      var c = ch.charCodeAt(0);
      if (c < 0xAC00) return JAMO[ch] || ch;
      c -= 0xAC00; return CHO[Math.floor(c / 588)] + JUNG[Math.floor((c % 588) / 28)] + JONG[c % 28];
    });
  }
  function variants(pw) {
    var out = [];
    function add(x) { if (x && out.indexOf(x) < 0) out.push(x); }
    var a = pw.replace(/[\u2010-\u2015\u2212\uFF0D]/g, "-").replace(/\s+/g, "");
    add(pw); add(a); add(hanToKey(a)); add(a.toLowerCase()); add(hanToKey(a).toLowerCase());
    return out;
  }
  function auto() {
    var st = J(KEYK), m = J(PRE + "meta"); if (!st || !m || !C) return showLock("");
    if (st.s !== m.s) { try { localStorage.removeItem(KEYK); } catch (e) {} return showLock("레시피 비밀번호가 바뀌었습니다 · 새 비밀번호를 넣어 주세요", true); }
    C.importKey("raw", ub(st.k), { name: "AES-GCM" }, true, ["encrypt", "decrypt"]).then(check).then(open).catch(function () { showLock(""); });
  }
  // 그리기
  function draw() {
    navEl.innerHTML = SECS.map(function (s) { return '<button type="button" class="rcnb" data-k="' + s[0] + '" aria-pressed="' + (s[0] === cur) + '">' + s[1] + "</button>"; }).join("");
    whoEl.textContent = "열람 " + (nim(me()) || "?") + " · 외부 유출 · 개인 사용 금지 (법적 대응)";
    toolEl.hidden = me() !== "사장님";
    if (cur === "jam") return drawJam();
    var h = plain[cur];
    bodyEl.innerHTML = h ? '<div class="rcsec">' + h + "</div>" : '<p class="rcnone">이 부분은 아직 옮겨진 레시피가 없습니다</p>';
  }
  function jamData() { try { return JSON.parse(plain.jam || "{}") || {}; } catch (e) { return {}; } }
  function drawJam() {
    var d = jamData(), ks = Object.keys(d); if (ks.indexOf(jamSub) < 0) jamSub = ks[0];
    var j = d[jamSub] || { uses: [] }, canEdit = me() === "사장님" || me() === "정항아";
    bodyEl.innerHTML = '<nav class="rcjn">' + ks.map(function (k) { return '<button type="button" class="rcjb" data-j="' + k + '" aria-pressed="' + (k === jamSub) + '">' + esc(d[k].title) + "</button>"; }).join("") + "</nav>" +
      '<div class="rcsec"><h5 class="rch">담는 법</h5>' +
      (j.how ? '<div class="rchow">' + esc(j.how).replace(/\n/g, "<br>") + "</div>" : '<p class="rcnone">노션에는 담는 법이 따로 없습니다 · ' + (canEdit ? "아래 「✏ 담는 법 적기」로 적어 주세요" : "사장님 · 매니저가 적을 예정입니다") + "</p>") +
      (j.by ? '<p class="rcby">마지막 수정 ' + esc(nim(j.by)) + (j.at ? " · " + esc(j.at) : "") + "</p>" : "") +
      (canEdit ? '<button type="button" class="rced" id="rcJamEd">✏ 담는 법 적기</button><div class="rcjed" id="rcJamBox" hidden><textarea id="rcJamTa" rows="10" placeholder="예) 재료 · 비율(과일 : 설탕) · 소독 · 숙성 기간 · 보관 · 유통기한"></textarea><button type="button" class="rced prim" id="rcJamSave">저장 (잠가서 저장)</button></div>' : "") +
      '<h5 class="rch">어디에 쓰나 (레시피에서 모음)</h5>' +
      ((j.uses || []).length ? "<ul>" + j.uses.map(function (u) { return "<li><b>" + esc(u.where) + "</b> — " + u.text + "</li>"; }).join("") + "</ul>" : '<p class="rcnone">없음</p>') + "</div>";
    var ed = document.getElementById("rcJamEd");
    if (ed) ed.onclick = function () { var b = document.getElementById("rcJamBox"); b.hidden = !b.hidden; document.getElementById("rcJamTa").value = j.how || ""; };
    var sv = document.getElementById("rcJamSave");
    if (sv) sv.onclick = function () {
      var t = document.getElementById("rcJamTa").value.trim(), dd = jamData(); if (!dd[jamSub]) return;
      dd[jamSub].how = t; dd[jamSub].by = me(); var n = new Date(); dd[jamSub].at = (n.getMonth() + 1) + "/" + n.getDate();
      var txt = JSON.stringify(dd);
      encr(key, txt).then(function (o) { try { localStorage.setItem(PRE + "jam", JSON.stringify(o)); } catch (e) {} plain.jam = txt; drawJam(); });
    };
  }
  navEl.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".rcnb"); if (!b) return; cur = b.dataset.k; draw(); bodyEl.scrollIntoView({ block: "nearest" }); });
  bodyEl.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".rcjb"); if (!b) return; jamSub = b.dataset.j; drawJam(); });
  document.getElementById("rcOpen").addEventListener("click", unlock);
  var seeBtn = document.getElementById("rcSee");
  if (seeBtn) seeBtn.addEventListener("click", function () { var on = pwEl.type === "password"; pwEl.type = on ? "text" : "password"; seeBtn.textContent = on ? "숨기기" : "보기"; });
  pwEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); unlock(); } });
  document.getElementById("rcLockBtn").addEventListener("click", function () { try { localStorage.removeItem(KEYK); } catch (e) {} showLock("잠갔습니다 · 이 기기에서 비밀번호를 지웠습니다"); });
  // 사장님: 비밀번호 바꾸기 — 지금 열린 글을 새 비밀번호로 다시 잠가서 저장한다 (모든 기기는 새 비밀번호로 다시 열어야 함)
  document.getElementById("rcChg").addEventListener("click", function () {
    if (!key || me() !== "사장님") return;
    var a = prompt("새 레시피 비밀번호 (8자 이상 · 직원에게만 따로 알려 주세요)"); if (!a) return;
    if (a.trim().length < 8) { alert("8자 이상으로 정해 주세요"); return; }
    if (prompt("한 번 더 입력해 주세요") !== a) { alert("두 번 입력한 비밀번호가 다릅니다"); return; }
    var salt = crypto.getRandomValues(new Uint8Array(16)), meta = { v: 1, s: bu(salt), it: 250000 };
    derive(a.trim(), meta).then(function (k2) {
      return encr(k2, "cafesui-recipe-ok").then(function (chk) {
        meta.chk = chk; meta.at = new Date().toISOString();
        return Promise.all(SECS.map(function (s) { return plain[s[0]] != null ? encr(k2, plain[s[0]]).then(function (o) { return [s[0], o]; }) : null; })).then(function (rs) {
          rs.forEach(function (r) { if (r) try { localStorage.setItem(PRE + r[0], JSON.stringify(r[1])); } catch (e) {} });
          try { localStorage.setItem(PRE + "meta", JSON.stringify(meta)); } catch (e) {}
          return C.exportKey("raw", k2).then(function (raw) { try { localStorage.setItem(KEYK, JSON.stringify({ s: meta.s, k: bu(raw) })); } catch (e) {} key = k2; alert("바꿨습니다 · 다른 기기는 새 비밀번호를 넣어야 열립니다"); });
        });
      });
    });
  });
  // 다른 기기에서 바뀌면 (과일청 담는 법 · 비밀번호 변경)
  // 레시피는 sync.js가 메모리에 받으면 cs:mem 으로 알려 준다 (열 때 처음 받는 것도 여기로)
  function onKeys(e) {
    var ks = (e.detail && e.detail.keys) || []; if (!ks.some(function (k) { return k.indexOf(PRE) === 0; })) return;
    if (ks.indexOf(PRE + "meta") >= 0) { auto(); return; }
    if (key) open(key); else if (!lockEl.hidden) auto();
  }
  window.addEventListener("cs:mem", onKeys);
  window.addEventListener("cs:remote", onKeys);
  window.addEventListener("cs:me", draw);
  auto();
})();
