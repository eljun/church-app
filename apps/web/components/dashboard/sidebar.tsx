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
  LogOut,
  ChevronUp
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
    <aside className="w-64 bg-primary/4 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6">        
        <Image 
          src="/Acrostic-Logo-blue.png"
          height={90}
          width={120}
          alt="Logo"
          />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
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
                  ? 'text-accent font-display font-semibold'
                  : 'text-primary font-display hover:text-accent'
                }
              `}
            >
              <Icon className={`w-6 h-6 mr-3 -mt-1 ${isActive ? 'text-accent' : ''}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Profile - Footer */}
      <div className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full focus:outline-none">
            <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm text-primary font-semibold truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-accent capitalize">
                  {user?.role}
                  {user?.churches?.name && ` • ${user.churches.name}`}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 text-primary" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              {user?.churches?.name && (
                <p className="text-xs text-foreground flex items-center mt-1">
                  <Building2 className="w-3 h-3 mr-1" />
                  {user.churches.name}
                </p>
              )}
            </div>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer text-primary">
                <Settings className="w-4 h-4 mr-2 text-primary" />
                Settings
              </Link>
            </DropdownMenuItem>            
            <DropdownMenuItem
              onClick={handleSignout}
              className="cursor-pointer text-primary font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2 text-primary" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
