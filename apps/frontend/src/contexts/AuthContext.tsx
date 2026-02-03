import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, type User } from '../api/client'

type AuthState = {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname: string) => Promise<void>
  guestLogin: () => Promise<void>
  logout: () => void
  updateRice: (rice: number) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'saju_battle_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })

  // 초기 로드: 저장된 토큰으로 사용자 정보 가져오기
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (!savedToken) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    authApi
      .me(savedToken)
      .then(({ user }) => {
        setState({
          user,
          token: savedToken,
          isLoading: false,
          isAuthenticated: true,
        })
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        })
      })
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await authApi.login(email, password)
    localStorage.setItem(TOKEN_KEY, token)
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  const register = useCallback(async (email: string, password: string, nickname: string) => {
    const { token, user } = await authApi.register(email, password, nickname)
    localStorage.setItem(TOKEN_KEY, token)
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  const guestLogin = useCallback(async () => {
    const { token, user } = await authApi.guest()
    localStorage.setItem(TOKEN_KEY, token)
    setState({
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    })
  }, [])

  const updateRice = useCallback((rice: number) => {
    setState((prev) => prev.user ? {
      ...prev,
      user: { ...prev.user, rice },
    } : prev)
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      guestLogin,
      logout,
      updateRice,
    }),
    [state, login, register, guestLogin, logout, updateRice],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
