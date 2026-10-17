/* Zungga Story Studio — furniture props. Registered into the shared library (assets/core.js). */
(() => {
  'use strict';
  const { T, Z, FONT, hex, mat, glassMat, mesh, tex, fitText, roundBox, box, logoTex, mascotTex, decal, label, cyl, sphere } = ZA;
  function bench() {   // school-ground bench
    const g = new T.Group(), L = 1.6, iron = mat(0x334155, { metalness: 0.5, roughness: 0.45 });
    for (let i = 0; i < 4; i++) box(L, 0.03, 0.09, Z.wood, g, 0, 0.45, -0.15 + i * 0.1, 0.008);                    // seat slats
    for (let i = 0; i < 2; i++) box(L, 0.09, 0.03, Z.wood, g, 0, 0.62 + i * 0.13, -0.24, 0.008);                    // back slats
    for (const x of [-0.7, 0.7]) {
      box(0.05, 0.45, 0.05, 0x334155, g, x, 0.225, 0.13, 0.01).material = iron;
      box(0.05, 0.85, 0.05, 0x334155, g, x, 0.425, -0.24, 0.01).material = iron;
      box(0.05, 0.04, 0.42, 0x334155, g, x, 0.42, -0.04, 0.01).material = iron;
    }
    return { group: g, phys: { shape: 'box', size: [L, 0.45, 0.45], mass: 0, yOffset: 0.225 } };
  }
  function deskBench() {   // the classic Indian classroom desk + attached bench (seats two)
    const g = new T.Group(), L = 1.2, iron = mat(0x475569, { metalness: 0.5, roughness: 0.45 });
    const top = box(L, 0.035, 0.42, Z.wood, g, 0, 0.74, 0, 0.01); top.rotation.x = 0.08;                            // slanted writing top
    box(L, 0.02, 0.32, Z.woodDark, g, 0, 0.6, 0.02, 0.006);                                                          // book shelf
    box(L, 0.18, 0.02, Z.woodDark, g, 0, 0.66, -0.19, 0.006);
    box(L, 0.035, 0.3, Z.wood, g, 0, 0.44, 0.48, 0.01);                                                              // bench seat
    box(L, 0.12, 0.025, Z.wood, g, 0, 0.68, 0.64, 0.008).rotation.x = -0.12;                                        // backrest
    for (const x of [-0.55, 0.55]) {
      for (const [h, y, z] of [[0.74, 0.37, -0.18], [0.74, 0.37, 0.18], [0.44, 0.22, 0.36], [0.72, 0.36, 0.62]]) box(0.04, h, 0.04, 0x475569, g, x, y, z, 0.006).material = iron;
      box(0.04, 0.04, 0.86, 0x475569, g, x, 0.08, 0.22, 0.006).material = iron;                                     // floor runner
    }
    return { group: g, phys: { shape: 'box', size: [L, 0.76, 0.9], mass: 0, yOffset: 0.38, zOffset: 0.22 } };
  }
  function teacherTable() {
    const g = new T.Group();
    box(1.3, 0.05, 0.7, Z.woodDark, g, 0, 0.76, 0, 0.012);
    box(1.2, 0.5, 0.04, Z.wood, g, 0, 0.48, 0.32, 0.01);                                                            // modesty panel
    for (const [x, z] of [[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]]) box(0.06, 0.74, 0.06, Z.woodDark, g, x, 0.37, z, 0.01);
    const reg = box(0.3, 0.03, 0.22, 0x1d4ed8, g, -0.3, 0.8, -0.05, 0.004); reg.rotation.y = 0.2;                    // register
    box(0.07, 0.07, 0.07, 0xf8fafc, g, 0.35, 0.82, -0.1, 0.005);                                                     // chalk box
    return { group: g, phys: { shape: 'box', size: [1.3, 0.8, 0.7], mass: 0, yOffset: 0.4 } };
  }
  function blackboard(text = 'UNIT TEST') {
    const g = new T.Group(), W = 2.4, H = 1.2;
    const board = tex((c, Wd, Hd) => {
      c.fillStyle = '#1f4d3a'; c.fillRect(0, 0, Wd, Hd);
      for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; c.fillRect(Math.random() * Wd, Math.random() * Hd, 40 + Math.random() * 120, 2 + Math.random() * 6); }   // chalk smudges
      c.fillStyle = '#f8fafc'; c.textAlign = 'center'; c.font = `600 150px ${FONT}`; c.globalAlpha = 0.92; c.fillText(text, Wd / 2, Hd * 0.45);
      c.font = `500 64px ${FONT}`; c.fillText('Friday', Wd * 0.82, Hd * 0.15); c.textAlign = 'left'; c.fillText('Max marks: 25', Wd * 0.08, Hd * 0.75); c.fillText('Time: 40 min', Wd * 0.08, Hd * 0.88);
    }, 1600, 800);
    box(W + 0.12, H + 0.12, 0.05, Z.woodDark, g, 0, 1.55, -0.03, 0.01);
    mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ map: board, roughness: 0.95 }), g, 0, 1.55, 0.0);
    box(W, 0.03, 0.08, Z.woodDark, g, 0, 0.93, 0.03, 0.005);                                                          // chalk tray
    box(0.08, 0.015, 0.015, 0xffffff, g, 0.5, 0.95, 0.04, 0.004);
    return { group: g };
  }
  function classroomDoor() {
    const g = new T.Group(), W = 1.0, H = 2.1;
    for (const x of [-W / 2 - 0.05, W / 2 + 0.05]) box(0.1, H + 0.1, 0.14, 0xf8fafc, g, x, (H + 0.1) / 2, 0, 0.01);
    box(W + 0.2, 0.1, 0.14, 0xf8fafc, g, 0, H + 0.05, 0, 0.01);
    const hinge = new T.Group(); hinge.position.set(-W / 2, 0, 0); g.add(hinge);
    const door = new T.Group(); door.position.x = W / 2; hinge.add(door);
    box(W - 0.02, H - 0.02, 0.05, Z.blue, door, 0, H / 2, 0, 0.01);
    mesh(new T.BoxGeometry(0.4, 0.5, 0.055), glassMat(), door, 0, 1.55, 0);
    const sign = tex((c, Wd, Hd) => { c.fillStyle = hex(Z.cream); c.fillRect(0, 0, Wd, Hd); c.fillStyle = hex(Z.ink); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `700 110px ${FONT}`; c.fillText('CLASS VI', Wd / 2, Hd / 2); }, 640, 240);
    mesh(new T.PlaneGeometry(0.4, 0.15), new T.MeshStandardMaterial({ map: sign }), door, 0, 1.15, 0.03);
    mesh(new T.CylinderGeometry(0.018, 0.018, 0.12, 12).rotateZ(Math.PI / 2), mat(0xc0c7d0, { metalness: 0.85, roughness: 0.25 }), door, W / 2 - 0.12, 1.0, 0.05);
    g.userData.hinge = hinge;
    return { group: g };
  }
  ZAssets.register('furniture', 'bench', 'Ground bench', bench, ["seat", "outdoor"]);
  ZAssets.register('furniture', 'desk', 'Classroom desk + bench', deskBench, ["classroom", "seat", "desk"]);
  ZAssets.register('furniture', 'teacher_table', 'Teacher\'s table', teacherTable, ["classroom", "table"]);
  ZAssets.register('furniture', 'blackboard', 'Blackboard', () => blackboard(), ["classroom", "board", "chalk"]);
  ZAssets.register('furniture', 'classroom_door', 'Classroom door', classroomDoor, ["classroom", "door", "opens"]);
})();
