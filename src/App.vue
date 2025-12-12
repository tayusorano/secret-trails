<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="app">
    <!-- Показываем загрузку пока проверяем авторизацию -->
    <div v-if="authStore.loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Загрузка...</p>
    </div>
    
    <!-- Основной контент -->
    <router-view v-else />
  </div>
</template>

<style>
/* Шрифты - должны быть первыми */
@import url('https://fonts.googleapis.com/css2?family=Prata&family=Inter:wght@400;500;600&display=swap');

/* Глобальные стили */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #1a1a2e;
  color: #e4e4e7;
}

.app {
  min-height: 100vh;
}

.loading-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  gap: 1rem;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(232, 213, 183, 0.2);
  border-top-color: #e8d5b7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-screen p {
  color: #8892a8;
  font-size: 1rem;
}
</style>
