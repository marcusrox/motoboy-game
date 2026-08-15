import { Math as PhaserMath, Physics, Scene } from 'phaser';
import {
    DEBUG_TRAFFIC,
    TRAFFIC_COLLISION_COOLDOWN_MS,
    TRAFFIC_COLLISION_KNOCKBACK,
    TRAFFIC_COLLISION_MONEY_PENALTY,
    TRAFFIC_COLLISION_SPEED_RETAINED,
    TRAFFIC_MAX_SPEED,
    TRAFFIC_MIN_SPEED,
    TRAFFIC_ROUTES,
    TRAFFIC_VEHICLE_COUNT
} from '../config/trafficConfig';
import { Motoboy } from '../objects/Motoboy';
import { TrafficCar } from '../objects/TrafficCar';

const CAR_COLORS = [0x3a86ff, 0xff595e, 0x8ac926, 0xffca3a, 0x6a4c93, 0xf28482];

export interface TrafficCallbacks
{
    onPlayerCollision: (moneyPenalty: number) => void;
}

export class TrafficSystem
{
    private vehicleGroup: Physics.Arcade.Group;
    private cars: TrafficCar[] = [];
    private lastCollisionByCar = new WeakMap<TrafficCar, number>();

    constructor (
        private scene: Scene,
        private player: Motoboy,
        private callbacks: TrafficCallbacks
    )
    {
        this.vehicleGroup = scene.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.createVehicles();
        scene.physics.add.collider(player, this.vehicleGroup, (_player, vehicle) => {
            this.handlePlayerCollision(vehicle as TrafficCar);
        });

        if (DEBUG_TRAFFIC)
        {
            this.drawDebugRoutes();
        }
    }

    update (delta: number)
    {
        for (const car of this.cars)
        {
            car.updateTraffic(delta);
        }
    }

    getVehicleGroup ()
    {
        return this.vehicleGroup;
    }

    private createVehicles ()
    {
        for (let index = 0; index < TRAFFIC_VEHICLE_COUNT; index += 1)
        {
            const routeIndex = index % TRAFFIC_ROUTES.length;
            const route = TRAFFIC_ROUTES[routeIndex];
            const segmentIndex = Math.floor(index / TRAFFIC_ROUTES.length) % route.waypoints.length;
            const car = new TrafficCar(this.scene, {
                route,
                segmentIndex,
                segmentProgress: PhaserMath.FloatBetween(0.12, 0.82),
                speed: PhaserMath.Between(TRAFFIC_MIN_SPEED, TRAFFIC_MAX_SPEED),
                width: PhaserMath.Between(48, 58),
                length: PhaserMath.Between(78, 94),
                color: CAR_COLORS[index % CAR_COLORS.length],
                turnSpeedFactor: PhaserMath.FloatBetween(0.58, 0.82),
                debug: DEBUG_TRAFFIC
            });

            this.cars.push(car);
            this.vehicleGroup.add(car);
        }
    }

    private handlePlayerCollision (car: TrafficCar)
    {
        const now = this.scene.time.now;
        const lastCollision = this.lastCollisionByCar.get(car) ?? -Infinity;

        if (now - lastCollision < TRAFFIC_COLLISION_COOLDOWN_MS)
        {
            return;
        }

        this.lastCollisionByCar.set(car, now);
        const playerBody = this.player.body as Physics.Arcade.Body;
        const pushDirection = new PhaserMath.Vector2(
            this.player.x - car.x,
            this.player.y - car.y
        );

        if (pushDirection.lengthSq() === 0)
        {
            pushDirection.set(1, 0);
        }

        pushDirection.normalize().scale(TRAFFIC_COLLISION_KNOCKBACK);
        playerBody.velocity
            .scale(TRAFFIC_COLLISION_SPEED_RETAINED)
            .add(pushDirection);
        this.callbacks.onPlayerCollision(TRAFFIC_COLLISION_MONEY_PENALTY);
    }

    private drawDebugRoutes ()
    {
        const graphics = this.scene.add.graphics().setDepth(50);
        graphics.lineStyle(4, 0x00ffff, 0.75);

        for (const route of TRAFFIC_ROUTES)
        {
            for (let index = 0; index < route.waypoints.length; index += 1)
            {
                const current = route.waypoints[index];
                const next = route.waypoints[(index + 1) % route.waypoints.length];
                graphics.lineBetween(current.x, current.y, next.x, next.y);
                graphics.fillStyle(0xff00ff, 0.9);
                graphics.fillCircle(current.x, current.y, 9);
            }
        }
    }
}
