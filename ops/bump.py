# 배포할 때마다 한 번 실행: 화면 버전(v0924-N)을 1 올리고, js·탭 파일 주소의 ?v= 도 같이 바꿔서 옛 파일이 섞이지 않게 한다.
# 버전은 화면 표시(id="verTag")에서만 읽는다 — 주석에 적힌 버전 글자를 잡으면 화면 버전이 안 올라가 새 버전 알림이 안 뜬다(10/9 사고).
# 다음 번호는 파일 안에 적힌 가장 큰 번호 + 1 (주석의 번호보다 낮아지지 않게).
import re, pathlib
p = pathlib.Path(__file__).with_name("index.html")
t = p.read_text(encoding="utf-8")
m = re.search(r'id="verTag"[^>]*>v0924-(\d+)<', t)
cur = int(m.group(1))
top = max([cur] + [int(x) for x in re.findall(r"v0924-(\d+)", t)])
old = "v0924-%d" % cur; new = "v0924-%d" % (top + 1)
t = re.sub(r'(id="verTag"[^>]*>)' + old + '<', lambda g: g.group(1) + new + "<", t)
t = t.replace("?v=" + old + '"', "?v=" + new + '"')
p.write_text(t, encoding="utf-8")
print(old, "->", new, "· ?v= 바뀐 수:", t.count("?v=" + new))
