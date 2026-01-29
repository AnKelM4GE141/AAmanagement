'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import Alert from '@/components/ui/Alert'
import OpportunityColumn from './OpportunityColumn'
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
  position: number
}

interface OpportunityKanbanProps {
  pipelineId: string
}

export default function OpportunityKanban({ pipelineId }: OpportunityKanbanProps) {
  const [stages, setStages] = useState<Stage[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchPipelineAndOpportunities()
  }, [pipelineId])

  async function fetchPipelineAndOpportunities() {
    try {
      setIsLoading(true)

      // Fetch pipeline stages
      const pipelineResponse = await fetch(`/api/admin/pipelines/${pipelineId}`)
      const pipelineData = await pipelineResponse.json()

      if (pipelineData.error) {
        throw new Error(pipelineData.error)
      }

      setStages(pipelineData.stages || [])

      // Fetch opportunities for this pipeline
      const oppResponse = await fetch(`/api/admin/opportunities?pipeline_id=${pipelineId}`)
      const oppData = await oppResponse.json()

      if (oppData.error) {
        throw new Error(oppData.error)
      }

      setOpportunities(oppData.opportunities || [])
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const opportunityId = active.id as string
    const newStageId = over.id as string

    // Find the opportunity being moved
    const opportunity = opportunities.find((opp) => opp.id === opportunityId)
    if (!opportunity || opportunity.stage_id === newStageId) return

    // Optimistically update UI
    setOpportunities((prev) =>
      prev.map((opp) =>
        opp.id === opportunityId ? { ...opp, stage_id: newStageId } : opp
      )
    )

    // Update on server
    try {
      const response = await fetch(`/api/admin/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_id: newStageId }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }
    } catch (err: any) {
      console.error('Error updating opportunity:', err)
      // Revert on error
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === opportunityId ? { ...opp, stage_id: opportunity.stage_id } : opp
        )
      )
      setError(err.message)
    }
  }

  function getOpportunitiesByStage(stageId: string) {
    return opportunities.filter((opp) => opp.stage_id === stageId)
  }

  const activeOpportunity = opportunities.find((opp) => opp.id === activeId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>
  }

  if (stages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          No stages configured for this pipeline. Click "Manage Pipelines" to add stages.
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <OpportunityColumn
            key={stage.id}
            stage={stage}
            opportunities={getOpportunitiesByStage(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOpportunity ? (
          <OpportunityCard opportunity={activeOpportunity} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
