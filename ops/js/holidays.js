  // 공휴일 — 설·추석·부처님오신날은 음력이라 해마다 다르다 (2026~2029 · 대체공휴일 포함)
  window.__CS_HOL = {
    "2026-01-01":"신정","2026-02-16":"설날 연휴","2026-02-17":"설날","2026-02-18":"설날 연휴","2026-03-01":"삼일절","2026-03-02":"대체공휴일","2026-05-05":"어린이날","2026-05-24":"부처님오신날","2026-05-25":"대체공휴일","2026-06-03":"지방선거","2026-06-06":"현충일","2026-08-15":"광복절","2026-08-17":"대체공휴일","2026-09-24":"추석 연휴","2026-09-25":"추석","2026-09-26":"추석 연휴","2026-10-03":"개천절","2026-10-05":"대체공휴일","2026-10-09":"한글날","2026-12-25":"성탄절",
    "2027-01-01":"신정","2027-02-06":"설날 연휴","2027-02-07":"설날","2027-02-08":"설날 연휴","2027-02-09":"대체공휴일","2027-03-01":"삼일절","2027-05-05":"어린이날","2027-05-13":"부처님오신날","2027-06-06":"현충일","2027-08-15":"광복절","2027-08-16":"대체공휴일","2027-09-14":"추석 연휴","2027-09-15":"추석","2027-09-16":"추석 연휴","2027-10-03":"개천절","2027-10-04":"대체공휴일","2027-10-09":"한글날","2027-10-11":"대체공휴일","2027-12-25":"성탄절",
    "2028-01-01":"신정","2028-01-26":"설날 연휴","2028-01-27":"설날","2028-01-28":"설날 연휴","2028-03-01":"삼일절","2028-05-02":"부처님오신날","2028-05-05":"어린이날","2028-06-06":"현충일","2028-08-15":"광복절","2028-10-02":"추석 연휴","2028-10-03":"추석 · 개천절","2028-10-04":"추석 연휴","2028-10-05":"대체공휴일","2028-10-09":"한글날","2028-12-25":"성탄절",
    "2029-01-01":"신정","2029-02-12":"설날 연휴","2029-02-13":"설날","2029-02-14":"설날 연휴","2029-03-01":"삼일절","2029-05-05":"어린이날","2029-05-07":"대체공휴일","2029-05-20":"부처님오신날","2029-05-21":"대체공휴일","2029-06-06":"현충일","2029-08-15":"광복절","2029-09-21":"추석 연휴","2029-09-22":"추석","2029-09-23":"추석 연휴","2029-09-24":"대체공휴일","2029-10-03":"개천절","2029-10-09":"한글날","2029-12-25":"성탄절"
  };
  // 매일 자동 백업 — 이 컴퓨터에 하루 한 번 모든 내용을 통째로 남긴다 (공유 안 함 · 7일 보관)
  (function () {
    var PRE = "cafesui.ui.snap.";
    function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
    function skip(k) { return k.indexOf("cafesui.") !== 0 || /^cafesui\.(ui\..*|me|unlocked|device|syncstate)$/.test(k); }
    function dump() {
      var o = {};
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (!skip(k)) o[k] = localStorage.getItem(k); } } catch (e) {}
      return o;
    }
    function dates() {
      var out = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(PRE) === 0) out.push(k.slice(PRE.length)); } } catch (e) {}
      return out.sort().reverse();
    }
    function take() {
      try {
        var t = today();
        if (localStorage.getItem(PRE + t)) return;
        var o = dump(); if (!Object.keys(o).length) return;
        localStorage.setItem(PRE + t, JSON.stringify(o));
        dates().slice(7).forEach(function (d) { localStorage.removeItem(PRE + d); });
      } catch (e) {}
    }
    setTimeout(take, 3000);                      // 화면이 다 열리고(다른 컴퓨터 내용까지 받은 뒤) 남긴다
    var sel = document.getElementById("bkSnapSel"), msgEl = document.getElementById("bkSnapMsg");
    function fillSel() {
      if (!sel) return;
      var ds = dates();
      sel.innerHTML = ds.length ? ds.map(function (d) { return '<option value="' + d + '">' + d + "</option>"; }).join("") : '<option value="">아직 없음</option>';
    }
    fillSel(); setTimeout(fillSel, 3500);
    function emptier(v) { return v == null || !String(v).trim() || String(v).trim() === "{}" || String(v).trim() === "[]"; }
    function fillFrom(d) {
      var snap = {}; try { snap = JSON.parse(localStorage.getItem(PRE + d) || "{}") || {}; } catch (e) { return 0; }
      var n = 0;
      Object.keys(snap).forEach(function (k) {
        var cur = null; try { cur = localStorage.getItem(k); } catch (e) {}
        if (emptier(cur)) { try { localStorage.setItem(k, snap[k]); n++; } catch (e) {} return; }
        // 둘 다 JSON 객체면: 지금 비어 있는 칸만 백업 값으로 채운다 (있는 값은 절대 안 건드림)
        var a = null, b = null;
        try { a = JSON.parse(cur); b = JSON.parse(snap[k]); } catch (e) { return; }
        if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) || Array.isArray(b)) return;
        var added = false;
        Object.keys(b).forEach(function (f) {
          if (f === "_by") return;
          var have = a[f];
          var bv = b[f];
          var haveEmpty = have == null || (typeof have === "string" && !have.trim()) || (typeof have === "object" && have && !Object.keys(have).length);
          var bvFull = !(bv == null || (typeof bv === "string" && !bv.trim()) || (typeof bv === "object" && bv && !Object.keys(bv).length));
          if (haveEmpty && bvFull) { a[f] = bv; added = true; }
        });
        if (added) { try { localStorage.setItem(k, JSON.stringify(a)); n++; } catch (e) {} }
      });
      return n;
    }
    var fb = document.getElementById("bkSnapFill"), cb = document.getElementById("bkSnapCopy");
    if (fb) fb.addEventListener("click", function () {
      var d = sel && sel.value; if (!d) return;
      if (!window.confirm(d + " 복사본으로, 지금 비어 있는 칸만 채울까요? (있는 내용은 그대로 둡니다)")) return;
      var n = fillFrom(d);
      if (msgEl) msgEl.textContent = n ? n + "곳을 채웠습니다 · 화면을 새로 읽습니다" : "채울 것이 없습니다 (지금 내용이 더 많거나 같습니다)";
      if (n) setTimeout(function () { location.reload(); }, 900);
    });
    if (cb) cb.addEventListener("click", function () {
      var d = sel && sel.value; if (!d) return;
      var txt = localStorage.getItem(PRE + d) || "";
      function done() { if (msgEl) msgEl.textContent = "복사했습니다 · 톡방이나 메모장에 붙여 두세요"; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { window.prompt("복사해서 보관하세요", txt); });
      else window.prompt("복사해서 보관하세요", txt);
    });
    window.__CS_SNAP = take;
  })();
  // 독서나눔 — cafesui.books = { items: [{id, title, author, summary, by, t, resp: {이름: {feel, apply, rec, t}}}] } (최신이 앞)
  (function () {
    var KEY = "cafesui.books";
    var listEl = document.getElementById("rdList"); if (!listEl) return;
    var addBtn = document.getElementById("rdAdd"), msgEl = document.getElementById("rdMsg");
    var STAFF = ["정항아", "박혜빈", "이해선"];
    var WHOC = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
    var MGR = ["사장님", "정항아"];   // 필독서 · 요약을 올리고 고칠 수 있는 사람
    function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
    function isMgr() { return MGR.indexOf(me()) >= 0; }
    function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); return (o && o.items) ? o : { items: [] }; } catch (e) { return { items: [] }; } }
    var data = load(), saveT = null;
    function flush() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} if (msgEl) msgEl.textContent = "저장됨"; }
    function save() { clearTimeout(saveT); saveT = setTimeout(function () { saveT = null; flush(); }, 400); }
    (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (saveT) { clearTimeout(saveT); saveT = null; flush(); } });
    function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function when(t) { if (!t) return ""; var d = new Date(t); return d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate(); }
    function lines(v) { return String(v || "").split(/\n/).map(function (x) { return x.trim(); }).filter(Boolean).length; }
    function cnt(n, need) { return '<span class="cnt ' + (n >= need ? "ok" : n ? "no" : "") + '">' + n + " / " + need + "</span>"; }
    function done(r) { return r && lines(r.feel) >= 3 && lines(r.apply) >= 3 && String(r.rec || "").trim(); }
    function ro(v, ph) { return v && String(v).trim() ? '<div class="rdro">' + esc(v) + "</div>" : '<div class="rdro empty">' + esc(ph) + "</div>"; }
    function render() {
      var items = data.items.slice().sort(function (a, b) { return (b.t0 || b.t || 0) - (a.t0 || a.t || 0); });
      if (!items.length) { listEl.innerHTML = '<div class="bkgempty">아직 올린 책이 없습니다 · ' + (isMgr() ? "「＋ 새 필독서 올리기」로 첫 책을 올려 보세요" : "사장님이 필독서를 올리면 여기에 보입니다") + "</div>"; return; }
      var my = me();
      listEl.innerHTML = items.map(function (it, idx) {
        var cur = idx === 0, mgr = isMgr();
        var head = mgr
          ? '<div class="rdhead"><input type="text" class="dinp" data-f="title" value="' + esc(it.title) + '" placeholder="책 제목">' +
            '<input type="text" class="dinp au" data-f="author" value="' + esc(it.author) + '" placeholder="지은이 · 출판사">' +
            '<button type="button" class="wsmini rddel">이 책 지우기</button></div>'
          : '<div class="rdhead"><div style="font-family:var(--serif);font-weight:700;font-size:17px">' + (esc(it.title) || "제목 없음") + '</div><div style="font-size:13.5px;color:var(--muted)">' + esc(it.author) + "</div><span></span></div>";
        var sum = '<div class="rdsum"><h4><b>📌 요약본</b>' + (it.by ? esc(it.by) + " 작성" : "사장님 작성") + (it.t ? " · " + when(it.t) : "") + "</h4>" +
          (mgr ? '<textarea data-f="summary" class="' + (WHOC[it.by] || "") + '" placeholder="이 책의 핵심을 요약해 주세요 — 왜 이 책인지 · 꼭 봐야 할 장 · 우리 카페와 연결되는 부분">' + esc(it.summary) + "</textarea>"
               : ro(it.summary, "아직 요약본이 없습니다"));
        sum += "</div>";
        var people = '<div class="rdpeople">' + STAFF.map(function (nm) {
          var r = (it.resp || {})[nm] || {}, mine = my === nm, can = mine || my === "사장님";
          var st = done(r) ? '<span class="st ok">작성 완료</span>' : '<span class="st">' + (r.feel || r.apply || r.rec ? "작성 중" : "아직") + "</span>";
          var h = '<div class="rdp ' + (WHOC[nm] || "") + (mine ? " mine" : "") + '" data-n="' + nm + '"><div class="who">' + esc(nm) + st + (mine ? '<span class="st me">내 칸</span>' : "") + "</div>";
          h += '<div class="fld"><h4><b>느낀 점</b>3줄 이상' + cnt(lines(r.feel), 3) + "</h4>" +
            (can ? '<textarea data-f="feel" placeholder="한 줄에 하나씩 · 인상 깊었던 문장 · 나와 다른 생각 · 반성한 점">' + esc(r.feel) + "</textarea>" : ro(r.feel, "아직 안 적음")) + "</div>";
          h += '<div class="fld"><h4><b>카페에 적용해볼 것</b>3가지 이상' + cnt(lines(r.apply), 3) + "</h4>" +
            (can ? '<textarea data-f="apply" placeholder="한 줄에 하나씩 · 언제 · 무엇을 · 어떻게 (예: 손님 나갈 때 눈 맞추고 인사 — 이번 주부터)">' + esc(r.apply) + "</textarea>" : ro(r.apply, "아직 안 적음")) + "</div>";
          h += '<div class="fld"><h4><b>추천하는 도서</b>1권' + cnt(String(r.rec || "").trim() ? 1 : 0, 1) + "</h4>" +
            (can ? '<input type="text" data-f="rec" value="' + esc(r.rec) + '" placeholder="책 제목 · 왜 추천하는지 한 줄">' : ro(r.rec, "아직 안 적음")) + "</div>";
          if (r.t) h += '<div style="font-size:11.5px;color:var(--muted);font-family:var(--mono)">마지막 수정 ' + when(r.t) + "</div>";
          return h + "</div>";
        }).join("") + "</div>";
        var doneN = STAFF.filter(function (nm) { return done((it.resp || {})[nm]); }).length;
        var foot = '<div class="rdfoot"><span>작성 완료 ' + doneN + " / " + STAFF.length + "명</span><span>" + (cur ? "지금 읽는 책" : "지난 책") + "</span></div>";
        return '<details class="rdbook' + (cur ? " cur" : "") + '"' + (cur ? " open" : "") + ' data-id="' + it.id + '"><summary>' +
          (cur ? '<span class="tag">이달의 필독서</span>' : "") + "<span>" + (esc(it.title) || "제목 없음") + "</span><span class=\"dt\">" + when(it.t0 || it.t) + " · 완료 " + doneN + "/" + STAFF.length + "</span></summary>" +
          head + sum + people + foot + "</details>";
      }).join("");
    }
    listEl.addEventListener("input", function (e) {
      var book = e.target.closest(".rdbook"); if (!book) return;
      var it = data.items.find(function (x) { return x.id === book.dataset.id; }); if (!it) return;
      var f = e.target.dataset.f; if (!f) return;
      var p = e.target.closest(".rdp");
      if (p) {
        var nm = p.dataset.n; it.resp = it.resp || {}; var r = it.resp[nm] = it.resp[nm] || {};
        r[f] = e.target.value; r.t = Date.now();
        var h4 = e.target.closest(".fld").querySelector(".cnt");
        if (h4) { var n = f === "rec" ? (e.target.value.trim() ? 1 : 0) : lines(e.target.value), need = f === "rec" ? 1 : 3; h4.textContent = n + " / " + need; h4.className = "cnt " + (n >= need ? "ok" : n ? "no" : ""); }
      } else {
        it[f] = e.target.value; it.t = Date.now(); if (!it.by) it.by = me();
      }
      save();
    });
    listEl.addEventListener("focusout", function (e) {
      // 칸을 벗어나면 「작성 완료」 표시와 요약 등을 다시 그린다 (쓰는 중에는 안 건드림)
      setTimeout(function () { var a = document.activeElement; if (a && listEl.contains(a) && a.dataset && a.dataset.f) return; if (saveT) { clearTimeout(saveT); saveT = null; flush(); } render(); }, 50);
    });
    listEl.addEventListener("click", function (e) {
      if (!e.target.classList.contains("rddel")) return;
      var book = e.target.closest(".rdbook"); var it = data.items.find(function (x) { return x.id === book.dataset.id; }); if (!it) return;
      if (!window.confirm("「" + (it.title || "제목 없음") + "」 책과 직원들이 적은 내용을 전부 지울까요? 지우면 되돌릴 수 없습니다.")) return;
      data.items = data.items.filter(function (x) { return x !== it; }); flush(); render();
    });
    if (addBtn) addBtn.addEventListener("click", function () {
      if (!isMgr()) { alert("필독서는 사장님(또는 정항아 매니저)이 올립니다. 위에서 이름을 바꿔 주세요."); return; }
      var it = { id: "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title: "", author: "", summary: "", by: me(), t: Date.now(), t0: Date.now(), resp: {} };
      data.items.unshift(it); flush(); render();
      var f = listEl.querySelector('.rdbook[data-id="' + it.id + '"] input[data-f="title"]'); if (f) f.focus();
    });
    window.addEventListener("cs:remote", function (e) {
      if (!e.detail || (e.detail.keys || []).indexOf(KEY) < 0) return;
      var a = document.activeElement; if (a && listEl.contains(a)) return;
      data = load(); render();
    });
    window.addEventListener("cs:me", render);
    render();
  })();
  // 일지 — 메모칸은 쓰는 만큼 늘어나고, 묶음 제목에 몇 칸 적었는지 보인다
  (function () {
    var grid = document.querySelector("#tp4 .memogrid"); if (!grid) return;
    function grow(t) { if (t.tagName !== "TEXTAREA") return; var mh = parseFloat(getComputedStyle(t).minHeight) || 33; t.style.height = mh + "px"; t.style.height = Math.max(mh, t.scrollHeight + 2) + "px"; }
    function count() {
      grid.querySelectorAll(".msec").forEach(function (sec) {
        var req = sec.querySelectorAll(".mrow2:not(.opt) .lgin"), opt = sec.querySelectorAll(".mrow2.opt .lgin"), n = 0, m = 0;
        req.forEach(function (i) { if (i.value.trim()) n++; });
        opt.forEach(function (i) { if (i.value.trim()) m++; });
        var c = sec.querySelector(".mcnt");
        if (c) {
          var t = req.length ? "필수 " + n + " / " + req.length : "";
          c.textContent = t; c.classList.toggle("on", req.length ? n >= req.length : m > 0); c.classList.toggle("no", req.length > 0 && n < req.length && n > 0);
        }
      });
    }
    // 영업시간 — 날짜에 맞춰 비어 있으면 채운다 (평일 9:30–18:30 · 토요일 10:30–17:00 · 평일 빨간날 9:30–17:00 · 일요일 정기휴무)
    function hoursFor(d) {
      if (!d) return "";
      var wd = new Date(d + "T00:00:00").getDay(), hol = (window.__CS_HOL || {})[d];
      if (wd === 0) return "정기휴무";
      if (wd === 6) return "10:30–17:00";
      if (hol) return "9:30–17:00";
      return "9:30–18:30";
    }
    function fillHours() {
      var el = grid.querySelector('[data-k="lf143"]'), de = document.getElementById("lgDate");
      if (!el || !de) return;
      if (!el.value.trim()) { el.value = hoursFor(de.value); el.classList.toggle("filled", !!el.value); }
    }
    function all() { grid.querySelectorAll("textarea.lgin").forEach(grow); fillHours(); count(); }
    // 표시 버튼 — 사장님 지시사항 · 인계사항 · 직원들에게 알릴 것 · 그 외 메모: ⭐ 매우 중요(줄 앞 ★) · 🔴 중요(**글**) · 밑줄(__글__)
    function markBar(ta, compact) {
      var bar = document.createElement("div"); bar.className = "bossbar" + (compact ? " mini" : "");
      bar.innerHTML = '<button type="button" class="wsmini" data-act="star">⭐ 매우 중요</button><button type="button" class="wsmini" data-act="imp">🔴 중요</button><button type="button" class="wsmini" data-act="und"><u>밑줄</u></button>' +
        (compact ? '<button type="button" class="wsmini lnbtn" data-act="time" title="맨 아래에 지금 시각으로 새 줄을 엽니다">🕐 새 줄</button><button type="button" class="wsmini lnbtn" data-act="split" title="「/」로 이어 쓴 글을 한 줄씩 나눕니다">✂ / 줄 나누기</button>' : "") +
        (compact ? "" : '<span>⭐는 지금 줄 앞에 <b>★</b> (노란 바탕 빨간 글씨) · 글을 드래그해 고르고 누르면 <b>**이렇게**</b>는 빨간 글씨, <u>__이렇게__</u>는 밑줄</span>');
      // 좁은 칸(항목 이름 | 입력칸)은 버튼을 항목 이름 아래에 둔다
      if (compact) { var lab = ta.closest(".mrow2").querySelector(".mlab"); lab.appendChild(bar); ta.closest(".mrow2").classList.add("mk"); }
      else ta.parentNode.insertBefore(bar, ta);
      bar.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-act]"); if (!btn) return;
        var act = btn.dataset.act, a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
        if (act === "split") {
          if (!window.__CS_LOG_SPLIT) return;
          if (btn.dataset.undo) { window.__CS_LOG_SPLIT(ta, true); delete btn.dataset.undo; btn.textContent = "✂ / 줄 나누기"; return; }
          if (!v.trim()) { alert("나눌 글이 아직 없습니다"); return; }
          if (!window.__CS_LOG_SPLIT(ta)) { alert("나눌 「/」가 없습니다 · 이미 한 줄씩 나뉘어 있어요"); return; }
          btn.dataset.undo = "1"; btn.textContent = "↩ 나누기 취소";
          ta.addEventListener("input", function once() { ta.removeEventListener("input", once); delete btn.dataset.undo; btn.textContent = "✂ / 줄 나누기"; });
          return;
        }
        if (act === "time") {
          var d = new Date(), hm = d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0") + " ";
          var nv = v.replace(/\s+$/, ""); nv = (nv ? nv + "\n" : "") + hm;
          ta.value = nv; ta.setSelectionRange(nv.length, nv.length);
          ta.focus(); ta.dispatchEvent(new Event("input", { bubbles: true }));
          ta.scrollTop = ta.scrollHeight;
          return;
        }
        if (act === "star") {
          var ls = v.lastIndexOf("\n", a - 1) + 1, le = v.indexOf("\n", ls); if (le < 0) le = v.length;
          var line = v.slice(ls, le);
          var nl = /^\s*[★⭐]/.test(line) ? line.replace(/^\s*[★⭐]\s*/, "") : "★ " + line.replace(/^\s*[!！]\s*/, "");
          ta.value = v.slice(0, ls) + nl + v.slice(le); ta.setSelectionRange(ls + nl.length, ls + nl.length);
        } else if (act === "und") {
          if (b <= a) { alert("밑줄 칠 글을 먼저 드래그해서 골라 주세요"); ta.focus(); return; }
          var sel = v.slice(a, b), al = /^__[\s\S]*__$/.test(sel), rep = al ? sel.slice(2, -2) : "__" + sel + "__";
          ta.value = v.slice(0, a) + rep + v.slice(b); ta.setSelectionRange(a, a + rep.length);
        } else {
          if (b > a) {
            var sel2 = v.slice(a, b), al2 = /^\*\*[\s\S]*\*\*$/.test(sel2), rep2 = al2 ? sel2.slice(2, -2) : "**" + sel2 + "**";
            ta.value = v.slice(0, a) + rep2 + v.slice(b); ta.setSelectionRange(a, a + rep2.length);
          } else {
            var ls2 = v.lastIndexOf("\n", a - 1) + 1, le2 = v.indexOf("\n", ls2); if (le2 < 0) le2 = v.length;
            var line2 = v.slice(ls2, le2);
            var nl2 = /^\s*[!！]/.test(line2) ? line2.replace(/^\s*[!！]\s*/, "") : "! " + line2;
            ta.value = v.slice(0, ls2) + nl2 + v.slice(le2); ta.setSelectionRange(ls2 + nl2.length, ls2 + nl2.length);
          }
        }
        ta.focus(); ta.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    grid.querySelectorAll(".mrow2.boss textarea, .mrow2.para textarea").forEach(function (ta) { markBar(ta); });
    // 매장 · 이슈 · 생산·재고의 여러 줄 칸에도 중요 표시
    grid.querySelectorAll(".mrow2:not(.boss):not(.para) textarea.lgin").forEach(function (ta) { markBar(ta, true); });
    var cntT = null; grid.addEventListener("input", function (e) { grow(e.target); clearTimeout(cntT); cntT = setTimeout(count, 300); });
    document.addEventListener("cs:log-loaded", all);
    var dateEl = document.getElementById("lgDate");
    if (dateEl) dateEl.addEventListener("change", function () { setTimeout(all, 50); });
    ["lgPrev", "lgNext", "lgToday"].forEach(function (id) { var b = document.getElementById(id); if (b) b.addEventListener("click", function () { setTimeout(all, 50); }); });
    window.addEventListener("cs:remote", function () { setTimeout(all, 100); });
    setTimeout(all, 0); setTimeout(all, 600);
    var tab = document.querySelector('.tab[data-p="tp4"]'); if (tab) tab.addEventListener("click", function () { setTimeout(all, 50); });
  })();
  // 제과제빵 — 레시피 · 제조 기준 카드. cafesui.baking = { items: [{id, cat, title, body, by, t}] }
  (function () {
    var KEY = "cafesui.baking";
    var listEl = document.getElementById("bkgList"); if (!listEl) return;
    var addBtn = document.getElementById("bkgAdd"), qEl = document.getElementById("bkgQ"), msgEl = document.getElementById("bkgMsg");
    var CATS = ["케이크", "에그타르트", "빙수", "음료", "구움과자", "과일 손질", "포장", "기타"];
    var WHOC = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
    function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
    function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}"); return (o && o.items) ? o : { items: [] }; } catch (e) { return { items: [] }; } }
    var data = load();
    var saveT = null;
    function save() {
      clearTimeout(saveT);
      saveT = setTimeout(function () { saveT = null; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} if (msgEl) msgEl.textContent = "저장됨"; }, 400);
    }
    (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (saveT) { clearTimeout(saveT); saveT = null; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {} } });
    function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function when(t) { if (!t) return ""; var d = new Date(t); return (d.getMonth() + 1) + "/" + d.getDate(); }
    var openId = null;
    function render() {
      var q = (qEl && qEl.value || "").trim().toLowerCase();
      var items = data.items.filter(function (it) { return !q || (it.title + " " + it.body + " " + (it.cat || "")).toLowerCase().indexOf(q) >= 0; });
      if (!items.length) { listEl.innerHTML = '<div class="bkgempty">' + (data.items.length ? "찾는 항목이 없습니다" : "아직 항목이 없습니다 · 「＋ 항목 추가」로 첫 레시피를 적어 보세요") + "</div>"; return; }
      // 분류 순서대로, 같은 분류 안에서는 제목 순
      items.sort(function (a, b) { var ca = CATS.indexOf(a.cat || "기타"), cb = CATS.indexOf(b.cat || "기타"); if (ca !== cb) return ca - cb; return (a.title || "").localeCompare(b.title || "", "ko"); });
      listEl.innerHTML = items.map(function (it) {
        var by = WHOC[it.by] || "";
        return '<div class="bkgcard' + (openId === it.id ? " open" : "") + '" data-id="' + it.id + '">' +
          '<div class="bkgh"><select class="dinp bkgcat" data-f="cat">' + CATS.map(function (c) { return '<option' + ((it.cat || "기타") === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select>" +
          '<input type="text" class="dinp ' + by + '" data-f="title" value="' + esc(it.title) + '" placeholder="제목 — 예) 생크림 휘핑 기준">' +
          '<button type="button" class="wsmini bkgopen">' + (openId === it.id ? "작게" : "크게") + "</button>" +
          '<button type="button" class="wsmini bkgdel">지우기</button></div>' +
          '<div class="bkgbody"><textarea class="' + by + '" data-f="body" placeholder="재료 · 분량 · 온도 · 시간 · 순서 · 주의점">' + esc(it.body) + "</textarea>" +
          '<div class="bkgmeta"><span>' + (it.by ? esc(it.by) + " 작성" : "") + "</span><span>" + (it.t ? "마지막 수정 " + when(it.t) : "") + "</span></div></div></div>";
      }).join("");
    }
    listEl.addEventListener("input", function (e) {
      var card = e.target.closest(".bkgcard"); if (!card) return;
      var it = data.items.find(function (x) { return x.id === card.dataset.id; }); if (!it) return;
      var f = e.target.dataset.f; if (!f) return;
      it[f] = e.target.value; it.t = Date.now(); if (!it.by) it.by = me();
      save();
    });
    listEl.addEventListener("change", function (e) {
      if (e.target.dataset.f === "cat") { var card = e.target.closest(".bkgcard"); var it = data.items.find(function (x) { return x.id === card.dataset.id; }); if (it) { it.cat = e.target.value; it.t = Date.now(); save(); render(); } }
    });
    listEl.addEventListener("click", function (e) {
      var card = e.target.closest(".bkgcard"); if (!card) return;
      var it = data.items.find(function (x) { return x.id === card.dataset.id; }); if (!it) return;
      if (e.target.classList.contains("bkgdel")) {
        if (!window.confirm("「" + (it.title || "제목 없음") + "」 항목을 지울까요? 지우면 되돌릴 수 없습니다.")) return;
        data.items = data.items.filter(function (x) { return x !== it; }); save(); render(); return;
      }
      if (e.target.classList.contains("bkgopen")) { openId = (openId === it.id) ? null : it.id; render(); }
    });
    if (addBtn) addBtn.addEventListener("click", function () {
      var it = { id: "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), cat: "기타", title: "", body: "", by: me(), t: Date.now() };
      data.items.push(it); openId = it.id; save(); render();
      var f = listEl.querySelector('.bkgcard[data-id="' + it.id + '"] input[data-f="title"]'); if (f) f.focus();
    });
    if (qEl) qEl.addEventListener("input", render);
    // 다른 컴퓨터에서 바뀌면 다시 읽는다 (쓰는 중이 아닐 때)
    window.addEventListener("cs:remote", function (e) {
      if (!e.detail || (e.detail.keys || []).indexOf(KEY) < 0) return;
      var a = document.activeElement; if (a && listEl.contains(a)) return;
      data = load(); render();
    });
    render();
  })();
  // 공용 컴퓨터 — 탭을 새로 열거나 30분 동안 안 만지면 이름을 다시 고른다
  (function () {
    var LOCK_MS = 30 * 60 * 1000;   // 30분 안 만지면 잠근다 (잠그기 전에 적던 것은 저장)
    try { if (!sessionStorage.getItem("cafesui.unlocked")) localStorage.removeItem("cafesui.me"); } catch (e) {}
    function lock() {
      try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {}   // 잠그기 전에 안 저장된 것 저장
      try { localStorage.removeItem("cafesui.me"); sessionStorage.removeItem("cafesui.unlocked"); } catch (e) {}
      location.reload();
    }
    window.__CS_LOCK = lock;
    var t = null;
    function arm() {
      clearTimeout(t);
      var me = null; try { me = localStorage.getItem("cafesui.me"); } catch (e) {}
      if (me) t = setTimeout(lock, LOCK_MS);
    }
    ["pointerdown", "keydown", "input", "change", "scroll", "touchstart"].forEach(function (ev) {
      document.addEventListener(ev, arm, true);
    });
    arm();
  })();
  // 새 버전 확인 — 5분마다 서버 파일이 바뀌었는지 보고, 바뀌었으면 위에 새로고침 버튼을 띄운다
  (function () {
    if (location.protocol === "file:") return;
    var url = location.pathname.replace(/\/$/, "/index.html") || "/index.html";
    var tag0 = null;
    function check(first) {
      fetch(url, { method: "HEAD", cache: "no-store" }).then(function (r) {
        var tag = r.headers.get("etag") || r.headers.get("last-modified") || "";
        if (!tag) return;
        if (first) { tag0 = tag; return; }
        if (tag0 && tag !== tag0) {
          var go = function () { try { if (window.__CS_FLUSH) window.__CS_FLUSH(); } catch (e) {} if (window.__CS_RELOAD) window.__CS_RELOAD(); else location.reload(); };
          var b = document.getElementById("newVer");
          if (b) { b.hidden = false; b.onclick = go; }
          // 쓰는 중이 아니면 바로 새 버전으로 (적던 것은 먼저 저장·전송)
          (function tick() {
            var a = document.activeElement, typing = a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA") && a.type !== "checkbox";
            if (!typing && Date.now() - lastIn > 4000) { go(); return; }
            setTimeout(tick, 3000);
          })();
        }
      }).catch(function () {});
    }
    var lastIn = 0;
    ["input", "keydown", "pointerdown"].forEach(function (ev) { document.addEventListener(ev, function () { lastIn = Date.now(); }, true); });
    window.addEventListener("load", function () { check(true); setInterval(function () { check(false); }, 60 * 1000); });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) check(false); });
    window.addEventListener("focus", function () { check(false); });
  })();
