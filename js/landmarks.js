// landmarks.js - Konya'nın simge yapılarının 3D modelleri
import * as THREE from 'three';

const LANDMARK_CONFIGS = [
    {
        id: 'mevlana',
        name: 'Mevlana Müzesi',
        icon: '🕌',
        x: -30, z: -50,
        desc: 'Mevlana Celaleddin Rumi\'nin türbesi ve müzesi'
    },
    {
        id: 'catalhoyuk',
        name: 'Çatalhöyük',
        icon: '🏛️',
        x: 550, z: 480,
        desc: 'Neolitik döneme ait antik yerleşim'
    },
    {
        id: 'tuzgolu',
        name: 'Tuz Gölü',
        icon: '🧂',
        x: -600, z: -500,
        desc: 'Türkiye\'nin ikinci büyük gölü'
    },
    {
        id: 'selcuklu',
        name: 'Selçuklu Kulesi',
        icon: '🗼',
        x: 80, z: 60,
        desc: 'Konya\'nın en yüksek yapısı'
    },
    {
        id: 'alaeddin',
        name: 'Alaeddin Camii',
        icon: '🕌',
        x: 20, z: 30,
        desc: 'Anadolu Selçuklu dönemi camii'
    },
    {
        id: 'meram',
        name: 'Meram Bağları',
        icon: '🌿',
        x: -400, z: 350,
        desc: 'Tarihi mesire ve bağlık alan'
    },
    {
        id: 'bilim',
        name: 'Konya Bilim Merkezi',
        icon: '🔬',
        x: 200, z: -200,
        desc: 'TÜBİTAK destekli bilim merkezi'
    },
    {
        id: 'kultur',
        name: 'Konya Kültür Parkı',
        icon: '🎭',
        x: -100, z: 100,
        desc: 'Şehir merkezinde kültür ve sanat alanı'
    }
];

export class LandmarkSystem {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.landmarks = [];
        this.discovered = new Set();

