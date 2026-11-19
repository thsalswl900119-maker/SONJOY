// 🧮 과일 주문 계산기 (11/19 사장님 「네이버 예약으로 들어온 수량 + 조각케이크 생산 갯수 + 여분 · 과일별(딸기 · 망고) · 재고 섹션에」)
// 딸기 기준(사장님 11/19 · 1통 = 무조건 500g): 한판 1통 · 반짝 0.7통 · 미니 0.5통 · 토핑 1통에 10~11조각(적게 잡아 10)
// 여분(사장님): 딸기 평일 3~4통 · 주말(금 · 토) 4~5통 — 칸을 비우면 그 날 요일로 저절로 · 토요일은 월요일 조각케이크 생산분이 미리 들어감(칸 따로)
// 망고 기준: 발주 기준표 「망고 한판 12수짜리 3.5개」 · 나머지는 (제안) — 기준은 사장님 · 정항아님이 고치면 그 값
// 저장 cafesui.fcalc = { set:{ straw:{…}, mango:{…} }, d:{ 날짜:{ straw:{…입력}, mango:{…} } }, at, by }
(function () {
  var box = document.getElementById("skCalc");
  if (!box) return;
  var KEY = "cafesui.fcalc";
  var FR = {
    straw: { nm: "🍓 딸기", u: "통", pk: "통", pkN: 1, stock: ["딸기"], spare: [[3, 4], [4, 5]], fx: /딸|생크림|초코|피스타|딸가득/,
      rows: [["whole", "한판 케이크", 1], ["mid", "반짝 케이크", 0.7], ["mini", "미니 케이크", 0.5], ["pan", "조각케이크 1판 (안에 들어가는 것)", 1, 1]], top: 10 },
    mango: { nm: "🥭 망고", u: "알", pk: "박스", pkN: 12, stock: ["망고 (안 익은 것)", "망고 (익은 것)"], spare: null, fx: /망고|망한|망반|망미/,
      rows: [["whole", "한판 케이크", 3.5], ["mid", "반짝 케이크", 2.5, 1], ["mini", "미니 케이크", 1.8, 1], ["pan", "조각케이크 1판 (안에 들어가는 것)", 3.5, 1]], top: 0 }
  };
  var OTHER = /멜론|메론|멜한|샤인|무화과|체리|복숭아|밤|보늬|티라미수|말차(?!.*딸)/;
  var INS = [["whole", "한판 예약", "개", 1], ["mid", "반짝 예약", "개", 1], ["mini", "미니 예약", "개", 1], ["pan", "조각케이크 생산", "판"], ["top", "토핑 올릴 조각", "조각"]];
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function canSet() { var m = me(); return m === "사장님" || m === "정항아"; }
  function load() { try { var o = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; o.d = o.d || {}; return o; } catch (e) { return { d: {} }; } }
  function save(fn) { var o = load(); fn(o); o.at = new Date().toISOString(); o.by = me(); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function num(v) { var n = parseFloat(String(v == null ? "" : v).replace(/,/g, "")); return isFinite(n) ? n : 0; }
  function has(v) { return v !== undefined && v !== null && String(v).trim() !== ""; }
  function r1(n) { return Math.round(n * 10) / 10; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { return ymd(new Date()); }
  function tomorrow() { var d = new Date(); d.setDate(d.getDate() + 1); if (d.getDay() === 0) d.setDate(d.getDate() + 1); return ymd(d); }
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  function wd(day) { return new Date(day + "T12:00:00").getDay(); }
  function lab(day) { var p = day.split("-"); return +p[1] + "/" + +p[2] + "(" + WD[wd(day)] + ")"; }
  var day = (function () { try { var s = sessionStorage.getItem("cs.fcday"); if (s && s >= today()) return s; } catch (e) {} return tomorrow(); })();
  function setOf(o, f) {
    var s = (o.set || {})[f] || {}, F = FR[f], r = {};
    F.rows.forEach(function (x) { var c = has(s[x[0]]); r[x[0]] = c ? num(s[x[0]]) : x[2]; r[x[0] + "_d"] = !c && x[3]; });
    r.top = has(s.top) ? num(s.top) : F.top; r.pkN = has(s.pkN) ? num(s.pkN) : F.pkN; return r;
  }
  // 지금 재고 — 오늘부터 7일 안 가장 최근 재고 기록의 그 과일 칸 합
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
  // 예약 글 한 줄 → { f, k, n } (한판 · 반짝 · 미니 · 수량) — 일지 「📅 예약 넣기」 품목 · 네이버 예약 붙여 넣기 둘 다
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
    var r = { straw: {}, mango: {}, lines: 0 };
    try {
      var all = JSON.parse(localStorage.getItem("cafesui.daynotes") || "{}") || {};
      (all[d] || []).forEach(function (x) {
        if (!x || !x.rv) return;
        String(x.rv.item || "").split(/[,·\/]|\s{2,}/).forEach(function (seg) { var p = parseLine(seg); if (p) { r[p.f][p.k] = (r[p.f][p.k] || 0) + p.n; r.lines++; } });
      });
    } catch (e) {}
    return r;
  }
  function spareOf(f, v, d) {
    if (has(v.spare)) return { lo: num(v.spare), hi: num(v.spare), auto: false };
    var S = FR[f].spare; if (!S) return { lo: 0, hi: 0, auto: false };
    var w = wd(d), s = (w === 5 || w === 6) ? S[1] : S[0];
    return { lo: s[0], hi: s[1], auto: true, wk: (w === 5 || w === 6) };
  }
  function calc(o, f, d) {
    var s = setOf(o, f), v = ((o.d[d] || {})[f]) || {}, F = FR[f], L = [], need = 0;
    INS.forEach(function (x) {
      var c = num(v[x[0]]); if (!c) return;
      if (x[0] === "top") { if (s.top > 0) { need += c / s.top; L.push("토핑 " + c + "조각 ÷ " + s.top + " = " + r1(c / s.top) + F.u); } else L.push("⚠ 토핑 " + c + "조각 — 「토핑 1" + F.u + "에 몇 조각」 기준이 비어 계산에 안 넣음"); return; }
      need += c * s[x[0]]; L.push(x[1] + " " + c + " × " + s[x[0]] + " = " + r1(c * s[x[0]]) + F.u);
    });
    if (wd(d) === 6) {
      var mp = num(v.monPan), mt = num(v.monTop);
      if (mp) { need += mp * s.pan; L.push("월요일분 조각케이크 " + mp + "판 × " + s.pan + " = " + r1(mp * s.pan) + F.u); }
      if (mt && s.top > 0) { need += mt / s.top; L.push("월요일분 토핑 " + mt + "조각 ÷ " + s.top + " = " + r1(mt / s.top) + F.u); }
    }
    var sp = spareOf(f, v, d);
    var st = has(v.stock) ? { n: num(v.stock), d: "직접 적음" } : stockNow(f), hv = st ? st.n : 0;
    var lo = Math.max(0, Math.ceil(need + sp.lo - hv - 1e-9)), hi = Math.max(0, Math.ceil(need + sp.hi - hv - 1e-9));
    return { s: s, L: L, need: r1(need), sp: sp, have: hv, st: st, lo: lo, hi: hi, pkLo: s.pkN > 1 ? Math.ceil(lo / s.pkN) : null, pkHi: s.pkN > 1 ? Math.ceil(hi / s.pkN) : null };
  }
  function rng(a, b) { return a === b ? String(a) : a + "~" + b; }
  function txt(o) {
    var out = ["🧮 과일 주문 계산 · " + lab(day) + " 쓸 것"];
    Object.keys(FR).forEach(function (f) {
      var c = calc(o, f, day), F = FR[f];
      if (!c.L.length && !c.sp.hi) return;
      out.push("", F.nm); c.L.forEach(function (l) { out.push("· " + l); });
      if (c.sp.hi) out.push("· 여분 " + rng(c.sp.lo, c.sp.hi) + F.u + (c.sp.auto ? (c.sp.wk ? " (주말 기준)" : " (평일 기준)") : ""));
      out.push("= 필요 " + rng(r1(c.need + c.sp.lo), r1(c.need + c.sp.hi)) + F.u + " − 재고 " + c.have + F.u + " → 주문 " + rng(c.lo, c.hi) + F.u + (f === "straw" ? " (1통 = 500g)" : "") + (c.pkLo != null ? " = " + rng(c.pkLo, c.pkHi) + F.pk : ""));
    });
    return out.join("\n");
  }
  var open = {}, pasteOpen = false;
  function draw() {
    var a = document.activeElement; if (a && box.contains(a) && a.matches("input,textarea")) return;
    var o = load(), cs = canSet(), sat = wd(day) === 6, rv = sysRv(day);
    var h = '<div class="skh">🧮 과일 주문 계산기 <span class="fcsub">네이버 예약 + 조각케이크 생산 + 여분 − 재고 = 주문할 양</span></div>';
    h += '<div class="fcday"><label>📅 쓰는 날 <input type="date" class="fcdin" value="' + day + '"></label> <b>' + lab(day) + '</b>' + (sat ? ' <span class="fcsat">토요일 — 월요일 조각케이크 생산분도 미리 넣어 주세요</span>' : (wd(day) === 5 ? ' <span class="fcwk">금요일 — 여분 주말 기준(4~5통)</span>' : '')) + '</div>';
    var rvTxt = ["straw", "mango"].map(function (f) { var x = rv[f], p = []; if (x.whole) p.push("한판 " + x.whole); if (x.mid) p.push("반짝 " + x.mid); if (x.mini) p.push("미니 " + x.mini); return p.length ? FR[f].nm + " " + p.join(" · ") : ""; }).filter(Boolean).join(" / ");
    h += '<div class="fcrv"><div>📒 시스템 예약 메모(일지 「📅 예약 넣기」)에서 ' + lab(day) + ' 찾은 것: <b>' + (rvTxt || "없음") + '</b>' + (rvTxt ? ' <button type="button" class="fcrvput">← 예약 칸에 넣기</button>' : '') + '</div>';
    h += '<div class="fcrvn">⚠ 네이버 예약은 시스템이 직접 못 봐요 — 네이버 예약 화면에서 그 날 목록을 복사해 아래에 붙여 넣으면 한판 · 반짝 · 미니를 세어 줘요.</div>';
    h += '<details class="fcpaste"' + (pasteOpen ? " open" : "") + '><summary>📋 네이버 예약 목록 붙여 넣기 → 개수 세기</summary><textarea class="fcpin" rows="4" placeholder="네이버 예약 관리 화면에서 그 날 예약 목록을 길게 눌러 복사 → 여기에 붙여 넣기 (상품 이름 · 수량이 들어 있으면 돼요)"></textarea><button type="button" class="fcpgo">개수 세기 → 예약 칸에 넣기</button><span class="fcpres"></span></details></div>';
    h += '<div class="fccalc">';
    Object.keys(FR).forEach(function (f) {
      var F = FR[f], c = calc(o, f, day), v = ((o.d[day] || {})[f]) || {};
      h += '<div class="fcc" data-f="' + f + '"><div class="fcch">' + F.nm + ' <small>(' + (f === "straw" ? "1통 = 무조건 500g" : "단위 알 · 1박스 " + c.s.pkN + "알") + ')</small></div><div class="fcci">';
      INS.forEach(function (x) {
        var hint = x[0] === "top" ? (c.s.top > 0 ? "1" + F.u + "에 " + c.s.top + "조각" : "기준 비어 있음") : "× " + c.s[x[0]] + F.u;
        h += '<label' + (x[3] ? ' class="fcrvk"' : '') + '><span>' + (x[3] ? "📅 " : "🔪 ") + x[1] + '</span><input type="number" inputmode="decimal" min="0" step="any" data-k="' + x[0] + '" value="' + esc(v[x[0]] || "") + '" placeholder="0"><em>' + x[2] + ' · ' + hint + '</em></label>';
      });
      if (sat) {
        h += '<label class="fcmon"><span>🗓 월요일분 조각케이크</span><input type="number" inputmode="decimal" min="0" step="any" data-k="monPan" value="' + esc(v.monPan || "") + '" placeholder="0"><em>판 · × ' + c.s.pan + F.u + '</em></label>';
        h += '<label class="fcmon"><span>🗓 월요일분 토핑</span><input type="number" inputmode="decimal" min="0" step="any" data-k="monTop" value="' + esc(v.monTop || "") + '" placeholder="0"><em>조각</em></label>';
      }
      var sph = F.spare ? (c.sp.auto ? rng(c.sp.lo, c.sp.hi) + " (" + (c.sp.wk ? "주말" : "평일") + " 기준 · 자동)" : "") : "0";
      h += '<label class="fcsp"><span>➕ 여분 (당일 · 긴급)</span><input type="number" inputmode="decimal" min="0" step="any" data-k="spare" value="' + esc(v.spare || "") + '" placeholder="' + esc(sph) + '"><em>' + F.u + (F.spare ? ' · 비우면 평일 3~4 · 금토 4~5' : '') + '</em></label>';
      var sh = c.st && !has(v.stock) ? c.st.n + " (재고 기록 " + c.st.d.slice(5).replace("-", "/") + ")" : (c.st ? "" : "재고 기록 없음");
      h += '<label class="fcstk"><span>📦 지금 재고</span><input type="number" inputmode="decimal" min="0" step="any" data-k="stock" value="' + esc(v.stock || "") + '" placeholder="' + esc(sh) + '"><em>' + F.u + ' · 비우면 재고 기록에서</em></label></div>';
      h += '<div class="fccr' + (c.hi ? ' go' : '') + '"><div class="fccn">필요 <b>' + rng(r1(c.need + c.sp.lo), r1(c.need + c.sp.hi)) + F.u + '</b> <small>(예약 · 생산 ' + c.need + ' + 여분 ' + rng(c.sp.lo, c.sp.hi) + ')</small> − 재고 <b>' + c.have + F.u + '</b></div><div class="fcco">→ 주문 <b>' + rng(c.lo, c.hi) + F.u + '</b>' + (c.pkLo != null ? ' <small>= ' + rng(c.pkLo, c.pkHi) + F.pk + '</small>' : '') + '</div>' + (c.L.length ? '<ul>' + c.L.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join("") + '</ul>' : '') + '</div>';
      h += '<details class="fcset"' + (open[f] ? " open" : "") + '><summary>⚙ 레시피 기준 (' + F.u + ')' + (cs ? '' : ' · 사장님 · 정항아님만 고침') + '</summary><div class="fcsg">';
      F.rows.forEach(function (x) { h += '<label><span>' + x[1] + (c.s[x[0] + "_d"] ? ' <i>(제안 · 확인)</i>' : '') + '</span><input type="number" step="any" min="0" data-s="' + x[0] + '" value="' + c.s[x[0]] + '"' + (cs ? '' : ' disabled') + '><em>' + F.u + '</em></label>'; });
      h += '<label><span>토핑 1' + F.u + '에 올리는 조각 수</span><input type="number" step="any" min="0" data-s="top" value="' + (c.s.top || "") + '" placeholder="정하기"' + (cs ? '' : ' disabled') + '><em>조각</em></label>';
      if (f === "mango") h += '<label><span>1박스에 몇 알</span><input type="number" step="1" min="1" data-s="pkN" value="' + c.s.pkN + '"' + (cs ? '' : ' disabled') + '><em>알</em></label>';
      h += '</div></details></div>';
    });
    h += '</div><div class="fcbtns"><button type="button" class="fccopy">📋 계산 글 복사 (발주 · 단톡방)</button><button type="button" class="fcclr">🧹 이 날 입력 비우기</button>' + (o.at ? '<span class="fcat">마지막 입력 ' + esc(o.by || "") + ' · ' + new Date(o.at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + '</span>' : '') + '</div>';
    box.innerHTML = h;
  }
  function putCounts(cnt) {
    save(function (o) { o.d[day] = o.d[day] || {}; ["straw", "mango"].forEach(function (f) { var x = cnt[f]; if (!x) return; o.d[day][f] = o.d[day][f] || {}; ["whole", "mid", "mini"].forEach(function (k) { if (x[k]) o.d[day][f][k] = String(x[k]); }); }); });
    draw();
  }
  var tm = null;
  box.addEventListener("input", function (e) {
    var t = e.target, cc = t.closest(".fcc"); if (!cc) return;
    var f = cc.dataset.f;
    if (t.dataset.k) save(function (o) { o.d[day] = o.d[day] || {}; o.d[day][f] = o.d[day][f] || {}; o.d[day][f][t.dataset.k] = t.value; });
    else if (t.dataset.s && canSet()) save(function (o) { o.set = o.set || {}; o.set[f] = o.set[f] || {}; o.set[f][t.dataset.s] = t.value; });
    else return;
    clearTimeout(tm); tm = setTimeout(function () { var kind = t.dataset.k ? "k" : "s", k = t.dataset[kind]; t.blur(); draw(); var n = box.querySelector('.fcc[data-f="' + f + '"] input[data-' + kind + '="' + k + '"]'); if (n) n.focus(); }, 600);
  });
  box.addEventListener("change", function (e) { if (e.target.classList.contains("fcdin") && e.target.value) { day = e.target.value; try { sessionStorage.setItem("cs.fcday", day); } catch (er) {} e.target.blur(); draw(); } });
  box.addEventListener("toggle", function (e) { var d = e.target; if (!d.classList) return; if (d.classList.contains("fcset")) open[d.closest(".fcc").dataset.f] = d.open; if (d.classList.contains("fcpaste")) pasteOpen = d.open; }, true);
  box.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest(".fcrvput")) { var r = sysRv(day); if (confirm(lab(day) + " 예약 칸(한판 · 반짝 · 미니)을 시스템 예약 메모 숫자로 넣을까요? (이미 적은 숫자는 바뀌어요)")) putCounts(r); }
    if (t.closest(".fcpgo")) {
      var ta = box.querySelector(".fcpin"), cnt = { straw: {}, mango: {} }, n = 0, skip = 0;
      String(ta.value || "").split(/\n+/).forEach(function (ln) { if (!ln.trim()) return; var p = parseLine(ln); if (p) { cnt[p.f][p.k] = (cnt[p.f][p.k] || 0) + p.n; n++; } else if (/케이크|한판|미니|반짝/.test(ln)) skip++; });
      var msg = ["straw", "mango"].map(function (f) { var x = cnt[f], q = []; if (x.whole) q.push("한판 " + x.whole); if (x.mid) q.push("반짝 " + x.mid); if (x.mini) q.push("미니 " + x.mini); return q.length ? FR[f].nm + " " + q.join(" · ") : ""; }).filter(Boolean).join(" / ");
      if (!n) { box.querySelector(".fcpres").textContent = "예약 줄을 못 찾았어요 — 상품 이름(한판 · 반짝 · 미니)이 들어 있는지 봐 주세요"; return; }
      if (confirm("찾은 예약: " + msg + (skip ? "\n(다른 과일 케이크 " + skip + "줄은 뺐어요)" : "") + "\n\n" + lab(day) + " 예약 칸에 넣을까요?")) { pasteOpen = false; putCounts(cnt); }
    }
    if (t.closest(".fccopy")) {
      var s = txt(load());
      (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(function () { if (window.__CS_TOAST) window.__CS_TOAST("계산 글을 복사했어요"); else alert("복사했어요"); }, function () { prompt("아래 글을 복사하세요", s); });
    }
    if (t.closest(".fcclr") && confirm(lab(day) + " 입력 칸(예약 · 조각 · 토핑 · 여분 · 재고)을 비울까요? 기준은 그대로예요.")) { save(function (o) { o.d[day] = {}; }); draw(); }
  });
  window.addEventListener("cs:remote", function () { setTimeout(draw, 300); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp12"], .sktab[data-c="sk0"]')) setTimeout(draw, 200); }, true);
  window.__CS_FCALC = { calc: function (f, d) { return calc(load(), f, d || day); }, text: function () { return txt(load()); }, parse: parseLine };
  draw();
})();
