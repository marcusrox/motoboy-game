import { Input, Math as PhaserMath, Scene, Types } from 'phaser';
import { Motoboy } from '../objects/Motoboy';
import { DeliverySystem } from '../systems/DeliverySystem';
import { PursuitSystem } from '../systems/PursuitSystem';
import { HUD } from '../ui/HUD';
import { VirtualJoystick } from '../ui/VirtualJoystick';

const WORLD_WIDTH = 2160;
const WORLD_HEIGHT = 3840;

export class GameScene extends Scene
{
    private deliverySystem!: DeliverySystem;
    private pursuitSystem!: PursuitSystem;
    private motoboy!: Motoboy;
    private joystick!: VirtualJoystick;
    private cursors!: Types.Input.Keyboard.CursorKeys;
    private wasd!: Record<'up' | 'down' | 'left' | 'right', Input.Keyboard.Key>;
    private movement = new PhaserMath.Vector2();

    constructor ()
    {
        super('GameScene');
    }

    create ()
    {
        const { height, width } = this.cameras.main;

        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.createPlaceholderCity();

        this.motoboy = new Motoboy(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        this.cameras.main.startFollow(this.motoboy, true, 0.12, 0.12);

        this.deliverySystem = new DeliverySystem();
        this.pursuitSystem = new PursuitSystem();
        new HUD(this, this.deliverySystem, this.pursuitSystem);
        this.joystick = new VirtualJoystick(this, 130, height - 150);

        this.add.text(width - 24, height - 42, 'WASD / SETAS', {
            color: '#ffffff',
            fontFamily: 'Arial',
            fontSize: '20px'
        }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);

        const keyboard = this.input.keyboard;

        if (!keyboard)
        {
            throw new Error('Teclado não disponível');
        }

        this.cursors = keyboard.createCursorKeys();
        this.wasd = {
            up: keyboard.addKey(Input.Keyboard.KeyCodes.W),
            down: keyboard.addKey(Input.Keyboard.KeyCodes.S),
            left: keyboard.addKey(Input.Keyboard.KeyCodes.A),
            right: keyboard.addKey(Input.Keyboard.KeyCodes.D)
        };
    }

    update ()
    {
        const touch = this.joystick.direction;
        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;

        this.movement.set(
            touch.x + Number(right) - Number(left),
            touch.y + Number(down) - Number(up)
        );

        if (this.movement.lengthSq() > 1)
        {
            this.movement.normalize();
        }

        this.motoboy.drive(this.movement);
    }

    private createPlaceholderCity ()
    {
        const graphics = this.add.graphics();

        graphics.fillStyle(0x61735f);
        graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        for (let x = 240; x < WORLD_WIDTH; x += 480)
        {
            graphics.fillStyle(0x30373d);
            graphics.fillRect(x - 90, 0, 180, WORLD_HEIGHT);
            graphics.lineStyle(5, 0xf4d35e, 0.7);

            for (let y = 20; y < WORLD_HEIGHT; y += 90)
            {
                graphics.lineBetween(x, y, x, y + 45);
            }
        }

        for (let y = 320; y < WORLD_HEIGHT; y += 640)
        {
            graphics.fillStyle(0x30373d);
            graphics.fillRect(0, y - 90, WORLD_WIDTH, 180);
            graphics.lineStyle(5, 0xf4d35e, 0.7);

            for (let x = 20; x < WORLD_WIDTH; x += 90)
            {
                graphics.lineBetween(x, y, x + 45, y);
            }
        }
    }
}
