// 🥭 매주 수요일만 · 망고 (목.금.토) 사용량 미리 계산 → 금요일까지 확보 (10/23 사장님 「재고랑 오늘 할 일에만 · 하나만 입력하고 다 연동」)
// 값은 한 곳 — 그 날 재고 기록 cafesui.stock.<날짜>.mangoWed. 재고·발주 칸(#sk_mangoWed) · 오늘 할 일 칸(#tdMangoWed) 어디에 적어도 같은 값이 보이고,
// 오늘 날짜에 글이 있으면 오늘 할 일 t508도 체크된다. 두 칸 모두 그 날짜가 수요일일 때만 보임(글이 적혀 있으면 늘 보임)
(function () {
  var skBox = document.getElementById("skWd"), skIn = document.getElementById("sk_mangoWed");
  var tdBox = document.getElementById("tdWd"), tdIn = document.getElementById("tdMangoWed");
  if (!skBox || !tdBox || !skIn || !tdIn) return;
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function isWd(d, box) { return String(box.dataset.wd).split(",").indexOf(String(new Date(d + "T12:00:00").getDay())) >= 0; }
  function valOf(d) { try { return (JSON.parse(localStorage.getItem("cafesui.stock." + d) || "{}") || {}).mangoWed || ""; } catch (e) { return ""; } }
  function tdDay() { var pk = document.getElementById("tdPick"), past = document.getElementById("tdPastMsg"); return past && pk && pk.value ? pk.value : today(); }
  function tick() {
    var b = document.querySelector('#tp2 .box[data-k="t508"]');
    if (b && b.getAttribute("aria-pressed") !== "true" && !document.getElementById("tdPastMsg") && b.closest(".titem") && !b.closest(".titem").hidden) b.click();
  }
  function paint() {
    var sd = (window.__CS_SK_CUR && window.__CS_SK_CUR()) || today();
    skBox.hidden = !isWd(sd, skBox) && !skIn.value.trim();
    var td = tdDay(), past = td !== today(), v = valOf(td);
    tdBox.hidden = !isWd(td, tdBox) && !v.trim();
    if (document.activeElement !== tdIn) tdIn.value = v;
    tdIn.disabled = past;
  }
  window.__CS_MANGO_PAINT = paint;
  var t = null;
  tdIn.addEventListener("input", function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var v = tdIn.value;
      if (window.__CS_SK_MANGO) window.__CS_SK_MANGO(today(), v);
      if (v.trim()) tick();
    }, 700);
  });
  tdIn.addEventListener("blur", function () { setTimeout(paint, 800); });
  skIn.addEventListener("input", function () {
    paint();
    var sd = window.__CS_SK_CUR && window.__CS_SK_CUR();
    if (sd === today() && skIn.value.trim()) { clearTimeout(t); t = setTimeout(tick, 1200); }
  });
  window.addEventListener("cs:remote", function () { setTimeout(paint, 400); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp2"], .tab[data-p="tp12"], #tdPrev, #tdNext, #tdToday')) setTimeout(paint, 300); }, true);
  var pk = document.getElementById("tdPick"); if (pk) pk.addEventListener("change", function () { setTimeout(paint, 300); });
  setInterval(paint, 60000);
  paint();
})();
