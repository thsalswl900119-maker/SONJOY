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
    keys.sort();   // 일지가 없는 달도 매출 · 생산량 파일 숫자는 가져옴
    var sales = [], sold = [], comp = [], brk = [], hide = [], W = { "폐기": [], "서비스": [], "직원": [], "테스트": [], "기타": [] }, wdSum = {}, wdN = {};
    keys.forEach(function (k) {
      var f = (J(k) || {}).f || {}, d = k.slice(12), p = d.split("-"), dt = new Date(+p[0], +p[1] - 1, +p[2]), md = (+p[1]) + "/" + (+p[2]), wd = WD[dt.getDay()];
      var n = num(f.lf183); if (n && n > 10000) { sales.push([md, wd, n]); wdSum[wd] = (wdSum[wd] || 0) + n; wdN[wd] = (wdN[wd] || 0) + 1; }
      if (String(f.lf152 || "").trim()) sold.push(md + " " + oneL(f.lf152));
      if (String(f.lf170 || "").trim()) String(f.lf170).split(NL).map(clean).filter(Boolean).forEach(function (x) { comp.push(md + " " + x); });
      if (String(f.lf166 || "").trim()) String(f.lf166).split(NL).map(clean).filter(Boolean).forEach(function (x) { brk.push(md + " " + x); });
      [f.lf162, f.lf163 ? "[서비스] " + f.lf163 : ""].forEach(function (v) {
        String(v || "").split(NL).map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) {
          // [폐기] · 「폐기 -」 · 「서비스:」 모두 · [사장님] 가져감은 직원 · 가족 · 꼬리표 없으면 글에 「서비스 · 폐기」가 있는지로
          var m = x.match(/^\[?(폐기|서비스|직원|테스트|사장님)\]?\s*[-:：]?\s*/), c = m ? (m[1] === "사장님" ? "직원" : m[1]) : /서비스/.test(x) ? "서비스" : /폐기/.test(x) ? "폐기" : /챙겨\s*갔|가져\s*갔|가져감/.test(x) ? "직원" : "기타";
          W[c].push(md + " " + clean(m ? x.slice(m[0].length) : x));
        });
      });
      Object.keys(f).forEach(function (fk) { String(f[fk] || "").split(/\n| · |\//).forEach(function (x) { if (/숨김/.test(x) && /안 ?돼|안 ?되|누락|못/.test(x)) hide.push(md + " " + clean(x)); }); });
    });
    // 한 줄 요약: 시각 · 주문번호 빼고 첫 마디(쉼표 · 괄호 · 줄표 앞)까지, 길면 자름
    function short(x, n) {
      var t = clean(x).replace(/^\s*\d{1,2}\s*시\s*(\d{1,2}\s*분)?\s*(에|쯤)?\s*/, "").replace(/\s*주문번호\s*/g, " ").replace(/\s+/g, " ").trim();
      var cut = -1; [",", "(", " - ", "→", "ㅜ", "ㅠ", "!", "."].forEach(function (c) { var i = t.indexOf(c); if (i >= 10 && (cut < 0 || i < cut)) cut = i; });
      if (cut > 0 && cut <= n) t = t.slice(0, cut);
      return t.length > n ? t.slice(0, n).trim() + "…" : t.trim();
    }
    // 가격표에서 품목 판매가 찾기 — 일지 줄임말(샤요 · 초밤 · 멜 · 망 …) → 가격표 이름
    var PR = (J("cafesui.price") || {}).it || {}, PL = Object.keys(PR).map(function (k) { return PR[k]; }).filter(function (x) { return x && !x.del && +x.p > 0 && String(x.c || "").indexOf("⏸") < 0; }).sort(function (a, b) { return (a.o || 0) - (b.o || 0); });
    var PA = [["샤인머스캣 요거트", /샤요|샤인/g, "조각 케이크", /샤인/], ["초코보늬밤", /초밤|보늬밤/g, "조각 케이크", /보늬밤/], ["밤 타르트", /밤\s*타르트|밤타/g, "에그타르트", /밤 타르트/],
      ["초코 타르트", /초코\s*타르트/g, "에그타르트", /초코 타르트/], ["망고 케이크", /망고(?!\s*타르트)|망(?=\s*\d)/g, "조각 케이크", /망고/], ["메론", /멜론|메론|멜(?=\s*(조각)?\s*\d)/g, "조각 케이크", /메론|멜론/],
      ["티라미수", /티라미수/g, "조각 케이크", /^티라미수/], ["치즈 타르트", /치즈/g, "에그타르트", /치즈/], ["옥수수 타르트", /옥수수/g, "에그타르트", /옥수수/], ["인절미 타르트", /인절미/g, "에그타르트", /인절미/],
      ["감자파이", /감자/g, "디저트", /감자/], ["에그타르트", /에타|에그타르트|기본(?=\s*\d)/g, "에그타르트", /^스이 에그타르트$/], ["라떼", /라떼/g, "", /라떼/], ["아메리카노", /아아|아메리카노/g, "", /아메리카노/], ["케이크", /케이크/g, "조각 케이크", null]];
    function priceOf(a) {
      if (!a[3]) { var cs = PL.filter(function (x) { return x.c === a[2]; }); return cs.length ? Math.round(cs.reduce(function (t, x) { return t + +x.p; }, 0) / cs.length / 100) * 100 : 0; }
      var f = PL.filter(function (x) { return (!a[2] || x.c === a[2]) && a[3].test(x.n); })[0]; return f ? +f.p : 0;
    }
    // 한 줄에서 「품목 + 붙은 숫자」만 셈 · 구매 · 주문 얘기(감자3,기본3 구매해 가신 손님)와 「4구 · 2세트 · 2잔」은 뺌
    function lineWon(t) {
      var used = [], won0 = 0, hit = 0;
      PA.forEach(function (a) {
        a[1].lastIndex = 0; var m;
        while ((m = a[1].exec(t))) {
          var st = m.index, en = st + m[0].length;
          if (used.some(function (u) { return st < u[1] && en > u[0]; })) continue;
          var q = /^\s*(조각|타르트|케이크)?\s*(\d+)\s*(개|조각)?/.exec(t.slice(en)); if (!q) continue;
          var after = t.slice(en + q[0].length, en + q[0].length + 10);
          if (/^\s*(구|세트|박스|판|잔)/.test(after) || /구매|사신|사가|주문/.test(after)) { used.push([st, en + q[0].length]); continue; }
          if (a[0] === "케이크" && used.some(function (u) { return Math.abs(u[0] - st) < 12; })) continue;
          used.push([st, en + q[0].length]); hit++;
          won0 += priceOf(a) * +q[2];
        }
      });
      return { won: won0, miss: !hit };
    }
    function chan(x) {   // 글에서 먼저 나온 채널 (「현장에서 … 네이버 예약 보고」 → 현장)
      var best = "기타", bi = 1e9;
      [["배민", /배민/], ["쿠팡", /쿠팡/], ["네이버", /네이버/], ["현장", /현장|홀손님|매장에서/], ["전화", /전화/]].forEach(function (c) { var i = x.search(c[1]); if (i >= 0 && i < bi) { bi = i; best = c[0]; } });
      return best;
    }
    var KW = [["샤인머스캣 요거트", /샤요|샤인/], ["망고", /망고|(^|\s)망\d?/], ["멜론", /멜론|메론|(^|\s)멜/], ["초코보늬밤", /초밤|보늬밤/], ["티라미수", /티라미수/], ["치즈타르트", /치즈/], ["옥수수타르트", /옥수수/], ["인절미타르트", /인절미/], ["감자파이", /감자/], ["밤타르트", /밤\s*타르트|밤타/], ["에그타르트", /에타|에그|기본\d/], ["음료", /라떼|아아|아메|에이드|음료/]];
    function kwTop(L) {
      var c = {}; L.forEach(function (x) { KW.forEach(function (k) { if (k[1].test(x)) c[k[0]] = (c[k[0]] || 0) + 1; }); });
      return Object.keys(c).sort(function (a, b) { return c[b] - c[a]; }).slice(0, 3).map(function (k) { return k + " " + c[k] + "번"; }).join(" · ");
    }
    // 품절 · 소진: 일지 「첫 주문 · 소진」(lf152)에서 품목별로 몇 번 · 언제
    function soldSum(L) {
      var it = {}, n = 0;
      L.forEach(function (x) {
        var sp = x.indexOf(" "), md = x.slice(0, sp);
        x.slice(sp + 1).split(/\/|·/).forEach(function (seg) {
          var at0 = seg.search(/소진|품절/); if (at0 < 0) return;
          // 소진 바로 앞 시각 뒤부터 소진 앞까지가 품목 (「10시 37분 쿠팡 주문, 12시 30분 초코타르트 품절」 → 초코타르트)
          var TR = /(\d{1,2})\s*시\s*(\d{1,2})?\s*분?\s*(에|쯤)?|(\d{1,2}):(\d{2})\s*분?\s*(에|쯤)?/g, mm, last = null;
          while ((mm = TR.exec(seg)) && mm.index < at0) last = mm;
          var at = last ? (last[1] || last[4]) + ":" + ("0" + (last[2] || last[5] || "0")).slice(-2) : "";
          var from = last ? last.index + last[0].length : 0, body = seg.slice(from, at0);
          if (!last) { var cm = body.lastIndexOf(","); }
          body.split(/,|，/).map(function (q) { return q.trim(); }).filter(Boolean).forEach(function (nm) {
            nm = nm.replace(/\s+/g, "").replace(/^감자$/, "감자파이").replace(/^(밤|초코|치즈|옥수수|인절미|앙버터|말차)$/, "$1타르트").replace(/타르트$/, " 타르트");
            (it[nm] = it[nm] || []).push(md + (at ? " " + at : "")); n++;
          });
        });
      });
      var ks = Object.keys(it).sort(function (a, b) { return it[b].length - it[a].length; });
      if (!ks.length) return "";
      // (제안) 사장님 「이렇게 제안 주는 거 좋다」(10/22) — 낮 1시 전에 떨어진 품목 · 세 번 이상 품절
      var am = ks.map(function (k) { return [k, it[k].map(function (x) { var t = / (\d{1,2}):(\d{2})$/.exec(x); if (!t) return ""; var h = +t[1]; if (h <= 8) h += 12; return h < 13 ? t[1] + ":" + t[2] : ""; }).filter(Boolean)]; }).filter(function (x) { return x[1].length; });
      var tips = am.slice(0, 2).map(function (x) { return "(제안) " + x[0] + "는 낮 1시 전(" + x[1].join(" · ") + ")에 떨어진 날이 있음 → 생산 1~2개 늘려 보기"; });
      var often = ks.filter(function (k) { return it[k].length >= 3 && !am.some(function (x) { return x[0] === k; }); });
      if (often.length) tips.push("(제안) " + often.join(" · ") + " — 한 달에 3번 이상 품절 → 생산량 늘리거나 품절 시각 보고 굽는 시간 앞당기기");
      return "품절 · 소진 " + n + "번 (일지 「첫 주문 · 소진」 기준)" + NL + ks.map(function (k) { return "· " + k + " " + it[k].length + "번 — " + it[k].join(" · "); }).join(NL) + (tips.length ? NL + tips.join(NL) : "");
    }
    function clean(x) { return String(x).replace(/\*\*|__/g, "").replace(/^\s*[★⭐!！]\s*/, "").trim(); }
    function oneL(x) { return String(x).split(NL).map(clean).filter(Boolean).join(" · "); }
    var won = function (n) { return n.toLocaleString("ko-KR") + "원"; };
    var put = {};
    if (sales.length) {
      var by = sales.slice().sort(function (a, b) { return b[2] - a[2]; });
      var avg = ["월", "화", "수", "목", "금", "토"].filter(function (w) { return wdN[w]; }).map(function (w) { return w + " " + Math.round(wdSum[w] / wdN[w] / 10000 * 10) / 10 + "만"; }).join(" · ");
      put.ag304 = by.slice(0, 3).map(function (x, i) { return (i + 1) + "위 " + x[0] + "(" + x[1] + ") " + won(x[2]); }).join(NL) + NL + "요일 평균: " + avg;
      put.ag305 = by.slice(-2).reverse().map(function (x) { return x[0] + "(" + x[1] + ") " + won(x[2]); }).join(NL);
      var wk = ["월", "화", "수", "목", "금", "토"].filter(function (w) { return wdN[w] >= 2; }).sort(function (a, b) { return wdSum[a] / wdN[a] - wdSum[b] / wdN[b]; })[0];
      if (wk) put.ag305 += NL + "(제안) " + wk + "요일이 가장 약함 (평균 " + Math.round(wdSum[wk] / wdN[wk] / 10000 * 10) / 10 + "만) → " + wk + "요일 생산량 줄이기 · " + wk + "요일 한정 혜택(세트 · 리뷰 이벤트) 검토";
    }
    // 요약해서 넣기 (10/22 사장님 「월말회의는 내용을 요약해서 기재」) — 원문은 일지에 그대로 · 여기는 한 줄씩 짧게 + 집계
    var SO = soldSum(sold); if (SO) put.ag306 = SO;
    if (comp.length) {
      var ch = {}; comp.forEach(function (x) { var c = chan(x); ch[c] = (ch[c] || 0) + 1; });
      put.ag320 = String(comp.length);   // 숫자 칸(numfmt) — 글을 넣으면 숫자가 붙어 버림
      put.ag321 = comp.length + "건 = " + Object.keys(ch).sort(function (a, b) { return ch[b] - ch[a]; }).map(function (c) { return c + " " + ch[c]; }).join(" · ") + " (일지 「컴플레인」 칸 기준)" + NL + comp.map(function (x) { var sp = x.indexOf(" "); return "· " + x.slice(0, sp) + " [" + chan(x) + "] " + short(x.slice(sp + 1), 48); }).join(NL);
      var miss = comp.filter(function (x) { return /누락|빠[졌짐]|안 나감|만 나가/.test(x); }), ctips = [];
      if (miss.length >= 2) ctips.push("(제안) 누락이 " + miss.length + "번 (" + miss.map(function (x) { return x.slice(0, x.indexOf(" ")); }).join(" · ") + ") — 봉투 닫기 전 영수증 줄마다 체크 · 바쁠 땐 한 사람이 끝까지 맡기");
      var topc = Object.keys(ch).sort(function (a, b) { return ch[b] - ch[a]; })[0];
      if (topc && topc !== "기타" && ch[topc] * 2 > comp.length && comp.length >= 3) ctips.push("(제안) 컴플레인 절반 이상이 " + topc + " (" + ch[topc] + "건) — " + topc + " 주문 나가기 전 확인 순서 다시 정하기");
      if (ctips.length) put.ag321 += NL + ctips.join(NL);
    }
    if (brk.length) put.ag340 = brk.map(function (x) { var sp = x.indexOf(" "); return "· " + x.slice(0, sp) + " " + short(x.slice(sp + 1), 40); }).join(NL);
    // 폐기 · 서비스 · 직원 금액 = 가격표(cafesui.price) 판매가 × 수량 (10/22 사장님 「가격표 참고해서 알아서 매번」)
    var WV = {}, wTot = 0, wMiss = 0;
    Object.keys(W).forEach(function (c) { var v = 0; W[c].forEach(function (x) { var r = lineWon(x.slice(x.indexOf(" ") + 1)); v += r.won; if (r.miss) wMiss++; }); WV[c] = v; wTot += v; });
    var wl = [];
    if (wTot) wl.push("판매가 기준 합계 약 " + won(wTot) + " (" + [["폐기", "폐기"], ["서비스", "서비스"], ["직원", "직원 · 가족"], ["테스트", "테스트"], ["기타", "분류 안 된 것"]].filter(function (c) { return WV[c[0]]; }).map(function (c) { return c[1] + " " + won(WV[c[0]]); }).join(" · ") + ")" + NL + "└ 가격표 판매가 × 적힌 수량으로 자동 계산" + (wMiss ? " · 수량 · 품목을 못 읽은 줄 " + wMiss + "개는 빠짐" : ""));
    if (wTot) put.ag344 = wTot.toLocaleString("ko-KR");
    [["폐기", "【폐기 · 버린 것】"], ["서비스", "【서비스 · 손님 · 거래처에 나간 것】"], ["직원", "【직원 · 가족 가져감】"], ["테스트", "【테스트】"], ["기타", "【분류 안 된 것】"]].forEach(function (c) {
      var L = W[c[0]]; if (!L.length) return;
      var top = kwTop(L);
      wl.push(c[1] + " " + L.length + "건" + (WV[c[0]] ? " · 약 " + won(WV[c[0]]) : "") + (top ? " — 많이 나온 것: " + top : "") + NL + L.map(function (x) { var sp = x.indexOf(" "); return "· " + x.slice(0, sp) + " " + short(x.slice(sp + 1), 36); }).join(NL));
    });
    var lost = W["폐기"].concat(W["서비스"], W["직원"]), lt = kwTop(lost).split(" · ")[0];
    if (lt) { var lm = /^(.+) (\d+)번$/.exec(lt); if (lm && +lm[2] >= 3) wl.push("(제안) " + lm[1] + ((function (w) { var c = w.charCodeAt(w.length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 ? "이" : "가"; })(lm[1])) + " 폐기 · 서비스 · 직원으로 " + lm[2] + "번 나감 → 생산량 줄이거나 시즌 마무리 날짜 정하기"); }
    if (wl.length) put.ag341 = wl.join(NL + NL);
    if (hide.length) put.ag343 = hide.length + "건" + NL + hide.map(function (x) { var sp = x.indexOf(" "); return "· " + x.slice(0, sp) + " " + short(x.slice(sp + 1), 40); }).join(NL);
    var Q = qcSum(ym); if (Q) { put.ag360 = Q.a; if (Q.b) put.ag361 = Q.b; }
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
    var AWAY = { "휴무": 1, "휴가": 1, "반짝휴무": 1, "출장": 1, "공부": 1, "출강": 1, "서울출장": 1, "사무실 근무": 1, "수업 준비": 1, "해외출장": 1, "워크샵": 1, "세미나": 1 };
    var staff = {}, sc = J("cafesui.sched." + ym) || {};
    Object.keys(sc).forEach(function (md) { Object.keys(sc[md] || {}).forEach(function (w) { var r = sc[md][w]; if (w !== "공지" && w !== "사장님" && r && !AWAY[r]) staff[w] = 1; }); });
    if (!Object.keys(staff).length) keys.forEach(function (k) {
      var o = J(k) || {};
      [o.by, o.who].concat(Object.keys(o.bl || {}).map(function (fk) { return [].concat(o.bl[fk] || []); }).reduce(function (a, x) { return a.concat(x); }, []))
        .forEach(function (w) { w = String(w || "").replace(/님$/, "").trim(); if (/^(정항아|박혜빈|이해선)$/.test(w)) staff[w] = 1; });
    });
    var nStaff = Object.keys(staff).length;
    // 매출 = 손익 파일에서 옮긴 cafesui.sales (10/22 · 매출만) — 이번 달 · 작년 같은 달 채널별 금액 · 영업일수
    var SA = J("cafesui.sales") || {}, sNow = SA[ym], ly = (+ym.slice(0, 4) - 1) + ym.slice(4), sLy = SA[ly], mLy = J("cafesui.mtable." + ly) || {};
    var C = function (n) { return n ? Math.round(n).toLocaleString("ko-KR") : ""; };
    var SL = [];
    [[sNow, "n"], [sLy, "y"]].forEach(function (z) {
      var o = z[0], c = z[1], w = c === "n" ? "" : "작년 ";
      if (!o) return;
      SL.push(["c" + c + "1", C(o.pos), w + "포스"], ["c" + c + "2", C(o.bm), w + "배민"], ["c" + c + "7", o.dl ? "" : C(o.cp), w + "쿠팡"], ["c" + c + "3", C(o.nv), w + "네이버"], ["c" + c + "4", C(o.parcel), w + "택배"], ["c" + c + "25", o.days ? String(o.days) : "", w + "영업일수"]);
    });
    // 작년 품목 · 직원 수 · 유입은 작년 같은 달 비교표에 「이번 달」로 적어 둔 게 있으면
    // 생산량 = 생산량 파일에서 옮긴 cafesui.prod (2023-03 ~ 2026-05) — 작년 칸 · 이번 달 일지가 없을 때 이번 달 칸
    var PD = J("cafesui.prod") || {}, PM = [["10", "egg", "에그타르트"], ["11", "slice", "조각케이크"], ["12", "whole", "홀케이크"], ["13", "star", "별조각"], ["14", "bingsu", "빙수"]];
    if (PD[ly]) PM.forEach(function (x) { if (PD[ly][x[1]] != null) SL.push(["cy" + x[0], C(PD[ly][x[1]]) || "0", "작년 " + x[2]]); });
    if (PD[ym]) PM.forEach(function (x) { if (PD[ym][x[1]] != null && !iany["cn" + x[0]]) SL.push(["cn" + x[0], C(PD[ym][x[1]]) || "0", x[2] + "(생산량 파일)"]); });
    ["8", "10", "11", "12", "13", "14", "20", "21", "22", "23", "24", "26"].forEach(function (n) { if (mLy["cn" + n]) SL.push(["cy" + n, mLy["cn" + n], "작년 " + n]); });
    var memo2 = [];
    if (sNow && sNow.dl) memo2.push("이번 달 배민 = 배민+쿠팡 합친 금액");
    if (sLy && sLy.dl) memo2.push("작년 배민 = 배민+쿠팡 합친 금액");
    if (memo2.length) SL.push(["cm2", memo2.join(" · "), "배민 메모"]);
    if (sNow && sNow.note) SL.push(["cm1", "파일: " + sNow.note, "포스 메모"]); else if (sLy && sLy.note) SL.push(["cm1", "작년 파일: " + sLy.note, "포스 메모"]);
    SL.concat([["cn25", sNow && sNow.days ? "" : (opDays ? String(opDays) : ""), "영업일수"],
     ["cm5", sales.length ? "일지 합계 " + won(tot) + " (매출 적힌 " + sales.length + "일 · 일지 " + opDays + "일)" : "", "총합계(일지 합계)"],
     ["cn8", nStaff ? String(nStaff) : "", "직원 수"]].concat(IT.map(function (x) {
      return [x[0], iany[x[0]] ? isum[x[0]].toLocaleString("ko-KR") : "", x[2]];
    }))).forEach(function (x) {
      var el = document.querySelector('.cin[data-k="' + x[0] + '"]'); if (!el || !x[1]) return;
      if (el.value.trim()) { if (/^cm/.test(x[0])) return; if (el.value.replace(/,/g, "") !== x[1].replace(/,/g, "")) skipped.push({ el: el, v: x[1], n: "표 · " + x[2] }); return; }
      el.value = x[1]; el.classList.add("filled"); el.dispatchEvent(new Event("input", { bubbles: true })); filled.push(x[2]);
    });
    IT.forEach(function (x) {   // 무엇을 센 숫자인지 메모에 (비어 있을 때만)
      var m = document.querySelector('.cin[data-k="cm' + x[0].slice(2) + '"]');
      if (m && iany[x[0]] && !m.value.trim()) { m.value = /cn1[34]/.test(x[0]) ? "일지 판매 합계" : "일지 생산 합계"; m.dispatchEvent(new Event("input", { bubbles: true })); }
    });
    lastSkipped = skipped;
    var dn = new Date(), ymn = dn.getFullYear() + "-" + String(dn.getMonth() + 1).padStart(2, "0");
    filled.notice = (ym >= ymn ? "⚠ " + (+ym.slice(5)) + "월이 아직 안 끝났어요 — 지금 숫자는 오늘까지 · 말일 지나고 한 번 더 누르면 바뀐 칸을 보여 드려요. " : "") +
      (sNow ? "" : "매출 파일에 " + (+ym.slice(5)) + "월이 아직 없어요(사장님이 파일 주시면 넣음). ") + (sLy ? "" : "작년 " + (+ym.slice(5)) + "월 매출 없음. ");
    return filled;
  }
  var lastSkipped = [];
  // 맛 · 당도 체크 한 달 정리 (qc.js · cafesui.qc.<해>) — 직원별 몇 주 했는지 · 특이사항 · ⚠ 이상
  function qcSum(ym) {
    var o = J("cafesui.qc." + ym.slice(0, 4)) || {}, L = Object.keys(o).map(function (k) { return o[k]; }).filter(function (x) { return x && String(x.d || "").indexOf(ym) === 0; });
    L.sort(function (a, b) { return (a.d + a.at) < (b.d + b.at) ? -1 : 1; });
    if (!L.length && ym < "2026-10") return null;   // 당도 체크는 2026-10부터 (그 전 달은 비워 둠)
    var p = ym.split("-"), y = +p[0], m = +p[1] - 1, today = new Date(); today.setHours(0, 0, 0, 0);
    var last = new Date(y, m + 1, 0); if (last > today) last = today;
    var wk = [], d = new Date(y, m, 1); d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    for (; d <= last; d.setDate(d.getDate() + 7)) wk.push(new Date(d));
    if (!wk.length) return null;
    function wOf(s) { var q = s.split("-"), x = new Date(+q[0], +q[1] - 1, +q[2]); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.getTime(); }
    var md = function (s) { var q = s.split("-"); return (+q[1]) + "/" + (+q[2]); };
    var REQ = ["정항아", "박혜빈"], who = {};
    L.forEach(function (x) { if (x.who) (who[x.who] = who[x.who] || []).push(x); });
    Object.keys(who).forEach(function (n) { if (REQ.indexOf(n) < 0 && n !== "사장님") REQ.push(n); });
    var a = REQ.map(function (n) {
      var r = who[n] || [], ws = {}; r.forEach(function (x) { ws[wOf(x.d)] = 1; });
      var nw = wk.filter(function (w) { return ws[w.getTime()]; }).length, miss = wk.filter(function (w) { return !ws[w.getTime()]; }).map(function (w) { return md(w.getFullYear() + "-" + (w.getMonth() + 1) + "-" + w.getDate()) + "주"; });
      return n + "님 " + nw + "/" + wk.length + "주 (기록 " + r.length + "건)" + (miss.length ? " — 빠진 주: " + miss.join(", ") : " ✔");
    }).join(NL);
    var ok = L.filter(function (x) { return x.ok && !x.nt; }).length, nt = L.filter(function (x) { return x.nt; }).length, bad = L.filter(function (x) { return !x.ok; });
    a += NL + "이 달 기록 " + L.length + "건 · 👍 " + ok + " · 📝 특이사항 " + nt + " · ⚠ 이상 " + bad.length + (bad.length ? " (조치 " + bad.filter(function (x) { return x.fix; }).length + ")" : "");
    var b = L.filter(function (x) { return x.nt || !x.ok || (x.m && x.m !== "이상무"); }).map(function (x) {
      return md(x.d) + " " + (x.ok ? (x.nt ? "📝" : "👍") : "⚠") + " " + (x.who ? x.who + "님 " : "") + (x.it && x.it !== "케이크 · 과일 당도" ? "[" + x.it + "] " : "") + (x.m || "") + (x.fix ? " → 조치: " + (x.fix.m || "확인") + " (" + x.fix.by + ")" : (!x.ok ? " → 아직 조치 안 됨" : ""));
    }).join(NL);
    return { a: a, b: b };
  }
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
      if (!t) {
        box.hidden = true;
        if (!fill) { msg.textContent = ym + " 일지가 없습니다"; return; }
        var g0 = autoFill(ym); refillUI(ym, msg);
        msg.textContent = (+ym.slice(5)) + "월 일지는 없어요" + (g0 && g0.length ? " · 빈 칸 " + g0.length + "개를 매출 · 생산량 파일로 채움 (" + g0.join(", ") + ")" : " · 채울 빈 칸 없음") + (g0 && g0.notice ? " · " + g0.notice : "");
        return;
      }
      box.value = t; box.hidden = false;
      var n = (t.match(/^===== /gm) || []).length;
      var got = fill ? autoFill(ym) : null;
      var extra = got && got.length ? " · 빈 칸 " + got.length + "개를 매출 파일 · 일지 · 당도 체크로 채움 (" + got.join(", ") + ")" : (fill ? " · 빈 칸은 없음" + (lastSkipped.length ? " (이미 적힌 칸 " + lastSkipped.length + "개는 그대로 둠)" : "") : "");
      if (got && got.notice) extra += " · " + got.notice;
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
