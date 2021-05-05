import * as THREE from '../build/three.module.js'

export class CharacterController {
    constructor(target) {
        this.position = new THREE.Vector3();
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3(1, 0.25, 50.0);
        this.deceleration = new THREE.Vector3(-0.0005, -0.0001, -5.0);

        this.input = new CharacterControllerInput();
        this.target = target;
    }

    get Position() { return this.position; }
    get Rotation() { return this.target.quaternion; }

    update(time) {
        // Compute velocity
        const velocity = this.velocity;
        const frameDeceleration = new THREE.Vector3(
            velocity.x * this.deceleration.x,
            velocity.y * this.deceleration.y,
            velocity.z * this.deceleration.z
        );
        frameDeceleration.multiplyScalar(time);
        frameDeceleration.z = Math.sign(frameDeceleration.z) * Math.min(Math.abs(frameDeceleration.z), Math.abs(velocity.z));
        velocity.add(frameDeceleration);

        // Get the acceleration
        const accel = this.acceleration.clone();
        if (this.input.keys.shift)
            accel.multiplyScalar(2.0);
        
        // Handle forward/backward movement
        if (this.input.keys.forward)
            velocity.z += accel.z * time;
        if (this.input.keys.backward)
            velocity.z -= accel.z * time;
        
        // Handle rotation
        const Q = new THREE.Quaternion();
        const A = new THREE.Vector3();
        const R = this.target.quaternion.clone();

        if (this.input.keys.left) {
            A.set(0, 1, 0);
            Q.setFromAxisAngle(A, 4.0 * Math.PI * time * this.acceleration.y);
            R.multiply(Q);
        }
        if (this.input.keys.right) {
            A.set(0, 1, 0);
            Q.setFromAxisAngle(A, - 4.0 * Math.PI * time * this.acceleration.y);
            R.multiply(Q);
        }

        this.target.quaternion.copy(R);

        // Get character's local frame of reference
        const forward = new THREE.Vector3(0, 0, 1);
        forward.applyQuaternion(this.target.quaternion);
        forward.normalize();

        const sideways = new THREE.Vector3(1, 0, 0);
        sideways.applyQuaternion(this.target.quaternion);
        sideways.normalize();

        // Compute update to position
        forward.multiplyScalar(velocity.z * time);
        sideways.multiplyScalar(velocity.x * time);

        // Update position
        this.target.position.add(forward);
        this.target.position.add(sideways);
        this.position.copy(this.target.position);
    }
};

class CharacterControllerInput {
    constructor() {
        this.keys = {
            "forward": false,
            "backward": false,
            "left": false,
            "right": false,
            "space": false,
            "shift": false,
        }

        document.addEventListener('keydown', e => this.onKeyDown(e), false);
        document.addEventListener('keyup', e => this.onKeyUp(e), false);
    }

    keyHandler(keyCode, value) {
        switch (keyCode) {
            case 87: // w
                this.keys.forward = value;
                break;
            case 65: // a
                this.keys.left = value;
                break;
            case 83: // s
                this.keys.backward = value;
                break;
            case 68: // d
                this.keys.right = value;
                break;
            case 32: // space
                this.keys.space = value;
                break;
            case 16: // shift
                this.keys.shift = value;
                break;
        }
    }

    onKeyDown(event) {
        this.keyHandler(event.keyCode, true);
    }

    onKeyUp(event) {
        this.keyHandler(event.keyCode, false);
    }
}