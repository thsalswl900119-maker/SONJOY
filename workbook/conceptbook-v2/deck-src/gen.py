# -*- coding: utf-8 -*-
"""강의안 덱 생성 · 카페스이 강의 PPT 디자인(크림 프레임 · 코럴 칩 · 컵 마스코트) · x-embed 모션 · 자동 타이머"""
import json, os, html
ROOT = os.path.dirname(os.path.abspath(__file__))
BTN = os.environ.get('CS_BTN')=='1'  # 1 = 웹 페이지 강의안(단추 눌림) · 0 = Slides 아티팩트(단추 안 눌림)
OUT = os.path.join(ROOT, 'project', 'slides_btn' if BTN else 'slides'); os.makedirs(OUT, exist_ok=True)
CORAL='#C67F68'; CORALD='#A85A45'; CORALL='#E7C6B6'; CREAM='#F8F0E7'; PANEL='#F2E7D8'; PANEL2='#FBF5EC'; INK='#4A403B'; GREY='#7A6A5F'; WHITE='#FFFFFF'; LIT='#FCEFE8'; LIT2='#FBE7DD'
HEAD="'Do Hyeon', 'BM HANNA 11yrs Old OTF', sans-serif"; BODY="'Nanum Gothic', 'Apple SD Gothic Neo', sans-serif"
EFONT='"Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",system-ui,sans-serif'
PN=[0]
SHOT={'d1p1x':('fd3db41ab6ae96181a5c7eb16ceff66f',27,337,650,225),'d1p2x':('b9c9c336d868a301335efa85fcec0123',27,366,650,136),'d1p3x':('3e7f0a48b4b4a51417ea3a9c55e0e46a',27,337,650,113),'d1p4x':('d2db3f5d61afb1f5101b204791e5a38a',27,622,650,240),'d1p5x':('91a236919265728d603bf7b6e4651560',27,603,650,160),'d2p3x':('ec4828acb4f0a21e008a46e6eb9240fe',27,364,650,273),'d2p5x':('ac9f057a99ed1e1dd860d497a1939171',27,335,650,480),'d3p1x':('e37af908d38982e54d0baf28b2e1d149',27,754,650,110),'d3p2x':('518f51b02d5c433930a6e67e31553649',27,395,650,136),'d3p4x':('201d737427a932b7fc3a6dea0fee05ab',27,364,650,500),'d2p1x':('e065557db603be8e55b8e2b1130bb9f8',27,707,650,113),'d2p2x':('ba9ff74e39c2ce6c337d65aad7cdba54',27,629,650,191),'d2p4x':('98f51deff9b4b8dd2f919b5176b80b06',27,422,650,198),'d3p3x':('2015803b20d9335697bed13126ee9210',27,395,650,136)}

def e(s): return html.escape(s, quote=True)
LOGO='/_blob/8038645dc67d597d0026a4388d7379a5'
MASCOT='<img src="'+LOGO+'" alt="카페스이 로고" style="position:absolute;left:1760px;top:922px;width:86px;height:81px">'
LOGO_BIG='<img src="'+LOGO+'" alt="카페스이 로고" style="position:absolute;left:1680px;top:62px;width:150px;height:141px">'

def frame(sid, body, chip=None, title=None, note='', trans='fade', foot=''):
    PN[0]+=1
    h=['<section id="%s" data-transition="%s" style="background:%s;color:%s;font-family:%s;padding:128px;display:flex;flex-direction:column;gap:0">'%(sid,trans,WHITE,INK,BODY)]
    h.append('<div style="position:absolute;left:19px;top:19px;width:1882px;height:1042px;background:%s;border-radius:23px"></div>'%CORAL)
    h.append('<div style="position:absolute;left:43px;top:43px;width:1834px;height:994px;background:%s;border-radius:17px"></div>'%CREAM)
    if chip: h.append('<p style="position:absolute;left:89px;top:72px;width:%dpx;background:%s;color:%s;font-family:%s;font-size:26px;line-height:1.2;padding:9px 22px;border-radius:12px;text-align:center">%s</p>'%(40+len(chip)*24,CORAL,WHITE,HEAD,e(chip)))
    if title: h.append('<h2 style="position:absolute;left:89px;top:146px;width:1740px;font-family:%s;font-size:54px;font-weight:400;line-height:1.15;color:%s">%s</h2>'%(HEAD,CORALD,title))
    h.append(body)
    if foot: h.append('<p style="position:absolute;left:89px;top:964px;width:1600px;font-size:24px;line-height:1.3;color:%s">%s</p>'%(GREY,e(foot)))
    h.append('<p style="position:absolute;left:89px;top:1000px;width:100px;font-family:%s;font-size:24px;color:%s;line-height:1">%d</p>'%(HEAD,CORAL,PN[0]))
    h.append(MASCOT)
    if note: h.append('<aside>%s</aside>'%e(note))
    h.append('</section>')
    open(os.path.join(OUT,sid+'.html'),'w',encoding='utf-8').write('\n'.join(h)+'\n')

def emb(x,y,w,h,page):
    assert len(page.encode())<16000, len(page.encode())
    return '<x-embed style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx">%s</x-embed>'%(x,y,w,h,page)
BASECSS='html,body{margin:0;height:100%%;background:transparent;font-family:%s;color:%s;overflow:hidden}*{box-sizing:border-box}'%(EFONT,INK)

def emb_timer(min_, label, restart=0, fs=112):
    page='''<!doctype html><html><head><meta charset="utf-8"><style>%s .w{position:relative;width:100%%;height:100%%;display:flex;flex-direction:column;align-items:center;justify-content:center}svg{position:absolute;left:0;top:0;width:100%%;height:100%%}.d{position:relative;font-size:%dpx;font-weight:800;color:%s;letter-spacing:2px;font-variant-numeric:tabular-nums;line-height:1}.l{position:relative;font-size:21px;color:%s;margin-top:8px;font-weight:600;max-width:300px;text-align:center;line-height:1.3}.bt{position:relative;display:flex;gap:10px;margin-top:16px}.bt button{font:inherit;font-size:22px;font-weight:700;padding:10px 18px;border-radius:12px;border:2px solid %s;background:#fff;color:%s;cursor:pointer}.bt button.m{background:%s;color:#fff}.done .d{color:#B03A2E;animation:b 1s steps(2) infinite}@keyframes b{50%%{opacity:.15}}</style></head><body><div class="w" id="w"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><circle cx="50" cy="50" r="47" fill="none" stroke="%s" stroke-width="3.5"/><circle id="r" cx="50" cy="50" r="47" fill="none" stroke="%s" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="295.3" stroke-dashoffset="0" transform="rotate(-90 50 50)"/></svg><div class="d" id="d">%s</div><div class="l" id="l">%s</div>%s</div><script>var BTN=%s,T=%d,end=0,left=T,run=false,R=document.getElementById('r'),D=document.getElementById('d'),W=document.getElementById('w'),G=document.getElementById('g');function f(s){s=Math.max(0,Math.round(s));return ('0'+Math.floor(s/60)).slice(-2)+':'+('0'+s%%60).slice(-2)}function draw(){D.textContent=f(left);R.setAttribute('stroke-dashoffset',String(295.3*(1-left/T)));G.textContent=BTN?(run?'⏸ 멈춤':(left>0&&left<T?'▶ 계속':'▶ 시작')):(run?'넘기면 멈춤 · 돌아오면 이어서':(left<=0?'끝 · 다음 슬라이드로':'멈춤 · 돌아오면 이어서'))}function tick(){if(!run)return;left=Math.max(0,(end-Date.now())/1000);draw();if(left<=0){run=false;W.classList.add('done');draw();try{parent.postMessage({cs:'timer-done',label:document.getElementById('l').textContent},'*')}catch(e){}%s}else requestAnimationFrame(tick)}function start(){if(left<=0)left=T;end=Date.now()+left*1000;run=true;W.classList.remove('done');tick()}function pause(){run=false;draw()}function reset(){run=false;left=T;W.classList.remove('done');draw()}if(BTN){G.onclick=function(){run?pause():start();this.blur()};document.getElementById('z').onclick=function(){reset();this.blur()};document.getElementById('p').onclick=function(){T+=60;left+=60;if(run)end+=60000;draw();this.blur()};document.addEventListener('keydown',function(e){try{parent.postMessage({cs:'key',key:e.key},'*')}catch(x){}if(e.key===' '||e.key.indexOf('Arrow')===0||e.key==='PageDown'||e.key==='PageUp')e.preventDefault()})}var seen=false;try{new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){if(!seen){seen=true;start()}else if(!run&&left>0)start()}else{pause()}})},{threshold:0.2}).observe(W)}catch(e){start()}setTimeout(function(){if(!seen&&!run){seen=true;start()}},1200);draw();</script></body></html>'''%(BASECSS,fs,CORALD,GREY,CORAL,CORALD,CORAL,PANEL,CORAL,'%02d:00'%min_,e(label),('<div class="bt"><button class="m" id="g" type="button">⏸ 멈춤</button><button id="z" type="button">↺ 다시</button><button id="p" type="button">+1분</button></div>' if BTN else '<div class="l" id="g" style="font-size:19px;margin-top:14px;color:%s">넘기면 멈춤 · 돌아오면 이어서</div>'%CORAL),('true' if BTN else 'false'),min_*60,('setTimeout(function(){reset();start()},%d)'%restart if restart else ''))
    return page

