// 일지 한 달치 모으기 — 월말회의 탭에서 그 달 일지를 한 글로 모아 복사한다 (Claude에게 붙여 넣으면 월말회의 칸을 채워 준다)
(function () {
  var NL = String.fromCharCode(10), WD = ["일", "월", "화", "수", "목", "금", "토"];
  function J(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } }
  function num(v) { var n = parseInt(String(v || "").split("(")[0].replace(/[^0-9]/g, ""), 10); return isNaN(n) ? null : n; }
  // 일지 칸 이름 — 일지 화면 순서대로, 매출 · 배달 · 폐기를 맨 앞에
  function fields() {
    var out = [], seen = {};
    document.querySelectorAll('#tp4 .lgin[data-k]').forEach(function (el) {
      var k = el.dataset.k; if (seen[k]) return; seen[k] = 1;
      var t = (el.getAttribute("aria-label") || "").replace(/<[^>]*>.*$/, "").trim();
      if (!t) { var sp = el.closest("label, .mrow2"); sp = sp && sp.querySelector("span"); t = sp ? sp.firstChild.textContent.trim() : k; }
      out.push([k, t]);
    });
    var FIRST = ["lf183", "lf184", "lf162", "lf163"];
    return FIRST.map(function (k) { return out.filter(function (x) { return x[0] === k; })[0]; }).filter(Boolean)
      .concat(out.filter(function (x) { return FIRST.indexOf(x[0]) < 0; }));
  }
  function build(ym) {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("cafesui.log." + ym + "-") === 0) keys.push(k); }
    keys.sort();
    var F = fields(), days = [], tot = 0, sd = 0, miss = [], sums = { lf101: 0, lf102: 0, lf104: 0, lf105: 0, lf106: 0 };
    keys.forEach(function (k) {
      var o = J(k) || {}, f = o.f || {}, d = k.slice(12), p = d.split("-"), dt = new Date(+p[0], +p[1] - 1, +p[2]);
      var lines = [];
      F.forEach(function (x) {
        var v = String(f[x[0]] || "").trim(); if (!v) return;
        var vs = v.split(NL).map(function (s) { return s.trim(); }).filter(Boolean);
        lines.push("■ " + x[1] + ": " + (vs.length > 1 ? NL + vs.map(function (s) { return "   " + s; }).join(NL) : vs[0]));
      });
      if (!lines.length) return;
      var s = num(f.lf183); if (s && s > 10000) { tot += s; sd++; } else miss.push((+p[1]) + "/" + (+p[2]));
      Object.keys(sums).forEach(function (kk) { var n = num(f[kk]); if (n) sums[kk] += n; });
      days.push("===== " + (+p[1]) + "/" + (+p[2]) + " (" + WD[dt.getDay()] + ")" + (o.who ? " · " + o.who : "") + " =====" + NL + lines.join(NL));
    });
    if (!days.length) return "";
    var mm = +ym.slice(5);
    var head = [
      "[카페스이 일지 한 달 모음] " + ym.slice(0, 4) + "년 " + mm + "월",
      "일지 " + days.length + "일 · 매출 적힌 날 " + sd + "일" + (miss.length ? " · 매출 안 적힌 날: " + miss.join(", ") : ""),
      "매출 합계 " + tot.toLocaleString("ko-KR") + "원" + (sd ? " · 일 평균 " + Math.round(tot / sd).toLocaleString("ko-KR") + "원" : ""),
      "에그타르트 " + sums.lf101 + " · 홀케이크 " + sums.lf102 + " · 별조각 " + sums.lf104 + " · 빙수 " + sums.lf105 + " · 선물세트 " + sums.lf106,
      "→ 이 글을 Claude에게 붙여 넣고 「월말회의 채워줘」라고 하면 월말회의 칸을 채웁니다 (빈 칸만)"
    ];
    return head.join(NL) + NL + NL + days.join(NL + NL);
  }
  // 월말회의 탭(해당 월)과 일지 탭(지금 보는 날짜의 달) 두 곳에서 쓴다
  function bind(btnId, msgId, boxId, monthOf) {
    var btn = document.getElementById(btnId), msg = document.getElementById(msgId), box = document.getElementById(boxId);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var ym = monthOf() || (function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); })();
      var t = build(ym);
      if (!t) { msg.textContent = ym + " 일지가 없습니다"; box.hidden = true; return; }
      box.value = t; box.hidden = false;
      var n = (t.match(/^===== /gm) || []).length;
      var ok = function () { msg.textContent = (+ym.slice(5)) + "월 일지 " + n + "일치를 복사했습니다 · Claude에게 붙여 넣으세요"; };
      var fb = function () { box.focus(); box.select(); try { document.execCommand("copy"); ok(); } catch (e) { msg.textContent = "아래 글을 길게 눌러 전체 선택 → 복사하세요"; } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    });
  }
  bind("mtCollect", "mtCollectMsg", "mtCollectBox", function () { var e = document.getElementById("mtMonth"); return e && e.value; });
  bind("lgCollect", "lgCollectMsg", "lgCollectBox", function () { var e = document.getElementById("lgDate"); return e && e.value ? e.value.slice(0, 7) : ""; });
})();
