<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  
  isLoading.value = true
  try {
    await authStore.login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    console.error('Login failed:', e)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-header">
        <h1>🌲 Тайные Тропы</h1>
        <p>Войди в мир приключений</p>
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            id="email"
            v-model="email" 
            type="email" 
            placeholder="adventurer@realm.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Пароль</label>
          <input 
            id="password"
            v-model="password" 
            type="password" 
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </p>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Входим...' : 'Войти' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>Ещё нет аккаунта?</p>
        <router-link to="/register" class="link">Создать персонажа</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 1rem;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-family: 'Prata', serif;
  font-size: 2rem;
  color: #e8d5b7;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 10px rgba(232, 213, 183, 0.3);
}

.auth-header p {
  color: #8892a8;
  margin: 0;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  color: #c4cad6;
  font-size: 0.875rem;
  font-weight: 500;
}

.form-group input {
  padding: 0.875rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-group input::placeholder {
  color: #5a6275;
}

.form-group input:focus {
  outline: none;
  border-color: #e8d5b7;
  box-shadow: 0 0 0 3px rgba(232, 213, 183, 0.15);
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin: 0;
  padding: 0.75rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-primary {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #c9a959 0%, #a68a3a 100%);
  color: #1a1a2e;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(201, 169, 89, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-footer p {
  color: #8892a8;
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
}

.link {
  color: #e8d5b7;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
}

.link:hover {
  color: #fff;
  text-decoration: underline;
}
</style>

