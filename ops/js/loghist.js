// 🕘 일지 저장 기록 · 되살리기 (10/23 사장님 「1번」 — 일지 칸이 지워져도 되살릴 수 있게)
// 기록은 sync.js histRec가 서버 ops/「hist.log.<날짜>」에 쌓는다(90초에 한 번 · 글이 짧아지거나 지워지면 바로 · 기기 저장소엔 안 들어감).
// 여기서는 그날 기록을 읽어 시간순으로 보여 주고, 지워진 글 · 예전 글을 「되살리기」로 칸에 다시 넣는다(지금 칸에 이미 있으면 안 넣음 · 다른 글이 있으면 아래 줄에 덧붙임).
(function () {
  var btn = document.getElementById("lgHist"), box = document.getElementById("lgHistBox"), dateEl = document.getElementById("lgDate");
  if (!btn || !box || !dateEl) return;
  var NL = String.fromCharCode(10), list = [], openD = "";
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hm(t) { var d = new Date(t); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function nim(n) { return n ? (n === "사장님" ? n : n + "님") : "이름 없음"; }
  function field(k) { return document.querySelector('#tp4 .lgin[data-k="' + k + '"]'); }
  function label(k) { var el = field(k); var t = el ? (el.getAttribute("aria-label") || "") : ""; return t.replace(/<[^>]*>.*$/, "").trim() || k; }
  function cut(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n) + "…" : s; }
  function day() { if (dateEl.value) return dateEl.value; var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function toast(t) { if (window.__CS_TOAST) window.__CS_TOAST(t); }

  function draw() {
    if (!list.length) { box.innerHTML = '<div class="lhh"><b>🕘 ' + esc(openD.slice(5).replace("-", "/")) + ' 저장 기록</b><button type="button" class="lhx">닫기</button></div><p class="lhnone">아직 이 날 기록이 없어요 (10/23부터 쌓입니다 · 쓰면 90초마다 한 번씩 남아요)</p>'; return; }
    // 지금 칸에 없는 「지워진 글」을 맨 위에 모아서
    var lost = [];
    list.forEach(function (e, i) {
      Object.keys(e.was || {}).forEach(function (k) {
        var el = field(k), cur = el ? el.value : "", t = e.was[k];
        if (t && cur.indexOf(t) < 0) lost.push({ i: i, k: k, t: t, e: e });
      });
    });
    var h = '<div class="lhh"><b>🕘 ' + esc(openD.slice(5).replace("-", "/")) + ' 저장 기록</b> <span>' + list.length + '개 · 칸이 지워지거나 짧아지면 그 전 글을 바로 남겨요</span><button type="button" class="lhx">닫기</button></div>';
    if (lost.length) h += '<div class="lhlost"><b>⚠ 지금 칸에 없는 지워진 글 ' + lost.length + '개</b>' + lost.map(function (x) {
      return '<div class="lhr"><span class="lht">' + hm(x.e.at) + "</span> <b>" + esc(label(x.k)) + '</b><div class="lhtx">' + esc(cut(x.t, 160)) + '</div><button type="button" class="lhrs" data-i="' + x.i + '" data-k="' + esc(x.k) + '" data-w="was">↺ 이 글 되살리기</button></div>';
    }).join("") + "</div>";
    h += '<div class="lhlist">' + list.map(function (e, i) {
      var ks = Object.keys(e.ch || {}), ws = Object.keys(e.was || {});
      var head = '<span class="lht">' + hm(e.at) + "</span> " + esc(nim(e.who)) + (e.full ? ' <i>처음 모습</i>' : "") + " · " + (ks.length ? "바뀐 칸 " + ks.length : "") + (ws.length ? ' <em class="lhw">⚠ 짧아짐 · 지워짐 ' + ws.length + "</em>" : "");
      var body = ws.map(function (k) { return '<div class="lhr was"><b>' + esc(label(k)) + ' (지워지기 전)</b><div class="lhtx">' + esc(cut(e.was[k], 300)) + '</div><button type="button" class="lhrs" data-i="' + i + '" data-k="' + esc(k) + '" data-w="was">↺ 되살리기</button></div>'; }).join("") +
        ks.map(function (k) { return '<div class="lhr"><b>' + esc(label(k)) + '</b><div class="lhtx">' + esc(cut(e.ch[k], 300)) + '</div><button type="button" class="lhrs" data-i="' + i + '" data-k="' + esc(k) + '" data-w="ch">↺ 이 글로 칸에 넣기</button></div>'; }).join("");
      return '<details class="lhe' + (ws.length ? " haswas" : "") + '"><summary>' + head + "</summary>" + body + "</details>";
    }).reverse().join("") + "</div>";
    box.innerHTML = h;
  }
  function load() {
    openD = day(); box.hidden = false;
    box.innerHTML = '<p class="lhnone">🕘 기록 불러오는 중…</p>';
    if (!window.__CS_HIST) { box.innerHTML = '<div class="lhh"><b>🕘 저장 기록</b><button type="button" class="lhx">닫기</button></div><p class="lhnone">서버에 연결된 뒤에 볼 수 있어요</p>'; return; }
    window.__CS_HIST(openD).then(function (a) { list = (a || []).sort(function (x, y) { return x.at - y.at; }); draw(); }, function () { box.innerHTML = '<p class="lhnone">기록을 못 불러왔어요 — 잠시 뒤 다시 눌러 주세요</p>'; });
  }
  btn.addEventListener("click", function () { if (!box.hidden && openD === day()) { box.hidden = true; return; } load(); });
  dateEl.addEventListener("change", function () { if (!box.hidden) load(); });
  ["lgPrev", "lgNext", "lgToday"].forEach(function (id) { var b = document.getElementById(id); if (b) b.addEventListener("click", function () { if (!box.hidden) setTimeout(load, 50); }); });
  box.addEventListener("click", function (ev) {
    if (ev.target.closest(".lhx")) { box.hidden = true; return; }
    var b = ev.target.closest(".lhrs"); if (!b) return;
    if (openD !== day()) { alert("다른 날짜 일지가 열려 있어요 — 기록을 다시 열어 주세요"); return; }
    var e = list[+b.dataset.i], k = b.dataset.k, t = e && (b.dataset.w === "was" ? (e.was || {})[k] : (e.ch || {})[k]), el = field(k);
    if (!t || !el) return;
    if (el.value.indexOf(t) >= 0) { toast("이미 칸에 그 글이 있어요"); return; }
    var add = el.value.trim() ? el.value.replace(/\s+$/, "") + NL + t : t;
    if (!confirm("「" + label(k) + "」 칸에 이 글을 " + (el.value.trim() ? "아래 줄에 덧붙일까요?" : "넣을까요?") + NL + NL + cut(t, 200))) return;
    el.value = add; el.dispatchEvent(new Event("input", { bubbles: true }));
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    toast("↺ 되살렸어요 — 「" + label(k) + "」");
    setTimeout(draw, 300);
  });
})();
