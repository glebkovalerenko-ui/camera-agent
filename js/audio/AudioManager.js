import { assets } from '../config/assetManifest.js'; // 1. Импортируем манифест

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

    startSilentOscillator() {
        if (this.hasSilentOscillator) return;
        try {
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            gain.gain.value = 0.001; 
            oscillator.connect(gain);
            gain.connect(this.context.destination);
            oscillator.start();
            this.hasSilentOscillator = true;
        } catch (e) {}
    }

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

    mute() {
        if (this.isMuted) return;
        this.masterGain.gain.setValueAtTime(0, this.context.currentTime);
        this.isMuted = true;
    }

    unmute() {
        if (!this.isMuted) return;
        this.masterGain.gain.setValueAtTime(this.masterVolume, this.context.currentTime);
        this.isMuted = false;
        
        if (this.context.state !== 'running') {
            this.context.resume().catch(() => {});
        }
    }

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
            console.warn(`SFX Error: ${key} (${url})`, e);
        }
    }

    async loadMusic(key, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.music.set(key, audioBuffer);
        } catch (e) {
            console.warn(`Music Error: ${key} (${url})`, e);
        }
    }

    // --- ИЗМЕНЕНИЕ: Динамическая загрузка из манифеста ---
    async preloadGameSounds() {
        const promises = [];

        // 1. Загрузка SFX
        if (assets.audio.sfx) {
            for (const [key, path] of Object.entries(assets.audio.sfx)) {
                promises.push(this.loadSound(key, path));
            }
        }

        // 2. Загрузка Музыки
        if (assets.audio.music) {
            for (const [key, value] of Object.entries(assets.audio.music)) {
                if (Array.isArray(value)) {
                    // Если это массив треков (как для game music)
                    value.forEach((path, index) => {
                        // Создаем ключи game_track_0, game_track_1 и т.д.
                        // В MusicPlayer.js нужно убедиться, что он использует эти ключи
                        // (По умолчанию в твоем коде он использует 'game_track_0', так что тут надо подстроиться)
                        
                        // ВАЖНО: Твой MusicPlayer ожидает ключи 'game_track_0', 'game_track_1'.
                        // В манифесте у нас ключ 'game'. 
                        // Поэтому делаем маппинг:
                        if (key === 'game') {
                            promises.push(this.loadMusic(`game_track_${index}`, path));
                        } else if (key === 'menu') {
                            // MusicPlayer ждет 'menu_theme'
                            promises.push(this.loadMusic('menu_theme', path)); // Переименовываем для совместимости
                        } else {
                            promises.push(this.loadMusic(key, path));
                        }
                    });
                } else {
                    // Одиночный файл
                    if (key === 'menu') {
                         promises.push(this.loadMusic('menu_theme', value));
                    } else {
                         promises.push(this.loadMusic(key, value));
                    }
                }
            }
        }

        await Promise.all(promises);
        this.isInitialized = true;
        console.log(`Audio loaded: ${this.sounds.size} SFX, ${this.music.size} Tracks`);
    }

    getMusicBuffer(key) {
        return this.music.get(key);
    }

    playSound(key, config = {}) {
        if (this.isMuted) return null;
        const buffer = this.sounds.get(key);
        
        // Полезная отладка, если звука нет (можно потом удалить)
        // if (!buffer) console.warn(`Sound missing: ${key}`);
        
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