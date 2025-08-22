import TelegramBot from 'node-telegram-bot-api';
const bot = new TelegramBot(process.env.BOT_TOKEN, { webHook: true });

// your command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Hello from webhook!');
});

// ... other handlers

export default async function handler(req, res) {
  if (req.method === 'POST') {
    bot.processUpdate(req.body); // forward Telegram update
    res.status(200).send('OK');
  } else {
    res.status(405).send('Method Not Allowed');
  }
}
