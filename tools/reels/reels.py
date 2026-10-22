#!/usr/bin/env python3
"""카페스이 릴스 자동 편집기 (작은 버전)

찍은 영상 하나를 넣으면
  1) 말 없는 구간(숨 · 쉬는 시간)을 잘라내고 목소리 크기를 맞춘 영상
  2) 단어 시간에 맞춘 자막 파일(.srt)
  3) 자막을 입힌 영상
  4) 받아 적은 글(.txt)
을 결과 폴더에 만든다.

쓰는 도구: faster-whisper(받아 적기 + 안에 든 Silero VAD로 쉬는 구간 찾기) · ffmpeg(자르기 · 붙이기 · 소리 · 자막 입히기)

예)
  python reels.py 영상.mp4
  python reels.py 영상.mp4 --script 대본.txt          # 대본이 있으면 받아 적기가 더 정확
  python reels.py 영상.mp4 --no-cut                    # 제품 영상처럼 자르면 안 될 때 (자막만)
  python reels.py 영상.mp4 --no-subs                   # 컷 편집만
  python reels.py 결과/1_컷편집.mp4 --burn-only 결과/2_자막.srt   # 자막 고친 뒤 다시 입히기
"""
import argparse
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 16000


def run(cmd):
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if r.returncode != 0:
        sys.exit("ffmpeg 오류:\n" + r.stderr[-2000:])
    return r


def probe(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type,width,height",
             "-of", "json", path])
    j = json.loads(r.stdout)
    st = j.get("streams", [])
    v = next((s for s in st if s.get("codec_type") == "video"), None)
    a = any(s.get("codec_type") == "audio" for s in st)
    return float(j["format"]["duration"]), v, a


# ---------- 1. 쉬는 구간 찾기 ----------
def load_audio(path):
    """ffmpeg로 16kHz 모노 소리만 꺼냄(PyAV 판에 따라 오류 나는 것 피함)."""
    import numpy as np

    r = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(SR),
                        "-f", "f32le", "-"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        sys.exit("소리 꺼내기 오류:\n" + r.stderr.decode("utf-8", "replace")[-2000:])
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def speech_segments(path, min_gap, pad, min_speech):
    from faster_whisper.vad import VadOptions, get_speech_timestamps

    audio = load_audio(path)
    total = len(audio) / SR
    ts = get_speech_timestamps(audio, VadOptions(min_silence_duration_ms=int(min_gap * 1000),
                                                 speech_pad_ms=0, min_speech_duration_ms=int(min_speech * 1000)))
    segs = []
    for t in ts:
        s = max(0.0, t["start"] / SR - pad)
        e = min(total, t["end"] / SR + pad)
        if segs and s - segs[-1][1] < min_gap:
            segs[-1][1] = max(segs[-1][1], e)  # 짧은 쉼은 안 자름(말이 뚝뚝 끊기지 않게)
        else:
            segs.append([s, e])
    return segs, total


def cut_video(src, dst, segs, has_video, loud):
    """구간들만 이어 붙임. 구간이 많아도 되게 필터를 파일로 넘김."""
    parts, labels = [], []
    for i, (s, e) in enumerate(segs):
        if has_video:
            parts.append(f"[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS[v{i}];")
            labels.append(f"[v{i}]")
        parts.append(f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS,"
                     f"afade=t=in:d=0.02,afade=t=out:st={max(0, e - s - 0.02):.3f}:d=0.02[a{i}];")
        labels.append(f"[a{i}]")
    n = len(segs)
    if has_video:
        tail = f"{''.join(labels)}concat=n={n}:v=1:a=1[v][ac];"
    else:
        tail = f"{''.join(labels)}concat=n={n}:v=0:a=1[ac];"
    tail += "[ac]loudnorm=I=-14:TP=-1.5:LRA=11[a]" if loud else "[ac]anull[a]"
    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write("".join(parts) + tail)
        script = f.name
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", src, "-filter_complex_script", script]
    if has_video:
        cmd += ["-map", "[v]", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p"]
    cmd += ["-map", "[a]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", dst]
    try:
        run(cmd)
    finally:
        os.unlink(script)


def normalize_only(src, dst, has_video):
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", src, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11"]
    cmd += ["-c:v", "copy"] if has_video else ["-vn"]
    cmd += ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", dst]
    run(cmd)


# ---------- 2. 받아 적기 ----------
def load_glossary(path):
    """glossary.txt: 한 줄에 하나. '틀린말=맞는말' 은 고치기 목록, 나머지는 자주 나오는 낱말."""
    words, fixes = [], []
    if path and os.path.exists(path):
        for ln in open(path, encoding="utf-8"):
            ln = ln.strip()
            if not ln or ln.startswith("#"):
                continue
            if "=" in ln:
                a, b = ln.split("=", 1)
                fixes.append((a.strip(), b.strip()))
            else:
                words.append(ln)
    return words, fixes