def emb_loop(css, body, js):
    return '<!doctype html><html><head><meta charset="utf-8"><style>%s%s</style></head><body>%s<script>function eo(t){return 1-Math.pow(1-t,3)}function loop(fn){var t0=Date.now();function st(){var t=((Date.now()-t0)%%8000)/1000;var p=t<2.2?eo(t/2.2):(t<6.6?1:1-eo((t-6.6)/1.4));fn(p,t);requestAnimationFrame(st)}st()}%s</script></body></html>'%(BASECSS,css,body,js)

def emb_bars(rows, unit='', maxv=None, hl=None, fs=30):
    mx=maxv or max(r[1] for r in rows)*1.05
    data=json.dumps(rows,ensure_ascii=False)
    css='.r{display:flex;align-items:center;gap:16px;height:%dpx}.n{width:26%%;font-size:%dpx;font-weight:700;text-align:right;color:%s}.t{flex:1;height:60%%;background:%s;position:relative}.b{height:100%%;width:0;background:%s}.b.h{background:%s}.v{width:14%%;font-size:%dpx;font-weight:800;color:%s;font-variant-numeric:tabular-nums}.wrap{display:flex;flex-direction:column;justify-content:space-around;height:100%%}'%(100//len(rows)*0+int(100/len(rows)),fs,INK,PANEL,CORALL,CORAL,fs+8,CORALD)
    body='<div class="wrap" id="w"></div>'
    js='var D=%s,MX=%s,HL=%s,U=%s;var W=document.getElementById("w");W.innerHTML=D.map(function(r,i){return "<div class=r style=\\"height:"+(100/D.length)+"%%\\"><div class=n>"+r[0]+"</div><div class=t><div class=\\"b"+(i===HL?" h":"")+"\\" id=b"+i+"></div></div><div class=v id=v"+i+"></div></div>"}).join("");var K=1+D.length*0.08;loop(function(p){D.forEach(function(r,i){var q=Math.max(0,Math.min(1,(p*K)-i*0.08));document.getElementById("b"+i).style.width=(r[1]/MX*100*q)+"%%";var v=r[1]*q;v=Number.isInteger(r[1])?Math.round(v):Math.round(v*10)/10;document.getElementById("v"+i).textContent=(r[2]||"")+v.toLocaleString()+U})});'%(data,mx,json.dumps(hl),json.dumps(unit))
    return emb_loop(css,body,js)

def emb_countup(value, unit, label, sub='', fs=190):
    css='.w{height:100%%;display:flex;flex-direction:column;align-items:center;justify-content:center}.n{font-size:%dpx;font-weight:800;color:%s;line-height:1;font-variant-numeric:tabular-nums}.u{font-size:%dpx;color:%s;font-weight:700}.l{font-size:30px;color:%s;margin-top:12px;font-weight:700}.s{font-size:24px;color:%s;margin-top:6px}'%(fs,CORALD,fs//2,CORALD,INK,GREY)
    body='<div class="w"><div><span class="n" id="n">0</span><span class="u">%s</span></div><div class="l">%s</div><div class="s">%s</div></div>'%(e(unit),e(label),e(sub))
    js='var V=%s;loop(function(p){document.getElementById("n").textContent=Math.round(V*p).toLocaleString()});'%value
    return emb_loop(css,body,js)

def emb_waterfall():
    steps=[("판매가",6000,CORALL),("부가세 1/11",-545,GREY),("카드수수료 1.5%",-90,GREY),("재료비",-2000,GREY),("컵·포장",-600,GREY),("로스 10%",-260,GREY),("남는 돈",2505,CORAL)]
    css='.c{position:absolute;bottom:60px;width:12%%}.b{position:absolute;left:0;right:0;background:%s;transition:none}.v{position:absolute;left:0;right:0;text-align:center;font-size:30px;font-weight:800;color:%s;font-variant-numeric:tabular-nums}.l{position:absolute;bottom:0;left:0;right:0;text-align:center;font-size:22px;color:%s;height:56px;line-height:1.2}.base{position:absolute;left:0;right:0;bottom:58px;height:2px;background:%s}'%(GREY,INK,GREY,CORALL)
    body='<div class="base"></div>'+''.join('<div class="c" style="left:%d%%"><div class="b" id="b%d" style="background:%s"></div><div class="v" id="v%d"></div><div class="l">%s</div></div>'%(2+i*14,i,s[2],i,e(s[0])) for i,s in enumerate(steps))
    js='var S=%s,H=document.body.clientHeight-60-56-40,SC=H/6000;var cum=6000;loop(function(p){var run=6000;S.forEach(function(s,i){var q=Math.max(0,Math.min(1,p*1.6-i*0.1));var b=document.getElementById("b"+i),v=document.getElementById("v"+i);var val=s[1];var top,h;if(i===0){h=val*SC*q;b.style.bottom="58px";b.style.height=h+"px";v.style.bottom=(58+h+8)+"px";v.textContent=Math.round(val*q).toLocaleString()}else if(i<S.length-1){var start=run;run+=val;h=-val*SC*q;b.style.bottom=(58+(start+val)*SC+(-val*SC-h))+"px";b.style.height=h+"px";v.style.bottom=(58+start*SC+8)+"px";v.textContent="−"+Math.round(-val*q).toLocaleString()}else{h=val*SC*q;b.style.bottom="58px";b.style.height=h+"px";v.style.bottom=(58+h+8)+"px";v.textContent=Math.round(val*q).toLocaleString()}})});'%json.dumps([[s[0],s[1]] for s in steps],ensure_ascii=False)
    return emb_loop(css,body,js)

def emb_funnel(levels, hl_last=True):
    cols=[CORALL,'#D9A08C',CORAL,CORALD]
    css='.w{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:4px 0}.f{height:21%;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:800;color:'+INK+';transform:scale(0);transform-origin:center}.f.d{color:#fff}'
    body='<div class="w">'+''.join('<div class="f%s" id="f%d" style="width:%d%%;background:%s">%s</div>'%(' d' if i>=2 else '',i,100-i*18,cols[i],e(t)) for i,t in enumerate(levels))+'</div>'
    js='loop(function(p){for(var i=0;i<%d;i++){var q=Math.max(0,Math.min(1,p*1.5-i*0.15));var s=q<1?1.2*q-0.2*q*q:1;document.getElementById("f"+i).style.transform="scale("+Math.max(0,s)+")"}});'%len(levels)
    return emb_loop(css,body,js)

def emb_stagger(items, bg=PANEL2, fg=INK, big=40, small=26, cols=None):
    n=len(items); cols=cols or n
    css='.w{height:100%%;display:grid;grid-template-columns:repeat(%d,1fr);gap:18px}.c{background:%s;border-radius:14px;padding:26px 28px;display:flex;flex-direction:column;gap:10px;opacity:0;transform:translateY(40px);border:1px solid #EADBC8;box-shadow:0 2px 6px #DFCDB8}.c.k{background:%s;color:#fff}.c.k .s{color:#FBE7DD}.h{font-size:%dpx;font-weight:800;line-height:1.15}.s{font-size:%dpx;line-height:1.45;color:%s}.num{font-size:60px;font-weight:800;color:%s;line-height:1}.c.k .num{color:#FCEFE8}'%(cols,bg,CORAL,big,small,GREY,CORALD)
    body='<div class="w">'+''.join('<div class="c%s" id="c%d">%s<div class="h">%s</div><div class="s">%s</div></div>'%(' k' if it.get('k') else '',i,('<div class="num">%s</div>'%e(it['num']) if it.get('num') else ''),e(it['h']),e(it['s'])) for i,it in enumerate(items))+'</div>'
    js='loop(function(p){for(var i=0;i<%d;i++){var q=Math.max(0,Math.min(1,p*1.4-i*0.14));var c=document.getElementById("c"+i);c.style.opacity=q;c.style.transform="translateY("+(40*(1-q))+"px)"}});'%n
    return emb_loop(css,body,js)

def emb_circles(items):
    cols=[CORALD,CORAL,'#D9A08C']
    css='.w{height:100%;display:flex;align-items:center;justify-content:space-between}.c{width:30%;aspect-ratio:1;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px;transform:scale(0)}.h{font-size:44px;font-weight:800;line-height:1.2}.s{font-size:26px;line-height:1.45;margin-top:10px}'
    body='<div class="w">'+''.join('<div class="c" id="c%d" style="background:%s;color:%s"><div class="h">%s</div><div class="s">%s</div></div>'%(i,cols[i],'#fff' if i<2 else INK,e(h),e(s)) for i,(h,s) in enumerate(items))+'</div>'
    js='loop(function(p){for(var i=0;i<3;i++){var q=Math.max(0,Math.min(1,p*1.6-i*0.2));var s=q<1?1.25*q-0.25*q*q:1;document.getElementById("c"+i).style.transform="scale("+Math.max(0,s)+")"}});'
    return emb_loop(css,body,js)

def emb_flow(steps):
    css='.w{height:100%%;display:flex;align-items:center;gap:0}.b{flex:1;background:%s;border-radius:14px;padding:22px 24px;border:1px solid #EADBC8;opacity:0}.b.k{background:%s;color:#fff}.h{font-size:34px;font-weight:800;line-height:1.2}.s{font-size:24px;line-height:1.4;margin-top:8px;color:%s}.b.k .s{color:#FBE7DD}.a{width:70px;height:12px;position:relative}.a i{position:absolute;left:0;top:0;height:12px;background:%s;width:0}.a b{position:absolute;right:0;top:-10px;border-left:26px solid %s;border-top:16px solid transparent;border-bottom:16px solid transparent;opacity:0}'%(PANEL2,CORAL,GREY,CORAL,CORAL)
    parts=[]
    for i,(h,s,k) in enumerate(steps):
        if i: parts.append('<div class="a"><i id="a%d"></i><b id="h%d"></b></div>'%(i,i))
        parts.append('<div class="b%s" id="b%d"><div class="h">%s</div><div class="s">%s</div></div>'%(' k' if k else '',i,e(h),e(s)))
    body='<div class="w">'+''.join(parts)+'</div>'
    js='var N=%d;loop(function(p){for(var i=0;i<N;i++){var q=Math.max(0,Math.min(1,p*1.8-i*0.3));document.getElementById("b"+i).style.opacity=q;if(i){var a=Math.max(0,Math.min(1,p*1.8-i*0.3+0.15));document.getElementById("a"+i).style.width=(a*44)+"px";document.getElementById("h"+i).style.opacity=a>0.9?1:0}}});'%len(steps)
    return emb_loop(css,body,js)

def emb_pointer():
    css='.p{position:absolute;left:0;top:50%;width:64px;height:60px;animation:m 1.1s ease-in-out infinite}@keyframes m{0%,100%{transform:translate(0,-50%)}50%{transform:translate(22px,-50%)}}'
    body='<svg class="p" viewBox="0 0 90 60"><path d="M4 30 L60 30 M60 30 L42 12 M60 30 L42 48" fill="none" stroke="#C67F68" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="30" r="8" fill="#A85A45"/></svg>'
    return emb_loop(css,body,'')

def practice(sid, chip, title, min_, tasks, foot, note, restart=0):
    blob,fx,fy,fw,fh=SHOT[sid]; sc=560/704; ih=int(868*sc)
    body=[emb(89,250,610,560,emb_timer(min_,'실습 %d분 · 화면에 보이면 자동 시작'%min_,restart))]
    body.append('<p style="position:absolute;left:89px;top:830px;width:610px;font-size:24px;line-height:1.5;color:%s;text-align:center">%s</p>'%(GREY,('끝나면 소리가 난다 · 멈춤 · 다시 · +1분은 타이머 아래 단추' if BTN else '멈춤 · 다시 · +1분은 타이머 화면(/v2/timer.html) 또는 워크북 「실습 타이머 %d분」'%min_)))
    body.append('<img data-build-in="fade 1" src="/_blob/%s" alt="워크북 실습 화면" style="position:absolute;left:740px;top:250px;width:560px;height:%dpx;object-fit:contain;border-radius:12px;border:1px solid #EADBC8">'%(blob,ih))
    hx=740+int(fx*sc); hy=250+int(fy*sc); hw=int(fw*sc); hh=min(int(fh*sc), 250+ih-hy-4)
    body.append('<x-shape kind="rect" data-build-in="pop 2" style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;background:transparent;border:6px solid %s"></x-shape>'%(hx-6,hy-6,hw+12,hh+12,CORAL))
    body.append(emb(hx-96,hy+hh//2-30,90,60,emb_pointer()))
    body.append('<div data-build-in="rise 3" style="position:absolute;left:1340px;top:250px;width:490px;height:%dpx;background:%s;border-radius:14px;padding:30px 32px;display:flex;flex-direction:column;gap:14px;border:1px solid #EADBC8">'%(ih,PANEL2))
    body.append('<h3 style="font-family:%s;font-size:32px;font-weight:400;color:%s;line-height:1.2">여기에 적는다</h3>'%(HEAD,CORALD))
    for i,t in enumerate(tasks): body.append('<p style="font-size:26px;line-height:1.45;color:%s"><b>%d</b>  %s</p>'%(INK,i+1,e(t)))
    body.append('</div>')
    frame(sid,'\n'.join(body),chip,title,note,'fade',foot)

def jpslide(sid, day, jp, read, ko, after, note):
    body='<div style="position:absolute;left:194px;top:300px;width:1532px;height:470px;background:%s;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;padding:40px">'%CORAL
    body+='<p style="font-family:%s;font-size:26px;color:%s;line-height:1.2;letter-spacing:4px">DAY %d · 오늘의 한마디 · 今日のひとこと</p>'%(HEAD,LIT,day)
    body+='<p style="font-size:76px;font-weight:700;color:%s;line-height:1.3;text-align:center;font-family:\'Nanum Gothic\', serif">%s</p>'%(WHITE,e(jp))
    body+='<p style="font-size:26px;color:%s;line-height:1.3">%s</p>'%(LIT2,e(read))
    body+='<p style="font-family:%s;font-size:40px;color:%s;line-height:1.3;text-align:center">%s</p></div>'%(HEAD,LIT,e(ko))
    body+='<p data-build-in="fade 1" style="position:absolute;left:194px;top:820px;width:1532px;font-size:28px;line-height:1.5;color:%s;text-align:center">%s</p>'%(INK,e(after))
    frame(sid,body,'DAY %d 마무리'%day,None,note,'push')

def divider(sid, part, title, sub, items, note):
    body='<div data-build-in="rise 1" style="position:absolute;left:194px;top:230px;width:1532px;height:480px;background:%s;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:40px">'%CORAL
    body+='<p style="font-family:%s;font-size:28px;color:%s;line-height:1.2;letter-spacing:3px">%s</p>'%(HEAD,LIT,e(part))
    body+='<h1 style="font-family:%s;font-size:110px;font-weight:400;color:%s;line-height:1.1;text-align:center">%s</h1>'%(HEAD,WHITE,e(title))
    body+='<p style="font-size:30px;color:%s;line-height:1.4;text-align:center">%s</p></div>'%(LIT2,e(sub))
    body+='<div data-build-in="fade 2" style="position:absolute;left:194px;top:760px;width:1532px;display:flex;flex-direction:row;gap:14px">'
    for i,t in enumerate(items): body+='<div style="flex:1;background:%s;border-radius:12px;padding:18px 20px;border:1px solid #EADBC8"><p style="font-family:%s;font-size:24px;color:%s;line-height:1.2">%d교시</p><p style="font-size:24px;line-height:1.35;color:%s;margin-top:4px">%s</p></div>'%(PANEL2,HEAD,CORALD,i+1,INK,e(t))
    body+='</div>'
    frame(sid,body,None,None,note,'push')

# ─────────────────────────── 슬라이드 ───────────────────────────
# cover
b='<div data-build-in="rise 1" style="position:absolute;left:194px;top:280px;width:1532px;height:520px;background:%s;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:40px">'%CORAL
b+='<p style="font-family:%s;font-size:28px;color:%s;letter-spacing:4px;line-height:1.2">2026 부산 청년잡(JOB) 성장프로젝트 · TRACK 3</p>'%(HEAD,LIT)
b+='<h1 style="font-family:%s;font-size:92px;font-weight:400;color:%s;line-height:1.15;text-align:center">9년 차 카페 사장이<br>처음 공개하는 은밀한 창업 노트</h1>'%(HEAD,WHITE)
b+='<p style="font-size:32px;color:%s;line-height:1.4;text-align:center">3일 만에 완성하는 나만의 컨셉북 · 컨셉 · 숫자 · 브랜드</p></div>'%LIT2
frame('cover',b+LOGO_BIG,'강의안 · DAY 1–3 통합',None,'첫 인사. 듣고 끝나는 특강이 아니라 고쳐서 완성하는 실습. 마지막 날 각자 2분씩 자기 가게를 발표한다.','fade')

# agenda
items=[{'num':'DAY 1','h':'컨셉과 메뉴','s':'오프닝 · 컨셉 3요소 · 손님 동선과 경쟁점 3곳 · 메뉴 10개를 4개로 → 컨셉북 1장'},{'num':'DAY 2','h':'원가 & 손익관리','s':'베이스 5종 · 음료 10종 · 한 잔 원가 · 가격 배수 · 손익분기 → 컨셉북 2장','k':1},{'num':'DAY 3','h':'브랜드와 SNS','s':'이름 10→3→1 · 톤앤매너 · 플레이스·인스타·블로그 · 첫 30일 → 컨셉북 3장 + 발표'}]
b=emb(89,250,1740,440,emb_stagger(items,big=44,small=30))
b+='<div style="position:absolute;left:89px;top:730px;width:1740px;height:150px;background:%s;border-radius:14px;padding:30px 40px;display:flex;flex-direction:row;align-items:center;gap:40px"><p style="font-family:%s;font-size:34px;color:%s;line-height:1.2;width:420px">매 교시 같은 순서</p><p style="font-size:30px;line-height:1.5;color:%s"><b>강의 → 실습(타이머) → 강사 피드백</b> · 워크북에 적고 「강사에게 보내기」 · <b>아이패드 또는 노트북 필참(3일 모두)</b> · 3일차는 AI 툴 미리 로그인</p></div>'%(PANEL,HEAD,CORALD,INK)
frame('agenda',b,'과정 안내','3일 15교시가 끝나면 컨셉북 3장과 2분 발표가 남는다','하루의 결과물이 컨셉북 한 장씩. 3일 뒤 세 장이 내 가게 설명서가 된다.','fade','출처: 부산 청년잡 성장프로젝트 Track 3 세부 운영 계획안 (2026.10)')

# workbook
items=[{'num':'1','h':'들어가기','s':'이름 + 휴대폰 뒤 4자리 · 3일 내내 같은 기기, 같은 이름으로'},{'num':'2','h':'교시마다 적기','s':'강의 요점은 적혀 있다 · 빈 칸만 채우면 원가·손익은 자동 계산'},{'num':'3','h':'강사에게 보내기','s':'실습 끝에 한 번 · 다시 보내면 최신 것으로 바뀐다'},{'num':'4','h':'실습 타이머','s':'교시마다 「실습 타이머」 단추 · 남은 시간이 화면 위에 크게','k':1}]
b=emb(89,250,1740,380,emb_stagger(items,big=36,small=24))
b+='<div style="position:absolute;left:89px;top:670px;width:1740px;height:210px;background:%s;border-radius:14px;padding:30px 40px;display:flex;flex-direction:column;gap:12px"><p style="font-family:%s;font-size:30px;color:%s;line-height:1.2">워크북 탭 8개</p><p style="font-size:30px;line-height:1.5;color:%s">1일차 · 2일차 · 3일차 · 컨셉북 · 발표 · 레시피 · 체크리스트 · 용어</p><p style="font-size:26px;line-height:1.4;color:%s">인터넷이 안 될 때는 「복사」를 눌러 강사 카톡에 붙여 넣기 · 카카오톡 안에서 열렸으면 「다른 브라우저로 열기」</p></div>'%(PANEL,HEAD,CORALD,INK,GREY)
frame('workbook',b,'워크북 사용법','워크북 하나로 적고, 계산하고, 보내고, 발표한다','링크를 단톡방에 올린 뒤 이 장을 띄운다. 15명이 동시에 들어와도 각자 기기에 저장된다.','fade','나만의 컨셉북 워크북 ver.2')

# DAY 1
divider('d1','DAY 1 · 11/2 MON','컨셉과 메뉴','나는 누구에게, 어떤 순간에, 무엇을 파는 가게를 만드는가',['9년 노트 공개','컨셉 3요소','손님 동선 · 경쟁점 3곳','메뉴 10개 → 4개','컨셉북 1장 완성'],'오늘 저녁 6시에 각자 컨셉 한 문장을 들고 나간다.')
items=[{'num':'첫 가게','h':'첫 컨셉','s':'[첫 가게를 열 때 적었던 컨셉 한 줄]'},{'num':'위기','h':'망할 뻔한 순간','s':'[매출이 멈췄던 때 · 그때 노트에 적은 숫자]'},{'num':'전환','h':'살아남은 이유','s':'[바꾼 것 한 가지 · 안 바꾼 것 한 가지]'},{'num':'2026','h':'지금','s':'[지금의 컨셉 한 줄]','k':1}]
b=emb(89,250,1740,420,emb_stagger(items,big=38,small=24))
b+='<div style="position:absolute;left:89px;top:710px;width:1740px;height:170px;background:%s;border-radius:14px;padding:30px 40px;display:flex;flex-direction:row;align-items:center;gap:40px"><p style="font-family:%s;font-size:32px;color:%s;line-height:1.2;width:380px">노트가 가게를 살린 이유</p><p style="font-size:28px;line-height:1.5;color:%s">컨셉이 바뀐 날짜, 그날의 매출, 손님이 한 말을 적어 두었기 때문에 감이 아니라 기록으로 고칠 수 있었다</p></div>'%(PANEL,HEAD,CORALD,INK)
frame('d1p1',b,'1교시 · 13:00–13:50','9년 동안 적어 온 노트, 처음 공개한다','대괄호 칸은 강사의 실제 이야기로 채운다. 수치는 노트에 적힌 그대로.','fade','출처: 카페스이 운영 노트 9년 · 대괄호 안은 강의 때 말로 채운다')
practice('d1p1x','실습 · 1교시','지금 머릿속에 있는 내 가게를 10분 동안 적는다',10,['지금 머릿속에 있는 내 가게 · 떠오르는 대로','카페를 하고 싶은 진짜 이유 한 줄','제일 걱정되는 것 한 가지','오늘 들은 이야기 중 기억에 남는 한 줄'],'정답이 없다 · 3일 뒤 마지막 시간에 이 글과 비교한다','타이머를 켜고 돌아다니며 막힌 사람에게 「손님이었을 때 좋았던 카페」를 떠올리게 한다.')
b=emb(89,250,1740,500,emb_circles([('누구에게','우리 가게가 제일 반가운 한 종류의 사람'),('어떤 순간에','그 사람이 지갑을 여는 때와 이유'),('왜 굳이 나인가','옆 가게 말고 우리여야 하는 이유 하나')]))
b+='<div style="position:absolute;left:89px;top:780px;width:1740px;height:110px;background:%s;border-radius:14px;padding:24px 40px;display:flex;flex-direction:row;align-items:center;gap:40px"><p style="font-size:28px;line-height:1.4;color:%s;width:640px">「맛있는 디저트」는 컨셉이 아니다 · 모두가 그렇게 말한다</p><p style="font-size:26px;line-height:1.4;color:%s">예) 하원 후 집에 가는 맞벌이 부모에게 · 저녁 6시 상가 앞에서 · 아이가 먹어도 되는 작은 디저트를 3분 안에</p></div>'%(PANEL,CORALD,INK)
frame('d1p2',b,'2교시 · 14:00–14:50','컨셉은 3요소가 다 있어야 한 줄이 된다','세 원을 하나씩 띄우며 질문한다. 「모두를 위한 카페」라고 답하는 사람에게 한 사람을 골라 보게 한다.','fade','워크북 2교시 · 누구에게 / 어떤 순간에 / 왜 굳이 나인가 / 컨셉 한 줄 초안')
practice('d1p2x','실습 · 2교시','컨셉 한 줄 초안을 쓰고 AI에 다듬어 본다',15,['누구에게 · 어떤 순간에 · 왜 굳이 나인가 세 칸','세 칸을 한 문장으로 잇기 · 초안','「AI로 컨셉 한 줄 다듬기」 복사 → 챗GPT·클로드','강사 피드백 후 고친 한 줄'],'그 대화창 하나를 3일 동안 이어서 쓴다','피드백 기준 하나: 타깃이 두 종류 이상이면 하나로 줄이게 한다.')
items=[{'num':'07:00','h':'아침','s':'아이 등원 → 출근 지하철'},{'num':'12:00','h':'낮','s':'회사 근처 점심 · 카페는 안 감'},{'num':'18:00','h':'저녁 · 마주치는 순간','s':'하원 → 아파트 상가 앞 → 집','k':1}]
b=emb(89,250,1740,260,emb_stagger(items,big=34,small=24))
b+='<table style="position:absolute;left:89px;top:540px;width:1740px;font-size:26px;color:%s;background:%s;border:1px solid #EADBC8;border-radius:12px"><tr style="background:%s"><th style="width:22%%;padding:12px 18px;text-align:left">경쟁점 3곳 (예시)</th><th style="width:26%%;text-align:left">가격대</th><th style="width:26%%;text-align:left">대표 메뉴</th><th style="width:26%%;text-align:left">분위기 · 손님</th></tr><tr><td>A 카페</td><td>커피 4,500 · 케이크 7,500</td><td>아메리카노 · 티라미수</td><td>좌석 40석 · 공부하는 손님</td></tr><tr><td>B 베이커리</td><td>빵 3,000~5,000</td><td>소금빵 · 크루아상</td><td>아침 손님 · 포장 위주</td></tr><tr><td>C 디저트</td><td>케이크 8,000~9,000</td><td>생크림 케이크</td><td>사진 손님 · 주말 위주</td></tr></table>'%(INK,PANEL2,PANEL)
b+='<p style="position:absolute;left:89px;top:840px;width:1740px;font-family:%s;font-size:30px;line-height:1.3;color:%s">세 곳 다 하는 것 말고 아무도 안 하는 것 하나 → 예) 포장 위주 · 아이 간식 크기 · 저녁 6~8시 집중</p>'%(HEAD,CORALD)
frame('d1p3',b,'3교시 · 15:00–15:50','가게 자리는 지도가 아니라 손님의 하루 안에 있다','경쟁점은 지도 리뷰 첫 페이지와 메뉴판 사진만으로 세 줄을 채우게 한다.','fade','동선 중 우리 가게 앞을 지나는 때 하나 → 여는 시간과 자리가 정해진다 · 표의 가게는 예시')
practice('d1p3x','실습 · 3교시','손님의 하루 동선과 경쟁점 3곳을 적는다',15,['가려는 동네 · 지도 단추로 카페 검색','타깃 손님의 아침 · 낮 · 저녁','내 가게와 마주치는 순간 하나','경쟁점 3곳 · 가격대 · 대표 메뉴 · 분위기 → 나만의 자리'],'지도 리뷰 첫 페이지와 메뉴판 사진만으로 세 줄은 채울 수 있다','동네를 적으면 카카오맵·네이버 지도 단추가 그 동네 카페 검색으로 바뀐다.')
b=emb(89,250,760,560,emb_funnel(['하고 싶은 메뉴 10개','기준 5가지 체크','점수 높은 순으로','시그니처 1 + 서브 3']))
b+='<div style="position:absolute;left:900px;top:250px;width:930px;display:flex;flex-direction:column;gap:12px">'
for i,(h,s) in enumerate([('원하는가','손님이 그 순간에 찾는 것인가'),('잘하는가','매일 같은 맛으로 만들 수 있는가'),('구분되는가','경쟁점 3곳에 없는가'),('반복 생산','혼자서 하루 30개 이상'),('남는가','재료비가 판매가의 35% 안')]):
    b+='<div style="background:%s;border-radius:12px;padding:16px 24px;display:flex;flex-direction:row;align-items:center;gap:20px;border:1px solid #EADBC8"><p style="width:52px;height:52px;border-radius:50%%;background:%s;color:#fff;font-family:%s;font-size:26px;line-height:52px;text-align:center">%d</p><p style="font-size:28px;line-height:1.3;color:%s"><b>%s</b> · %s</p></div>'%(PANEL2,CORAL,HEAD,i+1,INK,e(h),e(s))
b+='</div><p style="position:absolute;left:89px;top:830px;width:760px;font-size:26px;line-height:1.4;color:%s;text-align:center">서브 하나는 음료 · 점수가 같으면 「남는가」가 앞</p>'%GREY
frame('d1p4',b,'4교시 · 16:00–16:50','메뉴 10개를 기준 5가지로 걸러 4개만 남긴다','워크북 표에서 체크만 하면 점수가 나온다.','fade','워크북 4교시 · 후보 10개에 기준 5가지를 체크하면 점수 순으로 4개가 뽑힌다')
practice('d1p4x','실습 · 4교시','후보 10개에 기준 5가지를 체크해 4개를 뽑는다',15,['「AI로 메뉴 후보 10개 받기」 → 내가 만들 수 있는 것만 표에','후보마다 기준 5가지 체크 → 점수 자동','「점수 높은 4개를 아래 칸에 넣기」','시그니처를 이것으로 정한 이유 한 줄'],'서브 하나는 음료로 · 음료는 내일 2일차에서 정해도 된다','점수가 같으면 「남는가」 체크된 것을 앞에.')
practice('d1p5x','실습 · 5교시 컨셉북 1장','한 줄로 말할 수 없는 가게는 아직 가게가 아니다',40,['「이 문장을 아래 칸에 넣기」 → 내 말로 고치기','나는 __에게 / __한 순간에 / __을 파는 가게를 만든다','대표 메뉴는 __이다','강사 피드백 → 고친 것 → 「강사에게 보내기」'],'결과물 · 컨셉 정의서 & 메뉴 구성표 · 실습 40분 + 피드백 20분','보내기를 누른 순서대로 강사 화면에서 열어 피드백한다. 서브 3개가 다 구움과자인 사람은 하나를 음료로.')
jpslide('d1jp',1,'店は、選ばれた一人のためにある。','미세와, 에라바레타 히토리노 타메니 아루.','가게는, 고른 한 사람을 위해 있다.','모두를 위한 가게는 아무의 가게도 아닙니다 · 오늘 고른 한 사람이 내일 백 명을 데려옵니다','워크북 5교시 맨 아래 「오늘 마음에 남은 한마디」를 적고 보내게 한 뒤 마친다.')

# DAY 2
divider('d2','DAY 2 · 11/3 TUE','원가 & 손익관리','이 한 잔, 진짜 얼마 들고 · 하루 몇 잔 팔아야 버티는가',['음료 베이스 5종 간단히','베이스로 음료 10종','레시피로 원가 계산','가격 & 손익분기','컨셉북 2장 완성'],'오늘은 숫자의 날.')
items=[{'num':'4.7원/g','h':'레몬 1kg','s':'레몬 500 + 설탕 450 + 꿀 50 · 냉장 3개월 · 냉동 6개월 · 한 잔 40g = 190원'},{'num':'5.9원/g','h':'생강 500g','s':'생강 300 + 설탕 200 + 물 100 · 냉장 2개월 · 한 잔 30g = 178원'},{'num':'2.2원/g','h':'홍차 500g','s':'잎 30 + 물 600 + 설탕 150 · 냉장 7일 · 한 잔 60g = 133원'},{'num':'3.5원/g','h':'마살라티 750g','s':'홍차 + 생강·계피·카다멈·정향 · 냉장 7일 · 한 잔 80g = 278원'},{'num':'3.0원/g','h':'히비스커스 750g','s':'꽃 20 + 물 700 + 설탕 200 · 냉장 10일 · 한 잔 60g = 178원'}]
b=emb(89,250,1740,380,emb_stagger(items,big=30,small=22))
b+=emb(89,660,1740,220,emb_bars([['베이스 없이',5,''],['베이스 있으면',1,'']],'분',5.5,1,34))
frame('d2p1',b,'1교시 · 13:00–13:50','베이스 5종을 미리 만들면 한 잔이 5분에서 1분이 된다','베이스는 간단히. 재료 비율·보관·1g 원가만 짚고, 만드는 법 전체는 워크북 레시피 탭.','fade','대량 준비 · 한 번에 2~3배로 만들어 소분 → 냉장 1주일치 · 나머지 냉동 · 라벨에 만든 날 · 단가는 2026년 9월 도매가 참고값')
import importlib.util as _iu
_sp=_iu.spec_from_file_location('cur','/home/user/SONJOY/workbook/conceptbook-v2/src/cur.py');cur=_iu.module_from_spec(_sp);_sp.loader.exec_module(cur)
def _num(x): return ('%g'%x) if isinstance(x,(int,float)) else str(x)
def rcard(w,name,meta,ings,steps,tip,extra=''):
    big=w>=500
    fs=(27,25,26,23) if big else (25,24,24,22)   # 재료 · 순서 · 제목보조 · 팁
    h='<div style="width:%dpx;background:%s;border-radius:16px;padding:26px 28px;border:1px solid #EADBC8;display:flex;flex-direction:column;gap:12px">'%(w,PANEL2)
    h+='<p style="font-family:%s;font-size:%dpx;line-height:1.15;color:%s">%s</p>'%(HEAD,40 if big else 36,CORALD,e(name))
    h+='<p style="font-size:%dpx;line-height:1.4;color:%s">%s</p>'%(fs[2]-2,GREY,e(meta))
    h+='<div style="background:%s;border-radius:12px;padding:12px 16px;display:flex;flex-direction:column;gap:4px">'%PANEL
    for n,q,u in ings: h+='<div style="display:flex;flex-direction:row;justify-content:space-between;gap:12px"><p style="font-size:%dpx;line-height:1.4;color:%s">%s</p><p style="font-size:%dpx;line-height:1.4;color:%s;white-space:nowrap"><b>%s%s</b></p></div>'%(fs[0],INK,e(n),fs[0],CORALD,_num(q),e(u))
    h+='</div><ol style="padding-left:30px;font-size:%dpx;line-height:1.45;color:%s">'%(fs[1],INK)
    for st in steps: h+='<li>%s</li>'%e(st)
    h+='</ol>'
    if tip: h+='<p style="font-size:%dpx;line-height:1.45;color:%s">💡 %s</p>'%(fs[3],GREY,e(tip))
    return h+extra+'</div>'
def bslide(sid,bases,title,foot):
    w=(1740-20*(len(bases)-1))//len(bases)
    b='<div style="position:absolute;left:89px;top:240px;width:1740px;display:flex;flex-direction:row;gap:20px;align-items:start">'
    for name,tot,keep,ings,steps,per,tip in bases:
        pc=sum(q*p for _,q,_,p in ings)/tot
        b+=rcard(w,name,'완성 %dg · %s · 1g %.1f원 · 한 잔 %dg = %d원'%(tot,keep,pc,per,round(pc*per)),[(n,q,u) for n,q,u,_ in ings],steps,tip)
    b+='</div>'
    frame(sid,b,'1교시 · 베이스 레시피',title,'워크북 레시피 탭과 같은 내용. 재료 비율과 보관만 짚고 넘어간다.','fade',foot)
BS=cur.BASES
bslide('d2b1',BS[:3],'레몬 · 생강 · 홍차 베이스 — 재료 비율과 순서','워크북 「레시피」 탭 · 베이스 5종 · 단가는 2026년 9월 도매가 참고값')
bslide('d2b2',BS[3:],'마살라티 · 히비스커스 베이스','워크북 「레시피」 탭 · 베이스 5종 · 단가는 2026년 9월 도매가 참고값')
practice('d2p1x','실습 · 1교시','베이스 5종 중 내 가게에 쓸 것을 고르고 한 줄 메모한다',5,['베이스 카드 5장 · 재료 비율 · 보관 기간 확인','「베이스 메모」 · 오늘 들은 것 중 기억할 한 줄','내 시그니처 디저트와 어울리는 베이스 1~2개 표시'],'5분 · 짧게 · 시연 사이에','메모 한 줄만 받는다. 길게 쓰지 않게.')
rows=[['흑임자 라떼',1398,''],['버터크림 라떼',1578,''],['오렌지 비앙코',1194,''],['리얼 초콜릿',1836,''],['리얼 고구마 라떼',1181,''],['마살라 차이',1080,''],['홍차 밀크티',963,''],['펜넬 레몬차',597,''],['진저 레몬티',608,''],['히비스커스 에이드',740,'']]
b=emb(89,250,1140,620,emb_bars(rows,'원',2000,3,26))
b+='<div style="position:absolute;left:1270px;top:250px;width:560px;height:620px;background:%s;border-radius:14px;padding:30px 32px;display:flex;flex-direction:column;gap:14px;border:1px solid #EADBC8"><h3 style="font-family:%s;font-size:30px;font-weight:400;color:%s;line-height:1.2">한 잔 원가 · 재료비 + 컵 · 로스 3%%</h3><p style="font-size:24px;line-height:1.5;color:%s">① 커피 · 흑임자 라떼 · 버터크림 라떼 · 오렌지 비앙코<br>② 논커피 · 리얼 초콜릿 · 리얼 고구마 라떼<br>③ 티 · 마살라 차이 · 홍차 밀크티 · 펜넬 레몬차 · 진저 레몬티<br>④ 에이드 · 히비스커스 에이드</p><p style="font-size:24px;line-height:1.5;color:%s"><b>베이스를 쓰는 다섯 잔은 재료 수가 2~3개뿐</b> · 진저 레몬티 = 생강 베이스 30g + 레몬 베이스 30g + 물</p><p style="font-size:24px;line-height:1.5;color:%s">제일 비싼 잔은 비싸게 받을 이유가 있고, 제일 싼 잔은 세트의 짝이 된다</p></div>'%(PANEL2,HEAD,CORALD,INK,INK,GREY)
frame('d2p2',b,'2교시 · 14:00–14:50','베이스 5개에서 음료 10잔이 나온다','시연하면서 각 잔의 원가를 말로 붙인다.','fade','출처: 워크북 레시피 탭 · 레시피 카드 10장(컵 ml · 얼음 g · 재료 g·ml · HOT/ICE · 순서 · 팁)')
def dcost(d):
    c=0
    for n,q,u,p in d[5]:
        if isinstance(p,str) and p.startswith('base:'):
            bb=BS[int(p[5:])]; p=sum(q2*p2 for _,q2,_,p2 in bb[3])/bb[1]
        c+=q*p
    return c+cur.CUP[d[2]]
def dslide(sid,ds,chip,title,foot):
    w=(1740-16*(len(ds)-1))//len(ds)
    b='<div style="position:absolute;left:89px;top:240px;width:1740px;display:flex;flex-direction:row;gap:16px;align-items:start">'
    for d in ds:
        name,cat,tmp,cup,ice,ings,steps,tip=d
        meta='%s · %s · 컵 %dml%s · 재료+컵 %s원'%(cat,tmp,cup,(' · 얼음 %dg'%ice if ice else ''),format(round(dcost(d)),','))
        b+=rcard(w,name,meta,[(n,q,u) for n,q,u,_ in ings],steps,tip)
    b+='</div>'
    frame(sid,b,chip,title,'레시피 카드 그대로. 시연하며 재료 g·ml를 손으로 짚는다.','fade',foot)
DR=cur.DRINKS
dslide('d2r1',[d for d in DR if d[1]=='커피'],'2교시 · 레시피 카드 ①','커피 3잔 — 흑임자 라떼 · 버터크림 라떼 · 오렌지 비앙코','워크북 「레시피」 탭 레시피 카드 10장 · 컵 ml · 얼음 g · 재료 g·ml · HOT/ICE')
dslide('d2r2',[d for d in DR if d[1] in ('논커피','에이드')],'2교시 · 레시피 카드 ②','논커피 2잔 + 에이드 1잔','워크북 「레시피」 탭 · 리얼 초콜릿 · 리얼 고구마 라떼 · 히비스커스 에이드')
dslide('d2r3',[d for d in DR if d[1]=='티'],'2교시 · 레시피 카드 ③','티 4잔 — 베이스 하나로 1분 안에','워크북 「레시피」 탭 · 마살라 차이 · 홍차 밀크티 · 펜넬 레몬차 · 진저 레몬티')
practice('d2p2x','실습 · 2교시','10잔 중 내 가게에 넣을 음료 2개와 이유를 적는다',10,['레시피 카드 10장 · HOT/ICE · 컵 · 재료 확인','「내 가게에 넣고 싶은 음료 2개와 이유」','기준 · 컨셉 · 타깃 · 시그니처 디저트와 어울리는가'],'맛있어서가 아니라 「우리 손님이 그 순간에 찾을 것」','이유에 타깃이 들어갔는지 본다.')
b=emb(89,250,1740,500,emb_waterfall())
b+='<div style="position:absolute;left:89px;top:780px;width:1740px;height:110px;background:%s;border-radius:14px;padding:24px 40px;display:flex;flex-direction:row;align-items:center;gap:40px"><p style="font-family:%s;font-size:32px;color:%s;line-height:1.2">한 잔 원가 = (재료비 + 컵·포장비) × (1 + 로스율)</p><p style="font-size:26px;line-height:1.4;color:%s">월세·인건비는 아직 안 뺐다 → 4교시 손익분기</p></div>'%(PANEL,HEAD,CORALD,GREY)
frame('d2p3',b,'3교시 · 15:00–15:50','원가 2천 원에 6천 원을 받아도 남는 돈은 2,505원이다','숫자를 하나씩 띄우며 뺀다. 「4천 원 남는다」가 2,505원이 되는 순간에 멈춘다. 로스는 재료비+포장비의 10%.','fade','워크북 3교시 「오해 깨기」 계산기 · 숫자를 바꾸면 바로 다시 계산된다')
practice('d2p3x','실습 · 3교시','음료 10잔에 판매가를 넣고 내 메뉴 음료를 고른다',20,['음료 원가표 · 로스율 3% · 판매가 → 원가율 색 확인','「내 메뉴」 체크 2~4잔 · 평균 원가율 20~25% 안인가','디저트 4개 · 재료비는 「재료비 자동 계산기」에 그램 입력','포장비 · 로스율 넣으면 1개 원가 자동'],'원가율 기준 · 음료 20~25% · 디저트 30~35%','로스율 0인 사람과 포장비 빠진 사람을 잡는다.')
b=emb(89,250,1040,420,emb_bars([['음료',5,'×'],['디저트 · 구움과자',3.3,'×'],['케이크 · 생크림류',3,'×'],['선물세트 · 홀케이크',3,'×']],'',5.5,0,30))
b+='<p style="position:absolute;left:89px;top:690px;width:1040px;font-size:26px;line-height:1.4;color:%s">음료 ×4~5 · 디저트 ×3~3.3 · 케이크 ×2.8~3 · 세트 ×2.5~3 · <b>최소 3배</b></p>'%INK
b+='<div style="position:absolute;left:1170px;top:250px;width:660px;display:flex;flex-direction:column;gap:12px">'
for h,s in [('경쟁가','경쟁점 3곳 ±15% 안이면 안전'),('지불의사','손님 10명에게 물으면 답이 나온다'),('끝자리','4,800은 싸 보이고 5,000은 선물 느낌'),('구성','세트는 낱개 합보다 500~1,000원 싸게')]:
    b+='<div style="background:%s;border-radius:12px;padding:18px 24px;border:1px solid #EADBC8"><p style="font-size:27px;line-height:1.4;color:%s"><b>%s</b> · %s</p></div>'%(PANEL2,INK,e(h),e(s))
b+='</div><div style="position:absolute;left:89px;top:760px;width:1740px;height:130px;background:%s;border-radius:14px;padding:22px 40px;display:flex;flex-direction:row;align-items:center;gap:30px"><p style="font-family:%s;font-size:30px;color:%s;width:300px;line-height:1.2">흔한 실수</p><p style="font-size:24px;line-height:1.5;color:%s">싸게 팔면 「싼 가게」 인상만 남고 올리기는 10배 어렵다 · 제일 비싼 메뉴 하나가 닻이 된다 · 원가가 오르면 양을 줄이지 말고 가격을 올려라 · 오픈 할인 대신 덤을 줘라</p></div>'%(PANEL,HEAD,CORALD,INK)
frame('d2p4a',b,'4교시 · 16:00–16:50 · 가격','판매가는 원가의 3배가 바닥이고, 음료는 4~5배다','막대를 띄우며 음료와 디저트의 배수가 왜 다른지 설명한다.','fade','워크북 4교시 「배수 계산기」 · 원가와 종류를 넣으면 배수별 판매가가 나온다 · 예) 디저트 원가 2,365원 → 7,100~7,800원')
b=emb(89,250,560,330,emb_countup(490,'만','월 고정비','월세 150 · 인건비(내 월급) 250 · 공과금 30 · 구독 15 · 이자 25 · 기타 20',120))
b+=emb(680,250,560,330,emb_countup(32,'%','변동비율','재료·컵·포장 30% + 카드·배달 수수료 2%',120))
b+=emb(1270,250,560,330,emb_countup(55,'잔','하루에 팔아야 하는 잔 수·개수','손익분기 월매출 721만 ÷ 영업 26일 ÷ 평균 판매가 약 5,100원(디저트 4 + 음료 2)',120))
b+='<div style="position:absolute;left:89px;top:610px;width:1740px;display:flex;flex-direction:row;gap:12px">'
for i,(h,s) in enumerate([('월매출','손익분기를 넘었는가'),('원가율','35% 넘으면 경고'),('인건비율','내 월급 포함 30% 안'),('객수 × 객단가','매출은 이 둘의 곱'),('손익분기 도달일','매달 며칠에 고정비를 벌었나')]):
    b+='<div style="flex:1;background:%s;border-radius:12px;padding:18px 20px;border:1px solid #EADBC8;display:flex;flex-direction:column;gap:6px"><p style="font-family:%s;font-size:30px;color:%s;line-height:1">%d</p><p style="font-size:25px;line-height:1.3;color:%s"><b>%s</b></p><p style="font-size:22px;line-height:1.4;color:%s">%s</p></div>'%(PANEL2,HEAD,CORAL,i+1,INK,e(h),GREY,e(s))
b+='</div><p style="position:absolute;left:89px;top:830px;width:1740px;font-family:%s;font-size:30px;line-height:1.3;color:%s">손익분기 월매출 = 고정비 ÷ (1 − 변동비율) · 여기까지는 내 월급이 포함된 숫자 · 남기려면 20%% 더 → 하루 목표 66잔</p>'%(HEAD,CORALD)
frame('d2p4b',b,'4교시 · 16:00–16:50 · 손익분기','고정비 490만 원이면 하루 55잔을 팔아야 겨우 버틴다','고정비에 내 월급을 꼭 넣게 한다. 월급을 빼고 계산하면 가게를 열고 나서 월급을 못 가져간다.','fade','워크북 4교시 손익분기 계산기 · 숫자는 예시 · 사장이 매달 꼭 봐야 할 숫자 5가지')
practice('d2p4x','실습 · 4교시','배수 계산기로 판매가를 정하고 손익분기를 계산한다',15,['「배수 계산기」 · 원가 · 종류 → 배수별 판매가','디저트 4개 판매가 확정 · 세트 아이디어 한 줄','손익분기 계산기 · 고정비(내 월급 포함) · 변동비율','하루 몇 잔 → 「매달 볼 숫자 5가지」 확인'],'기준 · 배수 3 아래 없음 · 인건비에 내 월급','월급을 0으로 넣은 사람을 찾아낸다.')
practice('d2p5x','실습 · 5교시 컨셉북 2장','내 가게 음료 두 잔을 레시피 카드로 남기고 손익을 닫는다',40,['레시피 카드 2장 · 바탕 음료 고르고 이름·재료 하나 바꾸기','원가표 · 내 메뉴 음료 + 디저트 4개 (자동)','월 손익계산표 · 손익분기 + 20% → 하루 목표','그 개수를 채울 방법 한 가지 → 「강사에게 보내기」'],'결과물 · 음료 레시피 카드 & 원가·손익계산표 · 실습 40분 + 피드백 20분','피드백 기준 · 인건비에 내 월급이 있는가 · 음료 원가율 25% 안인가.')
jpslide('d2jp',2,'数えた人だけが、残る。','카조에타 히토다케가, 노코루.','센 사람만이, 남는다.','맛있는 가게는 많았습니다 · 남은 가게는 한 잔의 원가와 하루 몇 잔인지를 아는 가게였습니다','워크북 5교시 맨 아래 「오늘 마음에 남은 한마디」를 적고 보내게 한 뒤 마친다.')

# DAY 3
divider('d3','DAY 3 · 11/4 WED','브랜드와 SNS','이름 · 톤앤매너 · 매출이 오르는 SNS · 그리고 발표',['브랜드 이름과 한 문장','톤앤매너 · 무드보드','플레이스 · 인스타 · 블로그','SNS 첫 30일 + 소개글','컨셉북 발표 · 총정리'],'마지막 날. 오후 5시 발표.')
b=emb(89,250,700,560,emb_funnel(['컨셉북 넣고 AI 후보 10개','기준 5가지로 3개','검색으로 겹침 확인','이름 1개 + 한 문장']))
b+='<div style="position:absolute;left:840px;top:250px;width:990px;display:flex;flex-direction:column;gap:12px">'
for i,(h,s) in enumerate([('기억','한 번 듣고 다음 날 말할 수 있는가'),('발음','전화로 말해도 안 틀리는가'),('검색','네이버에 쳤을 때 묻히지 않는가'),('의미','컨셉 한 줄과 이어지는가'),('확장성','2호점 · 선물 상자에 붙여도 어색하지 않은가')]):
    b+='<div style="background:%s;border-radius:12px;padding:16px 24px;display:flex;flex-direction:row;align-items:center;gap:20px;border:1px solid #EADBC8"><p style="width:52px;height:52px;border-radius:50%%;background:%s;color:#fff;font-family:%s;font-size:26px;line-height:52px;text-align:center">%d</p><p style="font-size:28px;line-height:1.3;color:%s"><b>%s</b> · %s</p></div>'%(PANEL2,CORAL,HEAD,i+1,INK,e(h),e(s))
b+='</div><p style="position:absolute;left:89px;top:830px;width:1740px;font-size:26px;line-height:1.4;color:%s">AI에 「예쁜 이름 지어줘」가 아니라 컨셉북 내용을 통째로 넣는다 · 브랜드 한 문장은 이름 옆에 붙어 간판·프로필·쇼핑백에 그대로</p>'%INK
frame('d3p1',b,'1교시 · 13:00–13:50','이름은 손님에게 주는 첫 선물이다','컨셉북이 프롬프트에 자동으로 들어간다.','fade','워크북 3일차 1교시 · 후보 10 → 3 → 1 · 기준 5가지 체크 · 브랜드 한 문장')
practice('d3p1x','실습 · 1교시','이름 후보 10개를 3개, 1개로 줄이고 한 문장을 쓴다',15,['「AI에 컨셉북 넣고 이름 후보 10개 받기」','후보 3개 → 네이버에 검색해 보기','최종 1개 · 기준 5가지 체크','브랜드 한 문장'],'같은 이름 가게가 이미 3곳 이상이면 뺀다','후보 3개를 네이버에 쳐 보게 한다.')
items=[{'num':'1','h':'분위기','s':'한 단어 3개 + 한 문장 · 손님이 문을 열고 느낄 것'},{'num':'2','h':'컬러 3가지','s':'바탕 · 글씨 · 포인트 · 네 번째 색이 들어오면 흐려진다'},{'num':'3','h':'글씨체','s':'간판에 내 가게 이름을 올려 본다 · 한글 서체 12종 중 하나','k':1},{'num':'4','h':'사진 · 패키지','s':'밝기·거리·소품이 매번 같게 · 상자·스티커 색은 3색 안에'},{'num':'5','h':'말투','s':'인스타 글과 리뷰 답글의 말투가 같게'}]
b=emb(89,250,1740,400,emb_stagger(items,big=32,small=22))
b+='<div style="position:absolute;left:89px;top:690px;width:1740px;height:190px;background:%s;border-radius:14px;padding:28px 40px;display:flex;flex-direction:row;align-items:center;gap:40px"><p style="font-family:%s;font-size:32px;color:%s;line-height:1.2;width:420px">이 가게가 사람이라면</p><p style="font-size:28px;line-height:1.5;color:%s">나이 · 옷차림 · 말투 · 취미로 한 줄 → 이 한 줄이 다섯 가지의 기준 · 예) 30대 중반, 린넨 셔츠, 조용조용 존댓말, 주말엔 산책하고 차를 마시는 사람</p></div>'%(PANEL,HEAD,CORALD,INK)
frame('d3p2',b,'2교시 · 14:00–14:50','색은 셋, 마음은 하나 · 톤앤매너는 빼는 일이다','무엇을 더할지보다 무엇을 안 할지를 정하는 것이 브랜드.','fade','워크북 3일차 2교시 · 컬러 3가지 고르기 · 글씨체 고르기(간판 미리보기) · 무드보드 AI 프롬프트')
practice('d3p2x','실습 · 2교시','분위기 · 컬러 3가지 · 글씨체를 정하고 무드보드 1장',15,['분위기 한 단어 3개 + 한 문장','컬러 3가지 · 바탕 · 글씨 · 포인트','글씨체 고르기 → 간판 미리보기','「AI 이미지로 무드보드」 복사 → 이미지 1장 고르기'],'컨셉북 3장 맨 위에 내 글씨체·색으로 이름이 찍힌다','색을 네 개 고른 사람에게 하나를 빼게 한다.')
b=emb(89,250,1740,300,emb_flow([('네이버 플레이스','검색 → 방문 · 「명지 디저트」를 친 사람이 오늘 오게',1),('인스타그램','발견 → 저장 · 모르던 사람이 「언젠가 가야지」',0),('블로그','신뢰 → 후기 · 갈까 말까 하는 사람이 마지막으로 확인',0)]))
b+=emb(89,580,1740,120,emb_flow([('검색어','명지 디저트',0),('플레이스 사진·리뷰','첫 장은 포장 상자',0),('길찾기 → 방문','하원 시간 6~7시',0),('리뷰 요청','영수증 리뷰 안내 카드',1)]))
b+='<div style="position:absolute;left:89px;top:730px;width:1740px;height:150px;background:%s;border-radius:14px;padding:26px 40px;display:flex;flex-direction:row;align-items:center;gap:40px"><p style="font-family:%s;font-size:32px;color:%s;line-height:1.2;width:420px">리뷰 답글 · 카페스이 사례</p><p style="font-size:26px;line-height:1.5;color:%s">사과 한 줄 + 사실 한 줄 + 다음 방문 이유 한 줄 · 말투는 2교시에서 정한 대로 · [실제 답글과 별점 변화는 화면 캡처로]</p></div>'%(PANEL,HEAD,CORALD,INK)
frame('d3p3',b,'3교시 · 15:00–15:50','팔로워보다 다시 오는 사람이 가게를 살린다','천 명이 좋아요를 누르는 것보다 한 명이 매주 오는 것.','fade','워크북 3일차 3교시 · 손님이 검색할 말 3개 · 채널별 역할 한 줄 · 리뷰 답글 연습')
practice('d3p3x','실습 · 3교시','검색어 3개 · 채널 역할 · 리뷰 답글을 쓴다',10,['손님이 검색할 말 3개 · 「동네 + 필요한 것」','플레이스 · 인스타 · 블로그가 할 일 한 줄씩','리뷰 답글 연습 · 사과 + 사실 + 다음 방문 이유'],'답글 말투는 2교시에서 정한 대로','검색어에 가게 이름을 쓴 사람을 고친다.')
practice('d3p4x','실습 · 4교시 컨셉북 3장','첫 30일 운영 계획과 플레이스 소개글 · 인스타 프로필을 쓴다',30,['1주차 등록·사진 20장 · 2주차 매일 1개·첫 리뷰 10개','3주차 후기 3개·세트 공지 · 4주차 숫자 확인','「AI로 소개글·프로필 받기」 → 내 말투로','플레이스 소개글 · 인스타 프로필 3줄 → 「강사에게 보내기」'],'결과물 · 브랜드 & SNS 30일 계획 · 실습 30분 + 피드백 20분','검색어 3개가 소개글에 자연스럽게 들어갔는지 본다.')
b=emb(89,250,560,560,emb_timer(2,'발표 2분 · 끝나면 10초 뒤 다시 시작',10000,112))
b+='<div style="position:absolute;left:690px;top:250px;width:1140px;height:560px;background:%s;border-radius:14px;padding:30px 36px;display:grid;grid-template-columns:1fr 1fr;gap:12px;border:1px solid #EADBC8">'%PANEL2
for i,t in enumerate(['자기 이름','가게 이름(가칭)','가게 이름 설명','대표·시그니처 디저트 3개 + 음료 3개','각각 한 줄 설명','메뉴 금액 · 인당 객단가','포장 · 배달 · 홀 · 선물세트 중 무엇 위주','내 브랜드의 컨셉 설명 (브랜딩의 시초)','브랜드를 한 줄로 설명하면','3일 동안 수업을 들으면서 느낀 점']):
    b+='<p style="font-size:26px;line-height:1.5;color:%s"><b><span style="color:%s">%d</span></b>  %s</p>'%(INK,CORALD,i+1,e(t))
b+='</div><p style="position:absolute;left:89px;top:840px;width:1740px;font-size:26px;line-height:1.4;color:%s">워크북 「발표」 탭 · 1~3일차 답으로 빈 칸을 채우면 2분 대본이 자동으로 만들어진다 · 15명 × 2분 + 피드백</p>'%GREY
frame('d3p5',b,'5교시 · 17:00–18:00 · 발표','내 가게를 2분에 말한다','발표 순서대로 워크북 발표 탭에 답 칸이 있다. 타이머는 2분 뒤 멈추고 10초 뒤 다시 시작한다.','fade','발표 10칸 → 강사 종합 피드백 → 3일 총정리 · 손익분기 · SNS 계획은 컨셉북 2·3장에서 강사가 짚는다')
jpslide('d3jp',3,'味は当たり前。残る商売が、腕。','아지와 아타리마에. 노코루 쇼-바이가, 우데.','맛은 기본. 남는 장사가, 실력.','컨셉 한 줄 · 하루 몇 잔 · 다시 오고 싶은 이유 · 이 세 가지를 들고 가게를 여세요 · あなたの店で、また会いましょう。','마지막 한 줄. 1일차 1교시에 적은 글과 오늘의 컨셉북을 나란히 보게 하고 마친다.')
b='<div data-build-in="rise 1" style="position:absolute;left:194px;top:260px;width:1532px;height:440px;background:%s;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:40px"><p style="font-family:%s;font-size:28px;color:%s;letter-spacing:4px;line-height:1.2">3일 총정리</p><h1 style="font-family:%s;font-size:72px;font-weight:400;color:%s;line-height:1.2;text-align:center">컨셉 한 줄 · 메뉴 4개 · 음료 레시피 2장<br>원가표 · 손익분기 · 이름 · 30일 계획</h1><p style="font-size:30px;color:%s;line-height:1.4;text-align:center">이 일곱 가지가 컨셉북 세 장에 있다 · 가게를 열기 전까지 이 링크를 다시 열어 고쳐 쓴다</p></div>'%(CORAL,HEAD,LIT,HEAD,WHITE,LIT2)
b+='<div data-build-in="fade 2" style="position:absolute;left:194px;top:740px;width:1532px;display:flex;flex-direction:row;gap:14px">'
for t in ['워크북 · 컨셉북 탭에서 「전체 복사」로 보관','체크리스트 탭 · 가게 여는 18단계는 수업 뒤에도 남는다','강사 카카오톡 · 질문은 언제든']:
    b+='<div style="flex:1;background:%s;border-radius:12px;padding:20px;border:1px solid #EADBC8;text-align:center"><p style="font-size:26px;line-height:1.4;color:%s">%s</p></div>'%(PANEL2,INK,e(t))
b+='</div>'
frame('end',b+LOGO_BIG,'감사합니다',None,'마무리. 워크북 링크는 수업 뒤에도 열린다고 안내한다.','fade')

ORDER=['cover','agenda','workbook','d1','d1p1','d1p1x','d1p2','d1p2x','d1p3','d1p3x','d1p4','d1p4x','d1p5x','d1jp','d2','d2p1','d2b1','d2b2','d2p1x','d2p2','d2r1','d2r2','d2r3','d2p2x','d2p3','d2p3x','d2p4a','d2p4b','d2p4x','d2p5x','d2jp','d3','d3p1','d3p1x','d3p2','d3p2x','d3p3','d3p3x','d3p4x','d3p5','d3jp','end']
deck={"v":4,"createdOnFiles":{"v":1,"at":"2026-10-20T09:00:00Z"},"lists":"css","title":"은밀한 창업 노트 강의안","order":ORDER,
 "sections":{"intro":{"description":"3일 과정과 워크북 사용법을 소개한다.","start":"cover"},"day1":{"description":"1일차 · 컨셉 한 줄과 메뉴 4개를 정한다.","start":"d1"},"day2":{"description":"2일차 · 베이스와 음료 10종으로 원가·가격·손익분기를 계산한다.","start":"d2"},"day3":{"description":"3일차 · 이름·톤앤매너·SNS 30일 계획을 세우고 발표한다.","start":"d3"}},
 "faces":{"do-hyeon":{"family":"Do Hyeon","href":"https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap"},"nanum-gothic":{"family":"Nanum Gothic","href":"https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700;800&display=swap"}},
 "designSystems":[{"title":"PPT 모션 키트","namespace":"pmk","artifact":"https://claude.ai/artifact/DqDAzKs8vdiqaNmTSURqoa","version":"1792482337-44d3","copiedAt":"2026-10-20T09:00:00Z"}]}
json.dump(deck,open(os.path.join(ROOT,'project','deck.json'),'w',encoding='utf-8'),ensure_ascii=False)
assert set(ORDER)==set(f[:-5] for f in os.listdir(OUT)), set(f[:-5] for f in os.listdir(OUT))^set(ORDER)
print('slides',len(ORDER))
