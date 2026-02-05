'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  XMarkIcon,
  Bars3Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { useState, useEffect, useRef } from 'react'
import { useSidebar } from './SidebarContext'
import { createClient } from '@/lib/supabase/client'
import ViewSwitcher from '@/components/admin/ViewSwitcher'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  badge?: number
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard/admin', icon: HomeIcon },
  { name: 'Contacts', href: '/dashboard/admin/contacts', icon: UserGroupIcon },
  { name: 'Opportunities', href: '/dashboard/admin/opportunities', icon: ChartBarIcon },
  { name: 'Contracts', href: '/dashboard/admin/contracts', icon: DocumentTextIcon },
  { name: 'Properties', href: '/dashboard/admin/properties', icon: BuildingOfficeIcon },
  { name: 'Payments', href: '/dashboard/admin/payments', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/dashboard/admin/settings', icon: Cog6ToothIcon },
]

interface AdminSidebarProps {
  userFullName: string
  userEmail: string
  isOwner?: boolean
  avatarUrl?: string | null
}

export default function AdminSidebar({
  userFullName,
  userEmail,
  isOwner,
  avatarUrl: initialAvatarUrl,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isCollapsed, toggle } = useSidebar()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [businessName, setBusinessName] = useState('AA Portal')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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

  // Close profile popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileOpen])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard/admin') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      {/* Logo/Business Name */}
      <div className="flex h-16 items-center border-b border-slate-200/60 px-4">
        {collapsed ? (
          <div className="flex w-full justify-center">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 w-8 object-contain" />
            ) : (
              <span className="text-xl font-bold text-slate-900">
                {businessName.charAt(0)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center min-w-0">
            {logoUrl ? (
              <img src={logoUrl} alt={businessName} className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-bold text-slate-900 truncate">{businessName}</span>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className={`group flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
                collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'
              } ${
                active
                  ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon
                className={`h-5 w-5 flex-shrink-0 transition-colors ${
                  active ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                } ${collapsed ? '' : 'mr-3'}`}
              />
              {!collapsed && (
                <>
                  <span className="truncate">{item.name}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* View Switcher */}
      <div className="border-t border-slate-200/60 py-2">
        <ViewSwitcher currentView="admin" collapsed={collapsed} />
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-slate-200/60 px-2 py-2">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-xl px-2 py-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* User Menu with Popover */}
      <div className="relative border-t border-slate-200/60" ref={profileRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className={`w-full px-4 py-3 flex items-center hover:bg-slate-50 transition-all duration-200 cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
              {initialAvatarUrl ? (
                <img src={initialAvatarUrl} alt={userFullName} className="h-full w-full object-cover" />
              ) : (
                userFullName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          {!collapsed && (
            <div className="ml-3 flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-slate-900 truncate">{userFullName}</p>
              <p className="text-xs text-slate-500 truncate">{userEmail}</p>
            </div>
          )}
        </button>

        {/* Profile Popover */}
        {isProfileOpen && (
          <div
            className={`absolute z-50 mb-1 bg-white rounded-xl shadow-soft-lg border border-slate-200/60 py-1 animate-scale-in ${
              collapsed
                ? 'bottom-0 left-full ml-2 w-64'
                : 'bottom-full left-0 right-0 mx-2'
            }`}
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-medium overflow-hidden">
                  {initialAvatarUrl ? (
                    <img src={initialAvatarUrl} alt={userFullName} className="h-full w-full object-cover" />
                  ) : (
                    userFullName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{userFullName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>
              <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {isOwner ? 'Owner' : 'Admin'}
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/dashboard/admin/profile"
                onClick={() => {
                  setIsProfileOpen(false)
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <UserCircleIcon className="h-4 w-4 mr-3 text-slate-400" />
                Profile Settings
              </Link>
            </div>

            {/* Sign out */}
            <div className="border-t border-slate-100 py-1">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 bg-white/80 backdrop-blur-sm shadow-soft"
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
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 transition-all duration-200 ${
          isCollapsed ? 'lg:w-16' : 'lg:w-60'
        }`}
      >
        <SidebarContent collapsed={isCollapsed} />
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white left-0 animate-slide-in-left">
            <SidebarContent collapsed={false} />
          </div>
        </div>
      )}
    </>
  )
}
