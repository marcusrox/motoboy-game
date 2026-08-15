import { GameObjects, Math as PhaserMath, Physics, Scene } from 'phaser';
import { TrafficRoute } from '../config/trafficConfig';

const WAYPOINT_REACH_DISTANCE = 18;
const TURN_SLOWDOWN_DISTANCE = 120;
const COLLIDER_SIZE = 58;

export interface TrafficCarConfig
{
    route: TrafficRoute;
    segmentIndex: number;
    segmentProgress: number;
    speed: number;
    width: number;
    length: number;
    color: number;
    turnSpeedFactor: number;
    debug: boolean;
}

export class TrafficCar extends GameObjects.Container
{
    private nextWaypointIndex: number;
    private direction = new PhaserMath.Vector2();
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

        const car = scene.add.graphics();
        car.fillStyle(0x17191d);
        car.fillRoundedRect(
            -config.width / 2,
            -config.length / 2,
            config.width,
            config.length,
            10
        );
        car.fillStyle(config.color);
        car.fillRoundedRect(
            -config.width / 2 + 5,
            -config.length / 2 + 8,
            config.width - 10,
            config.length - 16,
            8
        );
        car.fillStyle(0xa9d6e5, 0.85);
        car.fillRect(-config.width / 2 + 8, -config.length / 2 + 14, config.width - 16, 15);
        car.fillRect(-config.width / 2 + 8, config.length / 2 - 29, config.width - 16, 15);
        car.fillStyle(0xffe66d);
        car.fillCircle(-config.width / 2 + 7, -config.length / 2 + 6, 4);
        car.fillCircle(config.width / 2 - 7, -config.length / 2 + 6, 4);

        this.add(car);
        this.setSize(config.width, config.length).setDepth(1);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        const body = this.body as Physics.Arcade.Body;
        body.setSize(COLLIDER_SIZE, COLLIDER_SIZE);
        body.setImmovable(true);
        body.pushable = false;
        body.setAllowGravity(false);

        if (config.debug)
        {
            this.debugCollider = scene.add.rectangle(x, y, COLLIDER_SIZE, COLLIDER_SIZE)
                .setStrokeStyle(3, 0xff00ff, 0.9)
                .setDepth(60);
        }
    }

    updateTraffic (delta: number)
    {
        const target = this.config.route.waypoints[this.nextWaypointIndex];
        this.direction.set(target.x - this.x, target.y - this.y);
        const distance = this.direction.length();

        if (distance <= WAYPOINT_REACH_DISTANCE + this.config.speed * delta / 1000)
        {
            const body = this.body as Physics.Arcade.Body;
            body.reset(target.x, target.y);
            this.nextWaypointIndex = (this.nextWaypointIndex + 1) % this.config.route.waypoints.length;
            this.updateTraffic(delta);
            return;
        }

        this.direction.normalize();
        const speed = distance < TURN_SLOWDOWN_DISTANCE
            ? this.config.speed * this.config.turnSpeedFactor
            : this.config.speed;
        const body = this.body as Physics.Arcade.Body;
        body.setVelocity(this.direction.x * speed, this.direction.y * speed);
        this.rotation = Math.atan2(this.direction.y, this.direction.x) + Math.PI / 2;
        this.debugCollider?.setPosition(this.x, this.y);
    }
}
