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
scene.cycles.samples=max(8,min(256,int(os.environ.get('BMH_REVIEW_SAMPLES','24'))));scene.cycles.use_denoising=True
scene.render.resolution_x=int(os.environ.get('BMH_REVIEW_WIDTH','1100'));scene.render.resolution_y=int(os.environ.get('BMH_REVIEW_HEIGHT','900'));scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=output
scene.view_settings.view_transform='AgX'
scene.view_settings.exposure=.4
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
    if row.get('sheen'):
        bs.inputs['Sheen Weight'].default_value=row['sheen'];bs.inputs['Sheen Roughness'].default_value=row.get('sheenRoughness',.9)
        if row.get('sheenColor'):bs.inputs['Sheen Tint'].default_value=(*row['sheenColor'],1)
    if row.get('vertexColors'):
        attr=nodes.new('ShaderNodeVertexColor');attr.layer_name='BMH vertex colours'
        multiply=nodes.new('ShaderNodeMixRGB');multiply.blend_type='MULTIPLY';multiply.inputs[0].default_value=1;multiply.inputs[2].default_value=(*row['color'],1)
        links.new(attr.outputs['Color'],multiply.inputs[1]);links.new(multiply.outputs[0],bs.inputs['Base Color'])
    for channel,encoded in (row.get('maps') or {}).items():
        if not encoded:continue
        filename=os.path.join(os.path.dirname(scene_path),encoded['file'])
        img=bpy.data.images.load(filename,check_existing=True);img.colorspace_settings.name='sRGB' if channel=='color' else 'Non-Color'
        tex=nodes.new('ShaderNodeTexImage');tex.image=img;tex.extension='REPEAT'
        if channel=='color':
            mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[2].default_value=(*row['color'],1)
            links.new(tex.outputs['Color'],mix.inputs[1]);links.new(mix.outputs[0],bs.inputs['Base Color'])
        elif channel=='normal':
            normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=row.get('normalStrength',.2);links.new(tex.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs[0],bs.inputs['Normal'])
        elif channel=='roughness':
            scale=nodes.new('ShaderNodeMath');scale.operation='MULTIPLY';scale.inputs[1].default_value=row['roughness'];links.new(tex.outputs['Color'],scale.inputs[0]);links.new(scale.outputs[0],bs.inputs['Roughness'])
    if row.get('photo') and not any((row.get('maps') or {}).values()):
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
    # Reproduce the live inspection's world-space clipping planes in shading.
    # The measured vertices remain intact; this is not a demolished wall.
    surface=bs.outputs['BSDF']
    for plane in row.get('clippingPlanes',[]):
        coord=nodes.new('ShaderNodeNewGeometry');dot=nodes.new('ShaderNodeVectorMath');dot.operation='DOT_PRODUCT';dot.inputs[1].default_value=rotation.to_3x3()@Vector(plane['normal']);links.new(coord.outputs['Position'],dot.inputs[0])
        offset=nodes.new('ShaderNodeMath');offset.operation='ADD';offset.inputs[1].default_value=plane['constant'];links.new(dot.outputs['Value'],offset.inputs[0])
        clipped=nodes.new('ShaderNodeMath');clipped.operation='LESS_THAN';links.new(offset.outputs[0],clipped.inputs[0])
        clear=nodes.new('ShaderNodeBsdfTransparent');mix=nodes.new('ShaderNodeMixShader');links.new(clipped.outputs[0],mix.inputs[0]);links.new(surface,mix.inputs[1]);links.new(clear.outputs[0],mix.inputs[2]);surface=mix.outputs[0]
    links.new(surface,nodes.get('Material Output').inputs['Surface'])
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
    if 'color' in a:
        colors=mesh.color_attributes.new(name='BMH vertex colours',type='FLOAT_COLOR',domain='POINT')
        for k,item in enumerate(colors.data):item.color=(*a['color'][k*3:k*3+3],1)
    if 'normal' in a:
        normal_matrix=matrix.to_3x3().inverted().transposed();norms=[(normal_matrix@Vector(a['normal'][j:j+3])).normalized() for j in range(0,len(a['normal']),3)]
        for poly in mesh.polygons:poly.use_smooth=True
        mesh.normals_split_custom_set_from_vertices(norms)
    vertices+=len(verts);triangles+=len(faces)
