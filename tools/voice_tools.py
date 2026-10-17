#!/usr/bin/env python3
"""Small voice jobs for the studio's Voice manager (same venv as make_voice.py).

    .venv/bin/python tools/voice_tools.py test boy-calm "Any line to hear"   → selected-voices/boy-calm/out/test.wav
    .venv/bin/python tools/voice_tools.py transcribe my-voice                → fills ref_text in its voice.json
Prints "RESULT {json}" at the end.
"""
import glob, json, os, shutil, subprocess, sys, tempfile, warnings
warnings.filterwarnings('ignore')
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cmd, voice = sys.argv[1], sys.argv[2]
vdir = os.path.join(root, 'selected-voices', voice); cfg_path = os.path.join(vdir, 'voice.json'); cfg = json.load(open(cfg_path))

if cmd == 'test':
    text = sys.argv[3]; tmp = tempfile.mkdtemp(); os.makedirs(os.path.join(vdir, 'out'), exist_ok=True)
    print('making a test line…', flush=True)
    subprocess.run([sys.executable, '-m', 'mlx_audio.tts.generate', '--model', cfg['reproduce']['model'], '--lang_code', 'english',
                    '--ref_audio', os.path.join(vdir, 'reference.wav'), '--ref_text', cfg['reproduce']['ref_text'], '--temperature', '0.6',
                    '--text', text, '--output_path', tmp, '--file_prefix', 'line'], check=True, cwd=root)
    wavs = sorted(glob.glob(os.path.join(tmp, '*.wav'))); dst = os.path.join(vdir, 'out', 'test.wav')
    if len(wavs) == 1: shutil.move(wavs[0], dst)
    else: subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + sum([['-i', w] for w in wavs], []) + ['-filter_complex', f'concat=n={len(wavs)}:v=0:a=1', dst], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print('RESULT ' + json.dumps({'file': f'/selected-voices/{voice}/out/test.wav'}))

elif cmd == 'transcribe':
    from transformers import WhisperProcessor
    from mlx_audio.stt.utils import load_model
    print('listening to the recording…', flush=True)
    model = load_model('mlx-community/whisper-base.en-mlx')
    if getattr(model, '_processor', None) is None: model._processor = WhisperProcessor.from_pretrained('openai/whisper-base.en')
    r = model.generate(os.path.join(vdir, 'reference.wav'))
    text = ' '.join(r.text.split())
    cfg['reproduce']['ref_text'] = text; json.dump(cfg, open(cfg_path, 'w'), indent=2)
    print('RESULT ' + json.dumps({'id': voice, 'text': text}))
