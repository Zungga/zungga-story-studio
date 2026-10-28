#!/usr/bin/env python3
"""Zungga — school pilot presentation, black & white edition (Didot + Avenir Next, Morph).  → Zungga-School-Pilot-Tal.pptx"""
import os
from lxml import etree
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

HERE = os.path.dirname(os.path.abspath(__file__)); IMG = os.path.join(HERE, 'img_bw')
SERIF, SANS = 'Instrument Serif', 'Inter'
BLACK, WHITE, GREY, LGREY, DGREY, CARD = '111111', 'F7F7F5', '6E6E6E', 'BDBDBD', '2B2B2B', 'FFFFFF'
rgb = lambda h: RGBColor.from_string(h)
prs = Presentation(); prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5); BLANK = prs.slide_layouts[6]

def slide(bg):
    s = prs.slides.add_slide(BLANK); f = s.background.fill; f.solid(); f.fore_color.rgb = rgb(bg); s._bg = bg; return s
def box(s, name, x, y, w, h, fill=None, line=None, kind=MSO_SHAPE.RECTANGLE, lw=1):
    sh = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h)); sh.name = name; sh.shadow.inherit = False
    if fill: sh.fill.solid(); sh.fill.fore_color.rgb = rgb(fill)
    else: sh.fill.background()
    if line: sh.line.color.rgb = rgb(line); sh.line.width = Pt(lw)
    else: sh.line.fill.background()
    return sh
