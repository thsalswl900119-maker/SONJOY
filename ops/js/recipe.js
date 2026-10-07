// 레시피 — 노션 「카페스이 Manual · 제품별 레시피」를 옮긴 것.
// 보안: 이 저장소는 공개라서 레시피 글은 코드에 넣지 않는다. 서버(cafesui.recipe.*)에는 비밀번호로 잠근(AES-GCM) 글만 있고,
//       비밀번호를 넣은 기기에서만 화면에서 풀어 본다. 풀린 글은 어디에도 저장하지 않는다(화면에만).
(function () {
  var box = document.getElementById("rcBox"); if (!box) return;
  var C = window.crypto && window.crypto.subtle;
  var PRE = "cafesui.recipe.", KEYK = "cafesui.ui.rk";   // ui.* 는 이 기기에만 (서버로 안 감)
  var SECS = [["egg", "🥧 에그타르트"], ["cake", "🎂 과일케이크"], ["etc", "🍰 티라미수 · 기타"], ["bingsu", "🍧 빙수 (26년 ver.)"], ["coffee", "☕ 커피"], ["drink", "🥤 음료"], ["jam", "🫙 과일청 · 시럽"]];
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
  // ── 읽기 쉽게: 레시피 글은 그대로 두고 화면에서만 다듬는다 (재료 줄 → 재료표 · 숫자 강조 · 소제목)
  var UNIT = "(?:kg|mg|g|ml|mL|ML|L|l|cc|개입|개|장|봉지|봉|스푼|큰술|작은술|T|t|컵|샷|알|팩|줌|꼬집|%|cm|mm|병|통|판|바퀴|방울)";
  var AMT = "(?:\\d[\\d.,/]*(?:\\s*[~\\-]\\s*\\d[\\d.,]*)?\\s*" + UNIT + "|약간|적당량|조금|한\\s?줌|반\\s?개)";
  var ING = new RegExp("^(.{1,30}?)\\s*[:：]?\\s*(" + AMT + "(?:\\s*\\([^)]*\\))?)\\s*$");
  var NUM = new RegExp("(\\d[\\d.,]*(?:\\s*[~\\-]\\s*\\d[\\d.,]*)?\\s*(?:도|℃|°C|°|분|초|시간|일|" + UNIT.slice(3, -1) + "))(?![a-zA-Z])", "g");
  var AMTSP = new RegExp("(\\d[\\d.]*\\s*" + UNIT + ")\\s+(?=[가-힣])", "g");   // "우유 3430g 뜨거운 물 600g" → 두 재료
  var AMTIN = new RegExp("\\d\\s*" + UNIT + "(?![a-zA-Z가-힣])");
  function ing(t) {   // "박력분 135g" → [이름, 양]
    var m = t.trim().match(ING); if (!m || !/[가-힣a-zA-Z]/.test(m[1]) || /[.。]$/.test(m[1]) || AMTIN.test(m[1])) return null;
    return [m[1].replace(/[\s:：\-–]+$/, ""), m[2]];
  }
  function ingLine(t) {   // 한 줄에 재료 여럿: "박력분 135g. 강력분 50g. 소금 4g"
    t = t.replace(/\u00a0/g, " ").trim(); if (!t) return null;
    function split(x) {
      var parts = x.replace(/(\D)\.(\s|$)/g, "$1\n").replace(/(\D)\s*,\s*|\s*,\s*(?=\D)/g, function (m0, a1) { return (a1 || "") + "\n"; }).replace(AMTSP, "$1\n").split("\n").map(function (y) { return y.trim(); }).filter(Boolean);
      var note = []; parts = parts.filter(function (y) { if (/^\(.*\)$/.test(y)) { note.push(y); return false; } return true; });   // 끝에 붙은 (2배합 16개) 같은 메모
      var items = parts.map(ing); if (!parts.length || items.some(function (y) { return !y; })) return null;
      items.note = note.join(" "); return items;
    }
    // 「4L : 노른자 650g, 우유 1700g …」 처럼 앞에 이름표가 붙은 줄
    var m = t.match(/^([^:：]{1,14})\s*[:：]\s*(.+)$/), items;
    if (m && (items = split(m[2])) && items.length >= 2) return { cap: m[1].trim() + (items.note ? " " + items.note : ""), items: items };
    items = split(t); if (!items) return null;
    return items.length < 2 && !items.note ? { one: items[0] } : { cap: items.note || "", items: items };
  }
  function grid(items, cap, cls) {
    if (items.some(function (x) { return String(x[1]).length > 9 || String(x[0]).length > 16; })) cls = (cls ? cls + " " : "") + "rcwide";   // 긴 줄은 한 줄에 하나씩
    return '<div class="rcing' + (cls ? " " + cls : "") + '">' + (cap ? '<div class="rcingc">' + esc(cap) + "</div>" : "") + '<div class="rcingl">' +
      items.map(function (x) { return '<div class="rcir"><span>' + esc(x[0]) + "</span><b>" + esc(x[1]) + "</b></div>"; }).join("") + "</div></div>";
  }
  function pretty(root) {
    // 1) 문단을 줄(<br>) 단위로 보고 재료 줄을 재료표로
    Array.prototype.slice.call(root.querySelectorAll("p")).forEach(function (p) {
      if (p.closest("table")) return;
      var lines = p.innerHTML.split(/<br\s*\/?>/i), out = [], run = [], hit = false;
      var cls = p.querySelector("u") ? "u" : (p.querySelector("b") && p.textContent.trim() === (p.querySelector("b").textContent || "").trim() ? "b" : "");
      function flush() { if (run.length >= 2) { out.push(grid(run, "", cls)); hit = true; } else if (run.length) out.push(esc(run[0][0] + " " + run[0][1])); run = []; }
      lines.forEach(function (ln) {
        var tmp = document.createElement("div"); tmp.innerHTML = ln; var txt = tmp.textContent, r = txt.trim() ? ingLine(txt) : null;
        if (r && r.one) { run.push(r.one); return; }
        flush();
        if (r) { out.push(grid(r.items, r.cap, cls)); hit = true; } else out.push(ln);
      });
      flush();
      if (!hit) return;
      // 재료표와 글이 섞이면 글은 문단으로 남긴다
      var html = "", buf = [];
      out.forEach(function (x) { if (x.indexOf('<div class="rcing') === 0) { if (buf.join("").trim()) html += "<p>" + buf.join("<br>") + "</p>"; buf = []; html += x; } else buf.push(x); });
      if (buf.join("").trim()) html += "<p>" + buf.join("<br>") + "</p>";
      var w = document.createElement("div"); w.innerHTML = html;
      while (w.firstChild) p.parentNode.insertBefore(w.firstChild, p);
      p.remove();
    });
    // 한 줄짜리 재료 문단이 이어지면(박력분 370g / 강력분 137g / 소금 11g …) 하나의 재료표로
    Array.prototype.slice.call(root.querySelectorAll("p")).forEach(function (p) {
      if (!p.isConnected || p.closest("table") || p.querySelector("br")) return;
      var r = ingLine(p.textContent); if (!r || !r.one) return;
      var run = [p], n = p.nextElementSibling;
      while (n && n.tagName === "P" && !n.querySelector("br")) { var r2 = ingLine(n.textContent); if (!r2 || !r2.one) break; run.push(n); n = n.nextElementSibling; }
      if (run.length < 2) return;
      var w = document.createElement("div"); w.innerHTML = grid(run.map(function (x) { return ingLine(x.textContent).one; }), "", "");
      p.parentNode.insertBefore(w.firstChild, p); run.forEach(function (x) { x.remove(); });
    });
    // 표: 휴대폰에서는 줄마다 카드로 (칸 제목을 각 칸 앞에)
    Array.prototype.slice.call(root.querySelectorAll("table.rct")).forEach(function (tb) {
      var head = tb.querySelector("tr"); if (!head || !head.querySelector("th")) return;
      var hs = Array.prototype.map.call(head.children, function (c) { return c.textContent.trim(); });
      tb.classList.add("rccards");
      // 추천 · 같이 · 페어링 칸은 딱지로, 빈 칸은 「—」
      hs.forEach(function (h, i) { if (!/추천|같이|페어/.test(h)) return; Array.prototype.forEach.call(tb.querySelectorAll("tr"), function (tr) { if (tr === head) return; var td = tr.children[i]; if (td && td.textContent.trim() && !td.querySelector("span.rcpill")) td.innerHTML = td.textContent.split(/\s*[,/]\s*/).filter(Boolean).map(function (x) { return '<span class="rcpill">' + esc(x) + "</span>"; }).join(" "); }); });
      Array.prototype.forEach.call(tb.querySelectorAll("tr"), function (tr) { if (tr === head) return; Array.prototype.forEach.call(tr.children, function (td, i) { if (hs[i]) td.setAttribute("data-l", hs[i]); if (!td.textContent.trim()) td.classList.add("rcempty"); }); });
    });
    // 「… 하기 - … 하기 -」 처럼 줄표로 이어 쓴 작업 순서 → 번호 단계
    function dashSplit(t) {
      var out = [], cur = "", depth = 0;
      for (var i = 0; i < t.length; i++) {
        var ch = t[i];
        if (ch === "(" || ch === "（") depth++; else if ((ch === ")" || ch === "）") && depth) depth--;
        if (ch === "-" && !depth) {
          // 동작이 끝나는 곳(…하기 - · …주고 - · …에 - · 줄 끝 -)에서만 나눈다 — 「반짝-1호」 「휘핑크림- 에타용」은 그대로
          var bef = cur.replace(/\s+$/, ""), rest = t.slice(i + 1).trim();
          if (!bef) { continue; }
          if (!rest || /(기|고|서|며|요|다|함|음|줌|후|뒤|에|지|면|게|록|\))$/.test(bef)) { out.push(cur); cur = ""; continue; }
        }
        cur += ch;
      }
      out.push(cur);
      return out.map(function (x) { return x.trim(); }).filter(Boolean);
    }
    Array.prototype.slice.call(root.querySelectorAll(".rcb, .rcsec")).forEach(function (box) {
      var kids = Array.prototype.slice.call(box.children), runs = [], run = [];
      kids.forEach(function (k) { if (k.tagName === "P" && !k.className) run.push(k); else { if (run.length) runs.push(run); run = []; } });
      if (run.length) runs.push(run);
      runs.forEach(function (r) {
        var pieces = [], splits = 0;
        r.forEach(function (pp) {
          // 문단 전체가 색 굵은 글씨(사장님 강조)면 그 문단 줄은 모두 강조 줄
          var em = pp.querySelector("b[class], mark"), pWarn = !!(em && /c-(pink|red|orange)|m-(red|pink|orange)/.test(em.className) && em.textContent.trim() === pp.textContent.trim());
          pp.innerHTML.split(/<br\s*\/?>/i).forEach(function (ln) {
            if (!ln.replace(/&nbsp;/g, " ").trim()) return;
            if (pWarn) { var tw0 = document.createElement("div"); tw0.innerHTML = ln; if (tw0.textContent.trim()) pieces.push({ h: esc(tw0.textContent.trim()), warn: true }); return; }
            if (/<\/?(b|mark|u)\b/i.test(ln)) { pieces.push({ h: ln.trim(), warn: /c-(pink|red|orange)|m-(red|pink|orange)/.test(ln) }); return; }
            var tmp = document.createElement("div"); tmp.innerHTML = ln; var parts = dashSplit(tmp.textContent);
            splits += parts.length - 1;
            parts.forEach(function (x) { pieces.push({ t: x.replace(/^[\-+·]\s*/, "") }); });
          });
        });
        if (splits < 2) return;
        var ol = document.createElement("ol"), prev = null; ol.className = "rcsteps";
        pieces.forEach(function (pc) {
          if (pc.t != null && !pc.t) return;
          if (pc.t != null && /^\//.test(pc.t) && prev) { prev.appendChild(document.createTextNode(" " + pc.t)); return; }
          var li = document.createElement("li");
          if (pc.h != null) { li.innerHTML = pc.h; li.className = pc.warn ? "rcwarn" : "rcplain"; }
          else { li.textContent = pc.t; if (/^[*※(（]/.test(pc.t) || /^(테이크|포장)/.test(pc.t) && prev && prev.className === "rctip") li.className = "rctip"; }
          ol.appendChild(li); prev = li;
        });
        r[0].parentNode.insertBefore(ol, r[0]); r.forEach(function (x) { x.remove(); });
      });
    });
    // 회색 짧은 줄(HOT/10oz · ICE /14oz) → 갈래 표시
    Array.prototype.slice.call(root.querySelectorAll("p.rcq")).forEach(function (q) { if (q.textContent.trim().length <= 24) q.className = "rcvar"; });
    // 2) 형광 한 줄짜리 목록(• 에그타르트 파이지) → 소제목
    Array.prototype.slice.call(root.querySelectorAll("ul")).forEach(function (ul) {
      var lis = ul.children; if (!lis.length) return;
      var all = Array.prototype.every.call(lis, function (li) { var mk = li.querySelector("mark"); return mk && li.children.length === 1 && li.textContent.trim() === mk.textContent.trim(); });
      if (!all) return;
      var frag = document.createDocumentFragment();
      Array.prototype.forEach.call(lis, function (li) { var h = document.createElement("div"); h.className = "rcsub"; h.textContent = li.textContent.trim(); frag.appendChild(h); });
      ul.parentNode.replaceChild(frag, ul);
    });
    // 3) 숫자(양 · 온도 · 시간) 강조
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], nd;
    while ((nd = tw.nextNode())) { if (nd.parentNode.closest(".rcing, summary, .rcnum, mark.rcfind")) continue; NUM.lastIndex = 0; if (NUM.test(nd.nodeValue)) nodes.push(nd); }
    nodes.forEach(function (t) {
      var span = document.createElement("span"); span.innerHTML = esc(t.nodeValue).replace(NUM, '<b class="rcnum">$1</b>');
      while (span.firstChild) t.parentNode.insertBefore(span.firstChild, t); t.remove();
    });
  }
  // ── 찾기
  var qEl = document.getElementById("rcQ"), qnEl = document.getElementById("rcQn"), qT = null;
  function strip(h) { var d = document.createElement("div"); d.innerHTML = h || ""; return d.textContent || ""; }
  var txtCache = {};
  function txtOf(k) { if (!(k in txtCache) || txtCache[k][0] !== plain[k]) txtCache[k] = [plain[k], k === "jam" ? strip(plain[k]) : strip(plain[k])]; return txtCache[k][1]; }
  function countIn(k, q) { if (!q || plain[k] == null) return 0; var t = txtOf(k).toLowerCase(), n = 0, i = 0; q = q.toLowerCase(); while ((i = t.indexOf(q, i)) >= 0) { n++; i += q.length; } return n; }
  function find(q) {
    if (!q) { qnEl.textContent = ""; return; }
    var tw = document.createTreeWalker(bodyEl, NodeFilter.SHOW_TEXT, null), nodes = [], nd, ql = q.toLowerCase();
    while ((nd = tw.nextNode())) if (nd.nodeValue.toLowerCase().indexOf(ql) >= 0) nodes.push(nd);
    var first = null, n = 0;
    nodes.forEach(function (t) {
      var v = t.nodeValue, lv = v.toLowerCase(), i = 0, j, frag = document.createDocumentFragment();
      while ((j = lv.indexOf(ql, i)) >= 0) {
        frag.appendChild(document.createTextNode(v.slice(i, j)));
        var mk = document.createElement("mark"); mk.className = "rcfind"; mk.textContent = v.slice(j, j + q.length); frag.appendChild(mk); n++; if (!first) first = mk;
        i = j + q.length;
      }
      frag.appendChild(document.createTextNode(v.slice(i)));
      for (var d = t.parentNode; d && d !== bodyEl; d = d.parentNode) if (d.tagName === "DETAILS") d.open = true;
      t.parentNode.replaceChild(frag, t);
    });
    qnEl.textContent = n ? n + "곳" : "이 묶음엔 없음";
    if (first) first.scrollIntoView({ block: "center" });
  }
  function draw() {
    var q = qEl ? qEl.value.trim() : "";
    navEl.innerHTML = SECS.map(function (s) { var c = q ? countIn(s[0], q) : 0; return '<button type="button" class="rcnb" data-k="' + s[0] + '" aria-pressed="' + (s[0] === cur) + '">' + s[1] + (c ? ' <i class="rcqc">' + c + "</i>" : "") + "</button>"; }).join("");
    whoEl.textContent = "열람 " + (nim(me()) || "?") + " · 외부 유출 · 개인 사용 금지 (법적 대응)";
    toolEl.hidden = me() !== "사장님";
    if (cur === "jam") { drawJam(); find(q); return; }
    var h = plain[cur];
    bodyEl.innerHTML = h ? '<div class="rcsec">' + h + "</div>" : '<p class="rcnone">이 부분은 아직 옮겨진 레시피가 없습니다</p>';
    try { pretty(bodyEl); } catch (e) {}
    find(q);
  }
  if (qEl) qEl.addEventListener("input", function () { clearTimeout(qT); qT = setTimeout(draw, 250); });
  var allBtn = document.getElementById("rcAll"), noneBtn = document.getElementById("rcNone");
  if (allBtn) allBtn.addEventListener("click", function () { bodyEl.querySelectorAll("details").forEach(function (d) { d.open = true; }); });
  if (noneBtn) noneBtn.addEventListener("click", function () { bodyEl.querySelectorAll("details").forEach(function (d) { d.open = false; }); bodyEl.scrollIntoView({ block: "start" }); });
  function jamData() { try { return JSON.parse(plain.jam || "{}") || {}; } catch (e) { return {}; } }
  function drawJam() {
    var d = jamData(), order = (d._order || Object.keys(d)).filter(function (k) { return k.charAt(0) !== "_" && d[k]; });
    Object.keys(d).forEach(function (k) { if (k.charAt(0) !== "_" && order.indexOf(k) < 0) order.push(k); });
    if (order.indexOf(jamSub) < 0) jamSub = order[0];
    var j = d[jamSub] || { uses: [] }, cm = d._common || null, canEdit = me() === "사장님" || me() === "정항아";
    var isJam = (j.kind || "청") === "청";
    function navRow(kind, label) {
      var ks = order.filter(function (k) { return (d[k].kind || "청") === kind; }); if (!ks.length) return "";
      return '<div class="rcjrow"><span class="rcjlab">' + label + "</span>" + ks.map(function (k) { return '<button type="button" class="rcjb" data-j="' + k + '" aria-pressed="' + (k === jamSub) + '">' + esc(d[k].title) + "</button>"; }).join("") + "</div>";
    }
    function ingTable(it) {
      if (!it.ing || !it.ing.length) return "";
      if (it.cols) return '<div class="rctw"><table class="rct rcingt"><tr><th>재료</th>' + it.cols.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr>" +
        it.ing.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td>" + it.cols.map(function (c, ci) { return '<td class="rcamt">' + (r[ci + 1] ? esc(r[ci + 1]) : "") + "</td>"; }).join("") + "</tr>"; }).join("") + "</table></div>";
      return grid(it.ing.map(function (r) { return [r[0], r[1]]; }), it.batch || "", "");
    }
    function list(arr, cls) { return arr && arr.length ? '<ol class="rcsteps">' + arr.map(function (x) { return "<li" + (cls ? ' class="' + cls + '"' : "") + ">" + esc(x) + "</li>"; }).join("") + "</ol>" : ""; }
    var h = '<nav class="rcjn">' + navRow("청", "🫙 청") + navRow("시럽", "🍯 시럽") + "</nav>";
    // 청 공통 + 설탕 계산
    if (isJam && cm) {
      h += '<details class="rcd rcpage rccommon" open><summary>📌 ' + esc(cm.title || "청 담는 기본") + "</summary><div class=\"rcb\">" +
        (cm.facts ? grid(cm.facts, "", "") : "") +
        (cm.minus != null ? '<div class="rccalc"><label>⚖ 과일 무게 <input type="number" inputmode="numeric" id="rcCalcW" placeholder="예) 2000"> g</label><span id="rcCalcOut">→ 설탕 <b>—</b></span></div>' : "") +
        '<div class="rcsub">순서</div>' + list(cm.steps) + list(cm.tips, "rctip") + "</div></details>";
    }
    h += '<div class="rcjitem"><h4 class="rcjt">' + esc(j.title || "") + (j.batch && j.cols ? ' <small>' + esc(j.batch) + "</small>" : "") + "</h4>";
    if (j.ing && j.ing.length) h += '<div class="rcsub">재료</div>' + ingTable(j);
    if (j.prep && j.prep.length) h += '<div class="rcsub">손질 · 준비</div>' + list(j.prep);
    if (j.steps && j.steps.length) h += '<div class="rcsub">만드는 순서</div>' + list(j.steps);
    if (isJam && cm && !(j.steps && j.steps.length)) h += '<p class="rcnone">그다음은 위 「📌 청 담는 기본」 순서대로 (설탕 넣고 → 고무주걱 2개로 자주 젓기 → 마감조가 병에 담아 라벨링)</p>';
    if (!isJam && !(j.steps && j.steps.length)) h += '<p class="rcnone">만드는 순서는 아직 없습니다 · ' + (canEdit ? "아래 「✏ 메모 적기」로 적어 주세요" : "사장님 · 매니저가 적을 예정입니다") + "</p>";
    h += '<div class="rcsub">메모</div>' + (j.how ? '<div class="rchow">' + esc(j.how).replace(/\n/g, "<br>") + "</div>" : '<p class="rcnone">추가 메모 없음</p>') +
      (j.by ? '<p class="rcby">마지막 수정 ' + esc(nim(j.by)) + (j.at ? " · " + esc(j.at) : "") + "</p>" : "") +
      (canEdit ? '<button type="button" class="rced" id="rcJamEd">✏ 메모 적기</button><div class="rcjed" id="rcJamBox" hidden><textarea id="rcJamTa" rows="8" placeholder="예) 보관 · 유통기한 · 바뀐 점"></textarea><button type="button" class="rced prim" id="rcJamSave">저장 (잠가서 저장)</button></div>' : "");
    if ((j.uses || []).length) h += '<div class="rcsub">어디에 쓰나 (레시피에서 모음)</div><ul class="rcuses">' + j.uses.map(function (u) { return "<li><b>" + esc(u.where) + "</b><span>" + u.text + "</span></li>"; }).join("") + "</ul>";
    h += "</div>";
    bodyEl.innerHTML = '<div class="rcsec">' + h + "</div>";
    try { Array.prototype.forEach.call(bodyEl.querySelectorAll(".rcuses span"), function (sp) { var tw = document.createTreeWalker(sp, NodeFilter.SHOW_TEXT, null), ns = [], nd; while ((nd = tw.nextNode())) { NUM.lastIndex = 0; if (NUM.test(nd.nodeValue)) ns.push(nd); } ns.forEach(function (t) { var x = document.createElement("span"); x.innerHTML = esc(t.nodeValue).replace(NUM, '<b class="rcnum">$1</b>'); while (x.firstChild) t.parentNode.insertBefore(x.firstChild, t); t.remove(); }); }); } catch (e) {}
    var cw = document.getElementById("rcCalcW"), co = document.getElementById("rcCalcOut");
    if (cw && co) cw.oninput = function () { var w = parseFloat(cw.value); co.innerHTML = w > 0 ? "→ 설탕 <b>" + Math.max(0, Math.round(w - cm.minus)).toLocaleString() + "g</b>" : "→ 설탕 <b>—</b>"; };
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
