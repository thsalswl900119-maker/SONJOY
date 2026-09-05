/* ===== 카페스이 운영노트 — 앱 로직 ===== */
(async function(){
'use strict';
/* ---------- 유틸 ---------- */
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>ymd(new Date());
const nowHM=()=>{const d=new Date();return pad(d.getHours())+':'+pad(d.getMinutes())};
const DOW=['일','월','화','수','목','금','토'];
const dow=s=>s?DOW[new Date(s+'T00:00:00').getDay()]:'';
const addDays=(s,n)=>{const d=new Date(s+'T00:00:00');d.setDate(d.getDate()+n);return ymd(d)};
const addMonths=(s,n)=>{const d=new Date(s.slice(0,7)+'-01T00:00:00');d.setMonth(d.getMonth()+n);return ymd(d)};
const fmt=n=>n==null||n===''?'':Number(n).toLocaleString('ko-KR');
const hm2min=t=>{if(!t)return null;const [h,m]=t.split(':').map(Number);return h*60+m};
const hours=(a,b)=>{const x=hm2min(a),y=hm2min(b);if(x==null||y==null)return null;return Math.round((y-x)/6)/10};
const weekMon=s=>{const d=new Date(s+'T00:00:00');return addDays(s,-((d.getDay()+6)%7))};
const PALETTE=['#e8735a','#5a7d6a','#2471a3','#b8860b','#8e44ad','#c0392b','#16a085','#7f8c8d'];
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('on'),2200)}
function dl(content,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click()}
function copyText(txt){return navigator.clipboard?.writeText(txt).then(()=>toast('복사했습니다. 텔레그램에 붙여넣으세요.')).catch(()=>prompt('복사해서 쓰세요',txt))||prompt('복사해서 쓰세요',txt)}
/* 모달: openModal({title, body, onSave, onDelete, saveText}) */
function openModal(o){const bg=document.createElement('div');bg.className='modal-bg';
  bg.innerHTML=`<div class="modal"><h2>${esc(o.title)}</h2><div class="body">${o.body}</div><div class="acts">${o.onDelete?'<button class="btn danger" data-del>삭제</button><span class="sp"></span>':''}<button class="btn" data-cancel>닫기</button>${o.onSave?`<button class="btn pri" data-save>${esc(o.saveText||'저장')}</button>`:''}</div></div>`;
  document.body.appendChild(bg);const close=()=>bg.remove();
  bg.addEventListener('click',e=>{if(e.target===bg)close()});$('[data-cancel]',bg).onclick=close;
  if(o.onSave)$('[data-save]',bg).onclick=async()=>{try{const r=await o.onSave(bg);if(r!==false)close()}catch(e){alert(e.message||e)}};
  if(o.onDelete)$('[data-del]',bg).onclick=async()=>{if(confirm('삭제할까요?')){await o.onDelete(bg);close()}};
  o.onOpen&&o.onOpen(bg);return bg}

/* ---------- 상태 ---------- */
const S={view:'home',roster:[],me:null,unsub:[]};
const isMgr=()=>['owner','head','manager'].includes(S.me?.role);
const isOwner=()=>S.me?.role==='owner';
const ROLE_COLOR={owner:'#d9603f',head:'#7b4fa3',manager:'#3f7a5c',staff:'#2f6ea8',parttime:'#b8860b'};const ROLE_NAME={owner:'사장',head:'점장',manager:'매니저',staff:'직원',parttime:'알바'};const ROLE_ORDER=['owner','head','manager','staff','parttime'];
const roleColor=r=>ROLE_COLOR[r]||'#7f8c8d';
const colorOf=uid=>roleColor((uid===S.me?.id?S.me:S.roster.find(u=>u.id===uid))?.role);
const nameOf=uid=>S.roster.find(u=>u.id===uid)?.name||'?';
const nm=(name,role)=>`<span class="nm-r" style="color:${roleColor(role)}">${esc(name)}</span>`;
const nmU=uid=>{const u=uid===S.me?.id?S.me:S.roster.find(x=>x.id===uid);return u?nm(u.name,u.role):'?'};
const roleLegend=()=>`<span class="tip">${Object.entries(ROLE_NAME).map(([k,n])=>`<span class="dot" style="background:${ROLE_COLOR[k]}"></span>${n}`).join(' ')}</span>`;
async function loadRoster(){S.roster=(await DB.query('users')).filter(u=>u.role!=='pending').sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))}

/* ---------- 로그인 ---------- */
const KIOSK=()=>localStorage.getItem('sonjoy.kiosk')==='1';
const rosterCache=()=>{try{return JSON.parse(localStorage.getItem('sonjoy.roster'))||[]}catch(e){return []}};
function renderLogin(msg){$('#hdr').hidden=true;$('#navBottom').hidden=true;const kiosk=KIOSK();const names=rosterCache();
  $('#view').innerHTML=`<div id="login">
    <div class="logo"><img src="assets/logo.png" alt="카페스이" onerror="if(!this.dataset.n){this.dataset.n=1;this.src='assets/logo.jpg'}else{this.onerror=null;this.src='assets/logo.svg'}"></div>
    <div class="eyebrow">CAFE SUI INTERNAL</div>
    <h1>카페스이 운영노트</h1>
    <p class="sub">${kiosk?'이름을 누르고 비밀번호를 입력하세요.':'오늘 해야 할 일을 확인하고 바로 기록하세요.'}</p>
    ${kiosk&&names.length?`<div class="names">${names.map(u=>`<button type="button" class="nb" data-id="${esc(u.loginId)}" style="border-color:${roleColor(u.role)};color:${roleColor(u.role)}">${esc(u.name)}</button>`).join('')}</div>`:''}
    <div class="f" ${kiosk&&names.length?'hidden':''}><label>아이디</label><input type="text" id="lid" autocapitalize="off" autocomplete="username" placeholder="발급받은 아이디" value="${esc(kiosk?'':(localStorage.getItem('sonjoy.lastId')||''))}"></div>
    <div class="f"><label>비밀번호 <span class="tip" id="whoLbl"></span></label><div class="pw"><input type="password" id="lpw" autocomplete="current-password" placeholder="••••••"><button type="button" id="lEye" title="보기">👁</button></div></div>
    <div class="f row" style="margin-top:4px;gap:16px"><label style="margin:0;font-size:13px;color:var(--ink)" ${kiosk?'hidden':''}><input type="checkbox" id="lrem" ${kiosk?'':'checked'}> 이 기기에서 로그인 유지</label><label style="margin:0;font-size:12px;color:var(--muted)"><input type="checkbox" id="lkiosk" ${kiosk?'checked':''}> 매장 공용 기기 (컴퓨터·주방 공기계)</label></div>
    <p class="err">${esc(msg||'')}</p>
    <button class="btn pri go" id="lbtn">들어가기</button>
    <div class="foot"><b>내부 구성원 전용</b><span>화면 캡처 및 외부 전달을 금지합니다.</span>${kiosk?'<span>쓰고 나면 오른쪽 위 "사용자 바꾸기"를 눌러 주세요. 10분간 조작이 없으면 자동으로 잠깁니다.</span>':''}${DB.mode==='local'?'<span class="demo">로컬 데모 · minji / hyanga / hyebin / haesun · 비밀번호 000000</span>':''}</div>
  </div>`;
  const go=async()=>{const id=$('#lid').value,pw=$('#lpw').value;if(!id)return $('#whoLbl').textContent='이름을 먼저 눌러 주세요';$('#lbtn').disabled=true;
    try{await DB.login(id,pw,!KIOSK()&&$('#lrem').checked);if(!KIOSK())localStorage.setItem('sonjoy.lastId',id);await start()}catch(e){renderLogin(e.code==='auth/invalid-credential'||e.code==='auth/wrong-password'||e.code==='auth/user-not-found'?'아이디 또는 비밀번호가 틀립니다':e.message)}};
  $('#lbtn').onclick=go;$('#lpw').onkeydown=e=>{if(e.key==='Enter')go()};$('#lid').onkeydown=e=>{if(e.key==='Enter')$('#lpw').focus()};
  $('#lEye').onclick=()=>{const i=$('#lpw');i.type=i.type==='password'?'text':'password'};
  $('#lkiosk').onchange=e=>{localStorage.setItem('sonjoy.kiosk',e.target.checked?'1':'0');if(!e.target.checked)localStorage.removeItem('sonjoy.uid');renderLogin()};
  $$('.nb').forEach(b=>b.onclick=()=>{$$('.nb').forEach(x=>x.classList.toggle('on',x===b));$('#lid').value=b.dataset.id;$('#whoLbl').textContent=b.textContent+' 님';$('#lpw').value='';$('#lpw').focus()});
  ($('#lid').value||kiosk?$('#lpw'):$('#lid')).focus()}
/* 공용 컴퓨터: 10분 무조작 시 자동 잠금 */
let idleT=null;function armIdle(){clearTimeout(idleT);if(!KIOSK()||!S.me)return;idleT=setTimeout(async()=>{await DB.logout();location.hash='';renderLogin('10분간 조작이 없어 잠겼습니다. 다시 이름을 눌러 주세요.')},10*60*1000)}
['pointerdown','keydown','touchstart','scroll'].forEach(ev=>document.addEventListener(ev,()=>{if(idleT)armIdle()},{passive:true}));

/* ---------- 네비 ---------- */
const VIEWS=[['home','홈','🏠'],['attend','퇴근','⏰'],['shifts','근무표','📅'],['check','체크리스트','✅','체크'],['stock','재고·발주','📦','재고'],['sched','스케줄','🗓'],['log','일지','📝'],['settings','설정','⚙️']];
const STAFF_TOP=['home','check','stock','log','shifts','sched','manual'],STAFF_BOTTOM=['home','check','stock','log','shifts'];
function renderNav(){const top=isMgr()?VIEWS:VIEWS.filter(v=>STAFF_TOP.includes(v[0]));const bottom=isMgr()?VIEWS.filter(x=>x[0]!=='settings'):VIEWS.filter(v=>STAFF_BOTTOM.includes(v[0]));
  $('#navTop').innerHTML=top.map(([k,n])=>`<button data-v="${k}" class="${S.view===k?'on':''}">${n}</button>`).join('');
  $('#navBottom').innerHTML=bottom.map(([k,n,i,sn])=>`<button data-v="${k}" class="${S.view===k?'on':''}"><b>${i}</b>${sn||n}</button>`).join('');
  $('#gearBtn').onclick=()=>go('settings');
  $$('[data-v]').forEach(b=>b.onclick=()=>go(b.dataset.v))}
function go(v,param){S.view=v;location.hash=v;S.unsub.forEach(f=>f&&f());S.unsub=[];renderNav();window.scrollTo(0,0);({home,attend,shifts,check,stock,sched,log,manual,settings})[v](param)}
async function start(){S.me=DB.user;if(!S.me)return renderLogin();if(S.me.role==='pending'||S.me.active===false){$('#view').innerHTML=`<div id="login"><h1>승인 대기</h1><p>관리자가 직원 프로필을 만들어야 사용할 수 있습니다. (${esc(S.me.loginId)})</p><button class="btn" onclick="DB.logout().then(()=>location.reload())">로그아웃</button></div>`;return}
  await loadRoster();localStorage.setItem('sonjoy.roster',JSON.stringify(S.roster.filter(u=>u.active!==false).map(u=>({loginId:u.loginId,name:u.name,role:u.role}))));
  $('#hdr').hidden=false;$('#navBottom').hidden=false;$('#modeTag').textContent=DB.mode==='local'?'로컬 데모':'';$('#logoutBtn').textContent=KIOSK()?'사용자 바꾸기':'로그아웃';armIdle();$('#meName').innerHTML=`${nm(S.me.name,S.me.role)} <span class="tip">${ROLE_NAME[S.me.role]||S.me.role}</span>`;
  $('#logoutBtn').onclick=async()=>{await DB.logout();location.hash='';renderLogin()};
  const h=location.hash.replace('#','');go(VIEWS.some(v=>v[0]===h)?h:'home')}

