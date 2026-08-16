import { GameObjects, Scene, Time } from 'phaser';
import { DEBUG_PURSUIT } from '../config/pursuitConfig';
import { CompletedDelivery, DeliverySystem } from '../systems/DeliverySystem';
import { GameStatsSystem } from '../systems/GameStatsSystem';
import { PursuitStatus } from '../systems/PursuitSystem';

export class HUD extends GameObjects.Container
{
    private moneyText: GameObjects.Text;
    private scoreText: GameObjects.Text;
    private statsText: GameObjects.Text;
    private statusText: GameObjects.Text;
    private distanceText: GameObjects.Text;
    private valueText: GameObjects.Text;
    private notificationText: GameObjects.Text;
    private deliveryPulse: GameObjects.Arc;
    private collisionFlash: GameObjects.Rectangle;
    private dangerBorder: GameObjects.Rectangle;
    private dangerText: GameObjects.Text;
    private debugText: GameObjects.Text;
    private pursuitActive = false;
    private notificationHideEvent?: Time.TimerEvent;

    constructor (
        scene: Scene,
        private deliverySystem: DeliverySystem,
        private statsSystem: GameStatsSystem
    )
    {
        super(scene, 0, 0);

        const panel = scene.add.rectangle(24, 24, 672, 160, 0x111820, 0.88)
            .setOrigin(0)
            .setStrokeStyle(2, 0xffffff, 0.12);
        this.moneyText = scene.add.text(42, 36, '', {
            color: '#f4d35e',
            fontFamily: 'Arial Black',
            fontSize: '25px'
        });
        this.scoreText = scene.add.text(678, 40, '', {
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '20px'
        }).setOrigin(1, 0);
        this.statusText = scene.add.text(42, 76, '', {
            color: '#ffffff',
            fontFamily: 'Arial',
            fontSize: '20px'
        });
        this.distanceText = scene.add.text(42, 108, '', {
            color: '#b9d8ff',
            fontFamily: 'Arial',
            fontSize: '18px'
        });
        this.valueText = scene.add.text(678, 108, '', {
            color: '#8ee3a2',
            fontFamily: 'Arial Black',
            fontSize: '17px'
        }).setOrigin(1, 0);
        this.statsText = scene.add.text(42, 143, '', {
            color: '#dce5ee',
            fontFamily: 'Arial',
            fontSize: '16px'
        });
        this.deliveryPulse = scene.add.circle(360, 245, 82, 0x8ee3a2, 0)
            .setStrokeStyle(12, 0x8ee3a2, 0.85)
            .setVisible(false);
        this.collisionFlash = scene.add.rectangle(0, 0, 720, 1280, 0xff304f, 0)
            .setOrigin(0)
            .setVisible(false);
        this.notificationText = scene.add.text(360, 245, '', {
            align: 'center',
            backgroundColor: '#246b3d',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '28px',
            padding: { x: 22, y: 14 }
        }).setOrigin(0.5).setVisible(false);
        this.dangerBorder = scene.add.rectangle(360, 640, 700, 1260)
            .setStrokeStyle(10, 0xff304f, 0.8)
            .setVisible(false);
        this.dangerText = scene.add.text(360, 205, '! PERSEGUIÇÃO !', {
            backgroundColor: '#a1122a',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '28px',
            padding: { x: 18, y: 10 }
        }).setOrigin(0.5).setVisible(false);
        this.debugText = scene.add.text(360, 330, '', {
            align: 'center',
            backgroundColor: '#000000',
            color: '#ffcf5c',
            fontFamily: 'monospace',
            fontSize: '17px',
            padding: { x: 10, y: 8 }
        }).setOrigin(0.5).setVisible(false);

        this.add([
            panel,
            this.moneyText,
            this.scoreText,
            this.statusText,
            this.distanceText,
            this.valueText,
            this.statsText,
            this.deliveryPulse,
            this.collisionFlash,
            this.notificationText,
            this.dangerBorder,
            this.dangerText,
            this.debugText
        ]);
        this.setScrollFactor(0).setDepth(100);
        scene.add.existing(this);
        this.refresh(null);
    }

    refresh (distance: number | null)
    {
        const delivery = this.deliverySystem.getCurrentDelivery();
        const stats = this.statsSystem.getSnapshot();

        this.moneyText.setText(`Dinheiro: ${this.formatMoney(this.deliverySystem.getMoney())}`);
        this.scoreText.setText(`Pontos: ${stats.score}`);
        this.statsText.setText(`Entregas: ${stats.deliveries}  •  Sequência: ${stats.deliveryStreak}`);

        if (!delivery)
        {
            this.statusText.setText('Sem entrega — vá ao Restaurante');
            this.distanceText.setText('Distância: --');
            this.valueText.setText('Recompensa prevista: --');
            return;
        }

        const approximateDistance = Math.max(0, Math.round((distance ?? 0) / 10) * 10);
        this.statusText.setText(`Entrega: ${delivery.destination.name}`);
        this.distanceText.setText(`Distância aproximada: ${approximateDistance} m`);
        this.valueText.setText(`Recompensa prevista: ${this.formatMoney(delivery.reward)}`);
    }

