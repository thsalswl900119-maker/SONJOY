# -*- coding: utf-8 -*-
"""cur.py + 템플릿 → out/index.html, out/send.html, out/teacher.html"""
import json, os, hashlib, importlib.util, sys, urllib.parse
HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('cur', os.path.join(HERE, 'cur.py'))
cur = importlib.util.module_from_spec(spec); spec.loader.exec_module(cur)

CUR = {"ver": cur.VER, "title": cur.TITLE, "sub": cur.SUB, "org": cur.ORG, "teacher": cur.TEACHER, "dates": cur.DATES, "start": cur.START, "place": cur.PLACE, "days": cur.DAYS}
def J(o): return json.dumps(o, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

# 강사 화면용 필드 목록 (일차·교시·라벨)
FIELDS = []
for d in cur.DAYS:
    for p in d['periods']:
        for s in p['steps']:
            fs = []
            if s['t'] == 'f': fs = [(s['k'], s['l'], False)]
            elif s['t'] == 'row': fs = [(x['k'], x['l'], False) for x in s['f']]
            elif s['t'] == 'w': fs = [(k, l, (k.startswith('nc') or '_c' in k and k.startswith('m10_'))) for k, l in cur.WKEYS[s['id']]]
            for k, l, ck in fs:
                FIELDS.append({"k": k, "d": d['n'], "p": p['n'], "pt": p['title'], "l": l, "ck": 1 if ck else 0})
# 하루 마무리 한마디 · 발표 칸도 강사 화면에
for d in cur.DAYS:
    for p in d['periods']:
        if p.get('jpk'):
            FIELDS.append({"k": p['jpk'], "d": d['n'], "p": p['n'], "pt": p['title'], "l": "오늘 마음에 남은 한마디", "ck": 0})
for f in cur.PRESF:
    FIELDS.append({"k": f[0], "d": 4, "p": 1, "pt": "발표 답", "l": f[1], "ck": 0})
FIELDS.sort(key=lambda x: (x['d'], x['p']))
DAYN = {d['n']: "%d일차 · %s" % (d['n'], d['title']) for d in cur.DAYS}
DAYN[4] = "발표"
extra = json.load(open(os.path.join(HERE, 'extra.json'), encoding='utf-8'))
CHECK = extra['CHECK']
for st in CHECK:
    if not [x for x in st['seq'] if x[0] == 'ck']:
        st['seq'] = [['ck', 'vd_bean', '원두 거래처와 대체품을 정했다'], ['ck', 'vd_milk', '우유·유제품 거래처를 정했다'], ['ck', 'vd_base', '베이스 재료(레몬·생강·홍차·향신료) 거래처를 정했다'], ['ck', 'vd_pack', '컵·포장재 거래처와 최소 주문량을 확인했다'], ['ck', 'vd_alt', '품절될 때 대체품을 품목마다 적었다']]
GLOSS = sorted(extra['GLOSS'] + cur.GLOSS_ADD, key=lambda g: (g[0], g[1]))
FONTURL = 'https://fonts.googleapis.com/css2?' + '&'.join('family=' + urllib.parse.quote(f[0]).replace('%20', '+') for f in cur.FONTS) + '&family=Noto+Serif+JP:wght@400;600&family=Nanum+Gothic:wght@400;700;800&family=Do+Hyeon&display=swap'
PIN_HASH = hashlib.sha256(('b2o:' + os.environ.get('TPIN', '181204')).encode()).hexdigest()

def rd(n): return open(os.path.join(HERE, n), encoding='utf-8').read()
out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
idx = rd('tpl_index.html').replace('__TITLE__', cur.TITLE + ' ver.' + cur.VER).replace('__CUR__', J(CUR)).replace('__WKEYS__', J(cur.WKEYS)).replace('__EX__', J(cur.EX)).replace('__BASE__', cur.BASE).replace('__COST__', cur.COST_URL).replace('__DRINKS__', J(cur.DRINKS)).replace('__BASES__', J(cur.BASES)).replace('__CUP__', J(cur.CUP)).replace('__FONTS__', J(cur.FONTS)).replace('__PRESF__', J(cur.PRESF)).replace('__PRES_MODES__', J(cur.PRES_MODES)).replace('__CHECK__', J(CHECK)).replace('__GLOSS__', J(GLOSS)).replace('__FONTURL__', FONTURL)
snd = rd('tpl_send.html').replace('__VER__', cur.VER).replace('__ROSTER__', cur.ROSTER)
tch = rd('tpl_teacher.html').replace('__VER__', cur.VER).replace('__ROSTER__', cur.ROSTER).replace('__FIELDS__', J(FIELDS)).replace('__DAYN__', J(DAYN)).replace('__PINHASH__', PIN_HASH)
for n, s in (('index.html', idx), ('send.html', snd), ('teacher.html', tch)):
    assert not [p for p in ('__TITLE__','__CUR__','__WKEYS__','__EX__','__BASE__','__COST__','__DRINKS__','__BASES__','__CUP__','__FONTS__','__PRESF__','__PRES_MODES__','__CHECK__','__GLOSS__','__FONTURL__','__VER__','__ROSTER__','__FIELDS__','__DAYN__','__PINHASH__') if p in s], n
    open(os.path.join(out, n), 'w', encoding='utf-8').write(s)
    print(n, len(s.encode()), 'bytes')
# 아티팩트용: 껍데기 태그 제거 · 인쇄 버튼 제거 (아티팩트 창은 window.print 불가)
import re
art = idx
for tag in ('<!doctype html>', '<html lang="ko">', '<head>', '</head>', '<body>', '</body>', '</html>', '<meta charset="utf-8">', '<meta name="viewport" content="width=device-width, initial-scale=1">'):
    art = art.replace(tag, '')
art = art.replace('<button type="button" class="sub" id="btnPrint">🖨 인쇄 · PDF</button>', '')
art = art.replace("$('#btnPrint').addEventListener('click',function(){renderBook();try{window.print();}catch(e){}setTimeout(function(){toast('인쇄 창이 안 뜨면 「컨셉북 전체 복사」로 메모장에 붙여 넣어 보관하세요.');},800);});", '')
assert 'btnPrint' not in art
open(os.path.join(out, 'artifact.html'), 'w', encoding='utf-8').write(art.strip() + '\n')
print('artifact.html', len(art.encode()), 'bytes')
print('fields', len(FIELDS))
