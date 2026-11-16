// 🍓 딸기값 그래프 (11/16 · 사장님 「딸기값 재고 발주에 과일 파트에 그래프로 · 내가 가격 입력하는 거마다 월별로」)
//  재고·발주 → 🍓 과일 → 💰 과일 한도선 · 단가 맨 위 #skStraw
//  자료: 과일 단가 기록(cafesui.fruitprice · 거래내역 붙여 넣기) + 「＋ 값 적기」(cafesui.fruitcap f1.rec) — 모두 500g 값
//  시즌 = 10월 ~ 다음 해 5월 · 점 = 입력 한 번 · 굵은 선 = 그 달 평균 · 파란 점선 = 지난 시즌 같은 달 평균 · 회색 점선 = 그 달 한도선
(function () {
  var box = document.getElementById("skStraw"); if (!box) return;
  var F = "f1", RED = "#C2412D", BLUE = "#4A63C9";
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function won(n) { return Math.round(n).toLocaleString("ko-KR"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var now = new Date(), curS = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;   // 8월부터는 새 시즌(10월 시작)
  var S = curS;
  var MON = [10, 11, 12, 1, 2, 3, 4, 5];
  function ymOf(s, m) { return (m >= 10 ? s : s + 1) + "-" + pad(m); }
  function lines() {
    var a = window.__CS_FP_LINES ? window.__CS_FP_LINES(F) : [], seen = {}, out = [];
    a.forEach(function (x) { var p = +x.p; if (!p || !x.d || p > 200000) return; var k = x.d + "|" + p; if (seen[k]) return; seen[k] = 1; out.push({ d: String(x.d).slice(0, 10), p: p, src: x.src || "", by: x.by || "", q: Number(x.q) || 1 }); });
    return out.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }
  function capOf(m) { return window.__CS_FCAP ? window.__CS_FCAP(F, m) : 0; }
  function stat(L) { if (!L.length) return null; var q = 0, s = 0, lo = Infinity, hi = 0; L.forEach(function (x) { q += x.q; s += x.p * x.q; lo = Math.min(lo, x.p); hi = Math.max(hi, x.p); }); return { n: L.length, avg: s / q, lo: lo, hi: hi }; }
  function seasonData(s, all) {
    var by = {}; MON.forEach(function (m) { by[m] = []; });
    all.forEach(function (x) { var y = +x.d.slice(0, 4), m = +x.d.slice(5, 7); if (by[m] && ((m >= 10 && y === s) || (m <= 5 && y === s + 1))) by[m].push(x); });
    return by;
  }
  function draw() {
    var all = lines(), A = seasonData(S, all), B = seasonData(S - 1, all);
    var seasons = {}; all.forEach(function (x) { var y = +x.d.slice(0, 4), m = +x.d.slice(5, 7); if (m >= 10) seasons[y] = 1; else if (m <= 5) seasons[y - 1] = 1; });
    var minS = Math.min.apply(null, Object.keys(seasons).map(Number).concat([curS])), lab = function (s) { return String(s).slice(2) + "~" + String(s + 1).slice(2) + " 시즌"; };
    var tm = now.getMonth() + 1, thisM = MON.indexOf(tm) >= 0 && S === curS ? tm : null;
    var h = '<div class="fch"><b>🍓 딸기값 그래프 <small>500g 기준</small></b><span>값을 적을 때마다 점이 하나씩 찍히고, 달마다 평균을 이어요 · 「＋ 값 적기」 · 거래내역 붙여 넣기 둘 다 · 시즌 = 10월 ~ 다음 해 5월</span></div>' +
      '<div class="stnav"><button type="button" data-s="-1"' + (S <= minS ? " disabled" : "") + ' aria-label="이전 시즌">◀</button><b>' + S + "~" + (S + 1) + ' 시즌</b><button type="button" data-s="1"' + (S >= curS ? " disabled" : "") + ' aria-label="다음 시즌">▶</button>' + (S !== curS ? '<button type="button" data-s="0" class="stnow">이번 시즌으로</button>' : "") + "</div>";
    // 숫자 칸
    var km = thisM || (function () { for (var i = MON.length - 1; i >= 0; i--) if (A[MON[i]].length) return MON[i]; return null; })();
    if (km) {
      var a = stat(A[km]), b = stat(B[km]), c = capOf(km);
      h += '<div class="sttiles"><div><span>' + km + "월 평균" + (thisM ? " (이번 달)" : "") + "</span><b>" + (a ? won(a.avg) + "원" : "—") + "</b><em>" + (a ? "입력 " + a.n + "번 · " + won(a.lo) + "~" + won(a.hi) : "아직 입력 없음") + "</em></div>" +
        "<div><span>지난 시즌 " + km + "월 평균</span><b>" + (b ? won(b.avg) + "원" : "—") + "</b><em>" + (a && b ? (a.avg >= b.avg ? "▲ " : "▼ ") + won(Math.abs(a.avg - b.avg)) + "원 (" + (a.avg >= b.avg ? "+" : "−") + Math.round(Math.abs(a.avg - b.avg) / b.avg * 100) + "%)" : b ? "입력 " + b.n + "번" : "기록 없음") + "</em></div>" +
        "<div><span>" + km + "월 한도선</span><b>" + (c ? won(c) + "원" : "—") + "</b><em>" + (a && c ? (a.avg > c ? "⚠ 평균이 한도선보다 " + won(a.avg - c) + "원 높음" : "✔ 평균이 한도선 안") : "") + "</em></div></div>";
    }
    var any = MON.some(function (m) { return A[m].length; });
    h += '<div class="stchart" role="img" aria-label="' + esc(lab(S)) + ' 딸기 500g 값 그래프"></div>';
    if (!any) h += '<p class="stempty">이 시즌엔 아직 딸기값이 없어요 — 아래 딸기 카드의 「＋ 값 적기」로 넣으면 여기 점이 찍혀요 (금액만 · 1kg이면 「1kg 값인가요?」에 확인)</p>';
    // 표
    h += '<details class="sttbl"' + (any ? " open" : "") + '><summary>📋 달마다 숫자로 보기</summary><div class="ztable-wrap"><table><thead><tr><th>달</th><th>입력</th><th>최저</th><th>평균</th><th>최고</th><th>한도선</th><th>지난 시즌 평균</th><th>지난 시즌 대비</th></tr></thead><tbody>' +
      MON.map(function (m) { var a = stat(A[m]), b = stat(B[m]), c = capOf(m); return '<tr class="' + (m === thisM ? "now" : "") + '"><th>' + m + "월</th><td>" + (a ? a.n + "번" : "—") + "</td><td>" + (a ? won(a.lo) : "") + '</td><td class="' + (a && c && a.avg > c ? "over" : "") + '"><b>' + (a ? won(a.avg) : "") + "</b></td><td>" + (a ? won(a.hi) : "") + "</td><td>" + (c ? won(c) : "") + "</td><td>" + (b ? won(b.avg) : "") + "</td><td>" + (a && b ? (a.avg >= b.avg ? "▲ +" : "▼ −") + Math.round(Math.abs(a.avg - b.avg) / b.avg * 100) + "%" : "") + "</td></tr>"; }).join("") +
      "</tbody></table></div></details>";
    box.innerHTML = h;
    svg(box.querySelector(".stchart"), A, B, thisM);
  }
  function svg(el, A, B, thisM) {
    var W = Math.max(320, el.clientWidth || box.clientWidth || 700), H = W < 520 ? 260 : 300, ml = W < 520 ? 44 : 56, mr = 14, mt = 18, mb = 34;
    var pw = W - ml - mr, ph = H - mt - mb, n = MON.length, cw = pw / n;
    var vals = [];
    MON.forEach(function (m) { A[m].forEach(function (x) { vals.push(x.p); }); var b = stat(B[m]); if (b) vals.push(b.avg); var c = capOf(m); if (c) vals.push(c); });
    var top = Math.max(5000, Math.ceil((Math.max.apply(null, vals.concat([0])) * 1.08) / 5000) * 5000), step = top <= 20000 ? 5000 : 10000;
    function yv(v) { return mt + ph - v / top * ph; }
    function xm(i, frac) { return ml + cw * i + cw * (frac == null ? 0.5 : frac); }
    function dayFrac(d) { var y = +d.slice(0, 4), m = +d.slice(5, 7), dd = +d.slice(8, 10), dim = new Date(y, m, 0).getDate(); return 0.08 + 0.84 * (dd - 1) / Math.max(1, dim - 1); }
    var g = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" height="' + H + '" class="stsvg">';
    for (var v = 0; v <= top; v += step) g += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yv(v) + '" y2="' + yv(v) + '" class="gr"/><text x="' + (ml - 6) + '" y="' + (yv(v) + 4) + '" class="yl">' + won(v) + "</text>";
    MON.forEach(function (m, i) {
      if (m === thisM) g += '<rect x="' + (ml + cw * i) + '" y="' + mt + '" width="' + cw + '" height="' + ph + '" class="nowb"/>';
      if (i) g += '<line x1="' + (ml + cw * i) + '" x2="' + (ml + cw * i) + '" y1="' + mt + '" y2="' + (mt + ph) + '" class="vg"/>';
      g += '<text x="' + xm(i) + '" y="' + (H - 12) + '" class="xl' + (m === thisM ? " now" : "") + '">' + m + "월</text>";
    });
    // 한도선 (달마다 계단)
    var cp = ""; MON.forEach(function (m, i) { var c = capOf(m); if (!c) return; cp += '<line x1="' + (ml + cw * i + 2) + '" x2="' + (ml + cw * (i + 1) - 2) + '" y1="' + yv(c) + '" y2="' + yv(c) + '" class="cap"><title>' + m + "월 한도선 " + won(c) + "원</title></line>"; });
    g += cp;
    // 지난 시즌 평균 (파란 점선)
    function path(D, cls, col) { var pts = []; MON.forEach(function (m, i) { var s = stat(D[m]); if (s) pts.push([xm(i), yv(s.avg), m, s]); }); if (!pts.length) return { g: "", pts: pts }; var d = "", prev = -9; pts.forEach(function (p, k) { var i = MON.indexOf(p[2]); d += (i === prev + 1 ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); prev = i; }); return { g: '<path d="' + d.replace(/^L/, "M") + '" class="' + cls + '" stroke="' + col + '"/>', pts: pts }; }
    var pb = path(B, "lyl", BLUE), pa = path(A, "avl", RED);
    g += pb.g; pb.pts.forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" class="lyd" fill="' + BLUE + '" data-t="' + esc("지난 시즌 " + p[2] + "월 평균 " + won(p[3].avg) + "원 · 입력 " + p[3].n + "번 · " + won(p[3].lo) + "~" + won(p[3].hi)) + '"/>'; });
    // 이번 시즌 점(입력마다)
    MON.forEach(function (m, i) { var c = capOf(m); A[m].forEach(function (x) { var cx = ml + cw * i + cw * dayFrac(x.d), over = c && x.p > c; g += '<circle cx="' + cx.toFixed(1) + '" cy="' + yv(x.p).toFixed(1) + '" r="5" class="dot' + (over ? " over" : "") + '" data-t="' + esc((+x.d.slice(5, 7)) + "/" + (+x.d.slice(8, 10)) + " · 500g " + won(x.p) + "원" + (x.q > 1 ? " · " + x.q + "통" : "") + (x.by ? " · " + x.by : "") + (x.src ? " · " + x.src : "") + (over ? " · ⚠ 한도선(" + won(c) + ") 넘음" : "")) + '"/>'; }); });
    g += pa.g;
    pa.pts.forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5.5" class="avd" data-t="' + esc(p[2] + "월 평균 " + won(p[3].avg) + "원 · 입력 " + p[3].n + "번 · " + won(p[3].lo) + "~" + won(p[3].hi)) + '"/><text x="' + p[0] + '" y="' + (p[1] - 11) + '" class="avt">' + won(p[3].avg) + "</text>"; });
    g += "</svg>";
    el.innerHTML = g + '<div class="stleg"><span><i class="k a"></i>' + String(S).slice(2) + "~" + String(S + 1).slice(2) + ' 시즌 달 평균 (점 = 입력 한 번 · 진한 점 = 한도선 넘음)</span>' + (pb.pts.length ? '<span><i class="k b"></i>' + String(S - 1).slice(2) + "~" + String(S).slice(2) + ' 시즌 달 평균</span>' : "") + '<span><i class="k c"></i>달별 한도선</span></div><div class="sttip" hidden></div>';
    var tip = el.querySelector(".sttip");
    function show(e) { var t = e.target.closest && e.target.closest("[data-t]"); if (!t) { tip.hidden = true; return; } var r = el.getBoundingClientRect(), c = t.getBoundingClientRect(); tip.textContent = t.getAttribute("data-t"); tip.hidden = false; var x = c.left + c.width / 2 - r.left, y = c.top - r.top; tip.style.left = Math.max(4, Math.min(r.width - tip.offsetWidth - 4, x - tip.offsetWidth / 2)) + "px"; tip.style.top = Math.max(0, y - tip.offsetHeight - 8) + "px"; }
    el.addEventListener("mousemove", show); el.addEventListener("click", show); el.addEventListener("mouseleave", function () { tip.hidden = true; });
  }
  box.addEventListener("click", function (e) { var b = e.target.closest("[data-s]"); if (!b) return; var d = +b.dataset.s; S = d ? S + d : curS; draw(); });
  var t0 = 0; function later() { clearTimeout(t0); t0 = setTimeout(draw, 300); }
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.some(function (k) { return /^cafesui\.fruit(price|cap)$/.test(k); })) later(); });
  ["skCap", "skPrice"].forEach(function (id) { var el = document.getElementById(id); if (el && window.MutationObserver) new MutationObserver(later).observe(el, { childList: true }); });
  var lw = 0; window.addEventListener("resize", function () { var w = box.clientWidth; if (w && Math.abs(w - lw) > 40) { lw = w; later(); } });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('[data-fp="cap"], .sktab, .tab[data-p="tp12"]')) setTimeout(draw, 80); });
  setTimeout(draw, 400);
})();
