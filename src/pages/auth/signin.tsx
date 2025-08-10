import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getBrowserClient } from '../../lib/supabaseClient'
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof getBrowserClient> | null>(null)
  useEffect(() => {
    // Initialize browser client only on the client to avoid SSR null
    const c = getBrowserClient()
    if (!c) {
      console.error('Failed to get browser client')
    }
    setSupabaseClient(c)
  }, [])

  const { redirectTo, loggedOut } = router.query

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      if (!supabaseClient) {
        console.error('No Supabase client available')
        return
      }

      try {
        // Use getSession() to avoid AuthSessionMissingError when no session exists
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        if (error) {
          console.warn('getSession error (likely no active session):', error)
        }
        // Do NOT auto-redirect away from the sign-in page on mount.
        // This prevents redirect loops/flashing when a stale cookie exists.
        // We'll redirect only after a successful sign-in action.
      } catch (err) {
        console.error('Exception in checkUser:', err)
      }
    }
    checkUser()
  }, [supabaseClient, router, redirectTo, loggedOut])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not available')
      }
      
      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        console.log('Login successful, preparing redirect...')
        // Wait for session to be fully available so middleware sees cookies
        const target = (typeof redirectTo === 'string' && redirectTo) ? redirectTo : '/'
        const deadline = Date.now() + 1500
        let sessionReady = false
        try {
          while (Date.now() < deadline) {
            const { data: { session } } = await supabaseClient.auth.getSession()
            if (session?.access_token) {
              sessionReady = true
              break
            }
            await new Promise(r => setTimeout(r, 100))
          }
        } catch (e) {
          // no-op
        }
        console.log('Redirecting to:', target, 'sessionReady=', sessionReady)
        setTimeout(() => {
          try {
            window.location.replace(target)
          } catch {
            window.location.href = target
          }
        }, sessionReady ? 50 : 300)
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-green-500">Beaty</span>
              <span className="text-orange-500">.pro</span>
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white">Sign in to your account</h2>

        </div>

        {/* Sign In Form */}
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
          <form onSubmit={handleSignIn} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/auth/reset-password"
                className="text-sm text-orange-400 hover:text-orange-300"
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{' '}
                <Link
                  href="/auth/signup"
                  className="font-medium text-orange-400 hover:text-orange-300"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
