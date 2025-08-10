import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { getBrowserClient } from '../../lib/supabaseClient'
import { Zap, Loader2, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof getBrowserClient> | null>(null)
  useEffect(() => {
    const c = getBrowserClient()
    if (!c) console.error('Failed to get browser client')
    setSupabaseClient(c)
  }, [])

  useEffect(() => {
    // Check if user is already authenticated
    const checkUser = async () => {
      if (!supabaseClient) {
        console.error('No Supabase client available')
        return
      }

      try {
        // Use getSession to avoid AuthSessionMissingError when no session exists
        const { data: { session }, error } = await supabaseClient.auth.getSession()
        if (error) {
          console.warn('getSession error (likely no active session):', error)
        }
        if (session?.user) {
          router.push('/')
        }
      } catch (err) {
        console.error('Exception in checkUser:', err)
      }
    }
    checkUser()
  }, [supabaseClient, router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (!supabaseClient) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/signin`,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for the password reset link!')
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred')
      console.error('Reset password error:', error)
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
          <h2 className="text-3xl font-bold text-white">Reset your password</h2>
          <p className="mt-2 text-sm text-slate-400">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Reset Password Form */}
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
          <form onSubmit={handleResetPassword} className="space-y-6">
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded">
                {message}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Send reset link'
              )}
            </button>

            <div className="text-center">
              <Link
                href="/auth/signin"
                className="inline-flex items-center text-sm text-orange-400 hover:text-orange-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
