import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Shield, Bell, Palette, Database, Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Settings',
  description: 'Manage system settings and preferences',
}

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) {
    redirect('/login')
  }

  // Get user details with role
  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single()

  if (!currentUser) {
    redirect('/login')
  }

  const isSuperadmin = currentUser.role === 'superadmin'

  const settingsCategories = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/settings/users',
      color: 'text-primary',
      superadminOnly: true,
    },
    {
      title: 'Security',
      description: 'Configure security settings and authentication',
      icon: Shield,
      href: '/settings/security',
      color: 'text-primary',
      superadminOnly: true,
    },
    {
      title: 'Notifications',
      description: 'Manage email and system notifications',
      icon: Bell,
      href: '/settings/notifications',
      color: 'text-primary',
      superadminOnly: false,
    },
    {
      title: 'Appearance',
      description: 'Customize theme and display preferences',
      icon: Palette,
      href: '/settings/appearance',
      color: 'text-primary',
      superadminOnly: false,
    },
    {
      title: 'Data Management',
      description: 'Backup, restore, and export data',
      icon: Database,
      href: '/settings/data',
      color: 'text-primary',
      superadminOnly: true,
    },
    {
      title: 'API Keys',
      description: 'Manage API keys and integrations',
      icon: Key,
      href: '/settings/api',
      color: 'text-primary',
      superadminOnly: true,
    },
  ]

  // Filter categories based on role
  const availableCategories = isSuperadmin
    ? settingsCategories
    : settingsCategories.filter((cat) => !cat.superadminOnly)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl text-primary">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your system settings and preferences
        </p>
      </div>

      {/* Settings categories */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {availableCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.href} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {category.description}
                    </CardDescription>
                  </div>
                  <Icon className={`h-6 w-6 ${category.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={category.href}>
                    Configure
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Coming Soon Notice for non-implemented settings */}
      <Card className="border-dashed">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground text-sm">
            Additional settings pages are coming soon. Currently, only User Management is available.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
