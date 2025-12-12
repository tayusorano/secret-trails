import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth'
import { useUserStore } from './user'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const userId = computed(() => user.value?.uid)
  const userEmail = computed(() => user.value?.email)

  // Actions
  async function login(email, password) {
    try {
      error.value = null
      const result = await signInWithEmailAndPassword(auth, email, password)
      user.value = result.user
      
      // Загружаем профиль пользователя
      const userStore = useUserStore()
      await userStore.fetchProfile(result.user.uid)
      userStore.subscribeToProfile(result.user.uid)
      
      return result.user
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function register(email, password) {
    try {
      error.value = null
      console.log('1. Starting registration...')
      
      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log('2. Firebase Auth user created:', result.user.uid)
      
      user.value = result.user
      
      // Создаём профиль нового пользователя
      console.log('3. Creating user profile in Firestore...')
      const userStore = useUserStore()
      await userStore.createProfile(result.user.uid)
      console.log('4. Profile created!')
      
      userStore.subscribeToProfile(result.user.uid)
      console.log('5. Subscribed to profile, registration complete!')
      
      return result.user
    } catch (e) {
      console.error('Registration error:', e)
      error.value = e.message
      throw e
    }
  }

  async function loginWithGoogle() {
    try {
      error.value = null
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      user.value = result.user
      
      // Загружаем или создаём профиль
      const userStore = useUserStore()
      await userStore.fetchProfile(result.user.uid)
      userStore.subscribeToProfile(result.user.uid)
      
      return result.user
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function logout() {
    try {
      // Очищаем профиль пользователя
      const userStore = useUserStore()
      userStore.clearProfile()
      
      await signOut(auth)
      user.value = null
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Слушатель изменения состояния авторизации
  function initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      user.value = firebaseUser
      
      // Если пользователь авторизован - загружаем его профиль
      if (firebaseUser) {
        const userStore = useUserStore()
        try {
          await userStore.fetchProfile(firebaseUser.uid)
          userStore.subscribeToProfile(firebaseUser.uid)
        } catch (e) {
          console.error('Failed to load user profile:', e)
        }
      }
      
      loading.value = false
    })
  }

  return {
    // State
    user,
    loading,
    error,
    // Getters
    isAuthenticated,
    userId,
    userEmail,
    // Actions
    login,
    register,
    loginWithGoogle,
    logout,
    initAuthListener
  }
})

