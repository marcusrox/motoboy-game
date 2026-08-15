export interface TrafficWaypoint
{
    x: number;
    y: number;
}

export interface TrafficRoute
{
    id: string;
    waypoints: TrafficWaypoint[];
}

export const DEBUG_TRAFFIC = false;

export const TRAFFIC_VEHICLE_COUNT = 12;
export const TRAFFIC_MIN_SPEED = 115;
export const TRAFFIC_MAX_SPEED = 180;

export const TRAFFIC_COLLISION_SPEED_RETAINED = 0.28;
export const TRAFFIC_COLLISION_KNOCKBACK = 110;
export const TRAFFIC_COLLISION_COOLDOWN_MS = 900;
export const TRAFFIC_COLLISION_MONEY_PENALTY = 2;

export const TRAFFIC_ROUTES: TrafficRoute[] = [
    {
        id: 'avenida-leste',
        waypoints: [
            { x: 1120, y: 850 },
            { x: 2035, y: 850 },
            { x: 2035, y: 2670 },
            { x: 1120, y: 2670 }
        ]
    },
    {
        id: 'avenida-oeste',
        waypoints: [
            { x: 1280, y: 2790 },
            { x: 500, y: 2790 },
            { x: 500, y: 990 },
            { x: 1280, y: 990 }
        ]
    },
    {
        id: 'bairro-norte',
        waypoints: [
            { x: 1120, y: 1880 },
            { x: 460, y: 1880 },
            { x: 460, y: 850 },
            { x: 1120, y: 850 }
        ]
    },
    {
        id: 'bairro-sul',
        waypoints: [
            { x: 1280, y: 1960 },
            { x: 2105, y: 1960 },
            { x: 2105, y: 2790 },
            { x: 1280, y: 2790 }
        ]
    }
];
