import * as THREE from '../build/three.module.js'

export class ThirdPersonCamera {
    constructor(camera, controller, terrain) {
        this.camera = camera;
        this.controller = controller;
        this.terrain = terrain;
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
    }

    calculateIdealOffset() {
        const idealOffset = new THREE.Vector3(0, 0, -5);
        idealOffset.applyQuaternion(this.controller.Rotation);
        idealOffset.add(this.controller.Position);

        const con_y = this.controller.Position.y;
        const cam_y = this.terrain.height(idealOffset.x, idealOffset.z);
        idealOffset.add(new THREE.Vector3(0, 2 + 0.75 * (cam_y - con_y), 0));
        return idealOffset;
    }

    calculateIdealLookAt() {
        const idealLookAt = new THREE.Vector3(0, 3, 15);
        idealLookAt.applyQuaternion(this.controller.Rotation);
        idealLookAt.add(this.controller.Position);
        return idealLookAt;
    }

    update(time) {
        const idealOffset = this.calculateIdealOffset();
        const idealLookAt = this.calculateIdealLookAt();

        const t = 1.0 - Math.pow(0.001, time);
        this.currentPosition.lerp(idealOffset, t);
        this.currentLookAt.lerp(idealLookAt, t);

        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
}