'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import OpportunityCard from './OpportunityCard'

interface Opportunity {
  id: string
  contact_id: string
  stage_id: string
  property_id: string | null
  expected_move_in: string | null
  value: number | null
  notes: string | null
  created_at: string
  contact_name: string
  contact_email: string
  property_address: string | null
}

interface Stage {
  id: string
  name: string
  color: string
}

interface OpportunityColumnProps {
  stage: Stage
  opportunities: Opportunity[]
}

export default function OpportunityColumn({
  stage,
  opportunities,
}: OpportunityColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  })

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'gray':
        return 'bg-gray-100 border-gray-300'
      case 'blue':
        return 'bg-blue-50 border-blue-300'
      case 'yellow':
        return 'bg-yellow-50 border-yellow-300'
      case 'green':
        return 'bg-green-50 border-green-300'
      case 'indigo':
        return 'bg-indigo-50 border-indigo-300'
      case 'red':
        return 'bg-red-50 border-red-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  return (
    <div className="flex-shrink-0 w-80">
      <div
        className={`rounded-lg border-2 ${getColorClasses(
          stage.color
        )} p-4 h-full min-h-[600px]`}
      >
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-gray-600 bg-white rounded-full border border-gray-300">
            {opportunities.length}
          </span>
        </div>

        {/* Droppable Area */}
        <div ref={setNodeRef} className="space-y-3">
          <SortableContext
            items={opportunities.map((opp) => opp.id)}
            strategy={verticalListSortingStrategy}
          >
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </SortableContext>

          {opportunities.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              No opportunities
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
