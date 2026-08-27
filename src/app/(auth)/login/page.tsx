'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!searchParams) return

    const errorParam = searchParams.get('error')
    const descriptionParam = searchParams.get('error_description')

    if (descriptionParam) {
      setError(descriptionParam)
    } else if (errorParam) {
      setError(errorParam)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center pt-20">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Masuk ke Anti-Nganggur</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Selamat datang kembali 👋 Masuk untuk melanjutkan perjalanan cari kerja kamu.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-ring"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md btn-brand-gradient px-4 py-2 text-white hover:btn-brand-gradient-hover disabled:opacity-50 font-semibold"
          >
            {loading ? 'Sedang masuk...' : 'Masuk'}
          </button>

          <p className="text-center text-sm text-foreground">
            Belum punya akun?{' '}
            <Link
              href="/signup"
              className="font-medium text-brand-primary hover:text-brand-primary/80"
            >
              Daftar sekarang
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AnimatedBackground>
      <NavBar variant="auth-pages" />
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center pt-20">
            <div className="w-full max-w-md space-y-8 p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AnimatedBackground>
  )
}
