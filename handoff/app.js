// 회복실 인계 노트 — 보기 + 새 인계 쓰기 · 고치기 · 빼기
// 기본 인계(1차 정리안)는 data.enc.js 안에 비밀번호로 잠겨 있고,
// 새로 쓴 인계는 서버(ops/「handoff.e.<시각>-<무작위>」)에 한 줄씩 「잠근 글」로만 더해진다(덮어쓰지 않음).
// 열쇠(sk)는 잠긴 기본 데이터 안에 있어서 비밀번호를 아는 사람만 읽고 쓸 수 있다.
(function(){
'use strict';
const $=s=>document.querySelector(s), K='handoff.pw', CK='handoff.cache', QK='handoff.q', WK='handoff.who';
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const tob64=u=>{let s='';u=new Uint8Array(u);for(let i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)};
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

async function openBase(pw){
  const E=window.HANDOFF_ENC, enc=new TextEncoder();
  const base=await crypto.subtle.importKey('raw',enc.encode(pw),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(E.s),iterations:E.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(E.iv)},key,b64(E.c));
  return JSON.parse(new TextDecoder().decode(pt));
}
let SK=null;
async function seal(o){const iv=crypto.getRandomValues(new Uint8Array(12));
  const c=await crypto.subtle.encrypt({name:'AES-GCM',iv},SK,new TextEncoder().encode(JSON.stringify(o)));
  return JSON.stringify({iv:tob64(iv),c:tob64(c)})}
async function unseal(v){const o=JSON.parse(v);
  const p=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(o.iv)},SK,b64(o.c));
  return JSON.parse(new TextDecoder().decode(p))}

// 병원 인증평가(의료기관 인증) 대비 섹션 — (제안) 분류. 병동 실제 인증 체크리스트 이름에 맞게 고쳐 쓰면 됨.
const CERT=[
 {g:'환자 확인 · 수술 안전',d:'환자 확인 2가지 · 수술 부위 표시 · Time-out · 수술 전 확인',kw:['확인','time-out','타임아웃','수술부위','수술 부위']},
 {g:'의사소통 · 인수인계',d:'인계 방법 · 구두처방 · 이상 결과 보고 · 병동 인계',kw:['인계','구두','보고','연락']},
 {g:'마취 · 진정 · 회복실',d:'마취 전 평가 · 진정 · 회복실 퇴실 기준 · 체온 관리',kw:['마취전상태평가','진정','회복실','체온','npo','퇴실']},
 {g:'약물 관리',d:'고위험 · 주의 약물 · 마약류 · 희석 · 라벨 · 유효기간',kw:['마약','유효기간','라벨','희석','비치','금고']},
 {g:'감염 관리',d:'손위생 · 청소 · 소독 · 재사용 기구 · 폐기물',kw:['소독','청소','폐기','감염','재사용','500ppm','락스']},
 {g:'낙상 · 안전사고 예방',d:'낙상 · 화상 · 눌림 · 신경차단 환자 안전',kw:['낙상','화상','부딪','눌림','다칠']},
 {g:'응급 · 수혈 · 알러지',d:'CPR · 응급 대응 · 수혈 이상반응 · 아나필락시스 · 악성고열',kw:['수혈','알러지','cpr','단트롤렌','아길루스','신속대응','응급']},
 {g:'장비 · 시설 안전',d:'의료기기 점검 · 전기 안전 · 온습도 · 충전',kw:['점검','스파크','온습도','방전','충전','fms','모니터']},
 {g:'의무기록 · 개인정보',d:'마취 · 회복 기록 · 차팅 · 삭감 방지 · 사진 유출 주의',kw:['기록','차팅','유출','삭감','전자서명']},
 {g:'교육 · 인증 질문 대비',d:'직원 교육 · 조사위원이 자주 묻는 질문과 답 · 기타',kw:[]}
];
const CERTG=CERT.map(c=>c.g);
// 같은 뜻 낱말(한글 ↔ 영어 · 줄임말) — 한쪽으로 찾아도 둘 다 나오게
const SYN=[['byfavo','바이파보'],['remi','레미','ultiva','울티바'],['precedex','프리세덱스'],['rocu','로큐','esmeron','에스메론'],['fentanyl','펜타닐','ftn'],
 ['ketamine','케타민','keta'],['midazolam','미다','mida'],['phenyl','페닐'],['lido','리도','lidocaine'],['sevo','세보'],['spinal','척추','spine'],
 ['c/sec','씨섹','c-sec','제왕절개'],['glove','장갑','글러브'],['suction','석션'],['pento','pentotal','펜토'],['lumasate','루마세이트'],['acupan','아큐판'],
 ['nacaine','나카인','naropin','나로핀','ropiva'],['tiva','티바'],['pca','피씨에이'],['bpb','블락','block','신경차단'],['tof','트위치'],['intubation','intu','인튜'],
 ['extubation','익스튜베이션'],['fiberoptic','파이버'],['airway','에어웨이'],['tube','튜브'],['소아','아기','신생아'],['마약','마약류'],['수혈','혈액'],
 ['알러지','알레르기','allergy'],['체온','hugger','허거','블랑케트롤'],['차팅','기록','마취기록']];
