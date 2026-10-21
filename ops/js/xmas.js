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
    drawYears(); drawAuto(); drawPane(); drawTodo();
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
        '<span class="xcs">' + (x.m ? '<em class="xmust">꼭</em>' : "") + esc(s.s) + '</span><button type="button" class="xcx" title="목록에서 빼기" aria-label="빼기">✕</button></div>';
    }).join("") + '<button type="button" class="skbtn xmckadd" id="xmCkAdd">＋ 할 일 추가</button>';
    Array.prototype.forEach.call(ckEl.querySelectorAll(".xct"), grow2);
  }
  var ckPend = false;
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
  function showTab(k) {
    TAB = k; try { localStorage.setItem("cafesui.ui.xmtab", k); } catch (e) {}
    Array.prototype.forEach.call(nav.querySelectorAll(".xmn"), function (b) { b.setAttribute("aria-selected", String(b.dataset.x === k)); });
    panes.forEach(function (p) { p.hidden = p.dataset.x !== k; });
    drawPane(); if (k === "meet") setTimeout(function () { ins.forEach(grow); }, 0);
    setTimeout(regrow, 0);
  }
  // 숨겨진 채 그려진 칸은 높이를 못 재서 글이 잘림 — 보일 때 다시 맞춘다(10/21 재료 이름 · 메모 잘림)
  function regrow() { Array.prototype.forEach.call(sec.querySelectorAll("#xmMat textarea, #xmCk textarea.xct"), function (t) { if (t.offsetParent) grow2(t); }); }
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp18"], .mbt[data-p="tp18"]')) setTimeout(regrow, 60); });
  window.addEventListener("resize", function () { clearTimeout(regrow.t); regrow.t = setTimeout(regrow, 200); });
  // 품목 이름 칸은 한 줄 글 — 엔터는 줄바꿈 대신 칸 나가기(저장)
  sec.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList && e.target.classList.contains("xmn2")) { e.preventDefault(); e.target.blur(); } });
  nav.addEventListener("click", function (e) { var b = e.target.closest(".xmn"); if (b) showTab(b.dataset.x); });
  function paneEl(k) { return document.getElementById({ sum: "xmSum", cal: "xmCal", goal: "xmGoal", mat: "xmMat", prod: "xmProd", hist: "xmHist", rep: "xmRep" }[k]); }
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
    if (k === "ck") { drawCk(); return; }
    if (!el) return;
    if (busy(el) && !(force === true && !document.activeElement.isContentEditable)) { pend[k] = 1; return; }
    pend[k] = 0;
    var fk = focusKey(el), sy = window.pageYOffset;
    ({ sum: drawSum, cal: drawCal, goal: drawGoal, mat: drawMat, prod: drawProd, hist: drawHist, rep: drawRep }[k] || function () {})(el);
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
    var s = { whole: 0, mini: 0, slice: 0, money: 0, byK: {} };
    rows(g.it).forEach(function (x) { var t = N(x.t); s.byK[x.k] = (s.byK[x.k] || 0) + t; s.money += t * N(x.p); if (x.k === "홀" || x.k === "중간") s.whole += t; else if (x.k === "미니") s.mini += t; else if (x.k === "조각") s.slice += t; });
    return s;
  }
  function histRow(y) { var h = HIST()[y] || {}, s = h.sum || {}; return s; }
  function drawGoal(el) {
    var g = goalOf(cur), s = goalSum(g), tot = N(g.total), cakes = s.whole + s.mini;
    var h = '<div class="xmbox"><div class="xmbh"><b>🎯 ' + cur + ' 전사 목표</b><span>전사 목표 개수와 품목별 목표 · 단가를 정하면 예상 매출과 대표 재료가 자동으로 계산됩니다</span></div>' +
      '<div class="xmgoaltop"><label>전사 목표 (홀 · 중간 · 미니 합)<input type="text" inputmode="numeric" class="xg" data-g="total" value="' + ea2(g.total) + '" placeholder="예: 180"></label>' +
      '<div class="xmkpi"><span>품목 목표 합</span><b>' + cakes + '개</b><em class="' + (tot && cakes !== tot ? "off" : "") + '">' + (tot ? (cakes === tot ? "✔ 전사 목표와 같음" : (cakes > tot ? "+" : "") + (cakes - tot) + "개 차이") : "전사 목표를 적어 주세요") + '</em></div>' +
      '<div class="xmkpi"><span>조각</span><b>' + s.slice + '개</b></div><div class="xmkpi"><span>예상 매출</span><b>' + won(s.money) + '</b></div></div>' +
      '<div class="xmtw"><table class="xmt goalt"><thead><tr><th>종류</th><th>품목</th><th>단가(원)</th><th>목표 개수</th><th>예상 매출</th><th></th></tr></thead><tbody>' +
      rows(g.it).map(function (x) {
        return '<tr data-id="' + x._id + '"><td data-l="종류"><select class="xgi" data-f="k">' + KINDS.map(function (k) { return "<option" + (k === x.k ? " selected" : "") + ">" + k + "</option>"; }).join("") + '</select></td>' +
          '<td data-l="품목" class="gn"><input type="text" class="xgi" data-f="n" value="' + ea2(x.n) + '"></td><td data-l="단가(원)"><input type="text" inputmode="numeric" class="xgi num money" data-f="p" value="' + ea2(money(x.p)) + '"></td>' +
          '<td data-l="목표 개수"><input type="text" inputmode="numeric" class="xgi num" data-f="t" value="' + ea2(x.t) + '"></td><td data-l="예상 매출" class="num">' + won(N(x.p) * N(x.t)) + '</td><td class="gx"><button type="button" class="xcx" data-a="gdel" aria-label="빼기">✕</button></td></tr>';
      }).join("") + '</tbody><tfoot><tr><th colspan="3">합계</th><th class="num">' + (cakes + s.slice) + '</th><th class="num">' + won(s.money) + '</th><th></th></tr></tfoot></table></div>' +
      '<button type="button" class="skbtn" data-a="gadd">＋ 품목 추가</button>' +
      '<label class="xmnote">메모 (배분 · 가격 근거 · 예시 계산)<textarea class="xg" data-g="note" rows="2">' + esc(g.note || "") + '</textarea></label></div>';
    // 대표 재료 계산 (생크림 · 휘핑 · 딸기) — 1개당 g 은 고칠 수 있음 (기본값 = 25년 실제 계획안)
    var per = load(cur).per || PER0, sliceN = load(cur).slicePan;
    h += '<div class="xmbox"><div class="xmbh"><b>🥛 대표 재료 계산</b><span>목표 개수 × 1개당 양 → 필요한 통 · 팩 수 (25년 계획안 기준 · 숫자는 눌러서 고침 · 넉넉히 +10% 권장)</span></div>' +
      '<div class="xmtw"><table class="xmt per"><thead><tr><th>재료 (1통 · 1팩)</th><th>홀 1개당 g</th><th>미니 1개당 g</th><th>조각 1판당 g</th><th>필요 g</th><th>필요 개수</th></tr></thead><tbody>' +
      PERK.map(function (r) {
        var p = per[r[0]] || PER0[r[0]], need = N(p[0]) * s.whole + N(p[1]) * s.mini + N(p[2]) * N(sliceN);
        return '<tr data-r="' + r[0] + '"><th>' + r[1] + '</th>' + [0, 1, 2].map(function (i) { return '<td><input type="text" inputmode="numeric" class="xper num" data-i="' + i + '" value="' + ea2(p[i]) + '"></td>'; }).join("") +
          '<td class="num">' + Math.round(need).toLocaleString("ko-KR") + 'g</td><td class="num"><b>' + Math.ceil(need / r[2]) + r[3] + '</b> <small>(+10% ' + Math.ceil(need * 1.1 / r[2]) + ')</small></td></tr>';
      }).join("") + '</tbody></table></div><label class="xmnote xmshort">조각케이크 판 수 (목표)<input type="text" inputmode="numeric" class="xslice" value="' + ea2(sliceN || "") + '" placeholder="25년 실제 134판"></label></div>';
    // 지난 해 비교
    h += '<div class="xmbox"><div class="xmbh"><b>📊 지난 해와 비교</b><span>사장님 크리스마스 파일(2021~2025)에서 모은 숫자</span></div>' + compareTable() + '</div>';
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
      if (t2.classList.contains("xg")) { var f = t2.dataset.g, v = t2.value; goalEdit(cur, function (g) { g[f] = v; }); }
      else if (t2.classList.contains("xgi")) { var id = tr.dataset.id, ff = t2.dataset.f, vv = t2.classList.contains("money") ? moneyRaw(t2.value) : t2.value.trim(); goalEdit(cur, function (g) { if (g.it[id]) g.it[id][ff] = vv; }); }
      else if (t2.classList.contains("xper")) { var r = tr.dataset.r, i = +t2.dataset.i, v3 = t2.value.trim(); xsave(cur, function (o) { o.per = o.per || JSON.parse(JSON.stringify(PER0)); o.per[r] = o.per[r] || PER0[r].slice(); o.per[r][i] = v3; }); }
      else if (t2.classList.contains("xslice")) { var v4 = t2.value.trim(); xsave(cur, function (o) { o.slicePan = v4; }); }
      else return;
      setTimeout(function () { drawPane(true); }, 0);
    });
    el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "gadd") { var k = nid("g"); goalEdit(cur, function (g) { g.it[k] = { k: "조각", n: "", p: "", t: "", o: Object.keys(g.it).length }; }); drawPane(); var inp = el.querySelector('tr[data-id="' + k + '"] [data-f="n"]'); if (inp) inp.focus(); }
      if (b.dataset.a === "gdel") { var id = b.closest("tr").dataset.id; if (!confirm("이 품목을 목표에서 뺄까요?")) return; goalEdit(cur, function (g) { if (g.it[id]) g.it[id].del = me() || "1"; }); drawPane(); }
    });
  }
  goalEvents(document.getElementById("xmGoal"));

  // ── 🧾 재료 · 부자재 — o.mat = { id:{ k(분류), n(품목), q(수량), s(주문처), c(금액), m(메모), pq · pc(작년), od · ind({by,at}: 주문함 · 입고), o, del } }
  var MK = ["포장", "데코", "재료", "크림 · 과일", "기타"];
  function matEdit(y, fn) { xsave(y, function (o) { o.mat = o.mat || {}; fn(o.mat); }); }
  function prevMat(y) {   // 작년 목록: 그 해 데이터에 있으면 그것, 없으면 지난 해 기록(파일)의 재료 리스트
    var pm = load(y - 1).mat; if (pm && Object.keys(pm).length) return rows(pm).map(function (x) { return { k: x.k, n: x.n, s: x.s, m: x.m, pq: x.q, pc: x.c }; });
    var h = HIST()[y - 1]; return h && h.mat ? h.mat : [];
  }
  function drawMat(el) {
    var L = rows(load(cur).mat), cost = 0, od = 0, ind = 0, pcost = 0;
    L.forEach(function (x) { cost += N(x.c); pcost += N(x.pc); if (x.od) od++; if (x.ind) ind++; });
    var h = '<div class="xmbox"><div class="xmbh"><b>🧾 ' + cur + ' 재료 · 부자재 준비</b><span>품목마다 수량 · 주문처 · 금액 · 메모를 적고, 주문하면 「주문함」, 들어오면 「입고」를 누르세요 · 흐린 글씨는 작년 숫자</span></div>' +
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
  function drawProd(el) {
    var g = goalOf(cur), it = rows(g.it), D = daysOf(cur), P = load(cur).prod || {};
    var h = '<div class="xmbox"><div class="xmbh"><b>🍰 ' + cur + ' 날짜별 생산 계획 · 실제</b><span>윗칸 = 계획 · 아랫칸 = 실제 (끝나고 꼭 적기 — 내년 「작년 생산량 비교」의 기준) · 품목은 🎯 전사 목표에서</span></div>' +
      '<label class="xmnote xmshort">생산 날짜 (쉼표로 · 예: 12/18, 12/19 …)<input type="text" class="xdays" value="' + ea2(D.map(function (s) { return (+s.slice(5, 7)) + "/" + (+s.slice(8)); }).join(", ")) + '"></label>' +
      '<div class="xmtw"><table class="xmt prod"><thead><tr><th>품목</th>' + D.map(function (s) { return "<th>" + mdw(s) + "</th>"; }).join("") + '<th>합계</th></tr></thead><tbody>';
    var colP = D.map(function () { return 0; }), colA = D.map(function () { return 0; });
    it.forEach(function (x) {
      var r = P[x._id] || {}, sp = 0, sa = 0;
      h += '<tr data-id="' + x._id + '"><th>' + esc(x.n || "(이름 없음)") + ' <small>' + esc(x.k) + "</small></th>" + D.map(function (s, i) {
        var c = r[s] || {}; sp += N(c.p); sa += N(c.a); colP[i] += N(c.p); colA[i] += N(c.a);
        return '<td><input type="text" inputmode="numeric" class="xpc" data-d="' + s + '" data-f="p" value="' + ea2(c.p) + '" aria-label="계획"><input type="text" inputmode="numeric" class="xpc a" data-d="' + s + '" data-f="a" value="' + ea2(c.a) + '" aria-label="실제"></td>';
      }).join("") + '<td class="num"><b>' + sp + '</b><br><span class="a">' + sa + "</span></td></tr>";
    });
    h += '</tbody><tfoot><tr><th>합계 <small>계획 / 실제</small></th>' + D.map(function (s, i) { return '<td class="num"><b>' + colP[i] + '</b><br><span class="a">' + colA[i] + "</span></td>"; }).join("") +
      '<td class="num"><b>' + colP.reduce(function (a, b) { return a + b; }, 0) + '</b><br><span class="a">' + colA.reduce(function (a, b) { return a + b; }, 0) + "</span></td></tr></tfoot></table></div></div>";
    var pv = HIST()[cur - 1];
    if (pv && pv.tables) {
      var T = pv.tables.filter(function (x) { return /실제 작업량/.test(x.s) && /홀케이크|미니케이크|조각케이크 생산 수량\(전날|조각케이크 생산 수량$/.test(x.t); });
      if (T.length) h += '<details class="xmbox xmdet"><summary>📊 ' + (cur - 1) + '년 실제 작업량 (참고)</summary>' + T.map(tableHtml).join("") + "</details>";
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
  })(document.getElementById("xmProd"));

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
  function drawSum(el) {
    var L = ckItems(cur), t0 = today(), n = dd(cur + "-12-25", t0), done = L.filter(function (x) { return x.done; }).length;
    var late = L.filter(function (x) { return !x.done && x.d && x.d < t0; }), next = L.filter(function (x) { return !x.done && x.d >= t0; }).slice(0, 5);
    var g = goalOf(cur), s = goalSum(g), mt = rows(load(cur).mat), od = mt.filter(function (x) { return x.od; }).length, ind = mt.filter(function (x) { return x.ind; }).length;
    var pv = histRow(cur - 1);
    var h = '<div class="xmsumg">' +
      '<div class="xmkpi big"><span>크리스마스까지</span><b>' + (n > 0 ? "D-" + n : n === 0 ? "오늘!" : "지남") + '</b></div>' +
      '<div class="xmkpi big"><span>체크리스트</span><b>' + done + " / " + L.length + '</b><em class="' + (late.length ? "off" : "") + '">' + (late.length ? "⚠ 밀린 것 " + late.length + "개" : "밀린 것 없음") + '</em></div>' +
      '<div class="xmkpi big"><span>전사 목표</span><b>' + (g.total ? esc(g.total) + "개" : "—") + '</b><em>' + (s.whole + s.mini ? "품목 합 " + (s.whole + s.mini) + "개 · 예상 " + won(s.money) : "🎯 전사 목표에서 정하기") + '</em></div>' +
      '<div class="xmkpi big"><span>재료 · 부자재</span><b>' + (mt.length ? od + " / " + mt.length : "—") + '</b><em>' + (mt.length ? "주문함 · 입고 " + ind : "🧾 재료에서 목록 만들기") + "</em></div>" +
      (pv.whole ? '<div class="xmkpi big"><span>' + (cur - 1) + ' 실제</span><b>홀 ' + esc(pv.whole) + '</b><em>미니 ' + esc(pv.mini || "—") + " · 조각 " + esc(pv.slice || "—") + "</em></div>" : "") + "</div>";
    h += '<div class="xmbox"><div class="xmbh"><b>' + (late.length ? "⚠ 밀린 것 · " : "") + '다음에 할 것</b><span>누르면 체크 · 전체는 ✅ 체크리스트 / 🗓 준비 캘린더</span></div>' +
      late.concat(next).map(function (x) { var st = stat(x); return '<div class="xtr ' + st.c + (x.m ? " must" : "") + '" data-id="' + x.id + '"><button type="button" class="xcb" aria-pressed="' + !!x.done + '" aria-label="완료"></button><span class="xtt"><b>' + mdw(x.d) + "</b> " + esc(x.t) + (x.w ? " <i>· 담당 " + esc(x.w) + "</i>" : "") + '</span><span class="xcs">' + (x.m ? '<em class="xmust">꼭</em>' : "") + esc(st.s) + "</span></div>"; }).join("") + "</div>";
    var f = load(cur).f || {};
    if (f.x1) h += '<div class="xmbox"><div class="xmbh"><b>한눈에 결론</b><span>📝 회의 · 결론에서 고침</span></div><div class="xmpre">' + esc(f.x1) + "</div></div>";
    el.innerHTML = h;
  }
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
      goal: '<p>전사 목표 <b>' + esc(g.total || "—") + '개</b> · 품목 목표 합 ' + (s.whole + s.mini) + "개 (조각 " + s.slice + "개) · 예상 매출 <b>" + won(s.money) + "</b></p>" +
        '<table class="xmt"><thead><tr><th>종류</th><th>품목</th><th>단가</th><th>목표</th><th>예상 매출</th></tr></thead><tbody>' + rows(g.it).map(function (x) { return "<tr><td>" + esc(x.k) + "</td><td>" + esc(x.n) + '</td><td class="num">' + won(x.p) + '</td><td class="num">' + esc(x.t || "—") + '</td><td class="num">' + won(N(x.p) * N(x.t)) + "</td></tr>"; }).join("") + "</tbody></table>" + (g.note ? pre(g.note) : ""),
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
    if (ks.some(function (k) { return k.indexOf(PRE) === 0 || k.indexOf("cafesui.log.") === 0 || k === "cafesui.daynotes"; })) render();   // cafesui.xmas.hist 도 PRE 로 잡힘
  });
  // 탭이 숨어 있을 때 그리면 칸 높이를 못 잰다 → 화면에 보일 때 다시 늘린다
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) ins.forEach(grow); }).observe(sec);
  window.addEventListener("resize", function () { ins.forEach(grow); });
  setInterval(function () { drawTodo(); drawPane(); }, 10 * 60 * 1000);
  showTab(TAB);
  render();
})();
