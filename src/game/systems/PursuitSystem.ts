import { Cameras, Math as PhaserMath, Physics, Scene, Time } from 'phaser';
import {
    ESCAPE_DISTANCE,
    ESCAPE_HOLD_MS,
    MAX_SPAWN_DISTANCE,
    MIN_SPAWN_DISTANCE,
    PURSUIT_CHANCE,
    PURSUIT_DELAY_MAX_MS,
    PURSUIT_DELAY_MIN_MS
} from '../config/pursuitConfig';
import { Motoboy } from '../objects/Motoboy';
import { Pursuer } from '../objects/Pursuer';

export type PursuitState = 'idle' | 'scheduled' | 'active';

export interface PursuitStatus
{
    state: PursuitState;
    distance: number | null;
    escapeTimeRemainingMs: number;
}

export interface PursuitCallbacks
{
    onStarted: () => void;
    onEscaped: () => void;
    onCaught: () => void;
}

export interface SpawnPoint
{
    x: number;
    y: number;
}

export class PursuitSystem
{
    private state: PursuitState = 'idle';
    private pursuer: Pursuer | null = null;
    private scheduledEvent: Time.TimerEvent | null = null;
    private obstacleCollider: Physics.Arcade.Collider | null = null;
    private trafficCollider: Physics.Arcade.Collider | null = null;
    private playerCollider: Physics.Arcade.Collider | null = null;
    private escapeElapsedMs = 0;
    private currentDistance: number | null = null;

    constructor (
        private scene: Scene,
        private player: Motoboy,
        private obstacles: Physics.Arcade.StaticGroup,
        private trafficVehicles: Physics.Arcade.Group,
        private camera: Cameras.Scene2D.Camera,
        private spawnPoints: SpawnPoint[],
        private callbacks: PursuitCallbacks
    )
    {
        scene.events.once('shutdown', this.destroy, this);
    }

    considerStarting (completedDeliveries: number)
    {
        if (
            completedDeliveries < 1 ||
            this.state !== 'idle' ||
            Math.random() >= PURSUIT_CHANCE
        )
        {
            return false;
        }

        this.state = 'scheduled';
        const delay = PhaserMath.Between(PURSUIT_DELAY_MIN_MS, PURSUIT_DELAY_MAX_MS);
        this.scheduledEvent = this.scene.time.delayedCall(delay, this.start, [], this);

        return true;
    }

    update (delta: number)
    {
        if (this.state !== 'active' || !this.pursuer)
        {
            return;
        }

        this.pursuer.chase(this.player, delta);
        this.currentDistance = PhaserMath.Distance.BetweenPoints(this.pursuer, this.player);

        if (this.currentDistance > ESCAPE_DISTANCE)
        {
            this.escapeElapsedMs += delta;

            if (this.escapeElapsedMs >= ESCAPE_HOLD_MS)
            {
                this.finishActivePursuit();
                this.callbacks.onEscaped();
            }
        }
        else
        {
            this.escapeElapsedMs = 0;
        }
    }

    getStatus (): PursuitStatus
    {
        return {
            state: this.state,
            distance: this.currentDistance,
            escapeTimeRemainingMs: Math.max(0, ESCAPE_HOLD_MS - this.escapeElapsedMs)
        };
    }

    destroy ()
    {
        this.scheduledEvent?.remove(false);
        this.scheduledEvent = null;
        this.finishActivePursuit();
    }

    private start ()
    {
        if (this.state !== 'scheduled')
        {
            return;
        }

        this.scheduledEvent = null;
        const spawnPoint = this.chooseSpawnPoint();
        this.pursuer = new Pursuer(this.scene, spawnPoint.x, spawnPoint.y);
        this.obstacleCollider = this.scene.physics.add.collider(this.pursuer, this.obstacles);
        this.trafficCollider = this.scene.physics.add.collider(this.pursuer, this.trafficVehicles);
        this.playerCollider = this.scene.physics.add.collider(
            this.pursuer,
            this.player,
            this.handleCapture,
            undefined,
            this
        );
        this.state = 'active';
        this.escapeElapsedMs = 0;
        this.currentDistance = PhaserMath.Distance.BetweenPoints(this.pursuer, this.player);
        this.callbacks.onStarted();
    }

    private chooseSpawnPoint ()
    {
        const outsidePoints = this.spawnPoints.filter((point) => {
            const outsideCamera = !this.camera.worldView.contains(point.x, point.y);
            const farFromPlayer = PhaserMath.Distance.BetweenPoints(point, this.player) >= MIN_SPAWN_DISTANCE;

            return outsideCamera && farFromPlayer;
        });
        const nearbyPoints = outsidePoints.filter(
            (point) => PhaserMath.Distance.BetweenPoints(point, this.player) <= MAX_SPAWN_DISTANCE
        );

        if (nearbyPoints.length > 0)
        {
            return nearbyPoints[PhaserMath.Between(0, nearbyPoints.length - 1)];
        }

        const candidates = outsidePoints.length > 0 ? outsidePoints : this.spawnPoints;

        return candidates.reduce((closest, point) => {
            const closestDistance = PhaserMath.Distance.BetweenPoints(closest, this.player);
            const pointDistance = PhaserMath.Distance.BetweenPoints(point, this.player);

            return pointDistance < closestDistance ? point : closest;
        });
    }

    private handleCapture ()
    {
        if (this.state !== 'active')
        {
            return;
        }

        this.finishActivePursuit();
        this.callbacks.onCaught();
    }

    private finishActivePursuit ()
    {
        if (this.obstacleCollider)
        {
            this.scene.physics.world.removeCollider(this.obstacleCollider);
            this.obstacleCollider = null;
        }

        if (this.playerCollider)
        {
            this.scene.physics.world.removeCollider(this.playerCollider);
            this.playerCollider = null;
        }

        if (this.trafficCollider)
        {
            this.scene.physics.world.removeCollider(this.trafficCollider);
            this.trafficCollider = null;
        }

        this.pursuer?.destroy();
        this.pursuer = null;
        this.state = 'idle';
        this.escapeElapsedMs = 0;
        this.currentDistance = null;
    }
}
