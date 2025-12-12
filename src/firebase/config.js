// Firebase configuration
// Замени значения на свои из Firebase Console
// Project Settings → General → Your apps → SDK setup and configuration

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyBEWc4Q1UV9eEtZfeVjQwXL2F5HCTYjgQQ",
    authDomain: "secret-trails.firebaseapp.com",
    projectId: "secret-trails",
    storageBucket: "secret-trails.firebasestorage.app",
    messagingSenderId: "658406616234",
    appId: "1:658406616234:web:0b4cfd4b4d84250add74d3",
  // Для Realtime Database (для real-time синхронизации игры)
  databaseURL: "https://secret-trails-default-rtdb.firebaseio.com/",
}

// Инициализация Firebase
const app = initializeApp(firebaseConfig)

// Сервисы Firebase
export const db = getFirestore(app)           // Firestore для хранения персонажей, кампаний
export const auth = getAuth(app)              // Аутентификация пользователей
export const rtdb = getDatabase(app)          // Realtime Database для игровых сессий
export const storage = getStorage(app)        // Storage для загрузки файлов (токены, карты)

export default app

