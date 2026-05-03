import Phaser from 'phaser';

export class UpgradeScene extends Phaser.Scene {
    private scrap: number = 0;
    private scrapText!: Phaser.GameObjects.Text;

    constructor() {
        super('UpgradeScene');
    }

    init(data: any) {
        this.registry.set('currentLevel', data.level);
    }

    create() {
        this.scrap = this.registry.get('scrap') || 0;

        this.add.rectangle(400, 300, 800, 600, 0x1a1a1a, 0.9);
        
        this.add.text(400, 50, 'UPGRADE SHOP', {
            fontSize: '48px',
            color: '#00ffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.scrapText = this.add.text(400, 110, `SCRAP: ${this.scrap}`, {
            fontSize: '32px',
            color: '#bdc3c7'
        }).setOrigin(0.5);

        const upgrades = [
            { id: 'fireRate', name: 'Rapid Capacitors', desc: 'Faster fire rate', cost: 10, icon: '⚡' },
            { id: 'speed', name: 'Overclocked Thrusters', desc: 'Increased ship speed', cost: 15, icon: '🚀' },
            { id: 'shardChance', name: 'Shard Mastery', desc: 'Higher explosion chance', cost: 20, icon: '💎' },
            { id: 'lives', name: 'Hull Reinforcement', desc: 'Add 1 Max Life', cost: 30, icon: '🛠️' }
        ];

        upgrades.forEach((upg, i) => {
            this.createUpgradeButton(upg, 180 + i * 90);
        });

        this.add.text(400, 550, 'CONTINUE TO NEXT LEVEL', {
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#008800',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            const level = this.registry.get('currentLevel') || 1;
            this.scene.start('GameScene', { level: level });
        });
    }

    private createUpgradeButton(upg: any, y: number) {
        const bg = this.add.rectangle(400, y, 600, 70, 0x333333).setInteractive({ useHandCursor: true });
        
        this.add.text(120, y - 15, `${upg.icon} ${upg.name}`, { fontSize: '24px', color: '#fff' });
        this.add.text(120, y + 10, upg.desc, { fontSize: '16px', color: '#aaa' });
        this.add.text(600, y, `COST: ${upg.cost}`, { fontSize: '24px', color: '#f1c40f' }).setOrigin(0.5);

        bg.on('pointerover', () => bg.setFillStyle(0x444444));
        bg.on('pointerout', () => bg.setFillStyle(0x333333));
        
        bg.on('pointerdown', () => {
            if (this.scrap >= upg.cost) {
                this.scrap -= upg.cost;
                this.registry.set('scrap', this.scrap);
                this.scrapText.setText(`SCRAP: ${this.scrap}`);
                this.applyUpgrade(upg.id);
                this.cameras.main.flash(200, 0, 255, 255);
            } else {
                this.cameras.main.shake(100, 0.005);
            }
        });
    }

    private applyUpgrade(id: string) {
        const stats = this.registry.get('playerStats');
        if (id === 'fireRate') stats.fireRate = Math.max(50, stats.fireRate - 15);
        if (id === 'speed') stats.speed += 30;
        if (id === 'shardChance') stats.shardChance = Math.min(60, stats.shardChance + 5);
        if (id === 'lives') {
            const currentLives = this.registry.get('lives') || 3;
            this.registry.set('lives', currentLives + 1);
        }
        this.registry.set('playerStats', stats);
    }
}
