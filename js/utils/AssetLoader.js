class AssetLoader {
    // Статическое хранилище для всех загруженных картинок
    static cache = new Map();

    /**
     * Загружает массив URL-адресов.
     * Возвращает Promise, который выполнится, когда ВСЕ картинки будут загружены.
     * @param {string[]} urls - Массив путей к изображениям
     */
    static async loadAll(urls) {
        const promises = urls.map(url => this.loadImage(url));
        await Promise.all(promises);
    }

    /**
     * Загружает одно изображение и сохраняет его в кэш.
     * @param {string} url 
     */
    static loadImage(url) {
        // Если уже загружено - возвращаем сразу
        if (this.cache.has(url)) {
            return Promise.resolve(this.cache.get(url));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.cache.set(url, img);
                resolve(img);
            };

            img.onerror = (e) => {
                console.error(`[AssetLoader] Failed to load: ${url}`, e);
                // Важно: мы делаем resolve, а не reject, чтобы одна битая картинка
                // не сломала загрузку всей игры (Promise.all).
                // Просто вернем "битый" объект image, он не нарисуется, но игра запустится.
                this.cache.set(url, img); 
                resolve(img);
            };

            img.src = url;
        });
    }

    /**
     * Получает уже загруженное изображение из кэша.
     * Синхронный метод для использования в draw() или конструкторах.
     * @param {string} url 
     */
    static get(url) {
        const img = this.cache.get(url);
        if (!img) {
            console.warn(`[AssetLoader] Image not found in cache: ${url}. Did you preload it?`);
            // Возвращаем пустую картинку, чтобы не падал код при попытке доступа к .width
            return new Image(); 
        }
        return img;
    }
}

export default AssetLoader;