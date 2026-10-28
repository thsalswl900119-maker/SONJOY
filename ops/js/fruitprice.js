// 📊 과일 단가 달별 통계 (10/28 · 사장님 「과일 주문 금액 한 달에 한 번씩 통계 내서 업데이트」)
// 재고·발주 「🍓 과일」 → 「💰 과일 한도선 · 단가」 아래 #skPrice
//  · 칠성상회 월 거래내역 글(「9/19 애플망고 10박스 × 62,000원 …」)을 붙여 넣으면 과일별 단가 줄로 나눠 저장 → 달마다 최저 · 최고 · 평균 · 한도선 넘은 건이 저절로
//  · 처음 기록은 손익(회계) 파일 주석의 칠성 · 엄궁 거래내역(2025-10 ~ 2026-10)을 같은 방법으로 읽어 서버에 넣어 둠
//  · 저장 cafesui.fruitprice = { ln: { id: { d, f, n, q, p, src, by, at } } } — 더하기만(같은 날 · 과일 · 값 · 수량은 건너뜀)
(function (root) {
  // 이름 → 한도선 표 과일 id (긴 이름 먼저)
  var MAP = [
    [/애플청포도/, ""], [/보늬밤|밤\s*조림|감로자|내피밤|밤\s*캔/, "f25"], [/무지개망고|코끼리망고/, ""], [/애플망고|애플(?!레몬)/, "f3"], [/골드\s*망고/, "f2"], [/파키스탄/, "f16"],
    [/허니듀/, "f17"], [/멜론|메론/, "f6"], [/골드\s*키위|골키/, "f21"], [/블루베리/, "f20"], [/체리/, "f7"], [/무화과/, "f5"],
    [/미스터\s*돌|병조림|복숭아\s*(?:조림|24병)/, "f8"], [/복숭아|딱복|백도/, "f18"], [/초당\s*옥수수/, "f9"], [/대추\s*방울|방울\s*토마토|방토/, "f10"],
    [/짭짤이/, "f19"], [/바나나/, "f11"], [/귤|만다린/, "f22"], [/천혜향|레드향|한라봉/, "f23"], [/샤인/, "f4"], [/망고/, "f2"], [/딸기|설향|설딸|금실/, "f1"]
  ];
  var SKIP = /소계|합계|총합|차감|잔금|미수|입금|송금|선금|정산|남음/;
  function fid(name) { if (SKIP.test(name)) return ""; for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(name)) return MAP[i][1]; return ""; }
  function num(t) { return Number(String(t || "").replace(/,/g, "")) || 0; }
  function pad(n) { return String(n).padStart(2, "0"); }
  // text: 거래내역 글 · y0/m0: 이 글을 받은(정산한) 해 · 달 — 날짜의 달이 m0보다 크면 지난해
  function parse(text, y0, m0) {
    text = String(text || "").replace(/\r/g, "").replace(/×|✕|ｘ/g, "×");
    var dre = /(\d{1,2})\s*월\s*(\d{1,2})\s*일|(?:^|[^\d.,])(\d{1,2})\s*\/\s*(\d{1,2})(?![\d])/g, marks = [], m;
    while ((m = dre.exec(text))) { var mo = +(m[1] || m[3]), da = +(m[2] || m[4]); if (mo >= 1 && mo <= 12 && da >= 1 && da <= 31) marks.push({ i: m.index, e: dre.lastIndex, mo: mo, da: da }); }
    var out = [];
    marks.forEach(function (k, j) {
      var seg = text.slice(k.e, j + 1 < marks.length ? marks[j + 1].i : text.length);
      var y = k.mo > m0 ? y0 - 1 : y0, last = new Date(y, k.mo, 0).getDate();
      var d = y + "-" + pad(k.mo) + "-" + pad(Math.min(k.da, last));
      var MONEY = "(\\d{1,3}(?:,\\d{3})+|\\d{4,})";
      var ire = new RegExp("(?!원\\s)([가-힣][가-힣A-Za-z]*(?:\\s?\\([^)]*\\))?(?:\\s(?!반\\s*박스|박스)[가-힣]+)?)\\s*" +
        "((?:\\d+(?:\\.\\d+)?(?![\\d,])\\s*(?:kg|키로|KG|Kg)\\s*)?)" +
        "(반\\s*박스|\\d+(?:\\.\\d+)?(?![\\d,])\\s*(?:박스|상자|송이|손|병|통|팩|개)?)?\\s*" +
        "(?:[×x*]\\s*" + MONEY + "\\s*원?(?:\\s*=\\s*[\\d,]+\\s*원?)?|" + MONEY + "\\s*원?\\s*[×x*]\\s*(\\d+)|=?\\s*" + MONEY + "\\s*원)", "g");
      var t;
      while ((t = ire.exec(seg))) {
        var name = t[1].trim(), f = fid(name); if (!f) continue;
        if (/-\s*$/.test(seg.slice(0, t.index))) continue;
        var qt = t[3] || "", q = /반/.test(qt) ? 0.5 : (parseFloat(qt) || 1), p = 0, kg = parseFloat(t[2]) || 0;
        if (t[4]) p = num(t[4]);
        else if (t[5]) { p = num(t[5]); q = +t[6] || 1; kg = 0; }
        else if (t[7]) { p = Math.round(num(t[7]) / q); }
        if (f === "f1" && kg && t[4]) p = Math.round(p / (kg * 2));   // 딸기 1kg 팩 값 → 500g 1통 값으로
        if (kg && t[7] && f !== "f1") { if (f === "f10") p = Math.round(num(t[7]) / (kg / 2)); else continue; }   // 대추방울 kg 묶음 → 2kg 박스 값 · 다른 과일 kg 합계는 건너뜀
        if (!p || p < 1000) continue;
        out.push({ d: d, f: f, n: name.replace(/\s+/g, " "), q: q, p: p });
      }
    });
    return out;
  }
  if (typeof module !== "undefined" && module.exports) { module.exports = { parse: parse, fid: fid }; return; }

  var KEY = "cafesui.fruitprice", MGR = ["정항아", "사장님"];
  var box = document.getElementById("skPrice"); if (!box) return;
  function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
  function canEdit() { return MGR.indexOf(me()) >= 0; }
  function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function won(n) { n = Math.round(Number(n) || 0); return n ? n.toLocaleString("ko-KR") + "원" : "—"; }
  function stamp() { var d = new Date(); return (d.getMonth() + 1) + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return {}; } }
  function lines() { var ln = load().ln || {}; return Object.keys(ln).map(function (k) { var x = ln[k]; x._id = k; return x; }).filter(function (x) { return x && !x.del && x.p && x.d; }); }
  // 「＋ 값 적기」(한도선 표 rec)도 같이 셈
  function allLines() {
    var a = lines(), cap = null; try { cap = JSON.parse(localStorage.getItem("cafesui.fruitcap") || "{}").it || {}; } catch (e) {}
    Object.keys(cap || {}).forEach(function (f) { var r = (cap[f] || {}).rec || {}; Object.keys(r).forEach(function (k) { if (r[k] && r[k].p && !r[k].del) a.push({ d: r[k].d, f: f, n: "", q: 1, p: +r[k].p, src: "값 적기", by: r[k].who }); }); });
    return a;
  }
  window.__CS_FP_FID = fid;
  window.__CS_FP_LINES = function (f) { return allLines().filter(function (x) { return x.f === f; }); };
  function names() { return window.__CS_FCAP_ROWS ? window.__CS_FCAP_ROWS() : []; }
  function capOf(f, ym) { return window.__CS_FCAP ? window.__CS_FCAP(f, +ym.slice(5, 7)) : 0; }
  function ymOf(d) { return String(d).slice(0, 7); }
  function addM(ym, n) { var y = +ym.slice(0, 4), m = +ym.slice(5, 7) + n; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + "-" + pad(m); }
  var now = new Date(), thisYm = now.getFullYear() + "-" + pad(now.getMonth() + 1), lastYm = addM(thisYm, -1);
  var VIEW = lastYm, OPEN = false, PREV = null;
  function stat(xs) { // 박스(수량) 가중 평균
    var q = 0, s = 0, lo = Infinity, hi = 0;
    xs.forEach(function (x) { var w = Number(x.q) || 1; q += w; s += x.p * w; lo = Math.min(lo, x.p); hi = Math.max(hi, x.p); });
    return { q: q, avg: q ? s / q : 0, lo: lo === Infinity ? 0 : lo, hi: hi, n: xs.length };
  }
  function qtxt(q) { return (Math.round(q * 10) / 10).toLocaleString("ko-KR"); }
  function draw() {
    var all = allLines(), rows = names(), byF = {};
    all.forEach(function (x) { (byF[x.f] = byF[x.f] || []).push(x); });
    var months = []; for (var i = 11; i >= 0; i--) months.push(addM(thisYm, -i));
    var has = function (ym) { return all.some(function (x) { return ymOf(x.d) === ym; }); };
    var h = '<div class="fch"><b>📊 달마다 과일 단가 통계</b><span>칠성상회 <b>월 거래내역 글을 붙여 넣으면</b> 과일별로 나눠 저장되고 통계가 저절로 바뀝니다 · 「＋ 값 적기」도 같이 셈</span></div>';
    if (now.getDate() <= 20 && !has(lastYm)) h += '<div class="fpwarn">⚠ 지난달(' + (+lastYm.slice(5)) + "월) 과일 거래내역이 아직 없어요 — 칠성상회 거래내역이 오면 아래 「📋 거래내역 붙여 넣기」에 넣어 주세요" + "</div>";
    // 한 달 요약
    var mx = all.filter(function (x) { return ymOf(x.d) === VIEW; }), fs = {};
    mx.forEach(function (x) { (fs[x.f] = fs[x.f] || []).push(x); });
    h += '<div class="fpmh"><button type="button" class="fpnav" data-d="-1" aria-label="이전 달">◀</button><b>' + VIEW.slice(0, 4) + "년 " + (+VIEW.slice(5)) + '월</b><button type="button" class="fpnav" data-d="1" aria-label="다음 달">▶</button>' +
      '<span>' + (mx.length ? mx.length + "줄 · " + won(mx.reduce(function (s, x) { return s + x.p * (x.q || 1); }, 0)) : "기록 없음") + "</span></div>";
    if (mx.length) {
      h += '<div class="ztable-wrap"><table class="skref fptab"><thead><tr><th>과일</th><th>주문량</th><th>최저</th><th>최고</th><th>평균</th><th>한도선</th><th>넘은 날</th></tr></thead><tbody>';
      rows.filter(function (r) { return fs[r.id]; }).concat([]).forEach(function (r) {
        var st = stat(fs[r.id]), cap = capOf(r.id, VIEW), over = cap ? fs[r.id].filter(function (x) { return x.p > cap; }) : [];
        h += "<tr" + (over.length ? ' class="over"' : "") + "><td><b>" + esc(r.n) + "</b></td><td>" + qtxt(st.q) + "</td><td>" + won(st.lo) + "</td><td>" + won(st.hi) + "</td><td><b>" + won(st.avg) + "</b></td><td>" + (cap ? won(cap) : "—") + "</td><td>" +
          (over.length ? over.map(function (x) { return (+x.d.slice(8)) + "일 " + won(x.p); }).join(" · ") : "없음") + "</td></tr>";
      });
      h += "</tbody></table></div>";
    }
    // 과일 × 달 평균 (최근 12달)
    var used = rows.filter(function (r) { return months.some(function (ym) { return (byF[r.id] || []).some(function (x) { return ymOf(x.d) === ym; }); }); });
    if (used.length) {
      h += '<h4 class="fph">📈 최근 12달 평균 단가 <small>칸 = 그 달 평균 단가(원 · 박스 · 통 1개 값) · <mark>▲ 노란 형광</mark> = 그 과일이 가장 비쌌던 달 · 빨강 = 그 달 평균이 한도선(평균값) 넘음 · 빈 칸 = 기록 없음</small></h4><div class="ztable-wrap"><table class="skref fpmx"><thead><tr><th>과일</th>' +
        months.map(function (ym) { return "<th>" + (ym.slice(5) === "01" ? ym.slice(2, 4) + "년 " : "") + (+ym.slice(5)) + "월</th>"; }).join("") + "</tr></thead><tbody>";
      // 10/28 사장님 「각 월 중에 최고가에 하이라이트」 — 과일마다 가장 비쌌던 달(평균 기준)에 노란 형광 · 한도선이 평균값이 되면서 빨강은 「그 달 평균이 한도선 넘음」
      used.forEach(function (r) {
        var cells = months.map(function (ym) { var xs = (byF[r.id] || []).filter(function (x) { return ymOf(x.d) === ym; }); return xs.length ? stat(xs) : null; });
        var top = 0; cells.forEach(function (st) { if (st && Math.round(st.avg / 100) > top) top = Math.round(st.avg / 100); });
        var nOn = cells.filter(function (st) { return st && Math.round(st.avg / 100) !== top; }).length + 1;   // 모든 달 값이 같으면 표시 안 함
        h += "<tr><td><b>" + esc(r.n) + "</b></td>" + months.map(function (ym, i) {
          var st = cells[i]; if (!st) return "<td></td>";
          var cap = capOf(r.id, ym), isTop = nOn > 1 && Math.round(st.avg / 100) === top;
          return '<td class="' + (cap && st.avg > cap ? "over" : "") + (isTop ? " top" : "") + '" title="최저 ' + won(st.lo) + " · 최고 " + won(st.hi) + '">' + (isTop ? "<mark>▲ " : "") + (Math.round(st.avg / 100) * 100).toLocaleString("ko-KR") + (isTop ? "</mark>" : "") + "</td>";
        }).join("") + "</tr>";
      });
      h += "</tbody></table></div>";
    }
    // 붙여 넣기
    if (canEdit()) {
      h += '<details class="fppaste"' + (OPEN ? " open" : "") + '><summary>📋 거래내역 붙여 넣기 (한 달에 한 번)</summary>' +
        '<p>칠성상회에서 오는 「카페스이 ○월 거래내역」 글을 그대로 붙여 넣으세요. 날짜 · 과일 · 수량 · 단가를 읽어 미리 보여 드리고, 「넣기」를 누르면 저장됩니다. 이미 있는 줄은 건너뜁니다.</p>' +
        '<textarea id="fpText" rows="6" placeholder="예) 9/19 애플망고 10박스 × 62,000원 = 620,000원 무화과 2박스 = 24,000원 …"></textarea>' +
        '<div class="fpact"><button type="button" class="fprun">미리 보기</button><span class="fpmsg"></span></div><div class="fpprev"></div></details>';
    }
    box.innerHTML = h;
    if (PREV) paintPrev();
  }
  function paintPrev() {
    var el = box.querySelector(".fpprev"); if (!el) return;
    if (!PREV.length) { el.innerHTML = '<p class="fpmsg">읽은 줄이 없어요 · 「9/19 애플망고 3박스 × 56,000원」처럼 날짜와 값이 있는 글인지 확인해 주세요</p>'; return; }
    var have = lines(), dup = function (x) { return have.some(function (y) { return y.d === x.d && y.f === x.f && y.p === x.p && +y.q === +x.q; }); };
    var nm = {}; names().forEach(function (r) { nm[r.id] = r.n; });
    var nn = PREV.filter(function (x) { return !dup(x); }).length;
    el.innerHTML = '<table class="skref fptab"><thead><tr><th>날짜</th><th>과일</th><th>글</th><th>수량</th><th>단가</th></tr></thead><tbody>' +
      PREV.map(function (x) { return "<tr" + (dup(x) ? ' class="dup"' : "") + "><td>" + x.d.slice(5).replace("-", "/") + "</td><td>" + esc(nm[x.f] || x.f) + "</td><td>" + esc(x.n) + "</td><td>" + qtxt(x.q) + "</td><td>" + won(x.p) + (dup(x) ? " · 이미 있음" : "") + "</td></tr>"; }).join("") +
      '</tbody></table><div class="fpact"><button type="button" class="fpsave"' + (nn ? "" : " disabled") + ">✔ " + nn + "줄 넣기</button><button type=\"button\" class=\"fpcancel\">취소</button></div>";
  }
  box.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest(".fpnav")) { VIEW = addM(VIEW, +t.closest(".fpnav").dataset.d); draw(); return; }
    if (t.closest(".fprun")) {
      var tx = (box.querySelector("#fpText") || {}).value || "";
      PREV = parse(tx, now.getFullYear(), now.getMonth() + 1); OPEN = true; paintPrev(); return;
    }
    if (t.closest(".fpcancel")) { PREV = null; paintPrev && (box.querySelector(".fpprev").innerHTML = ""); return; }
    if (t.closest(".fpsave") && PREV) {
      var have = lines(), o = load(); o.ln = o.ln || {}; var n = 0, base = Date.now();
      PREV.forEach(function (x, i) {
        if (have.some(function (y) { return y.d === x.d && y.f === x.f && y.p === x.p && +y.q === +x.q; })) return;
        o.ln["l" + (base + i).toString(36)] = { d: x.d, f: x.f, n: x.n, q: x.q, p: x.p, src: "붙여넣기 " + stamp(), by: me() }; n++;
      });
      o.at = stamp(); o.by = me();
      try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (er) {}
      if (window.__CS_TOAST) window.__CS_TOAST(n + "줄 넣었어요");
      var lastD = PREV.reduce(function (a, x) { return x.d > a ? x.d : a; }, ""); if (lastD) VIEW = ymOf(lastD);
      PREV = null; OPEN = false; draw(); if (window.__CS_FCAP_DRAW) window.__CS_FCAP_DRAW();
    }
  });
  window.addEventListener("cs:remote", function (e) {
    var ks = (e.detail && e.detail.keys) || []; if (ks.indexOf(KEY) < 0 && ks.indexOf("cafesui.fruitcap") < 0) return;
    var a = document.activeElement; if (a && box.contains(a)) return; draw();
  });
  window.__CS_FP_DRAW = draw;
  draw();
  if (window.__CS_FCAP_DRAW) window.__CS_FCAP_DRAW();   // 한도선 카드 최저 · 최고에 단가 기록도 넣어 다시 그림
})(typeof window !== "undefined" ? window : this);
