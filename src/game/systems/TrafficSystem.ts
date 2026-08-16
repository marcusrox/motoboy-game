import { GameObjects, Math as PhaserMath, Physics, Scene } from 'phaser';
import { ASSET_KEYS } from '../config/assetManifest';
import {
    DEBUG_TRAFFIC,
    PLAYER_TRAFFIC_COLLIDER_LENGTH,
    PLAYER_TRAFFIC_COLLIDER_WIDTH,
    TRAFFIC_AVOIDANCE_MARGIN,
    TRAFFIC_FOLLOW_DISTANCE,
    TRAFFIC_INTERSECTION_LOOKAHEAD_MS,
    TRAFFIC_MIN_FOLLOW_GAP,
    TRAFFIC_COLLISION_COOLDOWN_MS,
    TRAFFIC_COLLISION_KNOCKBACK,
    TRAFFIC_COLLISION_MONEY_PENALTY,
    TRAFFIC_COLLISION_SPEED_RETAINED,
    TRAFFIC_MAX_SPEED,
    TRAFFIC_MIN_SPEED,
    TRAFFIC_ROUTES,
    TRAFFIC_SPAWN_ATTEMPTS,
    TRAFFIC_VEHICLE_COUNT
} from '../config/trafficConfig';
import { Motoboy } from '../objects/Motoboy';
import { TrafficCar } from '../objects/TrafficCar';

const CAR_COLORS = [0x3a86ff, 0xff595e, 0x8ac926, 0xffca3a, 0x6a4c93, 0xf28482];
const CAR_TEXTURES = [
    ASSET_KEYS.trafficCarBlue,
    ASSET_KEYS.trafficCarRed,
    ASSET_KEYS.trafficCarGreen
];

export interface TrafficCallbacks
{
    onPlayerCollision: (moneyPenalty: number) => void;
}

interface OrientedRectangle
{
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

export class TrafficSystem
{
    private vehicleGroup: Physics.Arcade.Group;
    private cars: TrafficCar[] = [];
    private lastCollisionByCar = new WeakMap<TrafficCar, number>();
    private debugAvoidanceGraphics?: GameObjects.Graphics;

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
        scene.physics.add.collider(
            player,
            this.vehicleGroup,
            (_player, vehicle) => this.handlePlayerCollision(vehicle as TrafficCar),
            (_player, vehicle) => this.vehiclesAreTouching(vehicle as TrafficCar),
            this
        );

        if (DEBUG_TRAFFIC)
        {
            this.drawDebugRoutes();
            this.debugAvoidanceGraphics = scene.add.graphics().setDepth(51);
        }
    }

