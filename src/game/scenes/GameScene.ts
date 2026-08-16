import { Input, Math as PhaserMath, Physics, Scene, Types } from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/cityMapConfig';
import { DeliveryMarker } from '../objects/DeliveryMarker';
import { Motoboy } from '../objects/Motoboy';
import { DeliveryPoint, DeliverySystem } from '../systems/DeliverySystem';
import { GameStatsSystem } from '../systems/GameStatsSystem';
import { ProgressPersistence } from '../systems/ProgressPersistence';
import { PursuitSystem, SpawnPoint } from '../systems/PursuitSystem';
import { TrafficSystem } from '../systems/TrafficSystem';
import { UrbanMapSystem } from '../systems/UrbanMapSystem';
import { GameOverOverlay } from '../ui/GameOverOverlay';
import { HUD } from '../ui/HUD';
import { MobileScreenUI } from '../ui/MobileScreenUI';
import { VirtualJoystick } from '../ui/VirtualJoystick';

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
const PURSUIT_SPAWN_POINTS: SpawnPoint[] = [
    { x: 1200, y: 90 },
    { x: 1200, y: 3110 },
    { x: 460, y: 90 },
    { x: 460, y: 3110 },
    { x: 2070, y: 90 },
    { x: 2070, y: 3110 },
    { x: 90, y: 920 },
    { x: 2310, y: 920 },
    { x: 90, y: 1920 },
    { x: 2310, y: 1920 },
    { x: 90, y: 2730 },
    { x: 2310, y: 2730 }
];

export class GameScene extends Scene
{
    private deliverySystem!: DeliverySystem;
    private statsSystem!: GameStatsSystem;
    private persistence = new ProgressPersistence();
    private pursuitSystem!: PursuitSystem;
    private trafficSystem!: TrafficSystem;
    private destinationMarkers = new Map<string, DeliveryMarker>();
    private restaurantMarker!: DeliveryMarker;
    private hud!: HUD;
    private motoboy!: Motoboy;
    private obstacles!: Physics.Arcade.StaticGroup;
    private joystick!: VirtualJoystick;
    private cursors?: Types.Input.Keyboard.CursorKeys;
    private wasd?: Record<'up' | 'down' | 'left' | 'right', Input.Keyboard.Key>;
    private movement = new PhaserMath.Vector2();
    private gameOver = false;

    constructor ()
    {
        super('GameScene');
    }

