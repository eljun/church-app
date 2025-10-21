'use client'

import { Bell } from 'lucide-react'

interface UserData {
  id: string
  email: string
  role: 'superadmin' | 'church_secretary'
  church_id: string | null
  churches?: {
    name: string
  } | null
}

interface HeaderProps {
  user: UserData | null
}

export function DashboardHeader({}: HeaderProps) {
  return (
    <header className="h-12 flex  justify-end px-6">
      {/* Search bar */}
      {/* <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members, churches..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div> */}

      {/* Right section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 text-primary/40 hover:text-gray-600 rounded-lg hover:bg-gray-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
        </button>
      </div>
    </header>
  )
}
