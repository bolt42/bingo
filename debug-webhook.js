const https = require('https');

// Configuration
const BOT_TOKEN = "8313154881:AAG8UwRUPKa6eiSMrPeWGxyZOpncz1S91Wc";

console.log('🔍 Debugging Telegram Bot Webhook...\n');

// Test 1: Check bot info
async function checkBotInfo() {
  console.log('1️⃣ Checking bot info...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getMe`,
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const botInfo = JSON.parse(data);
          console.log('✅ Bot info:', JSON.stringify(botInfo, null, 2));
          resolve(botInfo);
        } catch (error) {
          console.error('❌ Error parsing bot info:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Test 2: Check webhook info
async function checkWebhookInfo() {
  console.log('\n2️⃣ Checking webhook info...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/getWebhookInfo`,
      method: 'GET'
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const webhookInfo = JSON.parse(data);
          console.log('✅ Webhook info:', JSON.stringify(webhookInfo, null, 2));
          resolve(webhookInfo);
        } catch (error) {
          console.error('❌ Error parsing webhook info:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Test 3: Send a test message
async function sendTestMessage() {
  console.log('\n3️⃣ Sending test message...');
  
  const testData = {
    chat_id: "5631652979", // Your user ID
    text: "🧪 Test message from debug script",
    parse_mode: "HTML"
  };
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(testData))
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Send message result:', JSON.stringify(result, null, 2));
          resolve(result);
        } catch (error) {
          console.error('❌ Error parsing send message result:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.write(JSON.stringify(testData));
    req.end();
  });
}

// Run all tests
async function runDebugTests() {
  try {
    await checkBotInfo();
    await checkWebhookInfo();
    await sendTestMessage();
    
    console.log('\n🎉 All debug tests completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Check if your bot is working (test message should be sent)');
    console.log('2. If webhook URL is not set, you need to set it');
    console.log('3. If webhook URL is set but bot doesn\'t respond, check Vercel logs');
    
  } catch (error) {
    console.error('\n❌ Debug test failed:', error);
  }
}

runDebugTests();
