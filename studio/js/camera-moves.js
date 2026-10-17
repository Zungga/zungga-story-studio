/*
 * Camera moves used by stories: push_in, pull_back, pan, orbit, top_down, hold, low_angle, dolly_forward.
 * ZCamera.plan(move, target, opts) → { duration, at(t) → { pos, look } }  with t in seconds.
 * "target" is a THREE.Box3 around what the shot is about; distances adapt to its size, so the same move
 * works for a ₹5 coin and for a whole classroom.
 */
(() => {
  'use strict';
  const T = THREE;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);   // smooth start + stop
  const lerpV = (a, b, t) => a.clone().lerp(b, t);

  function frame(box, fov = 40, aspect = 9 / 16) {
    const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
    const r = Math.max(s.x, s.y * 1.1, s.z) * 0.5 + 0.0001;
    const vfov = T.MathUtils.degToRad(fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const fit = r / Math.sin(Math.min(vfov, hfov) / 2);       // distance that just fits the subject
    return { c, s, r, close: fit * 1.05, mid: fit * 1.4, wide: fit * 2.2 };
  }

  const MOVES = ['push_in', 'pull_back', 'pan', 'orbit', 'top_down', 'hold', 'low_angle', 'dolly_forward'];

  function plan(move, box, o = {}) {
    const f = frame(box, o.fov, o.aspect);
    const dur = o.duration ?? 5;
    const yaw = T.MathUtils.degToRad(o.angle ?? 20);            // which side we look from (0 = front)
    const elev = T.MathUtils.degToRad(o.elevation ?? 18);
    const dirAt = (yw, el) => new T.Vector3(Math.sin(yw) * Math.cos(el), Math.sin(el), Math.cos(yw) * Math.cos(el));
    const z = o.zoom ?? 1, D = { wide: f.wide * z, mid: f.mid * z, close: f.close * z }, dist = D[o.distance || 'mid'];   // zoom < 1 = super close   // hold / orbit / pan / top_down accept distance: 'close' | 'mid' | 'wide'
    const look = f.c.clone();
    let at;
    switch (move) {
      case 'push_in': { const a = D[o.from || 'wide'], b = D[o.to || 'close'], d = dirAt(yaw, elev); at = (k) => ({ pos: look.clone().addScaledVector(d, a + (b - a) * k), look }); break; }
      case 'pull_back': { const a = D[o.from || 'close'], b = D[o.to || 'wide'], d = dirAt(yaw, elev); at = (k) => ({ pos: look.clone().addScaledVector(d, a + (b - a) * k), look }); break; }
      case 'pan': {
        const d = dirAt(yaw, elev), side = new T.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)), span = Math.max(f.s.x, f.s.z) * 0.6 + f.r * 0.5;
        const sgn = o.direction === 'right_to_left' ? -1 : 1;
        at = (k) => { const off = side.clone().multiplyScalar(sgn * span * (k - 0.5)); return { pos: look.clone().addScaledVector(d, dist).add(off), look: look.clone().add(off) }; };
        break;
      }
      case 'orbit': { const turns = T.MathUtils.degToRad(o.degrees ?? 90); at = (k) => ({ pos: look.clone().addScaledVector(dirAt(yaw + turns * (k - 0.5), elev), dist), look }); break; }
      case 'top_down': { at = (k) => { const yw = yaw + (k - 0.5) * 0.5; return { pos: look.clone().add(new T.Vector3(Math.sin(yw) * 0.001, dist * (1.05 - 0.1 * k), Math.cos(yw) * 0.001)), look }; }; break; }
      case 'hold': { const d = dirAt(yaw, elev); at = (k) => ({ pos: look.clone().addScaledVector(d, dist).add(new T.Vector3(Math.sin(k * 6.28) * f.r * 0.01, Math.sin(k * 3.14) * f.r * 0.015, 0)), look }); break; }
      case 'low_angle': { at = (k) => { const el = T.MathUtils.degToRad(-4 + 10 * k); const p = look.clone().addScaledVector(dirAt(yaw, el), D.mid); p.y = Math.max(p.y, box.min.y + 0.02); return { pos: p, look: look.clone().add(new T.Vector3(0, f.s.y * 0.15, 0)) }; }; break; }
      case 'dolly_forward': { const d = dirAt(yaw, T.MathUtils.degToRad(o.elevation ?? 8)); at = (k) => ({ pos: look.clone().addScaledVector(d, D.wide + (D.mid - D.wide) * k), look }); break; }
      default: throw new Error('Unknown camera move: ' + move);
    }
    // speed: 1 = the move takes the whole shot, 2 = done in half the time then holds; smooth: 1 = eased (default), 0 = constant speed
    const sp = Math.max(0.2, o.speed ?? 1), sm = o.smooth ?? 1, k0 = (t) => Math.min(1, Math.max(0, t * sp / dur));
    return { duration: dur, at: (t) => { const k = k0(t); return at(sm * ease(k) + (1 - sm) * k); } };
  }
  window.ZCamera = { MOVES, plan, frame, ease, lerpV };
})();