    create ()
    {
        const { height, width } = this.cameras.main;

        this.gameOver = false;
        this.movement.set(0, 0);
        this.destinationMarkers.clear();

        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.obstacles = this.physics.add.staticGroup();
        new UrbanMapSystem(this, this.obstacles).build();
        this.deliverySystem = new DeliverySystem(RESTAURANT, DELIVERY_DESTINATIONS);
        this.createDeliveryMarkers();

        this.motoboy = new Motoboy(this, 1200, 1500);
        this.statsSystem = new GameStatsSystem(this.motoboy.x, this.motoboy.y);
        this.physics.add.collider(this.motoboy, this.obstacles);
        this.cameras.main.startFollow(this.motoboy, true, 0.12, 0.12);

        this.hud = new HUD(this, this.deliverySystem, this.statsSystem);
        this.trafficSystem = new TrafficSystem(
            this,
            this.motoboy,
            {
                onPlayerCollision: (moneyPenalty) => {
                    const appliedPenalty = this.deliverySystem.applyMoneyPenalty(moneyPenalty);
                    this.statsSystem.recordTrafficCollision();
                    this.hud.showTrafficCollision(appliedPenalty);
                }
            }
        );
        this.pursuitSystem = new PursuitSystem(
            this,
            this.motoboy,
            this.obstacles,
            this.trafficSystem.getVehicleGroup(),
            this.cameras.main,
            PURSUIT_SPAWN_POINTS,
            {
                onStarted: () => {
                    this.statsSystem.recordPursuitStarted();
                    this.hud.refreshPursuit(this.pursuitSystem.getStatus());
                },
                onEscaped: () => {
                    this.statsSystem.recordPursuitEscaped();
                    this.hud.showEscaped();
                },
                onCaught: () => this.handleGameOver()
            }
        );
        this.joystick = new VirtualJoystick(this, 130, height - 150);
        new MobileScreenUI(this);

        if (!window.matchMedia('(pointer: coarse)').matches)
        {
            this.add.text(width - 24, height - 42, 'WASD / SETAS', {
                color: '#ffffff',
                fontFamily: 'Arial',
                fontSize: '20px'
            }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(100);
        }

        const keyboard = this.input.keyboard;

        if (keyboard)
        {
            this.cursors = keyboard.createCursorKeys();
            this.wasd = {
                up: keyboard.addKey(Input.Keyboard.KeyCodes.W),
                down: keyboard.addKey(Input.Keyboard.KeyCodes.S),
                left: keyboard.addKey(Input.Keyboard.KeyCodes.A),
                right: keyboard.addKey(Input.Keyboard.KeyCodes.D)
            };
        }

        this.game.events.on('blur', this.handleFocusLoss, this);
        this.game.events.on('pause', this.handleFocusLoss, this);
        this.events.once('shutdown', () => {
            this.game.events.off('blur', this.handleFocusLoss, this);
            this.game.events.off('pause', this.handleFocusLoss, this);
        });
    }

    update (_time: number, delta: number)
    {
        if (this.gameOver)
        {
            return;
        }

        const touch = this.joystick.direction;
        const left = Boolean(this.cursors?.left.isDown || this.wasd?.left.isDown);
        const right = Boolean(this.cursors?.right.isDown || this.wasd?.right.isDown);
        const up = Boolean(this.cursors?.up.isDown || this.wasd?.up.isDown);
        const down = Boolean(this.cursors?.down.isDown || this.wasd?.down.isDown);

        this.joystick.update(delta);

        this.movement.set(
            touch.x + Number(right) - Number(left),
            touch.y + Number(down) - Number(up)
        );

        if (this.movement.lengthSq() > 1)
        {
            this.movement.normalize();
        }

        this.motoboy.drive(this.movement);
        this.trafficSystem.update(delta);
        this.statsSystem.update(delta, this.motoboy.x, this.motoboy.y);
        this.updateDeliveryLoop();
        this.pursuitSystem.update(delta);
        this.hud.refreshPursuit(this.pursuitSystem.getStatus());
    }

    private handleFocusLoss ()
    {
        this.joystick.cancelInput();
        this.movement.set(0, 0);
        this.motoboy.drive(this.movement);
    }

    private createDeliveryMarkers ()
    {
        this.restaurantMarker = new DeliveryMarker(
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
            const stats = this.statsSystem.getSnapshot();
            const newDelivery = this.deliverySystem.tryStartDelivery(
                this.motoboy.x,
                this.motoboy.y,
                stats.elapsedTimeMs,
                stats.trafficCollisions
            );

            if (newDelivery)
            {
                this.restaurantMarker.showPickupAttention();
                this.motoboy.setCarryingDelivery(true);
                this.destinationMarkers.get(newDelivery.destination.id)?.setHighlighted(true);
                this.pursuitSystem.considerStarting(
                    this.deliverySystem.getCompletedDeliveries()
                );
            }
        }
        else
        {
            const stats = this.statsSystem.getSnapshot();
            const completedDelivery = this.deliverySystem.tryCompleteDelivery(
                this.motoboy.x,
                this.motoboy.y,
                stats.elapsedTimeMs,
                stats.trafficCollisions
            );

            if (completedDelivery)
            {
                this.motoboy.setCarryingDelivery(false);
                this.destinationMarkers.get(completedDelivery.destination.id)?.setHighlighted(false);
                this.statsSystem.recordDelivery(completedDelivery);
                this.hud.showSuccess(completedDelivery);
            }
        }

        this.hud.refresh(
            this.deliverySystem.getDistanceToDestination(this.motoboy.x, this.motoboy.y)
        );
    }

    private handleGameOver ()
    {
        if (this.gameOver)
        {
            return;
        }

        this.gameOver = true;
        this.motoboy.drive(new PhaserMath.Vector2());
        this.physics.pause();
        this.joystick.setEnabled(false);
        const stats = this.statsSystem.getSnapshot();
        const money = this.deliverySystem.getMoney();
        const recordUpdate = this.persistence.update(stats.score, stats.deliveries, money);

        new GameOverOverlay(
            this,
            {
                completedDeliveries: stats.deliveries,
                money,
                score: stats.score,
                highScore: recordUpdate.records.highScore,
                distanceTraveled: stats.distanceTraveled,
                pursuitsEscaped: stats.pursuitsEscaped,
                newHighScore: recordUpdate.newHighScore
            },
            () => this.scene.restart()
        );
    }

}
