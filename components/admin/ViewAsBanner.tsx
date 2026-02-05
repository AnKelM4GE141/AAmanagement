'use client'

import { useRouter } from 'next/navigation'
import { EyeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

interface ViewAsBannerProps {
  role: 'tenant' | 'applicant'
}

export default function ViewAsBanner({ role }: ViewAsBannerProps) {
  const router = useRouter()

  const handleExit = async () => {
    const res = await fetch('/api/admin/view-as', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: null }),
    })
    const data = await res.json()
    if (data.redirect) {
      router.push(data.redirect)
      router.refresh()
    }
  }

  const roleLabel = role === 'tenant' ? 'Tenant' : 'Applicant'

  return (
    <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <EyeIcon className="h-4 w-4" />
          <span>
            Viewing as <strong>{roleLabel}</strong>
          </span>
        </div>
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Back to Admin
        </button>
      </div>
    </div>
  )
}
