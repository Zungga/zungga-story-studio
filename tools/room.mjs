// The Writers' Room: personas built from your cast description, a hidden mystery, a closed world, a live in-character
// session run by a Showrunner (game master), then an outline in episodes and a full script → the Story step.
// State lives in projects/<id>/room.json. The kids never see the hidden solution; the Showrunner and the culprit know.
import fs from 'node:fs';
import path from 'node:path';
import { chat, json, backend } from './llm.mjs';

const COLORS = ['#7c3aed', '#ec4899', '#0ea5e9', '#f59e0b', '#16a34a', '#ef4444', '#14b8a6', '#8b5cf6', '#f97316', '#64748b', '#a855f7', '#0891b2'];
export const EMOTION_BEATS = ['joy', 'excitement', 'fear', 'sadness', 'anger', 'mistake', 'guilt', 'apology', 'pride', 'surprise'];
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const write = (f, v) => { const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(v, null, 2)); fs.renameSync(t, f); };
const slug = (s) => String(s || 'x').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'x';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function defaultRoom() {
  return {
    version: 1, stage: 'setup', running: false,
    setup: { premise: '', castText: '', worldText: '', refs: [], theme: '', tone: 'warm, funny, exciting', age: '7-12', minutes: 30, episodeSec: 60 },
    personas: [], bible: null, world: null, plan: [], planStep: 0, memory: { summary: '', decisions: [] }, messages: [], outline: null, script: {},
  };
}
export class Room {
  constructor({ root, dir, settings, broadcast, project }) { Object.assign(this, { root, dir, settings, broadcast, project }); this.file = path.join(dir, 'room.json'); this.stopFlag = false; }
  load() { this.r = { ...defaultRoom(), ...read(this.file, {}) }; return this.r; }
  save(event = 'room-state') { write(this.file, this.r); this.broadcast({ type: event, project: this.project }); }
  get opts() { return { root: this.root, settings: this.settings() }; }
  post(who, text, kind = 'chat', extra = {}) {
    const m = { id: uid(), ts: Date.now(), who, text: String(text).trim(), kind, ...extra }; this.r.messages.push(m);
    write(this.file, this.r); this.broadcast({ type: 'room-msg', project: this.project, msg: m }); return m;
  }
  name(id) { return id === 'director' ? 'Director' : id === 'showrunner' ? 'Showrunner' : id === 'narrator' ? 'Narrator' : (this.r.personas.find((p) => p.id === id)?.name || id); }
  log(n = 24) { return this.r.messages.filter((m) => m.kind !== 'hidden').slice(-n).map((m) => `${this.name(m.who)}: ${m.text}`).join('\n'); }

