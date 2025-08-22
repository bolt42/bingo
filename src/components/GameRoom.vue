<template>
  <div class="game-room">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading game room...</p>
    </div>

    <div v-else class="game-layout">
      <!-- Header -->
      <header class="game-header">
        <button @click="$emit('back-to-rooms')" class="back-btn">
          ← Back to Rooms
        </button>
        
        <div class="room-info">
          <h2>{{ room?.name || 'Bingo Room' }}</h2>
          <p>Bet: {{ room?.betAmount || 0 }} coins | Players: {{ room?.playerCount || 0 }}/{{ room?.maxPlayers || 0 }}</p>
        </div>
        
        <div class="user-balance">
          Balance: {{ user?.balance || 0 }} coins
        </div>
      </header>

      <!-- Game Content -->
      <main class="game-content">
        <!-- Left Panel - Available Cartelas -->
        <div class="left-panel">
          <h3>🎯 Available Cartelas</h3>
          
          <div v-if="!playerJoined" class="cartela-selection">
            <div class="generated-cartela">
              <h4>Your Bingo Card</h4>
              <div class="bingo-card preview" v-if="previewCartela">
                <div class="card-header">
                  <span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>
                </div>
                <div class="card-grid">
                  <div 
                    v-for="(col, colIndex) in previewCartela" 
                    :key="`col-${colIndex}`"
                    class="card-column"
                  >
                    <div 
                      v-for="(number, rowIndex) in col" 
                      :key="`${colIndex}-${rowIndex}`"
                      class="card-cell"
                      :class="{ 'free': colIndex === 2 && rowIndex === 2 }"
                    >
                      {{ colIndex === 2 && rowIndex === 2 ? 'FREE' : number }}
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                @click="generateNewCard" 
                class="regenerate-btn"
                v-if="!playerJoined"
              >
                🔄 Generate New Card
              </button>
              
              <button 
                @click="joinGame"
                class="play-btn"
                :disabled="!previewCartela || user?.balance < room?.betAmount"
                v-if="!playerJoined"
              >
                🎮 Play ({{ room?.betAmount || 0 }} coins)
              </button>
            </div>
          </div>
          
          <div v-else class="player-status">
            <p class="joined-message">✅ You've joined the game!</p>
            <p class="waiting-message">Waiting for game to start...</p>
            
            <div class="players-list">
              <h4>Players in Room:</h4>
              <div class="player-list">
                <div 
                  v-for="player in gameState?.players || []" 
                  :key="player.username"
                  class="player-item"
                  :class="{ 'winner': player.hasWon }"
                >
                  {{ player.username }} {{ player.hasWon ? '🏆' : '' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Center Panel - Bingo Machine -->
        <div class="center-panel">
          <div class="bingo-machine">
            <h3>🎰 Bingo Machine</h3>
            
            <div class="current-number" v-if="gameState?.drawnNumbers?.length > 0">
              <div class="number-display">
                {{ gameState.drawnNumbers[gameState.drawnNumbers.length - 1] }}
              </div>
              <p>Latest Number</p>
            </div>
            
            <div v-else class="waiting-display">
              <div class="status-message">
                {{ room?.status === 'waiting' ? 'Waiting for players...' : 'Game starting soon...' }}
              </div>
            </div>
            
            <div class="drawn-numbers" v-if="gameState?.drawnNumbers?.length > 0">
              <h4>Called Numbers ({{ gameState.drawnNumbers.length }}/25)</h4>
              <div class="numbers-grid">
                <div 
                  v-for="number in gameState.drawnNumbers" 
                  :key="number"
                  class="drawn-number"
                >
                  {{ number }}
                </div>
              </div>
            </div>
            
            <div class="game-actions" v-if="playerJoined && room?.status === 'waiting'">
              <button 
                @click="startGame"
                class="start-game-btn"
                :disabled="(room?.playerCount || 0) < 2"
              >
                🚀 Start Game
              </button>
              <p v-if="(room?.playerCount || 0) < 2" class="min-players-msg">
                Need at least 2 players to start
              </p>
            </div>
          </div>
        </div>

        <!-- Right Panel - Player's Cartela -->
        <div class="right-panel">
          <h3>🎯 Your Card</h3>
          
          <div v-if="playerCartela" class="player-cartela">
            <div class="bingo-card active">
              <div class="card-header">
                <span>B</span><span>I</span><span>N</span><span>G</span><span>O</span>
              </div>
              <div class="card-grid">
                <div 
                  v-for="(col, colIndex) in playerCartela" 
                  :key="`player-col-${colIndex}`"
                  class="card-column"
                >
                  <div 
                    v-for="(number, rowIndex) in col" 
                    :key="`player-${colIndex}-${rowIndex}`"
                    class="card-cell"
                    :class="{ 
                      'free': colIndex === 2 && rowIndex === 2,
                      'marked': isNumberMarked(colIndex, rowIndex, number)
                    }"
                  >
                    {{ colIndex === 2 && rowIndex === 2 ? 'FREE' : number }}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card-stats">
              <p>Marked: {{ markedCount }}/24</p>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${(markedCount / 24) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
          
          <div v-else class="no-card">
            <p>Join the game to see your card!</p>
          </div>
        </div>
      </main>
    </div>

    <!-- Winner Modal -->
    <div v-if="showWinnerModal" class="modal-overlay">
      <div class="winner-modal">
        <div class="confetti">🎉</div>
        <h2 v-if="isWinner">🏆 Congratulations!</h2>
        <h2 v-else>🎮 Game Over</h2>
        
        <p v-if="isWinner" class="winner-message">
          You won {{ winAmount }} coins!
        </p>
        <p v-else class="game-over-message">
          {{ gameState?.room?.winner?.username || 'Someone' }} won this round!
        </p>
        
        <div class="winner-actions">
          <button @click="closeWinnerModal" class="continue-btn">
            Continue Playing
          </button>
          <button @click="$emit('back-to-rooms')" class="rooms-btn">
            Back to Rooms
          </button>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div v-if="notification" class="notification" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'GameRoom',
  props: {
    roomId: {
      type: String,
      required: true
    },
    user: {
      type: Object,
      required: true
    }
  },
  emits: ['back-to-rooms', 'update-balance'],
  data() {
    return {
      loading: true,
      room: null,
      gameState: null,
      previewCartela: null,
      playerCartela: null,
      playerJoined: false,
      showWinnerModal: false,
      isWinner: false,
      winAmount: 0,
      notification: null,
      gameInterval: null
    }
  },
  computed: {
    markedCount() {
      if (!this.playerCartela || !this.gameState?.drawnNumbers) return 0
      
      let count = 0
      for (let col = 0; col < 5; col++) {
        for (let row = 0; row < 5; row++) {
          if (col === 2 && row === 2) continue // Free space
          if (this.gameState.drawnNumbers.includes(this.playerCartela[col][row])) {
            count++
          }
        }
      }
      return count
    }
  },
  async created() {
    await this.loadRoom()
    await this.loadGameState()
    this.generateNewCard()
    this.loading = false
    
    // Start polling for game updates
    this.startGamePolling()
  },
  beforeUnmount() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval)
    }
  },
  methods: {
    async loadRoom() {
      try {
        const response = await fetch(`/api/room/${this.roomId}`)
        if (response.ok) {
          this.room = await response.json()
          this.room.playerCount = this.room.players.length
        }
      } catch (error) {
        console.error('Failed to load room:', error)
      }
    },
    
    async loadGameState() {
      try {
        const response = await fetch(`/api/game-state/${this.roomId}`)
        if (response.ok) {
          const oldGameState = this.gameState
          this.gameState = await response.json()
          
          // Check if player joined
          const player = this.gameState.room.players.find(p => p.userId === this.$userId)
          if (player) {
            this.playerJoined = true
            this.playerCartela = player.cartela
            
            // Check for winner
            if (this.gameState.room.winner && !this.showWinnerModal) {
              this.handleGameEnd()
            }
          }
          
          // Update room info
          this.room = this.gameState.room
          this.room.playerCount = this.room.players.length
        }
      } catch (error) {
        console.error('Failed to load game state:', error)
      }
    },
    
    generateNewCard() {
      // Generate a bingo card similar to the server logic
      const card = []
      const columns = [
        { min: 1, max: 15 },   // B
        { min: 16, max: 30 },  // I
        { min: 31, max: 45 },  // N
        { min: 46, max: 60 },  // G
        { min: 61, max: 75 }   // O
      ]
      
      for (let col = 0; col < 5; col++) {
        const column = []
        const numbers = []
        
        while (numbers.length < 5) {
          const num = Math.floor(Math.random() * (columns[col].max - columns[col].min + 1)) + columns[col].min
          if (!numbers.includes(num)) {
            numbers.push(num)
          }
        }
        
        numbers.sort((a, b) => a - b)
        card.push(numbers)
      }
      
      this.previewCartela = card
    },
    
    async joinGame() {
      if (!this.previewCartela || this.user.balance < this.room.betAmount) {
        this.showNotification('Cannot join game!', 'error')
        return
      }
      
      try {
        const response = await fetch('/api/join-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.$userId,
            roomId: this.roomId
          })
        })
        
        const result = await response.json()
        
        if (response.ok) {
          this.playerJoined = true
          this.playerCartela = result.cartela
          this.$emit('update-balance', result.balance)
          this.showNotification('Successfully joined the game!', 'success')
          await this.loadGameState()
        } else {
          this.showNotification(result.error || 'Failed to join game', 'error')
        }
      } catch (error) {
        console.error('Join game error:', error)
        this.showNotification('Failed to join game', 'error')
      }
    },
    
    async startGame() {
      try {
        const response = await fetch('/api/start-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: this.roomId })
        })
        
        const result = await response.json()
        
        if (response.ok) {
          this.showNotification('Game started!', 'success')
          await this.loadGameState()
        } else {
          this.showNotification(result.error || 'Failed to start game', 'error')
        }
      } catch (error) {
        console.error('Start game error:', error)
        this.showNotification('Failed to start game', 'error')
      }
    },
    
    isNumberMarked(col, row, number) {
      if (col === 2 && row === 2) return true // Free space
      return this.gameState?.drawnNumbers?.includes(number) || false
    },
    
    handleGameEnd() {
      const winner = this.gameState.room.winner
      if (winner) {
        this.isWinner = winner.userId === this.$userId
        if (this.isWinner) {
          const totalPot = this.gameState.room.players.length * this.gameState.room.betAmount
          this.winAmount = Math.floor(totalPot * 0.9)
          this.$emit('update-balance', this.user.balance + this.winAmount)
        }
        this.showWinnerModal = true
      }
    },
    
    closeWinnerModal() {
      this.showWinnerModal = false
      // Could restart or wait for next game
    },
    
    startGamePolling() {
      this.gameInterval = setInterval(() => {
        this.loadGameState()
      }, 2000) // Poll every 2 seconds
    },
    
    showNotification(message, type = 'info') {
      this.notification = { message, type }
      setTimeout(() => {
        this.notification = null
      }, 5000)
    }
  }
}
</script>

