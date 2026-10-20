"""Composite new frame layers + scene recordings into the training video, then add the ElevenLabs narration."""
import json, subprocess, sys
from pathlib import Path
from PIL import Image
D = Path(__file__).parent; L = D / 'layers'; W = D / 'clips'; W.mkdir(exist_ok=True)
MAN = Path(sys.argv[1]); PROJ = MAN.parent; AUDIO = Path(sys.argv[2]); OUT = Path(sys.argv[3])
segs = json.loads((D / 'narration-th.json').read_text(encoding='utf-8'))
chap = json.loads((MAN / 'video-chapters.json').read_text(encoding='utf-8'))
meta = json.loads((L / 'meta.json').read_text())
scenes = {1: PROJ / 'animation/scene 1/scene_1_youtube_1080p.mp4', 2: PROJ / 'animation/scene 2/scene_2_youtube_1080p.mp4'}
INK = '0x13233A'
for i, s in enumerate(segs):
    T, t0, m = chap[i]['duration'], chap[i]['start'], meta[i]
    args = ['ffmpeg', '-y', '-v', 'error', '-loop', '1', '-framerate', '60', '-i', str(L / f'base-{i}.png')]
    if s.get('source'):
        args += ['-ss', str(s['start']), '-t', str(s['end'] - s['start']), '-i', str(scenes[s['source']])]
        content = f"[1:v]setpts=(PTS-STARTPTS)*{T/(s['end']-s['start'])},scale=1440:810:flags=lanczos,setsar=1,fps=60,tpad=stop_mode=clone:stop_duration=2"
    else:
        args += ['-loop', '1', '-framerate', '60', '-i', str(L / f'hero-{i}.png')]
        content = '[1:v]setsar=1'
    content += f',fade=t=in:st=0:d=0.35:color={INK},fade=t=out:st={T-0.3:.3f}:d=0.3:color={INK}[c]'
    H = m['fillH'] or 2
    strip = Image.new('RGBA', (4, 2 * H), (0, 0, 0, 0)); strip.paste((181, 101, 43, 255) if m['fillH'] else (0, 0, 0, 0), (0, 0, 4, H)); strip.save(W / f'strip-{i}.png')
    for f in [L / 'top.png', W / f'strip-{i}.png', L / f'tip-{i}.png', D / 'mascot.png']:
        args += ['-loop', '1', '-framerate', '60', '-i', str(f)]
    fc = ';'.join([
        content,
        '[0:v][c]overlay=48:148:shortest=1[a]',
        '[a][2:v]overlay=0:0[b]',
        f"[3:v]crop=4:{H}:0:'{H}-{H}*min(1,t/{T})'[s]",
        f"[b][s]overlay={m['lineX']}:{m['fillY']}[d]",
        '[4:v]format=rgba,fade=t=in:st=0.25:d=0.5:alpha=1[tp]',
        f"[d][tp]overlay=x='{m['tipX']}+36*pow(1-min(1,max(0,t-0.25)/0.55),3)':y={m['tipY']}[e]",
        f"[e][5:v]overlay=x=1610:y='800+5*sin(2*PI*(t+{t0})/2.8)',format=yuv420p[v]"])
    args += ['-filter_complex', fc, '-map', '[v]', '-t', f'{T}', '-r', '60', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', str(W / f'clip-{i:02}.mp4')]
    subprocess.run(args, check=True); print('clip', i, flush=True)
(W / 'concat.txt').write_text(''.join(f"file 'clip-{i:02}.mp4'\n" for i in range(len(segs))))
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', str(W / 'concat.txt'), '-i', str(AUDIO),
                '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(OUT)], check=True)
print('done', OUT)
