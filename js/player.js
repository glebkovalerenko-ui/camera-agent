class Player {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.width = options.width || 200;
        this.height = options.height || 200;
        this.virtualWidth = options.virtualWidth || 1024;
        this.virtualHeight = options.virtualHeight || 1024;
        this.x = (this.virtualWidth - this.width) / 2;
        this.y = this.virtualHeight - this.height - 20;
        this.speed = options.speed || 300;

        // Input state
        this.movingLeft = false;
        this.movingRight = false;
        this.isFiring = false;

        this.img = new Image();
        this.img.src = './sprites/player.png';
        
        this.setupInput();
        this.velocity = { x: 0, y: 0 };
    }

    setupInput() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowLeft') this.movingLeft = true;
            if(e.key === 'ArrowRight') this.movingRight = true;
            if(e.key === ' ') {
                this.isFiring = true;
                this.shoot(); 
            }
        });

        window.addEventListener('keyup', (e) => {
            if(e.key === 'ArrowLeft') this.movingLeft = false;
            if(e.key === 'ArrowRight') this.movingRight = false;
            if(e.key === ' ') this.isFiring = false;
        });

        // Touch
        window.addEventListener('touchstart', (e) => {
            const touchX = e.touches[0].clientX;
            const halfWidth = window.innerWidth / 2;
            
            if (touchX < halfWidth) {
                this.movingLeft = true;
                this.movingRight = false;
            } else {
                this.movingRight = true;
                this.movingLeft = false;
            }
            this.isFiring = true; 
        }, { passive: true });

        window.addEventListener('touchend', () => {
            this.movingLeft = false;
            this.movingRight = false;
            this.isFiring = false;
        });
    }

    handleInput(key) {
        if(key === 'ArrowLeft') this.movingLeft = true;
        if(key === 'ArrowRight') this.movingRight = true;
        if(key === ' ') this.isFiring = true;
    }

    // ИСПРАВЛЕННАЯ ЛОГИКА КОЛЛИЗИЙ (AABB Intersection)
    checkCollision(laser) {
        // Хитбокс игрока (сужаем его, чтобы не умирать от касания воздуха)
        const marginX = this.width * 0.25; // 25% отступа с боков
        const marginY = this.height * 0.25; // 25% отступа сверху/снизу
        
        const pLeft = this.x + marginX;
        const pRight = this.x + this.width - marginX;
        const pTop = this.y + marginY;
        const pBottom = this.y + this.height - marginY;

        // Хитбокс лазера
        const lLeft = laser.x;
        const lRight = laser.x + (laser.width || 4);
        const lTop = laser.y;
        const lBottom = laser.y + (laser.height || 16);

        // Проверка пересечения двух прямоугольников
        return (
            pLeft < lRight &&
            pRight > lLeft &&
            pTop < lBottom &&
            pBottom > lTop
        );
    }

    update(delta) {
        if (this.movingLeft) this.x -= this.speed * delta;
        if (this.movingRight) this.x += this.speed * delta;
        this.x = Math.max(0, Math.min(this.x, this.virtualWidth - this.width));
    }

    draw() {
        const ctx = this.ctx;
        if (this.img.complete) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    shoot() {}
}

export default Player;