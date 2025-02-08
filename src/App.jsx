import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/Landing';
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'

function App() {
 

  return (
    <>
       <Router>
      <Theme>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
        </Routes>
      </Theme>
    </Router>
    </>
  )
}

export default App
