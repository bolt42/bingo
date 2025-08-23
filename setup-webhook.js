const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN environment variable is not set');
  process.exit(1);
}

if (!VERCEL_URL) {
  console.error('❌ VERCEL_URL environment variable is not set');
  console.log('💡 Make sure you have deployed to Vercel and the URL is available');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: false });

async function setupWebhook() {
  try {
    const webhookUrl = `https://${VERCEL_URL}/api/bot`;
    console.log(`🔗 Setting webhook to: ${webhookUrl}`);
    
    const result = await bot.setWebHook(webhookUrl);
    
    if (result) {
      console.log('✅ Webhook set successfully!');
      
      // Get webhook info to verify
      const webhookInfo = await bot.getWebhookInfo();
      console.log('📋 Webhook Info:', JSON.stringify(webhookInfo, null, 2));
    } else {
      console.error('❌ Failed to set webhook');
    }
  } catch (error) {
    console.error('❌ Error setting webhook:', error.message);
  }
}

setupWebhook();
