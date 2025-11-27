import { Strings } from '../utils/Localization.js';

class StartupScreen {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.virtualWidth = options.virtualWidth;
        this.virtualHeight = options.virtualHeight;
        this.alpha = 0;
        this.fadeIn = true;
        this.fadeSpeed = 0.8;
        this.readyForInput = false;
        this.showPressEnter = false;
    }

    onPause() {}
    onResume() {}

    update(delta) {
        if (this.fadeIn) {
            this.alpha = Math.min(1, this.alpha + delta * this.fadeSpeed);
            if (this.alpha >= 1) {
                this.fadeIn = false;
                this.showPressEnter = true;
                this.readyForInput = true;
            }
        }
    }

    draw() {
        this.ctx.save();
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
        
        this.ctx.globalAlpha = this.alpha;
        this.ctx.fillStyle = '#00ff00'; 
        this.ctx.font = '32px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 20;
        
        // Заголовок (Система)
        this.ctx.fillText(Strings.bootSystem, 
            this.virtualWidth / 2, 
            this.virtualHeight / 2);

        if (this.showPressEnter) {
            this.ctx.font = '24px "Press Start 2P"';
            this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.5;
            
            // Призыв к действию (Нажми...)
            this.ctx.fillText(Strings.bootPrompt, 
                this.virtualWidth / 2, 
                this.virtualHeight * 0.7);
        }
        
        this.ctx.restore();
    }

    handleInput(key) {
        if (this.readyForInput && (key === 'Enter' || key === ' ')) {
            return 'intro';
        }
        return null;
    }
}

export default StartupScreen;