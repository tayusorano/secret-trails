<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content character-sheet">
      <button class="close-btn" @click="$emit('close')">✕</button>
      
      <div class="sheet-header">
        <h2>Лист персонажа: {{ character.name }}</h2>
        <div v-if="canEdit" class="sheet-actions">
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
        <!-- Основная информация -->
        <div class="sheet-section">
          <h3>Основная информация</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ИМЯ</span>
              <input v-if="isEditing" v-model="editForm.name" type="text" />
              <span v-else class="info-value">{{ character.name }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">УР</span>
              <select v-if="isEditing" v-model.number="editForm.level">
                <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
              </select>
              <span v-else class="info-value">{{ character.level }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">ОПЫТ</span>
              <input v-if="isEditing" v-model="editForm.experience" type="text" />
              <span v-else class="info-value">{{ character.experience || '—' }}</span>
            </div>
            <div class="info-item wide">
              <span class="info-label">РЕМЕСЛО</span>
              <input v-if="isEditing" v-model="editForm.craft" type="text" />
              <span v-else class="info-value">{{ character.craft || '—' }}</span>
            </div>
            <div class="info-item wide">
              <span class="info-label">НАРОД</span>
              <div v-if="isEditing" class="race-selector-mini">
                <button
                  v-for="(race, key) in charactersStore.races"
                  :key="key"
                  type="button"
                  class="race-btn-mini"
                  :class="{ selected: editForm.race === key }"
                  @click="editForm.race = key"
                >
                  {{ race.name }}
                </button>
              </div>
              <span v-else class="info-value race-value">
                {{ charactersStore.races[character.race]?.name }}
                <Tooltip :content="charactersStore.races[character.race]?.description" position="bottom">
                  <span class="race-ability-badge">✨ {{ charactersStore.races[character.race]?.ability }}</span>
                </Tooltip>
              </span>
            </div>
          </div>
        </div>

        <!-- Характеристики -->
        <div class="sheet-section">
          <h3>Характеристики</h3>
          <div class="stats-display">
            <!-- СТК -->
            <div 
              class="stat-item" 
              :class="{ clickable: canRollStats }"
              @click="!isEditing && rollStatCheck('stk', 'СТК', character.stats?.stk || 0)"
            >
              <span class="stat-abbr">СТК</span>
              <span class="stat-name">Стойкость</span>
              <select v-if="isEditing" v-model.number="editForm.stats.stk" @click.stop>
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              <span v-else class="stat-value">{{ character.stats?.stk || 0 }}</span>
              <span v-if="canRollStats && !isEditing" class="roll-hint">🎲 Кликни для проверки</span>
              <div v-if="(isEditing ? editForm.stats.stk : character.stats?.stk) >= 5" class="stat-abilities-list">
                <Tooltip :content="charactersStore.statAbilities.stk[5].description" position="bottom">
                  <span class="ability-badge">⚔️ {{ charactersStore.statAbilities.stk[5].name }}</span>
                </Tooltip>
                <Tooltip v-if="(isEditing ? editForm.stats.stk : character.stats?.stk) >= 10" :content="charactersStore.statAbilities.stk[10].description" position="bottom">
                  <span class="ability-badge">💪 {{ charactersStore.statAbilities.stk[10].name }}</span>
                </Tooltip>
              </div>
            </div>
            
            <!-- ЛВК -->
            <div 
              class="stat-item" 
              :class="{ clickable: canRollStats }"
              @click="!isEditing && rollStatCheck('lvk', 'ЛВК', character.stats?.lvk || 0)"
            >
              <span class="stat-abbr">ЛВК</span>
              <span class="stat-name">Ловкость</span>
              <select v-if="isEditing" v-model.number="editForm.stats.lvk" @click.stop>
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              <span v-else class="stat-value">{{ character.stats?.lvk || 0 }}</span>
              <span v-if="canRollStats && !isEditing" class="roll-hint">🎲 Кликни для проверки</span>
              <div v-if="(isEditing ? editForm.stats.lvk : character.stats?.lvk) >= 5" class="stat-abilities-list">
                <Tooltip :content="charactersStore.statAbilities.lvk[5].description" position="bottom">
                  <span class="ability-badge">🎯 {{ charactersStore.statAbilities.lvk[5].name }}</span>
                </Tooltip>
                <Tooltip v-if="(isEditing ? editForm.stats.lvk : character.stats?.lvk) >= 10" :content="charactersStore.statAbilities.lvk[10].description" position="bottom">
                  <span class="ability-badge">🗡️ {{ charactersStore.statAbilities.lvk[10].name }}</span>
                </Tooltip>
              </div>
            </div>
            
            <!-- РЗМ -->
            <div 
              class="stat-item" 
              :class="{ clickable: canRollStats }"
              @click="!isEditing && rollStatCheck('rzm', 'РЗМ', character.stats?.rzm || 0)"
            >
              <span class="stat-abbr">РЗМ</span>
              <span class="stat-name">Разум</span>
              <select v-if="isEditing" v-model.number="editForm.stats.rzm" @click.stop>
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              <span v-else class="stat-value">{{ character.stats?.rzm || 0 }}</span>
              <span v-if="canRollStats && !isEditing" class="roll-hint">🎲 Кликни для проверки</span>
              <div v-if="(isEditing ? editForm.stats.rzm : character.stats?.rzm) >= 5" class="stat-abilities-list">
                <Tooltip 
                  v-for="(ability, idx) in charactersStore.statAbilities.rzm[5]" 
                  :key="idx"
                  :content="ability.description" 
                  position="bottom"
                >
                  <span class="ability-badge">🔮 {{ ability.name }}</span>
                </Tooltip>
                <Tooltip v-if="(isEditing ? editForm.stats.rzm : character.stats?.rzm) >= 10" :content="charactersStore.statAbilities.rzm[10].description" position="bottom">
                  <span class="ability-badge">📚 {{ charactersStore.statAbilities.rzm[10].name }}</span>
                </Tooltip>
              </div>
            </div>
            
            <!-- ХАР -->
            <div 
              class="stat-item" 
              :class="{ clickable: canRollStats }"
              @click="!isEditing && rollStatCheck('har', 'ХАР', character.stats?.har || 0)"
            >
              <span class="stat-abbr">ХАР</span>
              <span class="stat-name">Харизма</span>
              <select v-if="isEditing" v-model.number="editForm.stats.har" @click.stop>
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              <span v-else class="stat-value">{{ character.stats?.har || 0 }}</span>
              <span v-if="canRollStats && !isEditing" class="roll-hint">🎲 Кликни для проверки</span>
              <div v-if="(isEditing ? editForm.stats.har : character.stats?.har) >= 5" class="stat-abilities-list">
                <Tooltip :content="charactersStore.statAbilities.har[5].description" position="bottom">
                  <span class="ability-badge">👑 {{ charactersStore.statAbilities.har[5].name }}</span>
                </Tooltip>
                <Tooltip v-if="(isEditing ? editForm.stats.har : character.stats?.har) >= 10" :content="charactersStore.statAbilities.har[10].description" position="bottom">
                  <span class="ability-badge">🎖️ {{ charactersStore.statAbilities.har[10].name }}</span>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        <!-- Боевые параметры -->
        <div class="sheet-section">
          <h3>Боевые параметры</h3>
          <div class="combat-display">
            <div class="combat-item">
              <span class="combat-label">КД</span>
              <input v-if="isEditing" v-model.number="editForm.armorClass" type="number" min="0" />
              <span v-else class="combat-value calculated">{{ character.armorClass }}</span>
            </div>
            <div class="combat-item">
              <span class="combat-label">ЧД</span>
              <select v-if="isEditing" v-model.number="editForm.armorParts" @change="updateArmorClass">
                <option v-for="n in 8" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              <span v-else class="combat-value">{{ character.armorParts }}</span>
            </div>
            <div class="combat-item">
              <span class="combat-label">макс СКР</span>
              <input v-if="isEditing" v-model="editForm.maxSpeed" type="text" />
              <span v-else class="combat-value">{{ character.maxSpeed || '—' }}</span>
            </div>
            <div class="combat-item">
              <span class="combat-label">СКР</span>
              <input v-if="isEditing" v-model="editForm.currentSpeed" type="text" />
              <span v-else class="combat-value">{{ character.currentSpeed || '—' }}</span>
            </div>
            <div class="combat-item">
              <span class="combat-label">макс ОЗ</span>
              <input v-if="isEditing" v-model="editForm.maxHp" type="text" />
              <span v-else class="combat-value">{{ character.maxHp || '—' }}</span>
            </div>
            <div class="combat-item">
              <span class="combat-label">ОЗ</span>
              <input v-if="isEditing" v-model="editForm.currentHp" type="text" />
              <span v-else class="combat-value">{{ character.currentHp || '—' }}</span>
            </div>
            <div class="combat-item">
              <span class="combat-label">макс РАН</span>
              <span class="combat-value calculated">{{ character.maxWounds }}</span>
            </div>
            <div class="combat-item">
              <span class="combat-label">РАНЫ</span>
              <input v-if="isEditing" v-model="editForm.currentWounds" type="text" />
              <span v-else class="combat-value">{{ character.currentWounds || '0' }}</span>
            </div>
          </div>
        </div>

        <!-- Мировоззрение -->
        <div class="sheet-section">
          <h3>Личность</h3>
          <div class="personality-display">
            <div class="info-item">
              <span class="info-label">МИРОВОЗЗРЕНИЕ</span>
              <div v-if="isEditing" class="worldview-selector-mini">
                <button
                  type="button"
                  class="wv-btn"
                  :class="{ selected: editForm.worldview === 'order' }"
                  @click="editForm.worldview = 'order'"
                >⚖️ Порядок</button>
                <button
                  type="button"
                  class="wv-btn"
                  :class="{ selected: editForm.worldview === 'balance' }"
                  @click="editForm.worldview = 'balance'"
                >☯️ Баланс</button>
                <button
                  type="button"
                  class="wv-btn"
                  :class="{ selected: editForm.worldview === 'chaos' }"
                  @click="editForm.worldview = 'chaos'"
                >🌀 Хаос</button>
              </div>
              <span v-else class="info-value worldview-badge" :class="character.worldview">
                {{ worldviewLabels[character.worldview] || '—' }}
              </span>
            </div>
            <div class="info-item wide">
              <span class="info-label">ПРИЧУДЫ</span>
              <input v-if="isEditing" v-model="editForm.quirks" type="text" />
              <span v-else class="info-value">{{ character.quirks || '—' }}</span>
            </div>
            <div class="info-item wide">
              <span class="info-label">ЧЕРТЫ</span>
              <textarea v-if="isEditing" v-model="editForm.traits" rows="4"></textarea>
              <p v-else class="info-value multiline">{{ character.traits || '—' }}</p>
            </div>
          </div>
        </div>

        <!-- Инвентарь -->
        <div class="sheet-section">
          <h3>Инвентарь</h3>
          <div class="inventory-display">
            <div class="inventory-col">
              <div v-for="i in 10" :key="i" class="inv-slot">
                <span class="inv-num">{{ i }}</span>
                <input 
                  v-if="isEditing" 
                  v-model="editForm.inventory[i-1]" 
                  type="text"
                  :title="editForm.inventory[i-1]"
                />
                <span v-else class="inv-item" :title="character.inventory?.[i-1]">
                  {{ character.inventory?.[i-1] || '—' }}
                </span>
              </div>
            </div>
            <div class="inventory-col">
              <div v-for="i in 10" :key="i+10" class="inv-slot" :class="{ penalty: i === 1 || i === 6 }">
                <span class="inv-num">{{ i + 10 }}</span>
                <input 
                  v-if="isEditing" 
                  v-model="editForm.inventory[i+9]" 
                  type="text"
                  :title="editForm.inventory[i+9]"
                />
                <span v-else class="inv-item" :title="character.inventory?.[i+9]">
                  {{ character.inventory?.[i+9] || '—' }}
                </span>
                <span v-if="i === 1" class="penalty-tag">СКР -5'</span>
                <span v-else-if="i === 6" class="penalty-tag">СКР -10'</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Заметки -->
        <div class="sheet-section">
          <h3>Заметки</h3>
          <textarea v-if="isEditing" v-model="editForm.notes" rows="5"></textarea>
          <p v-else class="notes-content">{{ character.notes || 'Нет заметок' }}</p>
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
import { ref, reactive, computed } from 'vue'
import { useCharactersStore } from '@/stores/characters'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'
import Tooltip from '@/components/ui/Tooltip.vue'

const props = defineProps({
  character: {
    type: Object,
    required: true
  },
  campaignId: {
    type: String,
    required: true
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'updated', 'deleted'])

const charactersStore = useCharactersStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const isEditing = ref(false)
const isSaving = ref(false)
const error = ref('')

const statsConfig = {
  stk: { abbr: 'СТК', name: 'Стойкость' },
  lvk: { abbr: 'ЛВК', name: 'Ловкость' },
  rzm: { abbr: 'РЗМ', name: 'Разум' },
  har: { abbr: 'ХАР', name: 'Харизма' }
}

const worldviewLabels = {
  order: '⚖️ Порядок',
  balance: '☯️ Баланс',
  chaos: '🌀 Хаос'
}

// Форма редактирования
const editForm = reactive({
  name: '',
  level: 1,
  experience: '',
  craft: '',
  race: null,
  stats: { stk: 0, lvk: 0, rzm: 0, har: 0 },
  armorClass: 11,
  armorParts: 0,
  maxSpeed: '',
  currentSpeed: '',
  maxHp: '',
  currentHp: '',
  currentWounds: '',
  worldview: null,
  quirks: '',
  traits: '',
  inventory: Array(20).fill(''),
  notes: ''
})

// Обновление КД при изменении ЧД
function updateArmorClass() {
  editForm.armorClass = 11 + editForm.armorParts
}

// Проверка можно ли кликать по характеристикам (только игрок, не в режиме редактирования)
const canRollStats = computed(() => {
  return props.canEdit && !isEditing.value && !userStore.isGM
})

// Бросок проверки характеристики
async function rollStatCheck(statKey, statName, statValue) {
  if (!canRollStats.value) return
  
  const d20 = Math.floor(Math.random() * 20) + 1
  const total = d20 + statValue
  const notation = `1d20+${statValue} (${statName})`
  const details = `[${d20}] + ${statValue}`
  
  await chatStore.sendDiceRoll(
    props.campaignId,
    notation,
    total,
    details
  )
}

function startEditing() {
  // Копируем данные персонажа в форму
  editForm.name = props.character.name || ''
  editForm.level = props.character.level || 1
  editForm.experience = props.character.experience || ''
  editForm.craft = props.character.craft || ''
  editForm.race = props.character.race
  editForm.stats = { ...props.character.stats }
  editForm.armorClass = props.character.armorClass || 11
  editForm.armorParts = props.character.armorParts || 0
  editForm.maxSpeed = props.character.maxSpeed || ''
  editForm.currentSpeed = props.character.currentSpeed || ''
  editForm.maxHp = props.character.maxHp || ''
  editForm.currentHp = props.character.currentHp || ''
  editForm.currentWounds = props.character.currentWounds || ''
  editForm.worldview = props.character.worldview
  editForm.quirks = props.character.quirks || ''
  editForm.traits = props.character.traits || ''
  editForm.inventory = [...(props.character.inventory || Array(20).fill(''))]
  editForm.notes = props.character.notes || ''
  
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
  error.value = ''
}

// Вычисление макс ран по уровню
function getMaxWounds(level) {
  if (level === 1) return 5
  if (level <= 3) return 6
  if (level <= 5) return 7
  if (level <= 7) return 8
  if (level <= 9) return 9
  return 10
}

async function saveChanges() {
  isSaving.value = true
  error.value = ''
  
  try {
    await charactersStore.updateCharacter(
      props.campaignId,
      props.character.id,
      {
        name: editForm.name.trim(),
        level: editForm.level,
        experience: editForm.experience,
        craft: editForm.craft.trim(),
        race: editForm.race,
        stats: { ...editForm.stats },
        armorParts: editForm.armorParts,
        armorClass: editForm.armorClass,
        maxSpeed: editForm.maxSpeed,
        currentSpeed: editForm.currentSpeed,
        maxHp: editForm.maxHp,
        currentHp: editForm.currentHp,
        maxWounds: getMaxWounds(editForm.level),
        currentWounds: editForm.currentWounds,
        worldview: editForm.worldview,
        quirks: editForm.quirks,
        traits: editForm.traits,
        inventory: [...editForm.inventory],
        notes: editForm.notes
      },
      authStore.user.uid
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
  if (confirm(`Удалить персонажа "${props.character.name}"? Это действие нельзя отменить.`)) {
    deleteCharacter()
  }
}

async function deleteCharacter() {
  try {
    await charactersStore.deleteCharacter(
      props.campaignId,
      props.character.id,
      authStore.user.uid
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
  max-width: 800px;
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
  font-size: 1.4rem;
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

/* Информация */
.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-item.wide {
  grid-column: span 3;
}

.info-label {
  color: #8892a8;
  font-size: 0.75rem;
  font-weight: 500;
  margin-top: 10px;
}

.info-value {
  color: #e4e4e7;
  font-size: 0.95rem;
}

.info-value.multiline {
  white-space: pre-wrap;
  line-height: 1.5;
}

.race-value {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.race-ability-badge {
  font-size: 0.75rem;
  color: #e8d5b7;
  background: rgba(232, 213, 183, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  cursor: help;
  transition: background 0.2s;
}

.race-ability-badge:hover {
  background: rgba(232, 213, 183, 0.2);
}

/* Характеристики */
.stats-display {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.stat-item {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
  text-align: center;
  position: relative;
  transition: all 0.2s;
}

.stat-item.clickable {
  cursor: pointer;
}

.stat-item.clickable:hover {
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.3);
  transform: translateY(-2px);
}

.stat-item.clickable:active {
  transform: translateY(0);
}

.roll-hint {
  display: none;
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  color: #fbbf24;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.8);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.stat-item.clickable:hover .roll-hint {
  display: block;
}

.stat-abbr {
  display: block;
  color: #e8d5b7;
  font-weight: bold;
  font-size: 0.9rem;
}

.stat-name {
  display: block;
  color: #8892a8;
  font-size: 0.7rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  color: #e4e4e7;
  font-size: 1.5rem;
  font-weight: bold;
}

/* Способности характеристик */
.stat-abilities-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.ability-badge {
  display: inline-block;
  font-size: 0.65rem;
  padding: 0.2rem 0.4rem;
  background: rgba(232, 213, 183, 0.15);
  color: #e8d5b7;
  border-radius: 4px;
  cursor: help;
  transition: background 0.2s;
}

.ability-badge:hover {
  background: rgba(232, 213, 183, 0.25);
}

/* Боевые параметры */
.combat-display {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.combat-item {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 0.5rem;
  text-align: center;
}

.combat-label {
  display: block;
  color: #8892a8;
  font-size: 0.7rem;
  margin-bottom: 0.25rem;
}

.combat-value {
  display: block;
  color: #e4e4e7;
  font-size: 1.1rem;
  font-weight: bold;
}

.combat-value.calculated {
  color: #e8d5b7;
}

/* Мировоззрение */
.worldview-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  font-size: 0.85rem;
}

.worldview-badge.order {
  background: rgba(96, 165, 250, 0.2);
  color: #60a5fa;
}

.worldview-badge.balance {
  background: rgba(167, 139, 250, 0.2);
  color: #a78bfa;
}

.worldview-badge.chaos {
  background: rgba(248, 113, 113, 0.2);
  color: #f87171;
}

/* Инвентарь */
.inventory-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  overflow: hidden;
}

.inventory-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  overflow: hidden;
  min-width: 0;
}

.inv-slot {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-height: 24px;
}

.inv-num {
  width: 22px;
  height: 22px;
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

.inv-slot.penalty .inv-num {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.inv-item {
  flex: 1;
  color: #c4cad6;
  font-size: 0.85rem;
  word-break: break-word;
  line-height: 1.3;
  min-width: 0;
}

.penalty-tag {
  color: #f87171;
  font-size: 0.6rem;
  background: rgba(239, 68, 68, 0.15);
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
}

/* Заметки */
.notes-content {
  color: #c4cad6;
  font-size: 0.9rem;
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}

/* Редактирование */
.sheet-content.editing input,
.sheet-content.editing select,
.sheet-content.editing textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  color: #e4e4e7;
  font-size: 0.9rem;
  width: 100%;
}

.sheet-content.editing input:focus,
.sheet-content.editing select:focus,
.sheet-content.editing textarea:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

.sheet-content.editing textarea {
  font-family: inherit;
  resize: vertical;
}

.stat-item select,
.combat-item select,
.combat-item input {
  width: 100%;
  text-align: center;
}

/* Селекторы при редактировании */
.race-selector-mini,
.worldview-selector-mini {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.race-btn-mini,
.wv-btn {
  padding: 0.4rem 0.6rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #c4cad6;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.race-btn-mini:hover,
.wv-btn:hover {
  border-color: rgba(232, 213, 183, 0.3);
}

.race-btn-mini.selected,
.wv-btn.selected {
  background: rgba(232, 213, 183, 0.15);
  border-color: #e8d5b7;
  color: #e8d5b7;
}

/* Кнопки редактирования */
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

/* Адаптивность */
@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .info-item.wide {
    grid-column: span 2;
  }
  
  .stats-display,
  .combat-display {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .inventory-display {
    grid-template-columns: 1fr;
  }
  
  .sheet-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
</style>

