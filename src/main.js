import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Инициализация Firebase (импорт запускает initializeApp)
import './firebase/config'

// Stores
import { useAuthStore } from './stores/auth'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Инициализируем слушатель авторизации
const authStore = useAuthStore()
authStore.initAuthListener()

app.mount('#app')
