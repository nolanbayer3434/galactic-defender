import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    private lifeModes = [3, 5, 10, Infinity];
    private selectedLifeIdx = 0;
    private lifeText!: Phaser.GameObjects.Text;

    create() {
        this.add.text(400, 50, 'GALACTIC DEFENDER', { fontSize: '64px', color: '#00ffff', fontStyle: 'bold' }).setOrigin(0.5);

        // Leaderboard
        this.add.text(150, 200, 'HIGH SCORES', { fontSize: '32px', color: '#ffcc00' });
        const scores = JSON.parse(localStorage.getItem('scores') || '[]');
        scores.forEach((s: any, i: number) => {
            this.add.text(150, 240 + i * 30, `${s.name} --- ${s.score}`, { fontSize: '24px', color: '#fff' });
        });

        // Life Selector
        this.add.text(600, 200, 'SELECT LIVES:', { fontSize: '24px', color: '#aaa' }).setOrigin(0.5);
        this.lifeText = this.add.text(600, 240, '3', { fontSize: '40px', color: '#00ff00' }).setOrigin(0.5);
        this.add.text(540, 240, '<', { fontSize: '40px' }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeLives(-1));
        this.add.text(660, 240, '>', { fontSize: '40px' }).setOrigin(0.5).setInteractive().on('pointerdown', () => this.changeLives(1));

        const startBtn = this.add.text(600, 350, 'START GAME', {
            fontSize: '32px', color: '#ffffff', backgroundColor: '#008800', padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            const lives = this.lifeModes[this.selectedLifeIdx];
            this.registry.set('scrap', 0);
            this.registry.set('lives', lives);
            this.registry.set('maxLives', lives);
            this.registry.set('playerStats', { fireRate: 200, speed: 480, shardChance: 10 });
            this.scene.start('GameScene');
        });

        const quitBtn = this.add.text(600, 450, 'QUIT', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#880000',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            if (confirm('Are you sure you want to quit?')) {
                window.location.href = 'about:blank';
            }
        });
    }

    private changeLives(dir: number) {
        this.selectedLifeIdx = (this.selectedLifeIdx + dir + this.lifeModes.length) % this.lifeModes.length;
        const val = this.lifeModes[this.selectedLifeIdx]!;
        this.lifeText.setText(val === Infinity ? 'Unlimited' : val.toString());
    }
}
