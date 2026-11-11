// 💌 워크샵 소감 (11/11 · 사장님 「워크샵 항목에 이번 워크샵 어땠는지 소감 적는 거」)
// 칸은 index.html 「소감」 화면의 .wsin(data-k fb<사람><질문> · 만족도 fb<사람>s) — 저장 · 다른 기기 반영은 app.js 워크샵 저장 그대로(cafesui.ws.<해> · 고친 칸만)
// 여기서는: 내 카드만 적게(다른 사람 칸은 보기만) · 만족도 별 · 갈 사람 카드만 · 모아 복사 / 텔레그램
(function () {
  var root = document.getElementById("tp9"), pane = root && root.querySelector('.wspane[data-w="feel"]');
  if (!pane) return;
  var yearEl = document.getElementById("wsYear"), ALL = false;
  var QN = { a: "한 줄 소감", b: "가장 좋았던 순간", c: "새로 알게 된 것", d: "카페스이에 해 보고 싶은 것", e: "내 다짐", f: "다음 워크샵엔", g: "함께 간 사람에게" };
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return n === "사장님" ? n : n + "님"; }
  function year() { return String((yearEl && yearEl.value) || new Date().getFullYear()); }
  function cards() { return Array.prototype.slice.call(pane.querySelectorAll(".fbcard")); }
  function mineOf(c) { var m = me(), n = c.dataset.fn; return !!m && (m === n || (n !== "사장님" && m.indexOf(n.slice(1)) >= 0)); }
  function filled(c) { return Array.prototype.some.call(c.querySelectorAll(".wsin"), function (e) { return String(e.value || "").trim(); }); }
  function going() {   // 함께 가는 사람(정하기 칸 · 가고 싶은 곳에서 이름이 나온 사람) — 못 찾으면 모두
    var txt = ""; ["w3", "w10", "w11", "w12", "w13", "w14"].forEach(function (k) { var e = root.querySelector('.wsin[data-k="' + k + '"]'); if (e) txt += " " + e.value; });
    Array.prototype.forEach.call(root.querySelectorAll('.wsin[data-k^="wl"][data-k$="p"]'), function (e) { txt += " " + e.value; });
    var g = {}; cards().forEach(function (c) { var n = c.dataset.fn; if (txt.indexOf(n) >= 0 || (n !== "사장님" && txt.indexOf(n.slice(1)) >= 0) || (n === "이해선" && /엄마|어머님/.test(txt)) || (n === "사장님" && /사장|대표/.test(txt))) g[n] = 1; });
    return Object.keys(g).length ? g : null;
  }
  function paint() {
    var g = going(), done = 0, shown = 0, sum = 0, cnt = 0;
    cards().forEach(function (c) {
      var mine = mineOf(c), f = filled(c);
      c.hidden = !(ALL || mine || f || !g || g[c.dataset.fn]);
      if (!c.hidden) shown++;
      c.classList.toggle("mine", mine); c.style.order = mine ? "-1" : "";
      Array.prototype.forEach.call(c.querySelectorAll("textarea.fbin"), function (t) {
        t.readOnly = !mine;
        t.closest(".fbq").classList.toggle("ro", !mine);
        t.closest(".fbq").classList.toggle("empty", !String(t.value || "").trim());
        if (!mine && !t.dataset.ph0) t.dataset.ph0 = t.placeholder;
        t.placeholder = mine ? (t.dataset.ph0 || t.placeholder) : "";
      });
      var lk = c.querySelector(".fblock");
      lk.textContent = mine ? "✏ 내 카드 — 적는 즉시 저장돼요" : (f ? "" : nim(c.dataset.fn) + "이 아직 안 적었어요 (" + nim(c.dataset.fn) + "만 적을 수 있어요)");
      var sv = c.querySelector(".fbsv"), v = +(sv && sv.value) || 0, st = c.querySelector(".fbstar");
      st.classList.toggle("ro", !mine);
      Array.prototype.forEach.call(st.querySelectorAll(".fbs"), function (b) { b.classList.toggle("on", +b.dataset.v <= v); b.disabled = !mine; });
      c.querySelector(".fbst").textContent = v ? "만족도 " + v + " / 5" : (mine ? "← 만족도 눌러 주세요" : "");
      if (v) { sum += v; cnt++; }
      if (f) done++;
    });
    var s = document.getElementById("fbSum");
    if (s) s.innerHTML = "💌 소감 <b>" + done + "</b> / " + shown + "명 적음" + (cnt ? " · 평균 만족도 <b>" + (sum / cnt).toFixed(1) + "</b> / 5 ⭐" : "");
    var ab = document.getElementById("fbAll"); if (ab) ab.textContent = ALL ? "👥 갈 사람 카드만 보기" : "👥 안 간 사람 카드도 보기";
    if (pane.offsetParent) Array.prototype.forEach.call(pane.querySelectorAll("textarea.wsgrow"), function (t) { t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; });
    return { done: done, shown: shown };
  }
  window.__CS_WSFEEL = { paint: paint, stat: function () { var r = paint(); return "소감 " + r.done + "/" + r.shown + "명"; } };
  pane.addEventListener("click", function (e) {
    var b = e.target.closest(".fbs"); if (!b || b.disabled) return;
    var c = b.closest(".fbcard"); if (!mineOf(c)) return;
    var sv = c.querySelector(".fbsv"), v = +b.dataset.v;
    sv.value = String(+sv.value === v ? "" : v);   // 같은 별 다시 누르면 지움
    sv.dispatchEvent(new Event("input", { bubbles: true }));
    paint();
  });
  function text() {
    var L = ["💌 " + year() + " 카페스이 워크샵 소감"];
    cards().forEach(function (c) {
      if (!filled(c)) return;
      var v = +(c.querySelector(".fbsv").value) || 0;
      L.push("", "■ " + nim(c.dataset.fn) + (v ? " · 만족도 " + "★".repeat(v) + "☆".repeat(5 - v) : ""));
      Array.prototype.forEach.call(c.querySelectorAll("textarea.fbin"), function (t) { var q = t.dataset.k.slice(-1), x = String(t.value || "").trim(); if (x) L.push("- " + QN[q] + ": " + x.replace(/\n+/g, " / ")); });
    });
    return L.length > 1 ? L.join("\n") : "";
  }
  var cp = document.getElementById("fbCopy"), tg = document.getElementById("fbTg"), al = document.getElementById("fbAll");
  if (cp) cp.addEventListener("click", function () {
    var t = text(); if (!t) { alert("아직 적힌 소감이 없어요"); return; }
    var ok = function () { cp.textContent = "✔ 복사했어요"; setTimeout(function () { cp.textContent = "📋 소감 모아 복사"; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { prompt("아래 글을 복사하세요", t); }); else prompt("아래 글을 복사하세요", t);
  });
  if (tg) tg.addEventListener("click", function () { var t = text(); if (!t) { alert("아직 적힌 소감이 없어요"); return; } if (window.__CS_TG && window.__CS_TG.share) window.__CS_TG.share(t, tg); else if (cp) cp.click(); });
  if (al) al.addEventListener("click", function () { ALL = !ALL; paint(); });
  var pt = null; function later() { clearTimeout(pt); pt = setTimeout(paint, 300); }
  pane.addEventListener("input", later);
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf("cafesui.ws." + year()) >= 0) setTimeout(paint, 150); });
  if (yearEl) yearEl.addEventListener("change", function () { setTimeout(paint, 200); });
  root.addEventListener("click", function (e) { if (e.target.closest(".wpcard")) setTimeout(paint, 200); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp9"], .mbt[data-p="tp9"], .wsn[data-w="feel"], [data-wgo="feel"]')) setTimeout(paint, 80); });
  setTimeout(paint, 300);
})();
