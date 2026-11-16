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

  function draw() {
    if (box.contains(document.activeElement) && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    var S = state(), m = me(), td = ymd(new Date());
    var mineOpen = S.L.filter(function (x) { return x.d === td && !done(x) && (x.who === m || x.w === m); });
    var today = S.L.filter(function (x) { return x.d === td; });
    var h = '<div class="crh"><b>🤝 케이크 크로스체크 · 이번 주</b><span>작업할 때마다 · 순서대로 눌러서 체크 → 같이 먹은 사람이 마지막에 확인</span></div>';
    // 순서 안내
    h += '<ol class="crord">' + STEP.map(function (s, i) { return "<li><b>" + (i + 1) + ")</b> " + esc(s[0]) + (s[1] ? "<em>" + esc(s[1]) + "</em>" : "") + "</li>"; }).join("") +
      '<li class="crx"><b>🤝</b> 같이 먹은 사람이 「크로스체크 확인」 누르기 = 완료</li></ol>';
    // 직원별 이번 주 · 연속 주 · 최근 8주
    var weeks8 = []; for (var i = 7; i >= 0; i--) weeks8.push(addDays(S.tm, -7 * i));
    h += '<div class="crstaff">' + REQ.concat(m && REQ.indexOf(m) < 0 && m !== "사장님" ? [m] : []).map(function (n) {
      var mp = S.wk[n] || {}, cnt = mp[S.tm] || 0, st = streak(mp, S.tm);
      return '<div class="crsr' + (cnt ? " ok" : "") + '"><b class="crsn">' + esc(nim(n)) + "</b>" +
        (cnt ? '<span class="crsok">✔ 이번 주 ' + cnt + "번</span>" : '<span class="crsno">이번 주 아직</span>') +
        (st ? '<span class="crfire">🔥 ' + st + "주 연속</span>" : "") +
        '<span class="cr8" title="최근 8주 (왼쪽이 오래된 주)">' + weeks8.map(function (w) { var on = !!mp[w], now = w === S.tm; return '<i class="' + (on ? "on" : "") + (now ? " now" : "") + '" title="' + md(w) + " 주" + (on ? " ✔" : "") + '"></i>'; }).join("") + "</span></div>";
    }).join("") + "</div>";
    if (S.miss.length && S.mid) h += '<p class="crwarn' + (S.late ? " late" : "") + '">⏰ <b>이번 주 크로스체크 아직: ' + S.miss.map(nim).join(" · ") + "</b>" + (S.late ? " — 오늘(토)이 이번 주 마지막 영업일" : " — 케이크 작업할 때 같이 먹어 보고 체크해 주세요") + "</p>";
    // 오늘 기록 카드
    h += today.map(card).join("");
    if (!m) h += '<p class="crme">이름을 고르면 「크로스체크 시작」 단추가 생겨요</p>';
    else if (!pastView() && !mineOpen.length) h += '<div class="crstart"><span>🍰 오늘 케이크 작업 크로스체크 — 같이 먹을 사람</span>' +
      PEOPLE.filter(function (n) { return n !== m; }).map(function (n) { return '<button type="button" class="crgo" data-w="' + esc(n) + '">' + esc(nim(n)) + (n === "이해선" ? " (엄마)" : "") + "</button>"; }).join("") + "</div>";
    // 이번 주 지난 기록
    var past = S.L.filter(function (x) { return x.d !== td && x.d >= S.tm; });
    if (past.length) h += '<div class="crpast"><div class="crph">이번 주 기록</div>' + past.map(function (x) {
      return '<div class="crpl' + (done(x) ? " ok" : "") + '">' + md(x.d) + " " + esc(nim(x.who)) + " + " + esc(nim(x.w)) + " · " + (done(x) ? "✅ 완료" : "⏳ " + [x.s1, x.s2, x.s3].filter(Boolean).length + "/3" + (x.cx ? "" : " · 확인 전")) +
        (x.m2 ? " · 크림: " + esc(x.m2) : "") + (x.m3 ? " · 과일: " + esc(x.m3) : "") + "</div>";
    }).join("") + "</div>";
    box.innerHTML = h;
    band(S);
  }
  function card(x) {
    var m = me(), boss = m === "사장님", can = boss || x.who === m || x.w === m, ok = done(x);
    var steps = STEP.map(function (s, i) {
      var k = "s" + (i + 1), v = x[k], prev = i === 0 || x["s" + i], dis = !can || !prev || pastView();
      var memo = i === 1 ? '<input type="text" class="crm" data-f="m2" value="' + esc(x.m2 || "") + '" placeholder="크림 판단 (예: 그대로 / 설탕 +10g)"' + (can ? "" : " disabled") + ">" :
        i === 2 ? '<input type="text" class="crm" data-f="m3" value="' + esc(x.m3 || "") + '" placeholder="과일 당도 (예: 딸기 당도 좋음 / 조금 심)"' + (can ? "" : " disabled") + ">" : "";
      return '<div class="crstep' + (v ? " on" : "") + (!prev && !v ? " lock" : "") + '"><button type="button" class="crb" data-s="' + k + '"' + (dis && !v ? " disabled" : "") + ' aria-pressed="' + (!!v) + '">' + (v ? "✔" : i + 1) + "</button>" +
        '<span class="crst"><b>' + (i + 1) + ") " + esc(s[0]) + "</b>" + (s[1] ? "<em>" + esc(s[1]) + "</em>" : "") + (v ? '<small>' + esc(v) + "</small>" : !prev ? "<small>앞 단계 먼저</small>" : "") + memo + "</span></div>";
    }).join("");
    var all3 = x.s1 && x.s2 && x.s3, partner = boss || x.w === m;
    var cx = x.cx ? '<div class="crcx on">🤝 <b>크로스체크 확인</b> ' + esc(nim(x.cx.by)) + " · " + esc(x.cx.at) + "</div>" :
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
      var k = b.dataset.s;
      upd(b, function (x) {
        if (x[k]) { if (x.cx) return; if (!confirm("이 단계 체크를 풀까요?")) return; var n = +k.slice(1); for (var j = n; j <= 3; j++) delete x["s" + j]; return; }
        x[k] = hm(d) + " " + m;
      });
      draw();
      return;
    }
    if (t.closest(".crcxb")) {
      var cid = upd(t, function (x) { if (x.s1 && x.s2 && x.s3 && !x.cx) x.cx = { by: m, at: md(ymd(d)) + " " + hm(d) }; });
      var x = all().filter(function (y) { return y.id === cid; })[0];
      if (x && done(x) && x.d === ymd(d)) tick();
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
    var st = document.querySelector('#tp2 .stab[data-s="td1"]'); if (st) st.click();
    setTimeout(function () { box.scrollIntoView({ block: "center", behavior: "smooth" }); }, 120);
  });
  window.addEventListener("cs:remote", function () { setTimeout(draw, 200); });
  window.addEventListener("cs:me", function () { setTimeout(draw, 50); });
  draw();
  setInterval(function () { if (!box.contains(document.activeElement)) draw(); }, 600000);
})();
