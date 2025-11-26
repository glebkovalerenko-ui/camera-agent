class Alien {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.width = options.width || 100;
        this.height = options.height || 100;
        this.virtualWidth = options.virtualWidth || 1920;
        this.virtualHeight = options.virtualHeight || 1080;
        
        // Position will be set by the formation manager
        this.x = options.x || 0;
        this.y = options.y || 0;
        
        // Movement properties
        this.speed = options.speed || 100;
        this.direction = 1; // 1 for right, -1 for left
        
        // Update sprite path to match processed file
        this.img = new Image();
        this.img.src = './sprites/alien1.png';  // Updated path
    }

    update(delta) {
        // Basic horizontal movement
        this.x += this.speed * this.direction * delta;
    }

    draw() {
        const ctx = this.ctx;
        if (this.img.complete) {
            ctx.save();
            
            // --- FIX FOR IOS GHOSTING ---
            // Вместо рисования второй картинки с фильтром, используем нативную тень
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)'; // Цвет тени
            ctx.shadowBlur = 10;                    // Размытие
            ctx.shadowOffsetX = 15;                 // Смещение по X
            ctx.shadowOffsetY = 30;                 // Смещение по Y (тень внизу)
            
            // Рисуем унитаз один раз, тень появится сама
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
            
            ctx.restore();
        } else {
            // Заглушка, если картинка не прогрузилась
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
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
