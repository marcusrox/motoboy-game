import { GameObjects, Math as PhaserMath, Physics, Scene } from 'phaser';
import { ASSET_KEYS } from '../config/assetManifest';
import { ROAD_SEGMENTS } from '../config/cityMapConfig';
import {
    DEBUG_TRAFFIC,
    PLAYER_TRAFFIC_COLLIDER_LENGTH,
    PLAYER_TRAFFIC_COLLIDER_WIDTH,
    TRAFFIC_AVOIDANCE_MARGIN,
    TRAFFIC_FOLLOW_DISTANCE,
    TRAFFIC_INTERSECTION_LOOKAHEAD_MS,
    TRAFFIC_INTERSECTION_MARGIN,
    TRAFFIC_INTERSECTION_RESERVATION_TIMEOUT_MS,
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

interface IntersectionReservation
{
    id: string;
    zone: OrientedRectangle;
    owner: TrafficCar | null;
    ownerElapsedMs: number;
}

export class TrafficSystem
{
    private vehicleGroup: Physics.Arcade.Group;
    private cars: TrafficCar[] = [];
    private intersections: IntersectionReservation[] = [];
    private intersectionWaitMs = new Map<TrafficCar, number>();
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
        this.intersections = this.createIntersectionReservations();
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
                this.resolveFollowingPair(
                    this.cars[firstIndex],
                    this.cars[secondIndex],
                    speedLimits
                );
            }
        }


        this.processIntersectionReservations(delta, speedLimits);

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

    private resolveFollowingPair (
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

        if (!sameLane)
        {
            return;
        }

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
    }

    private createIntersectionReservations ()
    {
        const verticalRoads = ROAD_SEGMENTS.filter((road) => road.height > road.width);
        const horizontalRoads = ROAD_SEGMENTS.filter((road) => road.width > road.height);
        const intersections: IntersectionReservation[] = [];

        for (const verticalRoad of verticalRoads)
        {
            for (const horizontalRoad of horizontalRoads)
            {
                const left = Math.max(verticalRoad.x, horizontalRoad.x);
                const right = Math.min(
                    verticalRoad.x + verticalRoad.width,
                    horizontalRoad.x + horizontalRoad.width
                );
                const top = Math.max(verticalRoad.y, horizontalRoad.y);
                const bottom = Math.min(
                    verticalRoad.y + verticalRoad.height,
                    horizontalRoad.y + horizontalRoad.height
                );

                if (right <= left || bottom <= top)
                {
                    continue;
                }

                intersections.push({
                    id: `${verticalRoad.x}:${horizontalRoad.y}`,
                    zone: {
                        x: (left + right) / 2,
                        y: (top + bottom) / 2,
                        width: right - left + TRAFFIC_INTERSECTION_MARGIN * 2,
                        height: bottom - top + TRAFFIC_INTERSECTION_MARGIN * 2,
                        rotation: 0
                    },
                    owner: null,
                    ownerElapsedMs: 0
                });
            }
        }

        return intersections;
    }

    private processIntersectionReservations (
        delta: number,
        speedLimits: Map<TrafficCar, number>
    )
    {
        const waitingThisFrame = new Set<TrafficCar>();

        for (const intersection of this.intersections)
        {
            const candidates = this.cars.filter((car) => this.orientedRectanglesOverlap(
                this.getAvoidanceCorridor(car.getTrafficMotionState()),
                intersection.zone
            ));
            const carsInside = candidates.filter((car) => this.isCarInsideZone(
                car,
                intersection.zone
            ));
            let timedOutOwner: TrafficCar | null = null;

            if (intersection.owner)
            {
                intersection.ownerElapsedMs += delta;
                const ownerInside = carsInside.includes(intersection.owner);
                const ownerApproaching = candidates.includes(intersection.owner);
                const ownerStopped = intersection.owner.getTrafficMotionState().currentSpeed < 1;

                if (
                    !ownerInside
                    && (
                        !ownerApproaching
                        || (
                            ownerStopped
                            && intersection.ownerElapsedMs
                                >= TRAFFIC_INTERSECTION_RESERVATION_TIMEOUT_MS
                        )
                    )
                )
                {
                    timedOutOwner = intersection.owner;
                    intersection.owner = null;
                    intersection.ownerElapsedMs = 0;
                }
            }

            if (
                carsInside.length > 0
                && (!intersection.owner || !carsInside.includes(intersection.owner))
            )
            {
                intersection.owner = this.pickIntersectionCandidate(carsInside, intersection.zone);
                intersection.ownerElapsedMs = 0;
            }

            if (!intersection.owner)
            {
                const eligible = candidates.filter((car) => (
                    car !== timedOutOwner
                    && (
                        this.isCarInsideZone(car, intersection.zone)
                        || this.hasClearIntersectionExit(car, intersection.zone)
                    )
                ));

                intersection.owner = this.pickIntersectionCandidate(eligible, intersection.zone);
                intersection.ownerElapsedMs = 0;
            }

            for (const car of candidates)
            {
                if (car === intersection.owner)
                {
                    continue;
                }

                this.reduceSpeedLimit(speedLimits, car, 0);
                waitingThisFrame.add(car);
            }
        }

        for (const car of this.cars)
        {
            const previousWait = this.intersectionWaitMs.get(car) ?? 0;
            this.intersectionWaitMs.set(
                car,
                waitingThisFrame.has(car) ? previousWait + delta : 0
            );
        }
    }

    private pickIntersectionCandidate (
        candidates: TrafficCar[],
        zone: OrientedRectangle
    )
    {
        return candidates.slice().sort((first, second) => {
            const firstInside = this.isCarInsideZone(first, zone);
            const secondInside = this.isCarInsideZone(second, zone);

            if (firstInside !== secondInside)
            {
                return firstInside ? -1 : 1;
            }

            const waitDifference = (this.intersectionWaitMs.get(second) ?? 0)
                - (this.intersectionWaitMs.get(first) ?? 0);

            if (waitDifference !== 0)
            {
                return waitDifference;
            }

            const distanceDifference = this.distanceToZone(first, zone)
                - this.distanceToZone(second, zone);

            if (distanceDifference !== 0)
            {
                return distanceDifference;
            }

            return first.getTrafficMotionState().priority
                - second.getTrafficMotionState().priority;
        })[0] ?? null;
    }

    private hasClearIntersectionExit (candidate: TrafficCar, zone: OrientedRectangle)
    {
        const candidateState = candidate.getTrafficMotionState();
        const relativeX = candidateState.x - zone.x;
        const relativeY = candidateState.y - zone.y;
        const centerProgress = relativeX * candidateState.directionX
            + relativeY * candidateState.directionY;
        const zoneHalfExtent = Math.abs(candidateState.directionX) * zone.width / 2
            + Math.abs(candidateState.directionY) * zone.height / 2;
        const distanceToClear = zoneHalfExtent - centerProgress
            + candidateState.length / 2
            + TRAFFIC_MIN_FOLLOW_GAP;

        return this.cars.every((other) => {
            if (other === candidate)
            {
                return true;
            }

            const otherState = other.getTrafficMotionState();
            const directionAlignment = candidateState.directionX * otherState.directionX
                + candidateState.directionY * otherState.directionY;

            if (directionAlignment <= 0.9)
            {
                return true;
            }

            const deltaX = otherState.x - candidateState.x;
            const deltaY = otherState.y - candidateState.y;
            const forwardDistance = deltaX * candidateState.directionX
                + deltaY * candidateState.directionY;
            const lateralDistance = Math.abs(
                deltaX * -candidateState.directionY
                    + deltaY * candidateState.directionX
            );
            const sameLane = lateralDistance
                <= (candidateState.width + otherState.width) / 2
                    + TRAFFIC_AVOIDANCE_MARGIN;

            if (!sameLane || forwardDistance <= 0)
            {
                return true;
            }

            const otherRearDistance = forwardDistance - otherState.length / 2;

            return otherRearDistance >= distanceToClear;
        });
    }

    private isCarInsideZone (car: TrafficCar, zone: OrientedRectangle)
    {
        return this.orientedRectanglesOverlap(car.getTrafficCollisionShape(), zone);
    }

    private distanceToZone (car: TrafficCar, zone: OrientedRectangle)
    {
        const horizontalDistance = Math.max(Math.abs(car.x - zone.x) - zone.width / 2, 0);
        const verticalDistance = Math.max(Math.abs(car.y - zone.y) - zone.height / 2, 0);

        return Math.hypot(horizontalDistance, verticalDistance);
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

        for (const intersection of this.intersections)
        {
            graphics.lineStyle(3, intersection.owner ? 0x34c759 : 0x00ffff, 0.75);
            this.drawOrientedRectangle(graphics, intersection.zone);
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
