class InputManager {
    constructor() {
        this.handlers = new Map();
        this.currentScreen = null;
        this.debugHandler = null;
        
        // Клавиатура
        window.addEventListener('keydown', (e) => this.handleInput(e.key));

        // Тач и Клик (превращаем в 'Enter' для меню)
        const touchHandler = (e) => {
            // Не блокируем стандартные тачи в игре (Player.js сам их ловит),
            // но для меню нам нужно событие
            if (this.currentScreen !== 'game') { 
                // В меню любой тач = Enter
                this.handleInput('Enter');
            }
        };

        window.addEventListener('touchstart', touchHandler, { passive: true });
        window.addEventListener('mousedown', touchHandler);
    }

    setCurrentScreen(screenName) {
        this.currentScreen = screenName;
    }

    registerScreen(screenName, handler) {
        this.handlers.set(screenName, handler);
    }

    setDebugHandler(callback) {
        this.debugHandler = callback;
    }

    handleInput(key) {
        // Debug toggle (только с клавиатуры 'd')
        if (key === 'd' || key === 'D') {
            if (this.debugHandler) {
                this.debugHandler();
            }
            return;
        }

        // Роутинг инпута в активный экран
        if (this.currentScreen && this.handlers.has(this.currentScreen)) {
            const handler = this.handlers.get(this.currentScreen);
            
            // Нормализуем ввод: пробел и клик считаем подтверждением
            let normalizedKey = key;
            if (key === ' ' || key === 'Spacebar') normalizedKey = 'Enter';

            const nextScreen = handler(normalizedKey);
            if (nextScreen) {
                return nextScreen;
            }
        }
    }
}

export default InputManager;