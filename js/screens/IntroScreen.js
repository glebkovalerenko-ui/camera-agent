import { Strings, lang } from '../utils/Localization.js';

class IntroScreen {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.virtualWidth = options.virtualWidth;
        this.virtualHeight = options.virtualHeight;
        this.bgScroller = options.bgScroller;
        
        this.logo = new Image();
        if (lang === 'ru') {
            this.logo.src = './sprites/logo_ru.png';
        } else {
            this.logo.src = './sprites/logo_en.png';
        }
        
        this.alpha = 0;
        this.fadeIn = true;
        this.fadeSpeed = 2.0;
        
        this.pressSpaceAlpha = 0;
        this.pressSpaceVisible = false;

        this.isGameOver = options.isGameOver || false;
        this.finalScore = options.finalScore || 0;
        this.highScore = options.highScore || 0;
        this.inputBlockTimer = 1.0;
    }

    onPause() {}
    onResume() {}
    startMusic() {} // Заглушка (управляется через Game -> MusicPlayer)
    cleanup() {}

    update(delta) {
        this.bgScroller.update(delta);
        if (this.inputBlockTimer > 0) this.inputBlockTimer -= delta;

        if (this.fadeIn) {
            this.alpha = Math.min(1, this.alpha + delta * this.fadeSpeed);
            if (this.alpha >= 1) {
                this.fadeIn = false;
                this.pressSpaceVisible = true;
            }
        }
        
        if (this.pressSpaceVisible) {
            this.pressSpaceAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
        }
    }

    draw() {
        this.bgScroller.draw();
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);

        if (this.isGameOver) {
            this.ctx.save();
            this.ctx.globalAlpha = this.alpha;
            
            this.ctx.fillStyle = '#ff0000';
            this.ctx.font = '64px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 20;
            this.ctx.fillText(Strings.gameOver, this.virtualWidth / 2, this.virtualHeight * 0.3);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '32px "Press Start 2P"';
            this.ctx.shadowBlur = 0;
            this.ctx.fillText(`${Strings.finalScore}: ${this.finalScore}`, this.virtualWidth / 2, this.virtualHeight * 0.5);
            
            this.ctx.fillStyle = '#ffff00';
            this.ctx.fillText(`${Strings.highScore}: ${this.highScore}`, this.virtualWidth / 2, this.virtualHeight * 0.6);
            
            this.ctx.restore();
        } else {
            if (this.logo.complete && this.logo.naturalWidth > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = this.alpha;
                
                const maxWidth = this.virtualWidth * 0.8; 
                let scale = 1.0;
                if (this.logo.width > maxWidth) {
                    scale = maxWidth / this.logo.width;
                }
                
                const logoWidth = this.logo.width * scale;
                const logoHeight = this.logo.height * scale;
                const x = (this.virtualWidth - logoWidth) / 2;
                const y = (this.virtualHeight - logoHeight) / 2;
                
                this.ctx.drawImage(this.logo, x, y, logoWidth, logoHeight);
                this.ctx.restore();
            }
        }
        
        if (this.pressSpaceVisible && this.inputBlockTimer <= 0) {
            this.ctx.save();
            this.ctx.globalAlpha = this.pressSpaceAlpha;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '24px "Press Start 2P"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(Strings.pressStart, this.virtualWidth / 2, this.virtualHeight * 0.85);
            this.ctx.restore();
        }
    }

    handleInput(key) {
        if (this.inputBlockTimer > 0) return null;
        if ((key === ' ' || key === 'Enter') && this.pressSpaceVisible) {
            window.game.gameState.reset();
            // ИЗМЕНЕНИЕ: Возвращаем абстрактную команду 'start'
            // Game.js сам решит, показывать туториал или нет
            return 'start'; 
        }
        return null;
    }
}

export default IntroScreen;