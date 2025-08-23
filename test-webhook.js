const https = require('https');

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL;

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN environment variable is not set');
  process.exit(1);
}

if (!VERCEL_URL) {
  console.error('❌ VERCEL_URL environment variable is not set');
  process.exit(1);
}

async function testWebhook() {
  const webhookUrl = `https://${VERCEL_URL}/api/bot`;
  
  console.log('🧪 Testing webhook endpoint...');
  console.log(`📍 URL: ${webhookUrl}`);
  
  // Test data (simulating a Telegram message)
  const testData = {
    update_id: 123456789,
    message: {
      message_id: 1,
      from: {
        id: 123456789,
        is_bot: false,
        first_name: 'Test',
        username: 'testuser'
      },
      chat: {
        id: 123456789,
        first_name: 'Test',
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: '/start'
    }
  };
  
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: VERCEL_URL,
    port: 443,
    path: '/api/bot',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 Status Code: ${res.statusCode}`);
      console.log(`📋 Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Response: ${data}`);
        
        if (res.statusCode === 200) {
          console.log('✅ Webhook endpoint is working!');
        } else {
          console.log('❌ Webhook endpoint returned an error');
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function getWebhookInfo() {
  console.log('\n🔍 Getting webhook info...');
  
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
          console.log('📋 Webhook Info:', JSON.stringify(webhookInfo, null, 2));
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

async function runTests() {
  try {
    await getWebhookInfo();
    await testWebhook();
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runTests();
