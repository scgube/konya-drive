# Anchored Summary — konya-drive

## Project Identity
- **Repo**: scgube/konya-drive
- **Canlı**: https://scgube.github.io/konya-drive/
- **Tür**: 3D sürüş oyunu (Three.js), Konya temalı

## Bug Fixes (4) — Hepsi Pushlandı
1. **Direksiyon ters** → `heading +=` → `heading -=` + `dx = -sin(heading)`
2. **Araba yere gömülüyor** → terrain yüksekliği init'te doğru
3. **Çarpışma yok** → collider'lar çalışıyor
4. **Boost çalışmıyor** → maxSpeed artırıldı, boostMultiplier=2.5

## Benzinci İstasyonları
- `js/gasstations.js` — 4 istasyon, 3D model, refuel, minimap
- `GasStationSystem`: `getRefuelStatus()`, `getColliders()`, `getStations()` metodları

## Mevcut Durum
- ✅ `getStations()` eklendi, pushlandı, GitHub Pages'e deploy edildi
- ✅ Sayfa 0 hata ile yükleniyor
- ❌ **"OYUNU BAŞLAT" sonrası 79 runtime hatası** — kullanıcı kendisi inceleyip halledecek
- 🔄 **Kullanıcıya bırakıldı** — kod değişikliği yapılmayacak, sadece summary tutulacak

## Anahtar Değişiklikler (Yön Bulma)
- Tüm heading: `heading -= turnRate`, `dx = -sin(heading)`
- Kamera: `camAngle = π - heading`, `lookAhead.x = -sin(h)`
- car.js: throttle 100, brake 50, turnRate 2.0, boostMultiplier 2.5, drag 0.08
