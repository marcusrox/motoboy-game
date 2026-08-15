import { GameObjects, Scene } from 'phaser';
import { DEBUG_PURSUIT } from '../config/pursuitConfig';
import { DeliverySystem } from '../systems/DeliverySystem';
import { PursuitStatus } from '../systems/PursuitSystem';

export class HUD extends GameObjects.Container
{
    private moneyText: GameObjects.Text;
    private statusText: GameObjects.Text;
    private distanceText: GameObjects.Text;
    private valueText: GameObjects.Text;
    private notificationText: GameObjects.Text;
    private dangerBorder: GameObjects.Rectangle;
    private dangerText: GameObjects.Text;
    private debugText: GameObjects.Text;

    constructor (scene: Scene, private deliverySystem: DeliverySystem)
    {
        super(scene, 0, 0);

        const panel = scene.add.rectangle(18, 18, 684, 150, 0x111820, 0.92).setOrigin(0);
        this.moneyText = scene.add.text(38, 34, '', {
            color: '#f4d35e',
            fontFamily: 'Arial Black',
            fontSize: '30px'
        });
        this.statusText = scene.add.text(38, 76, '', {
            color: '#ffffff',
            fontFamily: 'Arial',
            fontSize: '21px'
        });
        this.distanceText = scene.add.text(38, 116, '', {
            color: '#b9d8ff',
            fontFamily: 'Arial',
            fontSize: '19px'
        });
        this.valueText = scene.add.text(660, 116, '', {
            color: '#8ee3a2',
            fontFamily: 'Arial Black',
            fontSize: '19px'
        }).setOrigin(1, 0);
        this.notificationText = scene.add.text(360, 270, '', {
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
            this.statusText,
            this.distanceText,
            this.valueText,
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

        this.moneyText.setText(`Dinheiro: ${this.formatMoney(this.deliverySystem.getMoney())}`);

        if (!delivery)
        {
            this.statusText.setText('Sem entrega — vá ao Restaurante');
            this.distanceText.setText('Distância: --');
            this.valueText.setText('Valor: --');
            return;
        }

        const approximateDistance = Math.max(0, Math.round((distance ?? 0) / 10) * 10);
        this.statusText.setText(`Entrega: ${delivery.destination.name}`);
        this.distanceText.setText(`Distância aproximada: ${approximateDistance} m`);
        this.valueText.setText(`Valor: ${this.formatMoney(delivery.reward)}`);
    }

    showSuccess (reward: number)
    {
        this.showNotification(`ENTREGA CONCLUÍDA!\n+ ${this.formatMoney(reward)}`, '#246b3d');
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
    }

    refreshPursuit (status: PursuitStatus)
    {
        const active = status.state === 'active';
        this.dangerBorder.setVisible(active);
        this.dangerText.setVisible(active);

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
        this.notificationText
            .setText(message)
            .setBackgroundColor(backgroundColor)
            .setVisible(true);

        this.scene.time.delayedCall(2200, () => this.notificationText.setVisible(false));
    }

    private formatMoney (value: number)
    {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
}
