// 🏕 워크샵 화면 새로 짬 (10/30 · v0924-298 · 사장님 「가독성 · 누가 봐도 함께 가고 싶게 · 모션그래픽 · 파일 업로드 · 동시 접속해도 헷갈리지 않게」)
// 저장 · 칸(.wsin data-k · cafesui.ws.<해>)은 app.js 그대로 — 여기서는 보이는 모양만:
//  ① 위 흐름 메뉴(#wsNav) 🏕 한눈에 · ① 정하기 · ② 가고 싶은 곳 · ③ 회의 · ④ 일정 · ⑤ 자료 · 파일 · ⑥ 비용 (하위 화면 .wspane · 기기 기억 cafesui.ui.wspane)
//  ② 한눈에(#wsHero) = 탑승권 카드(어디로 · 언제 · 주제 · 출발까지 남은 시간 · 비행기 움직임) · 함께 가는 사람 · 준비 진행 고리 · 가고 싶은 곳 흐르는 띠 · 사진 · 질문 3개
//  ③ 동시 접속: 위 「지금 같이 보는 사람」(누가 어느 화면 · 어느 칸) · 메뉴에 그 사람 점 · 다른 사람이 쓰는 칸엔 「✏ ○○님 쓰는 중」 · 다른 기기가 바꾼 칸은 노란 반짝 + 「방금 ○○님」
(function () {
  var root = document.getElementById("tp9"), nav = document.getElementById("wsNav"), hero = document.getElementById("wsHero");
  if (!root || !nav || !hero) return;
  var yearEl = document.getElementById("wsYear");
  var PEOPLE = [["사장님", "p4", "#2E7D32"], ["정항아", "p1", "#C45A00"], ["박혜빈", "p2", "#1B5FC1"], ["이해선", "p3", "#8E3BB0"]];
  var PANES = [["sum", "🏕", "한눈에", ""], ["plan", "🧭", "정하기 · 준비", "1"], ["wish", "💭", "가고 싶은 곳", "2"], ["meet", "🗣", "회의", "3"], ["day", "🗓", "일정", "4"], ["file", "📎", "자료 · 파일", "5"], ["cost", "💰", "비용", "6"]];
  var QS = [["1일차", "발견", "나는 무엇을 좋다고 생각하는가?"], ["2일차", "분석", "잘되는 가게는 왜 잘되는가?"], ["3일차", "적용", "우리는 무엇을 지키고, 무엇을 바꾸고, 나는 무엇을 할 것인가?"]];
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  var panes = Array.prototype.slice.call(root.querySelectorAll(".wspane"));
  var TAB = "sum"; try { TAB = localStorage.getItem("cafesui.ui.wspane") || "sum"; } catch (e) {}
  if (!PANES.some(function (p) { return p[0] === TAB; })) TAB = "sum";
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return !n ? "" : n === "사장님" ? n : n + "님"; }
  function pc(n) { for (var i = 0; i < PEOPLE.length; i++) if (n && (n === PEOPLE[i][0] || n.indexOf(PEOPLE[i][0].slice(1)) >= 0)) return PEOPLE[i]; return null; }
  function year() { return String((yearEl && yearEl.value) || new Date().getFullYear()); }
  function inp(k) { return root.querySelector('.wsin[data-k="' + k + '"]'); }
  function v(k) { var e = inp(k); return e ? (e.type === "checkbox" ? (e.checked ? "1" : "") : String(e.value || "").trim()) : ""; }
  function stored() { try { return JSON.parse(localStorage.getItem("cafesui.ws." + year()) || "{}") || {}; } catch (e) { return {}; } }
  function pdate(s) { var m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  // 나눠 놓은 화면 묶음
  var bnw = root.querySelector(".wsbnwrap"), slot = document.getElementById("wsBnSlot"); if (bnw && slot) slot.appendChild(bnw);
  nav.innerHTML = PANES.map(function (p) { return '<button type="button" class="wsn" role="tab" data-w="' + p[0] + '" data-lab="' + (p[3] ? p[3] + " " : "") + p[2] + '" aria-selected="false"><span class="wsnl">' + (p[3] ? '<i class="wsnn">' + p[3] + "</i>" : "") + p[1] + " " + p[2] + '</span><small class="wsns"></small><span class="wsnwho"></span></button>'; }).join("");
  function regrow() { Array.prototype.forEach.call(root.querySelectorAll("textarea.wsgrow"), function (t) { if (!t.offsetParent) return; t.style.height = "auto"; t.style.height = t.scrollHeight + 2 + "px"; }); }
  function show(k, scroll) {
    TAB = k; try { localStorage.setItem("cafesui.ui.wspane", k); } catch (e) {}
    panes.forEach(function (p) { p.hidden = p.dataset.w !== k; });
    Array.prototype.forEach.call(nav.querySelectorAll(".wsn"), function (b) { b.setAttribute("aria-selected", String(b.dataset.w === k)); b.classList.remove("news"); });
    if (k === "sum") drawHero(true);
    if (k === "file") mountFiles();
    if (k === "wish") drawWishTop();
    setTimeout(regrow, 0);
    var sb = nav.querySelector('.wsn[aria-selected="true"]'); if (sb && nav.scrollWidth > nav.clientWidth + 4) nav.scrollLeft = Math.max(0, sb.offsetLeft - nav.offsetLeft - 8);
    if (scroll) nav.scrollIntoView({ block: "start", behavior: "smooth" });
    nextBars();
  }
  nav.addEventListener("click", function (e) { var b = e.target.closest(".wsn"); if (b) show(b.dataset.w); });
  root.addEventListener("click", function (e) { var b = e.target.closest("[data-wgo]"); if (b) show(b.dataset.wgo, true); });
  function nextBars() {   // 화면 맨 아래 ← 이전 · 다음 →
    panes.forEach(function (p) {
      var i = PANES.map(function (x) { return x[0]; }).indexOf(p.dataset.w), pv = PANES[i - 1], nx = PANES[i + 1];
      var b = p.querySelector(":scope > .wsnext"); if (!b) { b = document.createElement("div"); b.className = "wsnext"; } p.appendChild(b);
      b.innerHTML = (pv ? '<button type="button" class="wsnb" data-wgo="' + pv[0] + '">← ' + pv[1] + " " + pv[2] + "</button>" : "<span></span>") + (nx ? '<button type="button" class="wsnb nx" data-wgo="' + nx[0] + '">다음 ' + (nx[3] ? nx[3] + " " : "") + nx[1] + " " + nx[2] + " →</button>" : "");
    });
  }
  // ── 숫자 모으기 (화면의 칸에서 바로 읽음 — 다른 기기 글도 app.js가 칸에 넣어 줌)
  function facts() {
    var y = year(), f = { y: y };
    var w2 = v("w2"), sp = w2.split(/\s*·\s*/);
    f.place = (sp[0] || "").replace(/\s*\d.*$/, "") || "어디로 갈까요?"; f.when = sp.slice(1).join(" · ");
    f.theme = v("w1"); f.ppl = v("w3"); f.money = v("w4"); f.fly = v("w5");
    f.d1 = pdate(v("d1date")); f.days = [1, 2, 3, 4].map(function (d) { return pdate(v("d" + d + "date")); });
    var who = {};
    ["w10", "w11", "w12", "w13", "w14", "w3"].forEach(function (k) { PEOPLE.forEach(function (p) { if (v(k).indexOf(p[0]) >= 0 || (p[0] === "정항아" && v(k).indexOf("항아") >= 0) || (p[0] === "박혜빈" && v(k).indexOf("혜빈") >= 0) || (p[0] === "이해선" && /이해선|엄마|어머님/.test(v(k)))) who[p[0]] = 1; }); });
    var wl = [];
    for (var r = 1; r <= 60; r++) { var g = v("wl" + r + "g"); if (!inp("wl" + r + "g")) break; if (g) { var p = v("wl" + r + "p"); wl.push({ g: g, p: p, c: v("wl" + r + "c"), m: v("wl" + r + "m") }); var q = pc(p); if (q) who[q[0]] = 1; else if (/엄마|어머님/.test(p)) who["이해선"] = 1; } }
    f.wish = wl; f.who = PEOPLE.filter(function (p) { return who[p[0]]; });
    if (!f.who.length) f.who = PEOPLE.slice();
    var ck = Array.prototype.slice.call(root.querySelectorAll('.wspane[data-w="plan"] input[type=checkbox].wsin'));
    f.prep = { n: ck.length, d: ck.filter(function (c) { return c.checked; }).length, todo: ck.filter(function (c) { return !c.checked; }).map(function (c) { var s = c.parentNode.querySelector("span"); return s ? (s.firstChild && s.firstChild.nodeType === 3 ? s.firstChild.nodeValue : s.textContent).trim() : ""; }).filter(Boolean) };
    var mg = [], mr; for (mr = 1; mr <= 30; mr++) { if (!inp("mg" + mr + "n")) break; var w = v("mg" + mr + "w"), dd = v("mg" + mr + "d"), n = v("mg" + mr + "n"); if (w || dd || n) mg.push({ w: w || mr + "차", d: dd, n: n, c: !!v("mg" + mr + "c") }); }
    f.meet = mg;
    var plan = 0, perDay = [0, 0, 0, 0]; for (var d = 1; d <= 4; d++) for (var rr = 1; rr <= 40; rr++) { if (!inp("d" + d + "p" + rr)) break; if (v("d" + d + "p" + rr)) { plan++; perDay[d - 1]++; } }
    f.plan = plan; f.perDay = perDay;
    f.files = window.__CS_FILES ? window.__CS_FILES.list("ws." + y) : [];
    var te = document.getElementById("wsTotal"); f.cost = te ? te.textContent.trim() : "—";
    return f;
  }
  // ── 위 메뉴 상태 한 줄
  function navStat(f) {
    f = f || facts();
    var S = { sum: f.d1 ? dday(f.d1) : f.y + "년", plan: "준비물 " + f.prep.d + "/" + f.prep.n, wish: f.wish.length + "곳" + (f.wish.filter(function (x) { return x.c; }).length ? " · 다녀옴 " + f.wish.filter(function (x) { return x.c; }).length : ""),
      meet: "회의 " + f.meet.filter(function (x) { return x.c; }).length + "/" + f.meet.length + " 끝", day: "일정 " + f.plan + "줄", file: "파일 " + f.files.length + "개", cost: f.cost && f.cost !== "—" ? f.cost + "원" : "금액 적기" };
    Array.prototype.forEach.call(nav.querySelectorAll(".wsn"), function (b) { var s = b.querySelector(".wsns"); if (s) s.textContent = S[b.dataset.w] || ""; });
  }
  function dday(d) { var t = new Date(); t.setHours(0, 0, 0, 0); var n = Math.round((d - t) / 86400000); return n > 0 ? "D-" + n : n === 0 ? "오늘 출발!" : "다녀옴"; }
  function ring(p, lab, big, sub, go, col) {
    var r = 30, C = 2 * Math.PI * r, off = C * (1 - Math.max(0, Math.min(1, p)));
    return '<button type="button" class="wsring" data-wgo="' + go + '"><svg viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="' + r + '" class="rb"/><circle cx="38" cy="38" r="' + r + '" class="rf" style="stroke:' + col + ";stroke-dasharray:" + C.toFixed(1) + ";--off:" + off.toFixed(1) + ";stroke-dashoffset:" + off.toFixed(1) + '"/></svg><b>' + big + "</b><span>" + lab + "</span><small>" + sub + "</small></button>";
  }
  var heroAt = 0, tickT = null;
  function drawHero(anim) {
    var f = facts(); navStat(f);
    if (hero.offsetParent === null && !anim) return;
    var now = Date.now(), A = anim && now - heroAt > 15000; heroAt = now;
    var past = f.d1 && f.d1 < new Date(new Date().setHours(0, 0, 0, 0)) && Math.round((new Date() - f.d1) / 86400000) > 4;
    var dates = f.days.filter(function (d, i) { return d && (i < 3 || f.perDay[i] > 0); }), dtxt = dates.length ? (dates[0].getMonth() + 1) + "/" + dates[0].getDate() + "(" + WD[dates[0].getDay()] + ")" + (dates.length > 1 ? " → " + (dates[dates.length - 1].getMonth() + 1) + "/" + dates[dates.length - 1].getDate() + "(" + WD[dates[dates.length - 1].getDay()] + ")" : "") : f.when;
    var photos = f.files.filter(function (x) { return x.th; }).slice(0, 8);
    var h = '<div class="wsh' + (A ? " anim" : "") + (past ? " past" : "") + '">' +
      '<div class="wsbp"><div class="wsbpl"><span class="wsbpk">CAFE SUI WORKSHOP ' + esc(f.y) + '</span>' +
        '<div class="wsroute"><div class="wsap"><b>BUSAN</b><small>김해</small></div><svg class="wsfly" viewBox="0 0 300 70" aria-hidden="true"><path id="wsArc" d="M8 60 Q150 -14 292 60" class="arc"/><g class="pl"><path d="M0 -6 L14 0 L0 6 L3 0 Z M4 -1 L-6 -9 L-3 -9 L9 -1 Z M4 1 L-6 9 L-3 9 L9 1 Z" /></g></svg><div class="wsap to"><b>' + esc(f.place) + "</b><small>" + esc(dtxt || "날짜 정하기") + "</small></div></div>" +
        (f.theme ? '<p class="wstheme">“' + esc(f.theme) + '”</p>' : '<p class="wstheme none">올해 워크샵 주제를 「① 정하기 · 준비」에 적어 주세요</p>') +
        '<div class="wscrew">' + f.who.map(function (p, i) { return '<span class="wsav" style="--c:' + p[2] + ";--i:" + i + '"><i>' + esc(p[0] === "사장님" ? "👑" : p[0].slice(1, 2)) + "</i>" + esc(nim(p[0])) + "</span>"; }).join("") + '<em>함께 떠나요 ✈</em></div></div>' +
      '<div class="wsbpr"><span class="wsbpk">' + (past ? "다녀왔어요" : "출발까지") + '</span><b class="wsdd" id="wsDD">' + (f.d1 ? (past ? "✔" : dday(f.d1)) : "D-?") + '</b><span class="wscd" id="wsCD"></span>' +
        (f.fly ? '<small class="wsfl">✈ ' + esc(f.fly) + "</small>" : "") + (f.money ? '<small class="wsfl">💴 ' + esc(f.money) + "</small>" : "") + "</div></div>";
    // 준비 진행 고리
    var mDone = f.meet.filter(function (x) { return x.c; }).length, wDone = f.wish.filter(function (x) { return x.c; }).length;
    h += '<div class="wsrings">' + ring(f.prep.n ? f.prep.d / f.prep.n : 0, "준비물 체크", f.prep.d + "/" + f.prep.n, f.prep.todo.length ? "남은 것: " + f.prep.todo.slice(0, 2).join(" · ") + (f.prep.todo.length > 2 ? " …" : "") : "다 챙겼어요 ✔", "plan", "#2E7D32") +
      ring(f.meet.length ? mDone / f.meet.length : 0, "회의", mDone + "/" + f.meet.length, (f.meet.filter(function (x) { return !x.c; })[0] ? "다음: " + f.meet.filter(function (x) { return !x.c; })[0].w + " " + f.meet.filter(function (x) { return !x.c; })[0].d : "회의 다 끝남 ✔"), "meet", "#1B5FC1") +
      ring(f.wish.length ? Math.min(1, f.wish.length / Math.max(10, f.who.length * 5)) : 0, "가고 싶은 곳", f.wish.length + "곳", wDone ? "다녀옴 " + wDone + "곳" : "한 사람 5개씩", "wish", "#C45A00") +
      ring(f.plan ? Math.min(1, f.plan / 24) : 0, "일정", f.plan + "줄", f.perDay.slice(0, 3).map(function (n, i) { return (i + 1) + "일차 " + n; }).join(" · "), "day", "#8E3BB0") +
      ring(f.files.length ? Math.min(1, f.files.length / 10) : 0, "자료 · 파일", f.files.length + "개", photos.length ? "사진 " + f.files.filter(function (x) { return /^image/.test(x.ty); }).length + "장" : "예약 캡처 · 사진 올리기", "file", "#9E4430") + "</div>";
    // 가고 싶은 곳 흐르는 띠
    if (f.wish.length) {
      var chips = f.wish.map(function (x) { var p = pc(x.p) || (/엄마|어머님/.test(x.p) ? PEOPLE[3] : null); return '<span class="wsw' + (x.c ? " done" : "") + '" style="--c:' + (p ? p[2] : "#5E5244") + '">' + (x.c ? "✔ " : "") + esc(x.g) + (x.p ? "<small>" + esc(x.p) + "</small>" : "") + "</span>"; }).join("");
      h += '<div class="wsmarq" data-wgo="wish" role="button" tabindex="0" aria-label="가고 싶은 곳 보기"><div class="wsmq"><div class="wsmqi">' + chips + "</div><div class=\"wsmqi\" aria-hidden=\"true\">" + chips + "</div></div></div>";
    }
    // 사진
    if (photos.length) h += '<div class="wsphotos">' + photos.map(function (x, i) { return '<button type="button" class="wsph" data-ph="' + x._id + '" style="--i:' + i + '"><img src="' + x.th + '" alt="' + esc(x.m || x.n) + '"></button>'; }).join("") + '<button type="button" class="wsph more" data-wgo="file">📎 사진 · 파일<br>' + f.files.length + "개 →</button></div>";
    // 이번 워크샵의 질문
    h += '<div class="wsqs">' + QS.map(function (q, i) { var d = f.days[i]; return '<div class="wsq" style="--i:' + i + '"><span>' + q[0] + (d ? " · " + (d.getMonth() + 1) + "/" + d.getDate() : "") + "</span><b>" + q[1] + "</b><p>" + q[2] + "</p></div>"; }).join("") + '<button type="button" class="wsq go" data-bngo="1"><span>🔎 벤치마킹</span><b>평가하러 가기</b><p>가게마다 7항목 /10 · 하루 정리</p></button></div>';
    hero.innerHTML = h;
    tick();
    if (!tickT) tickT = setInterval(tick, 1000);
  }
  function tick() {   // 출발까지 남은 시간 (초 단위로 움직임)
    var el = document.getElementById("wsCD"); if (!el || el.offsetParent === null) return;
    var f1 = pdate(v("d1date")); if (!f1) { el.textContent = "1일차 날짜를 넣으면 시작해요"; return; }
    var dep = new Date(f1.getTime()); dep.setHours(6, 0, 0, 0);
    var ms = dep - Date.now(); if (ms <= 0) { el.textContent = ms > -4 * 86400000 ? "워크샵 중 · 즐거운 시간!" : ""; return; }
    var d = Math.floor(ms / 86400000), hh = Math.floor(ms / 3600000) % 24, mm = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60;
    el.innerHTML = "<b>" + d + "</b>일 <b>" + hh + "</b>시간 <b>" + String(mm).padStart(2, "0") + "</b>분 <b>" + String(ss).padStart(2, "0") + "</b>초";
  }
  hero.addEventListener("click", function (e) {
    var p = e.target.closest("[data-ph]"); if (p && window.__CS_FILES) { window.__CS_FILES.view("ws." + year(), p.dataset.ph); return; }
    if (e.target.closest("[data-bngo]")) { var t = document.querySelector('.tab[data-p="tp17"]'); if (t) { t.click(); window.scrollTo(0, 0); } }
  });
  hero.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.classList.contains("wsmarq")) show("wish", true); });
  // ② 가고 싶은 곳 — 사람별 한눈에 카드(표 위)
  function drawWishTop() {
    var el = document.getElementById("wsWishTop"); if (!el) return;
    var f = facts(), by = {};
    f.wish.forEach(function (x) { var p = pc(x.p), k = p ? p[0] : (x.p || "다 같이"); (by[k] = by[k] || []).push(x); });
    var ks = Object.keys(by); if (!ks.length) { el.innerHTML = ""; return; }
    el.innerHTML = '<div class="wswcards">' + ks.map(function (k, i) { var p = pc(k); return '<div class="wswc" style="--c:' + (p ? p[2] : "#5E5244") + ";--i:" + i + '"><b>' + esc(p ? nim(p[0]) : k) + " <small>" + by[k].length + "곳</small></b><ul>" + by[k].map(function (x) { return "<li" + (x.c ? ' class="done"' : "") + ">" + (x.c ? "✔ " : "") + esc(x.g) + (x.m ? "<small>" + esc(x.m) + "</small>" : "") + "</li>"; }).join("") + "</ul></div>"; }).join("") + "</div>";
  }
  // ⑤ 파일
  function mountFiles() { var el = document.getElementById("wsFiles"); if (el && window.__CS_FILES) window.__CS_FILES.mount(el, { scope: "ws." + year(), title: "📎 " + year() + " 워크샵 · 사진 · 예약 · 영수증 · 자료", keep: true }); }
  // ── 동시 접속 — 누가 어디에서 무엇을 쓰는 중인지
  var busyEls = [];
  function presence() {
    var bar = document.getElementById("wsPres"); if (!bar || !window.__CS_PRES) return;
    var L = window.__CS_PRES().filter(function (o) { return o.key === "tp9" && o.who && Date.now() - (o.t || 0) < 150000; });
    var seen = {}; L = L.filter(function (o) { if (seen[o.who]) return false; seen[o.who] = 1; return true; });
    busyEls.forEach(function (x) { x.el.classList.remove("wsbusy"); x.el.style.removeProperty("--bc"); if (x.b && x.b.parentNode) x.b.parentNode.removeChild(x.b); }); busyEls = [];
    Array.prototype.forEach.call(nav.querySelectorAll(".wsnwho"), function (s) { s.innerHTML = ""; });
    if (!L.length) { bar.hidden = true; return; }
    bar.hidden = false;
    bar.innerHTML = '<b>👥 지금 워크샵을 같이 보는 사람</b>' + L.map(function (o) { var p = pc(o.who), pn = PANES.filter(function (x) { return x[0] === o.pane; })[0]; return '<span class="wspc' + (o.on ? "" : " away") + '" style="--c:' + (p ? p[2] : "#5E5244") + '"><i></i>' + esc(nim(o.who)) + "<em>" + (o.on ? (pn ? (pn[3] ? pn[3] + " " : "") + pn[2] : "워크샵") + (o.fk ? " · ✏ 「" + esc(o.fl || "칸") + "」 쓰는 중" : " 보는 중") : "자리 비움") + "</em></span>"; }).join("") + '<small>같은 칸은 한 사람씩 · 다른 사람이 쓰는 칸엔 이름이 떠요</small>';
    L.forEach(function (o) {
      var p = pc(o.who), c = p ? p[2] : "#5E5244";
      var nb = nav.querySelector('.wsn[data-w="' + o.pane + '"] .wsnwho'); if (nb && o.on) nb.insertAdjacentHTML("beforeend", '<i style="--c:' + c + '" title="' + esc(nim(o.who)) + '">' + esc(o.who === "사장님" ? "👑" : o.who.slice(1, 2)) + "</i>");
      if (!o.on || !o.fk) return;
      var el = root.querySelector('.wsin[data-k="' + o.fk + '"]'); if (!el) return;
      el.classList.add("wsbusy"); el.style.setProperty("--bc", c);
      var b = document.createElement("span"); b.className = "wsbusyb"; b.style.setProperty("--c", c); b.textContent = "✏ " + nim(o.who) + " 쓰는 중";
      el.parentNode.insertBefore(b, el); busyEls.push({ el: el, b: b });
    });
  }
  window.addEventListener("cs:presence", presence);
  setInterval(function () { if (root.offsetParent !== null) presence(); }, 4000);
  // ── 다른 기기가 바꾼 칸 반짝 + 「방금 ○○님」
  var snap = {};
  function takeSnap() { snap = {}; Array.prototype.forEach.call(root.querySelectorAll(".wsin[data-k]"), function (e) { snap[e.dataset.k] = e.type === "checkbox" ? e.checked : e.value; }); }
  root.addEventListener("input", function (e) { if (e.target.dataset && e.target.dataset.k) snap[e.target.dataset.k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; }, true);
  root.addEventListener("change", function (e) { if (e.target.dataset && e.target.dataset.k) snap[e.target.dataset.k] = e.target.type === "checkbox" ? e.target.checked : e.target.value; }, true);
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || [];
    if (ks.indexOf("cafesui.ws." + year()) < 0 && !ks.some(function (k) { return k === "cafesui.files.ws." + year(); })) return;
    setTimeout(function () {
      var by = stored()._by || {}, hit = {};
      Array.prototype.forEach.call(root.querySelectorAll(".wsin[data-k]"), function (el) {
        var k = el.dataset.k, cur = el.type === "checkbox" ? el.checked : el.value;
        if (!(k in snap) || snap[k] === cur || el === document.activeElement) return;
        el.classList.remove("wsflash"); void el.offsetWidth; el.classList.add("wsflash");
        var who = by[k], p = pc(who), b = document.createElement("span"); b.className = "wsjust"; b.style.setProperty("--c", p ? p[2] : "#8E1B14"); b.textContent = "방금 " + (who ? nim(who) : "다른 기기");
        el.parentNode.insertBefore(b, el); setTimeout(function () { el.classList.remove("wsflash"); if (b.parentNode) b.parentNode.removeChild(b); }, 6000);
        var pane = el.closest(".wspane"); if (pane) hit[pane.dataset.w] = 1;
      });
      Object.keys(hit).forEach(function (w) { if (w !== TAB) { var nb = nav.querySelector('.wsn[data-w="' + w + '"]'); if (nb) nb.classList.add("news"); } });
      takeSnap(); refresh();
    }, 80);
  });
  // ── 다시 그리기 (글자 칠 때마다가 아니라 0.3초 모아서)
  var rt = null;
  function refresh() { clearTimeout(rt); rt = setTimeout(function () { navStat(); if (TAB === "sum") drawHero(false); if (TAB === "wish") drawWishTop(); }, 300); }
  root.addEventListener("input", refresh); root.addEventListener("change", refresh);
  root.addEventListener("click", function (e) { if (e.target.closest(".wpcard")) setTimeout(function () { takeSnap(); mountFiles(); refresh(); if (TAB === "sum") drawHero(true); }, 120); });
  if (yearEl) yearEl.addEventListener("change", function () { setTimeout(function () { takeSnap(); mountFiles(); refresh(); drawHero(true); }, 120); });
  window.addEventListener("cs:remote", function (e) { var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf("cafesui.files.ws." + year()) >= 0) refresh(); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp9"], .mbt[data-p="tp9"]')) setTimeout(function () { show(TAB); takeSnap(); presence(); }, 60); });
  show(TAB); takeSnap();
})();
