/* Zungga Story Studio — sets props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  function classroomSet() {
    const g = new T.Group(), W = 8, D = 7, H = 3.2;
    const floorT = tex((c, Wd, Hd) => { c.fillStyle = '#e7dcc8'; c.fillRect(0, 0, Wd, Hd); c.strokeStyle = '#cdbfa6'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * Wd / 8, 0); c.lineTo(i * Wd / 8, Hd); c.stroke(); c.beginPath(); c.moveTo(0, i * Hd / 8); c.lineTo(Wd, i * Hd / 8); c.stroke(); } }, 512, 512);
    floorT.wrapS = floorT.wrapT = T.RepeatWrapping; floorT.repeat.set(4, 3.5);
    mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: floorT, roughness: 0.9 }), g, 0, 0.002, 0).rotation.x = -Math.PI / 2;
    const wall = mat(0xfdf2d6, { roughness: 0.95 }), dado = mat(0x9ad1c4, { roughness: 0.9 });
    mesh(new T.BoxGeometry(W, H, 0.12), wall, g, 0, H / 2, -D / 2);                     // front wall (blackboard)
    mesh(new T.BoxGeometry(W, 1.0, 0.13), dado, g, 0, 0.5, -D / 2 + 0.005);
    // side wall with windows (left)
    const side = new T.Group(); side.position.set(-W / 2, 0, 0); g.add(side);
    mesh(new T.BoxGeometry(0.12, H, D), wall, side, 0, H / 2, 0);
    for (const z of [-1.8, 0, 1.8]) {
      box(0.16, 1.2, 1.2, 0xf8fafc, side, 0.02, 1.8, z, 0.01);
      mesh(new T.BoxGeometry(0.17, 1.05, 1.05), new T.MeshStandardMaterial({ color: 0xbfe6ff, emissive: 0xbfe6ff, emissiveIntensity: 0.55 }), side, 0.02, 1.8, z);
      for (let i = 0; i < 3; i++) mesh(new T.BoxGeometry(0.18, 1.05, 0.025), mat(0x64748b, { metalness: 0.5 }), side, 0.02, 1.8, z - 0.35 + i * 0.35);   // grille bars
    }
    const bb = ZAssets.build('blackboard').group; bb.position.set(0, 0, -D / 2 + 0.08); g.add(bb);
    const tt = ZAssets.build('teacher_table').group; tt.position.set(-1.8, 0, -D / 2 + 1.1); g.add(tt);
    const door = ZAssets.build('classroom_door').group; door.position.set(W / 2 - 0.08, 0, -D / 2 + 1.0); door.rotation.y = -Math.PI / 2; g.add(door);
    for (let r = 0; r < 3; r++) for (const x of [-1.6, 1.0]) {
      const d = ZAssets.build('desk').group; d.position.set(x, 0, -0.9 + r * 1.35); g.add(d);                                    // students face the blackboard
      const pb = ZAssets.build('pencil_box_empty').group; pb.position.set(x - 0.25, 0.775, -0.9 + r * 1.35 + 0.02); pb.rotation.x = 0.08; g.add(pb);   // empty pencil boxes
    }
    // fan + tube light
    box(1.2, 0.05, 0.08, 0xf8fafc, g, 0, H - 0.05, 0, 0.01).material = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
    const fan = new T.Group(); fan.position.set(0, H - 0.35, 1.2); g.add(fan); g.userData.fan = fan;
    mesh(new T.CylinderGeometry(0.015, 0.015, 0.3, 8), mat(0xe2e8f0), fan, 0, 0.15, 0);
    mesh(new T.CylinderGeometry(0.1, 0.1, 0.08, 20), mat(0xe2e8f0), fan, 0, 0, 0);
    for (let i = 0; i < 3; i++) { const b = mesh(new T.BoxGeometry(0.55, 0.01, 0.1), mat(0xe2e8f0), fan, 0, -0.01, 0); b.geometry.translate(0.32, 0, 0); b.rotation.y = i * Math.PI * 2 / 3; }
    return { group: g, size: [W, H, D] };
  }
  function schoolGround() {   // playground with the bench, a tree and a compound wall
    const g = new T.Group();
    const bn = ZAssets.build('bench').group; bn.position.set(0, 0, 0); g.add(bn);
    if (ZAssets.has('tree_oak')) { const t = ZAssets.build('tree_oak').group; t.position.set(2.4, 0, -1.1); t.scale.setScalar(0.75); g.add(t); }   // the Play-mode island's oak
    else { mesh(new T.CylinderGeometry(0.12, 0.18, 2.2, 10), mat(0x7c5532), g, 2.2, 1.1, -0.8); }
    for (let i = -3; i <= 3; i++) box(1.0, 1.2, 0.2, 0xf1e3c6, g, i * 1.02, 0.6, -2.2, 0.02);
    return { group: g };
  }
  function homeRoom() {   // a warm living-room corner: back wall with window + door, sofa, rug, plant, wall clock
    const g = new T.Group(), W = 7, H = 3.0, D = 5;
    const floorT = tex((c, Wd, Hd) => { c.fillStyle = '#c99a6b'; c.fillRect(0, 0, Wd, Hd); c.strokeStyle = '#b5865a'; c.lineWidth = 4; for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(0, i * Hd / 10); c.lineTo(Wd, i * Hd / 10); c.stroke(); } }, 512, 512);
    floorT.wrapS = floorT.wrapT = T.RepeatWrapping; floorT.repeat.set(3, 2);
    mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ map: floorT, roughness: 0.8 }), g, 0, 0.002, 0).rotation.x = -Math.PI / 2;
    const wall = mat(0xffe9d6, { roughness: 0.95 });
    mesh(new T.BoxGeometry(W, H, 0.12), wall, g, 0, H / 2, -D / 2);
    mesh(new T.BoxGeometry(0.12, H, D), mat(0xfde2c8, { roughness: 0.95 }), g, -W / 2, H / 2, 0);
    mesh(new T.BoxGeometry(W, 0.12, 0.14), mat(0xf4c9a4), g, 0, 0.06, -D / 2 + 0.01);                                   // skirting
    // window with sheer curtains glowing in the afternoon sun
    box(1.5, 1.4, 0.08, 0xffffff, g, 1.7, 1.65, -D / 2 + 0.06, 0.01);
    mesh(new T.PlaneGeometry(1.36, 1.26), new T.MeshStandardMaterial({ color: 0xfff1d6, emissive: 0xffe2b0, emissiveIntensity: 1.4 }), g, 1.7, 1.65, -D / 2 + 0.105);
    const sheer = new T.MeshStandardMaterial({ color: 0xfffaf0, emissive: 0xffe6c0, emissiveIntensity: 0.55, transparent: true, opacity: 0.82, side: T.DoubleSide, roughness: 1 });
    for (const s of [-1, 1]) { const cg = new T.PlaneGeometry(0.62, 2.3, 12, 1), cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 28) * 0.025); cg.computeVertexNormals(); mesh(cg, sheer, g, 1.7 + s * 0.62, 1.45, -D / 2 + 0.2).castShadow = false; }
    box(1.9, 0.06, 0.08, 0x9a6b42, g, 1.7, 2.62, -D / 2 + 0.2, 0.02);                                                        // curtain rod
    // picture frame with an abstract mountain print
    const art = tex((c, Wd, Hd) => { c.fillStyle = '#f6efe4'; c.fillRect(0, 0, Wd, Hd); const tri = (x, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2, Hd * 0.82); c.lineTo(x, Hd * 0.82 - h); c.lineTo(x + w / 2, Hd * 0.82); c.fill(); }; tri(Wd * 0.38, Wd * 0.6, Hd * 0.5, '#8aa0b8'); tri(Wd * 0.62, Wd * 0.55, Hd * 0.42, '#e7a07c'); tri(Wd * 0.5, Wd * 0.4, Hd * 0.3, '#9db7a9'); }, 256, 320);
    box(0.62, 0.76, 0.04, 0xb8865a, g, 0.55, 1.75, -D / 2 + 0.08, 0.01);
    mesh(new T.PlaneGeometry(0.52, 0.66), new T.MeshStandardMaterial({ map: art, roughness: 0.8 }), g, 0.55, 1.75, -D / 2 + 0.105);
    // door frame
    for (const s of [-1, 1]) box(0.1, 2.25, 0.12, 0x8a5a33, g, -1.8 + s * 0.55, 1.12, -D / 2 + 0.07, 0.01);
    box(1.2, 0.1, 0.12, 0x8a5a33, g, -1.8, 2.2, -D / 2 + 0.07, 0.01);
    // soft light shafts from the window (additive, very faint)
    const shaftT = tex((c, Wd, Hd) => { const gr = c.createLinearGradient(0, 0, 0, Hd); gr.addColorStop(0, 'rgba(255,226,170,0.55)'); gr.addColorStop(1, 'rgba(255,226,170,0)'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hd); }, 64, 256);
    const shaftM = new T.MeshBasicMaterial({ map: shaftT, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, opacity: 0.35 });
    for (let k = 0; k < 3; k++) { const sh = mesh(new T.PlaneGeometry(0.45, 3.2), shaftM, g, 1.35 + k * 0.35, 1.25, -D / 2 + 1.0); sh.rotation.set(-0.75, 0.25, 0.12); sh.castShadow = false; sh.receiveShadow = false; }
    // side table + plant behind the sofa, coffee table
    box(0.5, 0.55, 0.45, 0xa8774f, g, 1.65, 0.275, -D / 2 + 0.45, 0.02);
    if (ZAssets.has('plant_pot')) { const pp = ZAssets.build('plant_pot').group; pp.position.set(1.65, 0.55, -D / 2 + 0.45); g.add(pp); }
    box(0.9, 0.06, 0.55, 0xa8774f, g, 2.1, 0.42, 0.9, 0.02);
    for (const [x, z] of [[1.72, 0.7], [2.48, 0.7], [1.72, 1.1], [2.48, 1.1]]) box(0.05, 0.4, 0.05, 0x8a5a33, g, x, 0.2, z, 0.01);
    // sofa
    const sofa = new T.Group(); sofa.position.set(0.2, 0, -D / 2 + 0.55); g.add(sofa);
    box(2.0, 0.42, 0.75, Z.purple, sofa, 0, 0.21, 0, 0.06); box(2.0, 0.6, 0.2, Z.purple, sofa, 0, 0.6, -0.3, 0.06);
    for (const s of [-1, 1]) box(0.2, 0.55, 0.75, Z.purple, sofa, s * 1.0, 0.33, 0, 0.06);
    for (const s of [-1, 1]) box(0.5, 0.35, 0.12, s < 0 ? Z.yellow : 0xf5efe6, sofa, s * 0.5, 0.6, -0.15, 0.05);
    // rug, plant, clock
    mesh(new T.CircleGeometry(1.4, 48), mat(0x14b8a6, { roughness: 1 }), g, 0, 0.006, 0.4).rotation.x = -Math.PI / 2;
    mesh(new T.RingGeometry(1.15, 1.25, 48), mat(0xfacc15, { roughness: 1 }), g, 0, 0.008, 0.4).rotation.x = -Math.PI / 2;
    mesh(new T.CylinderGeometry(0.18, 0.14, 0.35, 20), mat(0xb45309), g, 3.0, 0.175, -D / 2 + 0.5);
    for (const [x, y, z, r] of [[3.0, 0.65, -D / 2 + 0.5, 0.3], [2.85, 0.85, -D / 2 + 0.45, 0.2], [3.15, 0.8, -D / 2 + 0.55, 0.22]]) mesh(new T.IcosahedronGeometry(r, 1), mat(0x22a35a, { flatShading: true }), g, x, y, z);
    const clock = tex((c, Wd, Hd) => { c.fillStyle = '#fff'; c.beginPath(); c.arc(Wd / 2, Hd / 2, Wd / 2 - 6, 0, Math.PI * 2); c.fill(); c.strokeStyle = hex(Z.ink); c.lineWidth = 10; c.stroke(); c.lineWidth = 12; c.beginPath(); c.moveTo(Wd / 2, Hd / 2); c.lineTo(Wd / 2, Hd * 0.22); c.stroke(); c.beginPath(); c.moveTo(Wd / 2, Hd / 2); c.lineTo(Wd * 0.7, Hd / 2); c.stroke(); }, 256, 256);
    mesh(new T.CircleGeometry(0.22, 32), new T.MeshStandardMaterial({ map: clock }), g, 0.2, 2.3, -D / 2 + 0.07);
    return { group: g, size: [W, H, D] };
  }
  ZAssets.register('sets', 'home_room', 'Home living room (set)', homeRoom, ["set", "home", "indoor", "parents"]);
  ZAssets.register('sets', 'classroom', 'Classroom (full set)', classroomSet, ["set", "classroom", "indoor"]);
  ZAssets.register('sets', 'school_ground', 'School ground (set)', schoolGround, ["set", "outdoor", "playground"]);
})();
