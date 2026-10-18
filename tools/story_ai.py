#!/usr/bin/env python3
"""Write a story draft from a prompt with a local open-source model (mlx-lm on Apple Silicon). No internet after the
first model download; nothing leaves this Mac.

    echo '{"prompt": "A girl learns to share her crayons", "scenes": 6}' | .venv/bin/python tools/story_ai.py

Input (JSON on stdin): prompt, scenes (count), world ('toon'|'people'), presets [{id,label,role}], places, props (labels),
model, hero (optional preset id), tone, redoScene (1-based) + draft (to rewrite one scene), notes.
Output: progress lines ("STATUS …", "PROGRESS 0.4") and one final line "RESULT {json}" with {"draft": …} or {"scene": …}.
The draft is plain: title, cast [{id, preset, label}], scenes [{title, place, narration, characters, objects, mood}].
tools/server.mjs then stages it into a full story.json with studio/js/stage.js (positions, camera, props, timing).
"""
import json, re, sys

req = json.load(sys.stdin)
def say(*a): print(*a, flush=True)

MODEL = req.get('model') or 'mlx-community/Qwen2.5-7B-Instruct-4bit'
world = req.get('world', 'toon')
presets = req.get('presets') or []
places = req.get('places') or ['home', 'shop', 'ground', 'classroom']
props = req.get('props') or []
n = max(2, min(16, int(req.get('scenes') or 6)))

say('STATUS Loading the story model…'); say('PROGRESS 0.05')
from mlx_lm import load, generate
try:
    from mlx_lm.sample_utils import make_sampler
except Exception:
    make_sampler = None
model, tok = load(MODEL)
say('STATUS Writing…'); say('PROGRESS 0.25')

cast_list = '\n'.join(f"- {p['id']}: {p['label']}" + (f" ({p['role']})" if p.get('role') else '') for p in presets)
rules = f"""You write short, warm, true-to-life stories for Zungga, a kids' brand (ages 7-14). Videos are vertical, 30-90 seconds,
narrated in FIRST PERSON by the main character ("I"). Simple words, short sentences, one clear lesson, no preaching.
Each scene is ONE narration line of 1-3 sentences (12-45 words) that a voice actor reads.
Places: every scene's "place" must be exactly one of: {', '.join(places)} (ground = outdoors / park / school ground).
Characters you can use (use these ids exactly):
{cast_list}
{"The main character is always 'hero' (the box kid). 'helper_cat' helps with physical things, 'idea_planet' helps with ideas. Everyone else is folk." if world == 'toon' else "These are the Zungga Explorers, five 10-11 year old friends who solve everyday mysteries together: kai (the curious leader, 'Let's figure it out!'), rio (the energetic spark, 'Let's gooo!'), tara (the logical observer, 'Wait... this clue makes sense!'), mira (the creative imaginer, 'What if we tried it another way?'), jax (the tough, loyal protector, 'Nobody messes with my team!'). The narrator is one of them (usually kai)." if world in ('explorers', 'humans') else "Pick a hero from the kids. Girls may only use: mira, tara, mom, older_sister."}
Objects the studio already has (prefer them, mention them by name in the narration): {', '.join(props[:60])}.
The narrator is the main character. In the narration call other characters by role ("my friend", "Mom", "the shopkeeper"), never by their id.
Every scene's "characters" list includes the main character unless they are truly absent.
Rules: no school uniforms; money in Indian rupees, said in words ("thirty rupees"); sad moments can have rain;
the last scene ends with a question to the viewer. Never use real brand names or real people."""

def chat(user, max_tokens=1800, temp=0.75):
    msgs = [{'role': 'system', 'content': rules}, {'role': 'user', 'content': user}]
    prompt = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
    kw = {'max_tokens': max_tokens, 'verbose': False}
    if make_sampler: kw['sampler'] = make_sampler(temp=temp, top_p=0.92)
    return generate(model, tok, prompt=prompt, **kw)

def first_json(text):
    text = re.sub(r'```(?:json)?', '', text)
    start = text.find('{')
    while start >= 0:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == '{': depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    try: return json.loads(text[start:i + 1])
                    except Exception: break
        start = text.find('{', start + 1)
    raise ValueError('The model did not return JSON')

