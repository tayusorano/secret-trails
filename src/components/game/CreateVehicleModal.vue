<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content vehicle-modal">
      <button class="close-btn" @click="$emit('close')">✕</button>
      
      <h2>💰 Создание транспорта</h2>
      
      <form @submit.prevent="handleCreate" class="vehicle-form">
        <div class="form-group">
          <label for="vehicleName">НАЗВАНИЕ</label>
          <input 
            id="vehicleName"
            v-model="form.name"
            type="text"
            placeholder="Например: Ослик Иа"
            required
            maxlength="60"
          />
        </div>
        
        <div class="form-group">
          <label for="vehicleDesc">ОПИСАНИЕ</label>
          <textarea 
            id="vehicleDesc"
            v-model="form.description"
            placeholder="Внешний вид, особенности, грузоподъёмность..."
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="vehicleSlots">ЯЧЕЕК ИНВЕНТАРЯ</label>
          <div class="slots-selector">
            <input 
              id="vehicleSlots"
              v-model.number="form.inventorySize"
              type="range"
              min="1"
              max="1000"
            />
            <input 
              v-model.number="form.inventorySize"
              type="number"
              min="1"
              max="1000"
              class="slots-value"
            />
          </div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="btn-create" :disabled="isLoading || !form.name.trim()">
            {{ isLoading ? 'Создание...' : 'Создать транспорт' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useCharactersStore } from '@/stores/characters'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  campaignId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

const charactersStore = useCharactersStore()
const authStore = useAuthStore()

const isLoading = ref(false)
const error = ref('')

const form = ref({
  name: '',
  description: '',
  inventorySize: 50
})

async function handleCreate() {
  if (!form.value.name.trim()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const inventory = Array(form.value.inventorySize).fill('')
    
    const vehicle = await charactersStore.createVehicle(
      props.campaignId,
      {
        name: form.value.name.trim(),
        description: form.value.description.trim(),
        inventorySize: form.value.inventorySize,
        inventory
      },
      authStore.user.uid
    )
    
    emit('created', vehicle)
    emit('close')
  } catch (e) {
    error.value = e.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: linear-gradient(145deg, #1e1e2e, #252535);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(232, 213, 183, 0.2);
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #8892a8;
  font-size: 1.25rem;
  cursor: pointer;
}

.close-btn:hover {
  color: #ef4444;
}

h2 {
  color: #e8d5b7;
  font-family: 'Prata', serif;
  margin: 0 0 1.5rem 0;
  font-size: 1.4rem;
  text-align: center;
}

.vehicle-form {
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
  color: #8892a8;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.form-group input[type="text"],
.form-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  color: #e4e4e7;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.slots-selector {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.slots-selector input[type="range"] {
  flex: 1;
  cursor: pointer;
  accent-color: #e8d5b7;
}

.slots-value {
  width: 64px;
  flex-shrink: 0;
  text-align: center;
  font-size: 1.1rem;
  font-weight: bold;
  color: #e8d5b7;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.4rem;
  border-radius: 6px;
  appearance: textfield;
  -moz-appearance: textfield;
}

.slots-value::-webkit-outer-spin-button,
.slots-value::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.slots-value:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #c4cad6;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #e8d5b7, #c9b896);
  border: none;
  border-radius: 8px;
  color: #1a1a2e;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(232, 213, 183, 0.3);
}

.btn-create:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
