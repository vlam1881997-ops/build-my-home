Architect3D source: https://github.com/amitukind/architect3d
Pinned commit: 52d9a6f7c8a13e6372efb4aadb181ffc6a066091
Library licence: upstream LICENSE (MIT); package.json says ISC inconsistently. See bundled licence.
Three.js 0.185.1: MIT. Bezier-js 6.1.4: MIT.
Furniture: Kenney Furniture Kit, CC0 https://kenney.nl/assets/furniture-kit
Selected models only; dimensions use upstream verified scale 200 cm/unit.
Wood/wall textures: generated in Build My Home.
Draco decoder: upstream public/draco/README.md retains its attribution.
Manual build: npm install --prefix /tmp/bmh-architect-build --ignore-scripts esbuild three@0.185.1 bezier-js@6.1.4; node scripts/vendor-architect3d.cjs /path/to/pinned/architect3d /tmp/bmh-architect-build/node_modules

Additional stairStep.glb is generated unit geometry by Build My Home, used for parametric bậc and chiếu nghỉ; not part of Kenney assets.
