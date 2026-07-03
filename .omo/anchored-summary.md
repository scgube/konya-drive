# Anchored Summary — konya-drive (ALL FIXED ✅)

## Project Identity
- **Repo**: scgube/konya-drive
- **Canlı**: https://scgube.github.io/konya-drive/
- **Tür**: 3D sürüş oyunu (Three.js), Konya temalı

## Bug Fixes — All Resolved ✅
| # | Sorun | Fix |
|---|-------|-----|
| 1 | Direksiyon ters | `heading +=` → `heading -=` ~~(reverted later)~~ |
| 2 | Araba yere gömülüyor | terrain yüksekliği init'te alınıyor |
| 3 | Çarpışma yok | collider'lar eklendi |
| 4 | Boost çalışmıyor | maxSpeed artırıldı, boostMultiplier=2.5 |
| 5 | `getStations is not a function` (200+ hata) | `getStations()` metodu eklendi |
| 6 | **Yön tamamen ters** (heading -=, dx = -sin) | `heading += turnRate`, `dx = +sin(heading)` |

## Yön Fix'i (En Son) — Doğrulandı ✅
- **W** → heading 0.500→0.477, hız 68.6 km/h ✅
- **D** → heading 0.477→0.871 (+0.394 = sağa dönüş) ✅
- **A** → heading azalır (sola dönüş) ✅
- Tekerlek görseli de aynı yönde döner ✅
- Kamera arabanın arkasından takip eder ✅
- Terrain tilt heading ile tutarlı ✅

## Yapılan Değişiklikler (car.js)
- `this.heading += turnRate * dt` (önceden `-=`)
- `dx = Math.sin(this.heading) * this.speed * dt` (önceden `-Math.sin`)
- Terrain tilt forward: `x + sin(h)`, right: `z - sin(h)`

## Yapılan Değişiklikler (game.js)
- Kamera look-ahead: `+ sin(heading)` (önceden `- sin`)
- Kamera pozisyonu: `camAngle = π + heading` (önceden `π - heading`)

## Cache Sorunu
- GitHub Pages CDN eski dosyaları cache'liyordu
- Çözüm: Tüm module import'larına `?v=1`, entry point'e `?v=2`
- Artık deployed ve çalışıyor

## Anahtar Parametreler
- car.js: throttle 100, brake 50, turnRate 2.0, boostMultiplier 2.5, drag 0.08
- steerSpeed 2.5, steerMax 0.6, steerReturn 4
