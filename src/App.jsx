import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing';
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import Dashboard from './pages/Dashboard'
import PredictiveAnalysis from './pages/PredictiveAnalysis';

function App() {
 

  return (
    <>
       <Router>
      <Theme>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predictive-analysis" element={<PredictiveAnalysis />} />
        </Routes>
      </Theme>
    </Router>
    </>
  )
}

export default App
