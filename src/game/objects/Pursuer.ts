import { GameObjects, Math as PhaserMath, Physics, Scene } from 'phaser';
import { ANIMATION_KEYS, ASSET_KEYS, firstAvailableTexture } from '../config/assetManifest';
import {
    PURSUER_ACCELERATION,
    PURSUER_DRAG,
    PURSUER_MAX_SPEED
} from '../config/pursuitConfig';

const AVOIDANCE_TIME_MS = 2400;
const ROTATION_SPEED = 0.14;
const CLOSE_CONTROL_DISTANCE = 260;
const CLOSE_DRAG_MULTIPLIER = 2.4;

export interface PursuitTarget
{
    x: number;
    y: number;
}

export class Pursuer extends GameObjects.Container
{
    private desiredDirection = new PhaserMath.Vector2();
    private avoidanceDirection = new PhaserMath.Vector2();
    private avoidanceTimeRemaining = 0;
    private sprite?: GameObjects.Sprite;

    constructor (scene: Scene, x: number, y: number)
    {
        super(scene, x, y);

        const bike = this.createVisual(scene);

        this.add(bike);
        this.setSize(48, 88).setDepth(1);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(42, 74);
        body.setDrag(PURSUER_DRAG);
        body.setMaxVelocity(PURSUER_MAX_SPEED);
        body.setCollideWorldBounds(true);
    }

    chase (target: PursuitTarget, delta: number)
    {
        this.playVisualState('move');
        const body = this.body as Physics.Arcade.Body;
        this.desiredDirection.set(target.x - this.x, target.y - this.y);
        const targetDistance = this.desiredDirection.length();
        this.desiredDirection.normalize();
        this.avoidanceTimeRemaining = Math.max(0, this.avoidanceTimeRemaining - delta);
        body.setDrag(
            targetDistance < CLOSE_CONTROL_DISTANCE
                ? PURSUER_DRAG * CLOSE_DRAG_MULTIPLIER
                : PURSUER_DRAG
        );

        if (this.avoidanceTimeRemaining === 0)
        {
            this.beginObstacleCorrection(body, target);
        }

        if (this.avoidanceTimeRemaining > 0)
        {
            this.desiredDirection.lerp(this.avoidanceDirection, 0.68).normalize();
        }

        body.setAcceleration(
            this.desiredDirection.x * PURSUER_ACCELERATION,
            this.desiredDirection.y * PURSUER_ACCELERATION
        );

        if (body.velocity.lengthSq() > 100)
        {
            this.rotation = PhaserMath.Angle.RotateTo(
                this.rotation,
                Math.atan2(body.velocity.y, body.velocity.x) + Math.PI / 2,
                ROTATION_SPEED
            );
        }
    }

    showCollisionVisual ()
    {
        this.playVisualState('collision');
    }

    private createVisual (scene: Scene)
    {
        const texture = firstAvailableTexture(scene, [
            ASSET_KEYS.pursuerIdle,
            ASSET_KEYS.pursuerMove,
            ASSET_KEYS.pursuerCollision
        ]);

        if (texture)
        {
            this.sprite = scene.add.sprite(0, 0, texture).setDisplaySize(96, 96);
            this.playVisualState('idle');

            return this.sprite;
        }

        const placeholder = scene.add.graphics();
        placeholder.fillStyle(0x17191c);
        placeholder.fillRoundedRect(-12, -36, 24, 72, 9);
        placeholder.fillStyle(0x9b1c31);
        placeholder.fillRoundedRect(-19, -24, 38, 48, 11);
        placeholder.fillTriangle(0, -44, -14, -20, 14, -20);
        placeholder.fillStyle(0x20252a);
        placeholder.fillCircle(0, 5, 14);
        placeholder.lineStyle(5, 0xff5d73);
        placeholder.lineBetween(-25, -26, 25, -26);

        return placeholder;
    }

    private playVisualState (state: 'idle' | 'move' | 'collision')
    {
        if (!this.sprite)
        {
            return;
        }

        const animationByState = {
            idle: ANIMATION_KEYS.pursuerIdle,
            move: ANIMATION_KEYS.pursuerMove,
            collision: ANIMATION_KEYS.pursuerCollision
        };
        const textureByState = {
            idle: ASSET_KEYS.pursuerIdle,
            move: ASSET_KEYS.pursuerMove,
            collision: ASSET_KEYS.pursuerCollision
        };
        const animation = animationByState[state];
        const texture = textureByState[state];

        if (this.scene.anims.exists(animation))
        {
            this.sprite.play(animation, true);
        }
        else if (this.scene.textures.exists(texture) && this.sprite.texture.key !== texture)
        {
            this.sprite.setTexture(texture, 0);
        }
    }

    private beginObstacleCorrection (body: Physics.Arcade.Body, target: PursuitTarget)
    {
        if (body.blocked.left || body.blocked.right)
        {
            const verticalDirection = Math.sign(target.y - this.y) || 1;
            this.avoidanceDirection.set(0, verticalDirection);
            this.avoidanceTimeRemaining = AVOIDANCE_TIME_MS;
        }
        else if (body.blocked.up || body.blocked.down)
        {
            const horizontalDirection = Math.sign(target.x - this.x) || 1;
            this.avoidanceDirection.set(horizontalDirection, 0);
            this.avoidanceTimeRemaining = AVOIDANCE_TIME_MS;
        }
    }
}
