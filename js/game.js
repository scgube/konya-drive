// game.js - Ana oyun döngüsü, kamera sistemi, oyun durumu yönetimi
import * as THREE from 'three';
import { Controls } from './controls.js?v=1';
import { Terrain } from './terrain.js?v=1';
import { RoadSystem } from './roads.js?v=1';
import { LandmarkSystem } from './landmarks.js?v=1';
import { GasStationSystem } from './gasstations.js?v=1';
import { Car } from './car.js?v=4';
import { UI } from './ui.js?v=1';

export class Game {
    constructor() {
        this.state = 'loading'; // loading, menu, playing, fuelout, paused
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        // Systems
        this.controls = null;
        this.terrain = null;
        this.roads = null;
        this.landmarks = null;
        this.gasStations = null;
        this.car = null;
        this.ui = null;
        this._refuelNotified = false;

        // Camera
        this.camMode = 'thirdperson';
        this.camDistance = 8;
        this.camHeight = 3.5;
        this.camLookAhead = 5;
        this.camSmoothSpeed = 4;
        this.camTarget = new THREE.Vector3();
        this.camPos = new THREE.Vector3();
        this.camLookTarget = new THREE.Vector3();

        // Sky
        this.skyDome = null;
        this.sunLight = null;
        this.ambientLight = null;
        this.fog = null;

        // Environment
        this.sunAngle = 0.8;
        this.timeOfDay = 0.35; // late afternoon (gives nice shadows)

        this._animate = this._animate.bind(this);
        this._onResize = this._onResize.bind(this);

        window.addEventListener('resize', this._onResize);
    }

    async start() {
        this.ui = new UI();

        // Show loading progress
        this.ui.updateLoading(10, 'Three.js başlatılıyor...');
        await this._initRenderer();

        this.ui.updateLoading(30, 'Arazi oluşturuluyor...');
        await this._initScene();

        this.ui.updateLoading(50, 'Yol ağı çiziliyor...');
        await this._initRoads();

        this.ui.updateLoading(65, 'Simge yapılar inşa ediliyor...');
        await this._initLandmarks();

        this.ui.updateLoading(73, 'Benzin istasyonları kuruluyor...');
        await this._initGasStations();

        this.ui.updateLoading(80, 'Araç hazırlanıyor...');
        await this._initCar();

        this.ui.updateLoading(95, 'Son dokunuşlar...');

        // Hide loading, show start screen
        setTimeout(() => {
            this.ui.hideLoading();
            this.state = 'menu';
            this.ui.showStartScreen();

            this.ui.onStartClick(() => {
                this._startGame();
            });
        }, 500);
    }

    _startGame() {
        this.state = 'playing';
        this.ui.hideStartScreen();

        // Reset car position
        this.car.reset();
        this.controls.resetMouseLook();

        // Set up camera
        this.camDistance = 8;
        this.camHeight = 3.5;

        // Initialize landmark list in UI
        this.ui.setLandmarks(this.landmarks.getLandmarks());

        // Start game loop
        this.clock.start();
        this._animate();
    }

