#!/bin/bash

echo "🚀 Deploying Telegram Bingo Bot to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

# Get the deployment URL
echo "🔍 Getting deployment URL..."
VERCEL_URL=$(vercel ls | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$VERCEL_URL" ]; then
    echo "❌ Could not get deployment URL. Please check your Vercel deployment."
    exit 1
fi

echo "✅ Deployed to: $VERCEL_URL"

# Set environment variable for webhook setup
export VERCEL_URL=$(echo $VERCEL_URL | sed 's|https://||')

echo "🔗 Setting up webhook..."
echo "Webhook URL: https://$VERCEL_URL/api/bot"

# Set webhook using curl
BOT_TOKEN="8313154881:AAG8UwRUPKa6eiSMrPeWGxyZOpncz1S91Wc"
WEBHOOK_URL="https://$VERCEL_URL/api/bot"

echo "📡 Setting webhook to: $WEBHOOK_URL"

curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"$WEBHOOK_URL\"}"

echo ""
echo "🔍 Verifying webhook..."

# Get webhook info
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"

echo ""
echo "✅ Deployment complete!"
echo "🎯 Test your bot by sending /start to your Telegram bot"
echo "📊 Check Vercel logs if there are any issues"
