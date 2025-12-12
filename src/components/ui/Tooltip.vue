<template>
  <div class="tooltip-wrapper" @mouseenter="show = true" @mouseleave="show = false">
    <slot></slot>
    <Transition name="tooltip-fade">
      <div 
        v-if="show" 
        class="tooltip-content"
        :class="[position]"
        v-html="content"
      ></div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  content: {
    type: String,
    required: true
  },
  position: {
    type: String,
    default: 'top',
    validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v)
  }
})

const show = ref(false)
</script>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-flex;
}

.tooltip-content {
  position: absolute;
  z-index: 1000;
  min-width: 200px;
  max-width: 350px;
  padding: 0.75rem 1rem;
  background: linear-gradient(145deg, #2a2a3a, #1e1e2e);
  border: 1px solid rgba(232, 213, 183, 0.3);
  border-radius: 8px;
  color: #e4e4e7;
  font-size: 0.8rem;
  line-height: 1.5;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  pointer-events: none;
}

/* Позиции */
.tooltip-content.top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-content.bottom {
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}

.tooltip-content.left {
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

.tooltip-content.right {
  left: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
}

/* Стрелки */
.tooltip-content::before {
  content: '';
  position: absolute;
  border: 6px solid transparent;
}

.tooltip-content.top::before {
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-top-color: rgba(232, 213, 183, 0.3);
}

.tooltip-content.bottom::before {
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  border-bottom-color: rgba(232, 213, 183, 0.3);
}

/* Стили для HTML внутри tooltip */
.tooltip-content :deep(b),
.tooltip-content :deep(strong) {
  color: #a78bfa;
  font-weight: 600;
}

.tooltip-content :deep(i),
.tooltip-content :deep(em) {
  color: #e8d5b7;
  font-style: italic;
}

/* Анимация */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

.tooltip-content.bottom.tooltip-fade-enter-from,
.tooltip-content.bottom.tooltip-fade-leave-to {
  transform: translateX(-50%) translateY(-4px);
}
</style>

