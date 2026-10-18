/*
 * Realistic rigged humans (GLB made by tools/blender/build_human.py: MPFB body + Mixamo skeleton + 34 face shapes).
 * Same API as the other casts, so the story engine treats them like any character:
 *   await ZCharacters.loadHuman('kai')          // once (fetch + parse); the engine does this for the cast
 *   const h = ZCharacters.human({ preset: 'kai' }) → { group, play, setExpression, setTalk, setSeat, hold, update, rig, … }
 * Poses are written as directions in character space (+Y up, +Z forward) and solved onto the bones, so they work on any
 * Mixamo-named skeleton whatever the bone roll. Faces use the morph targets (blink, brows, smile, jaw …).
 */
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
import { clone as skClone } from '../../vendor/SkeletonUtils.js';
const T = window.THREE;
const BASE = new URL('./glb/', import.meta.url).href;
const cache = {};
const lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = (k) => k * k * (3 - 2 * k);
const V = (x, y, z) => new T.Vector3(x, y, z);

async function loadHuman(name) {
  if (!cache[name]) cache[name] = new Promise((res, rej) => new GLTFLoader().load(BASE + name + '.glb', (g) => res(g), undefined, rej));
  return cache[name];
}
const HUMANS = { kai: 'Kai (realistic)', rio: 'Rio (realistic)', tara: 'Tara (realistic)', mira: 'Mira (realistic)', jax: 'Jax (realistic)', medic: 'Medic (rig test — not for kids content)' };

// ---------- expressions → morph weights (MakeHuman face units) ----------
const E = (o) => o;
const EXPR = {
  neutral: E({}),
  smile: E({ 'mouth-corner-puller': 0.55, 'mouth-upward-retraction': 0.15, 'eye-left-slit': 0.12, 'eye-right-slit': 0.12 }),
  big_smile: E({ 'mouth-corner-puller': 0.85, 'mouth-upward-retraction': 0.35, 'mouth-open': 0.22, 'eye-left-slit': 0.3, 'eye-right-slit': 0.3, 'eyebrows-left-up': 0.15, 'eyebrows-right-up': 0.15 }),
  laughing: E({ 'mouth-corner-puller': 1, 'mouth-open': 0.55, 'mouth-upward-retraction': 0.4, 'eye-left-slit': 0.55, 'eye-right-slit': 0.55 }),
  excited: E({ 'mouth-corner-puller': 0.8, 'mouth-open': 0.5, 'eyebrows-left-up': 0.6, 'eyebrows-right-up': 0.6, 'eye-left-opened-up': 0.4, 'eye-right-opened-up': 0.4 }),
  sad: E({ 'mouth-depression': 0.7, 'eyebrows-left-inner-up': 0.8, 'eyebrows-right-inner-up': 0.8, 'eye-left-slit': 0.2, 'eye-right-slit': 0.2 }),
  worried: E({ 'mouth-depression': 0.35, 'mouth-compression': 0.2, 'eyebrows-left-inner-up': 1, 'eyebrows-right-inner-up': 1 }),
  surprised: E({ 'mouth-open': 0.55, 'eyebrows-left-up': 1, 'eyebrows-right-up': 1, 'eye-left-opened-up': 0.8, 'eye-right-opened-up': 0.8 }),
  shocked: E({ 'mouth-open': 0.9, 'mouth-retraction': 0.3, 'eyebrows-left-up': 1, 'eyebrows-right-up': 1, 'eye-left-opened-up': 1, 'eye-right-opened-up': 1 }),
  angry: E({ 'eyebrows-left-down': 1, 'eyebrows-right-down': 1, 'mouth-compression': 0.5, 'mouth-depression': 0.3, 'eye-left-slit': 0.35, 'eye-right-slit': 0.35, 'nose-left-elevation': 0.4, 'nose-right-elevation': 0.4 }),
  stern: E({ 'eyebrows-left-down': 0.7, 'eyebrows-right-down': 0.7, 'mouth-compression': 0.4 }),
  determined: E({ 'eyebrows-left-down': 0.5, 'eyebrows-right-down': 0.5, 'mouth-compression': 0.35, 'mouth-corner-puller': 0.2 }),
  thinking: E({ 'eyebrows-left-up': 0.6, 'eyebrows-right-down': 0.3, 'mouth-pursing': 0.3, 'eye-right-slit': 0.25 }),
  confused: E({ 'eyebrows-left-up': 0.8, 'eyebrows-right-down': 0.5, 'mouth-depression': 0.25, 'mouth-part-later': 0.3 }),
  idea: E({ 'eyebrows-left-up': 0.9, 'eyebrows-right-up': 0.9, 'mouth-corner-puller': 0.6, 'mouth-open': 0.25, 'eye-left-opened-up': 0.5, 'eye-right-opened-up': 0.5 }),
  shy: E({ 'mouth-corner-puller': 0.35, 'eyebrows-left-inner-up': 0.4, 'eyebrows-right-inner-up': 0.4, 'eye-left-slit': 0.3, 'eye-right-slit': 0.3 }),
  proud: E({ 'mouth-corner-puller': 0.6, 'eye-left-slit': 0.25, 'eye-right-slit': 0.25, 'eyebrows-left-up': 0.2, 'eyebrows-right-up': 0.2 }),
  cheeky: E({ 'mouth-corner-puller': 0.7, 'eye-right-closure': 1, 'eyebrows-left-up': 0.5 }),
  confident: E({ 'mouth-corner-puller': 0.7, 'eyebrows-left-down': 0.2, 'eyebrows-right-down': 0.2 }),
  focused: E({ 'eyebrows-left-down': 0.4, 'eyebrows-right-down': 0.4, 'eye-left-slit': 0.3, 'eye-right-slit': 0.3 }),
  calm: E({ 'mouth-corner-puller': 0.3, 'eye-left-slit': 0.2, 'eye-right-slit': 0.2 }),
  playful: E({ 'mouth-corner-puller': 0.75, 'mouth-open': 0.25, 'eyebrows-left-up': 0.4 }),
  dizzy: E({ 'eye-left-slit': 0.5, 'eye-right-slit': 0.3, 'mouth-part-later': 0.4 }),
  protective: E({ 'eyebrows-left-down': 0.5, 'eyebrows-right-down': 0.5, 'mouth-compression': 0.3 }),
};

