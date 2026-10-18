"""
Build a rigged, stylised Zungga Explorer in Blender (headless) from the MPFB base human.

  /Applications/Blender.app/Contents/MacOS/Blender -b --python tools/blender/build_explorer.py -- kai
  → studio/characters/glb/kai.glb   (+ exports/explorer-kai-preview.png)

One smooth base body → kid proportions (MPFB sliders) → cartoon stylisation (bigger head, bigger eyes, rounder
face) → Mixamo skeleton with smooth skin weights → face shape keys (blink, brows, smile, mouth open …) →
eyeballs on their own bones → clothes made as fitted layers of the same body (so they bend exactly with it)
→ hair → GLB with skin + morph targets. Needs: Blender 4.2+ with the MPFB extension (see README → Characters).
"""
import bpy, bmesh, sys, math, os, json
from mathutils import Vector
import addon_utils
addon_utils.enable('bl_ext.user_default.mpfb', default_set=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MPFB = os.path.join(os.path.dirname(sys.modules['bl_ext.user_default.mpfb'].__file__), 'data', 'targets')
who = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'kai'

# ---------- the explorers (colours from the character bible) ----------
C = lambda h: tuple(((h >> s) & 255) / 255 for s in (16, 8, 0))
SPEC = {
    'kai': dict(gender=1.0, age=0.17, weight=0.5, muscle=0.5, height=0.55, skin=0xe9a777, hair=0x4a2b1a, eyes=0x5a3416, hairstyle='messy',
                top=('hoodie', 0x1e5fd0), bottom=('jeans', 0x243447), shoes=(0x1e5fd0, 0xffffff)),
    'rio': dict(gender=1.0, age=0.16, weight=0.45, muscle=0.5, height=0.5, skin=0xeaa678, hair=0x3d2416, eyes=0x5a3416, hairstyle='spiky',
                top=('jacket', 0xff6a00), bottom=('shorts', 0x2b2b2b), shoes=(0xff6a00, 0xffffff)),
    'tara': dict(gender=0.0, age=0.16, weight=0.42, muscle=0.4, height=0.48, skin=0xe5a173, hair=0x17131c, eyes=0x4a2a14, hairstyle='ponytail',
                 top=('hoodie', 0x14b3c8), bottom=('jeans', 0x2d3047), shoes=(0x14b3c8, 0xffffff)),
    'mira': dict(gender=0.0, age=0.16, weight=0.45, muscle=0.4, height=0.48, skin=0xebab7e, hair=0x4b2c1b, eyes=0x5a3416, hairstyle='long',
                 top=('hoodie', 0xff6fa6), bottom=('jeans', 0x4e7bb5), shoes=(0x7b61ff, 0xffffff)),
    'jax': dict(gender=1.0, age=0.19, weight=0.7, muscle=0.65, height=0.62, skin=0xd9925f, hair=0x2e1a10, eyes=0x3d2414, hairstyle='flattop',
                top=('jacket', 0xc0282d), bottom=('jeans', 0x3b1f17), shoes=(0x4a2a1c, 0xc0282d)),
}[who]
HEAD_SCALE, EYE_SCALE, EYE_REGION = 1.8, 1.0, 1.55   # cartoon head; eye area (sockets + lids + eyeballs) enlarged together   # cartoon head (applied on top of the MPFB head/eye sliders)

def log(*a): print('[explorer]', *a, flush=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)

# ---------- 1. base human with kid proportions ----------
macro = TargetService.get_default_macro_info_dict()
macro.update(gender=SPEC['gender'], age=SPEC['age'], weight=SPEC['weight'], muscle=SPEC['muscle'], height=SPEC['height'], proportions=0.5)
macro['race'] = {'asian': 0.45, 'caucasian': 0.2, 'african': 0.35}
body = HumanService.create_human(macro_detail_dict=macro)
body.name = f'{who}_body'
# stylisation sliders: round full face, bigger eyes, small soft nose, fuller cheeks
STYLE = {'head/head-round': 0.8, 'head/head-fat-incr': 0.35, 'eyes/l-eye-scale-incr': 1.0, 'eyes/r-eye-scale-incr': 1.0,
         'nose/nose-scale-horiz-decr': 0.4, 'nose/nose-scale-vert-decr': 0.5, 'cheek/l-cheek-inner-incr': 0.4, 'cheek/r-cheek-inner-incr': 0.4,
         'chin/chin-prominent-decr': 0.5, 'neck/neck-scale-vert-decr': 0.5}
for rel, w in STYLE.items():
    p = os.path.join(MPFB, rel + '.target.gz')
    if os.path.exists(p): TargetService.load_target(body, p, weight=w, name=rel.split('/')[-1])
    else: log('missing target', rel)

# ---------- 2. skeleton (Mixamo naming: any Mixamo animation fits) + smooth weights ----------
rig = HumanService.add_builtin_rig(body, 'mixamo', import_weights=True)
rig.name = f'{who}_rig'
bpy.context.view_layer.update()

# ---------- 3. bake the body shape, keep face expressions as shape keys ----------
TargetService.bake_targets(body)
UNITS = os.path.join(MPFB, 'expression', 'units', 'caucasian')
for f in sorted(os.listdir(UNITS)):
    name = f.replace('.target.gz', '')
    TargetService.load_target(body, os.path.join(UNITS, f), weight=0.0, name=name)
log('shape keys:', len(body.data.shape_keys.key_blocks) - 1)

# eye centres + radius from the MPFB eye helpers (before helpers are removed)
def group_points(obj, gname):
    gi = obj.vertex_groups[gname].index
    return [obj.matrix_world @ v.co for v in obj.data.vertices if any(g.group == gi and g.weight > 0.5 for g in v.groups)]
eyes = {}
for side in ('l', 'r'):
    pts = group_points(body, f'helper-{side}-eye'); c = sum(pts, Vector()) / len(pts)
    eyes[side] = (c, max((p - c).length for p in pts))

# ---------- 4. remove helper geometry (keep only the visible body) ----------
gi_body = body.vertex_groups['body'].index
bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table()
dl = bm.verts.layers.deform.active
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v[dl].get(gi_body, 0.0) < 0.5], context='VERTS')
bm.to_mesh(body.data); bm.free()
for m in list(body.modifiers):
    if m.type == 'MASK': body.modifiers.remove(m)

