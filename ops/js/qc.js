// 🔎 맛 · 당도 기록 · 품질 이상 조기 경보 (10/21 사장님 「진짜 문제가 터지기 전에 잡아낼 수 있게」)
// 오늘 할 일 「🍓 케이크 파트 · 크림 · 과일 맛 · 당도 체크」 안 #qcBox — 품목 고르고 👍 괜찮아요 / ⚠ 이상 있어요 한 번에 기록.
// ⚠ 는 오늘 할 일 · 일지 맨 위 빨간 띠(#qcAlert)로 모두에게 — 사장님 · 정항아님이 「확인 · 조치함」 누를 때까지 계속 뜸 + 텔레그램 연결된 기기면 바로 보냄.
// 망고는 7일 넘게 기록이 없으면 노란 알림(사장님 「망고 매주 한 번」).
// 저장: cafesui.qc.<해> = { id: { d, at, who, it, ok(1|0), m, fix:{by, at, m} } } — 한 줄씩 더하기만(지우지 않음)
(function () {
  var box = document.getElementById("qcBox"); if (!box) return;
  var PRE = "cafesui.qc.", ITEMS = ["생크림", "망고", "딸기", "샤인머스캣", "초코 크림", "기타"], BOSS = ["사장님", "정항아"], sel = "생크림";
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function nim(n) { return n && n !== "사장님" ? n + "님" : n || ""; }
  function md(s) { var p = String(s).split("-"); return +p[1] + "/" + +p[2]; }
  function load(y) { try { return JSON.parse(localStorage.getItem(PRE + y) || "{}") || {}; } catch (e) { return {}; } }
  function save(y, fn) { var o = load(y); fn(o); try { localStorage.setItem(PRE + y, JSON.stringify(o)); } catch (e) {} }
  function all() {   // 올해 + 지난해(1월 초에 12월 기록도 보이게)
    var y = new Date().getFullYear(), L = [];
    [y - 1, y].forEach(function (yy) { var o = load(yy); Object.keys(o).forEach(function (k) { var x = o[k]; if (x && x.d) L.push(Object.assign({ id: k, y: yy }, x)); }); });
    return L.sort(function (a, b) { return (a.d + a.at) < (b.d + b.at) ? 1 : -1; });
  }
  function open_() { return all().filter(function (x) { return !x.ok && !x.fix; }); }
  function daysSince(s) { var p = s.split("-"); return Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(+p[0], +p[1] - 1, +p[2])) / 864e5); }

  function draw() {
    if (box.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;
    var L = all(), mango = L.filter(function (x) { return x.it === "망고"; })[0], warn = "";
    if (!mango || daysSince(mango.d) >= 7) warn = '<p class="qcwarn">🥭 <b>망고 이번 주 기록이 없어요</b>' + (mango ? " · 마지막 " + md(mango.d) + " (" + daysSince(mango.d) + "일 전)" : "") + " — 크림 만들 때 맛 보고 아래에 남겨 주세요</p>";
    box.innerHTML = '<div class="qch"><b>🔎 맛 · 당도 기록</b><span>맛 보고 바로 남기기 · <b>조금이라도 이상하면 ⚠</b> — 문제 터지기 전에 다 같이 봅니다</span></div>' + warn +
      '<div class="qcit" role="group" aria-label="품목">' + ITEMS.map(function (n) { return '<button type="button" class="qcchip' + (n === sel ? " on" : "") + '" data-it="' + n + '" aria-pressed="' + (n === sel) + '">' + n + "</button>"; }).join("") + "</div>" +
      '<input type="text" class="qcm" placeholder="어땠는지 (예: 망고 신맛 강함 · 설탕 +10g 으로 맞춤 / 딸기 당도 좋음)" aria-label="메모">' +
      '<div class="qcbtns"><button type="button" class="qcok">👍 괜찮아요</button><button type="button" class="qcbad">⚠ 이상 있어요</button></div>' +
      (L.length ? '<div class="qclist"><div class="qclh">최근 기록</div>' + L.slice(0, 8).map(function (x) {
        return '<div class="qcl ' + (x.ok ? "ok" : x.fix ? "fixed" : "bad") + '"><span class="qcd">' + md(x.d) + " " + esc(x.at) + "</span><b>" + (x.ok ? "👍" : "⚠") + " " + esc(x.it) + "</b> " + esc(x.m || "") + ' <em>' + esc(nim(x.who)) + "</em>" +
          (x.fix ? '<span class="qcfix">✔ ' + esc(nim(x.fix.by)) + " 조치" + (x.fix.m ? " — " + esc(x.fix.m) : "") + "</span>" : "") + "</div>";
      }).join("") + "</div>" : "");
    paintAlert();
  }
  function add(ok) {
    var w = me(); if (!w) { alert("먼저 이름을 고르세요 (누가 봤는지 남깁니다)"); return; }
    var inp = box.querySelector(".qcm"), m = inp.value.trim(), it = sel;
    if (it === "기타" && !m) { alert("「기타」는 무엇인지 메모에 적어 주세요"); inp.focus(); return; }
    if (!ok && !m) { alert("어떤 점이 이상한지 한 줄만 적어 주세요 (예: 망고 신맛 강함)"); inp.focus(); return; }
    var d = new Date(), y = d.getFullYear(), id = "q" + Date.now().toString(36), at = pad(d.getHours()) + ":" + pad(d.getMinutes());
    save(y, function (o) { o[id] = { d: ymd(d), at: at, who: w, it: it, ok: ok ? 1 : 0, m: m }; });
    inp.value = ""; inp.blur(); draw();
    if (!ok) {
      var txt = "⚠ [품질 이상] " + it + " — " + m + "\n" + nim(w) + " · " + md(ymd(d)) + " " + at + "\n사장님 · 매니저님 확인 부탁드려요 (오늘 할 일 맨 위 빨간 띠)";
      var T = window.__CS_TG;
      if (T && T.ready && T.ready()) T.sendText(txt).then(function () { toast("⚠ 기록하고 텔레그램에 보냈어요"); }, function () { toast("⚠ 기록했어요 · 텔레그램은 직접 알려 주세요"); });
      else toast("⚠ 기록했어요 — 텔레그램 단톡방에도 바로 알려 주세요");
    } else toast("👍 " + it + " 기록했어요");
  }
  function toast(t) { if (window.__CS_TOAST) window.__CS_TOAST(t); }
  box.addEventListener("click", function (e) {
    var c = e.target.closest(".qcchip"); if (c) { sel = c.dataset.it; Array.prototype.forEach.call(box.querySelectorAll(".qcchip"), function (b) { var on = b === c; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); }); return; }
    if (e.target.closest(".qcok")) add(true); else if (e.target.closest(".qcbad")) add(false);
  });
  box.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("qcm")) { e.preventDefault(); } });

  // 빨간 띠 — 오늘 할 일 · 일지 맨 위(모토 띠 아래)
  function paintAlert() {
    var L = open_(), can = BOSS.indexOf(me()) >= 0;
    ["tp2", "tp4"].forEach(function (pid) {
      var p = document.getElementById(pid); if (!p) return;
      var el = p.querySelector(":scope > .qcalert");
      if (!L.length) { if (el) el.remove(); return; }
      if (!el) { el = document.createElement("div"); el.className = "qcalert"; el.setAttribute("role", "alert"); var m = p.querySelector(":scope > .csmotto"); p.insertBefore(el, m ? m.nextSibling : p.firstChild); }
      el.innerHTML = '<div class="qcah">⚠ 품질 이상 ' + L.length + "건 — 확인 · 조치할 때까지 계속 보입니다</div>" + L.map(function (x) {
        return '<div class="qcar" data-id="' + x.id + '" data-y="' + x.y + '"><span><b>' + esc(x.it) + "</b> " + esc(x.m) + " <em>" + esc(nim(x.who)) + " · " + md(x.d) + " " + esc(x.at) + "</em></span>" +
          (can ? '<button type="button" class="qcfixb">✔ 확인 · 조치함</button>' : '<i>사장님 · 매니저님 확인 기다리는 중</i>') + "</div>";
      }).join("");
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".qcfixb"); if (!b) return;
    var r = b.closest(".qcar"), id = r.dataset.id, y = +r.dataset.y;
    var m = prompt("어떻게 조치했는지 한 줄 (예: 망고 설탕 +10g · 거래처에 알림)", ""); if (m === null) return;
    var d = new Date(); save(y, function (o) { if (o[id]) o[id].fix = { by: me(), at: md(ymd(d)) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()), m: m.trim() }; });
    draw(); toast("✔ 조치 기록했어요");
  });
  // 모토 띠가 다시 붙을 때 · 다른 기기 변경 · 이름 바뀔 때 다시 그림
  window.addEventListener("cs:remote", function () { setTimeout(draw, 200); });
  window.addEventListener("cs:me", function () { setTimeout(draw, 50); });
  draw();
  setInterval(function () { if (!box.contains(document.activeElement)) draw(); }, 600000);
})();
