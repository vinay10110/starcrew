import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
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
