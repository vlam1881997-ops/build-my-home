import {ShaderMaterial,Vector2} from 'three';

// Geometry guides prevent filtering across silhouettes, joinery and stairs.
export class ArchitecturalGuideMaterial extends ShaderMaterial {
 constructor(){super({depthTest:true,depthWrite:true,vertexShader:`
 varying vec3 guideNormal;varying float guideDepth;
 void main(){vec4 p=modelViewMatrix*vec4(position,1.0);guideNormal=normalMatrix*normal;guideDepth=-p.z;gl_Position=projectionMatrix*p;}`,
 fragmentShader:`varying vec3 guideNormal;varying float guideDepth;
 void main(){gl_FragColor=vec4(normalize(guideNormal),guideDepth);}`});}
}
export class ArchitecturalDenoiseMaterial extends ShaderMaterial {
 constructor(){super({depthTest:false,depthWrite:false,uniforms:{map:{value:null},guide:{value:null},resolution:{value:new Vector2(1,1)},projectionScale:{value:new Vector2(1,1)},samples:{value:0}},vertexShader:`
 varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}`,
 fragmentShader:`
 uniform sampler2D map,guide;uniform vec2 resolution,projectionScale;uniform float samples;varying vec2 vUv;
 float luminance(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
 float geometryWeight(vec4 a,vec4 b,vec2 uv){if(a.a==0.0||b.a==0.0)return a.a==b.a?1.0:0.0;vec3 pa=vec3((vUv*2.0-1.0)/projectionScale,-1.0)*a.a,pb=vec3((uv*2.0-1.0)/projectionScale,-1.0)*b.a;return pow(max(dot(a.rgb,b.rgb),0.0),32.0)*exp(-abs(dot(a.rgb,pb-pa))*80.0);}
 void main(){
  vec4 g=texture2D(guide,vUv);vec3 center=texture2D(map,vUv).rgb;
  float values[9];int index=0;vec2 pixel=1.0/resolution;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 p=vUv+vec2(float(x),float(y))*pixel;values[index]=geometryWeight(g,texture2D(guide,p),p)>.5?luminance(texture2D(map,p).rgb):luminance(center);index++;}
  for(int i=0;i<9;i++)for(int j=0;j<8;j++)if(values[j]>values[j+1]){float value=values[j];values[j]=values[j+1];values[j+1]=value;}
  float median=values[4],sum=0.0;vec3 result=vec3(0.0);
  float sigma=samples<128.0?2.4:samples<384.0?1.8:1.4;
  for(int y=-4;y<=4;y++)for(int x=-4;x<=4;x++){
   vec2 offset=vec2(float(x),float(y)),p=vUv+offset*pixel;vec3 color=texture2D(map,p).rgb;
   float w=geometryWeight(g,texture2D(guide,p),p)*exp(-dot(offset,offset)/(2.0*sigma*sigma));
   // Isolated bright paths converge slowly through glass. Bound those outliers
   // using nearby radiance on the same surface, preserving sustained highlights.
   float l=luminance(color),limit=median*(samples<128.0?3.0:5.0)+.15;if(l>limit)color*=limit/l;
   result+=color*w;sum+=w;
  }
  gl_FragColor=vec4(sum>.001?result/sum:center,1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }`});}
 get map(){return this.uniforms.map.value;}set map(value){this.uniforms.map.value=value;}
}