        for (const config of LANDMARK_CONFIGS) {
            this._createLandmark(config);
        }
    }

    _createLandmark(config) {
        const group = new THREE.Group();
        const h = this.terrain.getHeight(config.x, config.z);

        // Base platform
        const baseMat = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(12, 14, 0.8, 24),
            baseMat
        );
        base.position.y = h + 0.4;
        base.receiveShadow = true;
        base.castShadow = true;
        group.add(base);

        // Name label area (glowing ring)
        const ringMat = new THREE.MeshLambertMaterial({
            color: 0xffcc33,
            emissive: 0xffcc33,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(10, 11, 32),
            ringMat
        );
        ring.position.y = h + 0.9;
        ring.rotation.x = -Math.PI / 2;
        group.add(ring);

        // Build specific landmark model
        this._buildModel(config, group, h);

        // Beacon light (pulsing)
        const beaconMat = new THREE.MeshLambertMaterial({
            color: 0xffaa44,
            emissive: 0xffaa44,
            emissiveIntensity: 0.5
        });
        const beacon = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            beaconMat
        );
        beacon.position.y = h + 20;
        beacon.userData.isBeacon = true;
        group.add(beacon);

        group.position.set(config.x, 0, config.z);
        this.scene.add(group);

        this.landmarks.push({
            config,
            group,
            worldX: config.x,
            worldZ: config.z,
            height: h,
            discovered: false,
            beacon
        });
    }

    _buildModel(config, group, h) {
        switch (config.id) {
            case 'mevlana':
                this._buildMevlana(group, h);
                break;
            case 'catalhoyuk':
                this._buildCatalhoyuk(group, h);
                break;
            case 'tuzgolu':
                this._buildTuzGolu(group, h);
                break;
            case 'selcuklu':
                this._buildSelcukluKulesi(group, h);
                break;
            case 'alaeddin':
                this._buildAlaeddinCamii(group, h);
                break;
            case 'meram':
                this._buildMeram(group, h);
                break;
            case 'bilim':
                this._buildBilimMerkezi(group, h);
                break;
            case 'kultur':
                this._buildKulturParki(group, h);
                break;
        }
    }

    _buildMevlana(group, h) {
        // Turquoise dome - iconic Mevlana Museum
        const domeMat = new THREE.MeshLambertMaterial({
            color: 0x33aacc,
            emissive: 0x227799,
            emissiveIntensity: 0.1
        });
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(5, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2),
            domeMat
        );
        dome.position.set(0, h + 2, 0);
        dome.scale.y = 0.8;
        dome.castShadow = true;
        group.add(dome);

        // Main building
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xddccbb });
        const building = new THREE.Mesh(
            new THREE.BoxGeometry(10, 3, 10),
            wallMat
        );
        building.position.set(0, h + 1.5, 0);
        building.castShadow = true;
        group.add(building);

        // Minaret
        const minaretMat = new THREE.MeshLambertMaterial({ color: 0xccc0aa });
        const minaret = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.6, 10, 8),
            minaretMat
        );
        minaret.position.set(4, h + 5, 3);
        minaret.castShadow = true;
        group.add(minaret);

        // Minaret top
        const topMat = new THREE.MeshLambertMaterial({ color: 0xccaa66 });
        const top = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 0.8, 8),
            topMat
        );
        top.position.set(4, h + 10, 3);
        group.add(top);
    }

    _buildCatalhoyuk(group, h) {
        // Neolithic settlement mounds
        const moundMat = new THREE.MeshLambertMaterial({ color: 0xccbb99 });
        const mound1 = new THREE.Mesh(
            new THREE.SphereGeometry(8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
            moundMat
        );
        mound1.position.set(-3, h + 1, 2);
        mound1.scale.y = 0.5;
        mound1.castShadow = true;
        group.add(mound1);

        const mound2 = new THREE.Mesh(
            new THREE.SphereGeometry(6, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6),
            moundMat
        );
        mound2.position.set(4, h + 0.8, -2);
        mound2.scale.y = 0.4;
        mound2.castShadow = true;
        group.add(mound2);

        // Excavation wall
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xbbaa88 });
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 2, 3),
            wallMat
        );
        wall.position.set(0, h + 1, 0);
        group.add(wall);

        // Roof reconstructions
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x8a7040 });
        for (let i = -2; i <= 2; i += 2) {
            for (let j = -2; j <= 2; j += 2) {
                const roof = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 0.2, 1.5),
                    roofMat
                );
                roof.position.set(i, h + 2.5, j);
                group.add(roof);

                // Ladder
                const ladder = new THREE.Mesh(
                    new THREE.BoxGeometry(0.1, 1.2, 0.4),
                    new THREE.MeshLambertMaterial({ color: 0x6a5030 })
                );
                ladder.position.set(i, h + 1.8, j + 1.2);
                group.add(ladder);
            }
        }

        // Information sign
        const signMat = new THREE.MeshLambertMaterial({ color: 0x8a6a3a });
        const sign = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.5, 0.2),
            signMat
        );
        sign.position.set(8, h + 1, 0);
        group.add(sign);
    }

    _buildTuzGolu(group, h) {
        // Salt lake is rendered in terrain, this is a viewpoint/piers
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });

        // Viewing platform
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.3, 6),
            woodMat
        );
        platform.position.set(0, h + 1.5, 20);
        platform.castShadow = true;
        group.add(platform);

        // Posts
        for (let i = -2.5; i <= 2.5; i += 5) {
            for (let j = -2.5; j <= 2.5; j += 5) {
                const post = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.15, 0.2, 3, 6),
                    woodMat
                );
                post.position.set(i, h + 1.5, 20 + j);
                group.add(post);
            }
        }

        // Railing
        const railMat = new THREE.MeshLambertMaterial({ color: 0x7a6a4a });
        for (let i = -3; i <= 3; i += 6) {
            const rail = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 6, 4),
                railMat
            );
            rail.position.set(i, h + 2.8, 20);
            rail.rotation.x = Math.PI / 2;
            group.add(rail);
        }

        // Salt pile decoration
        const saltMat = new THREE.MeshLambertMaterial({
            color: 0xeeeeee
        });
        const saltPile = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.5),
            saltMat
        );
        saltPile.position.set(4, h + 0.3, 15);
        saltPile.scale.y = 0.4;
        group.add(saltPile);
    }

    _buildSelcukluKulesi(group, h) {
        // Tall observation tower
        const towerMat = new THREE.MeshLambertMaterial({
            color: 0x88aacc,
            emissive: 0x4488aa,
            emissiveIntensity: 0.05
        });

        // Main tower shaft
        const shaft = new THREE.Mesh(
            new THREE.CylinderGeometry(1.2, 2, 35, 12),
            towerMat
        );
        shaft.position.set(0, h + 17.5, 0);
        shaft.castShadow = true;
        group.add(shaft);

        // Observation deck
        const deckMat = new THREE.MeshLambertMaterial({ color: 0x99bbdd });
        const deck = new THREE.Mesh(
            new THREE.CylinderGeometry(3.5, 3, 0.8, 16),
            deckMat
        );
        deck.position.set(0, h + 30, 0);
        deck.castShadow = true;
        group.add(deck);

        // Upper section
        const upper = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1.2, 5, 12),
            towerMat
        );
        upper.position.set(0, h + 33, 0);
        group.add(upper);

        // Top cone
        const coneMat = new THREE.MeshLambertMaterial({ color: 0xccaa66 });
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(1.2, 2, 12),
            coneMat
        );
        cone.position.set(0, h + 36, 0);
        group.add(cone);

        // Antenna
        const antenna = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.15, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        antenna.position.set(0, h + 38.5, 0);
        group.add(antenna);

        // Windows (light points)
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const windowLight = new THREE.Mesh(
                new THREE.CircleGeometry(0.4, 8),
                new THREE.MeshLambertMaterial({
                    color: 0xaaddff,
                    emissive: 0x4488cc,
                    emissiveIntensity: 0.3
                })
            );
            windowLight.position.set(
                Math.cos(angle) * 1.8,
                h + 17,
                Math.sin(angle) * 1.8
            );
            windowLight.lookAt(0, h + 17, 0);
            group.add(windowLight);
        }

        // Glow at top
        const glowMat = new THREE.MeshLambertMaterial({
            color: 0xff4444,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            glowMat
        );
        glow.position.set(0, h + 39, 0);
        group.add(glow);
    }

    _buildAlaeddinCamii(group, h) {
        // Historic Seljuk mosque
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xddccbb });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x664422 });

        // Main prayer hall
        const hall = new THREE.Mesh(
            new THREE.BoxGeometry(12, 4, 10),
            wallMat
        );
        hall.position.set(0, h + 2, 0);
        hall.castShadow = true;
        group.add(hall);

        // Roof
        const roof = new THREE.Mesh(
            new THREE.BoxGeometry(13, 0.5, 11),
            roofMat
        );
        roof.position.set(0, h + 4.25, 0);
        group.add(roof);

        // Multiple small domes
        const domeMat = new THREE.MeshLambertMaterial({ color: 0x887755 });
        for (let i = -3; i <= 3; i += 3) {
            for (let j = -3; j <= 3; j += 3) {
                const dome = new THREE.Mesh(
                    new THREE.SphereGeometry(1.2, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
                    domeMat
                );
                dome.position.set(i, h + 4.5, j);
                dome.scale.y = 0.6;
                group.add(dome);
            }
        }

        // Minaret (tall, thin)
        const minaretMat = new THREE.MeshLambertMaterial({ color: 0xccbbaa });
        const minaret = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.7, 14, 8),
            minaretMat
        );
        minaret.position.set(7, h + 7, 4);
        minaret.castShadow = true;
        group.add(minaret);

        // Minaret balcony
        const balconyMat = new THREE.MeshLambertMaterial({ color: 0xbbaa99 });
        const balcony = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 0.7, 0.3, 10),
            balconyMat
        );
        balcony.position.set(7, h + 12, 4);
        group.add(balcony);

        // Minaret top cone
        const coneMat = new THREE.MeshLambertMaterial({ color: 0xccaa66 });
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 1, 8),
            coneMat
        );
        cone.position.set(7, h + 14.5, 4);
        group.add(cone);
    }

    _buildMeram(group, h) {
        // Vineyard/garden area
        const greenMat = new THREE.MeshLambertMaterial({ color: 0x3a7a2a });

        // Pergola structure
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x7a5a3a });
        for (let i = -6; i <= 6; i += 4) {
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.2, 3, 6),
                woodMat
            );
            post.position.set(i, h + 1.5, 0);
            group.add(post);
        }

        // Cross beams
        const beam = new THREE.Mesh(
            new THREE.BoxGeometry(12, 0.1, 0.1),
            woodMat
        );
        beam.position.set(0, h + 3, 0);
        group.add(beam);

        // Vine leaves (green spheres)
        for (let i = -5; i <= 5; i += 2) {
            for (let j = -2; j <= 2; j += 2) {
                const leaf = new THREE.Mesh(
                    new THREE.SphereGeometry(0.6, 6, 6),
                    greenMat
                );
                leaf.position.set(i, h + 3.2, j);
                group.add(leaf);
            }
        }

        // Small gazebo
        const gazeboMat = new THREE.MeshLambertMaterial({ color: 0x8a7a5a });
        const gazebo = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2.5, 2.5, 8, 1, true),
            gazeboMat
        );
        gazebo.position.set(5, h + 1.25, 6);
        gazebo.castShadow = true;
        group.add(gazebo);

        // Gazebo roof
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x6a3a1a });
        const roof = new THREE.Mesh(
            new THREE.ConeGeometry(2.8, 1.2, 8),
            roofMat
        );
        roof.position.set(5, h + 3, 6);
        group.add(roof);

        // Flower patches
        const flowerMat = new THREE.MeshLambertMaterial({
            color: 0xff6688,
            emissive: 0xff4488,
            emissiveIntensity: 0.1
        });
        for (let i = 0; i < 6; i++) {
            const flower = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 6, 6),
                flowerMat
            );
            flower.position.set(
                (Math.random() - 0.5) * 10,
                h + 0.3,
                (Math.random() - 0.5) * 8 + 4
            );
            group.add(flower);
        }
    }

    _buildBilimMerkezi(group, h) {
        // Modern science center
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
        const blueMat = new THREE.MeshLambertMaterial({ color: 0x4488cc });
        const glassMat = new THREE.MeshLambertMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3
        });

        // Main building (modern angular)
        const main = new THREE.Mesh(
            new THREE.BoxGeometry(10, 4, 8),
            whiteMat
        );
        main.position.set(0, h + 2, 0);
        main.castShadow = true;
        group.add(main);

        // Angled roof
        const roofGeo = new THREE.BufferGeometry();
        const roofVerts = new Float32Array([
            -5.5, h + 4, -4.5,
            5.5, h + 4, -4.5,
            0, h + 6.5, 0,
            -5.5, h + 4, 4.5,
            5.5, h + 4, 4.5,
            0, h + 6.5, 0,
        ]);
        roofGeo.setAttribute('position', new THREE.BufferAttribute(roofVerts, 3));
        roofGeo.computeVertexNormals();
        const roof = new THREE.Mesh(roofGeo, blueMat);
        group.add(roof);

        // Glass entrance
        const entrance = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2.5, 0.3),
            glassMat
        );
        entrance.position.set(0, h + 1.25, 4.15);
        group.add(entrance);

        // Side wings
        for (let side = -1; side <= 1; side += 2) {
            const wing = new THREE.Mesh(
                new THREE.BoxGeometry(3, 2.5, 4),
                whiteMat
            );
            wing.position.set(side * 6.5, h + 1.25, 0);
            wing.castShadow = true;
            group.add(wing);

            // Blue accent
            const accent = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 1.5, 3.5),
                blueMat
            );
            accent.position.set(side * 6.5, h + 1.75, 0);
            group.add(accent);
        }

        // Planetarium dome
        const domeMat = new THREE.MeshLambertMaterial({
            color: 0x88aacc,
            emissive: 0x224466,
            emissiveIntensity: 0.05
        });
        const dome = new THREE.Mesh(
            new THREE.SphereGeometry(2.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
            domeMat
        );
        dome.position.set(0, h + 4, -5);
        dome.scale.y = 0.6;
        group.add(dome);

        // Solar panels
        const panelMat = new THREE.MeshLambertMaterial({
            color: 0x224488,
            emissive: 0x112244,
            emissiveIntensity: 0.2
        });
        for (let i = -1; i <= 1; i += 2) {
            const panel = new THREE.Mesh(
                new THREE.BoxGeometry(2, 0.1, 1.5),
                panelMat
            );
            panel.position.set(i * 3, h + 5, -4);
            panel.rotation.x = -0.3;
            group.add(panel);
        }
    }

    _buildKulturParki(group, h) {
        // Cultural park with amphitheater
        const stoneMat = new THREE.MeshLambertMaterial({ color: 0xbbaa88 });
        const greenMat = new THREE.MeshLambertMaterial({ color: 0x4a8a3a });

        // Amphitheater (semi-circle)
        for (let ring = 0; ring < 4; ring++) {
            const r = 3 + ring * 2;
            const segments = 16;
            const stepMat = new THREE.MeshLambertMaterial({
                color: 0x998877 + ring * 0x020202
            });
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI - Math.PI / 2;
                const step = new THREE.Mesh(
                    new THREE.BoxGeometry(0.6, 0.3 + ring * 0.1, 1),
                    stepMat
                );
                step.position.set(
                    Math.cos(angle) * r,
                    h + 0.15 + ring * 0.25,
                    Math.sin(angle) * r
                );
                step.rotation.y = -angle;
                group.add(step);
            }
        }

        // Stage
        const stage = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.4, 3),
            stoneMat
        );
        stage.position.set(0, h + 0.2, -1);
        stage.castShadow = true;
        group.add(stage);

        // Walkway (green path)
        const path = new THREE.Mesh(
            new THREE.BoxGeometry(2, 0.05, 4),
            new THREE.MeshLambertMaterial({ color: 0x887766 })
        );
        path.position.set(0, h + 0.03, 3);
        group.add(path);

        // Trees around the area
        const treeMat = new THREE.MeshLambertMaterial({ color: 0x3a7a2a });
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5a3d20 });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 9 + Math.random() * 2;
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.25, 1.5, 6),
                trunkMat
            );
            trunk.position.y = 0.75;
            tree.add(trunk);
            const crown = new THREE.Mesh(
                new THREE.SphereGeometry(0.8 + Math.random() * 0.3, 6, 6),
                treeMat
            );
            crown.position.y = 1.5 + Math.random() * 0.3;
            tree.add(crown);
            tree.position.set(
                Math.cos(angle) * dist,
                h,
                Math.sin(angle) * dist
            );
            group.add(tree);
        }

        // Flag poles
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const flagMat = new THREE.MeshLambertMaterial({ color: 0xcc3333 });
        for (let i = -1; i <= 1; i += 2) {
            const pole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.06, 0.08, 4, 6),
                poleMat
            );
            pole.position.set(i * 4, h + 2, 5);
            group.add(pole);

            const flag = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.5, 0.05),
                flagMat
            );
            flag.position.set(i * 4 + 0.5, h + 3.5, 5);
            group.add(flag);
        }
    }

    getLandmarks() {
        return this.landmarks.map(lm => ({
            id: lm.config.id,
            name: lm.config.name,
            icon: lm.config.icon,
            x: lm.worldX,
            z: lm.worldZ,
            discovered: lm.discovered
        }));
    }

    checkDiscovery(carX, carZ, radius = 50) {
        let newDiscovery = null;
        for (const lm of this.landmarks) {
            if (lm.discovered) continue;
            const dx = carX - lm.worldX;
            const dz = carZ - lm.worldZ;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < radius) {
                lm.discovered = true;
                newDiscovery = lm.config;
            }
        }
        return newDiscovery;
    }

    update(time) {
        // Animate beacons
        for (const lm of this.landmarks) {
            if (lm.beacon) {
                const intensity = 0.3 + 0.3 * Math.sin(time * 2 + lm.worldX);
                lm.beacon.material.emissiveIntensity = intensity;
                lm.beacon.position.y = lm.height + 20 + Math.sin(time * 0.5 + lm.worldX) * 2;
            }
        }
    }

    dispose() {
        this.landmarks.forEach(lm => {
            this.scene.remove(lm.group);
            lm.group.traverse(child => {
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