# ---------- 5. cartoon head: scale the head region (weighted by the head bone) around the neck top ----------
head_bone = rig.data.bones['mixamorig:Head']
pivot = rig.matrix_world @ head_bone.head_local
gi_head = body.vertex_groups['mixamorig:Head'].index; gi_neck = body.vertex_groups['mixamorig:Neck'].index
wts = []
for v in body.data.vertices:
    w = 0.0
    for g in v.groups:
        if g.group == gi_head: w += g.weight
        elif g.group == gi_neck: w += g.weight * 0.35
    wts.append(min(1.0, w))
def stylise(co, w): return pivot + (co - pivot) * (1 + (HEAD_SCALE - 1) * w)
for kb in body.data.shape_keys.key_blocks:
    for i, d in enumerate(kb.data): d.co = stylise(d.co, wts[i])
for i, v in enumerate(body.data.vertices): v.co = body.data.shape_keys.key_blocks[0].data[i].co
for side in eyes: c, r = eyes[side]; eyes[side] = (stylise(c, 1.0), r * HEAD_SCALE)
# big cartoon eyes: push everything around each eye outward from the eye centre with a soft falloff
def eye_grow(co):
    for side in eyes:
        c, r = eyes[side]; R = r * 3.0; d = (co - c).length
        if d < R: k = (1 - d / R) ** 1.5; co = c + (co - c) * (1 + (EYE_REGION - 1) * k)
    return co
for kb in body.data.shape_keys.key_blocks:
    for d in kb.data: d.co = eye_grow(d.co)
