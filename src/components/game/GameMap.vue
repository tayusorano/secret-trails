<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useDrawingsStore } from '@/stores/drawings'
import { useTokensStore } from '@/stores/tokens'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  mapType: {
    type: String,
    default: 'global'
  },
  campaignId: {
    type: String,
    required: true
  }
})

const drawingsStore = useDrawingsStore()
const tokensStore = useTokensStore()
const userStore = useUserStore()

const isGlobal = computed(() => props.mapType === 'global')

// Токены для текущего типа карты
const currentTokens = computed(() => {
  return tokensStore.tokens.filter(t => t.mapType === props.mapType)
})

// Размер сетки
const GRID_SIZE_GLOBAL = 50  // Глобальная карта 50x50 гексов
const GRID_SIZE_LOCAL = 100  // Местность 100x100 квадратов
const HEX_SIZE = 40
const SQUARE_SIZE = 50

// Ориентация гексов: 'flat' (плоская вершина) или 'pointy' (острая вершина)
const hexOrientation = ref('flat')

// Размер сетки в зависимости от типа карты
const gridSize = computed(() => isGlobal.value ? GRID_SIZE_GLOBAL : GRID_SIZE_LOCAL)

// === РЕЖИМЫ ===
// 'pan' - перемещение карты
// 'token' - перемещение токенов
// 'draw' - рисование
const mode = ref('pan')

// Инструменты рисования
// 'pen' - кисть
// 'text' - текст
// 'eraser' - ластик
// 'fill' - заливка гекса
const drawTool = ref('pen')
const penColor = ref('#000000')
const penSize = ref(3)
const fontSize = ref(16)

// === PAN & ZOOM ===
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)

const MIN_ZOOM = 0.2
const MAX_ZOOM = 3

// === ТОКЕНЫ ===
const draggingToken = ref(null)
const tokenStartX = ref(0)
const tokenStartY = ref(0)
const tokenOffsetX = ref(0)
const tokenOffsetY = ref(0)

// === РИСОВАНИЕ ===
const isDrawing = ref(false)
const currentPath = ref([])
const drawingCanvas = ref(null)
const drawingCtx = ref(null)

// Refs
const mapContainer = ref(null)
const mapWrapper = ref(null)

// Вычисляем размеры карты
const mapWidth = computed(() => {
  if (isGlobal.value) {
    if (hexOrientation.value === 'flat') {
      return HEX_SIZE * 1.5 * GRID_SIZE_GLOBAL + HEX_SIZE * 2
    } else {
      return HEX_SIZE * 1.732 * GRID_SIZE_GLOBAL + HEX_SIZE
    }
  } else {
    return SQUARE_SIZE * GRID_SIZE_LOCAL
  }
})

const mapHeight = computed(() => {
  if (isGlobal.value) {
    if (hexOrientation.value === 'flat') {
      return HEX_SIZE * 1.732 * GRID_SIZE_GLOBAL + HEX_SIZE * 1.732
    } else {
      return HEX_SIZE * 1.5 * GRID_SIZE_GLOBAL + HEX_SIZE
    }
  } else {
    return SQUARE_SIZE * GRID_SIZE_LOCAL
  }
})

// Генерируем ячейки
const cells = computed(() => {
  const result = []
  const size = gridSize.value
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      result.push({ row, col, id: `${row}-${col}` })
    }
  }
  return result
})

function getHexPosition(row, col) {
  if (hexOrientation.value === 'flat') {
    const horizontalSpacing = HEX_SIZE * 1.5
    const hexHeight = HEX_SIZE * 1.732
    const x = col * horizontalSpacing + HEX_SIZE
    const y = row * hexHeight + (col % 2 === 1 ? hexHeight / 2 : 0) + HEX_SIZE
    return { x, y }
  } else {
    const hexWidth = HEX_SIZE * 1.732
    const verticalSpacing = HEX_SIZE * 1.5
    const x = col * hexWidth + (row % 2 === 1 ? hexWidth / 2 : 0) + HEX_SIZE
    const y = row * verticalSpacing + HEX_SIZE
    return { x, y }
  }
}

