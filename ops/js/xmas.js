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
    applyEd();
    Array.prototype.forEach.call(sec.querySelectorAll(".xmgal"), function (g) { if (!(EDING && EDING.el === g)) g.hidden = String(cur) !== g.dataset.y || !g.innerHTML.trim(); });
    drawYears(); drawAuto(); drawPane(); drawTodo(); drawEdBars();
  }

  // ── ✅ 날짜별 체크리스트 — 크리스마스(12/25) 기준 D-날짜로 기본 목록이 들어가고, 날짜 · 할 일 · 담당은 고칠 수 있다.
  //    o.ck = { id: { d:"YYYY-MM-DD", t, w(담당), n(순서), del } } · o.cd = { id: { by, at } } (체크한 사람 · 시각)
  //    처음 고치거나 체크할 때 기본 목록을 그 해 데이터로 한 번 옮겨 둔다(같은 id라 여러 기기가 동시에 해도 겹치지 않음).
  //    오늘 할 일 맨 위에도 「오늘까지 할 것 · 밀린 것」이 뜬다 — 체크할 때까지 계속.
  // 기본 목록 v2 (10/13) — 2021~2025 사장님 크리스마스 기록 파일(재료 리스트 · 재료 계획안 · 실제 작업량 · 일하는 스케줄)에서 해마다 실제로 한 날짜를 옮김
  var TPL = [
    ["c00", 77, "★ 크리스마스 케이크 디자인 회의 (9~10월쯤) — 컨셉 · 맛 · 사이즈 · 가격 · 목표 개수 정하기", 1],
    ["c01", 70, "벨벳 리본 색 · 두께 확정 후 주문 (별조각케이크 띠지 폭에 대보고)"],
    ["c02", 70, "데코 후보(눈꽃 초콜릿 등) 시안 · 구매 또는 제작 결정"],
    ["c03", 63, "테스트 케이크 만들기 (리스 짜기) + 사진 촬영 — 예약 공지용"],
    ["c04", 56, "케이크에 붙일 종이 제작 (테스트 사진 → 그림 변환 → 방수 종이 인쇄 · 검수)"],
    ["c05", 56, "방수 종이 업체 찾고 샘플 받기"],
    ["c09", 55, "★ 매장 무조건 크리스마스 분위기로 바꾸기 (10월 말 ~ 11월 초) — 데코 꺼내기 · 남은 데코 재고 파악", 1],
    ["c20", 55, "★ 딸기 첫 출하 되자마자 크리스마스 컨셉 사진 찍기 (딸기 들어오는 날로 날짜 고치기)", 1],
    ["c06", 52, "상자 샘플 확인 · 발주 수량 정하기"],
    ["c07", 49, "귀여운 초 고르기 · 케이크 픽(산타 모자) 방식 결정"],
    ["c22", 45, "케이크 픽(산타 픽) 주문 제작 · 초(산타 곰돌이 · 루돌프 · 트리 토퍼) 주문 — 남은 재고 먼저 세기 (25년 11월에 주문)"],
    ["c08", 42, "전사 목표 정하기 — 사이즈별 개수 · 예약 시작/마감일 · 24~25일 픽업 운영 · 현장판매 수량 (작년 생산량 비교)"],
    ["c21", 40, "케이크 상자 + 하판 · 미니 상자 · 조각 상자 주문 (11월 · 패키지팩토리 직접 주문하면 개당 80원 쌈)"],
    ["c10", 35, "예약 안내문 작성 (픽 무료 · 24~25일 제외 기준을 처음부터) + 공지 사진 준비"],
    ["c11", 30, "크리스마스 케이크 예약 오픈 (네이버)"],
    ["c23", 28, "시트 개수 계산 · 시트 OEM 견적 받기 (11월 말 · 직접 굽는 해는 계란 · 버터 · 박력분 준비량 계산)"],
    ["c12", 24, "네이버 마케팅 메시지 발송 (크리스마스 케이크 안내)"],
    ["c24", 21, "🧾 재료 계획안 짜기 (12월 첫 주) — 날짜별 예약 수량 · 대표 재료(생크림 · 휘핑 · 딸기) · 시트 · 부자재"],
    ["c14", 19, "딸기 · 생크림 개수 파악해서 각 거래처에 미리 알리기 (25년엔 12/6)"],
    ["c25", 17, "크리스마스 리본끈 재단 (25년 240개 · 12/8)"],
    ["c26", 16, "크리스마스 박스 · 엽서 주문 확인 (25년 12/9)"],
    ["c15", 12, "근무표 · 추가 인력 확정 · 유니폼 · 머리망 주문 · 보건증 확인 · 크리스마스 작업 퇴근시간 예외 공지"],
    ["c13", 10, "부자재 입고 확인 (상자 · 리본 · 엽서 · 종이 · 초 · 데코 · 픽)"],
    ["c27", 9, "시트 OEM 발주 결제 (12월 중순) / 직접 굽는 해는 시트 계량 · 굽기 시작"],
    ["c28", 8, "케이크 박스 접기 + 띠지 붙이기 · 미니 띠지는 반으로만 잘라 두기"],
    ["c29", 7, "딸기 미니케이크 예약 마감 · 추가 인력 예행연습 (바쪽 · 인수인계)"],
    ["c30", 6, "최종 크리스마스 조각 · 홀케이크 회의 · 체크"],
    ["c16", 5, "날짜별 · 시간대별 픽업표 정리 · 일자별 생산 개수 확정"],
    ["c31", 5, "22~25일 생크림 · 딸기 · 휘핑 · 망고 · 샤인 · 시트 최종 개수 세고 발주 + 피드백 적기"],
    ["c32", 3, "딸기 홀케이크 예약 마감"],
    ["c17", 3, "피크 시작 (12/22~25) — 작업 순서 조각 → 미니 → 홀 (초코부터) · 생산 · 픽업 시간대별 체크 · 현장 판매분 남기기"],
    ["c18", 1, "로즈마리 등 생물 데코는 픽업 당일 올리기 · 24~25일 픽 작업 없음 확인"],
    ["c19", -1, "결과 정리 — 날짜별 예약 · 매장 판매 · 실제 생산(🍰 날짜별 생산 「실제」 칸) · 남은 것 · 아쉬운 것 → 「결과」 칸에"],
    ["c33", -2, "마지막 주(12/26~31) 조각케이크 생산량 줄이기 — 평소보다 적게"]
  ];
  var WDN = ["일", "월", "화", "수", "목", "금", "토"];
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dOf(y, D) { var d = new Date(y, 11, 25); d.setDate(d.getDate() - D); if (D !== 0 && d.getDay() === 0) d.setDate(d.getDate() - 1); return ymd(d); }   // 일요일(정기휴무)이면 토요일로
  function today() { return ymd(new Date()); }
  function dd(a, b) { var p = a.split("-"), q = b.split("-"); return Math.round((new Date(+p[0], +p[1] - 1, +p[2]) - new Date(+q[0], +q[1] - 1, +q[2])) / 86400000); }
  function mdw(s) { var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]); return (+p[1]) + "/" + (+p[2]) + "(" + WDN[d.getDay()] + ")"; }
  function seasonY() { var n = new Date(); return n.getMonth() === 0 ? n.getFullYear() - 1 : n.getFullYear(); }
  function tplOf(y) { var c = {}; TPL.forEach(function (x, i) { c[x[0]] = { d: dOf(y, x[1]), t: x[2], w: "", n: i }; if (x[3]) c[x[0]].m = 1; }); return c; }
  function ckItems(y) {
    var o = load(y), ck = withTpl(o.ck, y), cd = o.cd || {};
    return Object.keys(ck).filter(function (id) { return ck[id] && !ck[id].del; }).map(function (id) {
      var x = ck[id]; return { id: id, d: x.d || "", t: x.t || "", w: x.w || "", n: x.n == null ? 99 : x.n, m: !!x.m, done: cd[id] || null };
    }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.n - b.n; });
  }
  // 저장된 목록에 없는 기본 항목(나중에 더한 것)은 그 해 날짜로 보여 준다 — 손으로 뺀 것(del)은 남아 있어서 다시 안 뜸
  function withTpl(ck, y) { if (!ck) return tplOf(y); var t2 = tplOf(y), c = {}; Object.keys(ck).forEach(function (k) { c[k] = ck[k]; }); Object.keys(t2).forEach(function (k) { if (!c[k]) c[k] = t2[k]; }); return c; }
  function stampNow() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function ckSave(y, fn) {
    var o = load(y); o.ck = withTpl(o.ck, y); o.cd = o.cd || {};
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
    ckEl.innerHTML = '<button type="button" class="skbtn xmckadd xmckadd0">＋ 할 일 추가 (날짜 · 할 일 · 담당)</button>' + L.map(function (x) {
      var s = stat(x);
      return '<div class="xck ' + s.c + (x.m ? " must" : "") + '" data-id="' + x.id + '"><button type="button" class="xcb" aria-pressed="' + !!x.done + '" aria-label="' + esc(x.t) + ' 완료"></button>' +
        '<input type="date" class="xcd" value="' + esc(x.d) + '" aria-label="날짜">' +
        '<textarea class="xct" rows="1" aria-label="할 일">' + esc(x.t) + '</textarea>' +
        '<input type="text" class="xcw" value="' + esc(x.w).replace(/"/g, "&quot;") + '" placeholder="담당" aria-label="담당">' +
        '<span class="xcs">' + (x.m ? '<em class="xmust">꼭</em>' : "") + esc(s.s) + '</span><button type="button" class="xcx" title="목록에서 빼기" aria-label="빼기">✕</button>' + dayCmHtml(x.d) + '</div>';
    }).join("") + '<button type="button" class="skbtn xmckadd" id="xmCkAdd">＋ 할 일 추가</button>';
    Array.prototype.forEach.call(ckEl.querySelectorAll(".xct"), grow2);
  }
  var ckPend = false;
  // 할 일 = 달력 / 목록 한 화면 (10/30 · 준비 캘린더 + 체크리스트 합침) — 기기 기억 cafesui.ui.xmckv
  var CKV = "cal"; try { CKV = localStorage.getItem("cafesui.ui.xmckv") || "cal"; } catch (e) {}
  function ckView() {
    var c = document.getElementById("xmCal"), b = document.getElementById("xmCkBox"), v = document.getElementById("xmCkV");
    if (c) c.hidden = CKV !== "cal"; if (b) b.hidden = CKV !== "list";
    if (v) Array.prototype.forEach.call(v.querySelectorAll("button"), function (x) { x.setAttribute("aria-pressed", String(x.dataset.v === CKV)); });
  }
  (function (v) { if (v) v.addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (!b) return; CKV = b.dataset.v; try { localStorage.setItem("cafesui.ui.xmckv", CKV); } catch (e2) {} ckView(); setTimeout(regrow, 0); }); })(document.getElementById("xmCkV"));
  function grow2(el) { el.style.height = "auto"; el.style.height = Math.max(40, el.scrollHeight + 2) + "px"; }
  if (ckEl) {
    ckEl.addEventListener("click", function (e) {
      var row = e.target.closest(".xck"), id = row && row.dataset.id;
      if (e.target.closest(".xmckadd")) {   // 캘린더와 같은 작은 창으로 넣기(10/21) — 날짜를 고르고 넣으면 그 날짜 자리에 들어감
        var t0 = today(); xEdit(null, t0.slice(0, 4) == String(cur) ? t0 : dOf(cur, 30), true); return;
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
    if (e.target.closest("#xmGo")) { var tb = document.querySelector('.tab[data-p="tp18"]'); if (tb) tb.click(); go(seasonY()); showTab("ck"); setTimeout(function () { var c = document.getElementById("xmCkBox"); if (c) c.scrollIntoView({ block: "start" }); }, 150); return; }
    var row = e.target.closest(".xtr"); if (!row || !e.target.closest(".xcb")) return;
    if (toggle(seasonY(), row.dataset.id)) { drawTodo(); if (cur === seasonY()) drawCk(); }
  });

  // ── 하위 화면 (한눈에 · 준비 캘린더 · 체크리스트 · 전사 목표 · 재료 · 부자재 · 날짜별 생산 · 회의 · 결론 · 지난 해 기록 · 보고서)
  //    고치는 칸은 모두 바로 저장(그 칸만) · 다른 기기가 바꾸면 쓰는 중이 아닐 때 다시 그림.
  var nav = document.getElementById("xmNav"), panes = Array.prototype.slice.call(sec.querySelectorAll(".xmpane"));
  var TAB = "sum"; try { TAB = localStorage.getItem("cafesui.ui.xmtab") || "sum"; } catch (e) {}
  TAB = { item: "meet", plan: "prod", cal: "ck", rep: "hist" }[TAB] || TAB;   // 10/30 화면 합침 — 예전 화면 이름은 합친 화면으로
  function showTab(k) {
    TAB = k; try { localStorage.setItem("cafesui.ui.xmtab", k); } catch (e) {}
    Array.prototype.forEach.call(nav.querySelectorAll(".xmn"), function (b) { b.setAttribute("aria-selected", String(b.dataset.x === k)); });
    panes.forEach(function (p) { p.hidden = p.dataset.x !== k; });
    drawPane(); if (k === "meet") setTimeout(function () { ins.forEach(grow); }, 0);
    if (typeof wideSync === "function") wideSync();
    setTimeout(regrow, 0);
  }
  // 숨겨진 채 그려진 칸은 높이를 못 재서 글이 잘림 — 보일 때 다시 맞춘다(10/21 재료 이름 · 메모 잘림)
  function regrow() { Array.prototype.forEach.call(sec.querySelectorAll("#xmMat textarea, #xmCk textarea.xct"), function (t) { if (t.offsetParent) grow2(t); }); }
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp18"], .mbt[data-p="tp18"]')) setTimeout(regrow, 60); });
  window.addEventListener("resize", function () { clearTimeout(regrow.t); regrow.t = setTimeout(regrow, 200); });
  // 품목 이름 칸은 한 줄 글 — 엔터는 줄바꿈 대신 칸 나가기(저장)
  sec.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList && e.target.classList.contains("xmn2")) { e.preventDefault(); e.target.blur(); } });
  nav.addEventListener("click", function (e) { var b = e.target.closest(".xmn"); if (b) showTab(b.dataset.x); });
  function paneEl(k) { return k === "hist" ? sec.querySelector('.xmpane[data-x="hist"]') : document.getElementById({ sum: "xmSum", goal: "xmGoal", mat: "xmMat", prod: "xmProdPane" }[k]); }
  function busy(el) { var a = document.activeElement; return el && a && el.contains(a) && (/INPUT|TEXTAREA|SELECT/.test(a.tagName) || a.isContentEditable); }
  var pend = {};
  // 다시 그릴 때 쓰던 칸으로 돌아가기 (이 화면에서 고친 뒤 · 합계를 바로 바꾸려고)
  function focusKey(el) {
    var a = document.activeElement; if (!a || !el.contains(a) || a.isContentEditable) return null;
    var row = a.closest("[data-id],[data-r]"), q = a.tagName.toLowerCase() + "." + a.classList[0];
    ["f", "d", "g", "i"].forEach(function (x) { if (a.dataset[x] != null) q += '[data-' + x + '="' + a.dataset[x] + '"]'; });
    if (row) q = (row.dataset.id != null ? '[data-id="' + row.dataset.id + '"] ' : '[data-r="' + row.dataset.r + '"] ') + q;
    return q;
  }
  function drawPane(force) {
    var k = TAB, el = paneEl(k);
    if (k === "ck") { drawCk(); if (xcEl && !(xcEl.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) drawCal(xcEl); ckView(); return; }
    if (!el) return;
    if (busy(el) && !(force === true && !document.activeElement.isContentEditable)) { pend[k] = 1; return; }
    pend[k] = 0;
    var fk = focusKey(el), sy = window.pageYOffset;
    ({ sum: drawSum, goal: drawGoal, mat: drawMat, prod: function () { drawProd(document.getElementById("xmProd")); drawPlan(document.getElementById("xmPlan")); }, hist: function () { drawHist(document.getElementById("xmHist")); drawRep(document.getElementById("xmRep")); } }[k] || function () {})(el);
    if (fk) { var f2 = el.querySelector(fk); if (f2) { try { f2.focus({ preventScroll: true }); if (f2.setSelectionRange && /text|search/.test(f2.type || "text") && f2.tagName !== "SELECT") f2.setSelectionRange(f2.value.length, f2.value.length); } catch (e) {} window.scrollTo(0, sy); } }
  }
  sec.addEventListener("focusout", function () { setTimeout(function () { var el = paneEl(TAB); if (pend[TAB] && !busy(el)) drawPane(); }, 60); });
  function xsave(y, fn) { var o = load(y); fn(o); o.savedAt = stampNow(); o.who = me() || o.who; try { localStorage.setItem(PRE + y, JSON.stringify(o)); } catch (e) {} }
  function won(n) { n = N(n); return n ? n.toLocaleString("ko-KR") + "원" : "—"; }
  // 💰 돈 칸은 무조건 천 원 단위 쉼표(10/21 사장님) — 보일 때 398,640 · 저장은 숫자만(글이 섞이면 그대로)
  function money(v) { var t = String(v == null ? "" : v).trim(); return /^[\d,]+$/.test(t) && /\d/.test(t) ? Number(t.replace(/,/g, "")).toLocaleString("ko-KR") : t; }
  function moneyRaw(v) { var t = String(v == null ? "" : v).trim(); return /^[\d,]+$/.test(t) ? t.replace(/,/g, "") : t; }
  sec.addEventListener("input", function (e) {
    var el = e.target; if (!el.classList || !el.classList.contains("money")) return;
    var v = el.value, pos = el.selectionStart == null ? v.length : el.selectionStart, dig = v.slice(0, pos).replace(/[^\d]/g, "").length;
    if (!/^[\d,]*$/.test(v)) return;   // 글이 섞이면 손대지 않음
    var f = money(v); if (f === v) return; el.value = f;
    var i = 0, n = 0; while (i < f.length && n < dig) { if (/\d/.test(f[i])) n++; i++; }
    try { el.setSelectionRange(i, i); } catch (er) {}
  }, true);
  function N(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.\-]/g, "")); return isNaN(n) ? 0 : n; }
  function ea2(v) { return esc(v).replace(/"/g, "&quot;"); }
  function nid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 4); }
  function rows(obj) { return Object.keys(obj || {}).filter(function (k) { return obj[k] && !obj[k].del; }).map(function (k) { var x = obj[k]; x._id = k; return x; }).sort(function (a, b) { return (a.o == null ? 999 : a.o) - (b.o == null ? 999 : b.o); }); }
  // 지난 해 기록 (2021~2025 사장님 파일에서 개수만 모음 · 손님 이름 · 연락처는 안 넣음) — 서버 cafesui.xmas.hist
  function HIST() { return J("cafesui.xmas.hist") || {}; }

  // ── 🎯 전사 목표 — o.goal = { total, note, it:{ id:{ k(종류), n(이름), p(단가), t(목표 개수), o(순서), del } } }
  var KINDS = ["홀", "중간", "미니", "조각", "기타"];
  var GOAL0 = [["홀", "딸기 생크림 홀케이크"], ["홀", "딸기 초코 홀케이크"], ["미니", "딸기 미니케이크"], ["조각", "딸기 생크림 조각"], ["조각", "딸기 초코 조각"]];
  function goalOf(y) {
    var o = load(y); if (o.goal) return o.goal;
    var pv = load(y - 1).goal, it = {};
    if (pv && pv.it) rows(pv.it).forEach(function (x, i) { it["g" + i] = { k: x.k, n: x.n, p: x.p, t: "", o: i }; });
    else GOAL0.forEach(function (x, i) { it["g" + i] = { k: x[0], n: x[1], p: "", t: "", o: i }; });
    return { total: "", note: "", it: it, _v: 1 };
  }
  function goalEdit(y, fn) { xsave(y, function (o) { if (!o.goal) { var g = goalOf(y); delete g._v; o.goal = g; } o.goal.it = o.goal.it || {}; fn(o.goal); }); }
  function goalSum(g) {
    var s = { whole: 0, mini: 0, slice: 0, money: 0, sliceMoney: 0, byK: {} };
    rows(g.it).forEach(function (x) { var t = N(x.t); s.byK[x.k] = (s.byK[x.k] || 0) + t; if (x.k === "조각") s.sliceMoney += t * N(x.p); else s.money += t * N(x.p); if (x.k === "홀" || x.k === "중간") s.whole += t; else if (x.k === "미니") s.mini += t; else if (x.k === "조각") s.slice += t; });
    return s;
  }
  function histRow(y) { var h = HIST()[y] || {}, s = h.sum || {}; return s; }
  // 10/30 사장님 「종류 상관없이 11/11~12/25 총 300개 · 그중 12/21~25 180개 구분」 「기본 케이크랑 섞이지 않게 — 크리스마스 케이크 전사 목표만」
  //   g.from · g.to(전체 기간, 기본 11/11~12/25) · g.total · g.pf · g.pt(피크, 기본 12/21~25) · g.peak — 조각(기본 케이크)은 아래 따로 · 전사 목표 · 예상 매출에 안 넣음
  function gmd(v, dft) { var m = /(\d{1,2})[\/.\-](\d{1,2})/.exec(String(v || "")); return m ? (+m[1]) + "/" + (+m[2]) : dft; }
  function gday(y, v) { var p = v.split("/"); return y + "-" + pad(+p[0]) + "-" + pad(+p[1]); }
  function peakPlan(y, g) {   // 날짜별 생산 계획(크리스마스 케이크)에서 피크 기간 합
    var P = load(y).prod || {}, a = gday(y, gmd(g.pf, "12/21")), b = gday(y, gmd(g.pt, "12/25")), n = 0;
    rows(g.it).forEach(function (x) { if (x.k === "조각") return; var r = P[x._id] || {}; Object.keys(r).forEach(function (d) { if (d >= a && d <= b) n += N(r[d].p); }); });
    return n;
  }
  // ── 💬 작년 자료 코멘트 (10/30 · 사장님 「25년 자료를 전사 목표 안에 녹여서 코멘트처럼 · 주석에 메모가 다 돼 있어서 그것까지」)
  //    cafesui.xmas.hist[작년]의 실제 작업량 표 · 예상 수입안 · 예약 명단 개수 · 칸 주석(cm: [{s, tb, row, h(그 칸 머리), v, cm}])을
  //    품목 줄 아래 한 줄씩 · 상자 위에 묶음 메모로. 보기만 (작년 파일 그대로) · 끄기 cafesui.ui.xmg25
  var G25 = 1; try { G25 = localStorage.getItem("cafesui.ui.xmg25") === "0" ? 0 : 1; } catch (e) {}
  function pyH() { var h = HIST()[cur - 1]; return h && (h.tables || h.cm) ? h : null; }
  function gKey(x) { var n = x.n || ""; return /초코/.test(n) ? "초딸" : /피스타/.test(n) ? "피딸" : /말차/.test(n) ? "말딸" : /샤인/.test(n) ? "샤인" : /망고/.test(n) ? "망고" : /티라/.test(n) ? "티라" : /과일동산|과동/.test(n) ? "과일동산" : "딸"; }
  function gTre(k) { return k === "홀" ? /예약 홀케이크/ : k === "미니" ? /미니케이크 생산/ : k === "조각" ? /조각케이크 생산 수량(\(전날|$)/ : null; }
  function rowHit(lab, x) { lab = String(lab || "").replace(/\s/g, ""); if (!lab || /합계/.test(lab)) return false; if (x.k === "미니") return true; var k = gKey(x); return k === "딸" ? /^딸/.test(lab) : lab.indexOf(k) >= 0; }
  function isHead(c) { return c.row === c.h || /^\d{1,2}\/\d{1,2}|총\s*합계|^\[/.test(c.row); }
  function md2(s) { var m = /(\d{1,2})\/(\d{1,2})/.exec(String(s || "")); return m ? (+m[1]) + "/" + (+m[2]) : String(s || ""); }
  function cmTxt(c) { return esc(String(c.cm || "").replace(/\n+/g, " / ")); }
  function g25(x) {   // 품목 한 줄 코멘트
    var H = pyH(); if (!H) return "";
    var py = cur - 1, re = gTre(x.k), out = [];
    var T = re && (H.tables || []).filter(function (t) { return /실제 작업량/.test(t.s) && re.test(t.t); })[0];
    if (T && T.r) {
      var R = T.r, row = R.slice(1).filter(function (r) { return rowHit(r[0], x); })[0];
      if (row) {
        var tot = 0, days = [];
        for (var i = 1; i < R[0].length; i++) { if (/합계/.test(R[0][i])) continue; var v = N(row[i]); tot += v; if (v) days.push(md2(R[0][i]) + " " + v); }
        out.push("<b>실제 " + tot + (x.k === "조각" ? "판" : "개") + "</b>" + (days.length ? " (" + days.join(" · ") + ")" : ""));
      }
    }
    var IT = (H.tables || []).filter(function (t) { return /예상 수입안/.test(t.s); })[0];
    if (IT && IT.r) {
      var n = x.n || "", ir = IT.r.slice(1).filter(function (r) {
        var l = String(r[0] || "").replace(/\s/g, ""); if (!l) return false;
        if (x.k === "미니") return /미니/.test(l);
        if (x.k === "조각") return /조각$/.test(l) && (gKey(x) === "딸" ? /^딸기생크림조각/.test(l) : gKey(x) === "초딸" ? /초코/.test(l) : gKey(x) === "말딸" ? /말차/.test(l) : gKey(x) === "샤인" ? /샤인/.test(l) : gKey(x) === "망고" ? /망고/.test(l) : false);
        if (x.k === "홀") return /^크/.test(l) && !/미니/.test(l) && (/초코/.test(n) ? /초/.test(l.slice(1)) : !/초/.test(l.slice(1)) && !/피스타/.test(n));
        return false;
      })[0];
      if (ir) out.push("수입안 " + esc(ir[2]) + "개 × " + N(ir[1]).toLocaleString("ko-KR") + "원");
    }
    var cms = (H.cm || []).filter(function (c) { return re && re.test(c.tb) && !isHead(c) && rowHit(c.row, x); });
    if (!out.length && !cms.length) return '<div class="xg25 none">💬 ' + py + "년엔 없던 품목 (이름 · 맛이 다르면 비교 못 함)</div>";
    return '<div class="xg25">💬 <i>' + py + "년</i> " + out.join(" · ") +
      (cms.length ? '<ul class="xg25m">' + cms.map(function (c) { return "<li><em>" + esc(md2(c.h) || "") + (/계획안/.test(c.s) ? " 계획" : "") + "</em> 「" + cmTxt(c) + "」</li>"; }).join("") + "</ul>" : "") + "</div>";
  }
  function g25box(kind, open) {   // 묶음 메모 상자 — cake: 홀 · 미니 머리 주석 + 해 정리 · slice: 조각 머리 주석 · mat: 3가지 대표 재료 주석
    var H = pyH(); if (!H || !G25) return "";
    var py = cur - 1, L = [], S = H.sum || {};
    function heads(re) { return (H.cm || []).filter(function (c) { return re.test(c.tb) && (isHead(c) || /합계/.test(c.row)); }).map(function (c) { return "<li><em>" + esc(/합계/.test(c.row) || /합계/.test(c.h) ? "합계" : md2(c.h)) + (/계획안/.test(c.s) ? " 계획" : "") + "</em> 「" + cmTxt(c) + "」</li>"; }); }
    if (kind === "cake") {
      if (S.line) L.push("<li><em>한 줄</em> " + esc(S.line) + "</li>");
      if (S.money) L.push("<li><em>예상 수입안</em> " + won(S.money) + " (조각 포함)</li>");
      var res = H.res || {}, rd = Object.keys(res).sort(); if (rd.length) L.push("<li><em>예약 명단</em> " + rd.map(function (d) { return md2(d.slice(5).replace("-", "/")) + " " + res[d].n + "건"; }).join(" · ") + " = " + rd.reduce(function (a, d) { return a + N(res[d].n); }, 0) + "건</li>");
      var PT = (H.tables || []).filter(function (t) { return /12\.1/.test(t.t); })[0];
      if (PT && PT.r) { var lastR = PT.r[PT.r.length - 1]; L.push("<li><em>12/1~17 예약 속도</em> " + PT.r.slice(1).filter(function (r) { return String(r[0]).slice(0, 4) && r[1] !== "" && r[1] != null && /\d{4}-/.test(String(r[0])); }).map(function (r) { return md2(String(r[0]).slice(5, 10).replace("-", "/")) + " " + r[1]; }).join(" · ") + (lastR && !lastR[0] ? " → 합 " + lastR[1] + "개" : "") + "</li>"); }
      L = L.concat(heads(/예약 홀케이크|미니케이크 생산/));
      String(S.lesson || "").split("\n").filter(Boolean).forEach(function (s) { L.push("<li><em>정리</em> " + esc(s) + "</li>"); });
    } else if (kind === "slice") {
      L = heads(/조각케이크 생산 수량/);
      if (S.slice) L.unshift("<li><em>한 줄</em> 조각 " + esc(S.slice) + "</li>");
    } else if (kind === "mat") {
      L = (H.cm || []).filter(function (c) { return /대표 재료/.test(c.tb); }).map(function (c) { return "<li><em>" + esc(isHead(c) ? c.row : c.row + (c.v != null ? " " + c.v + (/딸기/.test(c.row) ? "팩" : /휘핑/.test(c.row) ? "개" : "통") : "")) + "</em> 「" + cmTxt(c) + "」</li>"; });
      var MT = (H.tables || []).filter(function (t) { return /실제 작업량/.test(t.s) && /대표 재료/.test(t.t); })[0];
      if (MT && MT.r) L.unshift("<li><em>실제 주문</em> " + MT.r.slice(1).filter(function (r) { return r[0] && r[6] !== "" && r[6] != null; }).map(function (r) { return esc(r[0]) + " " + r[6] + (/딸기/.test(r[0]) ? "팩" : /휘핑/.test(r[0]) ? "개" : "통") + (r[7] && !/\d{3}-\d{3,4}/.test(r[7]) ? " (" + esc(String(r[7]).slice(0, 30)) + ")" : ""); }).join(" · ") + "</li>");
    }
    if (!L.length) return "";
    var T0 = { cake: "📒 " + py + "년 크리스마스 케이크는 이랬어요 (파일 숫자 + 칸 주석 메모)", slice: "📒 " + py + "년 조각케이크 (파일 + 주석)", mat: "📒 " + py + "년 재료 (파일 + 주석)" }[kind];
    return '<details class="xg25box"' + (open ? " open" : "") + "><summary>" + T0 + '</summary><ul>' + L.join("") + "</ul></details>";
  }
  // 날짜별 생산 칸 — 지난 2년 같은 날 실제 작업 숫자 + 25년 칸 주석 (10/30 · 사장님 「날짜별 생산에도 25년 24년 작업표들이 코멘트로 작게」)
  function yRef(x, d, y) {
    var H = HIST()[y], re = gTre(x.k); if (!H || !re) return null;
    var T = (H.tables || []).filter(function (t) { return /실제 작업량/.test(t.s) && re.test(t.t); })[0]; if (!T || !T.r) return null;
    var R = T.r, k = (+d.slice(5, 7)) + "/" + (+d.slice(8)), ci = -1;
    for (var i = 1; i < R[0].length; i++) if (md2(R[0][i]) === k && /\(/.test(String(R[0][i]))) ci = i;
    var row = R.slice(1).filter(function (r) { return rowHit(r[0], x); })[0];
    var v = row && ci > 0 && row[ci] !== "" && row[ci] != null ? row[ci] : null;
    var cm = (H.cm || []).filter(function (c) { return re.test(c.tb) && /실제 작업량/.test(c.s) && !isHead(c) && rowHit(c.row, x) && md2(c.h) === k; }).map(function (c) { return String(c.cm).replace(/\n+/g, " / "); });
    return { v: v, cm: cm };
  }
  function yRefHtml(x, d) {
    var a = [], c = [];
    [cur - 1, cur - 2].forEach(function (y) { var r = yRef(x, d, y), so = soldRef(x, d, y), yy = String(y).slice(2) + "년 "; if (r && r.v != null) a.push(yy + r.v + (so && so.v != null ? " (매장 판매 " + so.v + ")" : "")); else if (so && so.v != null) a.push(yy + "매장 판매 " + so.v); if (r && r.cm.length) c = c.concat(r.cm.map(function (t) { return yy.trim() + ": " + t; })); if (so && so.cm.length) c = c.concat(so.cm.map(function (t) { return yy.trim() + " 매장: " + t; })); });
    return (a.length ? '<span class="xpref">' + esc(a.join(" · ")) + "</span>" : "") + (c.length ? '<span class="xpref xpcm" title="' + ea2(c.join("\n")) + '">💬 ' + esc(c.join(" / ")) + "</span>" : "");
  }
  function yHeadHtml(d) {   // 날짜 머리 주석(마감일 · 현장판매 시작 …)
    var k = (+d.slice(5, 7)) + "/" + (+d.slice(8)), out = [];
    [cur - 1, cur - 2].forEach(function (y) { var H = HIST()[y]; if (!H || !H.cm) return; H.cm.forEach(function (c) { if (/실제 작업량/.test(c.s) && isHead(c) && md2(c.h) === k) out.push(String(y).slice(2) + "년 " + String(c.cm).replace(/\n+/g, " / ")); }); });
    return out.length ? '<small class="xphd" title="' + ea2(out.join("\n")) + '">💬 ' + esc(out.join(" / ")) + "</small>" : "";
  }
  // ── 연결 도우미 (10/30 · 사장님 「다 따로 하지 말고 다 연결되게」)
  function prodSums(y) {   // 🍰 생산 계획(o.prod 계획 칸) 합 — 목표 · 재료 · 한눈에가 같이 씀
    var g = goalOf(y), P = load(y).prod || {}, pa = gday(y, gmd(g.pf, "12/21")), pb = gday(y, gmd(g.pt, "12/25")), o = { whole: 0, mini: 0, slice: 0, peak: 0, by: {} };
    rows(g.it).forEach(function (x) { var r = P[x._id] || {}, t = 0; Object.keys(r).forEach(function (d) { var v = N(r[d] && r[d].p); t += v; if (x.k !== "조각" && d >= pa && d <= pb) o.peak += v; }); o.by[x._id] = t; if (x.k === "조각") o.slice += t; else if (x.k === "미니") o.mini += t; else o.whole += t; });
    return o;
  }
  function dayCm(d) {   // 그 날짜(월/일)에 달린 지난 2년 머리 주석 · 일하는 스케줄 주석
    var k = (+d.slice(5, 7)) + "/" + (+d.slice(8)), out = [];
    [cur - 1, cur - 2].forEach(function (y) { var H = HIST()[y]; if (!H || !H.cm) return; H.cm.forEach(function (c) { if ((isHead(c) || /스케줄/.test(c.s)) && md2(c.h) === k && !/매장 판매/.test(c.tb)) out.push(String(y).slice(2) + "년 " + String(c.cm).replace(/\n+/g, " / ")); }); });
    return out;
  }
  function dayCmHtml(d) { var L = d ? dayCm(d) : []; return L.length ? '<span class="xck25">💬 ' + esc(L.join(" · ")) + "</span>" : ""; }
  function ckHead(d) { var L0 = ckItems(cur).filter(function (x) { return x.d === d; }), L = L0.slice(0, 2); return L.length ? (L0.length > 2 ? '<small class="xpck more" title="' + ea2(L0.slice(2).map(function (x) { return x.t; }).join("\n")) + '">✅ 할 일 ' + L0.length + "개 (+" + (L0.length - 2) + ")</small>" : "") + L.map(function (x) { return '<small class="xpck' + (x.done ? " done" : "") + '" title="' + ea2(x.t) + '">' + (x.done ? "✔ " : "✅ ") + esc(x.t.replace(/^★\s*/, "").split(/ — | \(|·/)[0].trim().slice(0, 16)) + "</small>"; }).join("") : ""; }
  function soldRef(x, d, y) {   // 그 날 매장 판매(25년 파일 날짜 시트 「매장 판매」 표) + 그 칸 주석
    var H = HIST()[y]; if (!H || (x.k !== "미니" && x.k !== "조각")) return null; var k = (+d.slice(5, 7)) + "/" + (+d.slice(8));
    var T = (H.tables || []).filter(function (t) { return /매장 판매/.test(t.t) && md2(t.s) === k; })[0];
    var key = x.k === "미니" ? /미니/ : ({ "딸": /딸기생크림/, "초딸": /초코/, "말딸": /말딸/, "샤인": /샤인/, "망고": /망고/, "과일동산": /과동/ })[gKey(x)];
    var v = null; if (T && T.r && key) { var r = T.r.slice(1).filter(function (r) { return key.test(String(r[0]).replace(/\s/g, "")); })[0]; if (r && r[1] !== "" && r[1] != null) v = r[1]; }
    var cm = x.k === "미니" ? (H.cm || []).filter(function (c) { return /매장 판매/.test(c.tb) && md2(c.s) === k; }).map(function (c) { return String(c.cm).replace(/\n+/g, " / "); }) : [];
    return v == null && !cm.length ? null : { v: v, cm: cm };
  }
  function goalRow(x) {
    return '<tr data-id="' + x._id + '"><td data-l="종류"><select class="xgi" data-f="k">' + KINDS.map(function (k) { return "<option" + (k === x.k ? " selected" : "") + ">" + k + "</option>"; }).join("") + '</select></td>' +
      '<td data-l="품목" class="gn"><input type="text" class="xgi" data-f="n" value="' + ea2(x.n) + '"></td><td data-l="단가(원)"><input type="text" inputmode="numeric" class="xgi num money" data-f="p" value="' + ea2(money(x.p)) + '">' + prHint(x) + '</td>' +
      '<td data-l="목표 개수"><input type="text" inputmode="numeric" class="xgi num" data-f="t" value="' + ea2(x.t) + '">' + (function () { var ps = prodSums(cur).by[x._id] || 0; return '<button type="button" class="xglink" data-go="prod" title="🍰 생산 계획으로">🍰 계획 ' + ps + (x.k === "조각" ? "판" : "개") + (x.k !== "조각" && N(x.t) && ps && ps !== N(x.t) ? " (" + (ps > N(x.t) ? "+" : "") + (ps - N(x.t)) + ")" : "") + "</button>"; })() + '</td><td data-l="예상 매출" class="num">' + won(N(x.p) * N(x.t)) + '</td><td class="gx"><button type="button" class="xcx" data-a="gdel" aria-label="빼기">✕</button></td></tr>' + (G25 && pyH() ? '<tr class="xg25r" data-id="' + x._id + '"><td colspan="6">' + g25(x) + "</td></tr>" : "");
  }
  function drawGoal(el) {
    var g = goalOf(cur), s = goalSum(g), tot = N(g.total), cakes = s.whole + s.mini, pk = N(g.peak), pp = peakPlan(cur, g);
    var F = gmd(g.from, "11/11"), T = gmd(g.to, "12/25"), PF = gmd(g.pf, "12/21"), PT = gmd(g.pt, "12/25");
    var XM = rows(g.it).filter(function (x) { return x.k !== "조각"; }), SL = rows(g.it).filter(function (x) { return x.k === "조각"; });
    var h = '<div class="xmbox"><div class="xmbh"><b>🎯 ' + cur + ' 크리스마스 케이크 전사 목표</b><button type="button" class="skbtn xpaopen">💰 가격표 옆에 열기 (스마트플레이스)</button><span>종류 상관없이 크리스마스 케이크(홀 · 중간 · 미니)만 — 기본 조각케이크는 아래에 따로 (전사 목표 · 예상 매출에 안 들어감)</span></div>' +
      '<div class="xmgoal2">' +
      '<div class="xgcard all"><b>① 전체 기간 목표</b><div class="xgper"><input type="text" class="xg xgd" data-g="from" value="' + ea2(F) + '" aria-label="시작 날짜"> ~ <input type="text" class="xg xgd" data-g="to" value="' + ea2(T) + '" aria-label="끝 날짜"></div>' +
        '<label class="xgnum">총 <input type="text" inputmode="numeric" class="xg" data-g="total" value="' + ea2(g.total) + '" placeholder="300"> 개</label>' +
        '<em class="' + (tot && cakes !== tot ? "off" : "") + '">품목 목표 합 ' + cakes + "개" + (tot ? (cakes === tot ? " · ✔ 같음" : " · " + (cakes > tot ? "+" : "") + (cakes - tot) + "개 차이") : "") + "</em></div>" +
      '<div class="xgcard peak"><b>② 그중 피크 목표</b><div class="xgper"><input type="text" class="xg xgd" data-g="pf" value="' + ea2(PF) + '" aria-label="피크 시작"> ~ <input type="text" class="xg xgd" data-g="pt" value="' + ea2(PT) + '" aria-label="피크 끝"></div>' +
        '<label class="xgnum">총 <input type="text" inputmode="numeric" class="xg" data-g="peak" value="' + ea2(g.peak || "") + '" placeholder="180"> 개</label>' +
        "<em>" + (tot && pk ? "전체의 " + Math.round(pk / tot * 100) + "% · 나머지 " + F + "~" + (function () { var d = new Date(cur, +PF.split("/")[0] - 1, +PF.split("/")[1] - 1); return (d.getMonth() + 1) + "/" + d.getDate(); })() + " " + (tot - pk) + "개" : "피크 기간 목표를 적어 주세요") + "</em>" +
        '<em class="' + (pk && pp && pp !== pk ? "off" : "") + '">🍰 날짜별 생산 계획 ' + PF + "~" + PT + " 합 " + pp + "개" + (pk && pp ? (pp === pk ? " · ✔ 같음" : " · " + (pp > pk ? "+" : "") + (pp - pk) + "개 차이") : "") + "</em></div>" +
      '<div class="xmkpi"><span>크리스마스 케이크 예상 매출</span><b>' + won(s.money) + "</b><em>홀 · 중간 " + s.whole + " · 미니 " + s.mini + "</em></div></div>" +
      (pyH() ? '<label class="xpchk xg25chk"><input type="checkbox" id="xg25Chk"' + (G25 ? " checked" : "") + '> 💬 ' + (cur - 1) + '년 자료 · 주석 메모 같이 보기</label>' : "") + g25box("cake", true) +
      '<div class="xmtw"><table class="xmt goalt"><thead><tr><th>종류</th><th>크리스마스 케이크</th><th>단가(원)</th><th>목표 개수</th><th>예상 매출</th><th></th></tr></thead><tbody>' +
      XM.map(goalRow).join("") + '</tbody><tfoot><tr><th colspan="3">합계</th><th class="num">' + cakes + '</th><th class="num">' + won(s.money) + '</th><th></th></tr></tfoot></table></div>' +
      '<button type="button" class="skbtn" data-a="gadd" data-k="홀">＋ 크리스마스 케이크 추가</button>' +
      '<div class="xmbox xgslice"><div class="xmbh"><b>🍰 기본 조각케이크 (크리스마스 주간 매장 판매 · 따로)</b><span>크리스마스 케이크 전사 목표 · 예상 매출에 안 넣음 · 재료 계산에만 판 수로 들어감</span></div>' +
      g25box("slice") +
      '<div class="xmtw"><table class="xmt goalt"><thead><tr><th>종류</th><th>조각케이크</th><th>단가(원)</th><th>목표 개수</th><th>예상 매출</th><th></th></tr></thead><tbody>' +
      SL.map(goalRow).join("") + '</tbody><tfoot><tr><th colspan="3">조각 합계</th><th class="num">' + s.slice + '</th><th class="num">' + won(s.sliceMoney) + '</th><th></th></tr></tfoot></table></div>' +
      '<button type="button" class="skbtn" data-a="gadd" data-k="조각">＋ 조각케이크 추가</button></div>' +
      '<label class="xmnote">메모 (배분 · 가격 근거 · 예시 계산)<textarea class="xg" data-g="note" rows="2">' + esc(g.note || "") + '</textarea></label></div>';
    // 지난 해 비교
    h += '<details class="xmbox xmdet"><summary>📊 지난 해와 비교 <small>2021~2025 크리스마스 파일 숫자</small></summary>' + compareTable() + '</details>';
    el.innerHTML = h;
  }
  var PER0 = { cream: [340, 170, 340], whip: [120, 60, 120], straw: [500, 250, 415] };
  var PERK = [["cream", "생크림 (500ml 통)", 500, "통"], ["whip", "휘핑크림 (1L)", 1000, "개"], ["straw", "딸기 (500g 팩)", 500, "팩"]];
  function compareTable() {
    var H = HIST(), ys = Object.keys(H).sort();
    if (!ys.length) return '<p class="xmempty">지난 해 기록을 불러오는 중이거나 아직 없습니다</p>';
    return '<div class="xmtw"><table class="xmt cmp"><thead><tr><th>해</th><th>목표</th><th>예약 (명단 합)</th><th>홀 실제</th><th>미니</th><th>조각</th><th>예상 매출</th><th>재료 · 부자재비</th></tr></thead><tbody>' +
      ys.map(function (y) { var s = H[y].sum || {}; return '<tr><th>' + y + '</th><td>' + esc(s.goal || "—") + '</td><td class="num">' + (H[y].resTotal || "—") + '</td><td class="num">' + esc(s.whole || "—") + '</td><td class="num">' + esc(s.mini || "—") + '</td><td class="num">' + esc(s.slice || "—") + '</td><td class="num">' + (s.money ? won(s.money) : "—") + '</td><td class="num">' + (s.cost ? won(s.cost) : "—") + "</td></tr>"; }).join("") + "</tbody></table></div>";
  }
  function goalEvents(el) {
    el.addEventListener("change", function (e) {
      var t2 = e.target, tr = t2.closest("tr");
      if (t2.id === "xg25Chk") { G25 = t2.checked ? 1 : 0; try { localStorage.setItem("cafesui.ui.xmg25", G25 ? "1" : "0"); } catch (e2) {} }
      else if (t2.classList.contains("xg")) { var f = t2.dataset.g, v = t2.value; if (t2.classList.contains("xgd")) { if (!/^\s*\d{1,2}[\/.\-]\d{1,2}\s*$/.test(v)) { alert("날짜를 「11/11」처럼 적어 주세요"); drawPane(true); return; } v = gmd(v, ""); } goalEdit(cur, function (g) { g[f] = v; }); }
      else if (t2.classList.contains("xgi")) { var id = tr.dataset.id, ff = t2.dataset.f, vv = t2.classList.contains("money") ? moneyRaw(t2.value) : t2.value.trim(); goalEdit(cur, function (g) { if (g.it[id]) g.it[id][ff] = vv; }); }
      else if (t2.classList.contains("xper")) { var r = tr.dataset.r, i = +t2.dataset.i, v3 = t2.value.trim(); xsave(cur, function (o) { o.per = o.per || JSON.parse(JSON.stringify(PER0)); o.per[r] = o.per[r] || PER0[r].slice(); o.per[r][i] = v3; }); }
      else if (t2.classList.contains("xslice")) { var v4 = t2.value.trim(); xsave(cur, function (o) { o.slicePan = v4; }); }
      else if (t2.classList.contains("xpm")) { var r5 = tr.dataset.r, f5 = t2.dataset.f === "q" ? "mq" : "ms", v5 = t2.value.trim(); xsave(cur, function (o) { o.plan = o.plan || {}; o.plan[f5] = o.plan[f5] || {}; o.plan[f5][r5] = v5; }); }
      else return;
      setTimeout(function () { drawPane(true); }, 0);
    });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "gadd") { var k = nid("g"), kk = b.dataset.k || "홀"; goalEdit(cur, function (g) { g.it[k] = { k: kk, n: "", p: "", t: "", o: Object.keys(g.it).length }; }); drawPane(); var inp = el.querySelector('tr[data-id="' + k + '"] [data-f="n"]'); if (inp) inp.focus(); }
      if (b.dataset.a === "gdel") { var id = b.closest("tr").dataset.id; if (!confirm("이 품목을 목표에서 뺄까요?")) return; goalEdit(cur, function (g) { if (g.it[id]) g.it[id].del = me() || "1"; }); drawPane(); }
    });
  }
  goalEvents(document.getElementById("xmGoal"));
  goalEvents(document.getElementById("xmMat"));   // 재료 화면의 대표 재료(1개당 g · 조각 판 수 · 주문할 개수)
  // ── 💰 가격표 옆 창 (10/30 · 사장님 「올해 크리스마스 케이크도 어사이드로 스마트플레이스 금액 확인해서 빠진 거 다 넣기」)
  //    cafesui.price(POS 캡쳐 + 스마트플레이스 예약 상품 파일)에서 전사 목표 품목마다 맞는 값을 찾아 보여 주고, 단가가 비었거나 다르면 「← 넣기」.
  var PRK = "cafesui.price";
  function prItems() { var o = J(PRK) || {}, it = o.it || {}; return Object.keys(it).filter(function (k) { return it[k] && !it[k].del && N(it[k].p); }).map(function (k) { var x = it[k]; return { id: k, c: x.c || "", n: x.n || "", p: N(x.p), m: x.m || "" }; }); }
  function flv(n) { n = String(n || ""); return /메론|멜론/.test(n) ? "melon" : /티라미수/.test(n) ? "tira" : /체리/.test(n) ? "cherry" : /무화과/.test(n) ? "fig" : /피스타/.test(n) ? "pista" : /말차/.test(n) ? "matcha" : /샤인/.test(n) ? "shine" : /망고/.test(n) ? "mango" : /보늬밤/.test(n) ? "bonui" : /초코/.test(n) ? "choco" : /딸기|생크림/.test(n) ? "straw" : "?"; }
  function prMatch(x) {   // 전사 목표 품목 → 가격표 한 줄 (올해 크리스마스 → 작년 크리스마스 → 평소 상품 순)
    var L = prItems(), f = flv(x.n), yy = String(cur).slice(2), XC = /크리스마스/;
    function pick(arr) { return arr.filter(function (p) { return flv(p.n) === f; })[0]; }
    if (x.k === "조각") return pick(L.filter(function (p) { return p.c === "조각 케이크"; }));
    if (x.k === "미니") return pick(L.filter(function (p) { return XC.test(p.c) && /미니/.test(p.n) && p.n.indexOf(yy + "년") >= 0; })) || pick(L.filter(function (p) { return XC.test(p.c) && /미니/.test(p.n); }));
    if (x.k === "홀") return pick(L.filter(function (p) { return XC.test(p.c) && !/미니/.test(p.n) && p.n.indexOf(yy + "년") >= 0; })) || pick(L.filter(function (p) { return XC.test(p.c) && !/미니/.test(p.n); }));
    return null;
  }
  function prHint(x) {
    var m = prMatch(x); if (!m) return '<span class="xprh none">가격표에 없음</span>';
    var same = N(x.p) === m.p, last = !m.n.match(new RegExp(String(cur).slice(2) + "년")) && /크리스마스/.test(m.c);
    return '<span class="xprh' + (same ? " ok" : "") + '" title="' + ea2(m.c + " · " + m.n) + '">' + (same ? "✔ " : "") + "가격표 " + m.p.toLocaleString("ko-KR") + "원" + (last ? " (작년)" : m.c === "조각 케이크" ? " (지금 POS)" : "") +
      (same ? "" : ' <button type="button" class="xprput" data-p="' + m.p + '">← 넣기</button>') + "</span>";
  }
  var prA = document.createElement("aside"); prA.className = "fcaside xpaside"; prA.id = "xmPrAside"; prA.hidden = true; prA.setAttribute("aria-label", "가격표"); document.body.appendChild(prA);
  var prQ = "", prCat = "xm";
  var PRC = [["xm", "🎄 크리스마스", function (p) { return /크리스마스/.test(p.c); }], ["hole", "케이크 (홀)", function (p) { return p.c === "케이크 (홀)"; }], ["slice", "조각", function (p) { return p.c === "조각 케이크"; }], ["off", "⏸ 미노출", function (p) { return /미노출/.test(p.c); }], ["all", "전체", function () { return true; }]];
  function prPaint() {
    if (prA.hidden) return;
    var L = prItems(), C = PRC.filter(function (c) { return c[0] === prCat; })[0] || PRC[0], q = prQ.trim();
    var xs = L.filter(q ? function (p) { return (p.n + " " + p.c + " " + p.m).indexOf(q) >= 0; } : C[2]);
    var yy2 = String(cur).slice(2) + "년"; xs.sort(function (a, b) { return (b.n.indexOf(yy2) >= 0) - (a.n.indexOf(yy2) >= 0); });
    var g = goalOf(cur), miss = rows(g.it).filter(function (x) { var m = prMatch(x); return !N(x.p) || (m && m.p !== N(x.p)); });
    var b = prA.querySelector(".fcab"), sy = b ? b.scrollTop : 0;
    prA.innerHTML = '<div class="fcah"><b>💰 가격표</b><span>POS · 스마트플레이스 예약 상품 (가격표 탭과 같은 값)</span><button type="button" class="xpaclose" aria-label="닫기">✕</button></div>' +
      '<div class="fcab"><input type="search" class="xpaq" placeholder="🔍 이름 찾기 (예: 미니 · 피스타치오)" value="' + ea2(prQ) + '">' +
      '<div class="xpacats">' + PRC.map(function (c) { return '<button type="button" class="xpacat" data-c="' + c[0] + '" aria-pressed="' + (c[0] === prCat && !q) + '">' + c[1] + " <i>" + L.filter(c[2]).length + "</i></button>"; }).join("") + "</div>" +
      (miss.length ? '<div class="xpamiss"><b>⚠ ' + cur + ' 전사 목표에서 단가가 비었거나 가격표와 다른 것 ' + miss.length + '개</b>' + miss.map(function (x) { return '<div data-id="' + x._id + '"><span>' + esc(x.n) + " <small>" + esc(x.k) + " · 지금 " + (N(x.p) ? N(x.p).toLocaleString("ko-KR") + "원" : "비어 있음") + "</small></span>" + prHint(x) + "</div>"; }).join("") + "</div>" : '<p class="xpaok">✔ ' + cur + " 전사 목표 단가가 가격표와 모두 같아요</p>") +
      '<div class="xpal">' + (xs.length ? xs.map(function (p) { return '<div class="xpai"><span><b>' + esc(p.n) + "</b><small>" + esc(p.c) + (p.m ? " · " + esc(p.m.slice(0, 70)) : "") + "</small></span><em>" + p.p.toLocaleString("ko-KR") + "원</em></div>"; }).join("") : '<p class="xmempty">찾는 상품이 없어요</p>') + "</div>" +
      '<p class="xmtiny">스마트플레이스 값은 10/22 받은 예약 상품 파일 기준 · 그 뒤 새로 올린 상품 · 바뀐 가격은 💰 가격표 탭 「📋 한 번에 붙여넣기」로 넣어 주세요</p></div>';
    var b2 = prA.querySelector(".fcab"); if (b2) b2.scrollTop = sy;
  }
  function prOpen() { prA.hidden = false; document.documentElement.classList.add("fcaside-on"); prPaint(); }
  function prClose() { prA.hidden = true; if (!document.querySelector(".fcaside:not([hidden])")) document.documentElement.classList.remove("fcaside-on"); }
  function prPut(id, v) { goalEdit(cur, function (g) { var x = g.it[id]; if (!x) return; if (N(x.p) && N(x.p) !== N(v)) x.prev = x.p; x.p = String(v); x.ed = "가격표 " + stampNow() + (me() ? " · " + me() : ""); }); drawPane(true); prPaint(); }
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    if (e.target.closest(".xpaopen")) { prOpen(); return; }
    if (e.target.closest(".xpaclose")) { prClose(); return; }
    var c = e.target.closest(".xpacat"); if (c) { prCat = c.dataset.c; prQ = ""; prPaint(); return; }
    var pb = e.target.closest(".xprput"); if (pb) { var row = pb.closest("[data-id]"); if (row) prPut(row.dataset.id, pb.dataset.p); }
  });
  prA.addEventListener("input", function (e) { if (e.target.classList.contains("xpaq")) { prQ = e.target.value; clearTimeout(prPaint.t); prPaint.t = setTimeout(function () { prPaint(); var q = prA.querySelector(".xpaq"); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !prA.hidden) prClose(); });
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf(PRK) >= 0 || ks.indexOf(PRE + cur) >= 0) prPaint(); });


  // ── 🧾 재료 · 부자재 — o.mat = { id:{ k(분류), n(품목), q(수량), s(주문처), c(금액), m(메모), pq · pc(작년), od · ind({by,at}: 주문함 · 입고), o, del } }
  var MK = ["포장", "데코", "재료", "크림 · 과일", "기타"];
  function matEdit(y, fn) { xsave(y, function (o) { o.mat = o.mat || {}; fn(o.mat); }); }
  function prevMat(y) {   // 작년 목록: 그 해 데이터에 있으면 그것, 없으면 지난 해 기록(파일)의 재료 리스트
    var pm = load(y - 1).mat; if (pm && Object.keys(pm).length) return rows(pm).map(function (x) { return { k: x.k, n: x.n, s: x.s, m: x.m, pq: x.q, pc: x.c }; });
    var h = HIST()[y - 1]; return h && h.mat ? h.mat : [];
  }
  function mainMat() {   // 🥛 3가지 대표 재료 — 🍰 생산 계획 합(비면 🎯 목표 개수)으로 · 1개당 g 고치기 · 주문할 개수 · 구매처 · 작년 주석
    var o = load(cur), per = o.per || PER0, ps = prodSums(cur), g = goalOf(cur), gs = goalSum(g), pl = o.plan || {}, mq = pl.mq || {}, ms = pl.ms || {}, MT = prevT(/실제 작업량/, /대표 재료/);
    var W = ps.whole || gs.whole, M = ps.mini || gs.mini, S = ps.slice || N(o.slicePan), src = function (a, lab) { return a ? "🍰 계획" : "🎯 목표"; };
    return '<div class="xmbox"><div class="xmbh"><b>🥛 3가지 대표 재료 (생크림 · 휘핑 · 딸기)</b><span>' + '홀 · 중간 ' + W + "개(" + src(ps.whole) + ") · 미니 " + M + "개(" + src(ps.mini) + ") · 조각 " + S + "판(" + src(ps.slice) + ') — 생산 계획에 적은 종류는 계획, 아직 안 적은 종류는 목표 개수로 · 1개당 g은 눌러서 고침 · 넉넉히 +10%</span></div>' +
      '<div class="xmtw"><table class="xmt per"><thead><tr><th>재료</th><th>홀 1개당 g</th><th>미니 1개당 g</th><th>조각 1판당 g</th><th>필요</th><th>주문할 개수</th><th>구매처 · 메모</th></tr></thead><tbody>' +
      PERK.map(function (r) {
        var p = per[r[0]] || PER0[r[0]], need = N(p[0]) * W + N(p[1]) * M + N(p[2]) * S;
        var pr = MT ? MT.r.slice(1).filter(function (x) { return String(x[0]).indexOf(r[1].split(" ")[0]) === 0; })[0] : null;
        return '<tr data-r="' + r[0] + '"><th>' + r[1] + '</th>' + [0, 1, 2].map(function (i) { return '<td><input type="text" inputmode="numeric" class="xper num" data-i="' + i + '" value="' + ea2(p[i]) + '"></td>'; }).join("") +
          '<td class="num">' + Math.round(need).toLocaleString("ko-KR") + 'g<br><b>' + Math.ceil(need / r[2]) + r[3] + '</b> <small>(+10% ' + Math.ceil(need * 1.1 / r[2]) + ')</small></td>' +
          '<td><input type="text" inputmode="numeric" class="xpm" data-f="q" value="' + ea2(mq[r[0]] || "") + '">' + (pr ? '<span class="xpref">' + (cur - 1) + "년 " + esc(pr[6]) + r[3] + "</span>" : "") + '</td><td><input type="text" class="xpm" data-f="s" value="' + ea2(ms[r[0]] || "") + '">' + (pr && pr[7] ? '<span class="xpref">' + (cur - 1) + "년 " + esc(oneLine(pr[7]).replace(/\(?0\d{1,2}-\d{3,4}-\d{4}\)?/g, "").slice(0, 40)) + "</span>" : "") + "</td></tr>";
      }).join("") + '</tbody></table></div>' + g25box("mat") +
      '<label class="xmnote xmshort">조각케이크 판 수 (생산 계획이 비었을 때 쓰는 목표)<input type="text" inputmode="numeric" class="xslice" value="' + ea2(o.slicePan || "") + '" placeholder="25년 실제 134판"></label></div>';
  }
  function drawMat(el) {
    var L = rows(load(cur).mat), cost = 0, od = 0, ind = 0, pcost = 0;
    L.forEach(function (x) { cost += N(x.c); pcost += N(x.pc); if (x.od) od++; if (x.ind) ind++; });
    var h = mainMat() + '<div class="xmbox"><div class="xmbh"><b>🧾 ' + cur + ' 재료 · 부자재 준비</b><span>품목마다 수량 · 주문처 · 금액 · 메모를 적고, 주문하면 「주문함」, 들어오면 「입고」를 누르세요 · 흐린 글씨는 작년 숫자</span></div>' +
      '<div class="xmgoaltop"><div class="xmkpi"><span>품목</span><b>' + L.length + '개</b></div><div class="xmkpi"><span>주문함</span><b>' + od + ' / ' + L.length + '</b></div><div class="xmkpi"><span>입고</span><b>' + ind + ' / ' + L.length + '</b></div><div class="xmkpi"><span>금액 합</span><b>' + won(cost) + '</b><em>' + (pcost ? "작년 " + won(pcost) : "") + '</em></div></div>';
    if (!L.length) h += '<p class="xmempty">아직 목록이 없습니다 · 아래 「작년 목록 불러오기」를 누르면 작년 품목 · 주문처 · 메모가 들어옵니다 (작년 수량 · 금액이 칸에 들어가니 올해 맞게 고치세요)</p>';
    MK.forEach(function (k) {
      var G = L.filter(function (x) { return (x.k || "기타") === k; }); if (!G.length) return;
      h += '<h4 class="xmgh">' + k + ' <small>' + G.length + '개</small></h4><div class="xmmat">' + G.map(function (x) {
        return '<div class="xmm' + (x.ind ? " in" : x.od ? " od" : "") + '" data-id="' + x._id + '">' +
          '<div class="xmmh"><textarea class="xmi xmn2" data-f="n" rows="1" placeholder="품목">' + esc(x.n || "") + '</textarea><select class="xmi" data-f="k">' + MK.map(function (z) { return "<option" + (z === (x.k || "기타") ? " selected" : "") + ">" + z + "</option>"; }).join("") + '</select><button type="button" class="xcx" data-a="mdel" aria-label="빼기">✕</button></div>' +
          '<div class="xmmg"><label>수량<input type="text" class="xmi" data-f="q" value="' + ea2(x.q) + '" placeholder="' + ea2(x.pq ? "작년 " + x.pq : "") + '"></label><label>금액(원)<input type="text" inputmode="numeric" class="xmi money" data-f="c" value="' + ea2(money(x.c)) + '" placeholder="' + ea2(x.pc ? "작년 " + N(x.pc).toLocaleString("ko-KR") : "") + '"></label><label class="w">주문처<input type="text" class="xmi" data-f="s" value="' + ea2(x.s) + '"></label></div>' +
          '<label class="xmmm">메모<textarea class="xmi" data-f="m" rows="1">' + esc(x.m || "") + '</textarea></label>' +
          '<div class="xmmb"><button type="button" class="xmst" data-a="od" aria-pressed="' + !!x.od + '">' + (x.od ? "✔ 주문함 · " + esc(nim(x.od.by)) + " " + esc(x.od.at) : "주문함") + '</button><button type="button" class="xmst" data-a="ind" aria-pressed="' + !!x.ind + '">' + (x.ind ? "✔ 입고 · " + esc(nim(x.ind.by)) + " " + esc(x.ind.at) : "입고") + "</button></div></div>";
      }).join("") + "</div>";
    });
    h += '<div class="xmbtns"><button type="button" class="skbtn" data-a="madd">＋ 품목 추가</button><button type="button" class="skbtn" data-a="mload">↓ 작년 목록 불러오기 (없는 품목만)</button></div></div>';
    el.innerHTML = h;
    Array.prototype.forEach.call(el.querySelectorAll("textarea"), grow2);
  }
  (function (el) {
    el.addEventListener("input", function (e) { if (e.target.tagName === "TEXTAREA") grow2(e.target); });
    el.addEventListener("change", function (e) {
      var t2 = e.target; if (!t2.classList.contains("xmi")) return;
      var id = t2.closest(".xmm").dataset.id, f = t2.dataset.f, v = t2.classList.contains("money") ? moneyRaw(t2.value) : t2.value.trim();
      matEdit(cur, function (m) { if (m[id]) m[id][f] = v; }); setTimeout(function () { drawPane(true); }, 0);
    });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a, card = b.closest(".xmm"), id = card && card.dataset.id;
      if (a === "madd") { var k = nid("m"); matEdit(cur, function (m) { m[k] = { k: "기타", n: "", o: Object.keys(m).length }; }); drawPane(); var i2 = el.querySelector('.xmm[data-id="' + k + '"] [data-f="n"]'); if (i2) i2.focus(); return; }
      if (a === "mload") {
        var P = prevMat(cur); if (!P.length) { alert("불러올 작년 목록이 없습니다"); return; }
        var have = {}; rows(load(cur).mat).forEach(function (x) { have[String(x.n).replace(/\s/g, "")] = 1; });
        var add = P.filter(function (x) { return x.n && !have[String(x.n).replace(/\s/g, "")]; });
        if (!add.length) { alert("작년 품목이 이미 다 들어 있습니다"); return; }
        matEdit(cur, function (m) { var n0 = Object.keys(m).length; add.forEach(function (x, i) { m["p" + (n0 + i)] = { k: x.k || "기타", n: x.n, s: x.s || "", m: x.m || "", pq: x.pq || x.q || "", pc: x.pc || x.c || "", q: String(x.pq || x.q || "").replace(/^0$/, ""), c: String(x.pc || x.c || "").replace(/^0$/, ""), o: n0 + i /* 10/21 사장님 「있는 것에서 수정」 — 작년 수량 · 금액을 칸에 넣어 두고 고침 */ }; }); });
        drawPane(); return;
      }
      if (!id) return;
      if (a === "mdel") { if (!confirm("「" + (card.querySelector('[data-f="n"]').value || "이 품목") + "」을(를) 목록에서 뺄까요?")) return; matEdit(cur, function (m) { if (m[id]) m[id].del = me() || "1"; }); drawPane(); return; }
      if (a === "od" || a === "ind") {
        var w = me(); if (!w) { alert("먼저 이름을 고르세요 (누가 했는지 남깁니다)"); return; }
        matEdit(cur, function (m) { if (!m[id]) return; if (m[id][a]) delete m[id][a]; else m[id][a] = { by: w, at: stampNow() }; }); drawPane();
      }
    });
  })(document.getElementById("xmMat"));

  // ── 🍰 날짜별 생산 — o.days = ["YYYY-MM-DD"…] (기본 12/18~12/25 · 일요일 빼고) · o.prod = { 품목id: { 날짜: { p(계획), a(실제) } } }
  function daysOf(y) { var o = load(y); if (o.days && o.days.length) return o.days.slice().sort(); var a = []; for (var d = 18; d <= 25; d++) { var dt = new Date(y, 11, d); if (dt.getDay() !== 0 || d === 25) a.push(ymd(dt)); } return a; }
  // 💡 생산 제안 (10/30 · 사장님 「23일 24일 당일 케이크 한 5개씩 깔아볼까? 날짜별 생산에 제안으로」)
  //    o.sug = { id: { d 날짜, it 품목 id(전사 목표), n 개수, t 이유, by, at, ap(계획에 넣음: 누가 언제), del } } — 날짜 머리 · 칸에 💡 · 「＋ 계획에 넣기」 = 계획 칸에 n 더함
  function sugs(y) { var S = load(y).sug || {}; return Object.keys(S).filter(function (k) { return S[k] && !S[k].del; }).map(function (k) { var x = S[k]; x._id = k; return x; }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; }); }
  function sugHead(d) { var L = sugs(cur).filter(function (x) { return x.d === d; }); return L.length ? L.map(function (x) { if (x.nt) return '<small class="xpsug nt" title="' + ea2(x.t || "") + '">📌 ' + esc(x.t || "") + "</small>"; return '<small class="xpsug' + (x.ap ? " ap" : "") + '" title="' + ea2(x.t || "") + '">💡 ' + "제안 " + esc((((goalOf(cur).it || {})[x.it] || {}).n) || (x.t || "").slice(0, 12)) + (x.n ? " +" + esc(x.n) : "") + (x.ap ? " ✔" : "") + "</small>"; }).join("") : ""; }
  function sugCell(id, d) { var L = sugs(cur).filter(function (x) { return x.d === d && x.it === id; }); return L.length ? L.map(function (x) { return '<span class="xpsg' + (x.ap ? " ap" : "") + '">💡 제안 +' + esc(x.n || "") + (x.ap ? " · 넣음" : "") + "</span>"; }).join("") : ""; }
  function sugBox() {
    var L = sugs(cur), g = goalOf(cur), IT = g.it || {};
    return '<div class="xpsugbox"><div class="xpsbh"><b>💡 생산 제안 · 📌 날짜 메모</b><span>' + (cur - 1) + '년 기록 · 주석에서 나온 제안 · 「＋ 계획에 넣기」를 누르면 그 날 계획 칸에 더해져요 (안 누르면 제안으로만) · 📌는 그 날 꼭 알아 둘 것</span><button type="button" class="skbtn" data-a="sgadd">＋ 제안 추가</button><button type="button" class="skbtn" data-a="sgnote">＋ 날짜 메모</button></div>' +
      (L.length ? (function () { var seen = {}, out = []; L.forEach(function (x) { if (!x.nt) { out.push(x); return; } if (seen[x.t]) { seen[x.t].ds.push(x.d); seen[x.t].ids.push(x._id); return; } var y2 = { nt: 1, t: x.t, by: x.by, at: x.at, d: x.d, ds: [x.d], ids: [x._id], _id: x._id }; seen[x.t] = y2; out.push(y2); }); return out; })().map(function (x) { var itn = IT[x.it] ? IT[x.it].n : ""; if (x.nt) return '<div class="xpsg1 nt" data-s="' + x.ids.join(",") + '"><span class="xpsd">' + (x.ds.length > 1 ? md(x.ds[0]) + "~" + md(x.ds[x.ds.length - 1]) : mdw(x.d)) + '</span><span class="xpst"><b>📌 ' + esc(x.t || "") + "</b><small>날짜 메모 · " + esc(nim(x.by) || "") + " " + esc(x.at || "") + '</small></span><button type="button" class="xcx" data-a="sgdel" aria-label="메모 빼기">✕</button></div>'; return '<div class="xpsg1' + (x.ap ? " ap" : "") + '" data-s="' + x._id + '"><span class="xpsd">' + mdw(x.d) + '</span><span class="xpst"><b>' + esc(itn || "품목 미정") + (x.n ? " +" + esc(x.n) + "개" : "") + "</b> " + esc(x.t || "") + "<small>" + esc(nim(x.by) || "") + " " + esc(x.at || "") + (x.ap ? " · 계획에 넣음 " + esc(x.ap) : "") + "</small></span>" +
        (x.ap ? '<em class="xpsok">✔ 계획에 넣음</em>' : (x.it && x.n ? '<button type="button" class="skbtn prim" data-a="sgap">＋ 계획에 넣기</button>' : "")) + '<button type="button" class="xcx" data-a="sgdel" aria-label="제안 빼기">✕</button></div>'; }).join("") : '<p class="xmempty">아직 제안이 없어요</p>') + "</div>";
  }
  function drawProd(el) {   // 🍰 생산 계획 (10/30 · 날짜별 생산 + 주간 계획표 ① 합침) — 위: 목표 ↔ 계획 숫자 · 💡 제안 · 표(홀 · 중간 / 미니 / 조각(판)) · 칸마다 작년 숫자 · 주석
    var g = goalOf(cur), it = rows(g.it), D = daysOf(cur), P = load(cur).prod || {}, ps = prodSums(cur), gs = goalSum(g), py = cur - 1;
    var pa = gday(cur, gmd(g.pf, "12/21")), pb = gday(cur, gmd(g.pt, "12/25")), gCake = gs.whole + gs.mini, pCake = ps.whole + ps.mini;
    var sg = sugs(cur).filter(function (x) { return !x.nt && !x.ap && x.it; }).length, t0 = today();
    function kp(lab, b, em, off, go) { return '<button type="button" class="xpk' + (off ? " off" : "") + '"' + (go ? ' data-go="' + go + '"' : "") + "><span>" + lab + "</span><b>" + b + "</b>" + (em ? "<em>" + em + "</em>" : "") + "</button>"; }
    var h = '<div class="xmbox"><div class="xmbh"><b>🍰 ' + cur + ' 생산 계획</b><span>날짜마다 몇 개 만들지(윗칸 계획 · 아랫칸 실제) · 칸 아래 회색 = 작년 · 재작년 같은 날 · 💬 = ' + py + '년 파일 주석 · ✅ = 그 날 할 일 · 💡 = 제안 · 📌 = 날짜 메모</span></div>' +
      '<div class="xmbtns"><label class="xpchk"><input type="checkbox" id="xpRefChk"' + (PLREF ? " checked" : "") + "> 작년 · 재작년 숫자 · 주석 같이 보기</label>" +
      '<button type="button" class="skbtn" data-a="plwide">' + (document.documentElement.classList.contains("xmwide") ? "↩ 원래 폭으로" : "⛶ 넓게 보기") + '</button><button type="button" class="skbtn" data-a="plprint">🖨 인쇄 · PDF</button><button type="button" class="skbtn xpaopen">💰 가격표</button></div>' +
      '<div class="xpkpis">' + kp("🎯 크리스마스 케이크 목표 → 계획", gCake + " → " + pCake + "개", gmd(g.from, "11/11") + "~" + gmd(g.to, "12/25") + (pCake && gCake ? " · " + (pCake - gCake >= 0 ? "+" : "") + (pCake - gCake) : " · 계획을 적어 주세요"), pCake && gCake && pCake !== gCake, "goal") +
        kp("🔥 피크 " + md(pa) + "~" + md(pb) + " 목표 → 계획", (g.peak ? esc(g.peak) : "—") + " → " + ps.peak + "개", N(g.peak) && ps.peak ? (ps.peak - N(g.peak) >= 0 ? "+" : "") + (ps.peak - N(g.peak)) + "개" : "", N(g.peak) && ps.peak && ps.peak !== N(g.peak), "goal") +
        kp("🍰 조각 (기본 케이크)", (N(load(cur).slicePan) || "—") + " → " + ps.slice + "판", "목표 판 → 계획 판", 0, "goal") +
        kp("💡 제안", sg + "개 남음", sg ? "「＋ 계획에 넣기」를 눌러야 계획에 들어가요" : "모두 반영", sg, "") + "</div>" +
      sugBox() +
      '<label class="xmnote xmshort">생산 날짜 (쉼표로 · 예: 12/18, 12/19 …)<input type="text" class="xdays" value="' + ea2(D.map(function (s) { return (+s.slice(5, 7)) + "/" + (+s.slice(8)); }).join(", ")) + '"></label>' +
      '<div class="xmtw"><table class="xmt prod"><thead><tr><th>품목</th>' + D.map(function (s) { var dw = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8)).getDay(); return '<th class="' + (s >= pa && s <= pb ? "peak" : "") + (s === t0 ? " now" : "") + (dw === 6 ? " sat" : dw === 0 ? " sun" : "") + '">' + mdw(s) + sugHead(s) + ckHead(s) + (PLREF ? yHeadHtml(s) : "") + "</th>"; }).join("") + '<th>합계</th></tr></thead><tbody>';
    var GR = [["🎂 홀 · 중간 (크리스마스 케이크)", function (x) { return x.k === "홀" || x.k === "중간" || x.k === "기타"; }, "개"], ["🧁 미니 (크리스마스 케이크)", function (x) { return x.k === "미니"; }, "개"], ["🍰 조각 · 기본 케이크 (판)", function (x) { return x.k === "조각"; }, "판"]];
    var tfoot = "";
    GR.forEach(function (G) {
      var L = it.filter(G[1]); if (!L.length) return;
      var colP = D.map(function () { return 0; }), colA = D.map(function () { return 0; });
      h += '<tr class="xpg"><th colspan="' + (D.length + 2) + '">' + G[0] + "</th></tr>";
      L.forEach(function (x) {
        var r = P[x._id] || {}, sp = 0, sa = 0;
        h += '<tr data-id="' + x._id + '"><th>' + esc(x.n || "(이름 없음)") + ' <small>' + esc(x.k) + (x.t ? " · 목표 " + esc(x.t) + (x.k === "조각" ? "조각" : "개") : "") + "</small></th>" + D.map(function (s, i) {
          var c = r[s] || {}; sp += N(c.p); sa += N(c.a); colP[i] += N(c.p); colA[i] += N(c.a);
          return '<td><input type="text" inputmode="numeric" class="xpc" data-d="' + s + '" data-f="p" value="' + ea2(c.p) + '" aria-label="' + ea2(x.n + " " + md(s)) + ' 계획"><input type="text" inputmode="numeric" class="xpc a" data-d="' + s + '" data-f="a" value="' + ea2(c.a) + '" aria-label="' + ea2(x.n + " " + md(s)) + ' 실제">' + sugCell(x._id, s) + (PLREF ? yRefHtml(x, s) : "") + '</td>';
        }).join("") + '<td class="num"><b>' + sp + '</b><br><span class="a">' + sa + "</span></td></tr>";
      });
      h += '<tr class="xpsum"><th>' + G[0].split(" (")[0] + ' 합 <small>계획 / 실제</small></th>' + D.map(function (s, i) { return '<td class="num"><b>' + (colP[i] || "") + '</b><br><span class="a">' + (colA[i] || "") + "</span></td>"; }).join("") +
        '<td class="num"><b>' + colP.reduce(function (a, b) { return a + b; }, 0) + G[2] + '</b><br><span class="a">' + colA.reduce(function (a, b) { return a + b; }, 0) + "</span></td></tr>";
    });
    h += "</tbody></table></div>" + g25box("cake") + g25box("slice") + "</div>";
    var pv = HIST()[py];
    if (pv && pv.tables) {
      var T = pv.tables.filter(function (x) { return /실제 작업량/.test(x.s) && /홀케이크|미니케이크|조각케이크 생산 수량\(전날|조각케이크 생산 수량$/.test(x.t); });
      if (T.length) h += '<details class="xmbox xmdet"><summary>📊 ' + py + '년 실제 작업량 표 (파일 그대로)</summary>' + T.map(tableHtml).join("") + "</details>";
    }
    el.innerHTML = h;
  }
  (function (el) {
    el.addEventListener("change", function (e) {
      var t2 = e.target;
      if (t2.classList.contains("xpc")) { var id = t2.closest("tr").dataset.id, d = t2.dataset.d, f = t2.dataset.f, v = t2.value.trim(); xsave(cur, function (o) { o.prod = o.prod || {}; o.prod[id] = o.prod[id] || {}; o.prod[id][d] = o.prod[id][d] || {}; o.prod[id][d][f] = v; }); }
      else if (t2.classList.contains("xdays")) {
        var L = t2.value.split(/[,\s·]+/).map(function (s) { var m = /(\d{1,2})[\/.-](\d{1,2})/.exec(s); return m ? cur + "-" + pad(+m[1]) + "-" + pad(+m[2]) : ""; }).filter(Boolean);
        if (!L.length) { alert("날짜를 「12/18, 12/19」처럼 적어 주세요"); return; }
        xsave(cur, function (o) { o.days = L; });
      } else return;
      setTimeout(function () { drawPane(true); }, 0);
    });
    el.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a, row = b.closest("[data-s]"), sid = row && row.dataset.s;
      if (a === "sgap") {
        var S = (load(cur).sug || {})[sid]; if (!S || S.ap) return;
        if (!confirm(mdw(S.d) + " 계획 칸에 " + S.n + "개를 더할까요?")) return;
        xsave(cur, function (o) { var x = (o.sug || {})[sid]; if (!x || x.ap) return; o.prod = o.prod || {}; o.prod[x.it] = o.prod[x.it] || {}; var c = o.prod[x.it][x.d] = o.prod[x.it][x.d] || {}; c.p = String(N(c.p) + N(x.n)); x.ap = (me() || "") + " " + stampNow(); var D = daysOf(cur); if (D.indexOf(x.d) < 0) o.days = D.concat([x.d]).sort(); });
        drawPane(true);
      }
      if (a === "sgdel") { if (!confirm("이 제안 · 메모를 뺄까요? (계획에 넣은 숫자는 그대로)")) return; xsave(cur, function (o) { String(sid).split(",").forEach(function (k) { if (o.sug && o.sug[k]) o.sug[k].del = me() || "1"; }); }); drawPane(true); }
      if (a === "sgnote") {
        var rg = prompt("날짜 (하루면 12/23 · 여러 날이면 12/23-25)"); if (!rg) return; var mm = /(\d{1,2})[\/.](\d{1,2})(?:\s*[-~]\s*(?:(\d{1,2})[\/.])?(\d{1,2}))?/.exec(rg); if (!mm) { alert("날짜를 「12/23」 또는 「12/23-25」처럼 적어 주세요"); return; }
        var tx = prompt("메모 (예: 문구 픽 안 됨)"); if (!tx || !tx.trim()) return;
        var mo = +mm[1], d1 = +mm[2], mo2 = mm[3] ? +mm[3] : mo, d2 = mm[4] ? +mm[4] : d1, L2 = [];
        for (var dt = new Date(cur, mo - 1, d1); dt <= new Date(cur, mo2 - 1, d2) && L2.length < 31; dt.setDate(dt.getDate() + 1)) L2.push(ymd(dt));
        xsave(cur, function (o) { o.sug = o.sug || {}; L2.forEach(function (dd4) { o.sug[nid("n")] = { d: dd4, nt: 1, t: tx.trim(), by: me(), at: stampNow() }; }); });
        drawPane(true);
      }
      if (a === "sgadd") {
        var dd3 = prompt("날짜 (예: 12/23)"); if (!dd3) return; var m = /(\d{1,2})[\/.\-](\d{1,2})/.exec(dd3); if (!m) { alert("날짜를 「12/23」처럼 적어 주세요"); return; }
        var its = rows(goalOf(cur).it), list = its.map(function (x, i) { return (i + 1) + ") " + x.n; }).join("\n");
        var pick = prompt("어느 품목? 번호를 적어 주세요 (비우면 품목 없이 메모만)\n\n" + list, "1"); if (pick == null) return;
        var itx = its[(+pick || 0) - 1], n = itx ? prompt("몇 개 더?", "5") : ""; if (n == null) return;
        var t3 = prompt("이유 · 메모", "") || "";
        xsave(cur, function (o) { o.sug = o.sug || {}; o.sug[nid("s")] = { d: cur + "-" + pad(+m[1]) + "-" + pad(+m[2]), it: itx ? itx._id : "", n: String(N(n) || ""), t: t3, by: me(), at: stampNow() }; });
        drawPane(true);
      }
    });
  })(document.getElementById("xmProd"));

  // ── 🗂 주간 계획표 (10/30 · 사장님 「25년 크리스마스 파일을 토대로 26년 이 기간 계획 세우는 섹션 · 한번에 다 볼 수 있게」)
  //    25년 파일의 시트들(날짜별 생산 · 3가지 대표 재료 · 일하는 스케줄 · 12/1~17 예약 속도 · 시간대별 픽업)을 한 화면에 — 칸마다 작년 같은 날 글 · 숫자가 아래 회색으로.
  //    생산 숫자는 🍰 날짜별 생산(o.prod)과 같은 칸 · 나머지는 o.plan = { cols:[날짜], rn:{행:이름}, rdel:{행:1}, sc:{"행|날짜":글}, pre:{날짜:개수}, cap:{"날짜|시각":개수}, mq:{재료:개수}, ms:{재료:구매처} }
  var PLROWS = [["r1", "고정 멤버 (사장님 · 항아님 · 어머님)", 1], ["r2", "사장님 · 항아님 (작업 순서 · 개수)", 2], ["r3", "어머님", 3], ["r4", "사장님", 4], ["r5", "추가 인력", 5], ["r6", "대략 걸리는 시간 (1시간에 7개 기준)", 6], ["r7", "총 작업 개수", 9], ["r8", "피드백 (끝나고 꼭)", 8]];
  var PLREF = 1;   // 작년 글 보기 (기기 기억)
  try { PLREF = localStorage.getItem("cafesui.ui.xmplref") === "0" ? 0 : 1; } catch (e) {}
  function plOf(y) { return load(y).plan || {}; }
  function plCols(y) {
    var p = plOf(y); if (p.cols && p.cols.length) return p.cols.slice().sort();
    var a = []; for (var d = 16; d <= 26; d++) a.push(y + "-12-" + pad(d)); return a;
  }
  function md(s) { return (+s.slice(5, 7)) + "/" + (+s.slice(8)); }
  function prevT(re, re2) { var pv = HIST()[cur - 1]; return pv && pv.tables ? pv.tables.filter(function (x) { return re.test(x.s) && re2.test(x.t); })[0] : null; }
  function colIdx(T, s) { var R = T && T.r; if (!R) return -1; var k = md(s); for (var i = 1; i < R[0].length; i++) if (String(R[0][i]).replace(/\s/g, "").indexOf(k + "(") === 0) return i; return -1; }
  function prodRef(x, s) {   // 작년 실제 작업량 표에서 이 품목 · 같은 날짜 숫자
    var T = x.k === "홀" ? prevT(/실제 작업량/, /예약 홀케이크/) : x.k === "미니" ? prevT(/실제 작업량/, /미니케이크 생산/) : x.k === "조각" ? prevT(/실제 작업량/, /조각케이크 생산 수량(\(전날|$)/) : null;
    if (!T) return "";
    var n = x.n || "", key = /초코/.test(n) ? "초딸" : /피스타/.test(n) ? "피딸" : /말차/.test(n) ? "말딸" : /샤인/.test(n) ? "샤인" : /망고/.test(n) ? "망고" : /티라/.test(n) ? "티라" : x.k === "미니" ? "" : "딸한케";
    var row = T.r.slice(1).filter(function (r) { var l = String(r[0]); return !/합계/.test(l) && (key ? l.indexOf(key) >= 0 : true); })[0], i = colIdx(T, s);
    return row && i > 0 && row[i] !== "" && row[i] != null ? row[i] : "";
  }
  function oneLine(v) { return String(v == null ? "" : v).replace(/\s*\n\s*/g, " / ").replace(/\s{2,}/g, " ").trim(); }
  function drawPlan(el) {
    var y = cur, py = cur - 1, g = goalOf(y), it = rows(g.it), C = plCols(y), P = load(y).prod || {}, pl = plOf(y), H = HIST(), PH = H[py] || {};
    var t0 = today(), dx = dd(y + "-12-25", t0);
    var pa = gday(y, gmd(g.pf, "12/21")), pb = gday(y, gmd(g.pt, "12/25")); function inPk(d) { return d >= pa && d <= pb; }
    function hd(s) { var d = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8)); return '<th class="' + (d.getDay() === 0 ? "sun" : d.getDay() === 6 ? "sat" : "") + (s === t0 ? " now" : "") + (inPk(s) ? " peak" : "") + '">' + mdw(s) + (d.getDay() === 0 ? "<small>휴무</small>" : "") + "</th>"; }
    function ref(v) { return PLREF && v !== "" && v != null ? '<span class="xpref">' + py + "년 " + esc(v) + "</span>" : ""; }
    // ① 날짜별 생산
    var grp = [["홀 · 중간", function (x) { return x.k === "홀" || x.k === "중간"; }, "개"], ["미니", function (x) { return x.k === "미니"; }, "개"], ["조각", function (x) { return x.k === "조각"; }, "판"]];
    var tot = { cake: C.map(function () { return 0; }), mini: C.map(function () { return 0; }), slice: C.map(function () { return 0; }) }, sums = { whole: 0, mini: 0, slice: 0 }, refTot = C.map(function () { return 0; });
    var sliceGoal = it.filter(function (x) { return x.k === "조각"; }).reduce(function (a, x) { return a + N(x.t); }, 0), slicePan = N(load(y).slicePan);
    var prod = '<div class="xmtw"><table class="xmt xplan"><thead><tr><th class="sticky">품목</th><th>목표</th>' + C.map(function (d) { return hd(d).replace(/<\/th>$/, sugHead(d) + (PLREF ? yHeadHtml(d) : "") + "</th>"); }).join("") + "<th>계획 합</th></tr></thead><tbody>";
    grp.forEach(function (G) {
      var L = it.filter(G[1]); if (!L.length) return;
      prod += '<tr class="xpg"><th class="sticky" colspan="' + (C.length + 3) + '">' + G[0] + (G[2] === "판" ? " <small>(판 · 25년 파일처럼 판으로)</small>" : "") + "</th></tr>";
      L.forEach(function (x) {
        var r = P[x._id] || {}, s = 0, goalTxt = x.k === "조각" ? (x.t ? esc(x.t) + "조각" + (slicePan && sliceGoal ? "<small>≈" + Math.round(N(x.t) / sliceGoal * slicePan) + "판</small>" : "") : "—") : (x.t ? esc(x.t) + "개" : "—");
        prod += '<tr data-id="' + x._id + '"><th class="sticky">' + esc(x.n || "(이름 없음)") + "</th><td class=\"num gl\">" + goalTxt + "</td>" + C.map(function (d, i) {
          var c = r[d] || {}, rv = prodRef(x, d); s += N(c.p);
          if (x.k === "조각") tot.slice[i] += N(c.p); else if (x.k === "미니") tot.mini[i] += N(c.p); else tot.cake[i] += N(c.p);
          if (x.k !== "조각") refTot[i] += N(rv);
          return '<td><input type="text" inputmode="numeric" class="xpp" data-d="' + d + '" value="' + ea2(c.p) + '" aria-label="' + esc(x.n) + " " + md(d) + ' 계획">' + sugCell(x._id, d) + (PLREF ? yRefHtml(x, d) : "") + "</td>";
        }).join("") + '<td class="num"><b>' + s + "</b></td></tr>";
        if (x.k === "조각") sums.slice += s; else if (x.k === "미니") sums.mini += s; else sums.whole += s;
      });
    });
    function sumRow(lab, arr, unit, rr) { var s = arr.reduce(function (a, b) { return a + b; }, 0); return '<tr class="xpsum"><th class="sticky">' + lab + "</th><td></td>" + arr.map(function (v, i) { return '<td class="num"><b>' + (v || "") + "</b>" + (rr ? ref(rr[i] || "") : "") + "</td>"; }).join("") + '<td class="num"><b>' + s + unit + "</b></td></tr>"; }
    var cakeDay = C.map(function (d, i) { return tot.cake[i] + tot.mini[i]; });
    prod += "</tbody><tfoot>" + sumRow("케이크 (홀 · 중간 · 미니)", cakeDay, "개", refTot) + sumRow("조각", tot.slice, "판") + "</tfoot></table></div>";
    // ② 3가지 대표 재료
    var per = load(y).per || PER0, mq = pl.mq || {}, ms = pl.ms || {}, MT = prevT(/실제 작업량/, /대표 재료/);
    var mat = '<div class="xmtw"><table class="xmt xpmat"><thead><tr><th>재료</th><th>홀 · 중간 (' + sums.whole + ')</th><th>미니 (' + sums.mini + ')</th><th>조각 (' + sums.slice + '판)</th><th>필요 중량</th><th>필요 개수 (+10%)</th><th>주문할 개수</th><th>구매처 · 메모</th></tr></thead><tbody>' +
      PERK.map(function (r) {
        var p = per[r[0]] || PER0[r[0]], a = N(p[0]) * sums.whole, b = N(p[1]) * sums.mini, c = N(p[2]) * sums.slice, need = a + b + c;
        var pr = MT ? MT.r.slice(1).filter(function (x) { return String(x[0]).indexOf(r[1].split(" ")[0]) === 0; })[0] : null;
        return '<tr data-r="' + r[0] + '"><th>' + r[1] + '</th><td class="num">' + Math.round(a).toLocaleString("ko-KR") + 'g</td><td class="num">' + Math.round(b).toLocaleString("ko-KR") + 'g</td><td class="num">' + Math.round(c).toLocaleString("ko-KR") + 'g</td><td class="num">' + Math.round(need).toLocaleString("ko-KR") + "g</td>" +
          '<td class="num"><b>' + Math.ceil(need / r[2]) + r[3] + "</b> <small>(" + Math.ceil(need * 1.1 / r[2]) + ")</small></td>" +
          '<td><input type="text" inputmode="numeric" class="xpm" data-f="q" value="' + ea2(mq[r[0]] || "") + '">' + ref(pr ? pr[6] + r[3] : "") + '</td><td><input type="text" class="xpm" data-f="s" value="' + ea2(ms[r[0]] || "") + '">' + ref(pr ? oneLine(pr[7]).slice(0, 40) : "") + "</td></tr>";
      }).join("") + '</tbody></table></div><p class="xmtiny">1개 · 1판당 g은 🎯 전사 목표의 「🥛 대표 재료 계산」에서 고칩니다 · 위 생산 계획 숫자가 바뀌면 같이 바뀝니다</p>';
    // ③ 일하는 스케줄
    var ST = prevT(/스케줄/, /스케줄/), rn = pl.rn || {}, rdel = pl.rdel || {}, sc = pl.sc || {};
    var rowsL = PLROWS.map(function (r) { return { id: r[0], n: rn[r[0]] != null ? rn[r[0]] : r[1], ri: r[2] }; }).concat(Object.keys(rn).filter(function (k) { return /^u/.test(k); }).sort().map(function (k) { return { id: k, n: rn[k], ri: 0 }; })).filter(function (r) { return !rdel[r.id]; });
    var sch = '<div class="xmtw"><table class="xmt xpsch"><thead><tr><th class="sticky">근무 멤버 · 할 일</th>' + C.map(function (d) { var k = md(d), sc = PLREF ? (((PH.cm || []).filter(function (c) { return /스케줄/.test(c.s) && md2(c.h) === k; }).map(function (c) { return py % 100 + "년 " + String(c.cm).replace(/\n+/g, " / "); })).join(" / ")) : ""; return hd(d).replace(/<\/th>$/, ckHead(d) + (sc ? '<small class="xphd">💬 ' + esc(sc) + "</small>" : "") + "</th>"); }).join("") + "</tr></thead><tbody>" +
      rowsL.map(function (r) {
        var pr = ST && r.ri ? ST.r[r.ri] : null;
        return '<tr data-r="' + r.id + '"><th class="sticky"><textarea class="xpr" rows="1" aria-label="줄 이름">' + esc(r.n) + '</textarea><button type="button" class="xcx" data-a="pldel" aria-label="이 줄 빼기">✕</button>' + (pr && PLREF ? '<span class="xpref">' + py + "년 " + esc(oneLine(pr[0])) + "</span>" : "") + "</th>" +
          C.map(function (d) { var i = pr ? colIdx(ST, d) : -1, rv = i > 0 ? oneLine(pr[i]) : ""; return '<td><textarea class="xps" rows="2" data-d="' + d + '">' + esc(sc[r.id + "|" + d] || "") + "</textarea>" + (rv && PLREF ? '<span class="xpref long" title="' + ea2(rv) + '">' + py + "년 " + esc(rv) + "</span>" : "") + "</td>"; }).join("") + "</tr>";
      }).join("") + '</tbody></table></div><button type="button" class="skbtn" data-a="pladd">＋ 줄 추가</button>' + (ST && PLREF ? '<p class="xmtiny">' + py + "년 메모: 재단이랑 딸기 손질 시간 다 포함해서 1시간에 7개 만든다고 생각하고 (러프하게)</p>" : "");
    // ④ 12/1~12/17 예약 들어오는 속도
    var PT = prevT(/실제 작업량/, /12\.1/), pre = pl.pre || {}, pd = [], acc = 0, pacc = 0;
    for (var dd2 = 1; dd2 <= 17; dd2++) pd.push(y + "-12-" + pad(dd2));
    function preRef(s) { if (!PT) return ""; var k = py + s.slice(4); var r = PT.r.filter(function (x) { return String(x[0]).slice(0, 10) === k; })[0]; return r && r[1] !== "" && r[1] != null ? N(r[1]) : ""; }
    var preH = '<div class="xmtw"><table class="xmt xppre"><thead><tr><th class="sticky">날짜</th>' + pd.map(hd).join("") + '<th>합</th></tr></thead><tbody><tr><th class="sticky">' + y + "년 예약 개수<small>생크림 + 초코 + 미니</small></th>" +
      pd.map(function (d) { acc += N(pre[d]); var rv = preRef(d); pacc += N(rv); return '<td><input type="text" inputmode="numeric" class="xpe" data-d="' + d + '" value="' + ea2(pre[d] || "") + '">' + ref(rv) + "</td>"; }).join("") +
      '<td class="num"><b>' + acc + "</b>" + ref(pacc || "") + '</td></tr></tbody></table></div><p class="xmtiny">25년엔 12/1~12/9 예약 12개뿐이라 목표를 300 → 200 → 180개로 낮췄음 · 매일 네이버 예약 개수를 적어 작년과 비교</p>';
    // ⑤ 피크 날 시간대별 픽업
    var PD = C.filter(function (d) { return /-12-2[2-6]$/.test(d); }), cap = pl.cap || {}, slots = {}, PR = PH.res || {};
    PD.forEach(function (d) { var r = PR[py + d.slice(4)]; if (r && r.slots) Object.keys(r.slots).forEach(function (k) { slots[k] = 1; }); });
    ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"].forEach(function (k) { slots[k] = 1; });
    Object.keys(cap).forEach(function (k) { slots[k.split("|")[1]] = 1; });
    var SL = Object.keys(slots).sort(function (a, b) { return (/^\d/.test(a) ? a : "99") < (/^\d/.test(b) ? b : "99") ? -1 : 1; });
    var capH = '<div class="xmtw"><table class="xmt xpcap"><thead><tr><th class="sticky">픽업 시간</th>' + PD.map(hd).join("") + "</tr></thead><tbody>" +
      SL.map(function (k) { return '<tr><th class="sticky">' + esc(k) + "</th>" + PD.map(function (d) { var r = PR[py + d.slice(4)], rv = r && r.slots ? r.slots[k] || "" : ""; return '<td><input type="text" inputmode="numeric" class="xpc2" data-d="' + d + '" data-i="' + esc(k) + '" value="' + ea2(cap[d + "|" + k] || "") + '">' + ref(rv) + "</td>"; }).join("") + "</tr>"; }).join("") +
      '</tbody><tfoot><tr><th class="sticky">받을 개수 합</th>' + PD.map(function (d) { var s = SL.reduce(function (a, k) { return a + N(cap[d + "|" + k]); }, 0), r = PR[py + d.slice(4)], i = C.indexOf(d); return '<td class="num"><b>' + s + "</b>" + ref(r ? r.n : "") + (i >= 0 && cakeDay[i] ? '<small class="' + (s > cakeDay[i] ? "off" : "") + '">생산 ' + cakeDay[i] + "</small>" : "") + "</td>"; }).join("") + "</tr></tfoot></table></div>" +
      '<p class="xmtiny">시간대마다 받을 개수(상한)를 정해 두면 네이버 예약을 그만큼만 열기 쉬움 · 25년 24일 19시 15개 · 25일 11시 22개가 가장 많았음</p>';
    // 요약
    var gCake = it.filter(function (x) { return x.k !== "조각"; }).reduce(function (a, x) { return a + N(x.t); }, 0);
    var peak = C.reduce(function (a, d, i) { return a + (inPk(d) ? cakeDay[i] : 0); }, 0), pkRef = refTot.reduce(function (a, v, i) { return a + (inPk(C[i]) ? v : 0); }, 0);
    var top = '<div class="xpkpis"><div><span>크리스마스까지</span><b>' + (dx > 0 ? "D-" + dx : dx === 0 ? "오늘" : "지남") + "</b></div>" +
      "<div><span>크리스마스 케이크 목표 → 계획 (" + gmd(g.from, "11/11") + "~" + gmd(g.to, "12/25") + ")</span><b>" + gCake + " → " + (sums.whole + sums.mini) + '개</b><em class="' + (sums.whole + sums.mini && sums.whole + sums.mini !== gCake ? "off" : "") + '">' + (sums.whole + sums.mini ? (sums.whole + sums.mini - gCake >= 0 ? "+" : "") + (sums.whole + sums.mini - gCake) : "아직 안 적음") + "</em></div>" +
      "<div><span>조각 목표 → 계획</span><b>" + (slicePan || "—") + " → " + sums.slice + "판</b><em>" + sliceGoal + "조각</em></div>" +
      "<div><span>피크 " + md(pa) + "~" + md(pb) + " 목표 → 계획</span><b>" + (g.peak ? esc(g.peak) : "—") + " → " + peak + '개</b><em class="' + (N(g.peak) && peak && peak !== N(g.peak) ? "off" : "") + '">' + py + "년 같은 날 " + pkRef + "개</em></div>" +
      "<div><span>12/1~17 예약</span><b>" + acc + "개</b><em>" + py + "년 " + pacc + "개</em></div></div>";
    el.innerHTML = '<div class="xmbox xplanbox"><div class="xmbh"><b>🗓 ' + y + ' 크리스마스 주간 준비</b><span>' + py + '년 파일의 「일하는 스케줄 · 예약 속도 · 시간대별 픽업」을 그대로 · 칸 아래 회색 = ' + py + '년 같은 날</span></div>' +
      '<label class="xmnote xmshort">스케줄 날짜 (쉼표로)<input type="text" class="xpcols" value="' + ea2(C.map(md).join(", ")) + '"></label>' +
      '<h4 class="xmgh">👥 일하는 스케줄 (업무 + 시간) <small>칸에 그날 할 일 · 작업 순서 · 근무 시간</small></h4>' + sch +
      '<h4 class="xmgh">📈 12/1~12/17 예약 들어오는 속도</h4>' + preH +
      '<h4 class="xmgh">⏰ 피크 날 시간대별 픽업 <small>받을 개수(상한) · 회색은 ' + py + "년 실제 예약</small></h4>" + capH + "</div>";
    Array.prototype.forEach.call(el.querySelectorAll("textarea.xps, textarea.xpr"), grow2);
  }
  (function (el) {
    function plSave(fn) { xsave(cur, function (o) { o.plan = o.plan || {}; fn(o.plan, o); }); }
    el.addEventListener("input", function (e) { if (e.target.tagName === "TEXTAREA") grow2(e.target); });
    el.addEventListener("change", function (e) {
      var t2 = e.target, v = (t2.value || "").trim(), d = t2.dataset.d;
      if (t2.id === "xpRefChk") { PLREF = t2.checked ? 1 : 0; try { localStorage.setItem("cafesui.ui.xmplref", PLREF ? "1" : "0"); } catch (e2) {} }
      else if (t2.classList.contains("xpp")) { var id = t2.closest("tr").dataset.id; xsave(cur, function (o) { o.prod = o.prod || {}; o.prod[id] = o.prod[id] || {}; o.prod[id][d] = o.prod[id][d] || {}; o.prod[id][d].p = v; var D = daysOf(cur); if (v && D.indexOf(d) < 0) o.days = D.concat([d]).sort(); }); }
      else if (t2.classList.contains("xpm")) { var r = t2.closest("tr").dataset.r, f = t2.dataset.f === "q" ? "mq" : "ms"; plSave(function (p) { p[f] = p[f] || {}; p[f][r] = v; }); }
      else if (t2.classList.contains("xps")) { var r2 = t2.closest("tr").dataset.r; plSave(function (p) { p.sc = p.sc || {}; if (v) p.sc[r2 + "|" + d] = t2.value; else delete p.sc[r2 + "|" + d]; }); return; }
      else if (t2.classList.contains("xpr")) { var r3 = t2.closest("tr").dataset.r; plSave(function (p) { p.rn = p.rn || {}; p.rn[r3] = v; }); return; }
      else if (t2.classList.contains("xpe")) { plSave(function (p) { p.pre = p.pre || {}; p.pre[d] = v; }); }
      else if (t2.classList.contains("xpc2")) { plSave(function (p) { p.cap = p.cap || {}; p.cap[d + "|" + t2.dataset.i] = v; }); }
      else if (t2.classList.contains("xpcols")) {
        var L = v.split(/[,\s·]+/).map(function (s) { var m = /(\d{1,2})[\/.-](\d{1,2})/.exec(s); return m ? cur + "-" + pad(+m[1]) + "-" + pad(+m[2]) : ""; }).filter(Boolean);
        if (!L.length) { alert("날짜를 「12/16, 12/17」처럼 적어 주세요"); return; }
        plSave(function (p) { p.cols = L.sort(); });
      } else return;
      setTimeout(function () { drawPane(true); }, 0);
    });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a;
      if (a === "pladd") { var n = prompt("새 줄 이름 (예: 추가 인력 2 · 배달 · 딸기 입고)"); if (!n || !n.trim()) return; plSave(function (p) { p.rn = p.rn || {}; p.rn["u" + Date.now().toString(36)] = n.trim(); }); drawPane(true); }
      if (a === "pldel") { var r = b.closest("tr").dataset.r; if (!confirm("이 줄을 뺄까요? (적어 둔 글은 지우지 않고 숨김)")) return; plSave(function (p) { p.rdel = p.rdel || {}; p.rdel[r] = me() || "1"; }); drawPane(true); }
      if (a === "plwide") { document.documentElement.classList.toggle("xmwide"); try { localStorage.setItem("cafesui.ui.xmwide", document.documentElement.classList.contains("xmwide") ? "1" : ""); } catch (e2) {} drawPane(true); }
      if (a === "plprint") { document.body.classList.add("xmplprint"); setTimeout(function () { window.print(); setTimeout(function () { document.body.classList.remove("xmplprint"); }, 500); }, 50); }
    });
  })(document.getElementById("xmProdPane"));
  try { if (localStorage.getItem("cafesui.ui.xmwide") === "1") document.documentElement.classList.add("xmwide"); } catch (e) {}
  function wideSync() { var t18 = document.getElementById("tp18"); document.documentElement.classList.toggle("xmwideon", document.documentElement.classList.contains("xmwide") && TAB === "prod" && !!t18 && !t18.hidden); }
  document.addEventListener("click", function () { setTimeout(wideSync, 80); });

  // ── 🗓 준비 캘린더 — 체크리스트를 달력에 (9 · 10 · 11 · 12월) · 칸 안 항목을 누르면 체크
  function drawCal(el) {
    var L = ckItems(cur), by = {}, t0 = today(), D = daysOf(cur);
    L.forEach(function (x) { (by[x.d] = by[x.d] || []).push(x); });
    var months = [9, 10, 11, 12].filter(function (m) { return m >= 10 || L.some(function (x) { return +x.d.slice(5, 7) === m && x.d.slice(0, 4) == String(cur); }); });
    var done = L.filter(function (x) { return x.done; }).length;
    var h = '<div class="xmbox"><div class="xmbh"><b>🗓 ' + cur + ' 크리스마스 준비 캘린더</b><span>✅ 체크리스트가 날짜 칸에 들어갑니다 · <b>빈 곳(＋)을 누르면 그 날 할 일 넣기</b> · <b>항목을 누르면 고치기 · 체크</b> · 끌어서 다른 날로 옮기기 · 🍰 = 생산 날 · 체크 ' + done + " / " + L.length + '</span></div>' +
      '<div class="xmlegend"><i class="lg late"></i>밀림 <i class="lg today"></i>오늘까지 <i class="lg must"></i>꼭 <i class="lg done"></i>함</div>';
    months.forEach(function (m) {
      var first = new Date(cur, m - 1, 1), last = new Date(cur, m, 0).getDate();
      h += '<h4 class="xmgh">' + m + '월</h4><div class="xcal"><div class="xcw">일</div><div class="xcw">월</div><div class="xcw">화</div><div class="xcw">수</div><div class="xcw">목</div><div class="xcw">금</div><div class="xcw">토</div>';
      for (var i = 0; i < first.getDay(); i++) h += '<div class="xcd0"></div>';
      for (var d = 1; d <= last; d++) {
        var s = cur + "-" + pad(m) + "-" + pad(d), dw = new Date(cur, m - 1, d).getDay(), its = by[s] || [];
        h += '<div class="xcday' + (dw === 0 ? " sun" : "") + (s === t0 ? " now" : "") + (s.slice(5) === "12-25" ? " xday" : "") + (D.indexOf(s) >= 0 ? " prod" : "") + '" data-d="' + s + '"><span class="xcn">' + d + (s.slice(5) === "12-25" ? " 🎄" : D.indexOf(s) >= 0 ? " 🍰" : "") + (dw === 0 ? " <small>휴무</small>" : "") + "</span>" + '<button type="button" class="xcadd" aria-label="' + m + "월 " + d + '일 할 일 넣기" title="이 날 할 일 넣기">＋</button>' +
          its.map(function (x) { var st = stat(x); return '<button type="button" class="xci ' + st.c + (x.m ? " must" : "") + '" data-id="' + x.id + '" title="' + ea2(x.t + (x.w ? " · 담당 " + x.w : "") + " · " + st.s) + '">' + (x.done ? "✔ " : "") + esc(x.t.replace(/^★\s*/, "").split(/ — | \(/)[0]) + "</button>"; }).join("") + "</div>";
      }
      h += "</div>";
    });
    el.innerHTML = h + "</div>";
  }
  // 항목을 누르면 고치는 칸(날짜 · 할 일 · 담당 · 체크 · 빼기) · 빈 곳(＋)을 누르면 그 날 새 할 일 넣기 · 꾹 눌러(컴퓨터는 끌어서) 다른 날로 옮기기 (10/21 사장님 「캘린더에 직접 입력 · 수정」)
  var xcEl = document.getElementById("xmCal"), xcT = null;
  xcEl.addEventListener("click", function (e) {
    var b = e.target.closest(".xci");
    if (b) { clearTimeout(xcT); xEdit(b.dataset.id); return; }
    var c = e.target.closest(".xcday"); if (!c || !c.dataset.d) return;
    xEdit(null, c.dataset.d);
  });
  if (window.__CS_DRAG) window.__CS_DRAG(xcEl, { chip: ".xci", cell: ".xcday", key: function (c) { return c.dataset.d; },
    drop: function (chip, from, to) {
      var id = chip.dataset.id; clearTimeout(xcT);
      ckSave(cur, function (o) { if (o.ck[id]) { o.ck[id].d = to; o.ck[id].mv = (me() || "") + " " + stampNow(); } });
      drawPane(true); drawTodo();
      if (window.__CS_TOAST) window.__CS_TOAST("✅ " + mdw(to) + "로 옮겼어요");
    } });
  // 고치는 칸(작은 창) — 날짜 · 할 일 · 담당 · 체크
  function xEdit(id, newD, fromList) {
    var isNew = !id, x = isNew ? { d: newD, t: "", w: "", done: null } : ckItems(cur).filter(function (z) { return z.id === id; })[0]; if (!x) return;
    var old = document.getElementById("xmEdBox"); if (old) old.remove();
    var bx = document.createElement("div"); bx.id = "xmEdBox"; bx.className = "xmedm"; bx.setAttribute("role", "dialog"); bx.setAttribute("aria-label", isNew ? "할 일 넣기" : "체크 항목 고치기");
    bx.innerHTML = '<div class="xmedc"><div class="xmedh"><b>' + (isNew ? (fromList ? "＋ 할 일 추가 · 날짜를 골라 주세요" : "＋ " + mdw(newD) + " 할 일 넣기") : "✏ 체크 항목 고치기") + '</b><button type="button" class="xmedx" aria-label="닫기">✕</button></div>' +
      '<label><span>날짜</span><input type="date" class="xed-d" value="' + esc(x.d) + '"></label>' +
      '<label><span>할 일</span><textarea class="xed-t" rows="3"></textarea></label>' +
      '<label><span>담당</span><input type="text" class="xed-w" placeholder="예: 정항아 · 박혜빈"></label>' +
      '<label class="xed-mrow"><input type="checkbox" class="xed-m"' + (x.m ? " checked" : "") + '> <span>꼭 해야 하는 것 (빨갛게 · 7일 전부터 오늘 할 일에)</span></label>' +
      '<div class="xmedb"><button type="button" class="xed-s">' + (isNew ? "＋ 넣기" : "✔ 저장") + '</button>' + (isNew ? "" : '<button type="button" class="xed-k">' + (x.done ? "↩ 체크 풀기" : "☑ 했어요 체크") + '</button>') + '<button type="button" class="xed-c">취소</button>' + (isNew ? "" : '<button type="button" class="xed-x">🗑 빼기</button>') + '</div>' +
      (isNew ? "" : '<p class="xmedn">' + (x.done ? "✔ " + esc(stat(x).s) : "꾹 눌러(컴퓨터는 끌어서) 다른 날로 옮길 수도 있어요") + '</p>') + '</div>';
    document.body.appendChild(bx);
    var q = function (s) { return bx.querySelector(s); };
    q(".xed-t").value = x.t || ""; q(".xed-w").value = x.w || "";
    function close() { bx.remove(); }
    q(".xmedx").onclick = close; q(".xed-c").onclick = close;
    bx.addEventListener("click", function (e) { if (e.target === bx) close(); });
    q(".xed-s").onclick = function () {
      var d = q(".xed-d").value, tt = q(".xed-t").value.trim(), w = q(".xed-w").value.trim();
      var mm = q(".xed-m").checked;
      if (!tt) { alert("할 일이 비었어요"); return; }
      if (!d) { alert("날짜를 골라 주세요"); return; }
      if (isNew) {
        var nid = "u" + Date.now().toString(36);
        ckSave(cur, function (o) { o.ck[nid] = { d: d, t: tt, w: w, n: 50, add: (me() || "") + " " + stampNow() }; if (mm) o.ck[nid].m = 1; });
      } else ckSave(cur, function (o) { if (o.ck[id]) { o.ck[id].d = d; o.ck[id].t = tt; o.ck[id].w = w; if (mm) o.ck[id].m = 1; else delete o.ck[id].m; o.ck[id].ed = (me() || "") + " " + stampNow(); } });
      close(); drawPane(true); drawTodo(); if (typeof drawCk === "function") drawCk();
      if (window.__CS_TOAST) window.__CS_TOAST(isNew ? "✅ " + mdw(d) + "에 넣었어요" : "✅ 고쳤어요");
    };
    if (!isNew) {
      q(".xed-k").onclick = function () { if (toggle(cur, id)) { close(); drawPane(true); drawTodo(); } };
      q(".xed-x").onclick = function () {
        if (!confirm("「" + (x.t || "이 항목") + "」 을(를) 목록에서 뺄까요?")) return;
        ckSave(cur, function (o) { if (o.ck[id]) o.ck[id].del = me() || "1"; });
        close(); drawPane(true); drawTodo(); if (typeof drawCk === "function") drawCk();
      };
    }
    setTimeout(function () { q(".xed-t").focus(); }, 30);
  }

  // ── 📋 한눈에
  // ── 📋 한눈에 (10/30 다시 짬 · 사장님 「한눈에 딱딱 · 직관적으로 · 다 연결되게 · 25년 주석 피드백까지」)
  //    큰 카드 6개(누르면 그 화면으로) · 밀린 것 · 다음 할 것 · 📒 작년 피드백(주석 전부 · 묶음별) → 올해 (제안) · 결론
  var FB = {   // 작년 주석에서 나온 것 → 올해 해 볼 것 (제안) · 2025 파일 주석을 읽고 정리 (10/30)
    2025: {
      hole: "(제안) 25년 홀 159개 · 「최대한 150개까지 들어온다고 생각」 「당일 홀케이크 찾는 전화 23-24일 많이」 → 피크 180개 안에서 홀 비중을 먼저 정하고, 23 · 24일 당일 판매 홀(💡 제안 +5)로 전화 수요 받기",
      mini: "(제안) 미니 118개 중 12개 남음 · 「4개 중 1개 팔림 · 전시를 해놓자」 → 현장 미니는 진열 1개 꼭 · 23일 오후 남은 개수 보고 24 · 25일 생산 줄이기",
      slice: "(제안) 조각 생크림딸기 56개 남음 · 초코딸기 잘 나감 · 「내년에는 딸기생크림 양을 조절」 → 딸기 생크림 조각 줄이고 초코딸기 늘리기 · 22일에 23일 몫 미리 작업",
      mat: "(제안) 생크림 「20개 정도 여유」 · 딸기 22팩 남음 · 휘핑 12개씩 4번 택배 → 대표 재료는 계산값 +10%면 충분 · 택배는 나눠 받기",
      day: "(제안) 미니 마감 12/18 · 홀 마감 12/22 · 12/16 생크림 · 딸기 개수 측정 · 12/29 임시휴무 → 올해 체크리스트 날짜가 맞는지 확인"
    }
  };
  function fbGroups() {
    var H = pyH(); if (!H || !H.cm) return [];
    var G = [["hole", "🎂 홀케이크", /예약 홀케이크/, "prod"], ["mini", "🧁 미니", /미니케이크|매장 판매/, "prod"], ["slice", "🍰 조각", /조각케이크/, "prod"], ["mat", "🥛 재료", /대표 재료/, "mat"], ["day", "🗓 일정 · 작업", /스케줄/, "ck"]];
    return G.map(function (g) {
      var L = H.cm.filter(function (c) { return g[2].test(c.tb) || (g[0] === "day" && /스케줄/.test(c.s)); }).filter(function (c) { return !(g[0] !== "day" && /스케줄/.test(c.s)); });
      return { k: g[0], t: g[1], go: g[3], L: L };
    }).filter(function (g) { return g.L.length; });
  }
  function drawSum(el) {
    var L = ckItems(cur), t0 = today(), n = dd(cur + "-12-25", t0), done = L.filter(function (x) { return x.done; }).length, py = cur - 1;
    var late = L.filter(function (x) { return !x.done && x.d && x.d < t0; }), next = L.filter(function (x) { return !x.done && x.d >= t0; }).slice(0, 5);
    var g = goalOf(cur), s = goalSum(g), ps = prodSums(cur), mt = rows(load(cur).mat), od = mt.filter(function (x) { return x.od; }).length, ind = mt.filter(function (x) { return x.ind; }).length;
    var pv = histRow(py), o = load(cur), per = o.per || PER0, W = ps.whole || s.whole, M = ps.mini || s.mini, S2 = ps.slice || N(o.slicePan);
    var need = PERK.map(function (r) { var p = per[r[0]] || PER0[r[0]]; return r[1].split(" ")[0] + " " + Math.ceil((N(p[0]) * W + N(p[1]) * M + N(p[2]) * S2) * 1.1 / r[2]) + r[3]; });
    var pre = (o.plan || {}).pre || {}, preN = Object.keys(pre).reduce(function (a, k) { return a + N(pre[k]); }, 0);
    var sg = sugs(cur).filter(function (x) { return !x.nt && !x.ap && x.it; }).length;
    function card(go, ic, lab, big, sub, off) { return '<button type="button" class="xsc' + (off ? " off" : "") + '"' + (go ? ' data-go="' + go + '"' : "") + '><span class="xsl">' + ic + " " + lab + '</span><b>' + big + "</b><em>" + sub + "</em>" + (go ? '<i class="xsgo">열기 →</i>' : "") + "</button>"; }
    var h = '<div class="xsumcards">' +
      card("", "🎄", "크리스마스까지", n > 0 ? "D-" + n : n === 0 ? "오늘!" : "지남", cur + "-12-25" === t0 ? "메리 크리스마스" : "12/25(" + "일월화수목금토"[new Date(cur, 11, 25).getDay()] + ")") +
      card("goal", "🎯", "크리스마스 케이크 목표", (g.total ? esc(g.total) : "—") + "개", gmd(g.from, "11/11") + "~" + gmd(g.to, "12/25") + (g.peak ? " · 그중 " + gmd(g.pf, "12/21") + "~" + gmd(g.pt, "12/25") + " <b>" + esc(g.peak) + "개</b>" : "") + "<br>예상 매출 " + won(s.money)) +
      card("prod", "🍰", "생산 계획 (피크)", ps.peak + " / " + (g.peak ? esc(g.peak) : "—") + "개", "전체 " + (ps.whole + ps.mini) + "개 · 조각 " + ps.slice + "판" + (sg ? " · 💡 제안 " + sg + "개 남음" : ""), N(g.peak) && ps.peak !== N(g.peak)) +
      card("mat", "🧾", "재료 · 부자재", (mt.length ? od + " / " + mt.length : "—"), (mt.length ? "주문함 · 입고 " + ind : "목록 만들기") + "<br>" + need.join(" · ")) +
      card("ck", "✅", "할 일", done + " / " + L.length, late.length ? "⚠ 밀린 것 " + late.length + "개" : "밀린 것 없음", late.length) +
      card("prod", "📈", "12/1~17 예약", preN + "개", (function () { var T = pyH() && (pyH().tables || []).filter(function (t) { return /12\.1/.test(t.t); })[0], lr = T && T.r && T.r[T.r.length - 1]; return lr && !lr[0] && lr[1] ? py + "년 같은 기간 " + esc(lr[1]) + "개 · 매일 적기" : "매일 네이버 예약 개수 적기"; })()) + "</div>";
    h += '<div class="xmbox"><div class="xmbh"><b>' + (late.length ? "⚠ 밀린 것 · " : "") + '다음에 할 것</b><span>누르면 체크 · 💬 = 작년 같은 날 메모 · 전체는 ✅ 할 일 · 달력</span></div>' +
      late.concat(next).map(function (x) { var st = stat(x); return '<div class="xtr ' + st.c + (x.m ? " must" : "") + '" data-id="' + x.id + '"><button type="button" class="xcb" aria-pressed="' + !!x.done + '" aria-label="완료"></button><span class="xtt"><b>' + mdw(x.d) + "</b> " + esc(x.t) + (x.w ? " <i>· 담당 " + esc(x.w) + "</i>" : "") + dayCmHtml(x.d) + '</span><span class="xcs">' + (x.m ? '<em class="xmust">꼭</em>' : "") + esc(st.s) + "</span></div>"; }).join("") + "</div>";
    var FG = fbGroups(), fb = FB[py] || {};
    if (FG.length) {
      h += '<div class="xmbox xfb"><div class="xmbh"><b>📒 ' + py + '년 피드백 → ' + cur + '년에</b><span>' + py + '년 크리스마스 파일 칸 주석 ' + (pyH().cm || []).length + '개를 묶음별로 · 아래 (제안)은 그걸 보고 올해 해 볼 것 · 묶음을 누르면 그 화면으로</span></div>' +
        (pv.line ? '<p class="xfbline"><b>' + py + "년 한 줄</b> " + esc(pv.line) + "</p>" : "") +
        '<div class="xfbg">' + FG.map(function (G) {
          return '<div class="xfbc"><div class="xfbh"><b>' + G.t + '</b><button type="button" class="xglink" data-go="' + G.go + '">열기 →</button></div><ul>' + G.L.map(function (c) { var lab = /합계/.test(c.row) || (isHead(c) && /합계/.test(c.h)) ? "합계" : /^\[/.test(c.row) ? "전체" : isHead(c) ? md2(c.h) : (md2(c.h) + " " + c.row.replace(/한케$/, "")); if (/매장 판매/.test(c.tb)) lab = md2(c.s) + " 매장"; if (/대표 재료/.test(c.tb)) lab = c.row; return "<li><em>" + esc(lab) + (/계획안/.test(c.s) ? " (계획)" : "") + "</em> " + cmTxt(c) + "</li>"; }).join("") + "</ul>" + (fb[G.k] ? '<p class="xfba">' + esc(fb[G.k]) + "</p>" : "") + "</div>";
        }).join("") + "</div></div>";
    }
    var f = load(cur).f || {};
    if (f.x1) h += '<div class="xmbox"><div class="xmbh"><b>한눈에 결론</b><button type="button" class="xglink" data-go="meet">🎁 상품 · 결정에서 고치기 →</button></div><div class="xmpre">' + esc(f.x1) + "</div></div>";
    h += '<div class="xmbtns"><button type="button" class="skbtn" data-go="hist" data-rep="1">📄 보고서 만들기 (인쇄 · PDF)</button></div>';
    el.innerHTML = h;
  }
  // 어디서든 data-go = 그 화면으로 (data-rep = 보고서 펼치기)
  sec.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-go]"); if (!b || !b.dataset.go) return;
    showTab(b.dataset.go); var top = document.getElementById("xmNav"); if (top) top.scrollIntoView({ block: "start" });
    if (b.dataset.rep) { var d = document.getElementById("xmRepD"); if (d) { d.open = true; setTimeout(function () { d.scrollIntoView({ block: "start" }); }, 50); } }
  });
  document.getElementById("xmSum").addEventListener("click", function (e) { var r = e.target.closest(".xtr"); if (!r || !e.target.closest(".xcb")) return; if (toggle(cur, r.dataset.id)) { drawPane(); drawTodo(); } });

  // ── 📊 지난 해 기록
  function tableHtml(T) {
    var R = T.r || []; if (!R.length) return "";
    return '<div class="xmtw"><table class="xmt raw"><caption>' + esc(T.t) + "</caption><thead><tr>" + R[0].map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      R.slice(1).map(function (r) { return "<tr>" + r.map(function (c, i) { var v = typeof c === "number" ? (Math.abs(c) >= 1000 ? c.toLocaleString("ko-KR") : String(Math.round(c * 100) / 100)) : c; return (i ? "<td" + (typeof c === "number" ? ' class="num"' : "") + ">" : "<th>") + esc(v) + (i ? "</td>" : "</th>"); }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function bars(obj, unit) {
    var ks = Object.keys(obj).sort(), mx = Math.max.apply(null, ks.map(function (k) { return obj[k]; }).concat([1]));
    return '<div class="xmbars">' + ks.map(function (k) { return '<div class="xmbar1"><span>' + esc(k) + '</span><i style="width:' + Math.max(2, Math.round(obj[k] / mx * 100)) + '%"></i><b>' + obj[k] + (unit || "") + "</b></div>"; }).join("") + "</div>";
  }
  function drawHist(el) {
    var H = HIST(), ys = Object.keys(H).sort().reverse();
    if (!ys.length) { el.innerHTML = '<p class="xmempty">지난 해 기록을 불러오는 중입니다…</p>'; return; }
    var h = '<div class="xmbox"><div class="xmbh"><b>📊 해마다 비교 (2021~)</b><span>사장님 크리스마스 파일에서 개수만 모음 · 손님 이름 · 연락처는 넣지 않음</span></div>' + compareTable() + "</div>";
    ys.forEach(function (y) {
      var Y = H[y], days = {}, slots = {}, items = {}, pay = {};
      Object.keys(Y.res || {}).forEach(function (d) { var r = Y.res[d]; days[mdw(d)] = r.n; Object.keys(r.slots || {}).forEach(function (s) { if (s !== "시간 미정") slots[s] = (slots[s] || 0) + r.slots[s]; }); Object.keys(r.items || {}).forEach(function (s) { items[s] = (items[s] || 0) + r.items[s]; }); Object.keys(r.pay || {}).forEach(function (s) { pay[s] = (pay[s] || 0) + r.pay[s]; }); });
      var top = Object.keys(slots).sort(function (a, b) { return slots[b] - slots[a]; }).slice(0, 3);
      h += '<details class="xmbox xmdet"' + (y === ys[0] ? " open" : "") + '><summary>🎄 ' + y + ' <small>' + esc((Y.sum && Y.sum.line) || Y.title || "") + "</small></summary>" +
        (Y.sum && Y.sum.lesson ? '<div class="xmpre lesson">' + esc(Y.sum.lesson) + "</div>" : "") +
        '<div class="xmhist2"><div><h5>날짜별 예약 (명단 ' + (Y.resTotal || 0) + '개)</h5>' + bars(days, "개") + "</div>" +
        (top.length ? '<div><h5>픽업 많은 시간 TOP 3</h5><p class="xmtop">' + top.map(function (s) { return "<b>" + s + "</b> " + slots[s] + "개"; }).join(" · ") + "</p>" + bars(slots, "") + "</div>" : "") +
        (Object.keys(items).length ? '<div><h5>품목</h5>' + bars(items, "개") + "</div>" : "") +
        (Object.keys(pay).length ? '<div><h5>예약 경로 · 결제</h5>' + bars(pay, "") + "</div>" : "") + "</div>" +
        (Y.notes ? '<p class="xmtop">' + esc(Y.notes.join(" · ")) + "</p>" : "") +
        (Y.tables || []).map(function (T) { return '<details class="xmsub"><summary>' + esc(T.s) + " · " + esc(T.t) + "</summary>" + tableHtml(T) + "</details>"; }).join("") + "</details>";
    });
    el.innerHTML = h;
  }

  // ── 📄 보고서 — 위 화면들을 한 장으로 · 제목 · 머리말 · 각 묶음 제목 · 메모는 눌러서 고침(o.rep) · 묶음 넣고 빼기 설정 · 인쇄(PDF) · 파일 저장 · 글 복사
  var RS = [["sum", "한눈에 결론"], ["goal", "전사 목표"], ["mat", "재료 · 부자재"], ["cal", "준비 캘린더 · 체크리스트"], ["prod", "날짜별 생산"], ["meet", "회의 의견 · 아직 정할 것 · 리스크"], ["cmp", "지난 해 비교"], ["res", "결과 · 다음 해에"]];
  function clean(html) {   // 붙여 넣은 글에서 스크립트 · on… 속성 빼기
    var d = document.createElement("div"); d.innerHTML = html;
    Array.prototype.forEach.call(d.querySelectorAll("script,style,iframe,object,embed,link,meta"), function (x) { x.remove(); });
    Array.prototype.forEach.call(d.querySelectorAll("*"), function (x) { Array.prototype.slice.call(x.attributes).forEach(function (a) { if (/^on|^style$|^src$|^href$/i.test(a.name)) x.removeAttribute(a.name); }); });
    return d.innerHTML;
  }
  function repOf(y) { return load(y).rep || {}; }
  function ed(key, html, cls, ph) { var R = repOf(cur); var v = R[key] != null ? R[key] : html; return '<div class="xred ' + (cls || "") + '" contenteditable="true" data-k="' + key + '" data-ph="' + ea2(ph || "") + '">' + v + "</div>"; }
  function repBody() {
    var R = repOf(cur), hide = R.hide || {}, f = load(cur).f || {}, g = goalOf(cur), s = goalSum(g), L = ckItems(cur), mt = rows(load(cur).mat), D = daysOf(cur), P = load(cur).prod || {};
    function pre(v) { return v ? '<div class="xmpre">' + esc(v) + "</div>" : '<p class="xmempty">(아직 안 적음)</p>'; }
    var body = {
      sum: pre(f.x1),
      goal: '<p>크리스마스 케이크 전사 목표 <b>' + esc(g.total || "—") + '개</b> (' + gmd(g.from, "11/11") + "~" + gmd(g.to, "12/25") + ')' + (g.peak ? ' · 그중 ' + gmd(g.pf, "12/21") + '~' + gmd(g.pt, "12/25") + ' <b>' + esc(g.peak) + '개</b>' : '') + ' · 품목 목표 합 ' + (s.whole + s.mini) + "개 · 예상 매출 <b>" + won(s.money) + "</b> · 기본 조각케이크 " + s.slice + "개 (따로 · " + won(s.sliceMoney) + ")</p>" +
        '<table class="xmt"><thead><tr><th>종류</th><th>품목</th><th>단가</th><th>목표</th><th>예상 매출</th></tr></thead><tbody>' + rows(g.it).filter(function (x) { return x.k !== "조각"; }).map(function (x) { return "<tr><td>" + esc(x.k) + "</td><td>" + esc(x.n) + '</td><td class="num">' + won(x.p) + '</td><td class="num">' + esc(x.t || "—") + '</td><td class="num">' + won(N(x.p) * N(x.t)) + "</td></tr>"; }).join("") + "</tbody></table>" + (g.note ? pre(g.note) : ""),
      mat: mt.length ? '<p>품목 ' + mt.length + "개 · 주문함 " + mt.filter(function (x) { return x.od; }).length + " · 입고 " + mt.filter(function (x) { return x.ind; }).length + " · 금액 합 <b>" + won(mt.reduce(function (a, x) { return a + N(x.c); }, 0)) + "</b></p>" +
        '<table class="xmt"><thead><tr><th>분류</th><th>품목</th><th>수량</th><th>주문처</th><th>금액</th><th>상태</th></tr></thead><tbody>' + mt.map(function (x) { return "<tr><td>" + esc(x.k) + "</td><td>" + esc(x.n) + "</td><td>" + esc(x.q || (x.pq ? "(작년 " + x.pq + ")" : "")) + "</td><td>" + esc(x.s) + '</td><td class="num">' + won(x.c) + "</td><td>" + (x.ind ? "입고" : x.od ? "주문함" : "—") + "</td></tr>"; }).join("") + "</tbody></table>" : '<p class="xmempty">(재료 목록 없음)</p>',
      cal: '<table class="xmt"><thead><tr><th>날짜</th><th>할 일</th><th>담당</th><th>상태</th></tr></thead><tbody>' + L.map(function (x) { var st = stat(x); return '<tr class="' + st.c + '"><td>' + mdw(x.d) + "</td><td>" + (x.m ? "<b>[꼭]</b> " : "") + esc(x.t) + "</td><td>" + esc(x.w) + "</td><td>" + esc(st.s) + "</td></tr>"; }).join("") + "</tbody></table>",
      prod: '<table class="xmt"><thead><tr><th>품목</th>' + D.map(function (d) { return "<th>" + mdw(d) + "</th>"; }).join("") + "</tr></thead><tbody>" + rows(g.it).map(function (x) { var r = P[x._id] || {}; return "<tr><td>" + esc(x.n) + "</td>" + D.map(function (d) { var c = r[d] || {}; return '<td class="num">' + esc(c.p || "") + (c.a ? " → " + esc(c.a) : "") + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table><p class=\"xmtiny\">숫자 = 계획 → 실제</p>",
      meet: "<h5>회의에서 나온 의견</h5>" + pre(f.x5) + "<h5>아직 정할 것</h5>" + pre(f.x7) + "<h5>리스크 · 체크포인트</h5>" + pre(f.x9),
      cmp: compareTable(),
      res: pre(f.x10)
    };
    return '<div class="xrdoc" id="xmRepDoc">' + ed("title", "🎄 " + cur + " 카페스이 크리스마스 준비 보고서", "h1", "보고서 제목") +
      '<p class="xrmeta">' + mdw(today()) + " 기준 · 크리스마스까지 " + (dd(cur + "-12-25", today()) > 0 ? "D-" + dd(cur + "-12-25", today()) : "지남") + " · 체크 " + L.filter(function (x) { return x.done; }).length + " / " + L.length + "</p>" +
      ed("intro", "", "intro", "머리말 — 눌러서 적기 (예: 올해 방향 · 작년과 달라진 점)") +
      RS.filter(function (r) { return !hide[r[0]]; }).map(function (r, i) {
        return '<section class="xrsec">' + ed("h_" + r[0], (i + 1) + ". " + r[1], "h2", "제목") + body[r[0]] + ed("n_" + r[0], "", "note", "이 묶음 메모 — 눌러서 적기") + "</section>";
      }).join("") + ed("outro", "", "intro", "맺음말 — 눌러서 적기") + "</div>";
  }
  function drawRep(el) {
    var R = repOf(cur), hide = R.hide || {};
    el.innerHTML = '<div class="xmbox"><div class="xmbh"><b>📄 보고서</b><span>위 화면 내용이 자동으로 모입니다 · 제목 · 머리말 · 각 묶음 제목 · 메모는 눌러서 고치면 저장 · 표 내용은 각 화면에서 고침</span></div>' +
      '<div class="xrset"><b>⚙ 넣을 묶음</b>' + RS.map(function (r) { return '<label><input type="checkbox" class="xrchk" data-k="' + r[0] + '"' + (hide[r[0]] ? "" : " checked") + "> " + r[1] + "</label>"; }).join("") + "</div>" +
      '<div class="xmbtns"><button type="button" class="skbtn prim" data-a="print">🖨 인쇄 · PDF로 저장</button><button type="button" class="skbtn" data-a="file">⬇ 보고서 파일로 저장 (.html)</button><button type="button" class="skbtn" data-a="copy">📋 글로 복사</button><button type="button" class="skbtn" data-a="reset">↺ 고친 제목 · 글 처음대로</button></div></div>' + repBody();
  }
  (function (el) {
    el.addEventListener("focusout", function (e) {
      var t2 = e.target; if (!t2.classList || !t2.classList.contains("xred")) return;
      var k = t2.dataset.k, v = clean(t2.innerHTML).replace(/<br\s*\/?>$/i, "").trim(), R = repOf(cur);
      if ((R[k] != null ? R[k] : null) === v) return;
      xsave(cur, function (o) { o.rep = o.rep || {}; o.rep[k] = v; });
    });
    el.addEventListener("paste", function (e) { if (!e.target.closest || !e.target.closest(".xred")) return; e.preventDefault(); var tx = (e.clipboardData || window.clipboardData).getData("text"); document.execCommand("insertText", false, tx); });
    el.addEventListener("change", function (e) { var c = e.target; if (!c.classList.contains("xrchk")) return; var k = c.dataset.k, on = c.checked; xsave(cur, function (o) { o.rep = o.rep || {}; o.rep.hide = o.rep.hide || {}; if (on) delete o.rep.hide[k]; else o.rep.hide[k] = 1; }); drawPane(); });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a, doc = document.getElementById("xmRepDoc");
      if (a === "print") { document.body.classList.add("xmprint"); setTimeout(function () { window.print(); setTimeout(function () { document.body.classList.remove("xmprint"); }, 500); }, 50); }
      if (a === "file") {
        var css = "body{font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;max-width:900px;margin:24px auto;padding:0 16px;color:#2A2522;line-height:1.6}table{border-collapse:collapse;width:100%;margin:8px 0;font-size:14px}th,td{border:1px solid #D8CCBC;padding:5px 8px;text-align:left;vertical-align:top}.num{text-align:right}.h1{font-size:26px;font-weight:900;color:#8E1B14}.h2{font-size:19px;font-weight:900;color:#14502B;border-bottom:2px solid #14502B;margin:22px 0 8px}.xmpre{white-space:pre-wrap;background:#FBF6EE;padding:8px 10px;border-radius:6px}.note,.intro{white-space:pre-wrap;color:#4A3A2E}.late td{color:#B3261E}.done td{color:#1F6B3A}.xrmeta{color:#625646}";
        var html = "<!doctype html><html lang=ko><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>" + esc(doc.querySelector(".h1").textContent) + "</title><style>" + css + "</style>" + doc.innerHTML.replace(/ contenteditable="true"/g, "") + "</html>";
        var bl = new Blob([html], { type: "text/html" }), u = document.createElement("a"); u.href = URL.createObjectURL(bl); u.download = "크리스마스_보고서_" + cur + ".html"; document.body.appendChild(u); u.click(); setTimeout(function () { u.remove(); }, 1500);
      }
      if (a === "copy") { var tx = doc.innerText; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tx).then(function () { b.textContent = "✔ 복사됨"; setTimeout(function () { b.textContent = "📋 글로 복사"; }, 2000); }, function () { prompt("복사해서 쓰세요", tx); }); else prompt("복사해서 쓰세요", tx); }
      if (a === "reset") { if (!confirm("보고서에서 고친 제목 · 머리말 · 메모를 모두 처음대로 돌릴까요? (넣을 묶음 설정은 그대로)")) return; xsave(cur, function (o) { var h2 = (o.rep || {}).hide; o.rep = h2 ? { hide: h2 } : {}; }); drawPane(); }
    });
  })(document.getElementById("xmRep"));

  // ── ✏ 고정 글 고치기(10/30 · 사장님 「크리스마스 부분 내가 수정할 수 있게」) — 🎁 상품 안내 · 「해마다 꼭 해야 하는 것」 · 회의 참고 사진 설명은
  //    HTML에 박힌 처음 모습일 뿐 — 「✏ 이 내용 고치기」로 고치면 cafesui.xmas.edit = { 키: { h, by, at, old:[{h, by, at}] } }에 저장되어 그걸 보여 준다.
  //    키: item<해> · rule · pic<해>. 고치기는 사장님 · 정항아님. 그림 주소는 img/… 만 남김 · 열 때 모습과 서버 글이 다르면 저장 안 함.
  var EDK = "cafesui.xmas.edit", EDW = { "사장님": 1, "정항아": 1 }, ORIG = {}, EDING = null;
  function edAll() { return J(EDK) || {}; }
  function edOK() { return !!EDW[me()]; }
  function edKey(el) { return el.id === "xmRule" ? "rule" : (el.classList.contains("xmitem") ? "item" : "pic") + el.dataset.y; }
  function cleanEd(html) {
    var d = document.createElement("div"); d.innerHTML = html;
    Array.prototype.forEach.call(d.querySelectorAll("script,style,iframe,object,embed,link,meta,form,input,textarea,select,button"), function (x) { x.remove(); });
    Array.prototype.forEach.call(d.querySelectorAll("*"), function (x) {
      Array.prototype.slice.call(x.attributes).forEach(function (a) {
        var n = a.name.toLowerCase();
        if (/^on|^style$|^contenteditable$|^id$/.test(n)) x.removeAttribute(a.name);
        else if ((n === "src" || n === "href") && !/^img\/[\w.\-]+$/.test(a.value)) x.removeAttribute(a.name);
      });
    });
    return d.innerHTML.replace(/<br\s*\/?>(\s*<\/(p|li|b|span|em)>)/gi, "$1").trim();
  }
  function edPane(k) { return sec.querySelector('.xmpane[data-x="' + (k === "rule" ? "sum" : "meet") + '"]'); }
  Array.prototype.forEach.call(sec.querySelectorAll("#xmRule, .xmgal[data-y]"), function (el) { ORIG[edKey(el)] = el.innerHTML; });
  function edEl(k) {
    if (k === "rule") return document.getElementById("xmRule");
    var y = k.slice(4), cls = k.slice(0, 4) === "item" ? ".xmitem" : ".xmgal:not(.xmitem)";
    return edPane(k).querySelector(cls + '[data-y="' + y + '"]');
  }
  function edMake(k) {   // 이 해 상품 안내가 HTML에 없으면 칸을 만든다 (.xinone 앞)
    var el = edEl(k); if (el || k.slice(0, 4) !== "item") return el;
    el = document.createElement("div"); el.className = "xmgal xmitem"; el.dataset.y = k.slice(4); el.hidden = true;
    var p = edPane(k); p.insertBefore(el, p.querySelector(".xinone")); return el;
  }
  function edBase(k) { var s = edAll()[k]; return s && s.h != null ? s.h : (ORIG[k] != null ? ORIG[k] : ""); }
  function applyEd() {
    var A = edAll();
    Object.keys(A).forEach(function (k) { if (k.slice(0, 4) === "item" && A[k] && A[k].h) edMake(k); });
    Array.prototype.forEach.call(sec.querySelectorAll("#xmRule, .xmgal[data-y]"), function (el) {
      var k = edKey(el); if (EDING && EDING.k === k) return;
      var h = edBase(k); if (el.innerHTML !== h) el.innerHTML = h;
    });
  }
  function edTargets() {
    var L = [], r = document.getElementById("xmRule"); if (r) L.push("rule");
    L.push("item" + cur); if (edEl("pic" + cur)) L.push("pic" + cur);
    return L;
  }
  var EDNM = { rule: "「해마다 꼭 해야 하는 것」", item: "🎁 상품 안내", pic: "📷 회의 참고 사진 설명" };
  function edName(k) { return EDNM[k] || EDNM[k.slice(0, 4)]; }
  function latestItem() {   // 새 해 안내를 만들 때 바탕 — 가장 최근 해 안내
    var ks = Object.keys(ORIG).concat(Object.keys(edAll())).filter(function (k) { return /^item\d{4}$/.test(k) && edBase(k); }).sort();
    return ks.length ? edBase(ks[ks.length - 1]) : "";
  }
  function drawEdBars() {
    Array.prototype.forEach.call(sec.querySelectorAll(".xedbar"), function (b) { if (!EDING || b.dataset.k !== EDING.k) b.remove(); });
    if (!edOK()) return;
    edTargets().forEach(function (k) {
      if (EDING && EDING.k === k) return;
      var el = edEl(k), s = edAll()[k], bar = document.createElement("div");
      bar.className = "xedbar"; bar.dataset.k = k;
      if (!el || !edBase(k)) {
        if (k.slice(0, 4) !== "item") return;
        bar.innerHTML = '<button type="button" class="skbtn prim" data-xe="new">＋ ' + cur + '년 상품 안내 만들기</button><small>가장 최근 해 안내를 그대로 복사해 와서 고치면 됩니다</small>';
        var p = edPane(k); p.insertBefore(bar, p.querySelector(".xinone"));
        return;
      }
      bar.innerHTML = '<button type="button" class="skbtn prim" data-xe="go">✏ ' + edName(k) + ' 고치기</button>' +
        (s && s.at ? "<small>마지막 고침 " + esc(s.at) + " · " + esc(nim(s.by)) + "</small>" : "<small>처음 모습 그대로</small>") +
        (s && s.old && s.old.length ? '<button type="button" class="skbtn" data-xe="old">📜 예전 모습 ' + s.old.length + "개</button>" : "");
      el.parentNode.insertBefore(bar, el);
    });
  }
  function edTools(k) {
    var it = k.slice(0, 4) === "item";
    return '<div class="xedtool"><b>✏ ' + edName(k) + " 고치는 중</b><span>글자를 눌러 바로 고치세요 · 엔터 = 새 줄 · 필요 없는 줄은 지우기</span></div>" +
      '<div class="xedbtns"><button type="button" class="skbtn" data-xe="b"><b>굵게</b></button><button type="button" class="skbtn" data-xe="mk"><mark>형광</mark></button><button type="button" class="skbtn" data-xe="red"><span class="xedred">빨간 글씨</span></button>' +
      (it ? '<button type="button" class="skbtn" data-xe="card">＋ 상품 카드</button><button type="button" class="skbtn" data-xe="del">🗑 누른 카드 빼기</button>' : "") +
      '<button type="button" class="skbtn" data-xe="li">＋ 아래 줄</button><button type="button" class="skbtn" data-xe="orig">↺ 처음 모습으로</button>' +
      '<button type="button" class="skbtn prim" data-xe="save">✔ 저장</button><button type="button" class="skbtn" data-xe="cancel">취소</button></div>';
  }
  function edOpen(k) {
    if (EDING) edClose(false);
    var el = edMake(k); if (!el) return;
    if (!el.innerHTML.trim()) el.innerHTML = edBase(k) || latestItem();
    EDING = { k: k, base: edBase(k), el: el, last: null };
    el.hidden = false; el.contentEditable = "true"; el.classList.add("xedon");
    Array.prototype.forEach.call(el.querySelectorAll("a"), function (a) { a.addEventListener("click", stopA); });
    var bar = sec.querySelector('.xedbar[data-k="' + k + '"]');
    if (!bar) { bar = document.createElement("div"); bar.className = "xedbar"; bar.dataset.k = k; el.parentNode.insertBefore(bar, el); }
    bar.classList.add("on"); bar.innerHTML = edTools(k);
    var none = edPane(k).querySelector(".xinone"); if (none) none.hidden = true;
    el.focus();
  }
  function stopA(e) { if (EDING) e.preventDefault(); }
  function edClose(redraw) {
    if (!EDING) return; var el = EDING.el;
    el.removeAttribute("contenteditable"); el.classList.remove("xedon");
    var none = edPane(EDING.k).querySelector(".xinone"); if (none) none.hidden = false;
    EDING = null; applyEd();
    Array.prototype.forEach.call(sec.querySelectorAll(".xmgal"), function (g) { g.hidden = String(cur) !== g.dataset.y || !g.innerHTML.trim(); });
    if (redraw !== false) drawEdBars();
  }
  function edSave() {
    var E = EDING; if (!E) return;
    if (edBase(E.k) !== E.base) { alert("고치는 사이 다른 기기에서 이 내용을 바꿨어요.\n지금 고친 글은 저장하지 않고 새 모습으로 다시 엽니다 — 한 번 더 고쳐 주세요."); edClose(); return; }
    var h = cleanEd(E.el.innerHTML);
    if (h === E.base) { edClose(); return; }
    var A = edAll(), p = A[E.k], who = me();
    A[E.k] = { h: h, by: who, at: stampNow(), old: [{ h: E.base, by: p ? p.by : "처음 모습", at: p ? p.at : "" }].concat((p && p.old) || []).slice(0, 10) };
    try { localStorage.setItem(EDK, JSON.stringify(A)); } catch (e) { alert("저장하지 못했어요 — 다시 눌러 주세요"); return; }
    edClose(); if (window.__CS_TOAST) window.__CS_TOAST("✔ " + edName(E.k) + " 저장됨");
  }
  function edOld(k) {
    var s = edAll()[k]; if (!s || !s.old || !s.old.length) return;
    var L = s.old.map(function (o, i) { return (i + 1) + ") " + (o.at || "처음") + " · " + nim(o.by); }).join("\n");
    var n = prompt("되돌릴 모습 번호를 적어 주세요 (지금 모습은 예전 모습 맨 위로 남습니다)\n\n" + L, "1"); if (n == null) return;
    var o = s.old[(+n || 0) - 1]; if (!o) { alert("번호를 다시 확인해 주세요"); return; }
    var A = edAll(), p = A[k];
    A[k] = { h: o.h, by: me(), at: stampNow() + " (되돌림)", old: [{ h: p.h, by: p.by, at: p.at }].concat(p.old || []).slice(0, 10) };
    try { localStorage.setItem(EDK, JSON.stringify(A)); } catch (e) {}
    applyEd(); drawEdBars();
  }
  function wrapSel(tag, cls) {
    var s = window.getSelection(); if (!s || !s.rangeCount || s.isCollapsed) { alert("먼저 글자를 드래그해서 고른 뒤 눌러 주세요"); return; }
    if (!EDING.el.contains(s.anchorNode)) return;
    document.execCommand("insertHTML", false, "<" + tag + (cls ? ' class="' + cls + '"' : "") + ">" + esc(s.toString()) + "</" + tag + ">");
  }
  function selNode() { var s = window.getSelection(); var n = s && s.anchorNode; if (n && n.nodeType === 3) n = n.parentNode; return n && EDING && EDING.el.contains(n) ? n : (EDING && EDING.last); }
  sec.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".xedbar [data-xe]");
    if (!b) { if (EDING && EDING.el.contains(e.target)) EDING.last = e.target; return; }
    var a = b.dataset.xe, k = b.closest(".xedbar").dataset.k;
    if (a === "go") return edOpen(k);
    if (a === "new") { var el = edMake(k); el.innerHTML = latestItem(); return edOpen(k); }
    if (a === "old") return edOld(k);
    if (!EDING) return;
    if (a === "save") return edSave();
    if (a === "cancel") { if (cleanEd(EDING.el.innerHTML) !== EDING.base && !confirm("고친 내용을 버릴까요?")) return; return edClose(); }
    if (a === "orig") { var o = ORIG[EDING.k]; if (!o) { alert("처음 모습이 없는 내용이에요 (이 해에 새로 만든 안내)"); return; } if (confirm("처음 모습(HTML에 있던 글)으로 바꿀까요? 「✔ 저장」을 눌러야 저장됩니다")) EDING.el.innerHTML = o; return; }
    if (a === "b") return document.execCommand("bold");
    if (a === "mk") return wrapSel("mark");
    if (a === "red") return wrapSel("span", "xedred");
    var n = selNode();
    if (a === "card") {
      var cs = EDING.el.querySelectorAll(".xiCard"), src = (n && n.closest && n.closest(".xiCard")) || cs[cs.length - 1]; if (!src) return;
      var c = src.cloneNode(true), no = c.querySelector(".xiNo"); if (no) no.textContent = ("0" + (cs.length + 1)).slice(-2);
      src.parentNode.insertBefore(c, src.nextSibling); c.scrollIntoView({ block: "center" }); return;
    }
    if (a === "del") { var cd = n && n.closest && n.closest(".xiCard"); if (!cd) { alert("뺄 상품 카드 안의 글자를 먼저 눌러 주세요"); return; } if (confirm("이 상품 카드를 뺄까요? (「✔ 저장」을 눌러야 저장 · 「취소」하면 그대로)")) cd.remove(); return; }
    if (a === "li") {
      var li = n && n.closest && n.closest("li");
      if (li) { var nl = document.createElement("li"); nl.innerHTML = li.querySelector("b") ? "<b>새 항목</b><span>설명</span>" : "새 줄"; li.parentNode.insertBefore(nl, li.nextSibling); return; }
      var p = n && n.closest && n.closest("p, .xiBox, figcaption"); if (!p) { alert("줄을 더할 자리의 글자를 먼저 눌러 주세요"); return; }
      var np = document.createElement("p"); np.textContent = "새 줄"; p.parentNode.insertBefore(np, p.nextSibling);
    }
  });
  sec.addEventListener("paste", function (e) { if (!EDING || !EDING.el.contains(e.target)) return; e.preventDefault(); document.execCommand("insertText", false, (e.clipboardData || window.clipboardData).getData("text")); });
  (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (EDING && cleanEd(EDING.el.innerHTML) !== EDING.base) edSave(); });

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
  function go(y) { clearTimeout(t); save(); touched = {}; if (EDING) { if (cleanEd(EDING.el.innerHTML) !== EDING.base) edSave(); else edClose(false); } cur = y; render(); }
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
    if (ks.some(function (k) { return k.indexOf(PRE) === 0 || k.indexOf("cafesui.log.") === 0 || k === "cafesui.daynotes"; })) render();   // cafesui.xmas.hist 도 PRE 로 잡힘
  });
  // 탭이 숨어 있을 때 그리면 칸 높이를 못 잰다 → 화면에 보일 때 다시 늘린다
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) ins.forEach(grow); }).observe(sec);
  window.addEventListener("resize", function () { ins.forEach(grow); });
  setInterval(function () { drawTodo(); drawPane(); }, 10 * 60 * 1000);
  showTab(TAB);
  render();
})();
