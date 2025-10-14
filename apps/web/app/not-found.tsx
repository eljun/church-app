import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-accent p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/Full-white-logo.png"
            height={100}
            width={180}
            alt="Church Membership System Logo"
            priority
          />
        </div>

        {/* 404 Content */}
        <div className="space-y-4">
          <h1 className="font-display text-8xl  text-white">
            404
          </h1>
          <h2 className="font-display text-3xl font-semibold text-white">
            Page Not Found
          </h2>
          <p className="text-lg text-white/80 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="min-w-[200px]"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go to Dashboard
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="min-w-[200px] bg-white/10 text-white border-white/30 hover:bg-white/20"
          >
            <Link href="javascript:history.back()">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="pt-8 text-white/60 text-sm">
          <p>
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