  // ---------- 1. personas from the cast description ----------
  async createPersonas({ only = null } = {}) {
    const s = this.r.setup, existing = only ? this.r.personas : [];   // re-create replaces the whole cast
    const text = only || s.castText;
    // step 1: who is in the story (small, reliable answer)
    const roster = await json([{ role: 'system', content: SYS_WRITER }, { role: 'user', content: `Cast description from the director:\n<<<${text}>>>\nList EVERY character it describes (no extras). kind is one of hero, main, supporting, adult, suspect. gender is boy or girl for kids, man or woman for adults. JSON: {"characters":[{"name":"","kind":"","gender":"","age":10,"gist":"one line from the description"}]}` }], { ...this.opts, maxTokens: 900, temperature: 0.3 });
    const names = arrayIn(roster, 'characters').filter((c) => c && c.name && !existing.some((p) => p.name.toLowerCase() === String(c.name).toLowerCase()));
    if (!names.length) throw new Error('No characters found in the description');
    const made = []; if (!only) this.r.personas = [];   // re-create starts from an empty cast (no stale ids)
    // step 2: one detailed card per character (each knows the others)
    for (const c of names) {
      const others = [...existing, ...names].map((x) => x.name).filter((n) => n !== c.name).join(', ');
      const card = await json([{ role: 'system', content: SYS_WRITER }, { role: 'user', content: `Story premise: ${s.premise}\nTheme: ${s.theme || '(choose)'} · Tone: ${s.tone} · Audience age: ${s.age}\nFull cast description:\n<<<${s.castText}${only ? '\n' + only : ''}>>>\nOther characters: ${others}\n
Write the persona card for ${c.name} (${c.kind}, ${c.gender || ""}, age ${c.age || ""}: ${c.gist}). Keep everything the director said; invent what is missing to fit the story and list invented field names in "suggested".
Give a clear goal in THIS story, a part in the plot, and an emotional journey with real lows (a mistake, guilt, sadness or anger) and highs (joy, pride).
JSON: {"name":"${c.name}","kind":"${c.kind}","age":10,"gender":"girl|boy|woman|man","look":"","role":"","goal":"","plotPart":"","strengths":[""],"weaknesses":[""],"fear":"","secret":"","arc":{"start":"","turn":"","end":""},"emotions":[{"beat":"joy|excitement|fear|sadness|anger|mistake|guilt|apology|pride|surprise","moment":""}],"voiceStyle":"","catchphrases":[""],"relationships":[{"with":"name","feeling":""}],"suggested":[""]}` }],
        { ...this.opts, maxTokens: 1100, temperature: 0.75 });
      const adultish = /adult|suspect/i.test(c.kind || '') || /^(man|woman)$/i.test(c.gender || '');
      const p = this.normPersona({ ...card, name: card.name || c.name, kind: String(c.kind || card.kind || '').toLowerCase(), gender: String(c.gender || card.gender || '').toLowerCase(), age: +c.age || +card.age || (adultish ? 40 : 10) }, existing.length + made.length);
      made.push(p); if (only) this.r.personas.push(p); else this.r.personas = [...made];
      this.post('showrunner', `Persona ready: ${p.name} (${p.kind}) — ${p.goal}`, 'system'); this.save();
    }
    if (!only && this.r.stage === 'setup') this.r.stage = 'personas';
    this.post('showrunner', only ? `Added ${made.map((p) => p.name).join(', ')} to the cast.` : `All ${made.length} personas are built. Check their cards — edit anything, then design the mystery.`, 'system');
    this.save(); return made;
  }
  normPersona(p, i) {
    const id = this.r.personas.some((x) => x.id === slug(p.name)) ? slug(p.name) + '_' + i : slug(p.name);
    const one = (v, allowed) => { const parts = String(v || '').toLowerCase().split(/[|/,]/).map((x) => x.trim()).filter(Boolean); return parts.length > 2 ? '' : (parts.find((x) => allowed.includes(x)) || parts[0] || ''); };   // a copied template ("a|b|c") means "not answered"
    p.kind = one(p.kind, ['hero', 'main', 'supporting', 'adult', 'suspect']) || 'main';
    const kid = (+p.age || 10) < 16; let g = one(p.gender, ['boy', 'girl', 'man', 'woman']);
    if (!g) g = /\b(she|her|girl|woman|ms\.?|mrs\.?|chef bella)\b/i.test(JSON.stringify(p)) ? 'girl' : 'boy';
    if (kid && g === 'man') g = 'boy'; if (kid && g === 'woman') g = 'girl'; if (!kid && g === 'boy') g = 'man'; if (!kid && g === 'girl') g = 'woman';
    const voice = p.voice || (kid ? (g.startsWith('g') || g.startsWith('w') ? 'girl' : (/protect|power|tough/i.test(p.role + p.kind) ? 'boy-deep' : 'boy-calm')) : (g.startsWith('m') || g.startsWith('b') ? 'boy-deep' : 'narrator'));   // grown men get the deepest voice
    const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(String).filter(Boolean);
    return { id, name: String(p.name), kind: p.kind, age: +p.age || 10, gender: g, look: p.look || '', role: p.role || '', goal: p.goal || '', plotPart: p.plotPart || '',
      strengths: arr(p.strengths), weaknesses: arr(p.weaknesses), fear: p.fear || '', secret: p.secret || '', arc: { start: p.arc?.start || '', turn: p.arc?.turn || '', end: p.arc?.end || '' },
      emotions: (p.emotions || []).filter((e) => e && e.beat).flatMap((e) => String(e.beat).toLowerCase().split(/[|/,]/).map((b) => b.trim()).filter(Boolean).slice(0, 2).map((b) => ({ beat: b, moment: e.moment || '' }))), voiceStyle: p.voiceStyle || '', catchphrases: arr(p.catchphrases),
      relationships: (p.relationships || []).filter((r) => r && r.with).map((r) => ({ with: r.with, feeling: r.feeling || '' })), suggested: arr(p.suggested), voice, color: COLORS[i % COLORS.length] };
  }
  card(p, { hidden = false } = {}) {
    return `${p.name} — ${p.kind}, ${p.age}, ${p.gender}. Role: ${p.role}. Goal: ${p.goal}. Part in the plot: ${p.plotPart}.
Strengths: ${p.strengths.join(', ')}. Weaknesses: ${p.weaknesses.join(', ')}. Fear: ${p.fear}.${hidden && p.secret ? ' Secret: ' + p.secret + '.' : ''}
Arc: ${p.arc.start} → ${p.arc.turn} → ${p.arc.end}. Speaks: ${p.voiceStyle}${p.catchphrases.length ? '; says things like "' + p.catchphrases.join('", "') + '"' : ''}.
Relationships: ${p.relationships.map((r) => `${r.with}: ${r.feeling}`).join('; ')}`;
  }
  // ---------- 2. the hidden mystery + the session plan ----------
  async designMystery(note = '') {
    const s = this.r.setup, cast = this.r.personas.map((p) => this.card(p, { hidden: true })).join('\n\n');
    const kids = this.r.personas.filter((p) => p.kind === 'hero' || p.kind === 'main'), adults = this.r.personas.filter((p) => !kids.includes(p));
    const ctx = `Premise: ${s.premise}\nAudience ${s.age}. World: ${s.worldText || '(design)'}\nCast:\n${cast}\n${s.ideas?.length ? 'Director notes:\n' + s.ideas.join('\n') : ''}\n${note ? 'Director instruction: ' + note : ''}`;
    // a) the hidden solution: culprit, motive, exactly 4 clues (each found by a different kid's strength), 1-2 red herrings
    let bible = null;
    for (let k = 0; k < 3 && !bible; k++) {
      const out = await json([{ role: 'system', content: SYS_WRITER }, { role: 'user', content: `${ctx}
Design a FAIR kids' mystery. The culprit is one of these adults: ${adults.map((a) => a.name).join(', ')}. Their motive is understandable (no evil), and they make amends at the end.
Write EXACTLY 4 clues. Each clue is found by a DIFFERENT kid (${kids.map((x) => x.name).join(', ')}) using that kid's strength, in a different area. Together the 4 clues point clearly to the culprit.
Write 1 or 2 red herrings that make the kids wrongly suspect someone else (one of them should be a kid wrongly blamed, so there is guilt and an apology later).
JSON: {"culprit":"name","motive":"","how":"what they did and when","clues":[{"id":"c1","clue":"","where":"area","foundBy":"kid name","how":"how their strength finds it","pointsTo":"what it shows"}],"redHerrings":[{"clue":"","suspect":"name","why":"","clearedBy":""}],"reveal":"how the kids prove it","lesson":""}` }], { ...this.opts, maxTokens: 1800, temperature: 0.7 });
      const clues = arrayIn(out.clues || [], 'clues').filter((c) => c && c.clue);
      if (out.culprit && clues.length >= 3) bible = { culprit: out.culprit, motive: out.motive, how: out.how, clues: clues.slice(0, 4).map((c, i) => ({ ...c, id: 'c' + (i + 1) })), redHerrings: arrayIn(out.redHerrings || [], 'redHerrings').filter((r) => r && r.clue), reveal: out.reveal, lesson: out.lesson };
    }
    if (!bible) throw new Error('Could not design a complete mystery — try again (or switch the room to cloud AI in Settings)');
    // b) the plan: the structure is fixed (so the mystery stays fair); the AI fills each step
    const C = bible.clues, R0 = bible.redHerrings[0], kidNames = kids.map((x) => x.name);
    const skeleton = [
      ['arrival', 'The kids arrive, excited; fun first look around', '', 'excitement'], ['tour', 'Guided tour; meet the adults; plant small details', '', 'joy'],
      ['discovery', 'The big problem is discovered — everyone is shocked', '', 'surprise'], ['decide', 'The kids decide to become detectives; they make a plan', '', 'determination'],
      ['clue', `First clue found by ${C[0]?.foundBy}`, 'c1', 'curiosity'], ['suspect', `Suspicion grows${R0 ? ' toward ' + R0.suspect : ''} (red herring)`, '', 'worry'],
      ['clue', `Second clue found by ${C[1]?.foundBy}`, 'c2', 'excitement'], ['mistake', 'A kid\'s weakness causes a mistake that sets them back', '', 'mistake'],
      ['low', 'The team argues; someone is wrongly blamed; low point', '', 'sadness'], ['guilt', 'Guilt and apology; the team makes up', '', 'guilt'],
      ['clue', `Third clue found by ${C[2]?.foundBy}`, 'c3', 'hope'], ['clear', R0 ? `The red herring is cleared (${R0.clearedBy || 'new evidence'})` : 'A false lead is cleared', '', 'relief'],
      ['clue', `Fourth clue found by ${C[3]?.foundBy || C[2]?.foundBy}`, C[3] ? 'c4' : '', 'breakthrough'], ['plan', 'The kids put the clues together and set a plan to prove it', '', 'determination'],
      ['reveal', `The reveal: ${bible.culprit} is confronted kindly with the clues`, '', 'surprise'], ['amends', `${bible.culprit} explains and makes amends`, '', 'forgiveness'],
      ['end', `Celebration and the lesson: ${bible.lesson || 'teamwork'}`, '', 'pride'],
    ];
    // fill the steps one at a time (each sees the steps before it) — reliable even on a small local model
    const got = [], names = this.r.personas.map((p) => p.name).join(', ');
    for (let i = 0; i < skeleton.length; i++) {
      const st = skeleton[i], cl = C.find((c) => c.id === st[2]);
      const f = await json([{ role: 'system', content: SYS_WRITER }, { role: 'user', content: `${ctx}\nHidden solution (do not reveal before the reveal step): ${bible.culprit} — ${bible.how}.\nAreas of the place: ${s.worldText || 'choose fitting areas'}\nStory steps so far:\n${got.map((g, k) => `${k + 1}. [${g.room}] ${g.goal}`).join('\n') || '(none yet)'}
Write step ${i + 1} of ${skeleton.length}: "${st[1]}"${cl ? `. It MUST show this clue being found by ${cl.foundBy} in ${cl.where}: ${cl.clue} (${cl.how})` : ''}. Main feeling: ${st[3]}.
JSON: {"room":"area","goal":"what happens, 2 concrete sentences","focus":["2-4 names from: ${names}"]}` }], { ...this.opts, maxTokens: 400, temperature: 0.7 });
      got.push({ n: i + 1, room: f.room || cl?.where || '', goal: f.goal || st[1], focus: arrayIn(f.focus || [], 'focus') });
    }
    this.r.bible = bible;
    this.r.plan = skeleton.map((st, i) => { const f = got.find((x) => +x.n === i + 1) || got[i] || {}; const cl = C.find((c) => c.id === st[2]);
      if (cl && !(String(f.goal || '').toLowerCase().includes(String(cl.foundBy).toLowerCase()))) f.goal = `${cl.foundBy} finds a clue in ${cl.where}: ${cl.clue}`;   // pin clue steps to their clue
      return { step: i + 1, kind: st[0], room: f.room || cl?.where || '', goal: f.goal || st[1], clue: st[2], focus: (f.focus && f.focus.length ? f.focus : cl ? [cl.foundBy] : kidNames.slice(0, 3)), emotion: st[3], done: false }; });
    this.r.planStep = 0;
    for (const p of this.r.personas) p.isCulprit = p.name === bible.culprit;
    this.r.stage = 'mystery';
    this.post('showrunner', `The mystery is ready (only you, the Director, can see the solution on the right): ${C.length} clues, ${bible.redHerrings.length} red herring${bible.redHerrings.length === 1 ? '' : 's'}, ${this.r.plan.length} story steps. Next: design the world, then start the room.`, 'system');
    this.save(); return this.r.bible;
  }
  // ---------- 3. the closed world ----------
  async designWorld(note = '') {
    const s = this.r.setup;
    const rooms = [...new Set(this.r.plan.map((p) => p.room).filter(Boolean))];
    const out = await json([{ role: 'system', content: SYS_WRITER }, { role: 'user', content: `Premise: ${s.premise}\nWorld description from the director: ${s.worldText || '(none — design it)'}\nRooms the plan already uses: ${rooms.join(', ')}\n${s.refs?.length ? 'The director uploaded reference images for the look (' + s.refs.length + ').' : ''}\n${note}
Design ONE closed, connected location for the whole story, so every scene happens inside it and every camera angle shows a full, believable space. 8-14 areas including corridors / outside yard. Each area: what it looks like, what is in it (props, machines, decor that fills all walls), mood and lighting, and which areas it connects to.
JSON: {"name":"","description":"","style":"","rooms":[{"id":"","name":"","description":"","props":[""],"mood":"","lighting":"","connects":["room ids"]}]}` }],
      { ...this.opts, maxTokens: 3000, temperature: 0.7 });
    this.r.world = { name: out.name, description: out.description, style: out.style, rooms: (out.rooms || []).map((r) => ({ ...r, id: slug(r.id || r.name) })) };
    this.r.stage = 'world';
    this.post('showrunner', `World ready: ${this.r.world.name} with ${this.r.world.rooms.length} connected areas. Press "Start the room" and the characters will begin.`, 'system');
    this.save(); return this.r.world;
  }

