# Anchored Summary — konya-drive

## Project Identity
- **Repo**: scgube/konya-drive
- **Canlı**: https://scgube.github.io/konya-drive/
- **Tür**: 3D sürüş oyunu (Three.js), Konya temalı

## Steering Convention (INVERTED — User Preference ✅)
| What | Convention | Why |
|------|-----------|-----|
| Heading update | `heading += turnRate * dt` | Right key (+) → heading **increases** (CCW) → car nose LEFT → moves LEFT |
| Movement X | `dx = -Math.sin(heading) * speed * dt` | heading positive → `-sin(positive)` = negative → car moves LEFT when pressing RIGHT key |
| Movement Z | `dz = Math.cos(heading) * speed * dt` | Always forward |
| Initial heading | `heading = 0` | Forward = straight ahead |
| Car visual rotation | `carGroup.rotation.y = this.heading` | heading positive → CCW → nose LEFT (matches movement) |
| Camera angle | `camAngle = Math.PI - heading` | heading=0 → camera behind; heading positive → cam behind-left |
| Look-ahead X | `carPos.x - Math.sin(heading) * lookAheadDist` | Points in movement direction (-sin, cos) |
| Look-ahead Z | `carPos.z + Math.cos(heading) * lookAheadDist` | Same |
| Terrain tilt forward | `(x - sin(h)*d, z + cos(h)*d)` | Samples terrain in movement direction |
| Terrain tilt right | `(x + cos(h)*d, z + sin(h)*d)` | Samples terrain perpendicular right |

### Controls
| Key | Behavior |
|-----|----------|
| W / ↑ | Forward (heading=0, dx=0, dz=+speed) |
| D / ← | **Car turns RIGHT** (heading decreases CW, -sin(negative)=+dx) |
| A / → | **Car turns LEFT** (heading increases CCW, -sin(positive)=-dx) |
| Shift | Boost (2.5×) |
| Space | Brake |
| R | Reset |

## Bug Fix History

| # | Issue | Status |
|---|-------|--------|
| 1 | `getStations is not a function` (200+ console errors) | ✅ Fixed & deployed |
| 2 | Car sinking into terrain at init — terrain height not sampled | ✅ Fixed |
| 3 | No collision detection — missing colliders | ✅ Fixed |
| 4 | Boost non-functional — wrong multiplier/drag values | ✅ Fixed |
| 5 | Steering inverted (heading +=, dx = +sin deployed by mistake) — car nose LEFT while moving RIGHT | ✅ Corrected to heading +=, dx = -sin |
| 6 | CDN serving stale cached JS | ✅ Fixed with cache-busting `?v=N` chain |

## Cache-Busting Current State
- `index.html` → `js/main.js?v=4`
- `main.js` → `./game.js?v=4`
- `game.js` → car.js at `?v=3`, all other sub-modules at `?v=1`
- Bump the chain when any JS content changes: car → game → main → index in cascade

## Key Parameters (car.js)
- accelerationPower: 30, brakePower: 40, deceleration: 10
- steerSpeed: 2.5, steerMax: 0.6, steerReturn: 4
- boostMultiplier: 2.5, drag: 0.08
- maxSpeedMs: 50 (180 km/h)
- fuelConsumption: 0.05 per meter, idleFuelConsumption: 0.02
- Camera: camDistance=8, camHeight=3.5, camLookAhead=5, camSmoothSpeed=4
