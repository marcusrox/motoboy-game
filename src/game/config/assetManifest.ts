import { Scene } from 'phaser';

export const ASSET_KEYS = {
    playerIdle: 'player-idle',
    playerMove: 'player-move',
    playerTurn: 'player-turn',
    playerCollision: 'player-collision',
    trafficCarBlue: 'traffic-car-blue',
    trafficCarRed: 'traffic-car-red',
    trafficCarGreen: 'traffic-car-green',
    pursuerIdle: 'pursuer-idle',
    pursuerMove: 'pursuer-move',
    pursuerCollision: 'pursuer-collision',
    buildingSmall: 'building-small',
    buildingMedium: 'building-medium',
    buildingLarge: 'building-large',
    buildingNarrow: 'building-narrow',
    roadWide: 'road-wide',
    roadNarrow: 'road-narrow',
    sidewalk: 'sidewalk',
    plaza: 'plaza',
    deliveryMarker: 'delivery-marker',
    pursuitWarning: 'pursuit-warning',
    collisionEffect: 'collision-effect'
} as const;

export const ANIMATION_KEYS = {
    playerIdle: 'player-idle-animation',
    playerMove: 'player-move-animation',
    playerTurn: 'player-turn-animation',
    playerCollision: 'player-collision-animation',
    pursuerIdle: 'pursuer-idle-animation',
    pursuerMove: 'pursuer-move-animation',
    pursuerCollision: 'pursuer-collision-animation'
} as const;

interface ImageAssetDefinition
{
    type: 'image';
    key: string;
    path: string;
    enabled: boolean;
}

interface SpriteSheetAssetDefinition
{
    type: 'spritesheet';
    key: string;
    path: string;
    frameWidth: number;
    frameHeight: number;
    enabled: boolean;
}

type AssetDefinition = ImageAssetDefinition | SpriteSheetAssetDefinition;

export const ASSET_MANIFEST: AssetDefinition[] = [
    { type: 'spritesheet', key: ASSET_KEYS.playerIdle, path: 'assets/sprites/player/player-idle.png', frameWidth: 96, frameHeight: 96, enabled: true },
    { type: 'spritesheet', key: ASSET_KEYS.playerMove, path: 'assets/sprites/player/player-move.png', frameWidth: 96, frameHeight: 96, enabled: true },
    { type: 'spritesheet', key: ASSET_KEYS.playerTurn, path: 'assets/sprites/player/player-turn.png', frameWidth: 96, frameHeight: 96, enabled: true },
    { type: 'spritesheet', key: ASSET_KEYS.playerCollision, path: 'assets/sprites/player/player-collision.png', frameWidth: 96, frameHeight: 96, enabled: true },
    { type: 'image', key: ASSET_KEYS.trafficCarBlue, path: 'assets/sprites/vehicles/car-blue.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.trafficCarRed, path: 'assets/sprites/vehicles/car-red.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.trafficCarGreen, path: 'assets/sprites/vehicles/car-green.png', enabled: true },
    { type: 'spritesheet', key: ASSET_KEYS.pursuerIdle, path: 'assets/sprites/enemies/pursuer-idle.png', frameWidth: 96, frameHeight: 96, enabled: true },
    { type: 'spritesheet', key: ASSET_KEYS.pursuerMove, path: 'assets/sprites/enemies/pursuer-move.png', frameWidth: 96, frameHeight: 96, enabled: true },
    { type: 'spritesheet', key: ASSET_KEYS.pursuerCollision, path: 'assets/sprites/enemies/pursuer-collision.png', frameWidth: 96, frameHeight: 96, enabled: true },
    { type: 'image', key: ASSET_KEYS.buildingSmall, path: 'assets/sprites/buildings/building-small.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.buildingMedium, path: 'assets/sprites/buildings/building-medium.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.buildingLarge, path: 'assets/sprites/buildings/building-large.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.buildingNarrow, path: 'assets/sprites/buildings/building-narrow.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.roadWide, path: 'assets/environment/road-wide.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.roadNarrow, path: 'assets/environment/road-narrow.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.sidewalk, path: 'assets/environment/sidewalk.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.plaza, path: 'assets/environment/plaza.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.deliveryMarker, path: 'assets/ui/delivery-marker.png', enabled: true },
    { type: 'image', key: ASSET_KEYS.pursuitWarning, path: 'assets/ui/pursuit-warning.png', enabled: true },
    { type: 'spritesheet', key: ASSET_KEYS.collisionEffect, path: 'assets/effects/collision.png', frameWidth: 128, frameHeight: 128, enabled: true }
];

interface AnimationDefinition
{
    key: string;
    textureKey: string;
    frameRate: number;
    repeat: number;
}

const ANIMATION_MANIFEST: AnimationDefinition[] = [
    { key: ANIMATION_KEYS.playerIdle, textureKey: ASSET_KEYS.playerIdle, frameRate: 4, repeat: -1 },
    { key: ANIMATION_KEYS.playerMove, textureKey: ASSET_KEYS.playerMove, frameRate: 10, repeat: -1 },
    { key: ANIMATION_KEYS.playerTurn, textureKey: ASSET_KEYS.playerTurn, frameRate: 8, repeat: -1 },
    { key: ANIMATION_KEYS.playerCollision, textureKey: ASSET_KEYS.playerCollision, frameRate: 12, repeat: 0 },
    { key: ANIMATION_KEYS.pursuerIdle, textureKey: ASSET_KEYS.pursuerIdle, frameRate: 4, repeat: -1 },
    { key: ANIMATION_KEYS.pursuerMove, textureKey: ASSET_KEYS.pursuerMove, frameRate: 10, repeat: -1 },
    { key: ANIMATION_KEYS.pursuerCollision, textureKey: ASSET_KEYS.pursuerCollision, frameRate: 12, repeat: 0 }
];

export function preloadGameAssets (scene: Scene)
{
    for (const asset of ASSET_MANIFEST)
    {
        if (!asset.enabled)
        {
            continue;
        }

        if (asset.type === 'image')
        {
            scene.load.image(asset.key, asset.path);
        }
        else
        {
            scene.load.spritesheet(asset.key, asset.path, {
                frameWidth: asset.frameWidth,
                frameHeight: asset.frameHeight
            });
        }
    }
}

export function createGameAnimations (scene: Scene)
{
    for (const animation of ANIMATION_MANIFEST)
    {
        if (scene.anims.exists(animation.key) || !scene.textures.exists(animation.textureKey))
        {
            continue;
        }

        scene.anims.create({
            key: animation.key,
            frames: scene.anims.generateFrameNumbers(animation.textureKey),
            frameRate: animation.frameRate,
            repeat: animation.repeat
        });
    }
}

export function firstAvailableTexture (scene: Scene, keys: string[])
{
    return keys.find((key) => scene.textures.exists(key)) ?? null;
}
