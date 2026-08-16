export const DELIVERY_BASE_VALUE = 5;
export const DELIVERY_VALUE_PER_PIXEL = 0.008;
export const DELIVERY_MIN_VALUE = 8;
export const DELIVERY_MAX_VALUE = 30;

export const QUICK_DELIVERY_MS_PER_PIXEL = 12;
export const QUICK_DELIVERY_MIN_TIME_MS = 8_000;
export const QUICK_DELIVERY_FINANCIAL_BONUS = 3;
export const COLLISION_FREE_FINANCIAL_BONUS = 2;

export const DELIVERY_SCORE_BASE = 100;
export const QUICK_DELIVERY_SCORE_BONUS = 50;
export const DELIVERY_STREAK_SCORE_STEP = 25;
export const PURSUIT_ESCAPE_SCORE_BONUS = 150;
export const TRAFFIC_COLLISION_SCORE_PENALTY = 30;

export function calculateDeliveryReward (distance: number)
{
    const calculatedValue = DELIVERY_BASE_VALUE + distance * DELIVERY_VALUE_PER_PIXEL;

    return Math.round(Math.min(DELIVERY_MAX_VALUE, Math.max(DELIVERY_MIN_VALUE, calculatedValue)));
}

export function calculateQuickDeliveryTimeLimit (distance: number)
{
    return Math.max(QUICK_DELIVERY_MIN_TIME_MS, distance * QUICK_DELIVERY_MS_PER_PIXEL);
}

export function calculateDeliveryScore (quick: boolean, streak: number)
{
    const quickBonus = quick ? QUICK_DELIVERY_SCORE_BONUS : 0;
    const streakBonus = Math.max(0, streak - 1) * DELIVERY_STREAK_SCORE_STEP;

    return DELIVERY_SCORE_BASE + quickBonus + streakBonus;
}
