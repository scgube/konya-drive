# Anchored Summary — konya-drive

## Project Identity
- **Repo**: scgube/konya-drive
- **Canlı**: https://scgube.github.io/konya-drive/
- **Tür**: 3D sürüş oyunu (Three.js), Konya temalı

## Steering Convention (Current — Correct ✅)
| What | Convention | Why |
|------|-----------|-----|
| Heading update | `heading -= turnRate * dt` | Right key (positive steerAngle) → heading decreases (CW) → car nose RIGHT |
| Movement X | `dx = -Math.sin(heading) * speed * dt` | Heading negative (CW) → -sin(negative) = positive → moves RIGHT |
| Movement Z | `dz = Math.cos(heading) * speed * dt` | Always forward |
| Initial heading | `heading = 0` | Forward = straight ahead |
| Car visual rotation | `carGroup.rotation.y = this.heading` | heading=0 → straight, heading=-0.4 → CW rotation → nose RIGHT |
| Camera angle | `camAngle = Math.PI - heading` | heading=-0.4 (right turn) → cam=π+0.4 → camera behind-left (outside of turn) |
| Look-ahead X | `carPos.x - Math.sin(heading) * lookAheadDist` | Points in movement direction (-sin, cos) |
| Look-ahead Z | `carPos.z + Math.cos(heading) * lookAheadDist` | Same |
| Terrain tilt forward | `(x - sin(h)*d, z + cos(h)*d)` | Samples terrain in movement direction |
| Terrain tilt right | `(x + cos(h)*d, z + sin(h)*d)` | Samples terrain perpendicular right |

## Bug Fix History

| # | Issue | Status |
|---|-------|--------|
| 1 | `getStations is not a function` (200+ console errors) — missing `getStations()` method | ✅ Fixed & deployed |
| 2 | Car sinking into terrain at init — terrain height not sampled | ✅ Fixed |
| 3 | No collision with trees/landmarks/stations — missing collider integration | ✅ Fixed |
| 4 | Boost non-functional — wrong multiplier/drag values | ✅ Fixed |
| 5 | Steering inverted (heading +=, dx = +sin deployed) — car nose LEFT while moving RIGHT | ✅ Reverted to heading -=, dx = -sin |
| 6 | CDN serving stale cached JS — cache-busting `?v=N` on all imports | ✅ Fixed & deployed |

## Cache-Busting Current State
- `index.html` → `js/main.js?v=3`
- `main.js` → `./game.js?v=3`
- `game.js` → all 6 sub-module imports at `?v=1`, car.js at `?v=2`
- When any JS file changes, bump its import version chain to force CDN re-fetch

## Key Parameters (car.js)
- accelerationPower: 30, brakePower: 40, deceleration: 10
- steerSpeed: 2.5, steerMax: 0.6, steerReturn: 4
- boostMultiplier: 2.5, drag: 0.08
- maxSpeedMs: 50 (180 km/h)
- fuelConsumption: 0.05 per meter, idleFuelConsumption: 0.02
- Camera: camDistance=8, camHeight=3.5, camLookAhead=5, camSmoothSpeed=4

## Next Actions
1. Wait for GitHub Pages rebuild after cache-bust commit (a87da0c)
2. Verify live site: heading=0 → forward straight, D → heading decreases → car turns RIGHT, A → heading increases → car turns LEFT
3. Verify camera behind car on both straights and turns