    async _initRenderer() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);

        // Fog for distance fade
        this.scene.fog = new THREE.Fog(0xbfd8e8, 300, 800);

        // Camera
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1200);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: "default"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        document.getElementById('game-container').prepend(this.renderer.domElement);

        // Lights
        this.ambientLight = new THREE.AmbientLight(0x8899bb, 0.4);
        this.scene.add(this.ambientLight);

        const hemiLight = new THREE.HemisphereLight(0x88ccff, 0x886633, 0.6);
        this.scene.add(hemiLight);

        this.sunLight = new THREE.DirectionalLight(0xffeedd, 1.2);
        this.sunLight.position.set(100, 150, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 400;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);

        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
        fillLight.position.set(-50, 30, -50);
        this.scene.add(fillLight);

        // Controls
        this.controls = new Controls();
    }

    async _initScene() {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.terrain = new Terrain(this.scene);

        // Sky gradient (dome)
        const skyGeo = new THREE.SphereGeometry(900, 32, 24);
        const skyMat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                topColor: { value: new THREE.Color(0x4488cc) },
                bottomColor: { value: new THREE.Color(0xdde8f0) },
                sunColor: { value: new THREE.Color(0xffcc66) },
                sunDirection: { value: new THREE.Vector3(0.5, 0.6, 0.3).normalize() }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform vec3 sunColor;
                uniform vec3 sunDirection;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition).y;
                    float sunDot = max(0.0, dot(normalize(vWorldPosition), sunDirection));
                    vec3 sky = mix(bottomColor, topColor, max(0.0, h));
                    // Sun glow
                    float sunGlow = pow(sunDot, 64.0) * 2.0;
                    float sunHalo = pow(sunDot, 8.0) * 0.3;
                    sky += sunColor * sunGlow;
                    sky += sunColor * sunHalo;
                    // Horizon glow
                    float horizonGlow = pow(1.0 - abs(h), 4.0) * 0.15;
                    sky += vec3(1.0, 0.7, 0.4) * horizonGlow;
                    gl_FragColor = vec4(sky, 1.0);
                }
            `
        });
        this.skyDome = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.skyDome);
    }

    async _initRoads() {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.roads = new RoadSystem(this.scene, this.terrain);
    }

    async _initLandmarks() {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.landmarks = new LandmarkSystem(this.scene, this.terrain);
    }

    async _initGasStations() {
        await new Promise(resolve => setTimeout(resolve, 50));
        this.gasStations = new GasStationSystem(this.scene, this.terrain);
    }

    async _initCar() {
        await new Promise(resolve => setTimeout(resolve, 50));
        const obstacles = [
            ...this.terrain.getColliders(),
            ...this.landmarks.getColliders(),
            ...this.gasStations.getColliders()
        ];
        this.car = new Car(this.scene, this.terrain, obstacles);
    }

    _animate() {
        if (this.state !== 'playing') return;

        requestAnimationFrame(this._animate);

        const dt = this.clock.getDelta();

        // Update controls
        const keyState = this.controls.getState();

        // Check for reset
        if (keyState.reset) {
            this.car.reset();
            this.landmarks.discovered.clear();
            // Re-init landmarks discovery state
            for (const lm of this.landmarks.landmarks) {
                lm.discovered = false;
            }
            this.ui.setLandmarks(this.landmarks.getLandmarks());
        }

        // Out of fuel check
        if (this.car.isOutOfFuel()) {
            this.car.speed = 0;
        }

        // Update car
        this.car.update(dt, this.controls);

        // Update landmarks
        const time = this.clock.elapsedTime;
        this.landmarks.update(time);

        // Update gas stations
        this.gasStations.update(time);

        // Check refuel at gas stations
        const carPos = this.car.getPosition();
        const gsState = this.gasStations.getRefuelStatus(carPos.x, carPos.z, Math.abs(this.car.speed));
        if (gsState.refueling) {
            this.car.addFuel(dt * 20);
            if (!this._refuelNotified) {
                this.ui.showNotification(`⛽ ${gsState.stationName} - Yakıt ikmali yapılıyor...`);
                this._refuelNotified = true;
            }
        } else {
            this._refuelNotified = false;
        }
        const newLm = this.landmarks.checkDiscovery(carPos.x, carPos.z);

        if (newLm) {
            this.ui.showNotification(`📍 ${newLm.name} keşfedildi!`);
            this.ui.setLandmarks(this.landmarks.getLandmarks());
        }

        // Update camera
        this._updateCamera(dt);

        // Update sky (slow rotation for time of day effect - subtle)
        if (this.skyDome) {
            this.skyDome.rotation.y += dt * 0.001;
        }

        // Update UI
        const speedKmh = this.car.getSpeedKmh();
        const fuel = this.car.getFuel();
        const distance = this.car.getDistance();

        this.ui.update(
            speedKmh,
            fuel,
            distance,
            this.car.heading,
            carPos.x,
            carPos.z,
            this.landmarks.getLandmarks(),
            this.gasStations.getStations()
        );

        // Update shadow camera to follow car
        if (this.sunLight) {
            this.sunLight.position.set(
                carPos.x + 100,
                150,
                carPos.z + 50
            );
            this.sunLight.target.position.set(carPos.x, 0, carPos.z);
            this.sunLight.target.updateMatrixWorld();
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    _updateCamera(dt) {
        const carPos = this.car.getPosition();
        const heading = this.car.heading;

        // Mouse look offset
        const mouseLook = this.controls.getMouseLook();

        // Target camera position (behind and above car)
        const behindDist = this.camDistance;
        const behindHeight = this.camHeight;

        // Base camera angle (behind car)
        const camAngle = Math.PI - heading;

        // Apply mouse look
        const lookX = mouseLook.x;
        const lookY = mouseLook.y;

        // Calculate camera position
        const targetX = carPos.x + Math.sin(camAngle + lookX) * behindDist;
        const targetZ = carPos.z + Math.cos(camAngle + lookX) * behindDist;
        const targetY = carPos.y + behindHeight + lookY * 3;

        // Terrain-aware camera (don't go through ground)
        const groundH = this.terrain.getHeight(targetX, targetZ);
        const finalY = Math.max(targetY, groundH + 1.0);

        // Smooth camera movement
        const smoothFactor = 1 - Math.exp(-this.camSmoothSpeed * dt);
        this.camPos.x += (targetX - this.camPos.x) * smoothFactor;
        this.camPos.z += (targetZ - this.camPos.z) * smoothFactor;
        this.camPos.y += (finalY - this.camPos.y) * smoothFactor;

        this.camera.position.copy(this.camPos);

        // Look at position (ahead of car)
        const lookAheadDist = this.camLookAhead;
        const lookX2 = carPos.x - Math.sin(heading) * lookAheadDist;
        const lookZ2 = carPos.z + Math.cos(heading) * lookAheadDist;
        const lookY2 = carPos.y + 0.5;

        // Smooth look target
        this.camLookTarget.x += (lookX2 - this.camLookTarget.x) * smoothFactor;
        this.camLookTarget.z += (lookZ2 - this.camLookTarget.z) * smoothFactor;
        this.camLookTarget.y += (lookY2 - this.camLookTarget.y) * smoothFactor;

        this.camera.lookAt(this.camLookTarget);

        // Dynamic distance based on speed
        const targetDistance = 8 + Math.min(this.car.getSpeedKmh() / 60, 3);
        this.camDistance += (targetDistance - this.camDistance) * 0.02;
    }

    _onResize() {
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
    }

    dispose() {
        window.removeEventListener('resize', this._onResize);
        if (this.controls) this.controls.dispose();
        if (this.terrain) this.terrain.dispose();
        if (this.roads) this.roads.dispose();
        if (this.landmarks) this.landmarks.dispose();
        if (this.car) this.car.dispose();
        if (this.ui) this.ui.dispose();
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
    }
}
