# Telegram Bingo Bot - Vercel Deployment Guide

## Issues Fixed

The main issues that were causing your bot to stop working after accepting commands on Vercel were:

1. **Webhook Configuration**: The bot was using webhooks but without proper webhook handling
2. **Serverless Environment**: Vercel's serverless functions don't maintain persistent connections
3. **Missing Error Handling**: Bot commands weren't properly handling errors
4. **Environment Variables**: Webhook URL construction was unreliable

## Deployment Steps

### 1. Deploy to Vercel

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Deploy your project
vercel

# Follow the prompts and deploy
```

### 2. Set Environment Variables

In your Vercel dashboard, go to your project settings and add these environment variables:

- `BOT_TOKEN`: Your Telegram bot token
- `BOT_OWNER_ID`: Your Telegram user ID
- `NODE_ENV`: Set to `production`

### 3. Set Up Webhook

After deployment, run the webhook setup script:

```bash
# Set the VERCEL_URL environment variable to your deployed URL
export VERCEL_URL=your-app-name.vercel.app

# Run the setup script
npm run setup-webhook
```

Or manually set the webhook using the Telegram Bot API:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app-name.vercel.app/api/bot"}'
```

### 4. Verify Webhook

Check if the webhook is set correctly:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

## File Structure

- `bot.js`: Main Express server (for development and API endpoints)
- `api/bot.js`: Vercel serverless function for handling Telegram webhooks
- `setup-webhook.js`: Script to configure webhook after deployment
- `vercel.json`: Vercel configuration

## Troubleshooting

### Bot stops responding after commands

1. **Check Vercel logs**: Go to your Vercel dashboard and check the function logs
2. **Verify webhook**: Use the getWebhookInfo API to check if webhook is set correctly
3. **Test locally**: Run `npm run dev` to test the bot locally first

### Webhook not working

1. **Check URL**: Make sure the webhook URL is correct and accessible
2. **HTTPS required**: Telegram requires HTTPS for webhooks
3. **Environment variables**: Ensure all environment variables are set in Vercel

### Common Error Messages

- `"Bot not properly initialized"`: Check if BOT_TOKEN is set correctly
- `"Webhook error"`: Check Vercel function logs for detailed error
- `"Method not allowed"`: Make sure you're sending POST requests to the webhook

## Development vs Production

- **Development**: Uses polling mode (`npm run dev`)
- **Production**: Uses webhook mode (Vercel deployment)

## Testing

1. Deploy to Vercel
2. Set up webhook using the setup script
3. Send `/start` command to your bot
4. Check if the bot responds correctly
5. Monitor Vercel function logs for any errors

## Support

If you're still having issues:

1. Check the Vercel function logs
2. Verify all environment variables are set
3. Test the webhook endpoint manually
4. Ensure your bot token is valid and the bot is not blocked
