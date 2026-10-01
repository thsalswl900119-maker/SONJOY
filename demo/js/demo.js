// 배포용 체험판 — 각 매장이 가게 이름 · 직원 · 칸을 넣고 빼고 고쳐 쓰는 뼈대 (서버 연결 없음 · 이 기기 브라우저에만 저장)
// 안쪽에서는 직원을 「이름표(칸 번호)」로 쓰고, 화면에는 사장님이 정한 이름으로 바꿔 보여 준다 (저장된 기록은 이름을 바꿔도 그대로 이어진다)
(function () {
  var P = "csdemo.";   // make_demo 가 체험판 전용 이름(csdemo.)으로 바꾼다
  function J(k, d) { try { var v = localStorage.getItem(P + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function W(k, v) { try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) {} }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  var SLOTS = ["김하늘", "이다온", "최서하", "스태프4", "스태프5", "스태프6", "스태프7", "스태프8", "스태프9", "스태프10"];
  var DEF_GROUPS = [["g1", "🥬 주재료"], ["g2", "🧂 부재료"], ["g3", "🥤 음료 · 소스"], ["g4", "📦 포장재"], ["g5", "🧻 소모품"], ["g6", "🗂 기타"]];
  var WDN = ["월", "화", "수", "목", "금", "토", "일"];
  var setup = J("setup", null) || { done: false, store: "", line: "", staff: [], off: [], hours: { wk: "", sat: "", sun: "", hol: "" }, groups: DEF_GROUPS };
  if (!setup.groups || !setup.groups.length) setup.groups = DEF_GROUPS;
  if (!setup.hours) setup.hours = { wk: "", sat: "", sun: "", hol: "" };

  // ── 다른 파일이 쓰는 값 ─────────────────────────────────────
  var active = setup.staff.map(function (s) { return s.id; });
  var nameOf = {}; setup.staff.forEach(function (s) { nameOf[s.id] = s.name; });
  window.__S = active.slice();
  window.__MGR = setup.staff.filter(function (s) { return s.role === "매니저"; }).map(function (s) { return s.id; });
  window.__CM = function (pre) { var o = {}; active.forEach(function (id, i) { o[id] = pre + ((i % 3) + 1); }); o["사장님"] = pre + "4"; return o; };
  window.__SRE = new RegExp("^(" + (active.length ? active.join("|") : "$^") + ")$");
  window.__DEMO_GROUPS = function () { var o = {}; setup.groups.forEach(function (g) { o[g[0]] = g[1]; }); return o; };
  window.__DEMO_OFF = (setup.off || []).map(Number);
  window.__DEMO_HOURS = function (wd, hol) {
    var h = setup.hours;
    if (hol && h.hol) return h.hol;
    return wd === 6 ? h.sun : wd === 5 ? h.sat : h.wk;
  };
  var ID_RE = new RegExp("(" + SLOTS.join("|") + ")(님?)", "g"), ID_TEST = new RegExp(SLOTS.join("|"));
  window.__DEMO_NEEDS = function (v) { return ID_TEST.test(v) || v.indexOf("○○") >= 0; };
  window.__DEMO_MAPTEXT = function (v) {
    ID_RE.lastIndex = 0;
    return v.replace(ID_RE, function (m, id) { return (nameOf[id] || "직원") + "님"; })
      .replace(/CAFE ○○/g, setup.store ? "CAFE " + setup.store : "OUR CAFE")
      .replace(/○○카페/g, setup.store || "우리 가게")
      .replace(/○○소개/g, setup.line || "우리 가게 한 줄 소개")
      .replace(/○○휴무안내/g, (setup.off || []).length ? setup.off.map(function (d) { return WDN[d]; }).join(" · ") + "요일 정기휴무" : "정기휴무 없음");
  };
  // 복사 · 공유하는 글에도 바뀐 이름으로
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      var cw = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = function (t) { return cw(window.__DEMO_MAPTEXT(String(t))); };
    }
    if (navigator.share) { var sh = navigator.share.bind(navigator); navigator.share = function (o) { if (o && o.text) o.text = window.__DEMO_MAPTEXT(o.text); return sh(o); }; }
  } catch (e) {}

  // ── 처음 설정 전이면 로그인 화면에서 설정부터 ─────────────────
  try {
    sessionStorage.setItem(P + "unlocked", "1");
    if (!setup.done) localStorage.removeItem(P + "me");
    if (localStorage.getItem(P + "me") && localStorage.getItem(P + "me") !== "사장님" && active.indexOf(localStorage.getItem(P + "me")) < 0) localStorage.removeItem(P + "me");
  } catch (e) {}

  // ── 화면 틀 고치기 (app.js 보다 먼저) ───────────────────────
  // 1) 직원 수에 맞게 이름 버튼 · 선택 칸을 늘리고 줄인다
  function staffDom() {
    var unused = SLOTS.slice(0, 3).filter(function (id) { return active.indexOf(id) < 0; });
    var extra = active.filter(function (id) { return SLOTS.indexOf(id) >= 3; });
    var tplId = "최서하";
    // 같은 묶음 안에서 「최서하」 칸을 본떠 추가 직원 칸을 만든다
    var tpls = [];
    document.querySelectorAll('[data-v="' + tplId + '"],[data-n="' + tplId + '"]').forEach(function (el) { tpls.push(el); });
    document.querySelectorAll("option, i, b").forEach(function (el) { if (el.children.length === 0 && el.textContent.trim() === tplId) tpls.push(el); });
    tpls.forEach(function (t) {
      var after = t;
      extra.forEach(function (id, i) {
        var c = t.cloneNode(true);
        ["data-v", "data-n", "aria-label", "value"].forEach(function (a) { if (c.hasAttribute(a)) c.setAttribute(a, c.getAttribute(a).split(tplId).join(id)); });
        if (c.childNodes.length === 1 && c.firstChild.nodeType === 3) c.firstChild.nodeValue = c.firstChild.nodeValue.split(tplId).join(id);
        c.className = String(c.className).replace(/\b(w?p)3\b/, "$1" + (((3 + i) % 3) + 1));
        after.parentNode.insertBefore(c, after.nextSibling); after = c;
      });
    });
    unused.forEach(function (id) {
      document.querySelectorAll('[data-v="' + id + '"],[data-n="' + id + '"]').forEach(function (el) { el.remove(); });
      document.querySelectorAll("option, i, b").forEach(function (el) { if (el.children.length === 0 && el.textContent.trim() === id) el.remove(); });
    });
  }
  // 2) 영업시간 · 휴무 안내
  function hoursDom() {
    var bb = document.querySelector(".bizbox"); if (!bb) return;
    var h = setup.hours, parts = [];
    if (h.wk) parts.push("<span><i>평일</i> " + esc(h.wk) + "</span>");
    if (h.sat) parts.push("<span><i>토요일</i> " + esc(h.sat) + "</span>");
    if (h.sun) parts.push("<span><i>일요일</i> " + esc(h.sun) + "</span>");
    if (h.hol) parts.push('<span class="hol"><i>공휴일</i> ' + esc(h.hol) + "</span>");
    (setup.off || []).forEach(function (d) { parts.push("<span><i>" + WDN[d] + "요일</i> 정기휴무</span>"); });
    var b = bb.querySelector("b");
    bb.innerHTML = (b ? b.outerHTML : "<b>🕘 영업시간</b>") + (parts.length ? parts.join("") : "<span>⚙ 가게 설정에서 영업시간을 적어 주세요</span>");
  }

  // 3) 「✏ 화면 고치기」로 바꾼 글자 · 뺀 칸 · 넣은 칸
  var custom = J("custom", { adds: [], text: {}, hide: {} });
  custom.adds = custom.adds || []; custom.text = custom.text || {}; custom.hide = custom.hide || {};
  var BLOCK = ".mrow2,.lgnum,.lgtext,.lginrow,.frow,.zt tbody tr,.pcard li,.pcard,.tab,.msec,.fsec,.lgng,.skbox,.ztable-wrap,.shead .sub,.cmpwrap tbody tr";
  function stampDk() {
    var wrap = document.querySelector(".wrap"); if (!wrap) return;
    var all = wrap.querySelectorAll("*"), n = 0;
    for (var i = 0; i < all.length; i++) if (!all[i].hasAttribute("data-dk")) all[i].setAttribute("data-dk", "d" + (n++));
  }
  function byDk(dk) { return document.querySelector('[data-dk="' + dk + '"]'); }
  function ownTextNodes(el) { var out = []; el.childNodes.forEach(function (c) { if (c.nodeType === 3 && c.nodeValue.trim()) out.push(c); }); return out; }
  function setOwnText(el, t) {
    var ns = ownTextNodes(el);
    if (!ns.length) { el.insertBefore(document.createTextNode(t), el.firstChild); return; }
    ns[0].nodeValue = t; for (var i = 1; i < ns.length; i++) ns[i].nodeValue = "";
  }
  function kindOf(b) {
    if (!b) return "";
    if (b.matches(".mrow2")) return "mrow2";
    if (b.matches(".lgnum")) return "lgnum";
    if (b.matches(".frow")) return "frow";
    if (b.matches(".zt tbody tr")) return "tr";
    if (b.matches(".cmpwrap tbody tr")) return "";
    if (b.matches(".pcard li")) return "li";
    if (b.matches(".pcard")) return "pcard";
    return "";
  }
  function cleanClone(c, kind, label, key) {
    c.querySelectorAll(".lgby,.lgov,.lgown,.bossbar,.mtmk,.optt,small").forEach(function (x) { x.remove(); });
    c.classList.remove("boss", "red", "opt", "blue", "para", "mk", "mktarget", "keyzone", "done");
    c.querySelectorAll("input,textarea").forEach(function (x) { x.value = ""; x.setAttribute("placeholder", ""); x.classList.remove("filled", "ownin", "ovon", "wp1", "wp2", "wp3", "wp4"); x.removeAttribute("style"); if (x.hasAttribute("data-k")) x.setAttribute("data-k", key); x.setAttribute("aria-label", label); });
    if (kind === "mrow2") { var sp = c.querySelector(".mlab span"); if (sp) sp.textContent = label; var em = c.querySelector(".mlab em"); if (em) em.textContent = ""; }
    if (kind === "lgnum") { var s2 = c.querySelector("span"); if (s2) s2.textContent = label; }
    if (kind === "frow") { var s3 = c.querySelector(".flab span"); if (s3) s3.textContent = label; var e3 = c.querySelector(".flab em"); if (e3) e3.textContent = ""; }
    if (kind === "tr") {
      var zn = c.querySelector(".zn"); if (zn) zn.innerHTML = esc(label) + '<span class="zd"></span>';
      c.querySelectorAll("[data-k]").forEach(function (x) { x.setAttribute("data-k", key); });
      c.querySelectorAll(".box").forEach(function (x) { x.setAttribute("aria-label", label + " 완료"); x.setAttribute("aria-pressed", "false"); });
      c.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("on"); x.setAttribute("aria-pressed", "false"); });
      c.querySelectorAll("output.mnext").forEach(function (x) { x.id = "mn" + key.slice(1); x.textContent = x.getAttribute("data-blank") || ""; });
    }
    if (kind === "li") c.innerHTML = esc(label);
    if (kind === "pcard") { var ph = c.querySelector(".ph"); if (ph) ph.textContent = label; var ul = c.querySelector("ul"); if (ul) ul.innerHTML = "<li>✏ 눌러서 내용을 적어 주세요</li>"; }
  }
  function applyCustom() {
    custom.adds.forEach(function (a) {
      var tpl = byDk(a.tpl), after = byDk(a.after) || tpl; if (!tpl || !after) return;
      var c = tpl.cloneNode(true);
      cleanClone(c, a.kind, a.label, a.k);
      c.setAttribute("data-dk", "a" + a.id);
      var d = c.querySelectorAll("*"); for (var i = 0; i < d.length; i++) d[i].setAttribute("data-dk", "a" + a.id + "_" + i);
      after.parentNode.insertBefore(c, after.nextSibling);
    });
    Object.keys(custom.text).forEach(function (dk) { var el = byDk(dk); if (el) setOwnText(el, custom.text[dk]); });
    Object.keys(custom.hide).forEach(function (dk) { var el = byDk(dk); if (el) el.classList.add("dhide"); });
  }

  // ── 스타일 ────────────────────────────────────────────────
  var css = document.createElement("style");
  css.textContent = ".dhide{display:none!important}" +
    "#gate{overflow-y:auto;align-items:flex-start!important;padding-top:64px;padding-bottom:40px}#gate .gatebox{margin:0 auto}@media(max-width:600px){#gate{padding-top:130px}}" +
    "body.demoedit .wrap [data-dk]:hover{outline:1px dashed #C45A00;outline-offset:1px;cursor:pointer}" +
    ".demoedbar{position:sticky;top:42px;z-index:59;background:#FFF3B0;color:#5A3A00;font-size:13px;font-weight:700;padding:7px 14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-bottom:2px solid #E0B400}" +
    ".demoedbar button,.dmenu button,.dset button{font:inherit;font-size:12.5px;font-weight:800;padding:5px 11px;border-radius:14px;border:1px solid #8A5A00;background:#FFFDF6;color:#5A3A00;cursor:pointer}" +
    ".dmenu{position:absolute;z-index:80;background:#FFFDF6;border:2px solid #C45A00;border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);padding:8px;display:flex;flex-direction:column;gap:6px;min-width:220px;font-size:13px}" +
    ".dmenu .dmt{font-size:12px;color:#6B5D50;max-width:260px;word-break:keep-all}" +
    ".dset{text-align:left;display:flex;flex-direction:column;gap:10px;margin-top:6px}" +
    ".dset h4{margin:8px 0 2px;font-size:15px}.dset .drow{display:flex;gap:6px;align-items:center;flex-wrap:wrap}" +
    ".dset input[type=text],.dset select{font:inherit;font-size:14px;padding:7px 9px;border:1px solid #CDBFAE;border-radius:6px;background:#FFFDF6;min-width:0}" +
    ".dset .dname{flex:1 1 140px}.dset .dhelp{font-size:12px;color:#6B5D50;line-height:1.5}" +
    ".dset .dgo{background:#43604E!important;color:#fff!important;border-color:#43604E!important;font-size:15px!important;padding:9px 18px!important}" +
    ".dset label.dday{font-size:13px;font-weight:700;display:inline-flex;gap:3px;align-items:center}";
  document.head.appendChild(css);

  // ── 로그인 화면의 「가게 · 직원 설정」 ─────────────────────────
  function setupUI() {
    var box = document.querySelector("#gate .gatebox"); if (!box) return;
    var st1 = document.getElementById("gateStep1");
    var sec = document.createElement("div"); sec.className = "gatestep dset"; sec.id = "dsSetup"; sec.hidden = true;
    box.insertBefore(sec, st1);
    function staffRow(s) {
      return '<div class="drow dstaff" data-id="' + esc(s.id || "") + '"><input type="text" class="dname" value="' + esc(s.name || "") + '" placeholder="이름 (예: 민수)">' +
        '<select><option' + (s.role === "직원" ? " selected" : "") + ">직원</option><option" + (s.role === "매니저" ? " selected" : "") + ">매니저</option><option" + (s.role === "알바" ? " selected" : "") + ">알바</option></select>" +
        '<button type="button" class="dx" title="빼기">✕</button></div>';
    }
    function groupRow(g) { return '<div class="drow dgrp" data-id="' + esc(g[0]) + '"><input type="text" class="dname" value="' + esc(g[1]) + '"><button type="button" class="dx">✕</button></div>'; }
    function render() {
      var s = setup;
      sec.innerHTML =
        "<h4>🏪 가게</h4>" +
        '<div class="drow"><input type="text" class="dname" id="dsStore" value="' + esc(s.store) + '" placeholder="가게 이름 (예: 달빛카페)"></div>' +
        '<div class="drow"><input type="text" class="dname" id="dsLine" value="' + esc(s.line) + '" placeholder="한 줄 소개 (예: 매일 아침 굽는 동네 빵집)"></div>' +
        "<h4>👥 직원 · 알바</h4><div class=\"dhelp\">사장님은 따로 있습니다. 매니저는 근무표 · 발주 확인 같은 관리 화면을 같이 씁니다. 이름을 나중에 바꿔도 적어 둔 기록은 그대로 이어집니다.</div>" +
        '<div id="dsStaff">' + (s.staff.length ? s.staff : [{ name: "", role: "직원" }]).map(staffRow).join("") + "</div>" +
        '<div class="drow"><button type="button" id="dsAddStaff">＋ 직원 · 알바 추가</button></div>' +
        "<h4>🗓 영업 · 휴무</h4>" +
        '<div class="drow"><input type="text" class="dname" id="dsWk" value="' + esc(s.hours.wk) + '" placeholder="평일 (예: 10:00–21:00)"><input type="text" class="dname" id="dsSat" value="' + esc(s.hours.sat) + '" placeholder="토요일"></div>' +
        '<div class="drow"><input type="text" class="dname" id="dsSun" value="' + esc(s.hours.sun) + '" placeholder="일요일"><input type="text" class="dname" id="dsHol" value="' + esc(s.hours.hol) + '" placeholder="공휴일 (다르면)"></div>' +
        '<div class="drow">정기휴무 ' + WDN.map(function (w, i) { return '<label class="dday"><input type="checkbox" class="dsOff" value="' + i + '"' + ((s.off || []).indexOf(i) >= 0 ? " checked" : "") + ">" + w + "</label>"; }).join("") + "</div>" +
        "<h4>📦 발주 묶음</h4><div class=\"dhelp\">재고를 나눠 볼 종류입니다. 업종에 맞게 이름을 바꾸고 넣고 빼세요. 품목은 발주 화면에서 직접 넣습니다.</div>" +
        '<div id="dsGroups">' + s.groups.map(groupRow).join("") + "</div>" +
        '<div class="drow"><button type="button" id="dsAddGrp">＋ 묶음 추가</button></div>' +
        '<div class="drow"><button type="button" class="dgo" id="dsGo">' + (s.done ? "저장하고 돌아가기" : "시작하기") + "</button>" + (s.done ? '<button type="button" id="dsClose">닫기</button>' : '<button type="button" class="dbrowse">👀 설정 없이 훑어보기</button>') + "</div>" +
        (s.done ? "" : '<div class="dhelp" style="text-align:center">훑어보기는 예시 가게 · 직원으로 바로 들어가 화면을 둘러봅니다. 나중에 「⚙ 가게 · 직원 설정」에서 우리 가게로 바꾸면 됩니다.</div>');
      sec.querySelector("#dsAddStaff").onclick = function () { sec.querySelector("#dsStaff").insertAdjacentHTML("beforeend", staffRow({ name: "", role: "알바" })); };
      sec.querySelector("#dsAddGrp").onclick = function () { sec.querySelector("#dsGroups").insertAdjacentHTML("beforeend", groupRow(["", ""])); };
      sec.onclick = function (e) { var x = e.target.closest(".dx"); if (x) x.closest(".drow").remove(); };
      sec.querySelector("#dsGo").onclick = save;
      var bw = sec.querySelector(".dbrowse"); if (bw) bw.onclick = browse;
      var cl = sec.querySelector("#dsClose"); if (cl) cl.onclick = function () { location.reload(); };
    }
    function save() {
      var rows = Array.prototype.slice.call(sec.querySelectorAll(".dstaff")), names = {}, bad = "";
      var staff = rows.map(function (r) { return { id: r.dataset.id, name: r.querySelector("input").value.trim(), role: r.querySelector("select").value }; })
        .filter(function (x) { return x.name; });
      staff.forEach(function (x) { if (names[x.name] || x.name === "사장님") bad = x.name; names[x.name] = 1; });
      if (!staff.length) { alert("직원 · 알바를 한 명 이상 적어 주세요 (혼자 하시면 본인 이름을 적어도 됩니다)"); return; }
      if (bad) { alert('"' + bad + '" 이름이 겹치거나 쓸 수 없습니다'); return; }
      var used = {}; staff.forEach(function (x) { if (x.id) used[x.id] = 1; });
      var free = SLOTS.filter(function (id) { return !used[id]; });
      staff.forEach(function (x) { if (!x.id) x.id = free.shift(); });
      if (staff.some(function (x) { return !x.id; })) { alert("직원은 " + SLOTS.length + "명까지 넣을 수 있습니다"); return; }
      var groups = Array.prototype.slice.call(sec.querySelectorAll(".dgrp")).map(function (r, i) {
        return [r.dataset.id || ("g" + Date.now().toString(36) + i), r.querySelector("input").value.trim()];
      }).filter(function (g) { return g[1]; });
      setup = { done: true, store: sec.querySelector("#dsStore").value.trim(), line: sec.querySelector("#dsLine").value.trim(), staff: staff,
        off: Array.prototype.slice.call(sec.querySelectorAll(".dsOff:checked")).map(function (c) { return +c.value; }),
        hours: { wk: sec.querySelector("#dsWk").value.trim(), sat: sec.querySelector("#dsSat").value.trim(), sun: sec.querySelector("#dsSun").value.trim(), hol: sec.querySelector("#dsHol").value.trim() },
        groups: groups.length ? groups : DEF_GROUPS };
      W("setup", setup);
      location.reload();
    }
    function open() {
      render();
      var gate = document.getElementById("gate"); gate.hidden = false;
      ["gateStep1", "gateStep2"].forEach(function (id) { var el = document.getElementById(id); if (el) el.hidden = true; });
      sec.hidden = false;
    }
    // 👀 훑어보기 — 설정 전이면 예시 가게 · 직원으로, 비밀번호 없이 사장님 화면으로 바로
    function browse() {
      if (!setup.done) {
        setup = { done: true, preview: true, store: "예시 가게", line: "우리 가게 한 줄 소개",
          staff: [{ id: SLOTS[0], name: "김민수", role: "매니저" }, { id: SLOTS[1], name: "이지은", role: "직원" }, { id: SLOTS[2], name: "박현우", role: "알바" }],
          off: [6], hours: { wk: "10:00–21:00", sat: "10:00–21:00", sun: "", hol: "" }, groups: DEF_GROUPS };
        W("setup", setup);
      }
      try { localStorage.setItem(P + "me", "사장님"); sessionStorage.setItem(P + "unlocked", "1"); } catch (e) {}
      location.reload();
    }
    window.__DEMO_SETUP = open;
    // 로그인 화면 「누구세요?」 아래에 설정 바로가기
    if (st1) {
      var lk = document.createElement("div"); lk.className = "drow"; lk.style.justifyContent = "center"; lk.style.margin = "10px 0";
      lk.innerHTML = '<button type="button" class="pinback dbrowse">👀 비밀번호 없이 훑어보기 (사장님 화면)</button><button type="button" class="pinback" id="dsOpen">⚙ 가게 이름 · 직원 바꾸기</button>';
      lk.style.gap = "8px";
      lk.querySelector(".dbrowse").onclick = browse;
      st1.insertBefore(lk, st1.querySelector(".gatenote"));
      lk.querySelector("#dsOpen").onclick = open;
    }
    if (!setup.done) open();
  }

  // ── 「✏ 화면 고치기」 ─────────────────────────────────────
  var EDK = P + "ui.edit";
  function editOn() { try { return sessionStorage.getItem(EDK) === "1"; } catch (e) { return false; } }
  function setEdit(v) { try { if (v) sessionStorage.setItem(EDK, "1"); else sessionStorage.removeItem(EDK); } catch (e) {} }
  function saveCustom(reload) {
    W("custom", custom);
    if (reload) { try { sessionStorage.setItem(P + "ui.scroll", String(window.scrollY)); } catch (e) {} location.reload(); }
  }
  var menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function isStaffText(t) { return ID_TEST.test(t); }
  function pickText(t) {
    for (var el = t, i = 0; el && i < 4; el = el.parentElement, i++) {
      if (!el.hasAttribute || !el.hasAttribute("data-dk") || /^(INPUT|TEXTAREA|SELECT|OPTION|svg|path)$/i.test(el.tagName)) continue;
      var tx = ownTextNodes(el).map(function (n) { return n.nodeValue; }).join("").trim();
      if (tx && !isStaffText(tx)) return { el: el, text: tx };
    }
    return null;
  }
  var passOnce = false;   // 「이 화면 열기」 — 그 한 번은 원래대로 누르게
  function onEditClick(e) {
    if (!editOn()) return;
    if (passOnce) { passOnce = false; return; }
    if (e.target.closest(".demobar,.demoedbar,.dmenu,#gate")) return;
    if (!e.target.closest(".wrap")) return;
    e.preventDefault(); e.stopPropagation();
    closeMenu();
    var tx = pickText(e.target), blk = e.target.closest(BLOCK);
    if (blk && !blk.hasAttribute("data-dk")) blk = null;
    var kind = kindOf(blk);
    if (!tx && !blk) {
      if (e.target.closest("#skGroups")) alert("발주 품목은 품목 옆 ✎(고치기) · ×(빼기) 버튼과 맨 위 「+ 재고 항목 추가」로 바꿉니다. 묶음 이름은 ⚙ 가게 설정에서 바꿉니다.");
      return;
    }
    menu = document.createElement("div"); menu.className = "dmenu";
    menu.style.left = Math.min(e.pageX, document.documentElement.scrollWidth - 250) + "px"; menu.style.top = (e.pageY + 8) + "px";
    var h = "";
    if (blk && blk.matches(".tab")) h += '<button type="button" data-a="open">📂 이 화면 열기</button>';
    if (tx) h +='<div class="dmt">「' + esc(tx.text.slice(0, 40)) + "」</div><button type=\"button\" data-a=\"text\">✏ 글자 바꾸기</button>";
    if (blk) h += '<button type="button" data-a="hide">🗑 이 칸 빼기</button>';
    if (kind) h += '<button type="button" data-a="add">＋ 아래에 새 칸 넣기</button>';
    h += '<button type="button" data-a="x">닫기</button>';
    menu.innerHTML = h; document.body.appendChild(menu);
    menu.onclick = function (ev) {
      var a = ev.target.dataset && ev.target.dataset.a; if (!a) return;
      if (a === "open") { closeMenu(); passOnce = true; blk.click(); return; }
      if (a === "text") {
        var nv = prompt("바꿀 글자를 적어 주세요", tx.text); if (nv == null) return;
        nv = nv.trim(); if (!nv) { alert("비우려면 「이 칸 빼기」를 써 주세요"); return; }
        custom.text[tx.el.getAttribute("data-dk")] = nv; setOwnText(tx.el, nv); saveCustom(false);
      } else if (a === "hide") {
        custom.hide[blk.getAttribute("data-dk")] = 1; blk.classList.add("dhide"); saveCustom(false); paintBar();
      } else if (a === "add") {
        var lb = prompt(kind === "li" ? "넣을 내용을 적어 주세요" : "새 칸 이름을 적어 주세요"); if (!lb || !lb.trim()) return;
        var id = (custom.seq = (custom.seq || 0) + 1);
        var tplDk = blk.getAttribute("data-dk");
        var tpl = tplDk.charAt(0) === "a" ? (custom.adds.filter(function (x) { return "a" + x.id === tplDk; })[0] || {}).tpl : tplDk;
        var pre = kind === "frow" ? "ax" : kind === "tr" ? (blk.closest("#mtable") ? "mx" : "zx") : "lx";
        custom.adds.push({ id: id, tpl: tpl, after: tplDk, kind: kind, label: lb.trim(), k: pre + id });
        saveCustom(true); return;
      }
      closeMenu();
    };
  }
  function paintBar() {
    var bar = document.querySelector(".demoedbar"); if (!bar) return;
    var n = Object.keys(custom.hide).length;
    var rb = bar.querySelector("#deShow"); if (rb) { rb.textContent = "숨긴 칸 다시 보이기 (" + n + ")"; rb.hidden = !n; }
  }
  function editUI() {
    var db = document.querySelector(".demobar"); if (!db) return;
    db.insertAdjacentHTML("beforeend", '<button type="button" id="deSet">⚙ 가게 · 직원 설정</button><button type="button" id="deEdit">✏ 화면 고치기</button>');
    db.querySelector("#deSet").onclick = function () { if (window.__DEMO_SETUP) window.__DEMO_SETUP(); };
    db.querySelector("#deEdit").onclick = function () { setEdit(!editOn()); location.reload(); };
    if (editOn()) {
      document.body.classList.add("demoedit");
      db.querySelector("#deEdit").textContent = "✅ 고치기 끝";
      var bar = document.createElement("div"); bar.className = "demoedbar";
      bar.innerHTML = "✏ 고치는 중 — 글자나 칸을 누르면 「글자 바꾸기 · 칸 빼기 · 새 칸 넣기」가 나옵니다 (탭 이름도 바꾸거나 뺄 수 있어요)" +
        '<button type="button" id="deShow" hidden></button><button type="button" id="deReset">고친 것 모두 처음으로</button>';
      db.parentNode.insertBefore(bar, db.nextSibling);
      bar.querySelector("#deShow").onclick = function () { custom.hide = {}; saveCustom(true); };
      bar.querySelector("#deReset").onclick = function () { if (!confirm("화면에서 고친 글자 · 뺀 칸 · 넣은 칸을 모두 처음으로 돌릴까요? (적어 둔 기록은 그대로)")) return; custom = { adds: [], text: {}, hide: {} }; saveCustom(true); };
      paintBar();
      document.addEventListener("click", onEditClick, true);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    }
  }

  // ── 실행 ──────────────────────────────────────────────────
  stampDk();
  applyCustom();
  staffDom();
  hoursDom();
  setupUI();
  editUI();
  try { var sy = sessionStorage.getItem(P + "ui.scroll"); if (sy) { sessionStorage.removeItem(P + "ui.scroll"); window.addEventListener("load", function () { setTimeout(function () { window.scrollTo(0, +sy); }, 300); }); } } catch (e) {}

  document.addEventListener("click", function (e) {
    if (!e.target || e.target.id !== "demoReset") return;
    if (!confirm("체험판을 처음 상태로 되돌릴까요? (이 기기에 입력한 가게 설정 · 기록이 모두 지워집니다)")) return;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(P) === 0) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (er) {}
    location.reload();
  });
})();