for i, v in enumerate(body.data.vertices): v.co = body.data.shape_keys.key_blocks[0].data[i].co
for side in eyes: c, r = eyes[side]; eyes[side] = (c, r * EYE_REGION)
# move the head bone tail with the bigger head
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='EDIT')
eb = rig.data.edit_bones; hb = eb['mixamorig:Head']; hb.tail = pivot + (hb.tail - pivot) * HEAD_SCALE
# eye bones (children of the head) so the eyes can look around
for side, nm in (('l', 'mixamorig:LeftEye'), ('r', 'mixamorig:RightEye')):
    c, r = eyes[side]; b = eb.new(nm); b.head = c; b.tail = c + Vector((0, -r * 2, 0)); b.parent = hb
bpy.ops.object.mode_set(mode='OBJECT')

# ---------- materials ----------
def mat(name, rgb, rough=0.6, sheen=0.0, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*rgb, 1); p.inputs['Roughness'].default_value = rough
    if 'Coat Weight' in p.inputs: p.inputs['Coat Weight'].default_value = coat
    if 'Sheen Weight' in p.inputs: p.inputs['Sheen Weight'].default_value = sheen
    return m
srgb = lambda h: tuple(((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92 for c in C(h))   # glTF wants linear
body.data.materials.clear(); body.data.materials.append(mat('skin', srgb(SPEC['skin']), 0.55, sheen=0.3))
# ---------- 6. eyeballs: white ball + iris + pupil + glint, on the eye bones ----------
def skinned(obj, bone):
    obj.vertex_groups.clear(); g = obj.vertex_groups.new(name=bone); g.add([v.index for v in obj.data.vertices], 1.0, 'REPLACE')
    md = obj.modifiers.new('Armature', 'ARMATURE'); md.object = rig; obj.parent = rig
front = Vector((0, -1, 0))   # MPFB/Blender: the character faces −Y
for side, nm in (('l', 'mixamorig:LeftEye'), ('r', 'mixamorig:RightEye')):
    c, r = eyes[side]
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=r * 0.98 * EYE_SCALE, location=c); ball = bpy.context.object; ball.name = f'{who}_eye_{side}'
    ball.data.materials.append(mat('sclera', (0.95, 0.94, 0.92), 0.15, coat=1.0))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=48, radius=r * 1.0 * EYE_SCALE, location=c); iris = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(iris.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.normalized().dot(front)) < 0.82], context='VERTS'); bm.to_mesh(iris.data); bm.free()
    iris.data.materials.append(mat('iris', srgb(SPEC['eyes']), 0.2, coat=1.0))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=48, radius=r * 1.01 * EYE_SCALE, location=c); pupil = bpy.context.object
    bm = bmesh.new(); bm.from_mesh(pupil.data); bmesh.ops.delete(bm, geom=[v for v in bm.verts if (v.co.normalized().dot(front)) < 0.95], context='VERTS'); bm.to_mesh(pupil.data); bm.free()
    pupil.data.materials.append(mat('pupil', (0.01, 0.008, 0.006), 0.15, coat=1.0))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=r * 0.17, location=c + Vector((-r * 0.3, -r * 0.92, r * 0.32))); glint = bpy.context.object
    em = mat('glint', (1, 1, 1), 0.1); em.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (1, 1, 1, 1); em.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 3; glint.data.materials.append(em)
    for o in (iris, pupil, glint): o.select_set(True)
    ball.select_set(True); bpy.context.view_layer.objects.active = ball; bpy.ops.object.join()
    skinned(ball, nm)

# ---------- 7. clothes: fitted layers of the body, cut by bone regions, pushed out a little ----------
def wsum(v, idx): return sum(g.weight for g in v.groups if g.group in idx)
def gidx(names): return {body.vertex_groups[n].index for n in names if n in body.vertex_groups}
def bonez(n): return (rig.matrix_world @ rig.data.bones[n].head_local).z
def region(names, exclude=(), zmin=-9, zmax=9, thr=0.3):
    idx, ex = gidx(names), gidx(exclude)
    return [wsum(v, idx) > thr and wsum(v, ex) < 0.5 and zmin <= v.co.z <= zmax for v in body.data.vertices]
