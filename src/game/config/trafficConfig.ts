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

export const TRAFFIC_FOLLOW_DISTANCE = 130;
export const TRAFFIC_MIN_FOLLOW_GAP = 18;
export const TRAFFIC_INTERSECTION_LOOKAHEAD_MS = 700;
export const TRAFFIC_AVOIDANCE_MARGIN = 8;
export const TRAFFIC_ACCELERATION = 140;
export const TRAFFIC_BRAKING = 520;
export const TRAFFIC_SPAWN_ATTEMPTS = 24;

export const TRAFFIC_COLLISION_SPEED_RETAINED = 0.28;
export const TRAFFIC_COLLISION_KNOCKBACK = 110;
export const TRAFFIC_COLLISION_COOLDOWN_MS = 900;
export const TRAFFIC_COLLISION_MONEY_PENALTY = 2;
export const PLAYER_TRAFFIC_COLLIDER_WIDTH = 36;
export const PLAYER_TRAFFIC_COLLIDER_LENGTH = 70;
export const TRAFFIC_VEHICLE_COLLIDER_INSET = 6;

export const TRAFFIC_ROUTES: TrafficRoute[] = [
    {
        id: 'avenida-leste',
        waypoints: [
            { x: 1280, y: 990 },
            { x: 2035, y: 990 },
            { x: 2035, y: 2670 },
            { x: 1280, y: 2670 }
        ]
    },
    {
        id: 'avenida-oeste',
        waypoints: [
            { x: 1280, y: 850 },
            { x: 420, y: 850 },
            { x: 420, y: 2790 },
            { x: 1280, y: 2790 }
        ]
    },
    {
        id: 'bairro-norte',
        waypoints: [
            { x: 1120, y: 1880 },
            { x: 500, y: 1880 },
            { x: 500, y: 990 },
            { x: 1120, y: 990 }
        ]
    },
    {
        id: 'bairro-sul',
        waypoints: [
            { x: 1280, y: 1960 },
            { x: 2035, y: 1960 },
            { x: 2035, y: 2670 },
            { x: 1280, y: 2670 }
        ]
    }
];
