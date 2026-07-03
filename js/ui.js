// ui.js - HUD yönetimi (hız göstergesi, yakıt, mesafe, mini harita)
export class UI {
    constructor() {
        // DOM references
        this.speedValue = document.getElementById('speed-value');
        this.fuelBar = document.getElementById('fuel-bar');
        this.fuelText = document.getElementById('fuel-text');
        this.distanceValue = document.getElementById('distance-value');
        this.landmarksList = document.getElementById('landmarks-list');
        this.compassNeedle = document.getElementById('compass-needle');
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingBar = document.getElementById('loading-bar');
        this.loadingText = document.getElementById('loading-text');
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.notification = document.getElementById('landmark-notification');
        this.notifText = document.getElementById('notif-text');

        this.landmarkItems = new Map();
        this.notifTimeout = null;

        // Minimap
        this.minimapSize = 180;
        this.minimapScale = 0.15; // pixels per world unit
        this.minimapCenterX = 0;
        this.minimapCenterZ = 0;
        this.landmarkData = [];

        // Bind start button
        this.startHandler = null;
    }

    onStartClick(handler) {
        this.startHandler = handler;
        this.startBtn.addEventListener('click', () => {
            if (this.startHandler) this.startHandler();
        });
    }

    showStartScreen() {
        this.startScreen.style.display = 'flex';
    }

    hideStartScreen() {
        this.startScreen.style.display = 'none';
    }

