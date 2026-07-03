// terrain.js - Konya coğrafyasına uygun prosedürel arazi
import * as THREE from 'three';

// Simple 2D value noise for terrain
class SimplexNoise {
    constructor(seed = 42) {
        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
        this.p = [];
        for (let i = 0; i < 256; i++) this.p[i] = i;
        // Fisher-Yates shuffle with seed
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
            const j = (s >>> 8) % (i + 1);
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        this.perm = new Array(512);
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    }

    dot(g, x, y) { return g[0]*x + g[1]*y; }

    noise2D(x, y) {
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        const i1 = x0 > y0 ? 1 : 0;
        const j1 = x0 > y0 ? 0 : 1;
        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2;
        const y2 = y0 - 1 + 2 * G2;
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.perm[ii + this.perm[jj]] % 12;
        const gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
        const gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
        let n0 = 0, n1 = 0, n2 = 0;
        let t0 = 0.5 - x0*x0 - y0*y0;
        if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0); }
        let t1 = 0.5 - x1*x1 - y1*y1;
        if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1); }
        let t2 = 0.5 - x2*x2 - y2*y2;
        if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2); }
        return 70 * (n0 + n1 + n2);
    }

    fbm(x, y, octaves = 4, lacunarity = 2.0, gain = 0.5) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxVal = 0;
        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise2D(x * frequency, y * frequency);
            maxVal += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        return value / maxVal;
    }
}

export class Terrain {
    constructor(scene) {
        this.scene = scene;
        this.noise = new SimplexNoise(1337);
        this.size = 2000; // 2km x 2km world
        this.segments = 256;
        this.waterLevel = -1.5;
        this.terrainMesh = null;
        this.waterMesh = null;
        this.treeGroup = null;
        this.trees = [];
        this.generate();
    }

    getHeight(x, z) {
        // Normalize coordinates to noise space
        const scale = 0.003;
        const nx = x * scale;
        const nz = z * scale;

        // Base plateau (Konya is ~1000m elevation)
        let h = 0;

        // Gentle rolling hills using multiple octaves
        h += this.noise.fbm(nx + 5.3, nz + 2.7, 3, 2.1, 0.5) * 8;

        // Large-scale terrain features
        h += this.noise.noise2D(nx * 0.5, nz * 0.5) * 3;

        // Tuz Gölü depression (northeast)
        const tuzX = -600, tuzZ = -500;
        const dxTuz = x - tuzX, dzTuz = z - tuzZ;
        const distTuz = Math.sqrt(dxTuz * dxTuz + dzTuz * dzTuz);
        if (distTuz < 250) {
            const t = 1 - distTuz / 250;
            h -= t * t * 5;
        }

        // Toros foothills (south edge - higher terrain)
        const southFactor = Math.max(0, (z - 700) / 300);
        h += Math.pow(southFactor, 1.5) * 15;

        // Meram valley (southwest - slightly lower, greener)
        const meramX = -400, meramZ = 300;
        const dMeram = Math.sqrt((x - meramX)**2 + (z - meramZ)**2);
        if (dMeram < 200) {
            const t = 1 - dMeram / 200;
            h -= t * t * 3;
        }

        // City center area - flatten for buildings
        const cityDist = Math.sqrt(x * x + z * z);
        if (cityDist < 150) {
            const t = cityDist / 150;
            h *= t;
        }

        // Add some micro-variation
        h += this.noise.noise2D(nx * 20, nz * 20) * 0.3;

        return h;
    }

    getColorForHeight(h, x, z) {
        const tuzX = -600, tuzZ = -500;
        const distTuz = Math.sqrt((x - tuzX)**2 + (z - tuzZ)**2);

        // Tuz Gölü - white/salt flat
        if (distTuz < 250 && h < -1) {
            return new THREE.Color(0.95, 0.93, 0.88);
        }

        // Water
        if (h < this.waterLevel) {
            return new THREE.Color(0.6, 0.75, 0.85);
        }

        // Elevation-based coloring
        if (h < 0.5) return new THREE.Color(0.55, 0.70, 0.35); // light green
        if (h < 3) return new THREE.Color(0.45, 0.60, 0.30);  // grass
        if (h < 6) return new THREE.Color(0.50, 0.55, 0.25);  // dry grass
        if (h < 10) return new THREE.Color(0.55, 0.45, 0.30); // brown/hill
        if (h < 15) return new THREE.Color(0.50, 0.40, 0.30); // darker hill
        return new THREE.Color(0.45, 0.40, 0.35); // rocky
    }

    generate() {
        const geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
        geometry.rotateX(-Math.PI / 2);

        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);

        // Height range tracking for normalization
        let minH = Infinity, maxH = -Infinity;

