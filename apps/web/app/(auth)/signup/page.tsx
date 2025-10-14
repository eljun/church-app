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
import { AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
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
            alt="Church Membership System Logo"
            priority
          />
        </div>

        <Card className="w-full bg-transparent border-0 shadow-none text-white">
          <CardHeader className="space-y-1">
            {/* <CardTitle className="text-2xl font-bold text-center">
              Create your account
            </CardTitle> */}
            <CardDescription className="text-2xl text-center text-white">
              Sign up for Church Membership System
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
                placeholder="Enter your email"
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
                autoComplete="new-password"
                placeholder="Enter your password (min. 6 characters)"
                minLength={6}
                required
                disabled={loading}
                className="border border-white/70 py-5"
              />
            </div>

            <div className="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                After signup, a superadmin needs to assign your role and church access.
              </p>
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
              className="w-full"
              size="lg"
              variant="secondary"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>

            <p className="text-sm text-center text-white/80">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-white hover:text-accent">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
        </Card>
      </div>
    </div>
  )
}
