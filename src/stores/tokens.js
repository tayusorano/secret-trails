import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import { 
  collection, 
  doc,
  addDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore'
import { useAuthStore } from './auth'

export const useTokensStore = defineStore('tokens', () => {
  const authStore = useAuthStore()
  
  // State
  const tokens = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Подписка
  let unsubscribe = null

  /**
   * Подписаться на токены кампании
   */
  function subscribeToTokens(campaignId) {
    if (unsubscribe) unsubscribe()
    
    loading.value = true
    
    unsubscribe = onSnapshot(
      collection(db, 'campaigns', campaignId, 'tokens'),
      (snapshot) => {
        tokens.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        loading.value = false
      },
      (e) => {
        console.error('Tokens subscription error:', e)
        error.value = e.message
        loading.value = false
      }
    )
  }

  /**
   * Создать новый токен
   */
  async function createToken(campaignId, tokenData) {
    try {
      loading.value = true
      
      const data = {
        name: tokenData.name,
        image: tokenData.image, // эмодзи или URL картинки
        imageType: tokenData.imageType, // 'emoji' или 'url'
        borderColor: tokenData.borderColor || '#4a5568',
        x: tokenData.x || 100,
        y: tokenData.y || 100,
        mapType: tokenData.mapType || 'global',
        size: 50, // размер токена
        createdBy: authStore.userId,
        createdAt: serverTimestamp()
      }
      
      const docRef = await addDoc(collection(db, 'campaigns', campaignId, 'tokens'), data)
      
      return { id: docRef.id, ...data }
    } catch (e) {
      console.error('Failed to create token:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Обновить позицию токена
   */
  async function updateTokenPosition(campaignId, tokenId, x, y) {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId, 'tokens', tokenId), {
        x,
        y
      })
    } catch (e) {
      console.error('Failed to update token position:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Обновить токен
   */
  async function updateToken(campaignId, tokenId, data) {
    try {
      await updateDoc(doc(db, 'campaigns', campaignId, 'tokens', tokenId), data)
    } catch (e) {
      console.error('Failed to update token:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Удалить токен
   */
  async function deleteToken(campaignId, tokenId) {
    try {
      await deleteDoc(doc(db, 'campaigns', campaignId, 'tokens', tokenId))
    } catch (e) {
      console.error('Failed to delete token:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Получить токены для определённого типа карты
   */
  function getTokensByMapType(mapType) {
    return tokens.value.filter(t => t.mapType === mapType)
  }

  /**
   * Отписаться
   */
  function unsubscribeFromTokens() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    tokens.value = []
  }

  return {
    // State
    tokens,
    loading,
    error,
    // Actions
    subscribeToTokens,
    createToken,
    updateTokenPosition,
    updateToken,
    deleteToken,
    getTokensByMapType,
    unsubscribeFromTokens
  }
})


