import { GameObjects, Input, Math as PhaserMath, Physics, Scene, Types } from 'phaser';
import { DeliveryMarker } from '../objects/DeliveryMarker';
import { Motoboy } from '../objects/Motoboy';
import { DeliveryPoint, DeliverySystem } from '../systems/DeliverySystem';
import { HUD } from '../ui/HUD';
import { VirtualJoystick } from '../ui/VirtualJoystick';

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 3200;
const RESTAURANT: DeliveryPoint = {
    id: 'restaurant',
    name: 'Restaurante',
    x: 1200,
    y: 430
};
const DELIVERY_DESTINATIONS: DeliveryPoint[] = [
    { id: 'north-west', name: 'Cliente Norte', x: 460, y: 920 },
    { id: 'north-east', name: 'Cliente Leste', x: 2070, y: 920 },
    { id: 'central', name: 'Cliente Centro', x: 1200, y: 1920 },
    { id: 'plaza', name: 'Cliente da Praça', x: 1700, y: 2290 },
    { id: 'south-west', name: 'Cliente Sul', x: 460, y: 2730 }
];

interface CityBlock
{
    x: number;
    y: number;
    width: number;
    height: number;
    color?: number;
}

export class GameScene extends Scene
{
    private deliverySystem!: DeliverySystem;
    private destinationMarkers = new Map<string, DeliveryMarker>();
    private hud!: HUD;
    private motoboy!: Motoboy;
    private obstacles!: Physics.Arcade.StaticGroup;
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
        this.obstacles = this.physics.add.staticGroup();
        this.createUrbanTestField();
        this.deliverySystem = new DeliverySystem(RESTAURANT, DELIVERY_DESTINATIONS);
        this.createDeliveryMarkers();

        this.motoboy = new Motoboy(this, 1200, 1500);
        this.physics.add.collider(this.motoboy, this.obstacles);
        this.cameras.main.startFollow(this.motoboy, true, 0.12, 0.12);

