import { GameObjects, Input, Math as PhaserMath, Scene } from 'phaser';

const JOYSTICK_RADIUS = 82;
const TOUCH_AREA_SIZE = 210;

export class VirtualJoystick extends GameObjects.Container
{
    readonly direction = new PhaserMath.Vector2();

    private knob: GameObjects.Arc;
    private inputZone: GameObjects.Zone;
    private activePointerId: number | null = null;

    constructor (scene: Scene, x: number, y: number)
    {
        super(scene, x, y);

        const base = scene.add.circle(0, 0, JOYSTICK_RADIUS, 0x111820, 0.55)
            .setStrokeStyle(4, 0xffffff, 0.5);

        this.knob = scene.add.circle(0, 0, 38, 0xf4b41a, 0.85)
            .setStrokeStyle(3, 0xffffff, 0.7);

        this.add([base, this.knob]);
        this.setScrollFactor(0).setDepth(200);
        scene.add.existing(this);

        this.inputZone = scene.add.zone(x, y, TOUCH_AREA_SIZE, TOUCH_AREA_SIZE)
            .setScrollFactor(0)
            .setDepth(201)
            .setInteractive();

        this.inputZone.on('pointerdown', this.handlePointerDown, this);
        scene.input.on('pointermove', this.handlePointerMove, this);
        scene.input.on('pointerup', this.handlePointerUp, this);
        scene.input.on('pointerupoutside', this.handlePointerUp, this);

        scene.events.once('shutdown', this.removeInputListeners, this);
    }

    private handlePointerDown (pointer: Input.Pointer)
    {
        if (this.activePointerId === null)
        {
            this.activePointerId = pointer.id;
            this.updateDirection(pointer);
        }
    }

    private handlePointerMove (pointer: Input.Pointer)
    {
        if (pointer.id === this.activePointerId)
        {
            this.updateDirection(pointer);
        }
    }

    private handlePointerUp (pointer: Input.Pointer)
    {
        if (pointer.id === this.activePointerId)
        {
            this.activePointerId = null;
            this.direction.set(0, 0);
            this.knob.setPosition(0, 0);
        }
    }

    private updateDirection (pointer: Input.Pointer)
    {
        this.direction.set(pointer.x - this.x, pointer.y - this.y);

        if (this.direction.length() > JOYSTICK_RADIUS)
        {
            this.direction.setLength(JOYSTICK_RADIUS);
        }

        this.knob.setPosition(this.direction.x, this.direction.y);
        this.direction.scale(1 / JOYSTICK_RADIUS);
    }

    private removeInputListeners ()
    {
        this.inputZone.off('pointerdown', this.handlePointerDown, this);
        this.scene.input.off('pointermove', this.handlePointerMove, this);
        this.scene.input.off('pointerup', this.handlePointerUp, this);
        this.scene.input.off('pointerupoutside', this.handlePointerUp, this);
    }
}
