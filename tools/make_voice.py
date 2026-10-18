#!/usr/bin/env python3
"""Make the voice clips for a story, once (existing clips are reused; pass --force to redo one or all).

    python3 tools/make_voice.py stories/pocket-money            # all missing scenes
    python3 tools/make_voice.py stories/pocket-money --force 3  # redo scene 3

Uses the saved voice named in story.json ("voice": {"voice": "boy-calm"}) by cloning its reference clip
with Qwen3-TTS (selected-voices/speak.sh does the same for one line). Writes voice/scene-01.wav … and
voice/durations.json, which the player and the renderer use for timing.
Each line is made in several takes (--takes, default 3) and the take closest to the reference clip's
pitch and pace is kept, so every scene sounds like the chosen voice. If a scene's narration is exactly the
start of the reference recording's text, the reference recording itself is used for that line.
Needs mlx-audio + numpy: run it with that venv's python (or set PYTHON=/path/to/venv/bin/python).
"""
import json, os, re, shutil, subprocess, sys, tempfile, wave, glob
import numpy as np

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
story_dir = os.path.abspath(sys.argv[1])
force = None
if '--pace-only' in sys.argv: pass
if '--force' in sys.argv:
    i = sys.argv.index('--force'); force = sys.argv[i + 1] if i + 1 < len(sys.argv) else 'all'
story = json.load(open(os.path.join(story_dir, 'story.json')))
arg = lambda k: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else None
voice = arg('--voice') or story['voice']['voice']            # --voice narrator  → try another saved voice
cfg = json.load(open(os.path.join(root, 'selected-voices', voice, 'voice.json')))
py = os.environ.get('PYTHON', os.path.join(root, '.venv', 'bin', 'python'))
out_dir = os.path.join(story_dir, arg('--out') or 'voice'); os.makedirs(out_dir, exist_ok=True)   # --out voice-narrator keeps the main clips untouched

def duration(path):
    with wave.open(path) as w: return w.getnframes() / w.getframerate()

