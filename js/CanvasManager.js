class CanvasManager {
    constructor(canvas) {
        this.canvas = canvas;
        if (!this.canvas) throw new Error('Canvas element required');

        // ЖЕСТКАЯ ФИКСАЦИЯ БУФЕРА
        // Мы никогда не меняем эти значения в процессе игры
        this.virtualWidth = 1024;
        this.virtualHeight = 1024;
        
        this.canvas.width = this.virtualWidth;
        this.canvas.height = this.virtualHeight;
        
        this.ctx = this.canvas.getContext('2d');
        // Отключаем сглаживание для пиксель-арта
        this.ctx.imageSmoothingEnabled = false;
    }

    clearScreen() {
        // Очищаем буфер перед кадром
        this.ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);
        // Заливаем черным (важно для CRT, чтобы не было прозрачных дыр)
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    setupCanvas() {
        this.resize();
    }
    
    // Метод теперь управляет ТОЛЬКО стилями CSS
    resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Считаем масштаб с сохранением пропорций (Letterboxing)
        const targetAspect = this.virtualWidth / this.virtualHeight;
        const windowAspect = windowWidth / windowHeight;
        
        let finalWidth, finalHeight;
        
        if (windowAspect < targetAspect) {
            // Упираемся в ширину
            finalWidth = windowWidth;
            finalHeight = windowWidth / targetAspect;
        } else {
            // Упираемся в высоту
            finalHeight = windowHeight;
            finalWidth = finalHeight * targetAspect;
        }

        // Центрирование
        const left = (windowWidth - finalWidth) / 2;
        const top = (windowHeight - finalHeight) / 2;

        // Применяем стили
        this.canvas.style.width = `${finalWidth}px`;
        this.canvas.style.height = `${finalHeight}px`;
        this.canvas.style.left = `${left}px`;
        this.canvas.style.top = `${top}px`;
        this.canvas.style.position = 'absolute';
        
        return { width: finalWidth, height: finalHeight, left, top };
    }

    getContext() {
        return this.ctx;
    }
}

export default CanvasManager;