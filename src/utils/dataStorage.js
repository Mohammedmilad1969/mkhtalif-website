// Data Storage Utility
// This handles storing and retrieving project data from Firebase Firestore ONLY
// All data is stored in Firebase and shared across ALL browsers!

import { db, isFirebaseConfigured } from '../config/firebase'
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore'

const STORAGE_KEYS = {
  PROJECTS: 'moukhtalif_projects',
  CATEGORIES: 'moukhtalif_categories',
  ADMIN_PASSWORD: 'moukhtalif_admin_password'
}

const FIRESTORE_COLLECTIONS = {
  PROJECTS: 'projects',
  CATEGORIES: 'categories',
  ADMIN: 'admin'
}

// ==================== FIREBASE FIRESTORE FUNCTIONS ====================

// Projects CRUD operations (Firestore)
const getProjectsFirestore = async () => {
  try {
    const projectsCollection = collection(db, FIRESTORE_COLLECTIONS.PROJECTS)
    const snapshot = await getDocs(projectsCollection)
    const projects = {}
    snapshot.forEach((docSnapshot) => {
      projects[docSnapshot.id] = docSnapshot.data()
    })
    console.log('📦 Projects loaded from Firestore. Count:', Object.keys(projects).length)
    return projects
  } catch (error) {
    console.error('❌ Error loading projects from Firestore:', error)
    throw error
  }
}

const saveProjectFirestore = async (projectId, projectData) => {
  try {
    // Ensure projectData doesn't have an id field (it's stored as the document ID)
    const { id, ...projectDataWithoutId } = projectData
    const projectRef = doc(db, FIRESTORE_COLLECTIONS.PROJECTS, projectId)
    await setDoc(projectRef, projectDataWithoutId, { merge: true })
    console.log('✅ Project saved to Firestore:', projectId)
  } catch (error) {
    console.error('❌ Error saving project to Firestore:', error)
    throw error
  }
}

