'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import OpportunityKanban from './OpportunityKanban'
import PipelineManager from './PipelineManager'

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean
}

export default function OpportunitiesView() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('')
  const [showPipelineManager, setShowPipelineManager] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPipelines()
  }, [])

  async function fetchPipelines() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/pipelines')
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPipelines(data.pipelines || [])

      // Select default pipeline or first pipeline
      const defaultPipeline = data.pipelines?.find((p: Pipeline) => p.is_default)
      const initialPipeline = defaultPipeline || data.pipelines?.[0]
      if (initialPipeline) {
        setSelectedPipelineId(initialPipeline.id)
      }
    } catch (err: any) {
      console.error('Error fetching pipelines:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handlePipelineUpdated() {
    fetchPipelines()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>
  }

  return (
    <div className="space-y-6">
      {/* Header with Pipeline Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
          <p className="mt-1 text-sm text-slate-600">
            Track contacts through your sales pipeline
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Pipeline Selector */}
          {pipelines.length > 0 && (
            <div className="flex items-center space-x-2">
              <label htmlFor="pipeline" className="text-sm font-medium text-slate-700 whitespace-nowrap">
                Pipeline:
              </label>
              <select
                id="pipeline"
                value={selectedPipelineId}
                onChange={(e) => setSelectedPipelineId(e.target.value)}
                className="block rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {pipelines.map((pipeline) => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manage Pipelines Button */}
          <Button
            variant="secondary"
            onClick={() => setShowPipelineManager(true)}
            className="whitespace-nowrap"
          >
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Manage Pipelines
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      {selectedPipelineId && (
        <OpportunityKanban pipelineId={selectedPipelineId} key={selectedPipelineId} />
      )}

      {/* Pipeline Manager Modal */}
      {showPipelineManager && (
        <PipelineManager
          onClose={() => setShowPipelineManager(false)}
          onUpdate={handlePipelineUpdated}
          selectedPipelineId={selectedPipelineId}
        />
      )}
    </div>
  )
}