def garment(name, keep, push, color, rough=0.85, extra_scale=None):
    me = body.data.copy(); ob = bpy.data.objects.new(f'{who}_{name}', me); bpy.context.collection.objects.link(ob)
    ob.shape_key_clear()
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not keep[v.index]], context='VERTS')
    bm.normal_update()
    for v in bm.verts: v.co += v.normal * push
    bm.to_mesh(me); bm.free()
    me.materials.clear(); me.materials.append(mat(name, srgb(color), rough, sheen=0.4))
    sol = ob.modifiers.new('thickness', 'SOLIDIFY'); sol.thickness = 0.004; sol.offset = 1
    md = ob.modifiers.new('Armature', 'ARMATURE'); md.object = rig; ob.parent = rig
    for p in ob.data.polygons: p.use_smooth = True
    return ob
L = lambda *n: [f'mixamorig:{s}{x}' for x in n for s in ('Left', 'Right')]
torso = ['mixamorig:Spine', 'mixamorig:Spine1', 'mixamorig:Spine2', 'mixamorig:Hips'] + L('Shoulder', 'Arm', 'ForeArm')
kind, tcol = SPEC['top']
hipz = bonez('mixamorig:Hips'); neckz = bonez('mixamorig:Neck')
top = garment('top', region(torso + L('UpLeg'), exclude=['mixamorig:Head'] + L('Hand'), zmin=hipz - 0.07, zmax=neckz + 0.005, thr=0.15), 0.012, tcol)
bkind, bcol = SPEC['bottom']
legs = ['mixamorig:Hips'] + L('UpLeg') + ([] if bkind == 'shorts' else L('Leg'))
kneez = bonez('mixamorig:LeftLeg'); anklez = bonez('mixamorig:LeftFoot')
pants = garment('pants', region(legs + ['mixamorig:Spine'], zmin=(kneez + 0.05 if bkind == 'shorts' else anklez + 0.02), zmax=hipz + 0.05, thr=0.15), 0.008, bcol, 0.9)
for side in ('Left', 'Right'):
    fb, tb = rig.data.bones[f'mixamorig:{side}Foot'], rig.data.bones[f'mixamorig:{side}ToeBase']
    a, b = rig.matrix_world @ fb.head_local, rig.matrix_world @ tb.tail_local; mid = (a + b) / 2; L2 = (b - a).length
    bpy.ops.mesh.primitive_cube_add(size=1, location=(mid.x, mid.y - 0.005, 0.045)); up = bpy.context.object
    up.scale = (0.095, L2 * 1.35, 0.075); bpy.ops.object.transform_apply(scale=True)
    bv = up.modifiers.new('bevel', 'BEVEL'); bv.width = 0.03; bv.segments = 5; bpy.ops.object.modifier_apply(modifier='bevel')
    up.data.materials.append(mat('shoe', srgb(SPEC['shoes'][0]), 0.55))
    bpy.ops.mesh.primitive_cube_add(size=1, location=(mid.x, mid.y - 0.01, 0.013)); so = bpy.context.object
    so.scale = (0.105, L2 * 1.45, 0.026); bpy.ops.object.transform_apply(scale=True)
    bv = so.modifiers.new('bevel', 'BEVEL'); bv.width = 0.012; bv.segments = 4; bpy.ops.object.modifier_apply(modifier='bevel')
    so.data.materials.append(mat('sole', srgb(SPEC['shoes'][1]), 0.6))
    so.select_set(True); up.select_set(True); bpy.context.view_layer.objects.active = up; bpy.ops.object.join(); up.name = f'{who}_shoe_{side}'
    skinned(up, f'mixamorig:{side}Foot')

# ---------- 8. hair: a cap over the skull + locks (simple first pass) ----------
cap_keep = []
hz = max(eyes['l'][0].z, eyes['r'][0].z)
for i, v in enumerate(body.data.vertices):
    w = wts[i]; co = v.co
    cap_keep.append(w > 0.95 and (co.z > hz + eyes['l'][1] * 1.6 or (co.y > pivot.y + 0.01 and co.z > pivot.z + 0.04)))
