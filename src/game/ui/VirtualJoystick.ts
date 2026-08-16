import { GameObjects, Input, Math as PhaserMath, Scene } from 'phaser';

const JOYSTICK_RADIUS = 92;
const TOUCH_AREA_WIDTH = 720;
const TOUCH_AREA_HEIGHT = 500;
const ACTIVE_ALPHA = 0.78;
const IDLE_ALPHA = 0.2;

export class VirtualJoystick extends GameObjects.Container
{
    readonly direction = new PhaserMath.Vector2();

    private base: GameObjects.Arc;
    private knob: GameObjects.Arc;
    private inputZone: GameObjects.Zone;
    private inputPlugin: Input.InputPlugin;
    private targetDirection = new PhaserMath.Vector2();
    private targetKnobPosition = new PhaserMath.Vector2();
    private activePointerId: number | null = null;
    private enabled = true;

    constructor (scene: Scene, x: number, y: number)
    {
        super(scene, x, y);
        this.inputPlugin = scene.input;

        this.base = scene.add.circle(0, 0, JOYSTICK_RADIUS, 0x111820, 0.55)
            .setStrokeStyle(4, 0xffffff, 0.5);

        this.knob = scene.add.circle(0, 0, 42, 0xf4b41a, 0.85)
            .setStrokeStyle(3, 0xffffff, 0.7);

        this.add([this.base, this.knob]);
        this.setScrollFactor(0).setDepth(300).setAlpha(IDLE_ALPHA);
        scene.add.existing(this);

        this.inputZone = scene.add.zone(360, 1030, TOUCH_AREA_WIDTH, TOUCH_AREA_HEIGHT)
            .setScrollFactor(0)
            .setDepth(299)
            .setInteractive();

        this.inputZone.on('pointerdown', this.handlePointerDown, this);
        this.inputPlugin.on('pointermove', this.handlePointerMove, this);
        this.inputPlugin.on('pointerup', this.handlePointerUp, this);
        this.inputPlugin.on('pointerupoutside', this.handlePointerUp, this);

        scene.events.once('shutdown', this.removeInputListeners, this);
    }

    setEnabled (enabled: boolean)
    {
        this.enabled = enabled;
        this.setVisible(enabled);

        if (enabled)
        {
            this.inputZone.setInteractive();
        }
        else
        {
            this.inputZone.disableInteractive();
            this.cancelInput();
        }
    }

    update (delta: number)
    {
        if (!this.enabled)
        {
            return;
        }

        const smoothing = 1 - Math.exp(-delta / (this.activePointerId === null ? 35 : 55));
        this.direction.lerp(this.targetDirection, smoothing);
        this.targetKnobPosition.set(
            this.targetDirection.x * JOYSTICK_RADIUS,
            this.targetDirection.y * JOYSTICK_RADIUS
        );
        this.knob.x = PhaserMath.Linear(this.knob.x, this.targetKnobPosition.x, smoothing);
        this.knob.y = PhaserMath.Linear(this.knob.y, this.targetKnobPosition.y, smoothing);

        if (this.activePointerId === null && this.direction.lengthSq() < 0.0001)
        {
            this.direction.set(0, 0);
            this.knob.setPosition(0, 0);
        }
    }

    cancelInput ()
    {
        this.activePointerId = null;
        this.targetDirection.set(0, 0);
        this.direction.set(0, 0);
        this.knob.setPosition(0, 0);
        this.setAlpha(IDLE_ALPHA);
    }

    private handlePointerDown (pointer: Input.Pointer)
    {
        if (this.activePointerId === null)
        {
            this.activePointerId = pointer.id;
            this.setPosition(
                PhaserMath.Clamp(pointer.x, JOYSTICK_RADIUS + 18, 720 - JOYSTICK_RADIUS - 18),
                PhaserMath.Clamp(pointer.y, 900, 1280 - JOYSTICK_RADIUS - 28)
            );
            this.setAlpha(ACTIVE_ALPHA);
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
            this.targetDirection.set(0, 0);
            this.setAlpha(IDLE_ALPHA);
        }
    }

    private updateDirection (pointer: Input.Pointer)
    {
        this.targetDirection.set(pointer.x - this.x, pointer.y - this.y);

        if (this.targetDirection.length() > JOYSTICK_RADIUS)
        {
            this.targetDirection.setLength(JOYSTICK_RADIUS);
        }

        this.targetDirection.scale(1 / JOYSTICK_RADIUS);
    }

    private removeInputListeners ()
    {
        this.inputZone.off('pointerdown', this.handlePointerDown, this);
        this.inputPlugin.off('pointermove', this.handlePointerMove, this);
        this.inputPlugin.off('pointerup', this.handlePointerUp, this);
        this.inputPlugin.off('pointerupoutside', this.handlePointerUp, this);
    }
}
