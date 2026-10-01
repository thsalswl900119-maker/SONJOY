// 체험판 — 처음 열면 예시 데이터를 깔고, 사장님 이름으로 바로 들어간다 (서버 연결 없음)
(function () {
  function p2(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  var t = new Date(), y = new Date(t.getTime() - 864e5), T = ymd(t), Y = ymd(y);
  try {
    if (!localStorage.getItem("csdemo.me")) localStorage.setItem("csdemo.me", "사장님");
    sessionStorage.setItem("csdemo.unlocked", "1");
    if (!localStorage.getItem("csdemo.ui.demo2")) {
      // 예전 체험판에서 남은 것(예시 재고 · 발주 등)은 지우고 새로 시작
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf("csdemo.") === 0) localStorage.removeItem(k); });
      localStorage.setItem("csdemo.me", "사장님");
      var L = function (d, who, f) { var by = {}, bl = {}; Object.keys(f).forEach(function (k) { by[k] = who; bl[k] = f[k].split("\n").map(function () { return who; }); }); return JSON.stringify({ who: who, f: f, by: by, bl: bl }); };
      localStorage.setItem("csdemo.log." + T, L(T, "김하늘", {
        lf101: "36", lf102: "4", lf103: "12", lf104: "3", lf120: "6", lf123: "기본 4 · 초코 2", lf121: "10", lf122: "2", lf124: "망고 1박스 · 샤인머스캣 1박스",
        lf183: "1,000,000 (예시)", lf184: "배민 6 · 쿠팡이츠 2",
        lf154: "오전 한산 · 12시부터 포장 손님 몰림\n3시 이후 매장 손님 꾸준",
        lf152: "2:30 티라미수 소진 · 4시 기본 에그타르트 소진",
        lf162: "[폐기] 에그타르트 1 — 모양 무너짐\n[서비스] 조각케이크 1 — 단체 주문 손님께",
        lf170: "배달 음료 1잔 누락 → 사과 후 다시 보내드림",
        lf180: "내일 생크림 입고 · 오픈 때 수량 확인",
      }));
      localStorage.setItem("csdemo.ui.demo2", "1");
    }
  } catch (e) {}
  document.addEventListener("click", function (e) {
    if (!e.target || e.target.id !== "demoReset") return;
    if (!confirm("체험판을 처음 상태로 되돌릴까요? (이 기기에 입력한 내용이 지워집니다)")) return;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf("csdemo.") === 0) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (er) {}
    location.reload();
  });
})();
