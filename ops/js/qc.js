// 🔎 맛 · 당도 기록 · 품질 이상 조기 경보 (10/21 사장님 「진짜 문제가 터지기 전에 잡아낼 수 있게」)
// 오늘 할 일 「🍓 케이크 파트 · 크림 · 과일 맛 · 당도 체크」 안 #qcBox — 품목 고르고 👍 괜찮아요 / ⚠ 이상 있어요 한 번에 기록.
// ⚠ 는 오늘 할 일 · 일지 맨 위 빨간 띠(#qcAlert)로 모두에게 — 사장님 · 정항아님이 「확인 · 조치함」 누를 때까지 계속 뜸 + 텔레그램 연결된 기기면 바로 보냄.
// 망고는 7일 넘게 기록이 없으면 노란 알림(사장님 「망고 매주 한 번」).
// 직원별 주 1회(10/22 사장님 「항아님/혜빈님 일주일에 한번씩 의무적으로 · 이상무 버튼 · 특이사항」): 맨 위 직원 줄 — 내 줄에서 👍 이상무 / 📝 특이사항(노란 · 경보 아님).
//   이번 주(월~) 그 사람 기록이 하나라도 있으면 완료 · 기록하면 오늘 할 일 t506도 같이 체크.
// 저장: cafesui.qc.<해> = { id: { d, at, who, it, ok(1|0), m, fix:{by, at, m} } } — 한 줄씩 더하기만(지우지 않음)
(function () {
  var box = document.getElementById("qcBox"); if (!box) return;
  var PRE = "cafesui.qc.", ITEMS = ["생크림", "망고", "딸기", "샤인머스캣", "초코 크림", "기타"], BOSS = ["사장님", "정항아"], REQ = ["정항아", "박혜빈"], WIT = "케이크 · 과일 당도", sel = "생크림";
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

  function weekStart() { var d = new Date(); d.setHours(0, 0, 0, 0); var w = d.getDay(); d.setDate(d.getDate() - (w === 0 ? 6 : w - 1)); return ymd(d); }   // 월요일부터(일요일 휴무)
  // 일주일에 1번은 꼭(10/21 사장님 「루틴화」) — 이번 주 기록 · 망고 기록 상태
  function weekState() {
    var ws = weekStart(), L = all().filter(function (x) { return x.d >= ws; }), done = {};
    var by = {}, td = ymd(new Date());
    L.forEach(function (x) { done[x.it] = 1; var b = by[x.who] || (by[x.who] = { n: 0, last: null, today: false }); b.n++; if (!b.last) b.last = x; if (x.d === td) b.today = true; });
    var dw = new Date().getDay(), miss = REQ.filter(function (n) { return !by[n]; });
    return { ws: ws, n: L.length, done: done, by: by, miss: miss, mango: !!done["망고"], late: dw === 6, mid: dw >= 4 || dw === 0 };
  }
  function draw() {
    if (box.contains(document.activeElement) && document.activeElement.tagName === "INPUT") return;
    var L = all(), W = weekState(), warn = "";
    if (W.n && W.miss.length) warn += '<p class="qcwarn' + (W.late ? " late" : "") + '">👥 <b>이번 주 아직 안 한 사람: ' + W.miss.map(nim).join(" · ") + "</b>" + (W.late ? " — 오늘(토)이 마지막 영업일" : "") + "</p>";
    if (!W.n) warn += '<p class="qcwarn' + (W.late ? " late" : "") + '">🔎 <b>이번 주 맛 · 당도 기록이 아직 없어요</b>' + (W.late ? " — 오늘(토)이 이번 주 마지막 영업일이에요" : " — 케이크 작업하실 때 맛 보고 아래에 남겨 주세요") + "</p>";
    if (!W.mango) warn += '<p class="qcwarn' + (W.late ? " late" : "") + '">🥭 <b>망고 이번 주 기록이 없어요</b> — 크림 만들 때 맛 보고 남겨 주세요</p>';
    box.innerHTML = '<div class="qch"><b>🔎 맛 · 당도 기록</b><span>맛 보고 바로 남기기 · <b>조금이라도 이상하면 ⚠</b> — 문제 터지기 전에 다 같이 봅니다</span></div>' +
      '<p class="qcrule">📌 <b>이거 일주일에 1번씩은 체크해서 작성해주세요</b> 케이크 작업 근무하시면서 (루틴화시킬거예요)</p>' + staffRows(W) +
      '<div class="qcweek">이번 주(' + md(W.ws) + ' 월~) 기록 <b>' + W.n + '건</b>' + ITEMS.filter(function (n) { return n !== "기타"; }).map(function (n) { return '<span class="qcwk' + (W.done[n] ? " on" : "") + '">' + (W.done[n] ? "✔ " : "") + n + "</span>"; }).join("") + "</div>" + warn +
      '<div class="qcit" role="group" aria-label="품목">' + ITEMS.map(function (n) { return '<button type="button" class="qcchip' + (n === sel ? " on" : "") + '" data-it="' + n + '" aria-pressed="' + (n === sel) + '">' + n + "</button>"; }).join("") + "</div>" +
      '<input type="text" class="qcm" placeholder="어땠는지 (예: 망고 신맛 강함 · 설탕 +10g 으로 맞춤 / 딸기 당도 좋음)" aria-label="메모">' +
      '<div class="qcbtns"><button type="button" class="qcok">👍 괜찮아요</button><button type="button" class="qcbad">⚠ 이상 있어요</button></div>' +
      (L.length ? '<div class="qclist"><div class="qclh">최근 기록</div>' + L.slice(0, 8).map(function (x) {
        return '<div class="qcl ' + (x.ok ? (x.nt ? "note" : "ok") : x.fix ? "fixed" : "bad") + '"><span class="qcd">' + md(x.d) + " " + esc(x.at) + "</span><b>" + (x.ok ? (x.nt ? "📝" : "👍") : "⚠") + " " + esc(x.it) + "</b> " + esc(x.m || "") + ' <em>' + esc(nim(x.who)) + "</em>" +
          (x.fix ? '<span class="qcfix">✔ ' + esc(nim(x.fix.by)) + " 조치" + (x.fix.m ? " — " + esc(x.fix.m) : "") + "</span>" : "") + "</div>";
      }).join("") + "</div>" : "");
    paintAlert(W);
  }
  // 직원 줄 — 이번 주 했는지 · 오늘 했는지 · 내 줄에서만 버튼
  function staffRows(W) {
    var m = me(), names = REQ.slice();
    if (m && m !== "사장님" && names.indexOf(m) < 0) names.push(m);
    return '<div class="qcstaff"><div class="qcsth">👥 직원별 이번 주 당도 체크 <span>일주일에 한 번 꼭 · 케이크 · 과일 맛 보고 남기기</span></div>' + names.map(function (n) {
      var b = W.by[n], mine = n === m, req = REQ.indexOf(n) >= 0;
      var st = b ? '<span class="qcsok">✔ 이번 주 완료 · ' + md(b.last.d) + " " + esc(b.last.at) + (b.today ? " (오늘)" : "") + "</span>" + '<span class="qcslast">' + (b.last.ok ? (b.last.nt ? "📝 " : "👍 ") : "⚠ ") + esc(b.last.m || b.last.it) + "</span>"
        : '<span class="qcsno">' + (req ? "이번 주 아직" : "아직") + "</span>";
      return '<div class="qcsr' + (b ? " done" : "") + (mine ? " mine" : "") + '"><b class="qcsn">' + esc(nim(n)) + "</b>" + st +
        (mine ? '<div class="qcsact"><button type="button" class="qcfine">👍 이상무</button><input type="text" class="qcnt" placeholder="특이사항 (예: 망고 신맛 조금 · 설탕 +5g)" aria-label="특이사항"><button type="button" class="qcntb">📝 특이사항 남기기</button></div>' : "") + "</div>";
    }).join("") + (m ? "" : '<p class="qcsme">이름을 고르면 내 줄에 「👍 이상무」 버튼이 생겨요</p>') + "</div>";
  }
  function weekly(note) {
    var w = me(); if (!w) { alert("먼저 이름을 고르세요"); return; }
    var inp = box.querySelector(".qcnt"), m = note ? inp.value.trim() : "이상무";
    if (note && !m) { alert("특이사항을 한 줄 적어 주세요"); inp.focus(); return; }
    var d = new Date(), id = "q" + Date.now().toString(36);
    save(d.getFullYear(), function (o) { o[id] = { d: ymd(d), at: pad(d.getHours()) + ":" + pad(d.getMinutes()), who: w, it: WIT, ok: 1, m: m, wk: 1, nt: note ? 1 : 0 }; });
    tick(); draw(); toast(note ? "📝 특이사항 남겼어요" : "👍 이상무 기록했어요");
  }
  // 기록하면 오늘 할 일 「★ 케이크 크림 … 당도 체크」(t506)도 같이 체크
  function tick() { var b = document.querySelector('#tp2 .box[data-k="t506"]'); if (b && b.getAttribute("aria-pressed") !== "true" && !document.getElementById("tdPastMsg")) b.click(); }
  function add(ok) {
    var w = me(); if (!w) { alert("먼저 이름을 고르세요 (누가 봤는지 남깁니다)"); return; }
    var inp = box.querySelector(".qcm"), m = inp.value.trim(), it = sel;
    if (it === "기타" && !m) { alert("「기타」는 무엇인지 메모에 적어 주세요"); inp.focus(); return; }
    if (!ok && !m) { alert("어떤 점이 이상한지 한 줄만 적어 주세요 (예: 망고 신맛 강함)"); inp.focus(); return; }
    var d = new Date(), y = d.getFullYear(), id = "q" + Date.now().toString(36), at = pad(d.getHours()) + ":" + pad(d.getMinutes());
    save(y, function (o) { o[id] = { d: ymd(d), at: at, who: w, it: it, ok: ok ? 1 : 0, m: m }; });
    inp.value = ""; inp.blur(); tick(); draw();
    if (!ok) {
      var txt = "⚠ [품질 이상] " + it + " — " + m + "\n" + nim(w) + " · " + md(ymd(d)) + " " + at + "\n사장님 · 매니저님 확인 부탁드려요 (오늘 할 일 맨 위 빨간 띠)";
      var T = window.__CS_TG;
      if (T && T.ready && T.ready()) T.sendText(txt).then(function () { toast("⚠ 기록하고 텔레그램에 보냈어요"); }, function () { toast("⚠ 기록했어요 · 텔레그램은 직접 알려 주세요"); });
      else if (T && T.share) { T.share(txt); toast("⚠ 기록했어요 — 공유 창(또는 복사된 글)으로 텔레그램 단톡방에 바로 알려 주세요"); }
      else toast("⚠ 기록했어요 — 텔레그램 단톡방에도 바로 알려 주세요");
    } else toast("👍 " + it + " 기록했어요");
  }
  function toast(t) { if (window.__CS_TOAST) window.__CS_TOAST(t); }
  box.addEventListener("click", function (e) {
    var c = e.target.closest(".qcchip"); if (c) { sel = c.dataset.it; Array.prototype.forEach.call(box.querySelectorAll(".qcchip"), function (b) { var on = b === c; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); }); return; }
    if (e.target.closest(".qcfine")) { weekly(false); return; } if (e.target.closest(".qcntb")) { weekly(true); return; }
    if (e.target.closest(".qcok")) add(true); else if (e.target.closest(".qcbad")) add(false);
  });
  box.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("qcm")) { e.preventDefault(); } if (e.key === "Enter" && e.target.classList.contains("qcnt")) { e.preventDefault(); weekly(true); } });

  // 빨간 띠 — 오늘 할 일 · 일지 맨 위(모토 띠 아래)
  function paintAlert(W) {
    var L = open_(), can = BOSS.indexOf(me()) >= 0;
    W = W || weekState();
    var tp = document.getElementById("tp2");
    if (tp) {
      var wk = tp.querySelector(":scope > .qcwkband"), need = W.mid && (!W.n || !W.mango || W.miss.length);
      if (!need) { if (wk) wk.remove(); }
      else {
        if (!wk) { wk = document.createElement("div"); wk.className = "qcwkband"; var m0 = tp.querySelector(":scope > .csmotto"); tp.insertBefore(wk, m0 ? m0.nextSibling : tp.firstChild); }
        wk.classList.toggle("late", W.late);
        wk.innerHTML = "🔎 <b>" + (!W.n ? "이번 주 맛 · 당도 기록이 아직 없어요" : W.miss.length ? "이번 주 당도 체크 아직: " + W.miss.map(nim).join(" · ") : "망고 이번 주 기록이 없어요") + "</b>" + (W.late ? " — 오늘(토)이 이번 주 마지막 영업일" : "") + ' · 케이크 작업하실 때 미들 「🔎 맛 · 당도 기록」에 남겨 주세요 <button type="button" class="qcgo">기록하러 가기 →</button>';
      }
    }
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
    if (e.target.closest(".qcgo")) { var st = document.querySelector('#tp2 .stab[data-s="td1"]'); if (st) st.click(); setTimeout(function () { box.scrollIntoView({ block: "center", behavior: "smooth" }); }, 120); return; }
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
