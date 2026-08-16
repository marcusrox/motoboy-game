import { Math as PhaserMath, Scene, Sound } from 'phaser';
import { AUDIO_KEYS, AudioEffectKey } from '../config/audioManifest';

export interface AudioPreferences
{
    musicVolume: number;
    effectsVolume: number;
    muted: boolean;
}

const STORAGE_KEY = 'tuca-motoboy:audio:v1';
const DEFAULT_PREFERENCES: AudioPreferences = {
    musicVolume: 0.6,
    effectsVolume: 0.8,
    muted: false
};

interface AdjustableSound extends Sound.BaseSound
{
    setRate: (value: number) => AdjustableSound;
    setVolume: (value: number) => AdjustableSound;
}

export class AudioManager
{
    private preferences = this.loadPreferences();
    private music: AdjustableSound | null = null;
    private engine: AdjustableSound | null = null;
    private gameplayMusicActive = false;
    private pursuitActive = false;
    private wasAccelerating = false;

    constructor (private scene: Scene)
    {
        scene.sound.setMute(this.preferences.muted);
        scene.events.once('shutdown', this.destroy, this);
    }

    getPreferences (): AudioPreferences
    {
        return { ...this.preferences };
    }

    setMusicVolume (volume: number)
    {
        this.preferences.musicVolume = PhaserMath.Clamp(volume, 0, 1);
        this.music?.setVolume(this.preferences.musicVolume);
        this.savePreferences();
    }

    setEffectsVolume (volume: number)
    {
        this.preferences.effectsVolume = PhaserMath.Clamp(volume, 0, 1);
        this.savePreferences();
    }

    setMuted (muted: boolean)
    {
        this.preferences.muted = muted;
        this.scene.sound.setMute(muted);
        this.savePreferences();
    }

    startMenuMusic ()
    {
        this.gameplayMusicActive = false;
        this.playMusic(AUDIO_KEYS.menuMusic);
    }

    startGameplayMusic ()
    {
        this.gameplayMusicActive = true;
        this.pursuitActive = false;
        this.playMusic(AUDIO_KEYS.gameplayMusic);
    }

    setPursuitActive (active: boolean)
    {
        if (this.pursuitActive === active)
        {
            return;
        }

        this.pursuitActive = active;

        if (active)
        {
            this.playEffect(AUDIO_KEYS.pursuitStart);

            if (this.hasAudio(AUDIO_KEYS.pursuitMusic))
            {
                this.playMusic(AUDIO_KEYS.pursuitMusic);
            }
        }
        else
        {
            this.playEffect(AUDIO_KEYS.pursuitEnd);

            if (this.gameplayMusicActive)
            {
                this.playMusic(AUDIO_KEYS.gameplayMusic);
            }
        }
    }

    updateMotor (speedRatio: number, accelerating: boolean)
    {
        const normalizedSpeed = PhaserMath.Clamp(speedRatio, 0, 1);

        if (!this.engine && this.hasAudio(AUDIO_KEYS.engine))
        {
            this.engine = this.scene.sound.add(
                AUDIO_KEYS.engine,
                { loop: true }
            ) as AdjustableSound;
            this.engine.play();
        }

        this.engine
            ?.setRate(0.78 + normalizedSpeed * 0.62)
            .setVolume(this.preferences.effectsVolume * (0.28 + normalizedSpeed * 0.42));

        if (accelerating && !this.wasAccelerating)
        {
            this.playEffect(AUDIO_KEYS.acceleration, 0.8);
        }
        else if (!accelerating && this.wasAccelerating && normalizedSpeed > 0.3)
        {
            this.playEffect(AUDIO_KEYS.braking, 0.75);
        }

        this.wasAccelerating = accelerating;
    }

    playEffect (key: AudioEffectKey, volumeScale = 1)
    {
        if (!this.hasAudio(key) || this.preferences.effectsVolume <= 0)
        {
            return;
        }

        this.scene.sound.play(key, {
            volume: this.preferences.effectsVolume * PhaserMath.Clamp(volumeScale, 0, 1)
        });
    }

    playUiClick ()
    {
        this.playEffect(AUDIO_KEYS.uiClick, 0.65);
    }

    handleGameOver ()
    {
        this.pursuitActive = false;
        this.music?.stop();
        this.engine?.stop();
        this.playEffect(AUDIO_KEYS.gameOver);
    }

    private playMusic (key: string)
    {
        if (!this.hasAudio(key))
        {
            return;
        }

        if (this.music?.key === key && this.music.isPlaying)
        {
            return;
        }

        this.music?.stop();
        this.music?.destroy();
        this.music = this.scene.sound.add(key, {
            loop: true,
            volume: this.preferences.musicVolume
        }) as AdjustableSound;
        this.music.play();
    }

    private hasAudio (key: string)
    {
        return this.scene.cache.audio.exists(key);
    }

    private loadPreferences (): AudioPreferences
    {
        try
        {
            const stored = localStorage.getItem(STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) as Partial<AudioPreferences> : {};

            return {
                musicVolume: this.validVolume(parsed.musicVolume, DEFAULT_PREFERENCES.musicVolume),
                effectsVolume: this.validVolume(parsed.effectsVolume, DEFAULT_PREFERENCES.effectsVolume),
                muted: typeof parsed.muted === 'boolean' ? parsed.muted : DEFAULT_PREFERENCES.muted
            };
        }
        catch
        {
            return { ...DEFAULT_PREFERENCES };
        }
    }

    private savePreferences ()
    {
        try
        {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
        }
        catch
        {
            // O jogo continua com as preferências da sessão quando o armazenamento é bloqueado.
        }
    }

    private validVolume (value: unknown, fallback: number)
    {
        return typeof value === 'number' && Number.isFinite(value)
            ? PhaserMath.Clamp(value, 0, 1)
            : fallback;
    }

    private destroy ()
    {
        this.music?.stop();
        this.music?.destroy();
        this.engine?.stop();
        this.engine?.destroy();
        this.music = null;
        this.engine = null;
    }
}