function getSquarePosition(row, col) {
  return { x: col * SQUARE_SIZE, y: row * SQUARE_SIZE }
}

function getHexPath() {
  const size = HEX_SIZE
  if (hexOrientation.value === 'flat') {
    const h = size * 1.732 / 2
    return `M ${size} 0 L ${size / 2} ${h} L ${-size / 2} ${h} L ${-size} 0 L ${-size / 2} ${-h} L ${size / 2} ${-h} Z`
  } else {
    const w = size * 1.732 / 2
    const h = size / 2
    return `M 0 ${-size} L ${w} ${-h} L ${w} ${h} L 0 ${size} L ${-w} ${h} L ${-w} ${-h} Z`
  }
}

function toggleHexOrientation() {
  hexOrientation.value = hexOrientation.value === 'flat' ? 'pointy' : 'flat'
}

// Заливки гексов — вычисляем карту id→цвет из сохранённых данных
const hexFillColors = computed(() => {
  const fills = {}
  const currentMapType = props.mapType
  drawingsStore.drawings
    .filter(d => d.type === 'hexfill' && (d.mapType === currentMapType || !d.mapType))
    .sort((a, b) => getTimestamp(a) - getTimestamp(b))
    .forEach(d => {
      fills[`${d.row}-${d.col}`] = d.color
    })
  return fills
})

async function fillHex(cell) {
  if (mode.value !== 'draw' || drawTool.value !== 'fill' || !isGlobal.value) return
  
  await drawingsStore.saveDrawing(props.campaignId, {
    type: 'hexfill',
    row: cell.row,
    col: cell.col,
    color: penColor.value,
    mapType: props.mapType
  })
}

const mapTransform = computed(() => {
  return `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`
})

// === EVENT HANDLERS ===

function onMouseDown(e) {
  if (e.button !== 0) return
  
  if (mode.value === 'pan') {
    isDragging.value = true
    startX.value = e.clientX - translateX.value
    startY.value = e.clientY - translateY.value
    mapContainer.value.style.cursor = 'grabbing'
  } else if (mode.value === 'draw' && drawTool.value !== 'fill') {
    startDrawing(e)
  }
}

function onMouseMove(e) {
  if (mode.value === 'pan' && isDragging.value) {
    translateX.value = e.clientX - startX.value
    translateY.value = e.clientY - startY.value
  } else if (mode.value === 'draw' && isDrawing.value) {
    draw(e)
  } else if (mode.value === 'token' && draggingToken.value) {
    // Перетаскивание токена
    const rect = mapContainer.value.getBoundingClientRect()
    const x = (e.clientX - rect.left - translateX.value) / scale.value - tokenOffsetX.value
    const y = (e.clientY - rect.top - translateY.value) / scale.value - tokenOffsetY.value
    
    // Обновляем позицию локально (визуально)
    const token = currentTokens.value.find(t => t.id === draggingToken.value)
    if (token) {
      token.x = x
      token.y = y
    }
  }
}

function onMouseUp(e) {
  if (mode.value === 'pan') {
    isDragging.value = false
    updateCursor()
  } else if (mode.value === 'draw') {
    stopDrawing(e)
  } else if (mode.value === 'token' && draggingToken.value) {
    // Сохраняем позицию токена в Firebase
    const token = currentTokens.value.find(t => t.id === draggingToken.value)
    if (token) {
      tokensStore.updateTokenPosition(props.campaignId, token.id, token.x, token.y)
    }
    draggingToken.value = null
  }
}

// === ТОКЕНЫ ===

function startTokenDrag(e, token) {
  if (mode.value !== 'token') return
  
  e.stopPropagation()
  
  draggingToken.value = token.id
  
  const rect = mapContainer.value.getBoundingClientRect()
  const mouseX = (e.clientX - rect.left - translateX.value) / scale.value
  const mouseY = (e.clientY - rect.top - translateY.value) / scale.value
  
  tokenOffsetX.value = mouseX - token.x
  tokenOffsetY.value = mouseY - token.y
}

