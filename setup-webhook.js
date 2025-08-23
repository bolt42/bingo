const https = require('https');

// Configuration
const BOT_TOKEN = "8313154881:AAG8UwRUPKa6eiSMrPeWGxyZOpncz1S91Wc";

console.log('🔧 Setting up Telegram Bot Webhook...\n');

// Function to get Vercel deployment URL
async function getVercelUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: '/v1/deployments',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN || ''}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const deployments = JSON.parse(data);
          if (deployments.deployments && deployments.deployments.length > 0) {
            const latestDeployment = deployments.deployments[0];
            resolve(latestDeployment.url);
          } else {
            reject(new Error('No deployments found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Function to set webhook
async function setWebhook(webhookUrl) {
  return new Promise((resolve, reject) => {
    const webhookData = {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    };
    
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/setWebhook`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(webhookData))
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
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(JSON.stringify(webhookData));
    req.end();
  });
}

// Function to get webhook info
async function getWebhookInfo() {
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
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Main setup function
async function setupWebhook() {
  try {
    console.log('1️⃣ Checking current webhook status...');
    const currentWebhook = await getWebhookInfo();
    console.log('Current webhook info:', JSON.stringify(currentWebhook, null, 2));
    
    // Get Vercel URL from environment or user input
    let vercelUrl = process.env.VERCEL_URL;
    
    if (!vercelUrl) {
      console.log('❌ VERCEL_URL environment variable not set');
      console.log('💡 Please provide your Vercel deployment URL:');
      console.log('   Example: your-app-name.vercel.app');
      
      // For now, let's use a placeholder - you'll need to replace this
      vercelUrl = 'your-app-name.vercel.app';
      console.log(`⚠️  Using placeholder URL: ${vercelUrl}`);
      console.log('   Please update this script with your actual Vercel URL');
    }
    
    const webhookUrl = `https://${vercelUrl}/api/bot`;
    console.log(`\n2️⃣ Setting webhook to: ${webhookUrl}`);
    
    const result = await setWebhook(webhookUrl);
    console.log('Webhook set result:', JSON.stringify(result, null, 2));
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!');
      
      console.log('\n3️⃣ Verifying webhook...');
      const verifyWebhook = await getWebhookInfo();
      console.log('Updated webhook info:', JSON.stringify(verifyWebhook, null, 2));
      
      console.log('\n🎉 Webhook setup complete!');
      console.log('🎯 Test your bot by sending /start to your Telegram bot');
    } else {
      console.error('❌ Failed to set webhook:', result.description);
    }
    
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    console.log('\n💡 Manual setup instructions:');
    console.log('1. Deploy your app to Vercel');
    console.log('2. Get your deployment URL (e.g., your-app.vercel.app)');
    console.log('3. Run this command:');
    console.log(`   curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \\`);
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"url": "https://your-app.vercel.app/api/bot"}\'');
  }
}

// Run the setup
setupWebhook();
