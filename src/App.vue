<template>
  <div id="app">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading your bingo experience...</p>
    </div>
    
    <div v-else-if="currentView === 'rooms'" class="container">
      <!-- Header -->
      <header class="header">
        <div class="user-info">
          <div class="user-avatar">{{ username?.charAt(0)?.toUpperCase() || 'P' }}</div>
          <div class="user-details">
            <h3>{{ username || 'Player' }}</h3>
            <p class="balance">{{ user?.balance || 0 }} coins</p>
          </div>
        </div>
        <button @click="requestWithdraw" class="withdraw-btn" :disabled="!user?.balance">
          💰 Withdraw
        </button>
      </header>

      <!-- Rooms List -->
      <main class="main-content">
        <h2 class="section-title">🎯 Active Bingo Rooms</h2>
        
        <div class="rooms-grid">
          <div 
            v-for="room in rooms" 
            :key="room.id"
            class="room-card"
            :class="{ 'full': room.playerCount >= room.maxPlayers, 'playing': room.status === 'playing' }"
            @click="joinRoom(room.id)"
          >
            <div class="room-header">
              <h3>{{ room.name }}</h3>
              <span class="room-status" :class="room.status">{{ room.status }}</span>
            </div>
            
            <div class="room-details">
              <div class="detail-item">
                <span class="label">Bet Amount:</span>
                <span class="value">{{ room.betAmount }} coins</span>
              </div>
              
              <div class="detail-item">
                <span class="label">Players:</span>
                <span class="value">{{ room.playerCount }}/{{ room.maxPlayers }}</span>
              </div>
            </div>
            
            <div class="room-actions">
              <button 
                class="join-btn"
                :disabled="room.playerCount >= room.maxPlayers || user?.balance < room.betAmount"
              >
                {{ room.status === 'playing' ? '🎮 Game in Progress' : '🎯 Join Game' }}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
    
    <div v-else-if="currentView === 'game'" class="game-container">
      <GameRoom 
        :room-id="currentRoomId" 
        :user="user"
        @back-to-rooms="backToRooms"
        @update-balance="updateUserBalance"
      />
    </div>

    <!-- Withdraw Modal -->
    <div v-if="showWithdrawModal" class="modal-overlay" @click="showWithdrawModal = false">
      <div class="modal" @click.stop>
        <h3>💰 Request Withdrawal</h3>
        <div class="input-group">
          <label>Amount (max {{ user?.balance || 0 }} coins):</label>
          <input 
            type="number" 
            v-model="withdrawAmount" 
            :max="user?.balance || 0"
            min="1"
            placeholder="Enter amount"
          >
        </div>
        <div class="modal-actions">
          <button @click="showWithdrawModal = false" class="cancel-btn">Cancel</button>
          <button @click="submitWithdraw" class="confirm-btn" :disabled="!withdrawAmount || withdrawAmount > user?.balance">
            Submit Request
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
import GameRoom from './components/GameRoom.vue'

