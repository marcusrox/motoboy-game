import { GameObjects, Math as PhaserMath, Physics, Scene } from 'phaser';
import {
    TRAFFIC_ACCELERATION,
    TRAFFIC_BRAKING,
    TRAFFIC_VEHICLE_COLLIDER_INSET,
    TrafficRoute
} from '../config/trafficConfig';

const WAYPOINT_REACH_DISTANCE = 18;
const TURN_SLOWDOWN_DISTANCE = 120;
const COLLIDER_SIZE = 58;

export interface TrafficCarConfig
{
    priority: number;
    route: TrafficRoute;
    segmentIndex: number;
    segmentProgress: number;
    speed: number;
    width: number;
    length: number;
    color: number;
    turnSpeedFactor: number;
    debug: boolean;
    textureKey?: string;
}

export class TrafficCar extends GameObjects.Container
{
    private nextWaypointIndex: number;
    private direction = new PhaserMath.Vector2();
    private distanceToWaypoint = 0;
    private currentSpeed: number;
    private speedLimit: number;
    private debugCollider?: GameObjects.Rectangle;

    constructor (scene: Scene, private config: TrafficCarConfig)
    {
        const route = config.route.waypoints;
        const start = route[config.segmentIndex];
        const end = route[(config.segmentIndex + 1) % route.length];
        const x = PhaserMath.Linear(start.x, end.x, config.segmentProgress);
        const y = PhaserMath.Linear(start.y, end.y, config.segmentProgress);

        super(scene, x, y);
        this.nextWaypointIndex = (config.segmentIndex + 1) % route.length;
        this.currentSpeed = config.speed;
        this.speedLimit = config.speed;

        const car = this.createVisual(scene);

        this.add(car);
        this.setSize(config.width, config.length).setDepth(1);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(COLLIDER_SIZE, COLLIDER_SIZE);
        body.setImmovable(true);
        body.pushable = false;
        body.setAllowGravity(false);
        this.refreshDirection();
        this.rotation = Math.atan2(this.direction.y, this.direction.x) + Math.PI / 2;

        if (config.debug)
        {
            this.debugCollider = scene.add.rectangle(
                x,
                y,
                config.width - TRAFFIC_VEHICLE_COLLIDER_INSET,
                config.length - TRAFFIC_VEHICLE_COLLIDER_INSET
            )
                .setStrokeStyle(3, 0xff00ff, 0.9)
                .setDepth(60);
        }
    }

    prepareTrafficUpdate (delta: number)
    {
        this.refreshDirection();
        let waypointsVisited = 0;

        while (
            this.distanceToWaypoint <= WAYPOINT_REACH_DISTANCE + this.config.speed * delta / 1000
            && waypointsVisited < this.config.route.waypoints.length
        )
        {
            const target = this.config.route.waypoints[this.nextWaypointIndex];
            const body = this.body as Physics.Arcade.Body;
            body.reset(target.x, target.y);
            this.nextWaypointIndex = (this.nextWaypointIndex + 1) % this.config.route.waypoints.length;
            waypointsVisited += 1;
            this.refreshDirection();
        }

        this.rotation = Math.atan2(this.direction.y, this.direction.x) + Math.PI / 2;
        this.speedLimit = this.config.speed;
    }

    updateTraffic (delta: number)
    {
        const routeSpeed = this.distanceToWaypoint < TURN_SLOWDOWN_DISTANCE
            ? this.config.speed * this.config.turnSpeedFactor
            : this.config.speed;
        const targetSpeed = Math.min(routeSpeed, this.speedLimit);

        if (targetSpeed <= 0)
        {
            this.currentSpeed = 0;
        }
        else
        {
            const acceleration = targetSpeed < this.currentSpeed
                ? TRAFFIC_BRAKING
                : TRAFFIC_ACCELERATION;

            const maxChange = acceleration * delta / 1000;
            const speedChange = PhaserMath.Clamp(
                targetSpeed - this.currentSpeed,
                -maxChange,
                maxChange
            );

            this.currentSpeed += speedChange;
        }

        const body = this.body as Physics.Arcade.Body;
        body.setVelocity(this.direction.x * this.currentSpeed, this.direction.y * this.currentSpeed);
        this.debugCollider?.setPosition(this.x, this.y);
        this.debugCollider?.setRotation(this.rotation);
    }

    setTrafficSpeedLimit (speed: number)
    {
        this.speedLimit = PhaserMath.Clamp(speed, 0, this.config.speed);
    }

    getTrafficMotionState ()
    {
        return {
            priority: this.config.priority,
            x: this.x,
            y: this.y,
            width: this.config.width,
            length: this.config.length,
            rotation: this.rotation,
            directionX: this.direction.x,
            directionY: this.direction.y,
            baseSpeed: this.config.speed,
            currentSpeed: this.currentSpeed
        };
    }

    getTrafficCollisionShape ()
    {
        return {
            x: this.x,
            y: this.y,
            width: Math.max(1, this.config.width - TRAFFIC_VEHICLE_COLLIDER_INSET),
            height: Math.max(1, this.config.length - TRAFFIC_VEHICLE_COLLIDER_INSET),
            rotation: this.rotation
        };
    }

    destroy (fromScene?: boolean)
    {
        this.debugCollider?.destroy();
        this.debugCollider = undefined;
        super.destroy(fromScene);
    }

    private refreshDirection ()
    {
        const target = this.config.route.waypoints[this.nextWaypointIndex];

        this.direction.set(target.x - this.x, target.y - this.y);
        this.distanceToWaypoint = this.direction.length();

        if (this.distanceToWaypoint > 0)
        {
            this.direction.scale(1 / this.distanceToWaypoint);
        }
    }

    private createVisual (scene: Scene)
    {
        if (this.config.textureKey && scene.textures.exists(this.config.textureKey))
        {
            return scene.add.sprite(0, 0, this.config.textureKey)
                .setDisplaySize(this.config.width, this.config.length);
        }

        const placeholder = scene.add.graphics();
        placeholder.fillStyle(0x17191d);
        placeholder.fillRoundedRect(
            -this.config.width / 2,
            -this.config.length / 2,
            this.config.width,
            this.config.length,
            10
        );
        placeholder.fillStyle(this.config.color);
        placeholder.fillRoundedRect(
            -this.config.width / 2 + 5,
            -this.config.length / 2 + 8,
            this.config.width - 10,
            this.config.length - 16,
            8
        );
        placeholder.fillStyle(0xa9d6e5, 0.85);
        placeholder.fillRect(-this.config.width / 2 + 8, -this.config.length / 2 + 14, this.config.width - 16, 15);
        placeholder.fillRect(-this.config.width / 2 + 8, this.config.length / 2 - 29, this.config.width - 16, 15);
        placeholder.fillStyle(0xffe66d);
        placeholder.fillCircle(-this.config.width / 2 + 7, -this.config.length / 2 + 6, 4);
        placeholder.fillCircle(this.config.width / 2 - 7, -this.config.length / 2 + 6, 4);

        return placeholder;
    }
}
