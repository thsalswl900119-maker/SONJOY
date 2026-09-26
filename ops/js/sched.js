(function () {
  // ── 근무표는 화면에서 만든다 ───────────────────────────────────
  // 해가 바뀌어도 알아서 이어지도록, 로테이션 규칙만 넣고 그때그때 그린다.
  var EPOCH = new Date(2026, 8, 28);            // 로테이션 기준 월요일
  var OFFROT = [ {s:1,h:3}, {s:2,h:4}, {s:3,h:5}, {s:4,h:1}, {s:5,h:2} ];
  var MINJI = "사장님", HANGA = "정항아", HAESUN = "이해선", HYEBIN = "박혜빈";
  var STAFF4 = [HANGA, HYEBIN, HAESUN, MINJI];
  var WCOL = { "정항아":"p1", "박혜빈":"p2", "이해선":"p3", "사장님":"p4" };
  var TIMEMAP = {"정항아":{"오픈":["08:30","17:30"],"마감":["10:00","19:30"]},"박혜빈":{"오픈":["08:30","18:00"],"마감":["10:00","19:30"]},"이해선":{"미들":["09:30","16:30"],"전일":["08:30","19:30"]},"사장님":{"전일(케이크+사무실근무)":["08:30","19:30"],"오픈":["08:30","17:30"],"마감":["10:00","19:30"],"반죽":[null,null]}};
  var ROLEKO = { open:"오픈", close:"마감", middle:"미들",
                 full:"전일", allday:"전일(케이크+사무실근무)", dough:"반죽" };
  var ROLECL = { open:"open", close:"close", middle:"mid",
                 full:"full", allday:"own", dough:"own" };
  var RORD = { open:0, dough:1, middle:2, full:2, allday:3, close:4 };
  var ROLEOPTS = ["휴무", "휴가", "반짝휴무", "오픈", "미들", "마감", "전일", "토요일", "반죽", "출장"];   // 직원 칸 (전일(케이크+사무실근무)은 사장님만)
  var BOSSOPTS = ["휴무", "휴가", "반짝휴무", "전일(케이크+사무실근무)", "반죽", "오픈", "마감", "토요일", "사무실 근무", "공부", "출강", "서울출장"];   // 사장님 칸
  var NOTEOPTS = ["워크샵", "월말회의", "워크샵회의", "회식", "알바생 근무"];   // 그날 전체 공지
  var WDK = ["월","화","수","목","금","토","일"];
  var HOLI = { "1-1":"신정", "3-1":"삼일절", "5-5":"어린이날", "6-6":"현충일",
               "8-15":"광복절", "10-3":"개천절", "10-9":"한글날", "12-25":"크리스마스" };

  function esc0(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;")
      .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function weekIndex(d) {
    var mon = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    return Math.floor((mon - EPOCH) / 604800000);
  }
  function monthPlan(Y, M, shift) {
    var first = new Date(Y, M - 1, 1);
    var ndays = new Date(Y, M, 0).getDate();
    var days = [];
    for (var dn = 1; dn <= ndays; dn++) {
      var d = new Date(Y, M - 1, dn);
      var wd = (d.getDay() + 6) % 7;                  // 0=월 … 6=일
      var cell = { day: dn, wd: wd, hol: HOLI[M + "-" + dn] || (window.__CS_HOL || {})[Y + "-" + String(M).padStart(2, "0") + "-" + String(dn).padStart(2, "0")] || null };
      if (wd === 6) { cell.closed = true; cell.shifts = []; cell.off = []; days.push(cell); continue; }
      var wi = weekIndex(d) + (shift || 0);   // shift: 로테이션 안 바꾸기 (0~4)
      var plan = OFFROT[((wi % 5) + 5) % 5];
      var iso = wd + 1;
      var shared = iso <= 5 && iso === plan.s;
      var hOff = iso <= 5 && iso === plan.h;
      var off = (shared ? [HANGA, HYEBIN] : []).concat(hOff ? [HAESUN] : []);
      var sh = [];
      function put(who, role) {
        var t = (TIMEMAP[who] || {})[ROLEKO[role]] || [null, null];
        sh.push({ who: who, role: role, s: t[0], e: t[1] });
      }
      if (shared) { put(HAESUN, "full"); put(MINJI, "allday"); }
      else {
        put(HANGA, (wi % 2 === 0) ? "open" : "close");
        put(HYEBIN, (wi % 2 === 0) ? "close" : "open");
        if (hOff) put(MINJI, "dough"); else put(HAESUN, "middle");
      }
      sh.sort(function (a, b) { return RORD[a.role] - RORD[b.role]; });
      cell.shifts = sh; cell.off = off;
      days.push(cell);
    }
    return { year: Y, month: M, firstWd: (first.getDay() + 6) % 7, days: days };
  }

  // 퇴근 · 내 화면에 쓸 근무 자료 — 지난달부터 1년치 (화면은 안 그린다)
  var now0 = new Date();
  window.__CS_SCHED = {};
  for (var k = -1; k < 13; k++) {
    var d0 = new Date(now0.getFullYear(), now0.getMonth() + k, 1);
    var mp = monthPlan(d0.getFullYear(), d0.getMonth() + 1);
    mp.days.forEach(function (c) {
      if (c.closed) return;
      var key = mp.year + "-" + String(mp.month).padStart(2, "0") + "-" +
                String(c.day).padStart(2, "0");
      if (key < "2026-10-01") return;   // 근무표는 2026년 10월부터
      window.__CS_SCHED[key] = c.shifts.map(function (x) {
        return { w: x.who, r: ROLEKO[x.role], c: ROLECL[x.role], s: x.s, e: x.e };
      });
    });
  }
  // 로테이션 초안 — 필요할 때 그때 만든다
  window.__CS_DRAFT = function (ym, shift) {
    var p = String(ym).split("-");
    var mp = monthPlan(+p[0], +p[1], shift || 0);
    var dr = {};
    mp.days.forEach(function (c) {
      if (c.closed) return;
      var day = {};
      c.off.forEach(function (n) { day[n] = "휴무"; });
      c.shifts.forEach(function (x) { day[x.who] = ROLEKO[x.role]; });
      dr[mp.month + "-" + c.day] = day;
    });
    return dr;
  };

  // 매니저가 저장한 근무표가 있으면 로테이션 대신 그걸 쓴다 (퇴근 칸 · 오늘 근무 띠)
  (function () {
    var T = {"정항아":{"토요일":["09:00","18:00"],"오픈":["08:30","17:30"],"마감":["10:00","19:30"]},"박혜빈":{"토요일":["09:00","18:00"],"오픈":["08:30","18:00"],"마감":["10:00","19:30"]},"이해선":{"토요일":["09:00","18:00"],"미들":["09:30","16:30"],"전일":["08:30","19:30"]},"사장님":{"토요일":["09:00","18:00"],"전일(케이크+사무실근무)":["08:30","19:30"],"오픈":["08:30","17:30"],"마감":["10:00","19:30"]}};
    var CL = { "오픈": "open", "마감": "close", "미들": "mid", "전일": "full", "토요일": "full" };
    var AWAY = { "휴무": 1, "휴가": 1, "반짝휴무": 1, "출장": 1, "공부": 1, "출강": 1, "서울출장": 1, "사무실 근무": 1 };
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf("cafesui.sched.") !== 0) continue;
        var ym = k.slice(14), data = JSON.parse(localStorage.getItem(k) || "{}");
        Object.keys(data).forEach(function (md) {
          var day = md.split("-")[1];
          var date = ym + "-" + String(day).padStart(2, "0");
          if (data[md]["공지"]) (window.__CS_NOTES = window.__CS_NOTES || {})[date] = data[md]["공지"];
          if (date < "2026-10-01") return;
          var list = [];
          Object.keys(data[md]).forEach(function (w) {
            var r = data[md][w];
            if (w === "공지" || !r || AWAY[r]) return;
            var t = (T[w] || {})[r] || [null, null];
            list.push({ w: w, r: r, c: CL[r] || "own", s: t[0], e: t[1] });
          });
          if (list.length) window.__CS_SCHED[date] = list; else delete window.__CS_SCHED[date];
        });
      }
    } catch (e) {}
  })();

  function readCal(m) {
    var out = "";
    for (var i = 0; i < m.firstWd; i++) out += '<div class="pad"></div>';
    m.days.forEach(function (c) {
      var cls = "cell" + (c.wd === 6 ? " sun" : c.wd === 5 ? " sat" : "");
      if (c.closed) {
        out += '<div class="' + cls + ' closed"><div class="dnum">' + c.day +
               '</div><div class="restday">정기휴무</div></div>';
        return;
      }
      var biz = c.wd === 5 ? '<div class="bizt">영업 10:30–17:00</div>'
              : c.hol ? '<div class="bizt hol">영업 9:30–17:00</div>'
              : '<div class="bizt">영업 9:30–18:30</div>';
      out += '<div class="' + cls + '" data-d="' + m.month + "/" + c.day +
        '" data-wd="' + WDK[c.wd] + '"><div class="dnum">' + c.day + "</div>" +
        (c.hol ? '<div class="hol">' + esc0(c.hol) + "</div>" : "") + biz +
        c.off.map(function (n) {
          return '<div class="offrow"><span class="offmark">휴무</span>' +
                 '<span class="offwho">' + esc0(n) + "</span></div>";
        }).join("") +
        c.shifts.map(function (x) {
          return '<div class="sh ' + ROLECL[x.role] + '">' +
            '<span class="who">' + esc0(x.who) + "</span>" +
            '<span class="rl">' + ROLEKO[x.role] + "</span>" +
            (x.s ? '<span class="tm">' + x.s + '<span class="dash">–</span>' + x.e + "</span>"
                 : '<span class="tm free">매장 상황 보며</span>') + "</div>";
        }).join("") + "</div>";
    });
    return out;
  }
  function editCal(m) {
    var opts = '<option value=""></option>' +
      ROLEOPTS.map(function (r) { return "<option>" + r + "</option>"; }).join("");
    var bossOpts = '<option value=""></option>' +
      BOSSOPTS.map(function (r) { return "<option>" + r + "</option>"; }).join("");
    var noteOpts = '<option value="">공지 없음</option>' +
      NOTEOPTS.map(function (r) { return "<option>" + r + "</option>"; }).join("");
    var out = "";
    for (var i = 0; i < m.firstWd; i++) out += '<div class="pad"></div>';
    m.days.forEach(function (c) {
      var cls = "cell pcell" + (c.wd === 6 ? " sun" : c.wd === 5 ? " sat" : "");
      if (c.closed) {
        out += '<div class="' + cls + ' closed"><div class="dnum">' + c.day +
               '</div><div class="restday">정기휴무</div></div>';
        return;
      }
      out += '<div class="' + cls + '" data-d="' + m.month + "-" + c.day +
        '" data-wd="' + WDK[c.wd] + '"><div class="dnum">' + c.day + "</div>" +
        (c.hol ? '<div class="hol">' + esc0(c.hol) + "</div>" : "") +
        '<div class="prow pnoterow"><span class="pn all">📣 공지</span>' +
        '<select class="pnote" data-d="' + m.month + "-" + c.day + '" aria-label="' + m.month + "월 " + c.day + '일 전체 공지">' +
        noteOpts + "</select></div>" +
        STAFF4.map(function (n) {
          return '<div class="prow"><span class="pn ' + WCOL[n] + '">' + n + "</span>" +
            '<select class="pslot" data-d="' + m.month + "-" + c.day +
            '" data-n="' + n + '" aria-label="' + n + " " + m.month + "월 " + c.day +
            '일">' + (n === "사장님" ? bossOpts : opts) + "</select></div>";
        }).join("") + '<div class="pwarn"></div></div>';
    });
    return out;
  }
  var WDHEAD = '<div class="wd">월</div><div class="wd">화</div><div class="wd">수</div>' +
    '<div class="wd">목</div><div class="wd">금</div>' +
    '<div class="wd s">토</div><div class="wd s">일</div>';

  var TY = now0.getFullYear(), TM = now0.getMonth() + 1;
  var nextD = new Date(TY, TM, 1);                 // 다음 달 = 매니저가 짜는 달
  var PLANY = nextD.getFullYear(), PLANM = nextD.getMonth() + 1;

  function monthPanel(m) {
    var biz = m.days.filter(function (c) { return !c.closed; }).length;
    var rest = m.days.length - biz;
    var key = m.year + "-" + String(m.month).padStart(2, "0");
    var id = "cm" + key;
    var isPlan = (m.year === PLANY && m.month === PLANM);
    var isNow = (m.year === TY && m.month === TM);
    var past = (m.year < TY) || (m.year === TY && m.month < TM);
    var note = isPlan ? ' · <b class="planning">아직 안 짠 달 — 매니저가 짭니다</b>'
             : isNow ? ' · <b class="planning">이번 달</b>'
             : past ? ' · <span class="guessed">지난 달</span>'
             : ' · <span class="guessed">로테이션대로 본 예상</span>';
    var reqbar = '<div class="reqbar" data-m="' + key + '">' +
      '<div class="reqhead"><b>휴무 신청</b><span>이름을 고르고 쉬고 싶은 날을 누른 뒤, ' +
      '사유를 적으세요</span><em class="reqmust">📣 휴무 신청은 매니저에게 꼭 말해 주세요</em></div><div class="reqwho">' +
      STAFF4.map(function (n) {
        return '<button type="button" class="rname" data-n="' + n +
               '" aria-pressed="false">' + n + "</button>";
      }).join("") +
      '</div><div class="reqpick">아직 고른 날이 없습니다</div><div class="reqwhys"></div>' +
      '<div class="reqact"><button type="button" class="reqcopy" disabled>신청 내용 복사하기' +
      '</button><button type="button" class="reqclear" disabled>지우기</button>' +
      '<span class="reqmsg"></span></div></div>';
    var bar = '<div class="pbar">' +
      '<button type="button" class="psave">저장</button>' +
      '<button type="button" class="pfill">로테이션대로 채우기</button>' +
      '<button type="button" class="pcopy">근무표 복사</button>' +
      '<button type="button" class="pclear">' + (isPlan ? "지우기" : "고친 것 되돌리기") +
      '</button><span class="pmsg"></span></div><div class="pcheck"></div>';
    var editwrap =
      '<div class="editwrap' + (isPlan ? " planmode" : "") + '" id="ew' + key + '" hidden>' + bar +
      '<div class="cal">' + WDHEAD + editCal(m) + "</div></div>";
    return '<div class="mpanel' + (isPlan ? " plan" : "") + '" id="' + id + '" hidden' +
      ' data-plan="' + key + '">' +
      '<div class="msub">' + m.year + "년 " + m.month + "월 · 영업 " + biz +
      "일 · 정기휴무 " + rest + "일" + note +
      '<button type="button" class="editbtn" data-k="' + key +
      '" aria-pressed="false">✎ 근무표 수정하기</button></div>' +
      reqbar +
      '<div class="cal" id="rc' + key + '">' + WDHEAD + readCal(m) + "</div>" + editwrap + "</div>";
  }

  // 해마다 바인더 한 권. 누를 때 그 해만 그린다.
  // 쓰기로 한 3년 (2026~2029) 안에서 연도를 늘어놓는다
  var Y0 = 2026, Y1 = 2029;
  var YEARS = [];
  for (var yy = Math.min(Y0, TY); yy <= Math.max(Y1, TY); yy++) YEARS.push(yy);
  var built = {};
  var wrap = document.getElementById("schedWrap");
  if (!wrap) return;
  wrap.innerHTML =
    '<nav class="btabs" role="tablist" aria-label="연도 선택">' +
    YEARS.map(function (y) {
      return '<button type="button" class="btab" data-y="' + y + '" aria-selected="' +
        (y === TY) + '">' + y + '년<small>' +
        (y === TY ? "올해" : y === TY - 1 ? "지난해" : y === TY + 1 ? "내년"
          : y < TY ? "지난" : "앞으로") + "</small></button>";
    }).join("") + "</nav>" +
    YEARS.map(function (y) {
      return '<div class="yearbox" id="yb' + y + '"' + (y === TY ? "" : " hidden") +
             "></div>";
    }).join("");

  function buildYear(y) {
    if (built[y]) return;
    built[y] = true;
    var box = document.getElementById("yb" + y);
    var strip = "", panels = "";
    for (var mo = 1; mo <= 12; mo++) {
      if (y === 2026 && mo < 10) continue;   // 2026년은 10월부터
      var m = monthPlan(y, mo);
      var key = y + "-" + String(mo).padStart(2, "0");
      var isPlan = (y === PLANY && mo === PLANM);
      strip += '<button type="button" class="mtab" data-m="cm' + key +
        '" aria-selected="false">' + mo + "월" +
        (isPlan ? '<i class="mdot">짜는 중</i>' : "") + "</button>";
      panels += monthPanel(m);
    }
    box.innerHTML = '<nav class="mtabs" role="tablist" aria-label="달 선택">' + strip +
                    "</nav>" + panels;
    if (window.__CS_AFTER) window.__CS_AFTER(box);
    else (window.__CS_PENDING = window.__CS_PENDING || []).push(box);
    // 그 해에서 열어둘 달
    var openKey = (y === TY) ? (y + "-" + String(y === 2026 ? Math.max(TM, 10) : TM).padStart(2, "0"))
                             : (y + "-01");
    var t = box.querySelector('.mtab[data-m="cm' + openKey + '"]') ||
            box.querySelector(".mtab");
    if (t) {
      box.querySelectorAll(".mtab").forEach(function (o) {
        var on = o === t;
        o.setAttribute("aria-selected", String(on));
        var pn = document.getElementById(o.dataset.m);
        if (pn) pn.hidden = !on;
      });
    }
  }
  window.__CS_BUILDYEAR = buildYear;
  buildYear(TY);
})();

  // 섹션 탭 — 누른 것만 보인다
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  // 자주 안 쓰는 탭은 처음 열 때만 불러온다 (첫 화면 가볍게)
  function lazyFill(el) {
    if (!el || !el.dataset.lazy || el.dataset.lazyBusy) return;
    el.dataset.lazyBusy = "1";
    var v = (document.getElementById("verTag") || {}).textContent || "";
    fetch(el.dataset.lazy + "?v=" + encodeURIComponent(v.trim()), { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(r.status); return r.text();
    }).then(function (html) {
      el.innerHTML = html; delete el.dataset.lazy;
    }).catch(function () {
      el.innerHTML = '<div class="lazyload">불러오지 못했습니다 · 인터넷 연결을 확인하고 탭을 다시 눌러 주세요</div>';
    }).then(function () { delete el.dataset.lazyBusy; });
  }
  window.__CS_LAZY = lazyFill;
  function showPanel(id) {
    var pn = document.getElementById(id); if (pn) { lazyFill(pn); if (pn.querySelectorAll) Array.prototype.forEach.call(pn.querySelectorAll("[data-lazy]"), lazyFill); }
    tabs.forEach(function (t) {
      var on = t.dataset.p === id;
      t.setAttribute("aria-selected", String(on));
      var p = document.getElementById(t.dataset.p);
      if (p) p.hidden = !on;
    });
    try { history.replaceState(null, "", "#" + id); } catch (e) {}
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showPanel(t.dataset.p); });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus(); showPanel(n.dataset.p);
    });
  });
  // 새로고침해도 보던 탭이 유지되게
  var want = (location.hash || "").replace("#", "");
  if (want && document.getElementById(want)) showPanel(want);
