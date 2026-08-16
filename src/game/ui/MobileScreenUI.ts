import { GameObjects, Scene } from 'phaser';

const LOGICAL_WIDTH = 720;
const LOGICAL_HEIGHT = 1280;
const SAFE_MARGIN = 28;

export class MobileScreenUI
{
    private fullscreenButton: GameObjects.Text;
    private orientationOverlay: GameObjects.Container;
    private touchCapable: boolean;

    constructor (private scene: Scene)
    {
        this.touchCapable = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;

        this.fullscreenButton = scene.add.text(
            LOGICAL_WIDTH - SAFE_MARGIN,
            LOGICAL_HEIGHT - 54,
            'TELA CHEIA',
            {
                backgroundColor: '#111820',
                color: '#ffffff',
                fontFamily: 'Arial Black',
                fontSize: '16px',
                padding: { x: 16, y: 13 }
            }
        )
            .setOrigin(1, 1)
            .setScrollFactor(0)
            .setDepth(450)
            .setAlpha(0.68)
            .setInteractive({ useHandCursor: true });

        const shade = scene.add.rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x090c10, 0.94)
            .setOrigin(0)
            .setInteractive();
        const title = scene.add.text(LOGICAL_WIDTH / 2, 545, 'GIRE O CELULAR', {
            align: 'center',
            color: '#f4d35e',
            fontFamily: 'Arial Black',
            fontSize: '42px'
        }).setOrigin(0.5);
        const message = scene.add.text(
            LOGICAL_WIDTH / 2,
            625,
            'Tuca Motoboy foi feito para\njogar na orientação vertical.',
            {
                align: 'center',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontSize: '25px',
                lineSpacing: 8
            }
        ).setOrigin(0.5);

        this.orientationOverlay = scene.add.container(0, 0, [shade, title, message])
            .setScrollFactor(0)
            .setDepth(2000);

        this.fullscreenButton.on('pointerup', this.toggleFullscreen, this);
        this.fullscreenButton.on('pointerover', () => this.fullscreenButton.setAlpha(1));
        this.fullscreenButton.on('pointerout', () => this.fullscreenButton.setAlpha(0.68));
        scene.scale.on('enterfullscreen', this.refreshFullscreenLabel, this);
        scene.scale.on('leavefullscreen', this.refreshFullscreenLabel, this);
        window.addEventListener('resize', this.refreshLayout);
        window.addEventListener('orientationchange', this.refreshLayout);
        scene.events.once('shutdown', this.destroy, this);

        this.refreshLayout();
        this.refreshFullscreenLabel();
    }

    private toggleFullscreen ()
    {
        if (this.scene.scale.isFullscreen)
        {
            this.scene.scale.stopFullscreen();
        }
        else
        {
            this.scene.scale.startFullscreen({ navigationUI: 'hide' });
        }
    }

    private refreshFullscreenLabel ()
    {
        this.fullscreenButton.setText(this.scene.scale.isFullscreen ? 'SAIR DA TELA CHEIA' : 'TELA CHEIA');
    }

    private refreshLayout = () =>
    {
        const landscape = this.touchCapable && window.innerWidth > window.innerHeight;

        this.orientationOverlay.setVisible(landscape);
        this.fullscreenButton.setVisible(this.scene.scale.fullscreen.available && !landscape);
    };

    private destroy ()
    {
        window.removeEventListener('resize', this.refreshLayout);
        window.removeEventListener('orientationchange', this.refreshLayout);
        this.scene.scale.off('enterfullscreen', this.refreshFullscreenLabel, this);
        this.scene.scale.off('leavefullscreen', this.refreshFullscreenLabel, this);
        this.fullscreenButton.off('pointerup', this.toggleFullscreen, this);
    }
}
