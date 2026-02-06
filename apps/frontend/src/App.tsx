import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import Home from './pages/Home'
import BirthInput from './pages/BirthInput'
import TodayFortune from './pages/TodayFortune'
import FortuneHistory from './pages/FortuneHistory'
import FortuneRecordDetail from './pages/FortuneRecordDetail'
import KakaoCallback from './pages/KakaoCallback'
import Tarot from './pages/Tarot'
import TennisTarot from './pages/TennisTarot'
import BattleInput from './pages/BattleInput'
import BattleReport from './pages/BattleReport'
import BattleJoin from './pages/BattleJoin'
import BattleResult from './pages/BattleResult'
import MyPage from './pages/MyPage'
import NameInput from './pages/NameInput'
import NameResult from './pages/NameResult'

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
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/tarot" element={<Tarot />} />
          <Route path="/tennis-tarot" element={<TennisTarot />} />
          {/* Battle routes */}
          <Route path="/battle" element={<BattleInput />} />
          <Route path="/battle/report" element={<BattleReport />} />
          <Route path="/battle/join/:shareCode" element={<BattleJoin />} />
          <Route path="/battle/result/:battleId" element={<BattleResult />} />
          {/* MyPage */}
          <Route path="/mypage" element={<MyPage />} />
          {/* Name Analysis (이름 풀이) */}
          <Route path="/name" element={<NameInput />} />
          <Route path="/name/result" element={<NameResult />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
