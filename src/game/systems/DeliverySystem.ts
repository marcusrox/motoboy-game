export interface Delivery
{
    restaurantName: string;
    reward: number;
}

export class DeliverySystem
{
    private currentDelivery: Delivery | null = null;

    getCurrentDelivery ()
    {
        return this.currentDelivery;
    }

    startDelivery (delivery: Delivery)
    {
        this.currentDelivery = delivery;
    }

    clearDelivery ()
    {
        this.currentDelivery = null;
    }
}
