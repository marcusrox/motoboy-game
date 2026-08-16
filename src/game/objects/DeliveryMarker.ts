import { GameObjects, Scene } from 'phaser';
import { ASSET_KEYS } from '../config/assetManifest';

export class DeliveryMarker extends GameObjects.Container
{
    private ring: GameObjects.Arc;
    private label: GameObjects.Text;
    private pickupLabel: GameObjects.Text;

    constructor (
        scene: Scene,
        x: number,
        y: number,
        label: string,
        color: number,
        highlighted = false
    )
    {
        super(scene, x, y);

        this.ring = scene.add.circle(0, 0, 48, color, 0.22)
            .setStrokeStyle(8, color, 0.95);
        const center = scene.textures.exists(ASSET_KEYS.deliveryMarker)
            ? scene.add.image(0, 0, ASSET_KEYS.deliveryMarker).setDisplaySize(46, 46)
            : scene.add.circle(0, 0, 16, color, 1);
        this.label = scene.add.text(0, -68, label, {
            align: 'center',
            backgroundColor: '#111820',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '22px',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5);
        this.pickupLabel = scene.add.text(0, -112, 'PEDIDO RETIRADO!', {
            align: 'center',
            backgroundColor: '#f4b41a',
            color: '#17212b',
            fontFamily: 'Arial Black',
            fontSize: '19px',
            padding: { x: 12, y: 7 }
        }).setOrigin(0.5).setVisible(false);

        this.add([this.ring, center, this.label, this.pickupLabel]);
        this.setDepth(20);
        scene.add.existing(this);
        this.setHighlighted(highlighted);
    }

    setHighlighted (highlighted: boolean)
    {
        this.setAlpha(highlighted ? 1 : 0.35);
        this.setScale(highlighted ? 1.15 : 0.75);
        this.label.setVisible(highlighted);
        this.ring.setStrokeStyle(highlighted ? 10 : 5, this.ring.fillColor, 1);
    }

    showPickupAttention ()
    {
        this.scene.tweens.killTweensOf(this.ring);
        this.scene.tweens.killTweensOf(this.pickupLabel);
        this.ring.setScale(1).setAlpha(1);
        this.pickupLabel.setPosition(0, -112).setAlpha(1).setVisible(true);

        this.scene.tweens.add({
            targets: this.ring,
            scale: 1.45,
            alpha: 0.45,
            duration: 240,
            ease: 'Sine.Out',
            yoyo: true,
            repeat: 2,
            onComplete: () => this.ring.setScale(1).setAlpha(1)
        });
        this.scene.tweens.add({
            targets: this.pickupLabel,
            y: -145,
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.Out',
            onComplete: () => this.pickupLabel.setVisible(false)
        });
    }
}
