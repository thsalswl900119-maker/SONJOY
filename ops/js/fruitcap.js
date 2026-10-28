// 💰 과일 주문 한도선 (10/28 · 사장님 「과일 시즌 부분에 과일 주문 한도선 · 과일별 기준 g · 최저가 · 최고가」)
// 재고·발주 「🍓 과일 시즌」(#sk2) 아래 표 + 발주 화면 과일 칸 아래 한 줄(#skCapNow).
// 저장: cafesui.fruitcap = { it: { id: { n, u, use, mo, lo, hi, cap, m, o, del, ed, rec: { rid: { d, p, who, at } } } } }
//  · 처음 값(CAP0)은 크리스마스 재료 파일(2024 · 2025) · 발주 기준표 · 사장님 기준에서 찾은 것만 — 모르는 값은 비워 둠
//  · 고치기는 사장님 · 정항아님만, 「＋ 이번 값 적기」는 누구나(값이 쌓이면 최저 · 최고가 저절로 넓어짐)
(function () {
  var KEY = "cafesui.fruitcap", MGR = ["정항아", "사장님"];
  var box = document.getElementById("skCap"); if (!box) return;
  // mo: 쓰는 달(쉼표) · lo/hi/cap: 원(숫자만) · m: 근거
  // 처음 값 = 손익(회계) 파일 주석 2023-05 ~ 2026-10 (엄궁 · 월드마켓 · 칠성상회 · 쿠팡 · 네이버 구매 메모) + 크리스마스 재료 파일 (10/28 정리)
  //  u 주문 단위 · pk 포장 기본(1박스에 몇 개 · 몇 g) · lo/hi 기록 최저 · 최고 · cap 한도선(제안) · mc 달별 한도선 · mh 달별 값
  var CAP0 = [
    { id: "f1", n: "딸기", u: "500g 1통(팩)", pk: "1통 500g (1kg 팩도 있음) · 알 크기 1~4호 — 케이크는 4호(길이 4cm · 한 알 11~13g) · 설향 · 금실", use: "한판 560g", mo: "11,12,1,2,3,4,5",
      lo: 2500, hi: 21000, cap: 16000, mc: { 11: 18000, 12: 11000, 1: 10000, 2: 9000, 3: 6000, 4: 5500, 5: 4000 },
      mh: "11월 11,000~21,000 (첫 출하 · 2024-11-10 엄궁 21,000 「겁나 비싸게」) · 12월 6,000~13,500 (크리스마스 23~24일 13,500) · 1월 4,500~10,500 · 2월 3,800~9,000 · 3월 2,500~6,000 · 4월 2,250~5,500 · 5월 2,500~3,800",
      m: "2026 칠성: 1월 7,500~10,500 · 2월 5,500~9,000 · 3월 5,500 · 4월 5,500 · 12월 크리스마스 직전은 비싸짐(2025-12-23 · 24 13,500)" },
    { id: "f2", n: "망고 (12 · 14 · 16수)", u: "1박스", pk: "1박스 12수 · 14수 · 16수 (박스에 12~16개 · 10수 · 18수도 있음)", use: "한판 12수짜리 3.5개", mo: "1,2,3,4,5,6,7,8,9,10,11,12",
      lo: 28000, hi: 62000, cap: 58000, mc: {},
      mh: "2023 엄궁 40,000~47,000 · 2024 34,000~48,000 (월드마켓 36,000~48,000) · 2025 봄 32,000~35,000 · 2025 가을 50,000~62,000 · 2026 칠성 1~2월 50,000~55,000 · 3~4월 40,000~50,000 · 5~6월 54,000~58,000",
      m: "사장님 기준 「망고 1박스 58,000원 넘으면 안 됨」 · 최고 62,000(2025-10)" },
    { id: "f3", n: "애플망고", u: "1박스 (약 4kg)", pk: "1박스 4kg 8~12과 (페루 10입 · 12입 4kg · 농장 8수 · 쿠팡 3.8kg 8~10개)", use: "", mo: "6,7,8,9,10,11,12,1,2",
      lo: 30000, hi: 62000, cap: 60000, mc: {},
      mh: "2024-12 페루 32,000~36,000 · 2025-02 30,000 · 2025-07 브라질 10과 42,000 · 2025-09~10 45,000~52,000 · 2025-11~2026-01 55,000~57,000 · 2026-07~8 칠성 50,000~55,000 · 2026-09 56,000~62,000",
      m: "(제안) 한도선 60,000 — 2026-09-19 10박스 62,000원은 넘음" },
    { id: "f15", n: "골드망고", u: "1박스", pk: "1박스 14수", use: "", mo: "1,2,3,7",
      lo: 50000, hi: 60000, cap: 60000, mc: {},
      mh: "2026-01~02 50,000~52,000 · 2026-07 칠성 60,000", m: "" },
    { id: "f16", n: "파키스탄 망고", u: "1박스", pk: "1박스", use: "", mo: "8,9",
      lo: 30000, hi: 35000, cap: 35000, mc: {},
      mh: "2026-08 35,000 · 2026-09 30,000 (7박스 210,000) · 35,000", m: "여름 끝 제철 · 싸게 들어옴" },
    { id: "f4", n: "샤인머스켓", u: "1박스", pk: "1박스 3수(3송이) 보통 · 4송이 박스도 · 1.5kg · 2kg", use: "한판 1손 (알 약간 큰 것)", mo: "7,8,9,10,11,12",
      lo: 9000, hi: 44000, cap: 25000, mc: {},
      mh: "2023-08 당도 보장 29,000 · 2024-07 첫 물 44,000 · 2024-08~12 15,000~25,000 · 2025 가을~겨울 16,000~23,000 · 2026-09 칠성 24,000",
      m: "(제안) 한도선 25,000 — 7월 첫 물은 비쌈(44,000) · 쿠팡 소포장 10,000~19,000" },
    { id: "f6", n: "멜론", u: "1박스 (4~5수) · 낱개 1통", pk: "1박스 4수 · 5수 (4~5통) · 낱개 1.6~2kg", use: "한판 1.5kg 반통", mo: "4,5,6,7,8,9,10",
      lo: 15000, hi: 45000, cap: 40000, mc: {},
      mh: "2023 엄궁 5수 45,000 · 쿠팡 낱개 1통 5,900~9,900 · 2025 박스 15,000~27,500 · 2026 칠성 4~5월 40,000 · 6~7월 38,000 · 8~9월 35,000",
      m: "당도 체크 필수 (2025-09 · 2026-08 안 달아서 환불 있었음)" },
    { id: "f17", n: "허니듀 멜론", u: "1박스", pk: "1박스 5수", use: "", mo: "8,9,10",
      lo: 41000, hi: 47000, cap: 47000, mc: {},
      mh: "2025-09 41,000 · 2025-10 45,000 · 2026-08 칠성 45,000~47,000", m: "" },
    { id: "f7", n: "체리", u: "1박스 (반박스도)", pk: "1박스 5kg · 9~9.5row (8.5row = 알 더 큼)", use: "한판 22알", mo: "5,6,7,8",
      lo: 66000, hi: 90000, cap: 90000, mc: {},
      mh: "2024-06~08 월드마켓 66,000~82,000 · 2025-06~08 75,000~88,000 · 2026 칠성 1박스 90,000 · 반박스 45,000",
      m: "2026-08-27 상태 불량 반박스 45,000 차감 받음 — 받을 때 꼭 확인" },
    { id: "f5", n: "무화과", u: "1박스 · 500g 1팩", pk: "500g 1팩 (영암) · 칠성 1박스 · 쿠팡 6팩 묶음", use: "한판 500g", mo: "7,8,9,10,11",
      lo: 6800, hi: 15500, cap: 12000, mc: {},
      mh: "2023-08 팩 6,800~7,000 · 2024-08 팩 7,500~8,500 · 2025-09~10 팩 8,000~11,800 · 2026 칠성 1박스 12,000 (8~9월 내내) · 쿠팡 1kg 15,500",
      m: "(제안) 한도선 12,000 — 칠성 박스 값" },
    { id: "f8", n: "복숭아 졸임 (미스터돌)", u: "1박스", pk: "1박스 분홍백도 병조림 24병", use: "한판 1병 반", mo: "5,6,7,8",
      lo: 168000, hi: 173000, cap: 173000, mc: {},
      mh: "2025-05 ~ 2026-08 늘 173,000 (병당 7,000 × 24 + 택배 5,000) · 2026-08 3박스 504,000 (박스당 168,000)",
      m: "쿠팡 낱병 9,900 (2병 19,800) — 박스가 쌈 · 파손 병은 바로 알리기" },
    { id: "f18", n: "복숭아 (생과 · 딱복)", u: "1박스", pk: "1박스 14과 · 15과 · 17수", use: "", mo: "7,8",
      lo: 14000, hi: 36000, cap: 30000, mc: {},
      mh: "2023-07~08 19,000~36,000 · 2024-07 16,500~22,000 · 홍백도 27,000 · 2024-08 25,000~28,000",
      m: "(제안) 한도선 30,000" },
    { id: "f9", n: "초당옥수수", u: "1박스 · 10개 · 20개", pk: "1박스 (반박스도) · 인터넷 10개 · 20개 묶음 (손질된 것도)", use: "한판 반개~1개", mo: "6,7,8",
      lo: 1790, hi: 35000, cap: 35000, mc: {},
      mh: "1박스 2025-06 20,000 · 2026-06 칠성 35,000 (반박스 17,000) · 인터넷 낱개 1,790~2,680",
      m: "최저 · 최고는 낱개(개당)와 박스 값이 섞여 있어요 — 박스 한도선 35,000" },
    { id: "f10", n: "대추 방울토마토", u: "1박스", pk: "2kg 박스 (1/2번과 · 대과) · 5kg · 1kg 팩", use: "", mo: "",
      lo: 7000, hi: 19000, cap: 15000, mc: {},
      mh: "2023 엄궁 7,000~8,000 · 쿠팡 kg당 6,700~8,600 · 2026 칠성 3월 15,000 · 6~7월 10,000~11,000 · 8월 19,000 (4kg 40,000)",
      m: "(제안) 한도선 15,000 — 토마토청 · 빙수" },
    { id: "f19", n: "짭짤이 토마토", u: "1박스", pk: "1박스", use: "", mo: "3,4,5",
      lo: 14000, hi: 25000, cap: 20000, mc: {}, mh: "2024-04 25,000 · 2026-03 14,000 · 2026-04~05 칠성 20,000", m: "" },
    { id: "f20", n: "블루베리", u: "1박스 (반박스도)", pk: "1박스 · 반박스", use: "", mo: "12,1,2,3",
      lo: 15000, hi: 43000, cap: "", mc: {}, mh: "2025-02 25,000 · 2025-03 15,000~29,000 · 2025-12 43,000 · 2026-01 반박스 19,000", m: "기록이 적어 한도선은 정하기" },
    { id: "f21", n: "골드키위", u: "1박스 (반박스도)", pk: "1박스 5kg · 반박스", use: "", mo: "11,12,1,4,5",
      lo: 25000, hi: 60000, cap: 60000, mc: {}, mh: "2024-05 5kg 60,000 · 2025-11 25,000~51,000 · 반박스 28,000 · 2026-04~05 칠성 1박스 60,000 · 반박스 30,000", m: "" },
    { id: "f11", n: "바나나", u: "1송이(손)", pk: "1송이", use: "한판 긴 것 3.5개", mo: "1,2,3,4,5,6,7,8,9,10,11,12",
      lo: 7000, hi: 10000, cap: 8000, mc: {}, mh: "2024 엄궁 1손 10,000 · 2026 칠성 1송이 7,000~8,000 · 편의점 · 마트 낱개는 따로", m: "" },
    { id: "f22", n: "귤", u: "반박스", pk: "반박스 · 제주감귤 10kg", use: "", mo: "10,11,12,1,2",
      lo: 12000, hi: 13000, cap: 13000, mc: {}, mh: "2025-12 ~ 2026-02 칠성 반박스 12,000~13,000 · 2023-10 제주감귤 10kg 25,000 (인스타 주문)", m: "" },
    { id: "f23", n: "천혜향 · 레드향 · 한라봉", u: "1박스", pk: "1박스 (천혜향 10kg 57,000 따로)", use: "", mo: "1,2,3,4",
      lo: 17000, hi: 38000, cap: "", mc: {}, mh: "천혜향 17,000~29,000 · 레드향 25,000~35,000 · 한라봉 20,000~38,000 (2024-01 ~ 2026-02)", m: "선물 · 음료용 섞임 — 한도선은 정하기" },
    { id: "f12", n: "냉동망고", u: "1kg", pk: "1kg 봉지 (5~8봉 묶어 주문)", use: "", mo: "",
      lo: "", hi: "", cap: "", mc: {}, mh: "", m: "주석에 묶음 금액만 있고 kg당 값은 안 나옴 · 싼 것으로" },
    { id: "f13", n: "냉동딸기", u: "1kg", pk: "1kg 봉지 (딜라잇가든 칠레산 · 5kg 묶음)", use: "", mo: "",
      lo: 6980, hi: 6980, cap: "", mc: {}, mh: "2026-02 10봉지 69,800 (봉당 6,980)", m: "" },
    { id: "f24", n: "냉동자몽", u: "1kg", pk: "1kg 봉지 (5~6봉 묶어 주문)", use: "", mo: "",
      lo: 12580, hi: 12900, cap: 13000, mc: {}, mh: "2025-04 5kg 64,500 · 2025-06 · 10월 6봉 75,800 · 2026-03 5봉 62,900", m: "" },
    { id: "f14", n: "망고퓨레", u: "1kg", pk: "1kg (냉동 퓨레 5개 묶음도)", use: "", mo: "",
      lo: 22800, hi: 30000, cap: 30000, mc: {}, mh: "2023-05 쿠팡 25,000 · 2024 크리스마스 30,000 · 2026-04 냉동 퓨레 1kg 5개 114,000 (개당 22,800)", m: "" }
  ];
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function canEdit() { return MGR.indexOf(me()) >= 0; }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function N(v) { var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, "")); return isNaN(n) ? 0 : n; }
  function won(v) { var n = N(v); return n ? n.toLocaleString("ko-KR") + "원" : ""; }
  function money(v) { var t = String(v == null ? "" : v).replace(/[^\d]/g, ""); return t ? Number(t).toLocaleString("ko-KR") : ""; }
  function stamp() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function save(fn) { var o = load(); o.it = o.it || {}; fn(o); o.at = stamp(); o.by = me(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} draw(); }
  // 처음 값 위에 저장된 값을 얹어 보여 줌 (저장된 적 없는 줄은 처음 값 그대로)
  function rows() {
    var st = load().it || {}, out = [];
    CAP0.forEach(function (x, i) { var r = Object.assign({}, x, st[x.id] || {}); r.id = x.id; if (r.o == null) r.o = i; out.push(r); });
    Object.keys(st).forEach(function (k) { if (!CAP0.some(function (x) { return x.id === k; })) { var r = Object.assign({}, st[k]); r.id = k; if (r.o == null) r.o = 100; out.push(r); } });
    return out.filter(function (r) { return !r.del; }).sort(function (a, b) { return a.o - b.o; });
  }
  function recs(r) { return Object.keys(r.rec || {}).map(function (k) { return r.rec[k]; }).filter(function (x) { return x && N(x.p); }).sort(function (a, b) { return String(a.d).localeCompare(String(b.d)); }); }
  // 최저 · 최고 = 처음 값 + 적은 값들
  function range(r) {
    var ps = recs(r).map(function (x) { return N(x.p); }); if (N(r.lo)) ps.push(N(r.lo)); if (N(r.hi)) ps.push(N(r.hi));
    return ps.length ? [Math.min.apply(null, ps), Math.max.apply(null, ps)] : [0, 0];
  }
  // 이번 달 한도선 — 달별(mc)이 있으면 그 값, 없으면 cap
  function capOf(r) { var m = new Date().getMonth() + 1, mc = r.mc || {}; return N(mc[m]) || N(r.cap); }
  function mcTxt(mc) { return Object.keys(mc || {}).filter(function (k) { return N(mc[k]); }).sort(function (a, b) { return ((+a + 1) % 12) - ((+b + 1) % 12); }).map(function (k) { return k + "월 " + won(mc[k]); }).join(" · "); }
  function mcParse(t) { var o = {}; String(t || "").replace(/(\d{1,2})\s*(?:월)?\s*[=:]\s*([\d,]+)/g, function (_, k, v) { if (+k >= 1 && +k <= 12) o[+k] = N(v); }); return o; }
  function inSeason(r) { var m = new Date().getMonth() + 1; return String(r.mo || "").split(",").map(Number).indexOf(m) >= 0; }
  var EDIT = false;
  function draw() {
    var rs = rows(), ed = EDIT && canEdit();
    var h = '<div class="fch"><b>💰 과일 주문 한도선</b><span>한도선보다 비싸면 <mark>주문 전에 사장님께 먼저 확인</mark> · 지금 쓰는 과일은 진하게 · 주문할 때 「＋ 값 적기」로 남기면 최저가 · 최고가가 저절로 쌓입니다</span>' +
      (canEdit() ? '<button type="button" class="fcedit">' + (ed ? "✔ 다 고쳤어요" : "✏ 한도선 고치기") + "</button>" : "") + "</div>";
    h += '<div class="ztable-wrap"><table class="skref fctab"><thead><tr><th>과일</th><th>주문 단위 · 포장 기본</th><th>한판에 쓰는 양</th><th>최저가</th><th>최고가</th><th class="fccap">🚫 이번 달 한도선</th><th>달별 값 · 근거 · 최근 값</th>' + (ed ? "<th></th>" : "") + "</tr></thead><tbody>";
    rs.forEach(function (r) {
      var rg = range(r), rc = recs(r), last = rc[rc.length - 1], on = inSeason(r) ? " now" : "";
      if (ed) {
        h += '<tr data-id="' + r.id + '" class="fced">' +
          '<td><input class="fcin" data-f="n" value="' + esc(r.n) + '"></td><td><input class="fcin" data-f="u" value="' + esc(r.u) + '" placeholder="주문 단위"><textarea class="fcin" rows="2" data-f="pk" placeholder="포장 기본 (1박스에 몇 개 · g)">' + esc(r.pk) + '</textarea></td>' +
          '<td><input class="fcin" data-f="use" value="' + esc(r.use) + '"></td>' +
          '<td><input class="fcin money" inputmode="numeric" data-f="lo" value="' + esc(money(r.lo)) + '"></td><td><input class="fcin money" inputmode="numeric" data-f="hi" value="' + esc(money(r.hi)) + '"></td>' +
          '<td><input class="fcin money" inputmode="numeric" data-f="cap" value="' + esc(money(r.cap)) + '" placeholder="기본"><input class="fcin fcmo" data-f="mc" value="' + esc(Object.keys(r.mc || {}).map(function (k) { return k + "=" + r.mc[k]; }).join(", ")) + '" placeholder="달별 (예: 11=18000, 12=11000)"></td>' +
          '<td><textarea class="fcin" rows="2" data-f="mh" placeholder="달별 값 기록">' + esc(r.mh) + '</textarea><textarea class="fcin" rows="2" data-f="m" placeholder="근거 · 메모">' + esc(r.m) + '</textarea><input class="fcin fcmo" data-f="mo" value="' + esc(r.mo) + '" placeholder="쓰는 달 (예: 11,12,1,2)"></td>' +
          '<td><button type="button" class="fcdel" title="이 줄 빼기">🗑</button></td></tr>';
      } else {
        h += '<tr data-id="' + r.id + '" class="' + on.trim() + '">' +
          '<td class="fcn' + on + '"><b>' + esc(r.n) + "</b></td><td" + (on ? ' class="now"' : "") + "><b>" + esc(r.u) + "</b>" + (r.pk ? '<span class="fcpk">' + esc(r.pk) + "</span>" : "") + "</td><td" + (on ? ' class="now"' : "") + ">" + esc(r.use || "—") + "</td>" +
          '<td class="fcp' + on + '">' + (rg[0] ? won(rg[0]) : '<i class="fcna">기록 없음</i>') + '</td><td class="fcp' + on + '">' + (rg[1] ? won(rg[1]) : '<i class="fcna">기록 없음</i>') + "</td>" +
          '<td class="fccap' + on + '">' + (capOf(r) ? "<b>" + won(capOf(r)) + "</b>" : '<i class="fcna">정하기</i>') + (mcTxt(r.mc) ? '<span class="fcmc">' + esc(mcTxt(r.mc)) + "</span>" : "") + "</td>" +
          '<td class="fcm' + on + '">' + (r.mh ? '<span class="fcmh">' + esc(r.mh) + "</span>" : "") + esc(r.m) + (last ? '<span class="fclast' + (capOf(r) && N(last.p) > capOf(r) ? " over" : "") + '">최근 ' + esc(String(last.d).slice(5).replace("-", "/")) + " " + won(last.p) + (last.who ? " · " + esc(last.who) + (/님$/.test(last.who) ? "" : "님") : "") + "</span>" : "") +
          '<button type="button" class="fcadd">＋ 값 적기</button></td></tr>';
      }
    });
    h += "</tbody></table></div>";
    if (ed) h += '<div class="fcact"><button type="button" class="fcnew">＋ 과일 줄 추가</button><span>칸에서 나오면 바로 저장 · 쓰는 달은 숫자를 쉼표로 (지금 달이면 진하게)</span></div>';
    h += '<p class="fcnote">처음 값은 <b>손익(회계) 파일 주석 2023-05 ~ 2026-10</b>(엄궁 · 월드마켓 · 칠성상회 · 쿠팡 · 네이버 구매 메모)과 크리스마스 재료 파일에서 과일별로 모은 값이에요. 「(제안)」 한도선은 지난 기록의 보통 최고값 — 사장님이 「✏ 한도선 고치기」로 정해 주세요. 딸기처럼 달마다 값이 크게 다른 과일은 <b>이번 달 한도선</b>이 달별로 바뀝니다.</p>';
    var a = document.activeElement, keep = a && box.contains(a) && a.dataset && a.dataset.f ? [a.closest("tr").dataset.id, a.dataset.f] : null;
    box.innerHTML = h;
    if (keep) { var f = box.querySelector('tr[data-id="' + keep[0] + '"] [data-f="' + keep[1] + '"]'); if (f) f.focus(); }
    paintNow();
  }
  // 발주 화면 과일 칸 아래 — 지금 쓰는 과일의 한도선 한 줄
  function paintNow() {
    var el = document.getElementById("skCapNow"); if (!el) return;
    var xs = rows().filter(function (r) { return inSeason(r) && capOf(r); });
    el.hidden = !xs.length;
    el.innerHTML = '🚫 <b>과일 한도선</b> ' + xs.map(function (r) { return esc(r.n.split(" (")[0]) + " " + esc(String(r.u).split(/ · | \(/)[0]) + " <b>" + won(capOf(r)) + "</b>"; }).join(" · ") + ' <span>— 넘으면 사장님께 먼저 · <a href="#" class="fcgo">전체 보기</a></span>';
  }
  function put(id, f, v) {
    save(function (o) {
      var b = o.it[id] || {}; b[f] = v; b.ed = me() + " " + stamp(); o.it[id] = b;
    });
  }
  box.addEventListener("click", function (e) {
    if (e.target.closest(".fcedit")) { EDIT = !EDIT; draw(); return; }
    if (e.target.closest(".fcnew")) { var id = "u" + Date.now().toString(36); save(function (o) { o.it[id] = { n: "새 과일", u: "", use: "", mo: "", lo: "", hi: "", cap: "", m: "", o: 200, add: me() + " " + stamp() }; }); return; }
    var tr = e.target.closest("tr[data-id]"); if (!tr) return; var id = tr.dataset.id, r = rows().filter(function (x) { return x.id === id; })[0]; if (!r) return;
    if (e.target.closest(".fcdel")) { if (confirm("「" + r.n + "」 줄을 뺄까요? (기록은 남아요)")) put(id, "del", 1); return; }
    if (e.target.closest(".fcadd")) {
      var v = prompt(r.n + " · " + r.u + "\n이번에 주문한 값(원)을 적어 주세요" + (capOf(r) ? "\n이번 달 한도선: " + won(capOf(r)) : ""), ""); if (v == null) return;
      var p = N(v); if (!p) { alert("숫자로 적어 주세요 (예: 55000)"); return; }
      if (capOf(r) && p > capOf(r) && !confirm("⚠ 한도선 " + won(capOf(r)) + "보다 " + won(p - capOf(r)) + " 비싸요.\n사장님께 먼저 확인하셨나요? (확인 = 그래도 적기)")) return;
      var rid = "r" + Date.now().toString(36);
      save(function (o) { var b = o.it[id] || {}; b.rec = b.rec || {}; b.rec[rid] = { d: today(), p: p, who: me(), at: stamp() }; o.it[id] = b; });
      if (window.__CS_TOAST) window.__CS_TOAST(r.n + " " + won(p) + " 적었어요");
    }
  });
  box.addEventListener("change", function (e) {
    var el = e.target, f = el.dataset && el.dataset.f; if (!f) return; var id = el.closest("tr").dataset.id;
    var v = el.value.trim(); if (/^(lo|hi|cap)$/.test(f)) v = v.replace(/[^\d]/g, ""); if (f === "mc") v = mcParse(v);
    put(id, f, v);
  });
  box.addEventListener("input", function (e) { var el = e.target; if (el.classList && el.classList.contains("money")) { var f = money(el.value); if (f !== el.value) el.value = f; } });
  document.addEventListener("click", function (e) {
    if (!e.target.closest || !e.target.closest(".fcgo")) return; e.preventDefault();
    var t = document.querySelector('#tp12 .sktab[data-c="sk2"]'); if (t) t.click();
    setTimeout(function () { box.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
  });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf(KEY) < 0) return;
    var a = document.activeElement; if (a && box.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) return;
    draw();
  });
  draw();
})();