function deleteToken(token) {
  if (!confirm(`Удалить токен "${token.name}"?`)) return
  tokensStore.deleteToken(props.campaignId, token.id)
}

function onWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, scale.value + delta))
  
  if (newScale !== scale.value) {
    const rect = mapContainer.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const scaleChange = newScale / scale.value
    translateX.value = mouseX - (mouseX - translateX.value) * scaleChange
    translateY.value = mouseY - (mouseY - translateY.value) * scaleChange
    scale.value = newScale
  }
}

// === TOUCH EVENTS ===

function onTouchStart(e) {
  if (e.touches.length !== 1) return

  const touch = e.touches[0]

  if (mode.value === 'pan') {
    e.preventDefault()
    isDragging.value = true
    startX.value = touch.clientX - translateX.value
    startY.value = touch.clientY - translateY.value
  } else if (mode.value === 'draw' && drawTool.value !== 'fill') {
    e.preventDefault()
    startDrawing(e)
  }
}

function onTouchMove(e) {
  if (e.touches.length !== 1) return

  const touch = e.touches[0]

  if (mode.value === 'pan' && isDragging.value) {
    e.preventDefault()
    translateX.value = touch.clientX - startX.value
    translateY.value = touch.clientY - startY.value
  } else if (mode.value === 'draw' && isDrawing.value) {
    e.preventDefault()
    draw(e)
  } else if (mode.value === 'token' && draggingToken.value) {
    e.preventDefault()
    const rect = mapContainer.value.getBoundingClientRect()
    const x = (touch.clientX - rect.left - translateX.value) / scale.value - tokenOffsetX.value
    const y = (touch.clientY - rect.top - translateY.value) / scale.value - tokenOffsetY.value

    const token = currentTokens.value.find(t => t.id === draggingToken.value)
    if (token) {
      token.x = x
      token.y = y
    }
  }
}

function onTouchEnd() {
  if (mode.value === 'pan') {
    isDragging.value = false
  } else if (mode.value === 'draw') {
    stopDrawing()
  } else if (mode.value === 'token' && draggingToken.value) {
    const token = currentTokens.value.find(t => t.id === draggingToken.value)
    if (token) {
      tokensStore.updateTokenPosition(props.campaignId, token.id, token.x, token.y)
    }
    draggingToken.value = null
  }
}

function startTokenTouchDrag(e, token) {
  if (mode.value !== 'token') return
  e.stopPropagation()
  e.preventDefault()

  draggingToken.value = token.id
  const touch = e.touches[0]
  const rect = mapContainer.value.getBoundingClientRect()
  const touchX = (touch.clientX - rect.left - translateX.value) / scale.value
  const touchY = (touch.clientY - rect.top - translateY.value) / scale.value

  tokenOffsetX.value = touchX - token.x
  tokenOffsetY.value = touchY - token.y
}

// === РИСОВАНИЕ ===

function getCanvasCoords(e) {
  const rect = drawingCanvas.value.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : (e.changedTouches ? e.changedTouches[0].clientX : e.clientX)
  const clientY = e.touches ? e.touches[0].clientY : (e.changedTouches ? e.changedTouches[0].clientY : e.clientY)
  const x = (clientX - rect.left) / scale.value
  const y = (clientY - rect.top) / scale.value
  return { x, y }
}

function startDrawing(e) {
  if (drawTool.value === 'text') {
    addText(e)
    return
  }
  
  isDrawing.value = true
  const coords = getCanvasCoords(e)
  currentPath.value = [coords]
  
  if (drawingCtx.value) {
    drawingCtx.value.beginPath()
    drawingCtx.value.moveTo(coords.x, coords.y)
    
    if (drawTool.value === 'eraser') {
      // Ластик стирает пиксели (делает прозрачными)
      drawingCtx.value.globalCompositeOperation = 'destination-out'
      drawingCtx.value.strokeStyle = 'rgba(0,0,0,1)'
      drawingCtx.value.lineWidth = penSize.value * 5
    } else {
      drawingCtx.value.globalCompositeOperation = 'source-over'
      drawingCtx.value.strokeStyle = penColor.value
      drawingCtx.value.lineWidth = penSize.value
    }
    
    drawingCtx.value.lineCap = 'round'
    drawingCtx.value.lineJoin = 'round'
  }
}

