/* ===== 저장소 + 로그인 어댑터 =====
   - Firebase 설정(config.js의 window.FIREBASE_CONFIG)이 있으면: Firebase Auth + Firestore (여러 기기에서 공유)
   - 없으면: 로컬 데모 모드 (이 브라우저에만 저장, 기본 계정 자동 생성)                         */
(function(){
  const LOCAL_KEY='sonjoy.local.v2';
  const EMAIL_DOMAIN='@sonjoy.cafe';
  const isFirebase=!!(window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.apiKey&&window.firebase);
  const bus=new EventTarget();

  /* ---------- 로컬 모드 ---------- */
  const local={
    data:null,
    load(){try{this.data=JSON.parse(localStorage.getItem(LOCAL_KEY))||{}}catch(e){this.data={}}
      if(!this.data.users){this.data.users={};this.data.__auth={};
        const seed=[['u_minji','minji','손민지','owner'],['u_hyanga','hyanga','정향아','manager'],['u_hyebin','hyebin','박혜빈','staff'],['u_haesun','haesun','이해선','parttime']];
        seed.forEach(([uid,id,name,role])=>{this.data.users[uid]={id:uid,loginId:id,name,role,active:true,createdAt:Date.now()};this.data.__auth[id]={uid,pw:'000000'}});
        this.save()}
      return this},
    save(){localStorage.setItem(LOCAL_KEY,JSON.stringify(this.data))},
    col(c){return this.data[c]||(this.data[c]={})}
  };
  function matches(doc,filters){return (filters||[]).every(([f,op,v])=>{const x=doc[f];switch(op){case'==':return x===v;case'!=':return x!==v;case'>=':return x>=v;case'<=':return x<=v;case'>':return x>v;case'<':return x<v;case'in':return v.includes(x);default:return true}})}

  const DB={
    mode:isFirebase?'firebase':'local',
    user:null,          // {uid,name,role,loginId}
    _fs:null,_auth:null,
    async init(){
      if(isFirebase){firebase.initializeApp(window.FIREBASE_CONFIG);this._auth=firebase.auth();this._fs=firebase.firestore();
        try{await this._fs.enablePersistence({synchronizeTabs:true})}catch(e){}
        await new Promise(res=>{const un=this._auth.onAuthStateChanged(async u=>{un();if(u){await this._loadProfile(u)}res()})});
      }else{local.load();const uid=sessionStorage.getItem('sonjoy.uid')||localStorage.getItem('sonjoy.uid');if(uid&&local.data.users[uid])this.user=local.data.users[uid]}
      return this.user;
    },
    async _loadProfile(u){const d=await this._fs.collection('users').doc(u.uid).get();
      if(d.exists){this.user={id:u.uid,uid:u.uid,...d.data()};return}
      // 프로필이 없으면: 첫 사용자는 사장(owner), 이후 사용자는 관리자가 만든 프로필이 있어야 함
      const s=await this._fs.collection('settings').doc('main').get();
      if(!s.exists||!s.data().ownerUid){const name=u.displayName||prompt('사장님 이름을 입력하세요 (처음 한 번)')||'사장님';
        const prof={name,role:'owner',loginId:(u.email||'').split('@')[0],active:true,createdAt:Date.now()};
        await this._fs.collection('users').doc(u.uid).set(prof);await this._fs.collection('settings').doc('main').set({ownerUid:u.uid,storeName:'카페스이'},{merge:true});this.user={id:u.uid,uid:u.uid,...prof};return}
      this.user={id:u.uid,uid:u.uid,name:u.email,role:'pending',loginId:(u.email||'').split('@')[0],active:false};
    },
    /* ---- 로그인 ---- */
    async login(loginId,pw,remember){loginId=(loginId||'').trim().toLowerCase();
      if(isFirebase){await this._auth.setPersistence(remember?firebase.auth.Auth.Persistence.LOCAL:firebase.auth.Auth.Persistence.SESSION);
        const cred=await this._auth.signInWithEmailAndPassword(loginId.includes('@')?loginId:loginId+EMAIL_DOMAIN,pw);await this._loadProfile(cred.user);return this.user}
      const a=local.data.__auth[loginId];if(!a||a.pw!==pw)throw new Error('아이디 또는 비밀번호가 틀립니다');
      this.user=local.data.users[a.uid];if(!this.user.active)throw new Error('비활성화된 계정입니다');(remember?localStorage:sessionStorage).setItem('sonjoy.uid',a.uid);return this.user},
    async logout(){if(isFirebase)await this._auth.signOut();else{localStorage.removeItem('sonjoy.uid');sessionStorage.removeItem('sonjoy.uid')}this.user=null},
    async changePassword(oldPw,newPw){if(isFirebase){const u=this._auth.currentUser;const cred=firebase.auth.EmailAuthProvider.credential(u.email,oldPw);await u.reauthenticateWithCredential(cred);await u.updatePassword(newPw);return}
      const a=local.data.__auth[this.user.loginId];if(a.pw!==oldPw)throw new Error('현재 비밀번호가 틀립니다');a.pw=newPw;local.save()},
    /* 관리자가 직원 계정 만들기 */
    async createUser({loginId,name,role,pw}){loginId=loginId.trim().toLowerCase();if(!/^[a-z0-9_.-]{2,20}$/.test(loginId))throw new Error('아이디는 영문 소문자·숫자 2~20자');if((pw||'').length<6)throw new Error('비밀번호는 6자 이상');
      if(isFirebase){const app2=firebase.apps.find(a=>a.name==='secondary')||firebase.initializeApp(window.FIREBASE_CONFIG,'secondary');
        const cred=await app2.auth().createUserWithEmailAndPassword(loginId+EMAIL_DOMAIN,pw);const uid=cred.user.uid;await app2.auth().signOut();
        await this._fs.collection('users').doc(uid).set({name,role,loginId,active:true,createdAt:Date.now()});return uid}
      if(local.data.__auth[loginId])throw new Error('이미 있는 아이디입니다');const uid='u_'+Date.now().toString(36);
      local.data.users[uid]={id:uid,loginId,name,role,active:true,createdAt:Date.now()};local.data.__auth[loginId]={uid,pw};local.save();bus.dispatchEvent(new CustomEvent('change',{detail:'users'}));return uid},
    async resetPassword(uid,newPw){if(isFirebase)throw new Error('Firebase 모드에서는 Firebase 콘솔 > Authentication 에서 비밀번호를 재설정하세요');
      const u=local.data.users[uid];local.data.__auth[u.loginId].pw=newPw;local.save()},
    /* ---- 문서 CRUD ---- */
    async get(col,id){if(isFirebase){const d=await this._fs.collection(col).doc(id).get();return d.exists?{id,...d.data()}:null}
      const d=local.col(col)[id];return d?{id,...d}:null},
    async set(col,id,data){data={...data};delete data.id;data.updatedAt=Date.now();data.updatedBy=this.user?this.user.name:'';
      if(isFirebase){await this._fs.collection(col).doc(id).set(data)}else{local.col(col)[id]=data;local.save();bus.dispatchEvent(new CustomEvent('change',{detail:col}))}return {id,...data}},
    async update(col,id,patch){patch={...patch,updatedAt:Date.now(),updatedBy:this.user?this.user.name:''};
      if(isFirebase){await this._fs.collection(col).doc(id).set(patch,{merge:true})}else{local.col(col)[id]=Object.assign(local.col(col)[id]||{},patch);local.save();bus.dispatchEvent(new CustomEvent('change',{detail:col}))}},
    async del(col,id){if(isFirebase)await this._fs.collection(col).doc(id).delete();else{delete local.col(col)[id];local.save();bus.dispatchEvent(new CustomEvent('change',{detail:col}))}},
    async query(col,filters){if(isFirebase){let q=this._fs.collection(col);(filters||[]).forEach(([f,op,v])=>{q=q.where(f,op,v)});const s=await q.get();return s.docs.map(d=>({id:d.id,...d.data()}))}
      return Object.entries(local.col(col)).filter(([id,d])=>matches(d,filters)).map(([id,d])=>({id,...d}))},
    /* 실시간 구독: cb(docs). 반환값은 해제 함수 */
    watch(col,filters,cb){if(isFirebase){let q=this._fs.collection(col);(filters||[]).forEach(([f,op,v])=>{q=q.where(f,op,v)});return q.onSnapshot(s=>cb(s.docs.map(d=>({id:d.id,...d.data()}))),e=>console.warn(col,e))}
      const run=()=>this.query(col,filters).then(cb);run();const h=e=>{if(e.detail===col)run()};bus.addEventListener('change',h);return ()=>bus.removeEventListener('change',h)},
    /* 로컬 백업 */
    exportLocal(){return JSON.stringify(local.data,null,2)},
    importLocal(json){const d=JSON.parse(json);if(!d.users)throw new Error('백업 파일이 아닙니다');local.data=d;local.save();location.reload()},
    async exportAll(){if(!isFirebase)return this.exportLocal();const out={};for(const c of ['users','settings','attendance','shifts','shiftTemplates','checklists','checklistTemplates','cleaning','stock','stockConfig','logs','schedule']){const s=await this._fs.collection(c).get();out[c]={};s.docs.forEach(d=>out[c][d.id]=d.data())}return JSON.stringify(out,null,2)}
  };
  window.DB=DB;
})();
