"""Lay ElevenLabs narration onto the existing QTC-Training-TH timeline, master, mux, rewrite subs.
usage: python3 remix.py <manuals_dir> <voice_dir> <out_dir>
Voice files: voice_dir/00.mp3 .. 10.mp3. Video stream is copied untouched.
"""
import json, subprocess, sys
from pathlib import Path

src, vdir, out = map(Path, sys.argv[1:4])
out.mkdir(parents=True, exist_ok=True)
chapters = json.loads((src / 'video-chapters.json').read_text(encoding='utf-8'))
segs = json.loads((src / 'narration-th.json').read_text(encoding='utf-8'))
LEAD, TAIL = 0.35, 0.45  # breath before line / room before next chapter

def dur(f):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)]))

def stamp(s, sep):
    ms = round(s * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}{sep}{ms%1000:03}'

total = dur(src / 'QTC-Training-TH.mp4')
inputs, filt, mix, cues = [], [], [], []
for i, c in enumerate(chapters):
    f = vdir / f'{i:02}.mp3'
    # trim leading/trailing silence first so timing is measured on actual speech
    clean = out / f'clean-{i:02}.wav'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(f), '-af',
                    'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
                    '-ar', '48000', '-ac', '1', str(clean)], check=True)
    d = dur(clean)
    room = c['duration'] - LEAD - TAIL
    tempo = max(1.0, d / room)  # ponytail: only speeds up; >1.12 gets flagged, rebuild clip timing if it shows up
    if tempo > 1.12:
        print(f'WARN line {i}: needs tempo {tempo:.3f}')
    spoken = d / tempo
    start = c['start'] + LEAD
    inputs += ['-i', str(clean)]
    filt.append(f'[{i}:a]atempo={tempo:.4f},adelay={int(start*1000)}:all=1[v{i}]')
    mix.append(f'[v{i}]')
    cues.append((start, start + spoken, segs[i]['text']))
    print(f'{i:02} voice {d:5.2f}s room {room:5.2f}s tempo {tempo:.3f}')

# voice chain: rumble cut, de-mud, presence, gentle comp, de-ess-ish shelf, broadcast loudness
chain = ('highpass=f=80,equalizer=f=250:t=q:w=1.2:g=-2,equalizer=f=3500:t=q:w=1.0:g=2,'
         'equalizer=f=7500:t=q:w=2:g=-1.5,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,'
         f'apad=whole_dur={total},atrim=0:{total},loudnorm=I=-16:TP=-1.5:LRA=7,aresample=48000,aformat=channel_layouts=stereo')
fc = ';'.join(filt) + ';' + ''.join(mix) + f'amix=inputs={len(mix)}:normalize=0,{chain}[a]'
wav = out / 'narration-elevenlabs.wav'
subprocess.run(['ffmpeg', '-y', '-v', 'error', *inputs, '-filter_complex', fc, '-map', '[a]', str(wav)], check=True)
mp4 = out / 'QTC-Training-TH.mp4'
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(src / 'QTC-Training-TH.mp4'), '-i', str(wav),
                '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                '-shortest', '-movflags', '+faststart', str(mp4)], check=True)
(out / 'QTC-Training-TH.srt').write_text(''.join(f'{n+1}\n{stamp(a,",")} --> {stamp(b,",")}\n{t}\n\n' for n, (a, b, t) in enumerate(cues)), encoding='utf-8')
(out / 'QTC-Training-TH.vtt').write_text('WEBVTT\n\n' + ''.join(f'{stamp(a,".")} --> {stamp(b,".")}\n{t}\n\n' for a, b, t in cues), encoding='utf-8')
assert abs(dur(mp4) - total) < 0.1, (dur(mp4), total)
for (a, b, _), c in zip(cues, chapters):
    assert b <= c['start'] + c['duration'], 'line overruns its chapter'
print('done', mp4, f'{dur(mp4):.2f}s')
