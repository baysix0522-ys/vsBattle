import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import BirthInput from './pages/BirthInput'
import TodayFortune from './pages/TodayFortune'
import FortuneHistory from './pages/FortuneHistory'
import FortuneRecordDetail from './pages/FortuneRecordDetail'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/fortune/input" element={<BirthInput />} />
          <Route path="/fortune/today" element={<TodayFortune />} />
          <Route path="/fortune/history" element={<FortuneHistory />} />
          <Route path="/fortune/record/:id" element={<FortuneRecordDetail />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