def transcribe(path, model_name, words, script_text, device):
    from faster_whisper import WhisperModel

    prompt = ""
    if words:
        prompt = ", ".join(words) + ". "
    if script_text:
        prompt += re.sub(r"\s+", " ", script_text)[-600:]  # 너무 길면 뒷부분만(받아 적기 힌트 한도)
    compute = "int8" if device == "cpu" else "float16"
    model = WhisperModel(model_name, device=device, compute_type=compute)
    segments, _ = model.transcribe(load_audio(path), language="ko", word_timestamps=True, beam_size=5,
                                   initial_prompt=prompt or None, vad_filter=False,
                                   condition_on_previous_text=False)
    out = []
    for seg in segments:
        for w in seg.words or []:
            out.append({"w": w.word, "s": w.start, "e": w.end})
    return out


def apply_fixes(text, fixes):
    for a, b in fixes:
        text = text.replace(a, b)
    return text


# ---------- 3. 자막 줄 나누기 ----------
def make_cues(words, max_chars=16, max_gap=0.45, max_dur=3.2, fixes=()):
    """단어들을 자막 한 줄씩으로. 휴대폰 세로 화면에 맞게 짧게(기본 16자)."""
    cues, cur = [], []

    def flush():
        if not cur:
            return
        text = "".join(x["w"] for x in cur).strip()
        text = apply_fixes(text, fixes)
        text = re.sub(r"[,.]$", "", text)
        if text:
            cues.append({"s": cur[0]["s"], "e": cur[-1]["e"], "t": text})
        cur.clear()

    for w in words:
        if cur:
            length = len("".join(x["w"] for x in cur + [w]).strip())
            if (w["s"] - cur[-1]["e"] > max_gap or length > max_chars
                    or w["e"] - cur[0]["s"] > max_dur):
                flush()
        cur.append(w)
        if re.search(r"[.?!]$", w["w"].strip()):
            flush()
    flush()
    # 너무 짧게 지나가는 자막은 다음 자막 직전까지 늘림
    for i, c in enumerate(cues):
        nxt = cues[i + 1]["s"] if i + 1 < len(cues) else c["e"] + 0.6
        if c["e"] - c["s"] < 0.7:
            c["e"] = min(c["s"] + 0.7, nxt - 0.02)
        else:
            c["e"] = min(c["e"] + 0.15, nxt - 0.02)
    return cues


def ts(t):
    t = max(0.0, t)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s % 1) * 1000)) % 1000:03d}"


def write_srt(cues, path):
    with open(path, "w", encoding="utf-8") as f:
        for i, c in enumerate(cues, 1):
            f.write(f"{i}\n{ts(c['s'])} --> {ts(c['e'])}\n{c['t']}\n\n")


# ---------- 4. 자막 입히기 ----------
def default_font():
    sysname = platform.system()
    if sysname == "Darwin":
        return "Apple SD Gothic Neo"
    if sysname == "Windows":
        return "Malgun Gothic"
    return "Noto Sans CJK KR"


def burn(src, srt, dst, font, vh):
    # libass 기준 높이 288 → 세로 영상이면 글자를 조금 크게 · 아래 25%쯤(인스타 글 · 단추에 안 가리게)
    size = 14 if vh and vh[1] > vh[0] else 18
    style = (f"FontName={font},FontSize={size},Bold=1,PrimaryColour=&H00FFFFFF,"
             f"OutlineColour=&H00202A3B,BorderStyle=1,Outline=1.6,Shadow=0,Alignment=2,MarginV=72")
    d = os.path.dirname(os.path.abspath(srt))
    name = os.path.basename(srt)
    # 경로 따옴표 문제를 피하려고 자막 폴더에서 실행
    r = subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", os.path.abspath(src),
                        "-vf", f"subtitles={name}:force_style='{style}'",
                        "-c:v", "libx264", "-crf", "20", "-preset", "veryfast", "-pix_fmt", "yuv420p",
                        "-c:a", "copy", "-movflags", "+faststart", os.path.abspath(dst)],
                       cwd=d, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if r.returncode != 0:
        sys.exit("자막 입히기 오류:\n" + r.stderr[-2000:])


