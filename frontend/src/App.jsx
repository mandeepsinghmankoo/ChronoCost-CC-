import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { account } from './utils/appwrite'
import Header from './components/Header'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import Projects from './pages/Projects'
import Profile from './pages/Profile'
import ProjectSubmission from './pages/ProjectSubmission'
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const session = await account.getSession('current')
      if (session) {
        const userData = await account.get()
        setUser(userData)
      }
    } catch (error) {
      // If no session exists, just set loading to false
      console.log('No active session')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Layout>
      <Header user={user} setUser={setUser} />
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={!user ? <Login setUser={setUser} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup setUser={setUser} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/projects" 
          element={user ? <Projects user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/projects/:id" 
          element={user ? <ProjectDetail user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/projects/new" 
          element={user ? <ProjectSubmission user={user} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Layout>
  )
}

export default App