function draw(e) {
  if (!isDrawing.value || !drawingCtx.value) return
  
  const coords = getCanvasCoords(e)
  currentPath.value.push(coords)
  
  drawingCtx.value.lineTo(coords.x, coords.y)
  drawingCtx.value.stroke()
}

async function stopDrawing() {
  if (!isDrawing.value) return
  isDrawing.value = false
  
  if (currentPath.value.length > 1) {
    // Сохраняем в Firebase с привязкой к типу карты
    await drawingsStore.saveDrawing(props.campaignId, {
      type: drawTool.value === 'eraser' ? 'eraser' : 'pen',
      path: currentPath.value,
      color: drawTool.value === 'eraser' ? '#ffffff' : penColor.value,
      size: drawTool.value === 'eraser' ? penSize.value * 5 : penSize.value,
      mapType: props.mapType // 'global' или 'local'
    })
  }
  
  currentPath.value = []
}

async function addText(e) {
  const text = prompt('Введите текст:')
  if (!text) return
  
  const coords = getCanvasCoords(e)
  
  // Сохраняем в Firebase с привязкой к типу карты
  await drawingsStore.saveText(props.campaignId, {
    text,
    x: coords.x,
    y: coords.y,
    color: penColor.value,
    fontSize: fontSize.value,
    mapType: props.mapType // 'global' или 'local'
  })
}

// Получить timestamp для сортировки
function getTimestamp(item) {
  if (!item.createdAt) return 0
  if (item.createdAt.toMillis) return item.createdAt.toMillis()
  if (item.createdAt.seconds) return item.createdAt.seconds * 1000
  return new Date(item.createdAt).getTime()
}

// Перерисовка всех рисунков из Firebase
function redrawAll() {
  if (!drawingCtx.value) return
  
  // Очищаем canvas
  drawingCtx.value.clearRect(0, 0, mapWidth.value, mapHeight.value)
  
  // Фильтруем по текущему типу карты и объединяем
  const currentMapType = props.mapType
  const allItems = [
    ...drawingsStore.drawings
      .filter(d => d.type !== 'hexfill' && (d.mapType === currentMapType || !d.mapType))
      .map(d => ({ ...d, itemType: 'drawing' })),
    ...drawingsStore.texts
      .filter(t => t.mapType === currentMapType || !t.mapType)
      .map(t => ({ ...t, itemType: 'text' }))
  ].sort((a, b) => getTimestamp(a) - getTimestamp(b))
  
  // Рисуем всё в хронологическом порядке
  allItems.forEach(item => {
    if (item.itemType === 'drawing' && item.path && item.path.length > 1) {
      // Рисуем линию или ластик
      drawingCtx.value.beginPath()
      drawingCtx.value.moveTo(item.path[0].x, item.path[0].y)
      
      for (let i = 1; i < item.path.length; i++) {
        drawingCtx.value.lineTo(item.path[i].x, item.path[i].y)
      }
      
      if (item.type === 'eraser') {
        drawingCtx.value.globalCompositeOperation = 'destination-out'
        drawingCtx.value.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        drawingCtx.value.globalCompositeOperation = 'source-over'
        drawingCtx.value.strokeStyle = item.color || '#000000'
      }
      
      drawingCtx.value.lineWidth = item.size || 3
      drawingCtx.value.lineCap = 'round'
      drawingCtx.value.lineJoin = 'round'
      drawingCtx.value.stroke()
      
    } else if (item.itemType === 'text') {
      // Рисуем текст
      drawingCtx.value.globalCompositeOperation = 'source-over'
      drawingCtx.value.font = `${item.fontSize || 16}px Inter, sans-serif`
      drawingCtx.value.fillStyle = item.color || '#000000'
      drawingCtx.value.fillText(item.text, item.x, item.y)
    }
  })
  
  // Возвращаем нормальный режим
  drawingCtx.value.globalCompositeOperation = 'source-over'
}

