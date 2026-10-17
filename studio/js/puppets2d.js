/*
 * Zungga Story Studio — 2D vector puppets (flat illustration style with soft shading).
 *   const p = Z2D.puppet({ kind: 'kid'|'adult', female, skin, hair, hairColor, outfit:{…}, extras:[] })
 *   p.play(name) · p.setExpression(name) · p.setTalk(level|null) · p.setSeat(seatHeightPx|null) · p.update(dt)
 *   p.draw(ctx, x, groundY, scale, facing)   — feet at (x, groundY); facing 1 = looks right-ish, −1 mirrored
 *   p.anchor('handR'|'handL'|'head'|'chest'|'body')  → { x, y, r } in world px from the last draw
 * Everything is drawn in code (no outside artwork), so every colour can change and nothing gets blurry when the camera zooms.
 */
(() => {
  'use strict';
  const lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt)), smooth = (t) => t * t * (3 - 2 * t);
  const SRC = document.currentScript && document.currentScript.src;
  const LOGO = new Image(); LOGO.src = SRC ? new URL('../assets/brand/zungga-mascot.png', SRC).href : 'assets/brand/zungga-mascot.png';
  // colour helpers
  function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function shade(h, k) { const [r, g, b] = hexToRgb(h); const f = (v) => Math.round(clamp(k >= 1 ? v + (255 - v) * (k - 1) : v * k, 0, 255)); return `rgb(${f(r)},${f(g)},${f(b)})`; }
  // fill a path with a soft top-left light → bottom-right shade gradient and a thin darker edge
  function paint(g, path, col, box, o = {}) {
    const [x0, y0, x1, y1] = box, gr = g.createLinearGradient(x0, y0, x1, y1);
    gr.addColorStop(0, shade(col, o.hi ?? 1.12)); gr.addColorStop(0.55, col); gr.addColorStop(1, shade(col, o.lo ?? 0.78));
    g.fillStyle = gr; g.fill(path);
    if (o.edge !== false) { g.lineWidth = o.lw ?? 3; g.strokeStyle = shade(col, 0.62); g.globalAlpha = 0.55; g.stroke(path); g.globalAlpha = 1; }
  }
  const P = () => new Path2D();
  function capsule(ax, ay, bx, by, r) {   // a limb segment
    const p = P(), a = Math.atan2(by - ay, bx - ax), nx = Math.cos(a + Math.PI / 2) * r, ny = Math.sin(a + Math.PI / 2) * r;
    p.moveTo(ax + nx, ay + ny); p.lineTo(bx + nx, by + ny); p.arc(bx, by, r, a + Math.PI / 2, a - Math.PI / 2, true); p.lineTo(ax - nx, ay - ny); p.arc(ax, ay, r, a - Math.PI / 2, a + Math.PI / 2, true); p.closePath(); return p;
  }
  function rrect(x, y, w, h, r) { const p = P(); p.roundRect(x, y, w, h, r); return p; }
  function ell(x, y, rx, ry, rot = 0) { const p = P(); p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); return p; }

  const EXPR = {
    neutral: { smile: 0.3, open: 0, browY: 0, browTilt: 0, lid: 1, gaze: [0, 0], blush: 0.15 },
    smile: { smile: 0.75, open: 0.15, browY: 0.05, browTilt: 0.05, lid: 0.95, gaze: [0, 0], blush: 0.35 },
    big_smile: { smile: 1, open: 0.75, browY: 0.12, browTilt: 0.1, lid: 0.9, gaze: [0, 0], blush: 0.5 },
    sad: { smile: -0.7, open: 0, browY: -0.02, browTilt: -0.5, lid: 0.72, gaze: [0, 0.6], blush: 0 },
    surprised: { smile: 0, open: 0.9, browY: 0.35, browTilt: 0.05, lid: 1.12, gaze: [0, 0], blush: 0.1 },
    worried: { smile: -0.35, open: 0.15, browY: 0.1, browTilt: -0.55, lid: 0.95, gaze: [-0.3, 0], blush: 0 },
    thinking: { smile: 0.1, open: 0, browY: 0.15, browTilt: 0.2, lid: 0.9, gaze: [0.45, -0.5], blush: 0.1, asym: 0.25 },
    determined: { smile: 0.4, open: 0, browY: -0.05, browTilt: 0.45, lid: 0.82, gaze: [0, 0], blush: 0.1 },
  };

  function puppet(o = {}) {
    const kid = o.kind !== 'adult', fem = !!o.female;
    // proportions in "height units" (H = 1 for a kid, ~1.4 for an adult)
    const U = kid ? { H: 1, head: 0.36, neck: 0.025, torso: 0.25, leg: 0.32, shW: 0.115, hipW: 0.062, arm1: 0.15, arm2: 0.14, limb: 0.032, legR: 0.038 }
      : { H: 1.42, head: 0.33, neck: 0.04, torso: 0.4, leg: 0.6, shW: fem ? 0.15 : 0.17, hipW: fem ? 0.075 : 0.07, arm1: 0.24, arm2: 0.22, limb: fem ? 0.034 : 0.04, legR: fem ? 0.045 : 0.05 };
    if (o.build) { U.shW *= o.build; U.hipW *= o.build; U.limb *= o.build; U.legR *= o.build; }
    const C = { skin: '#c98a5e', hair: '#2b1a12', ...o.colors };
    const OF = { top: 'tshirt', topCol: '#2563eb', jacket: null, bottom: 'shorts', bottomCol: '#3f3f46', shoe: '#f8f8f8', shoe2: '#f97316', ...o.outfit };
    const extras = o.extras || [];
    // ---------- animation state ----------
    const cur = { ...EXPR.neutral, asym: 0 }, target = { ...cur };
    let clip = 'idle', clipT = 0, prev = null, blend = 1, last = null, time = 0, blinkT = 1 + (o.seed || 0) % 3, blinkK = 0, talk = 0, talkTarget = 0, talkDriven = false, seat = null;
    const anchors = {};
    const zero = () => ({ y: 0, lean: 0, headTilt: 0, headDrop: 0, aR: [0.12, -0.15], aL: [0.12, -0.15], legs: [0, 0], sit: 0, bob: 0 });
    const CLIPS = {
      idle(t, p) { p.bob = Math.sin(t * 2) * 0.004; p.headTilt = Math.sin(t * 0.6) * 0.03; p.aR[0] += Math.sin(t * 2) * 0.02; p.aL[0] -= Math.sin(t * 2) * 0.02; },
      talk(t, p) { CLIPS.idle(t, p); p.aR = [0.5 + Math.max(0, Math.sin(t * 2.2)) * 0.25, -1.1]; p.headTilt += Math.sin(t * 2.3) * 0.04; },
      wave(t, p) { CLIPS.idle(t, p); p.aR = [2.55, -0.25 + Math.sin(t * 9) * 0.35]; p.headTilt = 0.06; },
      give(t, p) { CLIPS.idle(t, p); p.aR = [1.25, 0.15]; p.lean = 0.03; },
      think(t, p) { CLIPS.idle(t, p); p.aR = [0.28, -2.55]; p.headTilt = 0.09; },
      cheer(t, p) { const j = Math.max(0, Math.sin(t * 6)); p.y = j * 0.05; p.aR = [2.7, -0.15]; p.aL = [2.7, -0.15]; },
      surprised_hands(t, p) { CLIPS.idle(t, p); p.aR = [0.5, -2.4]; p.aL = [0.5, -2.4]; },
      sit(t, p) { CLIPS.idle(t, p); p.sit = 1; p.aR = [0.15, -0.9]; p.aL = [0.15, -0.9]; },
      sit_sad(t, p) { CLIPS.sit(t, p); p.headDrop = 1; p.lean = 0.04; p.aR = [0.08, -1.2]; p.aL = [0.08, -1.2]; },
    };
    function update(dt) {
      time += dt; clipT += dt;
      const p = zero(); CLIPS[clip](clipT, p); blend = Math.min(1, blend + dt / 0.3);
      if (prev && blend < 1) for (const k in p) p[k] = Array.isArray(p[k]) ? p[k].map((v, i) => lerp(prev[k][i], v, smooth(blend))) : lerp(prev[k], p[k], smooth(blend));
      last = p;
      for (const k of ['smile', 'open', 'browY', 'browTilt', 'lid', 'blush', 'asym']) cur[k] = damp(cur[k], target[k] ?? 0, 10, dt);
      cur.gaze = [damp(cur.gaze[0], target.gaze[0], 8, dt), damp(cur.gaze[1], target.gaze[1], 8, dt)];
      if (clip === 'talk' && !talkDriven) talkTarget = Math.max(0, Math.sin(time * 13) * 0.6 + Math.sin(time * 7.3) * 0.4) * 0.9; else if (!talkDriven) talkTarget = 0;
      talk = damp(talk, talkTarget, 18, dt);
      blinkT -= dt; if (blinkT <= 0) { blinkK = 1; blinkT = 2.4 + ((time * 7.13) % 1) * 3; } blinkK = Math.max(0, blinkK - dt * 7);
    }
    // ---------- drawing ----------
    function draw(g, x, gy, S, facing = 1) {
      const p = last || zero(), k = S;   // k = px per height unit
      g.save(); g.translate(x, gy); g.scale(facing, 1);
      const hipY = lerp(-U.leg * k, seat != null ? -seat : -U.leg * k * 0.55, p.sit) - (p.y + p.bob) * k;   // seated: hips on the seat
      // soft contact shadow
      g.fillStyle = 'rgba(30,20,10,0.22)'; g.beginPath(); g.ellipse(0, 0, U.shW * k * 1.5, U.shW * k * 0.32, 0, 0, Math.PI * 2); g.fill();
      // legs (sitting: thighs come toward camera → shortened)
      const thigh = U.leg * 0.5 * k, shin = U.leg * 0.5 * k;
      for (const s of [-1, 1]) {
        const hx = s * U.hipW * k, hy = hipY, kx = hx + s * p.sit * 0.02 * k, ky = hy + thigh * (1 - p.sit * 0.82), ax = kx, ay = p.sit ? Math.min(0, ky + shin) : 0;
        const bare = OF.bottom === 'shorts' || OF.bottom === 'skirt';
        const legCol = bare ? C.skin : OF.bottomCol;
        if (p.sit) { const sw = U.legR * k * 1.15; paint(g, capsule(hx, hy, kx, ky, sw), OF.bottomCol, [hx - sw, hy, kx + sw, ky]); }
        paint(g, capsule(kx, ky, ax, ay - U.legR * k * 0.6, U.legR * k * (bare ? 0.85 : 1)), legCol, [kx - 20, ky, kx + 20, ay]);
        if (!p.sit) paint(g, capsule(hx, hy, kx, ky, U.legR * k * (bare ? 0.9 : 1.05)), legCol, [hx - 20, hy, hx + 20, ky]);
        if (OF.bottom === 'shorts' && !p.sit) paint(g, capsule(hx, hy, hx + s * 0.004 * k, hy + thigh * 0.55, U.legR * k * 1.25), OF.bottomCol, [hx - 30, hy, hx + 30, hy + thigh * 0.6]);
        if (bare) { g.fillStyle = '#f5f5f4'; g.fill(rrect(ax - U.legR * k * 0.95, ay - U.legR * k * 2.1, U.legR * k * 1.9, U.legR * k * 1.2, 6)); }   // socks
        // shoe
        const sw2 = U.legR * k * 1.55, sh = U.legR * k * 1.15, shoe = P(); shoe.roundRect(ax - sw2 * 0.45 + s * sw2 * 0.25, ay - sh, sw2 * 1.35, sh, [sh * 0.7, sh * 0.7, 4, 4]);
        paint(g, shoe, OF.shoe, [ax - sw2, ay - sh, ax + sw2, ay]);
        if (OF.shoe2) { g.fillStyle = OF.shoe2; g.fillRect(ax - sw2 * 0.45 + s * sw2 * 0.25, ay - sh * 0.32, sw2 * 1.35, sh * 0.16); }
      }
      // torso
      const tTop = hipY - U.torso * k, sh = U.shW * k, hw = U.hipW * k * 1.9;
      const torso = P(); torso.moveTo(-sh, tTop + 0.02 * k); torso.quadraticCurveTo(-sh, tTop - 0.01 * k, -sh * 0.6, tTop - 0.012 * k); torso.lineTo(sh * 0.6, tTop - 0.012 * k); torso.quadraticCurveTo(sh, tTop - 0.01 * k, sh, tTop + 0.02 * k);
      const hem = OF.top === 'kurti' ? hipY + U.leg * 0.38 * k : hipY + 0.02 * k, hemW = OF.top === 'kurti' ? hw * 1.25 : hw * 1.05;
      torso.lineTo(hemW, hem); torso.quadraticCurveTo(0, hem + 0.012 * k, -hemW, hem); torso.closePath();
      if (OF.bottom !== 'shorts' && OF.top !== 'kurti') paint(g, rrect(-hw * 1.02, hipY - 0.03 * k, hw * 2.04, 0.07 * k, 0.02 * k), OF.bottomCol, [-hw, hipY - 0.03 * k, hw, hipY + 0.04 * k]);
      if (OF.bottom === 'shorts') paint(g, rrect(-hw * 1.03, hipY - 0.03 * k, hw * 2.06, 0.08 * k, 0.025 * k), OF.bottomCol, [-hw, hipY - 0.03 * k, hw, hipY + 0.05 * k]);
      paint(g, torso, OF.topCol, [-sh, tTop, sh, hem]);
      // patterns
      g.save(); g.clip(torso);
      if (OF.pattern === 'dots') { g.fillStyle = OF.patternCol || '#fcd34d'; for (let yy = tTop; yy < hem; yy += 0.035 * k) for (let xx = -hemW; xx < hemW; xx += 0.035 * k) { g.beginPath(); g.arc(xx + ((yy / (0.035 * k)) % 2) * 0.017 * k, yy, 0.0055 * k, 0, 7); g.fill(); } }
      if (OF.pattern === 'checks') { g.strokeStyle = OF.patternCol || 'rgba(70,120,200,0.45)'; g.lineWidth = 0.006 * k; for (let xx = -hemW; xx < hemW; xx += 0.04 * k) { g.beginPath(); g.moveTo(xx, tTop); g.lineTo(xx, hem); g.stroke(); } for (let yy = tTop; yy < hem; yy += 0.04 * k) { g.beginPath(); g.moveTo(-hemW, yy); g.lineTo(hemW, yy); g.stroke(); } }
      g.restore();
      // open jacket / vest over the top
      if (OF.jacket) for (const s of [-1, 1]) { const j = P(); j.moveTo(s * sh, tTop + 0.02 * k); j.lineTo(s * sh * 0.25, tTop - 0.01 * k); j.lineTo(s * hw * 0.32, hipY + 0.015 * k); j.lineTo(s * hw * 1.07, hipY + 0.02 * k); j.closePath(); paint(g, j, OF.jacket, [s * sh, tTop, 0, hipY]); }
      // logo on the tee (kids) / collar on shirts
      if (OF.logo && LOGO.complete && LOGO.naturalWidth) { const lw = 0.075 * k, lh = lw * LOGO.naturalHeight / LOGO.naturalWidth; g.drawImage(LOGO, -lw / 2, tTop + U.torso * 0.25 * k, lw, lh); }
      if (OF.top === 'shirt') { g.fillStyle = shade(OF.topCol, 1.15); for (const s of [-1, 1]) { const c = P(); c.moveTo(0, tTop + 0.02 * k); c.lineTo(s * 0.05 * k, tTop - 0.008 * k); c.lineTo(s * 0.035 * k, tTop + 0.04 * k); c.closePath(); g.fill(c); } g.fillStyle = shade(OF.topCol, 0.7); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(0, tTop + (0.06 + i * 0.07) * k, 0.006 * k, 0, 7); g.fill(); } }
      if (extras.includes('dupatta')) { const d = P(); d.moveTo(-sh * 0.85, tTop + 0.005 * k); d.quadraticCurveTo(0, tTop + 0.2 * k, sh * 0.85, tTop + 0.005 * k); d.lineTo(sh * 0.7, tTop + 0.05 * k); d.quadraticCurveTo(0, tTop + 0.27 * k, -sh * 0.7, tTop + 0.05 * k); d.closePath(); paint(g, d, o.dupatta || '#ff4f8b', [-sh, tTop, sh, tTop + 0.27 * k]); g.strokeStyle = '#fcd34d'; g.lineWidth = 0.008 * k; g.stroke(d); }
      // arms (upper angle from straight down, outward positive; then elbow bend)
      const arm = (s, a) => {
        const sx = s * sh * 0.95, sy = tTop + 0.03 * k, L1 = U.arm1 * k, L2 = U.arm2 * k, r = U.limb * k;
        const ex = sx + s * Math.sin(a[0]) * L1, ey = sy + Math.cos(a[0]) * L1, a2 = a[0] + a[1], hx = ex + s * Math.sin(a2) * L2, hy = ey + Math.cos(a2) * L2;
        const sleeve = OF.sleeve ?? 'short', sc = OF.jacket || OF.topCol;
        if (sleeve === 'long') { paint(g, capsule(sx, sy, ex, ey, r * 1.15), sc, [sx - r, sy, ex + r, ey]); paint(g, capsule(ex, ey, hx, hy, r * 1.08), sc, [ex - r, ey, hx + r, hy]); }
        else { paint(g, capsule(sx, sy, ex, ey, r), C.skin, [sx - r, sy, ex + r, ey]); paint(g, capsule(ex, ey, hx, hy, r * 0.95), C.skin, [ex - r, ey, hx + r, hy]); paint(g, capsule(sx, sy, lerp(sx, ex, 0.5), lerp(sy, ey, 0.5), r * 1.25), sc, [sx - r, sy, ex, ey]); }
        paint(g, ell(hx, hy + r * 0.3, r * 1.25, r * 1.35), C.skin, [hx - r, hy - r, hx + r, hy + r * 2]);
        const m = g.getTransform(), w = new DOMPoint(hx, hy + r * 0.5).matrixTransform(m);
        anchors[s * facing > 0 ? 'handR' : 'handL'] = { x: w.x, y: w.y, r: r * 1.4 * Math.abs(m.a) };
        anchors[s > 0 ? 'hand1' : 'hand0'] = anchors[s * facing > 0 ? 'handR' : 'handL'];
      };
      arm(-1, p.aL); arm(1, p.aR);
      // neck + head
      const nTop = tTop - U.neck * k, hr = U.head * k * 0.5;
      paint(g, rrect(-0.03 * k, nTop - 0.02 * k, 0.06 * k, U.neck * k + 0.04 * k, 0.02 * k), C.skin, [0, nTop, 0, tTop], { lo: 0.7 });
      g.save(); g.translate(0, nTop + p.headDrop * 0.025 * k); g.rotate(p.headTilt + p.lean - p.headDrop * 0.05);
      const cy = -hr * 0.95 + p.headDrop * hr * 0.12;
      drawHead(g, cy, hr, p);
      const m = g.getTransform(), hw0 = new DOMPoint(0, cy).matrixTransform(m);
      anchors.head = { x: hw0.x, y: hw0.y, r: hr * Math.abs(m.a) * 1.15 };
      g.restore();
      const mm = g.getTransform(), cw = new DOMPoint(0, (tTop + hipY) / 2).matrixTransform(mm), bw = new DOMPoint(0, (nTop - 2 * hr + 0) / 2).matrixTransform(mm);
      anchors.chest = { x: cw.x, y: cw.y, r: U.shW * k * Math.abs(mm.a) * 1.3 };
      anchors.body = { x: bw.x, y: (new DOMPoint(0, (nTop - 2 * hr)).matrixTransform(mm).y + gy) / 2, r: Math.abs(gy - new DOMPoint(0, nTop - 2 * hr).matrixTransform(mm).y) / 2 };
      g.restore();
    }
    function drawHead(g, cy, r, p) {
      // ears
      for (const s of [-1, 1]) paint(g, ell(s * r * 0.92, cy + r * 0.08, r * 0.17, r * 0.24), C.skin, [s * r, cy, s * r * 1.1, cy + r * 0.3], { lw: 2 });
      // hair behind (bun / long)
      if (o.hair === 'bun') paint(g, ell(0, cy - r * 1.02, r * 0.38, r * 0.32), C.hair, [-r * 0.4, cy - r * 1.3, r * 0.4, cy - r * 0.7]);
      // face: a soft rounded shape, fuller cheeks, rounded chin
      const f = P(); f.moveTo(0, cy - r); f.bezierCurveTo(r * 0.62, cy - r, r * 0.95, cy - r * 0.6, r * 0.95, cy - r * 0.05); f.bezierCurveTo(r * 0.95, cy + r * 0.55, r * 0.55, cy + r * 0.98, 0, cy + r * 0.98);
      f.bezierCurveTo(-r * 0.55, cy + r * 0.98, -r * 0.95, cy + r * 0.55, -r * 0.95, cy - r * 0.05); f.bezierCurveTo(-r * 0.95, cy - r * 0.6, -r * 0.62, cy - r, 0, cy - r); f.closePath();
      paint(g, f, C.skin, [-r, cy - r, r, cy + r], { hi: 1.08, lo: 0.86 });
      // blush
      g.fillStyle = `rgba(255,120,120,${0.22 * cur.blush + 0.05})`; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.55, cy + r * 0.32, r * 0.17, r * 0.1, 0, 0, 7); g.fill(); }
      // eyes
      const close = Math.sin(Math.min(1, blinkK) * Math.PI), lid = clamp(lerp(cur.lid, 0, close), 0, 1.15);
      for (const s of [-1, 1]) {
        const ex = s * r * 0.38, ey = cy + r * 0.05, ew = r * 0.2, eh = r * 0.25;
        g.save(); const eye = ell(ex, ey, ew, eh); g.fillStyle = '#ffffff'; g.fill(eye); g.clip(eye);
        const ix = ex + cur.gaze[0] * ew * 0.35 * (s === 1 ? 1 : 1), iy = ey + cur.gaze[1] * eh * 0.3;
        const ig = g.createRadialGradient(ix - ew * 0.2, iy - eh * 0.2, 1, ix, iy, ew * 0.8); ig.addColorStop(0, '#7a4a2a'); ig.addColorStop(0.6, '#3a2010'); ig.addColorStop(1, '#120805');
        g.fillStyle = ig; g.beginPath(); g.ellipse(ix, iy, ew * 0.72, eh * 0.7, 0, 0, 7); g.fill();
        g.fillStyle = '#060302'; g.beginPath(); g.ellipse(ix, iy, ew * 0.36, eh * 0.36, 0, 0, 7); g.fill();
        g.fillStyle = '#ffffff'; g.beginPath(); g.arc(ix - ew * 0.25, iy - eh * 0.28, ew * 0.2, 0, 7); g.fill(); g.beginPath(); g.arc(ix + ew * 0.22, iy + eh * 0.2, ew * 0.08, 0, 7); g.fill();
        // eyelid (skin) coming down from the top
        g.fillStyle = shade(C.skin, 0.95); g.fillRect(ex - ew * 1.2, ey - eh * 1.2, ew * 2.4, eh * 2.4 * (1 - Math.min(1, lid)) * 0.5 + eh * 0.02);
        g.restore();
        g.lineWidth = r * 0.035; g.strokeStyle = '#2b1a12'; g.beginPath(); g.ellipse(ex, ey, ew, eh, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();   // upper lash line
        if (fem) { g.lineWidth = r * 0.03; for (let i = 0; i < 2; i++) { g.beginPath(); g.moveTo(ex + s * ew * (0.75 + i * 0.12), ey - eh * (0.7 - i * 0.18)); g.lineTo(ex + s * ew * (1.05 + i * 0.12), ey - eh * (0.95 - i * 0.18)); g.stroke(); } }
        // brow
        const by = ey - eh * 1.45 - cur.browY * r * 0.25 + (s === 1 ? -cur.asym * r * 0.18 : cur.asym * r * 0.05), tilt = cur.browTilt * 0.5 * -s;
        g.save(); g.translate(ex, by); g.rotate(tilt); g.lineCap = 'round'; g.strokeStyle = shade(C.hair, 0.95); g.lineWidth = r * (kid ? 0.075 : 0.085);
        g.beginPath(); g.moveTo(-ew * 0.9, ew * 0.12); g.quadraticCurveTo(0, -ew * 0.25, ew * 0.9, ew * 0.1); g.stroke(); g.restore();
      }
      // nose
      g.strokeStyle = shade(C.skin, 0.68); g.lineWidth = r * 0.045; g.lineCap = 'round'; g.beginPath(); g.moveTo(-r * 0.05, cy + r * 0.32); g.quadraticCurveTo(0, cy + r * 0.38, r * 0.06, cy + r * 0.32); g.stroke();
      // moustache
      if (extras.includes('moustache')) { const mu = P(); mu.moveTo(-r * 0.32, cy + r * 0.5); mu.quadraticCurveTo(-r * 0.15, cy + r * 0.36, 0, cy + r * 0.44); mu.quadraticCurveTo(r * 0.15, cy + r * 0.36, r * 0.32, cy + r * 0.5); mu.quadraticCurveTo(r * 0.15, cy + r * 0.5, 0, cy + r * 0.5); mu.quadraticCurveTo(-r * 0.15, cy + r * 0.5, -r * 0.32, cy + r * 0.5); g.fillStyle = o.moustacheCol || C.hair; g.fill(mu); }
      // mouth: closed curve, or open with tongue + teeth
      const open = Math.min(1, cur.open + talk * 0.8), my = cy + r * 0.58, mw = r * (0.24 + cur.smile * 0.08);
      if (open > 0.08) {
        const mo = P(), mh = r * (0.06 + open * 0.24), up = cur.smile < -0.2 ? -1 : 1;
        mo.moveTo(-mw, my); mo.quadraticCurveTo(0, my - up * mh * 0.25, mw, my); mo.quadraticCurveTo(mw * 0.6, my + up * mh, 0, my + up * mh); mo.quadraticCurveTo(-mw * 0.6, my + up * mh, -mw, my); mo.closePath();
        g.fillStyle = '#5a1a1f'; g.fill(mo); g.save(); g.clip(mo);
        if (cur.smile > 0.3) { g.fillStyle = '#ffffff'; g.fillRect(-mw, my - mh * 0.1, mw * 2, mh * 0.28); }
        g.fillStyle = '#e8687a'; g.beginPath(); g.ellipse(0, my + up * mh * 0.85, mw * 0.55, mh * 0.45, 0, 0, 7); g.fill(); g.restore();
      } else {
        g.strokeStyle = '#7a2e2a'; g.lineWidth = r * 0.05; g.lineCap = 'round'; g.beginPath(); g.moveTo(-mw, my - cur.smile * r * 0.04); g.quadraticCurveTo(0, my + cur.smile * r * 0.14, mw, my - cur.smile * r * 0.04); g.stroke();
      }
      // hair in front
      drawHair(g, cy, r);
      if (extras.includes('glasses')) { g.strokeStyle = '#2b2b30'; g.lineWidth = r * 0.04; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.38, cy + r * 0.05, r * 0.27, r * 0.26, 0, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(-r * 0.12, cy + r * 0.02); g.lineTo(r * 0.12, cy + r * 0.02); g.stroke(); }
    }
    function drawHair(g, cy, r) {
      const h = o.hair || 'boy', col = C.hair, hp = P();
      if (h === 'boy') {   // soft tousled top with a swept fringe
        hp.moveTo(-r * 0.98, cy - r * 0.05); hp.bezierCurveTo(-r * 1.1, cy - r * 0.95, -r * 0.4, cy - r * 1.25, r * 0.15, cy - r * 1.12);
        hp.bezierCurveTo(r * 0.75, cy - r * 1.18, r * 1.12, cy - r * 0.7, r * 0.98, cy - r * 0.08); hp.bezierCurveTo(r * 0.85, cy - r * 0.45, r * 0.6, cy - r * 0.58, r * 0.35, cy - r * 0.55);
        hp.bezierCurveTo(r * 0.1, cy - r * 0.4, -r * 0.2, cy - r * 0.62, -r * 0.4, cy - r * 0.5); hp.bezierCurveTo(-r * 0.62, cy - r * 0.42, -r * 0.82, cy - r * 0.3, -r * 0.98, cy - r * 0.05); hp.closePath();
        for (const [x, y, rot] of [[-r * 0.2, -r * 1.12, -0.4], [r * 0.25, -r * 1.12, 0.3], [r * 0.6, -r * 0.98, 0.7]]) { const t = P(); t.ellipse(x, cy + y, r * 0.22, r * 0.11, rot, 0, Math.PI * 2); hp.addPath(t); }
      } else if (h === 'side') {
        hp.moveTo(-r * 0.97, cy - r * 0.05); hp.bezierCurveTo(-r * 1.02, cy - r * 0.9, -r * 0.3, cy - r * 1.12, r * 0.3, cy - r * 1.05); hp.bezierCurveTo(r * 0.85, cy - r * 0.98, r * 1.02, cy - r * 0.55, r * 0.97, cy - r * 0.05);
        hp.bezierCurveTo(r * 0.8, cy - r * 0.55, r * 0.2, cy - r * 0.62, -r * 0.3, cy - r * 0.78); hp.bezierCurveTo(-r * 0.6, cy - r * 0.55, -r * 0.85, cy - r * 0.3, -r * 0.97, cy - r * 0.05); hp.closePath();
      } else if (h === 'bun') {
        hp.moveTo(-r * 0.97, cy + r * 0.1); hp.bezierCurveTo(-r * 1.05, cy - r * 0.95, r * 1.05, cy - r * 0.95, r * 0.97, cy + r * 0.1); hp.bezierCurveTo(r * 0.85, cy - r * 0.5, r * 0.15, cy - r * 0.7, 0, cy - r * 0.62);
        hp.bezierCurveTo(-r * 0.15, cy - r * 0.7, -r * 0.85, cy - r * 0.5, -r * 0.97, cy + r * 0.1); hp.closePath();
      } else if (h === 'rim') {   // bald top, hair around the sides
        for (const s of [-1, 1]) { hp.moveTo(s * r * 0.97, cy + r * 0.12); hp.bezierCurveTo(s * r * 1.05, cy - r * 0.4, s * r * 0.85, cy - r * 0.7, s * r * 0.55, cy - r * 0.78); hp.bezierCurveTo(s * r * 0.75, cy - r * 0.45, s * r * 0.8, cy - r * 0.15, s * r * 0.97, cy + r * 0.12); hp.closePath(); }
      }
      paint(g, hp, col, [-r, cy - r * 1.2, r, cy], { hi: 1.35, lo: 0.85, lw: 2 });
      // a glossy highlight strand
      g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = r * 0.06; g.lineCap = 'round'; g.beginPath(); g.moveTo(-r * 0.45, cy - r * 0.9); g.quadraticCurveTo(0, cy - r * 1.02, r * 0.4, cy - r * 0.92); g.stroke();
    }
    return {
      kind: kid ? 'kid' : 'adult', U,
      heightPx: (S) => (U.leg + U.torso + U.neck + U.head) * S,
      play(n) { if (!CLIPS[n]) throw new Error('2D: unknown animation ' + n); if (n === clip) return; prev = last; clip = n; clipT = 0; blend = 0; },
      playNow(n) { clip = n; clipT = 0; prev = null; blend = 1; },
      setExpression(n, instant) { if (!EXPR[n]) throw new Error('2D: unknown expression ' + n); Object.assign(target, { asym: 0 }, EXPR[n]); if (instant) { Object.assign(cur, target); cur.gaze = target.gaze.slice(); } },
      setTalk(v) { talkDriven = v != null; talkTarget = clamp(v || 0, 0, 1); },
      setSeat(px) { seat = px; },
      update, draw, anchor: (n) => anchors[n],
      ANIMATIONS: Object.keys(CLIPS), EXPRESSIONS: Object.keys(EXPR),
    };
  }
  window.Z2D = Object.assign(window.Z2D || {}, { puppet, paint, shade, capsule, rrect, ell });
})();
