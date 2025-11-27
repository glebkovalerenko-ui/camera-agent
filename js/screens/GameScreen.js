import Player from '../player.js';
import { ParticleEngine, LaserEngine } from '../particleEngine.js';
import PatternFormation from '../PatternFormation.js';
import ImageBackgroundScroller from '../imageBackgroundScroller.js';

class GameScreen {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.virtualWidth = options.virtualWidth;
        this.virtualHeight = options.virtualHeight;
        this.gameState = options.gameState;
        this.audioManager = options.audioManager;
        this.bgScroller = options.bgScroller;
        
        // Callback для надежного переключения
        this.onGameOver = options.onGameOver || (() => console.error("No onGameOver provided"));
        
        this.isGameOver = false; // Локальный флаг остановки
        this.initializeGameObjects();
    }

    initializeGameObjects() {
        this.player = new Player(this.ctx, {
            virtualWidth: this.virtualWidth,
            virtualHeight: this.virtualHeight,
            speed: 300
        });

        this.particleEngine = new ParticleEngine(this.ctx);
        this.particleEngine2 = new ParticleEngine(this.ctx);
        this.particleEngine3 = new ParticleEngine(this.ctx);
        this.laserEngineLeft = new LaserEngine(this.ctx, this.audioManager);
        this.laserEngineRight = new LaserEngine(this.ctx, this.audioManager);

        this.formation = new PatternFormation(this.ctx, {
            virtualWidth: this.virtualWidth,
            virtualHeight: this.virtualHeight,
            pattern: 'infinity',
            audioManager: this.audioManager,
            onPointsScored: (points) => this.addPoints(points)
        });
    }

    handleInput(key) {
        if (this.isGameOver) return; // Блокируем ввод при смерти
        this.player.handleInput(key);
    }

    update(delta) {
        if (this.isGameOver) return; // ОСТАНАВЛИВАЕМ ВСЮ ЛОГИКУ

        this.bgScroller.update(delta);
        this.player.update(delta);
        
        this.updateParticles(delta);
        this.updateFormation(delta);
        this.checkCollisions();
    }

    updateParticles(delta) {
        // Центр игрока по горизонтали
        const centerX = this.player.x + this.player.width / 2;
        
        // Базовая точка Y (низ игрока минус небольшой отступ)
        const engineY = this.player.y + this.player.height; 
        
        // --- ИЗМЕНЕНИЯ ЗДЕСЬ ---
        
        // 1. Убираем центральный двигатель (комментируем)
        // this.particleEngine.setEmitter(centerX, engineY - 25);
        
        // 2. Поднимаем боковые двигатели выше
        // Было: engineY - 20. Ставим: engineY - 60 (чем больше число, тем ВЫШЕ огонь)
        // Подбери число под свой спрайт
        const heightOffset = 100; 
        
        this.particleEngine2.setEmitter(centerX - 21, engineY - heightOffset);
        this.particleEngine3.setEmitter(centerX + 21, engineY - heightOffset);
        
        // Обновляем только нужные
        // this.particleEngine.update(delta); // Тоже комментируем
        this.particleEngine2.update(delta);
        this.particleEngine3.update(delta);

        // ... дальше код лазеров без изменений ...
        const firing = this.player.isFiring;
        this.laserEngineLeft.setFiring(firing);
        this.laserEngineRight.setFiring(firing);
        
        const laserLeftX = this.player.x + this.player.width * 0.3;
        const laserRightX = this.player.x + this.player.width * 0.7;
        const laserY = this.player.y;
        
        this.laserEngineLeft.setEmitter(laserLeftX, laserY);
        this.laserEngineRight.setEmitter(laserRightX, laserY);
        
        this.laserEngineLeft.update(delta);
        this.laserEngineRight.update(delta);
    }

    updateFormation(delta) {
        this.formation.update(delta);
        if (this.formation.aliens.length === 0) {
            this.formation = new PatternFormation(this.ctx, {
                virtualWidth: this.virtualWidth,
                virtualHeight: this.virtualHeight,
                pattern: 'infinity',
                difficulty: this.formation.difficulty + 1,
                audioManager: this.audioManager,
                onPointsScored: (points) => this.addPoints(points)
            });
        }
    }

    checkCollisions() {
        if (this.isGameOver) return;

        // 1. Игрок получил урон от лазера
        for (const laser of this.formation.lasers) {
            if (laser.life > 0 && this.player.checkCollision(laser)) {
                this.handlePlayerHit();
                laser.life = 0;
                if (this.isGameOver) return; // Выходим сразу, если умерли
            }
        }

        // 2. Столкновение с врагом
        if (this.formation.checkCollision(this.player.x + this.player.width/2, this.player.y + this.player.height/2)) {
            this.handlePlayerHit();
            if (this.isGameOver) return;
        }

        // 3. Стрельба игрока
        [this.laserEngineLeft, this.laserEngineRight].forEach(engine => {
            engine.particles.forEach(laser => {
                if (laser.life > 0 && this.formation.checkCollision(laser.x, laser.y)) {
                    laser.life = 0;
                }
            });
        });
    }

    addPoints(points) {
        this.gameState.addPoints(points);
    }

    handlePlayerHit() {
        const isDead = this.gameState.handlePlayerHit();
        console.log(`Player Hit! Lives: ${this.gameState.lives}`);

        if (isDead) {
            this.isGameOver = true;
            console.log("Dead! Calling onGameOver...");
            this.onGameOver();
        }
    }

    draw() {
        this.bgScroller.draw();
        this.drawPlayer();
        this.formation.draw();
        
        this.laserEngineLeft.draw();
        this.laserEngineRight.draw();
        //this.particleEngine.draw();
        this.particleEngine2.draw();
        this.particleEngine3.draw();
    }

    drawPlayer() {
        if (!this.player.img.complete) return;

        this.ctx.save();
        if (this.gameState.playerInvulnerable) {
            const flash = Math.floor(Date.now() / 100) % 2 === 0;
            this.ctx.globalAlpha = flash ? 0.3 : 1.0;
        }
        this.ctx.drawImage(this.player.img, this.player.x, this.player.y, this.player.width, this.player.height);
        this.ctx.restore();
    }
}

export default GameScreen;