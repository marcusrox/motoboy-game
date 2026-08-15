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
    reward: number;
}

const PICKUP_RADIUS = 95;
const DELIVERY_RADIUS = 85;
const DELIVERY_REWARD = 10;

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

    tryStartDelivery (x: number, y: number)
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

        this.currentDelivery = {
            destination,
            reward: DELIVERY_REWARD
        };

        return this.currentDelivery;
    }

    tryCompleteDelivery (x: number, y: number)
    {
        if (
            !this.currentDelivery ||
            this.distanceBetween(x, y, this.currentDelivery.destination) > DELIVERY_RADIUS
        )
        {
            return null;
        }

        const completedDelivery = this.currentDelivery;
        this.money += completedDelivery.reward;
        this.completedDeliveries += 1;
        this.currentDelivery = null;

        return completedDelivery;
    }

    private distanceBetween (x: number, y: number, point: DeliveryPoint)
    {
        return Math.hypot(point.x - x, point.y - y);
    }
}