// Следим за изменениями рисунков
watch(() => drawingsStore.drawings, redrawAll, { deep: true })
watch(() => drawingsStore.texts, redrawAll, { deep: true })

// === УПРАВЛЕНИЕ ===

function setMode(newMode) {
  mode.value = newMode
  updateCursor()
}

function updateCursor() {
  if (!mapContainer.value) return
  if (mode.value === 'pan') {
    mapContainer.value.style.cursor = 'grab'
  } else if (mode.value === 'draw' && drawTool.value !== 'fill') {
    mapContainer.value.style.cursor = 'crosshair'
  } else {
    mapContainer.value.style.cursor = 'default'
  }
}

function zoomIn() {
  scale.value = Math.min(MAX_ZOOM, scale.value + 0.2)
}

function zoomOut() {
  scale.value = Math.max(MIN_ZOOM, scale.value - 0.2)
}

function resetView() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

async function clearDrawings() {
  const mapName = props.mapType === 'global' ? 'глобальной карты' : 'карты местности'
  if (!confirm(`Очистить все рисунки с ${mapName}?`)) return
  await drawingsStore.clearDrawingsByMapType(props.campaignId, props.mapType)
  redrawAll()
}

// === LIFECYCLE ===

onMounted(() => {
  window.addEventListener('mouseup', onMouseUp)
  window.addEventListener('mousemove', onMouseMove)
  
  // Инициализация canvas
  nextTick(() => {
    if (drawingCanvas.value) {
      drawingCtx.value = drawingCanvas.value.getContext('2d')
      // Подписываемся на рисунки
      drawingsStore.subscribeToDrawings(props.campaignId)
    }
  })
  
  // Подписываемся на токены
  tokensStore.subscribeToTokens(props.campaignId)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', onMouseUp)
  window.removeEventListener('mousemove', onMouseMove)
  drawingsStore.unsubscribeFromDrawings()
  tokensStore.unsubscribeFromTokens()
})

// Обновляем курсор при смене инструмента рисования
watch(drawTool, updateCursor)

// При изменении типа карты - перерисовываем
watch(() => props.mapType, () => {
  nextTick(redrawAll)
})
</script>

