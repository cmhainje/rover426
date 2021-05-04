import * as THREE from './three.module.js'

export function makeChunk() {
    // following https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_dynamic.html
    const geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
        position.setY(i, 5 * (Math.random() - 0.5));
    }
    return geometry;
}