    hideLoading() {
        this.loadingScreen.classList.add('hidden');
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 800);
    }

    updateLoading(progress, text) {
        this.loadingBar.style.width = progress + '%';
        if (text) this.loadingText.textContent = text;
    }

    setLandmarks(landmarks) {
        this.landmarkData = landmarks;
        this.landmarksList.innerHTML = '';
        this.landmarkItems.clear();

        for (const lm of landmarks) {
            const item = document.createElement('div');
            item.className = 'landmark-item' + (lm.discovered ? ' discovered' : '');
            item.innerHTML = `<span class="lm-icon">${lm.icon}</span> ${lm.name}`;
            this.landmarksList.appendChild(item);
            this.landmarkItems.set(lm.id, item);
        }
    }

    update(speedKmh, fuel, distanceKm, heading, carX, carZ, landmarks, stations = []) {
        // Speed
        this.speedValue.textContent = Math.round(speedKmh);

        // Speed color based on speed
        if (speedKmh > 120) {
            this.speedValue.style.color = '#ff4444';
        } else if (speedKmh > 80) {
            this.speedValue.style.color = '#ffaa33';
        } else {
            this.speedValue.style.color = '#ffcc33';
        }

        // Fuel
        const fuelPct = Math.max(0, fuel);
        this.fuelBar.style.width = fuelPct + '%';

        // Fuel bar color
        if (fuelPct < 20) {
            this.fuelBar.style.background = 'linear-gradient(90deg, #ff2222, #ff4444)';
        } else if (fuelPct < 50) {
            this.fuelBar.style.background = 'linear-gradient(90deg, #ff4444, #ffaa00)';
        } else {
            this.fuelBar.style.background = 'linear-gradient(90deg, #ff4444, #ffaa00, #44ff44)';
        }

        this.fuelText.textContent = Math.round(fuelPct) + '%';

        // Distance
        this.distanceValue.textContent = (distanceKm / 1000).toFixed(1) + ' km';

        // Compass
        const degrees = ((heading * 180 / Math.PI) + 360) % 360;
        this.compassNeedle.style.transform = `rotate(${degrees}deg)`;

        // Landmarks discovery status
        for (const lm of landmarks) {
            const item = this.landmarkItems.get(lm.id);
            if (item) {
                if (lm.discovered && !item.classList.contains('discovered')) {
                    item.classList.add('discovered');
                }
            }
        }

        // Minimap
        this._drawMinimap(carX, carZ, heading, landmarks, stations);
    }

    _drawMinimap(carX, carZ, heading, landmarks, stations = []) {
        const ctx = this.minimapCtx;
        const s = this.minimapSize;
        const scale = this.minimapScale;

        ctx.clearRect(0, 0, s, s);

        // Background
        ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
        ctx.fillRect(0, 0, s, s);

        // Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(1, 1, s - 2, s - 2);

        // Center of minimap = car position
        const cx = s / 2;
        const cy = s / 2;
        const viewRange = 120; // world units visible around car

        // Draw terrain height indicators (simple grid-based)
        const gridStep = 20;
        ctx.globalAlpha = 0.3;
        for (let wx = carX - viewRange; wx <= carX + viewRange; wx += gridStep) {
            for (let wz = carZ - viewRange; wz <= carZ + viewRange; wz += gridStep) {
                // We don't have direct access to terrain height here
                // So we use a simple pattern
                const px = cx + (wx - carX) * scale;
                const py = cy + (wz - carZ) * scale;
                if (px >= 0 && px <= s && py >= 0 && py <= s) {
                    ctx.fillStyle = 'rgba(60, 80, 40, 0.15)';
                    ctx.fillRect(px - 1, py - 1, 2, 2);
                }
            }
        }
        ctx.globalAlpha = 1;

        // Draw Tuz Gölü (big white area)
        const tuzPx = cx + (-600 - carX) * scale;
        const tuzPy = cy + (-500 - carZ) * scale;
        ctx.beginPath();
        ctx.arc(tuzPx, tuzPy, 40 * scale, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 220, 210, 0.3)';
        ctx.fill();

        // Draw landmarks
        for (const lm of landmarks) {
            const lx = cx + (lm.x - carX) * scale;
            const ly = cy + (lm.z - carZ) * scale;

            if (lx >= 0 && lx <= s && ly >= 0 && ly <= s) {
                const discovered = lm.discovered;

                // Glow for discovered
                if (discovered) {
                    ctx.beginPath();
                    ctx.arc(lx, ly, 6, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 204, 51, 0.2)';
                    ctx.fill();
                }

                // Point
                ctx.beginPath();
                ctx.arc(lx, ly, 3, 0, Math.PI * 2);
                ctx.fillStyle = discovered ? '#ffcc33' : 'rgba(255, 255, 255, 0.3)';
                ctx.fill();

                if (discovered) {
                    ctx.strokeStyle = '#ffcc33';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                // Label
                if (discovered) {
                    ctx.fillStyle = 'rgba(255, 204, 51, 0.7)';
                    ctx.font = '7px sans-serif';
                    ctx.fillText(lm.name.substring(0, 8), lx + 5, ly + 2);
                }
            }
        }

        // Draw gas stations
        for (const st of stations) {
            const sx = cx + (st.x - carX) * scale;
            const sy = cy + (st.z - carZ) * scale;
            if (sx >= 0 && sx <= s && sy >= 0 && sy <= s) {
                ctx.fillStyle = '#ff6633';
                ctx.fillRect(sx - 2, sy - 2, 4, 4);
                ctx.font = '5px sans-serif';
                ctx.fillText('⛽', sx + 3, sy + 2);
            }
        }

        // Car indicator (triangle pointing heading)
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(heading);

        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-4, 4);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fillStyle = '#ffcc33';
        ctx.fill();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // Compass ring around minimap
        ctx.beginPath();
        ctx.arc(cx, cy, s / 2 - 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    showNotification(text) {
        if (this.notifTimeout) {
            clearTimeout(this.notifTimeout);
            this.notification.style.display = 'none';
        }
        this.notifText.textContent = text;
        this.notification.style.display = 'flex';
        this.notifTimeout = setTimeout(() => {
            this.notification.style.display = 'none';
            this.notifTimeout = null;
        }, 3000);
    }

    dispose() {
        if (this.notifTimeout) clearTimeout(this.notifTimeout);
    }
}
