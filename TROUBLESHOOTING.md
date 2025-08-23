# Troubleshooting Guide

## Common Issues and Solutions

### 1. Bot not responding after deployment

**Symptoms**: Bot works locally but stops responding after Vercel deployment

**Solutions**:
1. **Check Vercel logs**:
   ```bash
   vercel logs
   ```

2. **Verify webhook is set correctly**:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

3. **Manually set webhook**:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app.vercel.app/api/bot"}'
   ```

### 2. "Bot not properly initialized" error

**Cause**: Bot instance is not created before webhook requests arrive

**Solution**: The bot now initializes automatically when the first webhook request arrives.

### 3. Webhook endpoint returns 500 error

**Check these**:
1. **Environment variables**: Ensure `BOT_TOKEN` and `BOT_OWNER_ID` are set in Vercel
2. **Bot token validity**: Verify your bot token is correct
3. **Vercel function logs**: Check for specific error messages

### 4. Bot responds to first command but not subsequent ones

**Cause**: Webhook not properly configured or bot instance being reset

**Solutions**:
1. **Use the deployment script**:
   ```bash
   npm run deploy-full
   ```

2. **Check webhook info**:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

### 5. "Method not allowed" error

**Cause**: Webhook endpoint receiving non-POST requests

**Solution**: This is normal for OPTIONS requests (CORS preflight). The endpoint handles this automatically.

## Debugging Steps

### Step 1: Check Vercel Deployment
```bash
vercel ls
```

### Step 2: Check Function Logs
```bash
vercel logs
```

### Step 3: Test Webhook Endpoint
```bash
# Set your Vercel URL
export VERCEL_URL=your-app.vercel.app

# Test the webhook
npm run test-webhook
```

### Step 4: Verify Bot Token
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe"
```

### Step 5: Check Webhook Status
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## Environment Variables

Make sure these are set in your Vercel dashboard:

- `BOT_TOKEN`: Your Telegram bot token
- `BOT_OWNER_ID`: Your Telegram user ID
- `NODE_ENV`: Set to `production`

## Manual Webhook Setup

If the automatic setup fails:

1. **Get your Vercel URL**:
   ```bash
   vercel ls
   ```

2. **Set webhook manually**:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-app.vercel.app/api/bot"}'
   ```

3. **Verify webhook**:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

## Testing Locally

Before deploying, test locally:

```bash
npm run dev
```

Send `/start` to your bot and check if it responds.

## Common Error Messages

- `"Bot not properly initialized"`: Bot is initializing, try again
- `"Webhook error"`: Check Vercel logs for details
- `"Method not allowed"`: Normal for OPTIONS requests
- `"Invalid webhook data"`: Check if Telegram is sending correct data

## Still Having Issues?

1. **Check Vercel logs** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Test the webhook endpoint** manually
4. **Ensure your bot token is valid** and not revoked
5. **Check if your bot is blocked** by users

## Support

If you're still experiencing issues:

1. Share the Vercel function logs
2. Share the webhook info response
3. Describe the exact behavior you're seeing
4. Mention any error messages in the logs
