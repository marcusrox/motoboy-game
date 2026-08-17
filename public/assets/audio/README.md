# Áudio — Tuca Motoboy

Os efeitos arcade são gerados proceduralmente pelo comando `npm run generate:sfx`
e carregados pelo manifesto em `src/game/config/audioManifest.ts`. O gerador é
determinístico: executar o comando novamente produz o mesmo pacote.

Os efeitos usam WAV PCM mono a 48 kHz para reprodução direta nos navegadores. As
músicas, quando produzidas, devem usar WebM/Opus como formato principal e M4A/AAC
como alternativa para Safari e iPhone. Normalize sem clipping e deixe margem de
pico próxima de -1 dBFS.

## Efeitos

| Arquivos | Duração recomendada | Observação |
| --- | ---: | --- |
| `sfx/engine-loop.wav` | 3 s | Loop contínuo de motor arcade |
| `sfx/acceleration.wav` | 1,1 s | Subida curta de rotação |
| `sfx/braking.wav` | 0,68 s | Frenagem discreta |
| `sfx/collision.wav` | 0,52 s | Impacto curto, sem volume agressivo |
| `sfx/pickup.wav` | 0,58 s | Coleta de pedido |
| `sfx/delivery-complete.wav` | 1,18 s | Confirmação positiva |
| `sfx/money.wav` | 0,55 s | Crédito de recompensa |
| `sfx/pursuit-start.wav` | 1,25 s | Alerta de perigo |
| `sfx/pursuit-end.wav` | 1,05 s | Alívio ao escapar |
| `sfx/game-over.wav` | 2,35 s | Encerramento da partida |
| `sfx/ui-click.wav` | 0,12 s | Clique leve de interface |

## Música

| Arquivos | Duração recomendada | Observação |
| --- | ---: | --- |
| `music/menu.webm`, `music/menu.m4a` | 60–120 s | Loop calmo do menu |
| `music/gameplay.webm`, `music/gameplay.m4a` | 90–180 s | Loop principal de condução |
| `music/pursuit.webm`, `music/pursuit.m4a` | 60–120 s | Loop mais intenso para perseguições |

Depois de alterar o gerador, execute `npm run generate:sfx` e `npm run build`.