def load(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        return x, w.getframerate()

def pitch(path):   # median voiced pitch (Hz)
    x, sr = load(path); f = []; n = int(0.04 * sr)
    for i in range(0, len(x) - n, n // 2):
        s = x[i:i + n]
        if np.sqrt((s ** 2).mean()) < 0.02: continue
        s = s - s.mean(); ac = np.correlate(s, s, 'full')[n - 1:]; lo, hi = int(sr / 400), int(sr / 70); k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.3 * ac[0]: f.append(sr / k)
    return float(np.median(f)) if f else 0.0

def words(t): return len(re.findall(r"[A-Za-z']+", t))

takes = int(sys.argv[sys.argv.index('--takes') + 1]) if '--takes' in sys.argv else 3
_VOICES = {}
def use_voice(name):   # each scene can have its own voice ("voice": "girl"); the story voice is the default
    global cfg, ref_wav, ref_text, ref_pitch, ref_rate
    if name not in _VOICES:
        c = json.load(open(os.path.join(root, 'selected-voices', name, 'voice.json')))
        w = os.path.join(root, 'selected-voices', name, 'reference.wav'); t = c['reproduce']['ref_text']
        _VOICES[name] = (c, w, t, pitch(w), words(t) / duration(w)); print(f'voice {name}: {_VOICES[name][3]:.0f} Hz, {_VOICES[name][4]:.2f} words/s')
    cfg, ref_wav, ref_text, ref_pitch, ref_rate = _VOICES[name]
use_voice(voice)

def pace_match(path, text):
    # cloned lines tend to rush: slow them toward the reference pace (pitch unchanged), never more than 20%
    rate = words(text) / duration(path)
    if rate <= ref_rate * 1.08: return
    tempo = max(0.8, ref_rate * 1.05 / rate)
    raw = path.replace('.wav', '.raw.wav'); shutil.move(path, raw)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-filter:a', f'atempo={tempo:.3f}', path], check=True)
    os.remove(raw); print(f'  paced to {words(text) / duration(path):.2f} w/s (tempo {tempo:.2f})')

def cut_reference(text, dst):
    # the line is the start of the reference recording: cut it at the pause closest to where those words end
    x, sr = load(ref_wav); frac = words(text) / words(ref_text); guess = frac * len(x) / sr
    hop = int(0.01 * sr); e = np.array([np.sqrt((x[i:i + hop] ** 2).mean()) for i in range(0, len(x) - hop, hop)])
    quiet = e < max(0.01, e.max() * 0.04); best, bestd = None, 9e9
    i = 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]: j += 1
            if j - i >= 12:   # a pause of 120 ms or more
                mid = (i + j) / 2 * 0.01
                if abs(mid - guess) < bestd: best, bestd = mid, abs(mid - guess)
            i = j
        else: i += 1
    end = int((best if best else guess) * sr)
    seg = (x[:end] * 32768).astype(np.int16)
    with wave.open(dst, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(seg.tobytes())

durations = {}
for sc in story['scenes']:
    name = f"scene-{sc['id']:02d}.wav"; dst = os.path.join(out_dir, name)
    redo = force == 'all' or (force is not None and force == str(sc['id']))
    if os.path.exists(dst) and not redo:
        durations[name] = round(duration(dst), 3); print('reuse', name, durations[name]); continue
    sv = sc.get('voice') if not arg('--voice') else None
    use_voice(sv if sv and os.path.exists(os.path.join(root, 'selected-voices', sv, 'reference.wav')) else voice)
    norm = lambda t: re.sub(r'[^a-z ]', '', t.lower()).split()
    if norm(ref_text)[:len(norm(sc['narration']))] == norm(sc['narration']):
        cut_reference(sc['narration'], dst); durations[name] = round(duration(dst), 3); print('reference', name, durations[name]); continue
    best = None
    for k in range(takes):
        tmp = tempfile.mkdtemp()
        subprocess.run([py, '-m', 'mlx_audio.tts.generate', '--model', cfg['reproduce']['model'], '--lang_code', 'english',
                        '--ref_audio', ref_wav, '--ref_text', ref_text, '--temperature', '0.6',
                        '--text', sc['narration'], '--output_path', tmp, '--file_prefix', 'line'], check=True, cwd=root, capture_output=True)
        wavs = sorted(glob.glob(os.path.join(tmp, '*.wav')))
        if not wavs: continue
        take = os.path.join(tmp, 'take.wav')
        if len(wavs) == 1: shutil.move(wavs[0], take)
        else: subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + sum([['-i', w] for w in wavs], []) + ['-filter_complex', f"concat=n={len(wavs)}:v=0:a=1", take], check=True)
        p, rate = pitch(take), words(sc['narration']) / duration(take)
        score = abs(p - ref_pitch) / ref_pitch + 0.5 * abs(rate - ref_rate) / ref_rate
        print(f'  scene {sc["id"]} take {k + 1}: {p:.0f} Hz, {rate:.2f} w/s, score {score:.3f}')
        if best is None or score < best[0]:
            if best: shutil.rmtree(os.path.dirname(best[1]), ignore_errors=True)
            best = (score, take)
        else: shutil.rmtree(tmp, ignore_errors=True)
    if not best: sys.exit('no audio produced for scene %s' % sc['id'])
    shutil.move(best[1], dst); shutil.rmtree(os.path.dirname(best[1]), ignore_errors=True)
    pace_match(dst, sc['narration'])
    durations[name] = round(duration(dst), 3); print('made', name, durations[name], f'(best score {best[0]:.3f})')
json.dump(durations, open(os.path.join(out_dir, 'durations.json'), 'w'), indent=2)
print('total', round(sum(durations.values()), 1), 's')
# word timestamps for the story engine (camera / sounds / subtitles timed to words)
subprocess.run([sys.executable, os.path.join(root, 'tools', 'align_words.py'), story_dir, '--dir', os.path.basename(out_dir)], check=False)
