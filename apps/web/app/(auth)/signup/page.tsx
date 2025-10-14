/**
 * Signup Page
 * Account creation for new admins
 * Note: After signup, a superadmin needs to manually assign role and church in the users table
 */

'use client'

import { signup } from '@/app/actions/auth'
import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { AlertCircle, Loader2, Mail, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-accent py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/Full-white-logo.png"
            height={120}
            width={200}
            alt="Church Membership System Logo"
            priority
          />
        </div>

        <Card className="w-full bg-transparent border-0 shadow-none text-white">
          <CardHeader className="space-y-1">
            {/* <CardTitle className="text-2xl  text-center">
              Create your account
            </CardTitle> */}
            <CardDescription className="text-2xl text-center text-white">
              {success ? 'Check your email' : 'Sign up for Church Membership System'}
            </CardDescription>
          </CardHeader>

        {success ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <div className="rounded-full bg-green-100 p-3">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-white">Verification email sent!</h3>
                <p className="text-sm text-white/80 max-w-sm">
                  We&apos;ve sent a confirmation link to your email address.
                  Please check your inbox and click the link to verify your account.
                </p>
              </div>
              <div className="flex gap-3 p-3 bg-blue-50/10 border border-blue-200/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/90">
                  After verifying your email, a superadmin will need to assign your role and church access before you can sign in.
                </p>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/login" className="block">
                <Button
                  type="button"
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        ) : (
          <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                required
                disabled={loading}
                className="border border-white/70 py-5  placeholder:text-white/60"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Enter your password (min. 6 characters)"
                  minLength={6}
                  required
                  disabled={loading}
                  className="border border-white/70 py-5  placeholder:text-white/60 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 focus:outline-none disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                After signup, a superadmin needs to assign your role and church access.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex mt-4 flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              size="lg"
              variant="secondary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </Button>

            <p className="text-sm text-center text-white/80">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-white hover:text-accent">
                Sign in
              </Link>
            </p>
          </CardFooter>
          </form>
        )}
        </Card>
      </div>
    </div>
  )
}
