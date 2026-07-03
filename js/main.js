// main.js - Oyun başlatma ve başlangıç noktası
import { Game } from './game.js?v=6';

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

async function init() {
    try {
        const game = new Game();
        await game.start();

        // Expose for debugging
        window.__game = game;
    } catch (err) {
        console.error('Oyun başlatılamadı:', err);
        document.getElementById('loading-text').textContent =
            'Yükleme hatası: ' + err.message;
    }
}
