# Áudio — Tuca Motoboy

Os arquivos ainda não fazem parte do repositório. O manifesto fica em
`src/game/config/audioManifest.ts` e permanece com `enabled: false` até que os
dois formatos de cada item sejam adicionados.

Use WebM/Opus como formato principal e M4A/AAC como alternativa para Safari e
iPhone. Exporte efeitos em mono e músicas em estéreo, preferencialmente em
48 kHz. Normalize sem clipping e deixe margem de pico próxima de -1 dBFS.

## Efeitos

| Arquivos | Duração recomendada | Observação |
| --- | ---: | --- |
| `sfx/engine-loop.webm`, `sfx/engine-loop.m4a` | 2–4 s | Loop contínuo e sem emenda |
| `sfx/acceleration.webm`, `sfx/acceleration.m4a` | 0,8–1,5 s | Subida curta de rotação |
| `sfx/braking.webm`, `sfx/braking.m4a` | 0,4–0,9 s | Frenagem discreta |
| `sfx/collision.webm`, `sfx/collision.m4a` | 0,3–0,7 s | Impacto curto, sem volume agressivo |
| `sfx/pickup.webm`, `sfx/pickup.m4a` | 0,4–0,8 s | Coleta de pedido |
| `sfx/delivery-complete.webm`, `sfx/delivery-complete.m4a` | 0,8–1,5 s | Confirmação positiva |
| `sfx/money.webm`, `sfx/money.m4a` | 0,3–0,7 s | Crédito de recompensa |
| `sfx/pursuit-start.webm`, `sfx/pursuit-start.m4a` | 0,8–1,5 s | Alerta de perigo |
| `sfx/pursuit-end.webm`, `sfx/pursuit-end.m4a` | 0,8–1,5 s | Alívio ao escapar |
| `sfx/game-over.webm`, `sfx/game-over.m4a` | 1,5–3 s | Encerramento da partida |
| `sfx/ui-click.webm`, `sfx/ui-click.m4a` | 0,08–0,2 s | Clique leve de interface |

## Música

| Arquivos | Duração recomendada | Observação |
| --- | ---: | --- |
| `music/menu.webm`, `music/menu.m4a` | 60–120 s | Loop calmo do menu |
| `music/gameplay.webm`, `music/gameplay.m4a` | 90–180 s | Loop principal de condução |
| `music/pursuit.webm`, `music/pursuit.m4a` | 60–120 s | Loop mais intenso para perseguições |

Depois de adicionar os arquivos, altere `enabled` para `true` nas respectivas
entradas de `AUDIO_ASSET_MANIFEST` e execute `npm run build`.
