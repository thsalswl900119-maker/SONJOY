# 핫토리 제과연수 2026 · 연수 노트 정리 안내

페이지: https://thsalswl900119-maker.github.io/SONJOY/hattori/
사장님이 레시피 사진 · 필기 · 녹음을 주면서 「연수 노트에 정리해 줘」라고 하면 이 순서대로 한다. 어느 컴퓨터(노트북 포함)에서 일하든 같다.

## 꼭 지킬 것
- **품목마다 항상 「☕ 카페스이에 접목할 것」(`cafe`)을 채운다.** 메뉴 · 시즌(겨울 딸기 등) · 선물/답례품 · 원가 · 직원 교육 쪽으로 카페스이에서 바로 해 볼 것 2~4줄. (사장님 지시 · 2026-11-25)
- 사진에서 안 읽히는 글자 · 숫자는 지어내지 말고 `(확인 필요)`라고 쓴다.
- 이미 적혀 있는 칸은 지우거나 덮지 않는다. 빈 칸만 채우고, 칸에 글이 있으면 아래에 줄을 바꿔 덧붙인다.
- 공개 페이지라 개인정보(숙소 주소 · 병원 · 약 · 카드 · 여권)는 넣지 않는다.
- 답은 한국어로만.

## 품목 키
| 키 | 품목 |
|---|---|
| dojima | 도지마 스타일 롤케이크 |
| short | 일본식 딸기 쇼트케이크 |
| cookie | 프리미엄 틴쿠키 세트 |
| caramel | 생 카라멜 |
| daifuku | 전통 모찌 · 딸기 다이후쿠 |
| madeleine | 마들렌 · 휘낭시에 |
| sando | 과일 산도 |
| pudding | 나마 푸딩 (말차 포함) |
| souffle | 수플레 치즈케이크 |

## 저장 위치와 모양
- Firestore 컬렉션 `ops`, 문서 id `hattori26.class.<품목 키>` (예: `hattori26.class.short`)
- 문서 필드: `v`(아래 JSON을 문자열로) · `by`("ht") · `t`(서버 시간) — 이 세 필드만 (규칙상 v는 20만 자 이하)
- `v` 안의 JSON:
```json
{
  "day": "1",                     // 배운 날 1·2·3일차
  "rec": {                         // 배합표 줄 (i01, i02 …)
    "i01": { "o": 1, "a": "박력분", "b": "90g", "c": "100%" },
    "i02": { "o": 2, "a": "전란", "b": "150g", "c": "" }
  },
  "steps": "한 줄에 한 단계",
  "nums": "오븐 170℃ 30분 …",
  "chef": "셰프님이 강조한 말",
  "fails": "실패 원인 → 해결",
  "ans": { "0": "예습 질문 1의 답", "1": "", "2": "", "3": "" },
  "extra": "추가 질문 · 메모",
  "cafe": "카페스이에 접목할 것",
  "ph": {}                         // 사진 목록(페이지에서 올림) — 건드리지 않기
}
```
- 쓰기 전에 문서를 먼저 읽고(있으면 그 값 위에), 바꾼 칸만 얹어서 다시 쓴다. 줄을 지울 때는 지우지 말고 `"del": true`.

## 쓰는 방법 (Firebase REST)
1. 웹 API 키는 `js/config.js`의 `FIREBASE_CONFIG.apiKey`, 프로젝트 id는 `projectId`.
2. 익명 로그인: `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<apiKey>` 본문 `{"returnSecureToken":true}` → `idToken`.
3. 읽기: `GET https://firestore.googleapis.com/v1/projects/<projectId>/databases/(default)/documents/ops/hattori26.class.<키>` (헤더 `Authorization: Bearer <idToken>`).
4. 쓰기: `PATCH` 같은 주소에 `{"fields":{"v":{"stringValue":"<JSON 문자열>"},"by":{"stringValue":"ht"},"t":{"timestampValue":"<지금 ISO 시간>"}}}`.
5. 쓴 뒤 다시 읽어서 들어갔는지 확인하고, 사장님께 품목별로 무엇을 채웠는지 · 확인 필요한 곳을 알려 드린다.

## 녹음 정리
- 녹음은 연수에 가져가는 노트북에서 받아쓴다(Whisper 등 받아쓰기 프로그램 · 일본어 셰프 + 한국어 통역이 섞임).
- 받아쓴 글을 품목별로 나눈 뒤 위 칸(`steps` · `nums` · `chef` · `fails` · `ans` · `extra` · `cafe`)에 나눠 넣는다.
- 날마다 그날 녹음을 그날 밤에 정리하는 걸 권한다.

## 배포 규칙
- 페이지를 고쳐서 올릴 때마다 맨 위 버전 표시(`id="verTag"`, 예: v1125-1)를 1씩 올린다. 날짜가 바뀌면 v<월일>-1부터.
- 저장된 내용은 절대 지우지 않는다. 줄 빼기는 `del: true` 표시만. 「💾 지금 저장 + 백업」을 누르면 전체 내용이 `hattori26.bak.<날짜-시간>.p1ofN` 문서로 한 벌 더 남고, 그 기기 localStorage(`hattori26.bak.local`)에도 남는다. 백업 문서는 지우지 않는다.
