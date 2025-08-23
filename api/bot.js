const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || 'OWNER_TELEGRAM_ID';
const WEB_APP_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

// Initialize bot for webhook
const bot = new TelegramBot(BOT_TOKEN, { webHook: false });

// In-memory data storage (this will be reset on each function call, but that's okay for basic functionality)
let users = {};
let rooms = {
  'room1': {
    id: 'room1',
    name: 'Quick Bingo',
    betAmount: 5,
    maxPlayers: 50,
    players: [],
    status: 'waiting',
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

// Bot commands
bot.onText(/\/start/, async (msg) => {
  try {
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

    await bot.sendMessage(chatId, welcomeMessage, options);
  } catch (error) {
    console.error('Error in /start command:', error);
    try {
      await bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
});

// Owner commands
bot.onText(/\/createroom (.+)/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (userId !== BOT_OWNER_ID) {
      await bot.sendMessage(chatId, '❌ Unauthorized command');
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

      await bot.sendMessage(chatId, `✅ Room created: ${rooms[roomId].name}`);
    } catch (error) {
      await bot.sendMessage(chatId, '❌ Invalid room data. Use: /createroom {"name":"Room Name","betAmount":10,"maxPlayers":50}');
    }
  } catch (error) {
    console.error('Error in /createroom command:', error);
    try {
      await bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
});

bot.onText(/\/deleteroom (.+)/, async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (userId !== BOT_OWNER_ID) {
      await bot.sendMessage(chatId, '❌ Unauthorized command');
      return;
    }

    const roomId = match[1];
    if (rooms[roomId]) {
      delete rooms[roomId];
      await bot.sendMessage(chatId, `✅ Room ${roomId} deleted`);
    } else {
      await bot.sendMessage(chatId, '❌ Room not found');
    }
  } catch (error) {
    console.error('Error in /deleteroom command:', error);
    try {
      await bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
});

bot.onText(/\/winners/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    if (userId !== BOT_OWNER_ID) {
      await bot.sendMessage(chatId, '❌ Unauthorized command');
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

    await bot.sendMessage(chatId, message || 'No winners yet');
  } catch (error) {
    console.error('Error in /winners command:', error);
    try {
      await bot.sendMessage(msg.chat.id, 'Sorry, something went wrong. Please try again.');
    } catch (sendError) {
      console.error('Error sending error message:', sendError);
    }
  }
});

// Webhook handler for Vercel
module.exports = async (req, res) => {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Only handle POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Handle Telegram webhook
    if (req.body && req.body.message) {
      await bot.handleUpdate(req.body);
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: 'Invalid webhook data' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};