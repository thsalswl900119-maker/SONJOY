# 배포할 때마다 한 번 실행: 화면 버전(v0924-N)을 1 올리고, js·탭 파일 주소의 ?v= 도 같이 바꿔서 옛 파일이 섞이지 않게 한다.
import re, pathlib
p = pathlib.Path(__file__).with_name("index.html")
t = p.read_text(encoding="utf-8")
m = re.search(r"v0924-(\d+)", t)
old = m.group(0); new = "v0924-%d" % (int(m.group(1)) + 1)
t = t.replace(old, new)
p.write_text(t, encoding="utf-8")
print(old, "->", new)
