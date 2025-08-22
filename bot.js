const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || 'OWNER_TELEGRAM_ID';
const WEB_APP_URL =  `https://${process.env.VERCEL_URL}` ;
console.log(BOT_TOKEN);
// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { webHook: { port: 443 } });

bot.setWebHook(`${YOUR_DEPLOYED_HTTPS_URL}/api/bot`);
// In-memory data storage
let users = {};
let rooms = {
  'room1': {
    id: 'room1',
    name: 'Quick Bingo',
    betAmount: 5,
    maxPlayers: 50,
    players: [],
    status: 'waiting', // waiting, playing, finished
    drawnNumbers: [],
    winner: null,
    gameStartTime: null
  },
  'room2': {
    id: 'room2',
    name: 'High Stakes',
    betAmount: 20,
    maxPlayers: 25,
    players: [],
    status: 'waiting',
    drawnNumbers: [],
    winner: null,
    gameStartTime: null
  }
};

let gameInstances = {};
let withdrawRequests = [];

// Express server for API
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('dist'));

// Bot commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const username = msg.from.username || msg.from.first_name || 'Player';

  // Register user if not exists
  if (!users[userId]) {
    users[userId] = {
      id: userId,
      username: username,
      balance: 50,
      cartelas: [],
      currentRoom: null,
      winCount: 0,
      totalWinnings: 0
    };
  }

  const welcomeMessage = `🎉 Welcome to Telegram Bingo Bot!

Your starting balance: ${users[userId].balance} ETB

Click the button below to start playing!`;

  const options = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🎯 Start Game',
          web_app: { url: `${WEB_APP_URL}?userId=${userId}&username=${username}` }
        }
      ]]
    }
  };

  bot.sendMessage(chatId, welcomeMessage, options);
});

// Owner commands
bot.onText(/\/createroom (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== BOT_OWNER_ID) {
    bot.sendMessage(chatId, '❌ Unauthorized command');
    return;
  }

  try {
    const roomData = JSON.parse(match[1]);
    const roomId = `room_${Date.now()}`;
    
    rooms[roomId] = {
      id: roomId,
      name: roomData.name || 'New Room',
      betAmount: roomData.betAmount || 10,
      maxPlayers: roomData.maxPlayers || 50,
      players: [],
      status: 'waiting',
      drawnNumbers: [],
      winner: null,
      gameStartTime: null
    };

    bot.sendMessage(chatId, `✅ Room created: ${rooms[roomId].name}`);
  } catch (error) {
    bot.sendMessage(chatId, '❌ Invalid room data. Use: /createroom {"name":"Room Name","betAmount":10,"maxPlayers":50}');
  }
});

bot.onText(/\/deleteroom (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== BOT_OWNER_ID) {
    bot.sendMessage(chatId, '❌ Unauthorized command');
    return;
  }

  const roomId = match[1];
  if (rooms[roomId]) {
    delete rooms[roomId];
    bot.sendMessage(chatId, `✅ Room ${roomId} deleted`);
  } else {
    bot.sendMessage(chatId, '❌ Room not found');
  }
});

bot.onText(/\/winners/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== BOT_OWNER_ID) {
    bot.sendMessage(chatId, '❌ Unauthorized command');
    return;
  }

  const winners = Object.values(users)
    .filter(user => user.winCount > 0)
    .sort((a, b) => b.totalWinnings - a.totalWinnings)
    .slice(0, 10);

  let message = '🏆 Top Winners:\n\n';
  winners.forEach((user, index) => {
    message += `${index + 1}. ${user.username} - ${user.winCount} wins, ${user.totalWinnings} coins\n`;
  });

  bot.sendMessage(chatId, message || 'No winners yet');
});

bot.onText(/\/approvepayment (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();

  if (userId !== BOT_OWNER_ID) {
    bot.sendMessage(chatId, '❌ Unauthorized command');
    return;
  }

  const targetUserId = match[1];
  const request = withdrawRequests.find(r => r.userId === targetUserId);
  
  if (request) {
    bot.sendMessage(request.chatId, `✅ Your withdrawal of ${request.amount} coins has been approved!`);
    withdrawRequests = withdrawRequests.filter(r => r.userId !== targetUserId);
    bot.sendMessage(chatId, `✅ Payment approved for user ${targetUserId}`);
  } else {
    bot.sendMessage(chatId, '❌ No pending withdrawal request found');
  }
});

