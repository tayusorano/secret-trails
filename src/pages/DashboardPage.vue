<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore, USER_ROLES } from '@/stores/user'
import { useCampaignsStore } from '@/stores/campaigns'
import CreateCampaignModal from '@/components/CreateCampaignModal.vue'
import JoinCampaignModal from '@/components/JoinCampaignModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const campaignsStore = useCampaignsStore()

// Модальные окна
const showCreateModal = ref(false)
const showJoinModal = ref(false)
const showRoleWarning = ref(false)

// Попытка создать кампанию
function tryCreateCampaign() {
  if (!userStore.isGM) {
    showRoleWarning.value = true
    setTimeout(() => { showRoleWarning.value = false }, 3000)
    return
  }
  showCreateModal.value = true
}

// Подписываемся на кампании при загрузке
onMounted(() => {
  campaignsStore.subscribeToAllCampaigns()
})

async function handleLogout() {
  campaignsStore.clearCampaigns()
  await authStore.logout()
  router.push('/login')
}

// Смена роли (для тестирования)
async function toggleRole() {
  if (!authStore.userId) return
  const newRole = userStore.isGM ? USER_ROLES.PLAYER : USER_ROLES.GM
  await userStore.setRole(authStore.userId, newRole)
}

function handleCampaignCreated(campaign) {
  console.log('Campaign created:', campaign)
}

function handleCampaignJoined(campaign) {
  console.log('Joined campaign:', campaign)
}

function enterCampaign(campaignId) {
  router.push(`/campaign/${campaignId}`)
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="logo">
        <span class="logo-icon">🌲</span>
        <h1>Тайные Тропы</h1>
      </div>
      
      <div class="user-menu">
        <span class="user-role" :class="{ 'role-gm': userStore.isGM }">
          {{ userStore.isGM ? '🎭 Game Master' : '⚔️ Player' }}
        </span>
        <span class="user-name">{{ userStore.displayName }}</span>
        <button @click="toggleRole" class="btn-role" title="Сменить роль (для теста)">
          🔄
        </button>
        <button @click="handleLogout" class="btn-logout">
          Выйти
        </button>
      </div>
    </header>

    <main class="dashboard-content">
      <!-- Приветствие -->
      <section class="welcome-section">
        <h2>{{ userStore.isGM ? 'Добро пожаловать, Мастер!' : 'Добро пожаловать, Искатель!' }}</h2>
        <p>{{ userStore.isGM ? 'Создайте кампанию или войдите в существующую' : 'Присоединитесь к кампании или создайте свою' }}</p>
      </section>

      <!-- Предупреждение о роли -->
      <div v-if="showRoleWarning" class="role-warning">
        <span>⚠️ Только Game Master может создавать кампании. Пожалуйста, поменяйте роль.</span>
      </div>

      <!-- Кнопки действий -->
      <div class="action-buttons">
        <button 
          class="action-btn create" 
          :class="{ disabled: !userStore.isGM }"
          @click="tryCreateCampaign"
        >
          <span class="action-icon">🗺️</span>
          <span class="action-text">Создать кампанию</span>
          <span v-if="!userStore.isGM" class="action-hint">только для GM</span>
        </button>
        
        <button class="action-btn join" @click="showJoinModal = true">
          <span class="action-icon">🚪</span>
          <span class="action-text">Присоединиться</span>
        </button>
      </div>

      <!-- Мои кампании (где я GM) -->
      <section v-if="campaignsStore.myCampaigns.length > 0" class="campaigns-section">
        <h3>🎭 Мои кампании (как мастер)</h3>
        <div class="campaigns-list">
          <div 
            v-for="campaign in campaignsStore.myCampaigns" 
            :key="campaign.id"
            class="campaign-card master"
          >
            <div class="campaign-info">
              <h4>{{ campaign.name }}</h4>
              <p class="campaign-meta">
                <span class="players-count">👥 {{ campaign.players?.length || 0 }} игроков</span>
                <span class="join-code" title="Код для присоединения">🔑 {{ campaign.joinCode }}</span>
              </p>
            </div>
            <button class="btn-enter" @click="enterCampaign(campaign.id)">
              Войти
            </button>
          </div>
        </div>
      </section>

      <!-- Кампании где я игрок -->
      <section v-if="campaignsStore.joinedCampaigns.length > 0" class="campaigns-section">
        <h3>⚔️ Мои кампании (как игрок)</h3>
        <div class="campaigns-list">
          <div 
            v-for="campaign in campaignsStore.joinedCampaigns" 
            :key="campaign.id"
            class="campaign-card player"
          >
            <div class="campaign-info">
              <h4>{{ campaign.name }}</h4>
              <p class="campaign-meta">
                <span class="master-name">🎭 {{ campaign.masterEmail?.split('@')[0] }}</span>
                <span class="players-count">👥 {{ campaign.players?.length || 0 }} игроков</span>
              </p>
            </div>
            <button class="btn-enter" @click="enterCampaign(campaign.id)">
              Войти
            </button>
          </div>
        </div>
      </section>

      <!-- Пустое состояние -->
      <section 
        v-if="campaignsStore.myCampaigns.length === 0 && campaignsStore.joinedCampaigns.length === 0" 
        class="empty-state"
      >
        <div class="empty-icon">🏕️</div>
        <h3>Пока нет кампаний</h3>
        <p>Создайте свою кампанию или присоединитесь к существующей по коду приглашения</p>
      </section>
    </main>

    <!-- Модальные окна -->
    <CreateCampaignModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false"
      @created="handleCampaignCreated"
    />
    
    <JoinCampaignModal 
      v-if="showJoinModal" 
      @close="showJoinModal = false"
      @joined="handleCampaignJoined"
    />
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #e4e4e7;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.75rem;
}

