import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        // Transparent overlay
        this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);

        this.add.text(400, 250, 'PAUSED', {
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const resumeBtn = this.add.text(400, 380, 'RESUME', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#008800',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        });

        // Listen for 'P' key to unpause too
        const pKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
        pKey.on('down', () => {
            console.log('Unpause via P key');
            this.scene.resume('GameScene');
            this.scene.stop();
        });
    }
}
