# 배포용 데모(체험판) 만들기 — ops/ 를 복사해 ../demo/ 를 새로 만든다.
#   · 서버(Firebase) 연결을 빼서 실제 매장 데이터에 절대 닿지 않는다 (입력은 보는 사람 브라우저에만)
#   · 직원 이름은 가칭, 거래처 · 전화번호 · 단가 · 워크샵 비용 · 평가 · 레시피성 내용은 뺀다
#   · 예시 데이터(가짜)를 처음 열 때 한 번 깔아 준다
# 사용: python3 ops/make_demo.py   (ops 를 고친 뒤 데모도 맞추고 싶을 때만)
import json, os, re, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "demo")

NAMES = [  # 긴 것부터
    ("정항아", "김하늘"), ("항팀장", "하늘팀장"), ("항팀", "하늘팀"), ("항아", "하늘"),
    ("박혜빈", "이다온"), ("혜빈", "다온"),
    ("이해선", "최서하"), ("해선", "서하"),
    ("은비", "보라"), ("손민지", "대표"), ("손조이", "대표"), ("민지", "대표"),
    ("망고사장님", "과일 거래처"), ("과일사장님", "과일 거래처"), ("미스터돌", "병조림 거래처"),
    ("서울우유", "우유 거래처"), ("미나리시트", "시트 거래처"), ("우유 밀크마스터", "우유"), ("105,000원", "○○원"),
]
HIDE_TABS = ["tp7", "tp8", "tp9", "tp13", "tp14"]   # 과일(무게) · 월말 평가(급여) · 워크샵(비용) · 제과제빵 · 독서나눔


def scrub(s):
    for a, b in NAMES:
        s = s.replace(a, b)
    s = re.sub(r"\b0\d{1,2}-\d{3,4}-\d{4}\b", "010-0000-0000", s)
    s = re.sub(r"\b1[5-6]\d\d-\d{4}\b", "1600-0000", s)
    return s


def literal_end(s, i):
    """s[i] 가 { 또는 [ 일 때, 짝이 맞는 닫는 괄호 다음 위치 (문자열 안은 건너뜀)"""
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


def read(p):
    return open(os.path.join(HERE, p), encoding="utf-8").read()


def write(p, s):
    full = os.path.join(OUT, p)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write(s)


if os.path.isdir(OUT):
    shutil.rmtree(OUT)

# ── 재고 · 발주: 거래처 · 연락처 · 단가 · 과일 무게는 예시로 바꾸고, 품목 메모(거래처 이름)는 비운다
st = read("js/stock.js")
items_m = re.search(r"var ITEMS=(\[.*?\]);\n", st)
items = json.loads(items_m.group(1))
for it in items:
    if len(it) > 4: it[4] = ""
st = st.replace(items_m.group(0), "var ITEMS=" + json.dumps(items, ensure_ascii=False) + ";\n")
st = swap_literal(st, "var REF=", json.dumps({"예시": [["품목", "단위", "주문량", "주문 시점", "거래처", "010-0000-0000", "결제"]]}, ensure_ascii=False))
st = swap_literal(st, "var SEASON=", "[]")
st = re.sub(r'(fruit: )"사장님 꿀팁[^"]*"', r'\1""', st)   # 단가 들어간 꿀팁
write("js/stock.js", scrub(st))

# ── 앱: 워크샵(일정 · 비용) 비우기 · 연간 행사는 제목만 남기기
app = read("js/app.js")
for mk in ["var SEED = ", "var MEET = ", "var REF = {"]:
    if mk.endswith("{"):
        app = swap_literal(app, mk[:-1], "{}")
    else:
        app = swap_literal(app, mk, "{}")
bm = re.search(r"var BASE = (\[.*?\]);\n", app)
base = json.loads(bm.group(1))
for b in base: b["a"] = ""
app = app.replace(bm.group(0), "var BASE = " + json.dumps(base, ensure_ascii=False) + ";\n")
write("js/app.js", scrub(app))

for f in ["sync.js", "holidays.js", "sched.js", "presence.js", "weekrep.js", "monthlog.js"]:
    write("js/" + f, scrub(read("js/" + f)))
for f in os.listdir(os.path.join(HERE, "tabs")):
    if f == "tp7.html": continue   # 과일 탭(단가 · 무게) — 숨긴 탭이라 파일도 안 올린다
    write("tabs/" + f, scrub(read("tabs/" + f)))

