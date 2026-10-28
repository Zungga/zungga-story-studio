#!/usr/bin/env python3
"""Zungga — school pilot presentation (PowerPoint, Morph transitions).  Output: Zungga-School-Pilot.pptx"""
import copy, os
from lxml import etree
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

HERE = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.join(HERE, 'img')
HEAD, BODY = 'Arial Rounded MT Bold', 'Avenir Next'
PURPLE, CREAM, LEMON, PINK, VIOLET = '2A1458', 'FBF7EE', 'FCC72C', 'FF4F8B', '7C3AED'
INK, SOFT, LIGHT, PALE, WHITE = '2A1458', '4B4466', 'FBF7EE', 'D9CCF5', 'FFFDF8'
TEAL, ORANGE = '0E9F9A', 'F08A00'
rgb = lambda h: RGBColor.from_string(h)

prs = Presentation(); prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

# ---------- helpers ----------
def slide(bg):
    s = prs.slides.add_slide(BLANK); f = s.background.fill; f.solid(); f.fore_color.rgb = rgb(bg); return s
def shape(s, kind, name, x, y, w, h, fill=None, line=None, rot=0):
    sh = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h)); sh.name = name
    if fill: sh.fill.solid(); sh.fill.fore_color.rgb = rgb(fill)
    else: sh.fill.background()
    if line: sh.line.color.rgb = rgb(line); sh.line.width = Pt(1.5)
    else: sh.line.fill.background()
    sh.shadow.inherit = False; sh.rotation = rot
    return sh
def orb(s, name, x, y, d, color): return shape(s, MSO_SHAPE.OVAL, name, x, y, d, d, color)
def text(s, name, x, y, w, h, runs, size=20, color=INK, font=BODY, bold=False, align='l', anchor='t', spacing=1.1, box=None):
    """runs: str, or list of paragraphs; a paragraph is str or list of (text, {color,bold,size,font}) pieces."""
    if box is None: tb = s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h)); tb.name = name
    else: tb = box
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_left = tf.margin_right = Inches(0.05); tf.margin_top = tf.margin_bottom = Inches(0.03)
    tf.vertical_anchor = {'t': MSO_ANCHOR.TOP, 'm': MSO_ANCHOR.MIDDLE, 'b': MSO_ANCHOR.BOTTOM}[anchor]
    paras = [runs] if isinstance(runs, str) else runs
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = {'l': PP_ALIGN.LEFT, 'c': PP_ALIGN.CENTER, 'r': PP_ALIGN.RIGHT}[align]; p.line_spacing = spacing
        for piece in ([(para, {})] if isinstance(para, str) else para):
            t, o = piece if isinstance(piece, tuple) else (piece, {})
            r = p.add_run(); r.text = t; f = r.font
            f.name = o.get('font', font); f.size = Pt(o.get('size', size)); f.bold = o.get('bold', bold); f.color.rgb = rgb(o.get('color', color))
    return tb
def title(s, t, color=INK, y=0.62, size=40, name='!!title', w=10.8):
    return text(s, name, 0.85, y, w, 1.0, t, size=size, color=color, font=HEAD)
def eyebrow(s, t, color=VIOLET, y=0.38):
    return text(s, '!!eyebrow', 0.88, y, 9, 0.4, t.upper(), size=14, color=color, font=HEAD)
def card(s, name, x, y, w, h, fill, paras, size=18, color=INK, align='l', anchor='t', pad=0.25):
    sh = shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, name, x, y, w, h, fill); sh.adjustments[0] = 0.12
    tf = sh.text_frame; tf.margin_left = tf.margin_right = Inches(pad); tf.margin_top = tf.margin_bottom = Inches(pad * 0.8)
    text(s, None, 0, 0, 0, 0, paras, size=size, color=color, align=align, anchor=anchor, box=sh)
    return sh
def phone(s, name, img, x, y, w):
    """a phone-shaped frame with an episode still inside (both morph by name)"""
    h = w * 16 / 9; b = 0.09
    fr = shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, name + '_frame', x - b, y - b, w + 2 * b, h + 2 * b, '1C1030'); fr.adjustments[0] = 0.08
    pic = s.shapes.add_picture(os.path.join(IMG, img), Inches(x), Inches(y), Inches(w), Inches(h)); pic.name = name
    return pic
