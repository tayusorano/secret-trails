<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content vehicle-sheet">
      <button class="close-btn" @click="$emit('close')">✕</button>
      
      <div class="sheet-header">
        <h2>💰 {{ vehicle.name }}</h2>
        <div class="sheet-actions">
          <button 
            v-if="!isEditing" 
            class="btn-edit" 
            @click="startEditing"
          >
            ✏️ Изменить
          </button>
          <button 
            v-if="!isEditing" 
            class="btn-delete" 
            @click="confirmDelete"
          >
            🗑️ Удалить
          </button>
        </div>
      </div>

      <div class="sheet-content" :class="{ editing: isEditing }">
        <!-- Название -->
        <div class="sheet-section">
          <h3>Информация</h3>
          <div class="info-group">
            <span class="info-label">НАЗВАНИЕ</span>
            <input v-if="isEditing" v-model="editForm.name" type="text" />
            <span v-else class="info-value">{{ vehicle.name }}</span>
          </div>
          <div class="info-group">
            <span class="info-label">ОПИСАНИЕ</span>
            <textarea v-if="isEditing" v-model="editForm.description" rows="4"></textarea>
            <p v-else class="info-value multiline">{{ vehicle.description || '—' }}</p>
          </div>
        </div>

        <!-- Инвентарь -->
        <div class="sheet-section">
          <h3>Инвентарь ({{ vehicle.inventorySize }} ячеек)</h3>
          <div class="inventory-display">
            <div 
              v-for="i in (isEditing ? editForm.inventorySize : vehicle.inventorySize)" 
              :key="i" 
              class="inv-slot"
            >
              <span class="inv-num">{{ i }}</span>
              <input 
                v-if="isEditing" 
                v-model="editForm.inventory[i-1]" 
                type="text"
                :placeholder="'Ячейка ' + i"
                :title="editForm.inventory[i-1]"
              />
              <Tooltip
                v-else-if="spellsStore.findSpell(vehicle.inventory?.[i-1])"
                :content="spellsStore.findSpell(vehicle.inventory?.[i-1]).description"
                position="top"
              >
                <span class="inv-item inv-spell">
                  ✨ {{ vehicle.inventory?.[i-1] }}
                </span>
              </Tooltip>
              <span v-else class="inv-item" :title="vehicle.inventory?.[i-1]">
                {{ vehicle.inventory?.[i-1] || '—' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Кнопки при редактировании -->
      <div v-if="isEditing" class="edit-actions">
        <button class="btn-cancel" @click="cancelEditing">Отмена</button>
        <button class="btn-save" @click="saveChanges" :disabled="isSaving">
          {{ isSaving ? 'Сохранение...' : '💾 Сохранить' }}
        </button>
      </div>

      <div v-if="error" class="error-message">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useCharactersStore } from '@/stores/characters'
import { useAuthStore } from '@/stores/auth'
import { useSpellsStore } from '@/stores/spells'
import Tooltip from '@/components/ui/Tooltip.vue'

const props = defineProps({
  vehicle: {
    type: Object,
    required: true
  },
  campaignId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'updated', 'deleted'])

const charactersStore = useCharactersStore()
const authStore = useAuthStore()
const spellsStore = useSpellsStore()

onMounted(() => {
  spellsStore.fetchSpells()
})

const isEditing = ref(false)
const isSaving = ref(false)
const error = ref('')

const editForm = reactive({
  name: '',
  description: '',
  inventorySize: 10,
  inventory: []
})

function startEditing() {
  editForm.name = props.vehicle.name || ''
  editForm.description = props.vehicle.description || ''
  editForm.inventorySize = props.vehicle.inventorySize || 10
  editForm.inventory = [...(props.vehicle.inventory || Array(editForm.inventorySize).fill(''))]
  
  // Дополняем массив если нужно
  while (editForm.inventory.length < editForm.inventorySize) {
    editForm.inventory.push('')
  }
  
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  error.value = ''
}

async function saveChanges() {
  isSaving.value = true
  error.value = ''
  
  try {
    const inventory = editForm.inventory.slice(0, editForm.inventorySize)
    
    await charactersStore.updateCharacter(
      props.campaignId,
      props.vehicle.id,
      {
        name: editForm.name.trim(),
        description: editForm.description,
        inventorySize: editForm.inventorySize,
        inventory,
        type: 'vehicle'
      }
    )
    
    isEditing.value = false
    emit('updated')
  } catch (e) {
    error.value = e.message
  } finally {
    isSaving.value = false
  }
}

function confirmDelete() {
  if (confirm(`Удалить транспорт "${props.vehicle.name}"? Это действие нельзя отменить.`)) {
    deleteVehicle()
  }
}

async function deleteVehicle() {
  try {
    await charactersStore.deleteCharacter(
      props.campaignId,
      props.vehicle.id
    )
    emit('deleted')
    emit('close')
  } catch (e) {
    error.value = e.message
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
  background: rgba(0, 0, 0, 0.85);
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
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(139, 92, 246, 0.25);
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
  z-index: 10;
}

.close-btn:hover {
  color: #ef4444;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sheet-header h2 {
  color: #e8d5b7;
  font-family: 'Prata', serif;
  margin: 0;
  font-size: 1.3rem;
}

.sheet-actions {
  display: flex;
  gap: 0.5rem;
  margin-right: 30px;
}

.btn-edit, .btn-delete {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.btn-edit {
  background: rgba(232, 213, 183, 0.15);
  color: #e8d5b7;
}

.btn-edit:hover {
  background: rgba(232, 213, 183, 0.25);
}

.btn-delete {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.25);
}

.sheet-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.sheet-section h3 {
  color: #c4cad6;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.75rem;
}

.info-label {
  color: #8892a8;
  font-size: 0.75rem;
  font-weight: 500;
}

.info-value {
  color: #e4e4e7;
  font-size: 0.95rem;
}

.info-value.multiline {
  white-space: pre-wrap;
  line-height: 1.5;
  margin: 0;
}

/* Инвентарь */
.inventory-display {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.inv-slot {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-height: 24px;
}

.inv-num {
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  color: #8892a8;
  font-size: 0.7rem;
  font-weight: bold;
  flex-shrink: 0;
}

.inv-item {
  flex: 1;
  color: #c4cad6;
  font-size: 0.85rem;
  word-break: break-word;
  line-height: 1.3;
  min-width: 0;
}

.inv-spell {
  color: #a78bfa;
  cursor: pointer;
}

/* Редактирование */
.sheet-content.editing input,
.sheet-content.editing textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  color: #e4e4e7;
  font-size: 0.9rem;
  width: 100%;
  font-family: inherit;
}

.sheet-content.editing input:focus,
.sheet-content.editing textarea:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

.sheet-content.editing textarea {
  resize: vertical;
}

.edit-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #c4cad6;
  cursor: pointer;
}

.btn-save {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #e8d5b7, #c9b896);
  border: none;
  border-radius: 8px;
  color: #1a1a2e;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.75rem;
  border-radius: 8px;
  margin-top: 1rem;
}
</style>