  // ---------- 4. the live session ----------
  async director(text) {
    this.post('director', text);
    if (this.r.stage === 'setup' || this.r.stage === 'personas') { (this.r.setup.ideas ||= []).push(text); this.save(); this.post('showrunner', 'Noted — I\'ll use that when we plan.', 'system'); return; }
    const out = await json([{ role: 'system', content: SYS_SHOWRUNNER(this) }, { role: 'user', content: `Recent room:\n${this.log(16)}\n\nThe DIRECTOR (your boss — always obey) just said: "${text}"\nRemaining plan:\n${this.planText(true)}\nDecide what changes. JSON: {"reply":"1-2 sentences to the director confirming what you'll do","replan":true|false,"instruction":"what to change in the plan, if replan","personaChanges":[{"name":"","field":"","value":""}]}` }], { ...this.opts, maxTokens: 600, temperature: 0.4 });
    this.post('showrunner', out.reply || 'Understood.');
    for (const ch of out.personaChanges || []) { const p = this.r.personas.find((x) => x.name === ch.name); if (p && ch.field in p) p[ch.field] = ch.value; }
    if (out.replan) await this.replan(out.instruction || text);
    this.r.memory.decisions.push(text); this.save();
  }
  planText(remainingOnly = false) { return this.r.plan.filter((p, i) => !remainingOnly || i >= this.r.planStep).map((p) => `${p.step}. [${p.room}] ${p.goal}${p.clue ? ' (clue ' + p.clue + ')' : ''} — feeling: ${p.emotion}`).join('\n'); }
  async replan(instruction) {
    const keep = this.r.plan.slice(0, this.r.planStep);
    const out = await json([{ role: 'system', content: SYS_SHOWRUNNER(this) }, { role: 'user', content: `Story so far:\n${this.r.memory.summary}\n${this.log(10)}\nSteps already played:\n${keep.map((p) => p.step + '. ' + p.goal).join('\n')}\nRemaining plan:\n${this.planText(true)}\nDirector's change: "${instruction}"\nRewrite ONLY the remaining steps to follow the change, keeping the mystery fair and every clue used. JSON: {"plan":[{"room":"","goal":"","clue":"","focus":[""],"emotion":""}],"bibleChanges":{"culprit":"","motive":""}}` }], { ...this.opts, maxTokens: 2500, temperature: 0.6 });
    const rest = (out.plan || []).map((p, i) => ({ ...p, step: keep.length + i + 1, done: false }));
    this.r.plan = [...keep, ...rest];
    if (out.bibleChanges?.culprit && out.bibleChanges.culprit !== this.r.bible.culprit) { this.r.bible.culprit = out.bibleChanges.culprit; if (out.bibleChanges.motive) this.r.bible.motive = out.bibleChanges.motive; for (const p of this.r.personas) p.isCulprit = p.name === this.r.bible.culprit; }
    this.post('showrunner', `Plan updated: ${rest.length} steps from here.`, 'system'); this.save();
  }
  async run({ steps = 999 } = {}) {
    if (this.r.running) return; this.r.running = true; this.stopFlag = false; this.r.stage = 'discussion'; this.save();
    try {
      let n = 0;
      while (!this.stopFlag && this.r.planStep < this.r.plan.length && n < steps) { await this.playStep(); n++; }
      if (this.r.planStep >= this.r.plan.length && !this.stopFlag) this.post('showrunner', 'That\'s the whole story played through! Press "Make the outline" to turn it into episodes.', 'system');
    } catch (e) { this.post('showrunner', 'I hit a problem: ' + e.message, 'system'); }
    this.r.running = false; this.save();
  }
  stop() { this.stopFlag = true; }
  async playStep() {
    const step = this.r.plan[this.r.planStep], clue = step.clue && this.r.bible.clues.find((c) => c.id === step.clue);
    // game master narrates the moment (knows everything, reveals only what the kids can see)
    const gm = await chat([{ role: 'system', content: SYS_SHOWRUNNER(this) }, { role: 'user', content: `Story so far: ${this.r.memory.summary || '(beginning)'}\nRecent:\n${this.log(10)}\n\nNow play step ${step.step}: [${step.room}] ${step.goal}. Main feeling: ${step.emotion}. ${clue ? `Make the clue appear naturally so ${clue.foundBy} can find it with their strength: ${clue.clue} (${clue.how}).` : ''}
Write 2-4 vivid sentences as the narrator that MAKE THIS STEP'S EVENT HAPPEN NOW (not just scenery): where they are, what happens, what the ADULTS do or say (adults may speak in quotes). Do NOT write any lines or actions for the kids — they will speak for themselves. End by putting a question or problem in front of ${(step.focus || []).join(', ')}. Never reveal the culprit. Do not start with 'Narrator:'.` }], { ...this.opts, maxTokens: 260, temperature: 0.85 });
    this.post('narrator', gm.replace(/^\s*Narrator:\s*/i, '').trim(), 'chat', { step: step.step, room: step.room });
    // the characters react, in character
    const order = this.speakers(step);
    for (const p of order) {
      if (this.stopFlag) break;
      const line = await chat([{ role: 'system', content: SYS_PERSONA(this, p) }, { role: 'user', content: `What has happened so far: ${this.r.memory.summary || '(the visit just began)'}\nRecent:\n${this.log(12)}\n\nYou are ${p.name}. Reply with ONLY what you say out loud right now (1-2 short sentences a 10-year-old would say), optionally starting with ONE short action in *asterisks*. No narration, no 'I say', no describing your own feelings in prose — show them in your words. React to the LATEST thing that happened and to what the others just said; add something NEW that moves the mystery forward (an idea, a question, a discovery, a disagreement). Do not repeat anything already said.${(() => { const mine = this.r.messages.filter((m) => m.who === p.id).slice(-4).map((m) => m.text); return mine.length ? ` Your last lines were: ${mine.map((t) => '"' + t + '"').join(' ')} — say something different, with different words.` : ''; })()} ${this.r.messages.filter((m) => m.who === p.id).slice(-6).some((m) => p.catchphrases.some((c) => c && m.text.toLowerCase().includes(c.toLowerCase().slice(0, 18)))) ? 'Do NOT use your catchphrase this time.' : 'Use a catchphrase at most rarely.'}` }], { ...this.opts, maxTokens: 90, temperature: 0.85 });
      this.post(p.id, clean(line, p.name), 'chat', { step: step.step });
    }
    step.done = true; this.r.planStep++;
    if (this.r.planStep % 3 === 0) await this.summarise();
    this.save();
  }
  speakers(step) {
    const focus = new Set((step.focus || []).map((s) => s.toLowerCase()));
    const pick = this.r.personas.filter((p) => focus.has(p.name.toLowerCase()));
    const heroes = this.r.personas.filter((p) => (p.kind === 'hero' || p.kind === 'main') && !pick.includes(p));
    while (pick.length < 3 && heroes.length) pick.push(heroes.splice((this.r.planStep * 7 + pick.length) % heroes.length, 1)[0]);
    return pick.slice(0, 5);
  }
  async summarise() {
    this.r.memory.summary = await chat([{ role: 'system', content: 'You keep the story memory for a writers room. Be factual and compact.' }, { role: 'user', content: `Previous summary: ${this.r.memory.summary}\nNew events:\n${this.log(30)}\nWrite the updated summary of the WHOLE story so far in under 180 words: what happened, which clues were found by whom, who suspects whom, how each kid feels now.` }], { ...this.opts, maxTokens: 320, temperature: 0.3 });
  }