def logo(s, x=11.35, y=0.36, w=1.45):
    p = s.shapes.add_picture(os.path.join(IMG, 'zungga-logo.png'), Inches(x), Inches(y), Inches(w)); p.name = '!!logo'; return p
def footer(s, n, dark=False):
    text(s, 'footer', 0.88, 6.92, 8, 0.35, f'Zungga · School pilot proposal   ·   {n}', size=11, color=PALE if dark else '8A82A3')
def notes(s, t): s.notes_slide.notes_text_frame.text = t

MORPH = ('<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">'
         '<mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">'
         '<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" spd="slow" p14:dur="{dur}"><p159:morph option="byObject"/></p:transition>'
         '</mc:Choice><mc:Fallback><p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>')
def morph(s, dur=1600):
    el = etree.fromstring(MORPH.format(dur=dur)); sld = s._element
    after = sld.find('{http://schemas.openxmlformats.org/presentationml/2006/main}clrMapOvr')
    (after if after is not None else sld.find('{http://schemas.openxmlformats.org/presentationml/2006/main}cSld')).addnext(el)

# ============================== the slides ==============================
# 1 — cover: the problem, no brand yet
s = slide(PURPLE)
orb(s, '!!orbA', 9.9, -1.6, 5.4, LEMON); orb(s, '!!orbB', 11.6, 5.2, 2.6, PINK); orb(s, '!!orbC', -1.2, 5.6, 2.4, VIOLET)
text(s, '!!eyebrow', 0.92, 1.55, 8, 0.5, 'A CONVERSATION ABOUT CLASS 3–5 LEARNING', size=16, color=LEMON, font=HEAD)
text(s, '!!title', 0.9, 2.25, 8.6, 2.8, [[('More screen time than ever.', {})], [('Are our children ', {}), ('learning more?', {'color': LEMON})]], size=50, color=LIGHT, font=HEAD, spacing=1.0)
text(s, 'meta', 0.92, 6.55, 8, 0.4, '[School name]  ·  [Date]', size=14, color=PALE)
notes(s, "Do not introduce the product yet. Open with the problem everyone in the room already feels: children spend more time on screens than ever, yet it rarely turns into learning. Thank the principal for the time, then move straight to the question.")

# 2 — listen first
s = slide(CREAM)
orb(s, '!!orbA', 10.6, -0.9, 3.4, LEMON); orb(s, '!!orbB', 12.3, 2.3, 1.2, PINK); orb(s, '!!orbC', -0.7, 6.0, 1.6, VIOLET)
eyebrow(s, 'Before we show anything')
text(s, '!!title', 0.85, 1.55, 11.2, 2.8, [[('When your Class 3–5 children close the textbook,', {})], [('what ', {}), ('stays', {'color': VIOLET}), (' with them?', {})]], size=48, color=INK, font=HEAD, spacing=1.05)
text(s, '!!sub', 0.88, 4.6, 9.5, 1.2, 'We would love to start by listening — you see these children every day.', size=22, color=SOFT)
footer(s, 2); morph(s)
notes(s, "Ask this question and then STOP talking. Let the principal answer fully. Write down their exact words — you will use them later in the pilot plan. Follow-up if needed: “Which part of learning do you wish stayed longer — the concept, the interest, or the habit of practice?”")

# 3 — where do they miss?
s = slide(CREAM)
orb(s, '!!orbA', 11.9, -0.6, 1.6, LEMON); orb(s, '!!orbB', 12.5, 6.4, 1.4, PINK); orb(s, '!!orbC', -0.5, -0.5, 1.3, VIOLET)
eyebrow(s, 'A conversation')
title(s, 'Where do children lose their focus?')
qs = [('🎯', 'In class', 'When does attention drop? Which subjects feel hardest?', LEMON),
      ('🏠', 'At home', 'What happens after school — practice, or screens?', PINK),
      ('🌍', 'In real life', 'Can they use what they learned outside the book?', '7FD8D2'),
      ('🙋', 'Confidence', 'Do they speak up, try ideas, and ask questions?', 'C9B6FF')]
