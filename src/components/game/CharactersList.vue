<template>
  <div class="characters-panel" :class="{ open: isOpen }">
    <div class="panel-header">
      <h3>{{ title }}</h3>
      <button class="close-panel-btn" @click="$emit('close')">✕</button>
    </div>
    
    <div class="characters-list">
      <div v-if="characters.length === 0" class="empty-state">
        <span class="empty-icon">📜</span>
        <p>{{ emptyMessage }}</p>
      </div>
      
      <button
        v-for="char in characters"
        :key="char.id"
        class="character-item"
        @click="selectCharacter(char)"
      >
        <span class="char-icon">{{ getRaceIcon(char.race) }}</span>
        <div class="char-info">
          <span class="char-name">{{ char.name }}</span>
          <span class="char-details">
            {{ charactersStore.races[char.race]?.name }} • УР {{ char.level }}
          </span>
        </div>
        <span class="char-arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useCharactersStore } from '@/stores/characters'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  characters: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: 'Персонажи'
  },
  emptyMessage: {
    type: String,
    default: 'Нет персонажей'
  }
})

const emit = defineEmits(['close', 'select'])

const charactersStore = useCharactersStore()

function getRaceIcon(race) {
  const icons = {
    human: '🧔',
    gmur: '⛏️',
    div: '🧝'
  }
  return icons[race] || '👤'
}

function selectCharacter(char) {
  emit('select', char)
}
</script>

<style scoped>
.characters-panel {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100vh;
  background: linear-gradient(145deg, #1e1e2e, #252535);
  border-right: 1px solid rgba(232, 213, 183, 0.2);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 900;
  display: flex;
  flex-direction: column;
}

.characters-panel.open {
  transform: translateX(0);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.panel-header h3 {
  color: #e8d5b7;
  font-family: 'Prata', serif;
  margin: 0;
  font-size: 1.1rem;
}

.close-panel-btn {
  background: none;
  border: none;
  color: #8892a8;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

.close-panel-btn:hover {
  color: #ef4444;
}

.characters-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state p {
  color: #8892a8;
  margin: 0;
}

.character-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  text-align: left;
}

.character-item:hover {
  background: rgba(232, 213, 183, 0.1);
  border-color: rgba(232, 213, 183, 0.2);
}

.char-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.char-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.char-name {
  color: #e4e4e7;
  font-weight: 500;
  font-size: 0.95rem;
}

.char-details {
  color: #8892a8;
  font-size: 0.75rem;
}

.char-arrow {
  color: #8892a8;
  font-size: 1rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.character-item:hover .char-arrow {
  opacity: 1;
  color: #e8d5b7;
}

@media (max-width: 400px) {
  .characters-panel {
    width: 100%;
  }
}
</style>


