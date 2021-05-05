import * as THREE from '../build/three.module.js'
import { Sky } from './threesky.js'
import { GUI } from '../build/dat.gui.module.js'

const DAY_LENGTH = 20; // seconds

export class SkyLight {
    constructor(elevation, azimuth, params) {
        this.sky = new Sky();
        this.sun = new THREE.Vector3();
        this.elevation = elevation;
        this.azimuth = azimuth;
        this.params = params;
        this.light = new THREE.DirectionalLight(0xFFFFFF, params.intensity);

        this.sky.scale.setScalar(45000);

        const uniforms = this.sky.material.uniforms;
        uniforms['turbidity'].value = params.turbidity;
        uniforms['rayleigh'].value = params.rayleigh;
        uniforms['mieCoefficient'].value = params.mieCoefficient;
        uniforms['mieDirectionalG'].value = params.mieDirectionalG;

        const phi = THREE.MathUtils.degToRad(90 - this.elevation);
        const theta = THREE.MathUtils.degToRad(this.azimuth);
        this.sun.setFromSphericalCoords(1, phi, theta);
        uniforms['sunPosition'].value.copy(this.sun);

        this.light.position.copy(this.sun);
    }

    update(deltaT) {
        this.elevation += (360) / (DAY_LENGTH) * deltaT;
        if (this.elevation > 360) this.elevation -= 360;
        const phi = THREE.MathUtils.degToRad(90 - this.elevation);
        const theta = THREE.MathUtils.degToRad(this.azimuth);
        this.sun.setFromSphericalCoords(1, phi, theta);
        this.sky.material.uniforms['sunPosition'].value.copy(this.sun);
        this.light.position.copy(this.sun);
    }
}