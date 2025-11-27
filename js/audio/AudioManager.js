class AudioManager {
    static instance = null;

    static getInstance() {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    constructor() {
        if (AudioManager.instance) return AudioManager.instance;
        AudioManager.instance = this;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        
        this.masterGain = this.context.createGain();
        this.musicGain = this.context.createGain();
        this.fxGain = this.context.createGain();
        
        this.musicGain.connect(this.masterGain);
        this.fxGain.connect(this.masterGain);
        this.masterGain.connect(this.context.destination);
        
        this.sounds = new Map();
        this.music = new Map();

        this.masterVolume = 1.0;
        this.masterGain.gain.value = this.masterVolume;
        this.musicGain.gain.value = 0.8;
        this.fxGain.gain.value = 0.7;

        this.isInitialized = false;
        this.isMuted = false;
        this.hasSilentOscillator = false;
    }

    // Запускаем "тишину", чтобы браузер не блокировал контекст
    startSilentOscillator() {
        if (this.hasSilentOscillator) return;
        try {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            gain.gain.value = 0.001; // Минимальный сигнал
            oscillator.connect(gain);
            gain.connect(this.context.destination);
            oscillator.start();
            this.hasSilentOscillator = true;
        } catch (e) {}
    }

    // Вызывается один раз при старте игры по клику
    async resumeContext() {
        if (this.context.state === 'suspended' || this.context.state === 'interrupted') {
            try {
                await this.context.resume();
            } catch (e) {
                console.warn('Context resume failed', e);
            }
        }
        if (this.context.state === 'running') {
            this.startSilentOscillator();
        }
    }

    // === ИСПРАВЛЕНИЕ: Только громкость, никакого suspend ===
    mute() {
        if (this.isMuted) return;
        // Мгновенно убираем громкость в 0
        this.masterGain.gain.setValueAtTime(0, this.context.currentTime);
        this.isMuted = true;
        // УБРАНО: this.context.suspend(); 
        // Мы держим контекст "горячим"
    }

    unmute() {
        if (!this.isMuted) return;
        // УБРАНО: this.context.resume();
        
        // Восстанавливаем громкость
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        this.isMuted = false;
        
        // На всякий случай проверяем статус
        if (this.context.state !== 'running') {
            this.context.resume().catch(() => {});
        }
    }
    // =======================================================

    createAudioNodes(source, config = {}) {
        const gainNode = this.context.createGain();
        const panNode = this.context.createStereoPanner();
        
        gainNode.gain.value = config.volume ?? 1;
        panNode.pan.value = config.pan ?? 0;

        source.connect(panNode);
        panNode.connect(gainNode);
        gainNode.connect(this.fxGain);

        if (config.pitch !== undefined) {
            source.playbackRate.value = config.pitch;
        }

        if (config.decay > 0) {
            const startTime = this.context.currentTime;
            gainNode.gain.setValueAtTime(config.volume ?? 1, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + config.decay);
        }

        return { gainNode, panNode };
    }

    async loadSound(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.sounds.set(key, audioBuffer);
        } catch (e) {
            console.warn(`SFX Error: ${key}`, e);
        }
    }

    async loadMusic(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.music.set(key, audioBuffer);
        } catch (e) {
            console.warn(`Music Error: ${key}`, e);
        }
    }

    async preloadGameSounds() {
        const sfxPromises = [
            this.loadSound('explosion', './audio/explosion.mp3'),
            this.loadSound('laser', './audio/player-shoot.mp3'),
            this.loadSound('alien-laser', './audio/alien-shoot.mp3')
        ];
        
        const musicPromises = [
            this.loadMusic('menu_theme', './audio/xeno-war.mp3'),
            this.loadMusic('game_track_0', './audio/music/game1.mp3'),
            this.loadMusic('game_track_1', './audio/music/game2.mp3')
        ];

        await Promise.all([...sfxPromises, ...musicPromises]);
        this.isInitialized = true;
    }

    getMusicBuffer(key) {
        return this.music.get(key);
    }

    playSound(key, config = {}) {
        if (this.isMuted) return null;
        const buffer = this.sounds.get(key);
        if (!buffer) return null;

        try {
            const source = this.context.createBufferSource();
            source.buffer = buffer;
            const nodes = this.createAudioNodes(source, config);
            source.start(0);
            return { source, ...nodes };
        } catch (e) {
            return null;
        }
    }
}

export default AudioManager;