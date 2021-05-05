import * as THREE from './three.module.js'
import { CharacterController } from './controller.js'
import { ThirdPersonCamera } from './camera.js'
import { Terrain } from './terrain.js'

function main() {
    // Set up three.js
    const canvas = document.getElementsByClassName("canvas")[0];
    const renderer = new THREE.WebGLRenderer({canvas});
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    // Add a camera
    const fov = 80, near = 0.1, far = 1000; 
    const aspect = window.innerWidth / window.innerHeight; 
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 2, -5);

    // Resize canvas when window is resized
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    const scene = new THREE.Scene();

    // Add some lights
    {
        const color = 0xFFFFFF;
        const intensity = 1.5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);

        const ambiance = new THREE.AmbientLight(0xFFFFFF, 0.5);
        scene.add(ambiance);
    }

    // Add the ground
    // const material = new THREE.MeshStandardMaterial({
    //     color: 0xe77d11, 
    //     roughness: 200,
    //     flatShading: true,
    // });
    const material = new THREE.MeshPhongMaterial({
        color: 0xe77d11,
        flatShading: true,
        reflectivity: 0.05,
        shininess: 5
    })
    const terrain = new Terrain(material);
    scene.add(terrain.target);

    // Add the player
    // TODO: move player mesh loading to controller constructor
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1), 
        new THREE.MeshPhongMaterial({color: 0x44aa88})
    );
    scene.add(cube);
    cube.position.y = 1;
    const player = new CharacterController(cube);
    const thirdPersonCamera = new ThirdPersonCamera(camera, player);

    let lastFrameTime = 0;
    function render(time) {
        time *= 0.001; // convert to seconds
        const deltaTime = time - lastFrameTime;
        lastFrameTime = time;

        renderer.render(scene, camera);
        player.update(deltaTime);
        thirdPersonCamera.update(deltaTime);

        player.target.position.y = terrain.height(
            player.target.position.x,
            player.target.position.z
        ) + 0.5;

        terrain.update(player.target.position.x, player.target.position.z);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}


main();