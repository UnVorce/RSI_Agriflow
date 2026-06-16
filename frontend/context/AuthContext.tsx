'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api, setToken, setRefreshToken, clearTokens, getToken } from '@/lib/api'

export interface User {
  userId: string
  email: string
  name: string
  role: 'DISTRIBUTOR' | 'PENGECER' | 'PEMERINTAH'
  status: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
}

interface RegisterData {
  fullname: string
  email: string
  password: string
  role: string
  proof: File
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (token) {
      const stored = localStorage.getItem('agriflow_user')
      if (stored) {
        try {
          setUser(JSON.parse(stored))
        } catch {
          clearTokens()
        }
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{
      accessToken: string
      refreshToken: string
      user: User
    }>('/api/auth/login', { email, password })

    if (!res.data) throw new Error('Login gagal')

    setToken(res.data.accessToken)
    setRefreshToken(res.data.refreshToken)
    localStorage.setItem('agriflow_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const formData = new FormData()
    formData.append('fullname', data.fullname)
    formData.append('email', data.email)
    formData.append('password', data.password)
    formData.append('role', data.role)
    formData.append('proof', data.proof)

    await api.post('/api/auth/register', formData, { formData: true })
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // proceed even if API call fails
    }
    clearTokens()
    localStorage.removeItem('agriflow_user')
    setUser(null)
    router.push('/login')
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
