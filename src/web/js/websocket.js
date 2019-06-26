import { Block } from './block.js';
import PlaySound from './sound.js';

let GAME;

const socket = {
  isConnected: false,
};

const onopen = () => {
  socket.isConnected = true;
};

const onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.command === 'opponentDataUpdate') {
    const newOpponentData = message.opponentData;
    newOpponentData.blocks = newOpponentData.blocks.map(blockData => new Block(blockData));

    const opponentIndex = GAME.opponents.findIndex(op => op.id === newOpponentData.id);
    if (opponentIndex > -1) {
      GAME.opponents[opponentIndex] = newOpponentData;
    } else {
      const canvasElementOpponent = document.getElementById(`gameCanvas-${newOpponentData.id}`);
      if (!canvasElementOpponent) {
        const gameContainer = document.getElementById('gameContainer');
        gameContainer.innerHTML += `<canvas class="gameCanvas gameCanvasOpponent" id="gameCanvas-${newOpponentData.id}" height="600" width="300" />`;
      }

      GAME.opponents.push(newOpponentData);
    }

    if (newOpponentData.status === 'win' && GAME.status === 'running') {
      GAME.status = 'lose';
    }
  } else if (message.command === 'opponentLeaving') {
    // Remove opponent game data
    GAME.opponents = GAME.opponents.filter(op => op.id !== message.opponentGameId);
    
    // Remove HTML canvas
    const gameContainer = document.getElementById('gameContainer');
    const canvasElementOpponent = document.getElementById(`gameCanvas-${message.opponentGameId}`);
    gameContainer.removeChild(canvasElementOpponent);
  } else if (message.command === 'beginGame') {
    GAME.status = 'running';
  } else if (message.command === 'removeRow') {
    PlaySound('clearRow');
    const sinkInterval = setInterval(() => {
      GAME.blocks.forEach((block) => {
        block.applyMovement({ x: 0, y: 0.2 });
      });
    }, 20);
    setTimeout(() => {
      clearInterval(sinkInterval);
    }, 500);
    //GAME.flashScreen = true;
    setTimeout(() => {
      GAME.flashScreen = false;
    }, 200);
  }
};

const onclose = () => {
  socket.isConnected = false;
  setTimeout(open, 2000);
};

const onerror = (err) => {
  console.error(err);
};

const open = () => {
  if (socket.ws) {
    socket.ws.close();
  }
  socket.ws = new WebSocket(`${socket.wsUrl}${window.location.search}`);
  socket.ws.onopen = onopen;
  socket.ws.onmessage = onmessage;
  socket.ws.onclose = onclose;
  socket.ws.onerror = onerror;
};

socket.init = (gameGlobal, wsUrl) => {
  GAME = gameGlobal;
  socket.wsUrl = wsUrl;
  open();
};

socket.send = (data) => {
  if (socket.isConnected) {
    socket.ws.send(JSON.stringify(data));
  }
};

socket.sendGameStateUpdate = () => {
  const gameStateCopy = JSON.parse(JSON.stringify(GAME));
  delete gameStateCopy.opponents;

  const message = {
    command: 'gameDataUpdate',
    gameData: gameStateCopy,
  };
  socket.send(message);
};

export default socket;
