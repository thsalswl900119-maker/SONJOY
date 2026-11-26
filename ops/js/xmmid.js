/* 🔎 크리스마스 중간점검 참고자료 (11/26 · 사장님 「크리스마스 섹션에 중간점검 참고자료라는 부분 · 날짜별로 요약」)
   광고팀 · 크리스마스 전담팀이 보내는 중간점검 보고서를 요약해 서버 cafesui.xmas.mid 에 날짜별로 쌓는다(보기만).
   cafesui.xmas.mid = { r: { id: { y 해, d "YYYY-MM-DD", no 몇 번째, t 제목, from 보낸 팀, one 한 줄 결론,
                                  kpi [[이름, 큰 숫자, 작은 글]], sec [{ h 제목, tb {h:[머리], r:[[칸]]}, li:[줄], hl 강조 줄 번호 }],
                                  todo [사장님이 정할 것], note 확인 못 한 것, by, at, del } } }
   새 보고서는 Claude가 같은 모양으로 더한다(최신이 맨 위 · 최신만 펼침). 화면에서 고치지 않음. */
(function () {
  var K = "cafesui.xmas.mid";
  function J() { try { return JSON.parse(localStorage.getItem(K) || "null") || {}; } catch (e) { return {}; } }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  // **굵게** · ==형광== 만 허용
  function fm(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/==(.+?)==/g, "<mark>$1</mark>"); }
  function wd(d) { var t = new Date(d + "T00:00:00"); return isNaN(t) ? "" : "일월화수목금토"[t.getDay()]; }
  function md(d) { var p = String(d).split("-"); return p.length === 3 ? (+p[1]) + "/" + (+p[2]) + "(" + wd(d) + ")" : d; }
  function list(y) {
    var r = (J().r) || {};
    return Object.keys(r).map(function (id) { var x = r[id]; x.id = id; return x; })
      .filter(function (x) { return x && !x.del && (!y || String(x.y || String(x.d).slice(0, 4)) === String(y)); })
      .sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : (b.no || 0) - (a.no || 0); });
  }
  function table(tb) {
    if (!tb || !tb.r || !tb.r.length) return "";
    var h = '<div class="xmdtw"><table class="xmdt"><thead><tr>' + (tb.h || []).map(function (c) { return "<th>" + fm(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
    tb.r.forEach(function (row) { var sum = /합계/.test(row[0] || ""); h += "<tr" + (sum ? ' class="sum"' : "") + ">" + row.map(function (c, i) { return (i ? "<td>" : "<th>") + fm(c) + (i ? "</td>" : "</th>"); }).join("") + "</tr>"; });
    return h + "</tbody></table></div>";
  }
  function card(x, open) {
    var h = '<details class="xmdr"' + (open ? " open" : "") + ' data-id="' + esc(x.id) + '"><summary><span class="xmdno">' + esc(x.no ? "중간점검 " + "①②③④⑤⑥⑦⑧⑨⑩"[x.no - 1] : "중간점검") + "</span>"
      + '<b class="xmdd">' + esc(md(x.d)) + "</b>" + (x.from ? '<span class="xmdfrom">' + esc(x.from) + "</span>" : "")
      + '<span class="xmdone">' + fm(x.one || "") + "</span></summary><div class=\"xmdb\">";
    if (x.kpi && x.kpi.length) h += '<div class="xmdk">' + x.kpi.map(function (k) { return '<div class="xmdkc' + (k[3] ? " " + esc(k[3]) : "") + '"><span>' + fm(k[0]) + "</span><b>" + fm(k[1]) + "</b><small>" + fm(k[2] || "") + "</small></div>"; }).join("") + "</div>";
    (x.sec || []).forEach(function (s) {
      h += '<section class="xmds"><h4>' + fm(s.h) + "</h4>" + table(s.tb);
      if (s.li && s.li.length) h += "<ul>" + s.li.map(function (l) { return "<li>" + fm(l) + "</li>"; }).join("") + "</ul>";
      h += "</section>";
    });
    if (x.todo && x.todo.length) h += '<section class="xmds xmdtodo"><h4>👑 사장님이 정할 것</h4><ol>' + x.todo.map(function (l) { return "<li>" + fm(l) + "</li>"; }).join("") + "</ol></section>";
    if (x.note) h += '<p class="xmdnote">' + fm(x.note) + "</p>";
    return h + "</div></details>";
  }
  window.__CS_XMMID_N = function (y) { return list(y).length; };
  window.__CS_XMMID = function (el, y) {
    if (!el) return;
    var L = list(y), opened = {};
    Array.prototype.forEach.call(el.querySelectorAll("details.xmdr"), function (d) { opened[d.dataset.id] = d.open; });
    var h = '<div class="xmdhead"><h3>🔎 중간점검 참고자료 <small>' + esc(y) + "년 · " + L.length + "개 · 최신이 맨 위</small></h3>"
      + '<p>광고팀 · 크리스마스 전담팀이 <b>매주 한 번</b> 보내는 중간점검 보고서를 날짜별로 쌓아 두는 곳입니다(새 보고서가 맨 위 · 예전 것은 접혀서 아래). 보고서마다 시스템팀이 발주량을 다시 계산해 <b>발주 · 로스가 최대한 없게</b> 맞춥니다. 숫자는 보고서에 적힌 그대로 · <b>정할 것은 사장님이 정하신 뒤 생산 계획 · 재료 표에 옮깁니다</b>(여기 숫자가 계획을 바꾸지 않음).</p><p class="xmdgoal">🎯 <b>목적(사장님 11/26):</b> 돈이 새지 않고 · 제품 로스가 없고 · 쓸데없는 일을 덜 하고 · 퀄리티는 지키기</p></div>';
    if (L.length) h += '<div class="xmdidx"><span>📅 날짜별 (매주 쌓임)</span>' + L.map(function (x) { return '<button type="button" class="xmdgo" data-id="' + esc(x.id) + '">' + esc(md(x.d)) + (x.no ? " · " + "①②③④⑤⑥⑦⑧⑨⑩"[x.no - 1] : "") + "</button>"; }).join("") + '<button type="button" class="xmdall">모두 펼치기 / 접기</button></div>';
    if (!L.length) h += '<p class="xmdempty">아직 ' + esc(y) + "년 중간점검 보고서가 없어요.</p>";
    L.forEach(function (x, i) { h += card(x, x.id in opened ? opened[x.id] : i === 0); });
    el.innerHTML = h;
    if (!el.__mdb) { el.__mdb = 1; el.addEventListener("click", function (e) {
      var g = e.target.closest(".xmdgo"); if (g) { var d = el.querySelector('details.xmdr[data-id="' + g.dataset.id + '"]'); if (d) { d.open = true; d.scrollIntoView({ block: "start", behavior: "smooth" }); } return; }
      if (e.target.closest(".xmdall")) { var ds = el.querySelectorAll("details.xmdr"), any = Array.prototype.some.call(ds, function (d) { return !d.open; }); Array.prototype.forEach.call(ds, function (d) { d.open = any; }); }
    }); }
  };
})();