# ── 화면 틀: 서버 스크립트 빼기 · 숨길 탭 · 데모 표시
h = read("index.html")
h = re.sub(r'<script src="https://www\.gstatic\.com/firebasejs/[^"]+"></script>\n', "", h)
h = h.replace('<script src="../js/config.js"></script>\n', '<script src="js/demo.js"></script>\n')
h = re.sub(r"<title>[^<]*</title>", "<title>카페스이 직원 시스템 · 체험판</title>", h, count=1)
# 과일 시즌 안내(거래처 전화) 문단은 통째로 빼기
h = re.sub(r'<p class="tip"[^>]*>과일은 거의 다[^<]*</p>', "", h)
hide = ",".join('.tab[data-p="%s"]' % t for t in HIDE_TABS) + ',.sktab[data-c="sk1"],.sktab[data-c="sk2"]'
h = h.replace("</head>", "<style>" + hide + "{display:none!important}"
              ".demobar{position:sticky;top:0;z-index:60;background:#2F3A33;color:#FBF8F0;font-size:13.5px;padding:8px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}"
              ".demobar b{color:#FFE86B}.demobar button{font:inherit;font-weight:800;font-size:12.5px;padding:4px 10px;border-radius:14px;border:1px solid #FBF8F0;background:transparent;color:#FBF8F0;cursor:pointer;margin-left:auto}"
              "</style>\n</head>", 1)
h = re.sub(r"(<body[^>]*>)", r'\1<div class="demobar"><b>🧪 체험판</b> 실제 매장 데이터가 아닌 예시입니다 · 직원 이름은 가칭 · 입력한 내용은 이 기기 브라우저에만 저장됩니다<button type="button" id="demoReset">처음 상태로</button></div>', h, count=1)
# 숨긴 탭 중 내용이 화면 원본에 들어 있는 것(월말 평가 · 워크샵)은 속까지 비운다 — 소스 보기로도 안 보이게
for pid in ["tp8", "tp9"]:
    i = h.index('id="%s"' % pid)
    a0 = h.index("<section>", i) + len("<section>")
    b0 = h.index('</section></div><div class="panel"', a0)
    h = h[:a0] + h[b0:]
write("index.html", scrub(h))

# ── 예시 데이터 · 잠금 건너뛰기
write("js/demo.js", r"""// 체험판 — 처음 열면 예시 데이터를 깔고, 사장님 이름으로 바로 들어간다 (서버 연결 없음)
(function () {
  function p2(n) { return String(n).padStart(2, "0"); }
  function ymd(d) { return d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()); }
  var t = new Date(), y = new Date(t.getTime() - 864e5), T = ymd(t), Y = ymd(y);
  try {
    if (!localStorage.getItem("cafesui.me")) localStorage.setItem("cafesui.me", "사장님");
    sessionStorage.setItem("cafesui.unlocked", "1");
    if (!localStorage.getItem("cafesui.ui.demo1")) {
      var L = function (d, who, f) { var by = {}, bl = {}; Object.keys(f).forEach(function (k) { by[k] = who; bl[k] = f[k].split("\n").map(function () { return who; }); }); return JSON.stringify({ who: who, f: f, by: by, bl: bl }); };
      localStorage.setItem("cafesui.log." + T, L(T, "김하늘", {
        lf101: "36", lf102: "4", lf103: "12", lf104: "3", lf120: "6", lf123: "기본 4 · 초코 2", lf121: "10", lf122: "2", lf124: "망고 1박스 · 샤인머스캣 1박스",
        lf183: "1,000,000 (예시)", lf184: "배민 6 · 쿠팡이츠 2",
        lf154: "오전 한산 · 12시부터 포장 손님 몰림\n3시 이후 매장 손님 꾸준",
        lf152: "2:30 티라미수 소진 · 4시 기본 에그타르트 소진",
        lf162: "[폐기] 에그타르트 1 — 모양 무너짐\n[서비스] 조각케이크 1 — 단체 주문 손님께",
        lf170: "배달 음료 1잔 누락 → 사과 후 다시 보내드림",
        lf180: "내일 생크림 입고 · 오픈 때 수량 확인",
      }));
      localStorage.setItem("cafesui.stock." + Y, JSON.stringify({ date: Y, month: Y.slice(0, 7), by: "김하늘",
        stock: { "기본 시트": "4", "초코 시트": "1", "말차 시트": "2" }, orders: "초코 시트 4개", orderChecks: {}, prod: "망2 티1 초밤1", creamUse: "5" }));
      localStorage.setItem("cafesui.ui.demo1", "1");
    }
  } catch (e) {}
  document.addEventListener("click", function (e) {
    if (!e.target || e.target.id !== "demoReset") return;
    if (!confirm("체험판을 처음 상태로 되돌릴까요? (이 기기에 입력한 내용이 지워집니다)")) return;
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf("cafesui.") === 0) localStorage.removeItem(k); }); sessionStorage.clear(); } catch (er) {}
    location.reload();
  });
})();
""")

# ── 마지막 점검: 남으면 안 되는 것
bad = ["정항아", "박혜빈", "이해선", "혜빈", "항아님", "firebasejs", "config.js", "망고사장", "58,000", "서울우유", "미나리", "꿀팁 — 망고"]
leftover = []
for root, _, files in os.walk(OUT):
    for f in files:
        s = open(os.path.join(root, f), encoding="utf-8").read()
        for b in bad:
            if b in s: leftover.append((f, b))
        for m in re.finditer(r"0\d{1,2}-\d{3,4}-\d{4}", s):
            if m.group(0) != "010-0000-0000": leftover.append((f, m.group(0)))
print("demo built:", OUT, "| leftover:", leftover or "없음")
