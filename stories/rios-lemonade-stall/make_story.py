#!/usr/bin/env python3
"""Builds story.json for "Rio's Lemonade Stall" (Zungga pilot, episode 1) from SCRIPT.md's lines + the shot plan below.
    python3 stories/rios-lemonade-stall/make_story.py
Place: 'colony' (assets/lemonade.js colony_set). Local frame: Rio's stall at the origin facing +z (camera side); road along x
at z −3.4; the park gate across the road at (−0.6, 0, −7.5); the "park spot" for the stall is (−0.6, 0, −6.1)."""
import json, os, re
here = os.path.dirname(os.path.abspath(__file__))
LINES = {}
for l in open(os.path.join(here, 'SCRIPT.md')):
    m = re.match(r'\| (\d+) \| ([^|]+) \| ([^|]+) \|', l)
    if m: LINES[int(m.group(1))] = m.group(3).strip()

PI = 3.14159
STALL_A, STALL_B = [0, 0, 0], [-0.6, 0, -6.1]
def stall(at=STALL_A): return {'id': 'rio_stall', 'at': at}
def cups(n, base=STALL_A, show=None, word=None):
    out = []
    for i in range(n):
        x = -0.42 + (i % 6) * 0.15; z = 0.06 + (i // 6) * 0.13
        p = {'id': 'lemonade_cup', 'at': [base[0] + x, 0.78, base[2] + z]}
        if show is not None: p['show'] = show
        if word: p['showWord'] = word
        out.append(p)
    return out
def walker(start, end, mid=None, a0=0.0, a1=1.0):
    pts = [{'at': a0, 'pos': start}] + ([{'at': (a0 + a1) / 2, 'pos': mid}] if mid else []) + [{'at': a1, 'pos': end}]
    return {'at': start, 'anim': 'walk', 'expr': 'smile', 'path': pts}
# people strolling across to the park (they cross at the zebra crossing x≈−1.6 and go in at the gate)
def crowd(stagger=0.0, n=4):
    who = ['appa', 'amma', 'arun', 'priya'][:n]; out = {}
    for k, w in enumerate(who):
        x0 = 9 + k * 1.6; a0 = min(0.5, stagger + k * 0.08)
        out[w] = walker([x0, 0, 1.0 + (k % 2) * 0.5], [-0.9 + k * 0.4, 0, -8.6], [-1.6 + k * 0.3, 0, -2.0], a0, 1.0)
    return out
def fixed(pos, look, toPos=None, toLook=None, until=None, **k):
    c = {'move': 'fixed', 'pos': pos, 'look': look}
    if toPos: c['toPos'] = toPos
    if toLook: c['toLook'] = toLook
    if until is not None: c['until'] = until
    c.update(k); return c

S = []
def scene(i, place='colony', voice='narrator', talking=None, **k):
    sc = {'id': i, 'title': f'Scene {i}', 'place': place, 'narration': LINES[i], 'voice': voice}
    if voice == 'narrator': sc['narrator'] = True
    if talking: sc['talking'] = talking
    sc.update(k); S.append(sc); return sc

HOT = {'sunAngle': 35, 'sunHeight': 0.85, 'sunColor': '#fff1d0', 'ambient': 0.62}
RIO = lambda **k: {'at': [0, 0, -0.55], 'face': 0, **k}
TARA = lambda **k: {'at': [-1.1, 0, 0.15], 'face': 0.55, 'hold': {'L': 'notebook'}, **k}
MIRA = lambda **k: {'at': [1.1, 0, 0.2], 'face': -0.5, **k}

# 1 — establishing: the hot street, the park across the road, Rio pops up with lemons
scene(1, light=HOT, actors={'rio': RIO(anim='idle', expr='happy', hold={'R': 'lemon', 'L': 'lemon'}), **crowd(0.1, 2)},
      props=[stall()],
      beats=[{'word': 'idea', 'actor': 'rio', 'anim': 'jump', 'expr': 'excited'}],
      camera=[fixed([7, 7.5, 15], [0, 1.5, -5], [1.6, 1.9, 5.2], [0, 1.0, -0.4], speed=1, smooth=1)],
      sfx=[{'file': 'sparkle.wav', 'word': 'idea', 'vol': 0.5}], fx={'transition': 'white'})
# 2 — Rio's big idea
scene(2, voice='rio', talking='rio', light=HOT, actors={'rio': RIO(anim='cheer', expr='excited', hold={'R': 'lemon'}), 'tara': TARA(anim='idle', expr='smile'), 'mira': MIRA(anim='wave', expr='big_smile')},
      props=[stall()], camera=[{'move': 'push_in', 'focus': ['rio'], 'from': 'mid', 'to': 'close', 'angle': 8, 'elevation': 10}],
      caption={'text': "🍋 RIO'S COOL LEMONADE 🍋", 'atWord': 'coolest', 'big': True})
# 3 — Tara asks what to buy
scene(3, voice='tara', talking='tara', light=HOT, actors={'rio': RIO(anim='idle', expr='smile'), 'tara': TARA(anim='think', expr='thinking'), 'mira': MIRA(anim='idle', expr='curious')},
      props=[stall()], camera=[{'move': 'orbit', 'focus': ['tara', 'rio'], 'distance': 'mid', 'angle': -20, 'elevation': 12}])
# 4 — shopping: the price cards
scene(4, voice='narrator', light=HOT,
      actors={'rio': {'at': [4.1, 0, 0.3], 'face': 1.25, 'anim': 'point', 'expr': 'excited'}, 'tara': {'at': [3.7, 0, -0.6], 'face': 1.45, 'anim': 'idle', 'expr': 'thinking'}, 'mira': {'at': [3.5, 0, 1.0], 'face': 1.05, 'anim': 'idle', 'expr': 'smile'}},
      props=[{'id': 'stall_fresh_fruits', 'at': [7.6, 0, -0.1], 'rot': [0, -1.5708, 0], 'scale': 0.75}],
      beats=[{'word': 'Lemons', 'actor': 'rio', 'anim': 'give', 'hold': {'R': 'lemon_basket'}}, {'word': 'Sugar', 'actor': 'tara', 'anim': 'give', 'hold': {'R': 'sugar_pack'}}, {'word': 'cups', 'actor': 'mira', 'anim': 'cheer', 'hold': {'R': 'paper_cups'}}],
      camera=[fixed([6.3, 1.6, 1.95], [3.8, 0.7, 0.1], [6.1, 1.5, 1.85], [3.8, 0.72, 0.1])],
      cards=[{'style': 'row', 'word': 'Lemons', 'y': 1010, 'title': '🛒 SHOPPING LIST', 'items': [
          {'icon': '🍋', 'value': '₹30', 'label': 'Lemons', 'word': 'thirty'}, {'icon': '🍚', 'value': '₹20', 'label': 'Sugar', 'word': 'twenty'}, {'icon': '🥤', 'value': '₹20', 'label': 'Paper cups', 'word': 'twenty#2'}]}],
      sfx=[{'file': 'coin-register.mp3', 'word': 'thirty', 'vol': 0.25}, {'file': 'coin-register.mp3', 'word': 'twenty', 'vol': 0.25}, {'file': 'coin-register.mp3', 'word': 'twenty#2', 'vol': 0.25}])
# 5 — Tara adds it up
scene(5, voice='tara', talking='tara', light=HOT, actors={'tara': {'at': [0, 0, 0.9], 'face': 0, 'anim': 'count', 'expr': 'focused', 'hold': {'L': 'notebook'}}, 'rio': {'at': [0.9, 0, 0.6], 'face': -0.6, 'anim': 'idle', 'expr': 'curious'}},
      props=[stall()], camera=[{'move': 'push_in', 'focus': ['tara'], 'from': 'mid', 'to': 'close', 'angle': 12, 'elevation': 8}],
      cards=[{'style': 'equation', 'word': 'Thirty', 'sub': 'Money SPENT', 'subColor': '#dc2626', 'items': [
          {'text': '30', 'word': 'Thirty'}, {'text': '+', 'word': 'plus'}, {'text': '20', 'word': 'twenty'}, {'text': '+', 'word': 'plus#2'}, {'text': '20', 'word': 'twenty#2'}, {'text': '=', 'word': 'spent'}, {'text': '₹70', 'word': 'seventy', 'answer': True}]}])
# 6 — twelve cups, ten rupees each
scene(6, voice='rio', talking='rio', light=HOT, actors={'rio': RIO(anim='thumbs_up', expr='big_smile'), 'tara': TARA(anim='idle', expr='smile'), 'mira': MIRA(anim='cheer', expr='excited')},
      props=[stall()] + cups(12, word='twelve'), camera=[fixed([0.9, 1.5, 2.4], [0, 0.95, 0.05], [0.5, 1.35, 1.9], [0, 0.9, 0.0])],
      cards=[{'style': 'row', 'word': 'twelve', 'items': [{'icon': '🥤', 'value': '12', 'label': 'cups', 'word': 'twelve'}, {'icon': '💰', 'value': '₹10', 'label': 'each cup', 'word': 'Ten'}]}],
      beats=[{'word': 'rich', 'actor': 'rio', 'anim': 'jump', 'expr': 'excited'}])
# 7 — the first customer: Thatha
scene(7, voice='uncle', talking='uncle', light=HOT,
      actors={'uncle': {'at': [3.4, 0, 1.4], 'anim': 'walk', 'expr': 'big_smile', 'hold': {'R': 'note_10'}, 'path': [{'at': 0, 'pos': [3.4, 0, 1.4]}, {'at': 0.32, 'pos': [0.35, 0, 0.95]}]}, 'rio': RIO(anim='wave', expr='big_smile'), 'tara': TARA(anim='idle', expr='smile')},
      props=[stall()] + cups(12), beats=[{'word': 'Wonderful', 'actor': 'uncle', 'anim': 'talk', 'face': PI}, {'word': 'cup', 'actor': 'uncle', 'anim': 'give'}],
      camera=[fixed([-2.0, 1.55, 2.4], [0.4, 1.05, 0.6], [-1.5, 1.45, 2.0], [0.35, 1.0, 0.6])],
      sfx=[{'file': 'coin-register.mp3', 'word': 'man', 'offset': 0.2, 'vol': 0.4}])
# 8 — five people buy: ₹10 → ₹50
scene(8, voice='narrator', light=HOT, actors={'rio': RIO(anim='give', expr='big_smile'), 'mira': MIRA(anim='cheer', expr='happy'),
      'arun': {'at': [0.2, 0, 1.05], 'face': PI, 'anim': 'idle', 'expr': 'smile'}, 'priya': {'at': [-0.5, 0, 1.15], 'face': PI + 0.2, 'anim': 'wave', 'expr': 'big_smile'}, 'amma': {'at': [0.9, 0, 1.3], 'face': PI - 0.3, 'anim': 'idle', 'expr': 'smile'}},
      props=[stall()] + cups(7), camera=[{'move': 'pull_back', 'focus': ['rio', 'arun', 'amma'], 'from': 'close', 'to': 'mid', 'angle': 25, 'elevation': 14}],
      counter={'from': 10, 'to': 50, 'label': 'Money GOT 💰', 'startWord': 'One', 'endWord': 'Fifty'},
      sfx=[{'file': 'coin-register.mp3', 'word': 'one', 'vol': 0.3}, {'file': 'coin-register.mp3', 'word': 'five', 'vol': 0.3}, {'file': 'coin-register.mp3', 'word': 'Fifty', 'vol': 0.35}])
# 9 — nobody came, the ice melts
scene(9, voice='narrator', light={'sunAngle': 10, 'sunHeight': 1.0, 'sunColor': '#ffd9a0', 'ambient': 0.7},
      actors={'rio': RIO(anim='hands_on_hips', expr='worried'), 'mira': MIRA(anim='idle', expr='sad'), **crowd(0.15, 4)},
      props=[stall()] + cups(7), beats=[{'word': 'warm', 'actor': 'rio', 'anim': 'idle', 'expr': 'sad'}],
      camera=[fixed([0, 3.2, 8.5], [0, 0.9, -1.5], [0, 2.0, 5.0], [0, 1.0, -0.5])], fx={'shake': {'amount': 0.12}},
      caption={'text': '☀️ So hot… and nobody comes!', 'atWord': 'nobody'})
# 10 — did we lose money?!
scene(10, voice='rio', talking='rio', light=HOT, actors={'rio': RIO(anim='think', expr='shocked'), 'tara': TARA(anim='idle', expr='worried'), 'mira': MIRA(anim='idle', expr='worried')},
      props=[stall()] + cups(7), camera=[{'move': 'push_in', 'focus': ['rio'], 'from': 'mid', 'to': 'close', 'zoom': 0.85, 'angle': 0, 'elevation': 6}],
      cards=[{'style': 'row', 'word': 'spent', 'items': [{'icon': '🛒', 'value': '₹70', 'label': 'SPENT', 'color': '#dc2626', 'tint': '#fee2e2', 'word': 'seventy'}, {'icon': '💰', 'value': '₹50', 'label': 'GOT', 'color': '#16a34a', 'tint': '#dcfce7', 'word': 'fifty'}]}],
      beats=[{'word': 'lose', 'actor': 'rio', 'anim': 'idle', 'expr': 'shocked'}], fx={'shake': {'amount': 0.4, 'from': 0.75, 'to': 0.9}})
# 11 — the loss
scene(11, voice='tara', talking='tara', light=HOT, actors={'tara': {'at': [0, 0, 0.9], 'face': 0, 'anim': 'count', 'expr': 'sad', 'hold': {'L': 'notebook'}}, 'rio': {'at': [0.9, 0, 0.6], 'face': -0.6, 'anim': 'idle', 'expr': 'sad'}},
      props=[stall()], camera=[{'move': 'push_in', 'focus': ['tara'], 'from': 'mid', 'to': 'close', 'angle': -10, 'elevation': 8}],
      cards=[{'style': 'equation', 'word': 'Seventy', 'sub': 'LOSS 😟', 'subColor': '#dc2626', 'items': [{'text': '70', 'word': 'Seventy'}, {'text': '−', 'word': 'minus'}, {'text': '50', 'word': 'fifty'}, {'text': '=', 'word': 'is'}, {'text': '₹20', 'word': 'twenty', 'answer': True, 'color': '#dc2626'}]}])
# 12 — PAUSE 1 · LOOK: where is everybody going?
scene(12, voice='rio', talking='rio', light=HOT, actors={'rio': {'at': [0, 0, 0.7], 'face': 0, 'anim': 'point', 'expr': 'excited'}, **crowd(0.0, 4)},
      props=[stall()], pause={'kind': 'look', 'seconds': 6, 'prompt': 'Where is everybody going?', 'hint': '👀 Look at the people!'},
      camera=[{'move': 'push_in', 'focus': ['rio'], 'from': 'mid', 'to': 'close', 'angle': 0, 'elevation': 5, 'untilWord': 'loud', 'untilOffset': 0.4},
              fixed([2.2, 2.3, 4.5], [-0.8, 1.2, -6.5], [1.0, 2.0, 2.5], [-0.7, 1.3, -7.5])])
# 13 — yes, the park!
scene(13, voice='narrator', light=HOT, actors={**{w: walker([-2.4 + k * 0.5, 0, -2.4 + (k % 2) * 0.6], [-0.9 + k * 0.4, 0, -9.0]) for k, w in enumerate(['appa', 'amma', 'arun', 'priya'])}, 'rio': {'at': [0, 0, 0.7], 'face': PI, 'anim': 'look_far', 'expr': 'surprised'}},
      props=[stall()], camera=[fixed([1.3, 1.9, 2.6], [-0.7, 1.3, -6.5], [0.9, 1.7, 1.9], [-0.7, 1.4, -7.5])],
      cards=[{'style': 'lesson', 'word': 'park', 'text': '🎈 Everyone is going to the PARK! 🎈'}], sfx=[{'file': 'ding.wav', 'word': 'Yes', 'vol': 0.4}])
# 14 — PAUSE 2 · CHOOSE: what should Rio do?
scene(14, voice='rio', talking='rio', light=HOT, actors={'rio': {'at': [0, 0, 0.7], 'face': 0, 'anim': 'think', 'expr': 'thinking'}},
      props=[stall()], pause={'kind': 'choose', 'seconds': 8, 'prompt': 'What should Rio do?', 'cards': [
          {'icon': '📢', 'text': 'Shout louder right here', 'color': '#f8a51b'}, {'icon': '🌳', 'text': 'Take the stall to the park', 'color': '#16a34a'}, {'icon': '🏠', 'text': 'Close the shop, go home', 'color': '#7c5cf2'}]},
      beats=[{'word': 'One', 'actor': 'rio', 'anim': 'count'}, {'word': 'Show', 'actor': 'rio', 'anim': 'wave', 'expr': 'big_smile'}],
      camera=[{'move': 'push_in', 'focus': ['rio'], 'from': 'mid', 'to': 'close', 'angle': 0, 'elevation': 5}])
# 15 — Mira: two! and the giant lemon sign
scene(15, voice='mira', talking='mira', light=HOT, actors={'mira': {'at': [0.3, 0, 0.8], 'face': -0.2, 'anim': 'jump', 'expr': 'excited'}, 'rio': {'at': [-0.6, 0, 0.6], 'face': 0.4, 'anim': 'cheer', 'expr': 'big_smile'}},
      props=[stall(), {'id': 'big_lemon_sign', 'at': [1.3, 0, 0.9], 'showWord': 'paint', 'rot': [0, -0.35, 0]}],
      beats=[{'word': 'paint', 'actor': 'mira', 'anim': 'point', 'expr': 'big_smile'}],
      camera=[{'move': 'orbit', 'focus': ['mira', 'rio'], 'distance': 'mid', 'angle': 15, 'elevation': 10}],
      cards=[{'style': 'badges', 'word': 'Two', 'items': [{'icon': '✌️', 'text': 'Answer: 2!', 'color': '#22c55e'}]}], fx={'particles': {'type': 'sparkles', 'amount': 0.4}})
# 16 — moving to the park gate
scene(16, voice='narrator', light=HOT, actors={'rio': {'at': [-0.6, 0, -6.65], 'face': 0, 'anim': 'wave', 'expr': 'big_smile'}, 'mira': {'at': [0.6, 0, -5.4], 'face': -0.4, 'anim': 'cheer', 'expr': 'happy'}, 'tara': {'at': [-1.8, 0, -5.5], 'face': 0.5, 'anim': 'thumbs_up', 'expr': 'smile', 'hold': {'L': 'notebook'}}},
      props=[stall(STALL_B), {'id': 'big_lemon_sign', 'at': [0.9, 0, -5.6], 'rot': [0, -0.3, 0]}, {'id': 'ice_bucket', 'at': [-0.48, 0.78, -6.0], 'showWord': 'ice'}] + cups(7, STALL_B),
      camera=[fixed([3.2, 4.2, 1.5], [-0.6, 0.9, -6.3], [1.4, 1.9, -2.0], [-0.6, 1.0, -6.3])],
      sfx=[{'file': 'whoosh.wav', 'word': 'moved', 'vol': 0.5}], fx={'transition': 'flash'})
# 17 — Thatha brings his grandchildren
scene(17, voice='uncle', talking='uncle', light=HOT, actors={'uncle': {'at': [-0.4, 0, -4.9], 'face': PI, 'anim': 'talk', 'expr': 'big_smile', 'hold': {'R': 'note_20'}}, 'arun': {'at': [0.2, 0, -4.7], 'face': PI + 0.3, 'anim': 'jump', 'expr': 'excited'}, 'priya': {'at': [-1.1, 0, -4.8], 'face': PI - 0.3, 'anim': 'wave', 'expr': 'big_smile'},
      'rio': {'at': [-0.6, 0, -6.65], 'face': 0, 'anim': 'give', 'expr': 'big_smile'}, 'amma': {'at': [1.4, 0, -5.0], 'face': -2.6, 'anim': 'idle', 'expr': 'smile'}, 'appa': {'at': [-2.2, 0, -5.2], 'face': 2.4, 'anim': 'idle', 'expr': 'smile'}},
      props=[stall(STALL_B), {'id': 'big_lemon_sign', 'at': [0.9, 0, -5.6], 'rot': [0, -0.3, 0]}] + cups(5, STALL_B),
      camera=[fixed([2.6, 3.1, -1.0], [-0.6, 0.85, -5.7], [2.0, 2.6, -1.9], [-0.6, 0.9, -5.8])], sfx=[{'file': 'coin-register.mp3', 'word': 'please', 'vol': 0.4}])
# 18 — PAUSE 3 · COUNT: seven cups × ₹10
scene(18, voice='rio', talking='rio', light=HOT, actors={'rio': {'at': [-0.6, 0, -5.2], 'face': 0, 'anim': 'point', 'expr': 'excited'}},
      props=[stall(STALL_B), {'id': 'big_lemon_sign', 'at': [0.9, 0, -5.6], 'rot': [0, -0.3, 0]}] + cups(7, STALL_B),
      pause={'kind': 'count', 'seconds': 10, 'prompt': '7 cups × ₹10 each = ?', 'count': {'n': 7, 'icon': '🥤', 'tag': '₹10', 'question': 'How much money will Rio get?'}},
      beats=[{'word': 'seven', 'actor': 'rio', 'anim': 'count'}, {'word': 'Count', 'actor': 'rio', 'anim': 'cheer', 'expr': 'big_smile'}],
      camera=[{'move': 'push_in', 'focus': ['rio'], 'from': 'mid', 'to': 'close', 'angle': 5, 'elevation': 6}])
# 19 — Tara counts in tens: ₹70 + ₹50 = ₹120
TENS = ['Ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy']
scene(19, voice='tara', talking='tara', light=HOT, actors={'tara': {'at': [-0.6, 0, -5.2], 'face': 0, 'anim': 'count', 'expr': 'focused', 'hold': {'L': 'notebook'}}, 'rio': {'at': [0.3, 0, -5.5], 'face': -0.5, 'anim': 'idle', 'expr': 'happy'}},
      props=[stall(STALL_B)] + cups(7, STALL_B), camera=[{'move': 'push_in', 'focus': ['tara'], 'from': 'mid', 'to': 'close', 'angle': -8, 'elevation': 8}],
      cards=[{'style': 'row', 'word': 'Ten', 'untilWord': 'Plus', 'h': 230, 'items': [{'icon': '🥤', 'value': str((i + 1) * 10), 'label': '', 'word': w} for i, w in enumerate(TENS[:4])]},
             {'style': 'equation', 'word': 'Plus', 'sub': 'Money GOT', 'subColor': '#16a34a', 'items': [{'text': '₹70', 'word': 'Plus'}, {'text': '+', 'word': 'the'}, {'text': '₹50', 'word': 'fifty#2'}, {'text': '=', 'word': 'makes'}, {'text': '₹120', 'word': 'hundred', 'answer': True, 'color': '#16a34a'}]}],
      counter={'from': 50, 'to': 120, 'label': 'Money GOT 💰', 'startWord': 'Plus', 'endWord': 'twenty#2'},
      sfx=[{'file': 'pop.wav', 'word': w, 'vol': 0.3} for w in TENS])
# 20 — profit!
scene(20, voice='tara', talking='tara', light=HOT, actors={'tara': {'at': [-0.6, 0, -5.2], 'face': 0, 'anim': 'count', 'expr': 'happy', 'hold': {'L': 'notebook'}}, 'rio': {'at': [0.3, 0, -5.5], 'face': -0.5, 'anim': 'cheer', 'expr': 'excited'}, 'mira': {'at': [-1.4, 0, -5.4], 'face': 0.5, 'anim': 'jump', 'expr': 'excited'}},
      props=[stall(STALL_B)], camera=[{'move': 'pull_back', 'focus': ['tara', 'rio', 'mira'], 'from': 'close', 'to': 'mid', 'angle': 0, 'elevation': 8}],
      cards=[{'style': 'equation', 'word': 'One', 'sub': 'PROFIT! 🎉', 'subColor': '#16a34a', 'items': [{'text': '120', 'word': 'One'}, {'text': '−', 'word': 'minus'}, {'text': '70', 'word': 'seventy#2'}, {'text': '=', 'word': 'is'}, {'text': '₹50', 'word': 'fifty', 'answer': True, 'color': '#16a34a'}]},
             {'style': 'lesson', 'word': 'profit', 'y': 640, 'size': 44, 'text': 'PROFIT = Money got − Money spent'}],
      fx={'particles': {'type': 'confetti', 'amount': 0.55, 'from': 0.7}}, sfx=[{'file': 'sparkle.wav', 'word': 'profit', 'vol': 0.6}])
# 21 — badges
scene(21, voice='rio', talking='rio', light=HOT, actors={'rio': {'at': [-0.6, 0, -5.2], 'face': 0, 'anim': 'victory', 'expr': 'big_smile'}, 'tara': {'at': [-1.5, 0, -5.4], 'face': 0.4, 'anim': 'thumbs_up', 'expr': 'happy', 'hold': {'L': 'notebook'}}, 'mira': {'at': [0.3, 0, -5.4], 'face': -0.4, 'anim': 'peace', 'expr': 'big_smile'}},
      props=[stall(STALL_B), {'id': 'big_lemon_sign', 'at': [0.9, 0, -5.6], 'rot': [0, -0.3, 0]}], camera=[{'move': 'push_in', 'focus': ['rio', 'tara', 'mira'], 'from': 'wide', 'to': 'mid', 'angle': 0, 'elevation': 10}],
      cards=[{'style': 'badges', 'word': 'business', 'items': [{'icon': '🧠', 'text': 'Business Brain', 'color': '#a78bfa', 'word': 'business'}, {'icon': '⭐', 'text': 'Maths Star', 'color': '#f8a51b', 'word': 'maths'}]}],
      fx={'particles': {'type': 'confetti', 'amount': 0.6}}, sfx=[{'file': 'sparkle.wav', 'word': 'business', 'vol': 0.6}, {'file': 'sparkle.wav', 'word': 'maths', 'vol': 0.6}])
# 22 — the lesson
scene(22, voice='narrator', light=HOT, actors={'rio': {'at': [-0.6, 0, -6.65], 'face': 0, 'anim': 'give', 'expr': 'big_smile'}, 'priya': {'at': [-0.3, 0, -5.2], 'face': PI, 'anim': 'idle', 'expr': 'happy'}, 'arun': {'at': [0.5, 0, -5.3], 'face': PI - 0.4, 'anim': 'idle', 'expr': 'smile'}},
      props=[stall(STALL_B), {'id': 'big_lemon_sign', 'at': [0.9, 0, -5.6], 'rot': [0, -0.3, 0]}] + cups(3, STALL_B),
      camera=[fixed([4.5, 3.4, 0.5], [-0.6, 1.0, -6.2], [3.0, 2.6, -1.2], [-0.6, 1.0, -6.3])],
      cards=[{'style': 'lesson', 'word': 'Remember', 'text': '1️⃣ Count what you SPEND', 'size': 50}, {'style': 'lesson', 'word': 'sell#2', 'y': 470, 'text': '2️⃣ Sell where your CUSTOMERS are', 'size': 50}])
# 23 — YOUR mission
scene(23, voice='rio', talking='rio', light=HOT, actors={'rio': {'at': [-0.6, 0, -5.0], 'face': 0, 'anim': 'point', 'expr': 'excited'}},
      props=[stall(STALL_B)], extraTime=4.5,
      camera=[{'move': 'push_in', 'focus': ['rio'], 'from': 'mid', 'to': 'close', 'angle': 0, 'elevation': 4}],
      cards=[{'style': 'missions', 'word': 'mission', 'title': '🚀 YOUR MISSION · choose one', 'step': 0.6, 'footer': '✅ A grown-up at home approves', 'items': [
          {'icon': '🍋', 'text': 'Do 10 lemon-squeeze jumps! (jump + squeeze your hands)', 'color': '#f8a51b'},
          {'icon': '🛍️', 'text': 'Help a grown-up put the shopping away. Find 3 price tags!', 'color': '#13b5c6'},
          {'icon': '🎨', 'text': 'Draw your own shop sign with a price on it!', 'color': '#ff4f8b'}]}],
      sfx=[{'file': 'sparkle.wav', 'word': 'mission', 'vol': 0.5}])
# 24 — cliffhanger: the ₹5 stall
scene(24, voice='narrator', light={'sunAngle': 60, 'sunHeight': 0.6, 'sunColor': '#ffd7a8', 'ambient': 0.55},
      actors={'rio': {'at': [-0.6, 0, -6.65], 'face': 0.9, 'anim': 'idle', 'expr': 'shocked'}, 'tara': {'at': [-1.5, 0, -5.6], 'face': 1.2, 'anim': 'idle', 'expr': 'worried', 'hold': {'L': 'notebook'}}, 'mira': {'at': [0.4, 0, -5.4], 'face': 1.6, 'anim': 'idle', 'expr': 'surprised'}},
      props=[stall(STALL_B), {'id': 'rival_stall', 'at': [5.2, 0, -6.0], 'rot': [0, -0.5, 0], 'showWord': 'new'}, {'id': 'zungga_logo', 'endCard': True, 'show': 0.88}],
      camera=[fixed([-3.2, 1.6, -2.2], [5.2, 1.4, -6.0], [-1.0, 1.5, -3.4], [5.2, 1.5, -6.0], untilWord='five', untilOffset=0.3), {'move': 'push_in', 'focus': ['rio'], 'from': 'mid', 'to': 'close', 'zoom': 0.8, 'angle': 40, 'elevation': 6}],
      caption={'text': 'NEXT TIME: ₹10 vs ₹5! 😱', 'atWord': 'What', 'big': True}, fx={'shake': {'amount': 0.35, 'from': 0.55, 'to': 0.65}},
      sfx=[{'file': 'whoosh.wav', 'word': 'new', 'vol': 0.5}, {'file': 'thunder.wav', 'word': 'five', 'vol': 0.18}])

story = {
    'title': "Rio's Lemonade Stall", 'episode': 1, 'world': 'explorers',
    'format': {'width': 1080, 'height': 1920, 'fps': 30},
    'voice': {'engine': 'qwen3-tts-local', 'voice': 'narrator', 'pauseAfter': 0.55},
    'hero': 'rio',
    'cast': {
        'rio': {'explorer': 'rio', 'name': 'Rio', 'color': '#f97316'},
        'tara': {'explorer': 'tara', 'name': 'Tara', 'color': '#0d9488'},
        'mira': {'explorer': 'mira', 'name': 'Mira', 'color': '#ec4899'},
        'uncle': {'explorer': 'thatha', 'name': 'Thatha', 'color': '#7c3aed'},
        'appa': {'explorer': 'appa'}, 'amma': {'explorer': 'amma'}, 'arun': {'explorer': 'arun'}, 'priya': {'explorer': 'priya'},
    },
    'music': {'file': '../music/be-happy-free-music-antarcticbreeze-745ea2.mp3', 'vol': 0.09, 'start': 0, 'fadeIn': 1.5, 'fadeOut': 3,
              'credit': '"Be Happy" by ANtarcticbreeze (CC BY 3.0, Jamendo)'},
    'options': {'subtitles': True, 'endCard': True},
    'note': 'Zungga pilot episode 1 for Class 3–5 (Tamil Nadu + Karnataka state boards). Built by make_story.py from SCRIPT.md.',
    'scenes': S,
}
json.dump(story, open(os.path.join(here, 'story.json'), 'w'), indent=1, ensure_ascii=False)
print(len(S), 'scenes →', os.path.join(here, 'story.json'))
