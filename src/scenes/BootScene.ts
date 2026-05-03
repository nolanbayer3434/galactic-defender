import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Create simple graphics for placeholders
        const graphics = this.make.graphics({ x: 0, y: 0 });
        
        // Player Ship
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillTriangle(0, 32, 16, 0, 32, 32);
        graphics.generateTexture('player', 32, 32);
        graphics.clear();

        // Level 5 Enemy (Hexagon - 6 sides) - Orange
        graphics.fillStyle(0xe67e22, 1);
        graphics.beginPath();
        graphics.moveTo(16, 0);
        graphics.lineTo(32, 8);
        graphics.lineTo(32, 24);
        graphics.lineTo(16, 32);
        graphics.lineTo(0, 24);
        graphics.lineTo(0, 8);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('enemy_5', 32, 32);
        graphics.clear();

        // Level 4 Enemy (Pentagon - 5 sides) - Pink
        graphics.fillStyle(0xff00ff, 1);
        graphics.beginPath();
        graphics.moveTo(16, 0);
        graphics.lineTo(32, 12);
        graphics.lineTo(26, 32);
        graphics.lineTo(6, 32);
        graphics.lineTo(0, 12);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('enemy_4', 32, 32);
        graphics.clear();

        // Level 3 Enemy (Square - 4 sides) - Red
        graphics.fillStyle(0xe74c3c, 1);
        graphics.fillRect(4, 4, 24, 24);
        graphics.generateTexture('enemy_3', 32, 32);
        graphics.clear();

        // Level 2 Enemy (Triangle - 3 sides) - Yellow
        graphics.fillStyle(0xf1c40f, 1);
        graphics.fillTriangle(16, 4, 4, 28, 28, 28);
        graphics.generateTexture('enemy_2', 32, 32);
        graphics.clear();

        // Level 1 Enemy (Circle - 0/inf sides) - Purple
        graphics.fillStyle(0x9b59b6, 1);
        graphics.fillCircle(16, 16, 14);
        graphics.generateTexture('enemy_1', 32, 32);
        graphics.clear();

        // BOSS UNIT (Large Skull-ish shape - White/Glow)
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(10, 10, 44, 44);
        graphics.fillStyle(0xff0000, 1);
        graphics.fillRect(18, 20, 8, 8); // Eyes
        graphics.fillRect(38, 20, 8, 8);
        graphics.generateTexture('boss', 64, 64);
        graphics.clear();

        // Particle Spark
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(2, 2, 2);
        graphics.generateTexture('spark', 4, 4);
        graphics.clear();

        // Shard (Small diamond - White)
        graphics.fillStyle(0xffffff, 1);
        graphics.fillTriangle(4, 0, 0, 4, 8, 4);
        graphics.fillTriangle(4, 8, 0, 4, 8, 4);
        graphics.generateTexture('shard', 8, 8);
        graphics.clear();

        // Scrap (Silver Cog)
        graphics.fillStyle(0xbdc3c7, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.fillStyle(0x7f8c8d, 1);
        graphics.fillCircle(8, 8, 3);
        graphics.generateTexture('scrap', 16, 16);
        graphics.clear();

        // Rapid Fire (Diamond - Cyan)
        graphics.fillStyle(0x00ffff, 1);
        graphics.fillTriangle(16, 0, 0, 16, 16, 32);
        graphics.fillTriangle(16, 0, 32, 16, 16, 32);
        graphics.generateTexture('powerup_rapid', 32, 32);
        graphics.clear();

        // Shield (Circle - Green)
        graphics.lineStyle(2, 0x00ff00, 1);
        graphics.strokeCircle(16, 16, 14);
        graphics.fillStyle(0x00ff00, 0.5);
        graphics.fillCircle(16, 16, 10);
        graphics.generateTexture('powerup_shield', 32, 32);
        graphics.clear();

        // Spread Shot (Wedge - Orange)
        graphics.fillStyle(0xffa500, 1);
        graphics.fillTriangle(4, 28, 16, 4, 28, 28);
        graphics.generateTexture('powerup_spread', 32, 32);
        graphics.clear();

        // Shield Visual Effect
        graphics.lineStyle(3, 0x00ff00, 0.6);
        graphics.strokeCircle(24, 24, 22);
        graphics.generateTexture('shield_effect', 48, 48);
        graphics.clear();

        // Bullet
        graphics.fillStyle(0x3498db, 1); // Light Blue
        graphics.fillRect(0, 0, 4, 12);
        graphics.generateTexture('bullet', 4, 12);
        graphics.clear();
    }

    create() {
        this.add.text(400, 300, 'Loading Galactic Defender...', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }
}
