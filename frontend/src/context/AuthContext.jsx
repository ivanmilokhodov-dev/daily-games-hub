import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const response = await api.post('/api/auth/login', { username, password })
    const { token, ...userData } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    return userData
  }

  const register = async (username, email, password, displayName) => {
    const response = await api.post('/api/auth/register', {
      username,
      email,
      password,
      displayName
    })
    const { token, ...userData } = response.data

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    return userData
  }

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/auth/me')
      const userData = response.data
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (err) {
      console.error('Failed to refresh user data')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
