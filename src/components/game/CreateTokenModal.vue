<script setup>
import { ref, computed } from 'vue'
import { useTokensStore } from '@/stores/tokens'

const props = defineProps({
  campaignId: {
    type: String,
    required: true
  },
  mapType: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'created'])

const tokensStore = useTokensStore()

// Форма
const tokenName = ref('')
const imageType = ref('emoji') // 'emoji' или 'url'
const selectedEmoji = ref('🧙')
const imageUrl = ref('')
const borderColor = ref('#e8d5b7')

const isLoading = ref(false)
const error = ref('')

// Эмодзи для токенов - большая коллекция
const emojiOptions = [
  // Персонажи - люди
  '🧙', '🧙‍♀️', '🧝', '🧝‍♂️', '🧝‍♀️', '🧛', '🧛‍♀️', '🧟‍♂️', '🧟‍♀️',
  '🧜', '🧜‍♂️', '🧚', '🦸', '🦸‍♂️', '🦹', '🦹‍♂️',
  '👸', '🤴', '👑', '🤺', '💂', '🧞', '🧞‍♀️', '👩‍🦳',
  '👨‍🦳', '👩‍🦰', '👧', '👨‍🦱', '👩‍🦱', '👨‍🦲', '🧔', '👦', '👨‍🎤', 
  '👩‍🎤', '🏃', '🏃‍♀️', '🧎', '🧎‍♂️', '🧎‍♀️', '🚶', '🚶‍♀️',
  '🤠', '🤡', '👤', '👥', '🗣️', '👁️', '🙉',
  // Монстры и существа
  '🐉', '🐲', '👹', '👺', '👿', '😈', '💀', '☠️', '👻', '👽', '👾', '🤖',
  '🎃', '🦇', '🕷️', '🕸️', '🦂', '🐍', '🐺', '🦊', '🐗', '🐻',
  '🦁', '🐯', '🐅', '🐆', '🦎', '🐊', '🐢', '🦕', '🦖', '🐙', '🦑',
  '🦈', '🐋', '🐳', '🦀', '🦞', '🦐', '🐡', '🐠', '🐟',
  '🦅', '🦉', '🦇', '🐦', '🐧', '🦆', '🦢', '🦩', '🦚', '🦜',
  '🐴', '🦄', '🐎', '🦌', '🐐', '🐑', '🦙', '🐘', '🦏', '🦛',
  '🐀', '🐁', '🐿️', '🦔', '🐰', '🐇', '🦝', '🦨', '🦡',
  '🐈', '🐕', '🐶', '🐱', '🐸',
  // Насекомые и другие
  '🐛', '🐜', '🐝', '🐞', '🦋', '🐌',
  // Растения и природа
  '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃',
  '🌺', '🌻', '🌹', '🥀', '🌷', '🌼', '💐', '🎋', '🎍',
  '🍄', '💎', '🔥', '💧', '🌊', '❄️', '☁️', '⛈️', '🌈',
  // Оружие и снаряжение
  '⚔️', '🗡️', '🔪', '🪓', '🔨', '⛏️', '🛠️', '🏹', '🎯',
  '🛡️', '⚙️', '🔗', '⛓️',
  // Магия и мистика
  '🔮', '✨', '⭐', '🌟', '💫', '⚡', '☄️', '🌙', '🌑', '🌕',
  '📿', '🧿', '🕯️', '📜', '📖', '📚', '🗝️', '🔑',
  // Сокровища и ценности
  '💰', '🎁', '💍', '👑', '🏆', '🥇',
  '🧭', '🗺️', '📍', '🏴‍☠️', '⚓',
  // Контейнеры и предметы
  '📦', '🎒', '👜', '🏺', '⚗️', '🧪', 
  '🕰️', '⏳', '⌛', '🧸', '🎭', '🎪',
  // Еда и зелья
  '🍖', '🍗', '🥩', '🧀', '🍞', '🥖', '🥐', '🍎', '🍇', '🍺', '🍷', '🥤', '☕',
  // Здания и локации
  '🏰', '🏯', '⛪', '🕌', '🛕', '⛩️', '🗿', '🏛️', '🏚️', '🏡',
  '⛺', '🗻', '🌋', '🏔️', '🏝️', '🏜️',
  // Транспорт
  '⛵', '🚣', '🛶', '🐎', 
  // Символы
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❌', '⭕', '✅', '❓', '❗', '💢', '💥', '💦', '💨', '🕳️',
  '🚫', '⚠️', '☢️', '☣️', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪'
]

// Популярные цвета рамок
const colorOptions = [
  '#e8d5b7', // золотой
  '#ef4444', // красный
  '#22c55e', // зелёный
  '#3b82f6', // синий
  '#a855f7', // фиолетовый
  '#f97316', // оранжевый
  '#06b6d4', // бирюзовый
  '#ec4899', // розовый
  '#4a5568', // серый
  '#000000'  // чёрный
]

const tokenImage = computed(() => {
  return imageType.value === 'emoji' ? selectedEmoji.value : imageUrl.value
})