<style scoped>
.game-room {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
}

.loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  color: white;
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.game-layout {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.95);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.back-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.room-info h2 {
  margin-bottom: 5px;
  color: #333;
}

.room-info p {
  color: #666;
}

.user-balance {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: bold;
}

.game-content {
  display: grid;
  grid-template-columns: 300px 1fr 300px;
  gap: 20px;
  align-items: start;
}

.left-panel, .right-panel {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.center-panel {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  text-align: center;
}

.left-panel h3, .right-panel h3, .center-panel h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.bingo-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  margin-bottom: 15px;
}

.bingo-card.active {
  border: 3px solid #28a745;
}

.card-header {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  margin-bottom: 10px;
}

.card-header span {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px;
  text-align: center;
  font-weight: bold;
  border-radius: 6px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 3px;
}

.card-column {
  display: grid;
  grid-template-rows: repeat(5, 1fr);
  gap: 3px;
}

.card-cell {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  padding: 8px 4px;
  text-align: center;
  font-weight: bold;
  border-radius: 6px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s ease;
}

.card-cell.free {
  background: linear-gradient(135deg, #ffc107, #ff8c00);
  color: white;
  font-size: 10px;
  font-weight: bold;
}

.card-cell.marked {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(40,167,69,0.3);
}

.regenerate-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 10px;
  transition: all 0.3s ease;
}

