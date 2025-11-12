// Firebase Configuration
// Environment variables are loaded from .env file
// Make sure to create a .env file in the root directory with your Firebase config

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if Firebase is configured (check if config values are not empty or placeholders)
const isFirebaseConfigured = firebaseConfig.apiKey && 
                              firebaseConfig.apiKey !== "your-api-key-here" &&
                              firebaseConfig.apiKey !== "apiKey" &&
                              firebaseConfig.projectId && 
                              firebaseConfig.projectId !== "your-project-id" &&
                              firebaseConfig.projectId !== "your-project-id"

let app = null
let db = null

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    console.log('✅ Firebase Firestore initialized successfully')
    console.log('🌐 All data will be stored in Firebase (shared across ALL browsers)!')
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error)
    throw new Error('Failed to initialize Firebase. Please check your configuration.')
  }
} else {
  console.error('❌ Firebase is not properly configured!')
  console.error('💡 Please create a .env file with your Firebase config')
  throw new Error('Firebase configuration is required. Please create a .env file with your Firebase config.')
}

export { db, isFirebaseConfigured }