import * as THREE from './three.module.js'
import { BufferGeometryUtils } from './BufferGeometryUtils.js'

const CHUNK_SIZE = 50;
const GRID_SIZE = 25;
const CHUNK_RADIUS = 300;

export class Terrain {
    constructor(material) {
        this.perlin = new Perlin(0);
        this.material = material;
        this.chunks = [];

        this.update(0, 0);
    }

    height(x, z) {
        return ( 
            5.0 * this.perlin.noise(x, z, 1 / 8.9)
            + 10.0 * this.perlin.noise(x, z, 1 / 812)
        ) - 8;
    }

    /**
     * Updates the terrain depending on player position
     * @param {number} x    x-coordinate of player position
     * @param {number} z    y-coordinate of player position
     */
    update(x, z) {
        // look to unload any that are far away
        let has_changed = false;
        const newchunks = [];
        for (let chunk of this.chunks) {
            if ((chunk.x - x)**2 + (chunk.z - z)**2 > CHUNK_RADIUS**2) {
                has_changed = true;
                continue;
            }
            newchunks.push(chunk);
        }
        this.chunks = newchunks;

        // look to load any that are close
        for (let dx = 0; dx < CHUNK_RADIUS; dx += (CHUNK_SIZE)) {
            for (let dz = 0; dz < CHUNK_RADIUS; dz += (CHUNK_SIZE)) {
                if (dx**2 + dz**2 > CHUNK_RADIUS**2) break;
                has_changed ||= this.loadChunk(x + dx, z + dz);
                has_changed ||= this.loadChunk(x + dx, z - dz);
                has_changed ||= this.loadChunk(x - dx, z + dz);
                has_changed ||= this.loadChunk(x - dx, z - dz);
            }
        }

        // update the geometry only if the chunks have changed
        if (has_changed) {
            console.log('haschanged!')
            this.updateGeometry()
}
    }

    updateGeometry() {
        const geoms = [];
        for (let chunk of this.chunks)
            geoms.push(chunk.geometry);
        
        this.geometry = BufferGeometryUtils.mergeBufferGeometries(geoms);
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeBoundingBox();
        this.geometry.computeBoundingSphere();
        this.target = new THREE.Mesh(this.geometry, this.material);
    }

    loadChunk(x, z) {
        // round x, z to nearest multiple of 2 * CHUNK_SIZE
        let rd_x = Math.round(x / (2 * CHUNK_SIZE));
        let rd_z = Math.round(z / (2 * CHUNK_SIZE));

        // ensure chunk not loaded
        for (let chunk of this.chunks) {
            if (chunk.x === rd_x && chunk.z === rd_z)
                return false;
        }

        // make new chunk geometry
        const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, GRID_SIZE, GRID_SIZE);
        geometry.rotateX(-Math.PI / 2);
        const position = geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const z = position.getZ(i);
            const h = this.height(x, z);
            position.setY(i, h);
        }

        // add chunk to registry
        this.chunks.push(
            {"x": rd_x, "z": rd_z, "geometry": geometry}
        );

        return true;
    }

    // unloadChunk() {
    // }
}

class Perlin {
    constructor(seed) {
        this.seed = seed;
    }

    /**
     * Linearly interpolate a fraction `t` along the line segment from a to b
     * @param {number} a    from position
     * @param {number} b    to position
     * @param {number} t    fraction of distance from a to b
     * @returns linearly interpolated value
     */
    lerp(a, b, t) {
        return (b - a) * t + a;
    }

    /**
     * Returns a random number in (-1, 1) corresponding to coordinates x, y
     * Following https://stackoverflow.com/q/12964279 and my assignment 3
     * Converted to JS 
     * @param {number} x    grid coordinate x
     * @param {number} y    grid coordinate y
     * @returns number in (-1, 1)
     */
    rand(x, y) {
        return (Math.sin(12.9898*x + 78.233*y + this.seed) * 43758.5453) % 1;
    }

    /**
     * Returns a random two-dimensional gradient of length 2
     * @param {number} ix   grid coordinate x
     * @param {number} iy   grid coordinate y
     * @returns object with "x", "y" components
     */
    randomGradient(ix, iy) {
        const r = 200.0 * Math.PI * this.rand(ix, iy);
        return { "x": 2.0 * Math.cos(r), "y": 2.0 * Math.sin(r) };
    }

    /**
     * Returns the value of the Perlin noise for the given position
     * @param {number} given_x  x-value of given position
     * @param {number} given_y  y-value of given position
     * @param {number} freq     noise frequency (loosely ~ grid-size)
     * @returns Perlin noise at position
     */
    noise(given_x, given_y, freq) {
        // Take frequency into account
        const x = given_x * freq;
        const y = given_y * freq;

        // Get nearest grid coordinates
        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        // Get gradient vectors
        const grad00 = this.randomGradient(x0, y0);
        const grad01 = this.randomGradient(x0, y1);
        const grad10 = this.randomGradient(x1, y0);
        const grad11 = this.randomGradient(x1, y1);

        // Dot distances with gradients
        const dist00 = (x - x0) * grad00.x + (y - y0) * grad00.y;
        const dist01 = (x - x0) * grad01.x + (y - y1) * grad01.y;
        const dist10 = (x - x1) * grad10.x + (y - y0) * grad10.y;
        const dist11 = (x - x1) * grad11.x + (y - y1) * grad11.y;

        // Bilinear interpolation
        const itp0 = this.lerp(dist00, dist01, y - y0);
        const itp1 = this.lerp(dist10, dist11, y - y0);
        let alpha = this.lerp(itp0, itp1, x - x0);

        // alpha appears to be in [-1, 1] -> scale to [0,1]
        alpha = (alpha + 1) * 0.5;
        return alpha;
    }
}

function makeChunk() {
    // following https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_dynamic.html
    const geometry = new THREE.PlaneGeometry(100, 100, 10, 10);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
        position.setY(i, 5 * (Math.random() - 0.5));
    }
    return geometry;
}
