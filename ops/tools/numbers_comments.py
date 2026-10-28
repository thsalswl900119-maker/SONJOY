# 손익(회계) Numbers 파일의 칸 「주석」을 날짜 · 줄 이름과 함께 꺼냄 (numbers_parser는 주석을 못 읽어서 직접)
#  사용: pip install numbers-parser && python3 -I numbers_comments.py <파일.numbers> <나갈.json>
#  · cell 저장 플래그 0x80000 = comment_id → 표 base_data_store.comment_storage_table → CommentStorageArchive.text
#  · 「24년 1월」 · 「25년 1월」 · 「25년 12월」처럼 날짜 줄 연도가 1년 앞인 시트가 있어 시트 이름(YY년 M월)으로 날짜를 고침
from numbers_parser import Document
from struct import unpack
import json, datetime, sys
d=Document(sys.argv[1]); m=d._model
out=[]
for sh in d.sheets:
    for tb in sh.tables:
        tid=tb._table_id
        bds=m.objects[tid].base_data_store
        fields=[f.name for f,_ in bds.ListFields()]
        cst=None
        for nm in ('comment_storage_table','commentStorageTable'):
            if nm in fields: cst=m.objects[getattr(bds,nm).identifier]
        if cst is None: continue
        cmap={}
        for e in cst.entries:
            try:
                cs=m.objects[e.comment_storage.identifier]; txt=cs.text if hasattr(cs,'text') else ''
                if not isinstance(txt,str): txt=str(txt)
                cmap[e.key]=txt
            except Exception as ex: pass
        if not cmap: continue
        hdr={}
        for r in range(min(6,tb.num_rows)):
            for c in range(tb.num_cols):
                v=tb.cell(r,c).value
                if isinstance(v,datetime.datetime): hdr[c]=v.strftime('%Y-%m-%d')
        for r in range(tb.num_rows):
            for c in range(tb.num_cols):
                cell=tb.cell(r,c); fl=getattr(cell,'_flags',0) or 0
                if not fl & 0x80000: continue
                b=cell._buffer; off=12
                for bit,sz in [(0x1,16),(0x2,8),(0x4,8)]+[(1<<i,4) for i in range(3,19)]:
                    if fl & bit: off+=sz
                cid=unpack('<i',b[off:off+4])[0]
                # 행 이름(왼쪽 글자 칸) · 날짜(위 날짜 줄 또는 같은 줄 맨 앞 날짜)
                lab=''
                for lc in range(min(c,9),-1,-1):
                    v=tb.cell(r,lc).value
                    if isinstance(v,str) and v.strip(): lab=v.strip(); break
                dt=hdr.get(c)
                if not dt:
                    v=tb.cell(r,0).value
                    if isinstance(v,datetime.datetime): dt=v.strftime('%Y-%m-%d')
                out.append({'sheet':sh.name.strip(),'r':r,'c':c,'date':dt,'row':lab,'val':cell.value if isinstance(cell.value,(int,float)) else str(cell.value),'cm':cmap.get(cid,'')})
import re as _re
for x in out:
    m=_re.match(r'\s*(\d\d)\D*?(\d{1,2})월',x['sheet'])
    if m and x['date']: x['date']='20%s-%02d'%(m.group(1),int(m.group(2)))+x['date'][7:]
json.dump(out,open(sys.argv[2],'w'),ensure_ascii=False,default=str,indent=0)
print(len(out))