/* ==================== 홈 ==================== */
const shiftNow=()=>{const m=hm2min(nowHM());return m<630?'open':m<990?'mid':'close'};
async function home(){const d=today();const v=$('#view');const mgr=isMgr();
  v.innerHTML=`<div class="card"><h2>${d} (${dow(d)}) <span class="tip" id="myShift"></span><span class="clock" id="clock" style="margin-left:auto"></span></h2><div id="attBox"></div></div>
    <div class="card"><h2>오늘 할 일 <span class="tip">위에서부터 차례로</span></h2><div class="flow" id="flow"></div></div>
    <div class="two half"><div class="card"><h2>오늘 근무 ${mgr?'<button class="btn sm" style="margin-left:auto" data-go="shifts">근무표</button>':''}</h2><div id="todayShifts" class="tip">…</div></div>
    <div class="card"><h2>다가오는 일정 <button class="btn sm" style="margin-left:auto" data-go="sched">전체</button></h2><div id="upcoming"></div></div></div>
    ${mgr?`<div class="card"><h2>체크리스트 진행 <button class="btn sm" style="margin-left:auto" data-go="check">열기</button></h2><div id="ckProg"></div></div>`:''}`;
  $$('[data-go]',v).forEach(b=>b.onclick=()=>go(b.dataset.go));
  const tick=()=>{const c=$('#clock');if(c)c.textContent=nowHM()};tick();const iv=setInterval(tick,15000);S.unsub.push(()=>clearInterval(iv));
  renderAttBox();
  const state={att:null,ck:[],log:null,st:null};
  const step=(icon,title,sub,done,btn,view,skip)=>`<div class="st ${done?'ok':''}${skip?' skip':''}"><span class="ic">${done?'✅':icon}</span><div class="tx"><b>${title}</b><small>${sub}</small></div>${view?`<button class="btn sm ${done?'':'pri'}" data-go="${view}">${btn}</button>`:''}</div>`;
  const renderFlow=()=>{const box=$('#flow');if(!box)return;const a=state.att;const sh=shiftNow();const ck=state.ck.find(r=>r.shift===sh);const items=(ck?.items||[]).filter(i=>i.type!=='h');const dn=items.filter(i=>i.done).length;
    box.innerHTML=step('✅',`${DEFAULT_CHECKLISTS[sh].title} 체크리스트`,ck?`${dn}/${items.length} 완료`:'하면서 체크만 하면 끝',ck&&items.length&&dn===items.length,'열기','check')
      +step('📦','재고·발주 체크',state.st?`작성됨 (${state.st.updatedBy||''})`:'14~16시 · 어제 숫자에서 바뀐 것만',!!state.st,'열기','stock')
      +step('📝','일지',state.log?`작성됨 (${state.log.updatedBy||''})`:'마감 전 · 숫자 몇 개 + 메모',!!state.log,'열기','log')
      +step('🔴','퇴근 찍기',a?.out?`${a.out} 퇴근`:'다 끝나고 위 버튼 한 번',!!a?.out);
    $$('[data-go]',box).forEach(b=>b.onclick=()=>go(b.dataset.go))};
  S.unsub.push(DB.watch('attendance',[['date','==',d]],rows=>{state.att=rows.find(r=>r.uid===S.me.id)||null;renderFlow()}));
  S.unsub.push(DB.watch('checklists',[['date','==',d]],rows=>{state.ck=rows;renderFlow();const box=$('#ckProg');if(!box)return;box.innerHTML=['open','mid','close'].map(k=>{const doc=rows.find(r=>r.shift===k);const items=(doc?.items||[]).filter(i=>i.type!=='h');const dn=items.filter(i=>i.done).length;const p=items.length?Math.round(dn/items.length*100):0;
      return `<div style="margin-bottom:8px"><div class="row" style="justify-content:space-between"><b>${DEFAULT_CHECKLISTS[k].title}</b><span class="tip">${doc?dn+'/'+items.length:'시작 전'}</span></div><div class="bar"><i style="width:${p}%"></i></div></div>`}).join('')}));
  S.unsub.push(DB.watch('logs',[['date','==',d]],rows=>{state.log=rows[0]||null;renderFlow()}));
  S.unsub.push(DB.watch('stock',[['date','==',d]],rows=>{state.st=rows[0]||null;renderFlow()}));
  S.unsub.push(DB.watch('shifts',[['date','==',d]],rows=>{const box=$('#todayShifts');if(!box)return;const w=rows.filter(r=>!r.off).sort((a,b)=>a.name.localeCompare(b.name));const off=rows.filter(r=>r.off);const mine=rows.find(r=>r.uid===S.me.id);
    if($('#myShift'))$('#myShift').textContent=mine?(mine.off?'오늘 휴무':'오늘 근무'+(mine.memo?' · '+mine.memo:'')):'';
    box.innerHTML=(w.length?w.map(r=>`<div class="ev"><b>${nmU(r.uid)}</b><span class="tip">${esc(r.memo||'')}</span></div>`).join(''):'<p class="tip">등록된 근무가 없습니다.</p>')+(off.length?`<p class="tip" style="margin:6px 0 0">휴무: ${off.map(r=>esc(r.name)).join(', ')}</p>`:'')}));
  const evs=(await DB.query('schedule',[['year','==',Number(d.slice(0,4))]])).concat(d.slice(5,7)==='12'?await DB.query('schedule',[['year','==',Number(d.slice(0,4))+1]]):[]).filter(e=>e.date>=d&&e.date<=addDays(d,14)).sort((a,b)=>a.date.localeCompare(b.date));
  $('#upcoming').innerHTML=evs.length?evs.slice(0,6).map(e=>`<div class="ev"><span class="dt">${e.date.slice(5)} (${dow(e.date)})</span><span>${SCHED_CATS[e.cat]?.slice(0,2)||''} ${esc(e.title)}</span></div>`).join(''):'<p class="tip">2주 내 일정이 없습니다.</p>';
}
/* 퇴근 박스 (홈·퇴근 공용) — 출근은 기록하지 않음 */
async function renderAttBox(){const box=$('#attBox');if(!box)return;const d=today();const id=`${S.me.id}_${d}`;const a=await DB.get('attendance',id);
  box.innerHTML=`<div class="row" style="margin-bottom:8px"><b>${nm(S.me.name,S.me.role)}</b>${a?.out?`<span class="tag green">퇴근 ${a.out}</span>`:'<span class="tip">퇴근할 때 한 번만 눌러 주세요</span>'}</div>
    <div class="att-btns"><button class="btn big pri" id="btnOut" ${a?.out?'disabled':''}>🔴 퇴근</button></div>`;
  $('#btnOut').onclick=async()=>{if(!confirm(`${nowHM()} 퇴근 처리할까요?`))return;await DB.set('attendance',id,{uid:S.me.id,name:S.me.name,date:d,month:d.slice(0,7),out:nowHM(),memo:a?.memo||''});toast('퇴근 완료. 수고하셨습니다!');renderAttBox()};
}