def rule(s, x, y, w, color, name='!!rule'): return box(s, name, x, y, w, 0.02, color)
def text(s, name, x, y, w, h, paras, size=20, color=BLACK, font=SANS, bold=False, align='l', anchor='t', spacing=1.12, box_=None, tracking=None):
    tb = box_ or s.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    if name: tb.name = name
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_left = tf.margin_right = Inches(0.03); tf.margin_top = tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = {'t': MSO_ANCHOR.TOP, 'm': MSO_ANCHOR.MIDDLE, 'b': MSO_ANCHOR.BOTTOM}[anchor]
    for i, para in enumerate([paras] if isinstance(paras, str) else paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph(); p.alignment = {'l': PP_ALIGN.LEFT, 'c': PP_ALIGN.CENTER, 'r': PP_ALIGN.RIGHT}[align]; p.line_spacing = spacing
        for piece in ([(para, {})] if isinstance(para, str) else para):
            t, o = piece if isinstance(piece, tuple) else (piece, {})
            r = p.add_run(); r.text = t; f = r.font; f.name = o.get('font', font); f.size = Pt(o.get('size', size)); f.bold = o.get('bold', bold); f.italic = o.get('italic', False); f.color.rgb = rgb(o.get('color', color))
            if tracking: r._r.get_or_add_rPr().set('spc', str(tracking))
    return tb
dark = lambda s: s._bg == BLACK
def kicker(s, t, y=0.62): return text(s, '!!kicker', 0.9, y, 9, 0.35, t.upper(), size=12, color=LGREY if dark(s) else GREY, bold=True, tracking=300)
def head(s, t, y=0.98, size=50, w=11.3): return text(s, '!!head', 0.9, y, w, 1.6, t, size=size, color=WHITE if dark(s) else BLACK, font=SERIF, spacing=1.0)
def foot(s, label):
    c = GREY if not dark(s) else '8A8A8A'
    rule(s, 0.9, 6.82, 11.55, '3A3A3A' if dark(s) else 'D9D9D6', name='!!footrule')
    text(s, 'footer', 0.9, 6.92, 9, 0.3, label, size=10, color=c, tracking=150)
def notes(s, t): s.notes_slide.notes_text_frame.text = t
def phone(s, name, img, x, y, w, frame=BLACK):
    h = w * 16 / 9; b = 0.07
    fr = box(s, name + '_frame', x - b, y - b, w + 2 * b, h + 2 * b, frame, kind=MSO_SHAPE.ROUNDED_RECTANGLE); fr.adjustments[0] = 0.07
    p = s.shapes.add_picture(os.path.join(IMG, img), Inches(x), Inches(y), Inches(w), Inches(h)); p.name = name; return p
def col(s, i, x, y, w, num, h_, b, darkc=None):   # a numbered column: big serif numeral, rule, title, text
    d = dark(s); text(s, f'!!num{i}', x, y, w, 0.8, num, size=48, color=WHITE if d else BLACK, font=SERIF)
    rule(s, x, y + 0.92, w, '4A4A4A' if d else BLACK, name=f'!!colrule{i}')
    text(s, f'!!ch{i}', x, y + 1.1, w, 0.5, h_, size=19, color=WHITE if d else BLACK, bold=True)
    text(s, f'!!cb{i}', x, y + 1.62, w, 1.6, b, size=15, color=LGREY if d else GREY, spacing=1.2)
MORPH = ('<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"><mc:Choice xmlns:p159="http://schemas.microsoft.com/office/powerpoint/2015/09/main" Requires="p159">'
         '<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" spd="slow" p14:dur="{d}"><p159:morph option="byObject"/></p:transition>'
         '</mc:Choice><mc:Fallback><p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" spd="slow"><p:fade/></p:transition></mc:Fallback></mc:AlternateContent>')
def morph(s, d=1500):
    el = etree.fromstring(MORPH.format(d=d)); sld = s._element; ns = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
    (sld.find(ns + 'clrMapOvr') if sld.find(ns + 'clrMapOvr') is not None else sld.find(ns + 'cSld')).addnext(el)
P = 'Class 3–5 learning  ·  '; Z = 'Zungga  ·  School pilot proposal  ·  '

# ===================== PART 1 · THE PROBLEM =====================
# 1 — cover
s = slide(BLACK)
box(s, '!!panel', 9.4, 0, 3.933, 7.5, '1C1C1C')
text(s, '!!kicker', 0.9, 1.35, 9, 0.35, 'A CONVERSATION ABOUT THE CHILDREN IN YOUR CLASSROOMS', size=12, color=LGREY, bold=True, tracking=300)
text(s, '!!head', 0.9, 2.0, 8.3, 3.0, [[('Every child in your school', {})], [('can learn to ', {}), ('think.', {'italic': True})]], size=68, color=WHITE, font=SERIF, spacing=0.95)
rule(s, 0.9, 4.75, 1.4, WHITE)
text(s, '!!sub', 0.9, 4.95, 8, 0.8, 'How your teachers, your children and their families can make every hour of learning count.', size=17, color=LGREY, spacing=1.25)
text(s, 'meta', 0.9, 6.55, 8, 0.35, '[SCHOOL NAME]   ·   [DATE]', size=11, color=GREY, tracking=250)
notes(s, "Greet the principal and thank them for their time. Do not mention the product yet. Say: “We would like to talk about the children in your classrooms, and about your teachers — and listen to how you see things.”")

# 2 — teachers give everything
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'Your school today')
text(s, '!!head', 0.9, 1.55, 11.2, 3.2, [[('Your teachers give everything', {})], [('inside the classroom.', {})], [('But learning often ', {}), ('stops at the school gate.', {'italic': True})]], size=54, color=BLACK, font=SERIF, spacing=1.0)
text(s, '!!sub', 0.92, 5.1, 10.5, 0.9, 'Between the last bell and the next morning, what happens to what the children learned today?', size=18, color=GREY, spacing=1.25)
foot(s, P + '2'); morph(s)
notes(s, "Begin by honouring the teachers — they work hard. Then name the problem gently: the classroom does its job, but once children go home the learning rarely continues. Ask: “What do you see happening between the last bell and the next morning?” Then listen.")

# 3 — the problem, three angles
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'The problem, from three sides')
head(s, 'Children, teachers and families all feel it')
for i, (n, h_, b) in enumerate([('i.', 'For children', 'Attention drops quickly. Many are afraid of giving the wrong answer, so they stay quiet.'),
                                 ('ii.', 'For teachers', 'Forty children, one syllabus, limited periods — little time to make every concept feel real.'),
                                 ('iii.', 'At home', 'Evenings fill with screens. Parents want to help, but are unsure how, or short of time.')]):
    col(s, i, 0.9 + i * 3.95, 2.85, 3.55, n, h_, b)
foot(s, P + '3'); morph(s)
notes(s, "Walk the three columns. Pause after each and ask: “Does this match your school?” Note their exact words — they become the goals of the pilot.")

