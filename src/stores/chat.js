import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db } from '@/firebase'
import { 
  collection, 
  addDoc, 
  deleteDoc,
  doc,
  query, 
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDocs
} from 'firebase/firestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'

export const useChatStore = defineStore('chat', () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  // State
  const messages = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Подписка
  let unsubscribe = null
  let currentCampaignId = null

  /**
   * Подписаться на сообщения чата кампании
   */
  function subscribeToChat(campaignId) {
    if (unsubscribe) unsubscribe()
    
    currentCampaignId = campaignId
    loading.value = true
    
    const q = query(
      collection(db, 'campaigns', campaignId, 'chat'),
      orderBy('createdAt', 'asc'),
      limit(100)
    )
    
    unsubscribe = onSnapshot(q, (snapshot) => {
      messages.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      loading.value = false
    }, (e) => {
      console.error('Chat subscription error:', e)
      error.value = e.message
      loading.value = false
    })
  }

  /**
   * Отправить сообщение в чат
   */
  async function sendMessage(campaignId, text, type = 'message') {
    if (!authStore.userId) throw new Error('Not authenticated')
    
    try {
      const messageData = {
        text,
        type, // 'message', 'roll', 'system'
        userId: authStore.userId,
        userName: userStore.displayName,
        userRole: userStore.userRole,
        createdAt: serverTimestamp()
      }
      
      await addDoc(collection(db, 'campaigns', campaignId, 'chat'), messageData)
    } catch (e) {
      console.error('Failed to send message:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Отправить бросок кубика
   */
  async function sendDiceRoll(campaignId, diceNotation, result, details) {
    if (!authStore.userId) throw new Error('Not authenticated')
    
    try {
      const messageData = {
        text: `🎲 ${diceNotation} = ${result}`,
        type: 'roll',
        userId: authStore.userId,
        userName: userStore.displayName,
        userRole: userStore.userRole,
        diceNotation,
        result,
        details, // массив отдельных бросков
        createdAt: serverTimestamp()
      }
      
      await addDoc(collection(db, 'campaigns', campaignId, 'chat'), messageData)
    } catch (e) {
      console.error('Failed to send dice roll:', e)
      error.value = e.message
      throw e
    }
  }

  /**
   * Очистить чат (только для GM)
   */
  async function clearChat(campaignId) {
    try {
      loading.value = true
      
      const chatRef = collection(db, 'campaigns', campaignId, 'chat')
      const snapshot = await getDocs(chatRef)
      
      const batch = writeBatch(db)
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
      messages.value = []
      
      // Отправляем системное сообщение
      await sendMessage(campaignId, 'Чат был очищен', 'system')
      
    } catch (e) {
      console.error('Failed to clear chat:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Отписаться от чата
   */
  function unsubscribeFromChat() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    messages.value = []
    currentCampaignId = null
  }

  return {
    // State
    messages,
    loading,
    error,
    // Actions
    subscribeToChat,
    sendMessage,
    sendDiceRoll,
    clearChat,
    unsubscribeFromChat
  }
})


