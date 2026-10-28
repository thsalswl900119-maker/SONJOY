# 서버(Firestore ops 컬렉션) 읽기 · 쓰기 도우미 — 매달 과일 한도선 점검(예약 작업)에서 씀
#  · 열쇠는 js/config.js(웹에 이미 공개된 Firebase 설정)에서 읽음 · 비밀번호 · 텔레그램 열쇠는 쓰지 않음
#  · 쓰기는 반드시 put_if(updateTime 조건) — 쓰는 사이 다른 기기가 저장하면 실패 → 다시 읽고 합치기
import json, os, re, ssl, urllib.request, urllib.parse, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CFG = open(os.path.join(ROOT, "js", "config.js"), encoding="utf-8").read()
PID = re.search(r'projectId\s*:\s*"([^"]+)"', CFG).group(1)
KEY = re.search(r'apiKey\s*:\s*"([^"]+)"', CFG).group(1)
_ca = "/root/.ccr/ca-bundle.crt"
_ctx = ssl.create_default_context(cafile=_ca) if os.path.exists(_ca) else ssl.create_default_context()
_op = urllib.request.build_opener(urllib.request.HTTPSHandler(context=_ctx), urllib.request.ProxyHandler({"https": os.environ.get("HTTPS_PROXY", "")}))
BASE = "https://firestore.googleapis.com/v1/projects/%s/databases/(default)/documents/ops/" % PID


def req(url, data=None, method=None, tok=None):
    h = {"Content-Type": "application/json"}
    if tok: h["Authorization"] = "Bearer " + tok
    r = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers=h, method=method)
    try:
        with _op.open(r, timeout=60) as f: return json.load(f)
    except urllib.error.HTTPError as e:
        if e.code == 404: return None
        raise SystemExit("HTTP %s %s %s" % (e.code, url, e.read()[:300]))


def token():
    return req("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + KEY, {"returnSecureToken": True})["idToken"]


def doc(k, tok):
    """(값 글, updateTime) — 없으면 (None, None)"""
    d = req(BASE + urllib.parse.quote(k, safe=""), tok=tok)
    return (None, None) if d is None else (d["fields"].get("v", {}).get("stringValue"), d.get("updateTime"))


def get(k, tok):
    return doc(k, tok)[0]


def keys(tok, prefix):
    out, pt = [], None
    while True:
        d = req(BASE.rstrip("/") + "?pageSize=300&mask.fieldPaths=by" + ("&pageToken=" + pt if pt else ""), tok=tok) or {}
        for x in d.get("documents", []):
            n = x["name"].rsplit("/", 1)[1]
            if n.startswith(prefix): out.append(n)
        pt = d.get("nextPageToken")
        if not pt: return out


def put_if(k, v, ut, tok, by):
    """ut = 읽을 때 updateTime (없던 문서면 None) — 그 사이 바뀌었으면 SystemExit(FAILED_PRECONDITION)"""
    now = datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    cond = ("currentDocument.updateTime=" + urllib.parse.quote(ut)) if ut else "currentDocument.exists=false"
    url = BASE + urllib.parse.quote(k, safe="") + "?updateMask.fieldPaths=v&updateMask.fieldPaths=by&updateMask.fieldPaths=t&" + cond
    return req(url, {"fields": {"v": {"stringValue": v}, "by": {"stringValue": by}, "t": {"timestampValue": now}}}, method="PATCH", tok=tok)