# 4 — ask the principal
s = slide(BLACK)
box(s, '!!panel', 9.4, 0, 3.933, 7.5, '1C1C1C')
kicker(s, 'We would like to hear from you')
head(s, 'Where do your Class 3–5 children struggle most?', w=8.2, size=48)
for i, q in enumerate(['Which subjects or topics do children find hardest?', 'When in a lesson do you see attention drop?', 'Do children use what they learn outside the book?', 'How involved are parents in learning at home?']):
    text(s, f'!!q{i}', 0.9, 3.15 + i * 0.78, 8.0, 0.7, [[(f'0{i + 1}   ', {'font': SERIF, 'size': 22, 'color': WHITE}), (q, {'size': 18, 'color': LGREY})]])
text(s, 'aside', 9.85, 2.6, 3.0, 2.4, [[('“', {'font': SERIF, 'size': 80, 'color': WHITE})], [('Your answers shape everything we propose today.', {'size': 16, 'color': LGREY, 'italic': True})]], spacing=1.1)
foot(s, P + '4'); morph(s)
notes(s, "This is the most important slide: ask, then stay silent and listen. Take notes on maths topics, science topics, attention, confidence, parental involvement. Later in the meeting, refer back to their answers by name.")

# ===================== PART 2 · THE CAUSE =====================
# 5 — why it happens
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'Why it happens')
head(s, 'Four causes teachers tell us about')
for i, (h_, b) in enumerate([('Screens are passive', 'Children watch for hours, but nothing asks them to think.'), ('Learning stays in the book', 'Concepts rarely meet the child’s own world — money, shops, home.'),
                              ('Practice feels like a chore', 'Repetition without a story loses a young child quickly.'), ('Home is cut off from school', 'Parents are willing, but have no simple way to join in.')]):
    x = 0.9 + (i % 2) * 5.9; y = 2.35 + (i // 2) * 1.95
    text(s, f'!!cn{i}', x, y, 0.9, 0.8, f'0{i + 1}', size=34, color=BLACK, font=SERIF)
    text(s, f'!!ch{i}', x + 1.0, y + 0.08, 4.6, 0.5, h_, size=20, color=BLACK, bold=True)
    text(s, f'!!cb{i}', x + 1.0, y + 0.6, 4.6, 1.0, b, size=15, color=GREY, spacing=1.2)
foot(s, P + '5'); morph(s)
notes(s, "Present these as what teachers and parents commonly share — not as statistics. Invite the principal to add their own causes. Do not quote numbers we do not have.")

# ===================== PART 3 · HOW TO SOLVE IT =====================
# 6 — how would you solve it?
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'The question')
head(s, 'How would your school solve this?')
opts = [('Less screen time?', 'Hard to enforce at home.'), ('More homework?', 'More pressure, not more interest.'), ('More drills in class?', 'Periods are already full.'), ('Or make screen time make children think?', 'Turn the screen into a reason to learn.')]
for i, (h_, b) in enumerate(opts):
    x = 0.9 + i * 2.95; last = i == 3
    c = box(s, f'!!opt{i}', x, 2.4, 2.75, 3.3, BLACK if last else CARD, None if last else 'D9D9D6')
    text(s, None, 0, 0, 0, 0, [[(f'0{i + 1}', {'font': SERIF, 'size': 30, 'color': WHITE if last else BLACK})], [(h_, {'size': 19, 'bold': True, 'color': WHITE if last else BLACK})], [(b, {'size': 15, 'color': LGREY if last else GREY})]], spacing=1.2, box_=c)
    c.text_frame.margin_left = c.text_frame.margin_right = Inches(0.25); c.text_frame.margin_top = Inches(0.25)
foot(s, P + '6'); morph(s)
notes(s, "Ask first: “If you could change one thing, how would you solve it?” Listen. Then go through the usual answers — each has a cost for teachers or families. End on the fourth card: what if the screen itself made children think?")

