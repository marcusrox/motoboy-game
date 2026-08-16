import { Scene } from 'phaser';

export class MainMenuScene extends Scene
{
    constructor ()
    {
        super('MainMenuScene');
    }

    create ()
    {
        const { centerX, centerY, height, width } = this.cameras.main;
        const background = this.add.graphics();
        background.fillGradientStyle(0x17212b, 0x17212b, 0x314936, 0x314936);
        background.fillRect(0, 0, width, height);

        const road = this.add.graphics();
        road.fillStyle(0x30373d);
        road.fillRect(centerX - 150, 0, 300, height);
        road.lineStyle(8, 0xf4d35e, 0.8);

        for (let y = 20; y < height; y += 100)
        {
            road.lineBetween(centerX, y, centerX, y + 50);
        }

        this.add.text(centerX, centerY - 185, 'TUCA\nMOTOBOY', {
            align: 'center',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '72px',
            stroke: '#111111',
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(centerX, centerY - 48, 'PILOTO DE FUGA', {
            color: '#f4d35e',
            fontFamily: 'Arial Black',
            fontSize: '28px',
            letterSpacing: 3,
            stroke: '#111111',
            strokeThickness: 5
        }).setOrigin(0.5);

        const startButton = this.add.text(centerX, centerY + 140, 'TOCAR PARA COMEÇAR', {
            backgroundColor: '#f4b41a',
            color: '#17212b',
            fontFamily: 'Arial',
            fontSize: '28px',
            padding: { x: 30, y: 20 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        startButton.once('pointerdown', () => this.scene.start('GameScene'));
    }
}
