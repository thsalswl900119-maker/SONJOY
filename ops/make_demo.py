# 배포용 체험판(뼈대) 만들기 — ops/ 를 복사해 ../demo/ 를 새로 만든다.
#   · 서버(Firebase) 연결을 빼서 실제 매장 데이터에 절대 닿지 않는다 (저장도 csdemo.* 로 따로 · 보는 사람 브라우저에만)
#   · 카페스이 고유 내용(규칙 · 품목 · 거래처 · 단가 · 로테이션 · 청소 구역 · 원칙 · 일정 · 예시 글)은 빼고 화면 틀만 남긴다
#   · 가게 이름 · 직원 · 영업시간 · 발주 묶음은 로그인 화면 「⚙ 가게 · 직원 설정」, 나머지 글자 · 칸은 「✏ 화면 고치기」로 각 매장이 정한다 (demo-src/demo.js)
# 사용: python3 ops/make_demo.py   (ops 를 고친 뒤 체험판도 맞추고 싶을 때만)
import json, os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "demo")

NAMES = [  # 직원 실명 → 안쪽 이름표(화면에는 각 매장이 정한 이름으로 보임). 긴 것부터
    ("정항아", "김하늘"), ("항팀장", "김하늘"), ("항팀", "김하늘"), ("항아", "김하늘"),
    ("박혜빈", "이다온"), ("혜빈", "이다온"),
    ("이해선", "최서하"), ("해선", "최서하"),
    ("은비", "보라"), ("손민지", "대표"), ("손조이", "대표"), ("민지", "대표"),
    ("망고사장님", "과일 거래처"), ("과일사장님", "과일 거래처"), ("미스터돌", "병조림 거래처"),
    ("카페스이", "○○카페"), ("CAFE すい", "CAFE ○○"), ("부산 3대 디저트", "매장 운영 노트"), ("명지", "○○동"),
    ("서울우유", "우유 거래처"), ("미나리시트", "시트 거래처"), ("우유 밀크마스터", "우유"), ("105,000원", "○○원"),
]
HIDE_TABS = ["tp2", "tp7", "tp8", "tp9", "tp10", "tp13", "tp14", "tp16", "tp17"]
CAFE_WORDS = re.compile(r"망고|멜론|에타|에그타르트|케이크|생크림|빙수|딸기|타르트|티라|무피|초밤|시트|과일|원두|키링|복숭아|무화과|샤인|말차|밤|토마토|우유|휘핑|세스코|오순영|보라님|다온|하늘|서하")


def iso(s):
    # 체험판은 같은 주소(github.io) 아래라 브라우저 저장소를 실제 시스템과 같이 쓴다 → 저장 이름을 따로 (csdemo.*)
    return s.replace("cafesui\\.", "csdemo\\.").replace("cafesui.", "csdemo.")


def scrub(s):
    s = iso(s)
    for a, b in NAMES:
        s = s.replace(a, b)
    s = re.sub(r"\b0\d{1,2}-\d{3,4}-\d{4}\b", "010-0000-0000", s)
    s = re.sub(r"\b1[5-6]\d\d-\d{4}\b", "1600-0000", s)
    return s


def staffize(s):
    """직원 목록이 박힌 곳을 각 매장이 정한 직원 수로 (window.__S · __CM · __MGR · __SRE — demo.js)"""
    s = s.replace('["김하늘", "이다온", "최서하", "사장님"]', '__S.concat(["사장님"])')
    s = s.replace('["김하늘", "이다온", "최서하"]', "__S.slice()")
    s = s.replace('["사장님", "김하늘", "이다온", "최서하", "다 같이"]', '["사장님"].concat(__S, ["다 같이"])')
    s = re.sub(r'\{\s*"김하늘"\s*:\s*"([a-z]*)p1"\s*,\s*"이다온"\s*:\s*"\1p2"\s*,\s*"최서하"\s*:\s*"\1p3"\s*,\s*"사장님"\s*:\s*"\1p4"\s*\}', r'__CM("\1p")', s)
    s = s.replace('["김하늘", "사장님"]', '__MGR.concat(["사장님"])').replace('["사장님", "김하늘"]', '["사장님"].concat(__MGR)')
    s = s.replace('[BOSS, "김하늘"]', "[BOSS].concat(__MGR)").replace('meR === "김하늘"', "__MGR.indexOf(meR) >= 0")
    s = s.replace("/^(김하늘|이다온|최서하)$/", "__SRE")
    return s


