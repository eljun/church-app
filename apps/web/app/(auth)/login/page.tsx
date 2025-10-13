/**
 * Login Page
 * Password-based authentication for admins
 */

'use client'

import { login } from '@/app/actions/auth'
import Link from 'next/link'
import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
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
            alt="Church Management System Logo"
            priority
          />
        </div>

        <Card className="w-full bg-transparent text-white border-0 shadow-none">
          <CardHeader className="space-y-1">
            {/* <CardTitle className="text-2xl font-bold text-center">
              Church Membership System
            </CardTitle> */}
            <CardDescription className="text-2xl text-center text-white/80">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"                
                autoComplete="email"
                required
                disabled={loading}
                className="border border-white/70 py-5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                className="border border-white/70 py-5"
              />
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
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
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
