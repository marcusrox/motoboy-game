import { GameObjects, Scene } from 'phaser';
import { DeliverySystem } from '../systems/DeliverySystem';
import { PursuitSystem } from '../systems/PursuitSystem';

export class HUD extends GameObjects.Container
{
    constructor (
        scene: Scene,
        deliverySystem: DeliverySystem,
        pursuitSystem: PursuitSystem
    )
    {
        super(scene, 0, 0);

        const panel = scene.add.rectangle(18, 18, 684, 100, 0x111820, 0.9).setOrigin(0);
        const money = scene.add.text(38, 34, 'R$ 0', {
            color: '#f4d35e',
            fontFamily: 'Arial Black',
            fontSize: '30px'
        });
        const status = scene.add.text(
            38,
            76,
            deliverySystem.getCurrentDelivery() ? 'Entrega ativa' : 'Sem entrega',
            { color: '#ffffff', fontFamily: 'Arial', fontSize: '20px' }
        );
        const pursuit = scene.add.text(
            570,
            76,
            pursuitSystem.isActive() ? 'PERSEGUIÇÃO' : 'SEGURO',
            { color: '#8ee3a2', fontFamily: 'Arial', fontSize: '18px' }
        );

        this.add([panel, money, status, pursuit]);
        this.setScrollFactor(0).setDepth(100);
        scene.add.existing(this);
    }
}
