import { Scene } from 'phaser';

export const AUDIO_KEYS = {
    engine: 'audio-engine',
    acceleration: 'audio-acceleration',
    braking: 'audio-braking',
    collision: 'audio-collision',
    pickup: 'audio-pickup',
    deliveryComplete: 'audio-delivery-complete',
    money: 'audio-money',
    pursuitStart: 'audio-pursuit-start',
    pursuitEnd: 'audio-pursuit-end',
    gameOver: 'audio-game-over',
    uiClick: 'audio-ui-click',
    menuMusic: 'audio-menu-music',
    gameplayMusic: 'audio-gameplay-music',
    pursuitMusic: 'audio-pursuit-music'
} as const;

export type AudioEffectKey = typeof AUDIO_KEYS[
    | 'acceleration'
    | 'braking'
    | 'collision'
    | 'pickup'
    | 'deliveryComplete'
    | 'money'
    | 'pursuitStart'
    | 'pursuitEnd'
    | 'gameOver'
    | 'uiClick'
];

interface AudioAssetDefinition
{
    key: string;
    paths: string[];
    enabled: boolean;
}

export const AUDIO_ASSET_MANIFEST: AudioAssetDefinition[] = [
    { key: AUDIO_KEYS.engine, paths: ['assets/audio/sfx/engine-loop.webm', 'assets/audio/sfx/engine-loop.m4a'], enabled: false },
    { key: AUDIO_KEYS.acceleration, paths: ['assets/audio/sfx/acceleration.webm', 'assets/audio/sfx/acceleration.m4a'], enabled: false },
    { key: AUDIO_KEYS.braking, paths: ['assets/audio/sfx/braking.webm', 'assets/audio/sfx/braking.m4a'], enabled: false },
    { key: AUDIO_KEYS.collision, paths: ['assets/audio/sfx/collision.webm', 'assets/audio/sfx/collision.m4a'], enabled: false },
    { key: AUDIO_KEYS.pickup, paths: ['assets/audio/sfx/pickup.webm', 'assets/audio/sfx/pickup.m4a'], enabled: false },
    { key: AUDIO_KEYS.deliveryComplete, paths: ['assets/audio/sfx/delivery-complete.webm', 'assets/audio/sfx/delivery-complete.m4a'], enabled: false },
    { key: AUDIO_KEYS.money, paths: ['assets/audio/sfx/money.webm', 'assets/audio/sfx/money.m4a'], enabled: false },
    { key: AUDIO_KEYS.pursuitStart, paths: ['assets/audio/sfx/pursuit-start.webm', 'assets/audio/sfx/pursuit-start.m4a'], enabled: false },
    { key: AUDIO_KEYS.pursuitEnd, paths: ['assets/audio/sfx/pursuit-end.webm', 'assets/audio/sfx/pursuit-end.m4a'], enabled: false },
    { key: AUDIO_KEYS.gameOver, paths: ['assets/audio/sfx/game-over.webm', 'assets/audio/sfx/game-over.m4a'], enabled: false },
    { key: AUDIO_KEYS.uiClick, paths: ['assets/audio/sfx/ui-click.webm', 'assets/audio/sfx/ui-click.m4a'], enabled: false },
    { key: AUDIO_KEYS.menuMusic, paths: ['assets/audio/music/menu.webm', 'assets/audio/music/menu.m4a'], enabled: false },
    { key: AUDIO_KEYS.gameplayMusic, paths: ['assets/audio/music/gameplay.webm', 'assets/audio/music/gameplay.m4a'], enabled: false },
    { key: AUDIO_KEYS.pursuitMusic, paths: ['assets/audio/music/pursuit.webm', 'assets/audio/music/pursuit.m4a'], enabled: false }
];

export function preloadAudioAssets (scene: Scene)
{
    for (const asset of AUDIO_ASSET_MANIFEST)
    {
        if (asset.enabled)
        {
            scene.load.audio(asset.key, asset.paths);
        }
    }
}
