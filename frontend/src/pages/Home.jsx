import { Link } from 'react-router-dom'
import Container from '../components/Container'

function Home() {
  return (
    <main>
      <div className="bg-custom-gradient">
        <Container>
          <div className="py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* Left: title, subtitle, description, CTAs */}
              <div className="text-left">
                <div className="text-6xl font-bold rounded-full ">
                  ChronoCost :
                </div>

                <h1 className="text-4xl font-bold text-white sm:text-5xl">
                  Smart Cost Prediction for Infrastructure Projects
                </h1>
                <h2 className="mt-4 text-xl text-gray-200">Predict costs, timelines & risks with AI</h2>

                <p className="mt-6 text-lg text-gray-200 max-w-2xl">
                  ChronoCost uses AI to predict project costs, timelines, and delay risks for infrastructure projects. Make data-driven decisions with our intelligent prediction system.
                </p>

                <div className="mt-8 flex gap-4">
                  <Link to="/signup" className="btn bg-white text-gradient-end hover:bg-gray-100 text-xl px-8 py-3">
                    Lets Start....
                  </Link>
                  
                </div>
              </div>

              {/* Right: stacked images from public folder */}
              <div className="space-y-6">
                <img src="/home1.png" alt="Home 1" className="w-full rounded-lg shadow-lg object-cover h-48 sm:h-64 md:h-80" />
                <img src="/home2.png" alt="Home 2" className="w-full rounded-lg shadow-lg object-cover object-top h-48 sm:h-64 md:h-80" />
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="card border border-gradient-start/20 hover:border-gradient-start/40 transition-colors">
              <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gradient-end">Smart Estimation</h3>
              <p className="mt-2 text-gray-600">AI-powered cost and timeline predictions based on historical data and project parameters.</p>
            </div>
            <div className="card border border-gradient-mid/20 hover:border-gradient-mid/40 transition-colors">
              <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gradient-end">Dynamic What-If</h3>
              <p className="mt-2 text-gray-600">Simulate different scenarios by adjusting project parameters and see real-time prediction changes.</p>
            </div>
            <div className="card border border-gradient-end/20 hover:border-gradient-end/40 transition-colors">
              <div className="w-12 h-12 mb-4 rounded-lg bg-gradient-to-br from-gradient-start to-gradient-end flex items-center justify-center text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gradient-end">Trusted Predictions</h3>
              <p className="mt-2 text-gray-600">Explainable AI provides transparent factor breakdowns and confidence scores.</p>
            </div>
          </div>
        </div>
      </Container>
    </main>
  )
}

export default Home