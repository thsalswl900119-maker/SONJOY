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
  var key = null, cur = "egg", jamSub = "grapefruit", plain = {}, histPlain = null, ED = null, edPend = false;
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
    var ho = J(PRE + "hist"); if (ho) jobs.push(dec(k, ho).then(function (t) { histPlain = t; }, function () {}));
    return Promise.all(jobs).then(function () { lockEl.hidden = true; mainEl.hidden = false; say(""); if (ED) { edPend = true; return; } draw(); });
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
    // • 휘핑크림 70g · • 생크림 240g … 처럼 재료만 있는 목록 → 재료표
    Array.prototype.slice.call(root.querySelectorAll("ul")).forEach(function (ul) {
      if (ul.closest("table")) return;
      var lis = Array.prototype.slice.call(ul.children);
      if (lis.length < 2 || lis.some(function (li) { return li.tagName !== "LI" || li.querySelector("ul,ol"); })) return;
      var its = lis.map(function (li) { var r = ingLine(li.textContent); return r && r.one; });
      if (its.some(function (x) { return !x; })) return;
      var w = document.createElement("div"); w.innerHTML = grid(its, "", ""); ul.parentNode.replaceChild(w.firstChild, ul);
    });
    // 묶음 비교표: 「기본 10개 · 기본 2개」 「반짝 · 한판 · 1.5개 …」처럼 분량 제목 + 재료표가 이어지면 → 재료 × 분량 표 하나로
    (function () {
      var SIZE = /(\d+(\.\d+)?\s*(개|판|배합?|L|호|kg|g|인분|통)|한판|반판|반짝|분량|배합|사이즈)/;
      function lab(t) { return t.replace(/\*+/g, "").replace(/^[\s✅•·\-]+|[\s\-]+$/g, "").replace(/\s+/g, " "); }
      function isCap(el) {
        if (!el || !el.tagName || el.classList.contains("rcing")) return false;
        var t = el.textContent.replace(/\u00a0/g, " ").trim(); if (!t || t.length > 60 || !SIZE.test(t)) return false;
        if (/^H[3-6]$/.test(el.tagName)) return true;
        if (el.tagName !== "P" || el.className || el.querySelector("br")) return false;
        // 「**기본 10개 ( 사각 3호)」처럼 형광 · 굵은 글씨 한 줄이나 ** · ✅ 로 시작하면 분량 제목 (재료 줄로 보지 않음)
        var em = el.querySelector("mark, b, u"), whole = em && em.textContent.replace(/\s/g, "").length >= t.replace(/\s/g, "").length - 2;
        return whole || /^[*✅]/.test(t) || !ingLine(t);
      }
      function plainGrid(el) { return el && el.classList && el.classList.contains("rcing") && !el.querySelector(".rcingc"); }
      function capGrid(el) { var c = el && el.classList && el.classList.contains("rcing") && el.querySelector(".rcingc"); return c && SIZE.test(c.textContent) ? c : null; }
      function key(n) { return n.replace(/\([^)]*\)/g, "").replace(/[\s:：]/g, ""); }
      function build(g) {
        if (g.length < 2) return;
        var cols = g.map(function (b) {
          var m = {}, order = [];
          b.grids.forEach(function (gr) { Array.prototype.forEach.call(gr.querySelectorAll(".rcir"), function (r) { var n = r.children[0].textContent.trim(), k = key(n); if (!(k in m)) { m[k] = r.children[1].textContent.trim(); order.push([k, n]); } }); });
          return { label: b.label, m: m, order: order };
        });
        var rows = [], seen = {}, mx = 0;
        cols.forEach(function (c) { mx = Math.max(mx, c.order.length); c.order.forEach(function (o) { if (!seen[o[0]]) { seen[o[0]] = 1; rows.push(o); } }); });
        if (rows.length > mx * 1.6 + 1) return;   // 재료가 너무 다르면 따로 둔다
        var h = '<div class="rcmxw"><table class="rcmx' + (cols.length > 3 ? " many" : "") + '"><thead><tr><th>재료</th>' +
          cols.map(function (c) { return "<th>" + esc(c.label) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          rows.map(function (r) { return "<tr><th>" + esc(r[1]) + "</th>" + cols.map(function (c) { return r[0] in c.m ? "<td>" + esc(c.m[r[0]]) + "</td>" : '<td class="no">—</td>'; }).join("") + "</tr>"; }).join("") +
          "</tbody></table></div>";
        var first = g[0].cap || g[0].grids[0], w = document.createElement("div"); w.innerHTML = h;
        first.parentNode.insertBefore(w.firstChild, first);
        g.forEach(function (b) { if (b.cap) b.cap.remove(); b.grids.forEach(function (x) { x.remove(); }); });
      }
      Array.prototype.slice.call(root.querySelectorAll(".rcb, .rcsec")).forEach(function (box) {
        var kids = Array.prototype.slice.call(box.children), i = 0, groups = [], g = [];
        while (i < kids.length) {
          var k = kids[i], b = null, cg;
          if (isCap(k) && plainGrid(kids[i + 1])) { b = { cap: k, label: lab(k.textContent), grids: [] }; i++; while (plainGrid(kids[i])) { b.grids.push(kids[i]); i++; } }
          else if ((cg = capGrid(k))) { b = { cap: null, label: lab(cg.textContent), grids: [k] }; i++; }
          if (b) { g.push(b); continue; }
          if (g.length) groups.push(g); g = []; i++;
        }
        if (g.length) groups.push(g);
        groups.forEach(build);
      });
    })();
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
    while ((nd = tw.nextNode())) { if (nd.parentNode.closest(".rcing, .rcmx, summary, .rcnum, mark.rcfind")) continue; NUM.lastIndex = 0; if (NUM.test(nd.nodeValue)) nodes.push(nd); }
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
    var h = plain[cur]; if (h != null) h = junk(h);
    bodyEl.innerHTML = h ? '<div class="rcsec">' + h + "</div>" : '<p class="rcnone">이 부분은 아직 옮겨진 레시피가 없습니다</p>';
    // 카드마다 번호(원본 글에서 같은 순서) — 고치기에서 원본의 같은 카드를 찾는 데 쓴다
    Array.prototype.forEach.call(bodyEl.querySelectorAll(".rcsec details, .rcsec div.rccall"), function (el, i) { el.setAttribute("data-rid", i); });
    try { pretty(bodyEl); } catch (e) {}
    if (canEdit() && h != null) edButtons();
    find(q);
  }
  if (qEl) qEl.addEventListener("input", function () { clearTimeout(qT); qT = setTimeout(function () { if (ED) { edPend = true; return; } draw(); }, 250); });
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
    // 시럽 공통 (모든 시럽 끓이는 법)
    var sc = d._scommon || null;
    if (!isJam && sc) h += '<details class="rcd rcpage rccommon" open><summary>📌 ' + esc(sc.title || "시럽 끓이는 기본") + '</summary><div class="rcb"><div class="rcsub">순서</div>' + list(sc.steps) + list(sc.tips, "rctip") + "</div></details>";
    h += '<div class="rcjitem"><h4 class="rcjt">' + esc(j.title || "") + (j.batch && j.cols ? ' <small>' + esc(j.batch) + "</small>" : "") + "</h4>";
    if (j.ing && j.ing.length) h += '<div class="rcsub">재료</div>' + ingTable(j);
    if (j.prep && j.prep.length) h += '<div class="rcsub">손질 · 준비</div>' + list(j.prep);
    if (j.steps && j.steps.length) h += '<div class="rcsub">만드는 순서</div>' + list(j.steps);
    if (isJam && cm && !(j.steps && j.steps.length)) h += '<p class="rcnone">그다음은 위 「📌 청 담는 기본」 순서대로 (설탕 넣고 → 고무주걱 2개로 자주 젓기 → 마감조가 병에 담아 라벨링)</p>';
    if (!isJam && sc) h += '<p class="rcnone">끓이는 법은 위 「📌 ' + esc(sc.title || "시럽 끓이는 기본") + '」 순서대로</p>';
    else if (!isJam && !(j.steps && j.steps.length)) h += '<p class="rcnone">만드는 순서는 아직 없습니다 · ' + (canEdit ? "아래 「✏ 메모 적기」로 적어 주세요" : "사장님 · 매니저가 적을 예정입니다") + "</p>";
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
  // ── ✏ 레시피 직접 고치기 (사장님 · 정항아님) — 카드 하나씩 그 자리에서 고친다
  //    원본 글(잠금 풀린 HTML)의 그 카드만 바꿔 다시 잠가서 저장 · 고치기 전 모습은 「📜 고친 기록」(잠가서 저장)에 남아 되돌릴 수 있다
  //    다른 기기가 그 사이 같은 카드를 고쳤으면 덮지 않고 알려 준다
  function junk(h) { return String(h).replace(/&lt;span color="[a-z_]+"( underline="true")?&gt;/g, ""); }
  function canEdit() { return me() === "사장님" || me() === "정항아"; }
  function rawCards(html) { var d = document.createElement("div"); d.innerHTML = html || ""; return { root: d, list: Array.prototype.slice.call(d.querySelectorAll("details, div.rccall")) }; }
  function bodyOf(el) { if (el.tagName !== "DETAILS") return el; for (var i = 0; i < el.children.length; i++) if (el.children[i].tagName === "DIV" && el.children[i].classList.contains("rcb")) return el.children[i]; return null; }
  function sumOf(el) { for (var i = 0; i < el.children.length; i++) if (el.children[i].tagName === "SUMMARY") return el.children[i]; return null; }
  function edButtons() {
    Array.prototype.forEach.call(bodyEl.querySelectorAll("[data-rid]"), function (el) {
      var b = document.createElement("button"); b.type = "button"; b.className = "rcedb"; b.dataset.rid = el.getAttribute("data-rid"); b.textContent = "✏ 고치기";
      if (el.tagName === "DETAILS") { var bd = bodyOf(el); if (bd) bd.insertBefore(b, bd.firstChild); } else el.appendChild(b);
    });
    var bar = document.createElement("div"); bar.className = "rcedbar";
    bar.innerHTML = '<button type="button" class="rced" data-a="new">＋ 새 카드 추가</button><button type="button" class="rced" data-a="hist">📜 고친 기록</button><span>카드마다 「✏ 고치기」로 글 · 숫자 · 표를 바로 고칩니다 (사장님 · 정항아님)</span>';
    bodyEl.appendChild(bar);
  }
  function clean(node) {
    var OK = { P: 1, BR: 1, B: 1, I: 1, U: 1, MARK: 1, SPAN: 1, UL: 1, OL: 1, LI: 1, TABLE: 1, THEAD: 1, TBODY: 1, TR: 1, TH: 1, TD: 1, H4: 1, H5: 1, DIV: 1, S: 1 };
    var MAP = { STRONG: "B", EM: "I", H1: "H4", H2: "H4", H3: "H4", H6: "H5", STRIKE: "S", DEL: "S" };
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 8) { n.remove(); return; }
      if (n.nodeType !== 1) return;
      if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|LINK|META|IMG|SVG|BUTTON|INPUT|TEXTAREA|SELECT)$/.test(n.tagName)) { n.remove(); return; }
      if (n.classList.contains("rcph")) return;   // 안쪽 카드 자리 (저장할 때 원래 카드로 바꾼다)
      clean(n);
      var tg = MAP[n.tagName] || n.tagName;
      if (tg === "DIV" && !n.classList.contains("rccall")) tg = n.querySelector("p,ul,ol,table,div,h4,h5") ? null : "P";   // 엔터로 생긴 div → 문단
      if (tg === "SPAN" && !n.className) tg = null;
      if (tg === "FONT") tg = null;
      if (!tg || !OK[tg]) { while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n); n.remove(); return; }
      var el = n;
      if (tg !== n.tagName) { el = document.createElement(tg); while (n.firstChild) el.appendChild(n.firstChild); if (n.className) el.className = n.className; n.parentNode.replaceChild(el, n); }
      Array.prototype.slice.call(el.attributes).forEach(function (at) { if (!/^(class|colspan|rowspan|start)$/.test(at.name)) el.removeAttribute(at.name); });
      if (el.getAttribute("class") === "") el.removeAttribute("class");
    });
  }
  function startEdit(rid, isNew) {
    if (ED) { alert("고치던 카드가 있습니다 · 먼저 저장하거나 취소해 주세요"); var ob = bodyEl.querySelector(".rcedbox"); if (ob) ob.scrollIntoView({ block: "center" }); return; }
    var title = "", inner = "", orig = null, kids = [], isCall = false;
    if (isNew) { title = "새 카드"; inner = "<p>여기에 적어 주세요</p>"; }
    else {
      var rc = rawCards(plain[cur]), el = rc.list[rid]; if (!el) { draw(); return; }
      orig = el.outerHTML; isCall = el.tagName !== "DETAILS";
      var bd = bodyOf(el); if (!bd) { alert("이 카드는 모양이 달라서 여기서 고칠 수 없습니다"); return; }
      var sm = isCall ? null : sumOf(el); title = sm ? sm.textContent.trim() : "";
      var copy = bd.cloneNode(true);
      // 안쪽 카드는 자리표로 (안쪽 카드는 그 카드의 「✏ 고치기」로 따로)
      Array.prototype.slice.call(copy.querySelectorAll("details, div.rccall")).forEach(function (k) {
        if (!copy.contains(k)) return;
        var par = k.parentElement.closest("details, div.rccall"); if (par && copy.contains(par)) return;
        var s2 = k.tagName === "DETAILS" ? sumOf(k) : null, ph = document.createElement("div");
        ph.className = "rcph"; ph.setAttribute("contenteditable", "false"); ph.dataset.ph = kids.length;
        ph.textContent = "📁 안쪽 카드 「" + (s2 ? s2.textContent.trim() : "📌 상자") + "」 — 그 카드의 ✏ 고치기로 따로 고쳐요";
        kids.push(k.outerHTML); k.parentNode.replaceChild(ph, k);
      });
      inner = junk(copy.innerHTML);
    }
    ED = { rid: rid, isNew: !!isNew, orig: orig, kids: kids, sec: cur, title: title, isCall: isCall };
    var box = document.createElement("div"); box.className = "rcedbox";
    box.innerHTML = '<div class="rcedh">✏ ' + (isNew ? "새 카드 만들기" : "고치는 중") + ' <small>저장하면 모든 기기에 바로 바뀝니다 · 고치기 전 모습은 「📜 고친 기록」에 남습니다</small></div>' +
      (isCall ? "" : '<label class="rcedl">카드 제목<input type="text" class="rcedt"></label>') +
      '<div class="rcedtool">' +
      '<button type="button" data-c="bold"><b>굵게</b></button><button type="button" data-c="mark">🖍 형광</button><button type="button" data-c="red">🔴 빨간 글씨</button>' +
      '<button type="button" data-c="ul">• 목록</button><button type="button" data-c="ol">1. 번호</button>' +
      '<button type="button" data-c="table">▦ 표 넣기</button><button type="button" data-c="row">＋ 표 줄</button><button type="button" data-c="col">＋ 표 칸</button><button type="button" data-c="delrow">－ 표 줄</button>' +
      '<button type="button" data-c="plain">서식 지우기</button></div>' +
      '<div class="rcedarea rcsec" contenteditable="true"></div>' +
      '<div class="rcedbtns"><button type="button" class="rced prim" data-a="save">✔ 저장 (잠가서 저장)</button><button type="button" class="rced" data-a="cancel">취소</button></div>';
    box.querySelector(".rcedarea").innerHTML = inner;
    var ti = box.querySelector(".rcedt"); if (ti) ti.value = title;
    var at = isNew ? bodyEl.querySelector(".rcedbar") : bodyEl.querySelector('[data-rid="' + rid + '"]');
    if (!at) { ED = null; return; }
    at.parentNode.insertBefore(box, at);
    if (!isNew) { at.hidden = true; ED.hid = at; }
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) {}
    // 위에 붙어 있는 저장 줄에 가리지 않게 조금 더 내려서 보여 준다
    var top = box.getBoundingClientRect().top + window.pageYOffset, hd = 0;
    Array.prototype.forEach.call(document.querySelectorAll("body *"), function (x) { if (hd > 400) return; var cs = getComputedStyle(x); if ((cs.position === "sticky" || cs.position === "fixed") && x.getBoundingClientRect().top <= 1 && x.offsetHeight < 400 && !box.contains(x)) hd = Math.max(hd, x.getBoundingClientRect().bottom); });
    window.scrollTo(0, Math.max(0, top - hd - 12));
  }
  function endEdit(redraw) { var b = bodyEl.querySelector(".rcedbox"); if (ED && ED.hid) ED.hid.hidden = false; if (b) b.remove(); ED = null; if (redraw || edPend) { edPend = false; draw(); } }
  function selIn(area) { var s = window.getSelection(); if (!s.rangeCount) return null; var r = s.getRangeAt(0); return area.contains(r.commonAncestorContainer) ? r : null; }
  function wrapSel(area, tag, cls) {
    var r = selIn(area); if (!r || r.collapsed) { alert("먼저 바꿀 글자를 끌어서 골라 주세요"); return; }
    var el = document.createElement(tag); if (cls) el.className = cls; el.appendChild(r.extractContents()); r.insertNode(el);
  }
  function cellOf(area) { var r = selIn(area); if (!r) return null; var n = r.startContainer; n = n.nodeType === 1 ? n : n.parentNode; return n.closest && n.closest("td, th"); }
  function tool(c, area) {
    area.focus();
    if (c === "bold") document.execCommand("bold");
    else if (c === "mark") wrapSel(area, "mark", "m-orange");
    else if (c === "red") wrapSel(area, "b", "c-pink");
    else if (c === "ul") document.execCommand("insertUnorderedList");
    else if (c === "ol") document.execCommand("insertOrderedList");
    else if (c === "plain") document.execCommand("removeFormat");
    else if (c === "table") document.execCommand("insertHTML", false, '<table class="rct"><tr><th>재료</th><th>양</th></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td></tr></table><p><br></p>');
    else {
      var td = cellOf(area); if (!td) { alert("표 안의 칸을 먼저 눌러 주세요"); return; }
      var tr = td.parentNode, tb = tr.closest("table");
      if (c === "row") { var nr = document.createElement("tr"); Array.prototype.forEach.call(tr.children, function () { var x = document.createElement("td"); x.innerHTML = "&nbsp;"; nr.appendChild(x); }); tr.parentNode.insertBefore(nr, tr.nextSibling); }
      else if (c === "col") { var ci = Array.prototype.indexOf.call(tr.children, td); Array.prototype.forEach.call(tb.querySelectorAll("tr"), function (r2) { var ref = r2.children[ci], x = document.createElement(ref && ref.tagName === "TH" ? "th" : "td"); x.innerHTML = "&nbsp;"; r2.insertBefore(x, ref ? ref.nextSibling : null); }); }
      else if (c === "delrow") { if (tb.querySelectorAll("tr").length <= 1) return; if (confirm("이 줄을 지울까요?")) tr.remove(); }
    }
  }
  function histList() { try { var a = JSON.parse(histPlain || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function writeSec(sec, html, entry) {
    // 고친 섹션 + 고친 기록(최근 40개)을 잠가서 저장 → sync가 서버로 (레시피는 기기 저장소가 아니라 메모리)
    var hl = histList(); hl.push(entry); if (hl.length > 40) hl = hl.slice(hl.length - 40);
    var ht = JSON.stringify(hl);
    return Promise.all([encr(key, html), encr(key, ht)]).then(function (os) {
      localStorage.setItem(PRE + sec, JSON.stringify(os[0])); localStorage.setItem(PRE + "hist", JSON.stringify(os[1]));
      plain[sec] = html; histPlain = ht;
    });
  }
  function stamp() { var n = new Date(); return (n.getMonth() + 1) + "/" + n.getDate() + " " + String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"); }
  function saveEdit() {
    var box = bodyEl.querySelector(".rcedbox"); if (!ED || !box || !key) return;
    var area = box.querySelector(".rcedarea"), tmp = document.createElement("div"); tmp.innerHTML = area.innerHTML; clean(tmp);
    // 자리표 → 안쪽 카드 원래대로 · 자리표를 지웠어도 안쪽 카드는 맨 아래에 다시 붙인다 (글이 사라지지 않게)
    var used = {};
    Array.prototype.slice.call(tmp.querySelectorAll(".rcph")).forEach(function (ph) { var i = ph.dataset.ph; if (ED.kids[i] == null || used[i]) { ph.remove(); return; } used[i] = 1; var w = document.createElement("div"); w.innerHTML = ED.kids[i]; ph.parentNode.replaceChild(w.firstChild, ph); });
    ED.kids.forEach(function (k, i) { if (!used[i]) { var w = document.createElement("div"); w.innerHTML = k; tmp.appendChild(w.firstChild); } });
    if (!tmp.textContent.trim() && !confirm("내용이 비어 있습니다. 그대로 저장할까요?")) return;
    var ti = box.querySelector(".rcedt"), title = ti ? ti.value.trim() || ED.title || "제목 없음" : "";
    var rc = rawCards(plain[ED.sec]), node;
    if (ED.isNew) {
      node = document.createElement("details"); node.className = "rcd"; node.innerHTML = "<summary></summary>"; node.firstChild.textContent = title;
      var nb = document.createElement("div"); nb.className = "rcb"; nb.innerHTML = tmp.innerHTML; node.appendChild(nb);
      rc.root.appendChild(node);
    } else {
      var el = rc.list[ED.rid];
      if (!el || el.outerHTML !== ED.orig) { alert("그 사이 다른 기기에서 이 카드가 바뀌었습니다 · 고친 글은 아래 칸에 그대로 있으니 복사해 두고 「취소」 → 다시 「✏ 고치기」 해 주세요"); return; }
      node = el.cloneNode(false); node.innerHTML = el.innerHTML;
      var bd = bodyOf(node); bd.innerHTML = tmp.innerHTML;
      var sm = ED.isCall ? null : sumOf(node);
      if (sm && title !== ED.title) sm.textContent = title;
      el.parentNode.replaceChild(node, el);
    }
    var html = rc.root.innerHTML, entry = { s: ED.sec, t: ED.isCall ? "📌 맨 위 상자" : title, b: ED.orig || "", a: node.outerHTML, by: me(), at: stamp(), n: ED.isNew ? 1 : 0 };
    var btn = box.querySelector('[data-a="save"]'); btn.disabled = true; btn.textContent = "저장 중…";
    writeSec(ED.sec, html, entry).then(function () { endEdit(true); say("✔ 저장했습니다 · 모든 기기에 바로 바뀝니다"); setTimeout(function () { say(""); }, 6000); }, function (e) { btn.disabled = false; btn.textContent = "✔ 저장 (잠가서 저장)"; alert("저장하지 못했습니다 (" + (e && e.message || e) + ")"); });
  }
  function showHist() {
    var old = bodyEl.querySelector(".rchist"); if (old) { old.remove(); return; }
    var hl = histList().map(function (x, i) { x.i = i; return x; }).filter(function (x) { return x.s === cur; }).reverse();
    var box = document.createElement("div"); box.className = "rchist";
    box.innerHTML = '<div class="rcsub">📜 고친 기록 · 이 묶음 (최근 것부터)</div>' + (hl.length ? hl.map(function (x) {
      return '<div class="rchi"><b>' + esc(x.t) + '</b> <span>' + esc(nim(x.by)) + " · " + esc(x.at) + (x.n ? " · 새 카드" : x.r ? " · 되돌림" : "") + '</span>' +
        (x.b ? '<button type="button" class="rced" data-hv="' + x.i + '">고치기 전 보기</button><button type="button" class="rced" data-hr="' + x.i + '">↩ 이 전 모습으로 되돌리기</button>' : "") + '<div class="rchv" hidden></div></div>';
    }).join("") : '<p class="rcnone">아직 이 묶음에서 고친 기록이 없습니다</p>');
    var bar = bodyEl.querySelector(".rcedbar"); bar.parentNode.insertBefore(box, bar.nextSibling);
  }
  function histAct(b) {
    var hl = histList(), x;
    if (b.dataset.hv != null) {
      x = hl[+b.dataset.hv]; var v = b.parentNode.querySelector(".rchv"); if (!x || !v) return;
      if (v.hidden) { v.innerHTML = '<div class="rcsec">' + x.b + "</div>"; Array.prototype.forEach.call(v.querySelectorAll("details"), function (d) { d.open = true; }); try { pretty(v); } catch (e) {} }
      v.hidden = !v.hidden; return;
    }
    x = hl[+b.dataset.hr]; if (!x || !x.b) return;
    if (ED) { alert("고치던 카드를 먼저 저장하거나 취소해 주세요"); return; }
    var rc = rawCards(plain[x.s]), el = rc.list.filter(function (y) { return y.outerHTML === x.a; })[0];
    if (!el) { alert("그 뒤에 이 카드를 또 고쳐서 바로 되돌릴 수 없습니다 · 「고치기 전 보기」를 보고 ✏ 고치기로 직접 고쳐 주세요"); return; }
    if (!confirm("「" + x.t + "」을(를) " + x.at + " 고치기 전 모습으로 되돌릴까요?")) return;
    var w = document.createElement("div"); w.innerHTML = x.b; var nb = w.firstChild; el.parentNode.replaceChild(nb, el);
    writeSec(x.s, rc.root.innerHTML, { s: x.s, t: x.t, b: x.a, a: nb.outerHTML, by: me(), at: stamp(), r: 1 }).then(function () { draw(); say("↩ 되돌렸습니다"); });
  }
  bodyEl.addEventListener("click", function (e) {
    var t0 = e.target.closest ? e.target : e.target.parentNode;
    var eb = t0.closest(".rcedb"); if (eb) { e.preventDefault(); startEdit(+eb.dataset.rid); return; }
    var tb = t0.closest(".rcedtool button"); if (tb) { e.preventDefault(); tool(tb.dataset.c, bodyEl.querySelector(".rcedarea")); return; }
    var ab = t0.closest("[data-a]");
    if (ab && ab.closest(".rcedbox")) { if (ab.dataset.a === "save") saveEdit(); else if (confirm("고친 것을 버리고 닫을까요?")) endEdit(false); return; }
    if (ab && ab.closest(".rcedbar")) { if (ab.dataset.a === "new") startEdit(-1, true); else showHist(); return; }
    var hb = t0.closest("[data-hv],[data-hr]"); if (hb) { histAct(hb); return; }
  });
  // 붙여넣기는 글자만 (다른 곳 서식 · 색이 딸려오지 않게)
  bodyEl.addEventListener("paste", function (e) {
    if (!e.target.closest || !e.target.closest(".rcedarea")) return;
    e.preventDefault(); var tx = (e.clipboardData || window.clipboardData).getData("text/plain") || "";
    document.execCommand("insertText", false, tx);
  });
  // 고치는 중 이 화면을 떠나면 경고
  window.addEventListener("beforeunload", function (e) { if (ED) { e.preventDefault(); e.returnValue = ""; } });
  navEl.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".rcnb"); if (!b) return; if (ED && !confirm("고치던 카드가 저장되지 않았습니다. 다른 묶음으로 갈까요?")) return; if (ED) endEdit(false); cur = b.dataset.k; draw(); bodyEl.scrollIntoView({ block: "nearest" }); });
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
          if (histPlain != null) encr(k2, histPlain).then(function (o) { try { localStorage.setItem(PRE + "hist", JSON.stringify(o)); } catch (e) {} });
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
  window.addEventListener("cs:me", function () { if (ED) { edPend = true; return; } draw(); });
  auto();
})();