  // ---------- 5. outline in episodes ----------
  async makeOutline() {
    const s = this.r.setup, n = Math.max(1, Math.round(s.minutes * 60 / s.episodeSec));
    await this.summarise();
    const out = await json([{ role: 'system', content: SYS_WRITER }, { role: 'user', content: `Turn this played story into ${n} episodes of about ${s.episodeSec} seconds each (${s.minutes} minutes total).\nStory memory: ${this.r.memory.summary}\nPlan that was played:\n${this.planText()}\nHidden solution: ${this.r.bible.culprit} — ${this.r.bible.how}. Reveal: ${this.r.bible.reveal}. Lesson: ${this.r.bible.lesson}\nCharacters: ${this.r.personas.map((p) => p.name + ' (' + p.kind + ')').join(', ')}\nWorld areas: ${(this.r.world?.rooms || []).map((r) => r.name).join(', ')}
Each episode: a title, a one-line summary, 2-5 scenes; each scene has an area, the characters present, what happens and the main feeling of each character. Every main character's emotional journey must include joy, a mistake, guilt or sadness, anger or fear, and pride by the end; end most episodes on a small hook.
JSON: {"episodes":[{"n":1,"title":"","summary":"","scenes":[{"title":"","room":"","characters":[""],"what":"","feelings":{"name":"emotion"}}]}]}` }], { ...this.opts, maxTokens: 6000, temperature: 0.6 });
    this.r.outline = { episodes: (out.episodes || []).map((e, i) => ({ n: i + 1, title: e.title, summary: e.summary, scenes: (e.scenes || []).map((sc, k) => ({ id: `e${i + 1}s${k + 1}`, ...sc })) })) };
    this.r.stage = 'outline';
    this.post('showrunner', `Outline ready: ${this.r.outline.episodes.length} episodes, ${this.r.outline.episodes.reduce((a, e) => a + e.scenes.length, 0)} scenes. Check the emotion map, then "Write the scenes".`, 'system');
    this.save(); return this.r.outline;
  }
  // ---------- 6. the script ----------
  async writeEpisode(ep) {
    const s = this.r.setup, words = Math.round(s.episodeSec * 2.3);
    const prev = this.r.outline.episodes[ep.n - 2];
    const out = await json([{ role: 'system', content: SYS_WRITER }, { role: 'user', content: `Write episode ${ep.n} "${ep.title}" as a script (about ${words} spoken words, short lines kids enjoy).\nEpisode: ${ep.summary}\nScenes:\n${ep.scenes.map((sc) => `- ${sc.id} [${sc.room}] ${sc.what} · present: ${(sc.characters || []).join(', ')} · feelings: ${JSON.stringify(sc.feelings || {})}`).join('\n')}\n${prev ? 'Previous episode ended: ' + prev.summary : ''}\nCharacters:\n${this.r.personas.map((p) => `${p.name}: ${p.voiceStyle}; catchphrases ${p.catchphrases.join(' / ')}`).join('\n')}
Lines by characters, plus a few short "Narrator" lines. Each line: who, text (one or two sentences), emotion (happy, excited, sad, angry, worried, surprised, thinking, guilty, proud, scared, calm), action (what they do), camera (close-up, wide, over the shoulder, push in, two-shot…).
JSON: {"scenes":[{"id":"","lines":[{"who":"","text":"","emotion":"","action":"","camera":""}]}]}` }], { ...this.opts, maxTokens: 3000, temperature: 0.75 });
    for (const sc of out.scenes || []) if (sc.id) this.r.script[sc.id] = { lines: (sc.lines || []).filter((l) => l && l.text) };
    this.save();
  }
  async writeScript(onProgress) {
    const eps = this.r.outline.episodes;
    for (const ep of eps) { if (this.stopFlag) break; if (ep.scenes.every((sc) => this.r.script[sc.id])) continue; await this.writeEpisode(ep); onProgress && onProgress(ep.n / eps.length, `Episode ${ep.n} of ${eps.length} written`); }
    this.r.stage = 'scenes'; this.post('showrunner', 'The script is written. Read it, then "Send to Story".', 'system'); this.save();
  }
  // ---------- 7. hand-off → draft for the Story step ----------
  toDraft(world = 'humans') {
    const cast = this.r.personas.map((p) => ({ id: p.id, preset: presetFor(p, world), label: p.name, voice: p.voice }));
    const scenes = []; let id = 1;
    for (const ep of this.r.outline.episodes) for (const sc of ep.scenes) {
      const present = (sc.characters || []).map((n) => this.r.personas.find((p) => p.name.toLowerCase() === String(n).toLowerCase())?.id).filter(Boolean);
      for (const l of this.r.script[sc.id]?.lines || []) {
        const sp = this.r.personas.find((p) => p.name.toLowerCase() === String(l.who).toLowerCase());
        scenes.push({ id: id++, episode: ep.n, episodeTitle: ep.title, title: `E${ep.n} · ${sc.title || sc.room}`, place: sc.room, room: sc.room, narration: l.text, characters: [...new Set([...(sp ? [sp.id] : []), ...present])].slice(0, 5),
          talking: sp ? sp.id : undefined, voice: sp ? sp.voice : 'narrator', emotion: l.emotion, action: l.action, cameraNote: l.camera, mood: /sad|guilt/.test(l.emotion || '') ? 'sad' : null });
      }
    }
    return { title: this.r.setup.premise.slice(0, 60) || 'Writers room story', world, hero: (this.r.personas.find((p) => p.kind === 'hero') || this.r.personas[0])?.id, cast, scenes, fromRoom: true, worldDesign: this.r.world };
  }
}
function presetFor(p, world) {
  const n = p.name.toLowerCase(), girl = /^(g|w)/.test(p.gender);
  if (world === 'humans' || world === 'explorers') { if (['kai', 'rio', 'tara', 'mira', 'jax'].includes(n)) return n; if (p.age >= 16 || p.kind === 'adult') return adultPreset(p, girl); return girl ? (p.age < 16 ? 'mira' : 'tara') : (p.age < 16 ? 'rio' : 'kai'); }
  if (world === 'toon') { if (p.kind === 'hero') return 'hero'; if (p.age >= 16) return girl ? 'mom' : /chef|owner|shop/i.test(p.role) ? 'shop_owner' : 'dad'; return girl ? 'friend_girl' : 'friend_boy'; }
  return girl ? 'mira' : 'rio';
}
// the realistic / explorer sets only have kids — adults come from the people world (girls/women keep to the Mom or saree looks)
function adultPreset(p, girl) {
  const r = (p.role + ' ' + p.name + ' ' + p.look).toLowerCase();
  if (girl) return /seller|vendor|cook|chef|aunt|grand/.test(r) ? 'vegetable_seller' : p.age < 22 ? 'older_sister' : 'mom';
  if (/guard|security|police|watch/.test(r)) return 'security_guard';
  if (/inspector|manager|boss|officer|mayor|principal/.test(r)) return 'bank_manager';
  if (/chef|cook|shop|owner|baker|grocer|seller|vendor|keeper/.test(r)) return 'shopkeeper';
  return p.age < 22 ? 'older_brother' : 'dad';
}
function arrayIn(o, key) { if (Array.isArray(o)) return o; if (o && Array.isArray(o[key])) return o[key]; for (const v of Object.values(o || {})) if (Array.isArray(v)) return v; return []; }
const clean = (t, name) => {   // keep it a spoken line: no speaker prefix, no prose tails, at most ~3 sentences
  let s = String(t).replace(new RegExp('^\\s*' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*:\\s*', 'i'), '').replace(/^Narrator:\s*/i, '').trim();
  s = s.replace(/\s*(I|she|he) (say|said|ask|asked|whisper|whispered|reply|replied)[^.!?"]*[.!?]?/gi, '').replace(/^['"]+|['"]+$/g, '').trim();
  if (s.startsWith('*') && (s.match(/\*/g) || []).length === 1) { const q = s.indexOf('"'); s = q > 0 ? s.slice(0, q).trim() + '* ' + s.slice(q) : s + '*'; }   // close a dangling *action*
  s = s.replace(/"/g, '').replace(/\*\s+\*/g, '').trim();
  const parts = s.match(/[^.!?]+[.!?]+["']?|\S[^.!?]*$/g) || [s]; return parts.slice(0, 3).join(' ').replace(/\s+/g, ' ').trim();
};
const SYS_WRITER = `You are the head writer of a kids' animated series (Zungga). Stories are warm, funny and clever, for ages 7-12: real feelings (joy, fear, sadness, anger, mistakes, guilt, apologies, pride), no violence, no scary gore, no romance, kind adults, kids solve problems themselves. Always reply with exactly the JSON asked for.`;
const SYS_SHOWRUNNER = (room) => `You are the SHOWRUNNER and game master of a kids' mystery story writers room. You know the hidden solution and keep the story fair and on plan. The DIRECTOR is your boss: obey their instructions immediately.
Premise: ${room.r.setup.premise}
World: ${room.r.world ? room.r.world.name + ' — ' + room.r.world.description : '(not designed)'}
HIDDEN SOLUTION (never tell the kids): culprit ${room.r.bible?.culprit}; motive ${room.r.bible?.motive}; how ${room.r.bible?.how}.
Adults you voice: ${room.r.personas.filter((p) => p.kind === 'adult' || p.kind === 'suspect' || p.age >= 16).map((p) => room.card(p, { hidden: true })).join('\n') || 'none'}`;
const SYS_PERSONA = (room, p) => `You ARE ${p.name}, a character in a kids' mystery story, improvising your part with the other characters. Stay fully in character — never mention being an AI or a writer.
${room.card(p, { hidden: p.isCulprit || p.age >= 16 })}
${p.isCulprit ? 'You are secretly the one behind the mystery. Hide it, act natural, maybe nervous; never confess unless the evidence is shown to you.' : 'You do NOT know who did it. Only use what you have seen and heard.'}
Your emotional journey should include: ${p.emotions.map((e) => e.beat + ' (' + e.moment + ')').join('; ') || 'joy, a mistake, guilt, pride'}.
Kids' show rules: kind, funny, honest feelings, no bad words.`;
