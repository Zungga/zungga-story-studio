#!/usr/bin/env python3
"""Voice casting: make listening samples for every character from text descriptions (Qwen3-TTS VoiceDesign).

    .venv/bin/python tools/design_voices.py                 # all characters in voice-casting/cast.json (existing samples kept)
    .venv/bin/python tools/design_voices.py rio --force     # redo one character
    .venv/bin/python tools/design_voices.py pick rio 2      # keep option 2 as the saved voice selected-voices/rio/

Samples go to voice-casting/<id>/option-N.wav; listen in studio/voice-casting.html. A picked voice is reproduced
exactly from then on by cloning its reference clip (make_voice.py / speak.sh), like the earlier voices.
"""
import glob, json, os, shutil, subprocess, sys, tempfile, wave, datetime
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cast = json.load(open(os.path.join(root, 'voice-casting', 'cast.json')))
DESIGN = 'mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit'; BASE = 'mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit'

def gen(text, instruct, dst):
    tmp = tempfile.mkdtemp()
    subprocess.run([sys.executable, '-m', 'mlx_audio.tts.generate', '--model', DESIGN, '--lang_code', 'english', '--instruct', instruct,
                    '--text', text, '--output_path', tmp, '--file_prefix', 'line'], check=True, cwd=root, capture_output=True)
    wavs = sorted(glob.glob(os.path.join(tmp, '*.wav')))
    if len(wavs) == 1: shutil.move(wavs[0], dst)
    else: subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + sum([['-i', w] for w in wavs], []) + ['-filter_complex', f'concat=n={len(wavs)}:v=0:a=1', dst], check=True)
    shutil.rmtree(tmp, ignore_errors=True)

if len(sys.argv) > 1 and sys.argv[1] == 'pick':
    cid, k = sys.argv[2], int(sys.argv[3]); ch = next(c for c in cast['characters'] if c['id'] == cid)
    src = os.path.join(root, 'voice-casting', cid, f'option-{k}.wav'); vdir = os.path.join(root, 'selected-voices', cid); os.makedirs(vdir, exist_ok=True)
    old = os.path.join(vdir, 'voice.json')   # never lose a voice that did not come from casting: keep it as <id>-backup-<date>
    if os.path.exists(old) and 'character' not in json.load(open(old)):
        bk = vdir + '-backup-' + datetime.date.today().isoformat(); shutil.copytree(vdir, bk, dirs_exist_ok=True); print('kept the old voice as', bk)
    shutil.copy(src, os.path.join(vdir, 'reference.wav'))
    with wave.open(src) as w: secs = w.getnframes() / w.getframerate(); sr = w.getframerate()
    json.dump({ 'name': cid, 'character': ch['name'], 'selected': datetime.date.today().isoformat(), 'engine': 'Qwen3-TTS via mlx-audio (local)', 'language': 'english',
                'design': { 'model': DESIGN, 'instruct': ch['options'][k - 1], 'note': 'Designing again gives a SIMILAR voice; clone reference.wav for the exact one.' },
                'reproduce': { 'model': BASE, 'ref_audio': 'reference.wav', 'ref_text': ch['line'], 'speed': 1.0 },
                'reference': { 'file': 'reference.wav', 'seconds': round(secs, 1), 'sample_rate': sr } }, open(os.path.join(vdir, 'voice.json'), 'w'), indent=2)
    print('saved', vdir); sys.exit()

only = [a for a in sys.argv[1:] if not a.startswith('--')]; force = '--force' in sys.argv
for ch in cast['characters']:
    if only and ch['id'] not in only: continue
    d = os.path.join(root, 'voice-casting', ch['id']); os.makedirs(d, exist_ok=True)
    for k, ins in enumerate(ch['options'], 1):
        dst = os.path.join(d, f'option-{k}.wav')
        if os.path.exists(dst) and not force: print('keep', dst); continue
        gen(ch['line'], ins, dst); print('made', dst, flush=True)
