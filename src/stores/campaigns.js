import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase'
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore'
import { useAuthStore } from './auth'
import { useUserStore } from './user'

export const useCampaignsStore = defineStore('campaigns', () => {
  const authStore = useAuthStore()
  const userStore = useUserStore()
  
  // State
  const campaigns = ref([])           // Кампании где я GM
  const playerCampaigns = ref([])     // Кампании где я игрок
  const currentCampaign = ref(null)   // Текущая открытая кампания
  const loading = ref(false)
  const error = ref(null)
  
  // Подписки
  let unsubscribeMaster = null
  let unsubscribePlayer = null

  // Getters
  const myCampaigns = computed(() => campaigns.value)
  const joinedCampaigns = computed(() => playerCampaigns.value)
  const allMyCampaigns = computed(() => [...campaigns.value, ...playerCampaigns.value])

  // Генерация случайного кода для присоединения (5 символов)
  function generateJoinCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Без похожих символов (0,O,1,I)
    let code = ''
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Создать новую кампанию (только для GM)
   */
  async function createCampaign(name) {
    if (!authStore.userId) throw new Error('Not authenticated')
    if (!userStore.isGM) throw new Error('Только Game Master может создавать кампании')
    
    try {
      loading.value = true
      error.value = null
      
      const campaignData = {
        name: name.trim(),
        createdAt: serverTimestamp(),
        masterId: authStore.userId,
        masterEmail: authStore.userEmail,
        players: [],
        joinCode: generateJoinCode(),
        mapId: null,
        status: 'active' // active, archived
      }
      
      const docRef = await addDoc(collection(db, 'campaigns'), campaignData)
      
      console.log('Campaign created with ID:', docRef.id)
      
      return { id: docRef.id, ...campaignData }
    } catch (e) {
      console.error('Failed to create campaign:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Присоединиться к кампании по коду
   */
  async function joinCampaign(joinCode) {
    if (!authStore.userId) throw new Error('Not authenticated')
    
    try {
      loading.value = true
      error.value = null
      
      // Ищем кампанию по коду
      const q = query(
        collection(db, 'campaigns'), 
        where('joinCode', '==', joinCode.toUpperCase().trim())
      )
      
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) {
        throw new Error('Кампания с таким кодом не найдена')
      }
      
      const campaignDoc = querySnapshot.docs[0]
      const campaignData = campaignDoc.data()
      
      // Проверяем, не мастер ли это
      if (campaignData.masterId === authStore.userId) {
        throw new Error('Вы уже мастер этой кампании')
      }
      
      // Проверяем, не присоединился ли уже
      if (campaignData.players?.includes(authStore.userId)) {
        throw new Error('Вы уже участвуете в этой кампании')
      }
      
      // Добавляем игрока
      await updateDoc(doc(db, 'campaigns', campaignDoc.id), {
        players: arrayUnion(authStore.userId)
      })
      
      console.log('Joined campaign:', campaignDoc.id)
      
      return { id: campaignDoc.id, ...campaignData }
    } catch (e) {
      console.error('Failed to join campaign:', e)
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Подписаться на кампании где я мастер
   */
  function subscribeToMasterCampaigns() {
    if (!authStore.userId) return
    
    if (unsubscribeMaster) unsubscribeMaster()
    
    const q = query(
      collection(db, 'campaigns'),
      where('masterId', '==', authStore.userId),
      orderBy('createdAt', 'desc')
    )
    
    unsubscribeMaster = onSnapshot(q, (snapshot) => {
      campaigns.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }, (e) => {
      console.error('Master campaigns subscription error:', e)
      error.value = e.message
    })
  }

  /**
   * Подписаться на кампании где я игрок
   */
  function subscribeToPlayerCampaigns() {
    if (!authStore.userId) return
    
    if (unsubscribePlayer) unsubscribePlayer()
    
    const q = query(
      collection(db, 'campaigns'),
      where('players', 'array-contains', authStore.userId),
      orderBy('createdAt', 'desc')
    )
    
    unsubscribePlayer = onSnapshot(q, (snapshot) => {
      playerCampaigns.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    }, (e) => {
      console.error('Player campaigns subscription error:', e)
      error.value = e.message
    })
  }

  /**
   * Подписаться на все мои кампании
   */
  function subscribeToAllCampaigns() {
    subscribeToMasterCampaigns()
    subscribeToPlayerCampaigns()
  }

  /**
   * Получить кампанию по ID
   */
  async function getCampaign(campaignId) {
    try {
      loading.value = true
      const docSnap = await getDoc(doc(db, 'campaigns', campaignId))
      
      if (docSnap.exists()) {
        currentCampaign.value = { id: docSnap.id, ...docSnap.data() }
        return currentCampaign.value
      } else {
        throw new Error('Кампания не найдена')
      }
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Удалить кампанию (только мастер)
   */
  async function deleteCampaign(campaignId) {
    try {
      loading.value = true
      await deleteDoc(doc(db, 'campaigns', campaignId))
      console.log('Campaign deleted:', campaignId)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Очистить данные (при выходе)
   */
  function clearCampaigns() {
    if (unsubscribeMaster) {
      unsubscribeMaster()
      unsubscribeMaster = null
    }
    if (unsubscribePlayer) {
      unsubscribePlayer()
      unsubscribePlayer = null
    }
    campaigns.value = []
    playerCampaigns.value = []
    currentCampaign.value = null
    error.value = null
  }

  return {
    // State
    campaigns,
    playerCampaigns,
    currentCampaign,
    loading,
    error,
    // Getters
    myCampaigns,
    joinedCampaigns,
    allMyCampaigns,
    // Actions
    createCampaign,
    joinCampaign,
    subscribeToMasterCampaigns,
    subscribeToPlayerCampaigns,
    subscribeToAllCampaigns,
    getCampaign,
    deleteCampaign,
    clearCampaigns
  }
})

