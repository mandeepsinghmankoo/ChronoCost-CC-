import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { account, database } from '../utils/appwrite'
import { ID } from 'appwrite'
import Container from '../components/Container'

function Signup({ setUser }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if user exists first
      try {
        await account.get()
        toast.error('An account with this email already exists')
        return
      } catch (error) {
        // Expected error if user doesn't exist
      }

      // Create user account
      const response = await account.create(
        ID.unique(),
        formData.email,
        formData.password,
        formData.name
      )

      // Create user profile in database
      await database.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION,
        ID.unique(),
        {
          userId: response.$id,
          name: formData.name,
          email: formData.email,
          role: 'project_manager'
        }
      )

      // Log in the user
      await account.createEmailSession(formData.email, formData.password)
      const user = await account.get()
      setUser(user)
      
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (error) {
      console.error('Signup failed:', error)
      if (error.code === 409) {
        toast.error('An account with this email already exists. Please try logging in instead.')
      } else {
        toast.error('Signup failed. Please check your information and try again.')
      }
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
        <h2 className="text-2xl font-bold text-center text-gray-900">Create your account</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 input"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
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
              minLength={8}
            />
          </div>
          <button 
            type="submit" 
            className="w-full btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?
          <Link to="/login" className="ml-1 text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </Container>
  )
}

export default Signup