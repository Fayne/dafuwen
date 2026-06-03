import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { useGameStore } from './stores/game.js'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Restore saved game before mounting
const store = useGameStore()
store.tryRestore()

app.mount('#app')
