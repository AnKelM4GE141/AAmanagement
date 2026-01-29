'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  badge?: number
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: HomeIcon },
  { name: 'Conversations', href: '/dashboard/admin/conversations', icon: ChatBubbleLeftRightIcon },
  { name: 'Contacts', href: '/dashboard/admin/contacts', icon: UserGroupIcon },
  { name: 'Opportunities', href: '/dashboard/admin/opportunities', icon: ChartBarIcon },
  { name: 'Properties', href: '/dashboard/admin/properties', icon: BuildingOfficeIcon },
  { name: 'Payments', href: '/dashboard/admin/payments', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Cog6ToothIcon },
]

interface AdminSidebarProps {
  userFullName: string
  userEmail: string
}

export default function AdminSidebar({
  userFullName,
  userEmail,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [businessName, setBusinessName] = useState('AA Portal')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    // Fetch business settings
    fetch('/api/admin/settings/business')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setBusinessName(data.settings.business_name || 'AA Portal')
          setLogoUrl(data.settings.logo_url)
        }
      })
      .catch((err) => {
        console.error('Error fetching business settings:', err)
      })
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <>
      {/* Logo/Business Name */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        {logoUrl ? (
          <img src={logoUrl} alt={businessName} className="h-8 w-auto" />
        ) : (
          <span className="text-xl font-bold text-gray-900">{businessName}</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${active ? 'text-blue-700' : 'text-gray-400'}`} />
              {item.name}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Menu */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
              {userFullName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userFullName}</p>
            <p className="text-xs text-gray-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <span className="sr-only">Toggle sidebar</span>
        {isMobileMenuOpen ? (
          <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
        ) : (
          <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
        )}
      </button>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white left-0">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
