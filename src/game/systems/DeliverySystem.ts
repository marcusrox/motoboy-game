import {
    COLLISION_FREE_FINANCIAL_BONUS,
    QUICK_DELIVERY_FINANCIAL_BONUS,
    calculateDeliveryReward,
    calculateQuickDeliveryTimeLimit
} from '../config/progressionConfig';

export interface DeliveryPoint
{
    id: string;
    name: string;
    x: number;
    y: number;
}

export interface Delivery
{
    destination: DeliveryPoint;
    distance: number;
    reward: number;
    startedAtMs: number;
    collisionsAtStart: number;
    quickTimeLimitMs: number;
}

export interface CompletedDelivery extends Delivery
{
    durationMs: number;
    quick: boolean;
    collisionFree: boolean;
    quickBonus: number;
    collisionFreeBonus: number;
    totalReward: number;
}

const PICKUP_RADIUS = 95;
const DELIVERY_RADIUS = 85;

export class DeliverySystem
{
    private currentDelivery: Delivery | null = null;
    private money = 0;
    private completedDeliveries = 0;

    constructor (
        readonly restaurant: DeliveryPoint,
        readonly destinations: DeliveryPoint[]
    ) {}

    getCurrentDelivery ()
    {
        return this.currentDelivery;
    }

    getMoney ()
    {
        return this.money;
    }

    getCompletedDeliveries ()
    {
        return this.completedDeliveries;
    }

    applyMoneyPenalty (amount: number)
    {
        const appliedPenalty = Math.min(this.money, Math.max(0, amount));
        this.money -= appliedPenalty;

        return appliedPenalty;
    }

    getDistanceToDestination (x: number, y: number)
    {
        if (!this.currentDelivery)
        {
            return null;
        }

        return this.distanceBetween(x, y, this.currentDelivery.destination);
    }

    tryStartDelivery (x: number, y: number, elapsedTimeMs: number, trafficCollisions: number)
    {
        if (
            this.currentDelivery ||
            this.destinations.length === 0 ||
            this.distanceBetween(x, y, this.restaurant) > PICKUP_RADIUS
        )
        {
            return null;
        }

        const destination = this.destinations[
            Math.floor(Math.random() * this.destinations.length)
        ];

        const distance = this.distanceBetween(this.restaurant.x, this.restaurant.y, destination);

        this.currentDelivery = {
            destination,
            distance,
            reward: calculateDeliveryReward(distance),
            startedAtMs: elapsedTimeMs,
            collisionsAtStart: trafficCollisions,
            quickTimeLimitMs: calculateQuickDeliveryTimeLimit(distance)
        };

        return this.currentDelivery;
    }

    tryCompleteDelivery (x: number, y: number, elapsedTimeMs: number, trafficCollisions: number)
    {
        if (
            !this.currentDelivery ||
            this.distanceBetween(x, y, this.currentDelivery.destination) > DELIVERY_RADIUS
        )
        {
            return null;
        }

        const delivery = this.currentDelivery;
        const durationMs = Math.max(0, elapsedTimeMs - delivery.startedAtMs);
        const quick = durationMs <= delivery.quickTimeLimitMs;
        const collisionFree = trafficCollisions === delivery.collisionsAtStart;
        const quickBonus = quick ? QUICK_DELIVERY_FINANCIAL_BONUS : 0;
        const collisionFreeBonus = collisionFree ? COLLISION_FREE_FINANCIAL_BONUS : 0;
        const completedDelivery: CompletedDelivery = {
            ...delivery,
            durationMs,
            quick,
            collisionFree,
            quickBonus,
            collisionFreeBonus,
            totalReward: delivery.reward + quickBonus + collisionFreeBonus
        };

        this.money += completedDelivery.totalReward;
        this.completedDeliveries += 1;
        this.currentDelivery = null;

        return completedDelivery;
    }

    private distanceBetween (x: number, y: number, point: DeliveryPoint)
    {
        return Math.hypot(point.x - x, point.y - y);
    }
}
