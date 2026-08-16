import { Scene } from 'phaser';
import { createGameAnimations, preloadGameAssets } from '../config/assetManifest';

export class BootScene extends Scene
{
    constructor ()
    {
        super('BootScene');
    }

    preload ()
    {
        this.load.on('loaderror', (file: { key: string; src: string }) => {
            console.warn(
                `[Assets] Não foi possível carregar "${file.key}" (${file.src}). O placeholder será usado.`
            );
        });
        preloadGameAssets(this);
    }

    create ()
    {
        createGameAnimations(this);
        this.scene.start('MainMenuScene');
    }
}
