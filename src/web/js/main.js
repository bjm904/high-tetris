import { Block, blockInit } from './block.js';
import PressedKeys from './controls.js';
import { drawInit, drawLoop } from './draw.js';
import socket from './websocket.js';

let GAME;

const GameLoop = () => {
  if (Date.now() - GAME.lastTickTime > GAME.tickInterval) {
    GAME.lastTickTime = Date.now();

    if (GAME.status === 'waiting' && PressedKeys.has(32)) {
      GAME.status = 'ready';
    } else if (GAME.status === 'running') {
      let thereIsAnActiveBlock = false;
      GAME.blocks.forEach((block) => {
        if (block.isActive) {
          // Set our flag for knowign there is an active block
          thereIsAnActiveBlock = true;

          const movementDelta = {
            x: 0,
            y: 1,
          };

          if (PressedKeys.has(37)) {
            // Left Arrow
            movementDelta.x = -1;
          } else if (PressedKeys.has(39)) {
            // Right Arrow
            movementDelta.x = 1;
          }
          if (PressedKeys.has(40)) {
            // Down Arrow
            movementDelta.y = 2;
          }

          block.tryToApplyMovement(movementDelta);
        }
      });

      if (!thereIsAnActiveBlock) {
        // If there is no active block, check for win then spawn another

        // Check for win
        const win = GAME.blocks.some(block => (
          block.subBlocks.some(subBlock => (
            subBlock.y === 0
          ))
        ));

        if (win) {
          GAME.status = 'win';
        } else if (GAME.status === 'running') {
          // Spawn new block
          const newBlock = new Block();
          GAME.blocks.push(newBlock);
        }
      }
    }

    socket.sendGameStateUpdate();
  }
  requestAnimationFrame(GameLoop);
};

const gameInit = () => {
  GAME = {
    id: Math.random(),
    playerName: window.prompt('Enter your name'),
    blocks: [],
    gridSize: {
      height: 32,
      width: 24,
      size: 20,
    },
    lastTickTime: 0,
    tickInterval: 100,
    status: 'waiting',
    opponents: [],
  };

  const gameContainer = document.getElementById('gameContainer');
  gameContainer.innerHTML = '<canvas class="gameCanvas" id="gameCanvas" height="640" width="480" />';
};

gameInit();
socket.init(GAME, `ws://${window.location.host}:1337`);
blockInit(GAME);
drawInit(GAME);

requestAnimationFrame(drawLoop);
requestAnimationFrame(GameLoop);
