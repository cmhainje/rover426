import * as THREE from './three.module.js'

export class ThirdPersonCamera {
    constructor(camera, controller) {
        this.camera = camera;
        this.controller = controller;
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
    }

    calculateIdealOffset() {
        const idealOffset = new THREE.Vector3(0, 2, -5);
        idealOffset.applyQuaternion(this.controller.Rotation);
        idealOffset.add(this.controller.Position);
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