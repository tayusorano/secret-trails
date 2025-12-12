<script setup>
import { ref } from 'vue'
import { useCampaignsStore } from '@/stores/campaigns'

const emit = defineEmits(['close', 'joined'])

const campaignsStore = useCampaignsStore()

const joinCode = ref('')
const isLoading = ref(false)
const error = ref('')

async function handleJoin() {
  if (!joinCode.value.trim()) {
    error.value = 'Введите код кампании'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const campaign = await campaignsStore.joinCampaign(joinCode.value)
    emit('joined', campaign)
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <button class="modal-close" @click="$emit('close')">✕</button>
      
      <div class="modal-header">
        <h2>🚪 Присоединиться</h2>
        <p>Введите код приглашения от мастера</p>
      </div>
      
      <form @submit.prevent="handleJoin" class="modal-form">
        <div class="form-group">
          <label for="joinCode">Код кампании</label>
          <input 
            id="joinCode"
            v-model="joinCode"
            type="text"
            placeholder="XXXXX"
            class="code-input"
            maxlength="5"
            autofocus
            @input="joinCode = joinCode.toUpperCase()"
          />
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Входим...' : 'Войти' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: linear-gradient(145deg, #1e2a3a 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #8892a8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  transition: color 0.2s;
}

.modal-close:hover {
  color: #fff;
}

.modal-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-family: 'Prata', serif;
  color: #e8d5b7;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.modal-header p {
  color: #8892a8;
  margin: 0;
  font-size: 0.9rem;
}

.modal-form {
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

.code-input {
  text-align: center;
  font-size: 1.5rem !important;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5rem;
  text-transform: uppercase;
}

.form-group input::placeholder {
  color: #5a6275;
  letter-spacing: 0.3rem;
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
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 0.875rem 1.5rem;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #c9a959 0%, #a68a3a 100%);
  color: #1a1a2e;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(201, 169, 89, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #c4cad6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
</style>


