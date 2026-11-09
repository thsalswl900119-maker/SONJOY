/* 11/9 · 워크샵 비용 — 「일차별 한눈에」(어디에 무엇을 썼는지) + 「공금 잔액 · 맞춰 보기」
   지출 표 칸(app.js가 저장)과 잔액 칸(fund0 · fundp · bal<d>t/k/n — 같은 cafesui.ws.<해>)을 읽어서 그리기만 한다. */
(function () {
  "use strict";
  var CATS = [["food", "🍽", "식사"], ["snack", "☕", "카페 · 간식 · 물"], ["move", "🚕", "교통"], ["shop", "🎁", "오미야게 · 쇼핑"], ["stay", "🧳", "짐 · 숙소"], ["split", "👥", "1/n 나눠 준 돈"], ["etc", "📦", "기타"]];
  var CN = {}; CATS.forEach(function (c) { CN[c[0]] = c; });
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function f(n) { return Math.round(n).toLocaleString("ko-KR"); }
  function sg(n) { return (n > 0 ? "+" : n < 0 ? "−" : "±") + f(Math.abs(n)); }
  function num(k) { var el = document.querySelector('#tp9 .wsin[data-k="' + k + '"]'); if (!el) return null; var r = String(el.value || "").replace(/[,\s¥￥엔원]/g, ""); if (r === "") return null; var v = parseFloat(r); return isNaN(v) ? null : v; }
  function txt(k) { var el = document.querySelector('#tp9 .wsin[data-k="' + k + '"]'); return el ? String(el.value || "").trim() : ""; }
  function dayLabel(d) {
    var v = txt("d" + d + "date"), m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
    if (!m) return "";
    var dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return (+m[2]) + "/" + (+m[3]) + "(" + WD[dt.getDay()] + ")";
  }
  function people() {
    var p = num("fundp"); if (p) return p;
    var w3 = txt("w3"), m = /(\d+)\s*명/.exec(w3); return m ? +m[1] : 0;
  }
  function rows(d) {
    var t = document.querySelector('#tp9 .wstable.cost[data-cd="' + d + '"]'); if (!t || !window.__CS_WSROW) return [];
    return Array.prototype.slice.call(t.querySelectorAll("tbody tr")).map(window.__CS_WSROW).filter(function (r) { return r && (r.a != null || r.n); });
  }
  function dayData(d) {
    var R = rows(d), o = { d: d, yen: 0, card: 0, cash: 0, other: 0, krw: [], bal: [], cat: {}, items: {}, n: 0 };
    R.forEach(function (r) {
      if (r.a == null) return;
      if (r.cur === "bal") { o.bal.push(r); return; }
      if (r.cur === "krw") { o.krw.push(r); return; }
      o.yen += r.a; o.n++;
      if (r.pay === "card") o.card += r.a; else if (r.pay === "cash") o.cash += r.a; else o.other += r.a;
      o.cat[r.cat] = (o.cat[r.cat] || 0) + r.a;
      (o.items[r.cat] = o.items[r.cat] || []).push(r);
    });
    return o;
  }
  function payTag(p) { return p === "card" ? '<i class="wgp card">💳</i>' : p === "cash" ? '<i class="wgp cash">💴</i>' : ""; }
  function short(s) { s = String(s || "").replace(/\s*\(손글씨[^)]*\)/, ""); return s.length > 26 ? s.slice(0, 26) + "…" : s; }

  function glance(D) {
    var box = document.getElementById("wsGlance"); if (!box) return;
    var all = { yen: 0, cat: {} }, krw = [];
    D.forEach(function (o) { all.yen += o.yen; CATS.forEach(function (c) { all.cat[c[0]] = (all.cat[c[0]] || 0) + (o.cat[c[0]] || 0); }); krw = krw.concat(o.krw); });
    if (!all.yen && !krw.length) { box.innerHTML = '<div class="wgempty">지출 표에 금액을 적으면 여기에 일차별로 「어디에 · 무엇을 · 얼마」가 한눈에 정리됩니다.</div>'; return; }
    var h = '<div class="wgh">📊 일차별 한눈에 <span>지출 표에 적으면 저절로 정리돼요 · 금액 앞 ¥ / ₩ 단추로 엔 · 원을 나눠요(누르면 바뀜) · 종류는 이름으로 나눔(택시 → 교통 · 커피 · 빵 → 카페 · 간식 …) · 💳 충전카드 / 💴 공금 현금은 메모 기준</span></div>';
    // 전체 종류 띠
    h += '<div class="wgall"><b>2박 3일 엔 지출 ¥' + f(all.yen) + '</b><div class="wgbar">' + CATS.map(function (c) {
      var v = all.cat[c[0]] || 0; if (!v) return "";
      return '<span class="wgseg c-' + c[0] + '" style="flex:' + v + '" title="' + c[2] + ' ¥' + f(v) + '"></span>';
    }).join("") + '</div><div class="wgleg">' + CATS.map(function (c) {
      var v = all.cat[c[0]] || 0; if (!v) return "";
      return '<span><i class="wgdot c-' + c[0] + '"></i>' + c[1] + " " + c[2] + ' <b>¥' + f(v) + '</b> ' + Math.round(v / all.yen * 100) + '%</span>';
    }).join("") + '</div>' + (krw.length ? '<div class="wgkrw">₩ 원화로 쓴 돈 (엔 합계에 안 넣음): ' + krw.map(function (r) { return esc(short(r.n || r.m)) + " ₩" + f(r.a); }).join(" · ") + '</div>' : '') + '</div>';
    h += '<div class="wgdays">' + D.map(function (o) {
      if (!o.yen && !o.bal.length) return '<div class="wgday empty"><div class="wgdh"><b>' + o.d + '일차</b><span>' + esc(dayLabel(o.d)) + '</span></div><p class="wgnone">아직 적은 지출 없음</p></div>';
      var max = 0; CATS.forEach(function (c) { max = Math.max(max, o.cat[c[0]] || 0); });
      var paid = (o.card ? '<span class="wgpay card">💳 충전카드 ¥' + f(o.card) + '</span>' : '') + (o.cash ? '<span class="wgpay cash">💴 공금 현금 ¥' + f(o.cash) + '</span>' : '') + (o.other ? '<span class="wgpay">결제 안 적음 ¥' + f(o.other) + '</span>' : '');
      return '<div class="wgday"><div class="wgdh"><b>' + o.d + '일차</b><span>' + esc(dayLabel(o.d)) + '</span><em>¥' + f(o.yen) + '</em></div>' +
        '<div class="wgpays">' + paid + '<small>' + o.n + '건</small></div>' +
        CATS.map(function (c) {
          var v = o.cat[c[0]] || 0; if (!v) return "";
          var it = (o.items[c[0]] || []).slice().sort(function (a, b) { return b.a - a.a; });
          return '<div class="wgcat"><div class="wgct"><span>' + c[1] + " " + c[2] + '</span><b>¥' + f(v) + '</b><small>' + Math.round(v / o.yen * 100) + '%</small></div>' +
            '<div class="wgcb"><i class="c-' + c[0] + '" style="width:' + Math.max(4, v / max * 100) + '%"></i></div>' +
            '<ul class="wgit">' + it.map(function (r) { return '<li>' + payTag(r.pay) + '<span>' + esc(short(r.n || r.m || "(이름 없음)")) + '</span><b>' + f(r.a) + '</b></li>'; }).join("") + '</ul></div>';
        }).join("") +
        (o.krw.length ? '<p class="wgkrw">₩ 원화: ' + o.krw.map(function (r) { return esc(short(r.n || r.m)) + " ₩" + f(r.a); }).join(" · ") + '</p>' : '') +
        (o.bal.length ? '<p class="wgbalrow">📌 이 표에 적힌 잔액 ' + o.bal.map(function (r) { return "¥" + f(r.a) + (r.m ? " (" + esc(short(r.m)) + ")" : ""); }).join(" · ") + ' — 지출 합계엔 안 넣었어요</p>' : '') +
        '</div>';
    }).join("") + '</div>';
    box.innerHTML = h;
  }

  function balance(D) {
    var f0 = num("fund0"), P = people(), sum = document.getElementById("wsBalSum");
    var start = f0, prevAct = null, lastBook = null, lastAct = null;
    D.forEach(function (o) {
      var d = o.d, calc = document.querySelector('#wsBal .wsbalcalc[data-calc="' + d + '"]'), res = document.querySelector('#wsBal .wsbalres[data-res="' + d + '"]'), dd = document.querySelector('#wsBal .wsbaldd[data-bd="' + d + '"]');
      if (dd) dd.textContent = dayLabel(d);
      var t = num("bal" + d + "t"), k = num("bal" + d + "k");
      if (start == null) {
        if (calc) calc.innerHTML = '<p class="wbnote">맨 위 「시작 공금」을 적으면 장부상 남아야 할 돈이 계산돼요.</p>';
        if (res) res.innerHTML = "";
        return;
      }
      // 11/9 사장님 — 1/n 나눠 준 돈도 그 날 지출(따로 빼는 계산 없음)
      var expect = start - o.yen, bookEnd = expect;
      if (calc) calc.innerHTML =
        '<div class="wbl"><span>' + (d === 1 ? "시작 공금" : (d - 1) + "일차에서 넘어온 돈 (장부)") + '</span><b>¥' + f(start) + '</b></div>' +
        '<div class="wbl minus"><span>− ' + d + '일차 엔 지출 (' + o.n + '건' + (o.card || o.cash ? ' · 💳 ' + f(o.card) + ' · 💴 ' + f(o.cash) : '') + ')</span><b>¥' + f(o.yen) + '</b></div>' +
        '<div class="wbl eq"><span>= 장부대로라면 남아야 할 돈 (다음 날로)</span><b>¥' + f(expect) + '</b></div>';
      var h = "";
      if (t != null) {
        var diff = t - expect;
        h += '<div class="wbdiff ' + (Math.abs(diff) < 1 ? "ok" : "bad") + '">' + (Math.abs(diff) < 1 ? "✔ 장부와 딱 맞아요" : (diff < 0 ? "⚠ 실제 돈이 장부보다 ¥" + f(-diff) + " 적어요" : "⚠ 실제 돈이 장부보다 ¥" + f(diff) + " 많아요")) +
          '<small>세어 본 ¥' + f(t) + ' − 장부 ¥' + f(expect) + ' = ' + sg(diff) + (Math.abs(diff) >= 1 ? (diff < 0 ? " · 지출 표에 빠진 줄 · 금액 잘못 적은 줄 · 거스름돈을 확인해 보세요" : " · 두 번 적은 줄 · 아직 안 낸 돈이 있는지 확인해 보세요") : "") + '</small></div>';
        if (prevAct != null) {
          var dayDiff = t - (prevAct - o.yen);
          if (Math.abs(dayDiff - diff) >= 1) h += '<p class="wbnote">그날만 따지면(전날 실제 남은 돈 ¥' + f(prevAct) + ' 에서 출발) ' + (Math.abs(dayDiff) < 1 ? "✔ 맞음" : sg(dayDiff) + "엔 차이") + '</p>';
        }
        if (k != null) h += '<p class="wbnote">그중 충전카드 ¥' + f(k) + ' · 현금은 ¥' + f(t - k) + ' 있어야 해요</p>';
      } else h += '<p class="wbnote">그 날 저녁 세어 본 돈(현금 + 충전카드)을 「실제 남은 돈」에 적으면 장부와 바로 맞춰 봐요.</p>';
      o.bal.forEach(function (r) { h += '<p class="wbnote">📌 ' + d + '일차 지출 표에 적힌 잔액 ¥' + f(r.a) + (r.m ? ' (' + esc(r.m) + ')' : '') + ' — ' + (d === 1 ? '시작 공금' : (d - 1) + '일차 장부 마감') + ' ¥' + f(start) + '와 ' + (Math.abs(r.a - start) < 1 ? '✔ 같음' : sg(r.a - start)) + ' · 지출 합계엔 안 넣었어요</p>'; });
      if (res) res.innerHTML = h;
      if (t != null) { prevAct = t; lastAct = t; }
      lastBook = bookEnd; start = bookEnd;
    });
    if (sum) {
      if (f0 == null) { sum.innerHTML = ""; return; }
      var spent = D.reduce(function (a, o) { return a + o.yen; }, 0);
      sum.innerHTML = '<span>엔 지출 합 <b>¥' + f(spent) + '</b></span>' +
        '<span>장부상 지금 남은 돈 <b>¥' + f(lastBook) + '</b></span>' + (lastAct != null ? '<span>실제 (마지막으로 센 날 기준) <b>¥' + f(lastAct) + '</b></span>' : '');
    }
  }

  function paint() {
    if (!document.getElementById("wsBal")) return;
    var D = [1, 2, 3].map(dayData);
    glance(D); balance(D);
  }
  var tm = 0; function later() { clearTimeout(tm); tm = setTimeout(paint, 250); }
  window.addEventListener("cs:wscost", later);
  document.addEventListener("input", function (e) { if (e.target && e.target.closest && e.target.closest('#tp9 .wspane[data-w="cost"]')) later(); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp9"], #wsNav, .wsadd, .wsdel, #wsYear')) later(); });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", later); else later();
  window.__CS_WSCOST = paint;
})();