.logo h1 {
  font-family: 'Prata', serif;
  font-size: 1.5rem;
  color: #e8d5b7;
  margin: 0;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-role {
  padding: 0.35rem 0.75rem;
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.user-role.role-gm {
  background: rgba(234, 179, 8, 0.2);
  color: #fbbf24;
}

.user-name {
  color: #c4cad6;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-role {
  padding: 0.4rem 0.6rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-role:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(180deg);
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #c4cad6;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.dashboard-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 2rem;
}

.welcome-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.welcome-section h2 {
  font-family: 'Prata', serif;
  font-size: 2rem;
  color: #e8d5b7;
  margin: 0 0 0.75rem 0;
}

.welcome-section p {
  color: #8892a8;
  font-size: 1.1rem;
  margin: 0;
}

/* Кнопки действий */
.action-buttons {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(232, 213, 183, 0.4);
  transform: translateY(-4px);
}

.action-btn.create:hover {
  border-color: rgba(234, 179, 8, 0.5);
  box-shadow: 0 10px 30px rgba(234, 179, 8, 0.1);
}

.action-btn.join:hover {
  border-color: rgba(139, 92, 246, 0.5);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.1);
}

.action-icon {
  font-size: 3rem;
}

.action-text {
  color: #e8d5b7;
  font-size: 1.1rem;
  font-weight: 500;
}

.action-hint {
  font-size: 0.75rem;
  color: #8892a8;
  font-weight: 400;
}

.action-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-btn.disabled:hover {
  transform: none;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: none;
}

/* Предупреждение о роли */
.role-warning {
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.3);
  color: #fbbf24;
  padding: 1rem 1.5rem;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Секции кампаний */
.campaigns-section {
  margin-bottom: 2.5rem;
}

.campaigns-section h3 {
  color: #c4cad6;
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.campaigns-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.campaign-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.campaign-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

.campaign-card.master {
  border-left: 3px solid #fbbf24;
}

.campaign-card.player {
  border-left: 3px solid #a78bfa;
}

.campaign-info h4 {
  color: #e8d5b7;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 500;
}

.campaign-meta {
  display: flex;
  gap: 1.25rem;
  color: #8892a8;
  font-size: 0.85rem;
  margin: 0;
}

.join-code {
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

.join-code:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-enter {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #c9a959 0%, #a68a3a 100%);
  color: #1a1a2e;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-enter:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(201, 169, 89, 0.3);
}

/* Пустое состояние */
.empty-state {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #e8d5b7;
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.empty-state p {
  color: #8892a8;
  margin: 0;
  font-size: 0.95rem;
}

@media (max-width: 600px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .user-menu {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
