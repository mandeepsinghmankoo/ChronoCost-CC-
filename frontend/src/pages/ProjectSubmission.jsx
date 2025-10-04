import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { database } from '../utils/appwrite'
import { ID } from 'appwrite'
import Container from '../components/Container'
import LoadingSpinner from '../components/LoadingSpinner'

function ProjectSubmission({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [csvFile, setCsvFile] = useState(null)

  // Available picklists
  const project_types = ['Construction', 'Software', 'Infrastructure', 'IT', 'Engineering']
  const regions = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad']
  const categoriesList = ['Residential', 'Commercial', 'Industrial', 'Web', 'Mobile', 'Road', 'Bridge']

  const [formData, setFormData] = useState({
    companyName: '',
    projectName: '',
    projectType: 'Construction',
    location: '',
    terrain: 'flat',
    estimatedBudget: '',
    estimatedDuration: '',
    scopeDescription: '',
    riskFactors: '',
    hasHistoricalData: false,
    categories: '',
    // Additional fields for backend API
    project_size: '',
    labor_cost: '',
    material_cost: '',
    equipment_cost: '',
    overhead_cost: '',
    year: new Date().getFullYear(),
    inflation_rate: 5.5,
    delays: 0,
    rework_percent: 0,
    safety_incidents: 0
  })

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type !== 'text/csv') {
      toast.error('Please upload a CSV file')
      return
    }
    setCsvFile(file)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => {
      const next = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }
      // If project type changed, and it's Software, set terrain to 'na_software'
      if (name === 'projectType') {
        if (value === 'Software') {
          next.terrain = 'na_software'
        } else if (prev.terrain === 'na_software') {
          next.terrain = 'flat'
        }
      }
      return next
    })
  }

  const processCSV = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target.result
        const rows = text.split('\n').map(row => row.split(','))
        const headers = rows[0]
        const data = rows.slice(1).map(row => {
          const obj = {}
          headers.forEach((header, i) => {
            obj[header.trim()] = row[i]?.trim()
          })
          return obj
        })
        resolve(data)
      }
      reader.readAsText(file)
    })
  }

  // Call backend for prediction
  const callBackendPrediction = async (backendData) => {
    try {
      console.log('Sending data to backend:', backendData)
      
      const response = await fetch('http://localhost:8000/api/inference/predict/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData)
      })

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`)
      }

      const result = await response.json()
      console.log('Backend prediction result:', result)
      return result
    } catch (error) {
      console.error('Backend prediction failed:', error)
      throw error
    }
  }

  // Call backend for scenario analysis
  const callBackendScenarios = async (backendData) => {
    try {
      const response = await fetch('http://localhost:8000/api/inference/scenarios/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData)
      })

      if (!response.ok) {
        throw new Error(`Scenario analysis error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Scenario analysis failed:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for backend
      const backendData = {
        project_type: formData.projectType,
        category: formData.categories,
        project_size: parseFloat(formData.project_size) || parseFloat(formData.estimatedBudget) / 100000, // Default calculation
        project_duration: parseFloat(formData.estimatedDuration) || 0,
        labor_cost: parseFloat(formData.labor_cost) || parseFloat(formData.estimatedBudget) * 0.3, // Default 30%
        material_cost: parseFloat(formData.material_cost) || parseFloat(formData.estimatedBudget) * 0.4, // Default 40%
        equipment_cost: parseFloat(formData.equipment_cost) || parseFloat(formData.estimatedBudget) * 0.2, // Default 20%
        overhead_cost: parseFloat(formData.overhead_cost) || parseFloat(formData.estimatedBudget) * 0.1, // Default 10%
        region: formData.location,
        year: parseInt(formData.year),
        inflation_rate: parseFloat(formData.inflation_rate) || 0,
        delays: parseFloat(formData.delays) || 0,
        rework_percent: parseFloat(formData.rework_percent) || 0,
        safety_incidents: parseInt(formData.safety_incidents) || 0
      }

      let historicalData = []
      if (csvFile) {
        historicalData = await processCSV(csvFile)
      }

      // Call backend for AI prediction
      const predictionResult = await callBackendPrediction(backendData)
      
      // Call backend for scenario analysis
      const scenarioResult = await callBackendScenarios(backendData)

      // Calculate risk score based on backend prediction
      const riskScore = predictionResult.prediction.contingency_percent / 100

      // Flatten historical data summary
      const historicalProjectCount = historicalData.length > 0 ? historicalData.length : null
      const historicalAvgDuration = historicalData.length > 0 ? calculateAverageDuration(historicalData) : null
      const historicalAvgCost = historicalData.length > 0 ? calculateAverageCost(historicalData) : null
      const historicalDelayFrequency = historicalData.length > 0 ? calculateDelayFrequency(historicalData) : null

      // Create project document
      const project = await database.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_PROJECTS_COLLECTION,
        ID.unique(),
        {
          userId: user.$id,
          companyName: formData.companyName,
          projectName: formData.projectName,
          projectType: formData.projectType,
          location: formData.location,
          terrain: formData.terrain,
          categories: formData.categories,
          estimatedBudget: parseFloat(formData.estimatedBudget),
          estimatedDuration: parseInt(formData.estimatedDuration),
          scopeDescription: formData.scopeDescription,
          riskFactors: formData.riskFactors,
          hasHistoricalData: formData.hasHistoricalData,
          riskScore,
          
          // Store AI results from backend
          aiPrediction: {
            predictedCost: predictionResult.prediction.predicted_cost,
            baseCost: predictionResult.prediction.base_cost,
            riskAdjustment: predictionResult.prediction.risk_adjustment,
            contingencyPercent: predictionResult.prediction.contingency_percent,
            highRiskAreas: predictionResult.prediction.high_risk_areas,
            recommendations: predictionResult.recommendations
          },
          
          scenarioAnalysis: scenarioResult.scenario_analysis,
          
          // ✅ Flattened historical fields
          historicalProjectCount,
          historicalAvgDuration,
          historicalAvgCost,
          historicalDelayFrequency,

          // Store the input data for reference
          backendInput: backendData
        }
      )

      toast.success('Project submitted successfully! AI analysis completed.')
      navigate(`/projects/${project.$id}`)

    } catch (error) {
      console.error('Failed to submit project:', error)
      
      if (error.message.includes('Backend error') || error.message.includes('Failed to fetch')) {
        toast.error('AI service temporarily unavailable. Please try again later.')
      } else {
        toast.error('Failed to submit project')
      }
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const calculateAverageDuration = (data) => {
    const durations = data.map(item => parseFloat(item.duration)).filter(Boolean)
    return durations.reduce((a, b) => a + b, 0) / durations.length
  }

  const calculateAverageCost = (data) => {
    const costs = data.map(item => parseFloat(item.cost)).filter(Boolean)
    return costs.reduce((a, b) => a + b, 0) / costs.length
  }

  const calculateDelayFrequency = (data) => {
    const delayedProjects = data.filter(item => item.delayed === 'true' || item.delayed === '1').length
    return delayedProjects / data.length
  }

  const calculateCostOverrunFrequency = (data) => {
    const overrunProjects = data.filter(item => {
      const actualCost = parseFloat(item.actualCost)
      const estimatedCost = parseFloat(item.estimatedCost)
      return actualCost > estimatedCost * 1.1
    }).length
    return overrunProjects / data.length
  }

  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-red-100 mb-8">Submit Project Details</h1>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">AI-Powered Cost Prediction</h3>
          <p className="text-blue-700">
            Our AI will analyze your project details and provide accurate cost predictions, 
            risk analysis, and scenario simulations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Basic Information --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-700 mb-6">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-200">Company Name</label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  className="mt-1 input"
                  value={formData.companyName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-200">Project Name</label>
                <input
                  id="projectName"
                  name="projectName"
                  type="text"
                  required
                  className="mt-1 input"
                  value={formData.projectName}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* --- Project Specifications --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Project Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="projectType" className="block text-sm font-medium text-gray-200">Project Type</label>
                <select id="projectType" name="projectType" required className="mt-1 input" value={formData.projectType} onChange={handleChange}>
                  {project_types.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="terrain" className="block text-sm font-medium text-gray-200">Terrain Type</label>
                <select id="terrain" name="terrain" required className="mt-1 input" value={formData.terrain} onChange={handleChange}>
                  {formData.projectType === 'Software' ? (
                    <option value="na_software">N/A (software)</option>
                  ) : (
                    <>
                      <option value="flat">Flat</option>
                      <option value="hilly">Hilly</option>
                      <option value="mountainous">Mountainous</option>
                      <option value="urban">Urban</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-200">Location</label>
                <select id="location" name="location" required className="mt-1 input" value={formData.location} onChange={handleChange}>
                  <option value="">Select region</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="categories" className="block text-sm font-medium text-gray-200">Categories</label>
                <select id="categories" name="categories" className="mt-1 input" value={formData.categories} onChange={handleChange}>
                  <option value="">Select category</option>
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="estimatedBudget" className="block text-sm font-medium text-gray-200">Estimated Budget ($)</label>
                <input id="estimatedBudget" name="estimatedBudget" type="number" min="0" required className="mt-1 input" value={formData.estimatedBudget} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-200">Estimated Duration (months)</label>
                <input id="estimatedDuration" name="estimatedDuration" type="number" min="1" required className="mt-1 input" value={formData.estimatedDuration} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="project_size" className="block text-sm font-medium text-gray-200">
                  Project Size (sq ft / complexity)
                </label>
                <input
                  id="project_size"
                  name="project_size"
                  type="number"
                  min="0"
                  className="mt-1 input"
                  value={formData.project_size}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                />
              </div>
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-200">
                  Project Year
                </label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  min="2020"
                  max="2030"
                  required
                  className="mt-1 input"
                  value={formData.year}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* --- Cost Breakdown --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Cost Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="labor_cost" className="block text-sm font-medium text-gray-200">
                  Labor Cost ($)
                </label>
                <input
                  id="labor_cost"
                  name="labor_cost"
                  type="number"
                  min="0"
                  className="mt-1 input"
                  value={formData.labor_cost}
                  onChange={handleChange}
                  placeholder="e.g., 500000"
                />
              </div>

              <div>
                <label htmlFor="material_cost" className="block text-sm font-medium text-gray-200">
                  Material Cost ($)
                </label>
                <input
                  id="material_cost"
                  name="material_cost"
                  type="number"
                  min="0"
                  className="mt-1 input"
                  value={formData.material_cost}
                  onChange={handleChange}
                  placeholder="e.g., 800000"
                />
              </div>

              <div>
                <label htmlFor="equipment_cost" className="block text-sm font-medium text-gray-200">
                  Equipment Cost ($)
                </label>
                <input
                  id="equipment_cost"
                  name="equipment_cost"
                  type="number"
                  min="0"
                  className="mt-1 input"
                  value={formData.equipment_cost}
                  onChange={handleChange}
                  placeholder="e.g., 200000"
                />
              </div>

              <div>
                <label htmlFor="overhead_cost" className="block text-sm font-medium text-gray-200">
                  Overhead Cost ($)
                </label>
                <input
                  id="overhead_cost"
                  name="overhead_cost"
                  type="number"
                  min="0"
                  className="mt-1 input"
                  value={formData.overhead_cost}
                  onChange={handleChange}
                  placeholder="e.g., 100000"
                />
              </div>
            </div>
          </div>

          {/* --- Risk Factors --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Risk Factors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="inflation_rate" className="block text-sm font-medium text-gray-200">
                  Inflation Rate (%)
                </label>
                <input
                  id="inflation_rate"
                  name="inflation_rate"
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  className="mt-1 input"
                  value={formData.inflation_rate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="delays" className="block text-sm font-medium text-gray-200">
                  Expected Delays (days)
                </label>
                <input
                  id="delays"
                  name="delays"
                  type="number"
                  min="0"
                  className="mt-1 input"
                  value={formData.delays}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="rework_percent" className="block text-sm font-medium text-gray-200">
                  Rework Percentage (%)
                </label>
                <input
                  id="rework_percent"
                  name="rework_percent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="mt-1 input"
                  value={formData.rework_percent}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="safety_incidents" className="block text-sm font-medium text-gray-200">
                  Safety Incidents
                </label>
                <input
                  id="safety_incidents"
                  name="safety_incidents"
                  type="number"
                  min="0"
                  className="mt-1 input"
                  value={formData.safety_incidents}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* --- Project Details --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Project Details</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="scopeDescription" className="block text-sm font-medium text-gray-200">Project Scope Description</label>
                <textarea id="scopeDescription" name="scopeDescription" rows={4} className="mt-1 input" value={formData.scopeDescription} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="riskFactors" className="block text-sm font-medium text-gray-200">Known Risk Factors</label>
                <textarea id="riskFactors" name="riskFactors" rows={3} className="mt-1 input" placeholder="List any known risk factors, separated by commas" value={formData.riskFactors} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* --- Historical Data --- */}
          <div className="card">
            <h2 className="text-xl font-semibold text-red-800 mb-6">Historical Data</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input id="hasHistoricalData" name="hasHistoricalData" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" checked={formData.hasHistoricalData} onChange={handleChange} />
                <label htmlFor="hasHistoricalData" className="ml-2 block text-sm text-gray-200">We have historical project data to upload</label>
              </div>

              {formData.hasHistoricalData && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-200">Upload Historical Data (CSV)</label>
                  <input type="file" accept=".csv" onChange={handleFileChange} className="mt-2 text-gray-200" />
                  {csvFile && <p className="text-sm text-blue-400 mt-2">{csvFile.name}</p>}
                  <p className="mt-2 text-sm text-gray-400">
                    CSV should include columns: projectName, duration, cost, delayed, actualCost, estimatedCost
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* --- Buttons --- */}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={() => navigate('/projects')} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || (formData.hasHistoricalData && !csvFile)}>
              {loading ? (
                <span className="flex items-center">
                  <LoadingSpinner size="small" />
                  <span className="ml-2">AI Analysis in Progress...</span>
                </span>
              ) : (
                'Submit Project for AI Analysis'
              )}
            </button>
          </div>
        </form>
      </div>
    </Container>
  )
}

export default ProjectSubmission