/* ==================== 출퇴근 ==================== */
async function attend(){const v=$('#view');const m=today().slice(0,7);
  v.innerHTML=`<div class="card"><h2>퇴근</h2><div id="attBox"></div></div>
    <div class="card"><h2>기록 <input type="month" id="attMonth" value="${m}" style="width:150px">${isMgr()?`<select id="attWho" style="width:150px"><option value="">전체</option>${S.roster.filter(u=>u.active!==false).map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select>`:''}<span class="sp"></span>${isMgr()?'<button class="btn sm" id="attCsv">CSV</button><button class="btn sm" id="attAdd">+ 수기 등록</button>':''}</h2>
    <p class="tip">늦게까지 남은 날을 봐두었다가 다른 날 일찍 보내주기 위한 기록입니다. 출근 시각은 기록하지 않습니다.</p><div class="wrap"><table><thead><tr><th>날짜</th><th>이름</th><th>퇴근</th><th>메모</th><th class="noprint"></th></tr></thead><tbody id="attRows"></tbody></table></div></div>`;
  renderAttBox();
  const load=async()=>{const mm=$('#attMonth').value;const who=isMgr()?$('#attWho').value:S.me.id;
    let rows=await DB.query('attendance',[['month','==',mm]]);if(who)rows=rows.filter(r=>r.uid===who);rows.sort((a,b)=>b.date.localeCompare(a.date)||a.name.localeCompare(b.name));
    $('#attRows').innerHTML=rows.map(r=>`<tr><td>${r.date.slice(5)} (${dow(r.date)})</td><td>${nmU(r.uid)}</td><td>${esc(r.out||'')}</td><td class="tip">${esc(r.memo||'')}</td><td class="noprint"><button class="btn sm" data-edit="${r.id}">${isMgr()||r.uid===S.me.id?'메모':''}</button></td></tr>`).join('')||'<tr><td colspan="5" class="tip">기록이 없습니다.</td></tr>';
    $$('#attRows [data-edit]').forEach(b=>b.onclick=()=>editAtt(rows.find(r=>r.id===b.dataset.edit),load));
    if($('#attCsv'))$('#attCsv').onclick=()=>{const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';dl('﻿'+['날짜,요일,이름,퇴근,메모',...rows.map(r=>[r.date,dow(r.date),r.name,r.out,r.memo].map(q).join(','))].join('\n'),`퇴근기록_${mm}.csv`,'text/csv')}};
  $('#attMonth').onchange=load;if($('#attWho'))$('#attWho').onchange=load;
  if($('#attAdd'))$('#attAdd').onclick=()=>editAtt(null,load);
  load();
}
function editAtt(r,after){const mgr=isMgr();
  openModal({title:r?`${r.date} ${r.name}`:'퇴근 수기 등록',body:`<div class="grid">
    ${r?'':`<div><label>직원</label><select id="ea_uid">${S.roster.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select></div><div><label>날짜</label><input type="date" id="ea_date" value="${today()}"></div>`}
    <div><label>퇴근</label><input type="time" id="ea_out" value="${esc(r?.out||'')}" ${mgr?'':'disabled'}></div>
    <div class="w2"><label>메모</label><input type="text" id="ea_memo" value="${esc(r?.memo||'')}" placeholder="마감 정리로 늦게 감 / 조퇴 등"></div></div>`,
    onSave:async bg=>{if(r){const p={memo:$('#ea_memo',bg).value};if(mgr){p.out=$('#ea_out',bg).value}await DB.update('attendance',r.id,p)}
      else{const uid=$('#ea_uid',bg).value,d=$('#ea_date',bg).value;const u=S.roster.find(x=>x.id===uid);await DB.set('attendance',`${uid}_${d}`,{uid,name:u.name,date:d,month:d.slice(0,7),out:$('#ea_out',bg).value,memo:$('#ea_memo',bg).value})}toast('저장했습니다');after()},
    onDelete:mgr&&r?async()=>{await DB.del('attendance',r.id);after()}:null})}

/* ==================== 근무표 ==================== */
function calCells(ym){const first=new Date(ym+'-01T00:00:00');const start=addDays(ymd(first),-((first.getDay()+6)%7));const cells=[];for(let i=0;i<42;i++){const d=addDays(start,i);cells.push(d);if(i>=34&&d.slice(0,7)>ym&&(i+1)%7===0)break}return cells}
async function shifts(){const v=$('#view');let ym=today().slice(0,7);let onlyMe=false;
  v.innerHTML=`<div class="card"><h2><button class="btn sm" id="pm">‹</button><span id="ymLabel" style="font-size:16px"></span><button class="btn sm" id="nm">›</button><input type="month" id="ymPick" style="width:140px">
    <span class="sp"></span><label style="margin:0"><input type="checkbox" id="onlyMe"> 내 근무만</label>${isMgr()?'<button class="btn sm" id="tplBtn">주간 기본 근무</button><button class="btn sm" id="fillBtn">기본 근무로 채우기</button>':''}<button class="btn sm" id="printSh">인쇄</button></h2>
    <p class="tip">${isMgr()?'날짜를 누르면 그날 근무·휴무를 바꿉니다. ':''}이름 옆 글자는 포지션(오픈·마감·케이크), 취소선은 휴무. 색: ${roleLegend()}</p>
    <div class="cal" id="cal"></div></div>`;
  const render=async()=>{$('#ymLabel').textContent=ym.replace('-','년 ')+'월';$('#ymPick').value=ym;
    const rows=await DB.query('shifts',[['month','==',ym]]);const cells=calCells(ym);const t=today();
    $('#cal').innerHTML=['월','화','수','목','금','토','일'].map(x=>`<div class="hd">${x}</div>`).join('')+cells.map(d=>{const day=rows.filter(r=>r.date===d&&(!onlyMe||r.uid===S.me.id)).sort((a,b)=>(a.off?1:0)-(b.off?1:0)||a.name.localeCompare(b.name));
      return `<div class="d ${d.slice(0,7)!==ym?'out':''} ${d===t?'today':''} ${dow(d)==='일'?'sun':''}" data-d="${d}"><div class="n">${Number(d.slice(8))}</div>${day.map(r=>`<span class="chip ${r.off?'off':''}" style="${r.off?'':'background:'+colorOf(r.uid)}">${esc(r.name)}${r.off?' 휴무':(r.memo?' '+esc(r.memo):'')}</span>`).join('')}</div>`}).join('');
    if(isMgr())$$('#cal .d').forEach(c=>c.onclick=()=>editDay(c.dataset.d,rows.filter(r=>r.date===c.dataset.d),render))};
  $('#pm').onclick=()=>{ym=addMonths(ym+'-01',-1).slice(0,7);render()};$('#nm').onclick=()=>{ym=addMonths(ym+'-01',1).slice(0,7);render()};$('#ymPick').onchange=e=>{ym=e.target.value;render()};
  $('#onlyMe').onchange=e=>{onlyMe=e.target.checked;render()};$('#printSh').onclick=()=>window.print();
  if($('#tplBtn'))$('#tplBtn').onclick=()=>editTemplates();
  if($('#fillBtn'))$('#fillBtn').onclick=async()=>{if(!confirm(`${ym} 중 비어 있는 날을 각 직원의 주간 기본 근무로 채웁니다. 진행할까요?`))return;
    const tpls=await DB.query('shiftTemplates');const rows=await DB.query('shifts',[['month','==',ym]]);let n=0;
    for(const d of calCells(ym).filter(x=>x.slice(0,7)===ym)){const wd=new Date(d+'T00:00:00').getDay();for(const u of S.roster.filter(u=>u.active!==false)){if(rows.some(r=>r.uid===u.id&&r.date===d))continue;const tp=tpls.find(t=>t.id===u.id);const day=tp?.days?.[wd];if(!day||day.skip)continue;
      await DB.set('shifts',`${d}_${u.id}`,{date:d,month:ym,uid:u.id,name:u.name,off:!!day.off,memo:day.memo||''});n++}}
    toast(`${n}건 채웠습니다`);render()};
  render();
}
function editDay(d,rows,after){const staff=S.roster.filter(u=>u.active!==false);
  openModal({title:`${d} (${dow(d)}) 근무`,body:`<div class="wrap"><table><thead><tr><th>직원</th><th>상태</th><th>포지션 (선택)</th></tr></thead><tbody>${staff.map(u=>{const r=rows.find(x=>x.uid===u.id);const st=r?(r.off?'off':'work'):'none';
    return `<tr data-uid="${u.id}"><td>${nm(u.name,u.role)}</td><td><select data-k="st"><option value="none" ${st==='none'?'selected':''}>-</option><option value="work" ${st==='work'?'selected':''}>근무</option><option value="off" ${st==='off'?'selected':''}>휴무</option></select></td><td><input type="text" data-k="memo" value="${esc(r?.memo||'')}" placeholder="오픈 / 마감 / 케이크" list="posList"></td></tr>`}).join('')}</tbody></table></div><datalist id="posList"><option value="오픈"><option value="마감"><option value="케이크"><option value="오픈·마감"><option value="연차"><option value="휴가"></datalist>`,
    onSave:async bg=>{for(const tr of $$('tbody tr',bg)){const uid=tr.dataset.uid;const u=staff.find(x=>x.id===uid);const st=$('[data-k=st]',tr).value;const id=`${d}_${uid}`;
      if(st==='none'){if(rows.some(r=>r.uid===uid))await DB.del('shifts',id);continue}
      await DB.set('shifts',id,{date:d,month:d.slice(0,7),uid,name:u.name,off:st==='off',memo:$('[data-k=memo]',tr).value})}
      toast('저장했습니다');after()}})}
async function editTemplates(){const tpls=await DB.query('shiftTemplates');const staff=S.roster.filter(u=>u.active!==false);const DN=['일','월','화','수','목','금','토'];
  openModal({title:'주간 기본 근무 (직원별)',body:`<p class="tip">요일별 근무/휴무만 정해두면 "기본 근무로 채우기"로 한 달을 한 번에 채웁니다. (‑)는 건너뜀.</p>
    ${staff.map(u=>{const tp=tpls.find(t=>t.id===u.id)?.days||{};return `<details open data-uid="${u.id}"><summary>${nm(u.name,u.role)}</summary><div class="row" style="margin:8px 0 4px">
      ${[1,2,3,4,5,6,0].map(wd=>{const dd=tp[wd]||{};const st=dd.skip||!(wd in tp)?'skip':dd.off?'off':'work';return `<label style="margin:0;display:flex;flex-direction:column;align-items:center;gap:2px">${DN[wd]}<select data-wd="${wd}" style="width:64px"><option value="skip" ${st==='skip'?'selected':''}>-</option><option value="work" ${st==='work'?'selected':''}>근무</option><option value="off" ${st==='off'?'selected':''}>휴무</option></select></label>`}).join('')}</div></details>`}).join('')}`,
    onSave:async bg=>{for(const det of $$('details[data-uid]',bg)){const days={};$$('select[data-wd]',det).forEach(sel=>{const st=sel.value;days[sel.dataset.wd]=st==='skip'?{skip:true}:{off:st==='off'}});await DB.set('shiftTemplates',det.dataset.uid,{days})}toast('저장했습니다')}})}

/* ==================== 체크리스트 ==================== */
function parseTemplate(text){return text.split('\n').map(s=>s.trim()).filter(Boolean).map((s,i)=>s.startsWith('##')?{type:'h',t:s.replace(/^#+\s*/,'')}:{t:s,done:false,by:'',at:''})}
async function getTemplate(k){const t=await DB.get('checklistTemplates',k);return t?.text||DEFAULT_CHECKLISTS[k].text}
async function check(){const v=$('#view');let tab=shiftNow();let date=today();let editMode=false;
  v.innerHTML=`<div class="card"><h2>체크리스트 <input type="date" id="ckDate" value="${date}" style="width:150px"><span class="sp"></span>${isMgr()?'<button class="btn sm" id="ckEdit">✏️ 항목 편집</button><button class="btn sm" id="ckTpl">전체 텍스트 편집</button>':''}<button class="btn sm" id="ckAdd">+ 오늘만 추가</button></h2>
    <div class="subtabs" id="ckTabs">${['open','mid','close'].map(k=>`<button data-t="${k}">${DEFAULT_CHECKLISTS[k].title}</button>`).join('')}<button data-t="clean">🧹 월간 청소</button></div>
    <div id="ckBody"></div></div>`;
  const setTab=t=>{tab=t;$$('#ckTabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));S.unsub.forEach(f=>f&&f());S.unsub=[];tab==='clean'?renderClean():renderCk()};
  $$('#ckTabs button').forEach(b=>b.onclick=()=>setTab(b.dataset.t));
  $('#ckDate').onchange=e=>{date=e.target.value;setTab(tab)};
  async function renderCk(){const id=`${date}_${tab}`;const box=$('#ckBody');
    S.unsub.push(DB.watch('checklists',[['date','==',date],['shift','==',tab]],async rows=>{let doc=rows[0];const fresh=!doc;if(fresh)doc={date,shift:tab,items:parseTemplate(await getTemplate(tab))};
      const items=doc.items.filter(i=>i.type!=='h');const dn=items.filter(i=>i.done).length;const p=items.length?Math.round(dn/items.length*100):0;
      const byName=n=>{const u=S.roster.find(x=>x.name===n);return u?nm(n,u.role):esc(n)};
      box.innerHTML=`<div class="row" style="margin-bottom:6px"><b>${dn}/${items.length}</b><span class="tip">${editMode?'✏️ 편집 중: ✎ 글 고치기 · × 빼기 · + 넣기. 바로 저장되고 다음 날부터도 적용됩니다.':p===100?'🎉 끝! 텔레그램 보고만 남았어요.':'하면서 체크만 하면 됩니다.'}</span><span class="sp"></span>${editMode?'<button class="btn sm" data-addh>+ 소제목</button>':'<button class="btn sm" id="ckCopy">📋 보고용 복사</button>'}</div><div class="bar"><i style="width:${p}%"></i></div>
        <ul class="ck ${editMode?'edit':''}">${doc.items.map((it,i)=>it.type==='h'?`<li class="h">${esc(it.t)}<span class="sp"></span>${editMode?`<button class="btn sm" data-addi="${i}">+ 항목</button><button class="btn sm" data-edt="${i}" title="소제목 고치기">✎</button><button class="btn sm danger" data-rmh="${i}">×</button>`:''}</li>`:`<li class="${it.done?'dn':''}" data-i="${i}"><input type="checkbox" ${it.done?'checked':''} ${editMode?'disabled':''}><span class="t">${esc(it.t)}${it.done?`<small>✓ ${byName(it.by)} ${esc(it.at)}</small>`:''}</span>${editMode?`<button class="btn sm" data-edt="${i}" title="글 고치기">✎</button><button class="btn sm danger" data-rmt="${i}" title="이 항목 빼기">×</button>`:it.adhoc?`<button class="btn sm danger" data-rm="${i}">×</button>`:''}</li>`).join('')}${editMode?'<li class="h" style="background:transparent"><button class="btn sm" data-addi="-1">+ 맨 아래에 항목</button></li>':''}</ul>`;
      if(!editMode){$$('li[data-i]',box).forEach(li=>{const cb=$('input',li);const tog=async()=>{const i=Number(li.dataset.i);const it=doc.items[i];it.done=!it.done;it.by=it.done?S.me.name:'';it.at=it.done?nowHM():'';await DB.set('checklists',id,doc)};
        cb.onclick=e=>{e.stopPropagation();tog()};li.onclick=e=>{if(e.target.tagName==='BUTTON')return;tog()}});
      $$('[data-rm]',box).forEach(b=>b.onclick=async e=>{e.stopPropagation();doc.items.splice(Number(b.dataset.rm),1);await DB.set('checklists',id,doc)});}
      /* 편집 모드: 템플릿(영구)과 오늘 문서를 같이 고침 */
      const applyEdit=async fn=>{const lines=(await getTemplate(tab)).split('\n');fn(doc.items,lines);await DB.set('checklistTemplates',tab,{text:lines.filter(l=>l.trim()).join('\n')});await DB.set('checklists',id,doc);toast('반영했습니다')};
      const lineIdx=(lines,it)=>lines.findIndex(l=>(it.type==='h'?l.replace(/^#+\s*/,'').trim()===it.t&&l.trim().startsWith('#'):l.trim()===it.t));
      $$('[data-edt]',box).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.edt);const it=doc.items[i];const t=prompt('내용 수정',it.t);if(!t||!t.trim()||t.trim()===it.t)return;applyEdit((items,lines)=>{const li=lineIdx(lines,it);if(li>=0)lines[li]=(it.type==='h'?'## ':'')+t.trim();it.t=t.trim()})});
      $$('[data-rmt]',box).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.rmt);const it=doc.items[i];if(!confirm(`"${it.t}" 항목을 뺄까요? (이후 매일 체크리스트에서도 빠집니다)`))return;applyEdit((items,lines)=>{const li=lineIdx(lines,it);if(li>=0)lines.splice(li,1);items.splice(i,1)})});
      $$('[data-rmh]',box).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.rmh);const it=doc.items[i];if(!confirm(`소제목 "${it.t}"만 뺄까요? (아래 항목은 남습니다)`))return;applyEdit((items,lines)=>{const li=lineIdx(lines,it);if(li>=0)lines.splice(li,1);items.splice(i,1)})});
      $$('[data-addi]',box).forEach(b=>b.onclick=()=>{const i=Number(b.dataset.addi);const t=prompt('추가할 항목');if(!t||!t.trim())return;applyEdit((items,lines)=>{
        if(i<0){lines.push(t.trim());items.push({t:t.trim(),done:false,by:'',at:''});return}
        // 해당 소제목 아래 마지막 항목 뒤에 삽입
        let j=i+1;while(j<items.length&&items[j].type!=='h')j++;const anchor=items[j-1];const li=lineIdx(lines,anchor);lines.splice(li>=0?li+1:lines.length,0,t.trim());items.splice(j,0,{t:t.trim(),done:false,by:'',at:''})})});
      const ah=$('[data-addh]',box);if(ah)ah.onclick=()=>{const t=prompt('새 소제목 (예: 16시 이후)');if(!t||!t.trim())return;applyEdit((items,lines)=>{lines.push('## '+t.trim());items.push({type:'h',t:t.trim()})})};
      if($('#ckCopy'))$('#ckCopy').onclick=()=>copyText(`[${date} ${DEFAULT_CHECKLISTS[tab].title} 체크] ${dn}/${items.length} 완료\n`+doc.items.filter(i=>i.type!=='h').map(i=>`${i.done?'✅':'⬜'} ${i.t}${i.done?' ('+i.by+' '+i.at+')':''}`).join('\n'))}));}
  if($('#ckEdit'))$('#ckEdit').onclick=()=>{if(tab==='clean')return;editMode=!editMode;$('#ckEdit').textContent=editMode?'✅ 편집 끝':'✏️ 항목 편집';$('#ckEdit').classList.toggle('pri',editMode);setTab(tab)};
  $('#ckAdd').onclick=async()=>{if(tab==='clean')return;const t=prompt('오늘만 추가할 항목');if(!t)return;const id=`${date}_${tab}`;let doc=await DB.get('checklists',id);if(!doc)doc={date,shift:tab,items:parseTemplate(await getTemplate(tab))};doc.items.push({t,done:false,by:'',at:'',adhoc:true});await DB.set('checklists',id,doc)};
  if($('#ckTpl'))$('#ckTpl').onclick=async()=>{if(tab==='clean')return;const text=await getTemplate(tab);
    openModal({title:`${DEFAULT_CHECKLISTS[tab].title} 체크리스트 템플릿`,body:`<p class="tip">한 줄에 한 항목. "## 제목" 줄은 소제목입니다. 순서를 크게 바꿀 때 쓰세요. 저장하면 다음에 새로 시작하는 체크리스트부터 적용됩니다.</p><textarea id="tplText" style="min-height:55vh;font-size:13px">${esc(text)}</textarea><div class="row" style="margin-top:6px"><button class="btn sm" id="tplReset">기본값으로 되돌리기</button></div>`,
      onOpen:bg=>{$('#tplReset',bg).onclick=()=>{$('#tplText',bg).value=DEFAULT_CHECKLISTS[tab].text}},
      onSave:async bg=>{await DB.set('checklistTemplates',tab,{text:$('#tplText',bg).value});toast('템플릿을 저장했습니다')}})};
  async function renderClean(){const m=date.slice(0,7);const box=$('#ckBody');let doc=await DB.get('cleaning',m);
    if(!doc){doc={month:m,items:DEFAULT_CLEAN.map(([n,c,memo])=>({name:n,cycle:c,who:'',done:'',memo}))};
      const prev=await DB.get('cleaning',addMonths(m+'-01',-1).slice(0,7));if(prev)doc.items=prev.items.map(it=>({...it,who:it.cycle==='월1회'?'':it.who,done:it.cycle==='월1회'?'':it.done}));}
    const persist=()=>DB.set('cleaning',m,doc);
    box.innerHTML=`<p class="tip">${m} 월간 청소. 공평하게 돌아가면서, 담당자 이름과 완료일을 적습니다. 6개월·1년 항목은 마지막 교체일 기준으로 다음 예정일을 계산합니다.</p>
      <div class="wrap"><table><thead><tr><th style="width:28%">항목</th><th>주기</th><th>담당자</th><th>완료일</th><th>메모 / 다음 예정</th><th class="noprint"></th></tr></thead><tbody>${doc.items.map((it,i)=>{let next='';if(it.done&&it.cycle!=='월1회'){const nd=addMonths(it.done,it.cycle==='6개월'?6:12);next=`<div class="${nd<=today()?'due':'tip'}">다음 예정 ${nd}${nd<=today()?' (교체 시기 지남)':''}</div>`}
        return `<tr><td><input type="text" value="${esc(it.name)}" data-k="name" data-i="${i}"></td><td><select data-k="cycle" data-i="${i}">${['월1회','6개월','1년'].map(c=>`<option ${c===it.cycle?'selected':''}>${c}</option>`).join('')}</select></td>
        <td><input type="text" value="${esc(it.who)}" data-k="who" data-i="${i}" placeholder="담당자" list="staffNames"></td><td><div class="row" style="flex-wrap:nowrap"><input type="date" value="${esc(it.done)}" data-k="done" data-i="${i}" style="width:140px"><button class="btn sm" data-today="${i}" title="오늘 완료 (내 이름)">O</button></div>${it.done?'<span class="done">완료</span>':''}</td>
        <td><input type="text" value="${esc(it.memo||'')}" data-k="memo" data-i="${i}">${next}</td><td class="noprint"><button class="btn sm danger" data-del="${i}">삭제</button></td></tr>`}).join('')}</tbody></table></div>
      <datalist id="staffNames">${S.roster.map(u=>`<option value="${esc(u.name)}">`).join('')}</datalist>
      <div class="row noprint" style="margin-top:8px"><button class="btn sm" id="clAdd">+ 항목 추가</button><button class="btn sm" id="clPrint">인쇄</button></div>`;
    $$('[data-k]',box).forEach(el=>el.onchange=async()=>{doc.items[Number(el.dataset.i)][el.dataset.k]=el.value;await persist();renderClean()});
    $$('[data-today]',box).forEach(b=>b.onclick=async()=>{const it=doc.items[Number(b.dataset.today)];it.done=today();if(!it.who)it.who=S.me.name;await persist();renderClean()});
    $$('[data-del]',box).forEach(b=>b.onclick=async()=>{if(confirm('항목을 삭제할까요?')){doc.items.splice(Number(b.dataset.del),1);await persist();renderClean()}});
    $('#clAdd').onclick=async()=>{doc.items.push({name:'',cycle:'월1회',who:'',done:'',memo:''});await persist();renderClean()};$('#clPrint').onclick=()=>window.print()}
  setTab(tab);
}

/* ==================== 재고·발주 ==================== */
const OF=['date','by','orders','report','prod','prodMemo','sheetMemo','fruitUseA','fruitUseB','fruitOrder','fruitMemo','creamUse','creamPlan','etcMemo'];
async function stock(){const v=$('#view');let tab='check';
  v.innerHTML=`<div class="subtabs"><button data-t="check" class="on">📦 발주·재고 체크</button><button data-t="ref">📒 발주 기준표</button><button data-t="season">🍓 과일 시즌</button></div><div id="stBody"></div>`;
  $$('.subtabs button',v).forEach(b=>b.onclick=()=>{tab=b.dataset.t;$$('.subtabs button',v).forEach(x=>x.classList.toggle('on',x===b));({check:stockCheck,ref:stockRef,season:stockSeason})[tab]()});
  stockCheck();
}
/* 자동 저장: 컨테이너 안 입력이 바뀌면 1.2초 뒤 fn 실행 */
function autosave(container,fn,status){let t=null;const mark=s=>{if(status&&$(status))$(status).textContent=s};const h=()=>{mark('입력 중…');clearTimeout(t);t=setTimeout(async()=>{try{await fn();mark('자동 저장됨 '+nowHM())}catch(e){mark('저장 실패');console.error(e)}},1200)};container.addEventListener('input',h);container.addEventListener('change',h);return h}
const tipd=(title,body)=>`<details class="tipd"><summary>${title}</summary><div class="tipbox">${body}</div></details>`;
async function stockCheck(){const box=$('#stBody');let cur=null,curStock={},custom=(await DB.get('stockConfig','main'))?.customItems||[];let month=today().slice(0,7);
  const allItems=()=>STOCK_ITEMS.concat(custom.map(c=>[c.g,c.name,c.unit,c.re,c.memo,true]));
  const grp=(g,title,extra='')=>`<details ${['sheet','fruit','cream','bar','sub'].includes(g)?'open':''} class="sg"><summary>${title}</summary>${extra}<div class="stock" id="st_${g}"></div></details>`;
  box.innerHTML=`<div class="two"><div><div class="card"><h2>체크 목록 <span class="sp"></span><button class="btn sm pri" id="newOrd">+ 오늘</button></h2><div class="row" style="margin-bottom:8px"><input type="month" id="ordMonth" value="${month}"></div><div class="list" id="ordList"></div></div>
    <div class="card noprint"><h2>이번 주 사용량 <span class="tag" id="weekLabel"></span></h2><label>과일 (알 / 병)</label><div class="week" id="weekFruit"></div><label style="margin-top:8px">생크림 (통)</label><div class="week" id="weekCream"></div><p class="tip" style="margin:6px 0 0">토요일 마감 전에 이 숫자로 주 단위 발주.</p></div></div>
    <div><div class="card" id="ordForm"><h2>발주·재고 체크 <span id="ordTitle" class="tag"></span><span class="tip" id="ordStatus"></span><span class="sp"></span><button class="btn sm pri" id="copyOrd">📋 텔레그램 복사</button>${isMgr()?'<button class="btn sm danger noprint" id="delOrd">삭제</button>':''}</h2>
      <p class="tip">어제 숫자가 들어 있어요. <b>바뀐 것만</b> 고치면 자동 저장됩니다. 주황색은 발주 넣을 때.</p>
      <h3>🛒 발주 넣을 것</h3><div id="autoNeed" class="row" style="margin-bottom:6px"></div><textarea id="o_orders" style="min-height:70px" placeholder="예: 난황 10개, 에타용 휘핑크림 12통"></textarea>
      <div class="grid" style="margin-top:8px"><div class="w2"><label>오늘 조각케이크 생산</label><input type="text" id="o_prod" placeholder="망2 무피2 초체1 복1 멜1"></div><div><label>과일 사용 (알)</label><input type="number" id="o_fruitUseA" step="0.5"></div><div><label>과일 사용 (병)</label><input type="number" id="o_fruitUseB" step="0.5"></div><div><label>생크림 사용 (통)</label><input type="number" id="o_creamUse"></div><div class="w3"><label>과일 주문·입고 예정</label><input type="text" id="o_fruitOrder" placeholder="월요일 망고 2박스"></div></div>
      ${grp('sheet','🍞 시트')}${grp('fruit','🥭 과일 재고',tipd('사장님 꿀팁','망고 1박스 최대 58,000원. 후숙 과일은 1~1.5박스 여유. 조림 복숭아 반박스 남으면 미리 주문. 주마다 과일 단가 체크. 파손 시 바로 A/S.'))}${grp('cream','🥛 생크림')}${grp('bar','☕ 우유 · 원두 · 휘핑크림')}${grp('sub','🥚 매일 쓰는 부재료')}${grp('pack','📦 포장 재료 <span class="tip">(주 1회 정도)</span>')}${grp('etc','🍧 빙수 · 기타 <span class="tip">(4~10월)</span>',tipd('빙수 재료 메모','공통: 연유. 우유+말차팥: 빙수팥/인절미가루/인절미다이스/모나카(일본 10일 전)/말차가루. 토마토: 토마토청(반통 남으면 담그기, 숙성 3~4일)/홀토마토/레몬즙. 망고: 다크블라썸/냉동망고/코코넛밀크/패션후르츠퓨레.'))}
      <details class="tipd"><summary>더 적기 (특이사항 · 메모)</summary><div class="grid" style="margin-top:8px"><div class="w3"><label>총괄 보고할 특이사항</label><textarea id="o_report" style="min-height:60px" placeholder="냉장고 고장, 키위 3일 전 미리 말하기 등"></textarea></div><div class="w2"><label>생산 메모</label><input type="text" id="o_prodMemo"></div><div class="w2"><label>시트 메모</label><input type="text" id="o_sheetMemo"></div><div class="w2"><label>과일 메모</label><input type="text" id="o_fruitMemo"></div><div class="w2"><label>생크림 입고 예정</label><input type="text" id="o_creamPlan" placeholder="월·수·금 20통씩"></div><div class="w2"><label>기타 메모</label><input type="text" id="o_etcMemo"></div><div><label>날짜</label><input type="date" id="o_date"></div><div><label>작성자</label><input type="text" id="o_by"></div></div></details>
      ${isMgr()?'<div class="row noprint" style="margin-top:12px"><button class="btn sm" id="addItem">+ 재고 항목 추가</button></div>':''}
    </div></div></div>`;
  const needs=()=>allItems().filter(([g,n,u,re])=>re!=null&&curStock[n]!==''&&curStock[n]!=null&&Number(curStock[n])<=re).map(x=>x[1]);
  function renderStock(){Object.keys(STOCK_GROUPS).forEach(g=>$('#st_'+g).innerHTML='');
    allItems().forEach(([g,name,unit,re,memo,isCustom])=>{const val=curStock[name]??'';const need=re!=null&&val!==''&&Number(val)<=re;const el=document.createElement('div');el.className='it'+(need?' need':'');
      el.innerHTML=`<span class="nm">${esc(name)}${re!=null?`<small>${re}${unit} 이하면 발주</small>`:''}</span><input type="number" step="0.5" inputmode="decimal" value="${esc(val)}"><span class="u">${unit}</span>${isCustom&&isMgr()?'<button class="btn sm danger" title="항목 삭제">×</button>':''}`;
      $('input',el).oninput=e=>{curStock[name]=e.target.value;el.classList.toggle('need',re!=null&&e.target.value!==''&&Number(e.target.value)<=re);renderNeed()};
      if(isCustom&&isMgr())$('button',el).onclick=async()=>{if(confirm(`"${name}" 항목을 삭제할까요?`)){custom=custom.filter(c=>c.name!==name);await DB.set('stockConfig','main',{customItems:custom});renderStock()}};
      $('#st_'+g).appendChild(el)});renderNeed()}
  function renderNeed(){const n=needs();$('#autoNeed').innerHTML=n.length?`<span class="tag red">발주점 이하 ${n.length}</span>`+n.map(x=>`<button class="btn sm" data-add="${esc(x)}">+ ${esc(x)}</button>`).join(''):'<span class="tag green">발주점 이하 없음</span>';
    $$('#autoNeed [data-add]').forEach(b=>b.onclick=()=>{const t=$('#o_orders');const it=allItems().find(x=>x[1]===b.dataset.add);if(!t.value.includes(it[1]))t.value=(t.value?t.value.replace(/\n?$/,'\n'):'')+it[1]+(it[4]?' ('+it[4]+')':'');t.dispatchEvent(new Event('input',{bubbles:true}))})}
  async function renderList(){month=$('#ordMonth').value;const rows=(await DB.query('stock',[['month','==',month]])).sort((a,b)=>b.date.localeCompare(a.date));const list=$('#ordList');
    list.innerHTML=rows.length?rows.map(o=>`<button class="${o.date===cur?'on':''}" data-d="${o.date}">${o.date.slice(5)} (${dow(o.date)}) ${o.by?'· '+esc(o.by):''}<small>${esc((o.orders||'').split('\n').filter(Boolean).join(', ')).slice(0,40)||'발주 없음'}</small></button>`).join(''):'<p class="tip">이 달 체크가 없습니다.</p>';
    $$('[data-d]',list).forEach(b=>b.onclick=()=>open(b.dataset.d));renderWeek()}
  async function renderWeek(){const base=cur||today();const mon=weekMon(base);const days=[0,1,2,3,4,5].map(i=>addDays(mon,i));$('#weekLabel').textContent=`${mon.slice(5)} ~ ${days[5].slice(5)}`;
    const months=[...new Set(days.map(d=>d.slice(0,7)))];let docs=[];for(const m of months)docs=docs.concat(await DB.query('stock',[['month','==',m]]));const get=d=>docs.find(x=>x.date===d);
    const tA=days.reduce((a,x)=>a+(Number(get(x)?.fruitUseA)||0),0),tB=days.reduce((a,x)=>a+(Number(get(x)?.fruitUseB)||0),0),tC=days.reduce((a,x)=>a+(Number(get(x)?.creamUse)||0),0);
    $('#weekFruit').innerHTML=days.map(x=>{const o=get(x);return `<div><span>${dow(x)}</span><b>${o&&(o.fruitUseA||o.fruitUseB)?`${o.fruitUseA||0}/${o.fruitUseB||0}`:'·'}</b></div>`}).join('')+`<div class="tot"><span>합계</span><b>${tA}알 ${tB}병</b></div>`;
    $('#weekCream').innerHTML=days.map(x=>{const o=get(x);return `<div><span>${dow(x)}</span><b>${o&&o.creamUse!==''&&o.creamUse!=null?o.creamUse:'·'}</b></div>`}).join('')+`<div class="tot"><span>합계</span><b>${tC}</b></div>`}
  async function open(d){cur=d;let o=await DB.get('stock',d);if(!o){const all=await DB.query('stock');const prev=all.filter(x=>x.date<d).sort((a,b)=>a.date.localeCompare(b.date)).pop();o={date:d,month:d.slice(0,7),by:S.me.name,stock:prev?{...prev.stock}:{},creamPlan:prev?.creamPlan||''}}
    OF.forEach(k=>{$('#o_'+k).value=o[k]??''});$('#o_date').value=d;if(!o.by)$('#o_by').value=S.me.name;curStock={...(o.stock||{})};$('#ordTitle').textContent=`${d} (${dow(d)})`;$('#ordStatus').textContent='';renderStock();renderList()}
  const read=()=>{const o={stock:{...curStock}};OF.forEach(k=>{o[k]=$('#o_'+k).value});o.month=o.date.slice(0,7);return o};
  const save=async()=>{const o=read();if(!o.date)return;if(cur&&cur!==o.date)await DB.del('stock',cur);await DB.set('stock',o.date,o);cur=o.date;renderList()};
  autosave($('#ordForm'),save,'#ordStatus');
  $('#newOrd').onclick=()=>{$('#ordMonth').value=today().slice(0,7);open(today())};
  if($('#delOrd'))$('#delOrd').onclick=async()=>{if(cur&&confirm(cur+' 체크를 삭제할까요?')){await DB.del('stock',cur);cur=null;curStock={};OF.forEach(k=>$('#o_'+k).value='');$('#ordTitle').textContent='';renderStock();renderList()}};
  $('#ordMonth').onchange=renderList;
  if($('#addItem'))$('#addItem').onclick=async()=>{const g=prompt('그룹: sheet(시트) fruit(과일) cream(생크림) bar(우유·원두·휘핑) sub(부재료) pack(포장) etc(빙수·기타)','etc');if(!g||!STOCK_GROUPS[g])return;const name=prompt('품목명');if(!name)return;const unit=prompt('단위','개')||'개';const re=prompt('발주점 (이 수량 이하이면 발주 표시, 없으면 비워두기)','');const memo=prompt('발주 메모 (거래처·주문량)','')||'';
    custom.push({g,name,unit,re:re===''?null:Number(re),memo});await DB.set('stockConfig','main',{customItems:custom});renderStock()};
  $('#copyOrd').onclick=async()=>{await save();const o=read();const n=needs();const g=x=>allItems().filter(y=>y[0]===x&&curStock[y[1]]!==''&&curStock[y[1]]!=null).map(y=>y[1]+' '+curStock[y[1]]+y[2]).join(', ')||'-';
    copyText(`[발주·재고 체크] ${o.date} (${dow(o.date)}) ${o.by||''}\n■ 발주 넣을 것\n${o.orders||'-'}${n.length?'\n(발주점 이하: '+n.join(', ')+')':''}\n■ 특이사항\n${o.report||'-'}\n■ 조각케이크 생산: ${o.prod||'-'} ${o.prodMemo||''}\n■ 시트: ${g('sheet')} ${o.sheetMemo||''}\n■ 과일 사용 ${o.fruitUseA||0}알 / ${o.fruitUseB||0}병 · 재고: ${g('fruit')}\n  주문: ${o.fruitOrder||'-'} ${o.fruitMemo||''}\n■ 생크림 사용 ${o.creamUse||0}통 · 재고 ${g('cream')} · ${o.creamPlan||''}\n■ 우유·원두·휘핑: ${g('bar')}\n■ 부재료: ${g('sub')}\n■ 포장: ${g('pack')}\n■ 빙수·기타: ${g('etc')} ${o.etcMemo||''}`)};
  await renderList();open(today());
}

function stockRef(){const box=$('#stBody');box.innerHTML=`<div class="card"><h2>발주 기준표 (거래처·주문 시점)<span class="sp"></span><input type="search" id="refSearch" placeholder="품목·거래처 검색" style="width:220px"></h2><p class="tip">노션 "재료 재고 관리" 기준. 네이버 주문 거래처를 모르겠으면 네이버페이 결제내역에서 검색해서 재구매. 연휴 전에는 미리미리 주문.</p><div id="refTables"></div></div>`;
  const render=()=>{const q=($('#refSearch').value||'').trim().toLowerCase();const t=$('#refTables');t.innerHTML='';Object.entries(REF_TABLES).forEach(([grp,rows])=>{const r=rows.filter(x=>!q||x.join(' ').toLowerCase().includes(q));if(!r.length)return;const d=document.createElement('details');d.open=!!q||grp==='디저트';
    d.innerHTML=`<summary>${grp} <span class="tag">${r.length}</span></summary><div class="wrap"><table><thead><tr><th>품목</th><th>규격</th><th>1회 주문량</th><th>주문 시기</th><th>주문처</th><th>연락처</th><th>정산/비고</th></tr></thead><tbody>${r.map(x=>'<tr>'+x.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')}</tbody></table></div>`;t.appendChild(d)})};
  $('#refSearch').oninput=render;render()}
function stockSeason(){const mo=new Date().getMonth()+1;$('#stBody').innerHTML=`<div class="card"><h2>과일 시즌표 (한판 케이크 기준 중량) <span class="tag green">이번 달 ${mo}월</span></h2><p class="tip">과일은 거의 다 망고 사장님(010-3748-9994)께 주문. 복숭아는 미스터돌 병조림, 6~8월, 반박스 남을 때 꼭 주문. 과일은 재고+제품 선별이 중요하므로 입고 시 잘 체크.</p>
  <div class="wrap"><table class="season"><thead><tr><th>시기</th><th>종류</th><th>중량 (한판 기준)</th></tr></thead><tbody>${SEASON.map(([p,k,w,ms])=>`<tr>${[p,k,w].map(c=>`<td class="${ms.includes(mo)?'now':''}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`}

/* ==================== 가게 스케줄 ==================== */
const CAT_COLOR={season:'#e8735a',order:'#b8860b',event:'#8e44ad',shoot:'#2471a3',clean:'#5a7d6a',edu:'#16a085',off:'#7f8c8d',meet:'#c0392b',etc:'#a08c7a'};
async function sched(){const v=$('#view');let ym=today().slice(0,7);let mode='month';
  v.innerHTML=`<div class="card"><h2><div class="subtabs" style="margin:0"><button data-m="month" class="on">월</button><button data-m="year">연간</button></div>
    <button class="btn sm" id="pm">‹</button><span id="ymLabel" style="font-size:16px"></span><button class="btn sm" id="nm">›</button><span class="sp"></span>${isMgr()?'<button class="btn sm pri" id="evAdd">+ 일정</button><button class="btn sm" id="planFill">연간 기본 플랜 채우기</button><button class="btn sm" id="planCopy">전년도 복사</button>':''}</h2>
    <p class="tip">가게 월별 스케줄은 1~2달 전에 미리 잡고, 연간 뷰로 내년 1년치를 계획합니다. ${Object.entries(SCHED_CATS).map(([k,n])=>`<span class="dot" style="background:${CAT_COLOR[k]}"></span>${n.slice(2)}`).join(' · ')}</p>
    <div id="schBody"></div></div>`;
  const yr=()=>Number(ym.slice(0,4));
  const load=async()=>{const rows=await DB.query('schedule',[['year','==',yr()]]);return rows.sort((a,b)=>a.date.localeCompare(b.date))};
  const render=async()=>{const rows=await load();$('#ymLabel').textContent=mode==='month'?ym.replace('-','년 ')+'월':yr()+'년';const b=$('#schBody');
    if(mode==='month'){const cells=calCells(ym);b.innerHTML=`<div class="cal">${['월','화','수','목','금','토','일'].map(x=>`<div class="hd">${x}</div>`).join('')}${cells.map(d=>{const evs=rows.filter(e=>e.date===d||(e.endDate&&e.date<d&&e.endDate>=d));
        return `<div class="d ${d.slice(0,7)!==ym?'out':''} ${d===today()?'today':''} ${dow(d)==='일'?'sun':''}" data-d="${d}"><div class="n">${Number(d.slice(8))}</div>${evs.map(e=>`<span class="chip" style="background:${CAT_COLOR[e.cat]||'#999'}" data-e="${e.id}">${esc(e.title)}</span>`).join('')}</div>`}).join('')}</div>
        <h3>이 달 일정</h3>${rows.filter(e=>e.date.slice(0,7)===ym).map(e=>`<div class="ev" data-e="${e.id}" style="cursor:pointer"><span class="dt">${e.date.slice(5)} (${dow(e.date)})</span><span><span class="dot" style="background:${CAT_COLOR[e.cat]}"></span>${esc(e.title)}${e.endDate?` <span class="tip">~${e.endDate.slice(5)}</span>`:''}${e.memo?`<div class="tip">${esc(e.memo)}</div>`:''}</span></div>`).join('')||'<p class="tip">일정이 없습니다.</p>'}`;
      if(isMgr())$$('.cal .d',b).forEach(c=>c.onclick=e=>{if(e.target.dataset.e)return;editEvent({date:c.dataset.d},render)});
    }else{b.innerHTML=`<div class="ymonth">${Array.from({length:12},(_,i)=>{const m=`${yr()}-${pad(i+1)}`;const evs=rows.filter(e=>e.date.slice(0,7)===m);return `<div class="m"><h4>${i+1}월 <span class="tip">${evs.length}건</span></h4>${evs.map(e=>`<div class="ev" data-e="${e.id}" style="cursor:pointer"><span class="dt">${e.date.slice(8)}일</span><span><span class="dot" style="background:${CAT_COLOR[e.cat]}"></span>${esc(e.title)}</span></div>`).join('')||'<p class="tip">-</p>'}</div>`}).join('')}</div>`}
    $$('[data-e]',b).forEach(el=>el.onclick=ev=>{ev.stopPropagation();const e=rows.find(x=>x.id===el.dataset.e);if(isMgr())editEvent(e,render);else alert(`${e.date} ${e.title}\n${e.memo||''}`)})};
  $$('[data-m]',v).forEach(bt=>bt.onclick=()=>{mode=bt.dataset.m;$$('[data-m]',v).forEach(x=>x.classList.toggle('on',x===bt));render()});
  $('#pm').onclick=()=>{ym=mode==='month'?addMonths(ym+'-01',-1).slice(0,7):(yr()-1)+ym.slice(4);render()};$('#nm').onclick=()=>{ym=mode==='month'?addMonths(ym+'-01',1).slice(0,7):(yr()+1)+ym.slice(4);render()};
  if($('#evAdd'))$('#evAdd').onclick=()=>editEvent({date:mode==='month'?ym+'-01':today()},render);
  if($('#planFill'))$('#planFill').onclick=async()=>{const y=Number(prompt('어느 해에 채울까요? (예: 내년 1년치)',yr()+1));if(!y)return;const rows=await DB.query('schedule',[['year','==',y]]);let n=0;
    const lastDay=m=>new Date(y,m,0).getDate();const put=async(m,d,cat,title,memo)=>{const date=`${y}-${pad(m)}-${pad(d)}`;if(rows.some(e=>e.date===date&&e.title===title))return;await DB.set('schedule',`ev_${date}_${Math.random().toString(36).slice(2,6)}`,{date,endDate:'',year:y,month:date.slice(0,7),cat,title,memo:memo||'',auto:true});n++};
    for(const [m,d,cat,t,memo] of ANNUAL_PLAN)await put(m,d,cat,t,memo);for(let m=1;m<=12;m++)for(const [d,cat,t] of MONTHLY_PLAN)await put(m,d===0?lastDay(m):d,cat,t,'');
    toast(`${y}년 기본 플랜 ${n}건 추가`);ym=`${y}-01`;mode='year';$$('[data-m]',v).forEach(x=>x.classList.toggle('on',x.dataset.m==='year'));render()};
  if($('#planCopy'))$('#planCopy').onclick=async()=>{const y=yr();const prev=await DB.query('schedule',[['year','==',y-1]]);if(!prev.length)return alert(`${y-1}년 일정이 없습니다`);if(!confirm(`${y-1}년 일정 ${prev.length}건을 ${y}년으로 복사할까요? (같은 날짜·제목은 건너뜀)`))return;const rows=await load();let n=0;
    for(const e of prev){const date=String(y)+e.date.slice(4);if(rows.some(x=>x.date===date&&x.title===e.title))continue;await DB.set('schedule',`ev_${date}_${Math.random().toString(36).slice(2,6)}`,{...e,date,endDate:e.endDate?String(y)+e.endDate.slice(4):'',year:y,month:date.slice(0,7)});n++}toast(`${n}건 복사`);render()};
  render();
}
function editEvent(e,after){const isNew=!e.id;
  openModal({title:isNew?'일정 추가':'일정 편집',body:`<div class="grid"><div><label>날짜</label><input type="date" id="ev_date" value="${esc(e.date)}"></div><div><label>종료일 (기간이면)</label><input type="date" id="ev_end" value="${esc(e.endDate||'')}"></div>
    <div class="w2"><label>제목</label><input type="text" id="ev_title" value="${esc(e.title||'')}" placeholder="예: 크리스마스 케이크 촬영"></div><div><label>분류</label><select id="ev_cat">${Object.entries(SCHED_CATS).map(([k,n])=>`<option value="${k}" ${e.cat===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="w3"><label>메모</label><textarea id="ev_memo" style="min-height:70px">${esc(e.memo||'')}</textarea></div></div>`,
    onSave:async bg=>{const date=$('#ev_date',bg).value,title=$('#ev_title',bg).value.trim();if(!date||!title)throw new Error('날짜와 제목을 입력하세요');
      await DB.set('schedule',e.id||`ev_${date}_${Math.random().toString(36).slice(2,6)}`,{date,endDate:$('#ev_end',bg).value,year:Number(date.slice(0,4)),month:date.slice(0,7),cat:$('#ev_cat',bg).value,title,memo:$('#ev_memo',bg).value,createdBy:e.createdBy||S.me.name});toast('저장했습니다');after()},
    onDelete:isNew?null:async()=>{await DB.del('schedule',e.id);after()}})}

/* ==================== 일지 + 생산량 + 입고 ==================== */
const LF=['date','weather','staffOpen','staffMid','staffClose','staffOff','bossWork','flow','best','full','complaint','visit','midSales','sales','baemin','coupang','naver','service','waste','egg','whole','star','pieceCnt','bingsu','piece','produced','tomorrow','inSheet','inCream','inFruit','closeStock','orderNote','notice','cleaning','report','memo'];
async function log(){const v=$('#view');let cur=null;let month=today().slice(0,7);
  v.innerHTML=`<div class="two"><div><div class="card"><h2>일지 목록 <span class="sp"></span><button class="btn sm pri" id="newLog">+ 오늘</button></h2><div class="row" style="margin-bottom:8px"><input type="month" id="logMonth" value="${month}"></div><div class="list" id="logList"></div></div>
    ${isMgr()?'<div class="card noprint"><h2>이번 달 합계</h2><div class="kpi" id="logKpi"></div><div class="row"><button class="btn sm" id="csvLog">CSV</button><button class="btn sm" id="printLog">인쇄</button></div></div>':'<div id="logKpi" hidden></div>'}</div>
    <div><div class="card" id="logForm"><h2>일지 <span id="logTitle" class="tag"></span><span class="tip" id="logStatus"></span><span class="sp"></span><button class="btn sm pri" id="copyLog">📋 텔레그램 복사</button>${isMgr()?'<button class="btn sm danger noprint" id="delLog">삭제</button>':''}</h2>
      <p class="tip">숫자 몇 개랑 메모만 적으면 됩니다. 자동 저장돼요.</p>
      <div class="grid"><div><label>날씨</label><input type="text" id="f_weather" placeholder="맑음 / 비"></div><div class="w3"><label>손님 흐름 · 잘 나간 것 (한 줄)</label><input type="text" id="f_flow" placeholder="12시부터 몰림, 2시 만석 / 무화과·빙수 잘 나감"></div></div>
      <h3>🍰 오늘 숫자</h3><div class="grid"><div><label>에그타르트 구운 갯수</label><input type="number" id="f_egg" inputmode="numeric"></div><div><label>홀케이크</label><input type="number" id="f_whole" inputmode="numeric"></div><div><label>조각케이크</label><input type="number" id="f_pieceCnt" inputmode="numeric"></div><div><label>빙수</label><input type="number" id="f_bingsu" inputmode="numeric"></div><div><label>별의조각</label><input type="number" id="f_star" inputmode="numeric"></div><div><label>총매출 (원)</label><input type="number" id="f_sales" inputmode="numeric"></div><div><label>배민 (건)</label><input type="number" id="f_baemin" inputmode="numeric"></div><div><label>쿠팡 (건)</label><input type="number" id="f_coupang" inputmode="numeric"></div>
        <div class="w2"><label>조각케이크 내역</label><input type="text" id="f_piece" placeholder="망17,멜9,복요8 / 전일 티4"></div><div class="w2"><label>마감 남은 재고</label><input type="text" id="f_closeStock" placeholder="망4,감자2 / 망고 19알, 생크림 11통"></div><div class="w2"><label>폐기</label><input type="text" id="f_waste"></div><div class="w2"><label>서비스 나간 것</label><input type="text" id="f_service"></div></div>
      <h3>🗒 메모 <span class="tip">한 줄에 한 가지</span></h3><div class="row noprint" style="margin-bottom:6px"><button class="btn sm" data-ins="⏱ ">⏱ 시각</button><button class="btn sm" data-ins="🔴 " style="color:var(--red)">🔴 재고·폐기</button><button class="btn sm" data-ins="🔵 " style="color:var(--blue)">🔵 서비스</button><button class="btn sm" data-ins="⭐ ">⭐ 손님·주문</button><button class="btn sm" data-ins="✅ ">✅ 사장님 확인</button></div>
      <textarea class="tall" id="f_memo" placeholder="⏱ 11:00 에타 30구 예약 전화 → 2시까지 가능 안내&#10;🔴 토마토청 곰팡이 → 폐기&#10;🔵 감자파이 1개 서비스&#10;⭐ 쿠팡 우유빙수 재고 없어 통화 후 취소"></textarea>
      <details class="tipd" style="margin-top:12px"><summary>더 적기 (근무·입고·보고 등 선택)</summary><div class="grid" style="margin-top:8px"><div><label>오픈</label><input type="text" id="f_staffOpen" list="staffNames"></div><div><label>미들</label><input type="text" id="f_staffMid"></div><div><label>마감</label><input type="text" id="f_staffClose" list="staffNames"></div><div><label>휴무</label><input type="text" id="f_staffOff"></div><div class="w2"><label>사장님 업무</label><input type="text" id="f_bossWork"></div><div class="w2"><label>잘 나간 메뉴</label><input type="text" id="f_best"></div><div><label>만석·웨이팅</label><input type="text" id="f_full"></div><div><label>컴플레인</label><input type="text" id="f_complaint"></div><div class="w2"><label>관공서·사장님 찾는 방문</label><input type="text" id="f_visit"></div><div><label>중간 매출 (15시 이전)</label><input type="number" id="f_midSales"></div><div><label>네이버 주문 (건)</label><input type="number" id="f_naver"></div><div class="w2"><label>오늘 생산한 케이크</label><input type="text" id="f_produced"></div><div class="w2"><label>내일 주문 케이크</label><input type="text" id="f_tomorrow"></div><div><label>시트 입고</label><input type="number" id="f_inSheet"></div><div><label>생크림 입고</label><input type="number" id="f_inCream"></div><div><label>과일 입고</label><input type="number" id="f_inFruit"></div><div class="w3"><label>재료 발주 관련</label><input type="text" id="f_orderNote"></div><div class="w2"><label>직원 공지</label><input type="text" id="f_notice"></div><div class="w2"><label>청소 여부</label><input type="text" id="f_cleaning"></div><div class="w3"><label>사장님께 보고할 사항</label><textarea id="f_report" style="min-height:60px"></textarea></div><div><label>날짜</label><input type="date" id="f_date"></div></div></details>
      <datalist id="staffNames">${S.roster.map(u=>`<option value="${esc(u.name)}">`).join('')}</datalist>
      <div style="margin-top:8px"><div class="memo-view" id="memoView" hidden></div></div></div></div></div>`;
  const renderMemo=()=>{const mv=$('#memoView');const val=$('#f_memo').value;mv.hidden=!val;mv.innerHTML=val.split('\n').map(l=>`<span class="${l.startsWith('🔴')?'r':l.startsWith('🔵')?'b':(l.startsWith('⭐')||l.startsWith('✅'))?'s':''}">${esc(l)}</span>`).join('\n')};
  $('#f_memo').addEventListener('input',renderMemo);
  $$('[data-ins]',v).forEach(b=>b.onclick=()=>{const t=$('#f_memo');let ins=b.dataset.ins;if(ins.startsWith('⏱'))ins+=nowHM()+' ';const s=t.selectionStart;const before=t.value.slice(0,s);const nl=(before&&!before.endsWith('\n'))?'\n':'';t.value=before+nl+ins+t.value.slice(s);t.focus();t.selectionStart=t.selectionEnd=(before+nl+ins).length;t.dispatchEvent(new Event('input',{bubbles:true}))});
  async function renderList(){month=$('#logMonth').value;const rows=(await DB.query('logs',[['month','==',month]])).sort((a,b)=>b.date.localeCompare(a.date));
    $('#logList').innerHTML=rows.length?rows.map(l=>`<button class="${l.date===cur?'on':''}" data-d="${l.date}">${l.date.slice(5)} (${dow(l.date)}) ${l.sales?'· '+fmt(l.sales)+'원':''}<small>${esc(l.updatedBy||'')} ${esc((l.memo||'').split('\n')[0]).slice(0,36)}</small></button>`).join(''):'<p class="tip">이 달 일지가 없습니다.</p>';
    $$('#logList [data-d]').forEach(b=>b.onclick=()=>open(b.dataset.d));
    if(!isMgr())return;const sum=k=>rows.reduce((a,l)=>a+(Number(l[k])||0),0);$('#logKpi').innerHTML=[['영업일',rows.length,'일'],['총매출',fmt(sum('sales')),'원'],['에그타르트',sum('egg'),'개'],['홀케이크',sum('whole'),'개'],['조각케이크',sum('pieceCnt'),'개'],['빙수',sum('bingsu'),'개'],['배달',sum('baemin')+sum('coupang')+sum('naver'),'건']].map(([t,n,u])=>`<div><span>${t}</span><b>${n}<small style="font-size:11px;font-weight:400"> ${u}</small></b></div>`).join('');
    $('#csvLog').onclick=()=>{const q=s=>'"'+String(s??'').replace(/"/g,'""')+'"';dl('﻿'+['날짜,요일,'+LF.slice(1).join(','),...rows.slice().reverse().map(l=>[l.date,dow(l.date),...LF.slice(1).map(k=>l[k])].map(q).join(','))].join('\n'),`운영일지_${month}.csv`,'text/csv')};$('#printLog').onclick=()=>window.print()}
  async function open(d){cur=d;const l=(await DB.get('logs',d))||{date:d};LF.forEach(k=>{$('#f_'+k).value=l[k]??''});$('#f_date').value=d;$('#logTitle').textContent=`${d} (${dow(d)})`+(l.updatedBy?` · ${l.updatedBy}`:'');$('#logStatus').textContent='';renderMemo();renderList();
    if(!l.staffOpen&&!l.staffClose){const sh=await DB.query('shifts',[['date','==',d]]);const w=sh.filter(s=>!s.off);const has=(s,k)=>(s.memo||'').includes(k);$('#f_staffOpen').value=w.filter(s=>has(s,'오픈')).map(s=>s.name).join(', ');$('#f_staffClose').value=w.filter(s=>has(s,'마감')).map(s=>s.name).join(', ');$('#f_staffMid').value=w.filter(s=>!has(s,'오픈')&&!has(s,'마감')).map(s=>s.name).join(', ');$('#f_staffOff').value=sh.filter(s=>s.off).map(s=>s.name).join(', ')}}
  const read=()=>{const o={};LF.forEach(k=>{o[k]=$('#f_'+k).value});o.month=o.date.slice(0,7);return o};
  const save=async()=>{const o=read();if(!o.date)return;if(cur&&cur!==o.date)await DB.del('logs',cur);await DB.set('logs',o.date,o);cur=o.date;renderList()};
  autosave($('#logForm'),save,'#logStatus');
  $('#newLog').onclick=()=>{$('#logMonth').value=today().slice(0,7);open(today())};
  if($('#delLog'))$('#delLog').onclick=async()=>{if(cur&&confirm(cur+' 일지를 삭제할까요?')){await DB.del('logs',cur);cur=null;LF.forEach(k=>$('#f_'+k).value='');$('#logTitle').textContent='';renderMemo();renderList()}};
  $('#logMonth').onchange=renderList;
  $('#copyLog').onclick=async()=>{await save();const o=read();const L=(t,v)=>v?`${t}: ${v}\n`:'';copyText(`[운영일지] ${o.date} (${dow(o.date)}) ${o.weather||''}\n근무: 오픈 ${o.staffOpen||'-'} / 미들 ${o.staffMid||'-'} / 마감 ${o.staffClose||'-'} / 휴무 ${o.staffOff||'-'}\n`+L('사장님',o.bossWork)+L('손님 흐름',o.flow)+L('잘 나간 메뉴',o.best)+L('만석·웨이팅',o.full)+L('컴플레인',o.complaint)+L('방문',o.visit)+
    `매출: ${o.midSales?'중간 '+fmt(o.midSales)+' / ':''}총 ${fmt(o.sales)||'-'}원 (배민 ${o.baemin||0} 쿠팡 ${o.coupang||0}${o.naver?' 네이버 '+o.naver:''})\n`+L('서비스',o.service)+L('폐기',o.waste)+`생산: 에타 ${o.egg||0} / 홀 ${o.whole||0} / 별조각 ${o.star||0} / 조각 ${o.pieceCnt||0} / 빙수 ${o.bingsu||0}\n`+L('조각 내역',o.piece)+L('생산 케이크',o.produced)+L('내일 주문',o.tomorrow)+(o.inSheet||o.inCream||o.inFruit?`입고: 시트 ${o.inSheet||0} / 생크림 ${o.inCream||0} / 과일 ${o.inFruit||0}\n`:'')+L('남은 재고',o.closeStock)+L('발주',o.orderNote)+L('공지',o.notice)+L('청소',o.cleaning)+L('보고',o.report)+(o.memo?`\n${o.memo}`:''))};
  await renderList();open(today());
}

/* ==================== 매뉴얼·레시피 ==================== */
async function manual(){const v=$('#view');let cur=null;
  v.innerHTML=`<div class="two"><div><div class="card"><h2>매뉴얼 · 레시피 <span class="sp"></span>${isMgr()?'<button class="btn sm pri" id="mnNew">+ 새 문서</button>':''}</h2><input type="search" id="mnSearch" placeholder="검색" style="margin-bottom:8px"><div class="list" id="mnList"></div><p class="tip" style="margin-top:8px">사장·매니저만 편집할 수 있습니다. 레시피, 응대 멘트, 포지션별 업무 등을 정리해 두세요.</p></div></div><div><div class="card" id="mnBody"><p class="tip">왼쪽에서 문서를 선택하세요.</p></div></div></div>`;
  let docs=[];const render=()=>{const q=($('#mnSearch').value||'').toLowerCase();$('#mnList').innerHTML=docs.filter(d=>!q||(d.title+d.body+(d.cat||'')).toLowerCase().includes(q)).map(d=>`<button class="${d.id===cur?'on':''}" data-id="${d.id}">${esc(d.title)}<small>${esc(d.cat||'')} · ${esc(d.updatedBy||'')}</small></button>`).join('')||'<p class="tip">문서가 없습니다.</p>';$$('#mnList [data-id]').forEach(b=>b.onclick=()=>open(b.dataset.id))};
  S.unsub.push(DB.watch('manual',[],rows=>{docs=rows.sort((a,b)=>(a.cat||'').localeCompare(b.cat||'')||a.title.localeCompare(b.title));render();if(cur)open(cur)}));
  $('#mnSearch').oninput=render;
  const open=id=>{cur=id;const d=docs.find(x=>x.id===id);if(!d)return;render();$('#mnBody').innerHTML=`<h2>${esc(d.title)} <span class="tag">${esc(d.cat||'')}</span><span class="sp"></span>${isMgr()?'<button class="btn sm" id="mnEdit">편집</button>':''}</h2><div class="memo-view" style="background:#fff;padding:4px 0">${esc(d.body)}</div><p class="tip">최근 수정 ${esc(d.updatedBy||'')} ${d.updatedAt?new Date(d.updatedAt).toLocaleString('ko-KR'):''}</p>`;if($('#mnEdit'))$('#mnEdit').onclick=()=>edit(d)};
  const edit=d=>openModal({title:d?'문서 편집':'새 문서',body:`<div class="grid"><div class="w2"><label>제목</label><input type="text" id="mn_title" value="${esc(d?.title||'')}" placeholder="예: 에그타르트 필링 레시피"></div><div><label>분류</label><input type="text" id="mn_cat" value="${esc(d?.cat||'')}" placeholder="레시피 / 응대 / 포지션" list="mnCats"></div><datalist id="mnCats"><option value="레시피"><option value="응대"><option value="포지션 업무"><option value="위생"><option value="배달 플랫폼"></datalist><div class="w3"><label>내용</label><textarea id="mn_body" style="min-height:50vh">${esc(d?.body||'')}</textarea></div></div>`,
    onSave:async bg=>{const title=$('#mn_title',bg).value.trim();if(!title)throw new Error('제목을 입력하세요');const id=d?.id||'mn_'+Date.now().toString(36);await DB.set('manual',id,{title,cat:$('#mn_cat',bg).value.trim(),body:$('#mn_body',bg).value,createdBy:d?.createdBy||S.me.name});cur=id;toast('저장했습니다')},
    onDelete:d?async()=>{await DB.del('manual',d.id);cur=null;$('#mnBody').innerHTML='<p class="tip">왼쪽에서 문서를 선택하세요.</p>'}:null});
  if($('#mnNew'))$('#mnNew').onclick=()=>edit(null);
}

/* ==================== 설정 ==================== */
async function settings(){const v=$('#view');
  v.innerHTML=`<div class="card"><h2>내 계정</h2><p>${nm(S.me.name,S.me.role)} · 아이디 <b>${esc(S.me.loginId||'')}</b> · ${ROLE_NAME[S.me.role]||S.me.role}</p><button class="btn sm" id="pwBtn">비밀번호 변경</button></div>
    ${isMgr()?`<div class="card"><h2>직원 관리 <span class="sp"></span><button class="btn sm pri" id="addUser">+ 직원 추가</button></h2><p class="tip">이름 색: ${roleLegend()} · 사장·점장·매니저는 근무표·스케줄·체크리스트 항목·재고 항목·매뉴얼을 편집할 수 있고, 직원·알바는 출퇴근·체크·일지·발주 체크를 작성합니다. 퇴사자는 "비활성"으로 바꾸면 로그인이 막히고 기록은 남습니다.</p>
      <div class="wrap"><table><thead><tr><th>이름</th><th>아이디</th><th>권한</th><th>상태</th><th></th></tr></thead><tbody id="userRows"></tbody></table></div></div>`:''}
    <div class="card"><h2>데이터 · 백업</h2><p class="tip">현재 모드: <b>${DB.mode==='local'?'로컬 데모 (이 브라우저에만 저장)':'Firebase (여러 기기 공유)'}</b>. ${DB.mode==='local'?'실제 운영에는 README의 Firebase 설정을 따라 주세요. 그전까지는 이 기기에서만 데이터가 보입니다.':''}</p>
      <div class="row"><button class="btn" id="exportAll">전체 JSON 내보내기</button>${DB.mode==='local'?'<label class="btn" style="display:inline-block">JSON 불러오기 <input type="file" id="importAll" accept="application/json" style="display:none"></label>':''}</div></div>`;
  $('#pwBtn').onclick=()=>openModal({title:'비밀번호 변경',body:`<div class="grid"><div class="w2"><label>현재 비밀번호</label><input type="password" id="pw0"></div><div class="w2"><label>새 비밀번호 (6자 이상)</label><input type="password" id="pw1"></div></div>`,onSave:async bg=>{const n=$('#pw1',bg).value;if(n.length<6)throw new Error('6자 이상');await DB.changePassword($('#pw0',bg).value,n);toast('변경했습니다')}});
  $('#exportAll').onclick=async()=>dl(await DB.exportAll(),`sonjoy_backup_${today()}.json`,'application/json');
  if($('#importAll'))$('#importAll').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{if(confirm('현재 로컬 데이터를 파일 내용으로 교체합니다. 진행할까요?'))try{DB.importLocal(r.result)}catch(x){alert(x.message)}};r.readAsText(f)};
  if(!isMgr())return;
  const renderUsers=async()=>{await loadRoster();$('#userRows').innerHTML=S.roster.map(u=>`<tr><td>${nm(u.name,u.role)}</td><td>${esc(u.loginId||'')}</td><td>${isOwner()&&u.id!==S.me.id?`<select data-role="${u.id}">${ROLE_ORDER.map(r=>`<option value="${r}" ${u.role===r?'selected':''}>${ROLE_NAME[r]}</option>`).join('')}</select>`:ROLE_NAME[u.role]||u.role}</td><td>${u.active===false?'<span class="tag red">비활성</span>':'<span class="tag green">활성</span>'}</td><td class="row">${u.id!==S.me.id&&u.role!=='owner'?`<button class="btn sm" data-tog="${u.id}">${u.active===false?'활성화':'비활성'}</button>`:''}${DB.mode==='local'&&u.id!==S.me.id?`<button class="btn sm" data-pw="${u.id}">비번 초기화</button>`:''}</td></tr>`).join('');
    $$('[data-role]').forEach(s=>s.onchange=async()=>{await DB.update('users',s.dataset.role,{role:s.value});toast('권한 변경');renderUsers()});
    $$('[data-tog]').forEach(b=>b.onclick=async()=>{const u=S.roster.find(x=>x.id===b.dataset.tog);await DB.update('users',u.id,{active:u.active===false});renderUsers()});
    $$('[data-pw]').forEach(b=>b.onclick=async()=>{const p=prompt('새 비밀번호 (6자 이상)');if(p&&p.length>=6){await DB.resetPassword(b.dataset.pw,p);toast('초기화했습니다')}})};
  $('#addUser').onclick=()=>openModal({title:'직원 추가',body:`<div class="grid"><div><label>이름</label><input type="text" id="nu_name"></div><div><label>아이디 (영문 소문자)</label><input type="text" id="nu_id" autocapitalize="off" placeholder="hyebin"></div><div><label>직급</label><select id="nu_role">${ROLE_ORDER.filter(r=>r!=='owner').map(r=>`<option value="${r}" ${r==='staff'?'selected':''}>${ROLE_NAME[r]}</option>`).join('')}</select></div><div><label>초기 비밀번호 (6자 이상)</label><input type="text" id="nu_pw" value="000000"></div></div><p class="tip">${DB.mode==='firebase'?'직원에게 아이디와 초기 비밀번호를 알려주고, 로그인 후 설정에서 비밀번호를 바꾸게 하세요.':''}</p>`,
    onSave:async bg=>{await DB.createUser({name:$('#nu_name',bg).value.trim(),loginId:$('#nu_id',bg).value,role:$('#nu_role',bg).value,pw:$('#nu_pw',bg).value});toast('추가했습니다');renderUsers()}});
  renderUsers();
}

/* ---------- 시작 ---------- */
VIEWS.splice(7,0,['manual','매뉴얼','📖']);
window.addEventListener('hashchange',()=>{const h=location.hash.replace('#','');if(h&&h!==S.view&&VIEWS.some(v=>v[0]===h)&&S.me)go(h)});
try{await DB.init();await start()}catch(e){console.error(e);$('#view').innerHTML=`<div id="login"><h1>시작 오류</h1><p>${esc(e.message||e)}</p><p class="tip">Firebase 설정(js/config.js)을 확인하세요. 설정이 없으면 로컬 데모 모드로 동작합니다.</p></div>`}
})();
