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
      const rows = [];
      GAME.blocks.forEach((block) => {
        if (block.isActive) {
          // Set our flag for knowign there is an active block
          thereIsAnActiveBlock = true;

          const movementDelta = {
            x: 0,
            y: 1,
          };

          if (PressedKeys.has(37) || PressedKeys.has(65)) {
            // Left Arrow
            movementDelta.x = -1;
          } else if (PressedKeys.has(39) || PressedKeys.has(68)) {
            // Right Arrow
            movementDelta.x = 1;
          }
          if (PressedKeys.has(40) || PressedKeys.has(83)) {
            // Down Arrow
            movementDelta.y = 2;
          }

          block.tryToApplyMovement(movementDelta);
        }

        block.subBlocks.forEach((subBlock) => {
          rows[subBlock.y] = rows[subBlock.y] || 0;
          rows[subBlock.y] += 1;
        });
      });

      // Check for full rows
      rows.forEach((row, rowNum) => {
        if (row > GAME.gridSize.width * 0.5) {
          if (!GAME.rowAlreadyCounted[rowNum]) {
            GAME.rowAlreadyCounted[rowNum] = true;
            socket.send({
              command: 'removeRow',
            });
          }
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
  let playerName = window.prompt('Enter your name') || 'Idiot';
  playerName = playerName.substr(0, 20);
  GAME = {
    playerName,
    id: Math.random(),
    blocks: [],
    gridSize: {
      height: 32,
      width: 24,
      size: 20,
    },
    lastTickTime: 0,
    tickInterval: 40,
    status: 'waiting',
    opponents: [],
    rowAlreadyCounted: [],
    flashScreen: false,
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
