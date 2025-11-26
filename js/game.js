import Player from './player.js';
import { ParticleEngine, LaserEngine } from './particleEngine.js';
import ImageBackgroundScroller from './imageBackgroundScroller.js';
import PatternFormation from './PatternFormation.js';
import IntroScreen from './screens/IntroScreen.js';
import MusicPlayer from './audio/MusicPlayer.js';
import StartupScreen from './screens/StartupScreen.js';
import DebugWindow from './DebugWindow.js';
import CanvasManager from './CanvasManager.js';
import InputManager from './InputManager.js';
import HUDManager from './managers/HUDManager.js';
import GameStateManager from './managers/GameStateManager.js';
import GameScreen from './screens/GameScreen.js';
import CRTEffect from './effects/CRTEffect.js';
import AudioManager from './audio/AudioManager.js';
import { Strings } from './utils/Localization.js';

class Game {
    constructor() {
        this.audioManager = AudioManager.getInstance();
        document.title = Strings.gameTitle;
        
        this.audioManager.preloadGameSounds().then(() => {
            console.log('Audio manager initialization complete');
        }).catch(error => {
            console.error('Failed to initialize audio:', error);
        });

        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.display = 'flex';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.style.background = '#000';
        document.body.appendChild(this.container);

        this.virtualWidth = 1024;
        this.virtualHeight = 1024;
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) throw new Error('Canvas not found');
        this.canvas.width = this.virtualWidth;
        this.canvas.height = this.virtualHeight;
        this.canvas.style.display = 'none';

        // --- PREVENT SCROLL/ZOOM ON CANVAS ---
        // Используем passive: false, чтобы preventDefault работал
        const preventDefault = (e) => e.preventDefault();
        this.canvas.addEventListener('touchstart', preventDefault, { passive: false });
        this.canvas.addEventListener('touchmove', preventDefault, { passive: false });
        this.canvas.addEventListener('touchend', preventDefault, { passive: false });

        this.canvasManager = new CanvasManager(this.canvas);
        this.ctx = this.canvasManager.getContext();
        this.crtEffect = new CRTEffect(this.canvas, this.container);
        this.inputManager = new InputManager();
        this.gameState = new GameStateManager();
        this.hudManager = new HUDManager(this.ctx, this.virtualWidth, this.virtualHeight);

        window.game = this;

        window.dispatchEvent(new Event('resize'));
        
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.viewportWidth = 1024;
        this.checkerSize = 64;
        this.lastTime = 0;
        
        this.bgScroller = new ImageBackgroundScroller(this.ctx, {
            virtualWidth: this.virtualWidth,
            virtualHeight: this.virtualHeight,
            viewportWidth: this.viewportWidth,
            checkerSize: this.checkerSize,
            scrollSpeed: 100,
            offsetY: this.offsetY
        });

        this.screens = {
            intro: new IntroScreen(this.ctx, {
                virtualWidth: this.virtualWidth,
                virtualHeight: this.virtualHeight,
                bgScroller: this.bgScroller
            }),
            game: new GameScreen(this.ctx, {
                virtualWidth: this.virtualWidth,
                virtualHeight: this.virtualHeight,
                bgScroller: this.bgScroller,
                gameState: this.gameState,
                audioManager: this.audioManager
            })
        };
        
        this.currentScreen = 'intro';
        
        this.inputManager.setDebugHandler(() => {
            this.debugWindow.visible = !this.debugWindow.visible;
        });

        Object.entries(this.screens).forEach(([name, screen]) => {
            if (screen && screen.handleInput) {
                this.inputManager.registerScreen(name, (key) => {
                    const nextScreen = screen.handleInput(key);
                    if (nextScreen) {
                        this.switchScreen(nextScreen);
                    }
                    return nextScreen;
                });
            }
        });

        this.inputManager.setCurrentScreen('intro');
        this.musicPlayer = new MusicPlayer();
        this.offCanvasCache = document.createElement('canvas');
        this.debugWindow = new DebugWindow();
        this.gameReadySent = false;
        this.isPaused = false;

