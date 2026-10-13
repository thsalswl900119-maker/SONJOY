// 🎄 크리스마스 — 해마다 한 장 (연간 행사 탭). cafesui.xmas.<해> = { f:{x1..x10}, by:{...}, savedAt, who }
// 저장은 「이 화면에서 고친 칸」만 (다른 기기가 쓴 칸을 지우지 않게) · 빈 칸에는 작년 글이 흐린 글씨로 보인다.
(function () {
  var sec = document.getElementById("xmasSec"); if (!sec) return;
  var PRE = "cafesui.xmas.";
  var ins = Array.prototype.slice.call(sec.querySelectorAll(".xmin"));
  var yearsEl = document.getElementById("xmYears"), titleEl = document.getElementById("xmTitle"), stateEl = document.getElementById("xmState"), footEl = document.getElementById("xmFoot");
  var autoEl = document.getElementById("xmAuto"), autoN = document.getElementById("xmAutoN");
  var CL = { "정항아": "wp1", "박혜빈": "wp2", "이해선": "wp3", "사장님": "wp4" };
  var KW = /크리스마스|성탄|x-?mas|산타/i;
  function pad(n) { return String(n).padStart(2, "0"); }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function load(y) { try { return JSON.parse(localStorage.getItem(PRE + y) || "{}") || {}; } catch (e) { return {}; } }
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  var now = new Date(), thisY = now.getFullYear();
  var cur = now.getMonth() === 0 ? thisY - 1 : thisY;   // 1월엔 지난 크리스마스를 먼저
  function years() { var a = []; for (var y = 2025; y <= thisY + 1; y++) a.push(y); return a; }
  function grow(el) { el.style.height = "auto"; el.style.height = Math.max(52, el.scrollHeight + 2) + "px"; }
  function paint(el, n) { ["wp1", "wp2", "wp3", "wp4"].forEach(function (c) { el.classList.remove(c); }); if (n && CL[n]) el.classList.add(CL[n]); }
  function filled(y) { var f = load(y).f || {}; return Object.keys(f).filter(function (k) { return String(f[k] || "").trim(); }).length; }
  function drawYears() {
    yearsEl.innerHTML = years().map(function (y) {
      var n = filled(y);
      return '<button type="button" class="xmy" data-y="' + y + '" aria-pressed="' + (y === cur) + '">' + y + (n ? "<i>" + n + "칸</i>" : "") + "</button>";
    }).join("");
  }
  // 일지 · 메모 달력에서 「크리스마스」가 들어간 글을 그 해 9월 ~ 다음 해 1월 사이에서 모은다 (보기만)
  var LAB = { lf180: "인계사항", lf185: "사장님 지시사항", lf154: "흐름 · 분위기", lf181: "특이사항" };
  function pieces(txt) {
    var out = [];
    String(txt || "").split(/\n/).forEach(function (ln) {
      if (!KW.test(ln)) return;
      if (ln.length <= 140) { out.push(ln.trim()); return; }
      ln.split(/\s\/\s/).forEach(function (s) { if (KW.test(s)) out.push(s.trim()); });
    });
    return out;
  }
  function autoList(y) {
    var from = y + "-09-01", to = (y + 1) + "-01-15", rows = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i), m = /^cafesui\.log\.(\d{4}-\d{2}-\d{2})$/.exec(k || "");
        if (!m || m[1] < from || m[1] > to) continue;
        var lg = J(k); if (!lg || !lg.f) continue;
        Object.keys(lg.f).forEach(function (fk) { pieces(lg.f[fk]).forEach(function (s) { rows.push({ d: m[1], w: "일지 · " + (LAB[fk] || "메모"), s: s }); }); });
      }
    } catch (e) {}
    var dn = J("cafesui.daynotes") || {};
    Object.keys(dn).forEach(function (d) {
      if (d < from || d > to) return;
      (Array.isArray(dn[d]) ? dn[d] : []).forEach(function (n) { var s = n && (n.t || ""); if (KW.test(s)) rows.push({ d: d, w: "메모 달력", s: s }); });
    });
    rows.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    return rows;
  }
  function drawAuto() {
    var rows = autoList(cur);
    autoN.textContent = rows.length ? rows.length + "줄" : "";
    autoEl.innerHTML = rows.length ? rows.map(function (r) {
      var p = r.d.split("-");
      return '<div class="xmal"><small>' + (+p[1]) + "/" + (+p[2]) + " · " + esc(r.w) + "</small>" + esc(r.s).replace(new RegExp(KW.source, "gi"), function (x) { return "<mark>" + x + "</mark>"; }) + "</div>";
    }).join("") : '<div class="xmal">' + cur + "년 9월 ~ " + (cur + 1) + "년 1월 일지 · 메모 달력에 「크리스마스」가 들어간 글이 아직 없습니다</div>";
  }
  function render() {
    var o = load(cur), f = o.f || {}, by = o.by || {}, prev = (load(cur - 1).f) || {};
    titleEl.textContent = "🎄 " + cur + " 크리스마스";
    ins.forEach(function (el) {
      var k = el.dataset.f, pv = String(prev[k] || "").trim();
      el.placeholder = pv ? (cur - 1) + "년: " + pv.split("\n").slice(0, 2).join(" / ").slice(0, 90) + (pv.length > 90 ? "…" : "") : "";
      if (document.activeElement !== el) { el.value = f[k] || ""; paint(el, by[k]); }
      grow(el);
    });
    var n = ins.filter(function (el) { return el.value.trim(); }).length;
    stateEl.textContent = n ? n + " / " + ins.length + "칸 적힘" + (o.who ? " · 마지막 " + nim(o.who) : "") : "아직 안 적음 · 흐린 글씨는 작년 내용";
    footEl.textContent = o.savedAt ? "마지막 저장 " + o.savedAt + (o.who ? " · " + nim(o.who) : "") : "";
    Array.prototype.forEach.call(sec.querySelectorAll(".xmgal"), function (g) { g.hidden = String(cur) !== g.dataset.y; });
    drawYears(); drawAuto();
  }
  var touched = {};
  function save() {
    var keys = Object.keys(touched); if (!keys.length) return;
    var o = load(cur); o.f = o.f || {}; o.by = o.by || {};
    var w = me(), any = false;
    ins.forEach(function (el) {
      var k = el.dataset.f, v = el.value; if (!touched[k]) return;
      if (v.trim()) { if (o.f[k] !== v) { o.f[k] = v; o.by[k] = w || o.by[k] || ""; any = true; } }
      else if (o.f[k] != null) { delete o.f[k]; delete o.by[k]; any = true; }
    });
    if (!any) return;
    var d = new Date(); o.savedAt = (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); o.who = w || o.who;
    try { localStorage.setItem("cafesui.ui.lastxmas." + cur, JSON.stringify(o.f)); } catch (e) {}
    try { localStorage.setItem(PRE + cur, JSON.stringify(o)); } catch (e) {}
  }
  var t = null;
  ins.forEach(function (el) {
    el.addEventListener("input", function () { touched[el.dataset.f] = 1; grow(el); paint(el, me()); clearTimeout(t); t = setTimeout(save, 400); });
    el.addEventListener("blur", function () { clearTimeout(t); save(); touched = {}; render(); });
  });
  (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { clearTimeout(t); save(); });
  function go(y) { clearTimeout(t); save(); touched = {}; cur = y; render(); }
  yearsEl.addEventListener("click", function (e) { var b = e.target.closest(".xmy"); if (b) go(+b.dataset.y); });
  document.getElementById("xmPrev").addEventListener("click", function () { if (cur > years()[0]) go(cur - 1); });
  document.getElementById("xmNext").addEventListener("click", function () { if (cur < thisY + 1) go(cur + 1); });
  document.getElementById("xmCopy").addEventListener("click", function () {
    save(); var f = load(cur).f || {}, NL = String.fromCharCode(10), out = ["[🎄 " + cur + " 크리스마스]"], btn = this;
    sec.querySelectorAll(".xmrow").forEach(function (r) { var el = r.querySelector(".xmin"), v = String(f[el.dataset.f] || "").trim(); if (v) out.push("", "■ " + r.querySelector("span").firstChild.textContent, v); });
    if (out.length < 2) { alert("이 해에 적힌 내용이 없습니다"); return; }
    var txt = out.join(NL), LBL = btn.textContent, ok = function () { btn.textContent = "✔ 복사됨"; setTimeout(function () { btn.textContent = LBL; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { prompt("복사해서 쓰세요", txt); });
    else prompt("복사해서 쓰세요", txt);
  });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || [];
    if (ks.some(function (k) { return k.indexOf(PRE) === 0 || k.indexOf("cafesui.log.") === 0 || k === "cafesui.daynotes"; })) render();
  });
  // 탭이 숨어 있을 때 그리면 칸 높이를 못 잰다 → 화면에 보일 때 다시 늘린다
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) ins.forEach(grow); }).observe(sec);
  window.addEventListener("resize", function () { ins.forEach(grow); });
  render();
})();
