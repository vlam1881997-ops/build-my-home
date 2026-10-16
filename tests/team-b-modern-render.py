"""Render exact exported BMH vertices with Blender/Cycles CPU.
Lighting is presentation-only; this is not a second geometry generator.
Run: blender -b -t 4 -P tests/team-b-modern-render.py -- scene.json repo output.png
"""
import bpy, json, sys, math, os, runpy
from mathutils import Matrix, Vector
args=sys.argv[sys.argv.index('--')+1:]
scene_path,repo,output=args[:3]
if len(args)>3 and args[3] in ['batch','details']:
    for view in (['exterior','living','bed'] if args[3]=='batch' else ['kitchen','bath']):
        sys.argv=['blender','--',scene_path.replace('scene-exterior.json','scene-'+view+'.json'),repo,output.replace('exterior.png',view+'.png')]
        runpy.run_path(__file__,run_name='__main__')
    raise SystemExit(0)
data=json.load(open(scene_path,encoding='utf8'))
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU'
scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=output
scene.view_settings.view_transform='AgX'
scene.view_settings.exposure=-.5
scene.unit_settings.system='METRIC';scene.unit_settings.scale_length=1
rotation=Matrix.Rotation(math.pi/2,4,'X')
materials={};images={}
def image(asset,channel):
    filename=os.path.join(repo,'assets/interior/textures',asset+'-'+channel+'.png')
    if not os.path.exists(filename): return None
    if filename not in images:
        images[filename]=bpy.data.images.load(filename)
        images[filename].colorspace_settings.name='sRGB' if channel=='diff' else 'Non-Color'
    return images[filename]
for row in data['materials']:
    m=bpy.data.materials.new(row.get('profileId') or row.get('slot') or row['id']);m.use_nodes=True
    m['bmh_id']=row['id'];m['bmh_profile']=row.get('profileId') or '';m['bmh_basis']='generic reference, not manufacturer SKU'
    nodes=m.node_tree.nodes;links=m.node_tree.links;bs=nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*row['color'],1)
    bs.inputs['Roughness'].default_value=row['roughness'];bs.inputs['Metallic'].default_value=row['metalness']
    if row['opacity']<.8 or row['transmission']>.3:
        bs.inputs['Transmission Weight'].default_value=.8;bs.inputs['IOR'].default_value=1.5;bs.inputs['Roughness'].default_value=.045
    if row.get('photo'):
        for channel in ['diff','nor_gl','rough']:
            img=image(row['photo'],channel)
            if not img:continue
            tex=nodes.new('ShaderNodeTexImage');tex.image=img;tex.extension='REPEAT'
            if channel=='diff':
                color=tex.outputs['Color']
                if row.get('photoAlpha',1)<1:
                    # Production Canvas mixes plaster photography at 8% over
                    # its near-white procedural paint map, not full contrast.
                    subtle=nodes.new('ShaderNodeMixRGB');subtle.blend_type='MIX';subtle.inputs[0].default_value=row['photoAlpha'];subtle.inputs[1].default_value=(.94,.94,.94,1)
                    links.new(color,subtle.inputs[2]);color=subtle.outputs[0]
                mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=(*row['color'],1)
                links.new(color,mix.inputs[1]);links.new(mix.outputs[0],bs.inputs['Base Color'])
            elif channel=='rough':
                scale=nodes.new('ShaderNodeMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=max(.05,row['roughness'])
                links.new(tex.outputs['Color'],scale.inputs[0]);links.new(scale.outputs[0],bs.inputs['Roughness'])
            else:
                normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=row.get('normalStrength',.2)
                links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],bs.inputs['Normal'])
    materials[row['id']]=m
