// car.js - Araç fizik motoru ve 3D model
import * as THREE from 'three';

export class Car {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;

        // Physics state
        this.x = 0;
        this.z = 0;
        this.y = 0;
        this.heading = 0; // radians
        this.speed = 0;
        this.acceleration = 0;
        this.steerAngle = 0;

        // Car parameters
        this.maxSpeed = 180; // km/h
        this.maxSpeedMs = 50; // m/s
        this.accelerationPower = 25;
        this.brakePower = 40;
        this.deceleration = 8;
        this.steerSpeed = 2.5;
        this.steerMax = 0.6;
        this.steerReturn = 4;
        this.drag = 0.3;
        this.rollingFriction = 2;

        // Fuel
        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelConsumption = 0.05; // per meter
        this.idleFuelConsumption = 0.02;

        // Visual
        this.carGroup = new THREE.Group();
        this.wheels = [];
        this.suspensionTravel = 0.2;
        this.tiltAngle = 0;
        this.isGrounded = true;

        this._buildModel();
        this._initPosition();

        scene.add(this.carGroup);

        // Stats tracking
        this.totalDistance = 0;
        this.lastPos = { x: this.x, z: this.z };
        this.maxAchievedSpeed = 0;
    }

    _buildModel() {
        // Car body - sporty hatchback shape
        const bodyMat = new THREE.MeshLambertMaterial({
            color: 0xcc2222,
            roughness: 0.3,
            metalness: 0.6
        });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const glassMat = new THREE.MeshLambertMaterial({
            color: 0x4488cc,
            transparent: true,
            opacity: 0.3
        });
        const lightMat = new THREE.MeshLambertMaterial({
            color: 0xffeecc,
            emissive: 0xffaa44,
            emissiveIntensity: 0.2
        });
        const tailMat = new THREE.MeshLambertMaterial({
            color: 0xff2200,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });

        // Main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(1.8, 0.6, 4.0),
            bodyMat
        );
        body.position.y = 0.5;
        body.castShadow = true;
        this.carGroup.add(body);

        // Cabin (upper body)
        const cabin = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.5, 2.0),
            bodyMat
        );
        cabin.position.set(0, 0.95, -0.3);
        cabin.castShadow = true;
        this.carGroup.add(cabin);

        // Windshield (front)
        const windshield = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.45),
            glassMat
        );
        windshield.position.set(0, 0.95, 0.7);
        windshield.rotation.x = 0.3;
        this.carGroup.add(windshield);

        // Rear window
        const rearWindow = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 0.45),
            glassMat
        );
        rearWindow.position.set(0, 0.95, -1.3);
        rearWindow.rotation.x = -0.3;
        this.carGroup.add(rearWindow);

        // Side windows
        for (let side = -1; side <= 1; side += 2) {
            const sideWindow = new THREE.Mesh(
                new THREE.PlaneGeometry(0.01, 0.4, 1.5, 1),
                glassMat
            );
            sideWindow.position.set(side * 0.85, 0.95, -0.3);
            sideWindow.rotation.y = side * Math.PI / 2;
            this.carGroup.add(sideWindow);
        }

        // Headlights
        for (let side = -1; side <= 1; side += 2) {
            const headlight = new THREE.Mesh(
                new THREE.CircleGeometry(0.15, 8),
                lightMat
            );
            headlight.position.set(side * 0.55, 0.35, 2.01);
            this.carGroup.add(headlight);
        }

        // Taillights
        for (let side = -1; side <= 1; side += 2) {
            const taillight = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.15, 0.1),
                tailMat
            );
            taillight.position.set(side * 0.55, 0.45, -2.01);
            this.carGroup.add(taillight);
        }

        // Bumpers
        const bumperMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const frontBumper = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.15, 0.1),
            bumperMat
        );
        frontBumper.position.set(0, 0.15, 2.05);
        this.carGroup.add(frontBumper);

        const rearBumper = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.15, 0.1),
            bumperMat
        );
        rearBumper.position.set(0, 0.15, -2.05);
        this.carGroup.add(rearBumper);

        // Hood scoop
        const scoop = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.1, 0.3),
            darkMat
        );
        scoop.position.set(0, 0.85, 1.0);
        this.carGroup.add(scoop);

        // Spoiler
        const spoilerMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const spoiler = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.05, 0.2),
            spoilerMat
        );
        spoiler.position.set(0, 0.85, -1.8);
        this.carGroup.add(spoiler);

        // Spoiler stands
        for (let side = -1; side <= 1; side += 2) {
            const stand = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.25, 0.04),
                spoilerMat
            );
            stand.position.set(side * 0.6, 0.7, -1.8);
            this.carGroup.add(stand);
        }

        // Wheels (4)
        const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const rimMat = new THREE.MeshLambertMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });

        const wheelPositions = [
            { x: -1.0, z: 1.3 }, // front-left
            { x: 1.0, z: 1.3 },  // front-right
            { x: -1.0, z: -1.3 }, // rear-left
            { x: 1.0, z: -1.3 }  // rear-right
        ];

        for (const wp of wheelPositions) {
            const wheelGroup = new THREE.Group();

            // Tire
            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(0.32, 0.32, 0.25, 12),
                wheelMat
            );
            tire.rotation.z = Math.PI / 2;
            wheelGroup.add(tire);

            // Rim
            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.26, 8),
                rimMat
            );
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);

            // Rim detail (spokes)
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const spoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.04, 0.27, 0.04),
                    rimMat
                );
                spoke.position.set(Math.cos(angle) * 0.12, 0, Math.sin(angle) * 0.12);
                wheelGroup.add(spoke);
            }

            wheelGroup.position.set(wp.x, 0.32, wp.z);
            this.carGroup.add(wheelGroup);
            this.wheels.push({
                group: wheelGroup,
                isFront: wp.z > 0,
                isLeft: wp.x < 0,
                rotation: 0,
                steerAngle: 0,
                restPos: { x: wp.x, z: wp.z }
            });
        }

        // Exhaust pipe
        const exhaustMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const exhaust = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8),
            exhaustMat
        );
        exhaust.rotation.x = Math.PI / 2;
        exhaust.position.set(-0.3, 0.1, -2.1);
        this.carGroup.add(exhaust);
    }

    _initPosition() {
        // Start near Mevlana Museum
        this.x = -25;
        this.z = -45;
        this.heading = 0.5;
        this.speed = 0;
        this.updateVisual();
    }

    update(dt, controls) {
        if (!dt || dt > 0.1) dt = 0.016; // Cap delta time

        const state = controls.getState();

        // Steering
        if (state.left) {
            this.steerAngle = Math.max(this.steerAngle - this.steerSpeed * dt, -this.steerMax);
        } else if (state.right) {
            this.steerAngle = Math.min(this.steerAngle + this.steerSpeed * dt, this.steerMax);
        } else {
            // Return steering to center
            if (Math.abs(this.steerAngle) < this.steerReturn * dt) {
                this.steerAngle = 0;
            } else {
                this.steerAngle -= Math.sign(this.steerAngle) * this.steerReturn * dt;
            }
        }

        // Acceleration / Braking
        if (state.forward) {
            this.acceleration = this.accelerationPower;
        } else if (state.backward) {
            this.acceleration = -this.accelerationPower * 0.6;
        } else {
            this.acceleration = 0;
        }

        if (state.brake && Math.abs(this.speed) > 0.5) {
            // Brake
            const brakeForce = this.brakePower * dt;
            if (Math.abs(this.speed) < brakeForce) {
                this.speed = 0;
            } else {
                this.speed -= Math.sign(this.speed) * brakeForce;
            }
        }

        // Boost
        const boostMultiplier = state.boost ? 1.4 : 1.0;

        // Apply acceleration (convert to m/s)
        if (this.acceleration !== 0) {
            this.speed += this.acceleration * dt * boostMultiplier;
        } else {
            // Natural deceleration
            if (Math.abs(this.speed) > 0.1) {
                this.speed -= Math.sign(this.speed) * this.deceleration * dt;
            } else {
                this.speed = 0;
            }
        }

        // Drag (proportional to speed squared)
        if (Math.abs(this.speed) > 0.1) {
            const dragForce = this.drag * this.speed * Math.abs(this.speed) * dt;
            this.speed -= dragForce;
        }

        // Clamp speed
        this.speed = Math.max(-this.maxSpeedMs * 0.3, Math.min(this.maxSpeedMs, this.speed));

        // Update heading based on speed and steer
        if (Math.abs(this.speed) > 0.5) {
            const turnRate = this.steerAngle * (1 + Math.min(Math.abs(this.speed) / 20, 1.5));
            this.heading += turnRate * dt * (this.speed > 0 ? 1 : -1);
        }

        // Move
        const dx = Math.sin(this.heading) * this.speed * dt;
        const dz = Math.cos(this.heading) * this.speed * dt;
        this.x += dx;
        this.z += dz;

        // Get terrain height
        this.y = this.terrain.getHeight(this.x, this.z);

        // Simple suspension: car follows terrain with slight smoothing
        const targetY = this.y + 0.4; // ride height
        this.carGroup.position.y += (targetY - this.carGroup.position.y) * 0.3;

        // Terrain following rotation (tilt based on terrain normal)
        this._updateTerrainTilt();

        // Fuel consumption
        if (Math.abs(this.speed) > 0.5) {
            this.fuel -= this.fuelConsumption * Math.abs(this.speed) * dt;
        } else {
            this.fuel -= this.idleFuelConsumption * dt;
        }
        this.fuel = Math.max(0, Math.min(this.maxFuel, this.fuel));

        // Track distance
        const distDelta = Math.sqrt(
            (this.x - this.lastPos.x) ** 2 + (this.z - this.lastPos.z) ** 2
        );
        this.totalDistance += distDelta;

        // Max speed tracking
        const speedKmh = this.getSpeedKmh();
        if (speedKmh > this.maxAchievedSpeed) {
            this.maxAchievedSpeed = speedKmh;
        }

        this.lastPos = { x: this.x, z: this.z };

        // Update visual
        this.updateVisual(dt);
    }

    _updateTerrainTilt() {
        // Sample height at nearby points for terrain normal approximation
        const sampleDist = 1.5;
        const hCenter = this.terrain.getHeight(this.x, this.z);
        const hForward = this.terrain.getHeight(
            this.x + Math.sin(this.heading) * sampleDist,
            this.z + Math.cos(this.heading) * sampleDist
        );
        const hRight = this.terrain.getHeight(
            this.x + Math.sin(this.heading + Math.PI / 2) * sampleDist,
            this.z + Math.cos(this.heading + Math.PI / 2) * sampleDist
        );

        const tiltForward = (hForward - hCenter) / sampleDist;
        const tiltRight = (hRight - hCenter) / sampleDist;

        // Apply tilt with smoothing
        this.carGroup.rotation.x += (tiltForward * 0.5 - this.carGroup.rotation.x) * 0.1;
        this.carGroup.rotation.z += (-tiltRight * 0.5 - this.carGroup.rotation.z) * 0.1;
    }

    updateVisual(dt) {
        this.carGroup.position.x = this.x;
        this.carGroup.position.z = this.z;
        this.carGroup.rotation.y = this.heading;

        // Wheel rotation (visual)
        for (const w of this.wheels) {
            // Rotate wheels based on speed
            w.rotation += this.speed * dt * 10;
            w.group.children[0].rotation.x = w.rotation;

            // Steer front wheels
            if (w.isFront) {
                w.group.rotation.y = this.steerAngle * (w.isLeft ? 1 : 1);
            }

            // Suspension bounce
            const bounce = Math.sin(Date.now() * 0.01 + w.restPos.x * 10) * 0.01 *
                Math.min(Math.abs(this.speed) / 10, 1);
            w.group.position.y = 0.32 + bounce;
        }

        // Body lean during turns
        const leanAmount = -this.steerAngle * Math.min(Math.abs(this.speed) / 15, 1) * 0.08;
        this.carGroup.rotation.z += (leanAmount - this.carGroup.rotation.z) * 0.05;

        // Acceleration tilt
        const accelTilt = -this.acceleration * 0.003;
        this.carGroup.rotation.x += (accelTilt - this.carGroup.rotation.x) * 0.02;
    }

    getSpeedKmh() {
        return Math.abs(this.speed) * 3.6;
    }

    getFuel() {
        return this.fuel;
    }

    getPosition() {
        return { x: this.x, y: this.y, z: this.z };
    }

    getDistance() {
        return this.totalDistance;
    }

    addFuel(amount) {
        this.fuel = Math.min(this.maxFuel, this.fuel + amount);
    }

    reset() {
        this._initPosition();
        this.fuel = 100;
        this.totalDistance = 0;
        this.maxAchievedSpeed = 0;
        this.steerAngle = 0;
        this.acceleration = 0;
        this.lastPos = { x: this.x, z: this.z };
        this.carGroup.rotation.x = 0;
        this.carGroup.rotation.z = 0;
    }

    isOutOfFuel() {
        return this.fuel <= 0;
    }

    dispose() {
        this.scene.remove(this.carGroup);
        this.carGroup.traverse(child => {
            if (child.isMesh) {
                child.geometry?.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material?.dispose();
                }
            }
        });
    }
}
