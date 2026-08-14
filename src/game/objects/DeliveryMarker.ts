import { GameObjects, Scene } from 'phaser';

export class DeliveryMarker extends GameObjects.Container
{
    private ring: GameObjects.Arc;
    private label: GameObjects.Text;

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
        const center = scene.add.circle(0, 0, 16, color, 1);
        this.label = scene.add.text(0, -68, label, {
            align: 'center',
            backgroundColor: '#111820',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '22px',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5);

        this.add([this.ring, center, this.label]);
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
}
