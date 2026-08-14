import { Scene } from 'phaser';

export class BootScene extends Scene
{
    constructor ()
    {
        super('BootScene');
    }

    create ()
    {
        this.scene.start('MainMenuScene');
    }
}