ids = {p['id'] for p in presets}
def clean_scene(s, i):
    chars = [c for c in (s.get('characters') or []) if c in ids]
    place = s.get('place') if s.get('place') in places else (s.get('place') or 'home')
    narration = ' '.join(str(s.get('narration') or '').split())
    narration = re.sub(r'(?:₹|Rs\.?\s?|INR\s?)(\d+)', lambda m: f"{m.group(1)} rupees", narration)   # the voice reads "15 rupees", not "₹15"
    return {'title': str(s.get('title') or f'Scene {i + 1}')[:60], 'place': place, 'narration': narration,
            'characters': chars, 'objects': [str(o)[:40] for o in (s.get('objects') or [])][:6], 'mood': s.get('mood') if s.get('mood') in ('happy', 'sad', 'worried', 'soft', 'idea', 'surprised') else None}

SCENE_SHAPE = '{"title": "...", "place": "<one place>", "narration": "...", "characters": ["<ids>"], "objects": ["<things seen>"], "mood": "happy|sad|worried|idea|surprised|soft"}'

if req.get('redoScene'):
    d, k = req['draft'], int(req['redoScene']) - 1
    ctx = '\n'.join(f"{i + 1}. [{s.get('place')}] {s.get('narration')}" for i, s in enumerate(d['scenes']))
    out = chat(f"""Story "{d.get('title')}". Scenes so far:
{ctx}

Rewrite scene {k + 1} only, so it fits between its neighbours{(' — ' + req['notes']) if req.get('notes') else ''}. Reply with JSON only:
{SCENE_SHAPE}""", max_tokens=500, temp=0.9)
    sc = clean_scene(first_json(out), k)
    for c in sc['characters'] or []: pass
    say('PROGRESS 1'); say('RESULT ' + json.dumps({'scene': sc}))
    sys.exit(0)

hero_hint = f"The main character is '{req['hero']}'. " if req.get('hero') else ''
tone = f"Tone: {req['tone']}. " if req.get('tone') else ''
user = f"""Idea: {req.get('prompt', '').strip()}
{hero_hint}{tone}Write exactly {n} scenes. Reply with JSON only, in this shape:
{{"title": "...", "hero": "<character id>", "cast": ["<character ids used>"], "scenes": [{SCENE_SHAPE}, ...]}}"""
draft = None
for attempt in range(3):
    try:
        raw = first_json(chat(user, temp=0.75 + attempt * 0.1))
        if raw.get('scenes'): draft = raw; break
    except Exception as e:
        say(f'STATUS Retrying ({e})…')
    say(f'PROGRESS {0.25 + 0.2 * (attempt + 1)}')
if not draft: sys.exit('The story model could not write a usable story. Try again or change the idea.')

scenes = [clean_scene(s, i) for i, s in enumerate(draft['scenes'][:n])]
used = list(dict.fromkeys([draft.get('hero')] + list(draft.get('cast') or []) + [c for s in scenes for c in s['characters']]))
used = [c for c in used if c in ids] or ([('hero' if 'hero' in ids else presets[0]['id'])] if presets else [])
hero = draft.get('hero') if draft.get('hero') in ids else used[0]
if world == 'toon' and 'hero' in ids: hero = 'hero'   # the box kid is always the main character in the cartoon world
if world in ('explorers', 'humans') and hero not in ids and 'kai' in ids: hero = 'kai'
if req.get('hero') in ids: hero = req['hero']
if hero not in used: used.insert(0, hero)
labels = {p['id']: p['label'] for p in presets}
# cast entries: id → preset (same id for presets; the studio lets the user rename them later)
cast = [{'id': c, 'preset': c, 'label': labels.get(c, c)} for c in used]
for s in scenes:
    if hero not in s['characters']: s['characters'].insert(0, hero)
out = {'title': str(draft.get('title') or 'Untitled story')[:80], 'world': world, 'hero': hero, 'cast': cast, 'scenes': scenes, 'prompt': req.get('prompt', '')}
say('PROGRESS 1'); say('RESULT ' + json.dumps({'draft': out}))
