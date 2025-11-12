import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getProjects,
  saveProject,
  deleteProject,
  getAllProjectsList,
  getProject,
  getCategories,
  saveCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  checkAdminPassword,
  setAdminPassword,
  forceMigrateToFirestore
} from '../utils/dataStorage'

const AdminPage = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('projects') // 'projects' or 'categories' or 'settings'
  const [projects, setProjects] = useState({})
  const [categories, setCategories] = useState([])
  const [editingProject, setEditingProject] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        try {
          const projectsData = await getProjects()
          const categoriesData = await getCategories()
          setProjects(projectsData)
          setCategories(categoriesData)
        } catch (error) {
          console.error('Error loading data:', error)
        }
      }
    }
    loadData()
  }, [isAuthenticated])

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const isValid = await checkAdminPassword(password)
      if (isValid) {
        setIsAuthenticated(true)
        setPassword('')
      } else {
        alert('Incorrect password!')
      }
    } catch (error) {
      console.error('Error checking password:', error)
      alert('Error checking password. Please try again.')
    }
  }

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword('')
  }

  // Project operations
  const handleSaveProject = async (projectData) => {
    try {
      const projectId = projectData.id || `project-${Date.now()}`
      console.log('Saving project with ID:', projectId, 'Data:', projectData)
      
      // Validate category
      if (!projectData.category || projectData.category === '') {
        alert('Error: Please select a category for the project!')
        return
      }
      
      // Ensure all required fields are present
      const projectToSave = {
        ...projectData,
        category: projectData.category, // Ensure category is saved
        images: projectData.images || [] // Ensure images array exists
      }
      
      console.log('Project to save (with validation):', projectToSave)
      console.log('Project category:', projectToSave.category)
      
      // Save the project
      await saveProject(projectId, projectToSave)
      
      // Verify it was saved
      const savedProject = await getProject(projectId)
      if (!savedProject) {
        console.error('Project was not saved correctly!')
        alert('Error: Project was not saved. Please try again.')
        return
      }
      
      console.log('Project saved successfully. Verifying...', savedProject)
      console.log('Saved project category:', savedProject.category)
      
      // Reload projects list
      const updatedProjects = await getProjects()
      setProjects(updatedProjects)
      console.log('Updated projects list. Total projects:', Object.keys(updatedProjects).length)
      console.log('All project IDs:', Object.keys(updatedProjects))
      
      // Verify the saved project is in the list
      if (updatedProjects[projectId]) {
        console.log('✅ Project found in updated list:', updatedProjects[projectId])
      } else {
        console.error('❌ Project NOT found in updated list!')
      }
      
      setEditingProject(null)
      setShowAddProject(false)
      
      // Dispatch custom event to notify other components (works in same tab)
      window.dispatchEvent(new CustomEvent('projectsUpdated', {
        detail: { projectId, action: 'save' }
      }))
      
      // Show success message
      alert(`Project "${projectData.name || projectId}" saved successfully!\nCategory: ${projectData.category}`)
    } catch (error) {
      console.error('Error saving project:', error)
      alert(`Error saving project: ${error.message}`)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        console.log('🗑️ AdminPage: Starting deletion of project:', projectId)
        await deleteProject(projectId)
        console.log('✅ AdminPage: Project deleted successfully')
        
        // Reload projects to get updated list
        const updatedProjects = await getProjects()
        console.log('📦 AdminPage: Updated projects count:', Object.keys(updatedProjects).length)
        setProjects(updatedProjects)
        
        // Verify the project was actually deleted
        if (updatedProjects[projectId]) {
          console.error('❌ AdminPage: Project still exists after deletion!')
          alert('Warning: Project may not have been fully deleted. Please refresh the page.')
        } else {
          console.log('✅ AdminPage: Verified project was deleted from list')
        }
        
        // Dispatch custom event to notify other components (works in same tab)
        window.dispatchEvent(new CustomEvent('projectsUpdated', {
          detail: { projectId, action: 'delete' }
        }))
        
        alert('Project deleted successfully!')
      } catch (error) {
        console.error('❌ AdminPage: Error deleting project:', error)
        console.error('Error details:', error.message, error.stack)
        alert(`Error deleting project: ${error.message}\n\nPlease check the browser console for more details.`)
      }
    }
  }

  // Category operations
  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData)
      } else {
        await addCategory(categoryData)
      }
      const updatedCategories = await getCategories()
      setCategories(updatedCategories)
      setEditingCategory(null)
      setShowAddCategory(false)
      
      // Dispatch custom event to notify other components (works in same tab)
      window.dispatchEvent(new CustomEvent('categoriesUpdated', {
        detail: { action: editingCategory ? 'update' : 'add' }
      }))
    } catch (error) {
      console.error('Error saving category:', error)
      alert(`Error saving category: ${error.message}`)
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (categoryId === 'all') {
      alert('Cannot delete "All" category!')
      return
    }
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(categoryId)
        const updatedCategories = await getCategories()
        setCategories(updatedCategories)
        
        // Dispatch custom event to notify other components (works in same tab)
        window.dispatchEvent(new CustomEvent('categoriesUpdated', {
          detail: { categoryId, action: 'delete' }
        }))
      } catch (error) {
        console.error('Error deleting category:', error)
        alert(`Error deleting category: ${error.message}`)
      }
    }
  }

  // If not authenticated, show login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-black/80 border border-gold/30 rounded-lg"
        >
          <h1 className="text-3xl font-bold mb-6 text-center text-gradient">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-gold/30 rounded-lg focus:outline-none focus:border-gold"
                placeholder="Enter admin password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors"
            >
              Login
            </button>
          </form>
          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full text-center text-lightGray hover:text-gold transition-colors"
          >
            ← Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gold/20">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gradient">Admin Panel</h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 text-lightGray hover:text-gold transition-colors"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gold/20 hover:bg-gold/30 border border-gold/30 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-4 border-b border-gold/20">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'projects'
                ? 'text-gold border-b-2 border-gold'
                : 'text-lightGray hover:text-gold'
            }`}
          >
            Projects
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-gold border-b-2 border-gold'
                : 'text-lightGray hover:text-gold'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-gold border-b-2 border-gold'
                : 'text-lightGray hover:text-gold'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            categories={categories}
            onSave={handleSaveProject}
            onDelete={handleDeleteProject}
            editingProject={editingProject}
            setEditingProject={setEditingProject}
            showAddProject={showAddProject}
            setShowAddProject={setShowAddProject}
          />
        )}

        {activeTab === 'categories' && (
          <CategoriesTab
            categories={categories}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
            editingCategory={editingCategory}
            setEditingCategory={setEditingCategory}
            showAddCategory={showAddCategory}
            setShowAddCategory={setShowAddCategory}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab 
            onPasswordChange={setAdminPassword}
            onMigrateToFirestore={forceMigrateToFirestore}
          />
        )}
      </div>
    </div>
  )
}

// Projects Tab Component
const ProjectsTab = ({
  projects,
  categories,
  onSave,
  onDelete,
  editingProject,
  setEditingProject,
  showAddProject,
  setShowAddProject
}) => {
  const projectsList = Object.keys(projects).map(id => ({ id, ...projects[id] }))

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    industry: '',
    industryAr: '',
    releaseDate: '',
    category: '',
    images: []
  })

  useEffect(() => {
    if (editingProject) {
      setFormData({
        id: editingProject.id || '',
        name: editingProject.name || '',
        nameAr: editingProject.nameAr || '',
        description: editingProject.description || '',
        descriptionAr: editingProject.descriptionAr || '',
        industry: editingProject.industry || '',
        industryAr: editingProject.industryAr || '',
        releaseDate: editingProject.releaseDate || '',
        category: editingProject.category || '',
        images: editingProject.images || []
      })
    } else {
      setFormData({
        id: '',
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        industry: '',
        industryAr: '',
        releaseDate: '',
        category: '',
        images: []
      })
    }
  }, [editingProject])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setFormData({
      id: '',
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      industry: '',
      industryAr: '',
      releaseDate: '',
      category: '',
      images: []
    })
  }

  const handleAddMedia = () => {
    const mediaUrl = prompt('Enter image or video URL (e.g., /images/project-1.jpg or https://youtube.com/watch?v=...):')
    if (mediaUrl) {
      const currentImages = formData.images || []
      setFormData({
        ...formData,
        images: [...currentImages, mediaUrl]
      })
    }
  }

  const handleRemoveImage = (index) => {
    const currentImages = formData.images || []
    setFormData({
      ...formData,
      images: currentImages.filter((_, i) => i !== index)
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button
          onClick={() => {
            setShowAddProject(true)
            setEditingProject(null)
          }}
          className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors"
        >
          + Add Project
        </button>
      </div>

      {/* Projects List */}
      {projectsList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lightGray/60 text-lg mb-4">No projects yet</p>
          <p className="text-lightGray/40 text-sm mb-6">Click "Add Project" to create your first project</p>
          <button
            onClick={() => {
              setShowAddProject(true)
              setEditingProject(null)
            }}
            className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors"
          >
            + Add Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {projectsList.map((project) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-black/50 border border-gold/30 rounded-lg"
          >
            <h3 className="text-lg font-bold mb-2">{project.name}</h3>
            <p className="text-sm text-lightGray/70 mb-4">{project.category}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingProject(project)
                  setShowAddProject(true)
                }}
                className="flex-1 px-3 py-1 bg-gold/20 hover:bg-gold/30 border border-gold/30 rounded text-sm transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(project.id)}
                className="flex-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-sm transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddProject(false)
              setEditingProject(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-black border border-gold/30 rounded-lg p-4 max-w-lg w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                maxWidth: '500px',
                margin: 'auto',
                maxHeight: '90vh',
                overflowY: 'auto'
              }}
            >
              <h3 className="text-lg font-bold mb-2">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Project ID</label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                      placeholder="project-1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.filter(cat => cat.id !== 'all').map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Name (EN)</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Name (AR)</label>
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Description (EN)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold resize-none"
                      rows="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Description (AR)</label>
                    <textarea
                      value={formData.descriptionAr}
                      onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold resize-none"
                      rows="1"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">Industry (EN)</label>
                    <input
                      type="text"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Industry (AR)</label>
                    <input
                      type="text"
                      value={formData.industryAr}
                      onChange={(e) => setFormData({ ...formData, industryAr: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Release Date</label>
                  <input
                    type="text"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                    className="w-full px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                    placeholder="2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Images & Videos</label>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {(formData.images || []).map((media, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={media || ''}
                          onChange={(e) => {
                            const currentImages = formData.images || []
                            const newImages = [...currentImages]
                            newImages[index] = e.target.value
                            setFormData({ ...formData, images: newImages })
                          }}
                          className="flex-1 px-2 py-1 text-xs bg-black/50 border border-gold/30 rounded focus:outline-none focus:border-gold"
                          placeholder="/images/project-1.jpg or video URL"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="px-1.5 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAddMedia}
                      className="w-full px-2 py-1 text-xs bg-gold/20 hover:bg-gold/30 border border-gold/30 rounded transition-colors"
                    >
                      + Add Image or Video
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-xs bg-gold text-black font-semibold rounded hover:bg-gold/80 transition-colors"
                  >
                    {editingProject ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddProject(false)
                      setEditingProject(null)
                    }}
                    className="flex-1 px-3 py-1.5 text-xs bg-black/50 border border-gold/30 rounded hover:bg-black/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Categories Tab Component
const CategoriesTab = ({
  categories,
  onSave,
  onDelete,
  editingCategory,
  setEditingCategory,
  showAddCategory,
  setShowAddCategory
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    nameAr: ''
  })

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        id: editingCategory.id || '',
        name: editingCategory.name || '',
        nameAr: editingCategory.nameAr || ''
      })
    } else {
      setFormData({
        id: '',
        name: '',
        nameAr: ''
      })
    }
  }, [editingCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
    setFormData({
      id: '',
      name: '',
      nameAr: ''
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Categories</h2>
        <button
          onClick={() => {
            setShowAddCategory(true)
            setEditingCategory(null)
          }}
          className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors"
        >
          + Add Category
        </button>
      </div>

      {/* Categories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-black/50 border border-gold/30 rounded-lg"
          >
            <h3 className="text-lg font-bold mb-2">{category.name}</h3>
            <p className="text-sm text-lightGray/70 mb-4">{category.nameAr}</p>
            <div className="flex gap-2">
              {category.id !== 'all' && (
                <>
                  <button
                    onClick={() => {
                      setEditingCategory(category)
                      setShowAddCategory(true)
                    }}
                    className="flex-1 px-3 py-1 bg-gold/20 hover:bg-gold/30 border border-gold/30 rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(category.id)}
                    className="flex-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAddCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => {
              setShowAddCategory(false)
              setEditingCategory(null)
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-black border border-gold/30 rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category ID</label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-gold/30 rounded-lg focus:outline-none focus:border-gold"
                    placeholder="category-name"
                    required
                    disabled={!!editingCategory}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name (English)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-gold/30 rounded-lg focus:outline-none focus:border-gold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name (Arabic)</label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    className="w-full px-4 py-2 bg-black/50 border border-gold/30 rounded-lg focus:outline-none focus:border-gold"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddCategory(false)
                      setEditingCategory(null)
                    }}
                    className="flex-1 px-4 py-2 bg-black/50 border border-gold/30 rounded-lg hover:bg-black/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Settings Tab Component
const SettingsTab = ({ onPasswordChange, onMigrateToFirestore }) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isMigrating, setIsMigrating] = useState(false)

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match!')
      return
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters!')
      return
    }
    try {
      await onPasswordChange(newPassword)
      setNewPassword('')
      setConfirmPassword('')
      alert('Password changed successfully!')
    } catch (error) {
      console.error('Error changing password:', error)
      alert(`Error changing password: ${error.message}`)
    }
  }

  const handleMigrateToFirestore = async () => {
    if (!window.confirm('This will migrate all projects from localStorage to Firebase. Continue?')) {
      return
    }
    
    setIsMigrating(true)
    try {
      const result = await onMigrateToFirestore()
      alert(`Migration completed! ${result.projectsMigrated} project(s) migrated to Firebase.`)
      // Reload the page to refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error migrating to Firestore:', error)
      alert(`Error migrating to Firebase: ${error.message}`)
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Settings</h2>
      <div className="space-y-8">
        <div className="max-w-md">
          <h3 className="text-xl font-semibold mb-4">Change Admin Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-gold/30 rounded-lg focus:outline-none focus:border-gold"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-gold/30 rounded-lg focus:outline-none focus:border-gold"
                required
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-gold/80 transition-colors"
            >
              Change Password
            </button>
          </form>
        </div>

        <div className="max-w-md border-t border-gold/20 pt-6">
          <h3 className="text-xl font-semibold mb-4">Firebase Migration</h3>
          <p className="text-sm text-lightGray/70 mb-4">
            If you have projects in localStorage that aren't showing in Firebase, use this button to migrate them.
          </p>
          <button
            onClick={handleMigrateToFirestore}
            disabled={isMigrating}
            className="px-4 py-2 bg-gold/20 hover:bg-gold/30 border border-gold/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMigrating ? 'Migrating...' : 'Migrate localStorage to Firebase'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

