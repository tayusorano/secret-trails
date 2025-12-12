import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import { 
  collection, 
  doc,
  addDoc, 
  deleteDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { useAuthStore } from './auth'

export const useDrawingsStore = defineStore('drawings', () => {
  const authStore = useAuthStore()
  
  // State
  const drawings = ref([]) // Линии и фигуры
  const texts = ref([])    // Текстовые надписи
  const loading = ref(false)
  const error = ref(null)
  
  // Подписки
  let unsubscribeDrawings = null
  let unsubscribeTexts = null

  /**
   * Подписаться на рисунки кампании
   */
  function subscribeToDrawings(campaignId) {
    if (unsubscribeDrawings) unsubscribeDrawings()
    if (unsubscribeTexts) unsubscribeTexts()
    
    loading.value = true
    
    // Подписка на линии/рисунки
    unsubscribeDrawings = onSnapshot(
      collection(db, 'campaigns', campaignId, 'drawings'),
      (snapshot) => {
        drawings.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        loading.value = false
      },
      (e) => {
        console.error('Drawings subscription error:', e)
        error.value = e.message
        loading.value = false
      }
    )
    
    // Подписка на тексты
    unsubscribeTexts = onSnapshot(
      collection(db, 'campaigns', campaignId, 'texts'),
      (snapshot) => {
        texts.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      },
      (e) => {
        console.error('Texts subscription error:', e)
        error.value = e.message
      }
    )
  }

  /**
   * Сохранить линию/рисунок
   */
  async function saveDrawing(campaignId, drawingData) {
    try {
      const data = {
        ...drawingData,
        userId: authStore.userId,
        createdAt: serverTimestamp()
      }
      
      await addDoc(collection(db, 'campaigns', campaignId, 'drawings'), data)
    } catch (e) {
      console.error('Failed to save drawing:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Сохранить текст
   */
  async function saveText(campaignId, textData) {
    try {
      const data = {
        ...textData,
        userId: authStore.userId,
        createdAt: serverTimestamp()
      }
      
      await addDoc(collection(db, 'campaigns', campaignId, 'texts'), data)
    } catch (e) {
      console.error('Failed to save text:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Удалить рисунок
   */
  async function deleteDrawing(campaignId, drawingId) {
    try {
      await deleteDoc(doc(db, 'campaigns', campaignId, 'drawings', drawingId))
    } catch (e) {
      console.error('Failed to delete drawing:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Удалить текст
   */
  async function deleteText(campaignId, textId) {
    try {
      await deleteDoc(doc(db, 'campaigns', campaignId, 'texts', textId))
    } catch (e) {
      console.error('Failed to delete text:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Очистить все рисунки (только GM)
   */
  async function clearAllDrawings(campaignId) {
    try {
      loading.value = true
      
      const batch = writeBatch(db)
      
      // Удаляем все рисунки
      const drawingsSnapshot = await getDocs(collection(db, 'campaigns', campaignId, 'drawings'))
      drawingsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
      
      // Удаляем все тексты
      const textsSnapshot = await getDocs(collection(db, 'campaigns', campaignId, 'texts'))
      textsSnapshot.docs.forEach(doc => batch.delete(doc.ref))
      
      await batch.commit()
      
      drawings.value = []
      texts.value = []
    } catch (e) {
      console.error('Failed to clear drawings:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Очистить рисунки только для определённого типа карты
   */
  async function clearDrawingsByMapType(campaignId, mapType) {
    try {
      loading.value = true
      
      const batch = writeBatch(db)
      
      // Удаляем рисунки с этого типа карты
      const drawingsSnapshot = await getDocs(collection(db, 'campaigns', campaignId, 'drawings'))
      drawingsSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data()
        if (data.mapType === mapType || (!data.mapType && mapType === 'global')) {
          batch.delete(docSnap.ref)
        }
      })
      
      // Удаляем тексты с этого типа карты
      const textsSnapshot = await getDocs(collection(db, 'campaigns', campaignId, 'texts'))
      textsSnapshot.docs.forEach(docSnap => {
        const data = docSnap.data()
        if (data.mapType === mapType || (!data.mapType && mapType === 'global')) {
          batch.delete(docSnap.ref)
        }
      })
      
      await batch.commit()
      
      // Обновляем локальное состояние
      drawings.value = drawings.value.filter(d => d.mapType !== mapType)
      texts.value = texts.value.filter(t => t.mapType !== mapType)
    } catch (e) {
      console.error('Failed to clear drawings by map type:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Отписаться
   */
  function unsubscribeFromDrawings() {
    if (unsubscribeDrawings) {
      unsubscribeDrawings()
      unsubscribeDrawings = null
    }
    if (unsubscribeTexts) {
      unsubscribeTexts()
      unsubscribeTexts = null
    }
    drawings.value = []
    texts.value = []
  }

  return {
    // State
    drawings,
    texts,
    loading,
    error,
    // Actions
    subscribeToDrawings,
    saveDrawing,
    saveText,
    deleteDrawing,
    deleteText,
    clearAllDrawings,
    clearDrawingsByMapType,
    unsubscribeFromDrawings
  }
})