hair = garment('hair', cap_keep, 0.012, SPEC['hair'], 0.45)
import random; random.seed(len(who) * 7)
hm = hair.data.materials[0]
locks = []
for k in range(70 if SPEC['hairstyle'] in ('messy', 'spiky') else 30):
    th = random.uniform(0, math.pi * 2); ph = random.uniform(0.15, 1.05)
    hc = pivot + Vector((0, 0.01, 0.13 * HEAD_SCALE * 0.62))
    rr = 0.105 * HEAD_SCALE
    base = hc + Vector((math.sin(ph) * math.cos(th) * rr * 0.92, math.sin(ph) * math.sin(th) * rr, math.cos(ph) * rr * 0.95))
    out = (base - hc).normalized()
    if base.y < hc.y - 0.03 and base.z < hc.z + 0.05: continue   # keep the face clear
    bpy.ops.mesh.primitive_cone_add(vertices=7, radius1=0.018, radius2=0.0, depth=0.06 if SPEC['hairstyle'] != 'flattop' else 0.03, location=base + out * 0.02)
    lk = bpy.context.object; lk.rotation_mode = 'QUATERNION'; lk.rotation_quaternion = Vector((0, 0, 1)).rotation_difference((out + Vector((0, 0.15, 0.6))).normalized())
    lk.data.materials.append(hm); locks.append(lk)
if locks:
    for o in locks: o.select_set(True)
    bpy.context.view_layer.objects.active = locks[0]; bpy.ops.object.join(); lk = bpy.context.object; lk.name = f'{who}_locks'
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True); skinned(lk, 'mixamorig:Head')
for p in body.data.polygons: p.use_smooth = True

# ---------- 9. export GLB (skin + morph targets) ----------
out_dir = os.path.join(ROOT, 'studio', 'characters', 'glb'); os.makedirs(out_dir, exist_ok=True)
glb = os.path.join(out_dir, f'{who}.glb')
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
    if o.type in ('MESH', 'ARMATURE'): o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_skins=True, export_morph=True, export_morph_normal=False,
                          export_apply=True, export_animations=False, export_yup=True)
log('exported', glb, os.path.getsize(glb) // 1024, 'KB')

# ---------- 10. a quick preview render (arms relaxed) ----------
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='POSE')
for side, sgn in (('Left', 1), ('Right', -1)):
    pb = rig.pose.bones[f'mixamorig:{side}Arm']; pb.rotation_mode = 'XYZ'; pb.rotation_euler = (0, 0, 0)
bpy.ops.object.mode_set(mode='OBJECT')
sc = bpy.context.scene
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: sc.render.engine = eng; break
    except Exception: pass
sc.render.resolution_x, sc.render.resolution_y = 900, 1200
bpy.ops.object.camera_add(location=(0.45, -2.6, 0.85)); cam = bpy.context.object; sc.camera = cam
d = Vector((0, 0, 0.72)) - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = 50
bpy.ops.object.light_add(type='AREA', location=(1.5, -2, 2.5)); bpy.context.object.data.energy = 300; bpy.context.object.data.size = 2
bpy.ops.object.light_add(type='AREA', location=(-2, -1, 1.5)); bpy.context.object.data.energy = 120
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.95, 0.93, 0.98, 1)
sc.render.filepath = os.path.join(ROOT, 'exports', f'explorer-{who}-preview.png'); bpy.ops.render.render(write_still=True)
hc = (eyes['l'][0] + eyes['r'][0]) / 2; cam.location = hc + Vector((0.08, -0.75, 0.02)); cam.rotation_euler = (hc - cam.location).to_track_quat('-Z', 'Y').to_euler()
sc.render.resolution_x, sc.render.resolution_y = 900, 900
sc.render.filepath = os.path.join(ROOT, 'exports', f'explorer-{who}-face.png'); bpy.ops.render.render(write_still=True)
log('preview', sc.render.filepath)
