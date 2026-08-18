import { GameObjects, Input, Math as PhaserMath, Scene } from 'phaser';

const JOYSTICK_RADIUS = 92;
const DEAD_ZONE_RADIUS = JOYSTICK_RADIUS * 0.2;
const DIRECTION_SECTOR_ANGLE = Math.PI / 4;
const CARDINAL_SECTOR_HALF_ANGLE = 30 * Math.PI / 180;
const DIAGONAL_SECTOR_HALF_ANGLE = 15 * Math.PI / 180;
const DIRECTION_HYSTERESIS_ANGLE = 3 * Math.PI / 180;
const TOUCH_AREA_WIDTH = 720;
const TOUCH_AREA_HEIGHT = 500;
const ACTIVE_ALPHA = 0.78;
const IDLE_ALPHA = 0.2;
const KNOB_RETURN_TIME_MS = 35;
const DIAGONAL_COMPONENT = Math.SQRT1_2;
const DIGITAL_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
    [1, 0],
    [DIAGONAL_COMPONENT, DIAGONAL_COMPONENT],
    [0, 1],
    [-DIAGONAL_COMPONENT, DIAGONAL_COMPONENT],
    [-1, 0],
    [-DIAGONAL_COMPONENT, -DIAGONAL_COMPONENT],
    [0, -1],
    [DIAGONAL_COMPONENT, -DIAGONAL_COMPONENT]
];

export class VirtualJoystick extends GameObjects.Container
{
    readonly direction = new PhaserMath.Vector2();

    private base: GameObjects.Arc;
    private knob: GameObjects.Arc;
    private inputZone: GameObjects.Zone;
    private inputPlugin: Input.InputPlugin;
    private selectedDirectionIndex: number | null = null;
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

        if (this.activePointerId === null)
        {
            const smoothing = 1 - Math.exp(-delta / KNOB_RETURN_TIME_MS);
            this.knob.x = PhaserMath.Linear(this.knob.x, 0, smoothing);
            this.knob.y = PhaserMath.Linear(this.knob.y, 0, smoothing);

            if (this.knob.x * this.knob.x + this.knob.y * this.knob.y < 0.0001)
            {
                this.knob.setPosition(0, 0);
            }
        }
    }

    cancelInput ()
    {
        this.activePointerId = null;
        this.selectedDirectionIndex = null;
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
            this.selectedDirectionIndex = null;
            this.direction.set(0, 0);
            this.setAlpha(IDLE_ALPHA);
        }
    }

    private updateDirection (pointer: Input.Pointer)
    {
        const offsetX = pointer.x - this.x;
        const offsetY = pointer.y - this.y;
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

        if (distance < DEAD_ZONE_RADIUS)
        {
            this.selectedDirectionIndex = null;
            this.direction.set(0, 0);
            this.knob.setPosition(0, 0);

            return;
        }

        const pointerAngle = Math.atan2(offsetY, offsetX);
        const nearestDirectionIndex = this.getNearestDirectionIndex(pointerAngle);

        if (this.selectedDirectionIndex === null)
        {
            this.selectedDirectionIndex = nearestDirectionIndex;
        }
        else
        {
            const selectedAngle = this.selectedDirectionIndex * DIRECTION_SECTOR_ANGLE;
            const angleDifference = Math.abs(PhaserMath.Angle.Wrap(pointerAngle - selectedAngle));
            const sectorHalfAngle = this.selectedDirectionIndex % 2 === 0
                ? CARDINAL_SECTOR_HALF_ANGLE
                : DIAGONAL_SECTOR_HALF_ANGLE;

            if (
                nearestDirectionIndex !== this.selectedDirectionIndex
                && angleDifference > sectorHalfAngle + DIRECTION_HYSTERESIS_ANGLE
            )
            {
                this.selectedDirectionIndex = nearestDirectionIndex;
            }
        }

        const [directionX, directionY] = DIGITAL_DIRECTIONS[this.selectedDirectionIndex];
        const knobDistance = Math.min(distance, JOYSTICK_RADIUS);

        this.direction.set(directionX, directionY);
        this.knob.setPosition(directionX * knobDistance, directionY * knobDistance);
    }

    private getNearestDirectionIndex (angle: number)
    {
        const cardinalIndex = Math.round(angle / (Math.PI / 2)) * 2;
        const cardinalAngle = cardinalIndex * DIRECTION_SECTOR_ANGLE;
        const distanceFromCardinal = Math.abs(PhaserMath.Angle.Wrap(angle - cardinalAngle));
        const unwrappedIndex = distanceFromCardinal <= CARDINAL_SECTOR_HALF_ANGLE
            ? cardinalIndex
            : Math.round((angle - DIRECTION_SECTOR_ANGLE) / (Math.PI / 2)) * 2 + 1;

        return (unwrappedIndex + DIGITAL_DIRECTIONS.length) % DIGITAL_DIRECTIONS.length;
    }

    private removeInputListeners ()
    {
        this.inputZone.off('pointerdown', this.handlePointerDown, this);
        this.inputPlugin.off('pointermove', this.handlePointerMove, this);
        this.inputPlugin.off('pointerup', this.handlePointerUp, this);
        this.inputPlugin.off('pointerupoutside', this.handlePointerUp, this);
    }
}
