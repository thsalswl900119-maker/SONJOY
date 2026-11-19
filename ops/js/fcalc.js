// 🧮 과일 주문 계산기 (11/19 사장님 「네이버 예약 + 조각케이크 생산 + 여분 · 과일별 딸기 / 망고 · 매일 계산 · 딸기는 월 · 수 · 금에 사 옴」)
// 한 주(월~토)를 날마다 한 줄로 적고 → 딸기 사는 날마다 묶어 계산: 월 = 월 · 화 쓸 것 / 수 = 수 · 목 / 금 = 금 · 토 (토요일 숫자에 월요일 조각케이크분 포함 · 11/19 사장님)
// 딸기 기준(사장님 · 1통 = 무조건 500g): 한판 1통 · 반짝 0.7 · 미니 0.5 · 토핑 1통에 10~11조각(적게 잡아 10)
// 여분(사장님): 딸기 평일 3~4통 · 주말(금 · 토) 4~5통 → 월 · 수 사는 날 3~4 · 금 사는 날 4~5 (칸에 적으면 그 숫자)
// 망고: 한 주 한 번에(수요일에 목 · 금 · 토 미리 계산하는 것과 같은 묶음) · 한판 3.5알(발주 기준표) · 나머지 기준은 (제안)
// 저장 cafesui.fcalc = { set:{ straw, mango }, d:{ 날짜:{ straw:{whole, mid, mini, pan, top, spare(그 날 여분)}, mango:{…} } }, p:{ 사는 날:{ straw:{spare, stock}, mango:{…} } }, at, by }
(function () {
  var box = document.getElementById("skCalc");
  if (!box) return;
  var KEY = "cafesui.fcalc";
  var FR = {
    straw: { nm: "🍓 딸기", u: "통", pk: "통", pkN: 1, stock: ["딸기"], fx: /딸|생크림|초코|피스타/,
      rows: [["whole", "한판", 1], ["mid", "반짝", 0.7], ["mini", "미니", 0.5], ["pan", "조각케이크 1판 (안에 들어가는 것)", 1, 1]], top: 10 },
    mango: { nm: "🥭 망고", u: "알", pk: "박스", pkN: 12, stock: ["망고 (안 익은 것)", "망고 (익은 것)"], fx: /망고|망한|망반|망미/,
      rows: [["whole", "한판", 3.5], ["mid", "반짝", 2.5, 1], ["mini", "미니", 1.8, 1], ["pan", "조각케이크 1판 (안에 들어가는 것)", 3.5, 1]], top: 0 }
  };
  var OTHER = /멜론|메론|멜한|샤인|무화과|체리|복숭아|보늬|티라미수/;
  var COLS = [["whole", "📅 한판", 1], ["mid", "📅 반짝", 1], ["mini", "📅 미니", 1], ["pan", "🔪 조각(판)"], ["top", "🔪 토핑(조각)"]];
  // 딸기 사는 날: 요일 → [쓰는 날 요일들, 여분]
  var BUY = { 1: { use: [1, 2], sp: [3, 4], nm: "월요일" }, 3: { use: [3, 4], sp: [3, 4], nm: "수요일" }, 5: { use: [5, 6], sp: [4, 5], nm: "금요일" } };
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function canSet() { var m = me(); return m === "사장님" || m === "정항아"; }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; o.d = o.d || {}; o.p = o.p || {}; return o; } catch (e) { return { d: {}, p: {} }; } }
  function save(fn) { var o = load(); fn(o); o.at = new Date().toISOString(); o.by = me(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/,/g, "")); return isFinite(n) ? n : 0; }
  function has(v) { return v !== undefined && v !== null && String(v).trim() !== ""; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function dt(s) { return new Date(s + "T12:00:00"); }
  function add(s, n) { var d = dt(s); d.setDate(d.getDate() + n); return ymd(d); }
  function today() { return ymd(new Date()); }
  function wd(s) { return dt(s).getDay(); }
  function lab(s) { var d = dt(s); return (d.getMonth() + 1) + "/" + d.getDate() + "(" + WD[d.getDay()] + ")"; }
  function monOf(s) { var w = wd(s); return add(s, w === 0 ? 1 : 1 - w); }   // 일요일이면 다음 주 월요일
  function rng(a, b) { return a === b ? String(a) : a + "~" + b; }
  var week = (function () { try { var s = sessionStorage.getItem("cs.fcweek"); if (s && s >= monOf(today())) return s; } catch (e) {} var t = today(); return monOf(wd(t) === 6 && new Date().getHours() >= 15 ? add(t, 2) : t); })();
  var fsel = (function () { try { return localStorage.getItem("cafesui.ui.fcfr") || "straw"; } catch (e) { return "straw"; } })();
  function days() { var a = []; for (var i = 0; i < 6; i++) a.push(add(week, i)); return a; }
  function setOf(o, f) {
    var s = (o.set || {})[f] || {}, F = FR[f], r = {};
    F.rows.forEach(function (x) { var c = has(s[x[0]]); r[x[0]] = c ? num(s[x[0]]) : x[2]; r[x[0] + "_d"] = !c && x[3]; });
    r.top = has(s.top) ? num(s.top) : F.top; r.pkN = has(s.pkN) ? num(s.pkN) : F.pkN; return r;
  }
  function stockNow(f) {
    var d = new Date();
    for (var i = 0; i < 8; i++) {
      try {
        var o = JSON.parse(localStorage.getItem("cafesui.stock." + ymd(d)) || "null");
        if (o && o.stock) { var hv = false, sum = 0; FR[f].stock.forEach(function (n) { if (has(o.stock[n])) { hv = true; sum += num(o.stock[n]); } }); if (hv) return { n: sum, d: ymd(d) }; }
      } catch (e) {}
      d.setDate(d.getDate() - 1);
    }
    return null;
  }
  // 예약 글 한 줄 → { f, k, n }
  function parseLine(t) {
    t = String(t || "");
    var k = /미니|미케/.test(t) ? "mini" : /반짝|중간/.test(t) ? "mid" : /한판|한케|홀|대왕|1호|2호/.test(t) ? "whole" : "";
    if (!k) return null;
    var f = FR.mango.fx.test(t) ? "mango" : OTHER.test(t) ? "" : "straw";
    if (!f) return null;
    var m = t.match(/(\d+)\s*(개|ea|EA)/) || t.match(/[x×*]\s*(\d+)/) || t.match(/수량\s*:?\s*(\d+)/) || t.match(/(?:한판|한케|반짝|미니|케이크)\s*(\d+)(?!\s*[,.:\d]*\s*(원|g|시|분|:))/);
    var n = m ? +m[1] : 1;
    if (!(n > 0 && n < 50)) n = 1;
    return { f: f, k: k, n: n };
  }
  function sysRv(d) {
    var r = { straw: {}, mango: {}, n: 0 };
    try {
      var all = JSON.parse(localStorage.getItem("cafesui.daynotes") || "{}") || {};
      (all[d] || []).forEach(function (x) {
        if (!x || !x.rv) return;
        String(x.rv.item || "").split(/[,·\/]|\s{2,}/).forEach(function (seg) { var p = parseLine(seg); if (p) { r[p.f][p.k] = (r[p.f][p.k] || 0) + p.n; r.n++; } });
      });
    } catch (e) {}
    return r;
  }
  // 하루 필요량 (+ 계산 줄)
  function dayNeed(o, f, d) {
    var s = setOf(o, f), v = ((o.d[d] || {})[f]) || {}, F = FR[f], n = 0, L = [];
    COLS.forEach(function (c) {
      var x = num(v[c[0]]); if (!x) return;
      if (c[0] === "top") { if (s.top > 0) { n += x / s.top; L.push("토핑 " + x + "조각 ÷ " + s.top); } else L.push("⚠ 토핑 " + x + "조각 (기준 비어 계산 안 함)"); return; }
      n += x * s[c[0]]; L.push(c[1].replace(/^\S+ /, "") + " " + x + " × " + s[c[0]]);
    });
    return { n: r1(n), L: L };
  }
  // 11/19 사장님 「그 요일에 바로 여분 입력」 — 날마다 줄의 ➕ 여분 칸(o.d[날짜][과일].spare)
  function daySpare(o, f, ds) { var any = false, sum = 0; ds.forEach(function (d) { var v = ((o.d[d] || {})[f]) || {}; if (has(v.spare)) { any = true; sum += num(v.spare); } }); return any ? r1(sum) : null; }
  // 사는 날 묶음 계산
  function buyCalc(o, f, bd) {
    var B = BUY[wd(bd)], F = FR[f], s = setOf(o, f), pv = ((o.p[bd] || {})[f]) || {}, need = 0, parts = [], uds = [];
    B.use.forEach(function (w) { var d = add(bd, w - wd(bd)), x = dayNeed(o, f, d); uds.push(d); need += x.n; parts.push(lab(d) + " " + x.n + F.u); });
    var ds = daySpare(o, f, uds);
    var sp = ds != null ? [ds, ds] : has(pv.spare) ? [num(pv.spare), num(pv.spare)] : B.sp;
    var first = nextBuy() === bd, st = has(pv.stock) ? { n: num(pv.stock), d: "직접" } : (first ? stockNow(f) : null), hv = st ? st.n : 0;
    var lo = Math.max(0, Math.ceil(need + sp[0] - hv - 1e-9)), hi = Math.max(0, Math.ceil(need + sp[1] - hv - 1e-9));
    return { need: r1(need), parts: parts, sp: sp, spAuto: ds == null && !has(pv.spare), spDay: ds != null, st: st, hv: hv, first: first, lo: lo, hi: hi, s: s };
  }
  function weekCalc(o, f) {   // 망고: 한 주 한 번에
    var F = FR[f], s = setOf(o, f), pv = ((o.p[week] || {})[f]) || {}, need = 0, parts = [];
    days().forEach(function (d) { var x = dayNeed(o, f, d); if (x.n) { need += x.n; parts.push(lab(d) + " " + x.n + F.u); } });
    var ds = daySpare(o, f, days()), sp = ds != null ? ds : has(pv.spare) ? num(pv.spare) : 0, st = has(pv.stock) ? { n: num(pv.stock), d: "직접" } : stockNow(f), hv = st ? st.n : 0;
    var q = Math.max(0, Math.ceil(need + sp - hv - 1e-9));
    return { need: r1(need), parts: parts, sp: sp, st: st, hv: hv, q: q, box: s.pkN > 1 ? Math.ceil(q / s.pkN) : null, s: s };
  }
  function nextBuy() { var t = today(); for (var i = 0; i < 8; i++) { var d = add(t, i); if (BUY[wd(d)]) return d; } return t; }
  function txt(o) {
    var out = ["🧮 과일 주문 계산 · " + lab(week) + " 주"];
    days().filter(function (d) { return BUY[wd(d)]; }).forEach(function (bd) {
      var c = buyCalc(o, "straw", bd);
      if (!c.need && !c.hv) return;
      out.push("🍓 " + lab(bd) + " 딸기 사기: " + c.parts.join(" + ") + " + 여분 " + rng(c.sp[0], c.sp[1]) + "통" + (c.st ? " − 재고 " + c.hv + "통" : "") + " → " + rng(c.lo, c.hi) + "통 (500g)");
    });
    var m = weekCalc(o, "mango");
    if (m.need) out.push("🥭 이번 주 망고: " + m.parts.join(" + ") + (m.sp ? " + 여분 " + m.sp + "알" : "") + (m.st ? " − 재고 " + m.hv + "알" : "") + " → " + m.q + "알" + (m.box != null ? " = " + m.box + "박스" : ""));
    return out.join("\n");
  }
  var open = {}, pasteOpen = false, pasteDay = "";
  function draw() {
    var a = document.activeElement; if (a && box.contains(a) && a.matches("input,textarea,select")) return;
    var o = load(), cs = canSet(), F = FR[fsel], s = setOf(o, fsel), D = days(), nb = nextBuy();
    var h = '<div class="skh">🧮 과일 주문 계산기 <span class="fcsub">날마다 네이버 예약 + 조각케이크 생산을 적으면 → 딸기는 월 · 수 · 금 사는 날마다 (여분 넣고 재고 빼고) 몇 통 살지 나와요</span></div>';
    h += '<div class="fctop"><button type="button" class="fcwk" data-w="-7">◀ 지난 주</button><b>' + lab(D[0]) + ' ~ ' + lab(D[5]) + '</b><button type="button" class="fcwk" data-w="7">다음 주 ▶</button>' + (week !== monOf(today()) ? '<button type="button" class="fcwk" data-w="0">이번 주</button>' : '') +
      '<span class="fcfr">' + Object.keys(FR).map(function (f) { return '<button type="button" class="fcfb' + (f === fsel ? ' on' : '') + '" data-f="' + f + '">' + FR[f].nm + '</button>'; }).join("") + '</span></div>';
    // 날마다 한 줄
    h += '<div class="fctw"><table class="fct"><thead><tr><th>날짜</th>' + COLS.map(function (c) { return '<th>' + c[1] + '<small>' + (c[0] === "top" ? (s.top > 0 ? "1" + F.u + "에 " + s.top : "기준 없음") : "× " + s[c[0]] + F.u) + '</small></th>'; }).join("") + '<th class="fcspth">➕ 여분<small>' + F.u + ' · 그 날</small></th><th>하루 필요</th></tr></thead><tbody>';
    D.forEach(function (d) {
      var v = ((o.d[d] || {})[fsel]) || {}, x = dayNeed(o, fsel, d), rv = sysRv(d)[fsel], rvs = ["whole", "mid", "mini"].filter(function (k) { return rv[k] && String(rv[k]) !== String(v[k] || ""); });
      var cls = (d === today() ? " today" : "") + (BUY[wd(d)] && fsel === "straw" ? " buy" : "") + (d < today() ? " past" : "");
      h += '<tr class="' + cls + '" data-d="' + d + '"><th>' + lab(d) + (BUY[wd(d)] && fsel === "straw" ? '<span class="fcbuyt">🛒 딸기 사는 날</span>' : '') + (wd(d) === 1 ? '<span class="fcmonh">조각은 토요일에 미리 만든 건 빼고</span>' : '') + (wd(d) === 6 ? '<span class="fcmonh">월요일 조각케이크분 포함해서 적기</span>' : '') + (rvs.length ? '<button type="button" class="fcrvput" data-d="' + d + '" title="일지 「📅 예약 넣기」 메모에서 찾은 예약">📒 예약 메모 ' + rvs.map(function (k) { return { whole: "한판", mid: "반짝", mini: "미니" }[k] + " " + rv[k]; }).join(" · ") + ' ← 넣기</button>' : '') + '</th>';
      COLS.forEach(function (c) { h += '<td><input type="number" inputmode="decimal" min="0" step="any" data-d="' + d + '" data-k="' + c[0] + '" value="' + esc(v[c[0]] || "") + '" placeholder="0" aria-label="' + lab(d) + ' ' + c[1] + '"></td>'; });
      h += '<td class="fcsp"><input type="number" inputmode="decimal" min="0" step="any" data-d="' + d + '" data-k="spare" value="' + esc(v.spare || "") + '" placeholder="0" aria-label="' + lab(d) + ' 여분 ' + F.u + '"></td>';
      h += '<td class="fcdn"><b>' + (x.n ? x.n + F.u : "—") + '</b>' + (has(v.spare) && num(v.spare) ? '<small class="fcdsp">+ 여분 ' + r1(num(v.spare)) + F.u + '</small>' : '') + '</td></tr>';
    });
    h += '</tbody></table></div>';
    // 사는 날 카드
    if (fsel === "straw") {
      h += '<div class="fcbuys">';
      D.filter(function (d) { return BUY[wd(d)]; }).forEach(function (bd) {
        var c = buyCalc(o, "straw", bd), B = BUY[wd(bd)], pv = ((o.p[bd] || {}).straw) || {};
        h += '<div class="fcbuy' + (bd === nb ? ' next' : '') + (bd < today() ? ' past' : '') + '" data-b="' + bd + '"><div class="fcbh">🛒 ' + lab(bd) + ' 딸기 사기' + (bd === nb ? ' <span class="fcnext">다음에 살 날</span>' : '') + '</div>';
        h += '<div class="fcbu">' + B.use.map(function (w) { return WD[w]; }).join(" · ") + ' 쓸 것' + (wd(bd) === 5 ? ' (토요일 숫자에 월요일분 포함)' : '') + '</div>';
        h += '<div class="fcbn">' + c.parts.join(" + ") + ' = <b>' + c.need + '통</b></div>';
        h += '<div class="fcbsp">➕ 여분 <b>' + rng(c.sp[0], c.sp[1]) + '통</b> <small>' + (c.spDay ? '(위 표에 날마다 적은 여분 합)' : c.spAuto ? '(자동 · 위 표 「➕ 여분」 칸에 그 날 여분을 적으면 그 숫자)' : '(예전에 적은 여분)') + '</small></div>';
        h += '<label>📦 그날 재고 <input type="number" inputmode="decimal" min="0" step="any" data-b="' + bd + '" data-k="stock" value="' + esc(pv.stock || "") + '" placeholder="' + esc(c.first ? (c.st ? c.st.n + " (재고 기록 " + c.st.d.slice(5).replace("-", "/") + ")" : "재고 기록 없음") : "그날 세서 적기") + '"> 통</label>';
        h += '<div class="fcbr">→ <b>' + rng(c.lo, c.hi) + '통</b> 사기 <small>(500g · ' + rng(r1(c.lo * 0.5), r1(c.hi * 0.5)) + 'kg)</small></div>' + (!c.st ? '<div class="fcbw">⚠ 그날 남은 재고를 적으면 그만큼 빠져요</div>' : '') + '</div>';
      });
      h += '</div>';
    } else {
      var m = weekCalc(o, fsel), pv2 = ((o.p[week] || {})[fsel]) || {};
      h += '<div class="fcbuys"><div class="fcbuy next" data-b="' + week + '"><div class="fcbh">🥭 이번 주 망고 (한 주 한 번에 · 수요일에 목 · 금 · 토 미리 계산)</div><div class="fcbn">' + (m.parts.join(" + ") || "아직 적은 날 없음") + ' = <b>' + m.need + '알</b></div>';
      h += '<div class="fcbsp">➕ 여분 <b>' + m.sp + '알</b> <small>(위 표 「➕ 여분」 칸에 날마다 적은 합)</small></div>';
      h += '<label>📦 지금 재고 <input type="number" inputmode="decimal" min="0" step="any" data-b="' + week + '" data-k="stock" value="' + esc(pv2.stock || "") + '" placeholder="' + esc(m.st ? m.st.n + " (재고 기록 " + m.st.d.slice(5).replace("-", "/") + ")" : "재고 기록 없음") + '"> 알</label>';
      h += '<div class="fcbr">→ <b>' + m.q + '알</b>' + (m.box != null ? ' = <b>' + m.box + '박스</b> <small>(1박스 ' + m.s.pkN + '알)</small>' : '') + '</div></div></div>';
    }
    // 네이버 예약 붙여 넣기
    h += '<details class="fcpaste"' + (pasteOpen ? " open" : "") + '><summary>📋 네이버 예약 목록 붙여 넣기 → 개수 세기 <small>(네이버는 시스템이 직접 못 봐요 · 그 날 목록을 복사해 붙여 넣기)</small></summary>' +
      '<label class="fcpd">어느 날 예약? <select class="fcpday">' + D.map(function (d) { return '<option value="' + d + '"' + ((pasteDay || nb) === d ? ' selected' : '') + '>' + lab(d) + '</option>'; }).join("") + '</select></label>' +
      '<textarea class="fcpin" rows="4" placeholder="네이버 예약 관리에서 그 날 예약 목록을 복사해 붙여 넣기 (상품 이름 · 수량이 들어 있으면 돼요)"></textarea><button type="button" class="fcpgo">개수 세기 → 그 날 예약 칸에 넣기</button><span class="fcpres"></span></details>';
    // 기준
    h += '<details class="fcset"' + (open[fsel] ? " open" : "") + '><summary>⚙ ' + F.nm + ' 레시피 기준 (' + F.u + ')' + (cs ? '' : ' · 사장님 · 정항아님만 고침') + '</summary><div class="fcsg">';
    F.rows.forEach(function (x) { h += '<label><span>' + x[1] + (s[x[0] + "_d"] ? ' <i>(제안 · 확인)</i>' : '') + '</span><input type="number" step="any" min="0" data-s="' + x[0] + '" value="' + s[x[0]] + '"' + (cs ? '' : ' disabled') + '><em>' + F.u + '</em></label>'; });
    h += '<label><span>토핑 1' + F.u + '에 올리는 조각 수</span><input type="number" step="any" min="0" data-s="top" value="' + (s.top || "") + '" placeholder="정하기"' + (cs ? '' : ' disabled') + '><em>조각</em></label>';
    if (fsel === "mango") h += '<label><span>1박스에 몇 알</span><input type="number" step="1" min="1" data-s="pkN" value="' + s.pkN + '"' + (cs ? '' : ' disabled') + '><em>알</em></label>';
    h += '</div></details>';
    h += '<div class="fcbtns"><button type="button" class="fccopy">📋 계산 글 복사 (발주 · 단톡방)</button>' + (o.at ? '<span class="fcat">마지막 입력 ' + esc(o.by || "") + ' · ' + new Date(o.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + '</span>' : '') + '</div>';
    box.innerHTML = h;
  }
  function putCounts(d, cnt) {
    save(function (o) { o.d[d] = o.d[d] || {}; ["straw", "mango"].forEach(function (f) { var x = cnt[f]; if (!x) return; o.d[d][f] = o.d[d][f] || {}; ["whole", "mid", "mini"].forEach(function (k) { if (x[k]) o.d[d][f][k] = String(x[k]); }); }); });
    draw();
  }
  var tm = null;
  box.addEventListener("input", function (e) {
    var t = e.target, k = t.dataset.k, sk = t.dataset.s;
    if (k && t.dataset.d) save(function (o) { var d = t.dataset.d; o.d[d] = o.d[d] || {}; o.d[d][fsel] = o.d[d][fsel] || {}; o.d[d][fsel][k] = t.value; });
    else if (k && t.dataset.b) save(function (o) { var b = t.dataset.b; o.p[b] = o.p[b] || {}; o.p[b][fsel] = o.p[b][fsel] || {}; o.p[b][fsel][k] = t.value; });
    else if (sk && canSet()) save(function (o) { o.set = o.set || {}; o.set[fsel] = o.set[fsel] || {}; o.set[fsel][sk] = t.value; });
    else return;
    clearTimeout(tm); tm = setTimeout(function () {
      var sel = k ? 'input[data-k="' + k + '"]' + (t.dataset.d ? '[data-d="' + t.dataset.d + '"]' : '[data-b="' + t.dataset.b + '"]') : 'input[data-s="' + sk + '"]';
      var pos = t.value.length; t.blur(); draw(); var n = box.querySelector(sel); if (n) { n.focus(); try { n.type = "text"; n.setSelectionRange(pos, pos); n.type = "number"; } catch (er) {} }
    }, 700);
  });
  box.addEventListener("change", function (e) { if (e.target.classList.contains("fcpday")) pasteDay = e.target.value; });
  box.addEventListener("toggle", function (e) { var d = e.target; if (!d.classList) return; if (d.classList.contains("fcset")) open[fsel] = d.open; if (d.classList.contains("fcpaste")) pasteOpen = d.open; }, true);
  box.addEventListener("click", function (e) {
    var t = e.target, b;
    if ((b = t.closest(".fcwk"))) { var w = +b.dataset.w; week = w ? add(week, w) : monOf(today()); try { sessionStorage.setItem("cs.fcweek", week); } catch (er) {} draw(); }
    if ((b = t.closest(".fcfb"))) { fsel = b.dataset.f; try { localStorage.setItem("cafesui.ui.fcfr", fsel); } catch (er) {} draw(); }
    if ((b = t.closest(".fcrvput"))) { var d = b.dataset.d; if (confirm(lab(d) + " 예약 칸(한판 · 반짝 · 미니)을 일지 예약 메모 숫자로 넣을까요?")) putCounts(d, sysRv(d)); }
    if (t.closest(".fcpgo")) {
      var ta = box.querySelector(".fcpin"), pd = box.querySelector(".fcpday").value, cnt = { straw: {}, mango: {} }, n = 0, skip = 0;
      String(ta.value || "").split(/\n+/).forEach(function (ln) { if (!ln.trim()) return; var p = parseLine(ln); if (p) { cnt[p.f][p.k] = (cnt[p.f][p.k] || 0) + p.n; n++; } else if (/케이크|한판|미니|반짝/.test(ln)) skip++; });
      var msg = ["straw", "mango"].map(function (f) { var x = cnt[f], q = []; if (x.whole) q.push("한판 " + x.whole); if (x.mid) q.push("반짝 " + x.mid); if (x.mini) q.push("미니 " + x.mini); return q.length ? FR[f].nm + " " + q.join(" · ") : ""; }).filter(Boolean).join(" / ");
      if (!n) { box.querySelector(".fcpres").textContent = "예약 줄을 못 찾았어요 — 상품 이름(한판 · 반짝 · 미니)이 들어 있는지 봐 주세요"; return; }
      if (confirm(lab(pd) + " 찾은 예약: " + msg + (skip ? "\n(다른 과일 케이크 " + skip + "줄은 뺐어요)" : "") + "\n\n그 날 예약 칸에 넣을까요?")) { pasteOpen = false; putCounts(pd, cnt); }
    }
    if (t.closest(".fccopy")) {
      var s = txt(load());
      (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(function () { if (window.__CS_TOAST) window.__CS_TOAST("계산 글을 복사했어요"); else alert("복사했어요"); }, function () { prompt("아래 글을 복사하세요", s); });
    }
  });
  window.addEventListener("cs:remote", function () { setTimeout(draw, 300); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp12"], .sktab[data-c="sk0"]')) setTimeout(draw, 200); }, true);
  window.__CS_FCALC = { text: function () { return txt(load()); }, parse: parseLine, buy: function (f, d) { return buyCalc(load(), f, d); } };
  draw();
})();
