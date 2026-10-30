// 🔎 벤치마킹 — 따로 탭(tp17) · 10/30 v0924-298 다시 짬 (사장님 「벤치마킹도 다 뜯고 · 워크샵 때랑 아닐 때랑 따로」)
//  ✈ 워크샵 벤치마킹: cafesui.bench.<해> = { st: { 가게id: { d 일차, n, o, t, by, del } }, ev: { 가게id: { 이름: { s1..s7, rep, memo, take, at } } }, rf: { d1: { 이름: { t, at } } }, ap }
//     해 · 일차 날짜 · 가게 목록(일정표 ⭐)은 워크샵에서, 워크샵 탭 「한눈에」에는 요약(#bnSum)만.
//  ☕ 평소 벤치마킹(워크샵 아닐 때): cafesui.bench.local = { st: { id: { dt 날짜, n, area 지역, o, by, del } }, ev: 같은 모양, ap }
//  ⭐ 가져올 것 보드: ap["가게id|이름"] = { s: "try" | "done", by, at } — 💡 아이디어 → 🧪 해 보는 중 → ✅ 적용함
//  사진 · 파일: files.js (범위 bn.<해> · bnl, ref = 가게id)
// 저장은 일지처럼 「내 칸만」 — 최신 저장값에 내가 바꾼 칸 하나만 얹는다. 가게 빼기는 del 표시만(기록은 남김).
(function () {
  var root = document.getElementById("bnBox"), sum = document.getElementById("bnSum");
  if (!root) return;
  var yearEl = document.getElementById("wsYear");
  var ITEMS = [["s1", "파사드", "입구부터 화장실까지 · 건물 정면 외벽"], ["s2", "향", "가게 전체에서 풍기는 향"], ["s3", "음악", "곡 · 크기 · 분위기"], ["s4", "메뉴", "구성 · 이름 · 설명"],
               ["s5", "가격", "가격 대비 만족"], ["s6", "플레이팅 · 디테일", "그릇 · 포장 · 작은 배려"], ["s7", "재미", "또 오고 싶은가"]];
  var PEOPLE = [["사장님", "p4", "#2E7D32"], ["정항아", "p1", "#C45A00"], ["박혜빈", "p2", "#1B5FC1"], ["이해선", "p3", "#8E3BB0"]];
  var QS = { 1: ["발견", "나는 무엇을 좋다고 생각하는가?"], 2: ["분석", "잘되는 가게는 왜 잘되는가?"], 3: ["적용", "우리는 무엇을 지키고, 무엇을 바꾸고, 나는 무엇을 할 것인가?"] };
  var WD = ["일", "월", "화", "수", "목", "금", "토"];
  var MODE = "ws"; try { MODE = localStorage.getItem("cafesui.ui.bnmode") || "ws"; } catch (e) {}
  var day = 1, month = "all", openSet = {}, timers = {}, pendingRemote = false, animAt = 0, dirty = false;
  function year() { return (yearEl && yearEl.value) || String(new Date().getFullYear()); }
  function key() { return MODE === "loc" ? "cafesui.bench.local" : "cafesui.bench." + year(); }
  function fscope() { return MODE === "loc" ? "bnl" : "bn." + year(); }
  function loadK(k) { try { var o = JSON.parse(localStorage.getItem(k) || "{}") || {}; o.st = o.st || {}; o.ev = o.ev || {}; o.rf = o.rf || {}; o.ap = o.ap || {}; return o; } catch (e) { return { st: {}, ev: {}, rf: {}, ap: {} }; } }
  function load() { return loadK(key()); }
  function store(o) { try { localStorage.setItem(key(), JSON.stringify(o)); } catch (e) {} }
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function nim(n) { return n === "사장님" ? n : n + "님"; }
  function pp(n) { for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i][0] === n) return PEOPLE[i]; return null; }
  function col(n) { var p = pp(n); return p ? p[1] : ""; }
  function hex(n) { var p = pp(n); return p ? p[2] : "#5E5244"; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function stamp() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function mdw(s) { var m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!m) return ""; var d = new Date(+m[1], +m[2] - 1, +m[3]); return (+m[2]) + "/" + (+m[3]) + "(" + WD[d.getDay()] + ")"; }
  function total(e) { var t = 0, n = 0; ITEMS.forEach(function (it) { var v = parseFloat(e && e[it[0]]); if (!isNaN(v)) { t += v; n++; } }); return n ? { t: t, n: n } : null; }
  function wsVal(k) { var el = document.querySelector('.wsin[data-k="' + k + '"]'); return el ? (el.value || "").trim() : ""; }
  function dayLabel(d) { var v = wsVal("d" + d + "date"); return d + "일차" + (v ? " · " + mdw(v) : ""); }
  function seedDay(o, d) {   // 워크샵 일정표에서 ⭐ 붙은 곳 → 가게 목록 (빈 날만 · 같은 id라 여러 기기가 동시에 깔아도 겹치지 않음)
    if (Object.keys(o.st).some(function (id) { return o.st[id].d === d; })) return false;
    var added = false;
    for (var r = 1; r <= 40; r++) {
      var name = wsVal("d" + d + "p" + r), memo = wsVal("d" + d + "m" + r);
      if (!name || memo.indexOf("⭐") < 0) continue;
      o.st["d" + d + "r" + r] = { d: d, n: name, o: r, t: wsVal("d" + d + "t" + r), by: "일정표" }; added = true;
    }
    return added;
  }
  function stores(o) {
    return Object.keys(o.st).filter(function (id) { var s = o.st[id]; if (!s || s.del) return false; if (MODE === "ws") return s.d === day; return month === "all" || String(s.dt || "").slice(0, 7) === month; })
      .sort(function (a, b) { var x = o.st[a], y = o.st[b]; return MODE === "ws" ? (x.o || 0) - (y.o || 0) : String(y.dt || "").localeCompare(String(x.dt || "")) || (y.o || 0) - (x.o || 0); });
  }
  function avgOf(o, id) { var ev = o.ev[id] || {}, s = 0, c = 0; Object.keys(ev).forEach(function (w) { var t = total(ev[w]); if (t) { s += t.t / t.n * 7; c++; } }); return c ? { v: s / c, n: c } : null; }
  function itemAvg(o, id) { var ev = o.ev[id] || {}, r = {}; ITEMS.forEach(function (it) { var s = 0, c = 0; Object.keys(ev).forEach(function (w) { var x = parseFloat(ev[w][it[0]]); if (!isNaN(x)) { s += x; c++; } }); r[it[0]] = c ? s / c : null; }); return r; }
  function rankOf(o, ids) { return ids.map(function (id) { return { id: id, a: avgOf(o, id) }; }).filter(function (x) { return x.a; }).sort(function (a, b) { return b.a.v - a.a.v; }); }
  function editingOf(id) {   // 동시 접속 — 이 가게를 지금 평가하는 다른 사람
    if (!window.__CS_PRES) return [];
    var seen = {}; return window.__CS_PRES().filter(function (o) { return o.key === "tp17" && o.on && o.who !== me() && String(o.fk || "").indexOf(id + "|") === 0 && !seen[o.who] && (seen[o.who] = 1); });
  }
  function takes(o) {   // ⭐ 가져올 것 — 이 화면(모드)의 모든 가게 · 사람
    var out = [];
    Object.keys(o.st).forEach(function (id) { var s = o.st[id]; if (!s || s.del) return; var ev = o.ev[id] || {}; Object.keys(ev).forEach(function (w) { if (ev[w].take && String(ev[w].take).trim()) { var a = o.ap[id + "|" + w] || {}; out.push({ id: id, w: w, t: ev[w].take, s: a.s || "idea", a: a, n: s.n, dt: s.dt, d: s.d }); } }); });
    return out;
  }
  function modeBar() {
    var ws = load2("cafesui.bench." + year()), lc = load2("cafesui.bench.local");
    function cnt(o) { return Object.keys(o.st).filter(function (id) { return o.st[id] && !o.st[id].del; }).length; }
    return '<div class="bnmode" id="bnMode" role="tablist">' +
      '<button type="button" data-m="ws" data-lab="✈ 워크샵" aria-pressed="' + (MODE === "ws") + '"><span class="bnmi">✈</span><b>워크샵 벤치마킹</b><small>' + esc(year()) + " 워크샵" + (wsVal("w2") ? " · " + esc(wsVal("w2").split("·")[0].trim()) : "") + " · 가게 " + cnt(ws) + "곳 · 하루 5~6군데</small></button>" +
      '<button type="button" data-m="loc" data-lab="☕ 평소" aria-pressed="' + (MODE === "loc") + '"><span class="bnmi">☕</span><b>평소 벤치마킹</b><small>워크샵 아닐 때 · 쉬는 날 · 동네 · 다른 지역 가게 · ' + cnt(lc) + "곳</small></button></div>";
  }
  function load2(k) { return loadK(k); }
  function podium(o, R) {
    if (!R.length) return "";
    var top = R.slice(0, 3), order = top.length === 3 ? [1, 0, 2] : top.length === 2 ? [1, 0] : [0], H = [100, 78, 62], M = ["🥇", "🥈", "🥉"];
    return '<div class="bnpod">' + order.map(function (i) { var x = top[i]; return '<div class="bnpc r' + (i + 1) + '" style="--h:' + H[i] + '%;--i:' + i + '"><b>' + M[i] + " " + esc(o.st[x.id].n) + "</b><em>" + x.a.v.toFixed(1) + '<small>/70 · ' + x.a.n + "명</small></em><i></i></div>"; }).join("") + "</div>" +
      (R.length > 3 ? '<p class="bnrest">' + R.slice(3, 8).map(function (x, i) { return "<span>" + (i + 4) + ". " + esc(o.st[x.id].n) + " <em>" + x.a.v.toFixed(1) + "</em></span>"; }).join("") + "</p>" : "");
  }
  function board(o) {
    var L = takes(o); if (!L.length) return '<div class="bnboard empty"><b>⭐ 카페스이에 가져올 것</b><p>가게 평가에서 「⭐ 카페스이에 가져올 것」을 적으면 여기 모여요 · 💡 아이디어 → 🧪 해 보는 중 → ✅ 적용함으로 옮기며 끝까지 챙겨요</p></div>';
    var C = [["idea", "💡 아이디어"], ["try", "🧪 해 보는 중"], ["done", "✅ 적용함"]];
    return '<div class="bnboard"><div class="bnbh"><b>⭐ 카페스이에 가져올 것 <small>' + L.length + "개</small></b><span>카드의 단추를 누르면 다음 단계로 · 누가 언제 옮겼는지 남아요</span></div><div class=\"bnbcols\">" + C.map(function (c) {
      var X = L.filter(function (x) { return x.s === c[0]; });
      return '<div class="bnbc ' + c[0] + '"><h5>' + c[1] + " <i>" + X.length + "</i></h5>" + X.map(function (x, i) {
        return '<div class="bnbi" style="--c:' + hex(x.w) + ";--i:" + i + '"><p>' + esc(x.t) + '</p><small>' + esc(nim(x.w)) + " · " + esc(x.n) + (x.dt ? " " + mdw(x.dt) : x.d ? " · " + x.d + "일차" : "") + (x.a.by ? " · " + (c[0] === "done" ? "적용" : "옮김") + " " + esc(nim(x.a.by)) + " " + esc(x.a.at || "") : "") + "</small>" +
          '<div class="bnbbtn">' + (c[0] !== "idea" ? '<button type="button" data-ap="' + esc(x.id + "|" + x.w) + '" data-s="' + (c[0] === "done" ? "try" : "idea") + '">←</button>' : "") + (c[0] !== "done" ? '<button type="button" class="nx" data-ap="' + esc(x.id + "|" + x.w) + '" data-s="' + (c[0] === "idea" ? "try" : "done") + '">' + (c[0] === "idea" ? "🧪 해 볼게요" : "✅ 적용했어요") + "</button>" : "") + "</div></div>";
      }).join("") + "</div>";
    }).join("") + "</div></div>";
  }
  function card(o, id, who) {
    var s = o.st[id], ev = o.ev[id] || {}, mine = (who && ev[who]) || {}, a = avgOf(o, id), ia = itemAvg(o, id), ed = editingOf(id), nf = window.__CS_FILES ? window.__CS_FILES.list(fscope(), id).length : 0;
    var h = '<details class="bncard" data-id="' + id + '"' + (openSet[id] ? " open" : "") + "><summary>" +
      (MODE === "loc" ? '<span class="bnt">' + esc(mdw(s.dt)) + "</span>" : s.t ? '<span class="bnt">' + esc(s.t) + "</span>" : "") + '<b class="bnsn">' + esc(s.n) + (s.area ? "<small>" + esc(s.area) + "</small>" : "") + "</b>" +
      (a ? '<span class="bnavg"><b>' + a.v.toFixed(1) + '</b>/70 · ' + a.n + '명<i class="bnab"><u style="width:' + (a.v / 70 * 100).toFixed(1) + '%"></u></i></span>' : '<span class="bnavg none">아직 평가 없음</span>') +
      (nf ? '<span class="bnfc">📎 ' + nf + "</span>" : "") + (mine.at ? '<span class="bndone">✔ 내 평가</span>' : "") +
      ed.map(function (x) { return '<span class="bnedit" style="--c:' + hex(x.who) + '">✏ ' + esc(nim(x.who)) + " 평가 중</span>"; }).join("") + "</summary><div class='bnbody'>";
    if (a) h += '<div class="bnbars"><div class="bnbh2">👥 다 같이 매긴 점수 (평균)</div>' + ITEMS.map(function (it, i) { var x = ia[it[0]]; return '<div class="bnbar" style="--i:' + i + '"><span>' + it[1] + '</span><i><u style="width:' + (x == null ? 0 : x * 10) + '%"></u></i><b>' + (x == null ? "—" : x.toFixed(1)) + "</b></div>"; }).join("") + "</div>";
    if (who) {
      h += '<div class="bnmine" style="--c:' + hex(who) + '"><div class="bnmh">' + esc(nim(who)) + " 평가 <small>" + (mine.at ? "저장 " + esc(mine.at) : "적는 즉시 저장") + "</small></div><div class='bngrid'>" +
        ITEMS.map(function (it) {
          var v = mine[it[0]] || "";
          return '<label class="bnit"><span>' + it[1] + (it[2] ? "<small>" + it[2] + "</small>" : "") + '</span><select class="bnin" data-id="' + id + '" data-f="' + it[0] + '"><option value="">—</option>' +
            [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(function (n) { return "<option" + (String(n) === String(v) ? " selected" : "") + ">" + n + "</option>"; }).join("") + '</select><i class="bnmeter"><u style="width:' + (v ? v * 10 : 0) + '%"></u></i></label>';
        }).join("") + "</div>" +
        '<div class="bntot">내 합계 <b>' + ((total(mine) || {}).t || 0) + "</b> / 70</div>" +
        '<label class="bnrow"><span>🍰 대표 제품 · 가격</span><input type="text" class="bnin" data-id="' + id + '" data-f="rep" value="' + esc(mine.rep || "") + '" placeholder="예) 나폴레옹 파이 680엔"></label>' +
        '<label class="bnrow"><span>📝 메모 · 좋았던 점 · 아쉬운 점</span><textarea class="bnin" rows="3" data-id="' + id + '" data-f="memo" placeholder="손님 관찰 30분 · 전비강 / 후비강 · 진열 · 포장 · 응대…">' + esc(mine.memo || "") + "</textarea></label>" +
        '<label class="bnrow take"><span>⭐ 카페스이에 가져올 것</span><input type="text" class="bnin" data-id="' + id + '" data-f="take" value="' + esc(mine.take || "") + '" placeholder="한 줄로 · 아래 「가져올 것」 보드에 모여요"></label></div>';
    }
    var others = Object.keys(ev).filter(function (w) { return w !== who && (total(ev[w]) || ev[w].memo || ev[w].take || ev[w].rep); });
    if (others.length) {
      h += '<div class="bnothers"><div class="bnoh">다른 사람 평가</div><div class="ztable-wrap"><table class="bntable"><tr><th>누가</th>' + ITEMS.map(function (it) { return "<th>" + it[1] + "</th>"; }).join("") + "<th>합계</th></tr>" +
        others.map(function (w) { var e = ev[w], t = total(e); return '<tr><td class="' + col(w) + '"><b>' + esc(nim(w)) + "</b></td>" + ITEMS.map(function (it) { return "<td>" + esc(e[it[0]] || "—") + "</td>"; }).join("") + "<td><b>" + (t ? t.t : "—") + "</b></td></tr>"; }).join("") + "</table></div>" +
        others.map(function (w) { var e = ev[w]; if (!(e.rep || e.memo || e.take)) return ""; return '<div class="bnnote" style="--c:' + hex(w) + '"><b>' + esc(nim(w)) + "</b>" + (e.rep ? "<p>🍰 " + esc(e.rep) + "</p>" : "") + (e.memo ? "<p>" + esc(e.memo).replace(/\n/g, "<br>") + "</p>" : "") + (e.take ? "<p class='tk'>⭐ " + esc(e.take) + "</p>" : "") + "</div>"; }).join("") + "</div>";
    }
    h += '<div class="bnfiles" data-fid="' + id + '"></div>';
    h += '<div class="bnfoot">' + (s.by && s.by !== "일정표" ? "추가 " + esc(nim(s.by)) + " · " : MODE === "ws" ? "워크샵 일정표에서 · " : "") + '<button type="button" class="bnx" data-id="' + id + '">이 가게 빼기</button></div></div></details>';
    return h;
  }
  function render() {
    var o = load(), who = me();
    if (MODE === "ws") { var seeded = false; [1, 2, 3].forEach(function (d) { if (seedDay(o, d)) seeded = true; }); if (seeded) store(o); }
    var ids = stores(o), R = rankOf(o, ids), A = Date.now() - animAt > 15000; animAt = Date.now();
    var h = modeBar() + '<div class="bnwrap' + (A ? " anim" : "") + '">';
    h += '<p class="bnme">' + (who ? "✍ <b style='color:" + hex(who) + "'>" + esc(nim(who)) + "</b> 이름으로 저장됩니다 · 적는 즉시 저장 · 다른 사람 칸은 보기만 · 누가 어느 가게를 평가 중인지 이름이 떠요" : "⚠ 로그인한 사람 이름으로 저장됩니다 — 먼저 맨 위에서 이름을 골라 주세요") + "</p>";
    if (MODE === "ws") {
      h += '<div class="bnhead"><b>✈ ' + esc(year()) + " 워크샵</b>" + (wsVal("w2") ? " · " + esc(wsVal("w2")) : "") + ' <small>(해는 워크샵 탭에서 바꿉니다)</small></div>';
      h += '<nav class="bntabs">' + [1, 2, 3].map(function (d) { var n = Object.keys(o.st).filter(function (id) { return o.st[id].d === d && !o.st[id].del; }).length; return '<button type="button" class="bntab" data-d="' + d + '" aria-selected="' + (d === day) + '"><b>' + esc(dayLabel(d)) + "</b><small>" + QS[d][0] + " · 가게 " + n + "곳</small></button>"; }).join("") + "</nav>";
      h += '<div class="bnq"><span>' + day + "일차 질문 · " + QS[day][0] + "</span><b>" + QS[day][1] + "</b></div>";
    } else {
      var ms = {}; Object.keys(o.st).forEach(function (id) { var s = o.st[id]; if (s && !s.del && s.dt) ms[s.dt.slice(0, 7)] = (ms[s.dt.slice(0, 7)] || 0) + 1; });
      var all = Object.keys(o.st).filter(function (id) { return o.st[id] && !o.st[id].del; }).length;
      h += '<div class="bnhead"><b>☕ 평소 벤치마킹</b> <small>쉬는 날 · 동네 · 다른 지역에서 본 가게 — 워크샵과 같은 7항목으로 매겨서 비교해요</small></div>';
      h += '<nav class="bntabs mon"><button type="button" class="bnmon" data-mon="all" aria-selected="' + (month === "all") + '"><b>전체</b><small>' + all + "곳</small></button>" + Object.keys(ms).sort().reverse().map(function (m) { return '<button type="button" class="bnmon" data-mon="' + m + '" aria-selected="' + (month === m) + '"><b>' + (+m.slice(5)) + "월</b><small>" + m.slice(0, 4) + " · " + ms[m] + "곳</small></button>"; }).join("") + "</nav>";
    }
    h += podium(o, R);
    if (!ids.length) h += '<p class="bnnone">' + (MODE === "ws" ? "아직 가게가 없습니다 · 워크샵 일정표에 ⭐를 붙이거나 아래 「＋ 가게 추가」로 넣어 주세요" : "아직 다녀온 가게가 없어요 · 아래에서 날짜 · 가게 이름을 넣고 「＋ 가게 추가」") + "</p>";
    h += ids.map(function (id) { return card(o, id, who); }).join("");
    h += MODE === "ws" ? '<div class="bnadd"><input type="text" id="bnNew" placeholder="가게 이름 (예: 개별 미션 — ○○카페)"><button type="button" class="skbtn prim" id="bnAddBtn">＋ ' + day + "일차에 가게 추가</button></div>"
      : '<div class="bnadd loc"><input type="date" id="bnDt" value="' + today() + '" aria-label="다녀온 날"><input type="text" id="bnNew" placeholder="가게 이름"><input type="text" id="bnArea" placeholder="지역 · 주소 (예: 해운대 · 서울 성수)"><button type="button" class="skbtn prim" id="bnAddBtn">＋ 가게 추가</button></div>';
    if (MODE === "ws") {
      var rf = o.rf["d" + day] || {}, myrf = (who && rf[who]) || {};
      h += '<div class="bnrf"><div class="bnrfh">📝 ' + esc(dayLabel(day)) + " 하루 정리 — " + QS[day][1] + "</div>" +
        (who ? '<textarea class="bnin bnrfin" rows="4" data-rf="d' + day + '" placeholder="오늘 본 것 중 좋았던 것 · 이유 · 카페스이에 적용할 것">' + esc(myrf.t || "") + "</textarea>" + (myrf.at ? '<small class="bnrfat">저장 ' + esc(myrf.at) + "</small>" : "") : "") +
        Object.keys(rf).filter(function (w) { return w !== who && rf[w] && rf[w].t; }).map(function (w) { return '<div class="bnnote" style="--c:' + hex(w) + '"><b>' + esc(nim(w)) + "</b><p>" + esc(rf[w].t).replace(/\n/g, "<br>") + "</p><small>" + esc(rf[w].at || "") + "</small></div>"; }).join("") + "</div>";
    }
    h += board(o);
    h += '<div class="bncopy"><button type="button" class="skbtn" id="bnCopy">📋 ' + (MODE === "ws" ? day + "일차" : "평소 벤치마킹") + ' 정리 복사</button><button type="button" class="skbtn tgbtn" data-tg="bn">📨 텔레그램으로 보내기</button><span id="bnCopyMsg"></span></div></div>';
    root.innerHTML = h;
    Array.prototype.forEach.call(root.querySelectorAll(".bncard[open] .bnfiles"), mountF);
    renderSum();
  }
  function mountF(el) { if (window.__CS_FILES && el) window.__CS_FILES.mount(el, { scope: fscope(), ref: el.dataset.fid, compact: true, title: "📎 사진 · 파일", cat0: "photo" }); }
  function renderSum() {   // 워크샵 탭 한눈에 — 날마다 가게 수 · 평가 수 · 1등 (워크샵 벤치마킹만)
    if (!sum) return; var o = loadK("cafesui.bench." + year());
    sum.innerHTML = '<div class="bnsumrow">' + [1, 2, 3].map(function (d) {
      var ids = Object.keys(o.st).filter(function (id) { return o.st[id] && o.st[id].d === d && !o.st[id].del; }), n = 0;
      ids.forEach(function (id) { n += Object.keys(o.ev[id] || {}).filter(function (w) { return total(o.ev[id][w]); }).length; });
      var r = rankOf(o, ids)[0];
      return '<div class="bnsumc"><b>' + esc(dayLabel(d)) + " · " + QS[d][0] + "</b><span>가게 " + ids.length + "곳 · 평가 " + n + "건</span>" + (r ? "<span>🏆 " + esc(o.st[r.id].n) + " <em>" + r.a.v.toFixed(1) + "</em></span>" : "<span class='none'>아직 평가 없음</span>") + "</div>";
    }).join("") + '</div><button type="button" class="skbtn prim" id="bnGo">🔎 벤치마킹 탭에서 평가 · 메모하기</button>';
    var go = document.getElementById("bnGo"); if (go) go.onclick = function () { MODE = "ws"; try { localStorage.setItem("cafesui.ui.bnmode", "ws"); } catch (e) {} var t = document.querySelector('.tab[data-p="tp17"]'); if (t) { t.click(); window.scrollTo(0, 0); } render(); };
  }
  window.__CS_BN_TEXT = function () { return copyText(load()); };   // 📨 텔레그램 (tg.js)
  function copyText(o) {
    var ids = stores(o), L = MODE === "ws" ? ["[카페스이 워크샵 벤치마킹] " + dayLabel(day), "❓ " + QS[day][1], ""] : ["[카페스이 평소 벤치마킹] " + (month === "all" ? "전체" : (+month.slice(5)) + "월"), ""];
    rankOf(o, ids).forEach(function (x, i) { L.push((i + 1) + ". " + o.st[x.id].n + (o.st[x.id].dt ? " (" + mdw(o.st[x.id].dt) + ")" : "") + " — 평균 " + x.a.v.toFixed(1) + "/70 (" + x.a.n + "명)"); });
    ids.forEach(function (id) {
      var ev = o.ev[id] || {}, ws = Object.keys(ev).filter(function (w) { return ev[w].take || ev[w].memo; }); if (!ws.length) return;
      L.push("", "▶ " + o.st[id].n);
      ws.forEach(function (w) { var e = ev[w]; L.push("- " + nim(w) + (e.take ? " ⭐ " + e.take : "") + (e.memo ? " / " + e.memo.replace(/\n/g, " ") : "")); });
    });
    if (MODE === "ws") { var rf = o.rf["d" + day] || {}, rw = Object.keys(rf).filter(function (w) { return rf[w] && rf[w].t; }); if (rw.length) { L.push("", "📝 하루 정리"); rw.forEach(function (w) { L.push("- " + nim(w) + ": " + rf[w].t.replace(/\n/g, " ")); }); } }
    var tk = takes(o).filter(function (x) { return x.s !== "done"; }); if (tk.length) { L.push("", "⭐ 가져올 것 (아직 적용 전)"); tk.forEach(function (x) { L.push("- " + x.t + " (" + nim(x.w) + " · " + x.n + ")"); }); }
    return L.join("\n");
  }
  function saveField(id, f, v) {
    var who = me(); if (!who) return;
    var o = load(); o.ev[id] = o.ev[id] || {}; var e = o.ev[id][who] = o.ev[id][who] || {};
    if (String(v).trim() === "") delete e[f]; else e[f] = v;
    e.at = stamp(); store(o); renderSum(); dirty = true;
    if (f === "take") { var bd = root.querySelector(".bnboard"); if (bd) bd.outerHTML = board(o); }
  }
  function saveRf(d, v) { var who = me(); if (!who) return; var o = load(); o.rf[d] = o.rf[d] || {}; if (String(v).trim() === "") delete o.rf[d][who]; else o.rf[d][who] = { t: v, at: stamp() }; store(o); }
  root.addEventListener("click", function (e) {
    var t = e.target;
    var mb = t.closest && t.closest("#bnMode [data-m]"); if (mb) { MODE = mb.dataset.m; try { localStorage.setItem("cafesui.ui.bnmode", MODE); } catch (x) {} openSet = {}; animAt = 0; render(); return; }
    var tab = t.closest && t.closest(".bntab"); if (tab) { day = +tab.dataset.d; animAt = 0; render(); return; }
    var mo = t.closest && t.closest(".bnmon"); if (mo) { month = mo.dataset.mon; animAt = 0; render(); return; }
    var ap = t.closest && t.closest("[data-ap]");
    if (ap) { var who0 = me(); if (!who0) { alert("먼저 이름을 골라 주세요 (누가 옮겼는지 남깁니다)"); return; } var o3 = load(); if (ap.dataset.s === "idea") delete o3.ap[ap.dataset.ap]; else o3.ap[ap.dataset.ap] = { s: ap.dataset.s, by: who0, at: stamp() }; store(o3); render(); return; }
    if (t.id === "bnAddBtn") {
      var inp = document.getElementById("bnNew"), n = (inp.value || "").trim(); if (!n) { inp.focus(); return; }
      var o = load(), mx = 0; Object.keys(o.st).forEach(function (id) { mx = Math.max(mx, o.st[id].o || 0); });
      var id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      o.st[id] = MODE === "ws" ? { d: day, n: n, o: mx + 1, by: me() || "" } : { dt: (document.getElementById("bnDt").value || today()), n: n, area: (document.getElementById("bnArea").value || "").trim(), o: mx + 1, by: me() || "" };
      if (MODE === "loc") month = "all";
      store(o); openSet[id] = 1; render(); return;
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
  root.addEventListener("toggle", function (e) { var d = e.target; if (d.classList && d.classList.contains("bncard")) { if (d.open) { openSet[d.dataset.id] = 1; mountF(d.querySelector(".bnfiles")); } else delete openSet[d.dataset.id]; } }, true);
  root.addEventListener("change", function (e) {
    var t = e.target; if (!t.classList.contains("bnin") || t.tagName !== "SELECT") return;
    saveField(t.dataset.id, t.dataset.f, t.value);
    var m = t.parentNode.querySelector(".bnmeter u"); if (m) m.style.width = (t.value ? t.value * 10 : 0) + "%";
    var card2 = t.closest(".bncard"), tot = card2 && card2.querySelector(".bntot b");
    if (tot) tot.textContent = (total((load().ev[t.dataset.id] || {})[me()]) || {}).t || 0;
  });
  root.addEventListener("input", function (e) {
    var t = e.target; if (!t.classList.contains("bnin") || t.tagName === "SELECT") return;
    var k = t.dataset.rf ? "rf|" + t.dataset.rf : t.dataset.id + "|" + t.dataset.f; clearTimeout(timers[k]);
    timers[k] = setTimeout(function () { delete timers[k]; if (t.dataset.rf) saveRf(t.dataset.rf, t.value); else saveField(t.dataset.id, t.dataset.f, t.value); }, 400);
  });
  root.addEventListener("keydown", function (e) { if ((e.target.id === "bnNew" || e.target.id === "bnArea") && e.key === "Enter") { e.preventDefault(); document.getElementById("bnAddBtn").click(); } });
  // 다른 기기 · 다른 직원이 적으면 — 쓰는 중이 아닐 때 다시 그린다
  root.addEventListener("focusout", function () { setTimeout(function () { if ((pendingRemote || dirty) && !root.contains(document.activeElement)) { pendingRemote = false; dirty = false; render(); } }, 50); });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || [];
    if (ks.indexOf("cafesui.bench." + year()) < 0 && ks.indexOf("cafesui.bench.local") < 0 && ks.indexOf("cafesui.ws." + year()) < 0) return;
    if (ks.indexOf("cafesui.bench." + year()) >= 0 || ks.indexOf("cafesui.ws." + year()) >= 0) renderSum();
    if (root.contains(document.activeElement)) pendingRemote = true; else render();
  });
  // 누가 어느 가게를 평가 중인지 — 접속 표시가 바뀌면 카드 머리만 다시
  window.addEventListener("cs:presence", function () {
    if (root.offsetParent === null) return;
    Array.prototype.forEach.call(root.querySelectorAll(".bncard"), function (c) {
      var sm = c.querySelector("summary"); if (!sm) return;
      Array.prototype.forEach.call(sm.querySelectorAll(".bnedit"), function (x) { x.remove(); });
      editingOf(c.dataset.id).forEach(function (x) { sm.insertAdjacentHTML("beforeend", '<span class="bnedit" style="--c:' + hex(x.who) + '">✏ ' + esc(nim(x.who)) + " 평가 중</span>"); });
    });
  });
  window.addEventListener("pagehide", function () {   // 창을 닫을 때 아직 안 넘긴 글자 저장
    Array.prototype.forEach.call(root.querySelectorAll("input.bnin, textarea.bnin"), function (t) {
      var k = t.dataset.rf ? "rf|" + t.dataset.rf : t.dataset.id + "|" + t.dataset.f;
      if (timers[k]) { clearTimeout(timers[k]); delete timers[k]; if (t.dataset.rf) saveRf(t.dataset.rf, t.value); else saveField(t.dataset.id, t.dataset.f, t.value); }
    });
  });
  if (yearEl) yearEl.addEventListener("change", function () { openSet = {}; setTimeout(render, 50); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".wpcard")) setTimeout(render, 150); });
  document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest('.tab[data-p="tp17"], .mbt[data-p="tp17"]')) { animAt = 0; setTimeout(render, 30); } });
  setTimeout(render, 0);
})();
