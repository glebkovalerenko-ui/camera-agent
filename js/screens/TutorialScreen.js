import { Strings } from '../utils/Localization.js';

class TutorialScreen {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.virtualWidth = options.virtualWidth;
        this.virtualHeight = options.virtualHeight;
        
        this.alpha = 0;
        this.fadeIn = true;
        this.timer = 0;
        this.blinkTimer = 0;
    }

    onPause() {}
    onResume() {}

    update(delta) {
        this.timer += delta;
        this.blinkTimer += delta;

        if (this.fadeIn) {
            this.alpha = Math.min(1, this.alpha + delta * 2);
            if (this.alpha >= 1) this.fadeIn = false;
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.virtualWidth;
        const h = this.virtualHeight;

        // Фон
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.strokeStyle = '#00ff00';
        ctx.fillStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';

        // --- ЗАГОЛОВОК ---
        ctx.font = '40px "Press Start 2P"';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 15;
        ctx.fillText(Strings.tutTitle, w / 2, h * 0.12);
        ctx.shadowBlur = 0;

        // === СЕКЦИЯ: DESKTOP ===
        ctx.font = '24px "Press Start 2P"';
        ctx.fillText(Strings.tutDesktop, w / 2, h * 0.22);

        // -- Ряд 1: Движение --
        const row1Y = h * 0.32;
        this.drawMouseIcon(ctx, w * 0.35, row1Y); // Мышь (движение)
        this.drawArrowKeys(ctx, w * 0.65, row1Y); // Стрелки
        
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText(Strings.tutMove, w / 2, row1Y + 50);

        // -- Ряд 2: Стрельба --
        const row2Y = h * 0.48;
        this.drawMouseClick(ctx, w * 0.35, row2Y); // ЛКМ
        this.drawSpacebar(ctx, w * 0.65, row2Y);   // Пробел

        ctx.font = '14px "Press Start 2P"';
        ctx.fillText(Strings.tutShoot, w / 2, row2Y + 30);

        // --- РАЗДЕЛИТЕЛЬНАЯ ЛИНИЯ ---
        ctx.beginPath();
        ctx.moveTo(w * 0.1, h * 0.60);
        ctx.lineTo(w * 0.9, h * 0.60);
        ctx.stroke();

        // === СЕКЦИЯ: MOBILE ===
        ctx.font = '24px "Press Start 2P"';
        ctx.fillText(Strings.tutMobile, w / 2, h * 0.68);

        // Иконка Свайпа
        const touchX = w / 2;
        const touchY = h * 0.78;
        this.drawSwipeIcon(ctx, touchX, touchY);

        // Подпись (Движение + Огонь)
        ctx.font = '14px "Press Start 2P"';
        ctx.fillText(`${Strings.tutMove} + ${Strings.tutShoot}`, w / 2, h * 0.88);

        // === ПРИЗЫВ К ДЕЙСТВИЮ (Мигающий) ===
        if (Math.floor(this.blinkTimer * 2) % 2 === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.font = '20px "Press Start 2P"';
            ctx.fillText(Strings.tutAction, w / 2, h * 0.96);
        }

        ctx.restore();
    }

    // --- ИКОНКИ ---

    // Мышь (Движение)
    drawMouseIcon(ctx, x, y) {
        ctx.beginPath();
        ctx.rect(x - 15, y - 25, 30, 50);
        ctx.moveTo(x - 15, y - 5);
        ctx.lineTo(x + 15, y - 5); // Линия кнопок
        ctx.moveTo(x, y - 25);
        ctx.lineTo(x, y - 5);      // Разделение кнопок
        ctx.stroke();
        
        // Стрелочка движения
        this.drawDoubleArrow(ctx, x, y + 35, 40);
    }

    // Мышь (Клик ЛКМ)
    drawMouseClick(ctx, x, y) {
        // Контур
        ctx.beginPath();
        ctx.rect(x - 15, y - 25, 30, 50);
        ctx.stroke();

        // Левая кнопка (Залитая)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.fillRect(x - 15, y - 25, 15, 20);
        
        // Линии
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 5);
        ctx.lineTo(x + 15, y - 5);
        ctx.moveTo(x, y - 25);
        ctx.lineTo(x, y - 5);
        ctx.stroke();

        // Текст LMB (опционально, но лучше иконкой)
    }

    // Пробел
    drawSpacebar(ctx, x, y) {
        const w = 120;
        const h = 30;
        
        ctx.strokeRect(x - w/2, y - h/2, w, h);
        
        // Эффект нажатия (тень внутри)
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fillRect(x - w/2 + 5, y - h/2 + 5, w - 10, h - 10);

        ctx.font = '12px "Press Start 2P"';
        ctx.fillStyle = '#00ff00';
        ctx.fillText(Strings.tutSpace, x, y + 5);
    }

    // Стрелки
    drawArrowKeys(ctx, x, y) {
        const size = 25;
        const gap = 5;
        
        // Up
        ctx.strokeRect(x - size/2, y - size - gap, size, size);
        // Left
        ctx.strokeRect(x - size/2 - size - gap, y, size, size);
        // Down
        ctx.strokeRect(x - size/2, y, size, size);
        // Right
        ctx.strokeRect(x - size/2 + size + gap, y, size, size);
    }

    // Свайп
    drawSwipeIcon(ctx, x, y) {
        // Палец
        ctx.beginPath();
        ctx.arc(x, y + 10, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.fill();
        ctx.stroke();

        this.drawDoubleArrow(ctx, x, y - 25, 80);
    }

    drawDoubleArrow(ctx, x, y, width = 40) {
        ctx.beginPath();
        ctx.moveTo(x - width/2, y);
        ctx.lineTo(x + width/2, y);
        // Левый
        ctx.moveTo(x - width/2 + 8, y - 8);
        ctx.lineTo(x - width/2, y);
        ctx.lineTo(x - width/2 + 8, y + 8);
        // Правый
        ctx.moveTo(x + width/2 - 8, y - 8);
        ctx.lineTo(x + width/2, y);
        ctx.lineTo(x + width/2 - 8, y + 8);
        ctx.stroke();
    }

    handleInput(key) {
        if (this.timer > 0.5 && (key === 'Enter' || key === ' ')) {
            return 'game';
        }
        return null;
    }
}

export default TutorialScreen;