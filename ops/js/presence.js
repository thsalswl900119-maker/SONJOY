// 누가 지금 어느 화면을 쓰고 있는지 — 같은 날짜 일지·발주를 동시에 고치는 사고를 미리 알려준다.
// 기기마다 cafesui.presence.<기기번호> 에 "누구 · 어느 화면 · 언제" 를 20초마다 남기고(서버 공유), 2분 반 넘게 조용하면 안 보이게 한다.
(function () {
  var STALE = 150000, BEAT = 20000, lastIn = Date.now(), lastSent = 0, lastSig = "";
  ["input", "change", "keydown", "pointerdown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { lastIn = Date.now(); }, true); });
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function dev() {
    if (window.__CS_DEV) return window.__CS_DEV;
    var d = ""; try { d = localStorage.getItem("cafesui.device") || ""; if (!d) { d = "d" + Math.random().toString(36).slice(2, 8); localStorage.setItem("cafesui.device", d); } } catch (e) {}
    return d;
  }
  function nim(n) { return n === "사장님" ? n : n + "님"; }
  function md(d) { return d ? (+d.slice(5, 7)) + "/" + (+d.slice(8, 10)) : ""; }
  // 지금 보고 있는 화면 → 겹침을 판단할 키와 사람이 읽는 이름
  function where() {
    var tab = document.querySelector('.tab[aria-selected="true"]'); var pid = tab ? tab.dataset.p : "", name = tab ? tab.textContent.trim() : "";
    if (pid === "tp4") { var d = (document.getElementById("lgDate") || {}).value || ""; return { key: "cafesui.log." + d, label: "일지 " + md(d) }; }
    if (pid === "tp12") { var d2 = (document.getElementById("skDate") || {}).value || ""; return { key: "cafesui.stock." + d2, label: "재고·발주 " + md(d2) }; }
    if (pid === "tp1") { var mm = document.querySelector('#tp1 .mtab[aria-selected="true"], #tp1 [data-m][aria-selected="true"]'); return { key: "sched", label: "근무표" }; }
    return { key: pid, label: name };
  }
  function others() {
    var out = [], now = Date.now();
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i); if (!k || k.indexOf("cafesui.presence.") !== 0) continue;
        if (k === "cafesui.presence." + dev()) continue;
        var o = null; try { o = JSON.parse(localStorage.getItem(k) || "null"); } catch (e) {}
        if (!o || !o.who || now - (o.t || 0) > STALE) continue;   // 자리 비움도 목록에는 보인다 (충돌 경고는 o.on 인 사람만)
        out.push(o);
      }
    } catch (e) {}
    return out;
  }
  function beat(force) {
    var who = me(); if (!who || !dev()) return;
    var active = Date.now() - lastIn < 90000;
    var w = where(); var sig = who + "|" + w.key + "|" + (active ? 1 : 0);
    if (!force && sig === lastSig && Date.now() - lastSent < BEAT) return;
    lastSig = sig; lastSent = Date.now();
    try { localStorage.setItem("cafesui.presence." + dev(), JSON.stringify({ who: who, dev: dev(), key: w.key, label: w.label, on: active, t: Date.now() })); } catch (e) {}
  }
  function bye() { try { localStorage.setItem("cafesui.presence." + dev(), JSON.stringify({ who: me(), dev: dev(), key: "", label: "", on: false, t: Date.now() })); } catch (e) {} }
  // 화면 표시: 위 띠에 "지금 쓰는 사람", 같은 화면이면 아래 경고
  function draw() {
    var list = others(), w = where();
    var top = document.getElementById("whoOn");
    if (top) {
      // 나 + 다른 사람 전부 — 이름은 각자 색, 어느 화면인지, 1분 30초 넘게 안 만지면 「자리 비움」
      var CL = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
      var rows = [{ who: me(), label: w.label, on: true, mine: true }].concat(list.filter(function (o) { return o.who !== me(); }));
      var seen = {}, html = '<b class="pol">접속 중</b>';
      rows.forEach(function (o) {
        if (!o.who || seen[o.who + o.label]) return; seen[o.who + o.label] = 1;
        var same = !o.mine && o.on && o.key && o.key === w.key;
        html += '<span class="pchip ' + (CL[o.who] || "") + (o.on ? "" : " away") + (same ? " same" : "") + '"><i></i>' + nim(o.who) + (o.mine ? "(나)" : "") + "<em>" + (o.on ? (o.label || "") : "자리 비움") + "</em></span>";
      });
      if (top.innerHTML !== html) top.innerHTML = html;
      if (top.hidden) top.hidden = false;
    }
    var bar = document.getElementById("presWarn");
    if (bar) {
      var same = list.filter(function (o) { return o.on && o.key && o.key === w.key && o.who !== me(); });
      if (bar.hidden !== !same.length) bar.hidden = !same.length;
      if (same.length) { var bt = "⚠ " + same.map(function (o) { return nim(o.who); }).join(" · ") + "도 지금 「" + w.label + "」 화면을 쓰고 있어요 — 같은 칸을 동시에 고치면 나중에 저장한 쪽만 남습니다. 서로 다른 칸만 적거나 잠깐 기다려 주세요."; if (bar.textContent !== bt) bar.textContent = bt; }
    }
  }
  function tick() { beat(false); draw(); }
  document.addEventListener("DOMContentLoaded", function () {
    var sv = document.querySelector(".sv");
    if (sv && !document.getElementById("whoOn")) { var s = document.createElement("i"); s.id = "whoOn"; s.className = "whoon"; s.hidden = true; sv.appendChild(s); }
    if (!document.getElementById("presWarn")) { var b = document.createElement("div"); b.id = "presWarn"; b.className = "preswarn"; b.hidden = true; document.body.appendChild(b); }
    setTimeout(function () { beat(true); draw(); }, 2500);
    setInterval(tick, 5000);
  });
  document.addEventListener("click", function (e) { if (e.target.closest(".tab, .daynav, .stab, .sktab")) setTimeout(function () { beat(true); draw(); }, 300); }, true);
  document.addEventListener("change", function (e) { if (e.target && (e.target.id === "lgDate" || e.target.id === "skDate")) setTimeout(function () { beat(true); draw(); }, 100); }, true);
  window.addEventListener("cs:presence", draw);
  window.addEventListener("cs:remote", function () { setTimeout(draw, 200); });
  window.addEventListener("pagehide", bye);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") bye(); else { lastIn = Date.now(); beat(true); draw(); } });
})();