for i, (ic, h, b, c) in enumerate(qs):
    x = 0.85 + i * 3.0
    card(s, f'!!card{i}', x, 2.15, 2.8, 3.2, WHITE, [[(ic, {'size': 40})], [(h, {'font': HEAD, 'size': 24, 'color': INK})], [(b, {'size': 17, 'color': SOFT})]], size=18)
    shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, f'!!cardbar{i}', x, 2.15, 2.8, 0.16, c).adjustments[0] = 0.5
footer(s, 3); morph(s)
notes(s, "Questions to ask, one card at a time:\n• In class: “At what point in a lesson do you see attention drop? Which subjects do children find hardest in Class 3–5?”\n• At home: “What do children usually do after school? How much do parents help with practice?”\n• Real life: “Can they apply maths or science outside the textbook — for example, with money or measurements?”\n• Confidence: “Do children volunteer answers, or wait for the right one?”\nListen more than you speak. Note the subjects and problems they mention.")

# 4 — what we often hear
s = slide(PURPLE)
orb(s, '!!orbA', 5.6, 6.5, 2.6, LEMON); orb(s, '!!orbB', 12.2, -0.8, 2.2, PINK); orb(s, '!!orbC', 11.0, 6.2, 1.2, VIOLET)
eyebrow(s, 'What teachers and parents often tell us', LEMON)
title(s, 'The gaps usually look like this', color=LIGHT)
causes = [('📺', 'Screens are passive', 'Children watch, but nobody asks them to think.'),
          ('📚', 'Learning stays in the book', 'Concepts rarely meet the child’s real world.'),
          ('😴', 'Practice feels like a chore', 'Repetition without a story loses interest fast.'),
          ('🤷', 'Parents want to help', '…but are not sure how, or have little time.')]
