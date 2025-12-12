<script setup>
import { ref, watch, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  campaignId: {
    type: String,
    required: true
  }
})

const chatStore = useChatStore()
const userStore = useUserStore()

const messageInput = ref('')
const chatContainer = ref(null)
const showDicePanel = ref(false)

// Кнопки быстрых бросков
const quickDice = ['1d2', '1d4', '1d6', '1d8', '1d10', '1d12', '1d20', '1d100']

// Автоскролл при новых сообщениях
watch(() => chatStore.messages.length, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
})

// Бросок кубика
function rollDice(count, sides) {
  const rolls = []
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1)
  }
  const total = rolls.reduce((sum, r) => sum + r, 0)
  return { rolls, total }
}

// Парсинг нотации кубиков (например "2d6" или "1d20")
function parseDiceNotation(notation) {
  const match = notation.toLowerCase().match(/^(\d+)d(\d+)$/)
  if (!match) return null
  
  const count = parseInt(match[1])
  const sides = parseInt(match[2])
  
  // Ограничения
  if (count < 1 || count > 100) return null
  if (![2, 4, 6, 8, 10, 12, 20, 100].includes(sides)) return null
  
  return { count, sides }
}

// Быстрый бросок по кнопке
async function quickRoll(notation) {
  const parsed = parseDiceNotation(notation)
  if (!parsed) return
  
  const { rolls, total } = rollDice(parsed.count, parsed.sides)
  const details = rolls.length > 1 ? `[${rolls.join(' + ')}]` : ''
  
  await chatStore.sendDiceRoll(
    props.campaignId,
    notation,
    total,
    details
  )
}

async function sendMessage() {
  if (!messageInput.value.trim()) return
  
  const text = messageInput.value.trim()
  
  // Проверяем команду /roll
  if (text.toLowerCase().startsWith('/roll ')) {
    const notation = text.substring(6).trim()
    const parsed = parseDiceNotation(notation)
    
    if (parsed) {
      const { rolls, total } = rollDice(parsed.count, parsed.sides)
      const details = rolls.length > 1 ? `[${rolls.join(' + ')}]` : ''
      
      await chatStore.sendDiceRoll(
        props.campaignId,
        notation,
        total,
        details
      )
    } else {
      // Неверный формат - отправляем как обычное сообщение с подсказкой
      await chatStore.sendMessage(props.campaignId, `❌ Неверный формат. Используй: /roll XdY (например /roll 2d6)`)
    }
    
    messageInput.value = ''
    return
  }
  
  await chatStore.sendMessage(props.campaignId, text)
  messageInput.value = ''
}

async function handleClearChat() {
  if (!confirm('Очистить весь чат?')) return
  await chatStore.clearChat(props.campaignId)
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function getMessageClass(message) {
  return {
    'message-roll': message.type === 'roll',
    'message-system': message.type === 'system',
    'message-own': message.userId === userStore.profile?.id
  }
}
</script>

<template>
  <div class="game-chat">
    <div class="chat-header">
      <h3>💬 Чат</h3>
      <button 
        v-if="userStore.isGM" 
        class="btn-clear" 
        @click="handleClearChat"
        title="Очистить чат"
      >
        🧹
      </button>
    </div>
    
    <div class="chat-messages" ref="chatContainer">
      <div v-if="chatStore.loading" class="chat-loading">
        Загрузка...
      </div>
      
      <div v-else-if="chatStore.messages.length === 0" class="chat-empty">
        <span>Пока нет сообщений</span>
      </div>
      
      <div 
        v-else
        v-for="message in chatStore.messages" 
        :key="message.id"
        class="chat-message"
        :class="getMessageClass(message)"
      >
        <div class="message-header">
          <span class="message-author" :class="{ 'author-gm': message.userRole === 'gm' }">
            {{ message.userName }}
          </span>
          <span class="message-time">{{ formatTime(message.createdAt) }}</span>
        </div>
        
        <!-- Бросок кубика -->
        <div v-if="message.type === 'roll'" class="roll-result">
          <span class="roll-dice">🎲 {{ message.diceNotation }}</span>
          <span class="roll-equals">=</span>
          <span class="roll-total">{{ message.result }}</span>
          <span v-if="message.details" class="roll-details">{{ message.details }}</span>
        </div>
        
        <!-- Обычное сообщение -->
        <div v-else class="message-text">{{ message.text }}</div>
      </div>
    </div>
    
    <!-- Панель кубиков -->
    <div class="dice-panel" :class="{ open: showDicePanel }">
      <div class="dice-grid">
        <button 
          v-for="dice in quickDice" 
          :key="dice"
          class="dice-btn"
          @click="quickRoll(dice)"
          :title="'Бросить ' + dice"
        >
          🎲 {{ dice }}
        </button>
      </div>
      <div class="dice-hint">
        Или напиши <code>/roll 2d6</code> в чате
      </div>
    </div>
    
    <form class="chat-input" @submit.prevent="sendMessage">
      <button 
        type="button" 
        class="btn-dice-toggle"
        :class="{ active: showDicePanel }"
        @click="showDicePanel = !showDicePanel"
        title="Бросить кубики"
      >
        🎲
      </button>
      <input 
        v-model="messageInput"
        type="text"
        placeholder="Сообщение или /roll 2d6..."
        maxlength="500"
      />
      <button type="submit" :disabled="!messageInput.trim()">
        ➤
      </button>
    </form>
  </div>
</template>

<style scoped>
.game-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-header h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #e8d5b7;
  font-weight: 500;
}

