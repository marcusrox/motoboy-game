import {
    PURSUIT_ESCAPE_SCORE_BONUS,
    TRAFFIC_COLLISION_SCORE_PENALTY,
    calculateDeliveryScore
} from '../config/progressionConfig';
import { CompletedDelivery } from './DeliverySystem';

export interface GameStatsSnapshot
{
    score: number;
    deliveries: number;
    moneyEarned: number;
    distanceTraveled: number;
    elapsedTimeMs: number;
    pursuitsStarted: number;
    pursuitsEscaped: number;
    trafficCollisions: number;
    deliveryStreak: number;
}

export class GameStatsSystem
{
    private stats: GameStatsSnapshot = {
        score: 0,
        deliveries: 0,
        moneyEarned: 0,
        distanceTraveled: 0,
        elapsedTimeMs: 0,
        pursuitsStarted: 0,
        pursuitsEscaped: 0,
        trafficCollisions: 0,
        deliveryStreak: 0
    };
    private lastX: number;
    private lastY: number;

    constructor (initialX: number, initialY: number)
    {
        this.lastX = initialX;
        this.lastY = initialY;
    }

    update (delta: number, playerX: number, playerY: number)
    {
        this.stats.elapsedTimeMs += delta;
        const frameDistance = Math.hypot(playerX - this.lastX, playerY - this.lastY);

        // Ignora apenas saltos anormais; o movimento regular e empurrões continuam contabilizados.
        if (frameDistance < 200)
        {
            this.stats.distanceTraveled += frameDistance;
        }

        this.lastX = playerX;
        this.lastY = playerY;
    }

    recordDelivery (delivery: CompletedDelivery)
    {
        this.stats.deliveries += 1;
        this.stats.deliveryStreak += 1;
        this.stats.moneyEarned += delivery.totalReward;
        this.stats.score += calculateDeliveryScore(delivery.quick, this.stats.deliveryStreak);
    }

    recordPursuitStarted ()
    {
        this.stats.pursuitsStarted += 1;
    }

    recordPursuitEscaped ()
    {
        this.stats.pursuitsEscaped += 1;
        this.stats.score += PURSUIT_ESCAPE_SCORE_BONUS;
    }

    recordTrafficCollision ()
    {
        this.stats.trafficCollisions += 1;
        this.stats.score = Math.max(0, this.stats.score - TRAFFIC_COLLISION_SCORE_PENALTY);
    }

    getSnapshot (): Readonly<GameStatsSnapshot>
    {
        return { ...this.stats };
    }
}
