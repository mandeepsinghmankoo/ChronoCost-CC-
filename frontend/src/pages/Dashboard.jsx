import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { database } from '../utils/appwrite'
import { Query } from 'appwrite'
import Container from '../components/Container'
import LoadingSpinner from '../components/LoadingSpinner'

function Dashboard({ user }) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    recentProjects: [],
    highRiskProjects: 0
  })

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Get user's projects
      const projectsResponse = await database.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION,
        [Query.equal('userId', user.$id)]
      )

      // Get predictions for risk analysis
      const predictionsResponse = await database.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PREDICTIONS_COLLECTION,
        [Query.equal('userId', user.$id)]
      )

      const highRiskCount = predictionsResponse.documents.filter(
        pred => pred.riskProbability > 0.7
      ).length

      setStats({
        totalProjects: projectsResponse.total,
        recentProjects: projectsResponse.documents.slice(0, 5),
        highRiskProjects: highRiskCount
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container className="py-12">
        <LoadingSpinner />
      </Container>
    )
  }

  return (
    <Container className="py-12">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card  border border-blue-100">
          <h3 className="text-lg font-medium text-blue-900">Total Projects</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalProjects}</p>
        </div>
        <div className="card  border border-yellow-100">
          <h3 className="text-lg font-medium text-yellow-900">High Risk Projects</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.highRiskProjects}</p>
        </div>
        <div className="card  border border-green-100">
          <h3 className="text-lg font-medium text-green-900">Active Predictions</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.recentProjects.length}</p>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">Recent Projects</h2>
          <Link to="/projects" className="btn btn-primary">View All Projects</Link>
        </div>

        {stats.recentProjects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stats.recentProjects.map(project => (
              <Link key={project.$id} to={`/projects/${project.$id}`} className="card hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900">{project.projectName}</h3>
                <p className="mt-2 text-gray-600">{project.projectType}</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Material Cost: ${project.materialCost.toLocaleString()}</p>
                  <p>Labor Cost: ${project.laborCost.toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No projects yet. Start by creating your first project!</p>
            <Link to="/projects" className="mt-4 btn btn-primary inline-block">Create Project</Link>
          </div>
        )}
      </div>
    </Container>
  )
}

export default Dashboard