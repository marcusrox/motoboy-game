import { Scene } from 'phaser';

export interface GameOverStats
{
    completedDeliveries: number;
    money: number;
}

export class GameOverOverlay
{
    private restarting = false;

    constructor (scene: Scene, stats: GameOverStats, onRestart: () => void)
    {
        scene.add.rectangle(0, 0, 720, 1280, 0x090c10, 0.9)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(1000);

        scene.add.text(360, 360, 'GAME OVER', {
            color: '#ff5d73',
            fontFamily: 'Arial Black',
            fontSize: '70px',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        scene.add.text(
            360,
            515,
            [
                `Entregas realizadas: ${stats.completedDeliveries}`,
                `Dinheiro acumulado: ${this.formatMoney(stats.money)}`
            ],
            {
                align: 'center',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontSize: '28px',
                lineSpacing: 16
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        const restartButton = scene.add.text(360, 710, 'JOGAR NOVAMENTE', {
            backgroundColor: '#f4b41a',
            color: '#17212b',
            fontFamily: 'Arial Black',
            fontSize: '28px',
            padding: { x: 30, y: 20 }
        })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1002)
            .setInteractive({ useHandCursor: true });

        const restart = () => {
            if (this.restarting)
            {
                return;
            }

            this.restarting = true;
            restartButton.disableInteractive();
            scene.input.keyboard?.off('keydown-ENTER', restart);
            scene.input.keyboard?.off('keydown-SPACE', restart);
            scene.physics.resume();
            onRestart();
        };

        restartButton
            .on('pointerover', () => restartButton.setBackgroundColor('#ffd166'))
            .on('pointerout', () => restartButton.setBackgroundColor('#f4b41a'))
            .once('pointerup', restart);
        scene.input.keyboard?.once('keydown-ENTER', restart);
        scene.input.keyboard?.once('keydown-SPACE', restart);
        scene.events.once('shutdown', () => {
            scene.input.keyboard?.off('keydown-ENTER', restart);
            scene.input.keyboard?.off('keydown-SPACE', restart);
        });
    }

    private formatMoney (value: number)
    {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
}
