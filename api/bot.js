const TelegramBot = require('node-telegram-bot-api');

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const BOT_OWNER_ID = process.env.BOT_OWNER_ID || 'OWNER_TELEGRAM_ID';

// Validate bot token
if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.error('❌ BOT_TOKEN is not set properly');
  throw new Error('BOT_TOKEN environment variable is required');
}

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

// Helper function to get web app URL
const getWebAppUrl = (req) => {
  // Try to get URL from request headers first
  if (req && req.headers && req.headers.host) {
    return `https://${req.headers.host}`;
  }
  
  // Fallback to environment variable
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Final fallback
  return 'http://localhost:3000';
};

// Helper function to send error message safely
const sendErrorMessage = async (chatId, error, context = '') => {
  try {
    let errorMessage = '❌ Something went wrong. Please try again.';
    
    // Provide more specific error messages based on error type
    if (error.code === 'ETELEGRAM') {
      if (error.response && error.response.statusCode === 403) {
        errorMessage = '❌ Bot is blocked by user. Please unblock the bot and try again.';
      } else if (error.response && error.response.statusCode === 429) {
        errorMessage = '⚠️ Too many requests. Please wait a moment and try again.';
      } else {
        errorMessage = '❌ Telegram API error. Please try again later.';
      }
    } else if (error.message && error.message.includes('network')) {
      errorMessage = '🌐 Network error. Please check your connection and try again.';
    }
    
    console.error(`Error in ${context}:`, error);
    await bot.sendMessage(chatId, errorMessage);
  } catch (sendError) {
    console.error('Failed to send error message:', sendError);
  }
};

// Bot commands
bot.onText(/\/start/, async (msg) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const username = msg.from.username || msg.from.first_name || 'Player';

    console.log(`User ${userId} (${username}) started the bot`);

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
      console.log(`New user registered: ${userId}`);
    }

    const welcomeMessage = `🎉 Welcome to Telegram Bingo Bot!

Your starting balance: ${users[userId].balance} ETB

Click the button below to start playing!`;

    // Get web app URL - this will be fixed in the webhook handler
    const webAppUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    console.log(`Web app URL: ${webAppUrl}`);

    const options = {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🎯 Start Game',
            web_app: { url: `${webAppUrl}?userId=${userId}&username=${encodeURIComponent(username)}` }
          }
        ]]
      }
    };

    await bot.sendMessage(chatId, welcomeMessage, options);
    console.log(`Welcome message sent to user ${userId}`);
    
  } catch (error) {
    await sendErrorMessage(msg.chat.id, error, '/start command');
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
    } catch (parseError) {
      await bot.sendMessage(chatId, '❌ Invalid room data. Use: /createroom {"name":"Room Name","betAmount":10,"maxPlayers":50}');
    }
  } catch (error) {
    await sendErrorMessage(msg.chat.id, error, '/createroom command');
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
    await sendErrorMessage(msg.chat.id, error, '/deleteroom command');
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
    await sendErrorMessage(msg.chat.id, error, '/winners command');
  }
});

// Webhook handler for Vercel
module.exports = async (req, res) => {
  try {
    console.log(`[${new Date().toISOString()}] Webhook request received:`, {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });

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
      console.log(`Method not allowed: ${req.method}`);
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Validate request body
    if (!req.body) {
      console.error('No request body received');
      res.status(400).json({ error: 'No request body' });
      return;
    }

    // Handle Telegram webhook
    if (req.body && req.body.message) {
      console.log('Received webhook:', JSON.stringify(req.body, null, 2));
      console.log('Bot token:', BOT_TOKEN ? 'Set' : 'Not set');
      console.log('Web app URL:', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'Not set');
      
      try {
        await bot.handleUpdate(req.body);
        console.log('Webhook processed successfully');
        res.status(200).json({ success: true });
      } catch (updateError) {
        console.error('Error handling update:', updateError);
        res.status(500).json({ error: 'Update handling failed' });
      }
    } else {
      console.error('Invalid webhook data:', req.body);
      res.status(400).json({ error: 'Invalid webhook data' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};