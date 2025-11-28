import AssetLoader from './utils/AssetLoader.js';

class Alien {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.width = options.width || 100;
        this.height = options.height || 100;
        this.virtualWidth = options.virtualWidth || 1024;
        this.virtualHeight = options.virtualHeight || 1024;
        
        // Рождаемся за экраном, чтобы не мелькать при инициализации
        this.x = options.x || -1000;
        this.y = options.y || -1000;
        
        this.speed = options.speed || 100;
        this.direction = 1; 
        
        this.isDiving = false;
        this.diveVelocityY = 0;
        this.diveVelocityX = 0;
        
        // ИЗМЕНЕНИЕ: Используем централизованный загрузчик
        // Картинка уже должна быть загружена в game.js
        this.img = AssetLoader.get('./sprites/alien1.png');
    }

    update(delta) {
        if (!this.isDiving) {
            this.x += this.speed * this.direction * delta;
        }
    }

    draw() {
        // Рисуем только если картинка валидна (загружена и не битая)
        if (this.img.complete && this.img.naturalWidth > 0) {
            const ctx = this.ctx;
            ctx.save();
            
            // Тень
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 15;
            ctx.shadowOffsetY = 30;
            
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
            
            ctx.restore();
        } 
    }

    reverseDirection() {
        this.direction *= -1;
    }

    collidesWith(x, y) {
        return (
            x >= this.x && 
            x <= this.x + this.width &&
            y >= this.y && 
            y <= this.y + this.height
        );
    }
}

export default Alien;