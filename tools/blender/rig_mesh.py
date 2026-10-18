"""
Rig a single-piece mesh (e.g. an image-to-3D / 3D-print model) with a Mixamo-named skeleton, then export a GLB the
studio's human loader can drive.

  Blender -b --python tools/blender/rig_mesh.py -- <name> <input.glb>
  → studio/characters/glb/<name>.glb

Landmarks (joint positions in the model's own coordinates: +X = character's left, −Y = front, +Z = up) live in LANDMARKS
below; measure them once from an orthographic front + side render. Skin weights are computed here, not by Blender's
bone-heat (which fails on fused, non-manifold scans): smooth distance falloff to the nearest bones, with hair (dark
texels) bound to the head / upper back so long hair doesn't follow the arms beside it.
"""
import bpy, bmesh, sys, os, math
import numpy as np
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(args) < 2: sys.exit('usage: blender -b -P tools/blender/rig_mesh.py -- <name> <path/to/source.glb>')
NAME, SRC = args[0], args[1]
def log(*a): print('[rig]', *a, flush=True)

LANDMARKS = {   # waifu010 (measured from ortho renders); y: −0.12 ≈ body centre line front-to-back
    'Hips': (0, -0.12, -0.36), 'Spine': (0, -0.12, -0.18), 'Spine1': (0, -0.13, 0.0), 'Spine2': (0, -0.12, 0.18), 'Neck': (0, -0.06, 0.40), 'Head': (0, -0.07, 0.52), 'HeadTop': (0, -0.07, 0.95),
    'LeftShoulder': (0.06, -0.08, 0.36), 'LeftArm': (0.28, -0.06, 0.33), 'LeftForeArm': (0.39, 0.0, -0.20), 'LeftHand': (0.43, -0.02, -0.62), 'LeftHandEnd': (0.44, -0.04, -0.80),
    'LeftUpLeg': (0.12, -0.12, -0.50), 'LeftLeg': (0.13, -0.10, -1.30), 'LeftFoot': (0.13, -0.05, -2.05), 'LeftToeBase': (0.13, -0.25, -2.15),
}
for k, v in list(LANDMARKS.items()):
    if k.startswith('Left'): LANDMARKS['Right' + k[4:]] = (-v[0], v[1], v[2])
HEAD_UNITS, REAL_HEIGHT, HEAD_COUNT = 0.95 - 0.52, 1.65, 7.5   # scale: anime adult ≈ 7.5 heads tall

for o in list(bpy.data.objects): bpy.data.objects.remove(o)
bpy.ops.import_scene.gltf(filepath=SRC)
mesh = next(o for o in bpy.data.objects if o.type == 'MESH'); mesh.name = NAME
bpy.context.view_layer.objects.active = mesh; mesh.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bm = bmesh.new(); bm.from_mesh(mesh.data); nv0 = len(bm.verts); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); bm.to_mesh(mesh.data); bm.free()   # weld UV-seam splits (texture kept per corner)
log('welded verts', nv0, '->', len(mesh.data.vertices))
log('faces before', len(mesh.data.polygons))
dec = mesh.modifiers.new('decimate', 'DECIMATE'); dec.ratio = min(1.0, 80000 / max(1, len(mesh.data.polygons))); bpy.ops.object.modifier_apply(modifier='decimate')
log('faces after', len(mesh.data.polygons))

# ---------- skeleton ----------
bpy.ops.object.armature_add(enter_editmode=True); rig = bpy.context.object; rig.name = f'{NAME}_rig'
eb = rig.data.edit_bones; eb.remove(eb[0])
L = {k: Vector(v) for k, v in LANDMARKS.items()}
BONES = [('Hips', 'Spine', None), ('Spine', 'Spine1', 'Hips'), ('Spine1', 'Spine2', 'Spine'), ('Spine2', 'Neck', 'Spine1'), ('Neck', 'Head', 'Spine2'), ('Head', 'HeadTop', 'Neck')]
for s in ('Left', 'Right'):
    BONES += [(f'{s}Shoulder', f'{s}Arm', 'Spine2'), (f'{s}Arm', f'{s}ForeArm', f'{s}Shoulder'), (f'{s}ForeArm', f'{s}Hand', f'{s}Arm'), (f'{s}Hand', f'{s}HandEnd', f'{s}ForeArm'),
              (f'{s}UpLeg', f'{s}Leg', 'Hips'), (f'{s}Leg', f'{s}Foot', f'{s}UpLeg'), (f'{s}Foot', f'{s}ToeBase', f'{s}Leg'), (f'{s}ToeBase', None, f'{s}Foot')]
for name, tail, parent in BONES:
    b = eb.new('mixamorig:' + name); b.head = L[name]; b.tail = L[tail] if tail else L[name] + Vector((0, -0.12, 0))
    if parent: b.parent = eb['mixamorig:' + parent]; b.use_connect = False
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- weights: smooth falloff to bone segments ----------
me = mesh.data; n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
# hair mask from the texture (dark, low-saturation texels)
hair = np.zeros(n, bool)
img = None
for m in mesh.material_slots:
    if m.material and m.material.use_nodes:
        for nd in m.material.node_tree.nodes:
            if nd.type == 'TEX_IMAGE' and nd.image: img = nd.image
