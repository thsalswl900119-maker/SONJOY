// 📈 과일값 그래프 (11/16 딸기 · 11/17 망고 · 11/18 사장님 「그래프 더 눈에 가독성 있게 · 한눈에 알아보기 쉽게」 → 달마다 한 줄 가로 막대로 다시 짬)
//  재고·발주 → 🍓 과일 → 💰 과일 한도선 · 단가 맨 위 #skStraw — 과일 단추(🍓 딸기 · 🥭 태국망고 · 🥭 애플망고 · 기기 기억 cafesui.ui.fpchart)
//  자료: 과일 단가 기록(cafesui.fruitprice) + 「＋ 값 적기」(cafesui.fruitcap rec) · __CS_FP_LINES(과일 id) — 적힌 값 그대로 (반박스 줄은 뺌)
//  한 줄 = 한 달: 빨간 막대 = 그 달 가장 싼 값 ~ 가장 비싼 값 · 흰 점 = 평균 · 검은 점선 = 한도선 · 파란 막대 = 지난해(지난 시즌) 같은 달
(function () {
  var box = document.getElementById("skStraw"); if (!box) return;
  var FR = [
    { id: "f1", ic: "🍓", n: "딸기", unit: "500g 1통", start: 10, mons: [10, 11, 12, 1, 2, 3, 4, 5], note: "시즌 = 10월 ~ 다음 해 5월 · 500g 1통 값 그대로 (1kg 값은 「🍓 딸기 1kg」에 따로)" },
    { key: "f1k", id: "f1", u: "1kg", ic: "🍓", n: "딸기 1kg", unit: "1kg", start: 10, mons: [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9], note: "1kg로 산 것만 · 1kg 값 그대로 (여름딸기 · 밀양 딸기밭 · 1kg 팩 — 500g으로 나누지 않음) · 한도선은 500g 기준이라 여기엔 없음" },
    { id: "f2", ic: "🥭", n: "태국망고", unit: "1박스", start: 1, mons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: "1년 내내 · 박스 크기(12 · 14 · 16수)가 섞여 있어요 · 반박스는 뺌" },
    { id: "f3", ic: "🥭", n: "애플망고", unit: "1박스 (약 4kg)", start: 1, mons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], note: "1년 내내 · 4kg 8~12과 박스 기준" }
  ];
  FR.forEach(function (f) { if (!f.key) f.key = f.id; f.g = f.id === "f1" ? "st" : "mg"; });
  // 11/19 사장님 「과일별 단가 / 딸기 계절별 단가분석 / 망고 계절별 단가분석 / 과일달력」 — 그래프 하나를 딸기 · 망고 칸으로 옮겨 가며 씀
  var GRP = "st"; try { if (localStorage.getItem("cafesui.ui.skfpart") === "mg") GRP = "mg"; } catch (e) {}
  var LAST = { st: "f1", mg: "f2" };
  var cur = "f1"; try { var sv = localStorage.getItem("cafesui.ui.fpchart"); if (sv && FR.some(function (f) { return f.key === sv; })) cur = sv; } catch (e) {}
  FR.forEach(function (f) { if (f.key === cur) LAST[f.g] = cur; });
  cur = LAST[GRP];
  function place() { var sl = document.querySelector('.stslot[data-g="' + GRP + '"]'); if (sl && box.parentNode !== sl) sl.appendChild(box); }
  window.__CS_STGRP = function (g) { if (g !== "st" && g !== "mg") return; if (g !== GRP) { GRP = g; cur = LAST[g]; PICK = null; S = curSeason(cfg()); } place(); draw(); };
  var now = new Date(), Y = now.getFullYear(), TM = now.getMonth() + 1;
  function cfg() { return FR.filter(function (f) { return f.key === cur; })[0]; }
  function curSeason(c) { return c.start === 1 ? Y : (TM >= 8 ? Y : Y - 1); }
  var S = curSeason(cfg()), PICK = null;
  function won(n) { return Math.round(n).toLocaleString("ko-KR"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function slab(c, s) { return c.start === 1 ? s + "년" : s + "~" + (s + 1) + " 시즌"; }
  function sshort(c, s) { return c.start === 1 ? String(s).slice(2) + "년" : String(s).slice(2) + "~" + String(s + 1).slice(2) + " 시즌"; }
  function seasonOf(c, d) { var y = +d.slice(0, 4), m = +d.slice(5, 7); if (c.mons.indexOf(m) < 0) return null; return c.start === 1 ? y : (m >= c.start ? y : y - 1); }
  function lines(c) {
    var a = window.__CS_FP_LINES ? window.__CS_FP_LINES(c.id) : [], seen = {}, out = [];
    a.forEach(function (x) {
      if ((x.u || "") !== (c.u || "")) return;   // 반박스 · 1kg는 따로 (적힌 값 그대로)
      var p = +x.p; if (!p || !x.d || p > 500000) return; var d = String(x.d).slice(0, 10), k = d + "|" + p; if (seen[k]) return; seen[k] = 1;
      out.push({ d: d, p: p, src: x.src || "", n: x.n || "", by: x.by || "", q: Number(x.q) || 1 });
    });
    return out.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  }
  function capOf(c, m) { return c.u ? 0 : window.__CS_FCAP ? window.__CS_FCAP(c.id, m) : 0; }
  function stat(L) { if (!L || !L.length) return null; var q = 0, s = 0, lo = null, hi = null; L.forEach(function (x) { q += x.q; s += x.p * x.q; if (!lo || x.p < lo.p) lo = x; if (!hi || x.p > hi.p) hi = x; }); return { n: L.length, avg: s / q, lo: lo.p, hi: hi.p, dl: lo.d, dh: hi.d, xl: lo, xh: hi }; }
  function byMonth(c, s, all) { var by = {}; c.mons.forEach(function (m) { by[m] = []; }); all.forEach(function (x) { if (seasonOf(c, x.d) === s) by[+x.d.slice(5, 7)].push(x); }); return by; }
  function md(d) { return (+d.slice(5, 7)) + "/" + (+d.slice(8, 10)); }
  function where(x) { var t = (x.n || "") + " " + (x.src || ""); return /칠성/.test(t) ? "칠성" : /엄궁/.test(t) ? "엄궁" : /여름딸기/.test(t) ? "여름딸기" : x.src === "값 적기" ? "값 적기" + (x.by ? " · " + x.by : "") : ""; }
  function draw() {
    var c = cfg(), all = lines(c), A = byMonth(c, S, all), B = byMonth(c, S - 1, all), cs = curSeason(c);
    var ss = {}; all.forEach(function (x) { var s = seasonOf(c, x.d); if (s != null) ss[s] = 1; });
    var minS = Math.min.apply(null, Object.keys(ss).map(Number).concat([cs]));
    var thisM = S === cs && c.mons.indexOf(TM) >= 0 ? TM : null;
    var h = '<div class="fch"><b>' + (GRP === "mg" ? "🥭 망고 계절별 단가 분석" : "🍓 딸기 계절별 단가 분석") + '</b><span>값을 적을 때마다 저절로 들어가요 · <b>막대 하나 = 그 달 평균 값</b></span></div>' +
      '<div class="stfr" role="tablist" aria-label="과일 고르기">' + FR.filter(function (f) { return f.g === GRP; }).map(function (f) { var n = lines(f).length; return '<button type="button" role="tab" data-fr="' + f.key + '" aria-selected="' + (f.key === cur) + '">' + f.ic + " " + f.n + "<small>" + n + "번</small></button>"; }).join("") + "</div>" +
      '<div class="stnav"><button type="button" data-s="-1"' + (S <= minS ? " disabled" : "") + ' aria-label="이전">◀</button><b>' + c.ic + " " + c.n + " · " + slab(c, S) + ' <small>' + esc(c.unit) + ' 값</small></b><button type="button" data-s="1"' + (S >= cs ? " disabled" : "") + ' aria-label="다음">▶</button>' + (S !== cs ? '<button type="button" data-s="0">' + (c.start === 1 ? "올해로" : "이번 시즌으로") + "</button>" : "") + "</div>";
    var sAll = stat([].concat.apply([], c.mons.map(function (m) { return A[m]; })));
    var ms = c.mons.filter(function (m) { return A[m].length; });
    var km = PICK && A[PICK] && A[PICK].length ? PICK : thisM && A[thisM].length ? thisM : ms[ms.length - 1];
    if (sAll) {
      var a = stat(A[km]), cp = capOf(c, km), over = a && cp && a.avg > cp;
      var same = function (v) { var ds = []; all.forEach(function (x) { if (x.p === v && seasonOf(c, x.d) === S && ds.indexOf(md(x.d)) < 0) ds.push(md(x.d)); }); return ds; };
      var dH = same(sAll.hi), dL = same(sAll.lo);
      // 큰 숫자 3칸 — 가장 비쌌을 때 · 가장 쌌을 때 · 이 달 평균
      h += '<div class="stbig st2">' +
        '<div class="hi"><span>🔺 ' + sshort(c, S) + " 가장 비쌌을 때</span><b>" + won(sAll.hi) + "<small>원</small></b><em>" + (dH.length > 1 ? dH.join(" · ") + " (" + dH.length + "번)" : md(sAll.dh) + (where(sAll.xh) ? " · " + esc(where(sAll.xh)) : "")) + "</em></div>" +
        '<div class="lo"><span>🔻 ' + sshort(c, S) + " 가장 쌌을 때</span><b>" + won(sAll.lo) + "<small>원</small></b><em>" + (dL.length > 1 ? dL.join(" · ") + " (" + dL.length + "번)" : md(sAll.dl) + (where(sAll.xl) ? " · " + esc(where(sAll.xl)) : "")) + "</em></div>" +
        "</div>";
      // 쉬운 말 정리 (11/18 사장님 「그래프 가독성 쉽게」)
      var b0 = stat(B[km]), say = [];
      say.push("<b>" + km + "월" + (km === thisM ? "(이번 달)" : "") + " 평균 " + won(a.avg) + "원</b>" + (cp ? (over ? " — 한도선 " + won(cp) + "원보다 <em class=\"ov\">" + won(a.avg - cp) + "원 비싸요</em>" : " — 한도선 " + won(cp) + "원 <em class=\"ok\">안이에요</em>") : ""));
      if (b0) { var dd = a.avg - b0.avg; say.push("작년 " + km + "월 평균은 " + won(b0.avg) + "원 → 올해가 <b>" + won(Math.abs(dd)) + "원 " + (dd >= 0 ? "더 비싸요" : "더 싸요") + "</b> (" + (dd >= 0 ? "+" : "−") + Math.round(Math.abs(dd) / b0.avg * 100) + "%)"); }
      if (ms.length > 1) {
        var hiM = ms.slice().sort(function (p, q) { return stat(A[q]).avg - stat(A[p]).avg; })[0], loM = ms.slice().sort(function (p, q) { return stat(A[p]).avg - stat(A[q]).avg; })[0];
        say.push(esc(sshort(c, S)) + "엔 <b>" + hiM + "월이 가장 비쌌고</b> <b>" + loM + "월이 가장 쌌어요</b>");
      }
      h += '<ul class="stsay">' + say.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>";
    }
    // 달마다 세로 막대 하나 = 그 달 평균 (11/18 · 가로 막대 · 점 · 점선이 겹쳐 헷갈리던 것을 바꿈)
    var cols = c.mons.filter(function (m) { return A[m].length || B[m].length; });
    if (cols.length) {
      var vals = [0];
      cols.forEach(function (m) { var a1 = stat(A[m]), b1 = stat(B[m]), cp1 = capOf(c, m); if (a1) vals.push(a1.avg); if (b1) vals.push(b1.avg); if (cp1) vals.push(cp1); });
      var top = Math.max.apply(null, vals) * 1.18 || 1;
      var pc = function (v) { return (v / top * 100).toFixed(2) + "%"; };
      h += '<div class="stcols" role="list" aria-label="' + esc(c.n + " " + slab(c, S)) + ' 달마다 평균 값">';
      cols.forEach(function (m) {
        var a = stat(A[m]), b = stat(B[m]), cp = capOf(c, m), over = a && cp && a.avg > cp;
        var tip = m + "월 · " + (a ? "평균 " + won(a.avg) + "원 · 가장 쌀 때 " + won(a.lo) + "원 · 가장 비쌀 때 " + won(a.hi) + "원 · " + a.n + "번" : sshort(c, S) + " 기록 없음") + (b ? " / 작년 평균 " + won(b.avg) + "원" : "") + (cp ? " / 한도선 " + won(cp) + "원" : "");
        h += '<div class="stc' + (m === thisM ? " now" : "") + (m === km ? " pick" : "") + (a ? "" : " noa") + '" role="listitem" data-m="' + m + '" tabindex="0" title="' + esc(tip) + '">' +
          '<div class="stcp">' +
          (b ? '<div class="stcb ly" style="height:' + pc(b.avg) + '"></div>' : "") +
          (a ? '<div class="stcb ty' + (over ? " over" : "") + '" style="height:' + pc(a.avg) + '"><b>' + (over ? "⚠ " : "") + won(a.avg) + "</b></div>" : '<div class="stcna">기록<br>없음</div>') +
          (cp ? '<div class="stccap" style="bottom:' + pc(cp) + '"></div>' : "") + "</div>" +
          '<div class="stcm"><b>' + m + "월</b>" + (m === thisM ? "<small>이번 달</small>" : "") + "</div>" +
          '<div class="stcv">' + (a ? (a.lo === a.hi ? "<span>" + won(a.lo) + "</span>" : '<span class="lo"><small>싸게</small>' + won(a.lo) + '</span><span class="hi"><small>비싸게</small>' + won(a.hi) + "</span>") : "") + (b ? '<span class="lyv"><small>작년</small>' + won(b.avg) + "</span>" : "") + "</div></div>";
      });
      h += "</div>";
      h += '<div class="stleg3"><span><i class="k ty"></i>' + esc(sshort(c, S)) + ' 평균</span><span><i class="k over"></i>⚠ 한도선보다 비쌈</span><span><i class="k ly"></i>작년 같은 달 평균</span>' + (c.u ? "" : '<span><i class="k cap"></i>한도선 (이보다 높으면 비싸게 산 것)</span>') + '<span class="tip">막대를 누르면 그 달에 들어온 값이 아래에 나와요' + (cols.length > 4 ? " · 휴대폰은 막대를 옆으로 밀면 다른 달도 보여요" : "") + '</span></div>';
    }
    if (!sAll) h += '<p class="stempty">' + esc(slab(c, S)) + "엔 아직 " + esc(c.n) + "값이 없어요 — 아래 " + esc(c.n) + " 카드의 「＋ 값 적기」로 넣으면 여기 막대가 생겨요</p>";
    // 고른 달에 들어온 값 — 달력 모양 (11/19 사장님 「캘린더처럼」)
    if (km && A[km].length) {
      var yy = c.start === 1 ? S : (km >= c.start ? S : S + 1), first = new Date(yy, km - 1, 1), nd = new Date(yy, km, 0).getDate(), td0 = new Date();
      var byD = {}; A[km].forEach(function (x) { (byD[+x.d.slice(8, 10)] = byD[+x.d.slice(8, 10)] || []).push(x); });
      var info = function (x) { return c.id === "f1" ? (x.q > 1 && c.u ? x.q + "kg · " : "") + (x.n || where(x) || "") : (x.q > 1 ? x.q + "박스 · " : "") + (x.n || where(x) || ""); };
      var cells = ""; for (var b0i = 0; b0i < first.getDay(); b0i++) cells += '<div class="stcd blank"></div>';
      for (var dd2 = 1; dd2 <= nd; dd2++) {
        var wd = new Date(yy, km - 1, dd2).getDay(), xs = byD[dd2] || [], isT = td0.getFullYear() === yy && td0.getMonth() === km - 1 && td0.getDate() === dd2;
        cells += '<div class="stcd' + (wd === 0 ? " sun" : wd === 6 ? " sat" : "") + (xs.length ? " has" : "") + (isT ? " today" : "") + '"><span class="stcdn">' + dd2 + (isT ? " 오늘" : "") + "</span>" +
          xs.map(function (x) { return '<div class="stcdv' + (x.p === sAll.hi ? " hi" : x.p === sAll.lo ? " lo" : "") + '" title="' + esc(md(x.d) + " " + won(x.p) + "원 · " + info(x)) + '"><b>' + won(x.p) + "<small>원</small></b><em>" + esc(info(x)) + "</em></div>"; }).join("") + "</div>";
      }
      var ac = stat(A[km]);
      h += '<div class="stlist stcalw"><b>🗓 ' + yy + "년 " + km + "월에 들어온 값 " + A[km].length + "번 <small>(평균 " + won(ac.avg) + "원 · 위 막대를 누르면 그 달로 바뀌어요)</small></b>" +
        '<div class="stcal"><div class="stcwh">' + ["일", "월", "화", "수", "목", "금", "토"].map(function (w, i) { return '<span class="' + (i === 0 ? "sun" : i === 6 ? "sat" : "") + '">' + w + "</span>"; }).join("") + "</div>" +
        '<div class="stcg">' + cells + "</div></div>" +
        '<div class="stcleg"><span class="hi">빨간 칸 = ' + esc(sshort(c, S)) + ' 가장 비쌌던 값</span><span class="lo">파란 칸 = 가장 쌌던 값</span></div></div>';
    }
    h += '<p class="stnote">' + esc(c.note) + "</p>";
    box.innerHTML = h;
    var cw = box.querySelector(".stcols"), pk = cw && cw.querySelector(".stc.pick");   // 고른 달(이번 달)이 보이게 옆으로 밀어 둠
    if (pk && cw.scrollWidth > cw.clientWidth) cw.scrollLeft = Math.max(0, pk.offsetLeft - cw.clientWidth / 2 + pk.offsetWidth / 2);
  }
  box.addEventListener("click", function (e) {
    var f = e.target.closest("[data-fr]"); if (f) { cur = f.dataset.fr; LAST[GRP] = cur; PICK = null; try { localStorage.setItem("cafesui.ui.fpchart", cur); } catch (x) {} S = curSeason(cfg()); draw(); return; }
    var r = e.target.closest(".stc[data-m]"); if (r) { PICK = +r.dataset.m; draw(); return; }
    var b = e.target.closest("[data-s]"); if (!b) return; var d = +b.dataset.s; S = d ? S + d : curSeason(cfg()); PICK = null; draw();
  });
  box.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { var r = e.target.closest && e.target.closest(".stc[data-m]"); if (r) { e.preventDefault(); PICK = +r.dataset.m; draw(); } } });
  var t0 = 0; function later() { clearTimeout(t0); t0 = setTimeout(draw, 300); }
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.some(function (k) { return /^cafesui\.fruit(price|cap)$/.test(k); })) later(); });
  ["skCap", "skPrice"].forEach(function (id) { var el = document.getElementById(id); if (el && window.MutationObserver) new MutationObserver(later).observe(el, { childList: true }); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.skfp, .sktab, .tab[data-p="tp12"]')) setTimeout(draw, 80); });
  setTimeout(function () { place(); draw(); }, 400);
})();
