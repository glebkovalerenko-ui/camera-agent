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
        console.log('Game System Booting...');
        this.audioManager = AudioManager.getInstance();
        document.title = Strings.gameTitle;
        
        this.audioManager.preloadGameSounds().catch(e => console.warn(e));

        this.container = document.createElement('div');
        this.container.style.cssText = 'position:fixed;width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:#000;overflow:hidden;';
        document.body.appendChild(this.container);

        this.virtualWidth = 1024;
        this.virtualHeight = 1024;
        
        this.canvas = document.getElementById('gameCanvas');
        this.canvas.style.opacity = '0'; 
        this.container.appendChild(this.canvas);

        ['touchstart', 'touchmove', 'touchend'].forEach(evt => {
            this.canvas.addEventListener(evt, (e) => e.preventDefault(), { passive: false });
        });

        this.canvasManager = new CanvasManager(this.canvas);
        this.ctx = this.canvasManager.getContext();

        try {
            this.crtEffect = new CRTEffect(this.canvas, this.container);
        } catch (e) {
            console.warn("CRT Shader disabled", e);
            this.canvas.style.opacity = '1';
            this.crtEffect = null;
        }

        this.inputManager = new InputManager();
        this.gameState = new GameStateManager();
        this.hudManager = new HUDManager(this.ctx, this.virtualWidth, this.virtualHeight);
        
        window.game = this;
        
        this.bgScroller = new ImageBackgroundScroller(this.ctx, {
            virtualWidth: this.virtualWidth,
            virtualHeight: this.virtualHeight,
            scrollSpeed: 100
        });

        this.screens = {
            startup: new StartupScreen(this.ctx, {
                virtualWidth: this.virtualWidth,
                virtualHeight: this.virtualHeight
            }),
            intro: new IntroScreen(this.ctx, {
                virtualWidth: this.virtualWidth,
                virtualHeight: this.virtualHeight,
                bgScroller: this.bgScroller
            }),
            game: null 
        };

        this.currentScreen = 'startup';
        this.inputManager.setCurrentScreen('startup');
        
        Object.entries(this.screens).forEach(([name, screen]) => {
            if (screen && screen.handleInput) {
                this.inputManager.registerScreen(name, (key) => {
                    if (this.isPaused) return;
                    const nextScreen = screen.handleInput(key);
                    if (nextScreen) this.switchScreen(nextScreen);
                    return nextScreen;
                });
            }
        });

        // === ИНИЦИАЛИЗАЦИЯ ПЛЕЕРА (1 РАЗ) ===
        this.musicPlayer = new MusicPlayer();
        
        this.debugWindow = new DebugWindow();
        this.gameReadySent = false;
        this.isPaused = false;
        this.lastTime = 0;

        const resizeHandler = () => this.resize();
        window.addEventListener('resize', resizeHandler);
        resizeHandler();

        const handlePause = () => this.onPause();
        const handleResume = () => this.onResume();
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) handlePause();
            else handleResume();
        });
        
        window.addEventListener('blur', handlePause);
        window.addEventListener('focus', handleResume);

        this.startGameLoop();
    }

    resize() {
        this.canvasManager.resize();
        if (this.crtEffect) {
            this.crtEffect.syncStyle(this.canvas);
        }
    }

    onPause() {
        if (this.isPaused) return;
        this.isPaused = true;
        
        if (this.audioManager) this.audioManager.mute();
        if (this.musicPlayer) this.musicPlayer.stop(); // Ставим музыку на паузу
        
        if (this.screens[this.currentScreen]?.onPause) this.screens[this.currentScreen].onPause();
    }

    onResume() {
        if (!this.isPaused) return;
        this.isPaused = false;
        
        if (this.audioManager) this.audioManager.unmute();
        if (this.musicPlayer) this.musicPlayer.resume(); // Возобновляем музыку

        if (this.screens[this.currentScreen]?.onResume) this.screens[this.currentScreen].onResume();
        this.lastTime = performance.now();
    }

    switchScreen(screenName) {
        if (this.screens[this.currentScreen]?.cleanup) {
            this.screens[this.currentScreen].cleanup();
        }

        // === УПРАВЛЕНИЕ МУЗЫКОЙ (БЕЗ ПЕРЕСОЗДАНИЯ) ===
        if (screenName === 'intro') {
            this.musicPlayer.playMenuMusic();
        }

        if (screenName === 'game') {
            // Будим контекст (на всякий случай)
            if (this.audioManager && !this.isPaused) {
                this.audioManager.resumeContext().catch(e => {});
            }

            this.screens.game = new GameScreen(this.ctx, {
                virtualWidth: this.virtualWidth,
                virtualHeight: this.virtualHeight,
                bgScroller: this.bgScroller,
                gameState: this.gameState,
                audioManager: this.audioManager,
                onGameOver: () => this.handleGameOver() 
            });
            
            this.inputManager.registerScreen('game', (key) => {
                if (this.isPaused) return;
                return this.screens.game.handleInput(key);
            });

            this.musicPlayer.playGameMusic();
        }

        this.currentScreen = screenName;
        this.inputManager.setCurrentScreen(screenName);
    }

    handleGameOver() {
        try {
            if (window.showAd) window.showAd();
        } catch (e) {
            console.error("Ad error:", e);
        }

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

    update(timestamp) {
        if (this.isPaused) return;
        const delta = (timestamp - (this.lastTime || timestamp)) / 1000;
        this.lastTime = timestamp;
        const safeDelta = Math.min(delta, 0.1); 

        this.gameState.update(safeDelta);
        if (this.screens[this.currentScreen]) {
            this.screens[this.currentScreen].update(safeDelta);
        }
        
        if(this.debugWindow.visible) this.debugWindow.update(safeDelta);
    }

    draw() {
        if (this.isPaused) return;

        this.canvasManager.clearScreen();
        if (this.screens[this.currentScreen]) {
            this.screens[this.currentScreen].draw();
        }
        
        if (this.currentScreen === 'game') {
            this.hudManager.draw(
                this.gameState.lives,
                this.gameState.score,
                this.gameState.highScore
            );
        }
        
        if(this.debugWindow.visible) this.debugWindow.draw(this.ctx);

        if (this.crtEffect) this.crtEffect.render(performance.now());

        if (!this.gameReadySent) {
            if (window.ysdk && window.ysdk.features && window.ysdk.features.LoadingAPI) {
                window.ysdk.features.LoadingAPI.ready();
                this.gameReadySent = true;
            }
        }
    }

    startGameLoop() {
        const loop = (timestamp) => {
            this.update(timestamp);
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Game());
} else {
    new Game();
}