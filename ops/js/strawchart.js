// 📈 과일값 그래프 (11/16 딸기 · 11/17 사장님 「망고값도 · 과일 단가 안에 딸기 망고 따로 · 한번에 알아볼 수 있게 · 최고값 최저값」)
//  재고·발주 → 🍓 과일 → 💰 과일 한도선 · 단가 맨 위 #skStraw — 과일 단추(🍓 딸기 · 🥭 태국망고 · 🥭 애플망고 · 기기 기억 cafesui.ui.fpchart)
//  자료: 과일 단가 기록(cafesui.fruitprice) + 「＋ 값 적기」(cafesui.fruitcap rec) · __CS_FP_LINES(과일 id)
//  달마다 세로 막대 = 그 달 최저 ~ 최고 · 가운데 점 = 평균(수량 가중) · 파란 점선 = 지난해 같은 달 평균 · 회색 점선 = 달별 한도선
(function () {
  var box = document.getElementById("skStraw"); if (!box) return;
  var FR = [
    { id: "f1", ic: "🍓", n: "딸기", unit: "500g 1통", start: 10, mons: [10, 11, 12, 1, 2, 3, 4, 5], note: "시즌 = 10월 ~ 다음 해 5월 · 1kg 값은 500g으로 나눠서" },
    { id: "f2", ic: "🥭", n: "태국망고", unit: "1박스", start: 1, mons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: "1년 내내 · 박스 크기(12 · 14 · 16수)가 섞여 있어요" },
    { id: "f3", ic: "🥭", n: "애플망고", unit: "1박스 (약 4kg)", start: 1, mons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: "1년 내내 · 4kg 8~12과 박스 기준" }
  ];
  var RED = "#C2412D", BLUE = "#4A63C9";
  var cur = "f1"; try { var sv = localStorage.getItem("cafesui.ui.fpchart"); if (sv && FR.some(function (f) { return f.id === sv; })) cur = sv; } catch (e) {}
  var now = new Date(), Y = now.getFullYear(), TM = now.getMonth() + 1;
  function cfg() { return FR.filter(function (f) { return f.id === cur; })[0]; }
  function curSeason(c) { return c.start === 1 ? Y : (TM >= 8 ? Y : Y - 1); }
  var S = curSeason(cfg());
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function won(n) { return Math.round(n).toLocaleString("ko-KR"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function slab(c, s) { return c.start === 1 ? s + "년" : s + "~" + (s + 1) + " 시즌"; }
  function sshort(c, s) { return c.start === 1 ? String(s).slice(2) + "년" : String(s).slice(2) + "~" + String(s + 1).slice(2); }
  function seasonOf(c, d) { var y = +d.slice(0, 4), m = +d.slice(5, 7); if (c.mons.indexOf(m) < 0) return null; return c.start === 1 ? y : (m >= c.start ? y : y - 1); }
  function lines(c) {
    var a = window.__CS_FP_LINES ? window.__CS_FP_LINES(c.id) : [], seen = {}, out = [];
    a.forEach(function (x) { var p = +x.p; if (!p || !x.d || p > 500000) return; var d = String(x.d).slice(0, 10), k = d + "|" + p; if (seen[k]) return; seen[k] = 1; out.push({ d: d, p: p, src: x.src || "", by: x.by || "", q: Number(x.q) || 1 }); });
    return out.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }
  function capOf(c, m) { return window.__CS_FCAP ? window.__CS_FCAP(c.id, m) : 0; }
  function stat(L) { if (!L || !L.length) return null; var q = 0, s = 0, lo = Infinity, hi = 0, dl = "", dh = ""; L.forEach(function (x) { q += x.q; s += x.p * x.q; if (x.p < lo) { lo = x.p; dl = x.d; } if (x.p > hi) { hi = x.p; dh = x.d; } }); return { n: L.length, avg: s / q, lo: lo, hi: hi, dl: dl, dh: dh }; }
  function byMonth(c, s, all) { var by = {}; c.mons.forEach(function (m) { by[m] = []; }); all.forEach(function (x) { if (seasonOf(c, x.d) === s) by[+x.d.slice(5, 7)].push(x); }); return by; }
  function md(d) { return (+d.slice(5, 7)) + "/" + (+d.slice(8, 10)); }
  function pct(a, b) { var d = a - b; return (d >= 0 ? "▲ " : "▼ ") + won(Math.abs(d)) + "원 (" + (d >= 0 ? "+" : "−") + Math.round(Math.abs(d) / b * 100) + "%)"; }
  function draw() {
    var c = cfg(), all = lines(c), A = byMonth(c, S, all), B = byMonth(c, S - 1, all), cs = curSeason(c);
    var ss = {}; all.forEach(function (x) { var s = seasonOf(c, x.d); if (s != null) ss[s] = 1; });
    var minS = Math.min.apply(null, Object.keys(ss).map(Number).concat([cs]));
    var thisM = S === cs && c.mons.indexOf(TM) >= 0 ? TM : null;
    var h = '<div class="fch"><b>📈 과일값 그래프</b><span>값을 적을 때마다 저절로 들어가요 (「＋ 값 적기」 · 거래내역 붙여 넣기) · 달마다 <b>최저 ~ 최고</b> 막대와 <b>평균</b> 점</span></div>' +
      '<div class="stfr" role="tablist" aria-label="과일 고르기">' + FR.map(function (f) { var n = lines(f).length; return '<button type="button" role="tab" data-fr="' + f.id + '" aria-selected="' + (f.id === cur) + '">' + f.ic + " " + f.n + "<small>" + n + "번</small></button>"; }).join("") + "</div>" +
      '<div class="stnav"><button type="button" data-s="-1"' + (S <= minS ? " disabled" : "") + ' aria-label="이전">◀</button><b>' + c.ic + " " + c.n + " · " + slab(c, S) + ' <small>' + esc(c.unit) + ' 값</small></b><button type="button" data-s="1"' + (S >= cs ? " disabled" : "") + ' aria-label="다음">▶</button>' + (S !== cs ? '<button type="button" data-s="0">' + (c.start === 1 ? "올해로" : "이번 시즌으로") + "</button>" : "") + "</div>";
    // 한눈에 — 이번 달 · 최고 · 최저 · 지난해 같은 달
    var sAll = stat([].concat.apply([], c.mons.map(function (m) { return A[m]; })));
    var km = thisM && A[thisM].length ? thisM : (function () { for (var i = c.mons.length - 1; i >= 0; i--) if (A[c.mons[i]].length) return c.mons[i]; return null; })();
    if (sAll) {
      var a = stat(A[km]), b = stat(B[km]), cp = capOf(c, km), over = a && cp && a.avg > cp;
      h += '<div class="sttiles st4">' +
        '<div class="' + (over ? "bad" : cp ? "good" : "") + '"><span>' + km + "월 평균" + (km === thisM ? " · 이번 달" : "") + "</span><b>" + won(a.avg) + "원</b><em>" + (cp ? (over ? "⚠ 한도선 " + won(cp) + "원보다 " + won(a.avg - cp) + "원 비쌈" : "✔ 한도선 " + won(cp) + "원 안") : "입력 " + a.n + "번") + "</em></div>" +
        '<div><span>▲ ' + sshort(c, S) + " 최고값</span><b>" + won(sAll.hi) + "원</b><em>" + md(sAll.dh) + "</em></div>" +
        '<div><span>▼ ' + sshort(c, S) + " 최저값</span><b>" + won(sAll.lo) + "원</b><em>" + md(sAll.dl) + "</em></div>" +
        "<div><span>지난해 " + km + "월 평균</span><b>" + (b ? won(b.avg) + "원" : "—") + "</b><em>" + (a && b ? "지금 " + pct(a.avg, b.avg) : "기록 없음") + "</em></div></div>";
      // 한 줄 정리
      var ms = c.mons.map(function (m) { return [m, stat(A[m])]; }).filter(function (x) { return x[1]; });
      var hiM = ms.slice().sort(function (p, q) { return q[1].avg - p[1].avg; })[0], loM = ms.slice().sort(function (p, q) { return p[1].avg - q[1].avg; })[0];
      if (ms.length > 1) h += '<p class="stsum">📌 ' + esc(slab(c, S)) + "에는 <b>" + hiM[0] + "월이 가장 비쌌고</b>(평균 " + won(hiM[1].avg) + "원) <b>" + loM[0] + "월이 가장 쌌어요</b>(평균 " + won(loM[1].avg) + "원) — 차이 " + won(hiM[1].avg - loM[1].avg) + "원</p>";
    }
    var any = !!sAll;
    h += '<div class="stchart" role="img" aria-label="' + esc(c.n + " " + slab(c, S)) + ' 달마다 최저 최고 평균 그래프"></div>';
    if (!any) h += '<p class="stempty">' + esc(slab(c, S)) + "엔 아직 " + esc(c.n) + "값이 없어요 — 아래 " + esc(c.n) + " 카드의 「＋ 값 적기」로 넣으면 여기 막대가 생겨요</p>";
    h += '<p class="stnote">' + esc(c.note) + "</p>";
    h += '<details class="sttbl"><summary>📋 달마다 숫자로 보기</summary><div class="ztable-wrap"><table><thead><tr><th>달</th><th>입력</th><th>최저</th><th>평균</th><th>최고</th><th>한도선</th><th>지난해 평균</th><th>지난해 대비</th></tr></thead><tbody>' +
      c.mons.map(function (m) { var a = stat(A[m]), b = stat(B[m]), cp = capOf(c, m); return '<tr class="' + (m === thisM ? "now" : "") + '"><th>' + m + "월</th><td>" + (a ? a.n + "번" : "—") + "</td><td>" + (a ? won(a.lo) : "") + '</td><td class="' + (a && cp && a.avg > cp ? "over" : "") + '"><b>' + (a ? won(a.avg) : "") + "</b></td><td>" + (a ? won(a.hi) : "") + "</td><td>" + (cp ? won(cp) : "") + "</td><td>" + (b ? won(b.avg) : "") + "</td><td>" + (a && b ? (a.avg >= b.avg ? "▲ +" : "▼ −") + Math.round(Math.abs(a.avg - b.avg) / b.avg * 100) + "%" : "") + "</td></tr>"; }).join("") +
      "</tbody></table></div></details>";
    box.innerHTML = h;
    svg(box.querySelector(".stchart"), c, A, B, thisM);
  }
  function svg(el, c, A, B, thisM) {
    var M = c.mons, W = Math.max(320, el.clientWidth || box.clientWidth || 700), small = W < 560, H = small ? 280 : 320, ml = small ? 50 : 62, mr = 12, mt = 22, mb = 34;
    var pw = W - ml - mr, ph = H - mt - mb, cw = pw / M.length;
    var vals = [];
    M.forEach(function (m) { A[m].forEach(function (x) { vals.push(x.p); }); var b = stat(B[m]); if (b) vals.push(b.avg); var cp = capOf(c, m); if (cp) vals.push(cp); });
    var mx = Math.max.apply(null, vals.concat([0])), stp = mx <= 25000 ? 5000 : mx <= 60000 ? 10000 : 20000, top = Math.max(stp, Math.ceil(mx * 1.12 / stp) * stp);
    function yv(v) { return mt + ph - v / top * ph; }
    function xm(i) { return ml + cw * i + cw / 2; }
    var g = '<svg viewBox="0 0 ' + W + " " + H + '" width="100%" height="' + H + '" class="stsvg">';
    for (var v = 0; v <= top; v += stp) g += '<line x1="' + ml + '" x2="' + (W - mr) + '" y1="' + yv(v) + '" y2="' + yv(v) + '" class="gr"/><text x="' + (ml - 6) + '" y="' + (yv(v) + 4) + '" class="yl">' + won(v) + "</text>";
    M.forEach(function (m, i) {
      if (m === thisM) g += '<rect x="' + (ml + cw * i) + '" y="' + mt + '" width="' + cw + '" height="' + ph + '" class="nowb"/>';
      g += '<text x="' + xm(i) + '" y="' + (H - 12) + '" class="xl' + (m === thisM ? " now" : "") + '">' + m + "월</text>";
    });
    M.forEach(function (m, i) { var cp = capOf(c, m); if (cp) g += '<line x1="' + (ml + cw * i + 3) + '" x2="' + (ml + cw * (i + 1) - 3) + '" y1="' + yv(cp) + '" y2="' + yv(cp) + '" class="cap"/>'; });
    // 지난해 평균 (파란 점선)
    function path(D) { var pts = []; M.forEach(function (m, i) { var s = stat(D[m]); if (s) pts.push([xm(i), yv(s.avg), m, s, i]); }); var d = "", prev = -9; pts.forEach(function (p) { d += (p[4] === prev + 1 ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); prev = p[4]; }); return { d: d, pts: pts }; }
    var pb = path(B), pa = path(A);
    if (pb.d) g += '<path d="' + pb.d + '" class="lyl" stroke="' + BLUE + '"/>';
    pb.pts.forEach(function (p) { g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" class="lyd" fill="' + BLUE + '" data-t="' + esc("지난해 " + p[2] + "월 평균 " + won(p[3].avg) + "원 · 최저 " + won(p[3].lo) + " · 최고 " + won(p[3].hi)) + '"/>'; });
    // 이번 시즌: 최저~최고 막대 + 평균 점
    var bw = Math.max(10, Math.min(28, cw * 0.42));
    M.forEach(function (m, i) {
      var s = stat(A[m]); if (!s) return; var x = xm(i), y1 = yv(s.hi), y2 = yv(s.lo), cp = capOf(c, m), over = cp && s.avg > cp;
      var tip = m + "월 · 최저 " + won(s.lo) + "원 (" + md(s.dl) + ") · 평균 " + won(s.avg) + "원 · 최고 " + won(s.hi) + "원 (" + md(s.dh) + ") · 입력 " + s.n + "번" + (cp ? " · 한도선 " + won(cp) + (over ? " ⚠ 넘음" : " 안") : "");
      g += '<rect x="' + (x - bw / 2) + '" y="' + y1 + '" width="' + bw + '" height="' + Math.max(4, y2 - y1) + '" rx="' + Math.min(6, bw / 2) + '" class="rng' + (over ? " over" : "") + '" data-t="' + esc(tip) + '"/>';
      if (s.hi !== s.lo) { g += '<text x="' + x + '" y="' + (y1 - 6) + '" class="hil">' + won(s.hi) + "</text>"; g += '<text x="' + x + '" y="' + (y2 + 15) + '" class="lol">' + won(s.lo) + "</text>"; }
    });
    if (pa.d) g += '<path d="' + pa.d + '" class="avl"/>';
    pa.pts.forEach(function (p) { var s = p[3]; g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" class="avd" data-t="' + esc(p[2] + "월 평균 " + won(s.avg) + "원 · 최저 " + won(s.lo) + " · 최고 " + won(s.hi) + " · 입력 " + s.n + "번") + '"/>' + (s.hi === s.lo ? '<text x="' + p[0] + '" y="' + (p[1] - 12) + '" class="hil">' + won(s.avg) + "</text>" : ""); });
    g += "</svg>";
    el.innerHTML = g + '<div class="stleg"><span><i class="k r"></i>' + sshort(c, S) + ' 최저 ~ 최고 (빨간 막대 = 평균이 한도선 넘은 달)</span><span><i class="k a"></i>' + sshort(c, S) + " 평균</span>" + (pb.pts.length ? '<span><i class="k b"></i>' + sshort(c, S - 1) + " 평균</span>" : "") + '<span><i class="k c"></i>달별 한도선</span></div><div class="sttip" hidden></div>';
    var tip = el.querySelector(".sttip");
    function show(e) { var t = e.target.closest && e.target.closest("[data-t]"); if (!t) { tip.hidden = true; return; } var r = el.getBoundingClientRect(), cr = t.getBoundingClientRect(); tip.textContent = t.getAttribute("data-t"); tip.hidden = false; var x = cr.left + cr.width / 2 - r.left, y = cr.top - r.top; tip.style.left = Math.max(4, Math.min(r.width - tip.offsetWidth - 4, x - tip.offsetWidth / 2)) + "px"; tip.style.top = Math.max(0, y - tip.offsetHeight - 8) + "px"; }
    el.addEventListener("mousemove", show); el.addEventListener("click", show); el.addEventListener("mouseleave", function () { tip.hidden = true; });
  }
  box.addEventListener("click", function (e) {
    var f = e.target.closest("[data-fr]"); if (f) { cur = f.dataset.fr; try { localStorage.setItem("cafesui.ui.fpchart", cur); } catch (x) {} S = curSeason(cfg()); draw(); return; }
    var b = e.target.closest("[data-s]"); if (!b) return; var d = +b.dataset.s; S = d ? S + d : curSeason(cfg()); draw();
  });
  var t0 = 0; function later() { clearTimeout(t0); t0 = setTimeout(draw, 300); }
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.some(function (k) { return /^cafesui\.fruit(price|cap)$/.test(k); })) later(); });
  ["skCap", "skPrice"].forEach(function (id) { var el = document.getElementById(id); if (el && window.MutationObserver) new MutationObserver(later).observe(el, { childList: true }); });
  var lw = 0; window.addEventListener("resize", function () { var w = box.clientWidth; if (w && Math.abs(w - lw) > 40) { lw = w; later(); } });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('[data-fp="cap"], .sktab, .tab[data-p="tp12"]')) setTimeout(draw, 80); });
  setTimeout(draw, 400);
})();
