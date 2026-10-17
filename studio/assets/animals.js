/*
 * Zungga Story Studio — "animals" props: the pet dog and cat from the Drive-My-Portfolio game (game.js 2134–2267).
 * Faces +z, feet on y = 0. tick(t) = tail wag (dog) / tail sway (cat); setOn(true) = barks / meows (head bobs up, as in the game).
 */
(() => {
  'use strict';
  const { T, mat, mesh } = ZA;
  function add(geo, m, x, y, z, parent, shadow = true) { const me = mesh(geo, m, parent, x, y, z); me.castShadow = shadow; return me; }

  // pose: 'stand' | 'sit' | 'walk'; ball: carries the lime ball in its mouth (fetch)
  function buildPet(kind, { pose = 'stand', ball = false } = {}) {
    const dog = kind === 'dog', fur = mat(dog ? 0xb7793f : 0xf08c00, { roughness: 0.9 }), light = mat(dog ? 0xf1e3c6 : 0xfff4e6, { roughness: 0.9 }), dark = mat(0x22201f);
    const group = new T.Group(), g = new T.Group(); group.add(g);
    const s = dog ? 1 : 0.62, L = 0.72 * s, H = 0.42 * s;
    const body = new T.Group(); body.position.y = H + 0.06; g.add(body);
    add(new T.BoxGeometry(0.34 * s, 0.3 * s, L), fur, 0, 0, 0, body);
    add(new T.BoxGeometry(0.26 * s, 0.1 * s, L * 0.7), light, 0, -0.14 * s, 0, body, false);
    const head = new T.Group(); head.position.set(0, 0.2 * s, L / 2 + 0.06 * s); body.add(head);
    add(new T.BoxGeometry(0.28 * s, 0.26 * s, 0.26 * s), fur, 0, 0, 0.06 * s, head);
    if (dog) {
      add(new T.BoxGeometry(0.16, 0.13, 0.18), light, 0, -0.05, 0.26, head, false);
      add(new T.BoxGeometry(0.07, 0.06, 0.05), dark, 0, -0.01, 0.36, head, false);                                     // nose
      for (const sx of [-1, 1]) { const ear = add(new T.BoxGeometry(0.06, 0.16, 0.1), mat(0x7a4a24), sx * 0.15, 0.03, 0.02, head, false); ear.rotation.z = sx * 0.25; }
      add(new T.TorusGeometry(0.16, 0.025, 6, 16), mat(0xe03131), 0, -0.13, -0.02, head, false).rotation.x = Math.PI / 2;   // red collar
      for (const sx of [-1, 1]) add(new T.BoxGeometry(0.035, 0.035, 0.01), dark, sx * 0.07, 0.05, 0.195, head, false);   // eyes (small addition so the face reads on camera)
    } else {
      for (const sx of [-1, 1]) add(new T.ConeGeometry(0.05, 0.11, 4), fur, sx * 0.08 * s, 0.16 * s, 0.04 * s, head, false);   // game forgot to scale the cat's face details (they floated); scaled here
      add(new T.BoxGeometry(0.03, 0.03, 0.02), mat(0xf783ac), 0, -0.02 * s, 0.21 * s, head, false);
      for (const sx of [-1, 1]) add(new T.BoxGeometry(0.035, 0.035, 0.01), mat(0x82c91e, { emissive: 0x2b8a3e, emissiveIntensity: 0.6 }), sx * 0.06 * s, 0.03 * s, 0.2 * s, head, false);   // green eyes
    }
    if (ball) add(new T.SphereGeometry(dog ? 0.09 : 0.06, 14, 10), mat(0xc0eb75, { roughness: 0.6 }), 0, dog ? -0.08 : -0.05, dog ? 0.38 : 0.17, head, false);
    const legs = [];
    for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const p = new T.Group(); p.position.set(x * 0.11 * s, -0.08 * s, z * (L / 2 - 0.08 * s)); body.add(p);
      add(new T.BoxGeometry(0.09 * s, H, 0.09 * s).translate(0, -H / 2, 0), fur, 0, 0, 0, p, false); legs.push(p);
    }
    const tail = new T.Group(); tail.position.set(0, 0.08 * s, -L / 2); body.add(tail);
    add(new T.BoxGeometry(0.05 * s, 0.05 * s, (dog ? 0.32 : 0.5) * s).translate(0, 0, -(dog ? 0.16 : 0.25) * s), fur, 0, 0, 0, tail, false);
    tail.rotation.x = dog ? -0.7 : -1.1;

    if (pose === 'sit') {   // game.js 2248–2249: body tips back 0.45, hind legs fold
      body.rotation.x = -0.45; legs[2].rotation.x = legs[3].rotation.x = -1.0;   // game uses +1.2 (legs kick back); folded forward reads as sitting
      // keep the front paws planted: stand the front legs upright and let them reach the ground
      legs[0].rotation.x = legs[1].rotation.x = 0.45;
      tail.rotation.x = 0.5;                      // tail lies back along the ground
      body.remove(tail); g.updateMatrixWorld(true);
      const hip = legs[0].getWorldPosition(new T.Vector3());
      const box = new T.Box3().setFromObject(g); const lift = -box.min.y; body.add(tail);
      legs[0].scale.y = legs[1].scale.y = (hip.y + lift) / H;
      g.position.y = lift;
    }
    let barking = false;
    const tick = (t) => {
      tail.rotation.y = Math.sin(t * (dog ? 14 : 3)) * (dog ? 0.6 : 0.25);                         // game.js 2250
      if (pose === 'walk') { const sw = Math.sin(t * 10.2) * 0.7; legs.forEach((l, i) => { l.rotation.x = (i === 0 || i === 3 ? sw : -sw); }); }
      head.rotation.x = barking ? -0.25 + Math.sin(t * 40) * 0.12 : 0;                               // game.js 2251
    };
    group.userData.tick = tick;
    group.userData.setOn = (on) => { barking = !!on; };
    tick(0);
    return { group };
  }

  const reg = (id, label, kind, o, tags) => ZAssets.register('animals', id, label, () => buildPet(kind, o), tags);
  reg('game_dog', 'Dog — tan, red collar', 'dog', {}, ['dog', 'pet', 'puppy', 'tail wag']);
  reg('game_dog_sitting', 'Dog sitting', 'dog', { pose: 'sit' }, ['dog', 'pet', 'sit']);
  reg('game_dog_walking', 'Dog trotting', 'dog', { pose: 'walk' }, ['dog', 'pet', 'walk', 'follow']);
  reg('game_dog_with_ball', 'Dog fetching the ball', 'dog', { ball: true }, ['dog', 'pet', 'fetch', 'ball']);
  reg('game_cat', 'Cat — orange, green eyes', 'cat', {}, ['cat', 'pet', 'kitten']);
  reg('game_cat_sitting', 'Cat sitting', 'cat', { pose: 'sit' }, ['cat', 'pet', 'sit', 'purr']);
  reg('game_cat_walking', 'Cat walking', 'cat', { pose: 'walk' }, ['cat', 'pet', 'walk', 'follow']);
  reg('game_cat_with_ball', 'Cat with the ball', 'cat', { ball: true }, ['cat', 'pet', 'fetch', 'ball']);
})();
