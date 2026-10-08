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
    var FIRST = ["lf183", "lf184", "lf162", "lf163", "lf166"];
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
  // 월말회의 자동 채우기 — 일지에서 그대로 셀 수 있는 것만, 비어 있는 칸에만 (이미 적힌 칸은 절대 안 덮음)
  function autoFill(ym) {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("cafesui.log." + ym + "-") === 0) keys.push(k); }
    keys.sort(); if (!keys.length) return 0;
    var sales = [], sold = [], comp = [], brk = [], hide = [], W = { "폐기": [], "서비스": [], "직원": [], "테스트": [], "기타": [] }, wdSum = {}, wdN = {};
    keys.forEach(function (k) {
      var f = (J(k) || {}).f || {}, d = k.slice(12), p = d.split("-"), dt = new Date(+p[0], +p[1] - 1, +p[2]), md = (+p[1]) + "/" + (+p[2]), wd = WD[dt.getDay()];
      var n = num(f.lf183); if (n && n > 10000) { sales.push([md, wd, n]); wdSum[wd] = (wdSum[wd] || 0) + n; wdN[wd] = (wdN[wd] || 0) + 1; }
      if (String(f.lf152 || "").trim()) sold.push(md + " " + oneL(f.lf152));
      if (String(f.lf170 || "").trim()) String(f.lf170).split(NL).map(clean).filter(Boolean).forEach(function (x) { comp.push(md + " " + x); });
      if (String(f.lf166 || "").trim()) String(f.lf166).split(NL).map(clean).filter(Boolean).forEach(function (x) { brk.push(md + " " + x); });
      [f.lf162, f.lf163 ? "[서비스] " + f.lf163 : ""].forEach(function (v) {
        String(v || "").split(NL).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) {
          var m = x.match(/^\[(폐기|서비스|직원|테스트)\]\s*/); W[m ? m[1] : "기타"].push(md + " " + clean(m ? x.slice(m[0].length) : x));
        });
      });
      Object.keys(f).forEach(function (fk) { String(f[fk] || "").split(/\n| · |\//).forEach(function (x) { if (/숨김/.test(x) && /안 ?돼|안 ?되|누락|못/.test(x)) hide.push(md + " " + clean(x)); }); });
    });
    function clean(x) { return String(x).replace(/\*\*|__/g, "").replace(/^\s*[★⭐!！]\s*/, "").trim(); }
    function oneL(x) { return String(x).split(NL).map(clean).filter(Boolean).join(" · "); }
    var won = function (n) { return n.toLocaleString("ko-KR") + "원"; };
    var put = {};
    if (sales.length) {
      var by = sales.slice().sort(function (a, b) { return b[2] - a[2]; });
      var avg = ["월", "화", "수", "목", "금", "토"].filter(function (w) { return wdN[w]; }).map(function (w) { return w + " " + Math.round(wdSum[w] / wdN[w] / 10000 * 10) / 10 + "만"; }).join(" · ");
      put.ag304 = by.slice(0, 3).map(function (x, i) { return (i + 1) + "위 " + x[0] + "(" + x[1] + ") " + won(x[2]); }).join(NL) + NL + "요일 평균: " + avg;
      put.ag305 = by.slice(-2).reverse().map(function (x) { return x[0] + "(" + x[1] + ") " + won(x[2]); }).join(NL);
    }
    if (sold.length) put.ag306 = sold.join(NL);
    if (comp.length) { put.ag320 = comp.length + "건"; put.ag321 = comp.join(NL); }
    if (brk.length) put.ag340 = brk.join(NL);
    var wl = [];
    [["폐기", "【폐기 · 버린 것】"], ["서비스", "【서비스 · 손님 · 거래처에 나간 것】"], ["직원", "【직원 · 가족 가져감】"], ["테스트", "【테스트】"], ["기타", "【분류 안 된 것】"]].forEach(function (c) {
      if (W[c[0]].length) wl.push(c[1] + " " + W[c[0]].length + "건" + NL + W[c[0]].map(function (x) { return "· " + x; }).join(NL));
    });
    if (wl.length) put.ag341 = wl.join(NL + NL);
    if (hide.length) put.ag343 = hide.length + "건" + NL + hide.join(NL);
    var filled = [], skipped = [];
    Object.keys(put).forEach(function (fk) {
      var el = document.querySelector('#mtForm .fin[data-k="' + fk + '"]'); if (!el) return;
      if (el.value.trim()) { var nv = el.tagName === "INPUT" ? put[fk].split(NL).join(" · ") : put[fk]; if (el.value !== nv) skipped.push({ el: el, v: nv, n: (el.closest(".frow") ? el.closest(".frow").querySelector(".flab span").textContent.trim() : fk) }); return; }
      el.value = el.tagName === "INPUT" ? put[fk].split(NL).join(" · ") : put[fk]; el.classList.add("filled"); el.dispatchEvent(new Event("input", { bubbles: true }));
      var lab = el.closest(".frow"); filled.push(lab ? lab.querySelector(".flab span").textContent.trim() : fk);
    });
    // 채널별 매출 표: 이번 달 영업일수 · 메모에 일지 매출 합계 (비어 있을 때만)
    var tot = sales.reduce(function (a, x) { return a + x[2]; }, 0);
    var opDays = keys.filter(function (k) { var f = (J(k) || {}).f || {}; return Object.keys(f).some(function (x) { return String(f[x] || "").trim(); }); }).length;
    // 품목 숫자 = 일지 한 달 합계 (에그타르트 · 조각 · 홀은 생산, 별조각 · 빙수는 판매)
    var IT = [["cn10", "lf101", "에그타르트"], ["cn11", "lf103", "조각케이크"], ["cn12", "lf102", "홀케이크"], ["cn13", "lf104", "별조각"], ["cn14", "lf105", "빙수"]];
    var isum = {}, iany = {};
    keys.forEach(function (k) { var f = (J(k) || {}).f || {}; IT.forEach(function (x) { var n = num(f[x[1]]); if (n !== null) { isum[x[0]] = (isum[x[0]] || 0) + n; iany[x[0]] = 1; } }); });
    // 직원 수 = 그 달 근무표에 근무가 있는 직원(사장님 빼고) · 근무표가 없으면 일지를 쓴 직원
    var AWAY = { "휴무": 1, "휴가": 1, "반짝휴무": 1, "출장": 1, "공부": 1, "출강": 1, "서울출장": 1, "사무실 근무": 1, "수업 준비": 1, "해외출장": 1, "워크샵": 1 };
    var staff = {}, sc = J("cafesui.sched." + ym) || {};
    Object.keys(sc).forEach(function (md) { Object.keys(sc[md] || {}).forEach(function (w) { var r = sc[md][w]; if (w !== "공지" && w !== "사장님" && r && !AWAY[r]) staff[w] = 1; }); });
    if (!Object.keys(staff).length) keys.forEach(function (k) {
      var o = J(k) || {};
      [o.by, o.who].concat(Object.keys(o.bl || {}).map(function (fk) { return [].concat(o.bl[fk] || []); }).reduce(function (a, x) { return a.concat(x); }, []))
        .forEach(function (w) { w = String(w || "").replace(/님$/, "").trim(); if (/^(정항아|박혜빈|이해선)$/.test(w)) staff[w] = 1; });
    });
    var nStaff = Object.keys(staff).length;
    [["cn25", opDays ? String(opDays) : "", "영업일수"],
     ["cm5", sales.length ? "일지 합계 " + won(tot) + " (매출 적힌 " + sales.length + "일 · 일지 " + opDays + "일)" : "", "총합계(일지 합계)"],
     ["cn8", nStaff ? String(nStaff) : "", "직원 수"]].concat(IT.map(function (x) {
      return [x[0], iany[x[0]] ? isum[x[0]].toLocaleString("ko-KR") : "", x[2]];
    })).forEach(function (x) {
      var el = document.querySelector('.cin[data-k="' + x[0] + '"]'); if (!el || !x[1]) return;
      if (el.value.trim()) { if (el.value.replace(/,/g, "") !== x[1].replace(/,/g, "")) skipped.push({ el: el, v: x[1], n: "표 · " + x[2] }); return; }
      el.value = x[1]; el.classList.add("filled"); el.dispatchEvent(new Event("input", { bubbles: true })); filled.push(x[2]);
    });
    IT.forEach(function (x) {   // 무엇을 센 숫자인지 메모에 (비어 있을 때만)
      var m = document.querySelector('.cin[data-k="cm' + x[0].slice(2) + '"]');
      if (m && iany[x[0]] && !m.value.trim()) { m.value = /cn1[34]/.test(x[0]) ? "일지 판매 합계" : "일지 생산 합계"; m.dispatchEvent(new Event("input", { bubbles: true })); }
    });
    lastSkipped = skipped;
    return filled;
  }
  var lastSkipped = [];
  // 이미 적힌 칸도 일지 기준으로 다시 — 누르면 바뀔 칸을 보여 주고 확인 · 바로 전 내용은 이 기기에 남겨 「원래대로」로 되돌린다
  function refillUI(ym, msg) {
    var wrap = document.getElementById("mtRefill");
    if (!wrap) { wrap = document.createElement("span"); wrap.id = "mtRefill"; msg.parentNode.insertBefore(wrap, msg.nextSibling); }
    wrap.innerHTML = "";
    var UK = "cafesui.ui.mtundo." + ym, saved = null; try { saved = JSON.parse(localStorage.getItem(UK) || "null"); } catch (e) {}
    if (lastSkipped.length) {
      var b = document.createElement("button"); b.type = "button"; b.className = "skbtn"; b.textContent = "🔄 이미 적힌 " + lastSkipped.length + "칸도 일지 기준으로 다시 채우기";
      b.onclick = function () {
        if (!confirm("이 칸들을 일지에서 새로 뽑은 내용으로 바꿀까요?\n(지금 내용은 이 기기에 남겨 두고 「원래대로」로 되돌릴 수 있습니다)\n\n· " + lastSkipped.map(function (x) { return x.n; }).join("\n· "))) return;
        var old = {};
        lastSkipped.forEach(function (x) { old[x.el.dataset.k] = x.el.value; x.el.value = x.v; x.el.dispatchEvent(new Event("input", { bubbles: true })); });
        try { localStorage.setItem(UK, JSON.stringify(old)); } catch (e) {}
        msg.textContent = lastSkipped.length + "칸을 일지 기준으로 다시 채웠습니다"; lastSkipped = []; refillUI(ym, msg);
      };
      wrap.appendChild(b);
    }
    if (saved && Object.keys(saved).length) {
      var u = document.createElement("button"); u.type = "button"; u.className = "skbtn"; u.textContent = "↩ 원래대로";
      u.onclick = function () {
        if (!confirm("다시 채우기 전 내용으로 되돌릴까요?")) return;
        Object.keys(saved).forEach(function (k) { var el = document.querySelector('#mtForm .fin[data-k="' + k + '"], .cin[data-k="' + k + '"]'); if (el) { el.value = saved[k]; el.dispatchEvent(new Event("input", { bubbles: true })); } });
        try { localStorage.removeItem(UK); } catch (e) {}
        msg.textContent = "원래 내용으로 되돌렸습니다"; refillUI(ym, msg);
      };
      wrap.appendChild(u);
    }
  }
  // 월말회의 탭(해당 월)과 일지 탭(지금 보는 날짜의 달) 두 곳에서 쓴다
  function bind(btnId, msgId, boxId, monthOf, fill) {
    var btn = document.getElementById(btnId), msg = document.getElementById(msgId), box = document.getElementById(boxId);
    if (!btn) return;
    btn.addEventListener("click", function () {
      var ym = monthOf() || (function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); })();
      var t = build(ym);
      if (!t) { msg.textContent = ym + " 일지가 없습니다"; box.hidden = true; return; }
      box.value = t; box.hidden = false;
      var n = (t.match(/^===== /gm) || []).length;
      var got = fill ? autoFill(ym) : null;
      var extra = got && got.length ? " · 월말회의 빈 칸 " + got.length + "개를 일지로 자동 채움 (" + got.join(", ") + ")" : (fill ? " · 빈 칸은 없음" + (lastSkipped.length ? " (이미 적힌 칸 " + lastSkipped.length + "개는 그대로 둠)" : "") : "");
      if (fill) refillUI(ym, msg);
      var ok = function () { msg.textContent = (+ym.slice(5)) + "월 일지 " + n + "일치를 복사했습니다" + extra; };
      var fb = function () { box.focus(); box.select(); try { document.execCommand("copy"); ok(); } catch (e) { msg.textContent = "아래 글을 길게 눌러 전체 선택 → 복사하세요"; } };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb); else fb();
    });
  }
  bind("mtCollect", "mtCollectMsg", "mtCollectBox", function () { var e = document.getElementById("mtMonth"); return e && e.value; }, true);
  bind("lgCollect", "lgCollectMsg", "lgCollectBox", function () { var e = document.getElementById("lgDate"); return e && e.value ? e.value.slice(0, 7) : ""; });
})();