        this.hud = new HUD(this, this.deliverySystem);
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
        this.updateDeliveryLoop();
    }

    private createDeliveryMarkers ()
    {
        new DeliveryMarker(
            this,
            RESTAURANT.x,
            RESTAURANT.y,
            RESTAURANT.name,
            0xf28c28,
            true
        );

        DELIVERY_DESTINATIONS.forEach((destination) => {
            const marker = new DeliveryMarker(
                this,
                destination.x,
                destination.y,
                destination.name,
                0x43c6e8
            );

            this.destinationMarkers.set(destination.id, marker);
        });
    }

    private updateDeliveryLoop ()
    {
        const currentDelivery = this.deliverySystem.getCurrentDelivery();

        if (!currentDelivery)
        {
            const newDelivery = this.deliverySystem.tryStartDelivery(this.motoboy.x, this.motoboy.y);

            if (newDelivery)
            {
                this.destinationMarkers.get(newDelivery.destination.id)?.setHighlighted(true);
            }
        }
        else
        {
            const completedDelivery = this.deliverySystem.tryCompleteDelivery(
                this.motoboy.x,
                this.motoboy.y
            );

            if (completedDelivery)
            {
                this.destinationMarkers.get(completedDelivery.destination.id)?.setHighlighted(false);
                this.hud.showSuccess(completedDelivery.reward);
            }
        }

        this.hud.refresh(
            this.deliverySystem.getDistanceToDestination(this.motoboy.x, this.motoboy.y)
        );
    }

    private createUrbanTestField ()
    {
        const graphics = this.add.graphics();

        graphics.fillStyle(0xb7b2a6);
        graphics.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        this.drawRoad(graphics, 380, 0, 160, WORLD_HEIGHT, false);
        this.drawRoad(graphics, 1040, 0, 320, WORLD_HEIGHT, true);
        this.drawRoad(graphics, 2000, 0, 140, WORLD_HEIGHT, false);
        this.drawRoad(graphics, 0, 760, WORLD_WIDTH, 320, true);
        this.drawRoad(graphics, 0, 1840, WORLD_WIDTH, 160, false);
        this.drawRoad(graphics, 0, 2580, WORLD_WIDTH, 300, true);

        const blocks: CityBlock[] = [
            { x: 30, y: 30, width: 310, height: 690, color: 0x8e5f48 },
            { x: 580, y: 40, width: 420, height: 670, color: 0x586f7c },
            { x: 1400, y: 35, width: 560, height: 680, color: 0x766b55 },
            { x: 2180, y: 35, width: 185, height: 680, color: 0x8a665c },
            { x: 30, y: 1120, width: 310, height: 680, color: 0x596c68 },
            { x: 580, y: 1120, width: 190, height: 680, color: 0x8a6d52 },
            { x: 850, y: 1120, width: 150, height: 680, color: 0x586f7c },
            { x: 1400, y: 1120, width: 560, height: 680, color: 0x806052 },
            { x: 2180, y: 1120, width: 185, height: 680, color: 0x65756a },
            { x: 30, y: 2040, width: 310, height: 500, color: 0x705d68 },
            { x: 580, y: 2040, width: 420, height: 500, color: 0x5c6e78 },
            { x: 2180, y: 2040, width: 185, height: 500, color: 0x846554 },
            { x: 30, y: 2920, width: 310, height: 245, color: 0x596c68 },
            { x: 580, y: 2920, width: 420, height: 245, color: 0x806052 },
            { x: 1400, y: 2920, width: 560, height: 245, color: 0x586f7c },
            { x: 2180, y: 2920, width: 185, height: 245, color: 0x766b55 }
        ];

        blocks.forEach((block) => this.createBuilding(block));
        this.createAlley(graphics);
        this.createOpenArea(graphics);
        this.drawCrosswalks(graphics);
    }

    private drawRoad (
        graphics: GameObjects.Graphics,
        x: number,
        y: number,
        width: number,
        height: number,
        wide: boolean
    )
    {
        graphics.fillStyle(wide ? 0x30373d : 0x384047);
        graphics.fillRect(x, y, width, height);
        graphics.lineStyle(wide ? 6 : 4, 0xe7c85a, 0.75);

        if (height > width)
        {
            const centerX = x + width / 2;

            for (let markerY = 25; markerY < y + height; markerY += 110)
            {
                graphics.lineBetween(centerX, markerY, centerX, markerY + 55);
            }
        }
        else
        {
            const centerY = y + height / 2;

            for (let markerX = 25; markerX < x + width; markerX += 110)
            {
                graphics.lineBetween(markerX, centerY, markerX + 55, centerY);
            }
        }
    }

    private createBuilding ({ x, y, width, height, color = 0x6f665e }: CityBlock)
    {
        const sidewalk = this.add.rectangle(
            x + width / 2,
            y + height / 2,
            width,
            height,
            0xc8c3b8
        ).setStrokeStyle(5, 0xe2ded5);

        const inset = Math.min(34, width * 0.12, height * 0.12);
        const building = this.add.rectangle(
            x + width / 2,
            y + height / 2,
            width - inset * 2,
            height - inset * 2,
            color
        ).setStrokeStyle(8, 0x383532);

        const roof = this.add.rectangle(
            x + width / 2,
            y + height / 2,
            Math.max(24, width - inset * 2 - 30),
            Math.max(24, height - inset * 2 - 30),
            0xffffff,
            0.07
        );

        sidewalk.setDepth(0);
        building.setDepth(2);
        roof.setDepth(3);
        this.obstacles.add(building);
    }

    private createAlley (graphics: GameObjects.Graphics)
    {
        graphics.fillStyle(0x4a4d4e);
        graphics.fillRect(770, 1120, 80, 680);
        graphics.lineStyle(3, 0x777b79, 0.8);

        for (let y = 1150; y < 1800; y += 70)
        {
            graphics.lineBetween(783, y, 837, y);
        }
    }

    private createOpenArea (graphics: GameObjects.Graphics)
    {
        graphics.fillStyle(0x9e9a8f);
        graphics.fillRect(1400, 2040, 560, 500);
        graphics.lineStyle(3, 0xb8b4aa, 0.8);

        for (let x = 1420; x < 1960; x += 70)
        {
            graphics.lineBetween(x, 2040, x, 2540);
        }

        for (let y = 2060; y < 2540; y += 70)
        {
            graphics.lineBetween(1400, y, 1960, y);
        }

        this.createBarrier(1460, 2120, 150, 55);
        this.createBarrier(1810, 2120, 90, 55);
        this.createBarrier(1540, 2435, 85, 85);
        this.createBarrier(1835, 2400, 150, 55);
    }

    private createBarrier (x: number, y: number, width: number, height: number)
    {
        const barrier = this.add.rectangle(x, y, width, height, 0x466646)
            .setStrokeStyle(7, 0x745b3d)
            .setDepth(2);

        this.obstacles.add(barrier);
    }

    private drawCrosswalks (graphics: GameObjects.Graphics)
    {
        graphics.fillStyle(0xe6e3d8, 0.75);

        for (let x = 1060; x < 1360; x += 38)
        {
            graphics.fillRect(x, 785, 22, 70);
            graphics.fillRect(x, 985, 22, 70);
            graphics.fillRect(x, 1860, 22, 55);
            graphics.fillRect(x, 1925, 22, 55);
        }
    }
}
