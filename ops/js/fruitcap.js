// 💰 과일 주문 한도선 (10/28 · 사장님 「과일 시즌 부분에 과일 주문 한도선 · 과일별 기준 g · 최저가 · 최고가」)
// 재고·발주 「🍓 과일」(#sk2) 안 「💰 과일 한도선 · 단가」 파트 + 발주 화면 과일 칸 아래 한 줄(#skCapNow).
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
    { id: "f1", main: 1, n: "딸기", u: "500g 1통(팩)", pk: "1통 500g (1kg 팩도 있음) · 알 크기 1~4호 — 케이크는 4호(길이 4cm · 한 알 11~13g) · 설향 · 금실", use: "한판 560g", mo: "10,11,12,1,2,3,4,5",
      lo: 1900, hi: 24000, cap: 16000, mc: { 10: 24000, 11: 18000, 12: 11000, 1: 10000, 2: 9000, 3: 6000, 4: 5500, 5: 4000 },
      mh: "(500g 1통 값 · 회계 주석 + 일지) 10월 첫 출하: 2025-10-30 18,000 · 2026-10-28 24,000 / 11월: 2023 11,000~21,000 · 2024 10,500~21,000 (11/10 엄궁 21,000 「겁나 비싸게」) · 2025 11,000~18,000 / 12월: 2023 6,500~12,000 · 2024 6,000~11,500 · 2025 9,000~13,500 (23~24일 13,500) / 1월: 2024 5,000~8,900 · 2025 4,500~7,500 · 2026 7,500~9,500 / 2월: 2024 5,200~6,500 · 2025 3,800~6,000 · 2026 5,500~9,000 / 3월: 2024 4,500~6,000 · 2025 2,500~4,500 · 2026 5,500 / 4월: 2025 2,250~3,500 · 2026 5,500 / 5월: 2025 1,900~2,500",
      m: "10/28 다시 확인 — 회계 주석 딸기 줄 120여 개를 날짜(1년 앞으로 적힌 시트 고침)별로 500g 값으로 맞춤 · kg 합계만 있는 날은 금액 ÷ (kg × 2) · 1kg 팩은 ÷ 2 · 크리스마스 직전(12/23~24)과 첫 출하(10~11월)가 가장 비쌈" },
    { id: "f2", main: 1, n: "태국망고 (골드망고)", u: "1박스", pk: "1박스 12수 · 14수 · 16수 (박스에 12~16개 · 10수 · 18수도 있음) · 골드망고 14수", use: "한판 12수짜리 3.5개", mo: "1,2,3,4,5,6,7,8,9,10,11,12",
      lo: 28000, hi: 62000, cap: 58000, mc: {},
      mh: "2023 엄궁 40,000~47,000 · 2024 34,000~48,000 (월드마켓 36,000~48,000) · 2025 봄 32,000~35,000 · 2025 가을 50,000~62,000 · 2026 칠성 1~2월 50,000~55,000 · 3~4월 40,000~50,000 · 5~6월 54,000~58,000 · 골드망고 2026-01~02 50,000~52,000 · 2026-07 칠성 60,000",
      m: "사장님 기준 「망고 1박스 58,000원 넘으면 안 됨」 · 최고 62,000(2025-10) · 골드망고 2026-07 60,000은 한도선을 넘음" },
    { id: "f3", main: 1, n: "애플망고", u: "1박스 (약 4kg)", pk: "1박스 4kg 8~12과 (페루 10입 · 12입 4kg · 농장 8수 · 쿠팡 3.8kg 8~10개)", use: "", mo: "6,7,8,9,10,11,12,1,2",
      lo: 30000, hi: 62000, cap: 60000, mc: {},
      mh: "2024-12 페루 32,000~36,000 · 2025-02 30,000 · 2025-07 브라질 10과 42,000 · 2025-09~10 45,000~52,000 · 2025-11~2026-01 55,000~57,000 · 2026-07~8 칠성 50,000~55,000 · 2026-09 56,000~62,000",
      m: "(제안) 한도선 60,000 — 2026-09-19 10박스 62,000원은 넘음" },
    { id: "f16", n: "파키스탄망고", u: "1박스", pk: "1박스", use: "", mo: "8,9",
      lo: 30000, hi: 35000, cap: 35000, mc: {},
      mh: "2026-08 35,000 · 2026-09 30,000 (7박스 210,000) · 35,000", m: "여름 끝 제철 · 싸게 들어옴" },
    { id: "f4", main: 1, n: "샤인머스켓", u: "1박스", pk: "1박스 3수(3송이) 보통 · 4송이 박스도 · 1.5kg · 2kg", use: "한판 1손 (알 약간 큰 것)", mo: "7,8,9,10,11,12",
      lo: 9000, hi: 44000, cap: 25000, mc: {},
      mh: "2023-08 당도 보장 29,000 · 2024-07 첫 물 44,000 · 2024-08~12 15,000~25,000 · 2025 가을~겨울 16,000~23,000 · 2026-09 칠성 24,000",
      m: "(제안) 한도선 25,000 — 7월 첫 물은 비쌈(44,000) · 쿠팡 소포장 10,000~19,000" },
    { id: "f6", main: 1, n: "멜론", u: "1박스 (4~5수) · 낱개 1통", pk: "1박스 4수 · 5수 (4~5통) · 낱개 1.6~2kg", use: "한판 1.5kg 반통", mo: "4,5,6,7,8,9,10",
      lo: 15000, hi: 45000, cap: 40000, mc: {},
      mh: "2023 엄궁 5수 45,000 · 쿠팡 낱개 1통 5,900~9,900 · 2025 박스 15,000~27,500 · 2026 칠성 4~5월 40,000 · 6~7월 38,000 · 8~9월 35,000",
      m: "당도 체크 필수 (2025-09 · 2026-08 안 달아서 환불 있었음)" },
    { id: "f17", n: "허니듀멜론", u: "1박스", pk: "1박스 5수", use: "", mo: "8,9,10",
      lo: 41000, hi: 47000, cap: 47000, mc: {},
      mh: "2025-09 41,000 · 2025-10 45,000 · 2026-08 칠성 45,000~47,000", m: "" },
    { id: "f7", main: 1, n: "체리", u: "1박스 (반박스도)", pk: "1박스 5kg · 9~9.5row (8.5row = 알 더 큼)", use: "한판 22알", mo: "5,6,7,8",
      lo: 66000, hi: 90000, cap: 90000, mc: {},
      mh: "2024-06~08 월드마켓 66,000~82,000 · 2025-06~08 75,000~88,000 · 2026 칠성 1박스 90,000 · 반박스 45,000",
      m: "2026-08-27 상태 불량 반박스 45,000 차감 받음 — 받을 때 꼭 확인" },
    { id: "f5", main: 1, n: "무화과", u: "1박스 · 500g 1팩", pk: "500g 1팩 (영암) · 칠성 1박스 · 쿠팡 6팩 묶음", use: "한판 500g", mo: "7,8,9,10,11",
      lo: 6800, hi: 15500, cap: 12000, mc: {},
      mh: "2023-08 팩 6,800~7,000 · 2024-08 팩 7,500~8,500 · 2025-09~10 팩 8,000~11,800 · 2026 칠성 1박스 12,000 (8~9월 내내) · 쿠팡 1kg 15,500",
      m: "(제안) 한도선 12,000 — 칠성 박스 값" },
    { id: "f8", main: 1, n: "복숭아 (졸임 · 미스터돌)", u: "1박스", pk: "1박스 분홍백도 병조림 24병", use: "한판 1병 반", mo: "5,6,7,8",
      lo: 168000, hi: 173000, cap: 173000, mc: {},
      mh: "2025-05 ~ 2026-08 늘 173,000 (병당 7,000 × 24 + 택배 5,000) · 2026-08 3박스 504,000 (박스당 168,000)",
      m: "쿠팡 낱병 9,900 (2병 19,800) — 박스가 쌈 · 파손 병은 바로 알리기" },
    { id: "f18", n: "복숭아 (생과)", u: "1박스", pk: "1박스 14과 · 15과 · 17수", use: "", mo: "7,8",
      lo: 14000, hi: 36000, cap: 30000, mc: {},
      mh: "2023-07~08 19,000~36,000 · 2024-07 16,500~22,000 · 홍백도 27,000 · 2024-08 25,000~28,000",
      m: "(제안) 한도선 30,000" },
    { id: "f9", n: "초당옥수수", u: "1박스 · 10개 · 20개", pk: "1박스 (반박스도) · 인터넷 10개 · 20개 묶음 (손질된 것도)", use: "한판 반개~1개", mo: "6,7,8",
      lo: 1790, hi: 35000, cap: 35000, mc: {},
      mh: "1박스 2025-06 20,000 · 2026-06 칠성 35,000 (반박스 17,000) · 인터넷 낱개 1,790~2,680",
      m: "최저 · 최고는 낱개(개당)와 박스 값이 섞여 있어요 — 박스 한도선 35,000" },
    { id: "f10", n: "대추방울토마토", u: "1박스", pk: "2kg 박스 (1/2번과 · 대과) · 5kg · 1kg 팩", use: "", mo: "",
      lo: 7000, hi: 19000, cap: 15000, mc: {},
      mh: "2023 엄궁 7,000~8,000 · 쿠팡 kg당 6,700~8,600 · 2026 칠성 3월 15,000 · 6~7월 10,000~11,000 · 8월 19,000 (4kg 40,000)",
      m: "(제안) 한도선 15,000 — 토마토청 · 빙수" },
    { id: "f19", n: "짭짤이토마토", u: "1박스", pk: "1박스", use: "", mo: "3,4,5",
      lo: 14000, hi: 30000, cap: 20000, mc: {}, mh: "2024-04 25,000 · 2026-03 14,000 · 2026-03-16 대성님 30,000 · 2026-04~05 칠성 20,000", m: "" },
    { id: "f20", n: "블루베리", u: "1박스 (반박스도)", pk: "1박스 · 반박스", use: "", mo: "12,1,2,3",
      lo: 15000, hi: 43000, cap: "", mc: {}, mh: "2025-02 25,000 · 2025-03 15,000~29,000 · 2025-12 43,000 · 2026-01 반박스 19,000", m: "기록이 적어 한도선은 정하기" },
    { id: "f21", n: "골드키위", u: "1박스 (반박스도)", pk: "1박스 5kg · 반박스", use: "", mo: "11,12,1,4,5",
      lo: 25000, hi: 60000, cap: 60000, mc: {}, mh: "2024-05 5kg 60,000 · 2025-11 25,000~51,000 · 반박스 28,000 · 2026-04~05 칠성 1박스 60,000 · 반박스 30,000", m: "" },
    { id: "f11", n: "바나나", u: "1송이(손)", pk: "1송이", use: "한판 긴 것 3.5개", mo: "1,2,3,4,5,6,7,8,9,10,11,12",
      lo: 7000, hi: 10000, cap: 8000, mc: {}, mh: "2024 엄궁 1손 10,000 · 2026 칠성 1송이 7,000~8,000 · 편의점 · 마트 낱개는 따로", m: "" },
    { id: "f22", n: "귤", u: "1박스 (보통 반박스로 주문)", pk: "반박스 · 1박스 · 제주감귤 10kg", use: "", mo: "10,11,12,1,2",
      lo: 24000, hi: 26000, cap: 26000, mc: {}, mh: "2025-12 ~ 2026-02 칠성 반박스 12,000~13,000 (1박스로 치면 24,000~26,000) · 2023-10 제주감귤 10kg 25,000 (인스타 주문)", m: "값은 1박스 기준 — 반박스는 그 절반" },
    { id: "f23", n: "천혜향 & 레드향 & 한라봉", u: "1박스", pk: "1박스 (천혜향 10kg 57,000 따로)", use: "", mo: "1,2,3,4",
      lo: 17000, hi: 38000, cap: "", mc: {}, mh: "천혜향 17,000~29,000 · 레드향 25,000~35,000 · 한라봉 20,000~38,000 (2024-01 ~ 2026-02)", m: "선물 · 음료용 섞임 — 한도선은 정하기" },
    { id: "f25", n: "보늬밤 (조림)", u: "1통(캔)", pk: "1통 · 네이버페이로 주문 (보늬밤 다이스 · 내피밤 감로자도 같은 값대)", use: "한판 500~600g", mo: "9,10,11",
      lo: 37500, hi: 49000, cap: 40000, mc: {},
      mh: "2024-08 38,706 · 2024-11 37,500~38,500 (2통 75,600 · 77,000) · 2025-09 다이스 5통 198,000 (통당 39,600) · 2026-09 내피밤 감로자 6통 233,812 (통당 38,969) · 급하게 1통 46,500 · 2026-10 6통 235,400 (통당 39,233) · 쿠팡 내피감로자 2개 98,000 (개당 49,000)",
      m: "(제안) 한도선 40,000 — 네이버페이(재료) 결제 메모 기준 · 6통씩 미리 사면 39,000원대, 급하게 낱개로 사면 46,500~49,000 → 9월 초에 미리 주문" }
  ];
  // sz = 규격별 값 [규격, 값(회계 주석 날짜별), 메모] — 10/28 사장님 「1박스라고 하면 안 되지 · 수 · 송이 · kg로」 → 손익 파일 주석에서 규격이 적힌 줄만 다시 뽑음
  var SZ = {
    f1: [["500g 1통(팩) · 4호", "1,900 ~ 24,000", "달마다 값이 크게 달라요 → 아래 「달별 값」 · 케이크는 4호(한 알 11~13g)"],
      ["1kg 팩 (밀양 딸기밭 4호)", "18,000 ~ 28,000", "2023-11 28,000 · 2023-12 18,000~20,000 → 500g으로 치면 9,000~14,000"],
      ["kg 단위 (엄궁 경매 5~24kg씩)", "kg당 6,500 ~ 17,000", "2023-11 14,000~17,000 · 2023-12 8,000~10,500 · 2024-01 6,500~7,700"]],
    f2: [["10수 (10개 · 알 가장 큼)", "34,000 ~ 45,000", "2023-07 엄궁 45,000 · 2025-06 34,000 (5박스 170,000)"],
      ["12수 (12개) · 케이크 기본", "34,000 ~ 58,000", "2023-05~07 엄궁 40,000~47,000 · 2024-03 34,000 · 2024-05~06 42,000 · 2024-12 53,000 · 2025-07 40,000 · 2026-05-26 칠성 58,000"],
      ["14수 (14개)", "34,000 ~ 48,000", "2023-05 43,000 · 2024-05 42,000 · 2024-10~11 월드마켓 46,000~48,000 · 2025-04~05 34,000 · 2025-07 46,000 · 골드망고 14수 2026-01 52,000"],
      ["16수 (16개 · 알 작음)", "33,000 ~ 54,000", "2024-05 약 41,000 · 2024-11 48,000 · 2025-04~05 33,000 · 2026-05-26 칠성 54,000 (같은 날 12수 58,000)"],
      ["18수", "약 50,000", "2023-05 식자재마트 1번 (누룽지와 같이 54,900)"],
      ["수 안 적힌 박스 (칠성)", "40,000 ~ 62,000", "2025-10 62,000 (4박스 248,000) · 2026-01~02 50,000~55,000 · 3~4월 40,000~50,000 · 5월 54,000~58,000 → 받을 때 몇 수인지 같이 적기"]],
    f3: [["4kg 10입 (페루)", "34,000", "2024-12 엄궁"], ["4kg 12입 (페루)", "32,000", "2024-12 엄궁 · 크리스마스 2024 월드마켓 12과 32,000"],
      ["10과 (브라질)", "42,000", "2025-07 6박스"], ["8수 (농장 직거래)", "약 50,000", "2026-07 3상자 150,000"], ["칼립소", "38,000", "2025-12"],
      ["수 안 적힌 박스 (칠성)", "45,000 ~ 62,000", "2025-09 52,000 · 2025-10 45,000 · 2025-11~2026-01 55,000~57,000 · 2026-08 55,000 · 2026-09 56,000~62,000"]],
    f16: [["1박스 (수 · 무게 기록 없음)", "30,000 ~ 35,000", "2026-08 칠성 35,000 · 2026-09 30,000 (7박스 210,000) → 받을 때 몇 수인지 적기"]],
    f4: [["1박스 3송이(3수) · 큰 알", "9,000 ~ 44,000", "크리스마스 재료 2024 「큰알로 구매 보통 3수 들어있는거」 20,000 · 2023-08 당도 보장 29,000 · 2024-07 첫 물 44,000 · 2024-08 15,000 · 2024-09 30,000 · 2024-12 16,000~25,000 · 2025-01 9,000 · 2025-10~12 16,000~23,000 · 2026-09 칠성 24,000"],
      ["1.5kg 박스 (쿠팡)", "값 따로 없음", "2023-09 · 2024-09 · 2024-11 — 다른 재료와 같이 결제돼 박스 값이 안 나옴"],
      ["3kg (과일 배달)", "값 따로 없음", "2023-11 딸기와 같이"],
      ["쿠팡 소포장 박스", "약 10,500 ~ 19,000", "2024-09 2박스 37,820 · 2024-11 2박스 21,100"]],
    f6: [["1박스 2수 (2통 · 큰 것)", "27,000", "2025-09 3박스"], ["1박스 4수 (4통)", "15,000 ~ 25,000", "2025-05 4개 25,000 · 2025-07 15,000"],
      ["1박스 5수 (5통)", "45,000", "2023-06 엄궁"], ["수 안 적힌 박스 (칠성)", "35,000 ~ 40,000", "2026-04~05 40,000 · 6~7월 38,000 · 8~10월 35,000"],
      ["낱개 1통 1.6~2kg (쿠팡 · 세지)", "5,900 ~ 9,900", "쿠팡 1.6kg 3개 17,650 · 2kg 3개 23,590 · 2024-07 1통 7,500"]],
    f17: [["1박스 5수", "41,000 ~ 47,000", "2025-09 41,000 · 2025-10 45,000 · 2026-08 칠성 45,000~47,000"]],
    f7: [["1박스 5kg · 9~9.5row", "66,000 ~ 82,000", "2024-06~08 월드마켓 66,000~74,000 · 2024-08 82,000 · 2025-08 9row 75,000"],
      ["1박스 5kg · 8.5row (알 더 큼)", "80,000 ~ 88,000", "2025-07 · 2025-08 80,000"], ["칠성 1박스", "90,000", "2026 칠성"],
      ["반박스 (약 2.5kg)", "45,000", "2026 칠성 · 2026-08-27 상태 불량 반박스 차감"], ["1kg (마트)", "기록만", "2024-05"]],
    f5: [["500g 1팩 (영암 · 쿠팡)", "6,800 ~ 11,800", "2023-08 6,800~7,000 · 2024-08 7,500~8,500 · 2025-09~10 8,000~11,800 · 쿠팡 6팩 묶음"],
      ["600g 박스", "기록만", "2023-10 3박스"], ["1kg 박스", "약 15,500", "2026-09 4박스 62,000"],
      ["3kg (엄궁)", "24,000 (kg당 8,000)", "2025-10"], ["칠성 1박스 (무게 기록 없음)", "9,000 ~ 12,000", "2025-09 9,000 · 2025-10 11,000 · 2026-08~09 12,000 → 몇 g인지 확인"]],
    f8: [["1박스 = 분홍 백도 병조림 24병", "168,000 ~ 173,000", "병당 7,000 × 24 + 택배 5,000 = 173,000 · 2026-08 3박스 504,000 (박스당 168,000)"],
      ["낱병 (쿠팡)", "9,900", "2병 19,800 — 박스가 쌈"]],
    f18: [["1박스 14과 (딱딱이)", "36,000", "2023-08"], ["딱복 1박스", "16,500 ~ 25,000", "2023-07 20,000 · 2024-07 16,500~22,000 · 2024-08 25,000"],
      ["홍백도 1박스", "27,000", "2024-07"], ["17수 1박스", "기록만", "2024-08 창고에서 급하게"]],
    f9: [["1박스", "20,000 ~ 35,000", "2025-06 20,000 · 2026 칠성 35,000"], ["반박스", "17,000", "2026 칠성"],
      ["인터넷 10개", "21,900 (개당 약 2,190)", "2025-06 · 손질된 것 10개 26,807 (2026-06)"], ["인터넷 20개", "35,800 ~ 36,210 (개당 약 1,800)", "2025-08 · 2026-07"]],
    f10: [["1kg 팩", "약 7,600", "2025-08 5박스 38,120"], ["2kg 박스", "7,000 ~ 23,900", "2023 엄궁 7,000~8,000 · 2024-04 쿠팡 23,900"],
      ["5kg 박스", "33,460 ~ 42,890", "2024-06 · 2025-04"], ["칠성 1박스", "10,000 ~ 19,000", "2026-06~07 10,000~11,000 · 2026-08 4박스 76,000 (19,000) · 4kg 40,000"]],
    f19: [["1박스 (작은 것 · 대성님)", "14,000 ~ 30,000", "2024-04 25,000 · 2026-03 14,000 · 2026-03-16 대성님 30,000 · 2026-04~05 칠성 20,000"]],
    f20: [["1박스", "25,000 ~ 43,000", "2025-02 25,000 · 2025-03 29,000~30,000 · 2025-12 43,000"], ["반박스", "19,000", "2026-01"], ["작은 통", "기록만", "2024-06 3통"]],
    f21: [["1박스 5kg", "25,000 ~ 60,000", "2024-05 60,000 · 2025-11 25,000~51,000 · 2026-04~05 칠성 60,000"], ["반박스", "28,000 ~ 30,000", "2025-12 28,000 · 2026 칠성 30,000"],
      ["낱개 (그린키위)", "10개 9,000", "2023-11"]],
    f11: [["1송이(손)", "7,000 ~ 10,000", "2024 엄궁 10,000 · 2026 칠성 7,000~8,000"], ["반손 · 편의점 2개", "2,400 ~ 2,600", "급할 때만"]],
    f22: [["반박스 (보통 주문)", "12,000 ~ 13,000", "2025-12 ~ 2026-02 칠성"], ["제주감귤 10kg", "25,000", "2023-10 인스타 주문"], ["하우스감귤 1.5kg", "기록만", "2023-09"]],
    f23: [["천혜향 1박스", "17,000 ~ 29,000", "2025-01 28,000~29,000 · 2025-03 17,000~19,000"], ["천혜향 10kg", "57,000", "2025-02"],
      ["레드향 1박스", "25,000 ~ 35,000", "2025-01~02 (설 선물용 섞임)"], ["한라봉 1박스", "20,000 ~ 38,000", "2025-01"]],
    f25: [["1통 (보늬밤 · 다이스)", "37,500 ~ 39,600", "2024-11 37,500 · 2025-09 다이스 5통 198,000"], ["내피밤 감로자 6통", "통당 약 39,000", "2026-09 233,812 · 2026-10 235,400"],
      ["급하게 낱개", "46,500 ~ 49,000", "2026-09 1통 46,500 · 쿠팡 2개 98,000"]]
  };
  var U2 = { f2: "1박스 · 10·12·14·16수", f3: "1박스 4kg · 8~12과", f16: "1박스 (몇 수인지 적기)", f4: "1박스 3송이(3수)", f6: "1박스 2~5수 · 낱개 1통", f17: "1박스 5수",
    f7: "1박스 5kg · 9~9.5row", f5: "500g 1팩 · 칠성 1박스", f8: "1박스 24병", f18: "1박스 14~17과", f9: "1박스 · 10·20개", f10: "칠성 1박스 · 1·2·5kg",
    f19: "1박스", f20: "1박스 · 반박스", f21: "1박스 5kg · 반박스", f11: "1송이(손)", f22: "반박스", f23: "1박스 (10kg도)", f25: "1통" };
  CAP0.forEach(function (x) { if (SZ[x.id]) x.sz = SZ[x.id]; if (U2[x.id]) x.u = U2[x.id]; });
  var GONE = { f12: 1, f13: 1, f14: 1, f15: 1, f24: 1 };   // 10/28 사장님: 냉동 4종 빼기 · 골드망고는 태국망고로 합침
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
    Object.keys(st).forEach(function (k) { if (!GONE[k] && !CAP0.some(function (x) { return x.id === k; })) { var r = Object.assign({}, st[k]); r.id = k; if (r.o == null) r.o = 100; out.push(r); } });
    return out.filter(function (r) { return !r.del; }).sort(function (a, b) { return a.o - b.o; });
  }
  function recs(r) { return Object.keys(r.rec || {}).map(function (k) { return r.rec[k]; }).filter(function (x) { return x && !x.del && N(x.p); }).sort(function (a, b) { return String(a.d).localeCompare(String(b.d)); }); }
  // 최저 · 최고 = 처음 값 + 적은 값들
  function range(r) {
    var ps = recs(r).map(function (x) { return N(x.p); }); if (window.__CS_FP_LINES) window.__CS_FP_LINES(r.id).forEach(function (x) { if (x.src !== "값 적기") ps.push(N(x.p)); }); if (N(r.lo)) ps.push(N(r.lo)); if (N(r.hi)) ps.push(N(r.hi));
    return ps.length ? [Math.min.apply(null, ps), Math.max.apply(null, ps)] : [0, 0];
  }
  // 이번 달 한도선 — 달별(mc)이 있으면 그 값, 없으면 cap
  function capOf(r) { var m = new Date().getMonth() + 1, mc = r.mc || {}; return N(mc[m]) || N(r.cap); }
  function mcTxt(mc) { return Object.keys(mc || {}).filter(function (k) { return N(mc[k]); }).sort(function (a, b) { return ((+a + 1) % 12) - ((+b + 1) % 12); }).map(function (k) { return k + "월 " + won(mc[k]); }).join(" · "); }
  function mcParse(t) { var o = {}; String(t || "").replace(/(\d{1,2})\s*(?:월)?\s*[=:]\s*([\d,]+)/g, function (_, k, v) { if (+k >= 1 && +k <= 12) o[+k] = N(v); }); return o; }
  function inSeason(r) { var m = new Date().getMonth() + 1; return String(r.mo || "").split(",").map(Number).indexOf(m) >= 0; }
  var EDIT = false, DONE = null;   // DONE: 방금 값 적은 과일 { id, text } — 카드 아래 「사장님께 개인톡」 단추
  var RULE = "과일값은 일지에도 쓰고 (거래처부분) /사장님에게 텔레그램으로 개인톡으로 보고하기";   // 사장님 문구 그대로 (10/28)
  // 사장님 문구 그대로 (10/28 「과일주문 한도선」 · 과일값 보고 밑에) — 가운데 한 마디만 형광
  var WHY_A = "여러분이 치밀하고 민감하게 ", WHY_B = "매번 가격을 체크", WHY_C = "해주시면 돈이 더 나가는 걸 막습니다( 그돈이 줄어야 여러분에게 더 돌려드릴수 있습니다)";
  function lastRec(r) { var rc = recs(r); return rc[rc.length - 1]; }
  function card(r) {
    var rg = range(r), last = lastRec(r), cap = capOf(r), on = inSeason(r);
    var h = '<div class="fcr' + (r.main ? " main" : "") + (on ? " now" : "") + '" data-id="' + r.id + '">' +
      '<div class="fcr1"><b class="fcnm">' + (r.main ? "⭐ " : "") + esc(r.n) + "</b>" + (on ? '<span class="fctag">지금 철</span>' : "") + '<span class="fcu">' + esc(r.u) + "</span></div>" +
      '<div class="fcr2"><span class="fcv"><i>최저</i><b>' + (rg[0] ? won(rg[0]) : "기록 없음") + '</b></span><span class="fcv"><i>최고</i><b>' + (rg[1] ? won(rg[1]) : "기록 없음") + "</b></span>" +
      '<span class="fcv cap"><i>🚫 이번 달 한도선</i><b>' + (cap ? won(cap) : "정하기") + "</b></span>" +
      '<span class="fcaddw"><button type="button" class="fcadd" title="금액만 써 주세요 ex) 24,000">＋ 값 적기</button><small class="fcaddtip">금액만 써 주세요 ex) 24,000</small></span></div>';
    if (r.sz && r.sz.length) h += '<table class="fcsz"><caption>📦 규격별 값 (회계 파일 주석)</caption><tbody>' + r.sz.map(function (z) { return "<tr><th>" + esc(z[0]) + "</th><td><b>" + esc(z[1]) + "</b>" + (z[2] ? "<small>" + esc(z[2]) + "</small>" : "") + "</td></tr>"; }).join("") + "</tbody></table>";
    if (last) h += '<div class="fclast' + (cap && N(last.p) > cap ? " over" : "") + '">최근 ' + esc(String(last.d).slice(5).replace("-", "/")) + (last.k ? " " + esc(last.k) : "") + " " + won(last.p) + (last.who ? " · " + esc(last.who) + (/님$/.test(last.who) ? "" : "님") : "") + (cap && N(last.p) > cap ? " · ⚠ 한도선 넘음" : "") + "</div>";
    if (DONE && DONE.id === r.id) h += '<div class="fcdone">✔ 적었어요 · 📝 오늘 일지 「거래처」 칸에도 넣었어요 <button type="button" class="fcboss">📨 사장님께 텔레그램 개인톡 보고</button></div>';
    h += '<details class="fcmore"><summary>📦 포장 기본 · 📅 달별 값 · 근거</summary>' +
      (r.pk ? "<p><b>📦 포장 기본</b> " + esc(r.pk) + "</p>" : "") + (r.use ? "<p><b>🍰 한판에 쓰는 양</b> " + esc(r.use) + "</p>" : "") +
      (mcTxt(r.mc) ? "<p><b>📅 달별 한도선</b> " + esc(mcTxt(r.mc)) + "</p>" : "") + (r.mh ? "<p><b>📈 달별 값</b> " + esc(r.mh) + "</p>" : "") + (r.m ? "<p>" + esc(r.m) + "</p>" : "") + "</details></div>";
    return h;
  }
  function cards(rs) {
    var main = rs.filter(function (r) { return r.main; }), rest = rs.filter(function (r) { return !r.main; });
    return '<div class="fcgh">⭐ 메인 과일 <small>' + main.length + "가지</small></div>" + '<div class="fcl">' + main.map(card).join("") + "</div>" +
      '<div class="fcgh">그 밖의 과일 <small>' + rest.length + "가지</small></div>" + '<div class="fcl">' + rest.map(card).join("") + "</div>";
  }
  function draw() {
    var rs = rows(), ed = EDIT && canEdit();
    var h = '<div class="tnotice fcrule"><div class="tnhead">★ 과일값 보고 · 과일주문 한도선</div><ul><li><b>' + esc(RULE) + "</b><span>「＋ 값 적기」(금액만 써 주세요 ex) 24,000)를 누르면 오늘 일지 거래처 칸에 한 줄이 들어가고, 「📨 사장님께 텔레그램 개인톡 보고」 단추가 나와요</span></li>" +
      "<li><b>" + esc(WHY_A) + "<mark>" + esc(WHY_B) + "</mark>" + esc(WHY_C) + "</b></li></ul></div>" +
      '<div class="fch"><b>💰 과일 주문 한도선</b><span>한도선보다 비싸면 <mark>주문 전에 사장님께 먼저 확인</mark> · ⭐ = 메인 과일 · 「지금 철」 = 이번 달에 쓰는 과일</span>' +
      '<button type="button" class="fcaside-open">📋 옆에 열기</button>' + (canEdit() ? '<button type="button" class="fcedit">' + (ed ? "✔ 다 고쳤어요" : "✏ 한도선 고치기") + "</button>" : "") + "</div>";
    if (ed) {
      h += '<div class="ztable-wrap"><table class="skref fctab"><thead><tr><th>과일 · ⭐ 메인</th><th>주문 단위 · 포장 기본</th><th>한판에 쓰는 양</th><th>최저가</th><th>최고가</th><th class="fccap">🚫 한도선</th><th>달별 값 · 근거 · 쓰는 달</th><th></th></tr></thead><tbody>';
      rs.forEach(function (r) {
        h += '<tr data-id="' + r.id + '" class="fced">' +
          '<td><input class="fcin" data-f="n" value="' + esc(r.n) + '"><label class="fcmain"><input type="checkbox" data-f="main"' + (r.main ? " checked" : "") + '> ⭐ 메인 과일</label></td>' +
          '<td><input class="fcin" data-f="u" value="' + esc(r.u) + '" placeholder="주문 단위"><textarea class="fcin" rows="2" data-f="pk" placeholder="포장 기본 (1박스에 몇 개 · g)">' + esc(r.pk) + '</textarea></td>' +
          '<td><input class="fcin" data-f="use" value="' + esc(r.use) + '"></td>' +
          '<td><input class="fcin money" inputmode="numeric" data-f="lo" value="' + esc(money(r.lo)) + '"></td><td><input class="fcin money" inputmode="numeric" data-f="hi" value="' + esc(money(r.hi)) + '"></td>' +
          '<td><input class="fcin money" inputmode="numeric" data-f="cap" value="' + esc(money(r.cap)) + '" placeholder="기본"><input class="fcin fcmo" data-f="mc" value="' + esc(Object.keys(r.mc || {}).map(function (k) { return k + "=" + r.mc[k]; }).join(", ")) + '" placeholder="달별 (예: 11=18000, 12=11000)"></td>' +
          '<td><textarea class="fcin" rows="2" data-f="mh" placeholder="달별 값 기록">' + esc(r.mh) + '</textarea><textarea class="fcin" rows="2" data-f="m" placeholder="근거 · 메모">' + esc(r.m) + '</textarea><input class="fcin fcmo" data-f="mo" value="' + esc(r.mo) + '" placeholder="쓰는 달 (예: 11,12,1,2)"></td>' +
          '<td><button type="button" class="fcdel" title="이 줄 빼기">🗑</button></td></tr>';
      });
      h += '</tbody></table></div><div class="fcact"><button type="button" class="fcnew">＋ 과일 줄 추가</button><span>칸에서 나오면 바로 저장 · 쓰는 달은 숫자를 쉼표로</span></div>';
    } else h += cards(rs);
    h += '<p class="fcnote">처음 값은 <b>손익(회계) 파일 주석 2023-05 ~ 2026-10</b>(엄궁 · 월드마켓 · 칠성상회 · 쿠팡 · 네이버페이 구매 메모)과 크리스마스 재료 파일에서 과일별로 모은 값이에요. 「(제안)」 한도선은 지난 기록의 보통 최고값 — 사장님이 「✏ 한도선 고치기」로 정해 주세요.</p>';
    var a = document.activeElement, keep = a && box.contains(a) && a.dataset && a.dataset.f && a.closest("[data-id]") ? [a.closest("[data-id]").dataset.id, a.dataset.f] : null;
    box.innerHTML = h;
    if (keep) { var f = box.querySelector('[data-id="' + keep[0] + '"] [data-f="' + keep[1] + '"]'); if (f) f.focus(); }
    paintNow(); paintAside();
  }
  // 발주 화면 과일 칸 아래 — 지금 쓰는 과일의 한도선 한 줄
  // 발주 화면 과일 칸 — 「주문하는 과일만」(10/28 사장님): 최근 3주 재고·발주 기록(발주 줄 · 과일 주문 · 과일 사용)과
  //  최근 45일 단가 기록에 나온 과일만 · 하나도 없으면 지금 철 메인 과일
  function orderedSet() {
    var fid = window.__CS_FP_FID, set = {}, n = 0; if (!fid) return null;
    var add = function (t) { t = String(t || "").trim(); if (!t || /냉동|퓨레/.test(t)) return; var f = fid(t); if (f && !set[f]) { set[f] = 1; n++; } };
    var now = new Date();
    for (var i = 0; i < 21; i++) {
      var d = new Date(now.getTime() - i * 864e5), k = "cafesui.stock." + d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"), o = null;
      try { o = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
      if (!o) continue;
      [o.orders, o.fruitOrder, o.fu1n, o.fu2n, o.fu3n, o.fu4n].join("\n").split(/\n|,|·|\/|\+/).forEach(add);
    }
    var since = new Date(now.getTime() - 45 * 864e5).toISOString().slice(0, 10);
    if (window.__CS_FP_LINES) rows().forEach(function (r) { if (window.__CS_FP_LINES(r.id).some(function (x) { return String(x.d) >= since; })) { if (!set[r.id]) { set[r.id] = 1; n++; } } });
    return n ? set : null;
  }
  function paintNow() {
    var els = ["skCapNow", "skCapNow2"].map(function (id) { return document.getElementById(id); }).filter(Boolean); if (!els.length) return;   // 발주·재고 체크 + 🍓 과일 탭 맨 위 (10/28)
    var set = orderedSet();
    var xs = rows().filter(function (r) { return capOf(r) && (set ? set[r.id] : (r.main && inSeason(r))); });
    els.forEach(function (el) { el.hidden = !xs.length; }); if (!xs.length) return;
    var html = '<div class="sch"><b>🚫 과일 한도선</b><span>' + (set ? "요즘 주문하는 과일" : "지금 철 메인 과일") + ' · 넘으면 사장님께 먼저</span><button type="button" class="fcaside-open fcaside-mini">📋 과일 가격표 옆에 열기</button></div>' +
      '<div class="scl">' + xs.map(function (r) { return '<div class="scc"><span>' + esc(r.n.split(" (")[0]) + "<i>" + esc(r.u) + "</i></span><b>" + won(capOf(r)) + "</b></div>"; }).join("") + "</div>";
    els.forEach(function (el) { if (el.innerHTML !== html) el.innerHTML = html; });
  }
  // 📋 옆 창(aside) — 어느 화면에서든 열어 놓고 보면서 값 적기 (10/28 사장님 「가격표 보고 업데이트 · 어사이드로 열어서 확인」)
  var aside = document.createElement("aside"); aside.className = "fcaside"; aside.id = "fcAside"; aside.hidden = true; aside.setAttribute("aria-label", "과일 가격표");
  document.body.appendChild(aside);
  function paintAside() {
    if (aside.hidden) return;
    var rs = rows(), m = new Date().getMonth() + 1;
    var now = rs.filter(inSeason), rest = rs.filter(function (r) { return !inSeason(r); });
    var b = aside.querySelector(".fcab"), sy = b ? b.scrollTop : 0, op = !!aside.querySelector(".fcarest[open]");
    aside.innerHTML = '<div class="fcah"><b>💰 과일 가격표</b><span>' + m + '월 · 한도선 넘으면 사장님께 먼저</span><button type="button" class="fcaclose" aria-label="닫기">✕</button></div>' +
      '<div class="fcab"><p class="fcarule"><b>' + esc(RULE) + "</b></p>" +
      '<div class="fcgh">이번 달 쓰는 과일 <small>' + now.length + "가지</small></div><div class=\"fcl\">" + now.map(card).join("") + "</div>" +
      '<details class="fcarest"' + (op ? " open" : "") + "><summary>그 밖의 과일 " + rest.length + "가지</summary><div class=\"fcl\">" + rest.map(card).join("") + "</div></details></div>";
    var b2 = aside.querySelector(".fcab"); if (b2) b2.scrollTop = sy;
  }
  function openAside() { aside.hidden = false; document.documentElement.classList.add("fcaside-on"); paintAside(); }
  function closeAside() { aside.hidden = true; document.documentElement.classList.remove("fcaside-on"); }
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    if (e.target.closest(".fcaside-open")) { e.preventDefault(); openAside(); return; }
    if (e.target.closest(".fcaclose")) { closeAside(); return; }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !aside.hidden) closeAside(); });
  // 일지 「거래처」 칸 옆에도 여는 단추
  (function () { var t = document.querySelector('.lgin[data-k="lf173"]'), lab = t && t.parentNode.querySelector(".mlab"); if (lab && !lab.querySelector(".fcaside-open")) lab.insertAdjacentHTML("beforeend", '<button type="button" class="fcaside-open fcaside-mini">💰 과일 가격표</button>'); })();
  function put(id, f, v) {
    save(function (o) {
      var b = o.it[id] || {}; b[f] = v; b.ed = me() + " " + stamp(); o.it[id] = b;
    });
  }
  // 오늘 일지 「거래처」(lf173)에 한 줄 — 일지 화면이 오늘이면 칸에, 아니면 기기 저장 → 서버
  function logAppend(ln) {
    var d = today(), dEl = document.getElementById("lgDate"), el = document.querySelector('.lgin[data-k="lf173"]'), NL = String.fromCharCode(10);
    if (el && dEl && dEl.value === d) {
      if (el.value.indexOf(ln) < 0) { el.value = (el.value.trim() ? el.value.replace(/\s+$/, "") + NL : "") + ln; el.dispatchEvent(new Event("input", { bubbles: true })); }
      return true;
    }
    var k = "cafesui.log." + d, o = null; try { o = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
    o = o || {}; o.f = o.f || {}; var cur = typeof o.f.lf173 === "string" ? o.f.lf173 : "";
    if (cur.indexOf(ln) >= 0) return true;
    o.f.lf173 = (cur.trim() ? cur.replace(/\s+$/, "") + NL : "") + ln;
    try { localStorage.setItem(k, JSON.stringify(o)); return true; } catch (e) { return false; }
  }
  // 사장님 개인톡 — 휴대폰은 공유 창(텔레그램 → 사장님), 컴퓨터는 글 복사 + 텔레그램 보내기 창
  function tellBoss(text) {
    var done = function (m) { if (window.__CS_TOAST) window.__CS_TOAST(m); };
    var mob = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent || "");
    if (mob && navigator.share) { navigator.share({ text: text }).then(function () { done("공유 창에서 텔레그램 → 사장님 개인톡을 고르면 끝"); }).catch(function () {}); return; }
    var ok = false; try { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove(); } catch (e) {}
    window.open("https://t.me/share/url?url=" + encodeURIComponent(text), "_blank", "noopener");
    done(ok ? "글을 복사했어요 · 텔레그램에서 사장님 개인톡을 골라 보내 주세요" : "텔레그램에서 사장님 개인톡을 골라 보내 주세요");
  }
  function onClick(e) {
    var t = e.target; if (!t.closest) return;
    if (t.closest(".fcedit")) { EDIT = !EDIT; draw(); return; }
    if (t.closest(".fcnew")) { var nid = "u" + Date.now().toString(36); save(function (o) { o.it[nid] = { n: "새 과일", u: "", use: "", mo: "", lo: "", hi: "", cap: "", m: "", o: 200, add: me() + " " + stamp() }; }); return; }
    var host = t.closest("[data-id]"); if (!host) return; var id = host.dataset.id, r = rows().filter(function (x) { return x.id === id; })[0]; if (!r) return;
    if (t.closest(".fcdel")) { if (confirm("「" + r.n + "」 줄을 뺄까요? (기록은 남아요)")) put(id, "del", 1); return; }
    if (t.closest(".fcboss")) { if (DONE && DONE.id === id) { if (window.__CS_TG && window.__CS_TG.share) window.__CS_TG.share(DONE.text, t.closest(".fcboss")); else tellBoss(DONE.text); } return; }
    if (t.closest(".fcadd")) {
      var cap = capOf(r);
      var v = prompt(r.n + " · " + r.u + "\n값 적기 (금액만 써 주세요) ex) 24,000" + (cap ? "\n이번 달 한도선: " + won(cap) : ""), ""); if (v == null) return;
      v = String(v).trim().replace(/\s*원$/, "");
      var p = N(v);
      // 10/28 사고: 「10/28 24,000」을 적어 102,824,000원이 됨 — 금액 말고 다른 글자(날짜 · 개수)가 섞이면 다시 묻기
      if (!p || !/^[\d,]+$/.test(v) || p > 1000000) { alert("금액만 써 주세요 ex) 24,000\n(날짜 · 개수 · 글자는 빼고 숫자와 쉼표만)"); return; }
      if (cap && p > cap && !confirm("⚠ 한도선 " + won(cap) + "보다 " + won(p - cap) + " 비싸요.\n사장님께 먼저 확인하셨나요? (확인 = 그래도 적기)")) return;
      // 10/28 사장님 「1박스라고 하면 안 되지」 — 규격이 여러 개면 몇 수 · 몇 kg인지 같이 (모르면 비워 둠)
      var ut = r.u, kz = "";
      if (r.sz && r.sz.length > 1) {
        kz = prompt(r.n + " 규격을 적어 주세요 (예: " + r.sz.slice(0, 3).map(function (z) { return z[0].split(" (")[0]; }).join(" / ") + ")\n모르면 비워 두고 확인", "");
        kz = String(kz || "").trim().slice(0, 40); if (kz) ut = kz;
      }
      var rid = "r" + Date.now().toString(36);
      save(function (o) { var b = o.it[id] || {}; b.rec = b.rec || {}; b.rec[rid] = { d: today(), p: p, who: me(), at: stamp() }; if (kz) b.rec[rid].k = kz; o.it[id] = b; });
      var over = cap && p > cap ? " (한도선 " + won(cap) + " · ⚠ " + won(p - cap) + " 넘음)" : (cap ? " (한도선 " + won(cap) + " 안)" : "");
      logAppend("🍓 과일값: " + r.n + " " + ut + " " + won(p) + over);
      var d = new Date(), who = me();
      DONE = { id: id, text: "[카페스이 과일값 보고] " + (d.getMonth() + 1) + "/" + d.getDate() + String.fromCharCode(10) + r.n + " " + ut + " " + won(p) + over + (who ? String.fromCharCode(10) + "— " + who + (/님$/.test(who) || who === "사장님" ? "" : "님") : "") };
      draw();
      if (window.__CS_TOAST) window.__CS_TOAST(r.n + " " + won(p) + " 적었어요 · 일지 거래처에도 넣었어요");
    }
  }
  box.addEventListener("click", onClick); aside.addEventListener("click", onClick);
  window.__CS_FCAP = function (f, m) { var r = rows().filter(function (x) { return x.id === f; })[0]; if (!r) return 0; var mc = r.mc || {}; return N(mc[m]) || N(r.cap); };
  window.__CS_FCAP_ROWS = rows;
  window.__CS_FCAP_DRAW = function () { draw(); };
  box.addEventListener("change", function (e) {
    var el = e.target, f = el.dataset && el.dataset.f; if (!f) return; var id = el.closest("[data-id]").dataset.id;
    var v = el.type === "checkbox" ? (el.checked ? 1 : 0) : el.value.trim(); if (/^(lo|hi|cap)$/.test(f)) v = v.replace(/[^\d]/g, ""); if (f === "mc") v = mcParse(v);
    put(id, f, v);
  });
  box.addEventListener("input", function (e) { var el = e.target; if (el.classList && el.classList.contains("money")) { var f = money(el.value); if (f !== el.value) el.value = f; } });

  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf(KEY) < 0) return;
    var a = document.activeElement; if (a && box.contains(a) && /INPUT|TEXTAREA/.test(a.tagName)) return;
    draw();
  });
  draw();
})();
