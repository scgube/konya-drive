// roads.js - Konya şehir merkezi ve simge yapılar arası yol ağı
import * as THREE from 'three';

export class RoadSystem {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.roadMeshes = [];
        this.roadSegments = [];
        this.roadMarkings = [];

        // Konya road network: [x1, z1, x2, z2, width, type]
        this.roadData = [
            // City center ring roads
            { x1: -120, z1: -120, x2: 120, z2: -120, w: 8, type: 'highway' },
            { x1: 120, z1: -120, x2: 120, z2: 120, w: 8, type: 'highway' },
            { x1: 120, z1: 120, x2: -120, z2: 120, w: 8, type: 'highway' },
            { x1: -120, z1: 120, x2: -120, z2: -120, w: 8, type: 'highway' },

            // Main arteries from center
            { x1: 0, z1: 0, x2: 300, z2: -200, w: 7, type: 'highway' },     // to northeast
            { x1: 0, z1: 0, x2: -300, z2: 200, w: 7, type: 'highway' },     // to southwest
            { x1: 0, z1: 0, x2: -400, z2: -300, w: 7, type: 'highway' },    // to Tuz Gölü
            { x1: 0, z1: 0, x2: 400, z2: 300, w: 7, type: 'highway' },      // to Çatalhöyük

            // Tuz Gölü connection
            { x1: -400, z1: -300, x2: -600, z2: -500, w: 6, type: 'highway' },

            // Çatalhöyük connection
            { x1: 400, z1: 300, x2: 550, z2: 450, w: 6, type: 'highway' },

            // Meram connection
            { x1: -300, z1: 200, x2: -400, z2: 350, w: 5, type: 'secondary' },

            // Cross connections
            { x1: 300, z1: -200, x2: 200, z2: 400, w: 5, type: 'secondary' },
            { x1: -300, z1: 200, x2: -200, z2: -300, w: 5, type: 'secondary' },

            // Side roads
            { x1: 100, z1: -200, x2: 200, z2: -100, w: 4, type: 'street' },
            { x1: -100, z1: 200, x2: -200, z2: 100, w: 4, type: 'street' },
            { x1: 100, z1: 150, x2: 200, z2: 250, w: 4, type: 'street' },
            { x1: -150, z1: -200, x2: -250, z2: -100, w: 4, type: 'street' },

            // Ring road outer
            { x1: -300, z1: -300, x2: 300, z2: -300, w: 6, type: 'secondary' },
            { x1: 300, z1: -300, x2: 300, z2: 300, w: 6, type: 'secondary' },
            { x1: 300, z1: 300, x2: -300, z2: 300, w: 6, type: 'secondary' },
            { x1: -300, z1: 300, x2: -300, z2: -300, w: 6, type: 'secondary' },

            // Diagonal shortcuts
            { x1: -200, z1: -100, x2: 0, z2: -300, w: 4, type: 'street' },
            { x1: 200, z1: 100, x2: 0, z2: 300, w: 4, type: 'street' },

            // Extra roads to fill the map
            { x1: -100, z1: -400, x2: 100, z2: -350, w: 4, type: 'street' },
            { x1: 400, z1: 100, x2: 300, z2: -100, w: 4, type: 'street' },
            { x1: -400, z1: 100, x2: -300, z2: -100, w: 4, type: 'street' },
        ];

        this.generate();
    }

    generate() {
        const roadMat = new THREE.MeshLambertMaterial({ color: 0x333840 });
        const roadMatDark = new THREE.MeshLambertMaterial({ color: 0x2a2f35 });
        const sidewalkMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const lineMat = new THREE.MeshLambertMaterial({ color: 0xcccc44 });

        for (const rd of this.roadData) {
            const dx = rd.x2 - rd.x1;
            const dz = rd.z2 - rd.z1;
            const length = Math.sqrt(dx * dx + dz * dz);
            if (length < 1) continue;

            const angle = Math.atan2(dz, dx);
            const midX = (rd.x1 + rd.x2) / 2;
            const midZ = (rd.z1 + rd.z2) / 2;

            // Sample height at midpoint
            const h = this.terrain.getHeight(midX, midZ);

            // Road surface
            const roadGeo = new THREE.PlaneGeometry(length, rd.w);
            roadGeo.rotateX(-Math.PI / 2);
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.position.set(midX, h + 0.1, midZ);
            road.rotation.y = -angle;
            road.receiveShadow = true;
            this.scene.add(road);
            this.roadMeshes.push(road);

            // Center line (dashed-ish)
            if (rd.w >= 5) {
                const lineGeo = new THREE.PlaneGeometry(length * 0.95, 0.3);
                lineGeo.rotateX(-Math.PI / 2);
                const line = new THREE.Mesh(lineGeo, lineMat);
                line.position.set(midX, h + 0.2, midZ);
                line.rotation.y = -angle;
                this.scene.add(line);
                this.roadMarkings.push(line);
            }

            // Sidewalks for wider roads
            if (rd.type === 'highway') {
                for (let side = -1; side <= 1; side += 2) {
                    const sw = new THREE.Mesh(
                        new THREE.PlaneGeometry(length, 0.8),
                        sidewalkMat
                    );
                    sw.geometry.rotateX(-Math.PI / 2);
                    const offset = (rd.w / 2 + 0.5) * side;
                    sw.position.set(
                        midX - Math.sin(angle) * offset,
                        h + 0.05,
                        midZ + Math.cos(angle) * offset
                    );
                    sw.rotation.y = -angle;
                    this.scene.add(sw);
                    this.roadMeshes.push(sw);
                }
            }

            // Store segment data for collision detection
            this.roadSegments.push({
                x1: rd.x1, z1: rd.z1,
                x2: rd.x2, z2: rd.z2,
                width: rd.w,
                angle: angle,
                length: length,
                midX, midZ, height: h
            });
        }
    }

    // Get nearest road info for giving player feedback
    getNearestRoad(x, z) {
        let best = null;
        let bestDist = Infinity;

        for (const seg of this.roadSegments) {
            const dx = seg.x2 - seg.x1;
            const dz = seg.z2 - seg.z1;
            const len = seg.length;
            const t = Math.max(0, Math.min(1,
                ((x - seg.x1) * dx + (z - seg.z1) * dz) / (len * len)
            ));
            const px = seg.x1 + t * dx;
            const pz = seg.z1 + t * dz;
            const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
            if (d < bestDist) {
                bestDist = d;
                best = { dist: d, x: px, z: pz, segment: seg };
            }
        }
        return best;
    }

    // Get road height at a point (for placing the car on road)
    getRoadHeight(x, z) {
        for (const seg of this.roadSegments) {
            const dx = seg.x2 - seg.x1;
            const dz = seg.z2 - seg.z1;
            const len = seg.length;
            const t = Math.max(0, Math.min(1,
                ((x - seg.x1) * dx + (z - seg.z1) * dz) / (len * len)
            ));
            const px = seg.x1 + t * dx;
            const pz = seg.z1 + t * dz;
            const d = Math.sqrt((x - px) ** 2 + (z - pz) ** 2);
            if (d < seg.width) {
                return this.terrain.getHeight(px, pz);
            }
        }
        return null;
    }

    dispose() {
        this.roadMeshes.forEach(m => {
            this.scene.remove(m);
            m.geometry.dispose();
            m.material.dispose();
        });
        this.roadMarkings.forEach(m => {
            this.scene.remove(m);
            m.geometry.dispose();
            m.material.dispose();
        });
    }
}