vertices=0;triangles=0
for i,row in enumerate(data['meshes']):
    a=row['attributes'];p=a['position'];idx=row['index'] or list(range(len(p)//3))
    matrix=rotation@Matrix([row['matrix'][j:j+4] for j in range(0,16,4)]).transposed()
    verts=[matrix@Vector(p[j:j+3]) for j in range(0,len(p),3)]
    faces=[idx[j:j+3] for j in range(0,len(idx)-2,3)]
    mesh=bpy.data.meshes.new('BMH-'+str(i));mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(row['name']+'-'+str(i),mesh);bpy.context.collection.objects.link(obj)
    obj.visible_shadow=bool(row.get('castShadow',True))
    # Cycles has no raster polygonOffset. Reproduce the production skin's
    # depth priority with an explicit 0.01mm render modifier. Original measured
    # vertices remain unchanged; this is not an architectural thickness edit.
    if row.get('facadeSkin'):
        bias=obj.modifiers.new('WebGL skin depth priority: 0.01mm presentation only','DISPLACE')
        bias.strength=.00001;bias.mid_level=0;bias.direction='NORMAL'
    obj['bmh_revision']=data['revision'];obj['bmh_identity']=json.dumps(row['identity'])
    for mid in row['materials']:mesh.materials.append(materials[mid])
    # Three ignores BoxGeometry face groups when a mesh has one material.
    for group in (row.get('groups',[]) if len(row['materials'])>1 else []):
        for poly in mesh.polygons[group['start']//3:(group['start']+group['count'])//3]:poly.material_index=group['materialIndex']
    if 'uv' in a:
        uv=mesh.uv_layers.new(name='BMH metre UV')
        for loop in mesh.loops:
            index=loop.vertex_index*2;uv.data[loop.index].uv=a['uv'][index:index+2]
    if 'normal' in a:
        normal_matrix=matrix.to_3x3().inverted().transposed();norms=[(normal_matrix@Vector(a['normal'][j:j+3])).normalized() for j in range(0,len(a['normal']),3)]
        for poly in mesh.polygons:poly.use_smooth=True
        mesh.normals_split_custom_set_from_vertices(norms)
    vertices+=len(verts);triangles+=len(faces)
world=bpy.data.worlds.new('BMH presentation daylight');scene.world=world;world.use_nodes=True
wn=world.node_tree.nodes;wl=world.node_tree.links;hdr=os.path.join(repo,'assets/interior/environments/daylight-1k.hdr')
env=wn.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(hdr);wl.new(env.outputs[0],wn.get('Background').inputs[0]);wn.get('Background').inputs['Strength'].default_value=.65
light=bpy.data.lights.new('Presentation sun, not a solar study','SUN');light.energy=2;light.angle=math.radians(8)
sun=bpy.data.objects.new('Presentation sun',light);bpy.context.collection.objects.link(sun);sun.rotation_euler=(math.radians(25),math.radians(-20),math.radians(-35))
def fill_light(name,location,target,energy,size):
    light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.shape='DISK';light.size=size
    obj=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(obj);obj.location=location
    obj.rotation_euler=(Vector(target)-Vector(location)).to_track_quat('-Z','Y').to_euler()
if data.get('room'):
    r=data['room'];x=r['x']+r['w']/2-data['site']['width']/2;y=data['site']['depth']/2-r['y']-r['h']/2
    fill_light('Presentation fill only, not an electrical design',(x,y,3.02),(x,y,0),150,2.4)
else:
    fill_light('Presentation facade fill',(10,4,8),(0,0,3),2600,10)
cam_data=bpy.data.cameras.new('BMH measured view');cam=bpy.data.objects.new('BMH measured view',cam_data);bpy.context.collection.objects.link(cam);scene.camera=cam
if data['camera']:
    c=data['camera'];height=(c.get('targetHeight') or 1.15)+math.sin(c['pitch'])*c['distance']
    cam.location=(c['camera']['x']-data['site']['width']/2,data['site']['depth']/2-c['camera']['y'],height)
    target=Vector((c['target']['x']-data['site']['width']/2,data['site']['depth']/2-c['target']['y'],c.get('targetHeight') or 1.15))
    cam_data.lens=24
else:
    cam.location=(10,25,7);target=Vector((0,2.8,3.2));cam_data.lens=48
cam.rotation_euler=(target-Vector(cam.location)).to_track_quat('-Z','Y').to_euler();cam_data.clip_start=.03;cam_data.clip_end=250
scene['bmh_revision']=data['revision'];scene['bmh_approval']='REVIEW ONLY — not surveyed, not engineering-approved'
scene['bmh_raster_depth_priority']='Facade skins only: 0.01mm render modifier emulates WebGL polygonOffset; original vertices retained.'
scene.render.film_transparent=False
os.makedirs(os.path.dirname(os.path.abspath(output)),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(output)[0]+'.blend')
bpy.ops.render.render(write_still=True)
json.dump({'revision':data['revision'],'view':data['view'],'vertices':vertices,'triangles':triangles,'samples':24,'renderer':'Blender4.5.13 Cycles CPU','status':'review-not-approved','geometrySource':'production Three.js scene vertices'},open(output+'.json','w'),indent=2)
print('BMH_RENDER_COMPLETE',output,vertices,triangles)
