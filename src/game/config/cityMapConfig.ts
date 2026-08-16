export interface RoadSegment
{
    x: number;
    y: number;
    width: number;
    height: number;
    wide: boolean;
}

export interface CityBlock
{
    x: number;
    y: number;
    width: number;
    height: number;
    color?: number;
}

export interface CityBarrier
{
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface CrosswalkIntersection
{
    verticalRoadX: number;
    horizontalRoadY: number;
}

export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 3200;

export const ROAD_SEGMENTS: RoadSegment[] = [
    { x: 380, y: 0, width: 160, height: WORLD_HEIGHT, wide: false },
    { x: 1040, y: 0, width: 320, height: WORLD_HEIGHT, wide: true },
    { x: 2000, y: 0, width: 140, height: WORLD_HEIGHT, wide: false },
    { x: 0, y: 760, width: WORLD_WIDTH, height: 320, wide: true },
    { x: 0, y: 1840, width: WORLD_WIDTH, height: 160, wide: false },
    { x: 0, y: 2580, width: WORLD_WIDTH, height: 300, wide: true }
];

export const CROSSWALK_INTERSECTIONS: CrosswalkIntersection[] = [
    { verticalRoadX: 1040, horizontalRoadY: 760 },
    { verticalRoadX: 1040, horizontalRoadY: 1840 }
];

export const CITY_BLOCKS: CityBlock[] = [
    { x: 30, y: 30, width: 310, height: 690, color: 0x8e5f48 },
    { x: 580, y: 40, width: 420, height: 670, color: 0x586f7c },
    { x: 1400, y: 35, width: 560, height: 680, color: 0x766b55 },
    { x: 2180, y: 35, width: 185, height: 680, color: 0x8a665c },
    { x: 30, y: 1120, width: 310, height: 680, color: 0x596c68 },
    { x: 580, y: 1120, width: 190, height: 680, color: 0x8a6d52 },
    { x: 850, y: 1120, width: 150, height: 680, color: 0x586f7c },
    { x: 1400, y: 1120, width: 560, height: 680, color: 0x806052 },
    { x: 2180, y: 1120, width: 185, height: 680, color: 0x65756a },
    { x: 30, y: 2040, width: 310, height: 500, color: 0x705d68 },
    { x: 580, y: 2040, width: 420, height: 500, color: 0x5c6e78 },
    { x: 2180, y: 2040, width: 185, height: 500, color: 0x846554 },
    { x: 30, y: 2920, width: 310, height: 245, color: 0x596c68 },
    { x: 580, y: 2920, width: 420, height: 245, color: 0x806052 },
    { x: 1400, y: 2920, width: 560, height: 245, color: 0x586f7c },
    { x: 2180, y: 2920, width: 185, height: 245, color: 0x766b55 }
];

export const CITY_BARRIERS: CityBarrier[] = [
    { x: 1460, y: 2120, width: 150, height: 55 },
    { x: 1810, y: 2120, width: 90, height: 55 },
    { x: 1540, y: 2435, width: 85, height: 85 },
    { x: 1835, y: 2400, width: 150, height: 55 }
];
