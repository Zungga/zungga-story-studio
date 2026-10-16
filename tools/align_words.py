#!/usr/bin/env python3
"""Find when every narration word is spoken in each voice clip (word timestamps).

    python3 tools/align_words.py stories/pocket-money

Writes stories/<name>/voice/words.json: { "scene-02.wav": [[word, start, end], ...] } with one entry per
narration word (in story.json order). The story engine uses it to time camera shots, sounds, props and
subtitles to exact words ("word": "chips"). make_voice.py runs this automatically after making clips.
Uses Whisper (mlx-community/whisper-base.en-mlx) locally; needs mlx-audio + transformers (same venv).
"""
import json, os, re, sys, difflib, warnings
warnings.filterwarnings('ignore')

NUM = {'100': 'hundred', '150': 'hundred fifty', '30': 'thirty', '50': 'fifty', '10': 'ten', '5': 'five', '3': 'three', 'one hundred': 'hundred'}
def norm(w):
    w = w.lower().strip(); w = re.sub(r"[^a-z0-9']", '', w)
    return w

def main():
    story_dir = os.path.abspath(sys.argv[1])
    story = json.load(open(os.path.join(story_dir, 'story.json')))
    vdir = sys.argv[sys.argv.index('--dir') + 1] if '--dir' in sys.argv else 'voice'
    from transformers import WhisperProcessor
    from mlx_audio.stt.utils import load_model
    model = load_model('mlx-community/whisper-base.en-mlx')
    if getattr(model, '_processor', None) is None: model._processor = WhisperProcessor.from_pretrained('openai/whisper-base.en')
    out = {}
    for sc in story['scenes']:
        name = f"scene-{sc['id']:02d}.wav"; wav = os.path.join(story_dir, vdir, name)
        if not os.path.exists(wav): continue
        r = model.generate(wav, word_timestamps=True)
        heard = []
        for s in r.segments:
            for w in s.get('words', []):
                t = w['word'].strip()
                for part in NUM.get(norm(t), t).split():   # "100" is spoken as "hundred"
                    heard.append((norm(part), float(w['start']), float(w['end'])))
        script = [w for w in re.findall(r"[A-Za-z0-9']+", sc['narration'])]
        a, b = [norm(w) for w in script], [h[0] for h in heard]
        times = [None] * len(script)
        for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
            for k in range(blk.size): times[blk.a + k] = (heard[blk.b + k][1], heard[blk.b + k][2])
        # words Whisper missed: spread them between their known neighbours
        dur = heard[-1][2] if heard else 1.0
        for i in range(len(times)):
            if times[i] is None:
                j0 = i - 1
                while j0 >= 0 and times[j0] is None: j0 -= 1
                j1 = i + 1
                while j1 < len(times) and times[j1] is None: j1 += 1
                t0 = times[j0][1] if j0 >= 0 else 0.0; t1 = times[j1][0] if j1 < len(times) else dur
                k = (i - j0) / (j1 - j0); st = t0 + (t1 - t0) * k; times[i] = (st, st + (t1 - t0) / (j1 - j0))
        out[name] = [[w, round(t[0], 2), round(t[1], 2)] for w, t in zip(script, times)]
        matched = sum(1 for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks() for _ in range(blk.size))
        print(f'{name}: {matched}/{len(script)} words matched')
    json.dump(out, open(os.path.join(story_dir, vdir, 'words.json'), 'w'), indent=1)

if __name__ == '__main__': main()