def literal_end(s, i):
    depth, q, k = 0, None, i
    while k < len(s):
        ch = s[k]
        if q:
            if ch == "\\": k += 2; continue
            if ch == q: q = None
        elif ch in "\"'": q = ch
        elif ch in "{[": depth += 1
        elif ch in "}]":
            depth -= 1
            if depth == 0: return k + 1
        k += 1
    raise ValueError("literal not closed")


def swap_literal(s, marker, new):
    i = s.index(marker) + len(marker)
    while s[i] in " \t": i += 1
    assert s[i] in "{[", marker
    return s[:i] + new + s[literal_end(s, i):]


def cut(s, start, end, new, keep_end=False):
    i = s.index(start); j = s.index(end, i)
    return s[:i] + new + (s[j:] if keep_end else s[j + len(end):])


def must(s, a, b):
    assert a in s, a[:60]
    return s.replace(a, b)


def div_end(h, i):
    """h[i] 가 <div 로 시작할 때 짝이 맞는 </div> 다음 위치"""
    depth = 0
    for m in re.finditer(r"<(/?)div\b[^>]*>", h[i:]):
        depth += -1 if m.group(1) else 1
        if depth == 0: return i + m.end()
    raise ValueError("div not closed")


def read(p):
    return open(os.path.join(HERE, p), encoding="utf-8").read()


def write(p, s):
    full = os.path.join(OUT, p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write(s)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)

# ── 발주: 품목 · 거래처 · 단가 비우기 · 묶음은 매장이 정한 것 · 보고는 칸 이름 그대로
st = read("js/stock.js")
st = re.sub(r"var GROUPS=\{.*?\};\n", "var GROUPS=window.__DEMO_GROUPS();\n", st, count=1)
st = re.sub(r"var ITEMS=\[.*?\];\n", "var ITEMS=[];   // 체험판: 품목은 각 매장이 직접 넣는다\n", st, count=1)
st = swap_literal(st, "var REF=", json.dumps({"예시": [["품목", "단위", "주문량", "주문 시점", "거래처", "010-0000-0000", "결제"]]}, ensure_ascii=False))
st = swap_literal(st, "var SEASON=", "[]")
st = swap_literal(st, "var TIP = ", "{}")
st = swap_literal(st, "var OPEN = ", "{}")
st = must(st, "var ADD_TOP = false;", "Object.keys(GROUPS).forEach(function (g) { OPEN[g] = 1; });\n    var ADD_TOP = true;")
st = swap_literal(st, "var GROUP_MEMO = ", "{}")
st = swap_literal(st, "var PAIR = ", "{}")
st = cut(st, 'html += "<h4>오늘 생산 · 사용</h4>', 'var mon = weekMon(cur)',
         'var DF = ["prod", "fruitUseA", "fruitUseB", "fruitUseC", "creamUse", "fruitOrder", "creamPlan"];\n'
         '      var flab = function (k) { var l = $("#sk_" + k); l = l && l.closest("label"); return l ? l.firstChild.textContent.trim() : k; };\n'
         '      html += "<h4>오늘 숫자</h4><div class=\\"kv\\">" + DF.map(function (k) { return row(esc(flab(k)), esc(v(k))); }).join("") + "</div>";\n'
         '      html += "<h4>재고</h4><div class=\\"kv\\">" + Object.keys(GROUPS).map(function (g) { return row(esc(GROUPS[g].replace(/^\\S+\\s/, "")), grp(g)); }).join("") + "</div>";\n      ', keep_end=True)
st = re.sub(r"html \+= '<div class=\"rf\"><span>이번 주 사용 <i>' .*?\n",
            "html += '<div class=\"rf\"><span>이번 주 합계 <i>' + [tA, tB, tT, tC].join(\" · \") + \"</i></span><span>○○카페 · 재고발주</span></div>\";\n", st, count=1)
i = st.index('        "■ 조각케이크 생산: "'); j = st.index('].filter(function (x) { return x !== ""; }).join(NL);', i)
st = st[:i] + ('        ["prod", "fruitUseA", "fruitUseB", "fruitUseC", "creamUse", "fruitOrder", "creamPlan"].map(function (k) { var l = $("#sk_" + k); l = l && l.closest("label"); return o[k] ? "■ " + (l ? l.firstChild.textContent.trim() : k) + ": " + o[k] : ""; }).join(NL),\n'
               '        Object.keys(GROUPS).map(function (g) { return "■ " + GROUPS[g].replace(/^\\S+\\s/, "") + ": " + grp(g); }).join(NL)') + st[j:]