// ---------- poses: limb directions in character space ----------
// d(x,y,z) = direction of a bone from its head to its child's head. Rest is a T-ish pose; arms are posed per clip.
const DN = V(0, -1, 0), FWD = V(0, 0, 1);
const armDown = (s, out = 0.18, fwd = 0.05) => V(s * out, -1, fwd).normalize();
const P = {
  base: (s) => ({ up: armDown(s), fo: armDown(s, 0.1, 0.18) }),
};

function human(opts = {}) {
  if (typeof opts === 'string') opts = { preset: opts };
  const name = opts.preset || 'kai', g = cache[name] && cache[name].__result;
  if (!g) throw new Error(`Human "${name}" is not loaded yet (await ZCharacters.loadHuman('${name}'))`);
  const model = skClone(g.scene), root = new T.Group(); root.add(model);
  model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; if (o.material) { o.material = o.material.clone(); if (o.material.transparent || /lash|brow|hair|short|long|ponytail|bob|braid|afro/i.test(o.name)) { o.material.alphaTest = /brow|lash/i.test(o.name) ? 0.2 : 0.45; o.material.transparent = false; o.material.depthWrite = true; } } } });
  const bones = {}; model.traverse((o) => { if (o.isBone) bones[o.name.replace('mixamorig', '').replace(/^[:_]/, '')] = o; });
  const morphMeshes = []; model.traverse((o) => { if (o.isMesh && o.morphTargetDictionary) morphMeshes.push(o); });
  model.updateMatrixWorld(true);
  // rest data: local quaternion, and the character-space direction to the child bone
  const REST = {};
  const chain = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'LeftShoulder', 'LeftArm', 'LeftForeArm', 'LeftHand', 'RightShoulder', 'RightArm', 'RightForeArm', 'RightHand', 'LeftUpLeg', 'LeftLeg', 'LeftFoot', 'LeftToeBase', 'RightUpLeg', 'RightLeg', 'RightFoot', 'RightToeBase'];
  const childOf = { Hips: 'Spine', Spine: 'Spine1', Spine1: 'Spine2', Spine2: 'Neck', Neck: 'Head', LeftArm: 'LeftForeArm', LeftForeArm: 'LeftHand', RightArm: 'RightForeArm', RightForeArm: 'RightHand', LeftUpLeg: 'LeftLeg', LeftLeg: 'LeftFoot', RightUpLeg: 'RightLeg', RightLeg: 'RightFoot', LeftFoot: 'LeftToeBase', RightFoot: 'RightToeBase' };
  const toChar = (w) => root.worldToLocal(w.clone());
  for (const n in bones) REST[n] = { q: bones[n].quaternion.clone() };   // every bone (fingers too) resets each frame
  const height = new T.Box3().setFromObject(model).getSize(V(0, 0, 0)).y;
  // world helpers
  const wp = (b) => b.getWorldPosition(V(0, 0, 0)), wq = (b) => b.getWorldQuaternion(new T.Quaternion());
  const rootQ = () => root.getWorldQuaternion(new T.Quaternion());
  // rotate bone so its direction to `child` points along charDir (character space); keeps twist
  function aim(n, charDir, weight = 1) {
    const b = bones[n], c = bones[childOf[n]]; if (!b || !c || !charDir) return;
    b.updateMatrixWorld(true);
    const cur = wp(c).sub(wp(b)).normalize(), want = charDir.clone().normalize().applyQuaternion(rootQ());
    const d = new T.Quaternion().setFromUnitVectors(cur, want); if (weight < 1) d.slerp(new T.Quaternion(), 1 - weight);
    const parentQ = b.parent.getWorldQuaternion(new T.Quaternion());
    const newW = d.multiply(wq(b)); b.quaternion.copy(parentQ.invert().multiply(newW)); b.updateMatrixWorld(true);
  }
  // rotate bone around a character-space axis (relative to rest)
  function turn(n, axis, ang) {
    const b = bones[n]; if (!b || !ang) return;
    const pq = b.parent.getWorldQuaternion(new T.Quaternion()), wAxis = axis.clone().applyQuaternion(rootQ());
    const d = new T.Quaternion().setFromAxisAngle(wAxis, ang), w = wq(b);
    b.quaternion.copy(pq.invert().multiply(d.multiply(w))); b.updateMatrixWorld(true);
  }
  // two-bone IK: put the hand at a character-space point with the elbow toward `pole`
  function reach(side, target, pole) {
    const A = bones[side + 'Arm'], F = bones[side + 'ForeArm'], H = bones[side + 'Hand'];
    model.updateMatrixWorld(true);
    const S = toChar(wp(A)), l1 = toChar(wp(F)).distanceTo(S), l2 = toChar(wp(H)).distanceTo(toChar(wp(F)));
    const d = target.clone().sub(S), dist = clamp(d.length(), 0.05, (l1 + l2) * 0.999), dir = d.normalize();
    const a = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1));
    const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize(), axis = dir.clone().cross(pp).normalize();
    const upDir = dir.clone().applyAxisAngle(axis, a), elbow = S.clone().addScaledVector(upDir, l1);   // +a turns toward the pole
    aim(side + 'Arm', upDir); aim(side + 'ForeArm', target.clone().sub(elbow).normalize());
  }
  // two-bone IK for a leg: foot to a character-space point, knee toward the front
  function legReach(side, target) {
    const U = bones[side + 'UpLeg'], L = bones[side + 'Leg'], F = bones[side + 'Foot']; model.updateMatrixWorld(true);
    const S = toChar(wp(U)), l1 = toChar(wp(L)).distanceTo(S), l2 = toChar(wp(F)).distanceTo(toChar(wp(L)));
    const d = target.clone().sub(S), dist = clamp(d.length(), 0.05, (l1 + l2) * 0.999), dir = d.normalize();
    const a = Math.acos(clamp((l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist), -1, 1)), pole = V(0, 0, 1);
    const pp = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize(), axis = dir.clone().cross(pp).normalize();
    const upDir = dir.clone().applyAxisAngle(axis, a), knee = S.clone().addScaledVector(upDir, l1);
    aim(side + 'UpLeg', upDir); aim(side + 'Leg', target.clone().sub(knee).normalize());
  }
  // collarbone follows the arm: lifts when the arm goes above ~shoulder height, comes forward when reaching ahead
  function clavicle(side, sg, armDir) {
    if (!armDir || !bones[side + 'Shoulder']) return;
    const up = clamp((armDir.y + 0.15) / 1.15, 0, 1), fwd = clamp(armDir.z, 0, 1);
    turn(side + 'Shoulder', V(0, 0, 1), sg * up * 0.62); turn(side + 'Shoulder', V(1, 0, 0), -up * 0.12); turn(side + 'Shoulder', V(0, 1, 0), -sg * fwd * 0.2);
  }
  const chestPt = () => toChar(wp(bones.Spine2)), headPt = () => toChar(wp(bones.Head));

  // ---------- clips: each sets a pose description p (directions / angles) for time t ----------
  const zero = () => ({ feet: null, gait: null, hipTwist: 0, armL: armDown(1), foreL: armDown(1, 0.08, 0.2), armR: armDown(-1), foreR: armDown(-1, 0.08, 0.2), ikL: null, ikR: null, thL: 0, thR: 0, knL: 0, knR: 0, spine: [0, 0, 0], head: [0, 0, 0], hipY: 0, sit: 0, fist: 0.25, pointR: 0, thumbR: 0 });
  // gait: each foot is planted on the ground for the stance part of the cycle (sliding back as the body passes over it),
  // then lifts and swings forward on an arc; the hips bob, the pelvis/chest counter-rotate and the arms swing opposite.
  function gait(t, p, o) {
    const ph = (t * o.rate) % 1, feet = {}, ease = (x) => x * x * (3 - 2 * x);
    for (const [side, off] of [['Left', 0], ['Right', 0.5]]) {
      const u = (ph + off) % 1; let z, y;
      if (u < o.stance) { z = o.stride / 2 - (u / o.stance) * o.stride; y = 0; }
      else { const v = (u - o.stance) / (1 - o.stance); z = -o.stride / 2 + ease(v) * o.stride; y = Math.sin(v * Math.PI) * o.lift; }
      feet[side] = { z, y, swing: u >= o.stance };
    }
    const mid = Math.cos(ph * Math.PI * 4);
    p.hipY = -o.drop * (mid + 1) / 2 + o.bob * (1 - mid) / 2; p.gait = feet;   // lowest when both feet are down, highest at mid-stance
    const sw = Math.sin(ph * Math.PI * 2);
    p.spine = [o.lean, -sw * 0.08, 0]; p.hipTwist = sw * 0.07; p.head = [-o.lean * 0.5, sw * 0.04, 0];
    p.armL = V(0.16, -1, -sw * o.arm).normalize(); p.armR = V(-0.16, -1, sw * o.arm).normalize();
    p.foreL = p.armL.clone().add(V(0, o.elbow * 0.7, o.elbow + 0.05)).normalize(); p.foreR = p.armR.clone().add(V(0, o.elbow * 0.7, o.elbow + 0.05)).normalize();
  }
  const CLIPS = {
    idle(t, p) { const b = Math.sin(t * 1.8); p.spine = [b * 0.012, Math.sin(t * 0.5) * 0.03, 0]; p.head = [Math.sin(t * 0.4) * 0.03, Math.sin(t * 0.33) * 0.08, 0]; p.armL = armDown(1, 0.17 + b * 0.01); p.armR = armDown(-1, 0.17 - b * 0.01); },
    talk(t, p) { CLIPS.idle(t, p); p.head[0] += Math.sin(t * 4.5) * 0.04; p.head[2] = Math.sin(t * 2.1) * 0.05; p.armR = V(-0.3, -0.85, 0.35).normalize(); p.foreR = V(-0.1, 0.1 + Math.max(0, Math.sin(t * 2)) * 0.4, 1).normalize(); },
    walk(t, p) { gait(t, p, { rate: 0.95, stride: 0.38, stance: 0.62, lift: 0.07, drop: 0.03, bob: 0.008, lean: 0.03, arm: 0.38, elbow: 0.18 }); },
    run(t, p) { gait(t, p, { rate: 1.45, stride: 0.7, stance: 0.38, lift: 0.2, drop: 0.075, bob: 0.03, lean: 0.16, arm: 0.8, elbow: 0.95 }); p.fist = 0.75; },
    wave(t, p) { CLIPS.idle(t, p); p.armR = V(-0.75, 0.55, 0.15).normalize(); p.foreR = V(-0.25 + Math.sin(t * 9) * 0.45, 1, 0.1).normalize(); p.head[2] = -0.06; p.fist = 0; },
    think(t, p) { CLIPS.idle(t, p); p.ikR = () => ({ target: headPt().add(V(-0.02, -0.11, 0.08)), pole: V(-0.5, -1, 0.3) }); p.head = [-0.08, 0.1, 0.08]; },
    cheer(t, p) { const j = Math.max(0, Math.sin(t * 6)); p.armL = V(0.45, 1, 0.1).normalize(); p.armR = V(-0.45, 1, 0.1).normalize(); p.foreL = V(0.2, 1, 0).normalize(); p.foreR = V(-0.2, 1, 0).normalize(); p.hipY = j * 0.08; p.fist = 0.9; },
    count(t, p) { CLIPS.idle(t, p); p.ikR = () => ({ target: chestPt().add(V(-0.05, -0.12, 0.25)), pole: V(-1, -1, 0) }); p.ikL = () => ({ target: chestPt().add(V(0.05, -0.12, 0.25)), pole: V(1, -1, 0) }); p.head = [0.25, 0, 0]; },
    point(t, p) { CLIPS.idle(t, p); p.armR = V(-0.2, 0.05, 1).normalize(); p.foreR = V(-0.15, 0.08, 1).normalize(); p.pointR = 1; },
    give(t, p) { CLIPS.idle(t, p); p.armR = V(-0.15, -0.6, 0.8).normalize(); p.foreR = V(-0.05, -0.1, 1).normalize(); p.fist = 0.1; },
    arms_crossed(t, p) { CLIPS.idle(t, p); p.ikR = () => ({ target: chestPt().add(V(0.09, -0.06, 0.13)), pole: V(-1, -0.6, 0.1) }); p.ikL = () => ({ target: chestPt().add(V(-0.09, -0.03, 0.16)), pole: V(1, -0.6, 0.1) }); p.head[0] = -0.04; },
    hands_on_hips(t, p) { CLIPS.idle(t, p); p.ikR = () => ({ target: toChar(wp(bones.Hips)).add(V(-0.15, 0.02, 0.02)), pole: V(-1, 0, -0.6) }); p.ikL = () => ({ target: toChar(wp(bones.Hips)).add(V(0.15, 0.02, 0.02)), pole: V(1, 0, -0.6) }); p.fist = 0.6; },
    hip_point_front(t, p) { CLIPS.hands_on_hips(t, p); p.ikR = null; p.armR = V(-0.2, 0.05, 1).normalize(); p.foreR = V(-0.15, 0.08, 1).normalize(); p.pointR = 1; },
    hip_point_up(t, p) { CLIPS.hands_on_hips(t, p); p.ikR = null; p.armR = V(-0.35, 1, 0.2).normalize(); p.foreR = V(-0.2, 1, 0.1).normalize(); p.pointR = 1; p.head[0] = -0.15; },
    hip_point_side(t, p) { CLIPS.hands_on_hips(t, p); p.ikR = null; p.armR = V(-1, 0.05, 0.1).normalize(); p.foreR = V(-1, 0.08, 0).normalize(); p.pointR = 1; p.head[1] = -0.35; },
    thumbs_up(t, p) { CLIPS.idle(t, p); p.armR = V(-0.25, -0.75, 0.6).normalize(); p.foreR = V(-0.15, 0.7, 0.7).normalize(); p.thumbR = 1; p.fist = 1; },
    victory(t, p) { CLIPS.idle(t, p); p.armR = V(-0.35, 1, 0.1).normalize(); p.foreR = V(-0.1, 1, 0).normalize(); p.fist = 1; },
    look_far(t, p) { CLIPS.idle(t, p); p.ikR = () => ({ target: headPt().add(V(-0.02, 0.1, 0.12)), pole: V(-1, 0, 0) }); p.head = [-0.08, 0.15, 0]; },
    jump(t, p) {   // crouch → spring up (arms swing up) → tuck in the air → land soft → straighten; one jump every 1.4 s
      const k = (t / 1.4) % 1, ease = (x) => x * x * (3 - 2 * x);
      let hip = 0, air = 0, arms = 0;
      if (k < 0.22) { hip = -0.13 * ease(k / 0.22); arms = -0.6 * ease(k / 0.22); }
      else if (k < 0.62) { const u = (k - 0.22) / 0.4; hip = -0.13 + 0.43 * Math.sin(u * Math.PI) + 0.13 * u; air = Math.sin(u * Math.PI); arms = -0.6 + 1.9 * Math.min(1, u * 3); }
      else if (k < 0.8) { const u = (k - 0.62) / 0.18; hip = -0.12 * Math.sin(u * Math.PI * 0.5) ; arms = 1.3 - 1.6 * u; }
      else { const u = (k - 0.8) / 0.2; hip = -0.12 * (1 - ease(u)); arms = -0.3 * (1 - u); }
      p.hipY = hip; p.feet = { air, lift: air * 0.12 }; p.spine = [hip < 0 ? -hip * 1.6 : 0, 0, 0]; p.head = [hip < 0 ? -hip * 0.8 : -0.05 * air, 0, 0];
      const a = clamp(arms, -0.6, 1.3); p.armL = V(0.35, Math.sin(a), Math.cos(a) * 0.5 + 0.1).normalize(); p.armR = V(-0.35, Math.sin(a), Math.cos(a) * 0.5 + 0.1).normalize(); p.foreL = p.armL.clone(); p.foreR = p.armR.clone(); p.fist = air > 0.3 ? 0.7 : 0.3;
    },
    sit(t, p) { CLIPS.idle(t, p); p.sit = 1; p.thL = 1.5; p.thR = 1.5; p.knL = 1.5; p.knR = 1.5; p.armL = V(0.15, -0.8, 0.55).normalize(); p.armR = V(-0.15, -0.8, 0.55).normalize(); p.foreL = V(0.05, -0.3, 1).normalize(); p.foreR = V(-0.05, -0.3, 1).normalize(); },
    sit_sad(t, p) { CLIPS.sit(t, p); p.spine = [0.25, 0, 0]; p.head = [0.3, 0, 0]; },
  };
  CLIPS.hand_on_chin = CLIPS.think; CLIPS.peace = CLIPS.victory;

  // ---------- runtime ----------
  let clip = 'idle', clipT = 0, time = 0, seat = null, talk = 0, talkDriven = false, exprName = 'neutral', prevPose = null, blend = 1, last = null;
  const morphCur = {}, morphTarget = {};
  const hipsRest = bones.Hips.position.clone(), hipsH = toChar(wp(bones.Hips)).y;
  const footRest = { Left: bones.LeftFoot && toChar(wp(bones.LeftFoot)), Right: bones.RightFoot && toChar(wp(bones.RightFoot)) };
  function applyPose(p) {
    for (const n in REST) bones[n].quaternion.copy(REST[n].q);
    model.updateMatrixWorld(true);
    // hips height (jumps / sitting) in character units → bone local (hips' parent may be scaled)
    const sc = toChar(wp(bones.Hips)).y / Math.max(1e-6, bones.Hips.position.y) || 1;
    bones.Hips.position.copy(hipsRest); bones.Hips.position.y += (p.hipY + (p.sit && seat != null ? (seat + 0.08 - hipsH) * p.sit : 0)) / sc;
    model.updateMatrixWorld(true);
    turn('Hips', V(0, 1, 0), p.hipTwist || 0);
    turn('Spine', V(1, 0, 0), p.spine[0] * 0.5); turn('Spine1', V(1, 0, 0), p.spine[0] * 0.5); turn('Spine1', V(0, 1, 0), p.spine[1]); turn('Spine2', V(0, 0, 1), p.spine[2]);
    turn('Neck', V(1, 0, 0), p.head[0] * 0.4); turn('Head', V(1, 0, 0), p.head[0] * 0.6); turn('Head', V(0, 1, 0), p.head[1]); turn('Head', V(0, 0, 1), p.head[2]);
    for (const [s, sg] of [['Left', 1], ['Right', -1]]) {
      const isL = s === 'Left', th = isL ? p.thL : p.thR, kn = isL ? p.knL : p.knR;
      if (p.gait && footRest[s]) { const g = p.gait[s], f = footRest[s].clone(); f.z += g.z; f.y += g.y; legReach(s, f); aim(s + 'Foot', V(0, g.swing ? -0.55 : -0.3, 1)); }
      else if (p.feet && footRest[s]) { const f = footRest[s].clone(); f.y += p.feet.lift * (isL ? 1 : 0.85); f.z += p.feet.air * 0.04; legReach(s, f); }
      else { aim(s + 'UpLeg', V(sg * 0.06, -Math.cos(th), Math.sin(th))); aim(s + 'Leg', V(sg * 0.04, -Math.cos(th - kn), Math.sin(th - kn))); }
      aim(s + 'Foot', V(0, -0.35, 1).applyAxisAngle(V(1, 0, 0), 0));
      const ik = isL ? p.ikL : p.ikR;
      clavicle(s, sg, ik ? null : (isL ? p.armL : p.armR));
      if (ik) { const r = ik(); reach(s, r.target, r.pole); } else { aim(s + 'Arm', isL ? p.armL : p.armR); aim(s + 'ForeArm', isL ? p.foreL : p.foreR); }
      // fingers curl
      for (const f of ['Index', 'Middle', 'Ring', 'Pinky']) for (let k = 1; k <= 3; k++) { const b = bones[`${s}Hand${f}${k}`]; if (!b) continue; const straight = !isL && p.pointR > 0.5 && f === 'Index'; turn(`${s}Hand${f}${k}`, V(0, 0, sg), straight ? 0 : -p.fist * 1.1 * (k === 1 ? 0.8 : 1)); }
      const tb = bones[`${s}HandThumb1`]; if (tb && !isL && p.thumbR > 0.5) turn(`${s}HandThumb1`, V(0, 1, 0), 0.6);
    }
  }
  function lerpPose(a, b, k) { const o = {}; for (const key in b) { const x = a[key], y = b[key]; o[key] = y instanceof T.Vector3 ? x.clone().lerp(y, k).normalize() : Array.isArray(y) ? y.map((v, i) => lerp(x[i], v, k)) : typeof y === 'number' ? lerp(x, y, k) : (k < 0.5 ? x : y); } return o; }
  function update(dt) {
    time += dt; clipT += dt;
    const p = zero(); CLIPS[clip](clipT, p); blend = Math.min(1, blend + dt / 0.3);
    const pose = prevPose && blend < 1 ? lerpPose(prevPose, p, smooth(blend)) : p; last = pose; applyPose(pose);
    // face: expression + blink + talk
    const tgt = { ...(EXPR[exprName] || {}) };
    const bp = (time % 3.6) / 3.6, blink = bp > 0.955 ? Math.sin((bp - 0.955) / 0.045 * Math.PI) : 0;
    tgt['eye-left-closure'] = Math.max(tgt['eye-left-closure'] || 0, blink); tgt['eye-right-closure'] = Math.max(tgt['eye-right-closure'] || 0, blink);
    const tk = talkDriven ? talk : clip === 'talk' ? Math.max(0, Math.sin(time * 13) * 0.6 + Math.sin(time * 7.3) * 0.4) * 0.8 : 0;
    if (tk) { tgt['mouth-open'] = Math.max(tgt['mouth-open'] || 0, tk * 0.6); tgt['mouth-parling'] = (tgt['mouth-parling'] || 0) + tk * 0.2; }
    const k = clamp(dt * 10, 0, 1);
    for (const key of new Set([...Object.keys(morphCur), ...Object.keys(tgt)])) morphCur[key] = lerp(morphCur[key] || 0, (key.includes('closure') ? tgt[key] : tgt[key] || 0), key.includes('closure') ? 1 : k);
    for (const m of morphMeshes) { const d = m.morphTargetDictionary; for (const key in morphCur) { const i = d[key]; if (i != null) m.morphTargetInfluences[i] = morphCur[key]; } }
  }
  // hand grips (props held in hand) + a head anchor for hats / lightbulbs
  const grip = (s) => { const g = new T.Group(); bones[s + 'Hand'].add(g); g.position.set(0, 0.08 / (bones[s + 'Hand'].getWorldScale(V(0, 0, 0)).x || 1), 0); return g; };
  const armL = { grip: grip('Left') }, armR = { grip: grip('Right') };
  const headC = new T.Group(); bones.Head.add(headC);
  const api = {
    group: root, EXPRESSIONS: Object.keys(EXPR), ANIMATIONS: Object.keys(CLIPS),
    params: { kind: 'human', preset: name, label: HUMANS[name] || name, height },
    get expression() { return exprName; }, get animation() { return clip; },
    setExpression(n) { exprName = EXPR[n] ? n : 'neutral'; },
    play(n, opt = {}) { if (!CLIPS[n]) n = 'idle'; if (opt.instant) { clip = n; clipT = 0; prevPose = null; blend = 1; return; } if (n === clip) return; prevPose = last; clip = n; clipT = 0; blend = 0; },
    setTalk(level) { talkDriven = level != null; talk = clamp(level || 0, 0, 1); },
    setSeat(h) { seat = h; },
    hold(obj, hand = 'R') { const g = (hand === 'R' ? armR : armL).grip; while (g.children.length) g.remove(g.children[0]); if (obj) { g.add(obj); const s = 1 / (g.getWorldScale(V(0, 0, 0)).x || 1); obj.scale.setScalar(s); } },
    update,
    rig: { hips: bones.Hips, spine: bones.Spine, chest: bones.Spine2, neck: bones.Neck, head: bones.Head, headC, armL, armR },
  };
  update(0);
  return api;
}
// keep the parsed result on the promise so human() can stay synchronous after loading
const origLoad = loadHuman;
async function loadAndKeep(name) { const p = origLoad(name); const r = await p; p.__result = r; cache[name].__result = r; return r; }
window.ZCharacters = Object.assign(window.ZCharacters || {}, { human, loadHuman: loadAndKeep, HUMAN_PRESETS: HUMANS, HUMAN_EXPRESSIONS: Object.keys(EXPR) });
window.dispatchEvent(new Event('zhumans-ready'));
