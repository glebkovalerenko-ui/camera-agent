class GameStateManager {
    constructor() {
        this.reset();
        this.highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
    }

    addPoints(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore.toString());
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