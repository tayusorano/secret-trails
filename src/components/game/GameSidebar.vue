<script setup>
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  campaignId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['toggle-map-type', 'create-token', 'create-character', 'view-sheets', 'view-my-characters'])

const userStore = useUserStore()

// Тип карты: 'global' (гексы) или 'local' (квадраты)
const mapType = ref('global')

// Показ меню персонажей
const showCharacterMenu = ref(false)

function toggleMapType() {
  mapType.value = mapType.value === 'global' ? 'local' : 'global'
  emit('toggle-map-type', mapType.value)
}

function toggleCharacterMenu() {
  showCharacterMenu.value = !showCharacterMenu.value
}

// Действия персонажей
function createToken() {
  emit('create-token')
}

function viewCharacterSheets() {
  emit('view-sheets')
}

function viewMyCharacters() {
  emit('view-my-characters')
}

function createCharacter() {
  emit('create-character')
}
</script>

<template>
  <div class="game-sidebar">
    <!-- Переключатель типа карты -->
    <div class="sidebar-section">
      <button 
        class="map-toggle"
        @click="toggleMapType"
        :title="mapType === 'global' ? 'Глобальная карта' : 'Карта местности'"
      >
        <span class="toggle-icon">{{ mapType === 'global' ? '🌍' : '🗺️' }}</span>
        <span class="toggle-label">{{ mapType === 'global' ? 'Глобальная' : 'Местность' }}</span>
      </button>
    </div>

    <!-- Кнопка персонажей -->
    <div class="sidebar-section">
      <button 
        class="characters-btn"
        :class="{ active: showCharacterMenu }"
        @click="toggleCharacterMenu"
      >
        <span class="btn-icon">👥</span>
        <span class="btn-label">Персонажи</span>
        <span class="btn-arrow">{{ showCharacterMenu ? '▲' : '▼' }}</span>
      </button>
      
      <!-- Подменю персонажей -->
      <div v-if="showCharacterMenu" class="character-menu">
        <!-- Меню для GM -->
        <template v-if="userStore.isGM">
          <button class="menu-item" @click="createToken">
            <span>✨</span> Создать токен
          </button>
          <button class="menu-item" @click="viewCharacterSheets">
            <span>📋</span> Посмотреть листы
          </button>
        </template>
        
        <!-- Меню для игрока -->
        <template v-else>
          <button class="menu-item" @click="createCharacter">
            <span>✨</span> Создать персонажа
          </button>
          <button class="menu-item" @click="createToken">
            <span>🎭</span> Создать токен
          </button>
          <button class="menu-item" @click="viewMyCharacters">
            <span>📜</span> Мои персонажи
          </button>
        </template>
      </div>
    </div>

    <!-- Разделитель -->
    <div class="sidebar-divider"></div>

    <!-- Информация о кампании -->
    <div class="sidebar-section sidebar-info">
      <div class="info-item">
        <span class="info-icon">🎭</span>
        <span class="info-label">{{ userStore.isGM ? 'Мастер' : 'Игрок' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  width: 180px;
  min-width: 180px;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.map-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e8d5b7;
  cursor: pointer;
  transition: all 0.2s;
}

.map-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(232, 213, 183, 0.3);
}

.toggle-icon {
  font-size: 1.25rem;
}

.toggle-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.characters-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #c4cad6;
  cursor: pointer;
  transition: all 0.2s;
}

.characters-btn:hover,
.characters-btn.active {
  background: rgba(255, 255, 255, 0.1);
  color: #e8d5b7;
}

.btn-icon {
  font-size: 1rem;
}

.btn-label {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 500;
  text-align: left;
}

.btn-arrow {
  font-size: 0.6rem;
  opacity: 0.6;
}

.character-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #c4cad6;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e8d5b7;
}

.menu-item span:first-child {
  font-size: 0.9rem;
}

.sidebar-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

.sidebar-info {
  margin-top: auto;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #8892a8;
}

.info-icon {
  font-size: 0.9rem;
}
</style>

