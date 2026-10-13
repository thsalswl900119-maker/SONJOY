// 🎄 크리스마스 — 해마다 한 장 (따로 탭 tp18 · 연간 행사 탭에는 바로가기만). cafesui.xmas.<해> = { f:{x1..x10}, by:{...}, savedAt, who }
// 저장은 「이 화면에서 고친 칸」만 (다른 기기가 쓴 칸을 지우지 않게) · 빈 칸에는 작년 글이 흐린 글씨로 보인다.
(function () {
  var sec = document.getElementById("xmasSec"); if (!sec) return;
  var PRE = "cafesui.xmas.";
  var ins = Array.prototype.slice.call(sec.querySelectorAll(".xmin"));
  var yearsEl = document.getElementById("xmYears"), titleEl = document.getElementById("xmTitle"), stateEl = document.getElementById("xmState"), footEl = document.getElementById("xmFoot");
  var autoEl = document.getElementById("xmAuto"), autoN = document.getElementById("xmAutoN");
  var CL = { "정항아": "wp1", "박혜빈": "wp2", "이해선": "wp3", "사장님": "wp4" };
  var KW = /크리스마스|성탄|x-?mas|산타/i;
  function pad(n) { return String(n).padStart(2, "0"); }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function load(y) { try { return JSON.parse(localStorage.getItem(PRE + y) || "{}") || {}; } catch (e) { return {}; } }
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var now = new Date(), thisY = now.getFullYear();
  var cur = now.getMonth() === 0 ? thisY - 1 : thisY;   // 1월엔 지난 크리스마스를 먼저
  function years() { var a = []; for (var y = 2025; y <= thisY + 1; y++) a.push(y); return a; }
  function grow(el) { el.style.height = "auto"; el.style.height = Math.max(52, el.scrollHeight + 2) + "px"; }
  function paint(el, n) { ["wp1", "wp2", "wp3", "wp4"].forEach(function (c) { el.classList.remove(c); }); if (n && CL[n]) el.classList.add(CL[n]); }
  function filled(y) { var f = load(y).f || {}; return Object.keys(f).filter(function (k) { return String(f[k] || "").trim(); }).length; }
  function drawYears() {
    yearsEl.innerHTML = years().map(function (y) {
      var n = filled(y);
      return '<button type="button" class="xmy" data-y="' + y + '" aria-pressed="' + (y === cur) + '">' + y + (n ? "<i>" + n + "칸</i>" : "") + "</button>";
    }).join("");
  }
  // 일지 · 메모 달력에서 「크리스마스」가 들어간 글을 그 해 9월 ~ 다음 해 1월 사이에서 모은다 (보기만)
  var LAB = { lf180: "인계사항", lf185: "사장님 지시사항", lf154: "흐름 · 분위기", lf181: "특이사항" };
  function pieces(txt) {
    var out = [];
    String(txt || "").split(/\n/).forEach(function (ln) {
      if (!KW.test(ln)) return;
      if (ln.length <= 140) { out.push(ln.trim()); return; }
      ln.split(/\s\/\s/).forEach(function (s) { if (KW.test(s)) out.push(s.trim()); });
    });
    return out;
  }
  function autoList(y) {
    var from = y + "-09-01", to = (y + 1) + "-01-15", rows = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), m = /^cafesui\.log\.(\d{4}-\d{2}-\d{2})$/.exec(k || "");
        if (!m || m[1] < from || m[1] > to) continue;
        var lg = J(k); if (!lg || !lg.f) continue;
        Object.keys(lg.f).forEach(function (fk) { pieces(lg.f[fk]).forEach(function (s) { rows.push({ d: m[1], w: "일지 · " + (LAB[fk] || "메모"), s: s }); }); });
      }
    } catch (e) {}
    var dn = J("cafesui.daynotes") || {};
    Object.keys(dn).forEach(function (d) {
      if (d < from || d > to) return;
      (Array.isArray(dn[d]) ? dn[d] : []).forEach(function (n) { var s = n && (n.t || ""); if (KW.test(s)) rows.push({ d: d, w: "메모 달력", s: s }); });
    });
    rows.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    return rows;
  }
  function drawAuto() {
    var rows = autoList(cur);
    autoN.textContent = rows.length ? rows.length + "줄" : "";
    autoEl.innerHTML = rows.length ? rows.map(function (r) {
      var p = r.d.split("-");
      return '<div class="xmal"><small>' + (+p[1]) + "/" + (+p[2]) + " · " + esc(r.w) + "</small>" + esc(r.s).replace(new RegExp(KW.source, "gi"), function (x) { return "<mark>" + x + "</mark>"; }) + "</div>";
    }).join("") : '<div class="xmal">' + cur + "년 9월 ~ " + (cur + 1) + "년 1월 일지 · 메모 달력에 「크리스마스」가 들어간 글이 아직 없습니다</div>";
  }
  function render() {
    var o = load(cur), f = o.f || {}, by = o.by || {}, prev = (load(cur - 1).f) || {};
    titleEl.textContent = "🎄 " + cur + " 크리스마스";
    ins.forEach(function (el) {
      var k = el.dataset.f, pv = String(prev[k] || "").trim();
      el.placeholder = pv ? (cur - 1) + "년: " + pv.split("\n").slice(0, 2).join(" / ").slice(0, 90) + (pv.length > 90 ? "…" : "") : "";
      if (document.activeElement !== el) { el.value = f[k] || ""; paint(el, by[k]); }
      grow(el);
    });
    var n = ins.filter(function (el) { return el.value.trim(); }).length;
    stateEl.textContent = n ? n + " / " + ins.length + "칸 적힘" + (o.who ? " · 마지막 " + nim(o.who) : "") : "아직 안 적음 · 흐린 글씨는 작년 내용";
    footEl.textContent = o.savedAt ? "마지막 저장 " + o.savedAt + (o.who ? " · " + nim(o.who) : "") : "";
    Array.prototype.forEach.call(sec.querySelectorAll(".xmgal"), function (g) { g.hidden = String(cur) !== g.dataset.y; });
    drawYears(); drawAuto(); drawCk(); drawTodo();
  }

  // ── ✅ 날짜별 체크리스트 — 크리스마스(12/25) 기준 D-날짜로 기본 목록이 들어가고, 날짜 · 할 일 · 담당은 고칠 수 있다.
  //    o.ck = { id: { d:"YYYY-MM-DD", t, w(담당), n(순서), del } } · o.cd = { id: { by, at } } (체크한 사람 · 시각)
  //    처음 고치거나 체크할 때 기본 목록을 그 해 데이터로 한 번 옮겨 둔다(같은 id라 여러 기기가 동시에 해도 겹치지 않음).
  //    오늘 할 일 맨 위에도 「오늘까지 할 것 · 밀린 것」이 뜬다 — 체크할 때까지 계속.
  var TPL = [
    ["c00", 77, "★ 크리스마스 케이크 디자인 회의 (9~10월쯤) — 컨셉 · 맛 · 사이즈 · 가격 · 목표 개수 정하기", 1],
    ["c01", 70, "벨벳 리본 색 · 두께 확정 후 주문 (별조각케이크 띠지 폭에 대보고)"],
    ["c02", 70, "데코 후보(눈꽃 초콜릿 등) 시안 · 구매 또는 제작 결정"],
    ["c03", 63, "테스트 케이크 만들기 (리스 짜기) + 사진 촬영 — 예약 공지용"],
    ["c04", 56, "케이크에 붙일 종이 제작 (테스트 사진 → 그림 변환 → 방수 종이 인쇄 · 검수)"],
    ["c05", 56, "방수 종이 업체 찾고 샘플 받기"],
    ["c06", 52, "상자 샘플 확인 · 발주 수량 정하기"],
    ["c07", 49, "귀여운 초 고르기 · 케이크 픽(산타 모자) 방식 결정"],
    ["c08", 42, "목표 개수 사이즈별 배분 · 예약 시작/마감일 · 24~25일 픽업 운영 · 현장판매 수량 확정 (작년 생산량 비교)"],
    ["c09", 55, "★ 매장 무조건 크리스마스 분위기로 바꾸기 (10월 말 ~ 11월 초) — 데코 꺼내기 · 남은 데코 재고 파악", 1],
    ["c20", 55, "★ 딸기 첫 출하 되자마자 크리스마스 컨셉 사진 찍기 (딸기 들어오는 날로 날짜 고치기)", 1],
    ["c10", 35, "예약 안내문 작성 (픽 무료 · 24~25일 제외 기준을 처음부터) + 공지 사진 준비"],
    ["c11", 30, "크리스마스 케이크 예약 오픈 (네이버)"],
    ["c12", 24, "네이버 마케팅 메시지 발송 (크리스마스 케이크 안내)"],
    ["c13", 21, "부자재 입고 확인 (상자 · 리본 · 엽서 · 종이 · 초 · 데코 · 픽)"],
    ["c14", 14, "딸기 · 생크림 · 시트 물량 거래처에 미리 말하기 (작년 생산량 비교)"],
    ["c15", 10, "근무표 · 추가 인력 확정 · 크리스마스 작업 퇴근시간 예외 공지"],
    ["c16", 7, "예약 마감 · 날짜별 · 시간대별 픽업표 정리 · 일자별 생산 개수 확정"],
    ["c17", 3, "피크 시작 (12/22~25) — 생산 · 픽업 시간대별 체크 · 현장 판매분 남기기"],
    ["c18", 1, "로즈마리 등 생물 데코는 픽업 당일 올리기 · 24~25일 픽 작업 없음 확인"],
    ["c19", -1, "결과 정리 — 실제 판매 개수 · 남은 것 · 아쉬운 것 → 위 「결과」 칸에"]
  ];
  var WDN = ["일", "월", "화", "수", "목", "금", "토"];
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dOf(y, D) { var d = new Date(y, 11, 25); d.setDate(d.getDate() - D); return ymd(d); }
  function today() { return ymd(new Date()); }
  function dd(a, b) { var p = a.split("-"), q = b.split("-"); return Math.round((new Date(+p[0], +p[1] - 1, +p[2]) - new Date(+q[0], +q[1] - 1, +q[2])) / 86400000); }
  function mdw(s) { var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]); return (+p[1]) + "/" + (+p[2]) + "(" + WDN[d.getDay()] + ")"; }
  function seasonY() { var n = new Date(); return n.getMonth() === 0 ? n.getFullYear() - 1 : n.getFullYear(); }
  function tplOf(y) { var c = {}; TPL.forEach(function (x, i) { c[x[0]] = { d: dOf(y, x[1]), t: x[2], w: "", n: i }; if (x[3]) c[x[0]].m = 1; }); return c; }
  function ckItems(y) {
    var o = load(y), ck = o.ck || tplOf(y), cd = o.cd || {};
    return Object.keys(ck).filter(function (id) { return ck[id] && !ck[id].del; }).map(function (id) {
      var x = ck[id]; return { id: id, d: x.d || "", t: x.t || "", w: x.w || "", n: x.n == null ? 99 : x.n, m: !!x.m, done: cd[id] || null };
    }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.n - b.n; });
  }
  function stampNow() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function ckSave(y, fn) {
    var o = load(y); if (!o.ck) o.ck = tplOf(y); o.cd = o.cd || {};
    fn(o); o.savedAt = stampNow(); o.who = me() || o.who;
    try { localStorage.setItem(PRE + y, JSON.stringify(o)); } catch (e) {}
  }
  function stat(x) {
    var t0 = today(), n = x.d ? dd(x.d, t0) : null;
    if (x.done) return { c: "done", s: "✔ " + nim(x.done.by) + (x.done.at ? " " + x.done.at : "") };
    if (n == null) return { c: "", s: "날짜 없음" };
    if (n < 0) return { c: "late", s: "⚠ " + (-n) + "일 지남" };
    if (n === 0) return { c: "today", s: "오늘까지" };
    return { c: n <= 3 ? "soon" : "", s: "D-" + n };
  }
  function toggle(y, id) {
    var w = me(); if (!w) { alert("먼저 이름을 고르세요 (누가 했는지 남깁니다)"); return false; }
    ckSave(y, function (o) { if (o.cd[id]) delete o.cd[id]; else o.cd[id] = { by: w, at: stampNow() }; });
    return true;
  }
  var ckEl = document.getElementById("xmCk"), ckD = document.getElementById("xmCkD");
  function drawCk() {
    if (!ckEl) return;
    if (ckEl.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) { ckPend = true; return; }
    ckPend = false;
    var L = ckItems(cur), done = L.filter(function (x) { return x.done; }).length, late = L.filter(function (x) { return !x.done && x.d && x.d < today(); }).length;
    var n = dd(cur + "-12-25", today());
    ckD.innerHTML = (n > 0 ? "크리스마스까지 <b>D-" + n + "</b>" : n === 0 ? "<b>오늘 크리스마스</b>" : cur + " 크리스마스 지남") + " · 체크 " + done + " / " + L.length + (late ? ' · <em>⚠ 밀린 것 ' + late + "개</em>" : "");
    ckEl.innerHTML = L.map(function (x) {
      var s = stat(x);
      return '<div class="xck ' + s.c + (x.m ? " must" : "") + '" data-id="' + x.id + '"><button type="button" class="xcb" aria-pressed="' + !!x.done + '" aria-label="' + esc(x.t) + ' 완료"></button>' +
        '<input type="date" class="xcd" value="' + esc(x.d) + '" aria-label="날짜">' +
        '<textarea class="xct" rows="1" aria-label="할 일">' + esc(x.t) + '</textarea>' +
        '<input type="text" class="xcw" value="' + esc(x.w).replace(/"/g, "&quot;") + '" placeholder="담당" aria-label="담당">' +
        '<span class="xcs">' + (x.m ? '<em class="xmust">꼭</em>' : "") + esc(s.s) + '</span><button type="button" class="xcx" title="목록에서 빼기" aria-label="빼기">✕</button></div>';
    }).join("") + '<button type="button" class="skbtn" id="xmCkAdd">＋ 체크 항목 추가</button>';
    Array.prototype.forEach.call(ckEl.querySelectorAll(".xct"), grow2);
  }
  var ckPend = false;
  function grow2(el) { el.style.height = "auto"; el.style.height = Math.max(40, el.scrollHeight + 2) + "px"; }
  if (ckEl) {
    ckEl.addEventListener("click", function (e) {
      var row = e.target.closest(".xck"), id = row && row.dataset.id;
      if (e.target.closest("#xmCkAdd")) {
        var nid = "u" + Date.now().toString(36), t0 = today();
        ckSave(cur, function (o) { o.ck[nid] = { d: t0.slice(0, 4) == String(cur) ? t0 : dOf(cur, 30), t: "", w: "", n: 50 }; });
        drawCk(); drawTodo(); var nt = ckEl.querySelector('.xck[data-id="' + nid + '"] .xct'); if (nt) nt.focus(); return;
      }
      if (!id) return;
      if (e.target.closest(".xcb")) { if (toggle(cur, id)) { drawCk(); drawTodo(); } return; }
      if (e.target.closest(".xcx")) {
        if (!confirm("「" + (row.querySelector(".xct").value || "이 항목") + "」 을(를) 목록에서 뺄까요?")) return;
        ckSave(cur, function (o) { if (o.ck[id]) o.ck[id].del = me() || "1"; }); drawCk(); drawTodo();
      }
    });
    ckEl.addEventListener("input", function (e) { if (e.target.classList.contains("xct")) grow2(e.target); });
    ckEl.addEventListener("change", function (e) {
      var row = e.target.closest(".xck"); if (!row) return; var id = row.dataset.id, el = e.target;
      var f = el.classList.contains("xcd") ? "d" : el.classList.contains("xct") ? "t" : el.classList.contains("xcw") ? "w" : ""; if (!f) return;
      var v = f === "t" ? el.value.trim() : el.value.trim();
      ckSave(cur, function (o) { if (o.ck[id]) o.ck[id][f] = v; });
      setTimeout(function () { drawCk(); drawTodo(); }, 0);
    });
    ckEl.addEventListener("focusout", function () { setTimeout(function () { if (ckPend && !ckEl.contains(document.activeElement)) drawCk(); }, 50); });
  }
  // 오늘 할 일 맨 위 — 오늘까지 해야 할 것 · 밀린 것 (체크할 때까지 계속 뜬다) + 3일 안에 할 것
  var todoEl = document.getElementById("xmTodo");
  function drawTodo() {
    if (!todoEl) return;
    var y = seasonY(), t0 = today(), L = ckItems(y).filter(function (x) { return !x.done && x.d && dd(x.d, t0) <= (x.m ? 7 : 3); });   // 「꼭」 항목은 일주일 전부터
    if (!L.length) { todoEl.hidden = true; todoEl.innerHTML = ""; return; }
    var n = dd(y + "-12-25", t0);
    todoEl.hidden = false;
    todoEl.innerHTML = '<div class="xth"><b>🎄 크리스마스 체크 — 꼭 하기</b><span>' + (n > 0 ? "크리스마스까지 D-" + n : "") + ' · 하면 바로 체크 · 체크할 때까지 계속 뜹니다</span><button type="button" class="skbtn" id="xmGo">전체 체크리스트 →</button></div>' +
      L.map(function (x) {
        var s = stat(x);
        return '<div class="xtr ' + s.c + (x.m ? " must" : "") + '" data-id="' + x.id + '"><button type="button" class="xcb" aria-pressed="false" aria-label="' + esc(x.t) + ' 완료"></button><span class="xtt"><b>' + mdw(x.d) + "</b> " + esc(x.t) + (x.w ? ' <i>· 담당 ' + esc(x.w) + "</i>" : "") + '</span><span class="xcs">' + (x.m ? '<em class="xmust">꼭</em>' : "") + esc(s.s) + "</span></div>";
      }).join("");
  }
  if (todoEl) todoEl.addEventListener("click", function (e) {
    if (e.target.closest("#xmGo")) { var tb = document.querySelector('.tab[data-p="tp18"]'); if (tb) tb.click(); go(seasonY()); setTimeout(function () { var c = document.getElementById("xmCkBox"); if (c) c.scrollIntoView({ block: "start" }); }, 150); return; }
    var row = e.target.closest(".xtr"); if (!row || !e.target.closest(".xcb")) return;
    if (toggle(seasonY(), row.dataset.id)) { drawTodo(); if (cur === seasonY()) drawCk(); }
  });
  var touched = {};
  function save() {
    var keys = Object.keys(touched); if (!keys.length) return;
    var o = load(cur); o.f = o.f || {}; o.by = o.by || {};
    var w = me(), any = false;
    ins.forEach(function (el) {
      var k = el.dataset.f, v = el.value; if (!touched[k]) return;
      if (v.trim()) { if (o.f[k] !== v) { o.f[k] = v; o.by[k] = w || o.by[k] || ""; any = true; } }
      else if (o.f[k] != null) { delete o.f[k]; delete o.by[k]; any = true; }
    });
    if (!any) return;
    var d = new Date(); o.savedAt = (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); o.who = w || o.who;
    try { localStorage.setItem("cafesui.ui.lastxmas." + cur, JSON.stringify(o.f)); } catch (e) {}
    try { localStorage.setItem(PRE + cur, JSON.stringify(o)); } catch (e) {}
  }
  var t = null;
  ins.forEach(function (el) {
    el.addEventListener("input", function () { touched[el.dataset.f] = 1; grow(el); paint(el, me()); clearTimeout(t); t = setTimeout(save, 400); });
    el.addEventListener("blur", function () { clearTimeout(t); save(); touched = {}; render(); });
  });
  (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { clearTimeout(t); save(); });
  function go(y) { clearTimeout(t); save(); touched = {}; cur = y; render(); }
  yearsEl.addEventListener("click", function (e) { var b = e.target.closest(".xmy"); if (b) go(+b.dataset.y); });
  document.getElementById("xmPrev").addEventListener("click", function () { if (cur > years()[0]) go(cur - 1); });
  document.getElementById("xmNext").addEventListener("click", function () { if (cur < thisY + 1) go(cur + 1); });
  document.getElementById("xmCopy").addEventListener("click", function () {
    save(); var f = load(cur).f || {}, NL = String.fromCharCode(10), out = ["[🎄 " + cur + " 크리스마스]"], btn = this;
    sec.querySelectorAll(".xmrow").forEach(function (r) { var el = r.querySelector(".xmin"), v = String(f[el.dataset.f] || "").trim(); if (v) out.push("", "■ " + r.querySelector("span").firstChild.textContent, v); });
    if (out.length < 2) { alert("이 해에 적힌 내용이 없습니다"); return; }
    var txt = out.join(NL), LBL = btn.textContent, ok = function () { btn.textContent = "✔ 복사됨"; setTimeout(function () { btn.textContent = LBL; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { prompt("복사해서 쓰세요", txt); });
    else prompt("복사해서 쓰세요", txt);
  });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || [];
    if (ks.some(function (k) { return k.indexOf(PRE) === 0 || k.indexOf("cafesui.log.") === 0 || k === "cafesui.daynotes"; })) render();
  });
  // 탭이 숨어 있을 때 그리면 칸 높이를 못 잰다 → 화면에 보일 때 다시 늘린다
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) ins.forEach(grow); }).observe(sec);
  window.addEventListener("resize", function () { ins.forEach(grow); });
  setInterval(function () { if (!ckEl || !ckEl.contains(document.activeElement)) { drawTodo(); drawCk(); } }, 10 * 60 * 1000);
  render();
})();
