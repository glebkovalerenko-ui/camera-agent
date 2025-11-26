import { Strings } from '../utils/Localization.js';

class IntroScreen {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.virtualWidth = options.virtualWidth;
        this.virtualHeight = options.virtualHeight;
        this.bgScroller = options.bgScroller;
        
        this.logo = new Image();
        this.logo.src = './sprites/xenowar.png';
        
        this.alpha = 0;
        this.fadeIn = true;
        this.fadeSpeed = 0.5;
        
        this.pressSpaceAlpha = 0;
        this.pressSpaceVisible = false;

        this.isGameOver = options.isGameOver || false;
        this.finalScore = options.finalScore;
        this.highScore = options.highScore;

        // Audio setup
        this.titleMusic = new Audio('/audio/xeno-war.mp3'); 
        this.titleMusic.loop = true;
        this.titleMusic.volume = 1.0;
        this.musicStarted = false;

        // --- AUDIO UNLOCKER ---
        const startAudio = () => {
            console.log('Interaction: Attempting to unlock audio...');

            // 1. Unlock AudioContext
            if (window.game && window.game.audioManager && window.game.audioManager.context) {
                if (window.game.audioManager.context.state === 'suspended') {
                    window.game.audioManager.context.resume();
                }
            }

            // 2. Start Menu Music
            if (!this.musicStarted && !window.game.isPaused) {
                this.titleMusic.play()
                    .then(() => {
                        this.musicStarted = true;
                        console.log('Menu music started');
                        // Remove unlock listeners
                        window.removeEventListener('click', startAudio);
                        window.removeEventListener('keydown', startAudio);
                        window.removeEventListener('touchstart', startAudio);
                    })
                    .catch(e => console.log('Audio play blocked:', e));
            }
        };

        // Listeners for first interaction
        window.addEventListener('click', startAudio);
        window.addEventListener('keydown', startAudio);
        window.addEventListener('touchstart', startAudio);

        // --- TAP TO START HANDLER ---
        // Используем стрелочную функцию, чтобы this не терялся
        this.tapHandler = (e) => {
            // Если текст "Нажми пробел" виден — стартуем
            if (this.pressSpaceVisible) {
                // Предотвращаем возможные двойные срабатывания
                if (e.type === 'touchstart') e.preventDefault(); 
                
                console.log('Tap to start triggered');
                window.game.switchScreen('game');
                window.game.gameState.reset();
                this.cleanup();
            }
        };

        // Вешаем на окно, чтобы ловить везде. Используем passive: false для надежности
        window.addEventListener('touchstart', this.tapHandler, { passive: false });
        window.addEventListener('click', this.tapHandler);
    }

    // Новые методы для обработки паузы
    onPause() {
        if (this.titleMusic && this.musicStarted) {
            this.titleMusic.pause();
        }
    }

    onResume() {
        if (this.titleMusic && this.musicStarted) {
            this.titleMusic.play().catch(e => console.log('Resume failed', e));
        }
    }

    update(delta) {
        this.bgScroller.update(delta);
        
        if (this.fadeIn) {
            this.alpha = Math.min(1, this.alpha + delta * this.fadeSpeed);
            if (this.alpha >= 1) {
                this.fadeIn = false;
                this.pressSpaceVisible = true;
                
                // Try to play if not started yet (and not paused)
                if (!this.musicStarted && !window.game.isPaused) {
                    this.titleMusic.play()
                        .then(() => this.musicStarted = true)
                        .catch(e => {});
                }
            }
        }
        
        if (this.pressSpaceVisible) {
            this.pressSpaceAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
        }
    }

    draw() {
        this.bgScroller.draw();
        
        if (this.logo.complete) {
            this.ctx.save();
            this.ctx.globalAlpha = this.alpha;
            const scale = 0.8;
            const logoWidth = this.logo.width * scale;
            const logoHeight = this.logo.height * scale;
            const x = (this.virtualWidth - logoWidth) / 2;
            const y = (this.virtualHeight - logoHeight) / 2;
            this.ctx.drawImage(this.logo, x, y, logoWidth, logoHeight);
            this.ctx.restore();
        }

        if (this.isGameOver && this.pressSpaceVisible) {
            this.ctx.save();
            this.ctx.globalAlpha = this.alpha;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '24px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${Strings.finalScore}: ${this.finalScore}`, this.virtualWidth / 2, this.virtualHeight * 0.15);
            this.ctx.fillText(`${Strings.highScore}: ${this.highScore}`, this.virtualWidth / 2, this.virtualHeight * 0.2);

            this.ctx.fillStyle = '#8B4513';
            this.ctx.font = '48px "Press Start 2P"';
            this.ctx.fillText(Strings.gameOver, this.virtualWidth / 2, this.virtualHeight * 0.3);
            this.ctx.restore();
        }
        
        if (this.pressSpaceVisible) {
            this.ctx.save();
            this.ctx.globalAlpha = this.pressSpaceAlpha;
            this.ctx.fillStyle = '#b026ff';
            this.ctx.font = '24px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Strings.pressStart, this.virtualWidth / 2, this.virtualHeight * 0.7);
            this.ctx.restore();
        }
    }

    handleInput(key) {
        if ((key === ' ' || key === 'Enter') && this.pressSpaceVisible) {
            window.game.gameState.reset();
            this.cleanup();
            return 'game';
        }
        return null;
    }

    cleanup() {
        if (this.titleMusic) {
            this.titleMusic.pause();
            this.titleMusic.currentTime = 0;
        }
        // Удаляем слушатели
        window.removeEventListener('touchstart', this.tapHandler);
        window.removeEventListener('click', this.tapHandler);
    }
}

export default IntroScreen;