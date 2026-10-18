"""
Build a natural-looking, fully rigged kid in Blender (headless) from MPFB + the MakeHuman CC0 asset pack.

  /Applications/Blender.app/Contents/MacOS/Blender -b --python tools/blender/build_human.py -- kai
  → studio/characters/glb/kai.glb  + exports/human-kai-{full,face,back}.png

Body (age / gender / build sliders) → Mixamo skeleton with smooth weights → realistic skin, brown eyes, brows, lashes,
teeth, tongue, hair, clothes, shoes (all fitted + rigged by MPFB) → 34 face shape keys (blink, brows, smile, jaw …),
copied onto brows / lashes / teeth so they move with the face → GLB (skin + morph targets).
Setup: Blender 4.2+, MPFB extension, MakeHuman system assets in <Blender user>/mpfb/data (README → Characters).
"""
import bpy, sys, os, math
from mathutils import Vector, kdtree
import addon_utils
addon_utils.enable('bl_ext.user_default.mpfb', default_set=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.assetservice import AssetService

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TARGETS = os.path.join(os.path.dirname(sys.modules['bl_ext.user_default.mpfb'].__file__), 'data', 'targets')
who = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'kai'

# ---------- the kids: build + look + clothes (MakeHuman CC0 assets) ----------
SPEC = {
    'kai':  dict(gender=1.0, age=0.18, weight=0.5,  muscle=0.5,  height=0.55, race=(0.5, 0.15, 0.35), skin='young_asian_male',   hair='short02',   brows='eyebrow001', eyes='brown',      clothes=['male_casualsuit02', 'shoes06'], hair_tint=0x3a2416, skin_tint=0xf2cfb4, tee='kai_tee.jpg'),
    'rio':  dict(gender=1.0, age=0.17, weight=0.45, muscle=0.5,  height=0.5,  race=(0.45, 0.1, 0.45), skin='young_asian_male',   hair='short01',   brows='eyebrow002', eyes='brown',      clothes=['male_casualsuit06', 'shoes02'], hair_tint=0x2a1810, skin_tint=0xf2cfb4),
    'tara': dict(gender=0.0, age=0.17, weight=0.42, muscle=0.45, height=0.48, race=(0.55, 0.1, 0.35), skin='young_asian_female', hair='ponytail01', brows='eyebrow010', eyes='brown',      clothes=['female_casualsuit01', 'shoes06'], hair_tint=0x141018, skin_tint=0xf0cdb2),
    'mira': dict(gender=0.0, age=0.17, weight=0.45, muscle=0.45, height=0.48, race=(0.5, 0.15, 0.35), skin='young_asian_female', hair='long01',    brows='eyebrow011', eyes='brownlight', clothes=['female_casualsuit02', 'shoes06'], hair_tint=0x3a2216, skin_tint=0xf4d3ba),
    'jax':  dict(gender=1.0, age=0.2,  weight=0.75, muscle=0.7,  height=0.62, race=(0.55, 0.1, 0.35), skin='young_asian_male', hair='short01',   brows='eyebrow004', eyes='brown',      clothes=['male_casualsuit05', 'shoes03'], hair_tint=0x1e120c, skin_tint=0xe2b694),
}[who]
def log(*a): print('[human]', *a, flush=True)
for o in list(bpy.data.objects): bpy.data.objects.remove(o)

info = HumanService._create_default_human_info_dict()
info['phenotype'].update(gender=SPEC['gender'], age=SPEC['age'], weight=SPEC['weight'], muscle=SPEC['muscle'], height=SPEC['height'], proportions=0.55)
info['phenotype']['race'] = dict(zip(('asian', 'caucasian', 'african'), SPEC['race']))
info['rig'] = 'mixamo'
info.update(eyes='high-poly.mhclo', eyebrows=SPEC['brows'] + '.mhclo', eyelashes='eyelashes01.mhclo', teeth='teeth_base.mhclo', tongue='', hair=SPEC['hair'] + '.mhclo')
info['clothes'] = [c + '.mhclo' for c in SPEC['clothes']]
info['skin_mhmat'] = AssetService.find_asset_absolute_path(f"{SPEC['skin']}.mhmat", 'skins') or ''
info['skin_material_type'] = 'GAMEENGINE'
info['eyes_material_type'] = 'MAKESKIN'
info['alternative_materials'] = {}
# a touch of appeal: slightly rounder face, bigger eyes, softer nose (still natural)
info['targets'] = [{'target': t, 'value': v} for t, v in (('head-round', 0.45), ('l-eye-scale-incr', 0.6), ('r-eye-scale-incr', 0.6), ('nose-scale-horiz-decr', 0.25))]
settings = HumanService.get_default_deserialization_settings()
settings.update(subdiv_levels=0, override_skin_model='GAMEENGINE', override_clothes_model='GAMEENGINE', override_eyes_model='MAKESKIN')
body = HumanService.deserialize_from_dict(info, settings)
body.name = f'{who}_body'
rig = body.parent if body.parent and body.parent.type == 'ARMATURE' else next(o for o in bpy.data.objects if o.type == 'ARMATURE')
parts = [o for o in bpy.data.objects if o.type == 'MESH' and o is not body]
log('parts:', [o.name for o in parts])

# eyes: swap in the chosen iris colour
eyes = next((o for o in parts if 'eye' in o.name.lower() and 'brow' not in o.name.lower() and 'lash' not in o.name.lower()), None)
if eyes:
    img = AssetService.find_asset_absolute_path(f"{SPEC['eyes']}_eye.png", 'eyes')
    if img:
        for slot in eyes.material_slots:
            for n in (slot.material.node_tree.nodes if slot.material and slot.material.use_nodes else []):
                if n.type == 'TEX_IMAGE': n.image = bpy.data.images.load(img, check_existing=True)

# ---------- colour tints (multiplied over the textures; exported as glTF base colour factors) ----------
def tint(obj, hexc):
    if not obj: return
    rgb = tuple((((hexc >> s) & 255) / 255) ** 2.2 for s in (16, 8, 0))
    for slot in obj.material_slots:
        m = slot.material
        if not m or not m.use_nodes: continue
        bsdf = next((n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        if not bsdf: continue
        inp = bsdf.inputs['Base Color']
        if inp.is_linked:
            src = inp.links[0].from_socket; mix = m.node_tree.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
            mix.inputs['Factor'].default_value = 1.0; m.node_tree.links.new(src, mix.inputs['A']); mix.inputs['B'].default_value = (*rgb, 1)
            m.node_tree.links.new(mix.outputs['Result'], inp)
        else: inp.default_value = (*rgb, 1)
part = lambda key: next((o for o in parts if key in o.name.lower()), None)
tint(part(SPEC['hair']), SPEC['hair_tint']); tint(part('eyebrow'), SPEC['hair_tint'])
k = SPEC['skin_tint']; tint(body, k)
# Zungga tee texture (MakeHuman logo replaced)
if SPEC.get('tee'):
    timg = bpy.data.images.load(os.path.join(ROOT, 'studio', 'characters', 'textures', SPEC['tee']), check_existing=True)
    for o in parts:
        for slot in o.material_slots:
            if slot.material and slot.material.use_nodes:
                for n in slot.material.node_tree.nodes:
                    if n.type == 'TEX_IMAGE' and n.image and 'diffuse' in n.image.name and 'casualsuit' in n.image.name: n.image = timg
# eyes: point every image node at the chosen iris texture
img_path = AssetService.find_asset_absolute_path(f"{SPEC['eyes']}_eye.png", 'eyes')
eo = part('high-poly')
if eo and img_path:
    im = bpy.data.images.load(img_path, check_existing=True)
    for slot in eo.material_slots:
        if slot.material and slot.material.use_nodes:
            for n in slot.material.node_tree.nodes:
                if n.type == 'TEX_IMAGE': log('eye tex', n.image.name if n.image else None, '->', os.path.basename(img_path)); n.image = im
# ---------- face shapes: bake the body shape, add the 34 expression units ----------
TargetService.bake_targets(body)
UNITS = os.path.join(TARGETS, 'expression', 'units', 'caucasian')
names = []
for f in sorted(os.listdir(UNITS)):
    n = f.replace('.target.gz', ''); TargetService.load_target(body, os.path.join(UNITS, f), weight=0.0, name=n); names.append(n)
kb = body.data.shape_keys.key_blocks
log('face shapes:', len(names))
# remove MakeHuman's helper geometry (skirt / hair / tights fitting guides), keeping every shape key in step
import bmesh
masks = [(body.vertex_groups[m.vertex_group].index, m.invert_vertex_group) for m in body.modifiers if m.type == 'MASK' and m.vertex_group in body.vertex_groups]
log('masks:', [(body.vertex_groups[i].name, inv) for i, inv in masks])
bm = bmesh.new(); bm.from_mesh(body.data); bm.verts.ensure_lookup_table(); dl = bm.verts.layers.deform.active
def hidden(v):   # hidden by any mask: helpers outside 'body', and skin covered by clothes
    for gi, inv in masks:
        w = v[dl].get(gi, 0.0) > 0.5
        if (w if inv else not w): return True
    return False
bmesh.ops.delete(bm, geom=[v for v in bm.verts if hidden(v)], context='VERTS'); bm.to_mesh(body.data); bm.free()
for m in list(body.modifiers):
    if m.type == 'MASK': body.modifiers.remove(m)
for o in parts:
    for m in list(o.modifiers):
        if m.type == 'MASK': o.modifiers.remove(m)
kb = body.data.shape_keys.key_blocks
log('body verts after helper removal:', len(body.data.vertices))
# copy each face shape onto brows / lashes / teeth / tongue (nearest body points, inverse-distance blend)
base = kb['Basis'] if 'Basis' in kb else kb[0]
tree = kdtree.KDTree(len(body.data.vertices))
for i, v in enumerate(base.data): tree.insert(body.matrix_world @ v.co, i)
tree.balance()
for o in parts:
    if not any(k in o.name.lower() for k in ('brow', 'lash')): continue   # teeth stay fixed (they'd follow the lips)
    if not o.data.shape_keys: o.shape_key_add(name='Basis')
    near = []
    for v in o.data.vertices:
        hits = tree.find_n(o.matrix_world @ v.co, 4); ws = [1 / max(d, 1e-5) for (_, _, d) in hits]; s = sum(ws)
        near.append([(idx, w / s) for (_, idx, _), w in zip(hits, ws)])
    for n in names:
        sk = o.shape_key_add(name=n, from_mix=False); src = kb[n].data
        for vi, nb in enumerate(near):
            d = Vector()
            for idx, w in nb: d += (src[idx].co - base.data[idx].co) * w
            sk.data[vi].co = o.data.vertices[vi].co + d
log('shapes copied onto brows / lashes / teeth / tongue')

# ---------- export ----------
out = os.path.join(ROOT, 'studio', 'characters', 'glb'); os.makedirs(out, exist_ok=True)
glb = os.path.join(out, f'{who}.glb')
bpy.ops.object.select_all(action='DESELECT')
for o in [rig, body] + parts: o.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=True, export_skins=True, export_morph=True, export_morph_normal=False,
                          export_apply=False, export_animations=False, export_yup=True, export_image_format='JPEG', export_jpeg_quality=88)
log('exported', glb, os.path.getsize(glb) // 1024, 'KB')

# ---------- previews: relaxed arms, full body / face / back ----------
bpy.context.view_layer.objects.active = rig; bpy.ops.object.mode_set(mode='POSE')
pass   # previews show the rest pose; posing happens in the studio
bpy.ops.object.mode_set(mode='OBJECT')
sc = bpy.context.scene
for eng in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try: sc.render.engine = eng; break
    except Exception: pass
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True; world.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.92, 0.96, 1); world.node_tree.nodes['Background'].inputs[1].default_value = 0.6
def light(loc, e, size=2.0):
    bpy.ops.object.light_add(type='AREA', location=loc); L = bpy.context.object; L.data.energy = e; L.data.size = size; L.rotation_euler = (Vector((0, 0, 0.8)) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
light((1.6, -2.2, 2.4), 420); light((-2.2, -1.2, 1.4), 160); light((0.5, 2.5, 2.0), 260)
H = max((body.matrix_world @ Vector(b)).z for b in body.bound_box)
bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
def shot(name, loc, look, lens, w, h):
    cam.location = loc; cam.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.filepath = os.path.join(ROOT, 'exports', f'human-{who}-{name}.png'); bpy.ops.render.render(write_still=True)
shot('full', (0.5, -3.2, H * 0.58), (0, 0, H * 0.5), 55, 900, 1200)
shot('face', (0.08, -0.62, H * 0.9), (0, 0, H * 0.9), 60, 900, 900)
shot('back', (-0.6, 3.0, H * 0.6), (0, 0, H * 0.5), 55, 900, 1200)
log('previews in exports/')
