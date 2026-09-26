// 매니저 주간 보고 — 주마다 한 장 (월~토). 토요일에 꼭 쓴다. cafesui.weekrep.<그 주 월요일> = { f:{sum,good,...}, by:{...}, savedAt, who }
(function () {
  var box = document.getElementById("wrBox"); if (!box) return;
  var PRE = "cafesui.weekrep.";
  var ins = Array.prototype.slice.call(box.querySelectorAll(".wrin"));
  var labelEl = document.getElementById("wrLabel"), autoEl = document.getElementById("wrAuto"), stateEl = document.getElementById("wrState"), footEl = document.getElementById("wrFoot");
  var CL = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  function pad(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function monOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function add(s, n) { var p = s.split("-"), d = new Date(+p[0], +p[1] - 1, +p[2]); d.setDate(d.getDate() + n); return ymd(d); }
  function md(s) { var p = s.split("-"); return (+p[1]) + "/" + (+p[2]); }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function load(k) { try { return JSON.parse(localStorage.getItem(PRE + k) || "{}") || {}; } catch (e) { return {}; } }
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  var cur = ymd(monOf(new Date()));
  function paint(el, n) { ["wp1", "wp2", "wp3", "wp4"].forEach(function (c) { el.classList.remove(c); }); if (n && CL[n]) el.classList.add("w" + CL[n]); }
  function grow(el) { el.style.height = "auto"; el.style.height = Math.max(44, el.scrollHeight + 2) + "px"; }
  // 일지에서 이번 주 오늘 매출 · 배달 건수를 모아 참고로 보여준다
  function autoSum() {
    var tot = 0, days = 0, rec = [];
    for (var i = 0; i < 6; i++) {
      var d = add(cur, i), lg = J("cafesui.log." + d); if (!lg || !lg.f) continue;
      var v = String(lg.f.lf183 || ""), n = parseInt(v.replace(/[^0-9]/g, ""), 10);
      if (n > 10000) { tot += n; days += 1; rec.push(md(d) + " " + Math.round(n / 10000) + "만"); }
    }
    return days ? "일지 오늘 매출 합계 " + tot.toLocaleString("ko-KR") + "원 (" + days + "일 기록 · " + rec.join(" · ") + ")" : "이번 주 일지에 적힌 매출이 아직 없습니다";
  }
  function render() {
    var o = load(cur), f = o.f || {}, by = o.by || {};
    labelEl.textContent = md(cur) + " (월) ~ " + md(add(cur, 5)) + " (토)";
    ins.forEach(function (el) { if (document.activeElement === el) return; el.value = f[el.dataset.f] || ""; paint(el, by[el.dataset.f]); grow(el); });
    autoEl.textContent = autoSum();
    var n = ins.filter(function (el) { return el.value.trim(); }).length;
    stateEl.textContent = n ? "작성됨 · " + n + "/" + ins.length + (o.who ? " · " + nim(o.who) : "") : "이번 주 아직 안 씀";
    stateEl.className = n ? "done" : "todo";
    footEl.textContent = o.savedAt ? "마지막 저장 " + o.savedAt + (o.who ? " · " + nim(o.who) : "") + " · 적는 즉시 저장되고 모든 기기에 같이 보입니다" : "적는 즉시 저장되고 모든 기기에 같이 보입니다";
    var sat = new Date().getDay() === 6;
    box.classList.toggle("satday", sat);
  }
  function save() {
    var o = load(cur); o.f = o.f || {}; o.by = o.by || {};
    var w = me();
    ins.forEach(function (el) {
      var k = el.dataset.f, v = el.value;
      if (v.trim()) { if (o.f[k] !== v) { o.f[k] = v; o.by[k] = w || o.by[k] || ""; } }
      else { delete o.f[k]; delete o.by[k]; }
    });
    var d = new Date(); o.savedAt = (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); o.who = w || o.who;
    try { localStorage.setItem(PRE + cur, JSON.stringify(o)); } catch (e) {}
  }
  var t = null;
  ins.forEach(function (el) {
    el.addEventListener("input", function () { grow(el); paint(el, me()); clearTimeout(t); t = setTimeout(function () { save(); render(); }, 300); });
    el.addEventListener("blur", function () { clearTimeout(t); save(); render(); });
  });
  (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (ins.some(function (el) { return document.activeElement === el; })) save(); });
  document.getElementById("wrPrev").addEventListener("click", function () { cur = add(cur, -7); render(); });
  document.getElementById("wrNext").addEventListener("click", function () { cur = add(cur, 7); render(); });
  document.getElementById("wrThis").addEventListener("click", function () { cur = ymd(monOf(new Date())); render(); });
  document.getElementById("wrCopy").addEventListener("click", function () {
    save(); var o = load(cur), f = o.f || {}, NL = String.fromCharCode(10);
    var txt = ["[매니저 주간 보고] " + labelEl.textContent + (o.who ? " · " + nim(o.who) : ""), autoEl.textContent];
    box.querySelectorAll(".wrrow").forEach(function (r) { var el = r.querySelector(".wrin"), v = (f[el.dataset.f] || "").trim(); if (v) txt.push("", "■ " + r.querySelector("span").textContent, v); });
    var s = txt.join(NL), btn = this, ok = function () { btn.textContent = "복사됐습니다"; setTimeout(function () { btn.textContent = "복사하기"; }, 1500); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(ok, function () { alert(s); }); else alert(s);
  });
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.some(function (k) { return k.indexOf(PRE) === 0 || k.indexOf("cafesui.log.") === 0; })) render(); });
  box.addEventListener("toggle", function () { if (box.open) render(); });
  // 토요일에는 펼쳐 두고, 다른 날은 접어 둔다 (이번 주 안 썼으면 빨간 글씨로 표시)
  if (new Date().getDay() === 6) box.open = true;
  render();
})();
