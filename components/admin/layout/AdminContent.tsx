'use client'

import { ReactNode } from 'react'
import { useSidebar } from './SidebarContext'

export default function AdminContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div
      className={`transition-all duration-200 ${
        isCollapsed ? 'lg:pl-16' : 'lg:pl-60'
      }`}
    >
      {children}
    </div>
  )
}
