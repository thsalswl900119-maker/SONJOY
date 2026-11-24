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
  // 위 메뉴 = 준비 흐름 ① 목표 → ② 생산 → ③ 재료 → ④ 할 일 → ⑤ 상품 · 결정 · 버튼마다 지금 상태 한 줄 (10/30 사장님 「따로 노는 느낌 · 한눈에」)
  function navStat() {
    try {
      var t0 = today(), n = dd(cur + "-12-25", t0), g = goalOf(cur), gs = goalSum(g), ps = prodSums(cur), mt = rows(load(cur).mat), L = ckItems(cur), f = load(cur).f || {};
      var pc = ps.whole + ps.mini, tot = N(g.total) || (gs.whole + gs.mini), od = mt.filter(function (x) { return x.od; }).length, ind = mt.filter(function (x) { return x.ind; }).length;
      var done = L.filter(function (x) { return x.done; }).length, late = L.filter(function (x) { return !x.done && x.d && x.d < t0; }).length;
      var fn = ["x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8", "x9", "x10"].filter(function (k) { return String(f[k] || "").trim(); }).length, hy = Object.keys(HIST()).sort();
      var S = {
        sum: [cur + "년 · " + (n > 0 ? "D-" + n : n === 0 ? "오늘" : "지남"), 0],
        goal: ["목표 " + (tot || "—") + "개" + (g.peak ? " · 피크 " + g.peak : ""), !tot],
        prod: ["계획 " + pc + " / " + (tot || "—") + "개", tot && pc < tot],
        mat: [mt.length ? "주문 " + od + "/" + mt.length + " · 입고 " + ind : "목록 만들기", mt.length && od < mt.length],
        ck: [(late ? "⚠ 밀림 " + late + " · " : "") + done + "/" + L.length + " 완료", late],
        meet: ["결정 칸 " + fn + "/10", fn < 10],
        hist: [hy.length ? hy[0] + "~" + hy[hy.length - 1] + " · " + hy.length + "년" : "", 0]
      };
      Array.prototype.forEach.call(nav.querySelectorAll(".xmn"), function (b) { var v = S[b.dataset.x], sm = b.querySelector(".xns"); if (!v || !sm) return; sm.textContent = v[0]; b.classList.toggle("todo", !!v[1]); });
    } catch (e) {}
  }
  var STEPS = [["sum", "📋 한눈에"], ["goal", "① 🎯 목표 · 매출"], ["prod", "② 🍰 생산 계획"], ["mat", "③ 🧾 재료 · 부자재"], ["ck", "④ ✅ 할 일 · 달력"], ["meet", "⑤ 🎁 상품 · 결정"], ["hist", "📊 지난 해 · 보고서"]];
  function nextBar(k) {   // 화면 맨 아래 「← 이전 · 다음 →」 — 목표 → 생산 → 재료 → 할 일 → 상품이 이어지게
    var pane = sec.querySelector('.xmpane[data-x="' + k + '"]'); if (!pane) return;
    var b = pane.querySelector(":scope > .xnext"); if (!b) { b = document.createElement("div"); b.className = "xnext"; }
    pane.appendChild(b);
    var i = STEPS.map(function (x) { return x[0]; }).indexOf(k), pv = STEPS[i - 1], nx = STEPS[i + 1];
    b.innerHTML = (pv ? '<button type="button" class="xnb pv" data-go="' + pv[0] + '">← ' + pv[1] + "</button>" : "<span></span>") + (nx ? '<button type="button" class="xnb nx" data-go="' + nx[0] + '">다음 ' + nx[1] + " →</button>" : "");
  }
  function paneEl(k) { return k === "hist" ? sec.querySelector('.xmpane[data-x="hist"]') : document.getElementById({ sum: "xmSum", goal: "xmGoal", mat: "xmMat", prod: "xmProdPane", meet: "xmPeak" }[k]); }
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
  var PLOPEN = 0;
  function cleanSet(v) { CLEAN = v ? 1 : 0; try { localStorage.setItem("cafesui.ui.xmclean", CLEAN ? "1" : "0"); } catch (e) {} sec.classList.toggle("xmclean", !!CLEAN); var b = document.getElementById("xmCleanBtn"); if (b) { b.setAttribute("aria-pressed", CLEAN ? "true" : "false"); b.innerHTML = CLEAN ? "🧹 간단히 보는 중 <small>작년 숫자만 · 누르면 작년 주석 · 근거 글까지</small>" : "💬 자세히 보는 중 <small>작년 주석 · 근거 글까지 · 누르면 간단히</small>"; } }
  sec.addEventListener("click", function (e) {
    var b = e.target.closest("#xmCleanBtn"); if (b) { cleanSet(!CLEAN); drawPane(true); return; }
    var cp = e.target.closest('[data-a="pkcopy"]'); if (cp) { var LB = cp.textContent, ok = function () { cp.textContent = "✔ 복사됨"; setTimeout(function () { cp.textContent = LB; }, 2000); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(PKTXT).then(ok, function () { prompt("복사해서 쓰세요", PKTXT); }); else prompt("복사해서 쓰세요", PKTXT); return; }
    var p2 = e.target.closest('[data-a="plopen"]'); if (p2) { PLOPEN = 1; drawPlan(document.getElementById("xmPlan")); }
  });
  setTimeout(function () { cleanSet(CLEAN); }, 0);
  function drawPane(force) {
    var k = TAB, el = paneEl(k);
    navStat(); nextBar(k);
    if (k === "ck") { drawCk(); if (xcEl && !(xcEl.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) drawCal(xcEl); ckView(); return; }
    if (!el) return;
    if (busy(el) && !(force === true && !document.activeElement.isContentEditable)) { pend[k] = 1; return; }
    pend[k] = 0;
    var fk = focusKey(el), sy = window.pageYOffset;
    ({ sum: drawSum, goal: drawGoal, mat: drawMat, prod: function () { drawProd(document.getElementById("xmProd")); drawPlan(document.getElementById("xmPlan")); }, meet: drawPeak, hist: function () { drawHist(document.getElementById("xmHist")); drawRep(document.getElementById("xmRep")); } }[k] || function () {})(el);
    if (fk) { var f2 = el.querySelector(fk); if (f2) { try { f2.focus({ preventScroll: true }); if (f2.setSelectionRange && /text|search/.test(f2.type || "text") && f2.tagName !== "SELECT") f2.setSelectionRange(f2.value.length, f2.value.length); } catch (e) {} window.scrollTo(0, sy); } }
  }
  sec.addEventListener("focusout", function () { setTimeout(function () { var el = paneEl(TAB); if (pend[TAB] && !busy(el)) drawPane(); }, 60); });
  function xsave(y, fn) { var o = load(y); fn(o); o.savedAt = stampNow(); o.who = me() || o.who; try { localStorage.setItem(PRE + y, JSON.stringify(o)); } catch (e) {} }
  function won(n) { n = N(n); return n ? n.toLocaleString("ko-KR") + "원" : "—"; }
  // ── 📊 피크 기간 계산 및 실주문 현황 (11/24 · 사장님 「예상한 거랑 실제 한 거랑 비교」 「첨부한 파일처럼 한눈에 · 작년 수치」)
  //    o.pk = { days:[…], a:{ "g0|날짜": 실제, "w|날짜": 현장 실제 판매, "m|p12|o": 실제 받은 수 · "|u" 쓴 수 · "|l" 남은 수, "d|날짜|c/w/s": 날짜별 실제 쓴 생크림 · 휘핑 · 딸기 }, by:{키: "누가 시각"}, exp:{ day:{날짜:[생크림, 휘핑, 딸기]} }, calc: 계산 기록 글 }
  //    작년(25년) 재료 숫자 = 25년 크리스마스 Numbers 파일 메모 · 주석 (기간이 올해와 다를 수 있어 글로 같이)
  var PKMAT = [["p12", "기본 시트", "장", "68", "12월 한 달 · 남음 26"], ["p13", "초코 시트", "장", "12", "12월 한 달 · 남음 5"], ["m1122sm", "말차 시트", "장", "2", "12월 한 달 · 남음 2"], ["p18", "생크림 (에이프릴안나)", "통", "310", "12/18~26 · 녹산 합쳐서 · 24일 14 긴급"], ["p19", "생크림 (녹산)", "통", "", "위 줄에 합침"], ["p17", "휘핑", "개", "48", "12/18~26 받은 수"], ["p20", "딸기 (500g)", "통", "268", "12/22~24 받음 · 21통 남음"]];
  var PKSRC = [["p17", /카페세상/, "재고·발주 「발주 기준표」엔 케이크 휘핑 = 네이버페이 · 카페세상 — 크리스마스도 같은 곳인지 확인"]];
  function pkDays(y) { var pk = load(y).pk || {}; if (pk.days && pk.days.length) return pk.days.slice(); var a = []; for (var d = 21; d <= 26; d++) { var dt = new Date(y, 11, d); if (dt.getDay() !== 0) a.push(ymd(dt)); } return a; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function pkCls(e, a) { if (a === "" || a == null || e === null) return ""; var d = r1(N(a) - N(e)); return d > 0 ? " up" : d < 0 ? " dn" : " ok"; }
  function pkTip(e, a) { if (a === "" || a == null || e === null) return ""; var d = r1(N(a) - N(e)); return d > 0 ? "+" + d : d < 0 ? String(d) : "="; }
  function pkIn(k, v, e) { return '<input type="text" inputmode="decimal" class="xpkin' + pkCls(e, v) + '" data-k="' + ea2(k) + '" value="' + ea2(v == null ? "" : v) + '" aria-label="실제">' + (v !== "" && v != null ? '<i class="xpkdf' + pkCls(e, v) + '">' + pkTip(e, v) + "</i>" : ""); }
  // 예상 숫자로 생크림 · 휘핑 · 딸기 다시 계산 (plan1124i와 같은 식) — 1개당 [생크림 g, 휘핑 g, 딸기 통] × 11월 보정(pk.exp.f)
  function pkUnit(x) { if (x.k === "홀") return [340, 120, 1]; if (x.k === "중간") return [238, 84, 0.7]; if (x.k === "미니") return [170, 60, 0.5]; if (x.k === "조각") return [342, 121, /딸기/.test(x.n || "") ? 0.828 : 0]; return null; }
  function pkNeed(y, D) {
    var o = load(y), P = o.prod || {}, ex = (o.pk || {}).exp || {}, F = ex.f || [1.1303, 1.07, 0.9369], h26 = ex.h26 == null ? 9 : N(ex.h26), out = {};
    D.forEach(function (d) { var s = [0, 0, 0]; rows(goalOf(y).it).forEach(function (x) { var u = pkUnit(x), v = N(((P[x._id] || {})[d] || {}).p); if (!u || !v) return; for (var i = 0; i < 3; i++) s[i] += v * u[i]; }); if (d.slice(5) === "12-26") { s[0] += h26 * 340; s[1] += h26 * 120; s[2] += h26; } out[d] = [r1(s[0] / 500 * F[0]), r1(s[1] / 1000 * F[1]), r1(s[2] * F[2])]; });
    return out;
  }
  // 📋 매니저 공유용 주문 요약 (11/24 · 사장님 「목표치 · 시트 · 생크림 · 딸기 · 휘핑 계산한 거 여기에 바로 · 매니저한테 공유」)
  //    목표 = 지금 생산 계획(12/21~26) 합 · 주문 = pk.ord(받는 날별 · Claude 계산) · 금액 = 재료 표
  function pkSummary(y, D, ws) {
    var o = load(y), P = o.prod || {}, it = rows(goalOf(y).it), od = (o.pk || {}).ord, NL = String.fromCharCode(10);
    function sum(id) { return r1(D.reduce(function (t, d) { return t + N(((P[id] || {})[d] || {}).p); }, 0)); }
    var hole = it.filter(function (x) { return x.k !== "미니" && x.k !== "조각" && sum(x._id); }), mini = it.filter(function (x) { return x.k === "미니" && sum(x._id); }), sl = it.filter(function (x) { return x.k === "조각" && sum(x._id); });
    var wsT = D.reduce(function (t, d) { return t + (ws[d] || 0); }, 0), wsTxt = D.filter(function (d) { return ws[d]; }).map(function (d) { return md(d) + " " + ws[d]; }).join(" · ");
    function nm(x) { return String(x.n || "").replace(/\s*\(([^)]{5,})\)?.*$/, ""); }
    var tH = hole.reduce(function (t, x) { return t + sum(x._id); }, 0), tM = mini.reduce(function (t, x) { return t + sum(x._id); }, 0), tS = sl.reduce(function (t, x) { return t + sum(x._id); }, 0);
    var h = '<div class="pksum2"><div class="pks2h"><b>📋 예상 주문 계산 요약</b><span>' + md(D[0]) + " ~ " + md(D[D.length - 1]) + ' 기준 (시트는 12/1~26)</span><button type="button" class="skbtn" data-a="pkcopy">📋 글 복사</button></div>';
    h += '<div class="pks2g"><div class="pks2c"><h5>🎯 목표</h5><table><tbody>' +
      hole.map(function (x) { return "<tr><th>" + esc(nm(x)) + "</th><td><b>" + sum(x._id) + "</b>개" + (x._id === "g0" && wsT ? '<small>예약 ' + r1(sum(x._id) - wsT) + " + 현장 " + wsT + "</small>" : "") + "</td></tr>"; }).join("") +
      mini.map(function (x) { return "<tr><th>" + esc(nm(x)) + "</th><td><b>" + sum(x._id) + "</b>개</td></tr>"; }).join("") +
      '<tr class="t"><th>케이크 합</th><td><b>' + r1(tH + tM) + "</b>개</td></tr>" +
      sl.map(function (x) { return "<tr><th>" + esc(nm(x)) + "</th><td><b>" + sum(x._id) + "</b>판</td></tr>"; }).join("") +
      '<tr class="t"><th>조각 합</th><td><b>' + r1(tS) + "</b>판</td></tr></tbody></table>" + (wsTxt ? '<p class="pks2n">현장 홀 ' + wsTxt + " — 아침에 일부만 만들고 팔리는 것 보고 더 · 남으면 조각</p>" : "") + "</div>";
    var txt = ["[🎄 크리스마스 예상 주문 계산 요약 · " + md(D[0]) + "~" + md(D[D.length - 1]) + "]", "", "■ 목표"].concat(hole.concat(mini).map(function (x) { return "· " + nm(x) + " " + sum(x._id) + "개" + (x._id === "g0" && wsT ? " (예약 " + r1(sum(x._id) - wsT) + " + 현장 " + wsT + ")" : ""); }), ["· 케이크 합 " + r1(tH + tM) + "개"], sl.map(function (x) { return "· " + nm(x) + " " + sum(x._id) + "판"; }), ["· 조각 합 " + r1(tS) + "판"]);
    if (od) {
      var S = od.sheet, Cr = od.cream, St = od.straw, Wh = od.whip, Mo = od.money || {};
      h += '<div class="pks2c"><h5>🍞 시트 (12/1~26)</h5><table><thead><tr><th>받는 날</th><th>기본</th><th>초코</th><th>말차</th></tr></thead><tbody>' + S.d.map(function (d, i) { return "<tr><th>" + d + "<small>" + S.r[i] + "</small></th><td>" + S.b[i] + "</td><td>" + S.c[i] + "</td><td>" + S.m[i] + "</td></tr>"; }).join("") +
        '<tr class="t"><th>합 ' + (sum2(S.b) + sum2(S.c) + sum2(S.m)) + "장</th><td><b>" + sum2(S.b) + "</b></td><td><b>" + sum2(S.c) + "</b></td><td><b>" + sum2(S.m) + "</b></td></tr></tbody></table><p class='pks2n'>시트 " + won(Mo.sheet) + " + 택배 " + sum2(S.box) + "번 " + won(Mo.ship) + "</p></div>";
      h += '<div class="pks2c"><h5>🥛 생크림 · 🍓 딸기 · 🥛 휘핑 (12/21~26)</h5><table><tbody>' +
        '<tr class="g"><th colspan="2">🥛 생크림 ' + sum2(Cr.n) + "통</th></tr>" + Cr.d.map(function (d, i) { return "<tr><th>" + d + "<small>" + Cr.w[i] + "</small></th><td><b>" + Cr.n[i] + "</b>통</td></tr>"; }).join("") +
        '<tr class="g"><th colspan="2">🍓 딸기 (500g) ' + sum2(St.n) + "통</th></tr>" + St.d.map(function (d, i) { return "<tr><th>" + d + "<small>" + St.r[i] + "</small></th><td><b>" + St.n[i] + "</b>통</td></tr>"; }).join("") +
        '<tr class="g"><th colspan="2">🥛 휘핑 ' + sum2(Wh.n) + "개 <small>(필요 " + Wh.need + " · 12개 묶음)</small></th></tr><tr><th>" + Wh.d.join(" · ") + "</th><td>" + Wh.n.join(" · ") + "</td></tr></tbody></table><p class='pks2n'>생크림 " + won(Mo.cream) + " · 딸기 " + won(Mo.straw) + " · 휘핑 " + won(Mo.whip) + "</p></div>";
      var MM = o.mat || {}, mq = function (k) { return N((MM[k] || {}).q); }, bad = [["기본 시트", sum2(S.b), mq("p12")], ["초코 시트", sum2(S.c), mq("p13")], ["말차 시트", sum2(S.m), mq("m1122sm")], ["생크림", sum2(Cr.n), mq("p18") + mq("p19")], ["딸기", sum2(St.n), mq("p20")], ["휘핑", sum2(Wh.n), mq("p17")]].filter(function (b) { return b[1] !== b[2]; });
      if (bad.length) h += '<div class="pks2bad">⚠ 아래 「올해 예상」(재료 표) 숫자가 받는 날 나눔과 달라요 — ' + bad.map(function (b) { return esc(b[0]) + " 나눔 " + b[1] + " ↔ 재료 표 " + b[2]; }).join(" · ") + " · 받는 날 나눔은 Claude에게 다시 맡겨 주세요</div>";
      var tot = N(Mo.sheet) + N(Mo.ship) + N(Mo.cream) + N(Mo.straw) + N(Mo.whip);
      h += '<div class="pks2tot">💰 시트 · 생크림 · 딸기 · 휘핑 합 <b>' + won(tot) + "</b> <small>(작년 단가로 계산 · 올해 견적 받으면 바뀜)</small></div>";
      txt = txt.concat(["", "■ 시트 (12/1~26) 기본 " + sum2(S.b) + " · 초코 " + sum2(S.c) + " · 말차 " + sum2(S.m) + " = " + (sum2(S.b) + sum2(S.c) + sum2(S.m)) + "장"], S.d.map(function (d, i) { return "· " + d + " 기본 " + S.b[i] + " · 초코 " + S.c[i] + " · 말차 " + S.m[i] + " (" + S.r[i] + ")"; }),
        ["", "■ 생크림 " + sum2(Cr.n) + "통"], Cr.d.map(function (d, i) { return "· " + d + " " + Cr.w[i] + " " + Cr.n[i] + "통"; }),
        ["", "■ 딸기 (500g) " + sum2(St.n) + "통"], St.d.map(function (d, i) { return "· " + d + " " + St.n[i] + "통 (" + St.r[i] + ")"; }),
        ["", "■ 휘핑 " + sum2(Wh.n) + "개 (필요 " + Wh.need + ")", "· " + Wh.d.map(function (d, i) { return d + " " + Wh.n[i]; }).join(" · "), "", "■ 금액 약 " + won(tot) + " (작년 단가)"]);
    }
    h += "</div></div>";
    PKTXT = txt.join(NL);
    return h;
  }
  function sum2(a) { return (a || []).reduce(function (t, v) { return t + N(v); }, 0); }
  var PKTXT = "";
  function drawPeak(el) {
    if (cur < 2026) { el.innerHTML = ""; return; }
    var o = load(cur), pk = o.pk || {}, A = pk.a || {}, D = pkDays(cur), P = o.prod || {}, g = goalOf(cur), it = rows(g.it), M = o.mat || {}, W = ["일", "월", "화", "수", "목", "금", "토"], ly = cur - 1;
    function ex(id, d) { return N(((P[id] || {})[d] || {}).p); }
    function av(k) { return A[k] == null ? "" : A[k]; }
    var ws = {}; sugs(cur).forEach(function (s) { if (s.it === "g0" && !s.nt && s.ap) ws[s.d] = (ws[s.d] || 0) + N(s.n); });
    var dh = D.map(function (d) { var dt = new Date(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8)), pkd = /12-2[45]/.test(d); return '<th class="' + (pkd ? "pkpeak" : "") + '">' + md(d) + "<small>" + W[dt.getDay()] + "</small></th>"; }).join("");
    var groups = [["🎂 홀 · 반짝 · 중간", function (x) { return x.k !== "미니" && x.k !== "조각"; }, "개"], ["🧁 미니", function (x) { return x.k === "미니"; }, "개"], ["🍰 조각", function (x) { return x.k === "조각"; }, "판"]];
    var body = "", cards = "";
    groups.forEach(function (G) {
      var L = it.filter(G[1]).filter(function (x) { return D.some(function (d) { return ex(x._id, d) || av(x._id + "|" + d) !== ""; }); });
      if (!L.length) return;
      var gL = 0, gLn = 0, gE = 0, gA = 0, gAn = 0; var seen = {};
      body += '<tr class="pkgrp"><th colspan="' + (D.length + 3) + '">' + G[0] + " <small>(" + G[2] + ")</small></th></tr>";
      L.forEach(function (x) {
        var sl = 0, sln = 0, se = 0, sa = 0, san = 0, cl = "", ce = "", ca = "";
        var LV = D.map(function (d) { var r = yRef(x, d, ly); return r && r.v != null && r.v !== "" && !isNaN(+r.v) ? +r.v : null; }), sig = LV.join(","), dup = /\d/.test(sig) && seen[sig]; if (!dup) seen[sig] = 1;   // 같은 작년 줄을 두 품목이 같이 잡으면(미니 · 미니 현장) 한 번만
        D.forEach(function (d, di) {
          var lv = dup ? null : LV[di], e = ex(x._id, d), k = x._id + "|" + d, a = av(k);
          if (lv != null) { sl += lv; sln++; } se += e; if (a !== "") { sa += N(a); san++; }
          cl += "<td>" + (lv != null ? r1(lv) : "") + "</td>"; ce += '<td class="pkev"><input type="text" inputmode="decimal" class="xpkex" data-g="' + x._id + '" data-d="' + d + '" value="' + (e ? r1(e) : "") + '" aria-label="예상"></td>'; ca += '<td class="pka">' + pkIn(k, a, e) + "</td>";
        });
        gL += sl; gLn += sln; gE += se; gA += sa; gAn += san;
        var nm = '<th class="pkn" rowspan="3">' + esc(x.n) + (N(x.t) ? "<small>목표 " + N(x.t) + "</small>" : "") + "</th>";
        body += '<tr class="pkly">' + nm + '<td class="pkl">' + String(ly).slice(2) + "년</td>" + (dup ? '<td class="pkdup" colspan="' + D.length + '">위 줄과 같은 작년 숫자 (작년엔 한 줄로 셈)</td>' : cl) + '<td class="pks">' + (sln ? r1(sl) : "") + "</td></tr>" +
          '<tr class="pkex"><td class="pkl">예상</td>' + ce + '<td class="pks"><b>' + r1(se) + "</b></td></tr>" +
          '<tr class="pkac"><td class="pkl">실제</td>' + ca + '<td class="pks' + (san ? pkCls(se, sa) : "") + '">' + (san ? "<b>" + r1(sa) + "</b>" : "") + "</td></tr>";
        if (x._id === "g0" && D.some(function (d) { return ws[d]; })) {
          var we = 0, wa = 0, wn = 0;
          body += '<tr class="pkwalk"><th class="pkn">└ 그중 현장 판매<small>예상 = 만들 수 · 실제 = 팔린 수</small></th><td class="pkl">예상 · 실제</td>' + D.map(function (d) { var e = ws[d] || 0, k = "w|" + d, a = av(k); we += e; if (a !== "") { wa += N(a); wn++; } return e || a !== "" ? '<td class="pka"><span class="pkwe">' + e + "</span>" + pkIn(k, a, e) + "</td>" : "<td></td>"; }).join("") + '<td class="pks">' + we + (wn ? " → <b>" + wa + "</b>" : "") + "</td></tr>";
        }
      });
      cards += '<div class="pkcard"><b>' + G[0] + '</b><div><span>' + String(ly).slice(2) + "년</span><em>" + (gLn ? r1(gL) : "—") + "</em></div><div><span>예상</span><em>" + r1(gE) + "</em></div><div><span>실제</span><em>" + (gAn ? r1(gA) : "—") + "</em></div><small>" + G[2] + "</small></div>";
    });
    var head = '<tr><th class="pkn">품목</th><th></th>' + dh + "<th>합</th></tr>";
    // 재료
    var NEED = pkNeed(cur, D);
    var mrows = PKMAT.filter(function (r) { return M[r[0]] && !M[r[0]].del; }).map(function (r) {
      var m = M[r[0]], q = N(m.q), ko = "m|" + r[0] + "|o", ku = "m|" + r[0] + "|u", kl = "m|" + r[0] + "|l", ao = av(ko), au = av(ku);
      var src = String(m.s || "").trim(), chk = PKSRC.filter(function (c) { return c[0] === r[0] && !c[1].test(src); })[0];
      var NI = { p18: 0, p17: 1, p20: 2 }[r[0]], nd = NI == null ? "" : (function () { var t = r1(D.reduce(function (s0, d) { return s0 + (NEED[d] ? NEED[d][NI] : 0); }, 0)), tq = r[0] === "p18" ? q + N((M.p19 || {}).q) : q, gap = Math.ceil(t - 1e-9) - tq; return '<small class="pkneed' + (gap > 0 ? " short" : "") + '">지금 예상으로 필요 ' + t + (r[0] === "p18" ? " (녹산 합쳐서)" : "") + (gap > 0 ? " → " + gap + " 모자람" : "") + "</small>"; })();
      return '<tr><th class="pkn">' + esc(r[1]) + '</th><td class="pksrc' + (src ? "" : " none") + '">' + (src ? esc(src) : "⚠ 거래처 적기") + (chk ? '<small class="pkwarn">⚠ ' + esc(chk[2]) + "</small>" : "") + '</td><td class="pklyv">' + (r[3] ? "<b>" + r[3] + "</b>" : "") + "<small>" + esc(r[4]) + '</small></td><td class="pkq"><input type="text" inputmode="decimal" class="xpkex xpkmq" data-mat="' + r[0] + '" value="' + ea2(m.q || "") + '" aria-label="올해 예상"> ' + r[2] + nd + '</td><td class="pka">' + pkIn(ko, ao, q) + '</td><td class="pka">' + pkIn(ku, au, q) + '</td><td class="pka">' + pkIn(kl, av(kl), null).replace('class="xpkin', 'placeholder="' + (ao !== "" && au !== "" ? r1(N(ao) - N(au)) : "") + '" class="xpkin') + "</td></tr>";
    }).join("");
    // 거래처 빈 줄 (재료 · 부자재 전체)
    var noSrc = rows(M).filter(function (x) { return !String(x.s || "").trim() && !/택배비/.test(x.n || ""); });
    var E1 = pkNeed(cur, D), OV = pk.ov || {}, E = {}; Object.keys(E1).forEach(function (d) { E[d] = E1[d].map(function (v, i) { var o2 = OV[d + "|" + i]; return o2 != null && o2 !== "" ? N(o2) : v; }); }); var dl = D.filter(function (d) { return E[d]; }), LYS = { "12-22": 62, "12-23": 116, "12-24": 90 };
    var dtab = dl.length ? '<table class="xpkt pkday"><thead><tr><th rowspan="2">날짜</th><th colspan="2">🥛 생크림 (통)</th><th colspan="2">🥛 휘핑 (개)</th><th colspan="3">🍓 딸기 (통)</th></tr><tr><th>예상</th><th>실제 쓴 수</th><th>예상</th><th>실제 쓴 수</th><th>' + String(ly).slice(2) + "년 받은 날</th><th>예상</th><th>실제 쓴 수</th></tr></thead><tbody>" + dl.map(function (d) {
      var e = E[d]; function c(i) { var k = "d|" + d + "|" + "cws"[i]; return '<td class="pkev"><input type="text" inputmode="decimal" class="xpkex xpkov" data-ov="' + d + "|" + i + '" value="' + e[i] + '" aria-label="예상">' + (OV[d + "|" + i] != null ? '<small class="pkcalc">계산 ' + E1[d][i] + ' · <button type="button" class="pkrst" data-ov="' + d + "|" + i + '">계산값으로</button></small>' : "") + '</td><td class="pka">' + pkIn(k, av(k), e[i]) + "</td>"; }
      return '<tr><th class="pkn">' + md(d) + "</th>" + c(0) + c(1) + '<td class="pklyv">' + (LYS[d.slice(5)] || "") + "</td>" + c(2).replace("</td><td", "</td><td") + "</tr>";
    }).join("") + '<tr class="pkgt"><th class="pkn">합</th>' + [0, 1, 2].map(function (i) { var s = r1(dl.reduce(function (t, d) { return t + E[d][i]; }, 0)), sa = 0, n = 0; dl.forEach(function (d) { var v = av("d|" + d + "|" + "cws"[i]); if (v !== "") { sa += N(v); n++; } }); return (i === 2 ? '<td class="pklyv">268</td>' : "") + "<td><b>" + s + '</b></td><td class="pks' + (n ? pkCls(s, sa) : "") + '">' + (n ? "<b>" + r1(sa) + "</b>" : "") + "</td>"; }).join("") + "</tr></tbody></table>" : "";
    el.innerHTML = '<div class="xpk"><div class="xpkh"><h3>📊 피크 기간 계산 및 실주문 현황</h3><span class="pkrange">' + md(D[0]) + " ~ " + md(D[D.length - 1]) + "</span></div>" + pkSummary(cur, D, ws) +
      '<p class="pkhow"><b>예상</b> = 🍰 생산 계획 숫자 — 점선 칸을 눌러 바로 고치면 생산 계획도 같이 바뀌고 생크림 · 휘핑 · 딸기 필요량도 다시 계산됩니다 · <b>실제</b> 칸에 숫자를 적으면 색이 바뀝니다 — <i class="xpkdf up">예상보다 많음</i> <i class="xpkdf dn">예상보다 적음</i> <i class="xpkdf ok">같음</i></p>' +
      '<div class="pkcards">' + cards + "</div>" +
      '<h4>① 날짜별 케이크 · 조각 <small>' + String(ly).slice(2) + "년 = 작년 같은 날 실제 작업량</small></h4><div class=\"xpkw\"><table class=\"xpkt pkcake\"><thead>" + head + "</thead><tbody>" + body + "</tbody></table></div>" +
      (mrows ? '<h4>② 시트 · 생크림 · 휘핑 · 딸기</h4><div class="xpkw"><table class="xpkt pkmat"><thead><tr><th class="pkn">재료</th><th>거래처</th><th>' + String(ly).slice(2) + "년</th><th>올해 예상</th><th>실제 받은 수</th><th>실제 쓴 수</th><th>남은 수</th></tr></thead><tbody>" + mrows + "</tbody></table></div>" : "") +
      (noSrc.length ? '<div class="pksrcbox"><b>🏷 거래처가 비어 있는 재료 · 부자재 ' + noSrc.length + "개</b> — 올해 바뀐 거래처로 「🧾 재료 · 부자재」에서 적어 주세요<span>" + noSrc.map(function (x) { return esc(String(x.n || "").split(/\s*[\(—]/)[0]); }).join(" · ") + "</span></div>" : "") +
      (dtab ? '<h4>③ 날짜별 재료 쓴 양</h4><div class="xpkw">' + dtab + "</div>" : "") +
      (pk.calc ? '<details class="xpkc"><summary>🧮 계산 기록 · 기준값 (11/22 ~ 11/24 · 맨 아래가 지금 값)</summary><div class="xmpre">' + esc(pk.calc) + "</div></details>" : "") + "</div>";
  }
  sec.addEventListener("change", function (e) {
    var el = e.target; if (!el.classList || !el.classList.contains("xpkex")) return;
    var g = el.dataset.g, d = el.dataset.d, v = el.value.trim().replace(/[^0-9.]/g, ""), who = (me() || "") + " " + stampNow();
    if (el.dataset.mat) { var mid = el.dataset.mat; xsave(cur, function (o) { var m = (o.mat || {})[mid]; if (!m || String(m.q || "") === v) return; var q0 = N(m.q), c0 = N(moneyRaw(m.c)); m.q_pk = m.q; m.c_pk = m.c; m.q = v; if (q0 && c0 && v) m.c = String(Math.round(c0 / q0 * N(v))); m.ed = who + " (피크 표)"; }); pkRedraw(); return; }
    if (el.dataset.ov) { var ok = el.dataset.ov; xsave(cur, function (o) { o.pk = o.pk || {}; o.pk.ov = o.pk.ov || {}; if (v === "") delete o.pk.ov[ok]; else o.pk.ov[ok] = v; }); pkRedraw(); return; }
    xsave(cur, function (o) { o.prod = o.prod || {}; o.prod[g] = o.prod[g] || {}; var c = o.prod[g][d] = o.prod[g][d] || {}; if ((c.p || "") === v) return; c.p = v; c.ed = (me() || "") + " " + stampNow() + " (피크 표)"; var D0 = daysOf(cur); if (v && D0.indexOf(d) < 0) o.days = D0.concat([d]).sort(); });
    pkRedraw();
  });
  sec.addEventListener("click", function (e) {
    var b = e.target.closest(".pkrst"); if (!b) return; var k = b.dataset.ov;
    xsave(cur, function (o) { if (o.pk && o.pk.ov) delete o.pk.ov[k]; }); pkRedraw();
  });
  function pkRedraw() {
    setTimeout(function () {   // 다음 칸으로 넘어간 뒤 다시 그리고 그 칸으로 돌아감
      var a = document.activeElement, q = a && a.classList && a.classList.contains("xpkex") ? (a.dataset.mat ? '.xpkex[data-mat="' + a.dataset.mat + '"]' : a.dataset.ov ? '.xpkex[data-ov="' + a.dataset.ov + '"]' : '.xpkex[data-g="' + a.dataset.g + '"][data-d="' + a.dataset.d + '"]') : a && a.classList && a.classList.contains("xpkin") ? '.xpkin[data-k="' + a.dataset.k + '"]' : null, sy = window.pageYOffset;
      if (a && a.classList && a.classList.contains("xpkin")) pkSave(a);
      pend.meet = 0; drawPeak(document.getElementById("xmPeak")); if (q) { var n = document.querySelector("#xmPeak " + q); if (n) { try { n.focus({ preventScroll: true }); n.select(); } catch (er) {} window.scrollTo(0, sy); } }
    }, 0);
  }
  var pkT = null;
  sec.addEventListener("input", function (e) {
    var el = e.target; if (!el.classList || !el.classList.contains("xpkin")) return;
    pend.meet = 1; clearTimeout(pkT);
    pkT = setTimeout(function () { pkT = null; pkSave(el); }, 400);
  });
  function pkSave(el) { var k = el.dataset.k, v = el.value.trim(), A0 = (load(cur).pk || {}).a || {}; if ((A0[k] == null ? "" : String(A0[k])) === v) return; xsave(cur, function (o) { o.pk = o.pk || {}; o.pk.a = o.pk.a || {}; o.pk.by = o.pk.by || {}; if (v === "") { delete o.pk.a[k]; delete o.pk.by[k]; } else { o.pk.a[k] = v; o.pk.by[k] = (me() || "") + " " + stampNow(); } }); }
  (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (pkT) { clearTimeout(pkT); pkT = null; } var a = document.activeElement; if (a && a.classList && a.classList.contains("xpkin")) pkSave(a); });
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
  // 🧹 간단히 보기 (11/24 · 사장님 「1 · 2 · 3 정신없다 · 한눈에 · 작년 수치만」) — 기본 켬 · 작년 숫자만 남기고 주석 글 · 근거 글은 숨김 · cafesui.ui.xmclean
  var CLEAN = 1; try { CLEAN = localStorage.getItem("cafesui.ui.xmclean") === "0" ? 0 : 1; } catch (e) {}
  function pyH() { var h = HIST()[cur - 1]; return h && (h.tables || h.cm) ? h : null; }
  function gKey(x) { var n = x.n || ""; return /초코/.test(n) ? "초딸" : /피스타/.test(n) ? "피딸" : /말차/.test(n) ? "말딸" : /샤인/.test(n) ? "샤인" : /망고/.test(n) ? "망고" : /티라/.test(n) ? "티라" : /과일동산|과동/.test(n) ? "과일동산" : "딸"; }
  function gTre(k) { return k === "홀" ? /예약 홀케이크/ : k === "미니" ? /미니케이크 생산/ : k === "조각" ? /조각케이크 생산 수량(\(전날|$)/ : null; }
  function rowHit(lab, x) { lab = String(lab || "").replace(/\s/g, ""); if (!lab || /합계/.test(lab)) return false; if (x.k === "미니") return true; var k = gKey(x); return k === "딸" ? /^딸/.test(lab) : lab.indexOf(k) >= 0; }
  function isHead(c) { return c.row === c.h || /^\d{1,2}\/\d{1,2}|총\s*합계|^\[/.test(c.row); }
  function md2(s) { var m = /(\d{1,2})\/(\d{1,2})/.exec(String(s || "")); return m ? (+m[1]) + "/" + (+m[2]) : String(s || ""); }
  function cmTxt(c) { return esc(String(c.cm || "").replace(/\n+/g, " / ")); }
  function g25(x) {   // 품목 한 줄 코멘트
    if (CLEAN) return g25short(x);
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
  function g25short(x) {   // 간단히: 「25년 실제 N개」만
    var H = pyH(), re = gTre(x.k); if (!H || !re) return "";
    var T = (H.tables || []).filter(function (t) { return /실제 작업량/.test(t.s) && re.test(t.t); })[0]; if (!T || !T.r) return '<span class="xg25s none">' + (cur - 1) + "년엔 없던 품목</span>";
    var R0 = T.r, row = R0.slice(1).filter(function (r) { return rowHit(r[0], x); })[0]; if (!row) return '<span class="xg25s none">' + (cur - 1) + "년엔 없던 품목</span>";
    var tot = 0; for (var i = 1; i < R0[0].length; i++) { if (/합계/.test(R0[0][i])) continue; tot += N(row[i]); }
    return '<span class="xg25s">' + String(cur - 1).slice(2) + "년 실제 <b>" + r1(tot) + (x.k === "조각" ? "판" : "개") + "</b></span>";
  }
  function g25box(kind, open) {   // 묶음 메모 상자 — cake: 홀 · 미니 머리 주석 + 해 정리 · slice: 조각 머리 주석 · mat: 3가지 대표 재료 주석
    var H = pyH(); if (!H || !G25 || CLEAN) return "";
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
    if (CLEAN) c = [];
    return (a.length ? '<span class="xpref">' + esc(a.join(" · ")) + "</span>" : "") + (c.length ? '<span class="xpref xpcm" title="' + ea2(c.join("\n")) + '">💬 ' + esc(c.join(" / ")) + "</span>" : "");
  }
  function yHeadHtml(d) {   // 날짜 머리 주석(마감일 · 현장판매 시작 …)
    if (CLEAN) return "";
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
  function dayCmHtml(d) { if (CLEAN) return ""; var L = d ? dayCm(d) : []; return L.length ? '<span class="xck25">💬 ' + esc(L.join(" · ")) + "</span>" : ""; }
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
      '<td data-l="목표 개수"><input type="text" inputmode="numeric" class="xgi num" data-f="t" value="' + ea2(x.t) + '">' + (function () { var ps = prodSums(cur).by[x._id] || 0; return '<button type="button" class="xglink" data-go="prod" title="🍰 생산 계획으로">🍰 계획 ' + ps + (x.k === "조각" ? "판" : "개") + (x.k !== "조각" && N(x.t) && ps && ps !== N(x.t) ? " (" + (ps > N(x.t) ? "+" : "") + (ps - N(x.t)) + ")" : "") + "</button>"; })() + '</td><td data-l="예상 매출" class="num">' + won(N(x.p) * N(x.t)) + '</td><td class="gx"><button type="button" class="xcx" data-a="gdel" aria-label="빼기">✕</button></td></tr>' + ((G25 || CLEAN) && pyH() ? '<tr class="xg25r" data-id="' + x._id + '"><td colspan="6">' + g25(x) + "</td></tr>" : "");
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
    if (x.k === "중간" || /반짝/.test(x.n)) return pick(L.filter(function (p) { return XC.test(p.c) && /반짝|중간/.test(p.n) && p.n.indexOf(yy + "년") >= 0; })) || pick(L.filter(function (p) { return XC.test(p.c) && /반짝|중간/.test(p.n); })) || pick(L.filter(function (p) { return /반짝/.test(p.n) && !/미노출/.test(p.c); }));   // 10/30 반짝(중간) — 올해 크리스마스 반짝 → 평소 반짝
    if (x.k === "홀") return pick(L.filter(function (p) { return XC.test(p.c) && !/미니|반짝|중간/.test(p.n) && p.n.indexOf(yy + "년") >= 0; })) || pick(L.filter(function (p) { return XC.test(p.c) && !/미니|반짝|중간/.test(p.n); }));
    return null;
  }
  function prHint(x) {
    var m = prMatch(x); if (!m) return '<span class="xprh none">가격표에 없음</span>';
    var same = N(x.p) === m.p, last = !m.n.match(new RegExp(String(cur).slice(2) + "년")) && /크리스마스/.test(m.c);
    return '<span class="xprh' + (same ? " ok" : "") + '" title="' + ea2(m.c + " · " + m.n) + '">' + (same ? "✔ " : "") + "가격표 " + m.p.toLocaleString("ko-KR") + "원" + (last ? " (작년)" : m.c === "조각 케이크" ? " (지금 POS)" : !/크리스마스/.test(m.c) ? " (평소 상품)" : "") +
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
    var mb = matBase(cur), W = mb.W, M = mb.M, S = mb.S;
    return '<div class="xmbox"><div class="xmbh"><b>🥛 3가지 대표 재료 (생크림 · 휘핑 · 딸기)</b><span>🎯 목표 개수로 셈 — 홀 · 중간 ' + W + "개 · 미니 " + M + "개 · 조각 " + (S ? S + "판" : "0판 (조각 판 수 칸이 비어 있어 안 넣음)") + ' · 1개당 g은 눌러서 고침 · 넉넉히 +10%</span>' + mb.warn + '</div>' +
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
  function matBase(y) {   // 11/12 사장님 「목표랑 안 맞아」 — 재료는 늘 🎯 목표 개수로 (예전: 생산 계획에 한 줄이라도 있으면 계획을 써서, 반쯤 남은 계획 · 뺀 품목과 섞였음) · 계획은 비교만
    var o = load(y), ps = prodSums(y), gs = goalSum(goalOf(y)), w = [];
    if (ps.whole && ps.whole !== gs.whole) w.push("홀 · 중간 " + ps.whole);
    if (ps.mini && ps.mini !== gs.mini) w.push("미니 " + ps.mini);
    return { W: gs.whole, M: gs.mini, S: N(o.slicePan), warn: w.length ? '<small class="xmwarn">⚠ 🍰 생산 계획 칸에 적힌 수(' + esc(w.join(" · ")) + ')가 목표와 달라요 — 재료는 목표로 셉니다</small>' : "" };
  }
  function needOf(y) {   // 대표 재료 필요량(+10%) — 재료 화면 크림 · 과일 줄 · 한눈에가 같이 씀
    var o = load(y), per = o.per || PER0, mb = matBase(y), W = mb.W, M = mb.M, S = mb.S;
    return PERK.map(function (r) { var p = per[r[0]] || PER0[r[0]]; return { k: r[0], lab: r[1].split(" ")[0], n: Math.ceil((N(p[0]) * W + N(p[1]) * M + N(p[2]) * S) * 1.1 / r[2]), u: r[3] }; });
  }
  var MK2 = ["크림 · 과일", "재료", "포장", "데코", "기타"], MIC = { "크림 · 과일": "🍓", "재료": "🧈", "포장": "📦", "데코": "✨", "기타": "📎" }, MFLT = "all";
  function buyMore(x, cell) {   // 10/30 사장님 「지금 남은 것 · 미리 주문한 것」 — 필요 수량에서 빼고 더 사야 할 개수 (숫자일 때만) · 11/12 「숫자가 눈에 보이게」 따로 칸(.mr)
    var q = parseFloat(String(x.q || "").replace(/,/g, "")), hs = parseFloat(String(x.has || "").replace(/,/g, "").replace(/^[^\d]*/, "")), pr = parseFloat(String(x.pre || "").replace(/,/g, "").replace(/^[^\d]*/, ""));
    if (cell) {
      if (isNaN(q)) return '<span class="xmr0">—</span>';
      if (isNaN(hs) && isNaN(pr)) return '<span class="xmrn need">' + q.toLocaleString("ko-KR") + '</span><small class="xmrs">남은 수 적으면 계산</small>';
      var r2 = q - (isNaN(hs) ? 0 : hs) - (isNaN(pr) ? 0 : pr);
      return r2 > 0 ? '<span class="xmrn more">' + r2.toLocaleString("ko-KR") + '</span><small class="xmrs">더 사야 해요</small>' : '<span class="xmrn ok">✔</span><small class="xmrs ok">' + (r2 === 0 ? "딱 맞음" : "+" + (-r2).toLocaleString("ko-KR") + " 여유") + "</small>";
    }
    if (isNaN(q) || (isNaN(hs) && isNaN(pr))) return "";
    var r = q - (isNaN(hs) ? 0 : hs) - (isNaN(pr) ? 0 : pr);
    return '<small class="xmbuy' + (r > 0 ? " more" : " ok") + '">' + (r > 0 ? "→ 더 사야 " + r : "✔ 충분 (" + (r === 0 ? "딱 맞음" : "+" + (-r) + " 여유") + ")") + "</small>";
  }
  // 📦 상자 · 하판 따로 세기 (11/16 사장님 「하판 갯수랑 상자 갯수랑 분리해서」) — 이름에 상자 · 하판이 같이 있거나 sp:1이면 필요 · 남은 것 · 미리 주문 · 더 살 것을 두 줄로 (상자 = q · has · pre, 하판 = q2 · has2 · pre2 · 하판 필요 수량이 비면 상자와 같은 수)
  function isSplit(x) { return x.sp === 1 || (x.sp !== 0 && /상자/.test(x.n || "") && /하판/.test(x.n || "")); }
  function canSplit(x) { return /상자|하판|박스/.test(x.n || ""); }
  function partOf(x, i) { return i ? { q: x.q2 !== undefined && String(x.q2).trim() !== "" ? x.q2 : x.q, has: x.has2, pre: x.pre2, qAuto: !(x.q2 !== undefined && String(x.q2).trim() !== "") } : { q: x.q, has: x.has, pre: x.pre }; }
  function moreN(x) { var q = parseFloat(String(x.q || "").replace(/,/g, "")), hs = parseFloat(String(x.has || "").replace(/,/g, "").replace(/^[^\d]*/, "")), pr = parseFloat(String(x.pre || "").replace(/,/g, "").replace(/^[^\d]*/, "")); return isNaN(q) || (isNaN(hs) && isNaN(pr)) ? null : q - (isNaN(hs) ? 0 : hs) - (isNaN(pr) ? 0 : pr); }
  function drawMat(el) {   // 🧾 재료 · 부자재 — 10/30 사장님 「위에 것(대표 재료)처럼 가로로」 · 분류별 표 · 줄마다 수량 · 금액 · 주문처 · 메모 · 주문함 · 입고
    var L = rows(load(cur).mat), cost = 0, od = 0, ind = 0, pcost = 0, nd = needOf(cur);
    L.forEach(function (x) { cost += N(x.c); pcost += N(x.pc); if (x.od) od++; if (x.ind) ind++; });
    function pct(a) { return L.length ? Math.round(a / L.length * 100) : 0; }
    function st(x) { return x.ind ? "in" : x.od ? "od" : "wait"; }
    var h = mainMat() + '<div class="xmbox xmlist"><div class="xmbh"><b>🧾 ' + cur + ' 재료 · 부자재 준비 목록</b><span>크림 · 과일 → 재료 → 포장 → 데코 순 · 칸을 눌러 바로 고치면 저장 · 주문하면 「주문함」, 들어오면 「입고」 · 회색 = 작년 숫자</span></div>' +
      '<div class="xmprog"><div class="xmpg"><span>📨 주문함</span><i><b style="width:' + pct(od) + '%"></b></i><em>' + od + " / " + L.length + " (" + pct(od) + '%)</em></div><div class="xmpg in"><span>📥 입고</span><i><b style="width:' + pct(ind) + '%"></b></i><em>' + ind + " / " + L.length + " (" + pct(ind) + '%)</em></div><div class="xmpg sum"><span>💰 금액 합</span><strong>' + won(cost) + "</strong><em>" + (pcost ? "작년 " + won(pcost) : "") + "</em></div></div>" +
      '<div class="xmflt" role="group" aria-label="보기">' + [["all", "전체 " + L.length], ["wait", "아직 주문 안 함 " + (L.length - od - L.filter(function (x) { return x.ind && !x.od; }).length)], ["od", "주문함 · 입고 전 " + L.filter(function (x) { return x.od && !x.ind; }).length], ["in", "입고 " + ind]].map(function (f) { return '<button type="button" data-a="mflt" data-v="' + f[0] + '" aria-pressed="' + (MFLT === f[0]) + '">' + f[1] + "</button>"; }).join("") + "</div>";
    if (!L.length) h += '<p class="xmempty">아직 목록이 없습니다 · 아래 「작년 목록 불러오기」를 누르면 작년 품목 · 주문처 · 메모가 들어옵니다 (작년 수량 · 금액이 칸에 들어가니 올해 맞게 고치세요)</p>';
    h += '<div class="xmtw"><table class="xmt matt"><thead><tr><th class="mst">상태</th><th>품목</th><th class="mq">필요 수량</th><th class="mh">지금 남은 것</th><th class="mp">미리 주문한 것</th><th class="mr">더 살 것</th><th class="mc">금액(원)</th><th class="mm">메모</th><th class="mb">주문 · 입고</th><th class="mx"><span class="sr">빼기</span></th></tr></thead><tbody>';
    MK2.forEach(function (k) {
      var G = L.filter(function (x) { return (MK2.indexOf(x.k) < 0 ? "기타" : x.k) === k; }); if (!G.length && k === "기타") return;
      var gc = 0, go = 0, gi = 0; G.forEach(function (x) { gc += N(x.c); if (x.od) go++; if (x.ind) gi++; });
      var V = G.filter(function (x) { return MFLT === "all" || st(x) === MFLT; });
      var gm = 0; G.forEach(function (x) { if (isSplit(x)) { if ((moreN(partOf(x, 0)) || 0) > 0 || (moreN(partOf(x, 1)) || 0) > 0) gm++; return; } var q = parseFloat(String(x.q || "").replace(/,/g, "")), hs = parseFloat(String(x.has || "").replace(/,/g, "").replace(/^[^\d]*/, "")), pr = parseFloat(String(x.pre || "").replace(/,/g, "").replace(/^[^\d]*/, "")); if (!isNaN(q) && !(isNaN(hs) && isNaN(pr)) && q - (isNaN(hs) ? 0 : hs) - (isNaN(pr) ? 0 : pr) > 0) gm++; });
      h += '<tr class="xmgrp"><th colspan="10"><span class="xmgt">' + MIC[k] + " " + k + '</span><span class="xmgn"><i>품목 <b>' + G.length + '</b></i><i class="w">대기 <b>' + (G.length - go - G.filter(function (x) { return x.ind && !x.od; }).length) + '</b></i><i class="o">주문함 <b>' + go + '</b></i><i class="g">입고 <b>' + gi + "</b></i>" + (gm ? '<i class="r">더 살 것 <b>' + gm + "</b></i>" : "") + (gc ? '<i class="c">' + won(gc) + "</i>" : "") + "</span>" +
        (k === "크림 · 과일" ? '<span class="xmneed" title="🥛 위 대표 재료 표에서 계산한 필요량 (+10%)">필요 ' + nd.map(function (r) { return r.lab + " <b>" + r.n + r.u + "</b>"; }).join(" · ") + "</span>" : "") +
        '<button type="button" class="skbtn" data-a="madd" data-k="' + k + '">＋ ' + k + " 추가</button></th></tr>";
      if (!V.length) { h += '<tr class="xmnone"><td colspan="10">' + (G.length ? "이 보기에 해당하는 품목이 없어요" : "아직 없어요 · 「＋ 추가」로 넣기") + "</td></tr>"; return; }
      V.forEach(function (x) {
        h += '<tr class="xmr ' + st(x) + '" data-id="' + x._id + '"><td class="mst"><span class="xmdot">' + (x.ind ? "입고" : x.od ? "주문함" : "대기") + '</span><select class="xmi xmk" data-f="k" aria-label="분류 바꾸기" title="분류 바꾸기">' + MK2.map(function (z) { return "<option" + (z === (MK2.indexOf(x.k) < 0 ? "기타" : x.k) ? " selected" : "") + ' value="' + z + '">' + MIC[z] + "</option>"; }).join("") + "</select></td>" +
          '<td class="mn" data-l="품목"><textarea class="xmi xmn2" data-f="n" rows="1" placeholder="품목">' + esc(x.n || "") + '</textarea><input type="text" class="xmi xmsrc" data-f="s" value="' + ea2(x.s) + '" placeholder="주문처" aria-label="주문처">' + (canSplit(x) ? '<button type="button" class="xspbtn' + (isSplit(x) ? " on" : "") + '" data-a="msplit">' + (isSplit(x) ? "✔ 상자 · 하판 따로 세는 중" : "⇅ 상자 · 하판 따로 세기") + "</button>" : "") + '</td>' +
          (isSplit(x) ? (function () {
            var A = partOf(x, 0), B = partOf(x, 1);
            function two(lab, a, b) { return '<div class="xsp"><span class="xspl">상자</span>' + a + '</div><div class="xsp b"><span class="xspl">하판</span>' + b + "</div>"; }
            return '<td class="mq" data-l="필요 수량">' + two("", '<input type="text" class="xmi" data-f="q" value="' + ea2(x.q) + '" placeholder="상자 수">', '<input type="text" class="xmi" data-f="q2" value="' + ea2(x.q2 || "") + '" placeholder="' + ea2(x.q ? x.q + " (상자와 같음)" : "하판 수") + '">') + (x.pq && String(x.pq) !== String(x.q) ? '<small class="xpref">작년 ' + esc(x.pq) + "</small>" : "") + (x.qb ? '<small class="xqb" title="' + ea2(x.qb) + '">🎯 ' + esc(x.qb) + "</small>" : "") + "</td>" +
              '<td class="mh" data-l="지금 남은 것">' + two("", '<input type="text" class="xmi" data-f="has" value="' + ea2(x.has || "") + '" placeholder="상자 남은 수">' + (x.hasAt ? '<small class="xpref" title="' + ea2(x.hasAt) + '">' + esc(x.hasAt) + "</small>" : ""), '<input type="text" class="xmi" data-f="has2" value="' + ea2(x.has2 || "") + '" placeholder="하판 남은 수">' + (x.has2At ? '<small class="xpref" title="' + ea2(x.has2At) + '">' + esc(x.has2At) + "</small>" : "")) + "</td>" +
              '<td class="mp" data-l="미리 주문한 것">' + two("", '<textarea class="xmi" data-f="pre" rows="1" placeholder="상자 개수 · 날짜">' + esc(x.pre || "") + "</textarea>" + (x.preAt ? '<small class="xpref">' + esc(x.preAt) + "</small>" : ""), '<textarea class="xmi" data-f="pre2" rows="1" placeholder="하판 개수 · 날짜">' + esc(x.pre2 || "") + "</textarea>" + (x.pre2At ? '<small class="xpref">' + esc(x.pre2At) + "</small>" : "")) + "</td>" +
              '<td class="mr" data-l="더 살 것">' + two("", buyMore(A, 1), buyMore(B, 1)) + "</td>";
          })() :
          '<td class="mq" data-l="필요 수량"><input type="text" class="xmi" data-f="q" value="' + ea2(x.q) + '" placeholder="수량">' + (x.pq && String(x.pq) !== String(x.q) ? '<small class="xpref">작년 ' + esc(x.pq) + "</small>" : "") + (x.qb ? '<small class="xqb" title="' + ea2(x.qb) + '">🎯 ' + esc(x.qb) + "</small>" : "") + "</td>" +
          '<td class="mh" data-l="지금 남은 것"><input type="text" class="xmi" data-f="has" value="' + ea2(x.has || "") + '" placeholder="남은 수">' + (x.hasAt ? '<small class="xpref" title="' + ea2(x.hasAt) + '">' + esc(x.hasAt) + "</small>" : "") + "</td>" +
          '<td class="mp" data-l="미리 주문한 것"><textarea class="xmi" data-f="pre" rows="1" placeholder="개수 · 날짜" title="예) 100개 · 11/3 주문 · 11/10 도착">' + esc(x.pre || "") + "</textarea>" + (x.preAt ? '<small class="xpref" title="' + ea2(x.preAt) + '">' + esc(x.preAt) + "</small>" : "") + "</td>" +
          '<td class="mr" data-l="더 살 것">' + buyMore(x, 1) + "</td>") +
          '<td class="mc" data-l="금액(원)"><input type="text" inputmode="numeric" class="xmi money num" data-f="c" value="' + ea2(money(x.c)) + '" placeholder="금액">' + (x.pc && N(x.pc) !== N(x.c) ? '<small class="xpref">작년 ' + N(x.pc).toLocaleString("ko-KR") + "</small>" : "") + "</td>" +
          '<td class="mm" data-l="메모"><textarea class="xmi" data-f="m" rows="1" placeholder="메모">' + esc(x.m || "") + "</textarea></td>" +
          '<td class="mb"><button type="button" class="xmst" data-a="od" aria-pressed="' + !!x.od + '">' + (x.od ? "✔ 주문함<small>" + esc(nim(x.od.by)) + " " + esc(x.od.at) + "</small>" : "주문함") + '</button><button type="button" class="xmst" data-a="ind" aria-pressed="' + !!x.ind + '">' + (x.ind ? "✔ 입고<small>" + esc(nim(x.ind.by)) + " " + esc(x.ind.at) + "</small>" : "입고") + "</button></td>" +
          '<td class="mx"><button type="button" class="xcx" data-a="mdel" aria-label="빼기">✕</button></td></tr>';
      });
    });
    h += '</tbody></table></div><div class="xmbtns"><button type="button" class="skbtn" data-a="madd">＋ 품목 추가</button><button type="button" class="skbtn" data-a="mload">↓ 작년 목록 불러오기 (없는 품목만)</button></div></div>';
    el.innerHTML = h;
    Array.prototype.forEach.call(el.querySelectorAll("textarea"), grow2);
  }
  (function (el) {
    el.addEventListener("input", function (e) { if (e.target.tagName === "TEXTAREA") grow2(e.target); });
    el.addEventListener("change", function (e) {
      var t2 = e.target; if (!t2.classList.contains("xmi")) return;
      var r = t2.closest("tr[data-id]"); if (!r) return;
      var id = r.dataset.id, f = t2.dataset.f, v = t2.classList.contains("money") ? moneyRaw(t2.value) : t2.value.trim();
      matEdit(cur, function (m) { if (!m[id]) return; m[id][f] = v; if (f === "has" || f === "pre" || f === "has2" || f === "pre2") m[id][f + "At"] = v ? stampNow() + " · " + nim(me() || "") : ""; }); setTimeout(function () { drawPane(true); }, 0);
    });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b || !el.contains(b)) return; var a = b.dataset.a, card = b.closest("tr[data-id]"), id = card && card.dataset.id;
      if (a === "mflt") { MFLT = b.dataset.v; drawPane(); return; }
      if (a === "madd") { var k = nid("m"), kk = b.dataset.k || "기타"; MFLT = "all"; matEdit(cur, function (m) { m[k] = { k: kk, n: "", o: Object.keys(m).length }; }); drawPane(); var i2 = el.querySelector('tr[data-id="' + k + '"] [data-f="n"]'); if (i2) i2.focus(); return; }
      if (a === "mload") {
        var P = prevMat(cur); if (!P.length) { alert("불러올 작년 목록이 없습니다"); return; }
        var have = {}; rows(load(cur).mat).forEach(function (x) { have[String(x.n).replace(/\s/g, "")] = 1; });
        var add = P.filter(function (x) { return x.n && !have[String(x.n).replace(/\s/g, "")]; });
        if (!add.length) { alert("작년 품목이 이미 다 들어 있습니다"); return; }
        matEdit(cur, function (m) { var n0 = Object.keys(m).length; add.forEach(function (x, i) { m["p" + (n0 + i)] = { k: x.k || "기타", n: x.n, s: x.s || "", m: x.m || "", pq: x.pq || x.q || "", pc: x.pc || x.c || "", q: String(x.pq || x.q || "").replace(/^0$/, ""), c: String(x.pc || x.c || "").replace(/^0$/, ""), o: n0 + i /* 10/21 사장님 「있는 것에서 수정」 — 작년 수량 · 금액을 칸에 넣어 두고 고침 */ }; }); });
        drawPane(); return;
      }
      if (!id) return;
      if (a === "msplit") { var on = b.classList.contains("on"); if (on && !confirm("상자 · 하판을 한 줄로 합칠까요? (하판 칸에 적은 숫자는 그대로 남고 화면에서만 안 보여요)")) return; matEdit(cur, function (m) { if (m[id]) m[id].sp = on ? 0 : 1; }); drawPane(true); return; }
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
  // 📅 생산 계획 캘린더 (11/16 사장님 「캘린더처럼 볼 수 있게」) — 표와 같은 칸(o.prod 계획 p · 실제 a)을 일~토 달력으로 · 날짜를 누르면 표의 그 날로
  var PV = "cal"; try { PV = localStorage.getItem("cafesui.ui.xmprodv") === "tab" ? "tab" : "cal"; } catch (e) {}
  function pvSet(v) { PV = v; try { localStorage.setItem("cafesui.ui.xmprodv", v); } catch (e) {} }
  function lyDay(s) {   // 작년 같은 날짜 실제 작업량 (홀 · 미니 개 · 조각 판)
    var o = { w: "", m: "", sl: "" };
    [["w", /예약 홀케이크/], ["m", /미니케이크 생산/], ["sl", /조각케이크 생산 수량(\(전날|$)/]].forEach(function (q) {
      var T = prevT(/실제 작업량/, q[1]), i = colIdx(T, s); if (!T || i < 1) return; var t = 0, any = 0;
      T.r.slice(1).forEach(function (r) { if (/합계/.test(String(r[0]))) return; var v = r[i]; if (v !== "" && v != null && !isNaN(+v)) { t += +v; any = 1; } }); if (any) o[q[0]] = Math.round(t * 10) / 10;
    });
    return o;
  }
  // 📊 작년 대비 (11/16 사장님 「작년 기준으로 대비 · 작년 대비로 목표를 잡아 주면」) — 작년 실제 작업량 표 전체(12/18~25) · 남은 것(FBY l) · 올해 목표 · 날짜 계획을 종류별 한 표로
  var LYLEFT = { 2025: { w: 0, md: 0, m: 12, sl: 15 }, 2024: { w: 0, md: 0, m: 15, sl: 2 } };   // 남은 것 (조각은 판 · 25년 딸기 생크림 56 + 초딸 3 + 샤요 1 = 60조각 ≈ 15판)
  function lyAll(pa, pb) {   // 작년 표 전체 합 · 피크(같은 월/일) 합
    var o = { w: 0, m: 0, sl: 0, pw: 0, pm: 0, psl: 0, cols: [] }, a = md(pa), b = md(pb);
    function inPk(k) { var x = k.split("/"), A = a.split("/"), B = b.split("/"); var v = +x[0] * 100 + +x[1]; return v >= +A[0] * 100 + +A[1] && v <= +B[0] * 100 + +B[1]; }
    [["w", /예약 홀케이크/], ["m", /미니케이크 생산/], ["sl", /조각케이크 생산 수량(\(전날|$)/]].forEach(function (q) {
      var T = prevT(/실제 작업량/, q[1]); if (!T) return;
      for (var i = 1; i < T.r[0].length; i++) {
        var hk = /(\d{1,2})\/(\d{1,2})/.exec(String(T.r[0][i])); if (!hk) continue; var k = (+hk[1]) + "/" + (+hk[2]), t = 0;
        T.r.slice(1).forEach(function (r) { if (/합계/.test(String(r[0]))) return; var v = r[i]; if (v !== "" && v != null && !isNaN(+v)) t += +v; });
        o[q[0]] += t; if (inPk(k)) o["p" + q[0]] += t;
      }
    });
    return o;
  }
  function yoyBox(g, it, P, pa, pb) {
    var py = cur - 1, L = lyAll(pa, pb), LF = LYLEFT[py] || { w: 0, md: 0, m: 0, sl: 0 }, sp = N(load(cur).slicePan);
    if (!L.w && !L.m) return "";
    function sumK(f, pk) { return it.filter(f).reduce(function (a, x) { var r = P[x._id] || {}; return a + Object.keys(r).reduce(function (b, d) { return b + ((!pk || (d >= pa && d <= pb)) ? N(r[d] && r[d].p) : 0); }, 0); }, 0); }
    function tK(f) { return it.filter(f).reduce(function (a, x) { return a + N(x.t); }, 0); }
    function pct(a, b) { if (!b) return a ? "새로" : ""; var d = a - b; return (d >= 0 ? "▲" : "▼") + Math.abs(d) + " (" + (d >= 0 ? "+" : "−") + Math.round(Math.abs(d) / b * 100) + "%)"; }
    function cls(a, b) { return !b ? "nw" : a > b ? "up" : a < b ? "dn" : "eq"; }
    var fW = function (x) { return x.k === "홀"; }, fMd = function (x) { return x.k === "중간" || x.k === "기타"; }, fM = function (x) { return x.k === "미니"; }, fS = function (x) { return x.k === "조각"; };
    var R = [
      ["🎂", "한판 (홀)", "개", L.w, LF.w, tK(fW), sumK(fW), "23 · 24일 「오늘 홀 있어요?」 전화 몫까지"],
      ["🎁", "반짝 (중간)", "개", 0, 0, tK(fMd), sumK(fMd), "올해 새로 · 단체 주문"],
      ["🧁", "미니", "개", L.m, LF.m, tK(fM), sumK(fM), "작년 " + LF.m + "개 남음 → 줄임"],
      ["🍰", "조각 (판)", "판", L.sl, LF.sl, sp || 0, sumK(fS), "작년 약 " + LF.sl + "판(" + LF.sl * 4 + "조각) 남음 → 줄임"]
    ];
    var h = '<div class="xyoy"><table><thead><tr><th>종류</th><th>' + py + '년<small>만든 것</small></th><th>' + py + '년<small>남은 것 → 팔린 것</small></th><th class="hl">' + cur + '년 목표<small>작년 만든 것 대비</small></th><th>' + cur + '년 날짜 계획<small>12/18~ 날짜 칸 합</small></th><th>목표와 차이</th></tr></thead><tbody>';
    var T = { ly: 0, sold: 0, goal: 0, plan: 0 };
    R.forEach(function (r, i) {
      var sold = r[3] - r[4], gap = r[6] - r[5];
      if (i < 3) { T.ly += r[3]; T.sold += sold; T.goal += r[5]; T.plan += r[6]; }
      h += '<tr' + (i === 3 ? ' class="sl"' : "") + '><th><span class="ic">' + r[0] + "</span>" + r[1] + "</th>" +
        '<td class="n">' + (r[3] ? r[3] + r[2] : "—") + "</td>" +
        '<td class="n sm">' + (r[3] ? (r[4] ? '<s class="lf">' + r[4] + r[2] + " 남음</s> → " : "") + sold + r[2] + (r[4] ? "" : " (다 팔림)") : "—") + "</td>" +
        '<td class="n hl"><b>' + (r[5] || "—") + r[2] + '</b><em class="' + cls(r[5], r[3]) + '">' + pct(r[5], r[3]) + "</em><small>" + esc(r[7]) + "</small></td>" +
        '<td class="n"><b>' + r[6] + r[2] + "</b></td>" +
        '<td class="n gp ' + (gap === 0 ? "ok" : "no") + '">' + (gap === 0 ? "✔ 맞음" : (gap < 0 ? "−" + (-gap) : "+" + gap) + r[2] + (gap < 0 && i < 2 ? "<small>12/17 전(예약 들어오는 대로) 몫</small>" : "<small>날짜 칸을 고쳐 맞추기</small>")) + "</td></tr>";
    });
    var gt = T.plan - T.goal;
    h += '</tbody><tfoot><tr><th>🎄 크리스마스 케이크 합<small>한판 + 반짝 + 미니</small></th><td class="n">' + T.ly + '개</td><td class="n sm">' + T.sold + '개 팔림</td><td class="n hl"><b>' + T.goal + '개</b><em class="' + cls(T.goal, T.ly) + '">' + pct(T.goal, T.ly) + "</em>" + (N(g.total) && N(g.total) !== T.goal ? "<small>전사 목표 칸은 " + esc(g.total) + "개 (품목 합과 " + (N(g.total) - T.goal) + "개 차이)</small>" : "") + '</td><td class="n"><b>' + T.plan + '개</b></td><td class="n gp ' + (gt === 0 ? "ok" : "no") + '">' + (gt === 0 ? "✔ 맞음" : (gt < 0 ? "−" : "+") + Math.abs(gt) + "개<small>" + (gt < 0 ? "12/17 전 몫" : "목표보다 많음") + "</small>") + "</td></tr></tfoot></table></div>";
    // 피크 같은 기간
    var pW = sumK(function (x) { return x.k !== "조각" && x.k !== "미니"; }, 1), pM = sumK(fM, 1), lyP = L.pw + L.pm, pP = pW + pM, gp = N(g.peak);
    h += '<div class="xyoypk"><b class="t">🔥 피크 ' + md(pa) + "~" + md(pb) + ' 같은 날짜끼리</b>' +
      '<div class="c"><span>' + py + '년 실제</span><b>' + lyP + "개</b><small>한판 " + L.pw + " · 미니 " + L.pm + "</small></div>" +
      '<div class="c hl"><span>' + cur + '년 목표</span><b>' + (gp || "—") + "개</b><small>" + (gp ? pct(gp, lyP) + " 작년 대비" : "") + "</small>" + (gp && gp < lyP ? '<button type="button" class="xyoyw" data-go="goal">⚠ 작년 같은 날짜(' + lyP + '개)보다 적게 잡혀 있어요 → 🎯 목표에서 고치기</button>' : "") + "</div>" +
      '<div class="c"><span>' + cur + '년 날짜 계획</span><b>' + pP + "개</b><small>한판 · 반짝 " + pW + " · 미니 " + pM + (gp ? " · 목표와 " + (pP - gp >= 0 ? "+" : "−") + Math.abs(pP - gp) : "") + "</small></div></div>";
    // 한 줄 정리
    var lines = [];
    lines.push("한판은 작년 " + L.w + "개 → 목표 " + R[0][5] + "개 " + pct(R[0][5], L.w) + " · 날짜 칸엔 " + R[0][6] + "개, 나머지 " + Math.max(0, R[0][5] - R[0][6]) + "개는 12/17 전에 예약 들어오는 대로");
    lines.push("미니는 작년 " + L.m + "개 만들어 " + LF.m + "개 남음(팔린 " + (L.m - LF.m) + "개) → 목표 " + R[2][5] + "개 — 팔린 수보다 " + Math.max(0, L.m - LF.m - R[2][5]) + "개 적어서 남을 걱정은 적고, 25일 오후 진열이 모자랄 수 있음");
    lines.push("조각은 작년 " + L.sl + "판 중 약 " + LF.sl + "판 남음 → 올해 " + (sp || "—") + "판 (딸기 생크림 82 → 68판, 23 · 24일에서 뺌)");
    lines.push("피크 " + md(pa) + "~" + md(pb) + "는 작년 " + lyP + "개 → 올해 계획 " + pP + "개" + (gp && gp !== pP ? " (목표 칸 " + gp + "개와 " + (pP - gp) + "개 차이)" : ""));
    h += '<ul class="xyoyl">' + lines.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
    return h;
  }
  function prodCal(g, it, D, P, pa, pb, t0) {
    if (!D.length) return "";
    var a = new Date(+D[0].slice(0, 4), +D[0].slice(5, 7) - 1, +D[0].slice(8)), b = new Date(+D[D.length - 1].slice(0, 4), +D[D.length - 1].slice(5, 7) - 1, +D[D.length - 1].slice(8));
    a.setDate(a.getDate() - a.getDay()); b.setDate(b.getDate() + (6 - b.getDay()));
    var KG = [["🎂", "홀 · 중간", function (x) { return x.k === "홀" || x.k === "중간" || x.k === "기타"; }, "개", "w"], ["🧁", "미니", function (x) { return x.k === "미니"; }, "개", "m"], ["🍰", "조각", function (x) { return x.k === "조각"; }, "판", "sl"]];
    var TT = { w: 0, m: 0, sl: 0 }, h = '<div class="xpcal"><div class="xpcalh">' + WDN.map(function (w, i) { return '<b class="' + (i === 0 ? "sun" : i === 6 ? "sat" : "") + '">' + w + "</b>"; }).join("") + "</div><div class=\"xpcalg\">";
    for (var d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
      var s = ymd(d), inD = D.indexOf(s) >= 0, wd = d.getDay(), ly = PLREF ? lyDay(s) : {};
      var cls = "xpcd" + (inD ? " on" : " off") + (s >= pa && s <= pb ? " peak" : "") + (s === t0 ? " now" : "") + (wd === 0 ? " sun" : wd === 6 ? " sat" : "");
      var body = "";
      if (inD) {
        KG.forEach(function (G) {
          var L = it.filter(G[2]), t = 0, ta = 0, parts = [];
          L.forEach(function (x) { var c = (P[x._id] || {})[s] || {}, v = N(c.p); t += v; ta += N(c.a); if (v) parts.push(esc((x.n || "").replace(/\s*\([^)]{7,}\)?.*$/, "").replace(/ 조각$/, "")) + " " + v); });
          TT[G[4]] += t;
          if (t || (ly[G[4]] !== "" && ly[G[4]] != null)) body += '<div class="xpcq ' + G[4] + (t ? "" : " zero") + '"><span class="xpcq1">' + G[0] + " " + G[1] + " <b>" + (t || 0) + "</b>" + G[3] + (ta ? ' <em>실제 ' + ta + "</em>" : "") + "</span>" + (parts.length > 1 ? "<small>" + parts.join(" · ") + "</small>" : "") + (ly[G[4]] !== "" && ly[G[4]] != null ? '<small class="ly">작년 ' + ly[G[4]] + G[3] + (t === ly[G[4]] ? " · 같음" : ' <b class="' + (t > ly[G[4]] ? "up" : "dn") + '">' + (t > ly[G[4]] ? "▲" : "▼") + Math.round(Math.abs(t - ly[G[4]]) * 10) / 10 + "</b>") + "</small>" : "") + "</div>";
        });
      }
      if (!inD && PLREF && (ly.w !== "" || ly.m !== "" || ly.sl !== "")) cls += " lyoff", body += '<small class="xpcoff">작년 이날 ' + [ly.w !== "" ? "홀 " + ly.w : "", ly.m !== "" ? "미니 " + ly.m : "", ly.sl !== "" ? "조각 " + ly.sl + "판" : ""].filter(Boolean).join(" · ") + (wd === 0 ? " — 올해는 휴무라 앞뒤 날에 나눔" : "") + "</small>";
      var sg = inD || sugs(cur).some(function (x) { return x.d === s; }) ? sugHead(s) : "", ck = ckHead(s);
      h += '<div class="' + cls + '"' + (inD ? ' data-d="' + s + '" role="button" tabindex="0" title="눌러서 표에서 이 날 숫자 고치기"' : "") + '><div class="xpcdh"><b>' + (d.getMonth() + 1) + "/" + d.getDate() + "</b><span>" + WDN[wd] + "</span>" + (s >= pa && s <= pb && inD ? '<i class="pk">🔥 피크</i>' : "") + (s === t0 ? '<i class="td">오늘</i>' : "") + (!inD && wd === 0 ? '<i class="cl">휴무</i>' : "") + "</div>" + body + (sg ? '<div class="xpcds">' + sg + "</div>" : "") + (ck ? '<div class="xpcdk">' + ck + "</div>" : "") + "</div>";
    }
    h += '</div><p class="xpcalf">📅 이 기간 계획 합: 🎂 홀 · 중간 <b>' + TT.w + '개</b> · 🧁 미니 <b>' + TT.m + '개</b> · 🍰 조각 <b>' + TT.sl + '판</b> (약 ' + TT.sl * 4 + '조각 · 1판 ≈ 4조각) — 날짜를 누르면 표에서 그 날 숫자를 고칠 수 있어요' + (PLREF ? ' · 회색 = ' + (cur - 1) + "년 같은 날 실제" : "") + "</p></div>";
    return h;
  }
  function drawProd(el) {   // 🍰 생산 계획 (10/30 · 날짜별 생산 + 주간 계획표 ① 합침) — 위: 목표 ↔ 계획 숫자 · 💡 제안 · 표(홀 · 중간 / 미니 / 조각(판)) · 칸마다 작년 숫자 · 주석
    var g = goalOf(cur), it = rows(g.it), D = daysOf(cur), P = load(cur).prod || {}, ps = prodSums(cur), gs = goalSum(g), py = cur - 1;
    var pa = gday(cur, gmd(g.pf, "12/21")), pb = gday(cur, gmd(g.pt, "12/25")), gCake = gs.whole + gs.mini, pCake = ps.whole + ps.mini;
    var sg = sugs(cur).filter(function (x) { return !x.nt && !x.ap && x.it; }).length, t0 = today();
    function kp(lab, b, em, off, go) { return '<button type="button" class="xpk' + (off ? " off" : "") + '"' + (go ? ' data-go="' + go + '"' : "") + "><span>" + lab + "</span><b>" + b + "</b>" + (em ? "<em>" + em + "</em>" : "") + "</button>"; }
    var h = '<div class="xmbox xpnew"><div class="xmbh"><b>🍰 ' + cur + ' 생산 계획 · 작년(' + py + ') 대비</b><span>① 종류별로 작년과 비교 → ② 날짜별 계획 (캘린더로 보기 · 표에서 숫자 고치기)</span></div>' +
      yoyBox(g, it, P, pa, pb) +
      '<div class="xmbtns xpbar"><span class="xpvw" role="group" aria-label="보기"><button type="button" data-a="pvcal" class="' + (PV === "cal" ? "on" : "") + '">📅 캘린더로 보기</button><button type="button" data-a="pvtab" class="' + (PV === "tab" ? "on" : "") + '">📋 표 · 숫자 고치기</button></span><label class="xpchk"><input type="checkbox" id="xpRefChk"' + (PLREF ? " checked" : "") + "> 작년 숫자 같이 보기</label>" +
      '<button type="button" class="skbtn" data-a="plwide">' + (document.documentElement.classList.contains("xmwide") ? "↩ 원래 폭으로" : "⛶ 넓게 보기") + '</button><button type="button" class="skbtn" data-a="plprint">🖨 인쇄 · PDF</button><button type="button" class="skbtn xpaopen">💰 가격표</button></div>' +
      (PV === "cal" ? prodCal(g, it, D, P, pa, pb, t0) : "") +
      '<details class="xpsgd"><summary>💡 생산 제안 · 📌 날짜 메모' + (sg ? ' <b class="xpsgn">아직 계획에 안 넣은 제안 ' + sg + "개</b>" : "") + "</summary>" + sugBox() + "</details>" +
      '<div class="xptabw"' + (PV === "cal" ? " hidden" : "") + '><label class="xmnote xmshort">생산 날짜 (쉼표로 · 예: 12/18, 12/19 …)<input type="text" class="xdays" value="' + ea2(D.map(function (s) { return (+s.slice(5, 7)) + "/" + (+s.slice(8)); }).join(", ")) + '"></label>' +
      '<div class="xmtw"><table class="xmt prod"><thead><tr><th>품목</th>' + D.map(function (s) { var dw = new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8)).getDay(); return '<th data-d="' + s + '" class="' + (s >= pa && s <= pb ? "peak" : "") + (s === t0 ? " now" : "") + (dw === 6 ? " sat" : dw === 0 ? " sun" : "") + '">' + mdw(s) + sugHead(s) + ckHead(s) + (PLREF ? yHeadHtml(s) : "") + "</th>"; }).join("") + '<th>합계</th></tr></thead><tbody>';
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
    h += "</tbody></table></div></div>" + g25box("cake") + g25box("slice") + "</div>";
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
      var cd = e.target.closest && e.target.closest(".xpcd[data-d]");
      if (cd && !e.target.closest("[data-a]")) { pvSet("tab"); drawPane(true); setTimeout(function () { var th = document.querySelector('#xmProd th[data-d="' + cd.dataset.d + '"]'); if (th) { th.scrollIntoView({ block: "center", inline: "center" }); th.classList.add("xpflash"); setTimeout(function () { th.classList.remove("xpflash"); }, 2200); } }, 60); return; }
      var b = e.target.closest && e.target.closest("[data-a]"); if (!b) return; var a = b.dataset.a, row = b.closest("[data-s]"), sid = row && row.dataset.s;
      if (a === "pvcal" || a === "pvtab") { pvSet(a === "pvcal" ? "cal" : "tab"); drawPane(true); return; }
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
    if (CLEAN && !PLOPEN) { el.innerHTML = '<button type="button" class="xmplopen" data-a="plopen">🗂 주간 계획표 펼치기 <small>일하는 스케줄 · 12/1~17 예약 속도 · 피크 날 시간대별 픽업</small></button>'; return; }
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
  // 📒 해마다 피드백 한눈에 (11/16 사장님 「매년 피드백 · 자세히」 → 「한 번에 읽었을 때 이해하기 쉽게」로 다시 씀)
  //    크리스마스 파일(cafesui.xmas.hist)의 정리 · 작업표 「피드백」 · 칸 주석을 읽고 쉬운 문장으로 옮김 · 해마다 카드 = 숫자 → 👍 잘된 점 → 👎 아쉬운 점 → 👉 다음엔 → 시트 · 재료 · 사람
  var FBKEY = [
    ["🎄", "예약은 늘 24 · 25일에 몰린다", "21년 이틀에 83% · 25년 홀도 77%", "23일 픽업을 늘리고, 24일은 받을 수량을 막기"],
    ["🌙", "24일은 해마다 밤샘", "23 · 24년 새벽 4시 반 · 25년 24일 19시간", "일할 사람 · 미리 해 둘 일을 먼저 정하기"],
    ["🧁", "미니 · 조각이 남는다", "24년 미니 80개 중 15개 · 25년 미니 118개 중 12개 · 25년 딸기 생크림 조각 82판(약 328조각) 중 56조각 남음", "미니는 작년보다 12개 덜 (106개까지) · 딸기 생크림 조각은 14판(56조각) 덜 = 68판"],
    ["🧊", "냉장고 자리가 늘 모자라다", "24년 케이크를 차 안에 보관 · 25년 홀 13개 그날 못 만듦", "냉장고에 몇 개 들어가는지 먼저 세기"],
    ["📦", "재료는 늘 넉넉 · 남은 수는 거의 안 적었다", "생크림 23년 약 60통 · 25년 20통 넘게 더 받음 · 딸기 25년 22팩 + 손질한 2바구니 남음 · 시트는 3년 다 남은 수 기록 없음", "12/26 마감 때 남은 시트 · 생크림 · 딸기 · 조각 · 미니를 세서 적기 · 생크림 · 딸기는 필요량 + 10%까지만"],
    ["🍓", "딸기에서 사고가 난다", "23년 딸기 농장 거래 중간에 끊김 · 24년 상한 딸기 큰 통 3개 버림", "거래처 두 곳 · 쓰기 직전에 손질 · 냉장 보관"]
  ];
  var FBY = {
    2025: { t: "목표를 두 번 낮춘 해",
      n: [["홀", "159개"], ["미니", "118개"], ["조각", "134판"], ["예상 매출", "1,349만 원"]],
      g: ["시트를 빵집에 주문해서, 시트 굽는 일이 없어졌다.", "일 순서가 손에 익어서 작업이 생각보다 빨랐다.", "초코딸기 조각이 잘 팔렸다. (3개만 남음)", "준비 순서가 자리 잡았다: 12/6 거래처에 개수 알림 → 12/8 리본 자르기 → 12/9 상자 · 엽서 주문 → 12/22 홀 예약 마감"],
      b: ["12월 초(1~9일) 예약이 12개뿐이라 목표를 300개 → 180개로 낮췄다. 늦게 알아챘다.", "미니를 너무 많이 깔아서 12개 남았다.", "딸기 생크림 조각이 56개 남았다.", "냉장고 자리가 없어서 홀 13개를 그날 못 만들었다.", "23 · 24일에 「오늘 홀케이크 있어요?」 전화가 많았는데 팔 케이크가 없었다.", "24일 19시간, 25일 15시간 반 일했다."],
      x: ["홀은 150개쯤 들어온다고 생각하고 준비하기.", "미니는 12개 덜 만들기: 118 → 106개까지. 25일 현장 미니는 26 → 14개쯤. 진열용 1개는 꼭 꺼내 두기. (봐야 산다)", "딸기 생크림 조각은 14판(56조각) 덜 만들기: 82 → 68판. 23 · 24일 몫에서 빼기.", "초코딸기 조각은 25판이 거의 다 팔림(3개 남음) → 그대로 또는 조금 더.", "냉장고에 몇 개 들어가는지 먼저 세기.", "23 · 24일엔 그날 팔 홀케이크를 몇 개 준비하기."],
      l: [["🍞 시트", "빵집 주문 기본 74 · 초코 12", "기록 없음", "none"], ["🥛 생크림", "필요 약 243통 · 받은 것 216 + 80 = 296통", "약 20통 여유 (파일 메모 「20개 정도 여유」 · 계산으로는 53통 더 받음)", "over"], ["🧈 휘핑", "필요 43개 · 주문 48개", "약 5개 여유 (계산)", "over"], ["🍓 딸기", "필요 333팩 · 주문 340팩", "22팩 + 손질해 둔 2바구니 남음", "over"], ["🍰 조각", "134판 (딸기 생크림 82 · 초코딸기 25 · 말차 9 · 과일동산 6 · 망고 6 · 샤인 4 · 티라미수 2)", "딸기 생크림 56조각(14판) · 초코딸기 3 · 샤요 1 남음 · 파손 말차 2 · 샤요 1", "over"], ["🧁 미니", "118개 만듦", "12개 남음 (약 106개 팔림)", "over"]],
      f: [["🍞 시트", "빵집에 주문 — 기본 74 · 초코 12 (136만 원 · 29.5만 원 · 묶음 단위 확인 필요)"], ["🥛 재료", "생크림 216통 · 휘핑 48개 · 딸기 340팩 · 홀 1개 = 생크림 340g + 휘핑 100g + 딸기 1통"], ["👥 사람", "사장님 · 항아님 · 어머님 + 추가 1명 · 1시간에 7개 정도"]] },
    2024: { t: "야근 줄이기를 목표로 한 해",
      n: [["홀", "174개 (목표 230)"], ["미니", "80개"], ["조각", "808조각"], ["예상 매출", "1,567만 원"]],
      g: ["시트를 직접 구웠는데, 오븐 두 대를 같이 쓰니 6시간 → 4시간으로 줄었다.", "2명이서 홀 15개를 1시간 30분에 만들었다.", "미니를 찾는 손님이 생각보다 많았다.", "조각케이크는 오후 3시쯤 다 팔렸다."],
      b: ["첫날 시트 재료를 잘못 재서 다시 했다. (3시간 넘게 걸림)", "딸기를 너무 일찍 손질하고 밖에 둬서 큰 통 3개 분량을 버렸다.", "냉장고가 좁아서 케이크 · 시트를 차 안에 보관했다.", "23 · 24일 새벽 4시 반까지 일했다. 갈수록 지쳐서 느려졌다.", "미니 15개 · 피스타치오 딸기 조각 7개가 남았다."],
      x: ["재료 재는 시간을 줄여야 일찍 끝난다.", "아이싱이 끝나면 하나씩 바로 완성해서 내보내기.", "딸기는 쓰기 직전에 손질하고 냉장 보관.", "미니는 15개 덜 만들기: 80 → 65개 (그래도 25년엔 미니 찾는 손님이 늘어 106개 팔림)", "시트는 직접 굽지 말고 줄이기 → 25년에 빵집 주문으로 바꿈"],
      l: [["🍞 시트", "직접 구움 기본 242 · 초코 45 · 미니 25장", "기록 없음", "none"], ["🥛 생크림", "필요 약 134통 · 계획표 준비 216통 · 작업표 메모 65 + 20통", "남은 수 기록 없음 (준비 숫자도 서로 달라요)", "none"], ["🍓 딸기", "필요 292팩 · 준비 315팩 (재료 목록엔 411팩)", "상한 딸기 큰 통 3개 버림", "bad"], ["🍰 조각", "123판 (딸기 생크림 61 · 초코딸기 22 · 망고 13 · 피스타치오 12 · 샤인 11 · 티라미수 4)", "피스타치오 딸기 조각 7개 남음 · 나머지는 오후 3시쯤 다 나감", "over"], ["🧁 미니", "80개 만듦", "15개 남음 (65개 팔림)", "over"]],
      f: [["🍞 시트", "직접 구움 — 기본 242 · 초코 45 · 미니 25장 (하루 기본 11번 · 초코 2~3번 굽기)"], ["🥛 재료", "생크림 85통 (65 + 20) · 딸기 411팩"], ["👥 사람", "사장님 · 항아님 · 어머님 + 추가 1명 (바 · 설거지 · 뒷정리)"]] },
    2023: { t: "계획대로 만든 해",
      n: [["홀", "152개 (계획 151)"], ["미니", "71개"], ["조각", "123판"]],
      g: ["계획한 숫자(151개)와 실제(152개)가 거의 같았다."],
      b: ["딸기 농장 거래가 12/19에 끊겨서 도매시장으로 바꿨다.", "생크림을 여러 곳에서 나눠 사서 헷갈렸다.", "22~24일 사장님이 밤을 새웠다.", "시트 재료를 실제보다 적게 준비했다."],
      x: ["생크림은 한 곳에서 고정으로 받기.", "딸기 거래처는 두 곳 이상 잡아 두기.", "작업 순서: 조각 → 미니 → 홀, 초코부터."],
      l: [["🍞 시트", "직접 구움 기본 221 · 초코 54장", "기록 없음 · 오히려 재료를 적게 준비했다", "none"], ["🥛 생크림", "필요 164통 · 들어온 것 224통", "약 60통 더 받음 (남은 수는 안 적음)", "over"], ["🍓 딸기", "필요 약 160 · 들어온 것 165.5 (밀양 25 + 도매 140.5)", "약 5 여유 · 거의 딱 맞음", "ok"], ["🧁 미니 · 🍰 조각", "미니 71개 · 조각 123판", "기록 없음", "none"]],
      f: [["🍞 시트", "직접 구움 — 기본 221 · 초코 54장"], ["🥛 재료", "생크림 224통 · 딸기 밀양 농장 60 + 도매 100"], ["👥 사람", "사장님 + 도와준 사람 2명 (하루 3시간쯤)"]] },
    2022: { t: "현장 판매를 시작한 해",
      n: [["예약", "85개 (+20)"], ["현장 판매", "44개 준비"]],
      g: ["예약 말고 현장에서 팔 케이크를 따로 준비하기 시작했다."],
      b: ["예약이 네이버 · 인스타 · 카톡 · 톡톡으로 흩어져서 관리가 어려웠다.", "24일 하루에 예약의 61%가 몰렸다."],
      x: ["예약은 네이버 한 곳으로 모으기."], f: [] },
    2021: { t: "첫 크리스마스",
      n: [["예약", "65개"]],
      g: ["처음으로 크리스마스 예약 판매를 해냈다."],
      b: ["24 · 25일 이틀에 83%가 몰렸다."],
      x: ["24 · 25일에 몰리는 것 대비하기."], f: [] }
  };
  // 작년 문제 → 올해(2026) 어떻게 — st: ok 했음 · part 하는 중 · todo 아직
  var FBNOW = {
    2026: [
      ["ok", "미니가 12개 남았다 (118개 만들어 약 106개 팔림)", "미니 목표 90개 = 작년보다 28개 덜 · 팔린 수보다도 16개 적음 → 남을 걱정은 적고, 25일 현장 미니가 모자랄 수 있음"],
      ["ok", "24일 19시간 일했다", "23일 픽업을 13 → 33개로 늘렸다 · 미니 24일 몫은 23일에 미리"],
      ["ok", "준비가 12월에 몰렸다", "올해는 3주쯤 빠르다 (회의 10/9 · 안내지 10/28 · 리본 주문 11/16)"],
      ["ok", "바쁜 날 문구 픽까지 하느라 힘들었다", "12/23~25 픽업은 문구 픽 안 함"],
      ["part", "24일에 너무 몰린다", "그래도 24일 한판 · 반짝 77개 (작년 69개) → 예약 수량 막기 · 추가 인력 정하기"],
      ["part", "그날 홀케이크 찾는 전화를 못 받았다", "23 · 24일 홀 5개씩 더 만들자는 제안만 있음 (계획엔 아직 안 넣음)"],
      ["todo", "예약이 적은 걸 늦게 알았다", "매주 스마트플레이스에서 크리스마스 예약 개수 보기"],
      ["todo", "냉장고 자리가 모자랐다", "24 · 25일 냉장고에 몇 개 들어가는지 세기"],
      ["ok", "딸기 생크림 조각이 56개 남았다 (82판 만듦)", "생산 계획에 딸기 생크림 68판 (23일 30 → 22 · 24일 20 → 14) · 초코딸기 25 · 피스타치오 10 · 샤인 4 · 망고 6 = 113판을 넣었다 · ⚠ 목표 칸 「딸기 생크림 300조각」은 68판(약 272조각)보다 많음 — 확인"],
      ["part", "미니가 남았다 (24년 15개 · 25년 12개)", "계획 미니 90개 (작년 118개) · 25일은 25개 (작년 50개) — 남기보다 모자랄 수 있으니 25일 오후에 진열 보고 더 만들지 정하기"],
      ["todo", "생크림 · 딸기를 넉넉히 받아 남았다 (25년 생크림 20통 넘게 · 딸기 22팩)", "재료 표 필요 수량 + 10%까지만 주문 · 매일 남은 통 수 세서 다음 주문 줄이기"],
      ["todo", "끝나고 남은 시트 · 생크림 수를 안 적었다 (3년 다)", "12/26 마감 때 남은 시트 · 생크림 · 딸기 · 조각 · 미니 세서 📊 지난 해에 적기"],
      ["todo", "시트를 빵집에 주문 (작년 기본 74 · 초코 12)", "올해 목표에 맞춰 수량 다시 계산 · 11월 말 견적"]
    ]
  };
  function fbBoard(compact) {
    var ys = Object.keys(FBY).sort().reverse(), now = FBNOW[cur] || [];
    function li(L) { return "<ul>" + L.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul>"; }
    var h = '<div class="xmbox xfb2"><div class="xmbh"><b>📒 해마다 피드백 한눈에</b><span>지난 5년 크리스마스 파일을 읽고 쉬운 말로 정리했어요</span></div>';
    // ① 해마다 반복된 것
    h += '<div class="fb2key"><b class="fb2h">🔁 해마다 반복된 것 · 꼭 기억</b><ol>' + FBKEY.map(function (k) { return '<li><span class="fb2ic">' + k[0] + '</span><div><b>' + esc(k[1]) + '</b><small>' + esc(k[2]) + '</small><em>👉 ' + esc(k[3]) + "</em></div></li>"; }).join("") + "</ol></div>";
    // ② 올해 반영
    if (now.length) {
      var G = [["ok", "✅ 했음"], ["part", "◐ 하는 중"], ["todo", "⏳ 아직 — 정해야 함"]];
      h += '<div class="fb2now"><b class="fb2h">➡ ' + (cur - 1) + '년 문제, ' + cur + '년엔 이렇게</b><div class="fb2cols">' + G.map(function (g) {
        var L = now.filter(function (x) { return x[0] === g[0]; }); if (!L.length) return "";
        return '<div class="fb2col ' + g[0] + '"><b class="fb2ct">' + g[1] + ' <i>' + L.length + "</i></b>" + L.map(function (x) { return '<div class="fb2it"><span class="was">' + esc(x[1]) + '</span><span class="now">→ ' + esc(x[2]) + "</span></div>"; }).join("") + "</div>";
      }).join("") + "</div></div>";
    }
    // ③ 해마다 카드
    h += '<b class="fb2h fb2yh">📆 해마다 어땠나</b>' + ys.map(function (y, i) {
      var Y = FBY[y], open = !compact || i < 2;
      return '<details class="fb2y"' + (open ? " open" : "") + '><summary><span class="fb2yr">' + y + '</span><span class="fb2yt">' + esc(Y.t) + '</span><span class="fb2nums">' + Y.n.map(function (n) { return '<span><small>' + esc(n[0]) + "</small><b>" + esc(n[1]) + "</b></span>"; }).join("") + "</span></summary>" +
        '<div class="fb2g3"><div class="fb2c good"><b>👍 잘된 점</b>' + li(Y.g) + '</div><div class="fb2c bad"><b>👎 아쉬운 점</b>' + li(Y.b) + '</div><div class="fb2c next"><b>👉 그래서 다음엔</b>' + li(Y.x) + "</div></div>" +
        (Y.l && Y.l.length ? '<div class="fb2left"><b class="fb2lh">📦 얼마나 남았나 <small>준비한 것 → 남은 것</small></b><table><thead><tr><th>품목</th><th>준비 · 만든 것</th><th>남은 것</th></tr></thead><tbody>' + Y.l.map(function (r) { var tg = ({ over: "남음", ok: "딱 맞음", bad: "버림", none: "기록 없음" })[r[3]]; return '<tr class="lq-' + r[3] + '"><th>' + esc(r[0]) + "</th><td>" + esc(r[1]) + '</td><td><span class="fb2lt">' + tg + "</span> " + (r[2] === tg ? "" : esc(r[2])) + "</td></tr>"; }).join("") + "</tbody></table></div>" : "") +
        (Y.f.length ? '<div class="fb2facts">' + Y.f.map(function (f) { return "<div><b>" + f[0] + "</b><span>" + esc(f[1]) + "</span></div>"; }).join("") + "</div>" : "") + "</details>";
    }).join("") + "</div>";
    return h;
  }
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
    var pv = histRow(py), o = load(cur), per = o.per || PER0, mb0 = matBase(cur), W = mb0.W, M = mb0.M, S2 = mb0.S;
    var need = PERK.map(function (r) { var p = per[r[0]] || PER0[r[0]]; return r[1].split(" ")[0] + " " + Math.ceil((N(p[0]) * W + N(p[1]) * M + N(p[2]) * S2) * 1.1 / r[2]) + r[3]; });
    var pre = (o.plan || {}).pre || {}, preN = Object.keys(pre).reduce(function (a, k) { return a + N(pre[k]); }, 0);
    var sg = sugs(cur).filter(function (x) { return !x.nt && !x.ap && x.it; }).length;
    function card(go, ic, lab, big, sub, off, pr) { return '<button type="button" class="xsc' + (off ? " off" : "") + '"' + (go ? ' data-go="' + go + '"' : "") + '><span class="xsl">' + ic + " " + lab + '</span><b>' + big + "</b>" + (pr != null ? '<i class="xsbar"><u style="width:' + Math.max(0, Math.min(100, Math.round(pr * 100))) + '%"></u></i>' : "") + "<em>" + sub + "</em>" + (go ? '<i class="xsgo">열기 →</i>' : "") + "</button>"; }
    var h = '<div class="xsumcards">' +
      card("", "🎄", "크리스마스까지", n > 0 ? "D-" + n : n === 0 ? "오늘!" : "지남", cur + "-12-25" === t0 ? "메리 크리스마스" : "12/25(" + "일월화수목금토"[new Date(cur, 11, 25).getDay()] + ")") +
      card("goal", "🎯", "크리스마스 케이크 목표", (g.total ? esc(g.total) : "—") + "개", gmd(g.from, "11/11") + "~" + gmd(g.to, "12/25") + (g.peak ? " · 그중 " + gmd(g.pf, "12/21") + "~" + gmd(g.pt, "12/25") + " <b>" + esc(g.peak) + "개</b>" : "") + "<br>예상 매출 " + won(s.money) + " · 생산 계획 " + (ps.whole + ps.mini) + "개", 0, N(g.total) ? (ps.whole + ps.mini) / N(g.total) : null) +
      card("prod", "🍰", "생산 계획 (피크)", ps.peak + " / " + (g.peak ? esc(g.peak) : "—") + "개", "전체 " + (ps.whole + ps.mini) + "개 · 조각 " + ps.slice + "판" + (sg ? " · 💡 제안 " + sg + "개 남음" : ""), N(g.peak) && ps.peak !== N(g.peak), N(g.peak) ? ps.peak / N(g.peak) : null) +
      card("mat", "🧾", "재료 · 부자재", (mt.length ? od + " / " + mt.length : "—"), (mt.length ? "주문함 · 입고 " + ind : "목록 만들기") + "<br>" + need.join(" · "), 0, mt.length ? od / mt.length : null) +
      card("ck", "✅", "할 일", done + " / " + L.length, late.length ? "⚠ 밀린 것 " + late.length + "개" : "밀린 것 없음", late.length, L.length ? done / L.length : null) +
      card("prod", "📈", "12/1~17 예약", preN + "개", (function () { var T = pyH() && (pyH().tables || []).filter(function (t) { return /12\.1/.test(t.t); })[0], lr = T && T.r && T.r[T.r.length - 1]; return lr && !lr[0] && lr[1] ? py + "년 같은 기간 " + esc(lr[1]) + "개 · 매일 적기" : "매일 네이버 예약 개수 적기"; })()) + "</div>";
    h += '<div class="xmbox"><div class="xmbh"><b>' + (late.length ? "⚠ 밀린 것 · " : "") + '다음에 할 것</b><span>누르면 체크 · 💬 = 작년 같은 날 메모 · 전체는 ✅ 할 일 · 달력</span></div>' +
      late.concat(next).map(function (x) { var st = stat(x); return '<div class="xtr ' + st.c + (x.m ? " must" : "") + '" data-id="' + x.id + '"><button type="button" class="xcb" aria-pressed="' + !!x.done + '" aria-label="완료"></button><span class="xtt"><b>' + mdw(x.d) + "</b> " + esc(x.t) + (x.w ? " <i>· 담당 " + esc(x.w) + "</i>" : "") + dayCmHtml(x.d) + '</span><span class="xcs">' + (x.m ? '<em class="xmust">꼭</em>' : "") + esc(st.s) + "</span></div>"; }).join("") + "</div>";
    h += fbBoard(1);
    var FG = fbGroups(), fb = FB[py] || {};
    if (FG.length) {
      h += '<details class="xmbox xfb xfbfold"><summary class="xmbh"><b>📒 ' + py + '년 주석 원문 · 묶음별 (제안)</b><span>' + py + '년 크리스마스 파일 칸 주석 ' + (pyH().cm || []).length + '개를 묶음별로 · 초록 (제안) = 올해 해 볼 것 · 눌러서 펼치기</span></summary>' +
        (pv.line ? '<p class="xfbline"><b>' + py + "년 한 줄</b> " + esc(pv.line) + "</p>" : "") +
        '<div class="xfbg">' + FG.map(function (G) {
          return '<div class="xfbc"><div class="xfbh"><b>' + G.t + '</b><button type="button" class="xglink" data-go="' + G.go + '">열기 →</button></div>' + (fb[G.k] ? '<p class="xfba">' + esc(fb[G.k]) + "</p>" : "") + '<details class="xfbd"><summary>' + (cur - 1) + "년 주석 원문 " + G.L.length + "개 보기</summary><ul>" + G.L.map(function (c) { var lab = /합계/.test(c.row) || (isHead(c) && /합계/.test(c.h)) ? "합계" : /^\[/.test(c.row) ? "전체" : isHead(c) ? md2(c.h) : (md2(c.h) + " " + c.row.replace(/한케$/, "")); if (/매장 판매/.test(c.tb)) lab = md2(c.s) + " 매장"; if (/대표 재료/.test(c.tb)) lab = c.row; return "<li><em>" + esc(lab) + (/계획안/.test(c.s) ? " (계획)" : "") + "</em> " + cmTxt(c) + "</li>"; }).join("") + "</ul></details></div>";
        }).join("") + "</div></details>";
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
  // ── 📊 지난 해 — 인포그래픽 (10/30 사장님 「모션그래픽 · 인포그래픽으로 · 한눈에」) · 색: 홀 #C2412D · 미니 #4A63C9 (색약 점검 통과) · 숫자는 늘 글자로 같이
  var HANIM = 0;
  function lastNum(v) { var m = String(v || "").replace(/,/g, "").match(/\d+/g); return m ? +m[m.length - 1] : 0; }
  function heat(t) { var a = [251, 228, 222], b = [142, 27, 20]; return "rgb(" + a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); }).join(",") + ")"; }
  function drawHist(el) {
    var H = HIST(), ys = Object.keys(H).sort();
    if (!ys.length) { el.innerHTML = '<p class="xmempty">지난 해 기록을 불러오는 중입니다…</p>'; return; }
    var anim = Date.now() - HANIM > 15000; HANIM = Date.now();
    var g = goalOf(cur), ps = prodSums(cur), gt = N(g.total);
    // ① 해마다 크리스마스 케이크 (홀 + 미니) · 목표 선 · 올해는 계획(빗금) + 목표
    var C = ys.map(function (y) { var s = H[y].sum || {}; return { y: y, w: N(s.whole), m: N(s.mini), goal: lastNum(s.goal), res: N(H[y].resTotal), money: N(s.money), cost: N(s.cost), now: 0 }; });
    if (!H[cur]) C.push({ y: String(cur), w: ps.whole, m: ps.mini, goal: gt, res: 0, now: 1 });
    var mx = Math.max.apply(null, C.map(function (c) { return Math.max(c.w + c.m, c.goal); }).concat([10])); mx = Math.ceil(mx / 50) * 50;
    var first = C[0], lastR = C.filter(function (c) { return !c.now; }).slice(-1)[0], totRes = C.reduce(function (a, c) { return a + c.res; }, 0);
    var peakD = null; ys.forEach(function (y) { Object.keys(H[y].res || {}).forEach(function (d) { var n = H[y].res[d].n; if (!peakD || n > peakD.n) peakD = { d: d, n: n }; }); });
    function tile(lab, num, unit, sub, cls) { return '<div class="xgk' + (cls ? " " + cls : "") + '"><span>' + lab + '</span><b><em data-cnt="' + num + '">' + (anim ? 0 : num.toLocaleString("ko-KR")) + "</em>" + unit + "</b><small>" + sub + "</small></div>"; }
    var h = '<div class="xig' + (anim ? " anim" : "") + '">' +
      '<div class="xighero"><div class="xigt"><b>🎄 카페스이 크리스마스 ' + ys[0] + '~' + lastR.y + '</b><span>사장님 크리스마스 파일에서 개수만 모음 · 손님 이름 · 연락처는 넣지 않음</span></div><div class="xgks">' +
      tile("5년 동안 예약 명단", totRes, "건", ys[0] + "~" + lastR.y + " 합", "") +
      tile(lastR.y + "년 크리스마스 케이크", lastR.w + lastR.m, "개", "홀 " + lastR.w + " · 미니 " + lastR.m, "hl") +
      tile("예약 " + first.y + " → " + lastR.y, lastR.res, "건", first.res + "건에서 " + (first.res ? "×" + (lastR.res / first.res).toFixed(1) : ""), "") +
      (peakD ? tile("가장 바빴던 날", peakD.n, "건", mdw(peakD.d) + " · " + peakD.d.slice(0, 4), "") : "") +
      (lastR.money ? tile(lastR.y + " 예상 매출", Math.round(lastR.money / 10000), "만 원", (lastR.cost ? "재료 · 부자재 " + Math.round(lastR.cost / 10000) + "만 원" : ""), "") : "") + "</div></div>";
    // 차트 ① — 막대마다 센 기간 · 목표 기간 (11/16 사장님 「총 날짜랑 목표 날짜도 알려줘야지」)
    var PD = { 2021: "12/21~25 예약", 2022: "12/22~24 예약", 2023: "12/18~25", 2024: "12/18~25", 2025: "12/18~25" }, GPD = { 2023: "12/18~25", 2024: "12/18~25", 2025: "12/18~25" };
    var pdNow = (function () { var P = load(cur).prod || {}, ds = []; rows(g.it).forEach(function (x) { if (x.k === "조각") return; var r = P[x._id] || {}; Object.keys(r).forEach(function (d) { if (N(r[d] && r[d].p) > 0) ds.push(d); }); }); ds.sort(); return ds.length ? rg2(md2s(ds[0]), md2s(ds[ds.length - 1])) : ""; })();
    function rg2(a, b) { var A = a.split("/"), B = b.split("/"); return a === b ? a : A[0] === B[0] ? a + "~" + B[1] : a + "~" + b; }
    function md2s(d) { return (+d.slice(5, 7)) + "/" + (+d.slice(8)); }
    var gpNow = rg2(gmd(g.from, "11/11"), gmd(g.to, "12/25"));
    h += '<div class="xigcard"><div class="xigh"><b>📈 해마다 크리스마스 케이크 (홀 + 미니)</b><span class="xlg"><i class="sw w"></i>홀 · 중간 <i class="sw m"></i>미니 <i class="sw g"></i>목표 (지난 해는 홀 목표) <i class="sw p"></i>' + cur + ' 계획</span></div><div class="xgcols" role="img" aria-label="해마다 크리스마스 케이크 개수">' +
      C.map(function (c, i) {
        var tot = c.w + c.m, tip = c.y + "년 · 홀 " + c.w + " · 미니 " + c.m + " = " + tot + "개" + (c.goal ? " · 목표 " + c.goal : "") + (c.res ? " · 예약 명단 " + c.res + "건" : "") + (c.now ? " (올해 생산 계획 칸 합)" : "");
        return '<div class="xgcol' + (c.now ? " now" : "") + '" style="--i:' + i + '" data-tip="' + ea2(tip) + '" tabindex="0"><div class="xgbar"><b class="xgtot" style="bottom:calc(' + (tot / mx * 100) + '% + 2px)">' + (tot || (c.now ? "계획 0" : "—")) + "</b>" +
          (c.goal ? '<s class="xggoal' + (c.goal < tot && tot - c.goal < mx * 0.12 ? " lo" : "") + '" style="bottom:' + (c.goal / mx * 100) + '%"><em>' + (c.now ? "목표 " : "홀 목표 ") + c.goal + '<small>' + (c.now ? gpNow : (GPD[c.y] || "")) + "</small></em></s>" : "") +
          '<i class="m" style="height:' + (c.m / mx * 100) + '%">' + (c.m >= mx * 0.08 ? "<u>" + c.m + "</u>" : "") + '</i><i class="w" style="height:' + (c.w / mx * 100) + '%">' + (c.w >= mx * 0.08 ? "<u>" + c.w + "</u>" : "") + "</i></div><span>" + c.y + (c.now ? "<small>계획</small>" : "") + '<small class="xgper">' + (c.now ? (pdNow || "날짜 칸 없음") : (PD[c.y] || "")) + "</small></span></div>";
      }).join("") + '</div><p class="xgnote">' + (function () { var a = C.filter(function (c) { return c.goal && !c.now; }); return a.length ? "지난 해 목표는 홀 기준 — 홀 실제 / 목표: " + a.map(function (c) { return c.y + " " + c.w + "/" + c.goal + " (" + Math.round(c.w / c.goal * 100) + "%)"; }).join(" · ") : ""; })() + (gt ? " · <b>" + cur + " 목표 " + gt + "개 → 지금 계획 " + (ps.whole + ps.mini) + "개</b>" : "") + "</p>" +
      '<p class="xgper2">📅 <b>막대 아래 날짜 = 센 기간</b> · 2021 · 2022는 예약 명단만, 2023~2025는 크리스마스 주간(12/18~25) 실제 만든 수' + (gt ? '<br>⚠ <b>' + cur + ' 목표 ' + gt + '개는 ' + gpNow + ' 전체 기간</b>인데, 막대(계획 ' + (ps.whole + ps.mini) + '개)는 <b>' + (pdNow || "날짜별 생산 칸") + '</b> 날짜별 생산 계획만 — 그 앞(' + gmd(g.from, "11/11") + '~12/17)에 팔 몫은 아직 날짜 칸이 없어요' + (N(g.peak) ? ' · 그중 피크 ' + gmd(g.pf, "12/21") + '~' + gmd(g.pt, "12/25") + ' 목표 ' + esc(g.peak) + '개 → 계획 ' + ps.peak + '개' : "") : "") + "</p></div>";
    // 차트 ② 예약 몰리는 날 (해 × 날짜)
    var dk = {}; ys.forEach(function (y) { Object.keys(H[y].res || {}).forEach(function (d) { dk[d.slice(5)] = 1; }); }); var DK = Object.keys(dk).sort(), hmx = 1;
    ys.forEach(function (y) { Object.keys(H[y].res || {}).forEach(function (d) { hmx = Math.max(hmx, H[y].res[d].n); }); });
    h += '<div class="xigcard"><div class="xigh"><b>🔥 예약이 몰리는 날</b><span>칸 숫자 = 그 날 픽업 예약 건수 · 진할수록 많음</span></div><div class="xgheat" style="--c:' + DK.length + '"><span></span>' + DK.map(function (k) { return "<span class=\"hd\">" + (+k.slice(0, 2)) + "/" + (+k.slice(3)) + "</span>"; }).join("") +
      ys.filter(function (y) { return H[y].res && Object.keys(H[y].res).length; }).map(function (y, r) { var tot = 0; Object.keys(H[y].res).forEach(function (d) { tot += H[y].res[d].n; }); return '<span class="hy">' + y + "<small>" + tot + "건</small></span>" + DK.map(function (k, i) { var c = H[y].res[y + "-" + k], n = c ? c.n : 0, t = n / hmx; return '<i style="--i:' + (r * DK.length + i) + ";background:" + (n ? heat(0.12 + t * 0.88) : "#F4EFE6") + ";color:" + (t > 0.45 ? "#fff" : "#3A2E22") + '" data-tip="' + ea2(y + " " + mdw(y + "-" + k) + " · 예약 " + n + "건" + (tot ? " (" + Math.round(n / tot * 100) + "%)" : "")) + '" tabindex="0">' + (n || "") + "</i>"; }).join(""); }).join("") + '</div><p class="xgnote">' + (function () { var sh = ys.filter(function (y) { return H[y].res && (H[y].res[y + "-12-24"] || H[y].res[y + "-12-25"]); }).map(function (y) { var t = 0, p = 0; Object.keys(H[y].res).forEach(function (d) { t += H[y].res[d].n; if (/-12-2[45]$/.test(d)) p += H[y].res[d].n; }); return y + " " + Math.round(p / t * 100) + "%"; }); return sh.length ? "24 · 25일에 몰린 비율: " + sh.join(" · ") + " → 23일 이전 픽업을 늘리면 피크가 덜 막혀요 (제안)" : ""; })() + "</p></div>";
    // 차트 ③ 픽업 시간대 (가장 최근 해) + ④ 품목 · 결제
    var sy = ys.slice().reverse().filter(function (y) { return Object.keys(H[y].res || {}).some(function (d) { return H[y].res[d].slots; }); })[0];
    if (sy) {
      var sl = {}, it = {}, pay = {}; Object.keys(H[sy].res).forEach(function (d) { var r = H[sy].res[d]; Object.keys(r.slots || {}).forEach(function (s) { if (/^\d/.test(s)) sl[s] = (sl[s] || 0) + r.slots[s]; }); Object.keys(r.items || {}).forEach(function (s) { it[s] = (it[s] || 0) + r.items[s]; }); Object.keys(r.pay || {}).forEach(function (s) { pay[s] = (pay[s] || 0) + r.pay[s]; }); });
      var SK = Object.keys(sl).sort(), smx = Math.max.apply(null, SK.map(function (k) { return sl[k]; }).concat([1])), top = SK.slice().sort(function (a, b) { return sl[b] - sl[a]; }).slice(0, 3);
      h += '<div class="xigrow"><div class="xigcard"><div class="xigh"><b>⏰ ' + sy + ' 픽업 시간대</b><span>모든 날 합 · 진한 막대 = 가장 많은 3개 (' + top.join(" · ") + ")</span></div><div class=\"xgslot\">" + SK.map(function (k, i) { var t = top.indexOf(k) >= 0; return '<div class="xgs' + (t ? " top" : "") + '" style="--i:' + i + '" data-tip="' + ea2(sy + " · " + k + " 픽업 " + sl[k] + "건") + '" tabindex="0"><b>' + (t ? sl[k] : "") + '</b><i style="height:' + Math.max(3, sl[k] / smx * 100) + '%"></i><span>' + (/:00$/.test(k) ? (+k.slice(0, 2)) + "시" : "") + "</span></div>"; }).join("") + '</div><p class="xgnote">오후 ' + (function () { var pm = 0, all = 0; SK.forEach(function (k) { all += sl[k]; if (+k.slice(0, 2) >= 17) pm += sl[k]; }); return "5시 이후가 " + Math.round(pm / all * 100) + "% → 저녁 픽업 줄 · 포장 미리 준비 (제안)"; })() + "</p></div>";
      function stack(obj, tt) { var K = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }), t = K.reduce(function (a, k) { return a + obj[k]; }, 0), CL = ["#C2412D", "#4A63C9", "#26875A", "#8F5A22", "#7A6A58"]; if (!t) return ""; var K2 = K.slice(0, 4), etc = K.slice(4).reduce(function (a, k) { return a + obj[k]; }, 0); if (etc) { K2.push("그 밖"); obj = Object.assign({}, obj, { "그 밖": etc }); }
        return '<h5>' + tt + ' <small>' + t + '건</small></h5><div class="xgstack">' + K2.map(function (k, i) { return '<i style="--i:' + i + ";width:" + (obj[k] / t * 100) + "%;background:" + CL[i] + '" data-tip="' + ea2(k + " " + obj[k] + "건 (" + Math.round(obj[k] / t * 100) + "%)") + '" tabindex="0"></i>'; }).join("") + '</div><div class="xgstl">' + K2.map(function (k, i) { return '<span><i class="sw" style="background:' + CL[i] + '"></i>' + esc(k) + " <b>" + Math.round(obj[k] / t * 100) + "%</b></span>"; }).join("") + "</div>"; }
      h += '<div class="xigcard"><div class="xigh"><b>🧁 ' + sy + ' 무엇을 · 어떻게 예약했나</b><span>예약 명단 기준</span></div>' + stack(it, "품목") + stack(pay, "예약 · 결제 경로") + "</div></div>";
    }
    // ⑤ 해마다 배운 것 (타임라인)
    h += fbBoard(0);
    h += '<details class="xmbox xmdet"><summary>📋 표로 보기 · 해마다 비교</summary>' + compareTable() + "</details>";
    h += '<details class="xmbox xmdet"><summary>🔎 해마다 자세히 (날짜 · 시간 · 품목 · 파일 표)</summary>' + histDetails(H) + "</details></div>";
    el.innerHTML = h;
    if (anim && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) Array.prototype.forEach.call(el.querySelectorAll("[data-cnt]"), function (e) { var to = +e.dataset.cnt, t0 = performance.now(); (function step(t) { var k = Math.min(1, (t - t0) / 1100), v = Math.round(to * (1 - Math.pow(1 - k, 3))); e.textContent = v.toLocaleString("ko-KR"); if (k < 1) requestAnimationFrame(step); })(t0); });
    else Array.prototype.forEach.call(el.querySelectorAll("[data-cnt]"), function (e) { e.textContent = (+e.dataset.cnt).toLocaleString("ko-KR"); });
  }
  (function () {   // 막대 위에 손가락 · 마우스 → 숫자 말풍선
    var tip = document.createElement("div"); tip.className = "xgtip"; tip.hidden = true; document.body.appendChild(tip);
    function show(e) { var t = e.target.closest && e.target.closest("#xmasSec [data-tip]"); if (!t) { tip.hidden = true; return; } tip.textContent = t.dataset.tip; tip.hidden = false; var r = t.getBoundingClientRect(), w = tip.offsetWidth; tip.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + "px"; tip.style.top = Math.max(8, r.top - tip.offsetHeight - 8) + "px"; }
    document.addEventListener("mouseover", show); document.addEventListener("focusin", show); document.addEventListener("click", show);
    window.addEventListener("scroll", function () { tip.hidden = true; }, { passive: true });
  })();
  function histDetails(H) {
    var ys = Object.keys(H).sort().reverse(), h = "";
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
    return h;
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
