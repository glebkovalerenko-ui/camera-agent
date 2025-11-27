import AudioManager from './AudioManager.js';

class MusicPlayer {
    constructor() {
        this.gameTrackKeys = ['game_track_0', 'game_track_1'];
        this.menuTrackKey = 'menu_theme';

        this.audioManager = AudioManager.getInstance();
        this.audioContext = this.audioManager.context;
        
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioManager.musicGain);
        this.gainNode.gain.value = 0.6;

        this.currentSource = null;
        
        // Состояние ИГРОВОЙ музыки
        this.gameTrackIndex = 0;
        this.gameCursor = 0; // Сохраненная позиция (сек)
        
        // Служебные
        this.lastStartTime = 0;
        this.isPlaying = false;
        this.currentMode = 'none'; // 'menu', 'game', 'none'

        this.shuffleGameTracks();
    }

    shuffleGameTracks() {
        for (let i = this.gameTrackKeys.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.gameTrackKeys[i], this.gameTrackKeys[j]] = [this.gameTrackKeys[j], this.gameTrackKeys[i]];
        }
    }

    stopCurrent() {
        if (this.currentSource) {
            this.currentSource.onended = null; // Важно: убиваем старые колбэки
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch(e) {}
            this.currentSource = null;
        }
        this.isPlaying = false;
    }

    // --- МЕНЮ (Геймовер / Интро) ---
    playMenuMusic() {
        // Если мы переключаемся ИЗ игры В меню -> сохраняем прогресс игры
        if (this.currentMode === 'game' && this.isPlaying) {
            const elapsed = this.audioContext.currentTime - this.lastStartTime;
            this.gameCursor += elapsed;
            console.log(`MusicPlayer: Paused game music at ${this.gameCursor.toFixed(2)}s`);
        }

        // Переключаем режим
        this.currentMode = 'menu';
        this.stopCurrent();

        const buffer = this.audioManager.getMusicBuffer(this.menuTrackKey);
        if (!buffer) return;

        this.playBuffer(buffer, 0, true);
        console.log('MusicPlayer: Playing Menu Theme');
    }

    // --- ИГРА ---
    playGameMusic() {
        // Если мы уже играем игру, ничего не делаем (защита от двойного запуска)
        if (this.currentMode === 'game' && this.isPlaying) return;

        this.currentMode = 'game';
        this.stopCurrent();

        const key = this.gameTrackKeys[this.gameTrackIndex];
        const buffer = this.audioManager.getMusicBuffer(key);
        
        if (!buffer) return;

        // Если сохраненное время больше длины трека, переходим к следующему
        if (this.gameCursor >= buffer.duration) {
            this.gameCursor = 0;
            this.gameTrackIndex = (this.gameTrackIndex + 1) % this.gameTrackKeys.length;
            this.playGameMusic(); // Рекурсия для следующего трека
            return;
        }

        console.log(`MusicPlayer: Resuming Game Track ${this.gameTrackIndex} at ${this.gameCursor.toFixed(2)}s`);
        
        this.playBuffer(buffer, this.gameCursor, false, () => {
            // Трек кончился сам
            this.gameCursor = 0;
            this.gameTrackIndex = (this.gameTrackIndex + 1) % this.gameTrackKeys.length;
            
            // Запускаем следующий, ТОЛЬКО если мы все еще в режиме игры
            if (this.currentMode === 'game') {
                this.playGameMusic();
            }
        });
    }

    playBuffer(buffer, startTimeOffset, loop, onEndedCallback = null) {
        this.currentSource = this.audioContext.createBufferSource();
        this.currentSource.buffer = buffer;
        this.currentSource.loop = loop;
        this.currentSource.connect(this.gainNode);

        this.currentSource.onended = () => {
            if (onEndedCallback) onEndedCallback();
        };

        const safeOffset = startTimeOffset % buffer.duration;
        this.currentSource.start(0, safeOffset);
        
        this.lastStartTime = this.audioContext.currentTime;
        this.isPlaying = true;
    }

    stop() {
        // Вызывается при сворачивании вкладки (Pause)
        if (this.currentMode === 'game' && this.isPlaying) {
            const elapsed = this.audioContext.currentTime - this.lastStartTime;
            this.gameCursor += elapsed;
        }
        this.stopCurrent();
        console.log('MusicPlayer: Stopped (System Pause)');
    }
    
    resume() {
        // Вызывается при разворачивании (Resume)
        if (this.currentMode === 'game') this.playGameMusic();
        else if (this.currentMode === 'menu') this.playMenuMusic();
    }
}

export default MusicPlayer;