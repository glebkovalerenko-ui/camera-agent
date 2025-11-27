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

        // Флаги ввода
        this.movingLeft = false;
        this.movingRight = false;
        this.isFiring = false;

        // Переменные для Тача (Relative)
        this.isDragging = false;
        this.touchStartX = 0;
        this.playerStartX = 0;

        // Переменная, чтобы не конфликтовать с мышью при таче
        this.lastInputType = 'keyboard'; // 'keyboard', 'mouse', 'touch'

        this.img = new Image();
        this.img.src = './sprites/player.png';
        
        this.setupInput();
        this.velocity = { x: 0, y: 0 };
    }

    setupInput() {
        const canvas = this.ctx.canvas;

        // ==========================================
        // 1. КЛАВИАТУРА
        // ==========================================
        window.addEventListener('keydown', (e) => {
            this.lastInputType = 'keyboard';
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

        // ==========================================
        // 2. МЫШЬ (ПК) - Абсолютное позиционирование
        // ==========================================
        window.addEventListener('mousemove', (e) => {
            if (this.lastInputType === 'touch') return; // Игнорируем эмуляцию мыши от тача
            this.lastInputType = 'mouse';

            const rect = canvas.getBoundingClientRect();
            
            // Если курсор вне игры - не двигаем
            if (e.clientX < rect.left || e.clientX > rect.right || 
                e.clientY < rect.top || e.clientY > rect.bottom) {
                return;
            }

            // Масштабирование
            const scaleX = this.virtualWidth / rect.width;
            
            // Координата мыши внутри канваса
            const mouseX = (e.clientX - rect.left) * scaleX;

            // Ставим центр корабля под курсор
            this.x = mouseX - (this.width / 2);

            // Ограничение экраном
            this.x = Math.max(0, Math.min(this.x, this.virtualWidth - this.width));
        });

        window.addEventListener('mousedown', (e) => {
            if (this.lastInputType === 'touch') return;
            // ЛКМ = Стрельба
            if (e.button === 0) {
                this.isFiring = true;
                this.shoot();
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.lastInputType === 'touch') return;
            this.isFiring = false;
        });

        // ==========================================
        // 3. ТАЧСКРИН (Мобилки) - Относительное движение
        // ==========================================
        canvas.addEventListener('touchstart', (e) => {
            this.lastInputType = 'touch';
            const touch = e.touches[0];
            
            this.touchStartX = touch.clientX;
            this.playerStartX = this.x;
            
            this.isDragging = true;
            this.isFiring = true; 
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            
            const touch = e.touches[0];
            const screenDelta = touch.clientX - this.touchStartX;
            const rect = canvas.getBoundingClientRect();
            const scaleRatio = this.virtualWidth / rect.width;
            const gameDelta = screenDelta * scaleRatio;

            this.x = this.playerStartX + gameDelta;
            this.x = Math.max(0, Math.min(this.x, this.virtualWidth - this.width));
            
        }, { passive: false });

        window.addEventListener('touchend', () => {
            this.isDragging = false;
            this.isFiring = false;
            this.movingLeft = false;
            this.movingRight = false;
        });
    }

    handleInput(key) {
        if(key === 'ArrowLeft') this.movingLeft = true;
        if(key === 'ArrowRight') this.movingRight = true;
        if(key === ' ') this.isFiring = true;
    }

    checkCollision(laser) {
        const marginX = this.width * 0.25;
        const marginY = this.height * 0.25;
        
        const pLeft = this.x + marginX;
        const pRight = this.x + this.width - marginX;
        const pTop = this.y + marginY;
        const pBottom = this.y + this.height - marginY;

        const lLeft = laser.x;
        const lRight = laser.x + (laser.width || 4);
        const lTop = laser.y;
        const lBottom = laser.y + (laser.height || 16);

        return (
            pLeft < lRight &&
            pRight > lLeft &&
            pTop < lBottom &&
            pBottom > lTop
        );
    }

    update(delta) {
        // Обновляем позицию по клавиатуре ТОЛЬКО если сейчас не используется мышь или тач
        if (this.lastInputType === 'keyboard') {
            if (this.movingLeft) this.x -= this.speed * delta;
            if (this.movingRight) this.x += this.speed * delta;
            this.x = Math.max(0, Math.min(this.x, this.virtualWidth - this.width));
        }
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