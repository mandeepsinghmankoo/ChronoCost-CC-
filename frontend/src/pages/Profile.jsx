import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { database, account } from '../utils/appwrite'
import { Query } from 'appwrite'
import Container from '../components/Container'
import LoadingSpinner from '../components/LoadingSpinner'

function Profile({ user, setUser }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const response = await database.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION,
        [Query.equal('userId', user.$id)]
      )

      if (response.documents.length > 0) {
        const userProfile = response.documents[0]
        setProfile(userProfile)
        setFormData(prev => ({
          ...prev,
          name: userProfile.name
        }))
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update name in profile collection
      await database.updateDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION,
        profile.$id,
        { name: formData.name }
      )

      // Update name in account
      await account.updateName(formData.name)

      // Update user state
      const updatedUser = await account.get()
      setUser(updatedUser)

      toast.success('Profile updated successfully!')
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }))
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmNewPassword) {
      toast.error('New passwords do not match')
      return
    }

    setLoading(true)

    try {
      await account.updatePassword(formData.newPassword, formData.currentPassword)
      toast.success('Password updated successfully!')
      
      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }))
    } catch (error) {
      console.error('Failed to update password:', error)
      toast.error('Failed to update password')
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

  if (loading && !profile) {
    return (
      <Container className="py-12">
        <LoadingSpinner />
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <div className="grid grid-cols-1 gap-8 max-w-2xl">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Update Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
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
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-600">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-gray-600">{profile.role}</p>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                className="mt-1 input"
                value={formData.currentPassword}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={8}
                className="mt-1 input"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmNewPassword"
                name="confirmNewPassword"
                type="password"
                required
                minLength={8}
                className="mt-1 input"
                value={formData.confirmNewPassword}
                onChange={handleChange}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </Container>
  )
}

export default Profile