if img and me.uv_layers:
    W, H = img.size; px = np.array(img.pixels[:]).reshape(H, W, 4)
    uv = np.zeros((n, 2)); cnt = np.zeros(n)
    luv = np.empty(len(me.loops) * 2); me.uv_layers.active.data.foreach_get('uv', luv); luv = luv.reshape(-1, 2)
    lv = np.empty(len(me.loops), int); me.loops.foreach_get('vertex_index', lv)
    np.add.at(uv, lv, luv); np.add.at(cnt, lv, 1); uv /= np.maximum(cnt, 1)[:, None]
    xi = np.clip((uv[:, 0] % 1) * (W - 1), 0, W - 1).astype(int); yi = np.clip((uv[:, 1] % 1) * (H - 1), 0, H - 1).astype(int)
    rgb = px[yi, xi, :3]; lum = rgb @ np.array([0.2126, 0.7152, 0.0722]); sat = rgb.max(1) - rgb.min(1)
    hair = (lum < 0.09) & (sat < 0.06) & (co[:, 2] > -0.3) & ~((np.abs(co[:, 0]) < 0.25) & (co[:, 1] < -0.2))
    log('hair verts', int(hair.sum()), 'of', n)
segs = {name: (L[name], L[tail] if tail else L[name] + Vector((0, -0.12, 0))) for name, tail, _ in BONES if not name.endswith(('HandEnd',))}
names = list(segs.keys())
A = np.array([segs[k][0] for k in names]); B = np.array([segs[k][1] for k in names])
def seg_dist(P):
    AB = B - A; t = np.clip(((P[:, None, :] - A[None]) * AB[None]).sum(2) / (AB * AB).sum(1)[None], 0, 1)
    proj = A[None] + t[..., None] * AB[None]; return np.linalg.norm(P[:, None, :] - proj, axis=2)
E = np.concatenate([seg_dist(co[i:i + 20000]) for i in range(0, n, 20000)])   # straight-line distance to each bone
idx = {k: i for i, k in enumerate(names)}
# geodesic distance (walking along the surface) from each bone's core: separates hair / skirt that merely touch an arm
import heapq
ev = np.empty(len(me.edges) * 2, int); me.edges.foreach_get('vertices', ev); ev = ev.reshape(-1, 2)
el = np.linalg.norm(co[ev[:, 0]] - co[ev[:, 1]], axis=1)
order = np.argsort(np.concatenate([ev[:, 0], ev[:, 1]])); nb_v = np.concatenate([ev[:, 1], ev[:, 0]])[order]; nb_w = np.concatenate([el, el])[order]
start = np.searchsorted(np.concatenate([ev[:, 0], ev[:, 1]])[order], np.arange(n + 1))
def geodesic(seed_mask, seed_d):
    dist = np.full(n, np.inf); dist[seed_mask] = seed_d[seed_mask]; h = [(dist[v], v) for v in np.where(seed_mask)[0]]; heapq.heapify(h)
    while h:
        d, v = heapq.heappop(h)
        if d > dist[v]: continue
        for k in range(start[v], start[v + 1]):
            u = nb_v[k]; nd = d + nb_w[k]
            if nd < dist[u]: dist[u] = nd; heapq.heappush(h, (nd, u))
    return dist
D = np.empty_like(E)
for bi, b in enumerate(names):
    e = E[:, bi]; r = max(0.035, np.percentile(e, 0.8) * 1.15)   # core: the closest ~1% of the surface to this bone
    g = geodesic(e < r, e); g[~np.isfinite(g)] = e[~np.isfinite(g)] * 3 + 1
    D[:, bi] = g
log('geodesic weights computed')
# fused contact zones: the skirt / thighs never follow the hands resting on them, and the hands never follow the legs
legzone = (co[:, 2] < -0.28) & (np.abs(co[:, 0]) < 0.355)
handzone = (co[:, 2] < -0.3) & (np.abs(co[:, 0]) > 0.375)
for side in ('Left', 'Right'):
    for part in ('Arm', 'ForeArm', 'Hand'): D[legzone, idx[f'{side}{part}']] *= 8
    for part in ('UpLeg', 'Leg'): D[handzone, idx[f'{side}{part}']] *= 8
D[handzone, idx['Hips']] *= 8; D[handzone, idx['Spine']] *= 8
Wt = 1.0 / np.maximum(D, 0.004) ** 4
# hair: head on top, blending into the upper back as it hangs lower
hz = np.clip((co[:, 2] - 0.15) / 0.4, 0, 1)
Wt[hair] = 0; Wt[hair, idx['Head']] = hz[hair] + 0.02; Wt[hair, idx['Neck']] = (1 - hz[hair]) * 0.4; Wt[hair, idx['Spine2']] = (1 - hz[hair]) * 0.8
top = np.argsort(-Wt, axis=1)[:, :3]; Wt3 = np.take_along_axis(Wt, top, 1); Wt3 /= Wt3.sum(1, keepdims=True)
groups = {k: mesh.vertex_groups.new(name='mixamorig:' + k) for k in names}
for vi in range(n):
    for j in range(3):
        w = float(Wt3[vi, j])
        if w > 0.01: groups[names[top[vi, j]]].add([vi], w, 'REPLACE')
md = mesh.modifiers.new('Armature', 'ARMATURE'); md.object = rig; mesh.parent = rig
log('weights done')

# ---------- scale to real size + stand on the ground (feet would be at Head − 7.5 heads) ----------
s = REAL_HEIGHT / (HEAD_UNITS * HEAD_COUNT); ground = 0.95 - HEAD_UNITS * HEAD_COUNT
rig.scale = (s, s, s); rig.location = (0, 0, -ground * s)
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
mesh.select_set(True); bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

out = os.path.join(ROOT, 'studio', 'characters', 'glb', f'{NAME}.glb')
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True); mesh.select_set(True); bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True, export_skins=True, export_apply=False, export_animations=False, export_yup=True,
                          export_image_format='JPEG', export_jpeg_quality=90)
log('exported', out, os.path.getsize(out) // 1024, 'KB')