const deleteProjectFirestore = async (projectId) => {
  try {
    if (!db) {
      throw new Error('Firestore database is not initialized')
    }
    
    const projectRef = doc(db, FIRESTORE_COLLECTIONS.PROJECTS, projectId)
    
    // First, verify the document exists
    const projectDoc = await getDoc(projectRef)
    if (!projectDoc.exists()) {
      console.warn('⚠️ Project document does not exist in Firestore:', projectId)
      // Still proceed with deletion attempt in case of race condition
    }
    
    // Delete the document
    await deleteDoc(projectRef)
    console.log('✅ Project deleted from Firestore:', projectId)
    
    // Verify deletion
    const verifyDoc = await getDoc(projectRef)
    if (verifyDoc.exists()) {
      throw new Error('Project still exists after deletion attempt')
    }
    
    console.log('✅ Verified: Project successfully deleted from Firestore')
  } catch (error) {
    console.error('❌ Error deleting project from Firestore:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    throw error
  }
}

// Categories CRUD operations (Firestore)
const getCategoriesFirestore = async () => {
  try {
    const categoriesRef = doc(db, FIRESTORE_COLLECTIONS.CATEGORIES, 'list')
    const categoriesDoc = await getDoc(categoriesRef)
    if (categoriesDoc.exists()) {
      const data = categoriesDoc.data()
      console.log('📦 Categories loaded from Firestore. Count:', data.categories?.length || 0)
      return data.categories || []
    }
    return []
  } catch (error) {
    console.error('❌ Error loading categories from Firestore:', error)
    throw error
  }
}

const saveCategoriesFirestore = async (categories) => {
  try {
    const categoriesRef = doc(db, FIRESTORE_COLLECTIONS.CATEGORIES, 'list')
    await setDoc(categoriesRef, { categories }, { merge: true })
    console.log('✅ Categories saved to Firestore. Count:', categories.length)
  } catch (error) {
    console.error('❌ Error saving categories to Firestore:', error)
    throw error
  }
}

// Admin password operations (Firestore)
const getAdminPasswordFirestore = async () => {
  try {
    const adminRef = doc(db, FIRESTORE_COLLECTIONS.ADMIN, 'password')
    const adminDoc = await getDoc(adminRef)
    if (adminDoc.exists()) {
      const data = adminDoc.data()
      return data.password || 'admin123'
    }
    return 'admin123' // Default password
  } catch (error) {
    console.error('❌ Error loading admin password from Firestore:', error)
    return 'admin123'
  }
}

const setAdminPasswordFirestore = async (newPassword) => {
  try {
    const adminRef = doc(db, FIRESTORE_COLLECTIONS.ADMIN, 'password')
    await setDoc(adminRef, { password: newPassword }, { merge: true })
    console.log('✅ Admin password saved to Firestore')
  } catch (error) {
    console.error('❌ Error saving admin password to Firestore:', error)
    throw error
  }
}

// Initialize default data in Firestore
const initializeDefaultDataFirestore = async () => {
  try {
    // Check if categories exist
    const categories = await getCategoriesFirestore()
    if (categories.length === 0) {
      console.log('Initializing default categories in Firestore...')
      const defaultCategories = [
        { id: 'all', name: 'All', nameAr: 'الكل' },
        { id: 'whole-project', name: 'Whole Project', nameAr: 'المشروع الكامل' },
        { id: 'visual-identity', name: 'Visual Identity', nameAr: 'الهوية البصرية' },
        { id: 'graphic-design', name: 'Graphic Design', nameAr: 'التصميم الجرافيكي' },
        { id: 'reels', name: 'Reels', nameAr: 'الريلز' },
        { id: 'pics', name: 'Pictures', nameAr: 'الصور' },
        { id: 'banners', name: 'Banners', nameAr: 'البانرات' },
        { id: 'printing', name: 'Printing', nameAr: 'الطباعة' },
        { id: 'web-design', name: 'Web Design', nameAr: 'تصميم المواقع' },
        { id: 'packaging', name: 'Packaging', nameAr: 'التغليف' },
        { id: 'social-media', name: 'Social Media', nameAr: 'وسائل التواصل' }
      ]
      await saveCategoriesFirestore(defaultCategories)
    }

    // Check if admin password exists
    const adminPassword = await getAdminPasswordFirestore()
    if (!adminPassword || adminPassword === 'admin123') {
      console.log('Setting default admin password in Firestore...')
      await setAdminPasswordFirestore('admin123')
    }
  } catch (error) {
    console.error('❌ Error initializing default data in Firestore:', error)
  }
}

// ==================== LOCALSTORAGE FUNCTIONS (FALLBACK) ====================

const initializeDefaultDataLocalStorage = () => {
  try {
    if (typeof localStorage === 'undefined') {
      console.error('localStorage is not available!')
      return
    }

    // Default categories - only initialize if not exists
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      console.log('Initializing default categories in localStorage...')
      const defaultCategories = [
        { id: 'all', name: 'All', nameAr: 'الكل' },
        { id: 'whole-project', name: 'Whole Project', nameAr: 'المشروع الكامل' },
        { id: 'visual-identity', name: 'Visual Identity', nameAr: 'الهوية البصرية' },
        { id: 'graphic-design', name: 'Graphic Design', nameAr: 'التصميم الجرافيكي' },
        { id: 'reels', name: 'Reels', nameAr: 'الريلز' },
        { id: 'pics', name: 'Pictures', nameAr: 'الصور' },
        { id: 'banners', name: 'Banners', nameAr: 'البانرات' },
        { id: 'printing', name: 'Printing', nameAr: 'الطباعة' },
        { id: 'web-design', name: 'Web Design', nameAr: 'تصميم المواقع' },
        { id: 'packaging', name: 'Packaging', nameAr: 'التغليف' },
        { id: 'social-media', name: 'Social Media', nameAr: 'وسائل التواصل' }
      ]
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories))
    }

    // Set default admin password if not exists
    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD)) {
      console.log('Initializing default admin password in localStorage...')
      localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, 'admin123')
    }

    // Initialize empty projects object ONLY if it doesn't exist
    if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
      console.log('Initializing empty projects object in localStorage...')
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify({}))
    }
  } catch (error) {
    console.error('Error initializing default data in localStorage:', error)
  }
}

const getProjectsLocalStorage = () => {
  try {
    const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    if (!projects) {
      return {}
    }
    const parsed = JSON.parse(projects)
    console.log('📦 Projects loaded from localStorage. Count:', Object.keys(parsed).length)
    return parsed
  } catch (error) {
    console.error('Error reading projects from localStorage:', error)
    return {}
  }
}

const saveProjectsLocalStorage = (projects) => {
  try {
    const projectsString = JSON.stringify(projects)
    localStorage.setItem(STORAGE_KEYS.PROJECTS, projectsString)
    console.log('✅ Projects saved to localStorage. Count:', Object.keys(projects).length)
  } catch (error) {
    console.error('Error saving projects to localStorage:', error)
    if (error.name === 'QuotaExceededError') {
      alert('Storage quota exceeded! Please clear some data.')
    }
    throw error
  }
}

const getCategoriesLocalStorage = () => {
  const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
  return categories ? JSON.parse(categories) : []
}

const saveCategoriesLocalStorage = (categories) => {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
}

const getAdminPasswordLocalStorage = () => {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123'
}

const setAdminPasswordLocalStorage = (newPassword) => {
  localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword)
}

// ==================== UNIFIED API (ASYNC) ====================

// Initialize default data
export const initializeDefaultData = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    await initializeDefaultDataFirestore()
    // Also migrate localStorage data to Firestore if it exists (one-time migration)
    await migrateLocalStorageToFirestore()
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error)
    throw error
  }
}

