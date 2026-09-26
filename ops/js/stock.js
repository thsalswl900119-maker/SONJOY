  // ── 재고 · 발주 ─────────────────────────────────────────────
  // 운영노트(sonjoy)의 재고·발주 화면을 그대로 옮겼다. 기기별 저장(cafesui.stock.날짜).
  (function () {
    var root = document.getElementById("tp12");
    if (!root) return;
  var GROUPS={"sheet":"🍞 시트","fruit":"🥭 과일","cream":"🥛 생크림","bar":"☕ 우유·원두·휘핑","sub":"🥚 매일 쓰는 부재료","pack":"📦 포장 재료","design":"🎨 디자인 재료","etc":"🍧 빙수·기타 (4월 중순 ~ 9월 말)"};
  var ITEMS=[["sheet","기본 시트","개",2,"문자 주문 · 6개 단위 · 목요일 도착"],["sheet","초코 시트","개",1,""],["sheet","말차 시트","개",1,""],["fruit","망고 (안 익은 것)","알",null,"망고사장님 · 1박스 남으면 2박스 · 후숙 정도 요청"],["fruit","망고 (익은 것)","알",null,""],["fruit","애플망고","알",null,"6월~"],["fruit","멜론","통",1,"망고사장님 · 1박스 · 당도 체크"],["fruit","복숭아 조림","병",12,"미스터돌 · 24병 1박스 · 반박스 남으면 문자"],["fruit","체리","박스",0.5,"망고사장님 · 반박스 남으면 · 알 큰 것"],["fruit","무화과","박스",2,"쿠팡/망고사장님 · 4박스 · 2박스 남으면"],["fruit","샤인머스켓","박스",null,"망고사장님 · 당도 체크"],["fruit","골드키위","알",4,"3일 전에 미리 말하기"],["fruit","바나나","손",1,""],["fruit","딸기","통",2,"11~4월 · 망고사장님 · 매일~2일 간격"],["cream","생크림 500ml","통",4,"녹산대리점 010-4173-3859 · 20개 · 2일 전 문자 · 월정산"],["bar","우유 밀크마스터","통",3,"녹산대리점 · 전날 12시 전 문자"],["bar","우유 나100","통",3,""],["bar","원두 RR2 1kg","개",2,"러프로스터리 앱 · 4kg · 즉시결제"],["bar","원두 디카페인","개",1,""],["bar","휘핑크림 케이크용 (매일 1L)","통",2,"네이버페이 · 10개 · 2통 남으면"],["bar","휘핑크림 에타용 (앵커/라르사)","통",4,"베이킹맘 · 12~17통 · 3~4병 남으면"],["sub","난황 1L","통",4,"아이엠에그 1544-6519 · 10개 · 3~4병 남으면"],["sub","마스카포네 500g","개",2,"베이킹맘 · 5통 · 2통 남으면"],["sub","설탕 15kg","포",1,"통에 한통 가득일 때 · 2~4포"],["sub","크림치즈 1kg","통",1,"베이킹맘 · 5통 · 1통 남으면"],["sub","판버터 1kg","판",5,"네이버페이 · 10판 · 반쯤 남으면"],["sub","밀가루 (박력/강력)","포",0.5,"굿푸드몰 · 20kg · 반 남으면"],["pack","조각 상자 1개용 (케상)","개",20,"j-팩토리 · 400개"],["pack","조각 상자 2개용","개",20,"패키지팩토리 · 3~5묶음"],["pack","케이크 상자 미니","개",20,"패키지팩토리 070-8265-5664"],["pack","케이크 하판 미니","개",20,""],["pack","케이크 상자 1호","개",20,""],["pack","케이크 하판 1호","개",20,""],["pack","케이크 상자 2호","개",20,""],["pack","케이크 하판 2호","개",20,""],["pack","케이크 상자 3호","개",20,""],["pack","케이크 하판 3호","개",20,""],["pack","케이크 상자 4호","개",5,""],["pack","케이크 하판 4호","개",5,""],["pack","케이크 칼","개",20,"이룸팩 · 5세트"],["pack","케이크 초","통",1,"베이킹스타 · 5묶음"],["pack","에타 각대봉투 1개용","묶음",2,"쿠팡 · 5개"],["pack","에타 각대봉투 2개용","묶음",2,""],["pack","에타 4구 박스","개",50,"1박스 남으면 주문 · 패키지팩토리 카톡 · 1000개"],["pack","에타 6구 박스","개",50,"패키지팩토리 카톡 · 1000개"],["pack","종이가방","개",50,"패키지팩토리 · 1000개"],["etc","빙수 통단팥 3kg","통",1,"네이버페이 · 3통"],["etc","홀토마토 (토마토소스)","통",3,"푸드올마켓 · 5통 · 만든 소스 3통 남으면"],["etc","연유 5kg","통",1,"브론스코리아 · 2개 세트"],["etc","코코넛밀크 1L","병",1,"노브랜드 · 3~5병"],["etc","인절미 다이스 1kg","봉",2,"네이버페이 · 5~8봉"],["etc","인절미 가루 1kg","봉",1,"베이킹맘 · 3봉"],["etc","잉어 모나카 100개","봉",0.5,"일본 EMS · 10일 전 주문"],["etc","다크블라썸 1kg","박스",1,"네이버페이 · 2박스"],["etc","말차 빙수가루 1kg","봉",1,"쿠팡 · 2봉"],["etc","냉동망고 1kg","봉",1,"네이버페이 · 5봉"],["etc","레몬즙 1L","병",1,"베이킹맘 · 3병 · 반통 남으면"],["etc","토마토청 (만든 것)","통",0.5,"반통 남으면 담그기 · 대추토마토 대과 4~5kg · 숙성 3~4일"],["etc","빙수 백 1인용","개",20,""],["etc","빙수 백 2인용","개",20,""],["etc","패션후르츠 퓨레 1kg","봉",1,"유니오션 · 6~10봉"],["etc","더치커피","병",1,""],["etc","말차가루 (선인) 1kg","봉",0.3,"베이킹맘 · 1/3 남으면"]];
  var REF={"커피 재료":[["원두","1kg (RR2)","4kg (월 12-16kg)","원두두 어플로 주문","러프 로스터리","010-7475-1158","즉시 결제"],["우유","밀크마스터 1L","64L (월 130~175L)","전날까지 문자, 오후 12시 전","서울우유 녹산대리점","010-4173-3859","매월 1일 정산"],["테이크아웃 컵/뚜껑","아이스 16oz / 핫 10oz","1000개/박스","2~3줄 남으면 (네이버검색)","칼라컵","1644-2421","인터넷"],["빨대","버블티용 / 일반용","버블티 3200개, 일반 2500개","1봉지 남으면","칼라컵 / 네이버","1644-2421","인터넷"],["냅킨","갈색 무지","8000장/박스","2봉지 남으면","쿠팡","냅킨공장","인터넷"],["물티슈","무지 일회용","2000개/박스","2봉지 남으면","쿠팡","그린위생산업","인터넷"],["일회용 포크","플라스틱 (화이트)","2000개/박스","2팩 남으면","네이버페이","해피팩 1644-3702","인터넷"]],"디저트":[["박력분&강력분","20kg (곰표 강력 / 맥선 박력1등)","1포대","반쯤 남았을 때","네이버페이/쿠팡","굿푸드몰","인터넷"],["판버터 (앵커+칸디아)","1kg","10판","반쯤 남았을 때","네이버페이/진보람","빵수니베이킹","인터넷"],["노른자","1L","10개","3~4병 남았을 때","아이엠에그","1544-6519","인터넷 (연휴 전 미리)"],["휘핑크림 (에그타르트)","1L (앵커/라르사, 유지방 35%)","12~17통","3~4병 남았을 때","네이버페이/베이킹맘 (싼 것)","빨리 오는 곳","인터넷 (연휴 전 미리)"],["설탕","15kg (큐원/백설)","2~4포대","설탕통에 한통 가득 담겨 있을 때","네이버페이/베이킹맘/쿠팡","","인터넷 (연휴 전 미리)"],["계란","특란 30개 1판","5판","냉장고에 1~2판 남았을 때 (전화)","아재유통/식자재마트","010-4901-4949","받고 바로 송금"],["생크림","500ml","20개","2일 전 주문. 케이크 주문량 보고 3~4병 남을 때 (문자). 주 단위 주문","서울녹산대리점","010-4173-3859","월정산"],["럼/밤술/아몬드술/깔루아","1.8L 디종 화이트 럼 / 1L","3통 / 1~2병","반통 남았을 때","베이킹 트리","010-7697-0808","배송요청에 \"매번 시키는 카페스이입니다\" 쓰기"],["휘핑크림 (케이크)","1L 매일 휘핑크림 35%, 파란 뚜껑","10개","2통 남았을 때","네이버페이 (싼 것)","카페세상","인터넷"],["딸기","1kg (진주/하동)","5~10통","매일~2일 간격","망고배달사장님","010-3748-9994","전날 or 주 단위"],["망고","10~14수","2박스씩","1박스 남았을 때 (전화 후 픽업)","망고배달사장님","010-3748-9994","후숙 이슈로 꼭 주 단위 · 후숙 정도 요청 · 1박스 58,000원 넘으면 안 됨"],["무화과","500g (영암)","4박스씩","2박스 남았을 때","쿠팡/망고사장님","쿠팡 전라도청년","전날 or 주 단위"],["메론","1개","1박스씩","","망고배달사장님","010-3748-9994","주 단위 · 당도 체크 필수"],["복숭아조림 (미스터돌)","분홍백도 병조림 24병","1박스","전날 주문 (문자) · 반박스 남을 때","미스터돌","","6~8월"],["체리","1박스","제일 알 큰 것","반박스 남으면","망고배달사장님","010-3748-9994",""],["샤인머스켓","3수","1박스","들어오면 주문 (복합주문)","망고배달사장님","010-3748-9994","주 단위 · 당도 체크"],["인절미떡","1kg 인절미 다이스","5~8봉지","1~2봉지 남았을 때","네이버페이","비즈캔/엠제이커피로스터리","인터넷"],["인절미가루","1kg 대두식품 콩고물","3봉지","1봉지 남았을 때","베이킹맘","070-7101-8349","인터넷"],["팥앙금 (앙버터용)","5kg 태산 통팥","1봉지","1/3 남으면","베이킹맘","070-7101-8349","인터넷"],["가염버터","200g 페이장브레통 빨강","10개","1통 남으면","베이킹맘","070-7101-8349","인터넷"],["데코화이트","1kg 선인","1~2봉지","1/3 남으면","베이킹맘/네이버페이","070-7101-8349","인터넷"],["초코파우더","1.36kg 기라델리 스위트 그라운드","1통","1/3 남으면","베이킹맘/네이버페이","070-7101-8349","인터넷"],["다크초콜릿","2.5kg 칼리바우트 다크 커버춰","1봉지","1/3 남으면","베이킹맘/네이버페이","070-7101-8349","인터넷"],["화이트초콜릿","2.5kg 칼리바우트","1봉지","1/3 남으면","베이킹맘/네이버페이","070-7101-8349","인터넷"],["패션후르츠","1kg 냉동 퓨레 (씨 있고 다 까진 것)","6~10봉지","청병 한통 쓰고 있을 때","네이버페이","유니오션 031-527-3036","인터넷"],["냉동딸기","1kg 딜라잇가든 칠레산","5~10봉지 (5kg 묶음)","청병 한통 쓰고 있을 때","네이버페이","딜라잇가든 1577-8437","인터넷"],["피스타치오 분태","1kg 굽지 않은 것","1봉지","1/3 남으면","네이버페이","디에이푸드마켓/다반사","인터넷"],["피스타치오 가루","1kg 파피루","2~3봉지","1/3 남으면","네이버페이","엘리네찻집/커피창고","인터넷"],["파마산가루","1kg 아담스팜코리아","2봉지","1/3 남으면","베이킹맘","070-7101-8349","인터넷"],["파슬리가루","1kg 이슬나라 후레이크","1통","1/3 남으면","베이킹맘/식자재마트","070-7101-8349","인터넷"],["알옥수수","1kg 냉동 삶은 옥수수알","10봉지","2봉지 남으면","네이버페이","아지매장터 010-3059-5803","인터넷"],["크림치즈","1kg 앵커","5통","1통 남으면","베이킹맘","070-7101-8349","인터넷"],["마스카포네","500g 밀라","5통","2통 남으면","베이킹맘","070-7101-8349","인터넷"],["샤워크림","970g 덴마크","1통","1/2통 남으면","쿠팡/트레이더스","로켓배송","현장+인터넷"],["냉동감자 / 냉동대파","1kg 마당발","3봉지","싼 것으로","네이버페이","검색","인터넷"],["베이컨찹","567g 코스트코","2봉지","싼 것으로","네이버페이","검색","인터넷"],["말차가루","1kg 선인 우지말차믹스","1봉지","1/3 남으면","베이킹맘","070-7101-8349","인터넷"]],"빙수":[["연유","5kg 서강 크리밀","2개 세트","1/3 남으면","네이버페이","브론스코리아 02-1566-2975","인터넷"],["토마토소스","2.55kg 골든투스카니 필드 토마토","5통","만든 소스 3통 남으면","네이버페이","푸드올마켓 031-797-6468","인터넷"],["대추 방울토마토","2kg 1/2번과","4~5kg","토마토청 반통 남으면","망고배달사장님","010-3748-9994","제일 큰 대과로 요청"],["레몬즙","1L 선인 농축액","3통","반통 남으면","베이킹맘","070-7101-8349","인터넷"],["통옥수수","2.5kg 베트남산 냉동","5봉지","1봉지 남으면","쿠팡/네이버페이","로켓프레시","인터넷"],["빙수팥","3kg 동서 리치스","3통","1개 남으면","메가커피/네이버페이","검색","인터넷"],["잉어모나카","100개 모나카 깍지","1봉지","반봉지 남으면 (일본 EMS, 10일 전)","네이버페이","카와이라라","인터넷"],["말차빙수가루","1kg","2봉지","","쿠팡","로켓프레시","인터넷"],["다크블로썸","1kg","2박스","싼 것으로","네이버페이","검색","인터넷"],["코코넛밀크","1L 노브랜드","3~5병","싼 것으로","네이버페이","검색","인터넷"],["냉동망고","1kg","5봉지","싼 것으로","네이버페이","검색","인터넷"],["타임허브","50g 레몬타임 생잎 + 로즈마리","1봉지","1/3 남으면","네이버페이","천향허브 010-9656-8894","인터넷"]],"포장 재료":[["케이크 띠지 (조각)","8cm","1000장 (5세트)","1세트 남았을 때","네이버페이","로티","인터넷"],["케이크 띠지 (홀)","8×51cm","100장 (6세트)","1세트 남았을 때","네이버페이","구디패키지","인터넷"],["떡싸개지","1000장 22×22","5묶음","1~3묶음 남았을 때","네이버페이","착한포장 02-2279-6682","인터넷"],["에그타르트 밑지","1000장 12×12 재단 요청","3묶음","1~2묶음 남았을 때","네이버페이","올페이퍼 031-592-7250","배송요청에 재단 요청 필수"],["에그타르트 포장 봉투","100매 good given 종이봉투 소 화이트","5개","1~2묶음 남았을 때","쿠팡","로켓와우","인터넷"],["에그타르트 4구/6구 박스","1000개 (+칸막이, 깔개)","1번","30~50개 남았을 때 (카톡)","패키지팩토리","070-8265-5664","플러스친구"],["종이가방","1000개 (+종이끈)","1번","30~50개 남았을 때 (카톡)","패키지팩토리","070-8265-5664","플러스친구"],["비닐봉투 소/중/대","50장 투명 무지 24호/33호/39호","10묶음","2~3묶음 남았을 때","베이킹맘/네이버검색","070-7101-8349","인터넷"],["케이크박스 미니/1호/2호","아이보리 누드 투명 + 화이트 사각 받침","30~100개","10~20개 남았을 때","패키지팩토리","070-8265-5664","인터넷"],["조각케이크 박스 (소)","JP-3001W 12.5×7.5×8","400개씩","10~20개 남았을 때","j-팩토리","","네이버"],["조각케이크 박스 (중)","앞열림 3호 옐로우 20×13×14","3~5묶음","10~20개 남았을 때","패키지팩토리","070-8265-5664","플러스친구"],["리본끈","15mm×45m 갈색","5묶음","커팅해둔 것 한묶음 남을 때","네이버페이","리본리에 010-4451-2045","인터넷"],["생일초","100개","5묶음","1박스 남았을 때","네이버페이","베이킹스타 010-8075-3985","인터넷"],["디저트 스티커 (인쇄물 전부)","1000장","2묶음","100개 남았을 때. 인쇄 오래 걸려 마지막 통 쓸 때 주문","도도디자인","","카톡"],["케이크 칼","20개 일회용 케이크서버 투명 소","5세트","10~20개 남았을 때","네이버페이","이룸팩 1577-1851","인터넷"],["클립","500개 블루마토 128mm","4묶음","1통 남았을 때","쿠팡","로켓와우","인터넷"],["스카치 테이프","12롤 12mm 리필","1세트","1~2개 남았을 때","쿠팡","로켓와우","인터넷"]]};
  var SEASON=[["11~3월말 4월초","딸기","560g",[11,12,1,2,3,4]],["사계절","망고 & 애플망고","12수짜리 3.5개",[1,2,3,4,5,6,7,8,9,10,11,12]],["6~8월","체리","22알",[6,7,8]],["5~10월","메론","1.5kg 반통",[5,6,7,8,9,10]],["6~8월","복숭아 졸임","1병 반",[6,7,8]],["7~10월","샤인머스켓","1손 (알 약간 큰 것)",[7,8,9,10]],["8~11월","무화과 (영암)","500g",[8,9,10,11]],["6~8월","초당옥수수","반개~1개",[6,7,8]],["9~2월","고구마 (거의 안 함)","500~600g",[9,10,11,12,1,2]],["9~11월","밤 (통조림 보늬밤)","500~600g",[9,10,11]],["항상","티라미수","",[1,2,3,4,5,6,7,8,9,10,11,12]],["6~8월","말차 티라미수","",[6,7,8]],["5~6월","바나나","긴 것 3.5개",[5,6]]];

    var MGR = ["정항아", "사장님"];
    var PRE = "cafesui.stock.";
    var FIELDS = ["prod", "fruitUseA", "fruitUseB", "fruitUseC", "creamUse", "fruitOrder", "creamPlan", "report"];
    var NL = String.fromCharCode(10);
    var TIP = {
      fruit: "사장님 꿀팁 — 망고 1박스 최대 58,000원. 후숙 과일은 1~1.5박스 여유. 조림 복숭아 반박스 남으면 미리 주문. 주마다 과일 단가 체크. 파손 시 바로 A/S.",
      etc: "빙수 재료 메모 — 시즈너리 빙수는 종류에 따라 달라지니 그때그때 체크. 코코넛밀크(노브랜드) · 패션후르츠 퓨레는 웬만하면 넣기."
    };
    var OPEN = { sheet: 1, fruit: 1, cream: 1, bar: 1, sub: 1, design: 1 };
    var GROUP_MEMO = { pack: "포장 메모" };   // 묶음 아래 자유 메모 (자주 안 시키는 것)
    var DESIGN_KEY = "디자인 재료";   // 자유 메모 — 없으면 발주 넣는 디자인 재료 (데코 · 픽 · 초 · 리본 · 프린트 등)
    // 케이크 상자 · 하판은 한 줄에 같이 입력 (저장 이름은 그대로)
    var PAIR = { "케이크 상자 미니": "케이크 하판 미니", "케이크 상자 1호": "케이크 하판 1호", "케이크 상자 2호": "케이크 하판 2호", "케이크 상자 3호": "케이크 하판 3호", "케이크 상자 4호": "케이크 하판 4호" };
    var PAIRED = {}; Object.keys(PAIR).forEach(function (k) { PAIRED[PAIR[k]] = k; });

    function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
    function isMgr() { return MGR.indexOf(me()) >= 0; }
    function pad(n) { return String(n).padStart(2, "0"); }
    function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function today() { return ymd(new Date()); }
    function nowHM() { var d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
    function dow(s) { return ["일", "월", "화", "수", "목", "금", "토"][new Date(s + "T00:00:00").getDay()]; }
    function addDays(s, n) { var d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return ymd(d); }
    function weekMon(s) { var d = new Date(s + "T00:00:00"); return addDays(s, -((d.getDay() + 6) % 7)); }
    function esc(v) {
      return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
        .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    function $(s, r) { return (r || root).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); }
    function load(d) { try { var r = localStorage.getItem(PRE + d); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
    function store(d, o) { try { localStorage.setItem(PRE + d, JSON.stringify(o)); } catch (e) {} }
    function remove(d) { try { localStorage.removeItem(PRE + d); } catch (e) {} }
    function allDates() {
      var out = [];
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(PRE) === 0 && k.length === PRE.length + 10) out.push(k.slice(PRE.length));
        }
      } catch (e) {}
      return out.sort();
    }
    function customItems() { try { return JSON.parse(localStorage.getItem("cafesui.stockitems") || "[]"); } catch (e) { return []; } }
    function setCustom(a) { try { localStorage.setItem("cafesui.stockitems", JSON.stringify(a)); } catch (e) {} }
    function allItems() {
      return ITEMS.concat(customItems().map(function (c) { return [c.g, c.name, c.unit, c.re, c.memo, true]; }));
    }

    var cur = null, stock = {}, checks = {}, saveT = null;
    var dateEl = $("#skDate"), ordEl = $("#skOrders"), statusEl = $("#skStatus"), byEl = $("#skBy");

    function needs() {
      return allItems().filter(function (it) {
        var v = stock[it[1]];
        if (it[3] == null || v === "" || v == null) return false;
        var n = parseFloat(String(v).replace(/[^0-9.]/g, ""));
        return !isNaN(n) && n <= it[3];
      }).map(function (it) { return it[1]; });
    }

    // 재고 묶음
    function renderGroups() {
      var box = $("#skGroups"); box.innerHTML = "";
      var items = allItems();
      Object.keys(GROUPS).forEach(function (g) {
        var list = items.filter(function (it) { return it[0] === g; });
        var d = document.createElement("details");
        d.className = "skgrp"; d.open = !!OPEN[g]; d.dataset.g = g;
        d.innerHTML = '<summary>' + esc(GROUPS[g]) + '<span class="n"></span></summary>' +
          (TIP[g] ? '<div class="tipq">' + esc(TIP[g]) + "</div>" : "") + '<div class="skitems"></div>';
        var wrap = d.querySelector(".skitems");
        if (g === "design") {
          var dv = document.createElement("div"); dv.className = "skdesign";
          dv.innerHTML = '<p>없으면 발주 넣어야 하는 디자인 재료를 자유롭게 적어 두세요. 예) 인쇄물(스티커 · 명함 · 브로셔 · 안내 카드) · 리본끈 · 생일 픽 · 케이크 토퍼 · 식용 꽃 · 초 · 스프링클 · 프린트 시트. 적은 건 다음 날에도 그대로 넘어가고 보고에도 같이 나갑니다.</p>' +
            '<textarea class="dinp" rows="4" placeholder="예) 스티커 인쇄물 반 남음 → 발주 · 리본끈 골드 없음 · 생일 픽 10개 · 토퍼 HAPPY BIRTHDAY 3개"></textarea>';
          var ta = dv.querySelector("textarea"); ta.value = stock[DESIGN_KEY] == null ? "" : stock[DESIGN_KEY];
          ta.addEventListener("input", function () { stock[DESIGN_KEY] = ta.value; queueSave(); });
          wrap.appendChild(dv); box.appendChild(d); return;
        }
        list.forEach(function (it) {
          var name = it[1], unit = it[2], re = it[3], memo = it[4], custom = it[5];
          if (PAIRED[name]) return;   // 하판은 상자 줄에서 같이
          var val = stock[name] == null ? "" : stock[name];
          var row = document.createElement("div");
          if (PAIR[name]) {
            var name2 = PAIR[name], val2 = stock[name2] == null ? "" : stock[name2];
            var it2 = list.filter(function (x) { return x[1] === name2; })[0], re2 = it2 ? it2[3] : re;
            row.className = "skit pair";
            row.innerHTML = '<span class="nm">' + esc(name.replace("케이크 상자 ", "케이크 ")) + ' <em>상자 · 하판</em>' +
              (re != null ? "<small>" + re + unit + " 이하면 발주" + (memo ? " · " + esc(memo) : "") + "</small>" : (memo ? "<small>" + esc(memo) + "</small>" : "")) + "</span>" +
              '<span class="pr"><label>상자<input type="text" inputmode="decimal" class="skin" value="' + esc(val) + '" placeholder="수량"></label>' +
              '<label>하판<input type="text" inputmode="decimal" class="skin" value="' + esc(val2) + '" placeholder="수량"></label></span>' +
              '<span class="u">' + esc(unit) + "</span><span></span>";
            var ins = row.querySelectorAll("input");
            var paint2 = function () {
              var a = parseFloat(String(ins[0].value).replace(/[^0-9.]/g, "")), b = parseFloat(String(ins[1].value).replace(/[^0-9.]/g, ""));
              var need = (re != null && ins[0].value !== "" && !isNaN(a) && a <= re) || (re2 != null && ins[1].value !== "" && !isNaN(b) && b <= re2);
              row.classList.toggle("need", need);
            };
            paint2();
            ins[0].addEventListener("input", function () { stock[name] = ins[0].value; paint2(); renderNeed(); queueSave(); });
            ins[1].addEventListener("input", function () { stock[name2] = ins[1].value; paint2(); renderNeed(); queueSave(); });
            wrap.appendChild(row); return;
          }
          row.className = "skit";
          row.innerHTML = '<span class="nm">' + esc(name) +
            (re != null ? "<small>" + re + unit + " 이하면 발주" + (memo ? " · " + esc(memo) : "") + "</small>"
                        : (memo ? "<small>" + esc(memo) + "</small>" : "")) + "</span>" +
            '<input type="text" inputmode="decimal" class="skin" value="' + esc(val) + '" placeholder="수량">' +
            '<span class="u">' + esc(unit) + "</span>" +
            (custom && isMgr() ? '<button type="button" class="x" title="항목 삭제">×</button>' : "<span></span>");
          var inp = row.querySelector("input");
          var paint = function () {
            var v = parseFloat(String(inp.value).replace(/[^0-9.]/g, ""));
            var need = re != null && inp.value !== "" && !isNaN(v) && v <= re;
            row.classList.toggle("need", need);
          };
          paint();
          inp.addEventListener("input", function () { stock[name] = inp.value; paint(); renderNeed(); queueSave(); });
          var x = row.querySelector(".x");
          if (x) x.addEventListener("click", function () {
            if (!confirm('"' + name + '" 항목을 지울까요?')) return;
            setCustom(customItems().filter(function (c) { return c.name !== name; }));
            renderGroups();
          });
          wrap.appendChild(row);
        });
        if (GROUP_MEMO[g]) {
          var mk = GROUP_MEMO[g], mv = document.createElement("div"); mv.className = "skdesign skgmemo";
          mv.innerHTML = '<p><b>📝 ' + esc(GROUPS[g].replace(/^\S+\s/, "")) + ' 메모</b> — 자주 안 시키는 것 · 위 목록에 없는 것을 적어 두세요. 예) 리본 스티커 · 보냉백 · 아이스팩 · 드라이아이스 · 케이크 픽업 가방. 다음 날에도 넘어가고 보고에도 나갑니다.</p>' +
            '<textarea class="dinp" rows="3" placeholder="예) 보냉백 5개 남음 → 다음 주 발주 · 아이스팩 넉넉 · 드라이아이스 업체 전화"></textarea>';
          var mt = mv.querySelector("textarea"); mt.value = stock[mk] == null ? "" : stock[mk];
          mt.addEventListener("input", function () { stock[mk] = mt.value; queueSave(); });
          wrap.appendChild(mv);
        }
        box.appendChild(d);
      });
      if (isMgr()) {
        var add = document.createElement("button");
        add.type = "button"; add.className = "skbtn"; add.textContent = "+ 재고 항목 추가";
        add.addEventListener("click", function () {
          var g = prompt("묶음: sheet(시트) fruit(과일) cream(생크림) bar(우유·원두·휘핑) sub(부재료) pack(포장) etc(빙수·기타)", "etc");
          if (g === "design") return;
          if (!g || !GROUPS[g]) return;
          var name = prompt("품목명"); if (!name) return;
          var unit = prompt("단위", "개") || "개";
          var re = prompt("발주점 (이 수량 이하면 발주 표시 · 없으면 비워두기)", "");
          var memo = prompt("발주 메모 (거래처 · 주문량)", "") || "";
          var c = customItems(); c.push({ g: g, name: name, unit: unit, re: re === "" ? null : Number(re), memo: memo });
          setCustom(c); renderGroups();
        });
        box.appendChild(add);
      }
      renderNeed();
    }
    function renderNeed() {
      var n = needs();
      $("#skNeed").innerHTML = n.length
        ? '<span class="sktag red">발주점 이하 ' + n.length + "</span>" +
          n.map(function (x) { return '<button type="button" class="skadd" data-add="' + esc(x) + '">+ ' + esc(x) + "</button>"; }).join("")
        : '<span class="sktag">발주점 이하 없음</span>';
      $$("#skNeed [data-add]").forEach(function (b) {
        b.addEventListener("click", function () {
          var it = allItems().filter(function (x) { return x[1] === b.dataset.add; })[0];
          if (!it || ordEl.value.indexOf(it[1]) >= 0) return;
          ordEl.value = (ordEl.value ? ordEl.value.replace(/\n?$/, NL) : "") + it[1] + (it[4] ? " (" + it[4] + ")" : "");
          renderChecks(); queueSave();
        });
      });
      $$(".skgrp").forEach(function (d) {
        var g = d.dataset.g, cnt = 0;
        allItems().forEach(function (it) { if (it[0] === g && n.indexOf(it[1]) >= 0) cnt++; });
        var s = d.querySelector("summary .n");
        s.textContent = cnt ? "발주 " + cnt : "";
        s.classList.toggle("hot", !!cnt);
      });
    }
    function lines() { return ordEl.value.split(NL).map(function (l) { return l.trim(); }).filter(Boolean); }

    // 발주 확인 — 사장·매니저가 "확인 → 주문함" 순서로 체크. 직원은 상태만 본다
    function renderChecks() {
      var box = $("#skChecks"), ls = lines();
      $("#skOrdN").textContent = ls.length ? ls.length + "줄" : "";
      if (!ls.length) { box.innerHTML = ""; return; }
      var mgr = isMgr();
      box.innerHTML = '<ul class="skoc">' + ls.map(function (l) {
        var c = checks[l] || {};
        return '<li class="' + (c.ordered ? "dn" : "") + '"><span class="t">' + esc(l) + "<small>" +
          (c.from ? c.from.slice(5) + "부터 · " : "") +
          (c.ok ? "확인 " + esc(c.by) + " " + esc(c.at) : "") +
          (c.ordered ? " · 주문 완료 " + esc(c.oBy) + " " + esc(c.oAt) : "") + "</small></span>" +
          (mgr ? '<label><input type="checkbox" data-ok="' + esc(l) + '"' + (c.ok ? " checked" : "") + "> 확인</label>" +
                 '<label><input type="checkbox" data-ord="' + esc(l) + '"' + (c.ordered ? " checked" : "") + "> 주문함</label>"
               : (c.ordered ? '<span class="sktag">주문 완료</span>' : c.ok ? '<span class="sktag blue">확인됨</span>' : '<span class="sktag grey">대기</span>')) +
          "</li>";
      }).join("") + "</ul>";
      $$("[data-ok]", box).forEach(function (cb) {
        cb.addEventListener("change", function () {
          var c = checks[cb.dataset.ok] || (checks[cb.dataset.ok] = {});
          c.ok = cb.checked; c.by = cb.checked ? me() : ""; c.at = cb.checked ? nowHM() : "";
          if (!cb.checked) c.ordered = false;
          renderChecks(); queueSave();
        });
      });
      $$("[data-ord]", box).forEach(function (cb) {
        cb.addEventListener("change", function () {
          var c = checks[cb.dataset.ord] || (checks[cb.dataset.ord] = {});
          c.ordered = cb.checked; c.oBy = cb.checked ? me() : ""; c.oAt = cb.checked ? nowHM() : "";
          if (cb.checked && !c.ok) { c.ok = true; c.by = me(); c.at = nowHM(); }
          renderChecks(); queueSave();
        });
      });
    }

    function read() {
      var o = { date: cur, month: cur.slice(0, 7), by: byEl.textContent, stock: stock, orders: ordEl.value, orderChecks: checks };
      FIELDS.forEach(function (k) { o[k] = $("#sk_" + k).value; });
      return o;
    }
    function saveNow() {
      if (!cur) return;
      store(cur, read());
      statusEl.textContent = "자동 저장됨 " + nowHM();
      renderList(); renderWeek();
    }
    function queueSave() { statusEl.textContent = "입력 중…"; renderReport(); clearTimeout(saveT); saveT = setTimeout(saveNow, 900); }
    (window.__CS_SAVERS = window.__CS_SAVERS || []).push(function () { if (saveT) { clearTimeout(saveT); saveT = null; saveNow(); } });

    // 날짜 열기 — 없으면 가장 최근 날의 재고 숫자를 깔고, 주문 안 된 발주 줄을 넘겨받는다
    function paintHol(d) { var hb = $("#skHol"); if (!hb) return; var hv = (window.__CS_HOL || {})[d]; hb.textContent = hv ? "🇰🇷 " + hv : ""; hb.hidden = !hv; }
    function open(d) {
      paintHol(d);
      clearTimeout(saveT);
      cur = d; dateEl.value = d;
      var o = load(d);
      if (!o) {
        var prevDates = allDates().filter(function (x) { return x < d; });
        var prev = prevDates.length ? load(prevDates[prevDates.length - 1]) : null;
        o = { date: d, month: d.slice(0, 7), by: me(), stock: prev ? JSON.parse(JSON.stringify(prev.stock || {})) : {},
              creamPlan: prev ? prev.creamPlan || "" : "", orders: "", orderChecks: {} };
        if (prev) {
          var pc = prev.orderChecks || {};
          var carry = (prev.orders || "").split(NL).map(function (l) { return l.trim(); })
            .filter(function (l) { return l && !(pc[l] || {}).ordered; });
          if (carry.length) {
            o.orders = carry.join(NL);
            carry.forEach(function (l) {
              var c = {}; for (var k in (pc[l] || {})) c[k] = pc[l][k];
              c.from = c.from || prev.date; o.orderChecks[l] = c;
            });
          }
        }
        $("#skDel").hidden = true;
      } else {
        $("#skDel").hidden = !isMgr();
      }
      stock = o.stock || {}; checks = o.orderChecks || {};
      ordEl.value = o.orders || "";
      FIELDS.forEach(function (k) { $("#sk_" + k).value = o[k] == null ? "" : o[k]; });
      byEl.textContent = o.by || me();
      statusEl.textContent = load(d) ? "" : "새 날 · 어제 숫자를 깔아뒀어요";
      renderGroups(); renderChecks(); renderList(); renderWeek(); renderReport();
    }
    // 월별 기록 — 달마다 접었다 펴는 묶음. 보고 있는 달은 펼쳐 둔다
    function renderList() {
      var box = $("#skList"), all = allDates().reverse(), curM = (cur || today()).slice(0, 7);
      if (!all.length) { box.innerHTML = '<p class="tip">아직 기록이 없습니다.</p>'; return; }
      var months = [];
      all.forEach(function (d) { var m = d.slice(0, 7); if (months.indexOf(m) < 0) months.push(m); });
      var openState = {}; $$(".skmon", box).forEach(function (el) { openState[el.dataset.m] = el.open; });
      box.innerHTML = months.map(function (m) {
        var ds = all.filter(function (d) { return d.slice(0, 7) === m; });
        var lines = 0, fa = 0, fb = 0, fc = 0, cc = 0;
        ds.forEach(function (d) { var o = load(d) || {}; lines += (o.orders || "").split(NL).filter(Boolean).length; fa += Number(o.fruitUseA) || 0; fb += Number(o.fruitUseB) || 0; fc += Number(o.fruitUseC) || 0; cc += Number(o.creamUse) || 0; });
        var isOpen = (m in openState) ? openState[m] : (m === curM);
        return '<details class="skmon" data-m="' + m + '"' + (isOpen ? " open" : "") + '><summary>' + m.slice(0, 4) + "년 " + (+m.slice(5)) + "월" +
          '<span class="n">' + ds.length + "일 기록 · 발주 " + lines + "줄 · 과일 " + fa + "알 " + fb + "병" + (fc ? " " + fc + "통" : "") + " · 생크림 " + cc + "통</span></summary>" +
          '<div class="sklist">' + ds.map(function (d) {
            var o = load(d) || {};
            var ord = (o.orders || "").split(NL).filter(Boolean).join(", ");
            return '<button type="button" class="' + (d === cur ? "on" : "") + '" data-d="' + d + '"><b>' + d.slice(5) + " (" + dow(d) + ")</b>" +
              (o.by && o.by !== "노션 이관" && d >= "2026-09-25" ? "<span>" + esc(o.by) + "</span>" : "") + "<small>" + (esc(ord).slice(0, 40) || "발주 없음") + "</small></button>";
          }).join("") + "</div></details>";
      }).join("");
      $$("[data-d]", box).forEach(function (b) { b.addEventListener("click", function () { open(b.dataset.d); }); });
    }
    // 사용량 — 한 달을 주 단위로 합산해서 보여준다 (과일 알/병 · 생크림 통)
    function renderUseCal() {
      var box = $("#skUseCal"); if (!box || !cur) return;
      var ym = cur.slice(0, 7), y = +ym.slice(0, 4), m = +ym.slice(5, 7);
      $("#skUseLabel").textContent = y + "년 " + m + "월";
      var nd = new Date(y, m, 0).getDate(), curDoc = read(), curMon = weekMon(cur);
      var weeks = [], wk = null;
      for (var d = 1; d <= nd; d++) {
        var date = ym + "-" + pad(d), wd = (new Date(y, m - 1, d).getDay() + 6) % 7;
        if (!wk || wd === 0) { wk = { from: date, to: date, a: 0, b: 0, t: 0, c: 0, days: 0, mon: weekMon(date) }; weeks.push(wk); }
        wk.to = date;
        var o = (date === cur) ? curDoc : (load(date) || {});
        var a = Number(o.fruitUseA) || 0, b = Number(o.fruitUseB) || 0, tt = Number(o.fruitUseC) || 0, c = Number(o.creamUse) || 0;
        if (o.fruitUseA || o.fruitUseB || o.fruitUseC || o.creamUse) wk.days += 1;
        wk.a += a; wk.b += b; wk.t += tt; wk.c += c;
      }
      box.innerHTML = weeks.map(function (w, i) {
        var on = w.mon === curMon;
        return '<div class="skwk' + (on ? " on" : "") + '"><span class="wl">' + (i + 1) + "주<small>" + w.from.slice(5).replace("-", "/") + "~" + w.to.slice(5).replace("-", "/") + "</small></span>" +
          '<span class="wv"><b>' + w.a + "알 · " + w.b + "병" + (w.t ? " · " + w.t + "통" : "") + "</b><small>과일</small></span>" +
          '<span class="wv"><b>' + w.c + "통</b><small>생크림</small></span>" +
          '<span class="wd">' + (w.days ? w.days + "일 기록" : '<i>기록 없음</i>') + "</span></div>";
      }).join("");
    }
    function renderWeek() {
      renderUseCal();
      if (!$("#skWeekFruit")) return;
      var mon = weekMon(cur || today());
      var days = [0, 1, 2, 3, 4, 5].map(function (i) { return addDays(mon, i); });
      $("#skWeekLabel").textContent = mon.slice(5) + " ~ " + days[5].slice(5);
      var tA = 0, tB = 0, tC = 0, tT = 0;
      var f = "", c = "";
      days.forEach(function (d) {
        var o = (d === cur) ? read() : (load(d) || {});
        var a = Number(o.fruitUseA) || 0, b = Number(o.fruitUseB) || 0, cc = Number(o.creamUse) || 0;
        tA += a; tB += b; tC += cc; tT += Number(o.fruitUseC) || 0;
        f += "<div><span>" + dow(d) + "</span><b>" + ((o.fruitUseA || o.fruitUseB || o.fruitUseC) ? (o.fruitUseA || 0) + "/" + (o.fruitUseB || 0) + (o.fruitUseC ? "/" + o.fruitUseC : "") : "·") + "</b></div>";
        c += "<div><span>" + dow(d) + "</span><b>" + (o.creamUse !== "" && o.creamUse != null ? o.creamUse : "·") + "</b></div>";
      });
      $("#skWeekFruit").innerHTML = f + '<div class="tot"><span>합계</span><b>' + tA + "알 " + tB + "병" + (tT ? " " + tT + "통" : "") + "</b></div>";
      $("#skWeekCream").innerHTML = c + '<div class="tot"><span>합계</span><b>' + tC + "</b></div>";
    }


    // 왼쪽 한 장 보고서 — 적는 대로 바로 정리된다 (보내기 글과 같은 내용)
    function renderReport() {
      var box = $("#skReport"); if (!box || !cur) return;
      var o = read(), n = needs(), ls = lines();
      var v = function (k) { return $("#sk_" + k).value.trim(); };
      var grp = function (g) {
        return allItems().filter(function (it) { return it[0] === g && stock[it[1]] !== "" && stock[it[1]] != null; })
          .map(function (it) { return esc(it[1]) + ' <b class="num">' + esc(stock[it[1]]) + esc(it[2]) + "</b>"; }).join(" · ");
      };
      var em = '<span class="empty">아직 없음</span>';
      var row = function (k, val, num) { return "<span>" + k + "</span><b" + (num ? ' class="num"' : "") + ">" + (val || em) + "</b>"; };
      var ordN = ls.filter(function (l) { return (checks[l] || {}).ordered; }).length;
      var okN = ls.filter(function (l) { var c = checks[l] || {}; return c.ok && !c.ordered; }).length;
      var html = '<div class="rt">발주 · 재고 보고</div>' +
        '<div class="rm"><span>' + cur + " (" + dow(cur) + ")</span><b>" + esc(byEl.textContent) + "</b></div>";
      // 발주 넣을 것 — 사장님이 바로 보고 주문하도록 맨 위에 빨간 상자 · 큰 글씨
      var waitN = ls.length - okN - ordN;
      html += '<div class="rorder' + (ls.length && waitN + okN ? " on" : "") + '"><h4>🛒 발주 넣을 것 ' + (ls.length ? "· " + ls.length + "줄" + (waitN + okN ? ' <em>주문 필요 ' + (waitN + okN) + "</em>" : " <em class=\"ok\">전부 주문 완료</em>") : "") + "</h4>";
      html += ls.length ? "<ul>" + ls.map(function (l) {
        var c = checks[l] || {};
        return '<li class="' + (c.ordered ? "dn" : "") + '"><span class="ic">' + (c.ordered ? "✅" : c.ok ? "☑" : "⬜") + "</span><span>" + esc(l) + "</span>" +
          (c.ordered ? "<small>주문 " + esc(c.oBy) + "</small>" : c.ok ? "<small>확인 " + esc(c.by) + "</small>" : "<small>대기</small>") + "</li>";
      }).join("") + "</ul>" +
        (ls.length ? '<div class="kv" style="margin-top:3px"><span>진행</span><b>대기 ' + (ls.length - okN - ordN) + " · 확인 " + okN + " · 주문 완료 " + ordN + "</b></div>" : "")
        : em;
      if (n.length) html += '<div class="warn">발주점 이하 ' + n.length + ": " + esc(n.join(", ")) + "</div>";
      html += "</div>";
      html += "<h4>총괄 보고 · 특이사항</h4>" + (v("report") ? esc(v("report")).replace(/\n/g, "<br>") : em);
      html += "<h4>오늘 생산 · 사용</h4><div class=\"kv\">" +
        row("조각케이크", esc(v("prod"))) +
        row("과일 사용", (v("fruitUseA") || v("fruitUseB") || v("fruitUseC")) ? (v("fruitUseA") || 0) + "알 / " + (v("fruitUseB") || 0) + "병" + (v("fruitUseC") ? " / " + v("fruitUseC") + "통" : "") : "", true) +
        row("생크림 사용", v("creamUse") ? v("creamUse") + "통" : "", true) +
        row("과일 주문·입고", esc(v("fruitOrder"))) +
        row("생크림 계획", esc(v("creamPlan"))) + "</div>";
      html += "<h4>재고</h4><div class=\"kv\">" +
        row("시트", grp("sheet")) + row("과일", grp("fruit")) + row("생크림", grp("cream")) +
        row("우유·원두·휘핑", grp("bar")) + row("부재료", grp("sub")) + row("포장", grp("pack") + (stock["포장 메모"] ? (grp("pack") ? " · " : "") + "<i>메모: " + esc(stock["포장 메모"]).replace(/\n/g, " / ") + "</i>" : "")) + row("디자인 재료", esc(stock[DESIGN_KEY] || "").replace(/\n/g, "<br>")) + row("빙수·기타", grp("etc")) + "</div>";
      var mon = weekMon(cur), tA = 0, tB = 0, tC = 0, tT = 0;
      [0, 1, 2, 3, 4, 5].forEach(function (i) {
        var d = addDays(mon, i); var w = (d === cur) ? o : (load(d) || {});
        tA += Number(w.fruitUseA) || 0; tB += Number(w.fruitUseB) || 0; tT += Number(w.fruitUseC) || 0; tC += Number(w.creamUse) || 0;
      });
      html += '<div class="rf"><span>이번 주 사용 <i>' + tA + "알 " + tB + "병" + (tT ? " " + tT + "통" : "") + " · 생크림 " + tC + "통</i></span><span>카페스이 · 재고발주</span></div>";
      box.innerHTML = html;
      renderUseCal();
    }
    // 보내기 — 텔레그램방에 붙여 넣는 글
    function buildText() {
      var o = read(), n = needs();
      var grp = function (g) {
        return allItems().filter(function (it) { return it[0] === g && stock[it[1]] !== "" && stock[it[1]] != null; })
          .map(function (it) { return it[1] + " " + stock[it[1]] + it[2]; }).join(", ") || "-";
      };
      var ord = lines().map(function (l) { var c = checks[l] || {}; return (c.ordered ? "✅ " : c.ok ? "☑ " : "⬜ ") + l; }).join(NL);
      var t = ["[발주·재고 체크] " + o.date + " (" + dow(o.date) + ") " + (o.by || ""),
        "■ 발주 넣을 것 (⬜대기 ☑확인 ✅주문완료)", ord || "-",
        n.length ? "(발주점 이하: " + n.join(", ") + ")" : "",
        "■ 특이사항", o.report || "-",
        "■ 조각케이크 생산: " + (o.prod || "-"),
        "■ 시트: " + grp("sheet"),
        "■ 과일 사용 " + (o.fruitUseA || 0) + "알 / " + (o.fruitUseB || 0) + "병" + (o.fruitUseC ? " / " + o.fruitUseC + "통" : "") + " · 재고: " + grp("fruit"),
        "  주문: " + (o.fruitOrder || "-"),
        "■ 생크림 사용 " + (o.creamUse || 0) + "통 · 재고 " + grp("cream") + " · " + (o.creamPlan || ""),
        "■ 우유·원두·휘핑: " + grp("bar"),
        "■ 부재료: " + grp("sub"),
        stock["포장 메모"] ? "■ 포장 메모: " + String(stock["포장 메모"]).replace(/\n+/g, " / ") : "",
        stock[DESIGN_KEY] ? "■ 디자인 재료: " + String(stock[DESIGN_KEY]).replace(/\n+/g, " / ") : ""].filter(function (x) { return x !== ""; }).join(NL);
      return t;
    }
    function sendText() {
      saveNow();
      var t = buildText();
      var done = function () { statusEl.textContent = "복사됐습니다 · 텔레그램방에 붙여 넣으세요"; };
      if (navigator.share) { navigator.share({ text: t }).then(done, function () { copy(t, done); }); return; }
      copy(t, done);
    }
    // 보고를 그림 파일로 — 글자를 캔버스에 직접 그려서 어떤 기기에서도 똑같이 나온다
    function reportImage() {
      saveNow();
      var lines = buildText().split(NL);
      var W = 1080, PAD = 56, LH = 46, FONT = "'Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif";
      var cv = document.createElement("canvas"), cx = cv.getContext("2d");
      function wrap(s, font, max) {
        cx.font = font; var out = [], cur = "";
        s.split(" ").forEach(function (w) {
          var test = cur ? cur + " " + w : w;
          if (cx.measureText(test).width <= max) { cur = test; return; }
          if (cur) out.push(cur);
          cur = "";
          for (var i = 0; i < w.length; i++) { var t2 = cur + w[i]; if (cx.measureText(t2).width > max && cur) { out.push(cur); cur = w[i]; } else cur = t2; }
        });
        if (cur) out.push(cur); return out.length ? out : [""];
      }
      var rows = [];
      lines.forEach(function (l, i) {
        var head = i === 0, sec = /^■/.test(l), sub = /^\s+주문:/.test(l), ordL = /^[⬜☑✅]/.test(l);
        var font = head ? "900 40px " + FONT : sec ? "800 30px " + FONT : ordL && !/^✅/.test(l) ? "800 32px " + FONT : "500 27px " + FONT;
        var max = W - PAD * 2 - (sec || head ? 0 : 28);
        if (sec && rows.length) rows.push({ gap: 18 });
        wrap(l.trim(), font, max).forEach(function (s) { rows.push({ s: s, font: font, head: head, sec: sec, indent: (sec || head) ? 0 : 28, sub: sub, ord: ordL ? l.charAt(0) : "" }); });
        if (head) rows.push({ gap: 12 });
      });
      var H = PAD * 2 + rows.reduce(function (a, r) { return a + (r.gap || LH); }, 0) + 40;
      var S = 2; cv.width = W * S; cv.height = H * S; cx.scale(S, S);
      cx.fillStyle = "#FFFCF6"; cx.fillRect(0, 0, W, H);
      cx.strokeStyle = "#B4661B"; cx.lineWidth = 6; cx.strokeRect(3, 3, W - 6, H - 6);
      var y = PAD + 30;
      rows.forEach(function (r) {
        if (r.gap) { y += r.gap; return; }
        cx.font = r.font; cx.textBaseline = "alphabetic";
        if (r.ord && r.ord !== "✅") { cx.fillStyle = "#FDECEA"; cx.fillRect(PAD, y - 34, W - PAD * 2, LH); }
        cx.fillStyle = r.head ? "#8A4A00" : (r.sec && /발주 넣을 것/.test(r.s)) ? "#B3261E" : r.sec ? "#B4661B" : r.ord === "✅" ? "#8C7B6B" : r.ord ? "#B3261E" : (/^(⚠|\(발주점)/.test(r.s) ? "#B3261E" : "#2A2522");
        cx.fillText(r.s, PAD + r.indent, y);
        if (r.head) { cx.fillStyle = "#B4661B"; cx.fillRect(PAD, y + 14, W - PAD * 2, 3); }
        y += LH;
      });
      cx.font = "600 22px " + FONT; cx.fillStyle = "#8C7B6B"; cx.textAlign = "right";
      cx.fillText("카페스이 · 재고발주 " + new Date().toLocaleString("ko-KR", { hour12: false }), W - PAD, H - 26);
      var name = "발주재고_" + (cur || today()) + ".png";
      statusEl.textContent = "이미지 만드는 중…";
      cv.toBlob(function (blob) {
        if (!blob) { statusEl.textContent = "이미지를 만들지 못했습니다"; return; }
        var file = null; try { file = new File([blob], name, { type: "image/png" }); } catch (e) {}
        var done = function () { statusEl.textContent = "이미지로 저장했습니다 · 텔레그램에 올리세요"; };
        var dl = function () { var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 2000); done(); };
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: name }).then(done, dl);
        else dl();
      }, "image/png");
    }
    function copy(t, done) {
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(t).then(done, function () { fb(t, done); }); }
      else fb(t, done);
    }
    function fb(t, done) {
      var ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { statusEl.textContent = "복사가 안 됩니다"; }
      ta.remove();
    }

    // 발주 기준표 · 과일 시즌표
    function renderRef() {
      var q = ($("#skRefQ").value || "").trim().toLowerCase();
      var box = $("#skRef"); box.innerHTML = "";
      Object.keys(REF).forEach(function (g) {
        var rows = REF[g].filter(function (r) { return !q || r.join(" ").toLowerCase().indexOf(q) >= 0; });
        if (!rows.length) return;
        var d = document.createElement("details");
        d.className = "skgrp"; d.open = !!q || g === "디저트"; d.style.marginBottom = "8px";
        d.innerHTML = "<summary>" + esc(g) + '<span class="n">' + rows.length + "</span></summary>" +
          '<div class="ztable-wrap" style="border:0"><table class="skref"><thead><tr><th>품목</th><th>규격</th><th>1회 주문량</th><th>주문 시기</th><th>주문처</th><th>연락처</th><th>정산/비고</th></tr></thead><tbody>' +
          rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + esc(c) + "</td>"; }).join("") + "</tr>"; }).join("") +
          "</tbody></table></div>";
        box.appendChild(d);
      });
    }
    function renderSeason() {
      var mo = new Date().getMonth() + 1;
      $("#skSeason").innerHTML = SEASON.map(function (r) {
        var on = r[3].indexOf(mo) >= 0;
        return "<tr>" + [r[0], r[1], r[2]].map(function (c) { return '<td class="' + (on ? "now" : "") + '">' + esc(c) + "</td>"; }).join("") + "</tr>";
      }).join("");
    }

    // 묶기
    ["#skOrders"].forEach(function (s) { $(s).addEventListener("input", function () { renderChecks(); queueSave(); }); });
    FIELDS.forEach(function (k) { $("#sk_" + k).addEventListener("input", queueSave); });
    dateEl.addEventListener("change", function () { if (dateEl.value) { $("#skMonth").value = dateEl.value.slice(0, 7); open(dateEl.value); } });
    $("#skToday").addEventListener("click", function () { $("#skMonth").value = today().slice(0, 7); open(today()); });
    $("#skPrev").addEventListener("click", function () { var d = addDays(cur || today(), -1); $("#skMonth").value = d.slice(0, 7); open(d); });
    $("#skNext").addEventListener("click", function () { var d = addDays(cur || today(), 1); $("#skMonth").value = d.slice(0, 7); open(d); });
    $("#skMonth").addEventListener("change", renderList);
    if ($("#skSend")) $("#skSend").addEventListener("click", sendText);
    $("#skShot").addEventListener("click", reportImage);
    $("#skDel").addEventListener("click", function () {
      if (!cur || !confirm(cur + " 체크를 지울까요?")) return;
      remove(cur); open(cur);
    });
    $("#skRefQ").addEventListener("input", renderRef);
    // 숫자 칸(재고 수량 · 사용량)만 — 비어 있으면 0
    var zb = document.getElementById("skZero");
    if (zb) zb.addEventListener("click", function () {
      var n = 0;
      document.querySelectorAll('#tp12 input.skin[inputmode="decimal"]').forEach(function (el) {
        if (el.value.trim() || el.disabled || el.readOnly) return;
        el.value = "0"; el.dispatchEvent(new Event("input", { bubbles: true })); n++;
      });
      statusEl.textContent = n ? "빈 칸 " + n + "개에 0을 채웠습니다" : "빈 숫자 칸이 없습니다";
    });
    var tabs = $$(".sktab", document.getElementById("tp12"));
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) {
          var on = x === t; x.setAttribute("aria-selected", String(on));
          var p = document.getElementById(x.dataset.c); if (p) p.hidden = !on;
        });
      });
    });
    $("#skMonth").value = today().slice(0, 7);
    renderRef(); renderSeason();
    open(today());
  })();

  // 상단 저장 · 백업 줄 — 흩어져 있던 백업 버튼을 전부 위로 모은다 (기능은 그대로)
  (function () {
    var btns = document.getElementById("saveBtns"), row = document.getElementById("saveRow");
    if (!btns) return;
    function slim(b, cls) {
      var em = b.querySelector("em"); if (em) em.remove();
      var ic = b.querySelector("svg"); if (ic) { ic.setAttribute("class", "bkmi"); }
      b.className = "bkmini" + (cls ? " " + cls : "");
      return b;
    }
    // 꼭 필요한 세 개만 — 읽기 쉬운 문서 · 전체 내용 파일(되돌릴 때) · 파일로 되돌리기. 파일은 전부 내 컴퓨터(휴대폰)의 다운로드 폴더로 내려받는다.
    var copy = document.getElementById("bkCopy"), open = document.getElementById("bkOpen");
    var bf = document.getElementById("bkFile"), bfi = document.getElementById("bkFileIn"), br = document.getElementById("bkRead");
    if (br) { var sp5 = br.querySelector("span"); if (sp5) sp5.textContent = "읽기 쉬운 문서로 내 컴퓨터에 저장"; btns.appendChild(slim(br, "prim")); }
    if (bf) { var sp3 = bf.querySelector("span"); if (sp3) sp3.textContent = "전체 내용 파일로 내 컴퓨터에 저장 (되돌릴 때 씀)"; btns.appendChild(slim(bf)); }
    if (bfi) { var sp4 = bfi.querySelector("span"); if (sp4) sp4.textContent = "저장한 파일로 되돌리기"; btns.appendChild(slim(bfi)); }
    if (copy) copy.hidden = true;
    if (open) open.hidden = true;
    document.querySelectorAll(".bkmini").forEach(function (b) {
      if (b === bf || b === bfi || b === br) return;
      var wrap = b.closest(".bkbar");
      b.hidden = true;
      if (wrap && !wrap.querySelector("button:not([hidden])")) wrap.hidden = true;
    });
    var msg = document.getElementById("bkMsg"), paste = document.getElementById("bkPaste");
    if (msg) row.appendChild(msg);
    if (paste) row.appendChild(paste);
    // 저장 표시 — 어디든 적으면 잠깐 "저장 중" 뒤에 "저장됨 시각"
    var st = document.getElementById("saveState"), t = null;
    var saveAll = document.getElementById("saveAll");
    function flushAll() {
      (window.__CS_SAVERS || []).forEach(function (f) { try { f(); } catch (e) {} });
      // 포커스가 있는 칸의 입력도 확정
      try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch (e) {}
    }
    window.__CS_FLUSH = flushAll;
    if (saveAll) saveAll.addEventListener("click", function () {
      flushAll();
      clearTimeout(t);
      if (st) { st.textContent = "저장됨 " + hm(); st.classList.remove("busy"); }
      saveAll.classList.add("hit"); saveAll.classList.remove("dirty"); saveAll.textContent = "✓ 저장했습니다";
      setTimeout(function () { saveAll.classList.remove("hit"); saveAll.textContent = "💾 저장"; }, 1800);
    });
    document.addEventListener("change", function (e) {
      if (saveAll && e.target && e.target.classList && e.target.classList.contains("pslot")) saveAll.classList.add("dirty");
    }, true);
    function hm() { var d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
    function bump() {
      if (!st) return;
      st.textContent = "저장 중…"; st.classList.add("busy");
      clearTimeout(t);
      t = setTimeout(function () { st.textContent = "저장됨 " + hm(); st.classList.remove("busy"); }, 900);
    }
    ["input", "change"].forEach(function (ev) { document.addEventListener(ev, function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("pslot")) return;   // 근무표는 저장 버튼으로
      bump();
    }, true); });
    window.addEventListener("beforeunload", function (e) {
      var d = window.__CS_SCHED_DIRTY || {};
      if (Object.keys(d).some(function (k) { return d[k]; })) { e.preventDefault(); e.returnValue = ""; }
    });
    document.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".box, .mk, .chip, .mtgck, input[type=checkbox]")) bump();
    }, true);
  })();

  // 보건증 — 발급일 넣으면 만료일(1년)과 남은 날 계산. 기기에 고정 저장 (cafesui.health)
  (function () {
    var box = document.getElementById("hcRows");
    if (!box) return;
    var NAMES = ["정항아", "박혜빈", "이해선", "사장님"];
    var COL = { "정항아": "wp1", "박혜빈": "wp2", "이해선": "wp3", "사장님": "wp4" };
    var KEY = "cafesui.health";
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
    function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
    function pad(n) { return String(n).padStart(2, "0"); }
    function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function expOf(issued) {
      var d = new Date(issued + "T00:00:00"); if (isNaN(d)) return null;
      d.setFullYear(d.getFullYear() + 1); d.setDate(d.getDate() - 1); return d;
    }
    function render() {
      var st = load(), today = new Date(); today.setHours(0, 0, 0, 0);
      box.innerHTML = "";
      NAMES.forEach(function (n) {
        var row = document.createElement("div"); row.className = "hcrow";
        var issued = st[n] || "";
        var exp = issued ? expOf(issued) : null;
        var dd = "", cls = "";
        if (exp) {
          var left = Math.round((exp - today) / 86400000);
          if (left < 0) { dd = "만료 " + (-left) + "일 지남"; cls = "bad"; }
          else if (left <= 30) { dd = "D-" + left + " · 갱신하세요"; cls = "warn"; }
          else { dd = "D-" + left; cls = "ok"; }
          dd += "<small>만료 " + ymd(exp) + "</small>";
        } else { dd = '<span style="color:var(--muted);font-weight:400">발급일을 넣어주세요</span>'; }
        if (cls) row.classList.add(cls);
        row.innerHTML = '<span class="nm ' + COL[n] + '">' + n + "</span>" +
          '<input type="date" class="dinp" value="' + issued + '" aria-label="' + n + ' 보건증 발급일">' +
          '<span class="dd ' + cls + '">' + dd + "</span>";
        row.querySelector("input").addEventListener("change", function (e) {
          var o = load(); if (e.target.value) o[n] = e.target.value; else delete o[n]; save(o); render();
        });
        box.appendChild(row);
      });
    }
    render();
  })();

  // 일지 — 이달 메모 달력. 예약·공지를 날짜에 적는다 (cafesui.daynotes). 연간 행사에도 같이 보인다.
  (function () {
    var cal = document.getElementById("mcCal"); if (!cal) return;
    var monEl = document.getElementById("mcMonth"), edit = document.getElementById("mcEdit");
    var titleEl = document.getElementById("mcTitle"), listEl = document.getElementById("mcList");
    var textEl = document.getElementById("mcText");
    var KEY = "cafesui.daynotes", VKEY = "cafesui.vacations";   // 휴가: [{id, who, from, to, memo, by, t}]
    var COL = { "정항아": "p1", "박혜빈": "p2", "이해선": "p3", "사장님": "p4" };
    function vload() { try { var a = JSON.parse(localStorage.getItem(VKEY) || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
    function vsave(a) { try { localStorage.setItem(VKEY, JSON.stringify(a)); } catch (e) {} }
    // 일정·휴가 공통: {id, kind:"vac"|"sched", who, title, from, to, days:[0..6], memo} — kind 없으면 예전 휴가
    function vkind(v) { return v.kind === "sched" ? "sched" : "vac"; }
    function vdayok(v, date) { if (!v.days || !v.days.length) return true; var p = date.split("-"); return v.days.indexOf(new Date(+p[0], +p[1] - 1, +p[2]).getDay()) >= 0; }
    function vfor(date) { return vload().filter(function (v) { return v.from && v.to && v.from <= date && date <= v.to && vdayok(v, date); }); }
    function vlabel(v) { return vkind(v) === "sched" ? (v.title || "일정") + (v.who && v.who !== "전체" && (v.title || "").indexOf(v.who) < 0 ? " · " + v.who : "") : v.who + " 휴가"; }
    var WDS = ["일", "월", "화", "수", "목", "금", "토"];
    function vdaysTxt(v) { return v.days && v.days.length ? v.days.slice().sort(function (a, b) { return ((a + 6) % 7) - ((b + 6) % 7); }).map(function (d) { return WDS[d]; }).join("·") + "만" : ""; }
    function vdays(v) { var a = new Date(v.from + "T00:00:00"), b = new Date(v.to + "T00:00:00"), n = 0; for (var d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) { if (!v.days || !v.days.length || v.days.indexOf(d.getDay()) >= 0) n++; } return n; }
    function vfmt(d) { var p = d.split("-"); return (+p[1]) + "/" + (+p[2]); }
    var WD = ["월", "화", "수", "목", "금", "토", "일"];
    var sel = null;
    function me() { try { return localStorage.getItem("cafesui.me") || ""; } catch (e) { return ""; } }
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
    function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} if (window.__CS_ANNUAL_REFRESH) window.__CS_ANNUAL_REFRESH(); }
    function pad(n) { return String(n).padStart(2, "0"); }
    function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function esc(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function ym() { return monEl.value || today().slice(0, 7); }
    function render() {
      var y = +ym().slice(0, 4), m = +ym().slice(5, 7), all = load(), t = today();
      var first = new Date(y, m - 1, 1), lead = (first.getDay() + 6) % 7, nd = new Date(y, m, 0).getDate();
      var h = WD.map(function (w, k) { return '<div class="mcw' + (k >= 5 ? " s" : "") + '">' + w + "</div>"; }).join("");
      for (var i = 0; i < lead; i++) h += '<div class="mcpad"></div>';
      for (var d = 1; d <= nd; d++) {
        var date = ym() + "-" + pad(d), wd = (new Date(y, m - 1, d).getDay() + 6) % 7;
        var notes = all[date] || [];
        var hol = (window.__CS_HOL || {})[date];
        h += '<div class="mccell' + (wd === 6 ? " sun" : wd === 5 ? " sat" : "") + (date === t ? " today" : "") + (date === sel ? " on" : "") + (hol ? " hol" : "") +
          '" data-d="' + date + '"><span class="mcd">' + d + (hol ? '<i class="mchol">' + esc(hol) + "</i>" : "") + "</span>" +
          vfor(date).map(function (v) { var sc = vkind(v) === "sched"; return '<span class="mcn ' + (sc ? "sch " : "vac ") + (COL[v.who] || "") + '" title="' + esc(v.memo || "") + '">' + (sc ? "📅 " : "🏖 ") + esc(vlabel(v)) + "</span>"; }).join("") +
          notes.slice(0, 4).map(function (n) { return '<span class="mcn ' + (COL[n.by] || "") + '">' + esc(n.t) + "</span>"; }).join("") +
          (notes.length > 4 ? '<span class="mcmore">+' + (notes.length - 4) + "개 더 · 눌러서 보기</span>" : "") +
          (notes.length ? "" : '<span class="mcplus">+</span>') + "</div>";
      }
      cal.innerHTML = h;
      cal.querySelectorAll(".mccell").forEach(function (c) { c.addEventListener("click", function () { open(c.dataset.d); }); });
      renderVac();
    }
    // 휴가 목록 (이 달에 걸친 것만) — 고치기 · 지우기
    var vEdit = null;
    function renderVac() {
      var box = document.getElementById("vcList"); if (!box) return;
      var y = ym(), first = y + "-01", last = y + "-31";
      var all = vload(), list = all.filter(function (v) { return v.from <= last && v.to >= first; })
        .sort(function (a, b) { return a.from < b.from ? -1 : a.from > b.from ? 1 : 0; });
      if (!list.length) { box.innerHTML = '<div class="mcvnone">이 달에 잡힌 일정 · 휴가가 없습니다</div>'; return; }
      box.innerHTML = list.map(function (v) {
        var c = COL[v.who] || "";
        if (vEdit === v.id) {
          return '<div class="mcvrow" data-id="' + v.id + '"><span class="k ' + (vkind(v) === "sched" ? "sch" : "vac") + '">' + (vkind(v) === "sched" ? "일정" : "휴가") + '</span><span class="w ' + c + '">' + esc(vlabel(v)) + '</span><span class="ed">' +
            '<input type="date" class="dinp ef" value="' + esc(v.from) + '"><span class="tilde">~</span><input type="date" class="dinp et" value="' + esc(v.to) + '">' +
            '<input type="text" class="dinp em" value="' + esc(v.memo || "") + '" placeholder="메모"></span>' +
            '<span class="bt"><button type="button" class="s">저장</button><button type="button" class="c">취소</button></span></div>';
        }
        return '<div class="mcvrow" data-id="' + v.id + '"><span class="k ' + (vkind(v) === "sched" ? "sch" : "vac") + '">' + (vkind(v) === "sched" ? "일정" : "휴가") + '</span><span class="w ' + c + '">' + esc(vlabel(v)) + "</span>" +
          '<span class="d">' + vfmt(v.from) + " ~ " + vfmt(v.to) + (vdaysTxt(v) ? " · " + vdaysTxt(v) : "") + "<i>" + vdays(v) + "일</i></span>" +
          (v.memo ? '<span class="m">' + esc(v.memo) + "</span>" : "") +
          '<span class="bt"><button type="button" class="e">날짜 고치기</button><button type="button" class="x">지우기</button></span></div>';
      }).join("");
      box.querySelectorAll(".mcvrow").forEach(function (row) {
        var id = row.dataset.id;
        var find = function () { var a = vload(); return { all: a, v: a.filter(function (x) { return x.id === id; })[0] }; };
        var e = row.querySelector(".e"), x = row.querySelector(".x"), sv = row.querySelector(".s"), cc = row.querySelector(".c");
        if (e) e.addEventListener("click", function () { vEdit = id; renderVac(); });
        if (cc) cc.addEventListener("click", function () { vEdit = null; renderVac(); });
        if (sv) sv.addEventListener("click", function () {
          var f = row.querySelector(".ef").value, t = row.querySelector(".et").value, m = row.querySelector(".em").value.trim();
          if (!f || !t) { alert("시작일과 끝일을 골라 주세요"); return; }
          if (t < f) { var tmp = f; f = t; t = tmp; }
          var r = find(); if (!r.v) return; r.v.from = f; r.v.to = t; r.v.memo = m; r.v.edit = me() + " " + today().slice(5);
          vsave(r.all); vEdit = null; render();
        });
        if (x) x.addEventListener("click", function () {
          var r = find(); if (!r.v) return;
          if (!confirm(vlabel(r.v) + " (" + vfmt(r.v.from) + " ~ " + vfmt(r.v.to) + ")를 지울까요?")) return;
          vsave(r.all.filter(function (v) { return v.id !== id; })); render();
        });
      });
    }
    (function () {
      var who = document.getElementById("vcWho"), f = document.getElementById("vcFrom"), t = document.getElementById("vcTo"), m = document.getElementById("vcMemo"), b = document.getElementById("vcAdd");
      var kindEl = document.getElementById("vcKind"), titleEl2 = document.getElementById("vcTitle"), daysEl = document.getElementById("vcDays");
      if (!b) return;
      function syncKind() { var sc = !kindEl || kindEl.value === "sched"; if (titleEl2) titleEl2.hidden = !sc; if (daysEl) daysEl.parentNode.querySelector("em").textContent = sc ? "안 고르면 기간 안의 매일" : "안 고르면 기간 전체"; }
      if (kindEl) { kindEl.addEventListener("change", syncKind); syncKind(); }
      if (daysEl) daysEl.addEventListener("change", function (e) { var l = e.target.closest("label"); if (l) l.classList.toggle("on", e.target.checked); });
      f.addEventListener("change", function () { if (!t.value || t.value < f.value) t.value = f.value; });
      b.addEventListener("click", function () {
        var w = who.value, a = f.value, z = t.value || f.value, kind = kindEl ? kindEl.value : "vac", ttl = titleEl2 ? titleEl2.value.trim() : "";
        var days = daysEl ? Array.prototype.filter.call(daysEl.querySelectorAll("input"), function (c) { return c.checked; }).map(function (c) { return +c.value; }) : [];
        if (kind === "vac" && (!w || w === "전체")) { alert("누구 휴가인지 골라 주세요"); who.focus(); return; }
        if (kind === "sched" && !ttl) { alert("무슨 일정인지 적어 주세요 (예: 사장님 출강 1~6시)"); titleEl2.focus(); return; }
        if (!a) { alert("시작일을 골라 주세요"); f.focus(); return; }
        if (z < a) { var tmp = a; a = z; z = tmp; }
        var all = vload();
        all.push({ id: "v" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: kind, who: w, title: kind === "sched" ? ttl : "", days: days, from: a, to: z, memo: m.value.trim(), by: me(), t: Date.now() });
        vsave(all); m.value = ""; if (titleEl2) titleEl2.value = ""; if (daysEl) daysEl.querySelectorAll("input").forEach(function (c) { c.checked = false; c.closest("label").classList.remove("on"); });
        monEl.value = a.slice(0, 7); render();
      });
      window.addEventListener("cs:remote", function (e) {
        if (!e.detail || (e.detail.keys || []).indexOf(VKEY) < 0) return;
        var ae = document.activeElement; if (ae && ae.closest && ae.closest(".mcvac")) return;
        render();
      });
    })();
    function open(date) {
      sel = date;
      var p = date.split("-"), wd = WD[(new Date(+p[0], +p[1] - 1, +p[2]).getDay() + 6) % 7];
      titleEl.textContent = (+p[1]) + "월 " + (+p[2]) + "일 (" + wd + ") 메모";
      var notes = (load()[date] || []);
      listEl.innerHTML = notes.length ? notes.map(function (n, i) {
        return '<div class="mcitem" data-i="' + i + '"><span class="t ' + (COL[n.by] || "") + '">' + esc(n.t) + "</span><small>" + esc(n.by || "") + (n.at ? " · " + esc(n.at) : "") +
          '</small><span class="mcbtns"><button type="button" class="e" data-i="' + i + '">고치기</button><button type="button" class="x" data-i="' + i + '">지우기</button></span></div>';
      }).join("") : '<div class="mcnone">아직 적은 게 없습니다</div>';
      listEl.querySelectorAll(".x").forEach(function (b) {
        b.addEventListener("click", function () {
          var all = load(); (all[date] || []).splice(+b.dataset.i, 1);
          if (!all[date] || !all[date].length) delete all[date];
          save(all); render(); open(date);
        });
      });
      // 고치기 — 그 줄이 입력칸으로 바뀌고, Enter 또는 저장으로 반영
      listEl.querySelectorAll(".e").forEach(function (b) {
        b.addEventListener("click", function () {
          var i = +b.dataset.i, row = b.closest(".mcitem"), cur = (load()[date] || [])[i];
          if (!cur) return;
          row.innerHTML = '<input type="text" class="dinp mcei" value="' + esc(cur.t).replace(/"/g, "&quot;") + '">' +
            '<span class="mcbtns"><button type="button" class="s">저장</button><button type="button" class="c">취소</button></span>';
          var inp = row.querySelector(".mcei"); inp.focus(); inp.select();
          function commit() {
            var t = (inp.value || "").trim(); if (!t) { open(date); return; }
            var all = load(); if (all[date] && all[date][i]) { all[date][i].t = t; all[date][i].edit = me() + " " + today().slice(5); }
            save(all); render(); open(date);
          }
          row.querySelector(".s").addEventListener("click", commit);
          row.querySelector(".c").addEventListener("click", function () { open(date); });
          inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") open(date); });
        });
      });
      edit.hidden = false; render();
      textEl.focus();
    }
    function add() {
      var t = (textEl.value || "").trim(); if (!t || !sel) return;
      var all = load(); (all[sel] || (all[sel] = [])).push({ t: t, by: me(), at: today().slice(5) });
      save(all); textEl.value = ""; render(); open(sel);
    }
    document.getElementById("mcAdd").addEventListener("click", add);
    textEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); add(); } });
    document.getElementById("mcClose").addEventListener("click", function () { edit.hidden = true; sel = null; render(); });
    monEl.value = today().slice(0, 7);
    monEl.addEventListener("change", function () { sel = null; edit.hidden = true; render(); });
    document.getElementById("mcPrev").addEventListener("click", function () {
      var y = +monEl.value.slice(0, 4), m = +monEl.value.slice(5, 7) - 1; if (m < 1) { m = 12; y--; }
      monEl.value = y + "-" + pad(m); sel = null; edit.hidden = true; render(); });
    document.getElementById("mcNext").addEventListener("click", function () {
      var y = +monEl.value.slice(0, 4), m = +monEl.value.slice(5, 7) + 1; if (m > 12) { m = 1; y++; }
      monEl.value = y + "-" + pad(m); sel = null; edit.hidden = true; render(); });
    render();
  })();
