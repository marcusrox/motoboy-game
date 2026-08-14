import { GameObjects, Scene } from 'phaser';
import { DeliverySystem } from '../systems/DeliverySystem';

export class HUD extends GameObjects.Container
{
    private moneyText: GameObjects.Text;
    private statusText: GameObjects.Text;
    private distanceText: GameObjects.Text;
    private valueText: GameObjects.Text;
    private successText: GameObjects.Text;

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
        this.successText = scene.add.text(360, 220, '', {
            align: 'center',
            backgroundColor: '#246b3d',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '28px',
            padding: { x: 22, y: 14 }
        }).setOrigin(0.5).setVisible(false);

        this.add([
            panel,
            this.moneyText,
            this.statusText,
            this.distanceText,
            this.valueText,
            this.successText
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
        this.successText
            .setText(`ENTREGA CONCLUÍDA!\n+ ${this.formatMoney(reward)}`)
            .setVisible(true);

        this.scene.time.delayedCall(2200, () => this.successText.setVisible(false));
    }

    private formatMoney (value: number)
    {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
}
