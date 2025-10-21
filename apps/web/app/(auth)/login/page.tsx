/**
 * Login Page
 * Password-based authentication for admins
 */

'use client'

import { login } from '@/app/actions/auth'
import Link from 'next/link'
import { useState, useEffect, Suspense, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react'

function LoginForm() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [deactivatedMessage, setDeactivatedMessage] = useState(false)

  useEffect(() => {
    if (searchParams.get('deactivated') === 'true') {
      setDeactivatedMessage(true)
    }
  }, [searchParams])

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await login(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
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
            alt="Church Management System Logo"
            priority
          />
        </div>

        <Card className="w-full bg-transparent text-white border-0 shadow-none">
          <CardHeader className="space-y-1">
            {/* <CardTitle className="text-2xl  text-center">
              Church Membership System
            </CardTitle> */}
            <CardDescription className="text-2xl text-center text-white/80">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {deactivatedMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your account has been deactivated. Please contact your administrator for assistance.
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                required
                disabled={isPending}
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={isPending}
                  className="border border-white/70 py-5  placeholder:text-white/60 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
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

            {error && (
              <div className="rounded-lg bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex mt-4 flex-col space-y-4">
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <p className="text-sm text-center text-white/80">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-white hover:text-accent">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-accent"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
