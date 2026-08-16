import { Scene } from 'phaser';

export interface GameOverStats
{
    completedDeliveries: number;
    money: number;
    score: number;
    highScore: number;
    distanceTraveled: number;
    pursuitsEscaped: number;
    newHighScore: boolean;
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

        scene.add.text(360, 250, 'GAME OVER', {
            color: '#ff5d73',
            fontFamily: 'Arial Black',
            fontSize: '70px',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        scene.add.text(
            360,
            475,
            [
                `Pontuação: ${stats.score}`,
                `Recorde: ${stats.highScore}${stats.newHighScore ? '  •  NOVO RECORDE!' : ''}`,
                `Entregas realizadas: ${stats.completedDeliveries}`,
                `Dinheiro acumulado: ${this.formatMoney(stats.money)}`,
                `Distância percorrida: ${this.formatDistance(stats.distanceTraveled)}`,
                `Perseguições escapadas: ${stats.pursuitsEscaped}`
            ],
            {
                align: 'center',
                color: stats.newHighScore ? '#f4d35e' : '#ffffff',
                fontFamily: 'Arial',
                fontSize: '28px',
                lineSpacing: 16
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1001);

        const restartButton = scene.add.text(360, 790, 'JOGAR NOVAMENTE', {
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

    private formatDistance (value: number)
    {
        return value >= 1000
            ? `${(value / 1000).toFixed(2).replace('.', ',')} km`
            : `${Math.round(value)} m`;
    }
}