st = must(st, 'w.a + "알 · " + w.b + "병" + (w.t ? " · " + w.t + "통" : "") + "</b><small>과일</small>', 'w.a + " · " + w.b + (w.t ? " · " + w.t : "") + "</b><small>사용량 ①②③</small>')
st = must(st, 'w.c + "통</b><small>생크림</small>', 'w.c + "</b><small>사용량 ④</small>')
st = st.replace("품목명 (예: 기본 시트)", "품목명")
write("js/stock.js", staffize(scrub(st)))

# ── 근무표: 카페스이 로테이션 · 시간 빼기 · 휴무 요일과 영업시간은 매장 설정 · 근무 종류는 일반적인 것만
sc = read("js/sched.js")
sc = cut(sc, "      var wi = weekIndex(d) + (shift || 0);", "      cell.shifts = sh; cell.off = off;", "      cell.shifts = []; cell.off = [];")
sc = must(sc, "      if (wd === 6) { cell.closed = true;", "      if (window.__DEMO_OFF.indexOf(wd) >= 0) { cell.closed = true;")
sc = cut(sc, "      var biz = c.wd === 5 ? '<div class=\"bizt\">영업 10:30–17:00</div>'", "              : '<div class=\"bizt\">영업 9:30–18:30</div>';",
         "      var bzh = window.__DEMO_HOURS(c.wd, c.hol), biz = bzh ? '<div class=\"bizt' + (c.hol ? \" hol\" : \"\") + '\">영업 ' + esc0(bzh) + '</div>' : \"\";")
sc = re.sub(r"var ROLEOPTS = \[.*?\];", 'var ROLEOPTS = ["휴무", "휴가", "오픈", "미들", "마감", "전일"];', sc, count=1)
sc = re.sub(r"var BOSSOPTS = \[.*?\];", 'var BOSSOPTS = ["휴무", "휴가", "오픈", "미들", "마감", "전일", "사무실 근무", "출장"];', sc, count=1)
sc = re.sub(r"var NOTEOPTS = \[.*?\];", 'var NOTEOPTS = ["회의", "회식", "행사", "대청소"];', sc, count=1)
sc = sc.replace("매장 상황 보며", "")
sc = scrub(sc)
sc = must(sc, 'var MINJI = "사장님", HANGA = "김하늘", HAESUN = "최서하", HYEBIN = "이다온";', 'var MINJI = "사장님", HANGA = __S[0], HAESUN = __S[2] || __S[0], HYEBIN = __S[1] || __S[0];')
sc = must(sc, "var STAFF4 = [HANGA, HYEBIN, HAESUN, MINJI];", "var STAFF4 = __S.concat([MINJI]);")
write("js/sched.js", staffize(sc))

# ── 앱: 워크샵 비우기 · 연간 행사는 날씨 · 계절 · 연휴 · 성수기/비수기만
app = read("js/app.js")
for mk in ["var SEED = ", "var MEET = ", "var REF = "]:
    i = app.index(mk, app.index("var SEED = ")) + len(mk)
    app = app[:i] + "{}" + app[literal_end(app, i):]
EV = [(1, 1, "신정 연휴", "holiday"), (1, 20, "비수기 — 한파 · 연초 (재고 줄이기)", "memo"), (2, 14, "발렌타인데이", "event"),
      (3, 2, "신학기 시작", "memo"), (3, 14, "화이트데이", "event"), (4, 10, "봄나들이 시즌 — 성수기 시작", "memo"),
      (5, 5, "어린이날", "holiday"), (5, 8, "어버이날", "event"), (5, 15, "스승의날", "event"), (6, 6, "현충일", "holiday"),
      (6, 25, "장마 시작 — 비 오는 날 매장 손님 감소", "memo"), (7, 20, "여름휴가 시즌 — 성수기", "memo"), (8, 15, "광복절", "holiday"),
      (8, 25, "휴가 끝 · 개학 — 비수기", "memo"), (10, 3, "개천절", "holiday"), (10, 9, "한글날", "holiday"), (10, 31, "핼러윈", "event"),
      (11, 11, "빼빼로데이", "event"), (11, 20, "수능 무렵", "memo"), (12, 24, "크리스마스 이브 — 연중 최대 성수기", "event"),
      (12, 25, "크리스마스", "holiday"), (12, 31, "연말 · 송년 모임", "event")]
