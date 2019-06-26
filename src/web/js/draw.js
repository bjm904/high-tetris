let GAME;

const drawInit = (gameGlobal) => {
  GAME = gameGlobal;
};

const drawGame = (context, gameData) => {
  // Clear the canvas for the next frame
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  context.textAlign = 'center';

  // Draw all the blocks
  gameData.blocks.forEach((block) => {
    block.draw(context, gameData.gridSize.size);
  });

  if (gameData.status === 'win') {
    // Add layer for darken
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = 'white';
    context.font = '60px Calibri';
    context.fillText('WINNER', context.canvas.width / 2, context.canvas.height / 2);
  }

  if (gameData.status === 'lose') {
    // Add layer for darken
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = 'white';
    context.font = '60px Calibri';
    context.fillText('LOSER', context.canvas.width / 2, context.canvas.height / 2);
  }

  if (gameData.status === 'waiting') {
    // Add layer for darken
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = 'white';
    context.font = '40px Calibri';
    context.fillText('Hit Spacebar', context.canvas.width / 2, context.canvas.height / 2);
  }

  if (gameData.status === 'ready') {
    // Add layer for darken
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.fillStyle = 'white';
    context.font = '40px Calibri';
    context.fillText('READY! Waiting for others', context.canvas.width / 2, context.canvas.height / 2);
  }

  if (gameData.flashScreen) {
    // Add layer for darken
    context.fillStyle = 'rgba(255, 255, 255, 0.8)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  }

  // Draw player name
  context.fillStyle = 'white';
  context.font = '25px Calibri';
  context.fillText(gameData.playerName, context.canvas.width / 2, 30);
};

// eslint-disable-next-line no-unused-vars
const drawLoop = () => {
  const canvasElement = document.getElementById('gameCanvas');
  const context = canvasElement.getContext('2d');

  drawGame(context, GAME);

  GAME.opponents.forEach((gameDataOpponent) => {
    const canvasElementOpponent = document.getElementById(`gameCanvas-${gameDataOpponent.id}`);
    const contextOpponent = canvasElementOpponent.getContext('2d');

    drawGame(contextOpponent, gameDataOpponent);
  });

  // Rerun the draw loop
  requestAnimationFrame(drawLoop);
};

export { drawInit, drawLoop };
