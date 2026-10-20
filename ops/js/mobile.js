// 📱 휴대폰 모드 (10/20 · 사장님 「휴대폰으로 접속하면 휴대폰 모드로 · 컴퓨터는 컴퓨터 모드」)
// 휴대폰이면 html.mob — 위 큰 머리 · 문구 · 저장 상자 · 메뉴 상자를 숨기고 짧은 위 줄 + 아래 고정 메뉴(매일 쓰는 5개 + 전체)로.
// 「💻 컴퓨터 화면으로」를 누르면 그 기기만 컴퓨터 모양(cafesui.ui.viewmode = "pc" · 화면 폭 1280) — 오른쪽 아래 「📱 휴대폰 화면」으로 돌아옴.
// 판단(어느 모드인지)은 index.html 맨 위 작은 스크립트가 먼저 한다(화면이 한 번 컴퓨터 모양으로 그려졌다 바뀌지 않게) — 여기서는 그 결과만 씀.
(function () {
  var KEY = "cafesui.ui.viewmode", root = document.documentElement;
  function setMode(m) {
    try { if (m) localStorage.setItem(KEY, m); else localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  }
  window.__CS_VIEWMODE = setMode;

  // 휴대폰인데 컴퓨터 화면으로 보는 중 — 돌아가는 단추만
  if (root.classList.contains("mobpc")) {
    var back = document.createElement("button");
    back.type = "button"; back.className = "mobback"; back.textContent = "📱 휴대폰 화면";
    back.onclick = function () { setMode(""); };
    document.body.appendChild(back);
    return;
  }
  if (!root.classList.contains("mob")) return;

  var nav = document.getElementById("sideNav");
  if (!nav) return;
  var DAILY = [["tp0", "출퇴근"], ["tp1", "근무표"], ["tp2", "할 일"], ["tp12", "재고"], ["tp4", "일지"]];

  // ── 위 줄: 로고 · 지금 화면 이름 · 저장 상태 · 💾
  var top = document.createElement("div");
  top.className = "mtop"; top.id = "mTop";
  var lg = document.querySelector("header img.logo");
  top.innerHTML = '<span class="mtlogo"></span><b class="mttitle">카페스이</b>' +
    '<span class="mtstate" id="mtState">저장됨</span>' +
    '<button type="button" class="mtsave" id="mtSave" aria-label="저장">💾 저장</button>';
  if (lg) { var im = new Image(); im.src = lg.src; im.alt = ""; top.querySelector(".mtlogo").appendChild(im); }
  var wrap = document.querySelector(".wrap");
  if (wrap) wrap.parentNode.insertBefore(top, wrap);
  top.querySelector("#mtSave").onclick = function () { var b = document.getElementById("saveAll"); if (b) b.click(); };
  // 「새 버전 · 다른 기기에서 바뀜」 단추는 저장 상자 안에 있어서 같이 숨겨지므로 위 줄 아래로 옮김(id · 동작 그대로)
  var nv = document.getElementById("newVer");
  if (nv && wrap) wrap.insertBefore(nv, wrap.firstChild);
  // 저장 상태 글 따라 쓰기
  var ss = document.getElementById("saveState"), ms = top.querySelector("#mtState");
  function mirror() { if (!ss) return; ms.textContent = ss.textContent || "저장됨"; ms.className = "mtstate " + (ss.className || ""); }
  if (ss) { mirror(); new MutationObserver(mirror).observe(ss, { childList: true, characterData: true, subtree: true, attributes: true }); }

  // ── 아래 고정 메뉴
  var bar = document.createElement("nav");
  bar.className = "mbar"; bar.id = "mBar"; bar.setAttribute("aria-label", "자주 쓰는 화면");
  DAILY.forEach(function (d) {
    var src = nav.querySelector('.tab[data-p="' + d[0] + '"]'); if (!src) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "mbt"; b.dataset.p = d[0];
    var ic = src.querySelector(".ti");
    b.innerHTML = (ic ? ic.outerHTML : "") + "<span>" + d[1] + "</span>";
    bar.appendChild(b);
  });
  var more = document.createElement("button");
  more.type = "button"; more.className = "mbt mbmore";
  more.innerHTML = '<span class="ti" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></span><span>전체</span>';
  bar.appendChild(more);
  document.body.appendChild(bar);

  // ── 전체 메뉴(왼쪽 메뉴를 화면 가득 펼침) · 맨 아래 컴퓨터 화면 단추
  var head = document.createElement("div");
  head.className = "mnavhead";
  head.innerHTML = '<b>전체 메뉴</b><button type="button" class="mnavx" aria-label="닫기">✕</button>';
  nav.insertBefore(head, nav.firstChild);
  var foot = document.createElement("div");
  foot.className = "mnavfoot";
  foot.innerHTML = '<button type="button" class="mpc">💻 컴퓨터 화면으로 보기</button>' +
    '<small>이 휴대폰에서만 바뀝니다 · 오른쪽 아래 「📱 휴대폰 화면」으로 돌아와요</small>';
  nav.appendChild(foot);
  foot.querySelector(".mpc").onclick = function () { setMode("pc"); };
  function openNav(on) {
    root.classList.toggle("mnavopen", on);
    if (on) { nav.scrollTop = 0; nav.querySelectorAll(".sdgrp").forEach(function (g) { g.classList.add("open"); }); }
  }
  more.onclick = function () { openNav(!root.classList.contains("mnavopen")); };
  head.querySelector(".mnavx").onclick = function () { openNav(false); };

  // 아래 메뉴 → 원래 탭 단추를 누름(다른 코드가 쓰는 .tab[data-p] 그대로)
  bar.addEventListener("click", function (e) {
    var b = e.target.closest(".mbt[data-p]"); if (!b) return;
    var t = nav.querySelector('.tab[data-p="' + b.dataset.p + '"]'); if (t) t.click();
  });
  // 어떤 탭이 골라졌는지 따라가기 — 위 줄 이름 · 아래 메뉴 불 · 맨 위로
  var last = null;
  function paint() {
    var act = nav.querySelector('.tab[aria-selected="true"]'); if (!act) return;
    var p = act.dataset.p;
    var name = (act.textContent || "").trim();
    top.querySelector(".mttitle").textContent = name || "카페스이";
    var inBar = false;
    bar.querySelectorAll(".mbt[data-p]").forEach(function (b) { var on = b.dataset.p === p; b.classList.toggle("on", on); if (on) inBar = true; });
    more.classList.toggle("on", !inBar);
    if (last !== null && last !== p) { openNav(false); window.scrollTo(0, 0); }
    last = p;
  }
  // 글 쓰는 동안(자판이 올라온 동안)은 아래 메뉴를 숨긴다 — 칸을 가리지 않게
  function typing(el) { return el && (el.isContentEditable || /^(TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === "INPUT" && !/^(checkbox|radio|button|submit|file|range|color)$/i.test(el.type || ""))); }
  document.addEventListener("focusin", function (e) { if (typing(e.target)) root.classList.add("mkbd"); });
  document.addEventListener("focusout", function () { setTimeout(function () { if (!typing(document.activeElement)) root.classList.remove("mkbd"); }, 120); });
  new MutationObserver(paint).observe(nav, { attributes: true, attributeFilter: ["aria-selected"], subtree: true });
  paint();
})();
