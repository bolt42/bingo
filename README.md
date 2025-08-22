# 🎯 Telegram Bingo Bot with Vue.js Mini App

A comprehensive Telegram Bot that launches a Mini App for playing Bingo with real-time interaction, betting, and in-memory data management.

## 🚀 Features

### For Players:
- **Registration**: Start with 50 coins using `/start` command
- **Room Selection**: Choose from active bingo rooms with different bet amounts
- **Bingo Cards**: Generate and select from multiple cartelas (bingo cards)
- **Real-time Gameplay**: Watch numbers being drawn with visual feedback
- **Balance Management**: Track winnings and request withdrawals
- **Responsive Design**: Optimized for mobile devices and Telegram

### For Bot Owners:
- **Room Management**: Create and delete bingo rooms
- **Game Control**: Pause and resume games
- **Winner Tracking**: View recent winners and statistics
- **Payment Processing**: Handle withdrawal requests and approvals
- **Notifications**: Receive alerts for withdrawal requests

### Game Features:
- **Multi-player**: Up to 100 players per game
- **Fair Play**: Max 25 number calls per game
- **Winning Logic**: First player to get Bingo wins 90% of the pot
- **Real-time Updates**: Live game state synchronization
- **Confetti Effects**: Winner celebrations with animations

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Frontend**: Vue.js 3 with Vite
- **Bot Framework**: node-telegram-bot-api
- **Storage**: In-memory JavaScript objects (no external DB)
- **Deployment**: Vercel-ready configuration

## 📦 Installation & Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd telegram-bingo-bot
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
BOT_TOKEN=your_telegram_bot_token_from_botfather
BOT_OWNER_ID=your_telegram_user_id
WEB_APP_URL=https://your-deployed-app-url.vercel.app
PORT=3000
```

### 3. Development
```bash
# Install development dependencies
npm install concurrently nodemon --save-dev

# Run both bot and web app in development
npm run dev

# Or run separately:
npm run dev:bot  # Bot server
npm run dev:web  # Vue.js dev server
```

### 4. Production Build
```bash
npm run build
npm start
```

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel --prod
```

### 3. Set Environment Variables
In your Vercel dashboard, add these environment variables:
- `BOT_TOKEN`: Your Telegram bot token
- `BOT_OWNER_ID`: Your Telegram user ID
- `WEB_APP_URL`: Your Vercel app URL

### 4. Configure Telegram Bot
Update your bot's web app URL in BotFather or through the Telegram Bot API.

## 🎮 How to Play

### For Players:

1. **Start the Bot**: Send `/start` to the bot
2. **Launch Mini App**: Click "Start Game" button
3. **Select Room**: Choose a bingo room based on bet amount
4. **Generate Card**: Create your bingo cartela
5. **Join Game**: Pay the bet amount to join
6. **Play**: Watch numbers being drawn and track your card
7. **Win**: First to get Bingo wins the pot!
8. **Withdraw**: Request withdrawal of winnings

### For Bot Owners:

1. **Create Room**: `/createroom {"name":"Room Name","betAmount":10,"maxPlayers":50}`
2. **Delete Room**: `/deleteroom room_id`
3. **View Winners**: `/winners`
4. **Approve Payment**: `/approvepayment user_id`

## 📊 Game Logic

### Bingo Cards
- Standard 5x5 grid with B-I-N-G-O columns
- B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
- Center square is FREE
- Each card is randomly generated and unique

### Game Flow
1. Players join room and pay bet amount
2. Game starts when minimum 2 players joined
3. Numbers drawn every 3 seconds
4. Maximum 25 numbers per game
5. First player to mark 24 numbers (excluding FREE) wins
6. Winner gets 90% of total pot
7. Game resets after 30 seconds

### Payout Structure
- **Winner**: 90% of total pot (players × bet amount)
- **House**: 10% remains with bot owner
- **Example**: 10 players × 5 coins = 50 coins pot → Winner gets 45 coins

## 🏗️ Architecture

### Data Storage (In-Memory)
```javascript
// Users
users = {
  [telegramUserId]: {
    id: userId,
    username: username,
    balance: 50,
    cartelas: [],
    currentRoom: null,
    winCount: 0,
    totalWinnings: 0
  }
}

// Rooms
rooms = {
  [roomId]: {
    id: roomId,
    name: "Room Name",
    betAmount: 10,
    maxPlayers: 50,
    players: [],
    status: 'waiting', // waiting, playing, finished
    drawnNumbers: [],
    winner: null,
    gameStartTime: null
  }
}
```

### API Endpoints
- `GET /api/user/:userId` - Get user data
- `GET /api/rooms` - List active rooms
- `GET /api/room/:roomId` - Get room details
- `POST /api/join-room` - Join a game room
- `POST /api/start-game` - Start game (if enough players)
- `GET /api/game-state/:roomId` - Get current game state
- `POST /api/withdraw` - Request withdrawal

### File Structure
```
telegram-bingo-bot/
├── bot.js              # Main bot server
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── vercel.json         # Vercel deployment config
├── index.html          # HTML entry point
├── src/
│   ├── main.js         # Vue app entry
│   ├── App.vue         # Main app component
│   └── components/
│       └── GameRoom.vue # Game room component
└── README.md
```

## 🔧 Customization

### Adding New Room Types
Modify the default rooms in `bot.js`:
```javascript
let rooms = {
  'room1': {
    id: 'room1',
    name: 'Quick Bingo',
    betAmount: 5,
    maxPlayers: 50,
    // ... other properties
  }
}
```

### Changing Win Conditions
Update the `checkForWinners` function in `bot.js` to implement different Bingo patterns (line, diagonal, full card).

### Styling Customization
Modify the CSS in Vue components for different themes and animations.

## 🐛 Troubleshooting

### Common Issues:

1. **Bot not responding**: Check BOT_TOKEN is correct
2. **Mini App not loading**: Verify WEB_APP_URL matches deployment URL
3. **Permissions error**: Ensure BOT_OWNER_ID is set correctly
4. **Game not starting**: Check minimum player requirements

### Debug Mode:
Add console logging in bot.js for debugging:
```javascript
console.log('User data:', users);
console.log('Room state:', rooms);
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🆘 Support

For support and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Test with a small group first
4. Monitor console logs for errors

---

**Ready to play? Start your Telegram Bingo Bot and let the games begin! 🎯**