const SYNM={};SYN.forEach(g=>g.forEach(w=>SYNM[w]=g));
function terms(q){return q.split(/\s+/).filter(Boolean).map(w=>{const g=new Set([w]);
  for(const k in SYNM)if(k.length>1&&(k===w||(w.length>=2&&k.startsWith(w))))SYNM[k].forEach(x=>g.add(x));return[...g]})}
let QT=[];
let D=null, BASE=[], ENT={}, ITEMS=[], V='prof', Q='', db=null, online=false;
V=LS.get('handoff.view','prof');

async function tryOpen(pw,rem){
  try{D=await openBase(pw)}catch(e){$('#gerr').textContent='비밀번호가 맞지 않아요.';return}
  if(rem)LS.set(K,pw);
  SK=await crypto.subtle.importKey('raw',b64(D.sk),{name:'AES-GCM'},false,['encrypt','decrypt']);
  BASE=D.it;
  $('#gate').hidden=true;$('#app').hidden=false;$('#top').hidden=false;
  $('#ttl').textContent=D.title+' 노트';$('#srcl').textContent=D.src+' · 그 뒤로는 이 화면에서 바로 써요';
  const cache=LS.get(CK,{});for(const id in cache){try{ENT[id]=await unseal(cache[id])}catch(e){}}
  for(const q of LS.get(QK,[])){try{ENT[q.id]=await unseal(q.v)}catch(e){}}
  rebuild();connect();
}
$('#gf').onsubmit=e=>{e.preventDefault();tryOpen($('#gpw').value.trim(),$('#grem').checked)};
{const s=LS.get(K,null);if(s)tryOpen(s,false)}
$('#lock').onclick=e=>{e.preventDefault();try{localStorage.removeItem(K)}catch(x){}location.reload()};
$('#top').onclick=()=>scrollTo({top:0,behavior:'smooth'});
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{V=b.dataset.v;if(Q){$('#q').value='';Q='';QT=[];$('#qx').hidden=true}LS.set('handoff.view',V);draw();scrollTo({top:0})});
$('#q').oninput=e=>{Q=e.target.value.trim().toLowerCase();QT=terms(Q);$('#qx').hidden=!Q;draw()};
$('#qx').onclick=()=>{$('#q').value='';Q='';QT=[];$('#qx').hidden=true;draw();$('#q').focus()};
$('#sort').onchange=()=>draw();