.btn-clear {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  padding: 0.25rem;
}

.btn-clear:hover {
  opacity: 1;
  transform: scale(1.1);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}

.chat-messages::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.chat-loading,
.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8892a8;
  font-size: 0.85rem;
}

.chat-message {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}

.chat-message.message-roll {
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.2);
}

.chat-message.message-system {
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.2);
  text-align: center;
  font-style: italic;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.message-author {
  font-size: 0.75rem;
  font-weight: 600;
  color: #a78bfa;
}

.message-author.author-gm {
  color: #fbbf24;
}

.message-time {
  font-size: 0.7rem;
  color: #5a6275;
}

.message-text {
  font-size: 0.85rem;
  color: #e4e4e7;
  word-wrap: break-word;
}

.chat-input {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.chat-input input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
}

.chat-input input::placeholder {
  color: #5a6275;
}

.chat-input input:focus {
  outline: none;
  border-color: rgba(232, 213, 183, 0.4);
}

.chat-input button {
  padding: 0.5rem 0.75rem;
  background: linear-gradient(135deg, #c9a959 0%, #a68a3a 100%);
  color: #1a1a2e;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.chat-input button:hover:not(:disabled) {
  transform: scale(1.05);
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Кнопка переключения панели кубиков */
.btn-dice-toggle {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-dice-toggle:hover,
.btn-dice-toggle.active {
  background: rgba(234, 179, 8, 0.2);
  border-color: rgba(234, 179, 8, 0.3);
}

/* Панель кубиков */
.dice-panel {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.dice-panel.open {
  max-height: 150px;
  padding: 0.75rem;
}

.dice-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}

.dice-btn {
  padding: 0.4rem 0.3rem;
  background: rgba(234, 179, 8, 0.15);
  border: 1px solid rgba(234, 179, 8, 0.25);
  border-radius: 6px;
  color: #fbbf24;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.dice-btn:hover {
  background: rgba(234, 179, 8, 0.25);
  border-color: rgba(234, 179, 8, 0.4);
  transform: scale(1.05);
}

.dice-btn:active {
  transform: scale(0.95);
}

.dice-hint {
  text-align: center;
  color: #8892a8;
  font-size: 0.7rem;
}

.dice-hint code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  color: #e8d5b7;
}

/* Результат броска */
.roll-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.roll-dice {
  font-weight: 600;
  color: #fbbf24;
}

.roll-equals {
  color: #8892a8;
}

.roll-total {
  font-size: 1.25rem;
  font-weight: bold;
  color: #fff;
  background: rgba(234, 179, 8, 0.3);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  min-width: 28px;
  text-align: center;
}

.roll-details {
  color: #8892a8;
  font-size: 0.75rem;
}
</style>

