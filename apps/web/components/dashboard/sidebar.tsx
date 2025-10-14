'use client'

import { useState } from 'react'
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
  ChevronUp,
  ChevronLeft,
  HeartHandshake,
  ChevronRight
} from 'lucide-react'
import { signOut } from '@/app/actions/auth'
import Image from 'next/image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  { name: 'Events', href: '/events', icon: HeartHandshake },
  { name: 'Reports', href: '/reports', icon: FileText },
]

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const isSuperadmin = user?.role === 'superadmin'
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredNavigation = navigation.filter(
    item => !item.superadminOnly || isSuperadmin
  )

  async function handleSignout() {
    await signOut()
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={`${isCollapsed ? 'w-15' : 'w-64'} bg-gradient-to-b from-primary via-primary to-accent flex flex-col transition-all duration-300 ease-in-out relative`}>
        {/* Collapse/Expand Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 z-50 h-6 w-6 bg-accent hover:bg-accent/90 text-white shadow-md"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Logo */}
        <div className={`h-16 flex items-center my-4 ${isCollapsed ? 'justify-center px-2' : 'px-6'} transition-all duration-300`}>
          {isCollapsed ? (
            <Image
              src="/ISOTIPO-BLANCO.png"
              height={40}
              width={40}
              alt="Logo"
              onError={(e) => {
                // Fallback to text if image fails to load
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '<div class="text-white font-bold text-2xl">A</div>'
              }}
            />
          ) : (
            <Image
              src="/Acrostic-Logo-white.png"
              height={90}
              width={120}
              alt="Logo"
            />
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            const linkContent = (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center ${isCollapsed ? 'justify-center p-3' : 'p-4'} text-sm font-medium 
                  transition-colors duration-150
                  ${isActive
                    ? 'text-white font-display font-semibold bg-white/10'
                    : 'text-white font-display hover:text-white font-bold hover:bg-white/10'
                  }
                `}
              >
                <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3 -mt-1'} ${isActive ? 'text-white' : 'text-white/60'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return linkContent
          })}
        </nav>

        {/* User Profile - Footer */}
        <div className={`py-4 ${isCollapsed ? 'px-2' : 'px-4'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full focus:outline-none">
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-white text-primary font-semibold text-xs">
                          {user?.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-semibold">
                    {user?.email}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex border-t-1 border-white/40 items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-white text-primary font-semibold">
                      {user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-secondary font-semibold truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-white/50 capitalize">
                      {user?.role}
                      {user?.churches?.name && ` • ${user.churches.name}`}
                    </p>
                  </div>
                  <ChevronUp className="h-4 w-4 text-white" />
                </div>
              )}
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
    </TooltipProvider>
  )
}