export default {
  name: 'App',
  components: {
    GameRoom
  },
  data() {
    return {
      loading: true,
      user: null,
      rooms: [],
      currentView: 'rooms',
      currentRoomId: null,
      showWithdrawModal: false,
      withdrawAmount: null,
      notification: null,
      username: this.$username
    }
  },
  async created() {
    await this.loadUserData()
    await this.loadRooms()
    this.loading = false
    
    // Poll for room updates
    this.pollRooms()
  },
  methods: {
    async loadUserData() {
      try {
        const response = await fetch(`/api/user/${this.$userId}`)
        if (response.ok) {
          this.user = await response.json()
        }
      } catch (error) {
        console.error('Failed to load user data:', error)
      }
    },
    
    async loadRooms() {
      try {
        const response = await fetch('/api/rooms')
        if (response.ok) {
          this.rooms = await response.json()
        }
      } catch (error) {
        console.error('Failed to load rooms:', error)
      }
    },
    
    async joinRoom(roomId) {
      const room = this.rooms.find(r => r.id === roomId)
      
      if (!room) return
      
      if (room.playerCount >= room.maxPlayers) {
        this.showNotification('Room is full!', 'error')
        return
      }
      
      if (this.user.balance < room.betAmount) {
        this.showNotification('Insufficient balance!', 'error')
        return
      }
      
      this.currentRoomId = roomId
      this.currentView = 'game'
    },
    
    backToRooms() {
      this.currentView = 'rooms'
      this.currentRoomId = null
      this.loadUserData() // Refresh user data
      this.loadRooms() // Refresh rooms
    },
    
    updateUserBalance(newBalance) {
      if (this.user) {
        this.user.balance = newBalance
      }
    },
    
    requestWithdraw() {
      if (!this.user?.balance) {
        this.showNotification('No balance to withdraw!', 'error')
        return
      }
      
      this.withdrawAmount = null
      this.showWithdrawModal = true
    },
    
    async submitWithdraw() {
      if (!this.withdrawAmount || this.withdrawAmount <= 0 || this.withdrawAmount > this.user.balance) {
        this.showNotification('Invalid withdrawal amount!', 'error')
        return
      }
      
      try {
        // Get Telegram chat ID
        const chatId = window.Telegram.WebApp.initDataUnsafe?.user?.id
        
        const response = await fetch('/api/withdraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: this.$userId,
            amount: this.withdrawAmount,
            chatId: chatId
          })
        })
        
        const result = await response.json()
        
        if (response.ok) {
          this.showNotification('Withdrawal request submitted! You will be notified when approved.', 'success')
          this.showWithdrawModal = false
        } else {
          this.showNotification(result.error || 'Failed to submit withdrawal', 'error')
        }
      } catch (error) {
        console.error('Withdrawal error:', error)
        this.showNotification('Failed to submit withdrawal request', 'error')
      }
    },
    
    showNotification(message, type = 'info') {
      this.notification = { message, type }
      setTimeout(() => {
        this.notification = null
      }, 5000)
    },
    
    pollRooms() {
      setInterval(() => {
        if (this.currentView === 'rooms') {
          this.loadRooms()
        }
      }, 5000) // Poll every 5 seconds
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

#app {
  min-height: 100vh;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255,255,255,0.95);
  padding: 20px;
  border-radius: 16px;
  margin-bottom: 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 20px;
  font-weight: bold;
}

.user-details h3 {
  color: #333;
  margin-bottom: 5px;
}

.balance {
  color: #28a745;
  font-weight: bold;
  font-size: 16px;
}

.withdraw-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.withdraw-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40,167,69,0.3);
}

.withdraw-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.main-content {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  padding: 30px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.section-title {
  color: #333;
  margin-bottom: 25px;
  text-align: center;
  font-size: 24px;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.room-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.room-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-color: #667eea;
}

.room-card.full {
  opacity: 0.7;
  cursor: not-allowed;
}

.room-card.playing {
  border-color: #28a745;
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.room-header h3 {
  color: #333;
  font-size: 18px;
}

.room-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.room-status.waiting {
  background: #e3f2fd;
  color: #1976d2;
}

.room-status.playing {
  background: #e8f5e8;
  color: #388e3c;
}

.room-details {
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  color: #666;
}

.value {
  font-weight: bold;
  color: #333;
}

.join-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102,126,234,0.3);
}

.join-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.game-container {
  min-height: 100vh;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal h3 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.input-group input:focus {
  outline: none;
  border-color: #667eea;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
}

.cancel-btn:hover {
  background: #e9ecef;
}

.confirm-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40,167,69,0.3);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
  
  .header {
    padding: 15px;
    margin-bottom: 20px;
  }
  
  .main-content {
    padding: 20px;
  }
  
  .rooms-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .user-info {
    gap: 10px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .withdraw-btn {
    padding: 10px 16px;
    font-size: 12px;
  }
  
  .notification {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>