app = re.sub(r"var BASE = \[.*?\];\n", "var BASE = " + json.dumps([{"id": 900 + i, "m": m, "d": d, "t": t, "a": "", "c": c} for i, (m, d, t, c) in enumerate(EV)], ensure_ascii=False) + ";\n", app, count=1)
WEA = {"1": ["한파", "비수기 · 매장 방문이 줄고 배달 · 포장 비중이 올라간다."], "2": ["늦추위", "설 연휴 · 발렌타인 예약."], "3": ["풀리기 시작", "신학기 · 화이트데이. 봄 메뉴 준비."],
       "4": ["따뜻해짐", "나들이 손님 증가 — 성수기 시작."], "5": ["더워지기 시작", "가정의 달 성수기 — 기념일 예약이 몰린다."], "6": ["장마", "비 오는 날 매장 손님 감소 — 배달 대비."],
       "7": ["본격 더위", "여름 성수기 · 휴가철."], "8": ["폭염", "휴가 피크 후 개학 무렵부터 비수기."], "9": ["한풀 꺾임", "추석 연휴 · 선물 수요."],
       "10": ["선선함", "가을 나들이 · 연휴가 많은 달."], "11": ["쌀쌀해짐", "수능 · 연말 준비 — 크리스마스 예약 오픈 시기."], "12": ["추위", "연중 최대 성수기 — 크리스마스 · 연말 모임."]}
app = re.sub(r"var WEA = \{.*?\};\n", "var WEA = " + json.dumps(WEA, ensure_ascii=False) + ";\n", app, count=1)
app = app.replace("매장 상황 보며", "")
app = scrub(app)
i = app.index("if (!plan && wd0 !== 0) plan = ") + len("if (!plan && wd0 !== 0) plan = ")
app = app[:i] + "__S.map(function (w) { return { w: w, r: \"\", s: null, e: null }; })" + app[literal_end(app, i):]
app = must(app, "if (!plan && wd0 !== 0) plan = ", "if ((!plan || !plan.length) && window.__DEMO_OFF.indexOf((wd0 + 6) % 7) < 0) plan = ")
app = cut(app, '        if (!plan.some(function (x) { return x.w === "최서하"; })) {', '        }\n', "")
app = re.sub(r'var ROLES = \["오픈", "미들", "마감", "전일", [^\]]*\];', 'var ROLES = ["오픈", "미들", "마감", "전일"];', app, count=1)
app = app.replace("일요일 정기휴무입니다", "정기휴무입니다")
write("js/app.js", staffize(app))

hd = scrub(read("js/holidays.js"))
hd = cut(hd, '      if (wd === 0) return "정기휴무";', '      return "9:30–18:30";',
         '      var w2 = (wd + 6) % 7; if (window.__DEMO_OFF.indexOf(w2) >= 0) return "정기휴무";\n      return window.__DEMO_HOURS(w2, hol) || "";')
write("js/holidays.js", staffize(hd))
for f in ["sync.js", "presence.js", "weekrep.js", "monthlog.js"]:
    write("js/" + f, staffize(scrub(read("js/" + f))))
for f in os.listdir(os.path.join(HERE, "tabs")):
    if f in ("tp7.html", "tp10.html", "tp11.html"): continue
    write("tabs/" + f, scrub(read("tabs/" + f)))
write("tabs/tp11.html", open(os.path.join(HERE, "demo-src", "tp11.html"), encoding="utf-8").read())
write("js/demo.js", iso(open(os.path.join(HERE, "demo-src", "demo.js"), encoding="utf-8").read()))

# ── 화면 틀
h = read("index.html")
h = re.sub(r'<script src="https://www\.gstatic\.com/firebasejs/[^"]+"></script>\n', "", h)
h = h.replace('<script src="../js/config.js"></script>\n', '<script src="js/demo.js"></script>\n')
h = re.sub(r"<title>[^<]*</title>", "<title>○○카페 매장 운영 · 체험판</title>", h, count=1)
TABS = [("tp0", "퇴근"), ("tp1", "근무"), ("tp4", "일지"), ("tp12", "발주")]
TABS2 = [("tp5", "회의"), ("tp3", "청소·정비"), ("tp6", "연간행사"), ("tp11", "사용법")]
btn = lambda p, t, sel: '<button type="button" class="tab" role="tab" data-p="%s" aria-controls="%s" aria-selected="%s">%s</button>' % (p, p, sel, t)
nav0 = h.index('<nav class="tabs"'); nav1 = h.index("</nav>", nav0) + len("</nav>")
h = h[:nav0] + '<nav class="tabs" role="tablist" aria-label="화면 선택"><span class="tabgrp">' + \
    "".join(btn(p, t, "true" if p == "tp0" else "false") for p, t in TABS) + "</span>" + \
    "".join(btn(p, t, "false") for p, t in TABS2) + "</nav>" + h[nav1:]