async function handleCreate() {
  if (!tokenName.value.trim()) {
    error.value = 'Введите имя токена'
    return
  }
  
  if (imageType.value === 'url' && !imageUrl.value.trim()) {
    error.value = 'Введите URL картинки'
    return
  }
  
  isLoading.value = true
  error.value = ''
  
  try {
    const token = await tokensStore.createToken(props.campaignId, {
      name: tokenName.value.trim(),
      image: tokenImage.value,
      imageType: imageType.value,
      borderColor: borderColor.value,
      mapType: props.mapType,
      x: 200,
      y: 200
    })
    
    emit('created', token)
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
        <h2>✨ Создать токен</h2>
        <p>Добавить персонажа или объект на карту</p>
      </div>
      
      <form @submit.prevent="handleCreate" class="modal-form">
        <!-- Имя токена -->
        <div class="form-group">
          <label for="tokenName">Имя токена</label>
          <input 
            id="tokenName"
            v-model="tokenName"
            type="text"
            placeholder="Эльф-рейнджер, Гоблин #1..."
            maxlength="30"
            autofocus
          />
        </div>
        
        <!-- Тип изображения -->
        <div class="form-group">
          <label>Изображение</label>
          <div class="image-type-toggle">
            <button 
              type="button"
              :class="{ active: imageType === 'emoji' }"
              @click="imageType = 'emoji'"
            >
              😀 Эмодзи
            </button>
            <button 
              type="button"
              :class="{ active: imageType === 'url' }"
              @click="imageType = 'url'"
            >
              🔗 URL
            </button>
          </div>
        </div>
        
        <!-- Выбор эмодзи -->
        <div v-if="imageType === 'emoji'" class="form-group">
          <label>Выберите эмодзи ({{ emojiOptions.length }} шт.)</label>
          <div class="emoji-grid">
            <button
              v-for="emoji in emojiOptions"
              :key="emoji"
              type="button"
              class="emoji-option"
              :class="{ selected: selectedEmoji === emoji }"
              @click="selectedEmoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>
        
        <!-- URL картинки -->
        <div v-else class="form-group">
          <label for="imageUrl">URL картинки</label>
          <input 
            id="imageUrl"
            v-model="imageUrl"
            type="url"
            placeholder="https://example.com/token.png"
          />
          <p class="url-hint">Вставьте прямую ссылку на изображение</p>
        </div>
        
        <!-- Цвет рамки -->
        <div class="form-group">
          <label>Цвет рамки</label>
          <div class="color-grid">
            <button
              v-for="color in colorOptions"
              :key="color"
              type="button"
              class="color-option"
              :class="{ selected: borderColor === color }"
              :style="{ backgroundColor: color }"
              @click="borderColor = color"
            />
          </div>
        </div>
        
        <!-- Превью токена -->
        <div class="form-group">
          <label>Превью</label>
          <div class="token-preview-container">
            <div 
              class="token-preview"
              :style="{ borderColor: borderColor }"
            >
              <span v-if="imageType === 'emoji'" class="token-emoji">{{ selectedEmoji }}</span>
              <img v-else-if="imageUrl" :src="imageUrl" alt="Token" class="token-image" />
              <span v-else class="token-placeholder">?</span>
            </div>
            <span class="token-name-preview">{{ tokenName || 'Имя токена' }}</span>
          </div>
        </div>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="btn-primary" :disabled="isLoading">
            {{ isLoading ? 'Создаём...' : 'Создать' }}
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
  z-index: 200;
  padding: 1rem;
}

.modal {
  background: linear-gradient(145deg, #1e2a3a 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
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
  margin-bottom: 1.25rem;
}

.modal-header h2 {
  font-family: 'Prata', serif;
  color: #e8d5b7;
  margin: 0 0 0.25rem 0;
  font-size: 1.35rem;
}

.modal-header p {
  color: #8892a8;
  margin: 0;
  font-size: 0.85rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  color: #c4cad6;
  font-size: 0.8rem;
  font-weight: 500;
}

.form-group input {
  padding: 0.65rem 0.85rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
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

.image-type-toggle {
  display: flex;
  gap: 0.5rem;
}

.image-type-toggle button {
  flex: 1;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #c4cad6;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.image-type-toggle button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.image-type-toggle button.active {
  background: rgba(232, 213, 183, 0.15);
  border-color: #e8d5b7;
  color: #e8d5b7;
}

.url-hint {
  color: #8892a8;
  font-size: 0.75rem;
  margin: 0.25rem 0 0 0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.emoji-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.15s;
}

.emoji-option:hover {
  background: rgba(255, 255, 255, 0.1);
}

.emoji-option.selected {
  background: rgba(232, 213, 183, 0.2);
  border-color: #e8d5b7;
}

.color-grid {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-option {
  width: 28px;
  height: 28px;
  border: 3px solid transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.token-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
}

.token-preview {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 7px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.token-emoji {
  font-size: 1.5rem;
}

.token-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.token-placeholder {
  color: #999;
  font-size: 1.25rem;
}

.token-name-preview {
  font-size: 0.75rem;
  color: #333;
  font-weight: 500;
}

.error-message {
  color: #ef4444;
  font-size: 0.8rem;
  margin: 0;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 0.75rem 1rem;
  font-weight: 600;
  font-size: 0.9rem;
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
  box-shadow: 0 8px 16px rgba(201, 169, 89, 0.3);
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