// 월말회의 중요 표시 — 일지와 같은 버튼: ⭐ 매우 중요(줄 앞 ★) · 🔴 중요(**글** 또는 줄 앞 !) · 밑줄(__글__)
// 묶음마다 버튼 한 줄, 마지막으로 누른 칸에 적용된다
(function () {
  var form = document.getElementById("mtForm"); if (!form) return;
  form.querySelectorAll(".fsec").forEach(function (sec) {
    var tas = Array.prototype.slice.call(sec.querySelectorAll("textarea.fin")); if (!tas.length) return;
    var head = sec.querySelector(".fsh"); if (!head) return;
    var bar = document.createElement("div"); bar.className = "bossbar secbar mtmk";
    bar.innerHTML = '<button type="button" class="wsmini" data-act="star">⭐ 매우 중요</button>' +
      '<button type="button" class="wsmini" data-act="imp">🔴 중요</button>' +
      '<button type="button" class="wsmini" data-act="und"><u>밑줄</u></button>' +
      '<span class="mkto">적용 칸: <b></b></span>';
    var toEl = bar.querySelector(".mkto b"), ta = tas[0];
    function name(t) { var l = t.closest(".frow").querySelector(".flab span"); return l ? l.textContent.trim() : ""; }
    toEl.textContent = name(ta);
    tas.forEach(function (t) {
      t.addEventListener("focus", function () {
        ta = t; toEl.textContent = name(t);
        tas.forEach(function (x) { x.closest(".frow").classList.toggle("mktarget", x === t); });
      });
    });
    head.insertAdjacentElement("afterend", bar);
    bar.addEventListener("mousedown", function (e) { if (e.target.closest("[data-act]")) e.preventDefault(); });
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]"); if (!btn) return;
      var act = btn.dataset.act, a = ta.selectionStart, b = ta.selectionEnd, v = ta.value;
      if (act === "star") {
        var ls = v.lastIndexOf("\n", a - 1) + 1, le = v.indexOf("\n", ls); if (le < 0) le = v.length;
        var line = v.slice(ls, le);
        var nl = /^\s*[★⭐]/.test(line) ? line.replace(/^\s*[★⭐]\s*/, "") : "★ " + line.replace(/^\s*[!！]\s*/, "");
        ta.value = v.slice(0, ls) + nl + v.slice(le); ta.setSelectionRange(ls + nl.length, ls + nl.length);
      } else if (act === "und") {
        if (b <= a) { alert("밑줄 칠 글을 먼저 드래그해서 골라 주세요"); ta.focus(); return; }
        var sel = v.slice(a, b), al = /^__[\s\S]*__$/.test(sel), rep = al ? sel.slice(2, -2) : "__" + sel + "__";
        ta.value = v.slice(0, a) + rep + v.slice(b); ta.setSelectionRange(a, a + rep.length);
      } else if (b > a) {
        var sel2 = v.slice(a, b), al2 = /^\*\*[\s\S]*\*\*$/.test(sel2), rep2 = al2 ? sel2.slice(2, -2) : "**" + sel2 + "**";
        ta.value = v.slice(0, a) + rep2 + v.slice(b); ta.setSelectionRange(a, a + rep2.length);
      } else {
        var ls2 = v.lastIndexOf("\n", a - 1) + 1, le2 = v.indexOf("\n", ls2); if (le2 < 0) le2 = v.length;
        var line2 = v.slice(ls2, le2);
        var nl2 = /^\s*[!！]/.test(line2) ? line2.replace(/^\s*[!！]\s*/, "") : "! " + line2;
        ta.value = v.slice(0, ls2) + nl2 + v.slice(le2); ta.setSelectionRange(ls2 + nl2.length, ls2 + nl2.length);
      }
      ta.focus(); ta.dispatchEvent(new Event("input", { bubbles: true }));
    });
  });
})();
