import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { database } from '../utils/appwrite'
import { Query } from 'appwrite'
import Container from '../components/Container'
import LoadingSpinner from '../components/LoadingSpinner'

function Projects({ user }) {
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchProjects()
  }, [user])

  const fetchProjects = async () => {
    try {
      const response = await database.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      )
      setProjects(response.documents)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {loading ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <LoadingSpinner />
        </div>
      ) : (
        <Container className="py-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-red-100">Your Projects</h1>
            <Link to="/projects/new" className="btn btn-primary">
              New Project
            </Link>
          </div>
          
          {projects.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map(project => (
                <Link 
                  key={project.$id} 
                  to={`/projects/${project.$id}`}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-semibold text-gray-900">{project.projectName}</h3>
                  <p className="mt-2 text-gray-600">{project.projectType}</p>
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Location: {project.location}</p>
                    <p>Estimated Budget: ${project.estimatedBudget.toLocaleString()}</p>
                    <p>Duration: {project.estimatedDuration} months</p>
                    <p>Risk Score: {(project.riskScore * 100).toFixed(1)}%</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No projects yet. Start by creating your first project!</p>
              <Link 
                to="/projects/new"
                className="mt-4 btn btn-primary inline-block"
              >
                Create First Project
              </Link>
            </div>
          )}
        </Container>
      )}
    </div>
  )
}

export default Projects