for i, (ic, h, b) in enumerate(causes):
    x = 0.85 + (i % 2) * 5.85; y = 2.05 + (i // 2) * 2.15
    card(s, f'!!card{i}', x, y, 5.55, 1.85, '3A2170', [[(ic + '  ', {'size': 30}), (h, {'font': HEAD, 'size': 24, 'color': LIGHT})], [(b, {'size': 18, 'color': PALE})]], anchor='m')
footer(s, 4, dark=True); morph(s)
notes(s, "Say: “These are things teachers and parents often share with us — does this match what you see here?” Invite them to add or correct. Do not quote numbers we do not have; let the principal’s own experience be the evidence. Connect each point to what they said on the previous slide.")

# 5 — the insight (accent)
s = slide(LEMON)
orb(s, '!!orbA', 4.2, -2.6, 12.6, 'FFD84D'); orb(s, '!!orbB', 11.2, 5.4, 1.6, PINK); orb(s, '!!orbC', 11.8, 0.6, 1.0, VIOLET)
text(s, '!!title', 0.9, 1.75, 11.6, 3.5, [[('Children don’t lack curiosity.', {})], [('They lack a ', {}), ('reason to lean in.', {'color': PINK})]], size=56, color=INK, font=HEAD, spacing=1.05, align='l')
text(s, '!!sub', 0.95, 5.05, 9.5, 0.9, 'Give them a character who needs their help — and they think.', size=24, color=SOFT)
morph(s, 1800)
notes(s, "Pause on this slide. This is the heart of the pitch. Say it slowly. Then: “That is what we built Zungga for.”")

# 6 — meet Zungga
s = slide(CREAM)
orb(s, '!!orbA', 8.2, 0.55, 5.4, LEMON); orb(s, '!!orbB', 12.1, 5.6, 1.4, PINK); orb(s, '!!orbC', 7.5, 5.9, 0.9, VIOLET)
mas = s.shapes.add_picture(os.path.join(IMG, 'zungga-mascot.png'), Inches(8.9), Inches(1.15), Inches(4.0)); mas.name = '!!mascot'
eyebrow(s, 'That is why we built')
lg = s.shapes.add_picture(os.path.join(IMG, 'zungga-logo.png'), Inches(0.85), Inches(0.85), Inches(3.0)); lg.name = '!!logo'
title(s, 'Learning through cartoon stories where the child solves the problem', y=3.4, size=28, w=7.3)
pts = [('📖', 'Short animated episodes with lovable characters'), ('💡', 'The story pauses — the child gives the idea'), ('🧪', 'Science, maths, money, business and life skills'), ('🏃', 'Every episode ends with a real-world mission')]
for i, (ic, t) in enumerate(pts):
    text(s, f'!!pt{i}', 0.9, 4.55 + i * 0.55, 7.2, 0.55, [[(ic + '   ', {'size': 22}), (t, {'size': 21, 'color': INK})]])
footer(s, 6); morph(s)
notes(s, "THE REVEAL. Only now say the name: “This is Zungga.” Introduce it in one breath: short cartoon episodes; the story stops and asks the child; then a real-world mission. Mention it covers maths and money today, science next, and life skills.")

# 7 — the loop
s = slide(CREAM)
eyebrow(s, 'A different kind of screen time')
title(s, 'Watch → think → do → unlock')
steps = [('▶️', 'Watch', 'A short story with a real problem', LEMON, '!!orbA'), ('✋', 'Pause & answer', 'The child looks, chooses or counts', PINK, '!!orbB'),
         ('🏃', 'Real-world mission', 'Choose 1 of 3 activities at home', '7FD8D2', 'loopC'), ('✅', 'Grown-up approves', 'With a PIN — then the next episode unlocks', 'C9B6FF', '!!orbC')]
for i, (ic, h, b, c, nm) in enumerate(steps):
    cx = 0.95 + i * 3.1
    orb(s, nm, cx + 0.55, 2.2, 1.7, c)
    text(s, f'!!stepicon{i}', cx + 0.55, 2.55, 1.7, 1.0, ic, size=40, align='c')
    text(s, f'!!steph{i}', cx, 4.05, 2.8, 0.9, h, size=21, color=INK, font=HEAD, align='c', anchor='b')
    text(s, f'!!stepb{i}', cx, 5.0, 2.8, 0.9, b, size=16, color=SOFT, align='c')
    if i < 3: shape(s, MSO_SHAPE.RIGHT_ARROW, f'!!arrow{i}', cx + 2.5, 2.85, 0.55, 0.4, VIOLET)
text(s, '!!sub', 0.9, 6.15, 11.5, 0.6, [[('Screen time becomes the start of learning — not the end of it.', {'color': VIOLET, 'font': HEAD})]], size=20, align='c')
footer(s, 7); morph(s, 2000)
notes(s, "Walk the loop left to right. Stress two things: (1) the child must THINK during the pause — it is not passive; (2) the episode only unlocks after a real activity at home, approved by a parent. This is how screen time turns into active time.")

# 8 — episode 1
s = slide(PURPLE)
orb(s, '!!orbA', 7.9, 0.25, 6.6, LEMON); orb(s, '!!orbB', 0.4, 6.2, 1.2, PINK); orb(s, '!!orbC', 12.4, 6.3, 0.8, VIOLET)
phone(s, '!!phoneA', 'hero.jpg', 9.55, 0.72, 3.25)
eyebrow(s, 'Episode 1 · ready today', LEMON, y=1.3)
title(s, 'Rio’s Lemonade Stall', color=LIGHT, y=1.65, size=46)
facts = [('Class', '3 – 5'), ('Subject', 'Maths · Money'), ('Learns', 'Spent vs earned · Profit & loss'), ('Length', '3 min 18 s'), ('Board', 'Tamil Nadu & Karnataka')]
for i, (k, v) in enumerate(facts):
    text(s, f'!!fact{i}', 0.9, 3.0 + i * 0.62, 7.6, 0.55, [[(k.upper() + '   ', {'size': 13, 'color': LEMON, 'font': HEAD}), (v, {'size': 21, 'color': LIGHT})]])
footer(s, 8, dark=True); morph(s)
notes(s, "Introduce the characters: Rio (energetic), Tara (the careful thinker with her notebook), Mira (creative) and Thatha, the friendly grandfather. Each character has their own voice. The story: Rio opens a lemonade stall on a hot day, spends ₹70, earns only ₹50 — and asks the children for help.")

# 9 — watch it
s = slide('1C1030')
orb(s, '!!orbA', 4.2, -0.6, 8.6, '2E1A5C'); orb(s, '!!orbB', 0.5, 6.0, 0.9, PINK); orb(s, '!!orbC', 12.0, 0.6, 0.7, VIOLET)
vw = 3.6; vh = vw * 16 / 9; vx = (13.333 - vw) / 2; vy = (7.5 - vh) / 2
fr = shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, '!!phoneA_frame', vx - 0.09, vy - 0.09, vw + 0.18, vh + 0.18, '0E0820'); fr.adjustments[0] = 0.06
mv = s.shapes.add_movie(os.path.join(HERE, 'episode1.mp4'), Inches(vx), Inches(vy), Inches(vw), Inches(vh), poster_frame_image=os.path.join(IMG, 'hero.jpg'), mime_type='video/mp4'); mv.name = 'episode video'
text(s, '!!title', 0.9, 2.6, 3.6, 2.0, [[('Let’s watch', {'color': LIGHT})], [('3 minutes', {'color': LEMON, 'size': 22, 'font': BODY})]], size=36, font=HEAD)
text(s, '!!sub', 9.1, 2.7, 3.5, 2.0, [[('Watch for the', {})], [('3 pauses', {'color': PINK, 'font': HEAD})], [('where the child answers', {})]], size=20, color=PALE)
morph(s)
notes(s, "Click the video to play (it plays inside the slide, with sound — check the volume before the meeting). Tell the principal: watch for the three moments where Rio stops and asks the children. Afterwards ask: “Would your children answer out loud here?”")

