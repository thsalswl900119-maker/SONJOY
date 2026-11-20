// 🍰 케이크 작업 크로스체크 (11/16 사장님 「매주 직원들이 체크 · 크로스체크 체크표시 · 체크하는 순서 · 매주 습관이 되게」)
// 오늘 할 일 미들 「🍓 케이크 파트」 t506 바로 아래 #crBox.
// 순서: ① 시트만 → ② 시트+크림(크림 판단) → ③ 시트+크림+과일(과일 당도) → 🤝 같이 먹은 사람 확인 체크 = 완료.
// 앞 단계를 해야 다음 단계가 눌림. 완료되면 오늘 할 일 t506도 체크(오늘 기록일 때만).
// 습관: 직원별 이번 주 완료 · 🔥 몇 주 연속 · 최근 8주 칸 · 목요일부터 오늘 할 일 맨 위 띠(토요일 빨강).
// 저장: cafesui.cross.<해> = { id: { d, at, who(작업자), w(같이 먹은 사람), s1, s2, s3("HH:MM 누가"), m2(크림 판단), m3(과일 당도), cx:{by, at}, del } } — 더하기만(빼기는 del)
(function () {
  var box = document.getElementById("crBox"); if (!box) return;
  var PRE = "cafesui.cross.", REQ = ["정항아", "박혜빈"], PEOPLE = ["정항아", "박혜빈", "이해선", "사장님"];
  var STEP = [
    ["시트만 먹어보기", ""],
    ["시트+크림 같이 먹어보기", "크림 먹어보고 레시피 조정 판단"],
    ["시트+크림 +과일 같이 먹어보기", "과일당도 체크"]
  ];
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function hm(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nim(n) { return n && n !== "사장님" ? n + "님" : n || ""; }
  function md(s) { var p = String(s).split("-"); return +p[1] + "/" + +p[2]; }
  function load(y) { try { return JSON.parse(localStorage.getItem(PRE + y) || "{}") || {}; } catch (e) { return {}; } }
  function save(y, fn) { var o = load(y); fn(o); try { localStorage.setItem(PRE + y, JSON.stringify(o)); } catch (e) {} }
  function all() {
    var y = new Date().getFullYear(), L = [];
    [y - 1, y].forEach(function (yy) { var o = load(yy); Object.keys(o).forEach(function (k) { var x = o[k]; if (x && x.d && !x.del) L.push(Object.assign({ id: k, y: yy }, x)); }); });
    return L.sort(function (a, b) { return (a.d + a.at) < (b.d + b.at) ? 1 : -1; });
  }
  function done(x) { return !!(x.s1 && x.s2 && x.s3 && x.cx); }
  function monOf(d) { d = new Date(d); d.setHours(0, 0, 0, 0); var w = d.getDay(); d.setDate(d.getDate() - (w === 0 ? 6 : w - 1)); return ymd(d); }
  function addDays(s, n) { var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return ymd(d); }
  function pastView() { return !!document.getElementById("tdPastMsg"); }
  function toast(t) { if (window.__CS_TOAST) window.__CS_TOAST(t); }

  // 사람마다 주별 완료 — 작업자(who)로 끝낸 것만 셈
  function weeks(L) {
    var by = {};
    L.forEach(function (x) { if (!done(x)) return; var w = monOf(x.d); (by[x.who] = by[x.who] || {})[w] = (by[x.who][w] || 0) + 1; });
    return by;
  }
  function streak(map, thisMon) {   // 이번 주가 아직이면 지난주부터 셈
    var n = 0, w = map && map[thisMon] ? thisMon : addDays(thisMon, -7);
    while (map && map[w]) { n++; w = addDays(w, -7); }
    return n;
  }
  function state() {
    var L = all(), wk = weeks(L), tm = monOf(new Date()), dw = new Date().getDay();
    var miss = REQ.filter(function (n) { return !(wk[n] && wk[n][tm]); });
    return { L: L, wk: wk, tm: tm, miss: miss, mid: dw >= 4 || dw === 0, late: dw === 6 };
  }

  // ── 🏯 도장깨기 (11/19 사장님 「게임 도장깨듯 재미적으로 · 루틴이 되고 딱 머리에 박혀 당연히 해야 하는 것처럼」) ──
  // 저장값은 그대로 — 칭호 · 도장 · 배지는 기록에서 계산만 함.
  var COL = { "정항아": "#C45A00", "박혜빈": "#1B5FC1", "이해선": "#8E3BB0", "사장님": "#2E7D32" };
  var LV = [[0, "🥚", "새내기"], [1, "🍞", "시트 견습생"], [4, "🍦", "크림 수련생"], [8, "🍓", "과일 감별사"], [15, "🎂", "맛 지킴이"], [25, "👑", "카페스이 맛 장인"]];
  var GATE = [["🍞", "1관문"], ["🍦", "2관문"], ["🍓", "3관문"], ["🤝", "최종 관문"]];
  var FX = null;
  function lvOf(n) { var i = 0; for (var j = 0; j < LV.length; j++) if (n >= LV[j][0]) i = j; return i; }
  function best(mp) {   // 지금까지 가장 길게 이어진 주
    var ks = Object.keys(mp || {}).sort(), b = 0, c = 0, prev = "";
    ks.forEach(function (w) { c = prev && addDays(prev, 7) === w ? c + 1 : 1; prev = w; if (c > b) b = c; });
    return b;
  }
  function stats(n, S) {
    var mp = S.wk[n] || {}, mine = S.L.filter(function (x) { return done(x) && x.who === n; });
    var first = {}; mine.forEach(function (x) { var w = monOf(x.d); if (!first[w] || x.d < first[w]) first[w] = x.d; });
    var early = Object.keys(first).filter(function (w) { var p = first[w].split("-"), g = new Date(+p[0], +p[1] - 1, +p[2]).getDay(); return g >= 1 && g <= 3; }).length;
    var helps = S.L.filter(function (x) { return done(x) && x.cx && x.cx.by === n && x.who !== n; }).length;
    return { mp: mp, cnt: mp[S.tm] || 0, st: streak(mp, S.tm), best: best(mp), total: mine.length, early: early, helps: helps };
  }
  function mapHtml(act) {
    var dn = act ? [!!act.s1, !!act.s2, !!act.s3, !!act.cx] : [0, 0, 0, 0], cur = act ? dn.indexOf(false) : -1;
    var tx = STEP.map(function (s) { return s; }).concat([["같이 먹은 사람이 「크로스체크 확인」 누르기 = 완료", ""]]);
    var h = '<div class="crmap">' + (act ? '<div class="crmh">▶ 지금 <b>' + GATE[cur][1] + "</b> 도전 중 · " + esc(nim(act.who)) + " + " + esc(nim(act.w)) + "</div>" : "") + "<ol>";
    h += tx.map(function (t, i) {
      return '<li class="crg' + (i === 3 ? " boss" : "") + (dn[i] ? " clr" : "") + (i === cur ? " cur" : "") + '"><span class="crgi" aria-hidden="true">' + GATE[i][0] + '</span><span class="crgn">' + GATE[i][1] + "</span><b>" + esc(t[0]) + "</b>" + (t[1] ? "<em>" + esc(t[1]) + "</em>" : "") + (dn[i] ? '<i class="crstamp" aria-label="깸">깸!</i>' : "") + "</li>";
    }).join("");
    return h + "</ol></div>";
  }
  function teamHtml(S) {
    var all1 = function (w) { return REQ.every(function (n) { return S.wk[n] && S.wk[n][w]; }); };
    var n = 0, w = all1(S.tm) ? S.tm : addDays(S.tm, -7); while (all1(w)) { n++; w = addDays(w, -7); }
    var ok = all1(S.tm);
    return '<div class="crteam' + (ok ? " ok" : "") + '">🏆 <b>이번 주 팀 퀘스트</b> ' + REQ.map(function (p) { var c = S.wk[p] && S.wk[p][S.tm]; return '<span class="' + (c ? "y" : "n") + '">' + esc(nim(p)) + (c ? " ✔" : " ⏳") + "</span>"; }).join("") +
      '<em>' + (ok ? "🎉 팀 도장 획득!" : "둘 다 깨면 팀 도장") + (n ? " · 팀 " + n + "주 연속" : "") + "</em></div>";
  }
  function player(n, S) {
    var t = stats(n, S), li = lvOf(t.total), L0 = LV[li], nx = LV[li + 1];
    var pct = nx ? Math.round((t.total - L0[0]) / (nx[0] - L0[0]) * 100) : 100;
    var w8 = []; for (var i = 7; i >= 0; i--) w8.push(addDays(S.tm, -7 * i));
    var BD = [["🏅", "첫 도장", t.total >= 1], ["🔥", "3주 연속", t.best >= 3], ["💯", "도장 10개", t.total >= 10], ["🤝", "짝꿍 확인 5번", t.helps >= 5], ["🌅", "월~수에 미리 3주", t.early >= 3], ["👑", "8주 연속", t.best >= 8]];
    return '<div class="crpl2' + (t.cnt ? " ok" : "") + '" style="--pc:' + (COL[n] || "#8F5A22") + '"><div class="crpa" aria-hidden="true">' + esc(n.charAt(0)) + '</div><div class="crpb">' +
      '<div class="crpt"><b class="crsn">' + esc(nim(n)) + '</b><span class="crlv">Lv.' + li + " " + L0[1] + " " + L0[2] + "</span>" +
      (t.cnt ? '<span class="crclr">이번 주 CLEAR ✔' + (t.cnt > 1 ? " " + t.cnt + "번" : "") + "</span>" : '<span class="crsno">이번 주 아직</span>') +
      (t.st ? '<span class="crfire">🔥 ' + t.st + "주 연속</span>" : "") + "</div>" +
      '<div class="crxp" role="img" aria-label="다음 칭호까지 ' + pct + '%"><i style="width:' + pct + '%"></i></div>' +
      '<small class="crxpt">🍓 도장 <b>' + t.total + "개</b>" + (nx ? " · 「" + nx[1] + " " + nx[2] + "」까지 " + (nx[0] - t.total) + "개" : " · 최고 칭호") + (t.helps ? " · 🤝 짝꿍 확인 " + t.helps + "번" : "") + "</small>" +
      '<div class="cr8" title="최근 8주 도장판 (왼쪽이 오래된 주)">' + w8.map(function (w) { var on = !!t.mp[w], now = w === S.tm; return '<i class="' + (on ? "on" : "") + (now ? " now" : "") + '" title="' + md(w) + " 주" + (on ? " ✔" : now ? " (이번 주)" : "") + '">' + (on ? "🍓" : now ? "?" : "") + "</i>"; }).join("") + "</div>" +
      '<div class="crbdg">' + BD.map(function (b) { return '<span class="' + (b[2] ? "y" : "n") + '" title="' + esc(b[1]) + (b[2] ? " 획득" : " · 아직") + '">' + (b[2] ? b[0] : "🔒") + " " + esc(b[1]) + "</span>"; }).join("") + "</div></div></div>";
  }
  var GSH = ["시트", "시트+크림", "+과일", "확인"];
  function miniMap(act) {
    var dn = act ? [!!act.s1, !!act.s2, !!act.s3, !!act.cx] : [0, 0, 0, 0], cur = act ? dn.indexOf(false) : -1;
    return '<div class="crmm">' + GATE.map(function (g, i) { return '<span class="crmg' + (dn[i] ? " clr" : "") + (i === cur ? " cur" : "") + '">' + g[0] + " " + GSH[i] + (dn[i] ? " ✔" : "") + "</span>"; }).join('<i aria-hidden="true">→</i>') +
      (act ? '<em>지금 ' + esc(GSH[cur] || "") + " · " + esc(nim(act.who)) + " + " + esc(nim(act.w)) + "</em>" : "") + "</div>";
  }
  function miniPlayer(n, S) {
    var t = stats(n, S), L0 = LV[lvOf(t.total)];
    return '<div class="crmp' + (t.cnt ? " ok" : "") + '" style="--pc:' + (COL[n] || "#8F5A22") + '"><b>' + esc(nim(n)) + "</b>" +
      (t.cnt ? '<span class="y">이번 주 ✔' + (t.cnt > 1 ? " " + t.cnt + "번" : "") + "</span>" : '<span class="n">이번 주 아직</span>') +
      "<small>" + L0[1] + " " + L0[2] + " · 🍓" + t.total + (t.st ? " · 🔥" + t.st + "주" : "") + "</small></div>";
  }
  function teamMini(S) {
    var ok = REQ.every(function (n) { return S.wk[n] && S.wk[n][S.tm]; });
    return '<div class="crmt' + (ok ? " ok" : "") + '">🏆 ' + (ok ? "팀 도장 획득!" : "둘 다 깨면 팀 도장") + "</div>";
  }
  function boom(fx) {
    var o = document.createElement("div"); o.className = "crboom"; o.setAttribute("role", "status");
    o.innerHTML = '<div class="crbs"><span class="crbi">🍓</span><b>도장 쾅!</b><span>' + esc(fx.msg || "이번 주 퀘스트 CLEAR") + "</span></div>";
    box.appendChild(o); o.addEventListener("click", function () { o.remove(); });
    setTimeout(function () { if (o.parentNode) o.remove(); }, 2800);
  }

  function draw() {
    if (box.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    var S = state(), m = me(), td = ymd(new Date());
    var mineOpen = S.L.filter(function (x) { return x.d === td && !done(x) && (x.who === m || x.w === m); });
    var today = S.L.filter(function (x) { return x.d === td; });
    var act = mineOpen[0] || null;
    var h = '<div class="crh"><b>🏯 케이크 맛 도장깨기</b><span>4관문 깨고 🍓 도장</span></div><div class="crmust"><span class="crmst">★</span><b>1주일에 한번씩 <mark>무조건 하기</mark></b><span class="crmst">★</span></div>';
    h += miniMap(act);   /* 11/20 사장님 「더 간략하고 작게」 — 관문은 한 줄 · 선수는 한 줄씩 · 배지 · 도장판은 접어 둠 */
    var PL = REQ.concat(m && REQ.indexOf(m) < 0 && m !== "사장님" ? [m] : []);
    h += '<div class="crmini">' + PL.map(function (n) { return miniPlayer(n, S); }).join("") + teamMini(S) + "</div>";
    if (S.miss.length && S.mid) h += '<p class="crwarn' + (S.late ? " late" : "") + '">⏰ <b>아직: ' + S.miss.map(nim).join(" · ") + "</b>" + (S.late ? " · 오늘(토) 마지막" : "") + "</p>";
    h += '<details class="crmore"><summary>🏅 배지 · 8주 도장판 보기</summary><div class="crplayers">' + PL.map(function (n) { return player(n, S); }).join("") + "</div></details>";
    // 오늘 기록 카드
    h += today.map(card).join("");
    if (!m) h += '<p class="crme">이름을 고르면 「크로스체크 시작」 단추가 생겨요</p>';
    else if (!pastView() && !mineOpen.length) h += '<div class="crstart"><span>⚔ 시작 · 같이 먹을 사람</span>' +
      PEOPLE.filter(function (n) { return n !== m; }).map(function (n) { return '<button type="button" class="crgo" data-w="' + esc(n) + '">' + esc(nim(n)) + (n === "이해선" ? " (엄마)" : "") + "</button>"; }).join("") + "</div>";
    // 이번 주 지난 기록
    var past = S.L.filter(function (x) { return x.d !== td && x.d >= S.tm; });
    if (past.length) h += '<div class="crpast"><div class="crph">이번 주 기록</div>' + past.map(function (x) {
      return '<div class="crpl' + (done(x) ? " ok" : "") + '">' + md(x.d) + " " + esc(nim(x.who)) + " + " + esc(nim(x.w)) + " · " + (done(x) ? "✅ 완료" : "⏳ " + [x.s1, x.s2, x.s3].filter(Boolean).length + "/3" + (x.cx ? "" : " · 확인 전")) +
        (x.m2 ? " · 크림: " + esc(x.m2) : "") + (x.m3 ? " · 과일: " + esc(x.m3) : "") + "</div>";
    }).join("") + "</div>";
    box.innerHTML = h;
    if (FX) { var fx = FX; FX = null; var el = box.querySelector('.crcard[data-id="' + fx.id + '"] [data-s="' + fx.k + '"]'); if (el) el.classList.add("pop"); if (fx.boom) boom(fx); }
    band(S);
  }
  function card(x) {
    var m = me(), boss = m === "사장님", can = boss || x.who === m || x.w === m, ok = done(x);
    var steps = STEP.map(function (s, i) {
      var k = "s" + (i + 1), v = x[k], prev = i === 0 || x["s" + i], dis = !can || !prev || pastView();
      var memo = i === 1 ? '<input type="text" class="crm" data-f="m2" value="' + esc(x.m2 || "") + '" placeholder="크림 판단 (예: 그대로 / 설탕 +10g)"' + (can ? "" : " disabled") + ">" :
        i === 2 ? '<input type="text" class="crm" data-f="m3" value="' + esc(x.m3 || "") + '" placeholder="과일 당도 (예: 딸기 당도 좋음 / 조금 심)"' + (can ? "" : " disabled") + ">" : "";
      return '<div class="crstep' + (v ? " on" : "") + (!prev && !v ? " lock" : "") + '" data-s="' + k + '">' + (v ? '<i class="crstamp" aria-hidden="true">깸!</i>' : "") + '<button type="button" class="crb" data-s="' + k + '"' + (dis && !v ? " disabled" : "") + ' aria-pressed="' + (!!v) + '">' + (v ? "✔" : i + 1) + "</button>" +
        '<span class="crst"><b>' + (i + 1) + ") " + esc(s[0]) + "</b>" + (s[1] ? "<em>" + esc(s[1]) + "</em>" : "") + (v ? '<small>' + esc(v) + "</small>" : !prev ? "<small>앞 단계 먼저</small>" : "") + memo + "</span></div>";
    }).join("");
    var all3 = x.s1 && x.s2 && x.s3, partner = boss || x.w === m;
    var cx = x.cx ? '<div class="crcx on" data-s="cx"><i class="crstamp big" aria-hidden="true">🍓 도장</i>🤝 <b>크로스체크 확인</b> ' + esc(nim(x.cx.by)) + " · " + esc(x.cx.at) + "</div>" :
      '<div class="crcx">' + (!all3 ? "🤝 1) 2) 3)을 다 하면 " + esc(nim(x.w)) + "이 확인" :
        partner && !pastView() ? '<button type="button" class="crcxb">🤝 ' + esc(nim(m === x.w ? m : x.w)) + " 크로스체크 확인</button>" : "🤝 " + esc(nim(x.w)) + " 확인 기다리는 중") + "</div>";
    return '<div class="crcard' + (ok ? " ok" : "") + '" data-id="' + x.id + '" data-y="' + x.y + '"><div class="crch"><b>' + (ok ? "✅ " : "🍰 ") + esc(nim(x.who)) + " + " + esc(nim(x.w)) + "</b><span>" + md(x.d) + " " + esc(x.at) + (ok ? " · 완료" : "") + "</span>" +
      (can && !ok && !pastView() ? '<button type="button" class="crdel" title="잘못 만든 기록 빼기">✕</button>' : "") + "</div>" + steps + cx + "</div>";
  }
  function tick() { var b = document.querySelector('#tp2 .box[data-k="t506"]'); if (b && b.getAttribute("aria-pressed") !== "true" && !pastView()) b.click(); }
  function upd(el, fn) { var c = el.closest(".crcard"); save(+c.dataset.y, function (o) { var x = o[c.dataset.id]; if (x) fn(x); }); return c.dataset.id; }

  box.addEventListener("click", function (e) {
    var t = e.target, m = me(), d = new Date();
    var g = t.closest(".crgo");
    if (g) {
      if (!m) { alert("먼저 이름을 고르세요"); return; }
      var id = "x" + Date.now().toString(36);
      save(d.getFullYear(), function (o) { o[id] = { d: ymd(d), at: hm(d), who: m, w: g.dataset.w }; });
      draw(); toast("🍰 크로스체크 시작 — 1) 시트만 먹어보기부터"); return;
    }
    var b = t.closest(".crb");
    if (b && !b.disabled) {
      var k = b.dataset.s, c0 = b.closest(".crcard").dataset.id;
      upd(b, function (x) {
        if (x[k]) { if (x.cx) return; if (!confirm("이 단계 체크를 풀까요?")) return; var n = +k.slice(1); for (var j = n; j <= 3; j++) delete x["s" + j]; return; }
        x[k] = hm(d) + " " + m; FX = { id: c0, k: k };
      });
      draw();
      return;
    }
    if (t.closest(".crcxb")) {
      var c1 = t.closest(".crcard"), x0 = all().filter(function (y) { return y.id === c1.dataset.id; })[0];
      var S0 = state(), wkr = x0 && x0.who, lv0 = wkr ? lvOf(stats(wkr, S0).total) : 0;
      var cid = upd(t, function (x) { if (x.s1 && x.s2 && x.s3 && !x.cx) x.cx = { by: m, at: md(ymd(d)) + " " + hm(d) }; });
      var x = all().filter(function (y) { return y.id === cid; })[0];
      if (x && done(x) && x.d === ymd(d)) tick();
      if (x && done(x)) { var t1 = stats(x.who, state()), lv1 = lvOf(t1.total); FX = { id: cid, k: "cx", boom: 1, msg: nim(x.who) + " 🍓 도장 " + t1.total + "개째 · 이번 주 퀘스트 CLEAR" + (lv1 > lv0 ? " · 🎉 칭호 UP → " + LV[lv1][1] + " " + LV[lv1][2] : "") }; }
      draw(); toast("✅ 크로스체크 완료 — 오늘 할 일에도 체크했어요"); return;
    }
    if (t.closest(".crdel")) { if (!confirm("이 크로스체크 기록을 뺄까요? (기록은 남고 화면에서만 빠집니다)")) return; upd(t, function (x) { x.del = m + " " + md(ymd(d)) + " " + hm(d); }); draw(); }
  });
  box.addEventListener("change", function (e) {
    var t = e.target; if (!t.classList.contains("crm")) return;
    var f = t.dataset.f, v = t.value.trim(); upd(t, function (x) { x[f] = v; });
  });
  box.addEventListener("focusout", function () { setTimeout(function () { if (!box.contains(document.activeElement)) draw(); }, 50); });

  // 목요일부터 오늘 할 일 맨 위 띠 — 이번 주 아직인 사람 이름
  function band(S) {
    var tp = document.getElementById("tp2"); if (!tp) return;
    var el = tp.querySelector(":scope > .crband"), need = S.mid && S.miss.length;
    if (!need) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.className = "crband"; var m0 = tp.querySelector(":scope > .csmotto"); tp.insertBefore(el, m0 ? m0.nextSibling : tp.firstChild); }
    el.classList.toggle("late", S.late);
    el.innerHTML = "🤝 <b>이번 주 케이크 크로스체크 아직: " + S.miss.map(nim).join(" · ") + "</b>" + (S.late ? " — 오늘(토)이 이번 주 마지막 영업일" : "") + '<button type="button" class="crgoto">체크하러 가기 →</button>';
  }
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".crgoto")) return;
    var st = document.querySelector('#tp2 .stab[data-s="td4"]'); if (st) st.click();
    setTimeout(function () { box.scrollIntoView({ block: "center", behavior: "smooth" }); }, 120);
  });
  window.addEventListener("cs:remote", function () { setTimeout(draw, 200); });
  window.addEventListener("cs:me", function () { setTimeout(draw, 50); });
  draw();
  setInterval(function () { if (!box.contains(document.activeElement)) draw(); }, 600000);
})();
