// 달력 상자 끌어서 옮기기 — 공통(10/15 · 사장님 「캘린더에서 상자를 눌러 드래그하면 옮겨지게 · 모든 캘린더」)
//   컴퓨터: 마우스로 누른 채 끌기 · 휴대폰: 0.35초 꾹 누른 뒤 끌기(그냥 밀면 화면 스크롤)
//   __CS_DRAG(root, { chip: "상자 선택자", cell: "칸 선택자", key: function (칸) { return 날짜 }, drop: function (상자, 원래날짜, 옮길날짜) {} })
//   돌려주는 quiet() — 끌기 바로 뒤의 눌림(click)은 무시하라는 뜻(true)
(function () {
  window.__CS_DRAG = function (root, o) {
    if (!root) return { quiet: function () { return false; } };
    var drag = null, quietTill = 0;
    function cellAt(x, y) { var el = document.elementFromPoint(x, y); return el && el.closest ? el.closest(o.cell) : null; }
    function inRoot(c) { return c && root.contains(c); }
    function start(chip, x, y) {
      var fc = chip.closest(o.cell); if (!fc) return false;
      var g = chip.cloneNode(true); g.classList.add("csghost"); g.removeAttribute("title"); g.removeAttribute("id");
      g.style.width = Math.min(chip.offsetWidth || 160, 220) + "px";
      document.body.appendChild(g); chip.classList.add("csdragging"); root.classList.add("csdragon");
      drag = { chip: chip, from: o.key(fc), g: g, over: null }; move(x, y); return true;
    }
    function move(x, y) {
      if (!drag) return;
      drag.g.style.left = (x + 10) + "px"; drag.g.style.top = (y - 20) + "px";
      var c = cellAt(x, y); if (!inRoot(c)) c = null;
      if (drag.over && drag.over !== c) drag.over.classList.remove("csdrop");
      if (c && o.key(c) && o.key(c) !== drag.from) c.classList.add("csdrop");
      drag.over = c;
    }
    function end(x, y, cancel) {
      if (!drag) return;
      var d = drag; drag = null; quietTill = Date.now() + 450;
      d.g.remove(); d.chip.classList.remove("csdragging"); root.classList.remove("csdragon");
      if (d.over) d.over.classList.remove("csdrop");
      if (cancel) return;
      var c = cellAt(x, y); if (!inRoot(c)) return;
      var to = o.key(c); if (!to || to === d.from) return;
      try { o.drop(d.chip, d.from, to); } catch (e) { alert("옮기지 못했어요 · 다시 해 주세요"); }
    }
    var ms = null;
    root.addEventListener("mousedown", function (e) { var ch = e.target.closest(o.chip); if (!ch || e.button || !root.contains(ch)) return; ms = { ch: ch, x: e.clientX, y: e.clientY }; });
    document.addEventListener("mousemove", function (e) {
      if (drag) { e.preventDefault(); move(e.clientX, e.clientY); return; }
      if (ms && Math.abs(e.clientX - ms.x) + Math.abs(e.clientY - ms.y) > 6) { var s = ms; ms = null; if (start(s.ch, e.clientX, e.clientY)) { try { window.getSelection().removeAllRanges(); } catch (er) {} } }
    });
    document.addEventListener("mouseup", function (e) { ms = null; if (drag) end(e.clientX, e.clientY); });
    var tc = null;
    root.addEventListener("touchstart", function (e) {
      var ch = e.target.closest(o.chip); if (!ch || e.touches.length > 1 || !root.contains(ch)) return;
      var p = e.touches[0]; tc = { ch: ch, x: p.clientX, y: p.clientY, lx: p.clientX, ly: p.clientY };
      tc.t = setTimeout(function () { if (tc && start(tc.ch, tc.lx, tc.ly) && navigator.vibrate) { try { navigator.vibrate(15); } catch (er) {} } }, 350);
    }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      var p = e.touches[0]; if (!p) return;
      if (drag) { e.preventDefault(); move(p.clientX, p.clientY); if (tc) { tc.lx = p.clientX; tc.ly = p.clientY; } return; }
      if (tc) { tc.lx = p.clientX; tc.ly = p.clientY; if (Math.abs(p.clientX - tc.x) + Math.abs(p.clientY - tc.y) > 10) { clearTimeout(tc.t); tc = null; } }
    }, { passive: false });
    function tend(cancel) { var l = tc; if (tc) { clearTimeout(tc.t); tc = null; } if (drag) end(l ? l.lx : 0, l ? l.ly : 0, cancel); }
    document.addEventListener("touchend", function () { tend(false); });
    document.addEventListener("touchcancel", function () { tend(true); });
    root.addEventListener("contextmenu", function (e) { if (e.target.closest(o.chip)) e.preventDefault(); });
    // 끌기 바로 뒤 눌림은 막는다(칸이 열리거나 체크되지 않게)
    root.addEventListener("click", function (e) { if (Date.now() < quietTill) { e.stopPropagation(); e.preventDefault(); } }, true);
    return { quiet: function () { return Date.now() < quietTill || !!drag; } };
  };
  // 잠깐 뜨는 알림(아래 가운데)
  window.__CS_TOAST = function (msg) {
    var t = document.getElementById("csToast");
    if (!t) { t = document.createElement("div"); t.id = "csToast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on"); clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove("on"); }, 3200);
  };
})();
