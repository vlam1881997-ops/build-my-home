// Share renderer, geometry and material classes with the editor. The pinned
// tracer also reads the scene rotations introduced after Three r160.
export * from './three.module.js';
import { Scene as EditorScene, WebGLArrayRenderTarget as EditorArrayTarget, Euler } from './three.module.js';
export class Scene extends EditorScene {
 constructor(){super();this.backgroundRotation=new Euler();this.environmentRotation=new Euler();this.backgroundIntensity=1;this.environmentIntensity=1;}
}
// The tracer exposes array textures rather than their owning framebuffer.
// Keep that ownership explicit so switching back to editing releases both.
export class WebGLArrayRenderTarget extends EditorArrayTarget {
 constructor(...args){super(...args);Object.defineProperty(this.texture,'bmhRenderTarget',{value:this});}
}
