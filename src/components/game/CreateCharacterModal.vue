<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content character-modal">
      <button class="close-btn" @click="$emit('close')">✕</button>
      
      <h2>Создание персонажа</h2>
      
      <form @submit.prevent="handleCreate" class="character-form">
        <!-- Основная информация -->
        <div class="form-section">
          <h3>Основная информация</h3>
          
          <div class="form-row">
            <!-- Имя -->
            <div class="form-group flex-2">
              <label for="charName">ИМЯ</label>
              <input 
                id="charName"
                v-model="form.name"
                type="text"
                placeholder="Введите имя персонажа"
                required
                maxlength="50"
              />
            </div>
            
            <!-- Уровень -->
            <div class="form-group">
              <label for="charLevel">УР</label>
              <select id="charLevel" v-model.number="form.level">
                <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
              </select>
            </div>
            
            <!-- Опыт -->
            <div class="form-group">
              <label for="charExp">ОПЫТ</label>
              <input 
                id="charExp"
                v-model="form.experience"
                type="text"
                placeholder="0/100"
              />
            </div>
          </div>
          
          <!-- Ремесло -->
          <div class="form-group">
            <label for="charCraft">РЕМЕСЛО</label>
            <input 
              id="charCraft"
              v-model="form.craft"
              type="text"
              placeholder="Введите ремёсла через запятую"
              maxlength="100"
            />
          </div>
          
          <!-- Народ -->
          <div class="form-group">
            <label>НАРОД</label>
            <div class="race-selector">
              <button
                v-for="(race, key) in charactersStore.races"
                :key="key"
                type="button"
                class="race-btn"
                :class="{ selected: form.race === key }"
                @click="form.race = key"
              >
                {{ race.name }}
              </button>
            </div>
            
            <!-- Способность народа -->
            <div v-if="form.race" class="race-ability">
              <Tooltip :content="selectedRace.description" position="bottom">
                <div class="ability-tag">
                  <span class="ability-icon">✨</span>
                  {{ selectedRace.ability }}
                  <span class="tooltip-hint">(?)</span>
                </div>
              </Tooltip>
              <!--<div class="ability-description" v-html="selectedRace.description"></div>-->
            </div>
          </div>
        </div>

        <!-- Характеристики -->
        <div class="form-section">
          <h3>Характеристики</h3>
          
          <div class="stats-grid">
            <!-- СТК -->
            <div class="stat-block">
              <div class="stat-header">
                <label for="statStk">СТК</label>
                <span class="stat-name">Стойкость</span>
              </div>
              <select id="statStk" v-model.number="form.stats.stk">
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              
              <!-- Способности СТК -->
              <div v-if="form.stats.stk >= 5" class="stat-abilities">
                <Tooltip :content="charactersStore.statAbilities.stk[5].description" position="bottom">
                  <div class="ability-tag small">
                    ⚔️ {{ charactersStore.statAbilities.stk[5].name }}
                  </div>
                </Tooltip>
                <Tooltip v-if="form.stats.stk >= 10" :content="charactersStore.statAbilities.stk[10].description" position="bottom">
                  <div class="ability-tag small">
                    💪 {{ charactersStore.statAbilities.stk[10].name }}
                  </div>
                </Tooltip>
              </div>
            </div>
            
            <!-- ЛВК -->
            <div class="stat-block">
              <div class="stat-header">
                <label for="statLvk">ЛВК</label>
                <span class="stat-name">Ловкость</span>
              </div>
              <select id="statLvk" v-model.number="form.stats.lvk">
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              
              <!-- Способности ЛВК -->
              <div v-if="form.stats.lvk >= 5" class="stat-abilities">
                <Tooltip :content="charactersStore.statAbilities.lvk[5].description" position="bottom">
                  <div class="ability-tag small">
                    🎯 {{ charactersStore.statAbilities.lvk[5].name }}
                  </div>
                </Tooltip>
                <Tooltip v-if="form.stats.lvk >= 10" :content="charactersStore.statAbilities.lvk[10].description" position="bottom">
                  <div class="ability-tag small">
                    🗡️ {{ charactersStore.statAbilities.lvk[10].name }}
                  </div>
                </Tooltip>
              </div>
            </div>
            
            <!-- РЗМ -->
            <div class="stat-block">
              <div class="stat-header">
                <label for="statRzm">РЗМ</label>
                <span class="stat-name">Разум</span>
              </div>
              <select id="statRzm" v-model.number="form.stats.rzm">
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              
              <!-- Способности РЗМ -->
              <div v-if="form.stats.rzm >= 5" class="stat-abilities">
                <Tooltip 
                  v-for="(ability, idx) in charactersStore.statAbilities.rzm[5]" 
                  :key="idx"
                  :content="ability.description" 
                  position="bottom"
                >
                  <div class="ability-tag small">
                    🔮 {{ ability.name }}
                  </div>
                </Tooltip>
                <Tooltip v-if="form.stats.rzm >= 10" :content="charactersStore.statAbilities.rzm[10].description" position="bottom">
                  <div class="ability-tag small">
                    📚 {{ charactersStore.statAbilities.rzm[10].name }}
                  </div>
                </Tooltip>
              </div>
            </div>
            
            <!-- ХАР -->
            <div class="stat-block">
              <div class="stat-header">
                <label for="statHar">ХАР</label>
                <span class="stat-name">Харизма</span>
              </div>
              <select id="statHar" v-model.number="form.stats.har">
                <option v-for="n in 11" :key="n-1" :value="n-1">{{ n-1 }}</option>
              </select>
              
              <!-- Способности ХАР -->
              <div v-if="form.stats.har >= 5" class="stat-abilities">
                <Tooltip :content="charactersStore.statAbilities.har[5].description" position="bottom">
                  <div class="ability-tag small">
                    👑 {{ charactersStore.statAbilities.har[5].name }}
                  </div>
                </Tooltip>
                <Tooltip v-if="form.stats.har >= 10" :content="charactersStore.statAbilities.har[10].description" position="bottom">
                  <div class="ability-tag small">
                    🎖️ {{ charactersStore.statAbilities.har[10].name }}
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        <!-- Боевые параметры -->
        <div class="form-section">
          <h3>Боевые параметры</h3>
          
          <div class="combat-grid">
            <!-- КД и ЧД -->
            <div class="combat-row">
              <div class="form-group">
                <label for="armorClass">КД</label>
                <input 
                  id="armorClass" 
                  v-model.number="form.armorClass" 
                  type="number" 
                  min="0"
                  placeholder="11"
                />
                <span class="calc-hint">базовое: 11 + ЧД</span>
              </div>
              <div class="form-group">
                <label for="armorParts">ЧД</label>
                <select id="armorParts" v-model.number="form.armorParts">
                  <option v-for="n in 8" :key="n-1" :value="n-1">{{ n-1 }}</option>
                </select>
              </div>
            </div>
            
            <!-- СКР -->
            <div class="combat-row">
              <div class="form-group">
                <label for="maxSpeed">макс СКР</label>
                <input id="maxSpeed" v-model="form.maxSpeed" type="text" placeholder="30'" />
              </div>
              <div class="form-group">
                <label for="currentSpeed">СКР</label>
                <input id="currentSpeed" v-model="form.currentSpeed" type="text" placeholder="30'" />
              </div>
            </div>
            
            <!-- ОЗ -->
            <div class="combat-row">
              <div class="form-group">
                <label for="maxHp">макс ОЗ</label>
                <input id="maxHp" v-model="form.maxHp" type="text" placeholder="10" />
              </div>
              <div class="form-group">
                <label for="currentHp">ОЗ</label>
                <input id="currentHp" v-model="form.currentHp" type="text" placeholder="10" />
              </div>
            </div>
            
            <!-- Раны -->
            <div class="combat-row">
              <div class="form-group">
                <label>макс РАН</label>
                <div class="calculated-value">{{ maxWounds }}</div>
                <span class="calc-hint">зависит от УР</span>
              </div>
              <div class="form-group">
                <label for="currentWounds">РАНЫ</label>
                <input id="currentWounds" v-model="form.currentWounds" type="text" placeholder="0" />
              </div>
            </div>
          </div>
        </div>

        <!-- Мировоззрение и причуды -->
        <div class="form-section">
          <h3>Личность</h3>
          
          <div class="form-group">
            <label>МИРОВОЗЗРЕНИЕ</label>
            <div class="worldview-selector">
              <button
                type="button"
                class="worldview-btn"
                :class="{ selected: form.worldview === 'order' }"
                @click="form.worldview = 'order'"
              >
                ⚖️ Порядок
              </button>
              <button
                type="button"
                class="worldview-btn"
                :class="{ selected: form.worldview === 'balance' }"
                @click="form.worldview = 'balance'"
              >
                ☯️ Баланс
              </button>
              <button
                type="button"
                class="worldview-btn"
                :class="{ selected: form.worldview === 'chaos' }"
                @click="form.worldview = 'chaos'"
              >
                🌀 Хаос
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="quirks">ПРИЧУДЫ</label>
            <input 
              id="quirks" 
              v-model="form.quirks" 
              type="text" 
              placeholder="Особенности поведения персонажа..."
            />
          </div>
          
          <div class="form-group">
            <label for="traits">ЧЕРТЫ</label>
            <textarea 
              id="traits" 
              v-model="form.traits" 
              placeholder="Внешность, характер, история..."
              rows="5"
            ></textarea>
          </div>
        </div>

        <!-- Инвентарь -->
        <div class="form-section">
          <h3>Инвентарь</h3>
          
          <div class="inventory-grid">
            <div class="inventory-column">
              <div v-for="i in 10" :key="i" class="inventory-slot">
                <span class="slot-number">{{ i }}</span>
                <input 
                  v-model="form.inventory[i-1]" 
                  type="text" 
                  :placeholder="'Предмет ' + i"
                  :title="form.inventory[i-1]"
                />
              </div>
            </div>
            <div class="inventory-column">
              <div v-for="i in 10" :key="i+10" class="inventory-slot" :class="{ 'speed-penalty': i === 1 || i === 6 }">
                <span class="slot-number">{{ i + 10 }}</span>
                <input 
                  v-model="form.inventory[i+9]" 
                  type="text" 
                  :placeholder="'Предмет ' + (i + 10)"
                  :title="form.inventory[i+9]"
                />
                <span v-if="i === 1" class="speed-hint">СКР -5'</span>
                <span v-else-if="i === 6" class="speed-hint">СКР -10'</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Заметки -->
        <div class="form-section">
          <h3>Заметки</h3>
          <div class="form-group">
            <textarea 
              id="notes" 
              v-model="form.notes" 
              placeholder="Дополнительные записи, планы, идеи..."
              rows="6"
            ></textarea>
          </div>
        </div>
        
        <!-- Ошибка -->
        <div v-if="error" class="error-message">{{ error }}</div>
        
        <!-- Кнопки -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">
            Отмена
          </button>
          <button type="submit" class="btn-create" :disabled="isLoading || !isValid">
            {{ isLoading ? 'Создание...' : 'Создать персонажа' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCharactersStore } from '@/stores/characters'
import { useAuthStore } from '@/stores/auth'
import Tooltip from '@/components/ui/Tooltip.vue'

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

// Форма
const form = ref({
  name: '',
  level: 1,
  experience: '',
  craft: '',
  race: null,
  stats: {
    stk: 0,
    lvk: 0,
    rzm: 0,
    har: 0
  },
  // Новые поля
  armorClass: 11,       // КД (класс доспеха)
  armorParts: 0,        // ЧД (части доспеха)
  maxSpeed: '',         // макс СКР
  currentSpeed: '',     // СКР
  maxHp: '',            // макс ОЗ
  currentHp: '',        // ОЗ
  currentWounds: '',    // Раны
  worldview: null,      // Мировоззрение
  quirks: '',           // Причуды
  traits: '',           // Черты
  inventory: Array(20).fill(''), // Инвентарь 1-20
  notes: ''             // Заметки
})

// Автоматически пересчитываем КД при изменении ЧД (но можно изменить вручную)
import { watch } from 'vue'

watch(() => form.value.armorParts, (newVal) => {
  form.value.armorClass = 11 + newVal
})

// Макс РАН в зависимости от уровня
const maxWounds = computed(() => {
  const lvl = form.value.level
  if (lvl === 1) return 5
  if (lvl <= 3) return 6
  if (lvl <= 5) return 7
  if (lvl <= 7) return 8
  if (lvl <= 9) return 9
  return 10 // уровень 10
})

// Выбранный народ
const selectedRace = computed(() => {
  if (!form.value.race) return null
  return charactersStore.races[form.value.race]
})

// Валидация
const isValid = computed(() => {
  return form.value.name.trim() && form.value.race
})

// Создание персонажа
async function handleCreate() {
  if (!isValid.value) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const character = await charactersStore.createCharacter(
      props.campaignId,
      {
        name: form.value.name.trim(),
        level: form.value.level,
        experience: form.value.experience,
        craft: form.value.craft.trim(),
        race: form.value.race,
        stats: { ...form.value.stats },
        // Боевые параметры
        armorParts: form.value.armorParts,
        armorClass: form.value.armorClass,
        maxSpeed: form.value.maxSpeed,
        currentSpeed: form.value.currentSpeed,
        maxHp: form.value.maxHp,
        currentHp: form.value.currentHp,
        maxWounds: maxWounds.value,
        currentWounds: form.value.currentWounds,
        // Личность
        worldview: form.value.worldview,
        quirks: form.value.quirks,
        traits: form.value.traits,
        // Инвентарь и заметки
        inventory: [...form.value.inventory],
        notes: form.value.notes
      },
      authStore.user.uid
    )
    
    emit('created', character)
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
  max-width: 700px;
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
  padding: 0.25rem;
  line-height: 1;
}

.close-btn:hover {
  color: #ef4444;
}

h2 {
  color: #e8d5b7;
  font-family: 'Prata', serif;
  margin: 0 0 1.5rem 0;
  font-size: 1.5rem;
  text-align: center;
}

.character-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 1rem;
}