.regenerate-btn:hover {
  background: #545b62;
  transform: translateY(-2px);
}

.play-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.play-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40,167,69,0.3);
}

.play-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.joined-message {
  color: #28a745;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
}

.waiting-message {
  color: #666;
  text-align: center;
  margin-bottom: 20px;
}

.players-list h4 {
  color: #333;
  margin-bottom: 10px;
}

.player-list {
  max-height: 200px;
  overflow-y: auto;
}

.player-item {
  background: #f8f9fa;
  padding: 8px 12px;
  margin-bottom: 5px;
  border-radius: 6px;
  border: 2px solid transparent;
}

.player-item.winner {
  background: linear-gradient(135deg, #ffc107, #ff8c00);
  color: white;
  font-weight: bold;
}

.current-number {
  margin-bottom: 30px;
}

.number-display {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 32px;
  font-weight: bold;
  margin: 0 auto 10px;
  animation: pulse 1s infinite;
  box-shadow: 0 8px 25px rgba(220,53,69,0.3);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.waiting-display {
  margin-bottom: 30px;
}

.status-message {
  background: #e3f2fd;
  color: #1976d2;
  padding: 20px;
  border-radius: 12px;
  font-weight: bold;
}

.drawn-numbers h4 {
  color: #333;
  margin-bottom: 15px;
}

.numbers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.drawn-number {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 8px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-size: 14px;
}

.start-game-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.start-game-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(220,53,69,0.3);
}

.start-game-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.min-players-msg {
  color: #666;
  font-style: italic;
}

.card-stats {
  text-align: center;
  margin-top: 15px;
}

.card-stats p {
  color: #333;
  font-weight: bold;
  margin-bottom: 8px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #28a745, #20c997);
  transition: width 0.3s ease;
}

.no-card {
  text-align: center;
  color: #666;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.winner-modal {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  position: relative;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 60px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-30px); }
  60% { transform: translateX(-50%) translateY(-15px); }
}

.winner-modal h2 {
  color: #333;
  margin-bottom: 20px;
  font-size: 28px;
}

.winner-message {
  color: #28a745;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 30px;
}

.game-over-message {
  color: #666;
  font-size: 18px;
  margin-bottom: 30px;
}

.winner-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.continue-btn, .rooms-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.continue-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.rooms-btn {
  background: #6c757d;
  color: white;
}

.continue-btn:hover, .rooms-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  z-index: 1001;
  max-width: 300px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.notification.success {
  background: linear-gradient(135deg, #28a745, #20c997);
}

.notification.error {
  background: linear-gradient(135deg, #dc3545, #e74c3c);
}

.notification.info {
  background: linear-gradient(135deg, #17a2b8, #3498db);
}

/* Mobile responsiveness */
@media (max-width: 1200px) {
  .game-content {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .game-layout {
    padding: 15px;
  }
  
  .game-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .left-panel, .right-panel, .center-panel {
    padding: 20px 15px;
  }
  
  .card-cell {
    min-height: 35px;
    font-size: 12px;
  }
  
  .number-display {
    width: 80px;
    height: 80px;
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .winner-modal {
    padding: 30px 20px;
  }
  
  .winner-actions {
    flex-direction: column;
  }
  
  .continue-btn, .rooms-btn {
    width: 100%;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>