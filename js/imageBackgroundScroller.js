import AssetLoader from './utils/AssetLoader.js';
import { assets } from './config/assetManifest.js';

class ImageBackgroundScroller {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.virtualWidth = options.virtualWidth || 1080;
        this.virtualHeight = options.virtualHeight || 1080;
        this.scrollSpeed = options.scrollSpeed || 100;

        // 1. Получаем сырые картинки
        const rawImages = assets.backgrounds.map(path => AssetLoader.get(path));

        // 2. ИЗМЕНЕНИЕ: Обрабатываем их, добавляя "черную туманность" на края
        // Теперь this.images хранит не Image, а Canvas элементы, но drawImage умеет их рисовать
        this.images = rawImages.map(img => this.processImageWithGradient(img));

        this.currentImageIndex = 0;
        this.nextImageIndex = 1;
        this.position1 = 0;
        this.position2 = -this.virtualHeight;
        this.transitionPoint = this.virtualHeight;

        this.position1Flipped = false;
        this.position2Flipped = true;

        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = 20;
        this.tempCanvas.height = 20;
        this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true });

        this.lastColorSample = { x: null, y: null, color: null, time: 0 };
    }

    /**
     * Создает копию изображения с наложенными черными градиентами сверху и снизу
     */
    processImageWithGradient(img) {
        // Защита: если картинка битая или не загрузилась, возвращаем как есть
        if (!img.complete || img.naturalWidth === 0) return img;

        // Создаем оффскрин-канвас размером с наш виртуальный экран
        const canvas = document.createElement('canvas');
        canvas.width = this.virtualWidth;
        canvas.height = this.virtualHeight;
        const ctx = canvas.getContext('2d');

        // 1. Рисуем оригинальную картинку, растягивая на весь размер
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Настройки градиента (высота полоски затемнения)
        const gradientHeight = canvas.height * 0.15; // 15% от высоты экрана (примерно 150px)

        // 2. Верхний градиент (Черный -> Прозрачный)
        const topGrad = ctx.createLinearGradient(0, 0, 0, gradientHeight);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');   // Абсолютно черный в самом верху
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');   // Прозрачный к центру
        
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, canvas.width, gradientHeight);

        // 3. Нижний градиент (Прозрачный -> Черный)
        const bottomGrad = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
        bottomGrad.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Прозрачный от центра
        bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 1)'); // Абсолютно черный в самом низу
        
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

        // Возвращаем этот канвас как новую "картинку"
        return canvas;
    }
    
    update(delta) {
        this.position1 += this.scrollSpeed * delta;
        this.position2 += this.scrollSpeed * delta;
        
        if (this.position1 >= this.transitionPoint) {
            this.position1 = this.position2 - this.virtualHeight;
            this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
        }
        
        if (this.position2 >= this.transitionPoint) {
            this.position2 = this.position1 - this.virtualHeight;
            this.nextImageIndex = (this.nextImageIndex + 1) % this.images.length;
        }
    }
    
    draw() {
        // Мы используем canvas как источник, у него нет св-ва complete, 
        // но оно есть если processImageWithGradient вернул сырую картинку (при ошибке).
        // Проверка width > 0 универсальна.
        const curr = this.images[this.currentImageIndex];
        const next = this.images[this.nextImageIndex];

        if (!curr || !next || curr.width === 0 || next.width === 0) return;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, this.virtualWidth, this.virtualHeight);
        this.ctx.clip();
        
        this.ctx.save();
        if (this.position1Flipped) {
            this.ctx.scale(1, -1);
            this.ctx.drawImage(
                curr,
                0, -this.position1 - this.virtualHeight,
                this.virtualWidth, this.virtualHeight
            );
        } else {
            this.ctx.drawImage(
                curr,
                0, this.position1,
                this.virtualWidth, this.virtualHeight
            );
        }
        this.ctx.restore();
        
        this.ctx.save();
        if (this.position2Flipped) {
            this.ctx.scale(1, -1);
            this.ctx.drawImage(
                next,
                0, -this.position2 - this.virtualHeight,
                this.virtualWidth, this.virtualHeight
            );
        } else {
            this.ctx.drawImage(
                next,
                0, this.position2,
                this.virtualWidth, this.virtualHeight
            );
        }
        this.ctx.restore();
        
        this.ctx.restore();
    }

    getColorAt(x, y) {
        const now = performance.now();
        if (
            this.lastColorSample.x === x &&
            this.lastColorSample.y === y &&
            now - this.lastColorSample.time < 100
        ) {
            return this.lastColorSample.color;
        }
        
        const tempCtx = this.tempCtx;
        tempCtx.clearRect(0, 0, 20, 20);
        
        // ВАЖНО: activeImg теперь может быть Canvas, а не Image.
        // drawImage умеет работать и с тем, и с другим, так что код ниже валиден.
        const activeImg = this.images[this.currentImageIndex];
        
        // Проверка на валидность источника
        if (!activeImg || activeImg.width === 0) return { r: 0, g: 0, b: 0 };

        const activePos = this.currentImageIndex === 0 ? this.position1 : this.position2;
        
        try {
            tempCtx.drawImage(
                activeImg,
                x - 10, y - 10 - activePos, 20, 20,
                0, 0, 20, 20
            );
            
            const data = tempCtx.getImageData(0, 0, 20, 20).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 4) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
            const color = {
                r: r / count,
                g: g / count,
                b: b / count
            };
            this.lastColorSample = { x, y, color, time: now };
            return color;
        } catch(e) {
            // Защита от ошибок при выходе за границы source image
            return { r: 0, g: 0, b: 0 };
        }
    }
}

export default ImageBackgroundScroller;