        // First pass: set heights
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            const h = this.getHeight(x, z);
            positions[i + 1] = h;
            if (h < minH) minH = h;
            if (h > maxH) maxH = h;
        }

        // Second pass: set colors
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 2];
            const h = positions[i + 1];
            const color = this.getColorForHeight(h, x, z);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshLambertMaterial({
            vertexColors: true,
            flatShading: false
        });

        this.terrainMesh = new THREE.Mesh(geometry, material);
        this.terrainMesh.receiveShadow = true;
        this.terrainMesh.userData.isTerrain = true;
        this.scene.add(this.terrainMesh);

        // Water plane (for Tuz Gölü and visual effect)
        const waterGeo = new THREE.PlaneGeometry(this.size * 0.4, this.size * 0.4);
        waterGeo.rotateX(-Math.PI / 2);
        const waterMat = new THREE.MeshLambertMaterial({
            color: 0x7ab0d0,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        });
        this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
        this.waterMesh.position.set(-600, this.waterLevel, -500);
        this.waterMesh.userData.isWater = true;
        this.scene.add(this.waterMesh);

        // Tuz Gölü salt flat
        const saltGeo = new THREE.CircleGeometry(200, 32);
        saltGeo.rotateX(-Math.PI / 2);
        const saltMat = new THREE.MeshLambertMaterial({
            color: 0xf0ece0,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        this.saltMesh = new THREE.Mesh(saltGeo, saltMat);
        this.saltMesh.position.set(-600, -0.5, -500);
        this.scene.add(this.saltMesh);

        // Add trees/vegetation
        this._addVegetation();
    }

    _addVegetation() {
        this.treeGroup = new THREE.Group();
        const treeMat = new THREE.MeshLambertMaterial({ color: 0x3a6b25 });
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3d20 });

        // Tree distribution - avoid roads and city center
        for (let i = 0; i < 800; i++) {
            const x = (Math.random() - 0.5) * this.size * 0.85;
            const z = (Math.random() - 0.5) * this.size * 0.85;
            const h = this.getHeight(x, z);

            // Only place trees in suitable areas
            if (h < 0.5 || h > 8) continue;

            // Avoid city center
            const cityDist = Math.sqrt(x * x + z * z);
            if (cityDist < 180) continue;

            // Avoid Tuz Gölü
            const tuzDist = Math.sqrt((x + 600)**2 + (z + 500)**2);
            if (tuzDist < 260) continue;

            // Avoid roads (rough check)
            const roadCheck = this._nearRoad(x, z);
            if (roadCheck < 15) continue;

            // Tree size varies
            const scale = 0.6 + Math.random() * 0.8;

            const tree = new THREE.Group();

            // Trunk
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15 * scale, 0.2 * scale, 0.8 * scale, 4),
                trunkMat
            );
            trunk.position.y = 0.4 * scale;
            tree.add(trunk);

            // Foliage (2-3 spheres)
            const foliageMat = new THREE.MeshLambertMaterial({
                color: new THREE.Color().setHSL(0.28 + Math.random()*0.06, 0.5, 0.25 + Math.random()*0.15)
            });
            const foliageCount = 2 + Math.floor(Math.random() * 2);
            for (let j = 0; j < foliageCount; j++) {
                const fs = (0.5 + Math.random() * 0.4) * scale;
                const foliage = new THREE.Mesh(
                    new THREE.SphereGeometry(fs, 5, 5),
                    foliageMat
                );
                foliage.position.set(
                    (Math.random() - 0.5) * 0.6 * scale,
                    0.8 * scale + Math.random() * 0.4 * scale,
                    (Math.random() - 0.5) * 0.6 * scale
                );
                tree.add(foliage);
            }

            tree.position.set(x, h, z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            this.treeGroup.add(tree);
            this.trees.push(tree);
        }
        this.scene.add(this.treeGroup);
    }

    _nearRoad(x, z) {
        // Check distance to predefined road segments (rough)
        const roads = [
            { x1: -300, z1: -400, x2: 0, z2: 0 },
            { x1: 0, z1: 0, x2: 400, z2: 400 },
            { x1: -100, z1: 100, x2: 0, z2: 0 },
            { x1: 0, z1: 0, x2: 100, z2: -200 },
            { x1: -500, z1: 0, x2: 0, z2: 0 },
            { x1: 0, z1: 0, x2: 500, z2: 0 },
            { x1: 0, z1: 0, x2: 0, z2: -500 },
            { x1: 0, z1: 0, x2: -300, z2: 300 },
        ];

        let minDist = Infinity;
        for (const r of roads) {
            const dx = r.x2 - r.x1;
            const dz = r.z2 - r.z1;
            const len = Math.sqrt(dx*dx + dz*dz);
            if (len === 0) continue;
            const t = Math.max(0, Math.min(1, ((x - r.x1)*dx + (z - r.z1)*dz) / (len*len)));
            const px = r.x1 + t * dx;
            const pz = r.z1 + t * dz;
            const d = Math.sqrt((x - px)**2 + (z - pz)**2);
            if (d < minDist) minDist = d;
        }
        return minDist;
    }

    getColliders() {
        // Return tree positions and radii for collision detection
        return this.trees.map(t => ({
            x: t.position.x,
            z: t.position.z,
            radius: 1.5
        }));
    }

    dispose() {
        if (this.terrainMesh) {
            this.scene.remove(this.terrainMesh);
            this.terrainMesh.geometry.dispose();
            this.terrainMesh.material.dispose();
        }
        if (this.waterMesh) {
            this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh.material.dispose();
        }
        if (this.treeGroup) {
            this.scene.remove(this.treeGroup);
            this.treeGroup.children.forEach(child => {
                child.children.forEach(c => {
                    c.geometry?.dispose();
                    c.material?.dispose();
                });
            });
        }
    }
}
