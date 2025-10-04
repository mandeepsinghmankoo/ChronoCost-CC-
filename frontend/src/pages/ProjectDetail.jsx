import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { database } from '../utils/appwrite'
import { Query, ID } from 'appwrite'
import { toast } from 'react-hot-toast'
import Container from '../components/Container'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import ErrorBoundary from '../components/ErrorBoundary'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#6366f1', '#ec4899']

const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return num.toLocaleString()
}

function ProjectDetail({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [currentPrediction, setCurrentPrediction] = useState(null)
  const [showWhatIf, setShowWhatIf] = useState(false)
  const [whatIfParams, setWhatIfParams] = useState({
    materialCost: 0,
    laborCost: 0,
    vendorReliability: 5
  })

  useEffect(() => {
    if (!user) {
      toast.error('Please log in to view project details')
      navigate('/login')
      return
    }
    fetchProjectData()
  }, [id, user])

  const fetchProjectData = async () => {
    try {
      // Get project details
      const projectResponse = await database.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION,
        id
      )

      // Check if user has access to this project
      if (projectResponse.userId !== user.$id) {
        toast.error('You do not have permission to view this project')
        navigate('/projects')
        return
      }
      
      setProject(projectResponse)

      // Get project predictions
      const predictionsResponse = await database.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PREDICTIONS_COLLECTION,
        [Query.equal('projectId', [id])]
      ).catch(predictionError => {
        console.error('Failed to fetch predictions:', predictionError)
        // Continue without predictions if unauthorized
        return { documents: [] }
      })

      setPredictions(predictionsResponse.documents)
      
      if (predictionsResponse.documents.length > 0) {
        setCurrentPrediction(predictionsResponse.documents[0])
      }

      // Initialize what-if parameters
      setWhatIfParams({
        materialCost: projectResponse.materialCost || 0,
        laborCost: projectResponse.laborCost || 0,
        vendorReliability: projectResponse.vendorReliability || 5
      })
    } catch (error) {
      console.error('Failed to fetch project data:', error)
      if (error.code === 401) {
        toast.error('Please log in to view project details')
        navigate('/login')
      } else if (error.code === 403) {
        toast.error('You do not have permission to view this project')
        navigate('/projects')
      } else {
        toast.error('Failed to load project data')
        navigate('/projects')
      }
    } finally {
      setLoading(false)
    }
  }

  const generatePrediction = async (params = null) => {
    setLoading(true)
    try {
      // Simulate ML prediction
      const baselineCost = params ? 
        params.materialCost + params.laborCost :
        project.materialCost + project.laborCost

      const reliabilityFactor = params ? 
        (10 - params.vendorReliability) * 0.05 :
        (10 - project.vendorReliability) * 0.05

      const terrainFactor = {
        flat: 1,
        hilly: 1.2,
        mountainous: 1.5,
        urban: 1.3
      }[project.terrain]

      const delayRisk = Math.min((project.historicalDelays * 0.2) + (reliabilityFactor * 0.5), 0.95)
      const predictedCost = baselineCost * (1 + reliabilityFactor) * terrainFactor
      const predictedTimeline = baselineCost * 0.0001 * terrainFactor * (1 + reliabilityFactor)

      const factorBreakdown = {
        terrain: (terrainFactor - 1) * 0.4,
        vendorReliability: reliabilityFactor * 0.3,
        historicalDelays: (project.historicalDelays * 0.05) * 0.2,
        projectComplexity: 0.1
      }

      const prediction = await database.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PREDICTIONS_COLLECTION,
        ID.unique(),
        {
          userId: user.$id,
          projectId: id,
          predictedCost,
          predictedTimeline: Math.round(predictedTimeline),
          riskProbability: delayRisk,
          factorBreakdown: JSON.stringify(factorBreakdown),
          createdAt: new Date().toISOString()
        }
      )

      setPredictions(prev => [prediction, ...prev])
      setCurrentPrediction(prediction)
      toast.success('Prediction generated successfully!')
    } catch (error) {
      console.error('Failed to generate prediction:', error)
      toast.error('Failed to generate prediction')
    } finally {
      setLoading(false)
      setShowWhatIf(false)
    }
  }

  const handleWhatIfSubmit = (e) => {
    e.preventDefault()
    generatePrediction(whatIfParams)
  }

  if (loading) {
    return (
      <Container className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </Container>
    )
  }

  if (!project) {
    return (
      <Container className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Project not found</h2>
          <button onClick={() => navigate('/projects')} className="btn btn-primary">
            Return to Projects
          </button>
        </div>
      </Container>
    )
  }

  const factorBreakdownData = currentPrediction?.factorBreakdown ? 
    Object.entries(JSON.parse(currentPrediction.factorBreakdown))
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
        value: value * 100
      })) : []

  const timelineData = predictions
    .slice()
    .reverse()
    .map((pred, index) => ({
      name: `Prediction ${index + 1}`,
      timeline: pred.predictedTimeline,
      cost: pred.predictedCost / 1000 // Convert to thousands
    }))

  return (
    <ErrorBoundary>
      <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{project.projectName}</h1>
        <p className="mt-2 text-gray-600">
          {project.projectType} • {project.location} • {project.terrain} terrain
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>
            <div className="space-y-2 text-gray-600">
              <p>Material Cost: ${formatNumber(project.materialCost)}</p>
              <p>Labor Cost: ${formatNumber(project.laborCost)}</p>
              <p>Vendor Reliability: {project.vendorReliability || 0}/10</p>
              <p>Historical Delays: {project.historicalDelays || 0}</p>
            </div>
            <div className="mt-6 space-x-4">
              <button 
                onClick={() => generatePrediction()} 
                className="btn btn-primary"
                disabled={loading}
              >
                Generate Prediction
              </button>
              <button 
                onClick={() => setShowWhatIf(!showWhatIf)} 
                className="btn btn-secondary"
              >
                What-If Analysis
              </button>
            </div>
          </div>

          {showWhatIf && (
            <div className="card mt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What-If Analysis</h2>
              <form onSubmit={handleWhatIfSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Material Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="mt-1 input"
                    value={whatIfParams.materialCost}
                    onChange={(e) => setWhatIfParams(prev => ({
                      ...prev,
                      materialCost: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Labor Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="mt-1 input"
                    value={whatIfParams.laborCost}
                    onChange={(e) => setWhatIfParams(prev => ({
                      ...prev,
                      laborCost: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Reliability (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="mt-1 input"
                    value={whatIfParams.vendorReliability}
                    onChange={(e) => setWhatIfParams(prev => ({
                      ...prev,
                      vendorReliability: parseFloat(e.target.value)
                    }))}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  Generate What-If Prediction
                </button>
              </form>
            </div>
          )}
        </div>

        {currentPrediction && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Prediction</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Predicted Cost</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${formatNumber(Math.round(currentPrediction?.predictedCost || 0))}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">Timeline (Days)</p>
                  <p className="text-2xl font-bold text-green-900">
                    {currentPrediction?.predictedTimeline || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">Risk Level</p>
                  <p className="text-2xl font-bold text-red-900">
                    {((currentPrediction?.riskProbability || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Factor Breakdown</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={factorBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                    >
                      {factorBreakdownData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {predictions.length > 1 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Prediction History</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#2563eb" />
                      <YAxis yAxisId="right" orientation="right" stroke="#16a34a" />
                      <Tooltip />
                      <Bar yAxisId="left" dataKey="timeline" name="Timeline (Days)" fill="#2563eb" />
                      <Bar yAxisId="right" dataKey="cost" name="Cost (Thousands)" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
    </ErrorBoundary>
  )
}

export default ProjectDetail