'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  EyeIcon,
  ShieldCheckIcon,
  UserIcon,
  DocumentTextIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline'

type ViewRole = 'admin' | 'tenant' | 'applicant'

interface ViewSwitcherProps {
  currentView: ViewRole
  collapsed?: boolean
}

const views: { role: ViewRole; label: string; icon: typeof EyeIcon }[] = [
  { role: 'admin', label: 'Admin View', icon: ShieldCheckIcon },
  { role: 'tenant', label: 'Tenant View', icon: UserIcon },
  { role: 'applicant', label: 'Applicant View', icon: DocumentTextIcon },
]

export default function ViewSwitcher({ currentView, collapsed = false }: ViewSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSwitch = async (role: ViewRole) => {
    if (role === currentView) {
      setIsOpen(false)
      return
    }

    setSwitching(true)
    try {
      const res = await fetch('/api/admin/view-as', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: role === 'admin' ? null : role }),
      })
      const data = await res.json()
      if (data.redirect) {
        router.push(data.redirect)
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to switch view:', err)
    } finally {
      setSwitching(false)
      setIsOpen(false)
    }
  }

  const currentViewConfig = views.find((v) => v.role === currentView) ?? views[0]
  const CurrentIcon = currentViewConfig.icon

  if (collapsed) {
    return (
      <div className="relative px-2" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-center rounded-xl px-2 py-2 text-primary-600 hover:bg-primary-50 transition-all duration-200"
          title="Switch view"
        >
          <EyeIcon className="h-5 w-5" />
        </button>

        {isOpen && (
          <div className="absolute bottom-0 left-full ml-2 w-48 bg-white rounded-xl shadow-soft-lg border border-slate-200/60 py-1 z-50 animate-scale-in">
            {views.map((view) => {
              const Icon = view.icon
              return (
                <button
                  key={view.role}
                  onClick={() => handleSwitch(view.role)}
                  disabled={switching}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors ${
                    view.role === currentView
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2.5 flex-shrink-0" />
                  {view.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative px-2" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex w-full items-center rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-all duration-200"
      >
        <EyeIcon className="h-4 w-4 mr-2.5 text-primary-500 flex-shrink-0" />
        <span className="truncate flex-1 text-left">{currentViewConfig.label}</span>
        <ChevronUpDownIcon className="h-4 w-4 ml-1 text-slate-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 mx-0 bg-white rounded-xl shadow-soft-lg border border-slate-200/60 py-1 z-50 animate-scale-in">
          {views.map((view) => {
            const Icon = view.icon
            return (
              <button
                key={view.role}
                onClick={() => handleSwitch(view.role)}
                disabled={switching}
                className={`flex w-full items-center px-3 py-2 text-sm transition-colors ${
                  view.role === currentView
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2.5 flex-shrink-0" />
                {view.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