// Migrate localStorage data to Firestore (one-time migration)
const migrateLocalStorageToFirestore = async () => {
  try {
    // Check if migration already done
    const migrationKey = 'moukhtalif_migrated_to_firestore'
    if (localStorage.getItem(migrationKey)) {
      console.log('✅ Migration already completed')
      return
    }

    console.log('🔄 Migrating localStorage data to Firestore...')

    // Migrate projects
    const localProjects = getProjectsLocalStorage()
    if (Object.keys(localProjects).length > 0) {
      const batch = writeBatch(db)
      Object.keys(localProjects).forEach(projectId => {
        const projectRef = doc(db, FIRESTORE_COLLECTIONS.PROJECTS, projectId)
        const { id, ...projectData } = localProjects[projectId]
        batch.set(projectRef, projectData)
      })
      await batch.commit()
      console.log('✅ Migrated', Object.keys(localProjects).length, 'projects to Firestore')
    }

    // Migrate categories
    const localCategories = getCategoriesLocalStorage()
    if (localCategories.length > 0) {
      await saveCategoriesFirestore(localCategories)
      console.log('✅ Migrated', localCategories.length, 'categories to Firestore')
    }

    // Mark migration as complete
    localStorage.setItem(migrationKey, 'true')
    console.log('✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Error migrating data to Firestore:', error)
  }
}

// Force migrate localStorage to Firestore (can be called manually)
export const forceMigrateToFirestore = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }

  try {
    console.log('🔄 Force migrating localStorage data to Firestore...')

    // Migrate projects
    const localProjects = getProjectsLocalStorage()
    if (Object.keys(localProjects).length > 0) {
      const batch = writeBatch(db)
      let count = 0
      Object.keys(localProjects).forEach(projectId => {
        const projectRef = doc(db, FIRESTORE_COLLECTIONS.PROJECTS, projectId)
        const { id, ...projectData } = localProjects[projectId]
        batch.set(projectRef, projectData)
        count++
      })
      await batch.commit()
      console.log('✅ Migrated', count, 'projects to Firestore')
      return { success: true, projectsMigrated: count }
    } else {
      console.log('⚠️ No projects in localStorage to migrate')
      return { success: true, projectsMigrated: 0 }
    }
  } catch (error) {
    console.error('❌ Error force migrating to Firestore:', error)
    throw error
  }
}

// Projects CRUD operations
export const getProjects = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    return await getProjectsFirestore()
  } catch (error) {
    console.error('❌ Error loading projects from Firestore:', error)
    throw error
  }
}

export const saveProject = async (projectId, projectData) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    await saveProjectFirestore(projectId, projectData)
    console.log('✅ Project saved to Firebase:', projectId)
  } catch (error) {
    console.error('❌ Error saving project to Firestore:', error)
    throw error
  }
}

export const deleteProject = async (projectId) => {
  console.log('🗑️ Deleting project:', projectId)
  
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    console.log('🔥 Attempting to delete from Firestore...')
    await deleteProjectFirestore(projectId)
    console.log('✅ Successfully deleted from Firestore')
  } catch (error) {
    console.error('❌ Error deleting from Firestore:', error)
    console.error('Error details:', error.message, error.code)
    throw new Error(`Failed to delete project from Firebase: ${error.message}`)
  }
}

export const getProject = async (projectId) => {
  const projects = await getProjects()
  return projects[projectId] || null
}

export const getAllProjectsList = async () => {
  const projects = await getProjects()
  return Object.keys(projects).map(id => ({
    id,
    ...projects[id]
  }))
}

// Categories CRUD operations
export const getCategories = async () => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    return await getCategoriesFirestore()
  } catch (error) {
    console.error('❌ Error loading categories from Firestore:', error)
    throw error
  }
}

export const saveCategories = async (categories) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    await saveCategoriesFirestore(categories)
    console.log('✅ Categories saved to Firebase')
  } catch (error) {
    console.error('❌ Error saving categories to Firestore:', error)
    throw error
  }
}

export const addCategory = async (category) => {
  const categories = await getCategories()
  categories.push(category)
  await saveCategories(categories)
}

export const updateCategory = async (categoryId, updatedCategory) => {
  const categories = await getCategories()
  const index = categories.findIndex(cat => cat.id === categoryId)
  if (index !== -1) {
    categories[index] = updatedCategory
    await saveCategories(categories)
  }
}

export const deleteCategory = async (categoryId) => {
  const categories = await getCategories()
  const filtered = categories.filter(cat => cat.id !== categoryId)
  await saveCategories(filtered)
}

// Admin authentication
export const checkAdminPassword = async (password) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    const storedPassword = await getAdminPasswordFirestore()
    return password === storedPassword
  } catch (error) {
    console.error('❌ Error loading admin password from Firestore:', error)
    throw error
  }
}

export const setAdminPassword = async (newPassword) => {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured. Please configure Firebase in src/config/firebase.js')
  }
  
  try {
    await setAdminPasswordFirestore(newPassword)
    console.log('✅ Admin password saved to Firebase')
  } catch (error) {
    console.error('❌ Error saving admin password to Firestore:', error)
    throw error
  }
}

// Initialize on import (but make it async-safe)
if (typeof window !== 'undefined') {
  initializeDefaultData().catch(error => {
    console.error('Error initializing data:', error)
  })
}