// ── 서버 ──
function setSync(t,bad){const s=$('#sync');s.textContent=t;s.classList.toggle('bad',!!bad)}
function connect(){
  if(!window.firebase||!window.FIREBASE_CONFIG){setSync('⚠ 서버 연결 파일을 못 읽었어요 · 보기만 돼요 (인터넷 확인 후 새로고침)',1);return}
  try{firebase.initializeApp(window.FIREBASE_CONFIG)}catch(e){}
  db=firebase.firestore();
  firebase.auth().signInAnonymously().then(()=>{
    const FP=firebase.firestore.FieldPath;
    // 이미 받은 것(기기 저장)은 다시 안 받음 — 서버 읽기 횟수를 줄여 40명이 써도 무료 한도 안에서
    const seen=Object.keys(LS.get(CK,{})).sort().pop()||'handoff.e.';
    db.collection('ops').where(FP.documentId(),'>',seen).where(FP.documentId(),'<=','handoff.e.\uf8ff')
      .onSnapshot(async snap=>{
        online=true;const cache=LS.get(CK,{});let ch=false;
        for(const doc of snap.docs){const v=doc.data().v;if(cache[doc.id]===v)continue;
          try{ENT[doc.id]=await unseal(v);cache[doc.id]=v;ch=true}catch(e){}}
        LS.set(CK,cache);flushQ();
        setSync('✅ 실시간 연결됨 · 새로 쓴 인계 '+Object.keys(ENT).length+'개 반영'+(LS.get(QK,[]).length?' · 보내는 중 '+LS.get(QK,[]).length+'개':''));
        if(ch)rebuild();
      },err=>{online=false;setSync('⚠ 서버를 못 읽었어요 · 화면에 있는 것만 보여요 ('+(err.code||err.message)+')',1)});
  }).catch(err=>setSync('⚠ 서버 로그인 실패 · 보기만 돼요 ('+(err.code||err.message)+')',1));
}
async function flushQ(){
  if(!db)return;let q=LS.get(QK,[]);
  for(const it of q.slice()){
    try{await db.collection('ops').doc(it.id).set({v:it.v,by:'handoff',t:firebase.firestore.FieldValue.serverTimestamp()});
      q=LS.get(QK,[]).filter(x=>x.id!==it.id);LS.set(QK,q);
      const c=LS.get(CK,{});c[it.id]=it.v;LS.set(CK,c);
    }catch(e){setSync('⚠ 아직 서버로 못 보냈어요 ('+q.length+'개) · 인터넷이 되면 저절로 다시 보내요',1);return}
  }
}
async function put(o){
  o.at=Date.now();o.who=LS.get(WK,'');
  const id='handoff.e.'+Date.now().toString(36).padStart(9,'0')+'-'+Math.random().toString(36).slice(2,6);
  const v=await seal(o);
  const q=LS.get(QK,[]);q.push({id,v});LS.set(QK,q);
  ENT[id]=o;rebuild();
  setSync('보내는 중…');flushQ().then(()=>{if(!LS.get(QK,[]).length)setSync('✅ 저장됨 · 같이 일하는 선생님 화면에도 보여요')});
}

// ── 기본 + 새로 쓴 것 합치기 ──
function rebuild(){
  const m={};BASE.forEach(i=>m[i.id]=Object.assign({},i,{d:i.d.slice(),h:[]}));
  Object.keys(ENT).sort().forEach(docId=>{const e=ENT[docId];if(!e)return;
    const mon=(e.day||'').slice(0,7);
    if(e.op==='add'){m['e'+docId.slice(10)]={id:'e'+docId.slice(10),p:e.p,g:e.g,s:e.s||'',t:e.t,d:mon?[mon]:[],day:e.day,h:[],add:{who:e.who,at:e.at}};}
    else{const it=m[e.id];if(!it)return;
      if(e.op==='edit'){it.h.push({t:it.t,g:it.g,s:it.s,who:e.who,at:e.at});it.p=e.p;it.g=e.g;it.s=e.s||'';it.t=e.t;
        if(mon&&!it.d.includes(mon)){it.d.push(mon);it.d.sort()}it.ed={who:e.who,at:e.at};it.day=e.day||it.day}
      else if(e.op==='del')it.del={who:e.who,at:e.at};
      else if(e.op==='undel')delete it.del;}
  });
  ITEMS=Object.values(m);draw();
}