<template>
  <div class="game-map-wrapper" ref="mapWrapper">
    <!-- Контейнер карты -->
    <div 
      ref="mapContainer"
      class="map-container"
      @mousedown="onMouseDown"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @wheel="onWheel"
    >
      <!-- Контейнер с трансформацией -->
      <div class="map-transform" :style="{ transform: mapTransform }">
        <!-- SVG сетка -->
        <svg 
          class="map-svg"
          :width="mapWidth"
          :height="mapHeight"
        >
          <template v-if="isGlobal">
            <g 
              v-for="cell in cells" 
              :key="cell.id"
              :transform="`translate(${getHexPosition(cell.row, cell.col).x}, ${getHexPosition(cell.row, cell.col).y})`"
              :class="{ 'hex-fillable': mode === 'draw' && drawTool === 'fill' }"
              @click.stop="fillHex(cell)"
            >
              <path 
                :d="getHexPath()" 
                class="cell-path" 
                :style="hexFillColors[cell.id] ? { fill: hexFillColors[cell.id] } : {}"
              />
            </g>
          </template>
          <template v-else>
            <rect
              v-for="cell in cells"
              :key="cell.id"
              :x="getSquarePosition(cell.row, cell.col).x"
              :y="getSquarePosition(cell.row, cell.col).y"
              :width="SQUARE_SIZE"
              :height="SQUARE_SIZE"
              class="cell-rect"
            />
          </template>
        </svg>
        
        <!-- Canvas для рисования (поверх SVG) -->
        <canvas 
          ref="drawingCanvas"
          class="drawing-canvas"
          :class="{ 'canvas-active': mode === 'draw' && drawTool !== 'fill' }"
          :width="mapWidth"
          :height="mapHeight"
        />
        
        <!-- Токены -->
        <div 
          v-for="token in currentTokens"
          :key="token.id"
          class="map-token"
          :class="{ 
            dragging: draggingToken === token.id,
            draggable: mode === 'token'
          }"
          :style="{
            left: token.x + 'px',
            top: token.y + 'px',
            borderColor: token.borderColor
          }"
          @mousedown="startTokenDrag($event, token)"
          @touchstart="startTokenTouchDrag($event, token)"
        >
          <!-- Кнопка удаления (только в режиме токенов) -->
          <button 
            v-if="mode === 'token'"
            class="token-delete-btn"
            @click.stop="deleteToken(token)"
            title="Удалить токен"
          >
            ✕
          </button>
          <span v-if="token.imageType === 'emoji'" class="token-emoji">{{ token.image }}</span>
          <img v-else :src="token.image" :alt="token.name" class="token-image" />
          <span class="token-name">{{ token.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- Панель режимов -->
    <div class="mode-panel">
      <button 
        :class="{ active: mode === 'pan' }" 
        @click="setMode('pan')"
        title="Перемещение карты"
      >
        ✋
      </button>
      <button 
        :class="{ active: mode === 'token' }" 
        @click="setMode('token')"
        title="Перемещение токенов"
      >
        🎭
      </button>
      <button 
        :class="{ active: mode === 'draw' }" 
        @click="setMode('draw')"
        title="Рисование"
      >
        ✏️
      </button>
    </div>
    
    <!-- Панель инструментов рисования -->
    <div v-if="mode === 'draw'" class="draw-tools">
      <button 
        :class="{ active: drawTool === 'pen' }" 
        @click="drawTool = 'pen'"
        title="Кисть"
      >
        🖊️
      </button>
      <button 
        :class="{ active: drawTool === 'text' }" 
        @click="drawTool = 'text'"
        title="Текст"
      >
        🔤
      </button>
      <button 
        :class="{ active: drawTool === 'eraser' }" 
        @click="drawTool = 'eraser'"
        title="Ластик"
      >
        🧽
      </button>
      <button 
        v-if="isGlobal"
        :class="{ active: drawTool === 'fill' }" 
        @click="drawTool = 'fill'"
        title="Заливка гекса"
      >
        💧
      </button>
      
      <div class="tool-divider"></div>
      
      <!-- Цвет -->
      <input 
        type="color" 
        v-model="penColor" 
        class="color-picker"
        title="Цвет"
      />
      
      <!-- Размер кисти (для pen и eraser) -->
      <div v-if="drawTool === 'pen' || drawTool === 'eraser'" class="size-control">
        <input 
          type="range" 
          v-model="penSize" 
          min="1" 
          max="20" 
          class="size-slider"
          title="Размер кисти"
        />
        <span class="size-value">{{ penSize }}px</span>
      </div>
      
      <!-- Размер шрифта (для text) -->
      <div v-if="drawTool === 'text'" class="size-control">
        <input 
          type="range" 
          v-model="fontSize" 
          min="10" 
          max="72" 
          class="size-slider"
          title="Размер шрифта"
        />
        <span class="size-value">{{ fontSize }}px</span>
      </div>
      
      <div class="tool-divider"></div>
      
      <!-- Очистить (только GM) -->
      <button 
        v-if="userStore.isGM"
        @click="clearDrawings"
        class="clear-btn"
        title="Очистить все"
      >
        🗑️
      </button>
    </div>
    
    <!-- Панель зума -->
    <div class="zoom-controls">
      <button @click="zoomIn" title="Приблизить">+</button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomOut" title="Отдалить">−</button>
      <button @click="resetView" title="Сбросить" class="reset-btn">⌂</button>
    </div>
    
    <!-- Индикатор типа карты -->
    <div class="map-type-indicator">
      {{ isGlobal ? '🌍 Глобальная' : '🗺️ Местность' }}
    </div>
    
    <!-- Переключатель ориентации гексов (только для ГМ на глобальной карте) -->
    <button 
      v-if="isGlobal && userStore.isGM"
      class="hex-orientation-toggle"
      @click="toggleHexOrientation"
      :title="hexOrientation === 'flat' ? 'Плоская вершина → Острая вершина' : 'Острая вершина → Плоская вершина'"
    >
      <svg width="22" height="22" viewBox="-14 -14 28 28">
        <path 
          :d="hexOrientation === 'flat' 
            ? 'M 12 0 L 6 10.4 L -6 10.4 L -12 0 L -6 -10.4 L 6 -10.4 Z' 
            : 'M 0 -12 L 10.4 -6 L 10.4 6 L 0 12 L -10.4 6 L -10.4 -6 Z'"
          fill="rgba(232, 213, 183, 0.15)"
          stroke="currentColor"
          stroke-width="1.5"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.game-map-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  min-width: 0;
  min-height: 0;
}

.map-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  cursor: grab;
  position: relative;
  touch-action: none;
}

