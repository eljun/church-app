import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { Toaster } from 'sonner'
import { getAuthUser } from '@/lib/utils/auth-helpers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use cached auth user helper to avoid duplicate queries
  const userData = await getAuthUser()

  if (!userData) {
    redirect('/login')
  }

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-white">
        {/* Sidebar */}
        <DashboardSidebar user={userData} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <DashboardHeader user={userData} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6 lg:px-24">
            {children}
          </main>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  )
}
