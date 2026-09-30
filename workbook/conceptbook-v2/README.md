# 나만의 컨셉북 워크북 ver.2

「9년 차 카페 사장이 처음 공개하는 은밀한 창업 노트」(부산 청년잡 성장프로젝트, 3일 × 5교시) 워크북.

- 학생용: https://thsalswl900119-maker.github.io/cafesui-camp/v2/ (아티팩트 링크와 같은 내용)
- 강사용: https://thsalswl900119-maker.github.io/cafesui-camp/v2/teacher.html (강사 6자리 숫자)
- 보내기 중계: send.html (워크북의 「강사에게 보내기」가 새 창으로 엶)

## 다음 기수에 다시 쓰는 법
1. `src/cur.py`의 `COHORTS`에 기수를 한 줄 추가한다. `id`는 숫자 4자리(예: 2703 = 2027년 3월). 서버 명단 문서는 `명단_<id>`로 자동 분리된다.
2. 수업 내용이 바뀌면 같은 파일의 `DAYS`(일차 → 교시 → 단계)와 `EX`(예시 답)만 고친다. 입력칸 키(`k`)는 겹치지 않게.
3. `python3 src/build.py` → `src/out/`의 세 파일을 `cafesui-camp/v2/`에 복사해 푸시하고, `index.html`은 아티팩트로 다시 게시한다.
4. 강사 숫자를 바꾸려면 `TPIN=새숫자 python3 src/build.py`.
