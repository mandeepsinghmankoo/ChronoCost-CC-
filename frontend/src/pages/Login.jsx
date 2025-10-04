import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { account } from '../utils/appwrite'
import Container from '../components/Container'

function Login({ setUser }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await account.createEmailSession(formData.email, formData.password)
      const user = await account.get()
      setUser(user)
      toast.success('Logged in successfully!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <Container className="py-20">
      <div className="max-w-md mx-auto card">
        <h2 className="text-2xl font-bold text-center text-gray-900">Login to ChronoCost</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 input"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 input"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <button 
            type="submit" 
            className="w-full btn btn-primary" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?
          <Link to="/signup" className="ml-1 text-blue-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </Container>
  )
}

export default Login