.form-section h3 {
  color: #c4cad6;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .flex-2 {
  flex: 2;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.form-group label {
  color: #8892a8;
  font-size: 0.85rem;
  font-weight: 500;
  margin-top: 10px;
}

.form-group input,
.form-group select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  color: #e4e4e7;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

.form-group select {
  cursor: pointer;
}

/* Выбор народа */
.race-selector {
  display: flex;
  gap: 0.5rem;
}

.race-btn {
  flex: 1;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #c4cad6;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.race-btn:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(232, 213, 183, 0.3);
}

.race-btn.selected {
  background: rgba(232, 213, 183, 0.15);
  border-color: #e8d5b7;
  color: #e8d5b7;
}

/* Способность народа */
.race-ability {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(232, 213, 183, 0.08);
  border-radius: 8px;
  border-left: 3px solid #e8d5b7;
}

.ability-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #e8d5b7;
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.ability-icon {
  font-size: 1rem;
}

.tooltip-hint {
  color: #8892a8;
  font-size: 0.75rem;
  cursor: help;
}

.ability-description {
  color: #a0a8b8;
  font-size: 0.8rem;
  line-height: 1.5;
}

/* Характеристики */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-block {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 0.75rem;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stat-header label {
  background: linear-gradient(135deg, #3a3a4a, #2a2a3a);
  color: #e8d5b7;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.85rem;
}

.stat-name {
  color: #8892a8;
  font-size: 0.8rem;
}

.stat-block select {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.5rem;
  color: #e4e4e7;
  font-size: 1rem;
  cursor: pointer;
}

.stat-block select:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

/* Способности характеристик */
.stat-abilities {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.ability-tag.small {
  font-size: 0.75rem;
  padding: 0.3rem 0.5rem;
  background: rgba(232, 213, 183, 0.1);
  border-radius: 4px;
  cursor: help;
  margin-bottom: 0;
}

.ability-tag.small:hover {
  background: rgba(232, 213, 183, 0.2);
}

/* Ошибка */
.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  padding: 0.75rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* Кнопки */
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
  border-color: rgba(255, 255, 255, 0.3);
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

/* Боевые параметры */
.combat-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.combat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.calculated-value {
  background: linear-gradient(135deg, #3a3a4a, #2a2a3a);
  border: 1px solid rgba(232, 213, 183, 0.3);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  color: #e8d5b7;
  font-size: 1.1rem;
  font-weight: bold;
  text-align: center;
}

.calc-hint {
  color: #8892a8;
  font-size: 0.7rem;
  text-align: center;
  display: block;
  margin-top: 0.25rem;
}

/* Мировоззрение */
.worldview-selector {
  display: flex;
  gap: 0.5rem;
}

.worldview-btn {
  flex: 1;
  padding: 0.75rem 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #c4cad6;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.worldview-btn:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(232, 213, 183, 0.3);
}

.worldview-btn.selected {
  background: rgba(232, 213, 183, 0.15);
  border-color: #e8d5b7;
  color: #e8d5b7;
}

/* Текстовые поля */
.form-group textarea {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 0.6rem 0.75rem;
  color: #e4e4e7;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
}

.form-group textarea:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

/* Инвентарь */
.inventory-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.inventory-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.inventory-slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.inventory-slot .slot-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  color: #8892a8;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
}

.inventory-slot input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  color: #e4e4e7;
  font-size: 0.85rem;
}

.inventory-slot input:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.5);
}

.inventory-slot.speed-penalty .slot-number {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.speed-hint {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  color: #f87171;
  font-size: 0.65rem;
  font-weight: 500;
  background: rgba(239, 68, 68, 0.15);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  pointer-events: none;
}

/* Адаптивность */
@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .race-selector,
  .worldview-selector {
    flex-direction: column;
  }
  
  .combat-row {
    grid-template-columns: 1fr;
  }
  
  .inventory-grid {
    grid-template-columns: 1fr;
  }
}
</style>

