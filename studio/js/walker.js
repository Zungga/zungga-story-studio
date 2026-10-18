/*
 * Zungga Story Studio — walker: walk a character around a ZWorld (keyboard + mouse).
 * Controls are the island game's (drive-portfolio) on-foot controls, exactly:
 *   W / ↑ = walk forward · S / ↓ = walk back · A / D (← / →) = turn · Shift = run · Space = jump (swim up / climb out)
 *   E = use (lifts, doors, secret shelf, slides) · drag the mouse = look around (eases back when you let go — the mouse
 *   is never captured) · wheel = zoom · F = free camera (WASD + Q/E down/up, Shift = fast, drag = look)
 * Physics: stepping up to 0.42 m (stairs, kerbs), snapping down stairs, gravity + jumps, ceilings, swimming in water
 * volumes (floats at the surface, river flow pushes you, climb out at the banks), riding slides along their curve,
 * standing on lift platforms (they carry you), camera that never goes through walls.
 */
(() => {
  'use strict';
  const T = THREE;
  const R = 0.3, H = 1.1, STEP = 0.42, SNAP = 0.55, G = 28, JUMP = 7.2, WALK = 2.8, RUN = 6, BACK = 0.6, ACC = 14, RUN_ACC = 18, TURN = 3.2, SWIM = 2.3, SWIM_FAST = 3.6;
  const CAM0 = { back: 9.9, up: 3.5, look: 0.2, ahead: 6.2, side: 3.0, orbit: 0, stiff: 3.5, fov: 63 };   // the user's chosen view (2026-10-18)   // the island's on-foot camera, a little lower; every value can be changed (Camera panel) and saved
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function create({ world, camera, dom, char, start = { x: 0, y: 0, z: 0, yaw: 0 }, onArea, onPrompt, onMode }) {
    const pos = new T.Vector3(start.x, start.y, start.z), vel = new T.Vector3(), keys = new Set();
    let yaw = start.yaw || 0, camYaw = (start.yaw || 0) + Math.PI, camPitch = 0.32, camDist = 1, camD = CAM0.back, speed = 0, steer = 0;
    const CAM = { ...CAM0 };
    const LOOK = { pitch: 0, target: 0, yaw: 0, yawTarget: 0, drag: false, x: 0, y: 0 };   // drag-to-look, eased back on release
    let mode = 'walk', grounded = true, air = 0, slide = null, area = null, prompt = null, time = 0, visY = pos.y, swimSurf = 0;
    let safe = pos.clone(), safeT = 0, jumpQueued = false, useQueued = false;
    const free = { pos: new T.Vector3(), yaw: 0, pitch: -0.2 };
    const camPos = new T.Vector3(), camLook = new T.Vector3(), UPV = new T.Vector3(0, 1, 0); let camInit = false;

    // ---------- input ----------
    const down = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const k = e.code; keys.add(k);
      if (k === 'Space') { jumpQueued = true; e.preventDefault(); }
      if (k === 'KeyE' && mode !== 'free') useQueued = true;
      if (k === 'KeyF') api.toggleFree();
      if (/^Arrow/.test(k)) e.preventDefault();
    };
    const up = (e) => keys.delete(e.code);
    addEventListener('keydown', down); addEventListener('keyup', up); addEventListener('blur', () => keys.clear());
    dom.addEventListener('pointerdown', (e) => { if (e.button !== 0 && e.pointerType === 'mouse') return; LOOK.drag = true; LOOK.x = e.clientX; LOOK.y = e.clientY; try { dom.setPointerCapture(e.pointerId); } catch { /* fine */ } dom.style.cursor = 'grabbing'; });
    dom.addEventListener('pointermove', (e) => {
      if (!LOOK.drag) return; const dx = e.clientX - LOOK.x, dy = e.clientY - LOOK.y; LOOK.x = e.clientX; LOOK.y = e.clientY;
      if (mode === 'free') { free.yaw -= dx * 0.004; free.pitch = clamp(free.pitch - dy * 0.004, -1.5, 1.5); return; }
      LOOK.target = clamp(LOOK.target - dy * 0.005, -1.1, 1.25); LOOK.yawTarget = clamp(LOOK.yawTarget - dx * 0.005, -Math.PI, Math.PI);
    });
    const endLook = () => { LOOK.drag = false; LOOK.target = 0; LOOK.yawTarget = 0; dom.style.cursor = ''; };
    dom.addEventListener('pointerup', endLook); dom.addEventListener('pointercancel', endLook); dom.addEventListener('lostpointercapture', endLook);
    dom.addEventListener('wheel', (e) => { camDist = clamp(camDist * (e.deltaY > 0 ? 1.1 : 0.91), 0.45, 3.2); e.preventDefault(); }, { passive: false });

    let forced = null;   // test hook: { f, r, run }
    const input = () => {
      if (forced) return forced;
      const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      const r = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      return { f, r, run: keys.has('ShiftLeft') || keys.has('ShiftRight') };
    };
    const setMode = (m) => { if (mode !== m) { mode = m; onMode && onMode(m); } };

    // ---------- slides ----------
    function trySlide(dirx, dirz, force) {
      for (const s of world.slides) {
        const d = Math.hypot(pos.x - s.start.x, pos.z - s.start.z);
        if (d < (force ? 1.6 : 0.85) && Math.abs(pos.y - s.start.y) < 1.1 && (force || dirx * s.dir.x + dirz * s.dir.z > 0.3)) { slide = { s, t: 0, speed: 3.2 }; setMode('slide'); return true; }
      }
      return false;
    }

    // ---------- one physics step ----------
    function step(h, inp) {
      // island on-foot steering: A/D turn the body, W/S walk forward/back along the facing
      const turnT = -inp.r; steer += (turnT - steer) * Math.min(1, 9 * h);
      if (mode !== 'slide') yaw += steer * TURN * h;
      const fx = Math.sin(yaw), fz = Math.cos(yaw), dx = fx * Math.sign(speed), dz = fz * Math.sign(speed), dl = Math.abs(speed) > 0.15 ? 1 : 0;
      if (mode === 'slide') {
        const s = slide.s, t0 = slide.t, p0 = s.curve.getPointAt(Math.min(1, t0)), tg = s.curve.getTangentAt(Math.min(1, t0));
        slide.speed = clamp(slide.speed + (-tg.y * G * 0.85 - 0.6) * h, 2.6, 13);
        slide.t += slide.speed * h / s.L;
        if (slide.t >= 1) { const e = s.curve.getPointAt(1), te = s.curve.getTangentAt(1); pos.copy(e); vel.set(te.x * slide.speed, 1.5, te.z * slide.speed); yaw = Math.atan2(te.x, te.z); speed = Math.min(RUN, slide.speed * 0.6); setMode('walk'); grounded = false; slide = null; return; }
        const p = s.curve.getPointAt(slide.t); pos.copy(p); yaw = Math.atan2(tg.x, tg.z); vel.set(0, 0, 0); void p0; return;
      }

      const water = world.waterAt(pos.x, pos.z);
      const sup0 = world.support(pos.x, pos.z, pos.y, STEP);
      const deep = water && water.surf - Math.max(sup0.y, -1e9) > 0.7;
      const swimming = !!(water && deep && pos.y < water.surf - 0.35);
      if (swimming) { swimSurf = water.surf; if (mode !== 'swim') setMode('swim'); } else if (mode === 'swim') setMode('walk');

      const top = swimming ? (inp.run ? SWIM_FAST : SWIM) : inp.run ? RUN : WALK;
      if (grounded || swimming) { const want = inp.f > 0 ? top : inp.f < 0 ? -WALK * BACK : 0; speed += clamp(want - speed, -24 * h, (inp.run ? RUN_ACC : ACC) * h); }
      const grip = grounded || swimming ? Math.min(1, 14 * h) : 0;   // no grip in the air: a jump keeps its momentum
      vel.x += (fx * speed - vel.x) * grip; vel.z += (fz * speed - vel.z) * grip;
      if (swimming && water.flow) { pos.x += water.flow[0] * h; pos.z += water.flow[1] * h; }

      pos.x += vel.x * h; pos.z += vel.z * h;
      world.push(pos, R, pos.y, H, swimming ? 1.15 : STEP);

      const sup = world.support(pos.x, pos.z, pos.y, swimming ? 1.3 : STEP);
      if (swimming) {
        const target = water.surf - 0.62;
        vel.y += ((target - pos.y) * 14 - vel.y * 5) * h;
        if (jumpQueued) { jumpQueued = false; const bank = world.support(pos.x + Math.sin(yaw) * 0.7, pos.z + Math.cos(yaw) * 0.7, pos.y, 1.6); if (bank.y > water.surf - 0.2) { vel.y = 6.2; setMode('walk'); grounded = false; } else vel.y = 2.2; }
        pos.y += vel.y * h; if (pos.y < sup.y) { pos.y = sup.y; vel.y = Math.max(0, vel.y); }
        if (sup.y > pos.y - 0.05 && sup.y > water.surf - 0.7) { pos.y = sup.y; grounded = true; setMode('walk'); }   // climbed onto the bank
        grounded = false; air = 0; return;
      }

      if (jumpQueued && (grounded || air < 0.12)) { vel.y = JUMP; grounded = false; air = 0.2; }
      jumpQueued = false;
      vel.y -= G * h;
      const ny = pos.y + vel.y * h;
      if (ny <= sup.y) { pos.y = sup.y; vel.y = 0; grounded = true; }
      else if (grounded && vel.y <= 0 && pos.y - sup.y < SNAP) { pos.y = sup.y; vel.y = 0; grounded = true; }   // walking down stairs / slopes
      else { pos.y = ny; grounded = false; }
      if (vel.y > 0) { const c = world.ceiling(pos.x, pos.z, pos.y, pos.y + H); if (pos.y + H > c) { pos.y = c - H; vel.y = 0; } }
      if (grounded) air = 0; else air += h;
      if (dl > 0.1) trySlide(dx, dz, false);   // walking into the top of a slide starts it
    }

    // ---------- camera ----------
    function placeCamera(dt) {
      if (mode === 'free') {
        const d = new T.Vector3(-Math.sin(free.yaw) * Math.cos(free.pitch), Math.sin(free.pitch), -Math.cos(free.yaw) * Math.cos(free.pitch));
        camera.position.copy(free.pos); camera.lookAt(free.pos.clone().add(d)); return;
      }
      // the island's chase camera: behind the facing, a little higher when running; eased; the drag-look turns it after
      const base = mode === 'swim' ? swimSurf - 0.25 : visY, ca = yaw + CAM.orbit * Math.PI / 180, fx = Math.sin(ca), fz = Math.cos(ca), rx = Math.cos(yaw), rz = -Math.sin(yaw), sp = Math.abs(speed);
      const back = CAM.back * camDist + sp * 0.08, up = CAM.up * Math.sqrt(camDist) + sp * 0.03;
      const head = new T.Vector3(pos.x, base + 0.95, pos.z);
      const desired = new T.Vector3(pos.x - fx * back - rx * CAM.side, base + up, pos.z - fz * back - rz * CAM.side), target = new T.Vector3(pos.x + fx * CAM.ahead - rx * CAM.side, base + CAM.look, pos.z + fz * CAM.ahead - rz * CAM.side);
      if (Math.abs(camera.fov - CAM.fov) > 0.05) { camera.fov = CAM.fov; camera.updateProjectionMatrix(); }
      // never through walls / ceilings: pull the wanted spot in toward the head
      const dir = desired.clone().sub(head), dl = dir.length(); dir.normalize();
      const hit = world.ray(head, dir, dl + 0.3); if (hit < dl + 0.3) desired.copy(head).addScaledVector(dir, Math.max(0.5, hit - 0.35));
      if (!camInit) { camPos.copy(desired); camLook.copy(target); camInit = true; }
      const k = 1 - Math.exp(-CAM.stiff * dt); camPos.lerp(desired, k); camLook.lerp(target, k);
      { const d2 = camPos.clone().sub(head), l2 = d2.length(); if (l2 > 0.01) { d2.normalize(); const h2 = world.ray(head, d2, l2 + 0.2); if (h2 < l2) camPos.copy(head).addScaledVector(d2, Math.max(0.4, h2 - 0.3)); } }
      camera.position.copy(camPos); camera.lookAt(camLook);
      const ease = 1 - Math.exp(-(LOOK.drag ? 18 : 4) * dt);
      LOOK.pitch += (LOOK.target - LOOK.pitch) * ease; LOOK.yaw += (LOOK.yawTarget - LOOK.yaw) * ease;
      if (Math.abs(LOOK.yaw) > 1e-4) camera.rotateOnWorldAxis(UPV, LOOK.yaw);
      if (Math.abs(LOOK.pitch) > 1e-4) camera.rotateX(LOOK.pitch);
    }
    function animate(dt) {
      const hs = Math.hypot(vel.x, vel.z);
      let clip = 'idle';
      if (mode === 'slide') clip = 'slide';
      else if (mode === 'swim') clip = hs > 0.4 ? 'swim' : 'tread';
      else if (!grounded && air > 0.18) clip = vel.y > 0 ? 'jump' : 'fall';
      else clip = hs > 3.6 ? 'run' : hs > 0.25 ? 'walk' : 'idle';
      if (char.ANIMATIONS.includes(clip)) char.play(clip);
      void wrap;
      // smooth the visual height on stairs (physics snaps, the eye shouldn't)
      visY = Math.abs(pos.y - visY) > 1.2 || mode !== 'walk' ? pos.y : visY + (pos.y - visY) * Math.min(1, dt * 18);
      const g = char.group; g.rotation.y = yaw;
      if (mode === 'swim') g.position.set(pos.x, swimSurf - 0.38, pos.z); else g.position.set(pos.x, visY, pos.z);
      char.update(dt);
    }

    const api = {
      pos, vel, get mode() { return mode; }, get speed() { return speed; }, get yaw() { return yaw; }, get area() { return area; }, get grounded() { return grounded; },
      update(dt) {
        dt = Math.min(dt, 0.05); time += dt;
        if (mode === 'free') {
          const sp = (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 36 : 12) * dt, f = new T.Vector3(-Math.sin(free.yaw), 0, -Math.cos(free.yaw)), r = new T.Vector3(Math.cos(free.yaw), 0, -Math.sin(free.yaw));
          const fw = new T.Vector3(-Math.sin(free.yaw) * Math.cos(free.pitch), Math.sin(free.pitch), -Math.cos(free.yaw) * Math.cos(free.pitch));
          if (keys.has('KeyW') || keys.has('ArrowUp')) free.pos.addScaledVector(fw, sp); if (keys.has('KeyS') || keys.has('ArrowDown')) free.pos.addScaledVector(fw, -sp);
          if (keys.has('KeyD') || keys.has('ArrowRight')) free.pos.addScaledVector(r, sp); if (keys.has('KeyA') || keys.has('ArrowLeft')) free.pos.addScaledVector(r, -sp);
          if (keys.has('KeyE')) free.pos.y += sp; if (keys.has('KeyQ')) free.pos.y -= sp; void f;
          placeCamera(dt); char.update(dt); return;
        }
        const inp = input(), n = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / n;
        for (let i = 0; i < n; i++) step(h, inp);
        // falling out of the world → back to the last safe spot
        if (pos.y < -70) { pos.copy(safe); vel.set(0, 0, 0); }
        safeT += dt; if (grounded && mode === 'walk' && safeT > 0.5) { safe.copy(pos); safeT = 0; }
        // interactions (E)
        let best = null; for (const it of world.interacts) if (it.test(pos)) { best = it; break; }
        if (!best && mode === 'walk') for (const s of world.slides) if (Math.hypot(pos.x - s.start.x, pos.z - s.start.z) < 1.6 && Math.abs(pos.y - s.start.y) < 1.1) { best = { label: () => 'Slide down — ' + s.name, fn: () => trySlide(0, 0, true) }; break; }
        const label = best ? best.label() : null; if (label !== prompt) { prompt = label; onPrompt && onPrompt(label); }
        if (useQueued) { useQueued = false; if (best) best.fn(); }
        const a = world.areaAt(pos); if (a !== area) { area = a; onArea && onArea(a); }
        animate(dt); placeCamera(dt);
      },
      teleport(p, y0) { pos.set(p[0], p[1], p[2]); visY = pos.y; vel.set(0, 0, 0); speed = 0; slide = null; setMode('walk'); grounded = false; camInit = false; if (y0 != null) { yaw = y0; camYaw = y0 + Math.PI; } },
      view(posArr, lookArr) { if (mode !== 'free') api.toggleFree(); free.pos.set(...posArr); const d = new T.Vector3(...lookArr).sub(free.pos); free.yaw = Math.atan2(-d.x, -d.z); free.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z)); },
      toggleFree() {
        if (mode === 'free') { setMode('walk'); camInit = false; return; }
        free.pos.copy(camera.position); const d = new T.Vector3(); camera.getWorldDirection(d); free.yaw = Math.atan2(-d.x, -d.z); free.pitch = Math.asin(clamp(d.y, -1, 1)); setMode('free');
      },
      get camera() { return { yaw: camYaw, pitch: camPitch, dist: camDist }; },
      // test hooks: drive the walker without a keyboard
      cam: CAM, CAM_DEFAULTS: CAM0, setCam(o) { Object.assign(CAM, o); },
      setInput(i) { forced = i; }, setCamYaw(y) { camYaw = y; }, setHeading(y) { yaw = y; steer = 0; }, jump() { jumpQueued = true; }, use() { useQueued = true; },
    };
    return api;
  }
  window.ZWalker = { create };
})();
