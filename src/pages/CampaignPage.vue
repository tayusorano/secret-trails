<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useCampaignsStore } from '@/stores/campaigns'
import { useChatStore } from '@/stores/chat'
import { useCharactersStore } from '@/stores/characters'

import GameSidebar from '@/components/game/GameSidebar.vue'
import GameMap from '@/components/game/GameMap.vue'
import GameChat from '@/components/game/GameChat.vue'
import CreateTokenModal from '@/components/game/CreateTokenModal.vue'
import CreateCharacterModal from '@/components/game/CreateCharacterModal.vue'
import CharactersList from '@/components/game/CharactersList.vue'
import CharacterSheet from '@/components/game/CharacterSheet.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const campaignsStore = useCampaignsStore()
const chatStore = useChatStore()
const charactersStore = useCharactersStore()

const campaignId = computed(() => route.params.id)
const loading = ref(true)
const error = ref(null)

// Тип карты
const mapType = ref('global')

// Модальные окна
const showCreateTokenModal = ref(false)
const showCreateCharacterModal = ref(false)
const showCharactersList = ref(false)
const showCharacterSheet = ref(false)
const selectedCharacter = ref(null)
const isViewingAllCharacters = ref(false) // true для ГМ (все персонажи), false для игрока (свои)

// Персонажи текущего игрока
const myCharacters = computed(() => {
  return charactersStore.getMyCharacters(authStore.user?.uid)
})

// Все персонажи кампании (для ГМ)
const allCharacters = computed(() => {
  return charactersStore.characters
})

// Загружаем кампанию
onMounted(async () => {
  try {
    await campaignsStore.getCampaign(campaignId.value)
    chatStore.subscribeToChat(campaignId.value)
    charactersStore.subscribeToCharacters(campaignId.value)
    loading.value = false
  } catch (e) {
    error.value = e.message
    loading.value = false
  }
})

// Отписываемся при уходе
onUnmounted(() => {
  chatStore.unsubscribeFromChat()
  charactersStore.unsubscribeFromCharacters()
})

function handleMapTypeChange(type) {
  mapType.value = type
}

function openCreateTokenModal() {
  showCreateTokenModal.value = true
}

function openCreateCharacterModal() {
  showCreateCharacterModal.value = true
}

// Показать список своих персонажей (для игрока)
function openMyCharacters() {
  isViewingAllCharacters.value = false
  showCharactersList.value = true
}

// Показать список всех персонажей (для ГМ)
function openAllCharacters() {
  isViewingAllCharacters.value = true
  showCharactersList.value = true
}

function closeCharactersList() {
  showCharactersList.value = false
}

// Выбрать персонажа для просмотра
function selectCharacter(character) {
  selectedCharacter.value = character
  showCharacterSheet.value = true
  showCharactersList.value = false
}

function closeCharacterSheet() {
  showCharacterSheet.value = false
  selectedCharacter.value = null
}

function goBack() {
  router.push('/dashboard')
}

// Проверяем права доступа
const hasAccess = computed(() => {
  const campaign = campaignsStore.currentCampaign
  if (!campaign) return false
  
  const userId = authStore.userId
  return campaign.masterId === userId || campaign.players?.includes(userId)
})
</script>

<template>
  <div class="campaign-page">
    <!-- Загрузка -->
    <div v-if="loading" class="loading-screen">
      <div class="loading-spinner"></div>
      <p>Загрузка кампании...</p>
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="error || !hasAccess" class="error-screen">
      <div class="error-icon">🚫</div>
      <h2>{{ error || 'Нет доступа к кампании' }}</h2>
      <button @click="goBack" class="btn-back">← Вернуться</button>
    </div>
    
    <!-- Игровой экран -->
    <template v-else>
      <!-- Шапка -->
      <header class="game-header">
        <button class="btn-back-small" @click="goBack" title="Назад">
          ←
        </button>
        <div class="campaign-title">
          <h1>{{ campaignsStore.currentCampaign?.name }}</h1>
          <span class="campaign-code" title="Код для присоединения">
            🔑 {{ campaignsStore.currentCampaign?.joinCode }}
          </span>
        </div>
        <div class="header-info">
          <span class="user-role" :class="{ 'role-gm': userStore.isGM }">
            {{ userStore.isGM ? '🎭 GM' : '⚔️ Player' }}
          </span>
        </div>
      </header>
      
      <!-- Основной контент -->
      <div class="game-content">
        <!-- Левая панель -->
        <GameSidebar 
          :campaign-id="campaignId" 
          @toggle-map-type="handleMapTypeChange"
          @create-token="openCreateTokenModal"
          @create-character="openCreateCharacterModal"
          @view-my-characters="openMyCharacters"
          @view-sheets="openAllCharacters"
        />
        
        <!-- Карта (центр) -->
        <GameMap :map-type="mapType" :campaign-id="campaignId" />
        
        <!-- Чат (справа) -->
        <div class="chat-panel">
          <GameChat :campaign-id="campaignId" />
        </div>
      </div>
    </template>
    
    <!-- Модальное окно создания токена -->
    <CreateTokenModal 
      v-if="showCreateTokenModal"
      :campaign-id="campaignId"
      :map-type="mapType"
      @close="showCreateTokenModal = false"
    />
    
    <!-- Модальное окно создания персонажа -->
    <CreateCharacterModal 
      v-if="showCreateCharacterModal"
      :campaign-id="campaignId"
      @close="showCreateCharacterModal = false"
    />
    
    <!-- Панель списка персонажей -->
    <CharactersList
      :is-open="showCharactersList"
      :characters="isViewingAllCharacters ? allCharacters : myCharacters"
      :title="isViewingAllCharacters ? 'Все персонажи' : 'Мои персонажи'"
      :empty-message="isViewingAllCharacters ? 'Нет персонажей в кампании' : 'У вас нет персонажей'"
      @close="closeCharactersList"
      @select="selectCharacter"
    />
    
    <!-- Лист персонажа -->
    <CharacterSheet
      v-if="showCharacterSheet && selectedCharacter"
      :character="selectedCharacter"
      :campaign-id="campaignId"
      :can-edit="!userStore.isGM && selectedCharacter?.ownerId === authStore.user?.uid"
      @close="closeCharacterSheet"
      @updated="closeCharacterSheet"
      @deleted="closeCharacterSheet"
    />
  </div>
</template>

<style scoped>
.campaign-page {
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  color: #e4e4e7;
  overflow: hidden;
}

/* Загрузка и ошибка */
.loading-screen,
.error-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
  to { transform: rotate(360deg); }
}

.loading-screen p {
  color: #8892a8;
}

.error-icon {
  font-size: 4rem;
}

.error-screen h2 {
  color: #e8d5b7;
  font-family: 'Prata', serif;
  margin: 0;
}

.btn-back {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: #c4cad6;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

/* Шапка */
.game-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-back-small {
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  color: #c4cad6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-back-small:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.campaign-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.campaign-title h1 {
  font-family: 'Prata', serif;
  font-size: 1.25rem;
  color: #e8d5b7;
  margin: 0;
}

.campaign-code {
  font-size: 0.75rem;
  color: #8892a8;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-family: monospace;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-role {
  padding: 0.3rem 0.6rem;
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.user-role.role-gm {
  background: rgba(234, 179, 8, 0.2);
  color: #fbbf24;
}

/* Основной контент */
.game-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* Важно для flex */
}

/* Панель чата */
.chat-panel {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (max-width: 900px) {
  .game-content {
    flex-direction: column;
  }
  
  .chat-panel {
    width: 100%;
    height: 250px;
  }
}
</style>

