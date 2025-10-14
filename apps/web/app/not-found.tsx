import Link from 'next/link'
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
          <h1 className="font-display text-4xl text-primary">
            404
          </h1>
          <h2 className="font-display text-2xl">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to access it.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button
            asChild
            size="lg"
            className="min-w-[200px]"
          >
            <Link href="/">
              Go to Dashboard
            </Link>
          </Button>          
        </div>

        {/* Help Text */}
        <div className="pt-8 text-gray-500 text-sm">
          <p>
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
