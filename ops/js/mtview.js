/* 월말회의 화면 나누기 (11/25 · 사장님 「한눈에 보기랑 내용 쓰는 거랑 섹션을 분류해서 · 더 편하게 쓸 수 있게」 「직원들도 다 보고 하니까」)
   📊 한눈에 보기 = 회의록 미리보기(숫자 카드 · 비교표 카드 · 내용)만 넓게
   📋 숫자 비교표 = 작년 ↔ 이번 달 표만
   ✏ 내용 쓰기   = 묶음 번호 단추로 한 묶음씩(또는 전체) · 칸은 글 길이만큼 늘어남
   저장 · 칸 이름(data-k)은 그대로 — 보이는 모양만 바꿈. 고른 화면은 기기에 기억(cafesui.ui.mtview · mtsec). */
(function () {
  var P = document.getElementById("tp5"); if (!P) return;
  var form = document.getElementById("mtForm"), wrap = P.querySelector(".rpwrap");
  if (!form || !wrap) return;
  var KV = "cafesui.ui.mtview", KS = "cafesui.ui.mtsec";
  function get(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ── 위 화면 고르기 ── */
  var V = [["view", "📊", "한눈에 보기", "숫자 카드 · 회의록 전체"],
           ["table", "📋", "숫자 비교표", "작년 ↔ 이번 달"],
           ["write", "✏️", "내용 쓰기", "묶음별로 하나씩"]];
  var nav = document.createElement("nav");
  nav.id = "mtNav"; nav.className = "mtnav"; nav.setAttribute("aria-label", "월말회의 화면 고르기");
  nav.innerHTML = V.map(function (v) {
    return '<button type="button" class="mtv" data-mv="' + v[0] + '" aria-pressed="false"><span class="mtvi" aria-hidden="true">' + v[1] +
      '</span><span class="mtvt"><b>' + v[2] + '</b><small class="mtvs" data-s="' + v[0] + '">' + v[3] + "</small></span></button>";
  }).join("");
  wrap.parentNode.insertBefore(nav, wrap);

  var hintT = document.createElement("p"); hintT.className = "mthint mthint-t";
  hintT.innerHTML = "📋 숫자는 위 「📥 이 달 데이터 한 번에 가져오기」를 누르면 채워져요 · 직접 고쳐도 돼요 · 오른쪽 메모 칸은 글이 길면 저절로 늘어나요";
  var firstCmp = P.querySelector(".cmpwrap"); if (firstCmp) firstCmp.parentNode.insertBefore(hintT, firstCmp);

  /* ── 내용 쓰기: 묶음 단추 ── */
  var secs = Array.prototype.filter.call(form.children, function (c) { return c.classList && c.classList.contains("fsec"); });
  secs.forEach(function (s, i) { var h = s.querySelector(".fsh"); if (h) h.setAttribute("data-n", i + 1); s.setAttribute("data-si", i); });
  function sname(i) { var h = secs[i] && secs[i].querySelector(".fsh"); return h ? h.textContent.trim() : ""; }
  var top = document.createElement("div"); top.className = "mtsectop";
  top.innerHTML = '<p class="mthint">✏️ 칸을 누르고 쓰면 <b>바로 저장</b>돼요 · 글이 길어지면 칸이 <b>저절로 늘어나요</b> · 아래 번호를 누르면 그 묶음만 보여요</p><div class="mtsecnav" id="mtSecNav"></div>';
  form.insertBefore(top, form.firstChild);
  var secNav = top.querySelector("#mtSecNav");
  var foot = document.createElement("div"); foot.className = "mtsecfoot"; foot.id = "mtSecFoot";
  form.appendChild(foot);

  function rowsOf(s) {
    return Array.prototype.filter.call(s.querySelectorAll(".frow"), function (r) { return !r.hidden && r.querySelector(".fin"); });
  }
  function filled(r) { var el = r.querySelector(".fin"); return !!(el && String(el.value || "").trim()); }

  var cur = get(KS, "0");
  function drawSecNav() {
    var all = 0, done = 0;
    var h = secs.map(function (s, i) {
      var rs = rowsOf(s), f = rs.filter(filled).length; all += rs.length; done += f;
      var ok = rs.length && f === rs.length;
      rs.forEach(function (r) { r.classList.toggle("has", filled(r)); });
      return '<button type="button" class="mtsc' + (String(i) === cur ? " on" : "") + (ok ? " ok" : "") + '" data-i="' + i + '">' +
        '<span class="mtscn">' + (ok ? "✔" : i + 1) + '</span><span class="mtscl">' + esc(sname(i)) + '</span><small>' + f + "/" + rs.length + "</small></button>";
    }).join("");
    h += '<button type="button" class="mtsc mtscall' + (cur === "all" ? " on" : "") + '" data-i="all"><span class="mtscn">☰</span><span class="mtscl">전체 한 번에</span></button>';
    secNav.innerHTML = h;
    var ws = nav.querySelector('.mtvs[data-s="write"]'); if (ws) ws.textContent = done + " / " + all + "칸 적음";
  }
  function drawFoot() {
    if (cur === "all") { foot.innerHTML = ""; foot.hidden = true; return; }
    var i = +cur, h = "";
    h += i > 0 ? '<button type="button" class="mtfb" data-go="' + (i - 1) + '">← ' + (i) + ". " + esc(sname(i - 1)) + "</button>" : "<span></span>";
    h += i < secs.length - 1 ? '<button type="button" class="mtfb nx" data-go="' + (i + 1) + '">' + (i + 2) + ". " + esc(sname(i + 1)) + " →</button>"
                             : '<button type="button" class="mtfb nx" data-mvgo="view">다 썼어요 · 📊 한눈에 보기로 →</button>';
    foot.innerHTML = h; foot.hidden = false;
  }
  function applySec() {
    if (cur !== "all" && !(+cur >= 0 && +cur < secs.length)) cur = "0";
    secs.forEach(function (s, i) { s.classList.toggle("mtoff", cur !== "all" && String(i) !== cur); });
    form.classList.toggle("mtone", cur !== "all");
    drawSecNav(); drawFoot();
  }
  function goSec(i) {
    cur = String(i); put(KS, cur); applySec();
    setTimeout(growAll, 20);
    scrollTo(top);
  }

  /* 위에 붙은 저장 줄 · 휴대폰 위 줄에 안 가리게 스크롤 */
  function topOff() {
    var v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--csSbH")) || 0;
    if (document.documentElement.classList.contains("mob")) v = 64;
    return v + 10;
  }
  function scrollTo(el) {
    var y = el.getBoundingClientRect().top - topOff();
    if (y < 0 || y > window.innerHeight * 0.6) window.scrollBy({ top: y, behavior: "smooth" });
  }
  /* ── 글 길이만큼 늘어나는 칸 (사파리 · 아이폰도) ── */
  function grow(el) {
    if (!el || el.tagName !== "TEXTAREA" || !el.offsetParent) return;
    el.style.height = "auto";
    el.style.height = (el.scrollHeight + 2) + "px";
  }
  function growAll() { P.querySelectorAll("#mtForm textarea.fin, .cmpwrap textarea.memo").forEach(grow); }

  /* ── 비교표 칸 수 ── */
  function tableCount() {
    var cs = P.querySelectorAll('.cmpwrap .cin[data-col="now"]'), f = 0;
    cs.forEach(function (c) { if (String(c.value || "").trim()) f++; });
    var ts = nav.querySelector('.mtvs[data-s="table"]'); if (ts) ts.textContent = "이번 달 " + f + " / " + cs.length + "칸";
  }

  /* ── 화면 바꾸기 ── */
  function setMode(m, scroll) {
    if (!/^(view|table|write)$/.test(m)) m = "view";
    P.setAttribute("data-mv", m); put(KV, m);
    nav.querySelectorAll(".mtv").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mv === m ? "true" : "false"); });
    if (m === "write") applySec();
    setTimeout(growAll, 30);
    if (scroll) scrollTo(nav);
  }

  nav.addEventListener("click", function (e) { var b = e.target.closest(".mtv"); if (b) setMode(b.dataset.mv, true); });
  secNav.addEventListener("click", function (e) { var b = e.target.closest(".mtsc"); if (b) goSec(b.dataset.i); });
  foot.addEventListener("click", function (e) {
    var b = e.target.closest(".mtfb"); if (!b) return;
    if (b.dataset.mvgo) { setMode(b.dataset.mvgo, true); return; }
    goSec(b.dataset.go);
  });

  var cT = 0;
  function refresh() { clearTimeout(cT); cT = setTimeout(function () { drawSecNav(); tableCount(); growAll(); }, 300); }
  P.addEventListener("input", function (e) {
    var t = e.target;
    if (t && t.tagName === "TEXTAREA" && (t.classList.contains("fin") || t.classList.contains("memo"))) grow(t);
    refresh();
  });
  window.addEventListener("cs:remote", function () { setTimeout(refresh, 400); });
  window.addEventListener("resize", function () { clearTimeout(cT); cT = setTimeout(growAll, 200); });
  var mEl = document.getElementById("mtMonth"); if (mEl) mEl.addEventListener("change", function () { setTimeout(refresh, 500); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp5"]')) setTimeout(refresh, 120); });
  /* 표 숫자가 바뀌면 app.js가 부르는 미리보기 다시 그리기에 칸 늘이기 · 칸 수도 같이 */
  var o = window.__CS_MTREP;
  if (o) window.__CS_MTREP = function () { o.apply(this, arguments); refresh(); };

  setMode(get(KV, "view"));
  [600, 2000, 4500].forEach(function (t) { setTimeout(refresh, t); });
})();
