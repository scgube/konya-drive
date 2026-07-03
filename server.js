/**
 * Konya: Ufukların Ötesinde - Geliştirme Sunucusu
 * ES modülleri (import/export) ile çalıştığı için HTTP sunucu gereklidir.
 * 
 * Kullanım: node server.js
 * Tarayıcıda aç: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wasm': 'application/wasm',
};

const server = http.createServer((req, res) => {
    // Normalize URL
    let url = req.url.split('?')[0];
    if (url.endsWith('/')) url += 'index.html';
    if (url === '/') url = '/index.html';

    const filePath = path.join(__dirname, url);
    const ext = path.extname(filePath).toLowerCase();

    // Security: only serve files from the project directory
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>404 - Dosya Bulunamadı</h1>');
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<h1>500 - Sunucu Hatası</h1>');
            }
            return;
        }

        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache',
        });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚗 Konya: Ufukların Ötesinde`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`📱 Ağ üzerinden erişim: http://${getLocalIP()}:${PORT}`);
    console.log(`\nOyunu başlatmak için yukarıdaki adresi tarayıcınızda açın.`);
});

function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}
