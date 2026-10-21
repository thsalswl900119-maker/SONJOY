# -*- coding: utf-8 -*-
"""Slides 형식 섹션 37장 → 한 장짜리 웹 강의안(deck.html). 키보드로 넘김 · 타이머 단추 눌림 · 끝나면 소리."""
import os, re, json, base64, html, importlib.util
ROOT=os.path.dirname(os.path.abspath(__file__))
spec=importlib.util.spec_from_file_location('gen_order', os.path.join(ROOT,'gen.py'))
ORDER=re.search(r"^ORDER=(\[.*?\])", open(os.path.join(ROOT,'gen.py'),encoding='utf-8').read(), re.M).group(1)
ORDER=json.loads(ORDER.replace("'",'"'))
SHOT=eval(re.search(r"^SHOT=(\{.*?\})\s*$", open(os.path.join(ROOT,'gen.py'),encoding='utf-8').read(), re.M).group(1))
SH=os.path.join(ROOT,'..','shots')
BLOB={'8038645dc67d597d0026a4388d7379a5':'/home/user/SONJOY/assets/logo.png'}
for sid,(bid,*_) in SHOT.items(): BLOB[bid]=os.path.join(SH,sid+'.png')
def duri(p):
    return 'data:image/png;base64,'+base64.b64encode(open(p,'rb').read()).decode()
DU={k:duri(v) for k,v in BLOB.items()}
secs=[]; notes=[]; titles=[]
for sid in ORDER:
    s=open(os.path.join(ROOT,'project','slides_btn',sid+'.html'),encoding='utf-8').read()
    s=re.sub(r'/_blob/([0-9a-f]{32})', lambda m: DU.get(m.group(1), m.group(0)), s)
    # x-embed → iframe (내용은 data-doc에 넣고, 그 장을 열 때 srcdoc에 넣는다)
    def emb(m):
        st, body = m.group(1), m.group(2)
        return '<iframe class="emb" style="%s" data-doc="%s" title="움직이는 화면"></iframe>'%(st, html.escape(body, quote=True))
    s=re.sub(r'<x-embed style="([^"]*)">(.*?)</x-embed>', emb, s, flags=re.S)
    m=re.search(r'<aside>(.*?)</aside>', s, re.S); notes.append(html.unescape(m.group(1)) if m else ''); s=re.sub(r'<aside>.*?</aside>','',s,flags=re.S)
    t=re.search(r'<h2[^>]*>(.*?)</h2>', s, re.S) or re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    titles.append(re.sub('<[^>]+>','',t.group(1)).replace('&amp;','&') if t else sid)
    secs.append(s)
