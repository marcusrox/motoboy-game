# Pipeline de assets — Tuca Motoboy

Os assets devem ser originais ou possuir licença compatível com o projeto. Não utilize marcas reais, logotipos comerciais ou material protegido sem autorização.

## Ativação

O catálogo central fica em `src/game/config/assetManifest.ts`. Enquanto a arte não existe, cada entrada permanece com `enabled: false` e o jogo utiliza os placeholders geométricos.

Para ativar um asset:

1. exporte o arquivo para o caminho indicado abaixo;
2. confirme o nome, transparência e dimensões;
3. altere a entrada correspondente para `enabled: true` no manifesto;
4. execute `npm run build`.

Se um asset habilitado estiver ausente ou inválido, a `BootScene` informa o problema no console e o objeto continua usando seu placeholder.

## Kit de arte ativo

O conjunto 0.8 está completo: todos os 21 arquivos listados abaixo estão produzidos e ativos no manifesto. Os fallbacks geométricos permanecem no código para tornar falhas de carregamento compreensíveis durante o desenvolvimento.

## Convenções

- Formato recomendado para imagens: PNG com transparência.
- Orientação padrão dos veículos: frente apontando para cima.
- Origem visual: centro do frame.
- Evite espaços, acentos e letras maiúsculas nos nomes dos arquivos.
- Spritesheets usam frames horizontais, todos com a mesma dimensão.
- Mantenha margem transparente nos frames animados para evitar tremores.

## Arquivos de imagem planejados

| Arquivo | Dimensão recomendada | Finalidade |
| --- | ---: | --- |
| `sprites/player/player-idle.png` | 384×96, 4 frames de 96×96 | Moto parada e pequena animação de motor |
| `sprites/player/player-move.png` | 576×96, 6 frames de 96×96 | Moto em movimento |
| `sprites/player/player-turn.png` | 384×96, 4 frames de 96×96 | Inclinação durante curvas |
| `sprites/player/player-collision.png` | 384×96, 4 frames de 96×96 | Reação visual a colisões |
| `sprites/vehicles/car-blue.png` | 64×112 | Primeira variação de carro comum |
| `sprites/vehicles/car-red.png` | 64×112 | Segunda variação de carro comum |
| `sprites/vehicles/car-green.png` | 64×112 | Terceira variação de carro comum |
| `sprites/enemies/pursuer-idle.png` | 384×96, 4 frames de 96×96 | Perseguidor parado ou surgindo |
| `sprites/enemies/pursuer-move.png` | 576×96, 6 frames de 96×96 | Perseguidor em movimento |
| `sprites/enemies/pursuer-collision.png` | 384×96, 4 frames de 96×96 | Reação do perseguidor a colisões |
| `sprites/buildings/building-small.png` | 256×256 | Prédio pequeno visto de cima |
| `sprites/buildings/building-medium.png` | 384×512 | Prédio médio visto de cima |
| `sprites/buildings/building-large.png` | 512×640 | Prédio grande visto de cima |
| `sprites/buildings/building-narrow.png` | 192×1088 | Prédio comprido para lotes urbanos estreitos |
| `environment/road-wide.png` | 320×320, repetível | Textura modular para avenidas |
| `environment/road-narrow.png` | 160×320, repetível | Textura modular para ruas estreitas |
| `environment/sidewalk.png` | 128×128, repetível | Piso de calçadas e entorno dos prédios |
| `environment/plaza.png` | 256×256, repetível | Piso da área aberta/praça |
| `ui/delivery-marker.png` | 64×64 | Ícone de coleta e destino |
| `ui/pursuit-warning.png` | 64×64 | Indicador visual de perseguição |
| `effects/collision.png` | 768×128, 6 frames de 128×128 | Efeito breve de impacto |

## Áudio

A infraestrutura de áudio está disponível desde a versão 0.9. Os arquivos
continuam desabilitados até serem produzidos. Consulte `audio/README.md` para a
lista exata, formatos, durações e instruções de ativação.

## Arquivos antigos

`bg.png` e `logo.png` vieram do template original e não participam do jogo atual. Eles foram mantidos temporariamente para evitar remoção de arquivos fora do escopo desta versão.
