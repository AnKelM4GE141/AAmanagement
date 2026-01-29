'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Opportunity {
  id: string
  contact_id: string
  stage: string
  property_id: string | null
  expected_move_in: string | null
  value: number | null
  notes: string | null
  created_at: string
  contact_name: string
  contact_email: string
  property_address: string | null
}

interface OpportunityCardProps {
  opportunity: Opportunity
  isDragging?: boolean
}

export default function OpportunityCard({
  opportunity,
  isDragging = false,
}: OpportunityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  function formatCurrency(amount: number | null) {
    if (!amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing ${
        isDragging ? 'rotate-3 shadow-lg' : ''
      }`}
    >
      {/* Contact Info */}
      <div className="mb-3">
        <div className="flex items-center space-x-2 mb-1">
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {opportunity.contact_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {opportunity.contact_name}
            </h4>
          </div>
        </div>
        <p className="text-xs text-gray-500 truncate">{opportunity.contact_email}</p>
      </div>

      {/* Property */}
      {opportunity.property_address && (
        <div className="mb-2">
          <p className="text-xs text-gray-600 truncate">
            📍 {opportunity.property_address}
          </p>
        </div>
      )}

      {/* Value & Move-in Date */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {opportunity.value && (
          <span className="font-medium text-gray-900">
            {formatCurrency(opportunity.value)}
          </span>
        )}
        {opportunity.expected_move_in && (
          <span>Move-in: {formatDate(opportunity.expected_move_in)}</span>
        )}
      </div>

      {/* Notes */}
      {opportunity.notes && (
        <div className="mt-2 text-xs text-gray-600 line-clamp-2">
          {opportunity.notes}
        </div>
      )}
    </div>
  )
}