        this.startGameLoop();

        // --- PAUSE LOGIC ---
        const handleVisibilityChange = () => {
            if (document.hidden) {
                this.onPause();
            } else {
                this.onResume();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', () => this.onPause());
        window.addEventListener('focus', () => this.onResume());
    }

    onPause() {
        if (this.isPaused) return; // Уже на паузе
        console.log('Game Paused');
        this.isPaused = true;
        
        // 1. Глушим глобальный аудио контекст (SFX)
        if (this.audioManager && this.audioManager.context) {
            this.audioManager.context.suspend();
        }

        // 2. Сообщаем текущему экрану о паузе (для Intro музыки)
        if (this.screens[this.currentScreen] && this.screens[this.currentScreen].onPause) {
            this.screens[this.currentScreen].onPause();
        }
    }

    onResume() {
        if (!this.isPaused) return; // Уже работает
        console.log('Game Resumed');
        this.isPaused = false;
        
        // 1. Восстанавливаем контекст
        if (this.audioManager && this.audioManager.context) {
            this.audioManager.context.resume();
        }

        // 2. Сообщаем экрану
        if (this.screens[this.currentScreen] && this.screens[this.currentScreen].onResume) {
            this.screens[this.currentScreen].onResume();
        }
    }

    resize() {
        const minDimension = Math.min(window.innerWidth, window.innerHeight) - 40;
        const scale = minDimension / 1024;
        if (this.crtEffect) {
            this.crtEffect.setScale(scale);
        }
    }

    gameOver() {
        if (window.showAd) window.showAd();

        this.screens.intro = new IntroScreen(this.ctx, {
            virtualWidth: this.virtualWidth,
            virtualHeight: this.virtualHeight,
            bgScroller: this.bgScroller,
            isGameOver: true,
            finalScore: this.gameState.score,
            highScore: this.gameState.highScore
        });
        
        this.switchScreen('intro');
    }

    switchScreen(screenName) {
        if (this.screens[this.currentScreen]?.cleanup) {
            this.screens[this.currentScreen].cleanup();
        }

        if (screenName === 'intro') {
            if (this.musicPlayer) {
                this.musicPlayer.stop();
            }
        }

        if (screenName === 'game') {
            this.screens.game = new GameScreen(this.ctx, {
                virtualWidth: this.virtualWidth,
                virtualHeight: this.virtualHeight,
                bgScroller: this.bgScroller,
                gameState: this.gameState,
                audioManager: this.audioManager
            });

            if (this.musicPlayer) {
                this.musicPlayer.playTrack(0);
            }
        }

        this.currentScreen = screenName;
        this.inputManager.setCurrentScreen(screenName);
    }

    update(timestamp) {
        const delta = (timestamp - (this.lastTime || timestamp)) / 1000;
        this.lastTime = timestamp;
        
        this.gameState.update(delta);
        this.screens[this.currentScreen]?.update(delta);
        
        if(this.debugWindow.visible) {
            this.debugWindow.update(delta);
        }
    }

    draw() {
        this.canvasManager.clearScreen();
        this.screens[this.currentScreen]?.draw();
        
        if (this.currentScreen === 'game') {
            this.hudManager.draw(
                this.gameState.lives,
                this.gameState.score,
                this.gameState.highScore
            );
        }
        
        if(this.debugWindow.visible) {
            this.debugWindow.draw(this.ctx);
        }

        this.crtEffect.render(performance.now());

        if (!this.gameReadySent) {
            if (window.ysdk && window.ysdk.features && window.ysdk.features.LoadingAPI) {
                window.ysdk.features.LoadingAPI.ready();
                console.log('Yandex Game Ready sent (First Frame)');
            }
            this.gameReadySent = true;
        }
    }

    startGameLoop() {
        const loop = (timestamp) => {
            if (!this.isPaused) {
                this.update(timestamp);
                this.draw();
            }
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

window.onload = () => {
    new Game();
};