    update (delta: number)
    {
        const speedLimits = new Map<TrafficCar, number>();

        for (const car of this.cars)
        {
            car.prepareTrafficUpdate(delta);
            speedLimits.set(car, car.getTrafficMotionState().baseSpeed);
        }

        for (let firstIndex = 0; firstIndex < this.cars.length; firstIndex += 1)
        {
            for (let secondIndex = firstIndex + 1; secondIndex < this.cars.length; secondIndex += 1)
            {
                this.resolveVehiclePair(
                    this.cars[firstIndex],
                    this.cars[secondIndex],
                    speedLimits
                );
            }
        }

        for (const car of this.cars)
        {
            car.setTrafficSpeedLimit(speedLimits.get(car) ?? 0);
            car.updateTraffic(delta);
        }

        this.drawDebugAvoidance(speedLimits);
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
            const speed = PhaserMath.Between(TRAFFIC_MIN_SPEED, TRAFFIC_MAX_SPEED);
            const width = PhaserMath.Between(48, 58);
            const length = PhaserMath.Between(78, 94);
            const turnSpeedFactor = PhaserMath.FloatBetween(0.58, 0.82);

            for (let attempt = 0; attempt < TRAFFIC_SPAWN_ATTEMPTS; attempt += 1)
            {
                const car = new TrafficCar(this.scene, {
                    priority: index,
                    route,
                    segmentIndex,
                    segmentProgress: PhaserMath.FloatBetween(0.08, 0.9),
                    speed,
                    width,
                    length,
                    color: CAR_COLORS[index % CAR_COLORS.length],
                    turnSpeedFactor,
                    debug: DEBUG_TRAFFIC,
                    textureKey: CAR_TEXTURES[index % CAR_TEXTURES.length]
                });

                if (this.hasSpawnClearance(car))
                {
                    this.cars.push(car);
                    this.vehicleGroup.add(car);
                    break;
                }

                car.destroy();
            }
        }
    }

    private resolveVehiclePair (
        first: TrafficCar,
        second: TrafficCar,
        speedLimits: Map<TrafficCar, number>
    )
    {
        const firstState = first.getTrafficMotionState();
        const secondState = second.getTrafficMotionState();
        const directionAlignment = firstState.directionX * secondState.directionX
            + firstState.directionY * secondState.directionY;
        const deltaX = secondState.x - firstState.x;
        const deltaY = secondState.y - firstState.y;
        const longitudinalDistance = deltaX * firstState.directionX
            + deltaY * firstState.directionY;
        const lateralDistance = Math.abs(
            deltaX * -firstState.directionY + deltaY * firstState.directionX
        );
        const sameLane = directionAlignment > 0.9
            && lateralDistance <= (firstState.width + secondState.width) / 2
                + TRAFFIC_AVOIDANCE_MARGIN;

        if (sameLane)
        {
            const follower = longitudinalDistance >= 0 ? first : second;
            const followerState = longitudinalDistance >= 0 ? firstState : secondState;
            const leaderState = longitudinalDistance >= 0 ? secondState : firstState;
            const centerDistance = Math.abs(longitudinalDistance);
            const gap = centerDistance - (followerState.length + leaderState.length) / 2;
            const progress = PhaserMath.Clamp(
                (gap - TRAFFIC_MIN_FOLLOW_GAP)
                    / (TRAFFIC_FOLLOW_DISTANCE - TRAFFIC_MIN_FOLLOW_GAP),
                0,
                1
            );
            const limit = gap < TRAFFIC_MIN_FOLLOW_GAP
                ? 0
                : PhaserMath.Linear(
                    leaderState.currentSpeed,
                    followerState.baseSpeed,
                    progress
                );

            this.reduceSpeedLimit(speedLimits, follower, limit);
            return;
        }

        const firstCorridor = this.getAvoidanceCorridor(firstState);
        const secondCorridor = this.getAvoidanceCorridor(secondState);

        if (!this.orientedRectanglesOverlap(firstCorridor, secondCorridor))
        {
            return;
        }

        const yieldingCar = firstState.priority < secondState.priority ? second : first;

        this.reduceSpeedLimit(speedLimits, yieldingCar, 0);
    }

    private reduceSpeedLimit (
        speedLimits: Map<TrafficCar, number>,
        car: TrafficCar,
        limit: number
    )
    {
        speedLimits.set(car, Math.min(speedLimits.get(car) ?? limit, limit));
    }

    private getAvoidanceCorridor (state: ReturnType<TrafficCar['getTrafficMotionState']>)
    {
        const travelDistance = state.baseSpeed * TRAFFIC_INTERSECTION_LOOKAHEAD_MS / 1000;

        return {
            x: state.x + state.directionX * travelDistance / 2,
            y: state.y + state.directionY * travelDistance / 2,
            width: state.width + TRAFFIC_AVOIDANCE_MARGIN * 2,
            height: state.length + travelDistance + TRAFFIC_AVOIDANCE_MARGIN * 2,
            rotation: state.rotation
        };
    }

    private hasSpawnClearance (candidate: TrafficCar)
    {
        const candidateShape = candidate.getTrafficCollisionShape();

        return this.cars.every((car) => {
            const shape = car.getTrafficCollisionShape();

            return !this.orientedRectanglesOverlap(
                {
                    ...candidateShape,
                    width: candidateShape.width + TRAFFIC_AVOIDANCE_MARGIN * 2,
                    height: candidateShape.height + TRAFFIC_AVOIDANCE_MARGIN * 2
                },
                {
                    ...shape,
                    width: shape.width + TRAFFIC_AVOIDANCE_MARGIN * 2,
                    height: shape.height + TRAFFIC_AVOIDANCE_MARGIN * 2
                }
            );
        });
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
        this.player.showCollisionVisual();
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

    private vehiclesAreTouching (car: TrafficCar)
    {
        const carShape = car.getTrafficCollisionShape();

        return this.orientedRectanglesOverlap(
            {
                x: this.player.x,
                y: this.player.y,
                width: PLAYER_TRAFFIC_COLLIDER_WIDTH,
                height: PLAYER_TRAFFIC_COLLIDER_LENGTH,
                rotation: this.player.rotation
            },
            carShape
        );
    }

    private orientedRectanglesOverlap (
        first: OrientedRectangle,
        second: OrientedRectangle
    )
    {
        const aAxisX = { x: Math.cos(first.rotation), y: Math.sin(first.rotation) };
        const aAxisY = { x: -aAxisX.y, y: aAxisX.x };
        const bAxisX = { x: Math.cos(second.rotation), y: Math.sin(second.rotation) };
        const bAxisY = { x: -bAxisX.y, y: bAxisX.x };
        const deltaX = second.x - first.x;
        const deltaY = second.y - first.y;
        const axes = [aAxisX, aAxisY, bAxisX, bAxisY];

        for (const axis of axes)
        {
            const centerDistance = Math.abs(deltaX * axis.x + deltaY * axis.y);
            const aRadius = first.width / 2 * Math.abs(aAxisX.x * axis.x + aAxisX.y * axis.y)
                + first.height / 2 * Math.abs(aAxisY.x * axis.x + aAxisY.y * axis.y);
            const bRadius = second.width / 2 * Math.abs(bAxisX.x * axis.x + bAxisX.y * axis.y)
                + second.height / 2 * Math.abs(bAxisY.x * axis.x + bAxisY.y * axis.y);

            if (centerDistance >= aRadius + bRadius)
            {
                return false;
            }
        }

        return true;
    }

    private drawDebugAvoidance (speedLimits: Map<TrafficCar, number>)
    {
        const graphics = this.debugAvoidanceGraphics;

        if (!graphics)
        {
            return;
        }

        graphics.clear();

        for (const car of this.cars)
        {
            const corridor = this.getAvoidanceCorridor(car.getTrafficMotionState());
            const stopped = (speedLimits.get(car) ?? 0) <= 0;

            graphics.lineStyle(2, stopped ? 0xff3b30 : 0xffd60a, 0.55);
            this.drawOrientedRectangle(graphics, corridor);
        }
    }

    private drawOrientedRectangle (
        graphics: GameObjects.Graphics,
        rectangle: OrientedRectangle
    )
    {
        const axisX = { x: Math.cos(rectangle.rotation), y: Math.sin(rectangle.rotation) };
        const axisY = { x: -axisX.y, y: axisX.x };
        const halfWidth = rectangle.width / 2;
        const halfHeight = rectangle.height / 2;
        const corners = [
            { x: -halfWidth, y: -halfHeight },
            { x: halfWidth, y: -halfHeight },
            { x: halfWidth, y: halfHeight },
            { x: -halfWidth, y: halfHeight }
        ].map((corner) => ({
            x: rectangle.x + axisX.x * corner.x + axisY.x * corner.y,
            y: rectangle.y + axisX.y * corner.x + axisY.y * corner.y
        }));

        graphics.beginPath();
        graphics.moveTo(corners[0].x, corners[0].y);
        corners.slice(1).forEach((corner) => graphics.lineTo(corner.x, corner.y));
        graphics.closePath();
        graphics.strokePath();
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
