import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Stats from './pages/Stats'
import DailyRecords from './pages/DailyRecords'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/stats/:date" element={<DailyRecords />} />
      </Routes>
    </div>
  )
}

export default App