# 10 — three pauses
s = slide(CREAM)
logo(s)
eyebrow(s, 'Every child can answer')
title(s, 'Three pauses, three kinds of thinking')
for i, (img, h, b, c) in enumerate([('look.jpg', '👀 Look', 'The answer is on screen — every child gets an easy first win.', '0E9F9A'),
                                     ('choose.jpg', '✋ Choose', 'Three picture cards; children show 1, 2 or 3 with their fingers.', PINK),
                                     ('count.jpg', '🔢 Count', 'Syllabus maths: count in tens, then add — out loud, together.', ORANGE)]):
    x = 0.95 + i * 4.15
    phone(s, '!!phoneA' if i == 1 else f'!!phone{i}', img, x, 1.75, 1.85)
    text(s, f'!!ph{i}', x + 2.05, 2.1, 1.95, 0.6, h, size=22, color=c, font=HEAD)
    text(s, f'!!pb{i}', x + 2.05, 2.7, 1.95, 2.4, b, size=16, color=SOFT)
footer(s, 10); morph(s)
notes(s, "Explain why each pause works for Class 3–5: LOOK builds confidence (the answer is visible), CHOOSE works for shy children and whole classes (fingers), COUNT is real syllabus maths. After each pause the characters confirm the answer and praise: “If you said two, you think like a real business person!”")

# 11 — missions
s = slide(PURPLE)
orb(s, '!!orbA', -2.1, 5.8, 3.2, LEMON); orb(s, '!!orbB', 11.7, 5.4, 2.4, PINK); orb(s, '!!orbC', 8.6, 0.2, 0.8, VIOLET)
phone(s, '!!phoneA', 'mission.jpg', 9.7, 0.75, 3.15)
eyebrow(s, 'Learning that leaves the screen', LEMON, y=1.25)
title(s, 'Every episode ends with a real-world mission', color=LIGHT, y=1.6, size=34, w=8.2)
ms = [('🏃', 'Move', '10 lemon-squeeze jumps'), ('👨‍👩‍👧', 'Family', 'Help a grown-up put the shopping away and find 3 price tags'), ('🎨', 'Create', 'Draw your own shop sign with a price')]
for i, (ic, h, b) in enumerate(ms):
    card(s, f'!!card{i}', 0.9, 3.05 + i * 1.05, 7.9, 0.9, '3A2170', [[(ic + '  ', {'size': 24}), (h + ':  ', {'font': HEAD, 'size': 20, 'color': LEMON}), (b, {'size': 18, 'color': LIGHT})]], anchor='m')
text(s, '!!sub', 0.92, 6.25, 8.2, 0.5, 'Always a choice of three, at the same effort — no child is left out.', size=17, color=PALE)
footer(s, 11, dark=True); morph(s)
notes(s, "The mission links the lesson to home. Always three unrelated choices at the same level of effort — movement, family, creative — so every child (including children who cannot do physical activity) has an option. A grown-up at home confirms it with a PIN, and the next episode unlocks. Long tasks like “help prepare dinner” can be approved later.")

