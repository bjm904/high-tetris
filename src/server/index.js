const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, '../web')));
app.listen(80);

let clients = [];

const wss = new WebSocket.Server({ port: 1337 });

wss.on('connection', (ws) => {
  ws.id = Math.random();
  clients.push(ws);
  console.log(`Connected ${ws.id}`);

  ws.on('message', (messageRaw) => {
    const message = JSON.parse(messageRaw);

    if (message.gameData) {
      ws.gameId = message.gameData.id;
      ws.lastGameData = message.gameData;
    }

    const messageToSend = {
      command: 'opponentDataUpdate',
      opponentData: message.gameData,
    };
    clients.forEach((client) => {
      if (client.id !== ws.id) {
        client.send(JSON.stringify(messageToSend));
      }
    });

    const allClientsInReadyStatus = clients.every(c => c.lastGameData && c.lastGameData.status === 'ready');
    if (allClientsInReadyStatus) {
      const beginMessage = {
        command: 'beginGame',
      };
      clients.forEach((client) => {
        client.send(JSON.stringify(beginMessage));
      });
    }
  });

  ws.on('close', () => {
    console.log(`Disconnected ${ws.id}`);

    const messageToSend = {
      command: 'opponentLeaving',
      opponentGameId: ws.gameId,
    };
    clients.forEach((client) => {
      if (client.id !== ws.id) {
        client.send(JSON.stringify(messageToSend));
      }
    });

    // Remove from clients
    clients = clients.filter(client => client.id !== ws.id);
  });
});