// ── 그리기 ──
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ym=d=>{const [y,mm]=d.split('-');return y.slice(2)+'.'+(+mm)};
const ymL=d=>{const [y,mm]=d.split('-');return y+'년 '+(+mm)+'월'};
const md=t=>{const x=new Date(t);return (x.getMonth()+1)+'/'+x.getDate()};
const nm=w=>w?(/님$/.test(w)?w:w+'님'):'';
function recent(){const n=new Date();const c=new Date(n.getFullYear(),n.getMonth()-2,1);return c.getFullYear()+'-'+String(c.getMonth()+1).padStart(2,'0')}
function fmt(t){
  let h=esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/^⚠/,'<span class="warn">⚠</span>').replace(/\n/g,'<br>');
  if(Q){const re=new RegExp('('+QT.flat().sort((a,b)=>b.length-a.length).map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','gi');h=h.replace(/(<[^>]+>)|([^<]+)/g,(mm,tag,txt)=>tag?tag:txt.replace(re,'<mark>$1</mark>'))}
  return h;
}
const last=i=>i.d.length?i.d[i.d.length-1]:'0000';
const touch=i=>Math.max(i.add?i.add.at:0,i.ed?i.ed.at:0);
function li(i,showG){
  const R=recent();
  const ds=i.d.length?i.d.slice().reverse().map(d=>`<span class="dt${d>=R?' nw':''}">${d>=R?'🆕 ':''}${ym(d)}</span>`).join(''):'<span class="dt">날짜 없음</span>';
  const g=showG?`<span class="g${i.p==='nurse'?' n':i.p==='cert'?' c':''}">${esc(i.g)}</span>`:'';
  const s=i.s?`<span class="s">[${esc(i.s)}]</span>`:'';
  let by='';
  if(i.add)by+=`<span class="by">✍ ${esc(nm(i.add.who)||'누군가')} · ${md(i.add.at)}${i.day?' ('+(+i.day.slice(5,7))+'/'+(+i.day.slice(8))+')':''}</span>`;
  if(i.ed)by+=`<span class="by ed">✏ ${esc(nm(i.ed.who)||'누군가')} 고침 · ${md(i.ed.at)}</span>`;
  const hist=i.h.length?`<details class="hist"><summary>📜 바뀌기 전 글 ${i.h.length}개</summary>${i.h.slice().reverse().map(x=>`<div>${esc(x.t)} <i>— ${esc(nm(x.who))} ${md(x.at)}에 고침</i></div>`).join('')}</details>`:'';
  const fresh=Date.now()-touch(i)<48*3600e3?' fresh':'';
  const act=i.del?`<div class="act"><button data-a="undel" data-id="${i.id}">↺ 되살리기</button></div>`
    :`<div class="act"><button data-a="edit" data-id="${i.id}">✏ 고치기</button><button data-a="del" data-id="${i.id}">🗑 빼기</button></div>`;
  return `<li class="${fresh}"><div class="d">${ds}</div><div class="tx">${g}${s}${fmt(i.t)}${by}${hist}${act}</div></li>`;
}
function draw(){
  if(!D)return;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.v===V));
  const desc=$('#sort').value==='new';
  const hay=i=>(i.t+' '+i.g+' '+i.s+' '+i.h.map(x=>x.t).join(' ')).toLowerCase();
  const match=i=>!Q||QT.every(g=>g.some(w=>hay(i).includes(w)));
  let it=ITEMS.filter(i=>!i.del&&match(i));
  const L=$('#list'),C=$('#chips');let h='',ch='';
  const key=i=>last(i)+String(touch(i)).padStart(14,'0');
  const cmp=(a,b)=>desc?key(b).localeCompare(key(a)):key(a).localeCompare(key(b));
  if(Q){
    const PN={prof:'👨‍⚕️ 교수님별',nurse:'🩺 간호사끼리',cert:'🏥 인증 준비'};
    h=`<div class="qhead">🔎 「${esc(Q)}」 찾은 인계 <b>${it.length}</b>개${QT.some(g=>g.length>1)?' <small>(같은 뜻: '+esc(QT.filter(g=>g.length>1).map(g=>g.slice(0,4).join('·')).join(' / '))+')</small>':''}</div>`;
    ['prof','nurse','cert'].forEach(pp=>{const a=it.filter(i=>i.p===pp).sort(cmp);if(!a.length)return;
      ch+=`<button class="chip" data-s="${pp}">${PN[pp]}<b>${a.length}</b></button>`;
      h+=`<section class="${pp}" id="s${pp}"><h2>${PN[pp]}<small>${a.length}개</small></h2><ul>${a.map(i=>li(i,true)).join('')}</ul></section>`});
    L.innerHTML=it.length?h:h+'<div class="empty">찾는 내용이 없어요. 낱말을 줄이거나 한글/영어로 바꿔 보세요.</div>';C.innerHTML=ch;
    C.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{const el=document.getElementById('s'+c.dataset.s);if(el)scrollTo({top:el.getBoundingClientRect().top+scrollY-8,behavior:'smooth'})});
    return;
  }
  if(V==='prof'||V==='nurse'||V==='cert'){
    const part=it.filter(i=>i.p===V),groups=groupsOf(V).filter(g=>V==='cert'||part.some(i=>i.g===g));
    ch=groups.map(g=>`<button class="chip" data-g="${esc(g)}">${esc(g.replace(' 교수님','').replace(/ · .*/,''))}<b>${part.filter(i=>i.g===g).length}</b></button>`).join('');
    groups.forEach(g=>{const a=part.filter(i=>i.g===g).sort(cmp);
      const subs=[...new Set(a.map(i=>i.s))];
      const body=subs.map(s=>(s?`<h3>${esc(s)}</h3>`:'')+'<ul>'+a.filter(i=>i.s===s).map(i=>li(i,false)).join('')+'</ul>').join('');
      const top=a.map(last).sort().pop();
      let extra='';
      if(V==='cert'){const c=CERT.find(x=>x.g===g);
        const rel=c&&c.kw.length?it.filter(i=>i.p!=='cert'&&c.kw.some(k=>(i.t+' '+i.s).toLowerCase().includes(k))).sort(cmp):[];
        extra=(c?`<div class="cdesc">${esc(c.d)}</div>`:'')+(a.length?'':`<div class="cempty">아직 이 섹션에 쓴 인계가 없어요 · <button class="cadd" data-g="${esc(g)}">＋ 여기에 쓰기</button></div>`)+
          (rel.length?`<details class="crel"><summary>🔗 기존 인계 중 관련된 것 ${rel.length}개 (자동으로 찾음 · 보기만)</summary><ul>${rel.map(i=>li(i,true)).join('')}</ul></details>`:'');}
      h+=`<section class="${V}" data-g="${esc(g)}"><h2>${esc(g)}<small>${a.length}개${top&&top!=='0000'?' · 최근 '+ym(top):''}</small></h2>${extra}${body}</section>`});
    const dl=ITEMS.filter(i=>i.del&&i.p===V&&match(i));
    if(dl.length)h+=`<section class="${V}"><details><summary style="padding:12px 14px;cursor:pointer;font-weight:700">🗑 뺀 인계 ${dl.length}개 (되살릴 수 있어요)</summary><ul>${dl.map(i=>li(i,true)).join('')}</ul></details></section>`;
  }else{
    const R=recent();
    if(V==='new')it=it.filter(i=>i.d.some(d=>d>=R)||Date.now()-touch(i)<90*864e5);
    const months=[...new Set(it.flatMap(i=>i.d))].sort();if(desc)months.reverse();
    const nod=it.filter(i=>!i.d.length);
    ch=months.map(m=>`<button class="chip" data-m="${m}">${ym(m)}<b>${it.filter(i=>i.d.includes(m)).length}</b></button>`).join('');
    months.forEach(m=>{const a=it.filter(i=>i.d.includes(m)).sort(cmp);
      const pa=a.filter(i=>i.p==='prof'),na=a.filter(i=>i.p==='nurse'),ca=a.filter(i=>i.p==='cert');
      h+=`<section class="date" id="m${m}"><h2>${ymL(m)}<small>교수님 ${pa.length} · 간호사 ${na.length}${ca.length?' · 인증 '+ca.length:''}</small></h2>`+(ca.length?'<h3>🏥 인증 준비</h3><ul>'+ca.map(i=>li(i,true)).join('')+'</ul>':'')+
        (pa.length?'<h3>👨‍⚕️ 교수님별</h3><ul>'+pa.map(i=>li(i,true)).join('')+'</ul>':'')+
        (na.length?'<h3>🩺 간호사끼리</h3><ul>'+na.map(i=>li(i,true)).join('')+'</ul>':'')+'</section>'});
    if(nod.length&&V==='date')h+=`<section class="date"><h2>날짜 없는 공지<small>${nod.length}개</small></h2><ul>${nod.map(i=>li(i,true)).join('')}</ul></section>`;
  }
  // 펼쳐 둔 「바뀌기 전 글」은 다시 그려도 그대로
  L.innerHTML=h||'<div class="empty">찾는 내용이 없어요.</div>';C.innerHTML=ch;
  C.querySelectorAll('.chip').forEach(c=>c.onclick=()=>{
    const el=c.dataset.g?L.querySelector(`section[data-g="${CSS.escape(c.dataset.g)}"]`):document.getElementById('m'+c.dataset.m);
    if(el){const hd=document.querySelector('header'),off=(getComputedStyle(hd).position==='sticky'?hd.offsetHeight:0)+8;scrollTo({top:el.getBoundingClientRect().top+scrollY-off,behavior:'smooth'})}});
}
function groupsOf(p){const g=p==='cert'?CERTG.slice():[];BASE.concat(ITEMS).forEach(i=>{if(i.p===p&&!g.includes(i.g))g.push(i.g)});
  const o=g.indexOf('그 외 교수님');if(o>=0){g.splice(o,1);g.push('그 외 교수님')}return g}

