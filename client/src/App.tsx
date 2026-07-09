import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Stats from './pages/Stats'
import DailyRecords from './pages/DailyRecords'
import PoopTimeline from './pages/PoopTimeline'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/stats/:date" element={<DailyRecords />} />
        <Route path="/poop" element={<PoopTimeline />} />
      </Routes>
    </div>
  )
}

export default App