# 7 — the insight
s = slide(BLACK)
box(s, '!!panel', 0, 0, 13.333, 7.5, BLACK)
text(s, '!!head', 0.9, 2.0, 11.6, 3.0, [[('Children don’t lack curiosity.', {})], [('They lack a ', {}), ('reason to lean in.', {'italic': True})]], size=66, color=WHITE, font=SERIF, spacing=1.0)
rule(s, 0.9, 4.65, 1.4, WHITE)
text(s, '!!sub', 0.9, 4.85, 10, 0.8, 'Give a child a character who needs their help — and the child starts to think.', size=19, color=LGREY)
morph(s, 1800)
notes(s, "Say this slowly. It is the heart of the meeting. Let it sit for a moment before moving on.")

# 8 — the solution, unbranded
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'A different kind of screen time')
head(s, 'Watch.  Think.  Do.  Unlock.')
for i, (h_, b) in enumerate([('Watch', 'A short cartoon story where a character faces a real problem.'), ('Think', 'The story pauses. The child looks, chooses or counts — out loud.'),
                              ('Do', 'A real-world mission at home: move, help the family, or create.'), ('Unlock', 'A grown-up confirms with a PIN, and the next story opens.')]):
    col(s, i, 0.9 + i * 2.95, 2.35, 2.65, f'0{i + 1}', h_, b)
text(s, '!!sub', 0.9, 5.9, 11.5, 0.5, [[('The screen becomes the start of learning — not the end of it.', {'italic': True})]], size=18, color=BLACK, font=SERIF)
foot(s, P + '8'); morph(s)
notes(s, "Present the approach before the brand: watch, think, do, unlock. Stress that the child must answer during the pause, and that a parent confirms the real-world activity — so screen time becomes active time and home joins school.")

# ===================== PART 4 · ZUNGGA =====================
# 9 — the reveal
s = slide(BLACK)
box(s, '!!panel', 0, 0, 13.333, 7.5, BLACK)
text(s, '!!kicker', 0.9, 1.7, 11.5, 0.4, 'THAT IS WHY WE BUILT', size=13, color=LGREY, bold=True, tracking=400, align='c')
text(s, '!!head', 0.9, 2.15, 11.5, 2.2, 'Zungga', size=130, color=WHITE, font=SERIF, align='c')
rule(s, 5.97, 4.62, 1.4, WHITE)
text(s, '!!sub', 1.9, 4.85, 9.5, 1.0, 'Short cartoon stories where the child solves the problem — and then does something real.', size=20, color=LGREY, align='c', spacing=1.25)
text(s, 'tag', 0.9, 6.3, 11.5, 0.4, 'LEARN   ·   CREATE   ·   GROW', size=11, color=GREY, tracking=400, align='c')
morph(s, 2000)
notes(s, "THE REVEAL. Only now say the name: “This is Zungga.” One sentence: short cartoon stories, the child solves the problem, then does something real at home.")

# 10 — what it means for your school
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'What it means for your school')
head(s, 'Built for your children, your teachers and your families')
for i, (n, h_, b) in enumerate([('i.', 'Children', 'Speak up without fear — every answer is welcomed. Learn money, maths and science by solving a story.'),
                                 ('ii.', 'Teachers', 'A ready 5-minute lesson starter. The whole class answers together. No extra preparation.'),
                                 ('iii.', 'Families', 'One small mission each evening. Parents join learning in minutes, and see the progress.')]):
    col(s, i, 0.9 + i * 3.95, 2.85, 3.55, n, h_, b)
foot(s, Z + '10'); morph(s)
notes(s, "Make it about them. Children gain confidence; teachers get help, not more work; families get a simple way to take part. Ask: “Which of these matters most for your school?”")

# ===================== PART 5 · WHAT WE DO =====================
# 11 — episode 1
s = slide(BLACK)
box(s, '!!panel', 9.4, 0, 3.933, 7.5, '1C1C1C')
phone(s, '!!phone', 'hero.jpg', 9.95, 0.85, 3.2, frame='000000')
kicker(s, 'Episode 1 · ready today', y=1.15)
head(s, 'Rio’s Lemonade Stall', y=1.5, size=58, w=8.2)
for i, (k, v) in enumerate([('Class', '3 – 5'), ('Subject', 'Maths · Money'), ('Concepts', 'Spent and earned · Profit and loss'), ('Length', '3 minutes 18 seconds'), ('Boards', 'Tamil Nadu & Karnataka · English')]):
    y = 3.0 + i * 0.62; text(s, f'!!fk{i}', 0.9, y, 1.9, 0.5, k.upper(), size=11, color=GREY, bold=True, tracking=250, anchor='m'); text(s, f'!!fv{i}', 2.8, y, 6, 0.5, v, size=19, color=WHITE, anchor='m')
    rule(s, 0.9, y + 0.56, 7.7, '3A3A3A', name=f'!!fr{i}')
