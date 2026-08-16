import { GameObjects, Math as PhaserMath, Physics, Scene } from 'phaser';
import { ANIMATION_KEYS, ASSET_KEYS, firstAvailableTexture } from '../config/assetManifest';

const ACCELERATION = 900;
const MOVING_DRAG = 140;
const BRAKING_DRAG = 620;
const MAX_SPEED = 430;
const ROTATION_SPEED_THRESHOLD = 12;
const TURN_ACCELERATION_MULTIPLIER = 1.25;
const TURN_ALIGNMENT_THRESHOLD = 0.85;
const VISUAL_ROTATION_SPEED = 0.16;

export class Motoboy extends GameObjects.Container
{
    private cargoIndicator: GameObjects.Container;
    private sprite?: GameObjects.Sprite;
    private collisionVisualUntil = 0;

    constructor (scene: Scene, x: number, y: number)
    {
        super(scene, x, y);

        const bike = this.createVisual(scene);

        const cargoBox = scene.add.graphics();
        cargoBox.fillStyle(0xffc43d);
        cargoBox.fillRoundedRect(-14, 12, 28, 25, 5);
        cargoBox.lineStyle(3, 0xffffff, 0.95);
        cargoBox.strokeRoundedRect(-14, 12, 28, 25, 5);
        cargoBox.lineStyle(3, 0x8c5a10, 1);
        cargoBox.lineBetween(-14, 23, 14, 23);
        cargoBox.lineBetween(0, 12, 0, 37);

        this.cargoIndicator = scene.add.container(0, 0, [cargoBox]).setVisible(false);

        this.add([bike, this.cargoIndicator]);
        this.setSize(48, 90).setDepth(1);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(42, 76);
        body.setMaxVelocity(MAX_SPEED);
        body.setCollideWorldBounds(true);
    }

    showCollisionVisual ()
    {
        this.collisionVisualUntil = this.scene.time.now + 350;
        this.playVisualState('collision');
    }

    setCarryingDelivery (carrying: boolean)
    {
        this.scene.tweens.killTweensOf(this.cargoIndicator);
        this.cargoIndicator.setVisible(carrying).setAlpha(1).setScale(1);

        if (carrying)
        {
            this.scene.tweens.add({
                targets: this.cargoIndicator,
                alpha: { from: 0.45, to: 1 },
                scale: { from: 0.82, to: 1.12 },
                duration: 180,
                ease: 'Sine.Out',
                yoyo: true,
                repeat: 2,
                onComplete: () => this.cargoIndicator.setAlpha(1).setScale(1)
            });
        }
    }

    getSpeedRatio ()
    {
        const body = this.body as Physics.Arcade.Body;

        return PhaserMath.Clamp(body.velocity.length() / MAX_SPEED, 0, 1);
    }

    drive (direction: PhaserMath.Vector2)
    {
        const body = this.body as Physics.Arcade.Body;
        let turning = false;

        if (direction.lengthSq() > 0)
        {
            const speed = body.velocity.length();
            const alignment = speed > ROTATION_SPEED_THRESHOLD
                ? body.velocity.dot(direction) / speed
                : 1;
            const acceleration = alignment < TURN_ALIGNMENT_THRESHOLD
                ? ACCELERATION * TURN_ACCELERATION_MULTIPLIER
                : ACCELERATION;
            turning = alignment < TURN_ALIGNMENT_THRESHOLD;

            body.setAcceleration(direction.x * acceleration, direction.y * acceleration);
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
                VISUAL_ROTATION_SPEED
            );
        }

        if (this.scene.time.now >= this.collisionVisualUntil)
        {
            const moving = direction.lengthSq() > 0 || body.velocity.length() > ROTATION_SPEED_THRESHOLD;

            this.playVisualState(!moving ? 'idle' : turning ? 'turn' : 'move');
        }
    }

    private createVisual (scene: Scene)
    {
        const texture = firstAvailableTexture(scene, [
            ASSET_KEYS.playerIdle,
            ASSET_KEYS.playerMove,
            ASSET_KEYS.playerTurn,
            ASSET_KEYS.playerCollision
        ]);

        if (texture)
        {
            this.sprite = scene.add.sprite(0, 0, texture).setDisplaySize(96, 96);
            this.playVisualState('idle');

            return this.sprite;
        }

        const placeholder = scene.add.graphics();
        placeholder.fillStyle(0x15191d);
        placeholder.fillRoundedRect(-12, -38, 24, 76, 10);
        placeholder.fillStyle(0xf4b41a);
        placeholder.fillRoundedRect(-19, -25, 38, 50, 12);
        placeholder.fillTriangle(0, -45, -14, -21, 14, -21);
        placeholder.fillStyle(0xe63946);
        placeholder.fillCircle(0, 5, 15);
        placeholder.lineStyle(5, 0xe8edf2);
        placeholder.lineBetween(-26, -27, 26, -27);

        return placeholder;
    }

    private playVisualState (state: 'idle' | 'move' | 'turn' | 'collision')
    {
        if (!this.sprite)
        {
            return;
        }

        const animationByState = {
            idle: ANIMATION_KEYS.playerIdle,
            move: ANIMATION_KEYS.playerMove,
            turn: ANIMATION_KEYS.playerTurn,
            collision: ANIMATION_KEYS.playerCollision
        };
        const textureByState = {
            idle: ASSET_KEYS.playerIdle,
            move: ASSET_KEYS.playerMove,
            turn: ASSET_KEYS.playerTurn,
            collision: ASSET_KEYS.playerCollision
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
}