LOGO=DU['8038645dc67d597d0026a4388d7379a5']
page='''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>은밀한 창업 노트 · 강의안 ver.2</title>
<link rel="icon" href="%(logo)s">
<link href="https://fonts.googleapis.com/css2?family=Do+Hyeon&family=Nanum+Gothic:wght@400;700;800&display=swap" rel="stylesheet">
<style>
html,body{margin:0;height:100%%;background:#2b2320;overflow:hidden;font-family:'Nanum Gothic','Apple SD Gothic Neo',sans-serif}
#stage{position:absolute;left:50%%;top:50%%;width:1920px;height:1080px;transform-origin:0 0}
section{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;box-sizing:border-box;display:none;background:#fff}
section:not(.on){display:none!important}
section>*{position:absolute}
section p,section h1,section h2,section h3{margin:0}
section ul,section ol{margin:0;padding-left:1.2em}
iframe.emb{border:0;background:transparent}
.bi{opacity:0;animation:bi .55s ease-out forwards}
@keyframes bi{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
.pop{opacity:0;animation:pop .45s cubic-bezier(.2,1.4,.4,1) forwards}
@keyframes pop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.fd{opacity:0;animation:fd .5s ease-out forwards}
@keyframes fd{to{opacity:1}}
#ui{position:fixed;right:14px;bottom:12px;display:flex;gap:6px;align-items:center;z-index:9;opacity:.35;transition:opacity .2s}
#ui:hover,body.showui #ui{opacity:1}
#ui button{font:inherit;font-size:14px;font-weight:700;padding:8px 12px;border-radius:10px;border:0;background:#F8F0E7;color:#A85A45;cursor:pointer}
#ui .n{color:#F8F0E7;font-size:14px;font-weight:700;padding:0 6px;font-variant-numeric:tabular-nums}
#note{position:fixed;left:14px;bottom:12px;max-width:min(640px,70vw);background:rgba(74,64,59,.92);color:#F8F0E7;font-size:15px;line-height:1.45;padding:10px 14px;border-radius:12px;display:none;z-index:9}
body.note #note{display:block}
#flash{position:fixed;inset:0;background:#B03A2E;opacity:0;pointer-events:none;z-index:8}
#flash.go{animation:fl 1.8s steps(2) 3}
@keyframes fl{50%%{opacity:.35}}
#toast{position:fixed;left:50%%;top:16px;transform:translateX(-50%%);background:#B03A2E;color:#fff;font-size:22px;font-weight:800;padding:12px 22px;border-radius:14px;display:none;z-index:10}
#help{position:fixed;inset:0;background:rgba(0,0,0,.72);color:#fff;display:none;align-items:center;justify-content:center;z-index:11;font-size:18px;line-height:1.8}
#help.on{display:flex}#help div{background:#4A403B;padding:24px 34px;border-radius:16px;max-width:560px}
#help b{color:#F2C9B5}
@media print{html,body{overflow:visible;background:#fff}#stage{position:static;transform:none!important;width:auto;height:auto}section{position:relative;display:flex!important;page-break-after:always;transform:scale(.5);transform-origin:0 0;margin-bottom:-540px}#ui,#note,#help{display:none!important}}
</style></head><body>
<div id="stage">
%(secs)s
</div>
<div id="flash"></div><div id="toast"></div>
<div id="note"></div>
<div id="ui"><button id="bprev" type="button">◀</button><span class="n" id="cnt"></span><button id="bnext" type="button">▶</button><button id="bnote" type="button">메모</button><button id="bfull" type="button">전체화면</button><button id="bhelp" type="button">?</button></div>
<div id="help"><div><b>넘기기</b> → · 스페이스 · PgDn · 화면 오른쪽 끝 누르기 &nbsp; <b>뒤로</b> ← · PgUp · 왼쪽 끝<br><b>전체화면</b> F &nbsp; <b>메모(강사용)</b> N &nbsp; <b>처음</b> Home &nbsp; <b>끝</b> End &nbsp; <b>번호+Enter</b> 그 장으로<br><b>타이머</b> 실습 슬라이드에 보이면 자동 시작 · 멈춤·다시·+1분 단추 · 다른 장으로 넘기면 멈추고 돌아오면 이어서 · 끝나면 소리 + 빨간 깜빡임<br><br>아무 키나 누르면 닫힘</div></div>
<script>
var S=[].slice.call(document.querySelectorAll('#stage>section')),N=S.length,cur=-1,NOTES=%(notes)s,TITLES=%(titles)s;
function fit(){var w=innerWidth,h=innerHeight,k=Math.min(w/1920,h/1080);var st=document.getElementById('stage');st.style.transform='translate('+(-960*k)+'px,'+(-540*k)+'px) scale('+k+')';}
addEventListener('resize',fit);fit();
function load(sec){[].forEach.call(sec.querySelectorAll('iframe.emb[data-doc]'),function(f){f.srcdoc=f.getAttribute('data-doc');f.removeAttribute('data-doc');});}
function build(sec){[].forEach.call(sec.querySelectorAll('[data-build-in]'),function(el){var v=el.getAttribute('data-build-in').split(/\\s+/),kind=v[0],ord=+(v[1]||1);el.classList.remove('bi','pop','fd');void el.offsetWidth;el.style.animationDelay=(0.15+(ord-1)*0.35)+'s';el.classList.add(kind==='pop'?'pop':kind==='fade'?'fd':'bi');});}
function go(i,push){i=Math.max(0,Math.min(N-1,i));if(i===cur)return;if(cur>=0)S[cur].classList.remove('on');cur=i;var sec=S[i];sec.classList.add('on');load(sec);build(sec);if(i+1<N)load(S[i+1]);
 document.getElementById('cnt').textContent=(i+1)+' / '+N;document.getElementById('note').textContent=NOTES[i]||'';document.title=(i+1)+'. '+TITLES[i]+' · 강의안';if(push!==false)history.replaceState(null,'','#'+(i+1));}
function nav(d){go(cur+d)}
document.getElementById('bprev').onclick=function(){nav(-1)};document.getElementById('bnext').onclick=function(){nav(1)};
document.getElementById('bnote').onclick=function(){document.body.classList.toggle('note')};
function full(){var el=document.documentElement;if(document.fullscreenElement){document.exitFullscreen()}else if(el.requestFullscreen){el.requestFullscreen()}}
document.getElementById('bfull').onclick=full;document.getElementById('bhelp').onclick=function(){document.getElementById('help').classList.toggle('on')};
var typed='';
function onkey(e){var H=document.getElementById('help');if(H.classList.contains('on')){H.classList.remove('on');e.preventDefault();return}
 if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
 if(e.key==='ArrowRight'||e.key==='PageDown'||e.key===' '||e.key==='Enter'&&!typed){e.preventDefault();nav(1)}
 else if(e.key==='ArrowLeft'||e.key==='PageUp'||e.key==='Backspace'){e.preventDefault();nav(-1)}
 else if(e.key==='Home'){go(0)}else if(e.key==='End'){go(N-1)}
 else if(e.key==='f'||e.key==='F'){full()}else if(e.key==='n'||e.key==='N'){document.body.classList.toggle('note')}else if(e.key==='?'){H.classList.add('on')}
 else if(/^[0-9]$/.test(e.key)){typed+=e.key;clearTimeout(typed.t);}
 if(e.key==='Enter'&&typed){go(+typed-1);typed=''}
}
addEventListener('keydown',onkey);
addEventListener('message',function(e){var d=e.data;if(d&&d.cs==='key'){onkey({key:d.key,target:{tagName:''},preventDefault:function(){}})}});
addEventListener('click',function(e){if(e.target.closest('#ui,#note,#help,iframe'))return;var x=e.clientX/innerWidth;if(x>0.92)nav(1);else if(x<0.08)nav(-1);});
var tx=null;addEventListener('touchstart',function(e){tx=e.touches[0].clientX},{passive:true});addEventListener('touchend',function(e){if(tx===null)return;var dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>60)nav(dx<0?1:-1);tx=null});
var mt;addEventListener('mousemove',function(){document.body.classList.add('showui');clearTimeout(mt);mt=setTimeout(function(){document.body.classList.remove('showui')},1800)});
/* 타이머 끝 → 소리 + 빨간 깜빡임 (소리는 부모 창에서 내야 자동재생 제한에 안 걸린다) */
var AC=null;function ac(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}return AC}
addEventListener('keydown',ac);addEventListener('click',ac);addEventListener('touchstart',ac);
function chime(){var a=ac();if(!a)return;var t=a.currentTime;[[880,0],[1175,.25],[880,.5],[1175,.75],[1568,1.0]].forEach(function(p){var o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=p[0];g.gain.setValueAtTime(0.0001,t+p[1]);g.gain.exponentialRampToValueAtTime(0.5,t+p[1]+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+p[1]+0.5);o.connect(g);g.connect(a.destination);o.start(t+p[1]);o.stop(t+p[1]+0.55)});setTimeout(function(){var t2=a.currentTime;[[880,0],[1175,.25],[1568,.5]].forEach(function(p){var o=a.createOscillator(),g=a.createGain();o.frequency.value=p[0];g.gain.setValueAtTime(0.0001,t2+p[1]);g.gain.exponentialRampToValueAtTime(0.5,t2+p[1]+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t2+p[1]+0.5);o.connect(g);g.connect(a.destination);o.start(t2+p[1]);o.stop(t2+p[1]+0.55)})},2200)}
addEventListener('message',function(e){var d=e.data;if(!d||d.cs!=='timer-done')return;chime();var F=document.getElementById('flash');F.classList.remove('go');void F.offsetWidth;F.classList.add('go');var T=document.getElementById('toast');T.textContent='⏰ 시간 끝 · '+(d.label||'');T.style.display='block';setTimeout(function(){T.style.display='none'},6000);});
var h=parseInt((location.hash||'').replace('#',''),10);go(isNaN(h)?0:h-1,false);
</script></body></html>'''%{'logo':LOGO,'secs':'\n'.join(secs),'notes':json.dumps(notes,ensure_ascii=False),'titles':json.dumps(titles,ensure_ascii=False)}
out=os.path.join(ROOT,'deck.html'); open(out,'w',encoding='utf-8').write(page); print('deck.html', len(page.encode())//1024,'KB', len(secs),'slides')
