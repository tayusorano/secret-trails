import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/firebase'
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from './auth'

// Роли пользователей
export const USER_ROLES = {
  GM: 'gm',           // Game Master - ведущий
  PLAYER: 'player'    // Игрок
}

export const useUserStore = defineStore('user', () => {
  const authStore = useAuthStore()
  
  // State
  const profile = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // Подписка на изменения профиля
  let unsubscribe = null

  // Getters
  const isGM = computed(() => profile.value?.role === USER_ROLES.GM)
  const isPlayer = computed(() => profile.value?.role === USER_ROLES.PLAYER)
  const displayName = computed(() => profile.value?.displayName || authStore.userEmail?.split('@')[0] || 'Adventurer')
  const userRole = computed(() => profile.value?.role)

  // Actions
  
  /**
   * Создаёт профиль пользователя при первой регистрации
   */
  async function createProfile(userId, data = {}) {
    try {
      loading.value = true
      error.value = null
      
      const userProfile = {
        email: authStore.userEmail,
        displayName: data.displayName || authStore.userEmail?.split('@')[0] || 'Adventurer',
        role: data.role || USER_ROLES.PLAYER, // По умолчанию - игрок
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Настройки пользователя
        settings: {
          theme: 'dark',
          notifications: true
        }
      }
      
      await setDoc(doc(db, 'users', userId), userProfile)
      profile.value = userProfile
      
      return userProfile
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Загружает профиль пользователя из Firestore
   */
  async function fetchProfile(userId) {
    try {
      loading.value = true
      error.value = null
      
      const docRef = doc(db, 'users', userId)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        profile.value = docSnap.data()
        return profile.value
      } else {
        // Профиль не найден - создаём новый
        return await createProfile(userId)
      }
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Подписывается на изменения профиля в реальном времени
   */
  function subscribeToProfile(userId) {
    // Отписываемся от предыдущей подписки
    if (unsubscribe) {
      unsubscribe()
    }
    
    const docRef = doc(db, 'users', userId)
    
    unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        profile.value = docSnap.data()
      }
    }, (e) => {
      error.value = e.message
    })
  }

  /**
   * Обновляет профиль пользователя
   */
  async function updateProfile(userId, data) {
    try {
      loading.value = true
      error.value = null
      
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      }
      
      await updateDoc(doc(db, 'users', userId), updateData)
      
      // Обновляем локальное состояние
      profile.value = { ...profile.value, ...updateData }
      
      return profile.value
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Меняет роль пользователя (только для отладки или админов)
   */
  async function setRole(userId, role) {
    if (!Object.values(USER_ROLES).includes(role)) {
      throw new Error(`Invalid role: ${role}`)
    }
    
    return updateProfile(userId, { role })
  }

  /**
   * Очищает данные профиля (при выходе)
   */
  function clearProfile() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    profile.value = null
    error.value = null
  }

  return {
    // State
    profile,
    loading,
    error,
    // Getters
    isGM,
    isPlayer,
    displayName,
    userRole,
    // Actions
    createProfile,
    fetchProfile,
    subscribeToProfile,
    updateProfile,
    setRole,
    clearProfile
  }
})


