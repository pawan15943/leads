"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: number
  name: string
  email: string
  phone?: string
  role_id: number | null
  role: { id: number; name: string; slug: string } | null
  status: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
  isAdmin: boolean
  isBD: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const isAdmin = user?.role?.slug === "super-admin"
  const isBD = user?.role?.slug === "bd-user"

  async function fetchUser() {
    const t = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!t) {
      setUser(null)
      setToken(null)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    try {
      const res = await fetch(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${t}`, Accept: "application/json" },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setToken(t)
      } else {
        localStorage.removeItem("token")
        setUser(null)
        setToken(null)
      }
    } catch {
      localStorage.removeItem("token")
      setUser(null)
      setToken(null)
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  async function login(email: string, password: string) {
    let res: Response
    try {
      res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      })
    } catch (err) {
      throw new Error("Network error. Please check your connection and try again.")
    }
    const text = await res.text()
    let data: { token?: string; user?: unknown; message?: string }
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      throw new Error(res.ok ? "Invalid response from server" : "Login failed. Please try again.")
    }
    if (!res.ok) throw new Error(data.message || "Invalid email or password")
    if (!data.token || !data.user) throw new Error("Invalid response from server")
    localStorage.setItem("token", data.token)
    setToken(data.token)
    setUser(data.user as User)
  }

  async function logout() {
    const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null)
    try {
      if (t) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${t}`, Accept: "application/json" },
        })
      }
    } catch {
      // Proceed with local logout even if API fails
    }
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, fetchUser, isAdmin, isBD }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
