class GameStateManager {
    constructor() {
        this.reset();
        // 1. Сразу берем данные из локального хранилища (Мгновенно)
        // Это гарантирует, что у игрока есть прогресс даже в оффлайне
        this.highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
        
        // Ссылка на игрока Yandex SDK
        this.ysdkPlayer = null;
    }

    /**
     * Инициализация облака. Вызывается из game.js
     * Используем { scopes: false }, чтобы НЕ вызывать окно логина принудительно.
     */
    async initCloudSave(ysdk) {
        if (!ysdk) return;
        if (this.ysdkPlayer) return; // Защита от двойной инициализации

        try {
            // Получаем объект игрока. Если не авторизован - вернет гостя
            const player = await ysdk.getPlayer({ scopes: false });
            this.ysdkPlayer = player;

            // Загружаем данные из облака
            const data = await player.getData(['highScore']);
            const cloudScore = data.highScore || 0;

            console.log(`Cloud Sync: Local=${this.highScore}, Cloud=${cloudScore}`);

            // Решаем конфликт: побеждает лучший счет
            if (cloudScore > this.highScore) {
                // В облаке больше -> обновляем локалку
                this.highScore = cloudScore;
                localStorage.setItem('highScore', this.highScore.toString());
            } else if (this.highScore > cloudScore) {
                // В локалке больше -> пушим в облако
                this.saveToCloud();
            }
        } catch (e) {
            // ВАЖНО: Мы просто логируем ошибку, но не выбрасываем её выше.
            // Это позволяет игре продолжить работу с локальными данными (localStorage),
            // которые мы загрузили в конструкторе.
            console.warn('Cloud save init failed (User might be guest or offline). Using local data.', e);
        }
    }

    /**
     * Отправка данных в облако Yandex
     */
    saveToCloud() {
        if (this.ysdkPlayer) {
            this.ysdkPlayer.setData({ 
                highScore: this.highScore 
            }).then(() => {
                // Успешное сохранение (тихое)
            }).catch((e) => {
                console.warn('Failed to save to cloud (network error?):', e);
            });
        }
    }

    addPoints(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            // Сохраняем локально (синхронно/быстро)
            localStorage.setItem('highScore', this.highScore.toString());
            // Сохраняем в облако (асинхронно/фоном)
            this.saveToCloud();
        }
    }

    handlePlayerHit() {
        // Если уже мертв, не отнимаем дальше (защита от -1, -2)
        if (this.lives <= 0) return true;

        if (!this.playerInvulnerable) {
            this.lives--;
            this.playerHit = true;
            this.playerInvulnerable = true;
            
            // Жесткое ограничение, чтобы в HUD не было "-1"
            if (this.lives < 0) this.lives = 0;

            return this.lives <= 0;
        }
        return false;
    }

    update(delta) {
        if (this.playerInvulnerable) {
            this.invulnerabilityTimer += delta;
            if (this.invulnerabilityTimer >= 2.0) {
                this.playerInvulnerable = false;
                this.invulnerabilityTimer = 0;
                this.playerHit = false;
            }
        }
    }

    reset() {
        this.score = 0;
        this.lives = 3;
        this.playerHit = false;
        this.playerInvulnerable = false;
        this.invulnerabilityTimer = 0;
    }
}

export default GameStateManager;