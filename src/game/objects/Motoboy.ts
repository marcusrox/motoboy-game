import { GameObjects, Math as PhaserMath, Physics, Scene } from 'phaser';

const ACCELERATION = 900;
const MOVING_DRAG = 140;
const BRAKING_DRAG = 620;
const MAX_SPEED = 430;
const ROTATION_SPEED_THRESHOLD = 12;

export class Motoboy extends GameObjects.Container
{
    constructor (scene: Scene, x: number, y: number)
    {
        super(scene, x, y);

        const bike = scene.add.graphics();
        bike.fillStyle(0x15191d);
        bike.fillRoundedRect(-12, -38, 24, 76, 10);
        bike.fillStyle(0xf4b41a);
        bike.fillRoundedRect(-19, -25, 38, 50, 12);
        bike.fillTriangle(0, -45, -14, -21, 14, -21);
        bike.fillStyle(0xe63946);
        bike.fillCircle(0, 5, 15);
        bike.lineStyle(5, 0xe8edf2);
        bike.lineBetween(-26, -27, 26, -27);

        this.add(bike);
        this.setSize(48, 90);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(42, 76);
        body.setMaxVelocity(MAX_SPEED);
        body.setCollideWorldBounds(true);
    }

    drive (direction: PhaserMath.Vector2)
    {
        const body = this.body as Physics.Arcade.Body;

        if (direction.lengthSq() > 0)
        {
            body.setAcceleration(direction.x * ACCELERATION, direction.y * ACCELERATION);
            body.setDrag(MOVING_DRAG);
        }
        else
        {
            body.setAcceleration(0);
            body.setDrag(BRAKING_DRAG);
        }

        if (body.velocity.length() > ROTATION_SPEED_THRESHOLD)
        {
            this.rotation = PhaserMath.Angle.RotateTo(
                this.rotation,
                Math.atan2(body.velocity.y, body.velocity.x) + Math.PI / 2,
                0.12
            );
        }
    }
}
