// 🔎 벤치마킹 — 따로 탭(tp17). 워크샵과 연동: 해 · 일차 날짜 · 가게 목록(일정표 ⭐)은 워크샵에서, 워크샵 탭에는 요약만.
// cafesui.bench.<해> = { st: { 가게id: { d, n, o, t, by, del } }, ev: { 가게id: { 이름: { s1..s7, rep, memo, take, at } } }, rf: { d1: { 이름: { t, at } } } }
// 저장은 일지처럼 「내 칸만」 — 최신 저장값에 내가 바꾼 칸 하나만 얹는다 (다른 직원 · 다른 기기 글을 덮지 않음). 가게 빼기는 del 표시만(기록은 남김).
(function () {
  var root = document.getElementById("bnBox"), sum = document.getElementById("bnSum");
  if (!root) return;
  var yearEl = document.getElementById("wsYear");
  var ITEMS = [["s1", "파사드", "입구부터 화장실까지 · 건물 정면 외벽"], ["s2", "향", "가게 전체에서 풍기는 향"], ["s3", "음악", ""], ["s4", "메뉴", ""],
               ["s5", "가격", ""], ["s6", "플레이팅 · 디테일", ""], ["s7", "재미", "높은 평점을 줄 수 있다"]];
  var PEOPLE = [["사장님", "p4"], ["정항아", "p1"], ["박혜빈", "p2"], ["이해선", "p3"]];
  // 워크샵 2차 회의에서 정한 「이번 워크샵의 질문」 — 날마다 하루 정리
  var QS = { 1: ["발견", "나는 무엇을 좋다고 생각하는가?"], 2: ["분석", "잘되는 가게는 왜 잘되는가?"], 3: ["적용", "우리는 무엇을 지키고, 무엇을 바꾸고, 나는 무엇을 할 것인가?"] };
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  var day = 1, openSet = {}, timers = {}, pendingRemote = false;
  function year() { return (yearEl && yearEl.value) || String(new Date().getFullYear()); }
  function key() { return "cafesui.bench." + year(); }
  function load() { try { var o = JSON.parse(localStorage.getItem(key()) || "{}") || {}; o.st = o.st || {}; o.ev = o.ev || {}; o.rf = o.rf || {}; return o; } catch (e) { return { st: {}, ev: {}, rf: {} }; } }
  function store(o) { try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) {} }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return n === "사장님" ? n : n + "님"; }
  function col(n) { for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i][0] === n) return PEOPLE[i][1]; return ""; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function stamp() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function total(e) { var t = 0, n = 0; ITEMS.forEach(function (it) { var v = parseFloat(e && e[it[0]]); if (!isNaN(v)) { t += v; n++; } }); return n ? { t: t, n: n } : null; }
  function wsVal(k) { var el = document.querySelector('.wsin[data-k="' + k + '"]'); return el ? (el.value || "").trim() : ""; }
  function dayLabel(d) {
    var v = wsVal("d" + d + "date"), m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return d + "일차";
    var dt = new Date(+m[1], +m[2] - 1, +m[3]); return d + "일차 · " + (+m[2]) + "/" + (+m[3]) + "(" + WD[dt.getDay()] + ")";
  }
  // 워크샵 일정표에서 ⭐ 붙은 곳 → 가게 목록 (빈 날만 · 같은 id라 여러 기기가 동시에 깔아도 겹치지 않음)
  function seedDay(o, d) {
    if (Object.keys(o.st).some(function (id) { return o.st[id].d === d; })) return false;
    var added = false;
    for (var r = 1; r <= 40; r++) {
      var name = wsVal("d" + d + "p" + r), memo = wsVal("d" + d + "m" + r);
      if (!name || memo.indexOf("⭐") < 0) continue;
      o.st["d" + d + "r" + r] = { d: d, n: name, o: r, t: wsVal("d" + d + "t" + r), by: "일정표" }; added = true;
    }
    return added;
  }
  function stores(o, d) {
    return Object.keys(o.st).filter(function (id) { var s = o.st[id]; return s && s.d === d && !s.del; })
      .sort(function (a, b) { return (o.st[a].o || 0) - (o.st[b].o || 0); });
  }
  function avgOf(o, id) {
    var ev = o.ev[id] || {}, s = 0, c = 0;
    Object.keys(ev).forEach(function (w) { var t = total(ev[w]); if (t) { s += t.t / t.n * 7; c++; } });
    return c ? { v: s / c, n: c } : null;
  }
  function rankOf(o, d) { return stores(o, d).map(function (id) { return { id: id, a: avgOf(o, id) }; }).filter(function (x) { return x.a; }).sort(function (a, b) { return b.a.v - a.a.v; }); }

  function render() {
    var o = load(), who = me();
    var seeded = false; [1, 2, 3].forEach(function (d) { if (seedDay(o, d)) seeded = true; }); if (seeded) store(o);
    var ids = stores(o, day), rank = rankOf(o, day);
    var h = '<div class="bnhead"><b>📅 ' + esc(year()) + " 워크샵</b>" + (wsVal("w2") ? " · " + esc(wsVal("w2")) : "") + ' <small>(해는 워크샵 탭에서 바꿉니다)</small></div>';
    h += '<nav class="bntabs">' + [1, 2, 3].map(function (d) { return '<button type="button" class="bntab" data-d="' + d + '" aria-selected="' + (d === day) + '">' + esc(dayLabel(d)) + "</button>"; }).join("") + "</nav>";
    h += '<p class="bnq">❓ ' + day + "일차 <b>" + QS[day][0] + "</b> — " + QS[day][1] + "</p>";
    h += '<p class="bnme">' + (who ? "✍ <b class='" + col(who) + "'>" + esc(nim(who)) + "</b> 이름으로 저장됩니다 · 적는 즉시 저장 · 다른 직원 칸은 보기만" : "⚠ 로그인한 사람 이름으로 저장됩니다 — 먼저 맨 위에서 이름을 골라 주세요") + "</p>";
    if (rank.length) h += '<div class="bnrank"><b>🏆 순위</b> ' + rank.slice(0, 5).map(function (x, i) { return "<span><i>" + (i + 1) + "</i>" + esc(o.st[x.id].n) + " <em>" + x.a.v.toFixed(1) + "</em></span>"; }).join("") + "</div>";
    if (!ids.length) h += '<p class="bnnone">아직 가게가 없습니다 · 워크샵 일정표에 ⭐를 붙이거나 아래 「＋ 가게 추가」로 넣어 주세요</p>';
    ids.forEach(function (id) {
      var s = o.st[id], ev = o.ev[id] || {}, mine = (who && ev[who]) || {}, a = avgOf(o, id);
      h += '<details class="bncard" data-id="' + id + '"' + (openSet[id] ? " open" : "") + "><summary>" + (s.t ? '<span class="bnt">' + esc(s.t) + "</span>" : "") + "<b>" + esc(s.n) + "</b>" +
        (a ? '<span class="bnavg">평균 <b>' + a.v.toFixed(1) + "</b>/70 · " + a.n + "명</span>" : '<span class="bnavg none">아직 평가 없음</span>') +
        (mine.at ? '<span class="bndone">✔ 내 평가</span>' : "") + "</summary><div class='bnbody'>";
      if (who) {
        h += '<div class="bnmine"><div class="bnmh ' + col(who) + '">' + esc(nim(who)) + " 평가 <small>" + (mine.at ? "저장 " + esc(mine.at) : "") + "</small></div><div class='bngrid'>" +
          ITEMS.map(function (it) {
            var v = mine[it[0]] || "";
            return '<label class="bnit"><span>' + it[1] + (it[2] ? "<small>" + it[2] + "</small>" : "") + '</span><select class="bnin" data-id="' + id + '" data-f="' + it[0] + '"><option value="">—</option>' +
              [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { return "<option" + (String(n) === String(v) ? " selected" : "") + ">" + n + "</option>"; }).join("") + "</select></label>";
          }).join("") + "</div>" +
          '<div class="bntot">합계 <b>' + ((total(mine) || {}).t || 0) + "</b> / 70</div>" +
          '<label class="bnrow"><span>대표 제품 · 가격</span><input type="text" class="bnin" data-id="' + id + '" data-f="rep" value="' + esc(mine.rep || "") + '" placeholder="예) 나폴레옹 파이 680엔"></label>' +
          '<label class="bnrow"><span>메모 · 좋았던 점 · 아쉬운 점</span><textarea class="bnin" rows="3" data-id="' + id + '" data-f="memo" placeholder="손님 관찰 30분 · 전비강 / 후비강 · 진열 · 포장 · 응대…">' + esc(mine.memo || "") + "</textarea></label>" +
          '<label class="bnrow take"><span>⭐ 카페스이에 가져올 것</span><input type="text" class="bnin" data-id="' + id + '" data-f="take" value="' + esc(mine.take || "") + '" placeholder="한 줄로"></label></div>';
      }
      var others = Object.keys(ev).filter(function (w) { return w !== who && (total(ev[w]) || ev[w].memo || ev[w].take || ev[w].rep); });
      if (others.length) {
        h += '<div class="bnothers"><div class="bnoh">다른 직원 평가</div><div class="ztable-wrap"><table class="bntable"><tr><th>누가</th>' + ITEMS.map(function (it) { return "<th>" + it[1] + "</th>"; }).join("") + "<th>합계</th></tr>" +
          others.map(function (w) { var e = ev[w], t = total(e); return '<tr><td class="' + col(w) + '"><b>' + esc(nim(w)) + "</b></td>" + ITEMS.map(function (it) { return "<td>" + esc(e[it[0]] || "—") + "</td>"; }).join("") + "<td><b>" + (t ? t.t : "—") + "</b></td></tr>"; }).join("") + "</table></div>" +
          others.map(function (w) { var e = ev[w]; if (!(e.rep || e.memo || e.take)) return ""; return '<div class="bnnote ' + col(w) + '"><b>' + esc(nim(w)) + "</b>" + (e.rep ? "<p>🍰 " + esc(e.rep) + "</p>" : "") + (e.memo ? "<p>" + esc(e.memo).replace(/\n/g, "<br>") + "</p>" : "") + (e.take ? "<p class='tk'>⭐ " + esc(e.take) + "</p>" : "") + (e.at ? "<small>" + esc(e.at) + "</small>" : "") + "</div>"; }).join("") + "</div>";
      }
      h += '<div class="bnfoot">' + (s.by && s.by !== "일정표" ? "추가 " + esc(nim(s.by)) + " · " : "워크샵 일정표에서 · ") + '<button type="button" class="bnx" data-id="' + id + '">이 가게 빼기</button></div></div></details>';
    });
    h += '<div class="bnadd"><input type="text" id="bnNew" placeholder="가게 이름 (예: 개별 미션 — ○○카페)"><button type="button" class="skbtn prim" id="bnAddBtn">＋ 가게 추가</button></div>';
    // 하루 정리 (그날의 질문)
    var rf = o.rf["d" + day] || {}, myrf = (who && rf[who]) || {};
    h += '<div class="bnrf"><div class="bnrfh">📝 ' + esc(dayLabel(day)) + " 하루 정리 — " + QS[day][1] + "</div>" +
      (who ? '<textarea class="bnin bnrfin" rows="4" data-rf="d' + day + '" placeholder="오늘 본 것 중 좋았던 것 · 이유 · 카페스이에 적용할 것">' + esc(myrf.t || "") + "</textarea>" + (myrf.at ? '<small class="bnrfat">저장 ' + esc(myrf.at) + "</small>" : "") : "") +
      Object.keys(rf).filter(function (w) { return w !== who && rf[w] && rf[w].t; }).map(function (w) { return '<div class="bnnote ' + col(w) + '"><b>' + esc(nim(w)) + "</b><p>" + esc(rf[w].t).replace(/\n/g, "<br>") + "</p><small>" + esc(rf[w].at || "") + "</small></div>"; }).join("") + "</div>";
    h += '<div class="bncopy"><button type="button" class="skbtn" id="bnCopy">📋 ' + day + '일차 정리 복사 (텔레그램 공유)</button><span id="bnCopyMsg"></span></div>';
    root.innerHTML = h;
    renderSum(o);
  }
  // 워크샵 탭 요약 — 날마다 가게 수 · 평가 수 · 1등
  function renderSum(o) {
    if (!sum) return; o = o || load();
    sum.innerHTML = '<div class="bnsumrow">' + [1, 2, 3].map(function (d) {
      var ids = stores(o, d), n = 0; ids.forEach(function (id) { n += Object.keys(o.ev[id] || {}).filter(function (w) { return total(o.ev[id][w]); }).length; });
      var r = rankOf(o, d)[0];
      return '<div class="bnsumc"><b>' + esc(dayLabel(d)) + "</b><span>가게 " + ids.length + "곳 · 평가 " + n + "건</span>" + (r ? "<span>🏆 " + esc(o.st[r.id].n) + " <em>" + r.a.v.toFixed(1) + "</em></span>" : "<span class='none'>아직 평가 없음</span>") + "</div>";
    }).join("") + '</div><button type="button" class="skbtn prim" id="bnGo">🔎 벤치마킹 탭에서 평가 · 메모하기</button>';
    var go = document.getElementById("bnGo"); if (go) go.onclick = function () { var t = document.querySelector('.tab[data-p="tp17"]'); if (t) { t.click(); window.scrollTo(0, 0); } };
  }
  function copyText(o) {
    var L = ["[카페스이 워크샵 벤치마킹] " + dayLabel(day), "❓ " + QS[day][1], ""];
    rankOf(o, day).forEach(function (x, i) { L.push((i + 1) + ". " + o.st[x.id].n + " — 평균 " + x.a.v.toFixed(1) + "/70 (" + x.a.n + "명)"); });
    stores(o, day).forEach(function (id) {
      var ev = o.ev[id] || {}, ws = Object.keys(ev).filter(function (w) { return ev[w].take || ev[w].memo; }); if (!ws.length) return;
      L.push("", "▶ " + o.st[id].n);
      ws.forEach(function (w) { var e = ev[w]; L.push("- " + nim(w) + (e.take ? " ⭐ " + e.take : "") + (e.memo ? " / " + e.memo.replace(/\n/g, " ") : "")); });
    });
    var rf = o.rf["d" + day] || {}, rw = Object.keys(rf).filter(function (w) { return rf[w] && rf[w].t; });
    if (rw.length) { L.push("", "📝 하루 정리"); rw.forEach(function (w) { L.push("- " + nim(w) + ": " + rf[w].t.replace(/\n/g, " ")); }); }
    return L.join("\n");
  }
  function saveField(id, f, v) {
    var who = me(); if (!who) return;
    var o = load(); o.ev[id] = o.ev[id] || {}; var e = o.ev[id][who] = o.ev[id][who] || {};
    if (String(v).trim() === "") delete e[f]; else e[f] = v;
    e.at = stamp(); store(o); renderSum(o);
  }
  function saveRf(d, v) {
    var who = me(); if (!who) return;
    var o = load(); o.rf[d] = o.rf[d] || {};
    if (String(v).trim() === "") delete o.rf[d][who]; else o.rf[d][who] = { t: v, at: stamp() };
    store(o);
  }
  root.addEventListener("click", function (e) {
    var t = e.target;
    var tab = t.closest && t.closest(".bntab"); if (tab) { day = +tab.dataset.d; render(); return; }
    if (t.id === "bnAddBtn") {
      var inp = document.getElementById("bnNew"), n = (inp.value || "").trim(); if (!n) { inp.focus(); return; }
      var o = load(), mx = 0; stores(o, day).forEach(function (id) { mx = Math.max(mx, o.st[id].o || 0); });
      var id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      o.st[id] = { d: day, n: n, o: mx + 1, by: me() || "" }; store(o); openSet[id] = 1; render(); return;
    }
    if (t.id === "bnCopy") {
      var txt = copyText(load()), msg = document.getElementById("bnCopyMsg");
      var ok = function () { if (msg) msg.textContent = "복사했습니다 · 텔레그램에 붙여 넣으세요"; };
      try { navigator.clipboard.writeText(txt).then(ok, function () { prompt("복사해서 붙여 넣으세요", txt); }); } catch (x) { prompt("복사해서 붙여 넣으세요", txt); }
      return;
    }
    if (t.classList && t.classList.contains("bnx")) {
      var o2 = load(), s = o2.st[t.dataset.id]; if (!s) return;
      var cnt = Object.keys(o2.ev[t.dataset.id] || {}).length;
      if (!confirm("「" + s.n + "」을 목록에서 뺄까요?" + (cnt ? "\n(적어 둔 평가 " + cnt + "명분은 지우지 않고 남겨 둡니다)" : ""))) return;
      s.del = 1; s.delBy = me(); store(o2); render();
    }
  });
  root.addEventListener("toggle", function (e) { var d = e.target; if (d.classList && d.classList.contains("bncard")) { if (d.open) openSet[d.dataset.id] = 1; else delete openSet[d.dataset.id]; } }, true);
  root.addEventListener("change", function (e) {
    var t = e.target; if (!t.classList.contains("bnin") || t.tagName !== "SELECT") return;
    saveField(t.dataset.id, t.dataset.f, t.value);
    var card = t.closest(".bncard"), tot = card && card.querySelector(".bntot b");
    if (tot) tot.textContent = (total((load().ev[t.dataset.id] || {})[me()]) || {}).t || 0;
  });
  root.addEventListener("input", function (e) {
    var t = e.target; if (!t.classList.contains("bnin") || t.tagName === "SELECT") return;
    var k = t.dataset.rf ? "rf|" + t.dataset.rf : t.dataset.id + "|" + t.dataset.f; clearTimeout(timers[k]);
    timers[k] = setTimeout(function () { delete timers[k]; if (t.dataset.rf) saveRf(t.dataset.rf, t.value); else saveField(t.dataset.id, t.dataset.f, t.value); }, 400);
  });
  root.addEventListener("keydown", function (e) { if (e.target.id === "bnNew" && e.key === "Enter") { e.preventDefault(); document.getElementById("bnAddBtn").click(); } });
  // 다른 기기 · 다른 직원이 적으면 — 쓰는 중이 아닐 때 다시 그린다
  root.addEventListener("focusout", function () { setTimeout(function () { if (pendingRemote && !root.contains(document.activeElement)) { pendingRemote = false; render(); } }, 50); });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || [];
    if (ks.indexOf(key()) < 0 && ks.indexOf("cafesui.ws." + year()) < 0) return;   // 워크샵 일정(날짜 · ⭐ 가게)이 바뀌어도 다시 그림
    if (root.contains(document.activeElement)) pendingRemote = true; else render();
  });
  // 창을 닫을 때 아직 안 넘긴 글자 저장
  window.addEventListener("pagehide", function () {
    Array.prototype.forEach.call(root.querySelectorAll("input.bnin, textarea.bnin"), function (t) {
      var k = t.dataset.rf ? "rf|" + t.dataset.rf : t.dataset.id + "|" + t.dataset.f;
      if (timers[k]) { clearTimeout(timers[k]); delete timers[k]; if (t.dataset.rf) saveRf(t.dataset.rf, t.value); else saveField(t.dataset.id, t.dataset.f, t.value); }
    });
  });
  if (yearEl) yearEl.addEventListener("change", function () { openSet = {}; setTimeout(render, 50); });
  setTimeout(render, 0);
})();