foot(s, Z + '11'); morph(s)
notes(s, "Introduce the story: on a hot day Rio opens a lemonade stall, spends ₹70 but earns only ₹50 — and turns to the children for help. Characters: Rio, Tara (the careful thinker), Mira (the creative one) and Thatha, the friendly grandfather. Each speaks in their own voice.")

# 12 — watch
s = slide(BLACK)
box(s, '!!panel', 0, 0, 13.333, 7.5, BLACK)
vw = 3.55; vh = vw * 16 / 9; vx = (13.333 - vw) / 2; vy = (7.5 - vh) / 2
fr = box(s, '!!phone_frame', vx - 0.07, vy - 0.07, vw + 0.14, vh + 0.14, '000000', kind=MSO_SHAPE.ROUNDED_RECTANGLE); fr.adjustments[0] = 0.06
mv = s.shapes.add_movie(os.path.join(HERE, 'episode1.mp4'), Inches(vx), Inches(vy), Inches(vw), Inches(vh), poster_frame_image=os.path.join(IMG, 'hero.jpg'), mime_type='video/mp4'); mv.name = 'episode video'
text(s, '!!head', 0.9, 2.7, 3.6, 1.6, [[('Let’s watch', {})], [('three minutes', {'font': SANS, 'size': 16, 'color': LGREY})]], size=36, color=WHITE, font=SERIF)
text(s, '!!sub', 9.1, 2.7, 3.4, 2.0, [[('Watch for the ', {}), ('three pauses', {'italic': True, 'color': WHITE})], [('where every child answers.', {})]], size=18, color=LGREY, spacing=1.3)
morph(s)
notes(s, "Click the video to play it inside the slide, with sound. Ask the principal to watch for the three pauses. Afterwards: “Would your children answer out loud here?”")

# 13 — three pauses
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'Every child can answer')
head(s, 'Three pauses, three kinds of thinking')
for i, (img, h_, b) in enumerate([('look.jpg', 'Look', 'The answer is on screen. Every child gets an easy first success — and confidence.'), ('choose.jpg', 'Choose', 'Three picture cards. Shy children answer with their fingers; the whole class can join.'),
                                     ('count.jpg', 'Count', 'Syllabus maths, out loud: count in tens, then add.')]):
    x = 0.95 + i * 4.1
    phone(s, '!!phone' if i == 1 else f'!!ph{i}', img, x, 2.2, 1.75)
    text(s, f'!!pn{i}', x + 1.95, 2.25, 2.0, 0.6, f'0{i + 1}', size=30, color=BLACK, font=SERIF)
    text(s, f'!!ph_{i}', x + 1.95, 2.95, 2.0, 0.5, h_, size=19, color=BLACK, bold=True)
    text(s, f'!!pb{i}', x + 1.95, 3.45, 1.95, 2.3, b, size=14, color=GREY, spacing=1.2)
foot(s, Z + '13'); morph(s)
notes(s, "Why it works for Class 3–5: Look builds confidence, Choose includes shy children and whole classes, Count practises real syllabus maths. After every pause the characters confirm the answer and praise the children.")

# 14 — for teachers
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'For your teachers')
head(s, 'Help for teachers — never extra work')
rows = [('Ready to use', 'Each episode is a complete 5-minute lesson starter, mapped to a Class 3–5 chapter.'), ('Whole-class mode', 'The teacher plays it on the classroom screen; the class answers the pauses together.'),
        ('Fits the syllabus', 'Tamil Nadu and Karnataka state boards, in English — maths and money first, science next.'), ('Experiential learning', 'Thinking, problem-solving and doing — as NEP 2020 encourages.')]
for i, (h_, b) in enumerate(rows):
    y = 2.3 + i * 1.02
    rule(s, 0.9, y, 11.55, 'D9D9D6', name=f'!!tr{i}')
    text(s, f'!!th{i}', 0.9, y + 0.18, 3.6, 0.6, h_, size=19, color=BLACK, bold=True)
    text(s, f'!!tb{i}', 4.6, y + 0.18, 7.8, 0.8, b, size=16, color=GREY, spacing=1.2)