// ── 고치기 · 빼기 단추 ──
$('#list').addEventListener('click',e=>{
  const ca=e.target.closest('.cadd');if(ca){openForm(null,'cert',ca.dataset.g);return}
  const b=e.target.closest('button[data-a]');if(!b)return;
  const i=ITEMS.find(x=>x.id===b.dataset.id);if(!i)return;
  if(b.dataset.a==='edit')openForm(i);
  else if(b.dataset.a==='del'){if(!needWho())return;if(confirm('이 인계를 뺄까요?\n\n「'+i.t.slice(0,80)+'」\n\n(맨 아래 「뺀 인계」에서 되살릴 수 있어요)'))put({op:'del',id:i.id})}
  else if(b.dataset.a==='undel'){if(!needWho())return;put({op:'undel',id:i.id})}
});
function needWho(){let w=LS.get(WK,'');if(w)return true;
  w=(prompt('누가 하는지 남겨요. 이름을 적어 주세요 (이 기기에 기억)')||'').trim();if(!w)return false;LS.set(WK,w);return true}

// ── 쓰기 칸 ──
let FP='prof', EDIT=null;
const dlg=$('#dlg');
function fillGroups(sel){
  const gs=groupsOf(FP);
  $('#fg').innerHTML=gs.map(g=>`<option>${esc(g)}</option>`).join('')+'<option value="__new">＋ 새로 만들기</option>';
  $('#fg').value=sel&&gs.includes(sel)?sel:(gs[0]||'__new');
  $('#fgl').textContent=FP==='prof'?'교수님':FP==='cert'?'인증 섹션':'묶음';
  $('#fgn').placeholder=FP==='prof'?'새 이름 (예: 홍길동 교수님)':'새 묶음 이름 (예: 인계·근무 운영)';
  $('#fgn').hidden=$('#fg').value!=='__new';
  const subs=[...new Set(ITEMS.filter(i=>i.p===FP&&i.s).map(i=>i.s))];
  $('#fsl').innerHTML=subs.map(s=>`<option value="${esc(s)}">`).join('');
}
function segOn(){document.querySelectorAll('.seg button').forEach(b=>b.classList.toggle('on',b.dataset.p===FP))}
document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{FP=b.dataset.p;segOn();fillGroups()});
$('#fg').onchange=()=>{$('#fgn').hidden=$('#fg').value!=='__new';if(!$('#fgn').hidden)$('#fgn').focus()};
function today(){const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0')}
function openForm(i,p0,g0){
  EDIT=i||null;
  FP=i?i.p:(p0||(V==='nurse'||V==='cert'?V:'prof'));segOn();fillGroups(i?i.g:g0||null);
  $('#fmt').textContent=i?'✏ 인계 고치기':'✏ 새 인계 쓰기';
  $('#fs').value=i?i.s:'';$('#ft').value=i?i.t:'';$('#fd').value=today();
  $('#fwho').value=LS.get(WK,'');$('#fw').textContent=i?'고치면 바뀌기 전 글도 「📜 바뀌기 전 글」에 남아요. 날짜는 고친 날로 더해져요.':'';
  $('#fgn').value='';
  dlg.showModal();setTimeout(()=>$('#ft').focus(),50);
}
$('#wnew').onclick=()=>openForm(null);
$('#fno').onclick=()=>dlg.close();
$('#ft').oninput=()=>{const t=$('#ft').value;
  $('#fw').textContent=/\d{6,}/.test(t)?'⚠ 긴 숫자가 있어요. 환자 등록번호 · 전화번호면 지워 주세요.':(EDIT?'고치면 바뀌기 전 글도 남아요.':'')};
$('#fm').onsubmit=async e=>{
  e.preventDefault();
  const t=$('#ft').value.trim(),who=$('#fwho').value.trim();
  let g=$('#fg').value==='__new'?$('#fgn').value.trim():$('#fg').value;
  if(FP==='prof'&&$('#fg').value==='__new'&&g&&!/교수님/.test(g))g+=' 교수님';
  if(!t){alert('인계 내용을 적어 주세요.');return}
  if(!g){alert(FP==='prof'?'교수님을 골라 주세요.':'묶음을 골라 주세요.');return}
  if(!who){alert('쓴 사람 이름을 적어 주세요.');$('#fwho').focus();return}
  if(/\d{6,}/.test(t)&&!confirm('긴 숫자가 있어요. 환자 정보가 아닌 게 맞나요?'))return;
  LS.set(WK,who);
  const o={p:FP,g,s:$('#fs').value.trim(),t,day:$('#fd').value||today()};
  if(EDIT){if(EDIT.t===t&&EDIT.g===g&&EDIT.s===o.s&&EDIT.p===FP){dlg.close();return}o.op='edit';o.id=EDIT.id}else o.op='add';
  dlg.close();
  if(V!=='date'&&V!=='new'&&V!==FP){V=FP;LS.set('handoff.view',V)}
  await put(o);
};
})();