# 숨긴 탭 중 내용이 화면 원본에 들어 있는 것은 속까지 비운다
for pid in ["tp2", "tp8", "tp9"]:
    i = h.index('id="%s"' % pid)
    a0 = h.index(">", h.index("<section", i)) + 1
    b0 = h.index('</section></div><div class="panel"', a0)
    h = h[:a0] + h[b0:]
# 규칙 · 중요사항 박스(카페스이 규칙)는 전부 빼기
while True:
    m = re.search(r'<div class="tnotice[^"]*"', h)
    if not m: break
    h = h[:m.start()] + h[div_end(h, m.start()):]
h = re.sub(r'<p class="tip"[^>]*>과일은 거의 다[^<]*</p>', "", h)
# 연간행사: 「미리 챙기기」 · 「명절 D-데이」(카페스이 계획) 묶음은 통째로 빼기 — 날씨 · 계절 · 연휴 · 성수기/비수기 달력만 남긴다
m0 = h.index('<h2>미리 챙기기</h2>'); s0 = h.rfind("<section>", 0, m0); s1 = h.index("</section>", m0) + len("</section>")
h = h[:s0] + h[s1:]
# 우리가 일하는 자세 → 빈 원칙 카드 하나
g0 = h.rfind("<div", 0, h.index('id="prinGrid"')); g1 = div_end(h, g0); gi = h.index(">", g0) + 1
h = h[:gi] + '<div class="pcard pkey"><div class="ph">우리 가게 원칙</div><ul><li class="pk">✏ 화면 고치기로 우리 가게가 지키는 것을 적어 주세요</li></ul></div></div>' + h[g1:]
# 청소 · 정비 표: 각 표에 빈 구역 한 줄만 (✏ 화면 고치기로 넣고 빼기)
for n in range(2):
    t0 = [m.start() for m in re.finditer(r'<table class="zt">', h)][n]
    b0 = h.index("<tbody>", t0) + len("<tbody>"); b1 = h.index("</tbody>", b0)
    r = re.findall(r"<tr\b.*?</tr>", h[b0:b1], re.S)[0]
    r = re.sub(r'<td class="zn">.*?</td>', '<td class="zn">' + ("구역 이름" if n == 0 else "정비 항목") + '<span class="zd">언제 · 어떻게 — ✏ 화면 고치기로 바꾸기</span></td>', r, count=1, flags=re.S)
    r = re.sub(r'aria-label="[^"]*완료"', 'aria-label="완료"', r).replace(' class="keyzone"', "")
    h = h[:b0] + r + h[b1:]


# 정비(교체 주기) 표도 빈 항목 한 줄만
t0 = h.index('<table id="mtable"'); b0 = h.index("<tbody>", t0) + len("<tbody>"); b1 = h.index("</tbody>", b0)
r = re.findall(r"<tr\b.*?</tr>", h[b0:b1], re.S)[0]
r = re.sub(r'<td class="zn">.*?</td>', '<td class="zn">교체 항목<span class="zd">주기마다 교체 — ✏ 화면 고치기로 바꾸기</span></td>', r, count=1, flags=re.S)
r = re.sub(r'aria-label="[^"]*"', 'aria-label="마지막 교체일"', r)
h = h[:b0] + r + h[b1:]
# 일지 · 발주 · 회의 칸 이름 — 업종에 상관없는 이름으로 (✏ 화면 고치기로 각자 바꿈)
def relabel(h, k, label, em=None):
    i = h.index('data-k="%s"' % k)
    s0 = h.rfind("<span>", 0, i); s1 = h.index("</span>", s0)
    h = h[:s0] + "<span>" + label + h[s1:]
    if em is not None:
        i = h.index('data-k="%s"' % k); e0 = h.rfind("<em>", 0, i)
        if e0 > s0: e1 = h.index("</em>", e0); h = h[:e0] + "<em>" + em + h[e1:]
    return h