    showSuccess (delivery: CompletedDelivery)
    {
        const bonuses = [
            delivery.quick ? `Rápida +${this.formatMoney(delivery.quickBonus)}` : '',
            delivery.collisionFree ? `Sem colisões +${this.formatMoney(delivery.collisionFreeBonus)}` : ''
        ].filter(Boolean).join(' • ');
        const bonusLine = bonuses ? `\n${bonuses}` : '';

        this.showNotification(
            `ENTREGA CONCLUÍDA!\n+ ${this.formatMoney(delivery.totalReward)}${bonusLine}`,
            '#246b3d'
        );
        this.animateDeliveryPulse();
    }

    showEscaped ()
    {
        this.showNotification('VOCÊ ESCAPOU!', '#246b3d');
    }

    showTrafficCollision (moneyPenalty: number)
    {
        const penaltyText = moneyPenalty > 0
            ? `\n- ${this.formatMoney(moneyPenalty)}`
            : '';

        this.showNotification(`COLISÃO!${penaltyText}`, '#9b1c31');
        this.animateCollisionFlash();
    }

    refreshPursuit (status: PursuitStatus)
    {
        const active = status.state === 'active';
        this.dangerBorder.setVisible(active);
        this.dangerText.setVisible(active);

        if (active !== this.pursuitActive)
        {
            this.pursuitActive = active;
            this.scene.tweens.killTweensOf([this.dangerBorder, this.dangerText]);

            if (active)
            {
                this.dangerBorder.setAlpha(0.42);
                this.dangerText.setAlpha(0.72);
                this.scene.tweens.add({
                    targets: [this.dangerBorder, this.dangerText],
                    alpha: 1,
                    duration: 420,
                    ease: 'Sine.InOut',
                    yoyo: true,
                    repeat: -1
                });
            }
            else
            {
                this.dangerBorder.setAlpha(1);
                this.dangerText.setAlpha(1);
            }
        }

        if (!DEBUG_PURSUIT)
        {
            this.debugText.setVisible(false);
            return;
        }

        const distance = status.distance === null ? '--' : `${Math.round(status.distance)} px`;
        const escapeSeconds = (status.escapeTimeRemainingMs / 1000).toFixed(1);

        this.debugText
            .setText([
                `Pursuit: ${status.state}`,
                `Distância: ${distance}`,
                `Tempo para escapar: ${escapeSeconds}s`
            ])
            .setVisible(true);
    }

    private showNotification (message: string, backgroundColor: string)
    {
        this.notificationHideEvent?.remove(false);
        this.notificationHideEvent = undefined;
        this.scene.tweens.killTweensOf(this.notificationText);
        this.notificationText
            .setText(message)
            .setBackgroundColor(backgroundColor)
            .setAlpha(0)
            .setScale(0.84)
            .setVisible(true);

        this.scene.tweens.add({
            targets: this.notificationText,
            alpha: 1,
            scale: 1,
            duration: 190,
            ease: 'Back.Out',
            onComplete: () => {
                this.notificationHideEvent = this.scene.time.delayedCall(1850, () => {
                    this.scene.tweens.add({
                        targets: this.notificationText,
                        alpha: 0,
                        duration: 170,
                        onComplete: () => this.notificationText.setVisible(false)
                    });
                });
            }
        });
    }

    private animateDeliveryPulse ()
    {
        this.scene.tweens.killTweensOf(this.deliveryPulse);
        this.deliveryPulse.setVisible(true).setAlpha(0.75).setScale(0.45);
        this.scene.tweens.add({
            targets: this.deliveryPulse,
            alpha: 0,
            scale: 1.75,
            duration: 520,
            ease: 'Cubic.Out',
            onComplete: () => this.deliveryPulse.setVisible(false)
        });
    }

    private animateCollisionFlash ()
    {
        this.scene.tweens.killTweensOf(this.collisionFlash);
        this.collisionFlash.setVisible(true).setAlpha(0.18);
        this.scene.tweens.add({
            targets: this.collisionFlash,
            alpha: 0,
            duration: 180,
            ease: 'Quad.Out',
            onComplete: () => this.collisionFlash.setVisible(false)
        });
    }

    private formatMoney (value: number)
    {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
}