# 12 — safe by design
s = slide(CREAM)
orb(s, '!!orbA', 11.0, 4.9, 3.0, LEMON); orb(s, '!!orbB', 12.6, 0.4, 0.9, PINK); orb(s, '!!orbC', -0.6, 6.1, 1.4, VIOLET)
logo(s)
eyebrow(s, 'Parents stay in control')
title(s, 'Safe for children, by design')
sf = [('🚫', 'No tracking', 'No monitoring, no location, no behaviour profiling.'), ('🔐', 'Parent login + PIN', 'Every approval needs the parent’s own PIN.'), ('📵', 'No ads, ever', 'Nothing is sold to children inside the app.'),
      ('🪪', 'Minimal data', 'No child email needed; only name and progress.'), ('💬', 'Kind feedback', 'Every answer is welcomed; praise comes first.'), ('🇮🇳', 'Made for India', 'Designed around India’s child-data rules (DPDP Act).')]
for i, (ic, h, b) in enumerate(sf):
    x = 0.85 + (i % 3) * 3.95; y = 2.25 + (i // 3) * 2.05
    card(s, f'!!card{i}', x, y, 3.75, 1.8, WHITE, [[(ic + '  ', {'size': 24}), (h, {'font': HEAD, 'size': 21, 'color': INK})], [(b, {'size': 16, 'color': SOFT})]])
footer(s, 12); morph(s)
notes(s, "Principals worry about screens and data — address it directly. The app never tracks children; parents confirm activities themselves with a separate login and PIN. No ads. Minimal data with parental consent. Mention we follow India’s Digital Personal Data Protection Act requirements for children (verifiable parental consent, no tracking or targeted ads).")

# 13 — fits your classroom
s = slide(CREAM)
orb(s, '!!orbA', 9.6, 0.9, 4.6, LEMON); orb(s, '!!orbB', 12.4, 5.9, 1.1, PINK); orb(s, '!!orbC', 8.9, 5.6, 0.8, VIOLET)
phone(s, '!!phoneA', 'sum.jpg', 10.35, 1.2, 2.2)
eyebrow(s, 'Fits your classroom', y=1.15)
title(s, 'Built around your syllabus and your teachers', y=1.5, size=34, w=8.4)
rows = [('📘', 'Syllabus-linked', 'Class 3–5, Tamil Nadu & Karnataka state boards, in English'), ('🧑‍🏫', 'Classroom mode', 'Teacher plays an episode; the whole class answers the pauses together'),
        ('🏡', 'Home connection', 'Missions bring parents into learning, without extra homework load'), ('🎯', 'Experiential learning', 'Thinking, problem-solving and doing — as NEP 2020 encourages')]
for i, (ic, h, b) in enumerate(rows):
    text(s, f'!!pt{i}', 0.9, 3.05 + i * 0.92, 8.4, 0.9, [[(ic + '  ', {'size': 22}), (h, {'font': HEAD, 'size': 21, 'color': INK})], [(b, {'size': 16, 'color': SOFT})]])
footer(s, 13); morph(s)
notes(s, "Make it easy for teachers: one episode takes about 5 minutes of class time including the pauses. Content follows the Class 3–5 state-board topics (we map each episode to a chapter). NEP 2020 emphasises experiential learning and critical thinking — this is exactly that. Ask: “Which chapter would you most like to see as an episode?”")

# 14 — the pilot
s = slide(PURPLE)
orb(s, '!!orbA', 10.8, -1.6, 4.4, LEMON); orb(s, '!!orbB', -0.9, 5.7, 2.2, PINK); orb(s, '!!orbC', 12.3, 6.3, 0.9, VIOLET)
eyebrow(s, 'Our proposal', LEMON, y=1.15)
title(s, 'A small, simple 4-week pilot', color=LIGHT, y=1.5, size=40)
big = [('1', 'class group', 'Class 3, 4 or 5 — your choice of sections'), ('4', 'weeks', 'Two short sessions a week'), ('6–8', 'episodes', 'Maths & money first, science next'), ('[₹__]', 'cost to school', '[Free pilot / to be agreed]')]
for i, (n, u, b) in enumerate(big):
    x = 0.9 + i * 3.05
    card(s, f'!!card{i}', x, 2.75, 2.85, 3.1, '3A2170', [[(n, {'font': HEAD, 'size': 54, 'color': LEMON})], [(u, {'font': HEAD, 'size': 20, 'color': LIGHT})], [(b, {'size': 15, 'color': PALE})]])
text(s, '!!sub', 0.92, 6.1, 11, 0.5, 'Episode 1 is ready today; the remaining episodes are in production for the pilot dates.', size=15, color=PALE)
footer(s, 14, dark=True); morph(s)
notes(s, "Keep the ask small and low-risk. Fill in the cost line before the meeting (e.g. free pilot). Be honest: Episode 1 is complete; the rest are being produced with the same studio for the pilot schedule. Ask which class and sections they would like.")

# 15 — measuring
s = slide(CREAM)
orb(s, '!!orbA', -1.9, 5.9, 3.0, LEMON); orb(s, '!!orbB', 12.2, 4.3, 1.6, PINK); orb(s, '!!orbC', 11.2, 6.4, 0.7, VIOLET)
logo(s)
eyebrow(s, 'Without tracking any child')
title(s, 'How we will know it worked')
ms = [('🧑‍🏫', 'Teacher feedback', 'A 2-minute form after each session'), ('🙌', 'Class participation', 'How many hands and answers at each pause'), ('✅', 'Missions approved', 'A simple count from parents — nothing more'),
      ('🖍️', 'Children’s voice', '“What I learned” drawing or sentence at the end'), ('👪', 'Parent check-in', 'A short survey in week 4')]
for i, (ic, h, b) in enumerate(ms):
    x = 0.85 + (i % 3) * 3.95; y = 2.2 + (i // 3) * 2.0
    card(s, f'!!card{i}', x, y, 3.75, 1.75, WHITE, [[(ic + '  ', {'size': 24}), (h, {'font': HEAD, 'size': 21})], [(b, {'size': 16, 'color': SOFT})]])
card(s, '!!card5', 0.85 + 2 * 3.95, 4.2, 3.75, 1.75, LEMON, [[('📋 ', {'size': 24}), ('Week-4 review', {'font': HEAD, 'size': 21})], [('We share every finding with you', {'size': 16, 'color': SOFT})]])
footer(s, 15); morph(s)
notes(s, "Measurement respects privacy: teacher forms, classroom observation, counts of approved missions, children's own reflections and a short parent survey. We bring everything to a review meeting in week 4 and decide together whether to continue.")

# 16 — timeline
s = slide(CREAM)
orb(s, '!!orbA', 11.4, -1.0, 2.6, LEMON); orb(s, '!!orbB', -0.6, 6.2, 1.3, PINK); orb(s, '!!orbC', 12.4, 6.4, 0.7, VIOLET)
logo(s)
eyebrow(s, 'The plan')
title(s, 'Four weeks, step by step')
bar = shape(s, MSO_SHAPE.ROUNDED_RECTANGLE, '!!track', 0.9, 3.15, 11.5, 0.14, 'E3DAF7'); bar.adjustments[0] = 0.5
wk = [('Week 0', 'Set-up', 'Choose sections · parent consent note · teacher walkthrough', VIOLET), ('Week 1–2', 'Episodes 1–4', 'In class, twice a week · first home missions', PINK),
      ('Week 3', 'Episodes 5–8', 'Children lead the answers · more missions', '0E9F9A'), ('Week 4', 'Review', 'Findings meeting with you · decide next steps', ORANGE)]
for i, (w, h, b, c) in enumerate(wk):
    x = 0.9 + i * 2.95
    orb(s, f'!!dot{i}', x + 0.05, 2.97, 0.5, c)
    text(s, f'!!wk{i}', x, 2.2, 2.8, 0.5, w.upper(), size=14, color=c, font=HEAD)
    text(s, f'!!wh{i}', x, 3.7, 2.75, 0.5, h, size=22, color=INK, font=HEAD)
    text(s, f'!!wb{i}', x, 4.25, 2.75, 1.5, b, size=16, color=SOFT)
footer(s, 16); morph(s)
notes(s, "Agree on a start date. Week 0 is light: pick the sections, send a consent note to parents (we provide the draft), and a 20-minute teacher walkthrough.")

# 17 — what we need
s = slide(PURPLE)
orb(s, '!!orbA', 8.4, 1.0, 5.4, LEMON); orb(s, '!!orbB', 11.9, 5.7, 1.3, PINK); orb(s, '!!orbC', 0.4, 6.3, 0.8, VIOLET)
phone(s, '!!phoneA', 'badges.jpg', 9.95, 1.0, 2.75)
eyebrow(s, 'To begin', LEMON, y=1.15)
title(s, 'What we need from you', color=LIGHT, y=1.5, size=40)
need = ['A class group for the pilot (Class 3, 4 or 5)', 'One teacher champion', 'Two 15-minute slots a week', 'Permission to send a parent consent note']
for i, t in enumerate(need):
    text(s, f'!!pt{i}', 0.9, 2.75 + i * 0.8, 7.4, 0.7, [[(f'{i + 1}  ', {'font': HEAD, 'size': 24, 'color': LEMON}), (t, {'size': 22, 'color': LIGHT})]])
footer(s, 17, dark=True); morph(s)
notes(s, "Make the ask concrete and small. Close with a question, not a statement: “Which class would you like to start with, and could we begin on [date]?” Then stop and wait.")

# 18 — close
s = slide(PURPLE)
orb(s, '!!orbA', 7.35, -1.1, 7.6, LEMON); orb(s, '!!orbB', 11.6, 5.2, 2.6, PINK); orb(s, '!!orbC', -1.2, 5.6, 2.4, VIOLET)
phone(s, '!!phoneA', 'profit.jpg', 9.35, 0.95, 3.05)
logo(s, 0.9, 0.7, 2.0)
text(s, '!!title', 0.9, 2.75, 7.4, 2.0, [[('Let’s turn screen time', {})], [('into ', {}), ('skill time — together.', {'color': LEMON})]], size=38, color=LIGHT, font=HEAD, spacing=1.0)
text(s, '!!sub', 0.92, 4.95, 7.0, 1.4, [['Thank you.'], [('[Your name]  ·  [Phone]  ·  [Email]', {'size': 18, 'color': PALE})], [('zungga.com', {'size': 18, 'color': LEMON, 'font': HEAD})]], size=26, color=LIGHT)
morph(s, 1800)
notes(s, "Thank the principal. Leave contact details. Offer to send the episode video and a one-page pilot summary the same day.")

# ask — how would you solve it? (built last, moved into place below)
s = slide(CREAM)
orb(s, '!!orbA', 10.9, 4.6, 3.4, LEMON); orb(s, '!!orbB', 12.3, 0.5, 1.0, PINK); orb(s, '!!orbC', -0.7, -0.6, 1.6, VIOLET)
eyebrow(s, 'Your view')
title(s, 'How would you solve this?')
opts = [('⏱️', 'Less screen time?', 'Hard to enforce at home'), ('📝', 'More homework?', 'More pressure, same interest'), ('🔁', 'More drills in class?', 'Class time is already full'),
        ('💡', 'Or make screen time make them think?', 'Turn the screen into a reason to learn')]
for i, (ic, h, b) in enumerate(opts):
    x = 0.85 + i * 3.0; last = i == 3
    card(s, f'!!card{i}', x, 2.15, 2.8, 3.2, LEMON if last else WHITE, [[(ic, {'size': 40})], [(h, {'font': HEAD, 'size': 22, 'color': INK})], [(b, {'size': 16, 'color': SOFT})]])
footer(s, 0); morph(s)
notes(s, "Ask the principal first: “If you could change one thing, how would you solve this?” Listen. Then walk the common answers left to right — each has a cost. Land on the last card: what if the screen itself made children think? That is the bridge to the next slide.")

# order: problem → cause → how to solve → solution → Zungga → what we do → pilot
ids = prs.slides._sldIdLst; els = list(ids)
order = [0, 1, 2, 3, 18, 4, 6, 5] + list(range(7, 18))
for e in els: ids.remove(e)
for k in order: ids.append(els[k])
for n, sl in enumerate(prs.slides, 1):
    for sh in sl.shapes:
        if sh.name == 'footer': sh.text_frame.paragraphs[0].runs[0].text = f'Zungga · School pilot proposal   ·   {n}' if n >= 8 else f'Class 3–5 learning   ·   {n}'
out = os.path.join(HERE, 'Zungga-School-Pilot.pptx'); prs.save(out); print('saved', out, len(prs.slides._sldIdLst), 'slides')
