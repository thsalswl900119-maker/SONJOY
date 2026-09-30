# 나만의 컨셉북 워크북 ver.2

「9년 차 카페 사장이 처음 공개하는 은밀한 창업 노트」(부산 청년잡 성장프로젝트, 3일 × 5교시) 워크북.

- 학생용: https://thsalswl900119-maker.github.io/cafesui-camp/v2/ (아티팩트 링크와 같은 내용)
- 강사용: https://thsalswl900119-maker.github.io/cafesui-camp/v2/teacher.html (강사 6자리 숫자)
- 보내기 중계: send.html (워크북의 「강사에게 보내기」가 새 창으로 엶)

## 다음 수업(새 버전)에 다시 쓰는 법 — 버전마다 링크가 따로 생깁니다
1. 이 폴더를 통째로 복사해 `conceptbook-v3`(깃허브 페이지는 `cafesui-camp/v3/`)로 둔다.
2. `src/cur.py` 맨 위에서 `VER = "3"`, `BASE = ".../cafesui-camp/v3/"`, `DATES`, `START`를 고친다. 서버 명단은 `명단_0003`으로 자동 분리된다.
3. 수업 내용이 바뀌면 같은 파일의 `DAYS`(일차 → 교시 → 단계)·`EX`(예시 답)·`DRINKS`(2일차 음료 레시피)만 고친다. 입력칸 키(`k`)는 겹치지 않게.
4. `python3 src/build.py` → `src/out/`의 `index/send/teacher.html`을 `cafesui-camp/v3/`에 복사해 푸시하고, `src/out/artifact.html`을 새 아티팩트로 게시한다(새 링크).
5. 강사 숫자를 바꾸려면 `TPIN=새숫자 python3 src/build.py`.

## 구성 (탭 8개)
1일차 컨셉과 메뉴 · 2일차 음료와 원가(베이스 5종 → 음료 10종 → 원가 → 가격·손익 → 레시피 카드) · 3일차 브랜드와 SNS · 컨셉북 · 발표 · 레시피 · 체크리스트(18단계) · 용어(111개).
교시마다 마지막에 「오늘의 한마디」(일본어·발음·뜻·여운)가 있고, 하루 마지막 교시에 「오늘 마음에 남은 한마디」 칸이 있다.

## 데이터 위치 (src/cur.py)
- `BASES` 베이스 5종 · `DRINKS` 음료 10종 (재료·양·단가·순서·팁, 단가 `"base:n"`이면 베이스 n의 1g 원가) · `CUP` 컵 원가
- `FONTS` 글씨체 후보 · `PRESF` 발표 답 칸 · `GLOSS_ADD` 용어 추가분 · 각 교시의 `"jp"` 한마디
- `src/extra.json` 체크리스트 18단계·용어 93개 (v1에서 가져옴)