foot(s, Z + '14'); morph(s)
notes(s, "Reassure that Zungga supports teachers and never replaces them. Ask which chapter they would most like to see as an episode — that becomes a pilot episode.")

# 15 — missions
s = slide(BLACK)
box(s, '!!panel', 9.4, 0, 3.933, 7.5, '1C1C1C')
phone(s, '!!phone', 'mission.jpg', 9.95, 0.85, 3.2, frame='000000')
kicker(s, 'Learning that reaches home', y=1.15)
head(s, 'Every story ends with a mission', y=1.5, size=44, w=8.3)
for i, (h_, b) in enumerate([('Move', '10 “lemon-squeeze” jumps'), ('Family', 'Help a grown-up put the shopping away and find three price tags'), ('Create', 'Draw your own shop sign with a price')]):
    y = 3.0 + i * 0.95
    text(s, f'!!mn{i}', 0.9, y, 0.8, 0.6, f'0{i + 1}', size=26, color=WHITE, font=SERIF)
    text(s, f'!!mt{i}', 1.75, y + 0.05, 6.8, 0.8, [[(h_ + '  —  ', {'bold': True, 'color': WHITE}), (b, {'color': LGREY})]], size=17)
text(s, '!!sub', 0.9, 5.95, 8.2, 0.6, 'Always three different choices at the same effort, so no child is left out. A grown-up at home approves with a PIN.', size=14, color=GREY, spacing=1.25)
foot(s, Z + '15'); morph(s)
notes(s, "The mission carries school into the home. Three unrelated choices at the same effort — movement, family, creative — so every child, including those who cannot do physical activity, can take part. The parent approves with a PIN and the next story unlocks.")

# 16 — safe by design
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'Parents stay in control')
head(s, 'Safe for children, by design')
safe = [('No tracking', 'No monitoring, location or behaviour profiling of any child.'), ('Parent login and PIN', 'Every approval needs the parent’s own PIN.'), ('No advertising', 'Nothing is ever sold to children.'),
        ('Minimal data', 'No child email. Only a name and learning progress.'), ('Kind feedback', 'Every answer is welcomed; praise always comes first.'), ('Made for India', 'Designed around India’s child data rules (DPDP Act).')]
for i, (h_, b) in enumerate(safe):
    x = 0.9 + (i % 3) * 3.95; y = 2.4 + (i // 3) * 2.0
    rule(s, x, y, 3.6, BLACK, name=f'!!sr{i}')
    text(s, f'!!sh{i}', x, y + 0.18, 3.6, 0.5, h_, size=19, color=BLACK, bold=True)
    text(s, f'!!sb{i}', x, y + 0.68, 3.6, 1.0, b, size=15, color=GREY, spacing=1.2)
foot(s, Z + '16'); morph(s)
notes(s, "Address screen and data worries directly: the app never tracks children; parents confirm activities themselves with a separate login and PIN; no ads; minimal data with parental consent, following India’s DPDP Act for children.")

# ===================== PART 6 · THE PILOT =====================
# 17 — the proposal
s = slide(BLACK)
box(s, '!!panel', 0, 0, 13.333, 7.5, BLACK)
kicker(s, 'Our proposal')
head(s, 'A small, simple four-week pilot')
for i, (n, u, b) in enumerate([('1', 'class group', 'Class 3, 4 or 5 — sections of your choice'), ('4', 'weeks', 'Two short sessions a week'), ('6–8', 'stories', 'Maths and money first, science next'), ('[₹__]', 'cost to school', '[Free pilot / to be agreed]')]):
    x = 0.9 + i * 2.95
    text(s, f'!!bn{i}', x, 2.35, 2.75, 1.2, n, size=60, color=WHITE, font=SERIF)
    rule(s, x, 3.75, 2.6, '4A4A4A', name=f'!!br{i}')
    text(s, f'!!bu{i}', x, 3.9, 2.75, 0.5, u.upper(), size=12, color=WHITE, bold=True, tracking=250)
    text(s, f'!!bb{i}', x, 4.4, 2.6, 1.0, b, size=15, color=LGREY, spacing=1.2)
text(s, '!!sub', 0.9, 5.85, 11, 0.5, 'Episode 1 is ready today; the remaining stories are in production for the pilot dates.', size=14, color=GREY)
foot(s, Z + '17'); morph(s)
notes(s, "Keep the ask small and low-risk. Fill in the cost before the meeting. Be honest that Episode 1 is complete and the rest are being produced for the pilot schedule.")

# 18 — how we'll know + timeline
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'Measured together — without tracking any child')
head(s, 'Four weeks, step by step')
rule(s, 0.9, 3.0, 11.55, BLACK, name='!!track')
for i, (w, h_, b) in enumerate([('Week 0', 'Set-up', 'Choose sections. Parent consent note. A 20-minute teacher walkthrough.'), ('Weeks 1–2', 'Stories 1–4', 'In class, twice a week. First home missions.'),
                                 ('Week 3', 'Stories 5–8', 'Children lead the answers. More missions.'), ('Week 4', 'Review', 'Teacher feedback, participation, missions approved, children’s own words — shared with you.')]):
    x = 0.9 + i * 2.95
    box(s, f'!!dot{i}', x, 2.88, 0.24, 0.24, BLACK, kind=MSO_SHAPE.OVAL)
    text(s, f'!!wk{i}', x, 2.3, 2.7, 0.4, w.upper(), size=11, color=GREY, bold=True, tracking=250)
    text(s, f'!!wh{i}', x, 3.35, 2.7, 0.5, h_, size=22, color=BLACK, font=SERIF)
    text(s, f'!!wb{i}', x, 3.95, 2.6, 1.8, b, size=14, color=GREY, spacing=1.25)
