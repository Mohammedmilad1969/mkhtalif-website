import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Moukhtalif3DLanding from './components/Moukhtalif3DLanding'
import ProjectPage from './pages/ProjectPage'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Moukhtalif3DLanding />} />
        <Route path="/projects/:projectId" element={<ProjectPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  )
}

export default App