world=bpy.data.worlds.new('BMH presentation daylight');scene.world=world;world.use_nodes=True
wn=world.node_tree.nodes;wl=world.node_tree.links;hdr=os.path.join(repo,'assets/interior/environments/daylight-1k.hdr')
env=wn.new('ShaderNodeTexEnvironment');env.image=bpy.data.images.load(hdr);wl.new(env.outputs[0],wn.get('Background').inputs[0]);wn.get('Background').inputs['Strength'].default_value=.2
light=bpy.data.lights.new('Presentation sun, not a solar study','SUN');light.energy=2;light.angle=math.radians(8)
sun=bpy.data.objects.new('Presentation sun',light);bpy.context.collection.objects.link(sun);sun.rotation_euler=(math.radians(25),math.radians(-20),math.radians(-35))
if data.get('sun'):
    light.energy=data['sun']['intensity'];light.color=data['sun']['color']
    incoming=rotation.to_3x3()@(Vector(data['sun']['target'])-Vector(data['sun']['position']))
    sun.rotation_euler=incoming.to_track_quat('-Z','Y').to_euler()
def fill_light(name,location,target,energy,size):
    light=bpy.data.lights.new(name,'AREA');light.energy=energy;light.shape='DISK';light.size=size
    obj=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(obj);obj.location=location
    obj.rotation_euler=(Vector(target)-Vector(location)).to_track_quat('-Z','Y').to_euler()
if data.get('room'):
    r=data['room'];x=r['x']+r['w']/2-data['site']['width']/2;y=data['site']['depth']/2-r['y']-r['h']/2
    fill_light('Presentation fill only, not an electrical design',(x,y,3.02),(x,y,0),12,2.4)
else:
    fill_light('Presentation facade fill',(10,4,8),(0,0,3),2600,10)
cam_data=bpy.data.cameras.new('BMH measured view');cam=bpy.data.objects.new('BMH measured view',cam_data);bpy.context.collection.objects.link(cam);scene.camera=cam
if data['camera'] and data['camera'].get('position'):
    c=data['camera'];p=c['position'];cam.location=(p['x']-data['site']['width']/2,data['site']['depth']/2-p['y'],p['height'])
    target=Vector((c['target']['x']-data['site']['width']/2,data['site']['depth']/2-c['target']['y'],c['targetHeight']));cam_data.lens=c['lens']
elif data['camera']:
    c=data['camera'];height=(c.get('targetHeight') or 1.15)+math.sin(c['pitch'])*c['distance']
    cam.location=(c['camera']['x']-data['site']['width']/2,data['site']['depth']/2-c['camera']['y'],height)
    target=Vector((c['target']['x']-data['site']['width']/2,data['site']['depth']/2-c['target']['y'],c.get('targetHeight') or 1.15))
    cam_data.sensor_fit='VERTICAL';cam_data.sensor_height=24
    aspect=scene.render.resolution_x/scene.render.resolution_y
    vertical_fov=2*math.atan(math.tan(math.radians(c['horizontalFov'])/2)/aspect) if c.get('horizontalFov') else math.radians(58)
    vertical_fov=max(math.radians(52),min(math.radians(110),vertical_fov))
    cam_data.lens=cam_data.sensor_height/(2*math.tan(vertical_fov/2))
else:
    cam.location=(10,25,7);target=Vector((0,2.8,3.2));cam_data.lens=48
cam.rotation_euler=(target-Vector(cam.location)).to_track_quat('-Z','Y').to_euler();cam_data.clip_start=.03;cam_data.clip_end=250
scene['bmh_revision']=data['revision'];scene['bmh_approval']='REVIEW ONLY — not surveyed, not engineering-approved'
scene['bmh_raster_depth_priority']='Facade skins only: 0.01mm render modifier emulates WebGL polygonOffset; original vertices retained.'
scene.render.film_transparent=False
os.makedirs(os.path.dirname(os.path.abspath(output)),exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=os.path.splitext(output)[0]+'.blend')
bpy.ops.render.render(write_still=True)
json.dump({'revision':data['revision'],'view':data['view'],'vertices':vertices,'triangles':triangles,'samples':scene.cycles.samples,'width':scene.render.resolution_x,'height':scene.render.resolution_y,'renderer':'Blender'+bpy.app.version_string+' Cycles CPU','status':'review-not-approved','geometrySource':'production Three.js scene vertices'},open(output+'.json','w'),indent=2)
print('BMH_RENDER_COMPLETE',output,vertices,triangles)