for k, lab, em in [("lf101", "만든 것 ①", None), ("lf102", "만든 것 ②", None), ("lf103", "만든 것 ③", None),
                   ("lf104", "판매 ①", None), ("lf105", "판매 ②", None), ("lf106", "판매 ③ (선물 · 단체)", None),
                   ("lf120", "입고 ①", None), ("lf121", "입고 ②", None), ("lf122", "입고 ③", None), ("lf123", "①은 무엇", None), ("lf124", "③은 무엇", None),
                   ("lf110", "종류별 생산 목록", None), ("lf111", "오픈 때 진열한 것", None),
                   ("lf165", "오픈 때 만든 갯수", "오픈 때 1차로 만든 것"), ("lf160", "추가 생산 (시간 · 갯수)", "추가로 만들 때마다 한 줄씩"),
                   ("lf161", "남은 재고", "마감 때 남은 것"), ("lf152", "먼저 나가거나 품절된 메뉴", "시간 · 무슨 메뉴")]:
    h = relabel(h, k, lab, em)
h = h.replace("🥐 생산 갯수", "🏭 생산 갯수")
for a, b in [("오늘 조각케이크 생산<input", "오늘 생산<input"), ("과일 사용 (알)<input", "사용량 ①<input"), ("과일 사용 (병)<input", "사용량 ②<input"),
             ("과일 사용 (통)<input", "사용량 ③<input"), ("생크림 사용 (통)<input", "사용량 ④<input"), ("과일 주문·입고 예정<input", "입고 예정<input"),
             ("생크림 주문 계획<input", "주문 계획<input")]:
    h = must(h, a, b)
for a, b in [(">에그타르트</th>", ">상품 ①</th>"), (">조각케이크</th>", ">상품 ②</th>"), (">홀케이크</th>", ">상품 ③</th>"), (">별조각</th>", ">상품 ④</th>")]:
    h = h.replace(a, b)
h = re.sub(r">빙수<em>[^<]*</em></th>", ">상품 ⑤</th>", h)
# 한 줄 소개 · 휴무 안내 · 카페스이 문구
h = h.replace("늘 그 자리에서 사계절을 굽습니다", "○○소개")
h = re.sub(r'<span class="(?:tagsub|gatesub)">[^<]*</span>', "", h)
h = re.sub(r'<div class="gatequote">.*?</div>', "", h, count=1, flags=re.S)
h = re.sub(r'<div class="hnote">.*?</div>', '<div class="hnote">○○휴무안내</div>', h, count=1, flags=re.S)
for pid, sub in [("tp0", "갈 때 본인 칸의 퇴근을 누르세요"), ("tp1", "달을 누르고 「근무표 수정하기」로 짜세요"), ("tp3", "매달 담당을 정하고 다 하면 체크합니다"), ("tp5", "전 직원 참석 · 매달 마지막 날")]:
    h = re.sub(r'(id="%s"[^>]*>.*?<span class="sub">)[^<]*' % pid, r"\g<1>" + sub, h, count=1, flags=re.S)
