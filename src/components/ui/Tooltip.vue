<template>
  <div 
    class="tooltip-wrapper" 
    ref="wrapperRef"
    @mouseenter="onShow" 
    @mouseleave="show = false"
    @touchstart.passive="onShow"
  >
    <slot></slot>
    <Teleport to="body">
      <Transition name="tooltip-fade">
        <div 
          v-if="show" 
          class="tooltip-content"
          :style="tooltipStyle"
          v-html="content"
        ></div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
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
const wrapperRef = ref(null)
const rect = ref({ top: 0, left: 0, width: 0, height: 0 })

function onShow() {
  if (wrapperRef.value) {
    rect.value = wrapperRef.value.getBoundingClientRect()
  }
  show.value = true
}

const tooltipStyle = computed(() => {
  const r = rect.value
  const gap = 8

  if (props.position === 'bottom') {
    return {
      top: `${r.bottom + gap}px`,
      left: `${r.left + r.width / 2}px`,
      transform: 'translateX(-50%)'
    }
  }
  if (props.position === 'left') {
    return {
      top: `${r.top + r.height / 2}px`,
      right: `${window.innerWidth - r.left + gap}px`,
      transform: 'translateY(-50%)'
    }
  }
  if (props.position === 'right') {
    return {
      top: `${r.top + r.height / 2}px`,
      left: `${r.right + gap}px`,
      transform: 'translateY(-50%)'
    }
  }
  // top (default)
  return {
    bottom: `${window.innerHeight - r.top + gap}px`,
    left: `${r.left + r.width / 2}px`,
    transform: 'translateX(-50%)'
  }
})
</script>

<style scoped>
.tooltip-wrapper {
  position: relative;
  display: inline-flex;
}
</style>

<style>
.tooltip-content {
  position: fixed;
  z-index: 99999;
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

.tooltip-content b,
.tooltip-content strong {
  color: #a78bfa;
  font-weight: 600;
}

.tooltip-content i,
.tooltip-content em {
  color: #e8d5b7;
  font-style: italic;
}

.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.15s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}
</style>