// API endpoints
app.get('/api/user/:userId', (req, res) => {
  const userId = req.params.userId;
  const user = users[userId];
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

app.get('/api/rooms', (req, res) => {
  const roomList = Object.values(rooms).map(room => ({
    ...room,
    playerCount: room.players.length
  }));
  res.json(roomList);
});

app.get('/api/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = rooms[roomId];
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(room);
});

app.post('/api/join-room', (req, res) => {
  const { userId, roomId } = req.body;
  const user = users[userId];
  const room = rooms[roomId];
  
  if (!user || !room) {
    return res.status(404).json({ error: 'User or room not found' });
  }
  
  if (user.balance < room.betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  if (room.players.length >= room.maxPlayers) {
    return res.status(400).json({ error: 'Room is full' });
  }
  
  if (room.players.some(p => p.userId === userId)) {
    return res.status(400).json({ error: 'Already joined this room' });
  }
  
  // Generate bingo cartela
  const cartela = generateBingoCard();
  
  // Deduct balance and join room
  user.balance -= room.betAmount;
  user.currentRoom = roomId;
  
  room.players.push({
    userId,
    username: user.username,
    cartela,
    markedNumbers: [],
    hasWon: false
  });
  
  res.json({ success: true, cartela, balance: user.balance });
});

app.post('/api/start-game', (req, res) => {
  const { roomId } = req.body;
  const room = rooms[roomId];
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Game already started' });
  }
  
  if (room.players.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 players' });
  }
  
  // Start game
  room.status = 'playing';
  room.gameStartTime = Date.now();
  room.drawnNumbers = [];
  
  // Start number drawing
  startNumberDrawing(roomId);
  
  res.json({ success: true, room });
});

app.get('/api/game-state/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const room = rooms[roomId];
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    room,
    drawnNumbers: room.drawnNumbers,
    players: room.players.map(p => ({
      username: p.username,
      hasWon: p.hasWon
    }))
  });
});

app.post('/api/withdraw', (req, res) => {
  const { userId, amount, chatId } = req.body;
  const user = users[userId];
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.balance < amount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Add to withdraw requests
  withdrawRequests.push({
    userId,
    username: user.username,
    amount,
    chatId,
    timestamp: Date.now()
  });
  
  // Notify bot owner
  bot.sendMessage(BOT_OWNER_ID, `💰 Withdrawal Request:
User: ${user.username} (${userId})
Amount: ${amount} coins
Current Balance: ${user.balance} coins

Use /approvepayment ${userId} to approve`);
  
  res.json({ success: true, message: 'Withdrawal request submitted' });
});

// Game logic functions
function generateBingoCard() {
  const card = [];
  const columns = [
    { min: 1, max: 15 },   // B
    { min: 16, max: 30 },  // I
    { min: 31, max: 45 },  // N
    { min: 46, max: 60 },  // G
    { min: 61, max: 75 }   // O
  ];
  
  for (let col = 0; col < 5; col++) {
    const column = [];
    const numbers = [];
    
    // Generate unique numbers for this column
    while (numbers.length < 5) {
      const num = Math.floor(Math.random() * (columns[col].max - columns[col].min + 1)) + columns[col].min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    
    numbers.sort((a, b) => a - b);
    card.push(numbers);
  }
  
  return card;
}

function startNumberDrawing(roomId) {
  const room = rooms[roomId];
  if (!room || room.status !== 'playing') return;
  
  const drawNumber = () => {
    if (room.drawnNumbers.length >= 25 || room.winner) {
      endGame(roomId);
      return;
    }
    
    let newNumber;
    do {
      newNumber = Math.floor(Math.random() * 75) + 1;
    } while (room.drawnNumbers.includes(newNumber));
    
    room.drawnNumbers.push(newNumber);
    
    // Check for winners
    checkForWinners(roomId);
    
    // Continue drawing if no winner
    if (!room.winner && room.drawnNumbers.length < 25) {
      setTimeout(drawNumber, 3000); // Draw every 3 seconds
    } else {
      endGame(roomId);
    }
  };
  
  setTimeout(drawNumber, 1000); // Start after 1 second
}

function checkForWinners(roomId) {
  const room = rooms[roomId];
  
  room.players.forEach(player => {
    if (player.hasWon) return;
    
    // Mark numbers on player's cartela
    player.markedNumbers = [];
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        if (room.drawnNumbers.includes(player.cartela[col][row])) {
          player.markedNumbers.push({ col, row, number: player.cartela[col][row] });
        }
      }
    }
    
    // Check for bingo (full card for simplicity)
    if (player.markedNumbers.length >= 24) { // 24 because center is usually free
      player.hasWon = true;
      room.winner = player;
      
      // Calculate winnings
      const totalPot = room.players.length * room.betAmount;
      const winnings = Math.floor(totalPot * 0.9);
      
      // Update user balance
      const user = users[player.userId];
      if (user) {
        user.balance += winnings;
        user.winCount += 1;
        user.totalWinnings += winnings;
      }
    }
  });
}

function endGame(roomId) {
  const room = rooms[roomId];
  room.status = 'finished';
  
  // Reset room after 30 seconds
  setTimeout(() => {
    room.status = 'waiting';
    room.players = [];
    room.drawnNumbers = [];
    room.winner = null;
    room.gameStartTime = null;
    
    // Reset users' current room
    Object.values(users).forEach(user => {
      if (user.currentRoom === roomId) {
        user.currentRoom = null;
      }
    });
  }, 30000);
}

// Serve the main app for all routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎯 Telegram Bingo Bot running on port ${PORT}`);
  console.log(`🤖 Bot polling started`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Bot is shutting down...');
  bot.stopPolling();
  process.exit(0);
});