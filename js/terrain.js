import * as THREE from '../build/three.module.js'

const CHUNK_SIZE = 100;
const GRID_SIZE = 20;

const LOAD_RADIUS = 250;
const UNLOAD_RADIUS = 300;

export class Terrain {
    constructor(material, seed=0) {
        this.perlin = new Perlin(seed);
        this.material = material;
        this.chunks = [];
        this.chunksToUnload = [];
        this.update(0, 0);
    }

    height(x, z) {
        return ( 
            0.08 * this.perlin.noise(x, z, 1 / 1.29)
            + 1.1 * this.perlin.noise(x, z, 1 / 7.6)
            + 5.0 * this.perlin.noise(x, z, 1 / 38.7)
            + 20.0 * this.perlin.noise(x, z, 1 / 92.8)
            + 100.0 * this.perlin.noise(x, z, 1 / 529)
        ) - 8;
    }

    /**
     * Updates the terrain depending on player position
     * @param {number} x    x-coordinate of player position
     * @param {number} z    y-coordinate of player position
     */
    update(x, z) {
        // look to unload any that are far away
        const newChunks = [];
        for (let chunk of this.chunks) {
            if ((chunk.x - x)**2 + (chunk.z - z)**2 > UNLOAD_RADIUS**2) {
                this.chunksToUnload.push(chunk);
            } else {
                newChunks.push(chunk);
            }
        }
        this.chunks = newChunks;

        // look to load any that are close
        for (let dx = 0; dx < LOAD_RADIUS; dx += (CHUNK_SIZE)) {
            for (let dz = 0; dz < LOAD_RADIUS; dz += (CHUNK_SIZE)) {
                if (dx**2 + dz**2 > LOAD_RADIUS**2) break;
                this.loadChunk(x + dx, z + dz);
                this.loadChunk(x + dx, z - dz);
                this.loadChunk(x - dx, z + dz);
                this.loadChunk(x - dx, z - dz);
            }
        }
    }

    loadChunk(x, z) {
        // round x, z to nearest multiple of 2 * CHUNK_SIZE
        let rd_x = Math.round(x / (CHUNK_SIZE)) * (CHUNK_SIZE);
        let rd_z = Math.round(z / (CHUNK_SIZE)) * (CHUNK_SIZE);

        // ensure chunk not loaded
        for (let chunk of this.chunks) {
            if (chunk.x === rd_x && chunk.z === rd_z)
                return false;
        }

        // make new chunk geometry
        // like https://github.com/mrdoob/three.js/blob/master/examples/webgl_geometry_dynamic.html
        const geometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, GRID_SIZE, GRID_SIZE);
        geometry.rotateX(-Math.PI / 2);
        const position = geometry.attributes.position;
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const z = position.getZ(i);
            const h = this.height(rd_x + x, rd_z + z);
            position.setY(i, h);
        }
        geometry.computeVertexNormals();

        const mesh = new THREE.Mesh(geometry, this.material);
        mesh.position.x = rd_x;
        mesh.position.z = rd_z;

        // add chunk to registry
        this.chunks.push({
            "x": rd_x, 
            "z": rd_z, 
            "mesh": mesh,
            "needsLoaded": true
        });

        return true;
    }
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
        return alpha;
    }
}