def main():
    ap = argparse.ArgumentParser(description="카페스이 릴스 자동 편집기(컷 · 자막)")
    ap.add_argument("video", help="찍은 영상 파일")
    ap.add_argument("--out", help="결과 폴더 (기본: 영상이름_결과)")
    ap.add_argument("--script", help="대본 txt (있으면 받아 적기가 정확해짐)")
    ap.add_argument("--glossary", default=os.path.join(HERE, "glossary.txt"), help="카페스이 낱말 · 고치기 목록")
    ap.add_argument("--model", default="small", help="받아 적기 모델: small(빠름) · medium · large-v3(정확 · 느림)")
    ap.add_argument("--device", default="cpu", help="cpu 또는 cuda(그래픽카드)")
    ap.add_argument("--min-gap", type=float, default=0.35, help="이 초보다 긴 쉼만 자름 (기본 0.35)")
    ap.add_argument("--pad", type=float, default=0.12, help="말 앞뒤로 남길 여유 초 (기본 0.12)")
    ap.add_argument("--max-chars", type=int, default=16, help="자막 한 줄 최대 글자 (기본 16)")
    ap.add_argument("--font", default=default_font(), help="자막 글꼴 이름")
    ap.add_argument("--no-cut", action="store_true", help="자르지 않음(제품 영상 · 음악 영상)")
    ap.add_argument("--no-subs", action="store_true", help="자막 안 만듦(컷 편집만)")
    ap.add_argument("--no-burn", action="store_true", help="자막 파일만, 영상에 입히지 않음")
    ap.add_argument("--no-loud", action="store_true", help="목소리 크기 맞추기 안 함")
    ap.add_argument("--burn-only", metavar="SRT", help="고친 자막 파일을 이 영상에 다시 입히기만")
    a = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg가 없습니다. README의 설치 안내를 보세요.")
    src = a.video
    if not os.path.exists(src):
        sys.exit(f"영상이 없습니다: {src}")
    if a.burn_only:
        _, vinfo, _ = probe(src)
        if not vinfo:
            sys.exit("영상 파일이 아닙니다.")
        final = os.path.join(os.path.dirname(os.path.abspath(src)), "3_완성_자막입힘.mp4")
        burn(src, a.burn_only, final, a.font, (vinfo["width"], vinfo["height"]))
        print(f"자막 다시 입힘 → {final}")
        return
    base = os.path.splitext(os.path.basename(src))[0]
    out = a.out or os.path.join(os.path.dirname(os.path.abspath(src)), base + "_결과")
    os.makedirs(out, exist_ok=True)
    dur, vinfo, has_audio = probe(src)
    if not has_audio:
        sys.exit("소리가 없는 영상입니다(받아 적을 말이 없음).")
    has_video = vinfo is not None
    ext = ".mp4" if has_video else ".m4a"
    vh = (vinfo["width"], vinfo["height"]) if has_video else None
    report = {"원본": src, "원본 길이(초)": round(dur, 1)}

    # 1) 컷
    cut = os.path.join(out, "1_컷편집" + ext)
    if a.no_cut:
        if a.no_loud:
            shutil.copy(src, cut)
        else:
            normalize_only(src, cut, has_video)
    else:
        print("① 쉬는 구간 찾는 중…")
        segs, total = speech_segments(src, a.min_gap, a.pad, 0.15)
        if not segs:
            sys.exit("말소리를 못 찾았습니다. --no-cut 으로 해 보세요.")
        kept = sum(e - s for s, e in segs)
        print(f"   말 구간 {len(segs)}개 · {total:.1f}초 → {kept:.1f}초 ({total - kept:.1f}초 잘라냄)")
        cut_video(src, cut, segs, has_video, not a.no_loud)
        report.update({"말 구간 수": len(segs), "남긴 길이(초)": round(kept, 1),
                       "잘라낸 길이(초)": round(total - kept, 1),
                       "남긴 구간": [[round(s, 2), round(e, 2)] for s, e in segs]})
    print(f"   → {cut}")

    # 2~3) 자막
    if not a.no_subs:
        print(f"② 받아 적는 중… (모델 {a.model} · 처음엔 모델을 내려받느라 오래 걸려요)")
        words, fixes = load_glossary(a.glossary)
        script_text = open(a.script, encoding="utf-8").read() if a.script else ""
        ws = transcribe(cut, a.model, words, script_text, a.device)
        cues = make_cues(ws, a.max_chars, fixes=fixes)
        srt = os.path.join(out, "2_자막.srt")
        write_srt(cues, srt)
        txt = apply_fixes("".join(w["w"] for w in ws).strip(), fixes)
        with open(os.path.join(out, "받아적기.txt"), "w", encoding="utf-8") as f:
            f.write(txt + "\n")
        with open(os.path.join(out, "단어시간.json"), "w", encoding="utf-8") as f:
            json.dump(ws, f, ensure_ascii=False, indent=0)
        report["자막 줄 수"] = len(cues)
        print(f"   자막 {len(cues)}줄 → {srt}")
        if has_video and not a.no_burn and cues:
            print("③ 자막 입히는 중…")
            final = os.path.join(out, "3_완성_자막입힘.mp4")
            burn(cut, srt, final, a.font, vh)
            print(f"   → {final}")

    with open(os.path.join(out, "보고.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    print("끝!")
    if not a.no_subs and has_video:
        print("자막에 틀린 글자가 있으면 2_자막.srt 를 메모장으로 고친 뒤:")
        print(f'   python reels.py "{cut}" --burn-only "{os.path.join(out, "2_자막.srt")}"')
        print("   (또는 2_자막.srt 를 캡컷 · 브루에 불러와도 됩니다)")


if __name__ == "__main__":
    main()