h = re.sub(r'<span class="lock">[^<]*</span>', "", h)
h = h.replace("<span>청소 구역 <b>14구역</b> · 매달 담당자가 바뀝니다</span>", "<span>구역은 ✏ 화면 고치기로 넣고 빼세요</span>")
h = re.sub(r"<footer>.*?</footer>", "<footer>○○카페 매장 운영 노트 · 체험판 — 이 기기 브라우저에만 저장됩니다</footer>", h, count=1, flags=re.S)
# 카페스이 캐릭터 로고 → 일반 가게 그림
LOGO = "data:image/svg+xml;utf8," + "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect x='8' y='24' width='48' height='32' rx='3' fill='%23FBF8F0' stroke='%23B4661B' stroke-width='3'/><path d='M4 24 L12 10 H52 L60 24 Z' fill='%23E9C9A0' stroke='%23B4661B' stroke-width='3' stroke-linejoin='round'/><rect x='26' y='36' width='12' height='20' fill='%23B4661B'/><rect x='13' y='32' width='9' height='9' fill='%23CFE3C5'/><rect x='42' y='32' width='9' height='9' fill='%23CFE3C5'/></svg>"
h = re.sub(r'(<img class="(?:gatelogo|logo)" src=")data:image/png;base64,[^"]+"', lambda m: m.group(1) + LOGO + '"', h)
# 카페스이 예시가 든 안내 글(placeholder)은 비우기
h = re.sub(r'placeholder="([^"]*)"', lambda m: 'placeholder=""' if CAFE_WORDS.search(m.group(1)) else m.group(0), h)
# 화면 이름 바꾸기용 표시 — 직원 이름에 「님」 붙이는 부분을 각 매장이 정한 이름으로 바꿔 보여 주는 것으로
i = h.index("    var RE = /(정항아|박혜빈|이해선)(?!님)/g;")
s0 = h.rfind("<script>", 0, i); s1 = h.index("</script>", i) + len("</script>")
h = h[:s0] + """<script>
  // 체험판 — 화면에 보이는 직원 이름표 · 가게 이름을 각 매장이 정한 이름으로 (저장되는 값은 그대로)
  (function () {
    var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, TITLE: 1 };
    function fixText(t) {
      var v = t.nodeValue; if (!v || !window.__DEMO_NEEDS(v)) return;
      var p = t.parentNode; if (!p || p.nodeType !== 1) return;
      if (SKIP[p.nodeName] || (p.closest && p.closest("textarea,script,style,[contenteditable=true]"))) return;
      if (p.nodeName === "OPTION" && !p.hasAttribute("value")) p.setAttribute("value", v);
      var nv = window.__DEMO_MAPTEXT(v); if (nv !== v) t.nodeValue = nv;
    }
    function walk(root) {
      if (root.nodeType === 3) { fixText(root); return; }
      if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
      while ((n = w.nextNode())) fixText(n);
    }
    walk(document.body); document.title = window.__DEMO_MAPTEXT(document.title);
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === "characterData") fixText(m.target);
        else for (var i = 0; i < m.addedNodes.length; i++) walk(m.addedNodes[i]);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  })();
</script>""" + h[s1:]
hide = ",".join('.tab[data-p="%s"]' % t for t in HIDE_TABS) + ',.sktab[data-c="sk1"],.sktab[data-c="sk2"]'
h = h.replace("</head>", "<style>" + hide + "{display:none!important}"
              ".demobar{position:sticky;top:0;z-index:60;background:#2F3A33;color:#FBF8F0;font-size:13.5px;padding:8px 14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}"
              ".demobar b{color:#FFE86B}.demobar button{font:inherit;font-weight:800;font-size:12.5px;padding:4px 10px;border-radius:14px;border:1px solid #FBF8F0;background:transparent;color:#FBF8F0;cursor:pointer}"
              ".demobar #demoReset{margin-left:auto;opacity:.75}"
              "</style>\n</head>", 1)
h = re.sub(r"(<body[^>]*>)", r'\1<div class="demobar"><b>🧪 체험판</b> 우리 가게에 맞게 바꿔 써 보세요 · 입력한 내용은 이 기기 브라우저에만 저장됩니다<button type="button" id="demoReset">처음 상태로</button></div>', h, count=1)
# 옛 파일이 브라우저에 남아 새 기능이 안 보이는 일 막기 — 만들 때마다 주소에 새 표시
import time
BID = time.strftime("%m%d%H%M")
h = re.sub(r'(src="js/[a-z]+\.js)\?v=([^"]+)"', r'\1?v=\2-' + BID + '"', h)
h = h.replace('<script src="js/demo.js"></script>', '<script src="js/demo.js?v=' + BID + '"></script>')
h = re.sub(r'data-lazy="(tabs/[^"?]+)"', r'data-lazy="\1?v=' + BID + '"', h)
write("index.html", staffize(scrub(h)))

# ── 마지막 점검: 남으면 안 되는 것
bad = ["cafesui.", "정항아", "박혜빈", "이해선", "혜빈", "항아님", "firebasejs", "config.js", "망고사장", "58,000", "서울우유", "미나리", "꿀팁 — 망고", "카페스이", "제빙기", "그라인더", "보늬밤"]
leftover = []
for root, _, files in os.walk(OUT):
    for f in files:
        s = open(os.path.join(root, f), encoding="utf-8").read()
        for b in bad:
            if b in s: leftover.append((f, b))
        for m in re.finditer(r"0\d{1,2}-\d{3,4}-\d{4}", s):
            if m.group(0) != "010-0000-0000": leftover.append((f, m.group(0)))
print("demo built:", OUT, "| leftover:", leftover or "없음")
