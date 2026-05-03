import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
    private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    private shieldSprite!: Phaser.GameObjects.Sprite;
    private bullets!: Phaser.Physics.Arcade.Group;
    private enemyBullets!: Phaser.Physics.Arcade.Group;
    private shards!: Phaser.Physics.Arcade.Group;
    private scraps!: Phaser.Physics.Arcade.Group;
    private enemies!: Phaser.Physics.Arcade.Group;
    private powerups!: Phaser.Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private fireKey!: Phaser.Input.Keyboard.Key;
    private score: number = 0;
    
    // UI Elements
    private scoreText!: Phaser.GameObjects.Text;
    private scrapTextUI!: Phaser.GameObjects.Text;
    private boostText!: Phaser.GameObjects.Text;
    private livesText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private comboText!: Phaser.GameObjects.Text;
    private bossHealthBar!: Phaser.GameObjects.Graphics;
    
    // Game State
    private combo: number = 0;
    private isRespawning: boolean = false;
    private isGameOver: boolean = false;
    private isBossLevel: boolean = false;
    private isLevelTransitioning: boolean = false;
    private currentLevel: number = 1;

    // VFX
    private explosionEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private stars: { circle: Phaser.GameObjects.Arc, speed: number }[] = [];

    // Formation movement
    private formationX: number = 0;
    private formationDirection: number = 1;
    private formationMoveTimer: number = 0;

    // Power-up state
    private isRapidFire: boolean = false;
    private isSpreadShot: boolean = false;
    private isShielded: boolean = false;
    private lastFired: number = 0;
    private lastEnemyFired: number = 0;

    constructor() {
        super('GameScene');
    }

    create(data: any) {
        // Levels carry over, other local state resets
        this.currentLevel = data.level || 1;
        this.isGameOver = false;
        this.isRespawning = false;
        this.isRapidFire = false;
        this.isSpreadShot = false;
        this.isShielded = false;
        this.isBossLevel = false;
        this.isLevelTransitioning = false;
        this.combo = 0;
        this.stars = [];

        this.createStarfield();

        // Particles
        this.explosionEmitter = this.add.particles(0, 0, 'spark', {
            speed: { min: 50, max: 150 },
            scale: { start: 1, end: 0 },
            lifespan: 600,
            gravityY: 100,
            emitting: false
        });

        // Player
        this.player = this.physics.add.sprite(400, 550, 'player');
        this.player.setCollideWorldBounds(true);

        this.shieldSprite = this.add.sprite(400, 550, 'shield_effect');
        this.shieldSprite.setVisible(false);

        // Groups
        this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 100 });
        this.enemyBullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 50 });
        this.shards = this.physics.add.group({ defaultKey: 'shard', maxSize: 50 });
        this.scraps = this.physics.add.group({ defaultKey: 'scrap' });
        this.enemies = this.physics.add.group();
        this.powerups = this.physics.add.group();

        // Controls
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.fireKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        const pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        pauseKey.on('down', () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        });

        // UI
        this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, { fontSize: '24px', color: '#fff' });
        this.scrapTextUI = this.add.text(16, 45, `Scrap: ${this.registry.get('scrap')}`, { fontSize: '24px', color: '#bdc3c7' });
        const initialLives = this.registry.get('lives');
        this.livesText = this.add.text(16, 75, `Lives: ${initialLives === Infinity ? 'Unlimited' : initialLives}`, { fontSize: '24px', color: '#00ff00' });
        this.boostText = this.add.text(16, 105, '', { fontSize: '18px', color: '#00ffff' });
        this.levelText = this.add.text(700, 16, `Level ${this.currentLevel}`, { fontSize: '24px', color: '#00ff00' });
        this.comboText = this.add.text(400, 150, '', { fontSize: '48px', color: '#ffcc00', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0);
        
        this.bossHealthBar = this.add.graphics();
        this.bossHealthBar.setVisible(false);

        this.spawnLevel();

        // Collisions
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, undefined, this);
        this.physics.add.overlap(this.shards, this.enemies, this.hitEnemyWithShard, undefined, this);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.handlePlayerBulletCollision, undefined, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerUp, undefined, this);
        this.physics.add.overlap(this.player, this.scraps, this.collectScrap, undefined, this);
    }

    update(time: number) {
        if (this.isGameOver) return;

        this.stars.forEach(star => {
            star.circle.y += star.speed;
            if (star.circle.y > 600) star.circle.y = 0;
        });

        if (this.isLevelTransitioning) return;

        // Player Movement
        const stats = this.registry.get('playerStats');
        if (this.cursors.left.isDown) this.player.setVelocityX(-stats.speed);
        else if (this.cursors.right.isDown) this.player.setVelocityX(stats.speed);
        else this.player.setVelocityX(0);

        // Formation Movement
        const moveDelay = Math.max(20, 100 - (this.currentLevel * 10));
        if (time > this.formationMoveTimer) {
            if (this.isBossLevel) this.moveBoss();
            else this.moveFormation();
            this.formationMoveTimer = time + moveDelay;
        }

        // Enemy Firing
        const fireDelay = this.isBossLevel ? 800 : Math.max(300, 1500 - (this.currentLevel * 150));
        if (time > this.lastEnemyFired + fireDelay) {
            this.enemyFire();
            this.lastEnemyFired = time + Phaser.Math.Between(0, 500);
        }

        if (this.isShielded || this.isRespawning) {
            this.shieldSprite.setPosition(this.player.x, this.player.y);
            this.shieldSprite.setAngle(this.shieldSprite.angle + 2);
            this.shieldSprite.setVisible(true);
        } else {
            this.shieldSprite.setVisible(false);
        }

        // Shooting
        const fireRate = this.isRapidFire ? stats.fireRate / 2 : stats.fireRate;
        if (this.fireKey.isDown && time > this.lastFired + fireRate) {
            this.fireBullet();
            this.lastFired = time;
        }

        // Cleanup
        [this.bullets, this.enemyBullets, this.shards, this.scraps].forEach(group => {
            group.getChildren().forEach((item: any) => {
                if (item.active && (item.y < -50 || item.y > 650 || item.x < -50 || item.x > 850)) {
                    if (group === this.bullets && item.y < 0) this.resetCombo();
                    group.killAndHide(item);
                    if (item.body) item.body.enable = false;
                }
            });
        });

        this.powerups.getChildren().forEach((p: any) => {
            if (p.active && p.y > 600) this.powerups.killAndHide(p);
        });
    }

    private spawnLevel() {
        this.enemies.clear(true, true);
        this.isBossLevel = this.currentLevel % 5 === 0;
        this.isLevelTransitioning = true;

        const levelMsg = this.isBossLevel ? 'BOSS INCOMING!' : `LEVEL ${this.currentLevel}`;
        const readyText = this.add.text(400, 300, levelMsg, { fontSize: '64px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        
        this.tweens.add({
            targets: readyText,
            scale: 1.2,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                readyText.destroy();
                this.isLevelTransitioning = false;
                if (this.isBossLevel) this.spawnBoss();
                else this.spawnFormation();
                this.isShielded = true;
                this.time.delayedCall(3000, () => { this.isShielded = false; });
            }
        });
    }

    private spawnBoss() {
        const health = this.currentLevel * 10;
        const boss = this.enemies.create(400, 100, 'boss');
        boss.setData('health', health);
        boss.setData('maxHealth', health);
        boss.setImmovable(true);
        this.bossHealthBar.setVisible(true);
        this.updateBossHealthBar(health, health);
        this.tweens.add({ targets: boss, x: 600, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    private spawnFormation() {
        this.bossHealthBar.setVisible(false);
        const rows = Math.min(8, 3 + Math.floor(this.currentLevel / 2));
        const cols = Math.min(12, 6 + Math.floor(this.currentLevel / 3));
        for (let y = 0; y < rows; y++) {
            const level = Math.max(1, Math.min(5, 5 - Math.floor((y / rows) * 5)));
            for (let x = 0; x < cols; x++) {
                const px = 400 - ((cols - 1) * 30) + (x * 60);
                const py = 80 + (y * 45);
                const enemy = this.enemies.create(px, -50, `enemy_${level}`);
                enemy.setData('health', level);
                enemy.setImmovable(true);
                this.tweens.add({ targets: enemy, y: py, duration: 800, delay: (x * 50) + (y * 100), ease: 'Power2' });
            }
        }
    }

    private hitEnemy(bullet: any, enemy: any) {
        if (!bullet.active || !enemy.active) return;
        this.bullets.killAndHide(bullet);
        bullet.body.enable = false;
        this.damageEnemy(enemy);
    }

    private hitEnemyWithShard(shard: any, enemy: any) {
        if (!shard.active || !enemy.active) return;
        this.shards.killAndHide(shard);
        shard.body.enable = false;
        this.damageEnemy(enemy);
    }

    private damageEnemy(enemy: any) {
        this.combo++;
        this.updateComboUI();
        let health = enemy.getData('health') - 1;
        enemy.setData('health', health);
        this.explosionEmitter.emitParticleAt(enemy.x, enemy.y, 5);

        if (this.isBossLevel) {
            this.updateBossHealthBar(health, enemy.getData('maxHealth'));
            if (health <= 0) {
                this.explode(enemy, 50);
                this.cameras.main.shake(500, 0.03);
                this.spawnScrapCluster(enemy.x, enemy.y, 15);
                enemy.destroy();
                this.addScore(5000);
                this.dropPowerUp(enemy.x, enemy.y);
                const maxLives = this.registry.get('maxLives');
                if (maxLives !== Infinity) {
                    this.registry.set('lives', maxLives);
                    this.livesText.setText(`Lives: ${maxLives}`);
                }
            }
        } else if (health <= 0) {
            this.explode(enemy, 15);
            const stats = this.registry.get('playerStats');
            if (enemy.texture.key === 'enemy_1' && Phaser.Math.Between(1, 100) <= stats.shardChance) this.triggerShardExplosion(enemy.x, enemy.y);
            if (Phaser.Math.Between(1, 100) <= 50) this.spawnScrap(enemy.x, enemy.y);
            if (Phaser.Math.Between(1, 100) <= (15 + this.currentLevel)) this.dropPowerUp(enemy.x, enemy.y);
            enemy.destroy();
            this.enemies.remove(enemy);
            this.addScore(100);
        } else {
            enemy.setTexture(`enemy_${health}`);
            this.addScore(50);
        }
        this.checkLevelComplete();
    }

    private spawnScrap(x: number, y: number) {
        const scrap = this.scraps.get(x, y);
        if (scrap) { scrap.setActive(true); scrap.setVisible(true); scrap.body.enable = true; scrap.body.reset(x, y); scrap.body.velocity.y = 100; }
    }

    private spawnScrapCluster(x: number, y: number, count: number) {
        for (let i = 0; i < count; i++) {
            const scrap = this.scraps.get(x, y);
            if (scrap) { scrap.setActive(true); scrap.setVisible(true); scrap.body.enable = true; scrap.body.reset(x, y); this.physics.velocityFromAngle(Phaser.Math.Between(0, 360), 150, scrap.body.velocity); scrap.body.drag.set(50); }
        }
    }

    private collectScrap(player: any, scrap: any) {
        this.scraps.killAndHide(scrap);
        scrap.body.enable = false;
        const current = this.registry.get('scrap') || 0;
        this.registry.set('scrap', current + 1);
        this.scrapTextUI.setText(`Scrap: ${current + 1}`);
    }

    private checkLevelComplete() {
        if (this.isLevelTransitioning || this.isGameOver) return;
        if (this.enemies.countActive() === 0) {
            if (this.isBossLevel) this.scene.start('UpgradeScene', { level: this.currentLevel + 1 });
            else { this.currentLevel++; this.levelText.setText(`Level ${this.currentLevel}`); this.spawnLevel(); }
        }
    }

    private moveFormation() {
        this.formationX += this.formationDirection * 3.75;
        if (Math.abs(this.formationX) > 100) {
            this.formationDirection *= -1;
            this.enemies.getChildren().forEach((enemy: any) => {
                enemy.y += 15;
                if (enemy.y > 500) this.gameOver();
            });
        } else { this.enemies.getChildren().forEach((enemy: any) => { enemy.x += this.formationDirection * 3.75; }); }
    }

    private moveBoss() {
        const boss = this.enemies.getChildren()[0] as any;
        if (!boss) return;
        boss.x += this.formationDirection * 4;
        if (boss.x > 700 || boss.x < 100) this.formationDirection *= -1;
    }

    private enemyFire() {
        const livingEnemies = this.enemies.getChildren().filter((e: any) => e.active);
        if (livingEnemies.length === 0) return;
        if (this.isBossLevel) {
            const boss = livingEnemies[0] as any;
            if (Phaser.Math.Between(1, 100) > 10) return;
            this.createEnemyBullet(boss.x, boss.y + 30, 0, 300);
        } else {
            const shooter = Phaser.Utils.Array.GetRandom(livingEnemies) as any;
            if (shooter.getData('health') >= 4) {
                const angle = Phaser.Math.Angle.Between(shooter.x, shooter.y, this.player.x, this.player.y);
                const b = this.createEnemyBullet(shooter.x, shooter.y + 20, 0, 0);
                if (b) this.physics.velocityFromRotation(angle, 350, b.body.velocity);
            } else { this.createEnemyBullet(shooter.x, shooter.y + 20, 0, 300); }
        }
    }

    private createEnemyBullet(x: number, y: number, vx: number, vy: number) {
        const bullet = this.enemyBullets.get(x, y);
        if (bullet) { bullet.setActive(true); bullet.setVisible(true); bullet.body.enable = true; bullet.body.reset(x, y); bullet.body.velocity.x = vx; bullet.body.velocity.y = vy; bullet.setTint(0xff00ff); }
        return bullet;
    }

    private updateBossHealthBar(current: number, max: number) {
        this.bossHealthBar.clear();
        this.bossHealthBar.fillStyle(0x333333);
        this.bossHealthBar.fillRect(200, 20, 400, 20);
        this.bossHealthBar.fillStyle(0xff0000);
        this.bossHealthBar.fillRect(200, 20, (current / max) * 400, 20);
    }

    private triggerShardExplosion(x: number, y: number) {
        for (let i = 0; i < 5; i++) {
            const angle = (i * 72) * (Math.PI / 180);
            const shard = this.shards.get(x, y);
            if (shard) { shard.setActive(true); shard.setVisible(true); shard.body.enable = true; shard.body.reset(x, y); this.physics.velocityFromRotation(angle, 400, shard.body.velocity); shard.setRotation(angle); }
        }
    }

    private explode(target: any, count: number) { this.explosionEmitter.emitParticleAt(target.x, target.y, count); }

    private addScore(points: number) {
        const mult = Math.floor(this.combo / 10) + 1;
        this.score += points * mult;
        this.scoreText.setText(`Score: ${this.score}`);
        this.tweens.add({ targets: this.scoreText, scale: 1.1, duration: 100, yoyo: true });
    }

    private updateComboUI() {
        if (this.combo >= 10) {
            const mult = Math.floor(this.combo / 10) + 1;
            this.comboText.setText(`COMBO x${mult}`).setAlpha(1);
            this.tweens.add({ targets: this.comboText, scale: 1.2, duration: 100, yoyo: true });
        }
    }

    private resetCombo() {
        if (this.combo >= 10) this.tweens.add({ targets: this.comboText, alpha: 0, duration: 500 });
        this.combo = 0;
    }

    private handlePlayerBulletCollision(player: any, bullet: any) {
        if (!bullet.active || this.isRespawning) return;
        if (this.isShielded) { this.enemyBullets.killAndHide(bullet); bullet.body.enable = false; }
        else { this.cameras.main.shake(200, 0.02); this.explode(player, 20); this.loseLife(); this.enemyBullets.killAndHide(bullet); bullet.body.enable = false; this.resetCombo(); }
    }

    private handlePlayerEnemyCollision(player: any, enemy: any) {
        if (this.isRespawning) return;
        if (this.isShielded) {
            if (this.isBossLevel) {
                let h = enemy.getData('health') - 5;
                enemy.setData('health', h);
                this.updateBossHealthBar(h, enemy.getData('maxHealth'));
                if (h <= 0) enemy.destroy();
            } else { this.explode(enemy, 15); enemy.destroy(); }
            this.addScore(150);
            this.checkLevelComplete();
        } else { this.cameras.main.shake(300, 0.03); this.explode(player, 25); this.loseLife(); this.resetCombo(); }
    }

    private loseLife() {
        const lives = this.registry.get('lives');
        if (lives !== Infinity) {
            const newLives = lives - 1;
            this.registry.set('lives', newLives);
            this.livesText.setText(`Lives: ${newLives}`);
            if (newLives <= 0) { this.gameOver(); return; }
        }
        this.respawn();
    }

    private respawn() {
        this.isRespawning = true;
        this.player.setAlpha(0.5);
        this.player.setPosition(400, 550);
        this.time.delayedCall(3000, () => { this.isRespawning = false; this.player.setAlpha(1); });
    }

    private fireBullet() {
        this.createBullet(this.player.x, this.player.y - 20, 0, -500);
        if (this.isSpreadShot) { this.createBullet(this.player.x - 10, this.player.y - 15, -150, -450); this.createBullet(this.player.x + 10, this.player.y - 15, 150, -450); }
    }

    private createBullet(x: number, y: number, vx: number, vy: number) {
        const b = this.bullets.get(x, y);
        if (b) { b.setActive(true); b.setVisible(true); b.body.enable = true; b.body.reset(x, y); b.body.velocity.x = vx; b.body.velocity.y = vy; b.setAngle(vx / 10); b.clearTint(); }
    }

    private dropPowerUp(x: number, y: number) {
        const types = ['powerup_rapid', 'powerup_shield', 'powerup_spread'];
        const type = Phaser.Utils.Array.GetRandom(types);
        const p = this.powerups.create(x, y, type);
        p.setData('type', type);
        p.setVelocityY(150);
    }

    private collectPowerUp(player: any, pu: any) {
        this.powerups.killAndHide(pu);
        pu.body.enable = false;
        const type = pu.getData('type');
        if (type === 'powerup_rapid') this.activateRapidFire();
        else if (type === 'powerup_shield') this.activateShield();
        else if (type === 'powerup_spread') this.activateSpreadShot();
        this.updateBoostText();
    }

    private activateRapidFire() { this.isRapidFire = true; this.time.delayedCall(8000, () => { this.isRapidFire = false; this.updateBoostText(); }); }
    private activateShield() { this.isShielded = true; this.time.delayedCall(10000, () => { this.isShielded = false; this.updateBoostText(); }); }
    private activateSpreadShot() { this.isSpreadShot = true; this.time.delayedCall(8000, () => { this.isSpreadShot = false; this.updateBoostText(); }); }


    private updateBoostText() {
        let b = [];
        if (this.isRapidFire) b.push('RAPID');
        if (this.isSpreadShot) b.push('SPREAD');
        if (this.isShielded) b.push('SHIELD');
        this.boostText.setText(b.length > 0 ? 'BOOSTS: ' + b.join(' + ') : '');
    }

    private gameOver() {
        this.isGameOver = true;
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', color: '#ff0000' }).setOrigin(0.5);
        this.add.text(400, 380, 'Click to Return to Menu', { fontSize: '32px', color: '#ffffff' }).setOrigin(0.5);
        this.input.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    private createStarfield() {
        this.stars = [];
        const layers = [{ count: 100, s: 0.5, sz: 1, a: 0.3 }, { count: 50, s: 1.5, sz: 1.5, a: 0.6 }, { count: 20, s: 3.0, sz: 2, a: 0.9 }];
        layers.forEach(l => {
            for (let i = 0; i < l.count; i++) {
                const s = this.add.circle(Phaser.Math.Between(0, 800), Phaser.Math.Between(1, 600), l.sz, 0xffffff, l.a);
                this.stars.push({ circle: s, speed: l.s });
            }
        });
    }
}
