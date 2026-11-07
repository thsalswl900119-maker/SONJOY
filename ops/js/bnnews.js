// 📰 벤치마킹 카드뉴스 · 블로그 (11/4 사장님 「벤치마킹도 입력하면 완전 가독성 있는 카드뉴스로 · 블로그도 쓸 거라 있어 보이게」)
// 자료는 bench.js 의 window.__CS_BN_DATA() (지금 고른 일차 · 달) — 여기서는 보이는 모양만 만든다(저장 없음 · 표지 제목만 bench 문서 nw 에).
// 카드 한 장 = 540×675 (4:5) · 저장할 때 2배 → 1080×1350 PNG (인스타 · 블로그 그대로) · html2canvas(js/vendor) 처음 쓸 때만 불러옴.
(function () {
  var W = 540, H = 675, full = {}, phPick = {};
  try { phPick = JSON.parse(localStorage.getItem("cafesui.ui.bnnph") || "{}") || {}; } catch (e) {}
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function cut(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s·,]+$/, "") + "…" : s; }
  function nim(n) { return n === "사장님" ? n : n + "님"; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function f1(v) { return v == null ? "—" : (Math.round(v * 10) / 10).toFixed(1); }
  function starTxt(v) { var h = ""; for (var i = 1; i <= 5; i++) h += '<i class="' + (v != null && v >= i - 0.25 ? "on" : v != null && v >= i - 0.75 ? "half" : "") + '">★</i>'; return h; }
  function pick(key, ph) { if (!ph || !ph.length) return null; var i = phPick[key] || 0; return ph[i % ph.length]; }
  function imgTag(f, cls) {
    if (!f) return "";
    var src = full[f._id] || (window.__CS_FILES && window.__CS_FILES.thumbOf(f._id, f)) || "";
    return '<img class="' + cls + '" data-full="' + f._id + '" data-thid="' + f._id + '"' + (src ? ' src="' + src + '"' : "") + ' alt="">';
  }
  function bestWorst(items) {
    var L = items.filter(function (x) { return x[1] != null; }).slice().sort(function (a, b) { return b[1] - a[1]; });
    return L.length ? { hi: L[0], lo: L.length > 1 ? L[L.length - 1] : null } : null;
  }
  function itemTop(R) {   // 항목별 1등 가게 (순위 카드 빈 곳)
    var it = (R[0] && R[0].items) || []; if (!it.length) return "";
    return '<div class="nwit"><b>항목별 1등</b><div>' + it.map(function (x, k) { var best = null; R.forEach(function (s) { var v = s.items[k][1]; if (v != null && (!best || v > best.v)) best = { n: s.n, v: v }; }); return best ? "<span><em>" + esc(x[0].split(" · ")[0]) + "</em>" + esc(cut(best.n, 10)) + " <i>" + f1(best.v) + "</i></span>" : ""; }).join("") + "</div></div>";
  }
  // ── 카드 만들기
  function slides(D) {
    var S = [], tag = D.mode === "ws" ? "DAY " + D.day + (D.q ? " · " + D.q[0] : "") : "CAFE TRIP · " + D.label;
    var evS = D.stores.filter(function (s) { return s.avg != null || s.memos.length || s.takes.length || s.reps.length || s.ph.length; });
    var evO = D.om.filter(function (s) { return s.avg != null || s.cs.length || s.memos.length || s.ph.length; });
    var ranked = D.stores.filter(function (s) { return s.avg != null; }).sort(function (a, b) { return b.avg - a.avg; });
    var coverPh = null; (evS.concat(evO)).some(function (s) { if (s.ph.length) { coverPh = s.ph; return true; } return false; });
    if (!coverPh && D.rvph && D.rvph.length) coverPh = D.rvph;
    var title = D.cover.tt || ((D.place || (D.mode === "ws" ? D.year + " 워크샵" : "카페 탐방")) + (D.mode === "ws" ? "에서 배운 것" : " 벤치마킹"));
    var sub = D.cover.sub || (D.q ? "“" + D.q[1] + "”" : "같은 7가지 기준으로 직원이 함께 매긴 카페 노트");
    S.push({ k: "cover", ph: coverPh, h: function (n, t, f) {
      return '<div class="nwsl cover' + (f ? " hasph" : "") + '">' + (f ? imgTag(f, "nwbg") + '<div class="nwshade"></div>' : '<div class="nwpat"></div>') +
        '<div class="nwtop"><span class="nwbrand">CAFE SUI</span><span class="nwkick">BENCHMARKING NOTE · ' + esc(D.year) + "</span></div>" +
        '<div class="nwcv"><span class="nwpill">' + esc(tag) + "</span><h1>" + esc(cut(title, 34)) + '</h1><p class="nwsub">' + esc(cut(sub, 70)) + "</p>" +
        '<div class="nwfacts">' + (D.dateStr ? "<span>📅 " + esc(D.dateStr) + "</span>" : "") + "<span>🏪 가게 " + D.stores.length + "곳</span>" + (D.om.length ? "<span>🍰 디저트 · 기념품 " + D.om.length + "개</span>" : "") + (D.people.length ? "<span>👥 함께 본 사람 " + D.people.length + "명</span>" : "") + "</div></div>" +
        '<div class="nwfoot light"><span>부산 명지 디저트 카페 · 카페스이</span><span>' + pad(n) + " / " + pad(t) + "</span></div></div>";
    } });
    if (ranked.length >= 2) S.push({ k: "rank", h: function (n, t) {
      var top = ranked[0].avg || 70;
      return '<div class="nwsl rank"><div class="nwhd"><span class="nwkick dark">RANKING · ' + esc(tag) + '</span><h2>오늘의 순위</h2><p>직원 ' + D.people.length + "명이 7가지 기준으로 10점씩 · 70점 만점</p></div>" +
        '<ol class="nwrk">' + ranked.slice(0, 6).map(function (s, i) { return '<li class="r' + (i + 1) + '"><em>' + (i + 1) + '</em><div><b>' + esc(cut(s.n, 22)) + "</b><small>" + esc(cut([s.t, s.area].filter(Boolean).join(" · "), 26)) + '</small><i><u style="width:' + Math.max(6, s.avg / 70 * 100).toFixed(1) + '%"></u></i></div><strong>' + f1(s.avg) + "<small>/70</small></strong></li>"; }).join("") + "</ol>" +
        (ranked.length <= 4 ? itemTop(ranked) : "") +
        (ranked[0] ? '<p class="nwrkq">🏆 1위 <b>' + esc(ranked[0].n) + "</b>" + (bestWorst(ranked[0].items) ? " — " + esc(bestWorst(ranked[0].items).hi[0]) + " " + f1(bestWorst(ranked[0].items).hi[1]) + "점이 가장 높았어요" : "") + "</p>" : "") +
        '<div class="nwfoot"><span>CAFE SUI · BENCHMARKING</span><span>' + pad(n) + " / " + pad(t) + "</span></div></div>";
    } });
    evS.forEach(function (s, i) {
      var key = "s:" + D.key + ":" + s.id;
      S.push({ k: key, ph: s.ph, h: function (n, t, f) {
        var bw = bestWorst(s.items), q = s.memos[0], tk = s.takes.slice(0, 2), rk = ranked.indexOf(s);
        var load = (s.avg != null ? 2.4 : 0) + (s.reps[0] ? 0.6 : 0) + (q ? (q.t.length > 40 ? 2 : 1.4) : 0) + tk.length * 0.9 + (tk.length ? 0.6 : 0);
        var ph = load <= 4.2 ? 300 : load <= 5.6 ? 250 : 200, qn = load > 5.6 ? 60 : 78;
        return '<div class="nwsl shop">' + '<div class="nwph" style="height:' + ph + 'px">' + (f ? imgTag(f, "nwimg") : '<div class="nwnoph"><span>' + esc((s.n || "?").slice(0, 1)) + "</span></div>") +
          '<span class="nwno">' + pad(i + 1) + "</span>" + (rk >= 0 && rk < 3 ? '<span class="nwmedal">' + ["🥇 1위", "🥈 2위", "🥉 3위"][rk] + "</span>" : "") + "</div>" +
          '<div class="nwbd"><div class="nwrow"><div class="nwnm"><span class="nwkick dark">' + esc(cut([s.t, s.area || (s.dt ? s.dt.slice(5).replace("-", "/") : "")].filter(Boolean).join(" · ") || tag, 30)) + "</span><h3>" + esc(cut(s.n, 24)) + "</h3></div>" +
          (s.avg != null ? '<div class="nwsc"><b>' + f1(s.avg) + "</b><small>/70 · " + s.cnt + "명</small></div>" : "") + "</div>" +
          (s.avg != null ? '<div class="nwbars">' + s.items.map(function (x) { return '<div class="' + (bw && x === bw.hi ? "hi" : "") + '"><span>' + esc(x[0].split(" · ")[0]) + '</span><i><u style="width:' + (x[1] == null ? 0 : x[1] * 10) + '%"></u></i><b>' + f1(x[1]) + "</b></div>"; }).join("") + "</div>" : "") +
          (s.reps[0] ? '<p class="nwrep">🍰 ' + esc(cut(s.reps[0].t, 40)) + "</p>" : "") +
          (q ? '<blockquote style="--c:' + q.c + '">' + esc(cut(q.t, s.avg != null ? qn : 160)) + "<cite>— " + esc(nim(q.w)) + "</cite></blockquote>" : "") +
          (tk.length ? '<div class="nwtk"><b>⭐ 카페스이에 가져올 것</b>' + tk.map(function (x) { return "<p>" + esc(cut(x.t, 46)) + "</p>"; }).join("") + "</div>" : "") +
          '</div><div class="nwfoot"><span>CAFE SUI · ' + esc(tag) + "</span><span>" + pad(n) + " / " + pad(t) + "</span></div></div>";
      } });
    });
    evO.forEach(function (s, i) {
      var key = "o:" + D.key + ":" + s.id;
      S.push({ k: key, ph: s.ph, h: function (n, t, f) {
        var facts = [s.sh && "🏪 " + s.sh, s.p && "💴 1개 " + s.p, s.life && "📅 " + s.life, s.temp && "🌡 " + s.temp].filter(Boolean);
        return '<div class="nwsl om"><div class="nwomtop">' + '<div class="nwomph">' + (f ? imgTag(f, "nwimg") : '<div class="nwnoph sm"><span>🍰</span></div>') + "</div>" +
          '<div class="nwomhd"><span class="nwkick dark">DESSERT · OMIYAGE ' + pad(i + 1) + "</span>" + (s.kd ? '<span class="nwkd' + (s.kd === "생과자" ? " fresh" : "") + '">' + esc(s.kd) + "</span>" : "") + "<h3>" + esc(cut(s.n, 26)) + "</h3>" +
          (s.avg != null ? '<div class="nwomsc"><span class="nwstars">' + starTxt(s.avg) + "</span><b>" + f1(s.avg) + "</b><small>/5 · " + s.cnt + "명</small></div>" : "") +
          '<div class="nwomf">' + facts.map(function (x) { return "<span>" + esc(cut(x, 26)) + "</span>"; }).join("") + "</div></div></div>" +
          (s.avg != null ? '<div class="nwomrows">' + s.items.map(function (x, k) { return "<div><em>" + (k + 1) + "</em><span>" + esc(x[0]) + '</span><span class="nwstars">' + starTxt(x[1]) + "</span></div>"; }).join("") + "</div>" : "") +
          (s.cs.length ? '<div class="nwcs"><b>✨ 카페스이라면 이렇게</b>' + s.cs.slice(0, 2).map(function (x) { return '<p style="--c:' + x.c + '">' + esc(cut(x.t, 54)) + "<cite>" + esc(nim(x.w)) + "</cite></p>"; }).join("") + "</div>" :
            s.memos[0] ? '<blockquote style="--c:' + s.memos[0].c + '">' + esc(cut(s.memos[0].t, 90)) + "<cite>— " + esc(nim(s.memos[0].w)) + "</cite></blockquote>" : "") +
          '<div class="nwfoot"><span>CAFE SUI · ' + esc(tag) + "</span><span>" + pad(n) + " / " + pad(t) + "</span></div></div>";
      } });
    });
    // 11/7 디저트 품목 사진 — 한 장에 4장씩 (사진 메모 = 이름 · 가게 · 가격)
    var RP = D.rvph || [];
    for (var pi = 0; pi < Math.min(RP.length, 12); pi += 4) (function (grp, no) {
      S.push({ k: "dph" + no, h: function (n, t) {
        return '<div class="nwsl dph"><div class="nwhd"><span class="nwkick dark">DESSERT · ' + esc(tag) + '</span><h2>오늘 먹어 본 디저트' + (RP.length > 4 ? " " + (no + 1) : "") + '</h2><p>사진 아래 한 줄 = 이름 · 가게 · 가격</p></div>' +
          '<div class="nwdph n' + grp.length + '">' + grp.map(function (f) { return '<figure><div class="nwdpi">' + imgTag(f, "nwimg") + "</div><figcaption>" + esc(cut(f.m || "", 34)) + "<small>" + esc(nim(f.by)) + "</small></figcaption></figure>"; }).join("") + "</div>" +
          '<div class="nwfoot"><span>CAFE SUI · BENCHMARKING</span><span>' + pad(n) + " / " + pad(t) + "</span></div></div>";
      } });
    })(RP.slice(pi, pi + 4), pi / 4);
    if (D.rv && D.rv.length) S.push({ k: "rv", h: function (n, t) {
      return '<div class="nwsl rv"><div class="nwhd"><span class="nwkick dark">DESSERT REVIEW · ' + esc(tag) + '</span><h2>다 같이 펼쳐 놓고, 디저트 리뷰</h2><p>각자 고른 BEST · 별로였던 것 · 카페스이에 가져올 것</p></div>' +
        '<div class="nwrv n' + Math.min(4, D.rv.length) + '">' + D.rv.slice(0, 4).map(function (r) { return '<div style="--c:' + r.c + '"><b>' + esc(nim(r.w)) + "</b>" + (r.best ? '<p><i>⭐</i>' + esc(cut(r.best, 40)) + "</p>" : "") + (r.worst ? '<p><i>👎</i>' + esc(cut(r.worst, 34)) + "</p>" : "") + (r.apply ? '<p class="ap"><i>✨</i>' + esc(cut(r.apply, 40)) + "</p>" : "") + "</div>"; }).join("") + "</div>" +
        '<div class="nwfoot"><span>CAFE SUI · BENCHMARKING</span><span>' + pad(n) + " / " + pad(t) + "</span></div></div>";
    } });
    var TK = D.takes.filter(function (x) { return x.t; });
    if (TK.length || D.rf.length) S.push({ k: "end", h: function (n, t) {
      return '<div class="nwsl end"><div class="nwpat"></div><div class="nwtop"><span class="nwbrand">CAFE SUI</span><span class="nwkick">TAKEAWAYS · ' + esc(tag) + "</span></div>" +
        '<h2>카페스이에<br>가져올 것</h2>' + (TK.length ? '<ul class="nwck">' + TK.slice(0, 6).map(function (x) { return '<li><i>' + (x.s === "done" ? "✓" : x.s === "try" ? "◐" : "○") + "</i><span>" + esc(cut(x.t, 40)) + "<small>" + esc(cut(x.n, 16)) + " · " + esc(nim(x.w)) + "</small></span></li>"; }).join("") + "</ul>" : "") +
        (D.rf[0] ? '<blockquote class="lt" style="--c:#E0A458">' + esc(cut(D.rf[0].t, TK.length ? 80 : 220)) + "<cite>— " + esc(nim(D.rf[0].w)) + " · 하루 정리</cite></blockquote>" : "") +
        '<div class="nwfoot light"><span>부산 명지 · 카페스이 CAFE SUI</span><span>' + pad(n) + " / " + pad(t) + "</span></div></div>";
    } });
    return S;
  }
  // ── 블로그 초안 (글 + [사진 N] 자리)
  function blog(D, S) {
    var L = [], no = function (k) { for (var i = 0; i < S.length; i++) if (S[i].k === k) return i + 1; return 0; };
    var title = D.cover.tt || ((D.place || "카페") + " 벤치마킹" + (D.mode === "ws" ? " " + D.day + "일차" : ""));
    L.push("[제목] " + title + (D.q ? " — " + D.q[0] : ""), "");
    L.push("[사진 " + pad(1) + " · 표지 카드]", "");
    L.push("부산 명지에서 디저트 카페를 하는 카페스이 팀이 " + (D.place ? D.place + "에 다녀왔어요." : "다른 가게를 보고 왔어요."));
    if (D.q) L.push("오늘의 질문은 「" + D.q[1] + "」였습니다.");
    L.push("가게마다 파사드 · 향 · 음악 · 메뉴 · 가격 · 플레이팅 · 재미 7가지를 직원" + (D.people.length ? " " + D.people.length + "명이" : "들이") + " 각자 10점씩 매겼어요.", "");
    var R = D.stores.filter(function (s) { return s.avg != null; }).sort(function (a, b) { return b.avg - a.avg; });
    if (R.length) { L.push("■ 오늘의 순위"); if (no("rank")) L.push("[사진 " + pad(no("rank")) + " · 순위 카드]"); R.forEach(function (s, i) { L.push((i + 1) + ". " + s.n + " — " + f1(s.avg) + "점 / 70"); }); L.push(""); }
    D.stores.forEach(function (s, i) {
      var k = no("s:" + D.key + ":" + s.id); if (!k && s.avg == null) return;
      L.push("■ " + pad(i + 1) + ". " + s.n + ([s.t, s.area].filter(Boolean).length ? " (" + [s.t, s.area].filter(Boolean).join(" · ") + ")" : ""));
      if (k) L.push("[사진 " + pad(k) + " · " + s.n + " 카드] + 가게 사진");
      if (s.avg != null) { var bw = bestWorst(s.items); L.push("· 함께 매긴 점수: " + f1(s.avg) + " / 70 (" + s.cnt + "명)"); if (bw) L.push("· 가장 좋았던 점: " + bw.hi[0] + " " + f1(bw.hi[1]) + "점" + (bw.lo ? " / 아쉬웠던 점: " + bw.lo[0] + " " + f1(bw.lo[1]) + "점" : "")); }
      s.reps.forEach(function (x) { L.push("· 대표 제품: " + x.t); });
      s.memos.forEach(function (x) { L.push("· " + nim(x.w) + " 한마디: “" + x.t.replace(/\n+/g, " ") + "”"); });
      s.takes.forEach(function (x) { L.push("· 카페스이에 가져올 것: " + x.t); });
      L.push("");
    });
    if (D.om.length) {
      L.push("■ 디저트 · 기념품 리뷰");
      D.om.forEach(function (s) {
        var k = no("o:" + D.key + ":" + s.id); L.push("▶ " + s.n + (s.kd ? " (" + s.kd + ")" : "")); if (k) L.push("[사진 " + pad(k) + " · " + s.n + " 카드]");
        var f = [s.sh && "산 곳 " + s.sh, s.p && "1개 " + s.p, s.life && "유통기한 " + s.life, s.temp && s.temp + " 보관"].filter(Boolean); if (f.length) L.push("· " + f.join(" · "));
        if (s.avg != null) L.push("· 별점 " + f1(s.avg) + " / 5 — " + s.items.map(function (x) { return x[0].split(" · ")[0] + " " + f1(x[1]); }).join(" · "));
        s.cs.forEach(function (x) { L.push("· 카페스이라면: " + x.t + " (" + nim(x.w) + ")"); });
        s.memos.forEach(function (x) { L.push("· " + nim(x.w) + ": " + x.t.replace(/\n+/g, " ")); });
      });
      L.push("");
    }
    if (D.rvph && D.rvph.length) { L.push("■ 오늘 먹어 본 디저트"); S.forEach(function (s, i) { if (/^dph/.test(s.k)) L.push("[사진 " + pad(i + 1) + " · 디저트 사진 카드]"); }); D.rvph.forEach(function (f) { if (f.m) L.push("· " + f.m); }); L.push(""); }
    if (D.rv && D.rv.length) { L.push("■ 다 같이 펼쳐 놓고, 디저트 리뷰"); if (no("rv")) L.push("[사진 " + pad(no("rv")) + " · 디저트 리뷰 카드]"); D.rv.forEach(function (r) { L.push("· " + nim(r.w) + (r.best ? " ⭐ " + r.best : "") + (r.worst ? " / 👎 " + r.worst : "") + (r.apply ? " / ✨ " + r.apply : "")); }); L.push(""); }
    var TK = D.takes.filter(function (x) { return x.t; });
    if (TK.length || D.rf.length) { L.push("■ 카페스이에 가져올 것"); if (no("end")) L.push("[사진 " + pad(no("end")) + " · 마무리 카드]"); TK.forEach(function (x) { L.push("✔ " + x.t); }); D.rf.forEach(function (x) { L.push("“" + x.t.replace(/\n+/g, " ") + "” — " + nim(x.w)); }); L.push(""); }
    L.push("따라 만들기보다, 좋은 가게의 구조를 빌려 카페스이다운 방식으로 바꿔 보려고 해요.", "부산 명지 디저트 카페, 카페스이였습니다.", "");
    L.push("#카페스이 #부산디저트카페 #명지카페 #명지디저트 #카페벤치마킹 #디저트카페" + (D.place ? " #" + D.place.replace(/\s+/g, "") + "카페 #" + D.place.replace(/\s+/g, "") + "디저트" : ""));
    return L.join("\n");
  }
  // ── 그림 저장 (html2canvas)
  function h2c() {
    if (window.html2canvas) return Promise.resolve();
    return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = "js/vendor/html2canvas.min.js"; s.onload = function () { ok(); }; s.onerror = function () { no(new Error("그림 도구를 못 불러왔어요")); }; document.head.appendChild(s); });
  }
  function loadFull(D, el) {   // 카드 안 사진을 원본 크기로 바꿔 끼움
    var F = window.__CS_FILES; if (!F) return Promise.resolve();
    var all = {}; D.stores.concat(D.om).forEach(function (s) { s.ph.forEach(function (f) { all[f._id] = f; }); }); (D.rvph || []).forEach(function (f) { all[f._id] = f; });
    var ps = Array.prototype.map.call(el.querySelectorAll("img[data-full]"), function (im) {
      var id = im.dataset.full, f = all[id]; if (!f) return null;
      if (full[id]) { if (im.getAttribute("src") !== full[id]) im.src = full[id]; return null; }
      return F.getData(id, f).then(function (u) { full[id] = u; Array.prototype.forEach.call(document.querySelectorAll('img[data-full="' + id + '"]'), function (x) { x.src = u; }); }, function () {});
    });
    return Promise.all(ps.filter(Boolean));
  }
  function shoot(node) {
    var hold = document.createElement("div"); hold.className = "nwhold"; var c = node.cloneNode(true); hold.appendChild(c); document.body.appendChild(hold);
    var wait = Array.prototype.map.call(c.querySelectorAll("img"), function (im) { return im.complete ? null : new Promise(function (ok) { im.onload = im.onerror = ok; }); }).filter(Boolean);
    return Promise.all(wait).then(function () { return document.fonts && document.fonts.ready; }).then(function () {
      return window.html2canvas(c, { scale: 2, backgroundColor: "#FBF8F2", useCORS: true, logging: false, width: W, height: H, windowWidth: 1200 });
    }).then(function (cv) { hold.remove(); return new Promise(function (ok) { cv.toBlob(function (b) { ok(b); }, "image/png"); }); }, function (e) { hold.remove(); throw e; });
  }
  function fname(D, i) { return "카페스이_벤치마킹_" + (D.mode === "ws" ? D.year + "_" + D.day + "일차" : D.label) + "_" + pad(i + 1) + ".png"; }
  function dl(b, name) { var a = document.createElement("a"), u = URL.createObjectURL(b); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 1500); }
  function toast(t) { try { if (window.__CS_TOAST) window.__CS_TOAST(t); } catch (e) {} }
  function copy(t) { var ok = function () { toast("복사했어요 · 블로그 글쓰기에 붙여 넣으세요"); }; try { navigator.clipboard.writeText(t).then(ok, function () { prompt("복사해서 쓰세요", t); }); } catch (e) { prompt("복사해서 쓰세요", t); } }
  // ── 화면
  function scaleAll(el) { Array.prototype.forEach.call(el.querySelectorAll(".nwfr"), function (fr) { var w = fr.clientWidth; if (w) fr.style.setProperty("--s", (w / W).toFixed(4)); }); }
  window.__CS_BN_NEWS = function (el) {
    var D = window.__CS_BN_DATA && window.__CS_BN_DATA(); if (!D) return;
    var S = slides(D), only = S.length <= 1 && !D.stores.some(function (s) { return s.avg != null; }) && !D.om.some(function (s) { return s.avg != null; });
    var h = '<div class="nwbar"><div class="nwbart"><b>📰 카드뉴스 · 블로그</b><small>가게 평가 · 디저트 리뷰에 적은 대로 저절로 정리돼요 · 한 장 1080×1350 (인스타 · 블로그 그대로) · 사진은 카드 안 「📸 사진」에 올린 것</small></div>' +
      '<div class="nwcvin"><label><span>표지 제목</span><input type="text" class="nwcvi" data-f="tt" value="' + esc(D.cover.tt || "") + '" placeholder="' + esc((D.place || "후쿠오카") + "에서 배운 것") + '" maxlength="34"></label>' +
      '<label><span>표지 한 줄</span><input type="text" class="nwcvi" data-f="sub" value="' + esc(D.cover.sub || "") + '" placeholder="' + esc(D.q ? "“" + D.q[1] + "”" : "직원이 함께 매긴 카페 노트") + '" maxlength="70"></label></div>' +
      '<div class="nwbtns"><button type="button" class="skbtn prim" data-nw="all">⬇ 카드 ' + S.length + "장 모두 저장</button>" + (navigator.share ? '<button type="button" class="skbtn" data-nw="share">📤 휴대폰 사진첩 · 공유</button>' : "") + '<button type="button" class="skbtn" data-nw="blog">📝 블로그 초안 복사</button><span class="nwmsg"></span></div></div>';
    if (only) h += '<p class="bnnone">아직 정리할 평가가 없어요 · 「🏪 가게 평가」나 「🍰 디저트 리뷰 · 기념품」에 점수 · 한마디를 적으면 카드가 만들어져요 (지금은 표지만)</p>';
    h += '<div class="nwgrid">' + S.map(function (s, i) {
      var f = pick(s.k, s.ph);
      return '<figure class="nwcard" data-i="' + i + '"><div class="nwfr">' + s.h(i + 1, S.length, f) + "</div><figcaption><span>" + pad(i + 1) + "</span>" +
        (s.ph && s.ph.length > 1 ? '<button type="button" data-nw="ph" data-k="' + esc(s.k) + '">📷 사진 바꾸기 ' + ((phPick[s.k] || 0) % s.ph.length + 1) + "/" + s.ph.length + "</button>" : "") +
        '<button type="button" data-nw="one" data-i="' + i + '">⬇ 이 장 저장</button></figcaption></figure>';
    }).join("") + "</div>";
    h += '<details class="nwblog"><summary>📝 블로그 초안 미리 보기</summary><pre>' + esc(blog(D, S)) + "</pre></details>";
    el.innerHTML = h;
    if (window.__CS_FILES) window.__CS_FILES.fillThumbs(el);
    scaleAll(el); setTimeout(function () { scaleAll(el); }, 60);
    loadFull(D, el);
    if (!el.__nw) {
      el.__nw = 1;
      if (window.ResizeObserver) new ResizeObserver(function () { scaleAll(el); }).observe(el);
      el.addEventListener("click", function (e) {
        var b = e.target.closest("[data-nw]"); if (!b) return;
        var D2 = window.__CS_BN_DATA(), S2 = slides(D2), a = b.dataset.nw, msg = el.querySelector(".nwmsg");
        if (a === "blog") { copy(blog(D2, S2)); return; }
        if (a === "ph") { phPick[b.dataset.k] = (phPick[b.dataset.k] || 0) + 1; try { localStorage.setItem("cafesui.ui.bnnph", JSON.stringify(phPick)); } catch (x) {} window.__CS_BN_NEWS(el); return; }
        var nodes = el.querySelectorAll(".nwcard .nwsl"), idx = a === "one" ? [+b.dataset.i] : Array.prototype.map.call(nodes, function (_, i) { return i; });
        b.disabled = true; var lab = b.textContent; b.textContent = "만드는 중…";
        h2c().then(function () { return loadFull(D2, el); }).then(function () {
          var out = [], chain = Promise.resolve();
          idx.forEach(function (i) { chain = chain.then(function () { if (msg) msg.textContent = (i + 1) + " / " + nodes.length + " 만드는 중…"; return shoot(nodes[i]).then(function (bl) { out.push({ b: bl, n: fname(D2, i) }); }); }); });
          return chain.then(function () {
            if (a === "share") {
              var files = out.map(function (x) { return new File([x.b], x.n, { type: "image/png" }); });
              if (navigator.canShare && navigator.canShare({ files: files })) return navigator.share({ files: files, title: "카페스이 벤치마킹" }).catch(function () {});
            }
            out.forEach(function (x, k) { setTimeout(function () { dl(x.b, x.n); }, k * 450); });
            if (msg) msg.textContent = out.length + "장 저장했어요 (1080×1350)";
          });
        }).catch(function (er) { alert("그림을 만들지 못했어요 · 다시 눌러 주세요\n(" + ((er && er.message) || er) + ")"); })
          .then(function () { b.disabled = false; b.textContent = lab; });
      });
      var ct = {};
      el.addEventListener("input", function (e) {
        var t = e.target; if (!t.classList.contains("nwcvi")) return;
        clearTimeout(ct[t.dataset.f]); ct[t.dataset.f] = setTimeout(function () {
          var D3 = window.__CS_BN_DATA(); if (window.__CS_BN_SETCOVER) window.__CS_BN_SETCOVER(D3.key, t.dataset.f, t.value);
          var D4 = window.__CS_BN_DATA(), S4 = slides(D4), cv = el.querySelector('.nwcard[data-i="0"] .nwfr'); if (cv) cv.innerHTML = S4[0].h(1, S4.length, pick(S4[0].k, S4[0].ph)); if (window.__CS_FILES) window.__CS_FILES.fillThumbs(el); loadFull(D4, el);
          var pre = el.querySelector(".nwblog pre"); if (pre) pre.textContent = blog(D4, S4);
        }, 500);
      });
    }
  };
  // bench.js 가 먼저 그렸으면 다시
  setTimeout(function () { var nb = document.getElementById("bnNews"); if (nb && !nb.querySelector(".nwgrid")) window.__CS_BN_NEWS(nb); }, 0);
})();
