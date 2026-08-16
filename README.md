# Tuca Motoboy

> **Piloto de fuga**

**Tuca Motoboy** é um jogo de ação e entregas com visão top-down, ambientado em uma cidade brasileira. O jogador pilota uma moto pelas ruas, realiza entregas, evita o trânsito e tenta escapar de perseguidores para acumular dinheiro e alcançar uma pontuação cada vez maior.

O projeto é mobile-first, pensado principalmente para smartphones Android e iPhone em orientação retrato, mas também funciona em navegadores desktop.

## Estado atual

O jogo está em desenvolvimento. A versão atual contém:

**Versão atual: 0.8**

- cidade top-down com ruas, prédios, calçadas, cruzamentos, beco e área aberta;
- motoboy com aceleração gradual, frenagem, inércia e rotação;
- controles por teclado e joystick virtual touch;
- câmera suave em um mundo maior que a tela;
- colisões com cenário e veículos;
- sistema de entregas com destinos aleatórios e recompensa por distância;
- bônus por entrega rápida e sem colisões;
- trânsito simples seguindo rotas e faixas;
- sistema de perseguição e condição de Game Over;
- dinheiro, pontuação, sequência de entregas e estatísticas da partida;
- recordes locais persistidos no navegador.

Os elementos visuais ainda são provisórios e produzidos com formas geométricas do Phaser, sem assets externos.

## Como jogar

Comece a partida e dirija até o **Restaurante** para receber automaticamente uma entrega. O destino será destacado no mapa e suas informações aparecerão no HUD. Chegue ao cliente para receber a recompensa e iniciar a próxima entrega.

Após a primeira entrega, novos pedidos podem provocar uma perseguição. Mantenha distância do perseguidor pelo tempo necessário para escapar. Uma colisão com o perseguidor encerra a partida.

### Controles

Desktop:

- `WASD` ou setas direcionais: movimentar a moto;
- `Enter` ou `Espaço`: jogar novamente na tela de Game Over;
- mouse: botões da interface.

Mobile:

- toque e arraste na região inferior: abre um joystick flutuante para movimentar a moto;
- toque: botões da interface.

Quando disponível no navegador, o botão **Tela cheia** permite ampliar a área do jogo. Em smartphones usados na horizontal, a interface sugere retornar à orientação vertical.

## Progressão

O valor-base de uma entrega considera a distância entre o restaurante e o destino. Entregas rápidas e entregas concluídas sem colisões concedem bônus financeiros.

A pontuação é independente do dinheiro e considera:

- entregas concluídas;
- rapidez da entrega;
- sequência de entregas na mesma partida;
- fugas bem-sucedidas;
- penalidades por colisão com o trânsito.

Os parâmetros e fórmulas podem ser ajustados em `src/game/config/progressionConfig.ts`.

Os recordes de pontuação, entregas e dinheiro são armazenados por meio de uma abstração sobre `localStorage`. Não há login, servidor ou ranking online nesta etapa.

## Tecnologias

- [Phaser 4](https://phaser.io/) `4.0.0`;
- [TypeScript](https://www.typescriptlang.org/) `5.7`;
- [Vite](https://vite.dev/) `6.3`;
- HTML5, Canvas e WebGL;
- Arcade Physics do Phaser.

Não são utilizados React, Vue, Angular ou outros frameworks de interface.

## Requisitos

- [Node.js](https://nodejs.org/) em uma versão compatível com Vite 6;
- npm.

## Instalação e execução

```bash
npm install
npm run dev
```

O servidor de desenvolvimento usa hot reload. O endereço exibido pelo Vite pode ser aberto no navegador desktop ou, quando a rede local permitir, em um smartphone conectado à mesma rede.

### Build de produção

```bash
npm run build
```

O resultado é gerado em `dist/`. Para publicar o jogo, disponibilize todo o conteúdo dessa pasta em um servidor web estático.

Comandos disponíveis:

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run dev-nolog` | Inicia o desenvolvimento sem a telemetria do template Phaser |
| `npm run build-nolog` | Gera o build sem a telemetria do template Phaser |

Os comandos padrão executam o `log.js` herdado do template oficial, que envia ao Phaser Studio apenas informações anônimas sobre o tipo de execução e a versão do Phaser. Use as variantes `-nolog` para desabilitar essa chamada.

## Estrutura do projeto

```text
src/
├── main.ts                  # Inicialização da aplicação
└── game/
    ├── main.ts              # Configuração do Phaser e resolução lógica
    ├── config/              # Parâmetros de progressão, perseguição e trânsito
    ├── objects/             # Motoboy, perseguidor, carros e marcadores
    ├── scenes/              # BootScene, MainMenuScene e GameScene
    ├── systems/             # Entregas, trânsito, perseguição e estatísticas
    └── ui/                  # HUD, joystick virtual e Game Over
```

Os arquivos gráficos e de áudio ficam em `public/assets/`. Consulte `public/assets/README.md` para nomes, dimensões, convenções e instruções de ativação. O carregamento é centralizado na `BootScene`; enquanto uma arte estiver desabilitada ou ausente, o jogo mantém os placeholders geométricos.

Responsabilidades principais:

- `BootScene`: inicia o fluxo de cenas;
- `MainMenuScene`: apresenta o título e inicia a partida;
- `GameScene`: compõe o mapa e integra os sistemas;
- `objects`: objetos visuais e físicos reutilizáveis;
- `systems`: regras de gameplay separadas da cena;
- `ui`: elementos fixos de interface e controles touch;
- `config`: constantes centralizadas para facilitar o balanceamento.

## Configuração do jogo

O jogo usa resolução lógica de `720 × 1280`, orientação retrato e escala responsiva `FIT`. A cidade atual possui aproximadamente `2400 × 3200` pixels.

Parâmetros de balanceamento ficam em:

- `src/game/config/progressionConfig.ts`: dinheiro, bônus e pontuação;
- `src/game/config/pursuitConfig.ts`: chance, atraso, velocidade e fuga da perseguição;
- `src/game/config/trafficConfig.ts`: quantidade, velocidade, rotas e colisões do trânsito.
- `src/game/config/gameVersion.ts`: versão exibida na tela inicial.

## Compatibilidade

O objetivo é manter compatibilidade com navegadores modernos em:

- Android;
- iPhone e iPad;
- Windows, macOS e Linux.

Em dispositivos móveis, recomenda-se jogar em orientação retrato e em tela cheia quando disponível.

## Licença

Consulte o arquivo [LICENSE](LICENSE) para os termos aplicáveis ao código-base do projeto.
