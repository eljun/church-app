'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  ArrowLeftRight,
  FileText,
  Settings,
  LogOut
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'

interface UserData {
  id: string
  email: string
  role: 'superadmin' | 'admin' | 'member'
  church_id: string | null
  churches?: {
    name: string
  } | null
}

interface SidebarProps {
  user: UserData | null
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Churches', href: '/churches', icon: Building2, superadminOnly: true },
  { name: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
  { name: 'Reports', href: '/reports', icon: FileText },
]

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const isSuperadmin = user?.role === 'superadmin'

  const filteredNavigation = navigation.filter(
    item => !item.superadminOnly || isSuperadmin
  )

  async function handleSignout() {
    await signOut()
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Church App</h1>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role}
            </p>
          </div>
        </div>
        {user?.churches?.name && (
          <div className="mt-2 text-xs text-gray-600 flex items-center">
            <Building2 className="w-3 h-3 mr-1" />
            {user.churches.name}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-lg
                transition-colors duration-150
                ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Settings and logout */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-1">
        <Link
          href="/settings"
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
        >
          <Settings className="w-5 h-5 mr-3 text-gray-400" />
          Settings
        </Link>
        <button
          onClick={handleSignout}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
        >
          <LogOut className="w-5 h-5 mr-3 text-gray-400" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
