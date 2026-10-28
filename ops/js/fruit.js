// 🍓 과일 달력 보기 좋게(10/15 · 사장님 「그림 같은 거 넣어서 가독성 있게」) — tabs/tp7.html 글은 그대로, 화면에서만
//   ① 과일마다 그림(SVG) · 과일 색 막대(진한 색 = 가장 많이 쓰는 때 · 연한 색 = 쓰는 때)
//   ② 이번 달 표시는 오늘 날짜로(예전엔 9월에 박혀 있었음) ③ 맨 위 「이번 달 과일」 카드(제철 최고 · 곧 시작 · 곧 끝)
//   ④ 품종 단추(망고) — 탭을 나중에 불러와서 예전 코드(app.js)가 못 붙던 것 여기서 붙임
(function () {
  var F = {
    "망고": ["#F2A900", "#FBE6A6", '<path d="M14 30c-3-9 4-20 15-20 8 0 12 6 11 13-1 9-9 16-18 16-4 0-7-3-8-9z" fill="#F7B500"/><path d="M33 13c3 2 5 6 5 10-1 7-6 12-12 14 8-4 11-14 7-24z" fill="#E98A00" opacity=".7"/><ellipse cx="21" cy="30" rx="6" ry="4" fill="#F26B3A" opacity=".55"/><path d="M28 10c1-4 4-6 8-6-1 4-4 6-8 6z" fill="#4E9A3A"/><path d="M28 10l-1-3" stroke="#6B4A2A" stroke-width="1.6" stroke-linecap="round"/>'],
    "딸기": ["#D93A3A", "#F7C9C6", '<path d="M24 42c-9-6-14-13-14-20 0-6 5-9 14-9s14 3 14 9c0 7-5 14-14 20z" fill="#E23B3B"/><path d="M14 14c3 3 7 4 10 3 3 1 7 0 10-3-3-1-5-3-6-6-1 3-2 4-4 4s-3-1-4-4c-1 3-3 5-6 6z" fill="#4E9A3A"/><g fill="#FFE27A"><circle cx="18" cy="22" r="1.2"/><circle cx="24" cy="21" r="1.2"/><circle cx="30" cy="22" r="1.2"/><circle cx="20" cy="28" r="1.2"/><circle cx="27" cy="28" r="1.2"/><circle cx="23" cy="34" r="1.2"/></g>'],
    "천혜향": ["#F28C1B", "#FCD9AE", '<circle cx="24" cy="27" r="14" fill="#F68D1E"/><path d="M19 14c1-4 9-4 10 0 0 3-2 4-5 4s-5-1-5-4z" fill="#F68D1E"/><path d="M24 11c3-4 8-5 11-4-2 4-6 5-11 4z" fill="#4E9A3A"/><circle cx="19" cy="24" r="3" fill="#FFC27A" opacity=".7"/>'],
    "한라봉": ["#E87512", "#F9CFA3", '<circle cx="24" cy="29" r="13" fill="#F07A16"/><path d="M18 18c0-6 12-6 12 0 0 4-3 5-6 5s-6-1-6-5z" fill="#F07A16"/><path d="M24 12c2-4 7-5 10-4-2 4-6 5-10 4z" fill="#4E9A3A"/><circle cx="19" cy="27" r="3" fill="#FFC27A" opacity=".7"/>'],
    "귤": ["#F59A23", "#FDDDB2", '<ellipse cx="24" cy="27" rx="15" ry="12.5" fill="#F9A12A"/><path d="M24 15c0-3 2-5 5-6 3 0 5 1 6 2-3 3-7 4-11 4z" fill="#4E9A3A"/><circle cx="24" cy="15.5" r="1.4" fill="#6B4A2A"/><path d="M14 27c3 5 17 5 20 0" stroke="#E88412" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="18" cy="23" r="2.6" fill="#FFD08A" opacity=".75"/>'],
    "멜론": ["#7FB24A", "#DCEBC4", '<circle cx="24" cy="26" r="15" fill="#CFE8A5"/><path d="M24 11v30M15 14c-4 8-4 16 0 24M33 14c4 8 4 16 0 24" stroke="#9CC56A" stroke-width="1.6" fill="none"/><path d="M24 11c0-3 2-5 4-6" stroke="#6B4A2A" stroke-width="1.8" stroke-linecap="round" fill="none"/><circle cx="18" cy="21" r="3" fill="#fff" opacity=".45"/>'],
    "체리": ["#B0123B", "#F0BACB", '<path d="M17 30c2-10 6-17 15-23M31 32c-1-9 0-17 1-25" stroke="#4E7A2A" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M32 7c3-2 7-2 9 0-3 2-6 2-9 0z" fill="#4E9A3A"/><circle cx="16" cy="34" r="8" fill="#C8143F"/><circle cx="31" cy="35" r="8" fill="#A50F35"/><circle cx="13" cy="31" r="2" fill="#fff" opacity=".5"/><circle cx="28" cy="32" r="2" fill="#fff" opacity=".45"/>'],
    "초당옥수수": ["#E8B92A", "#F8E6A8", '<rect x="17" y="8" width="14" height="30" rx="7" fill="#F6CF3A"/><g fill="#E9B21E"><circle cx="21" cy="14" r="1.6"/><circle cx="27" cy="14" r="1.6"/><circle cx="24" cy="18" r="1.6"/><circle cx="21" cy="22" r="1.6"/><circle cx="27" cy="22" r="1.6"/><circle cx="24" cy="26" r="1.6"/><circle cx="21" cy="30" r="1.6"/><circle cx="27" cy="30" r="1.6"/></g><path d="M24 44c-8-2-12-10-11-20 4 5 8 9 11 20z" fill="#6DAA3F"/><path d="M24 44c8-2 12-10 11-20-4 5-8 9-11 20z" fill="#4E9A3A"/>'],
    "복숭아": ["#F0857A", "#FAD3CC", '<path d="M24 41c-9 0-15-6-15-14 0-8 6-13 12-13 2 0 3 1 3 1s1-1 3-1c6 0 12 5 12 13 0 8-6 14-15 14z" fill="#FFAE9C"/><path d="M24 15c-3 6-3 18 0 26" stroke="#F07C6C" stroke-width="1.6" fill="none"/><ellipse cx="31" cy="26" rx="5" ry="7" fill="#F26B5B" opacity=".45"/><path d="M24 15c2-5 7-8 12-7-2 5-7 7-12 7z" fill="#4E9A3A"/>'],
    "무화과": ["#8A4A8F", "#E3CBE5", '<path d="M24 9c3 0 4 4 6 8 5 5 8 9 8 14 0 7-6 11-14 11s-14-4-14-11c0-5 3-9 8-14 2-4 3-8 6-8z" fill="#8E4A93"/><path d="M24 9V5" stroke="#6B4A2A" stroke-width="2" stroke-linecap="round"/><ellipse cx="24" cy="33" rx="6" ry="4" fill="#E9738A" opacity=".55"/><circle cx="18" cy="24" r="2.4" fill="#fff" opacity=".3"/>'],
    "샤인머스캣": ["#6FA83A", "#D6EAB8", '<g fill="#9ACD5A"><circle cx="17" cy="17" r="5"/><circle cx="27" cy="17" r="5"/><circle cx="22" cy="25" r="5"/><circle cx="32" cy="25" r="5"/><circle cx="17" cy="27" r="4.6"/><circle cx="27" cy="33" r="5"/><circle cx="21" cy="35" r="4.4"/><circle cx="25" cy="41" r="4"/></g><g fill="#fff" opacity=".45"><circle cx="15.5" cy="15.5" r="1.3"/><circle cx="25.5" cy="15.5" r="1.3"/><circle cx="20.5" cy="23.5" r="1.3"/></g><path d="M22 12c0-4 3-7 6-8" stroke="#6B4A2A" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M28 8c4-2 9-1 11 2-4 2-8 1-11-2z" fill="#4E9A3A"/>'],
    "밤": ["#8A5A2B", "#E7D2B8", '<path d="M24 8c8 4 15 13 15 21 0 7-7 11-15 11S9 36 9 29c0-8 7-17 15-21z" fill="#8B5A2E"/><path d="M10 31c3 6 9 9 14 9s11-3 14-9c-4 2-9 3-14 3s-10-1-14-3z" fill="#E2C49A"/><path d="M24 8l1-3" stroke="#5A3A1E" stroke-width="2" stroke-linecap="round"/><ellipse cx="18" cy="20" rx="3" ry="5" fill="#fff" opacity=".22"/>'],
    "토마토": ["#C8352B", "#F3C2BC", '<circle cx="24" cy="27" r="14" fill="#D9412F"/><path d="M14 22c2-6 6-8 10-8" stroke="#7FA84A" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/><path d="M24 14l3-4 1 4 5-1-3 4 4 2-6 1-4 3-4-3-6-1 4-2-3-4 5 1 1-4z" fill="#3E8A33"/><circle cx="18" cy="28" r="3" fill="#fff" opacity=".28"/>']
  };
  function key(name) { var k = Object.keys(F).filter(function (n) { return name.indexOf(n) === 0; }); return k[0] || ""; }
  function svg(k, cls) { return '<svg class="' + (cls || "fico") + '" viewBox="0 0 48 48" aria-hidden="true">' + F[k][2] + "</svg>"; }

  function init(pn) {
    var tb = pn.querySelector(".ftable"); if (!tb || tb.dataset.fx) return;
    tb.dataset.fx = "1";
    var mo = new Date().getMonth() + 1;
    // ② 이번 달 — 오늘 날짜로
    Array.prototype.forEach.call(tb.querySelectorAll(".fnow"), function (e) { e.classList.remove("fnow"); });
    var heads = tb.querySelectorAll("thead .fm"); if (heads[mo - 1]) { heads[mo - 1].classList.add("fnow"); heads[mo - 1].setAttribute("title", "이번 달"); }
    var now = [], soon = [], end = [];
    Array.prototype.forEach.call(tb.querySelectorAll("tbody tr:not(.fdrow)"), function (tr) {
      var b = tr.querySelector(".fbtn"), n1 = b && b.querySelector(".fn1"); if (!n1) return;
      var name = n1.firstChild ? String(n1.firstChild.textContent).trim() : n1.textContent.trim(), k = key(name);
      var tds = tr.querySelectorAll("td.fc");
      Array.prototype.forEach.call(tds, function (td, i) { td.setAttribute("data-m", i + 1); });
      if (tds[mo - 1]) tds[mo - 1].classList.add("fnow");
      if (k) {
        tr.classList.add("fxrow"); tr.style.setProperty("--fcol", F[k][0]); tr.style.setProperty("--ftint", F[k][1]);
        if (!b.querySelector(".fico")) b.insertAdjacentHTML("afterbegin", svg(k));
        b.classList.add("fhasico");
      }
      var on = function (m) { var td = tds[(m + 11) % 12]; return td && td.classList.contains("on"); };
      var pk = function (m) { var td = tds[(m + 11) % 12]; return td && td.classList.contains("peak"); };
      var all = Array.prototype.every.call(tds, function (t) { return t.classList.contains("on"); });
      var item = { k: k, name: name, id: b.getAttribute("aria-controls"), peak: pk(mo), all: all, use: (b.querySelector(".fn3") || {}).textContent || "" };
      if (on(mo)) { if (!all && !on(mo + 1)) item.end = 1; now.push(item); }
      else if (on(mo + 1)) soon.push(item);
    });
    // ③ 이번 달 과일 카드
    var sec = pn.querySelector("section"), wrap = pn.querySelector(".ftwrap");
    if (sec && wrap && !pn.querySelector(".fnowbox")) {
      var card = function (x, tag, cls) {
        return '<button type="button" class="fcard ' + (cls || "") + '" data-go="' + (x.id || "") + '" style="--fcol:' + (F[x.k] || ["#8F5A22"])[0] + ";--ftint:" + (F[x.k] || ["", "#F2E9DA"])[1] + '">' +
          (x.k ? svg(x.k, "fcico") : "") + "<b>" + x.name.replace(/\s*\(.*\)$/, "") + "</b>" + (tag ? "<i>" + tag + "</i>" : "") + "</button>";
      };
      var h = '<div class="fnowbox"><div class="fnowh"><b>🧺 ' + mo + "월 과일</b><span>누르면 아래에서 다루는 법이 열립니다</span></div><div class=\"fcards\">" +
        now.map(function (x) { return card(x, x.all ? "상시" : x.end ? "이번 달까지" : x.peak ? "제철 최고" : "쓰는 중", x.end ? "fend" : x.peak ? "fpeak" : ""); }).join("") +
        soon.map(function (x) { return card(x, "다음 달 시작", "fsoon"); }).join("") +
        '</div><div class="flegend"><span><i class="lg pk"></i>진한 색 = 가장 많이 쓰는 때</span><span><i class="lg on"></i>연한 색 = 쓰는 때</span><span><i class="lg nw"></i>테두리 = 이번 달(' + mo + "월)</span></div></div>";
      wrap.insertAdjacentHTML("beforebegin", h);
    }
    // ④ 품종 단추 — 누르면 그 품종 쓰는 달이 칠해진다
    Array.prototype.forEach.call(pn.querySelectorAll(".vbtns"), function (box) {
      if (box.dataset.fx) return; box.dataset.fx = "1";
      var fi = box.dataset.f, strip = document.getElementById("vs" + fi), btns = Array.prototype.slice.call(box.querySelectorAll(".vbtn"));
      function pick(vi) {
        btns.forEach(function (b) {
          var on = b.dataset.v === String(vi), p = document.getElementById("fv" + fi + "_" + b.dataset.v);
          b.setAttribute("aria-pressed", String(on)); if (p) p.hidden = !on;
          if (on && strip) {
            strip.className = "vstrip " + (b.className.split(" ")[1] || "");
            var ms = (p ? p.dataset.months : "").split(",");
            strip.querySelectorAll(".vm").forEach(function (m) { m.classList.toggle("on", ms.indexOf(m.dataset.mo) >= 0); m.classList.toggle("now", +m.dataset.mo === mo); });
          }
        });
      }
      btns.forEach(function (b) { b.addEventListener("click", function () { pick(b.dataset.v); }); });
      pick(0);
    });
  }
  // 카드를 누르면 그 과일 줄을 펴고 그리로
  document.addEventListener("click", function (e) {
    var c = e.target.closest && e.target.closest("#tp7 .fcard, #skFcal .fcard"); if (!c) return;
    var host = c.closest("#tp7, #skFcal");
    var b = host.querySelector('.fbtn[aria-controls="' + c.dataset.go + '"]'); if (!b) return;
    if (b.getAttribute("aria-expanded") !== "true") b.click();
    b.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  // 재고·발주 「📒 발주 기준표」 탭 안 세 파트(발주 기준표 · 과일 달력 · 과일 한도선) — 처음엔 「🍓 과일」 탭 두 파트(10/28 · 사장님 「과일 달력을 재고 발주 과일 부분 안에 파트를 두 개로」)
  //  🗓 과일 달력 = tabs/tp7.html 첫 묶음(달력)을 그대로 불러와 보여 줌 — 과일 탭과 id가 겹치지 않게 sk 붙임
  (function () {
    var sk2 = document.getElementById("sk1"), cal = document.getElementById("skFcal"); if (!sk2 || !cal) return;
    var KEY = "cafesui.ui.skfpart", loaded = false;
    function loadCal() {
      if (loaded) return; loaded = true;
      var v = ((document.getElementById("verTag") || {}).textContent || "").trim();
      fetch("tabs/tp7.html?v=" + encodeURIComponent(v), { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) {
        var first = html.split("</section>")[0] + "</section>";
        first = first.replace(/id="(fr\d+)"/g, 'id="sk$1"').replace(/aria-controls="(fr\d+)"/g, 'aria-controls="sk$1"')
          .replace(/id="vs(\d+)"/g, 'id="vsk$1"').replace(/id="fv(\d+)_/g, 'id="fvk$1_').replace(/data-f="(\d+)"/g, 'data-f="k$1"');
        cal.innerHTML = first; init(cal);
      }).catch(function () { loaded = false; cal.innerHTML = '<div class="lazyload">불러오지 못했습니다 · 인터넷 연결을 확인하고 다시 눌러 주세요</div>'; });
    }
    function show(k) {
      try { localStorage.setItem(KEY, k); } catch (e) {}
      Array.prototype.forEach.call(sk2.querySelectorAll(".skfp"), function (b) { b.setAttribute("aria-selected", String(b.dataset.fp === k)); });
      Array.prototype.forEach.call(sk2.querySelectorAll(".skfpane"), function (p) { p.hidden = p.dataset.fp !== k; });
      if (k === "cal" && !sk2.hidden) loadCal();
    }
    // 「🍓 과일」 탭을 처음 열 때 달력을 불러옴 (첫 화면 가볍게)
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.sktab[data-c="sk1"]')) setTimeout(function () { if (!sk2.hidden && !sk2.querySelector('.skfpane[data-fp="cal"]').hidden) loadCal(); }, 30); });
    sk2.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".skfp"); if (b) show(b.dataset.fp); });
    var k0 = "ref"; try { k0 = localStorage.getItem(KEY) || "ref"; } catch (e) {}
    show(k0 === "cap" || k0 === "cal" ? k0 : "ref");
    window.__CS_SKFPART = show;
  })();
  var pn = document.getElementById("tp7"); if (!pn) return;
  init(pn);
  if (window.MutationObserver) new MutationObserver(function () { init(pn); }).observe(pn, { childList: true });
})();
