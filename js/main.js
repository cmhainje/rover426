import * as THREE from './build/three.module.js'
import { CharacterController } from './controller.js'
import { ThirdPersonCamera } from './camera.js'
import { Terrain } from './terrain.js'
import { SkyLight } from './skylight.js'
import { GUI } from './build/dat.gui.module.js'
import Stats from './build/stats.module.js'

function main() {
    // Set up three.js
    const canvas = document.getElementsByClassName("canvas")[0];
    const renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;

    // const stats = new Stats();
    // document.body.appendChild(stats.dom);

    // Add a camera
    const fov = 80, near = 0.1, far = 1000; 
    const aspect = window.innerWidth / window.innerHeight; 
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 2, -5);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    renderer.shadowCameraNear = 0.1;
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 80;

    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;
    // renderer.shadowMapWidth = 1024;
    // renderer.shadowMapHeight = 1024;

    // Resize canvas when window is resized
    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    });

    const scene = new THREE.Scene();

    // Add the sky
    let sunlight = new SkyLight(75, 180, {
        turbidity: 4.5,
        rayleigh: 0.8,
        mieCoefficient: 0.015,
        mieDirectionalG: 0.4,
        exposure: 0.36,
        intensity: 1.8
    });
    scene.add(sunlight.sky);
    scene.add(sunlight.light);
    renderer.toneMappingExposure = sunlight.params.exposure;
    // let shadowCamera = new THREE.CameraHelper(sunlight.light.shadow.camera);
    // scene.add(shadowCamera);

    // Add ambiant light
    scene.add(new THREE.AmbientLight(0xFFFFFF, 0.15));
    scene.add(new THREE.DirectionalLight(0xFFFFFF, 0.15));

    // Add the ground
    // const material = new THREE.MeshPhongMaterial({
    //     // color: 0xbb491d,
    //     vertexColors: true,
    //     flatShading: true,
    //     reflectivity: 0.05,
    //     shininess: 5
    // });
    const material = new THREE.MeshLambertMaterial({
        // color: 0xbb491d,
        vertexColors: true
    });
    const terrain = new Terrain(material, -100);
    for (let c of terrain.chunks) {
        if (c.needsLoaded) {
            scene.add(c.mesh);
            c.needsLoaded = false;
        }
    }

    // Add the player
    const player = new CharacterController({scene: scene, terrain: terrain, sunlight: sunlight});
    const thirdPersonCamera = new ThirdPersonCamera(camera, player, terrain);

    let lastFrameTime = 0;
    function render(time) {
        time *= 0.001; // convert to seconds
        const deltaTime = time - lastFrameTime;
        lastFrameTime = time;

        renderer.render(scene, camera);

        if (!player.target) { 
            requestAnimationFrame(render);
            return;
        }

        sunlight.update(deltaTime);
        if (sunlight.elevation < 180)
            player.battery.update(0.0005);

        player.update(deltaTime);
        thirdPersonCamera.update(deltaTime);

        terrain.update(player.target.position.x, player.target.position.z);
        for (let c of terrain.chunksToUnload) 
            unload(c.mesh);
        terrain.chunksToUnload = [];
        for (let c of terrain.chunks) {
            if (c.needsLoaded) {
                scene.add(c.mesh);
                c.needsLoaded = false;
            }
        }

        // stats.update();
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    function unload(mesh) {
        // https://stackoverflow.com/a/40730686
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    }
}


main();