import * as THREE from 'three';

const GAS_STATIONS = [
    { x: -80, z: -70, name: 'Mevlana İstasyonu' },
    { x: 160, z: 90, name: 'Selçuklu İstasyonu' },
    { x: -500, z: -380, name: 'Tuz Gölü İstasyonu' },
    { x: 320, z: -260, name: 'Bilim İstasyonu' }
];

export class GasStationSystem {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.stations = [];
        this.activeRefuel = null;

        for (const config of GAS_STATIONS) {
            this._createStation(config);
        }
    }

    _createStation(config) {
        const h = this.terrain.getHeight(config.x, config.z);
        const group = new THREE.Group();

        const baseMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 0.3, 12), baseMat);
        base.position.y = h + 0.15;
        base.receiveShadow = true;
        group.add(base);

        const pillarMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.6, 6), pillarMat);
            pillar.position.set(Math.cos(angle) * 4, h + 1.5, Math.sin(angle) * 4);
            group.add(pillar);
        }

        const canopyMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
        const canopy = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.4, 6), canopyMat);
        canopy.position.y = h + 3.0;
        canopy.receiveShadow = true;
        group.add(canopy);

        const pumpMat = new THREE.MeshLambertMaterial({ color: 0x22aa44 });
        for (let i = -1; i <= 1; i += 2) {
            const pump = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.5), pumpMat);
            pump.position.set(i * 1.8, h + 0.6, -1.0);
            group.add(pump);
            const disp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.1), new THREE.MeshLambertMaterial({ color: 0x222222 }));
            disp.position.set(i * 1.8, h + 1.1, -1.26);
            group.add(disp);
        }

        const signMat = new THREE.MeshLambertMaterial({
            color: 0xffaa00,
            emissive: 0xff6600,
            emissiveIntensity: 0.4
        });
        const sign = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 0.1), signMat);
        sign.position.set(0, h + 4.5, 0);
        group.add(sign);

        const beaconMat = new THREE.MeshLambertMaterial({
            color: 0xff4400,
            emissive: 0xff2200,
            emissiveIntensity: 0.6
        });
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), beaconMat);
        beacon.position.y = h + 5.5;
        group.add(beacon);

        group.position.set(config.x, 0, config.z);
        this.scene.add(group);

        this.stations.push({
            config, group, beacon,
            worldX: config.x,
            worldZ: config.z,
            height: h,
            radius: 15,
            refuelRadius: 4.0
        });
    }

    getRefuelStatus(carX, carZ, carSpeed) {
        let nearest = null;
        let minDist = Infinity;

        for (const s of this.stations) {
            const dx = carX - s.worldX;
            const dz = carZ - s.worldZ;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < minDist) {
                minDist = dist;
                nearest = s;
            }
        }

        if (!nearest) return { refueling: false, nearby: false, stationName: null };

        const nearby = minDist < nearest.radius;
        const canRefuel = minDist < nearest.refuelRadius && carSpeed < 0.5;

        if (canRefuel) {
            this.activeRefuel = nearest.config.name;
        } else if (!nearby) {
            this.activeRefuel = null;
        }

        return {
            refueling: canRefuel,
            nearby: nearby,
            stationName: canRefuel ? nearest.config.name : (nearby ? nearest.config.name : null)
        };
    }

    getColliders() {
        return this.stations.map(s => ({
            x: s.worldX,
            z: s.worldZ,
            radius: 6
        }));
    }

    update(time) {
        for (const s of this.stations) {
            if (s.beacon) {
                const intensity = 0.3 + 0.4 * Math.sin(time * 3 + s.worldX);
                s.beacon.material.emissiveIntensity = intensity;
            }
        }
    }

    dispose() {
        this.stations.forEach(s => {
            this.scene.remove(s.group);
            s.group.traverse(child => {
                if (child.isMesh) {
                    child.geometry?.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material?.dispose();
                    }
                }
            });
        });
    }
}
