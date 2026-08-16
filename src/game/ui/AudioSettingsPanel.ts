import { GameObjects, Scene } from 'phaser';
import { AudioManager } from '../systems/AudioManager';

const VOLUME_STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];

export class AudioSettingsPanel extends GameObjects.Container
{
    private musicButton: GameObjects.Text;
    private effectsButton: GameObjects.Text;
    private muteButton: GameObjects.Text;

    constructor (scene: Scene, private audio: AudioManager, x: number, y: number)
    {
        super(scene, x, y);

        this.musicButton = this.createButton(scene, -145, 0);
        this.effectsButton = this.createButton(scene, 145, 0);
        this.muteButton = this.createButton(scene, 0, 62);

        this.musicButton.on('pointerup', () => {
            this.audio.setMusicVolume(this.nextVolume(this.audio.getPreferences().musicVolume));
            this.audio.playUiClick();
            this.refresh();
        });
        this.effectsButton.on('pointerup', () => {
            this.audio.setEffectsVolume(this.nextVolume(this.audio.getPreferences().effectsVolume));
            this.audio.playUiClick();
            this.refresh();
        });
        this.muteButton.on('pointerup', () => {
            const muted = this.audio.getPreferences().muted;

            if (!muted)
            {
                this.audio.playUiClick();
            }

            this.audio.setMuted(!muted);

            if (muted)
            {
                this.audio.playUiClick();
            }

            this.refresh();
        });

        this.add([this.musicButton, this.effectsButton, this.muteButton]);
        this.setDepth(300);
        scene.add.existing(this);
        this.refresh();
    }

    private createButton (scene: Scene, x: number, y: number)
    {
        return scene.add.text(x, y, '', {
            align: 'center',
            backgroundColor: '#111820',
            color: '#ffffff',
            fontFamily: 'Arial Black',
            fontSize: '17px',
            padding: { x: 15, y: 11 }
        })
            .setOrigin(0.5)
            .setAlpha(0.82)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', function (this: GameObjects.Text) { this.setAlpha(1); })
            .on('pointerout', function (this: GameObjects.Text) { this.setAlpha(0.82); });
    }

    private refresh ()
    {
        const preferences = this.audio.getPreferences();

        this.musicButton.setText(`MÚSICA ${Math.round(preferences.musicVolume * 100)}%`);
        this.effectsButton.setText(`EFEITOS ${Math.round(preferences.effectsVolume * 100)}%`);
        this.muteButton.setText(preferences.muted ? 'SOM DESLIGADO' : 'SOM LIGADO');
    }

    private nextVolume (current: number)
    {
        const currentIndex = VOLUME_STEPS.findIndex((step) => step > current + 0.01);

        return currentIndex === -1 ? VOLUME_STEPS[0] : VOLUME_STEPS[currentIndex];
    }
}