foot(s, Z + '18'); morph(s)
notes(s, "Agree a start date. Measurement respects privacy: teacher feedback forms, class participation, a count of approved missions, and children’s own drawings or sentences — reviewed with you in week 4, where we decide the next step together.")

# 19 — what we need
s = slide(WHITE)
box(s, '!!panel', 0, 0, 0.35, 7.5, BLACK)
kicker(s, 'To begin')
head(s, 'What we would need from you')
for i, t in enumerate(['A class group for the pilot — Class 3, 4 or 5', 'One teacher who will champion it', 'Two 15-minute slots a week', 'Permission to send a parent consent note']):
    y = 2.4 + i * 0.95
    text(s, f'!!nn{i}', 0.9, y, 0.9, 0.7, f'0{i + 1}', size=32, color=BLACK, font=SERIF)
    text(s, f'!!nt{i}', 1.9, y + 0.12, 9.5, 0.6, t, size=21, color=BLACK)
    rule(s, 1.9, y + 0.78, 8.5, 'D9D9D6', name=f'!!nr{i}')
foot(s, Z + '19'); morph(s)
notes(s, "Close with a question, not a statement: “Which class would you like to begin with, and could we start on [date]?” Then wait.")

# 20 — close
s = slide(BLACK)
box(s, '!!panel', 9.4, 0, 3.933, 7.5, '1C1C1C')
text(s, '!!head', 0.9, 2.0, 8.3, 2.6, [[('Together, let’s help', {})], [('every child learn to ', {}), ('think.', {'italic': True})]], size=56, color=WHITE, font=SERIF, spacing=0.98)
rule(s, 0.9, 4.55, 1.4, WHITE)
text(s, '!!sub', 0.9, 4.8, 8, 1.4, [['Thank you.'], [('[Your name]   ·   [Phone]   ·   [Email]', {'size': 15, 'color': LGREY})], [('zungga.com', {'size': 15, 'color': WHITE, 'bold': True})]], size=24, color=WHITE, font=SERIF, spacing=1.35)
text(s, 'tag', 9.6, 3.35, 3.5, 0.8, 'Zungga', size=40, color=WHITE, font=SERIF, align='c')
morph(s, 1800)
notes(s, "Thank the principal. Offer to send the episode and a one-page pilot summary the same day.")

out = os.path.join(HERE, 'Zungga-School-Pilot-Tal.pptx'); prs.save(out); print('saved', out, len(prs.slides._sldIdLst), 'slides')
