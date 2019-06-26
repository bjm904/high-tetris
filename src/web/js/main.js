import { Block, blockInit } from './block.js';
import { drawInit, drawLoop } from './draw.js';
import PlaySound from './sound.js';
import PressedKeys from './controls.js';
import socket from './websocket.js';

let GAME;

const GameLoop = () => {
  if (GAME.status === 'waiting' && PressedKeys.has(32)) {
    GAME.status = 'ready';
  } else if (GAME.status === 'lose' && PressedKeys.has(32)) {
    GAME.status = 'ready';
  } else if (GAME.status === 'running') {
    GAME.rows.forEach((rowValue, rowNum) => {
      GAME.rows[rowNum] = 0;
    });
    let thereIsAnActiveBlock = false;
    GAME.blocks.forEach((block) => {
      if (block.isActive) {
        // Set our flag for knowign there is an active block
        thereIsAnActiveBlock = true;

        const movementDelta = {
          x: 0,
          y: 0,
        };

        let modifiedGravityInverval = GAME.gravityInterval;
        // If arrow down is pressed, allow gravity to run more often and increase speed
        if (PressedKeys.has(40) || PressedKeys.has(83)) {
          modifiedGravityInverval = 5;
        }
        if (Date.now() - GAME.lastGravityTime > modifiedGravityInverval) {
          GAME.lastGravityTime = Date.now();
          movementDelta.y += 0.2;
        }

        if (Date.now() - GAME.lastConrolTime > GAME.controlInterval) {
          GAME.lastConrolTime = Date.now();
          if (PressedKeys.has(37) || PressedKeys.has(65)) {
            // Left Arrow
            movementDelta.x = -1;
          } else if (PressedKeys.has(39) || PressedKeys.has(68)) {
            // Right Arrow
            movementDelta.x = 1;
          }
        }

        block.tryToApplyMovement(movementDelta);
      }

      block.subBlocks.forEach((subBlock) => {
        GAME.rows[Math.round(subBlock.y)] = GAME.rows[Math.round(subBlock.y)] || 0;
        GAME.rows[Math.round(subBlock.y)] += 1;
      });
    });

    // Check for full rows
    GAME.rows.forEach((rowValue, rowNum) => {
      if (rowValue >= GAME.gridSize.width * 0.7) {
        if (!GAME.rowAlreadyCounted[rowNum]) {
          GAME.rowAlreadyCounted[rowNum] = true;
          socket.send({
            command: 'removeRow',
          });
          PlaySound('clearRow');
        }
      }
    });

    if (!thereIsAnActiveBlock) {
      // If there is no active block, check for win then spawn another

      // Check for win
      const win = GAME.rows.every(rowValue => rowValue && rowValue > 0);

      if (win) {
        GAME.status = 'win';
      } else if (GAME.status === 'running') {
        // Spawn new block
        PlaySound('blockSet');
        const newBlock = new Block();
        GAME.blocks.push(newBlock);
      }
    }
  }

  socket.sendGameStateUpdate();
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
      height: 30,
      width: 15,
      size: 20,
    },
    lastGravityTime: 0,
    gravityInterval: 20,
    lastConrolTime: 0,
    controlInterval: 100,
    status: 'waiting',
    opponents: [],
    rowAlreadyCounted: [],
    flashScreen: false,
  };
  GAME.rows = [...new Array(GAME.gridSize.height)];

  const gameContainer = document.getElementById('gameContainer');
  gameContainer.innerHTML = '<canvas class="gameCanvas" id="gameCanvas" height="600" width="300" />';
};

gameInit();
socket.init(GAME, `ws://${window.location.host}:1337`);
blockInit(GAME);
drawInit(GAME);

requestAnimationFrame(drawLoop);
requestAnimationFrame(GameLoop);
