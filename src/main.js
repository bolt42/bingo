import { createApp } from 'vue'
import App from './App.vue'

// Initialize Telegram Web App
window.Telegram.WebApp.ready()
window.Telegram.WebApp.expand()

// Get user data from URL parameters
const urlParams = new URLSearchParams(window.location.search)
const userId = urlParams.get('userId')
const username = urlParams.get('username')

if (!userId) {
    document.body.innerHTML = '<div style="padding: 20px; text-align: center; color: white;">Please start the bot first!</div>'
} else {
    const app = createApp(App)
    
    // Provide user data globally
    app.config.globalProperties.$userId = userId
    app.config.globalProperties.$username = username
    
    app.mount('#app')
}