.map-transform {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.map-svg {
  display: block;
}

.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.drawing-canvas.canvas-active {
  pointer-events: auto;
}

.cell-path,
.cell-rect {
  fill: #ffffff;
  stroke: #333333;
  stroke-width: 1;
}

.hex-fillable {
  cursor: pointer;
}

.hex-fillable:hover .cell-path {
  stroke: #a78bfa;
  stroke-width: 2.5;
  filter: brightness(0.92);
}

/* Токены */
.map-token {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 7px solid;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  transition: box-shadow 0.2s;
  user-select: none;
}

.map-token.draggable {
  cursor: grab;
}

.map-token.draggable:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.map-token.dragging {
  cursor: grabbing;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.map-token .token-emoji {
  font-size: 1.5rem;
  line-height: 1;
}

.map-token .token-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.map-token .token-name {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  pointer-events: none;
}

/* Кнопка удаления токена */
.token-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  border: 2px solid #fff;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.map-token:hover .token-delete-btn {
  opacity: 1;
}

.token-delete-btn:hover {
  transform: scale(1.15);
  background: #dc2626;
}

/* Панель режимов */
.mode-panel {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 0.25rem;
  background: rgba(26, 26, 46, 0.95);
  padding: 0.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.mode-panel button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-panel button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mode-panel button.active {
  background: rgba(232, 213, 183, 0.2);
  border-color: #e8d5b7;
}

/* Панель инструментов рисования */
.draw-tools {
  position: absolute;
  top: 4.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(26, 26, 46, 0.95);
  padding: 0.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.draw-tools button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.draw-tools button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.draw-tools button.active {
  background: rgba(139, 92, 246, 0.3);
  border-color: #a78bfa;
}

.tool-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 0.25rem;
}

.color-picker {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: none;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 2px;
}

.color-picker::-webkit-color-swatch {
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.size-control {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.size-slider {
  width: 60px;
  height: 36px;
  cursor: pointer;
}

.size-value {
  color: #c4cad6;
  font-size: 0.7rem;
  min-width: 30px;
  text-align: center;
  font-family: monospace;
}

.clear-btn {
  background: rgba(239, 68, 68, 0.2) !important;
}

.clear-btn:hover {
  background: rgba(239, 68, 68, 0.4) !important;
}

/* Панель зума */
.zoom-controls {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(26, 26, 46, 0.9);
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.zoom-controls button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #e4e4e7;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-controls button:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  color: #c4cad6;
  font-size: 0.8rem;
  font-family: monospace;
}

.reset-btn {
  margin-left: 0.25rem;
}

/* Индикатор типа карты */
.map-type-indicator {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(26, 26, 46, 0.9);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: #e8d5b7;
  font-size: 0.85rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Переключатель ориентации гексов */
.hex-orientation-toggle {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(26, 26, 46, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #e8d5b7;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.hex-orientation-toggle:hover {
  background: rgba(26, 26, 46, 1);
  border-color: #e8d5b7;
}
</style>
