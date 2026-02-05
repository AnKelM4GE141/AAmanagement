'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import PipelineEditor from './PipelineEditor'

interface Pipeline {
  id: string
  name: string
  description: string | null
  is_default: boolean
  stage_count: number
}

interface PipelineManagerProps {
  onClose: () => void
  onUpdate: () => void
  selectedPipelineId: string
}

export default function PipelineManager({
  onClose,
  onUpdate,
  selectedPipelineId,
}: PipelineManagerProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null)
  const [showNewPipelineForm, setShowNewPipelineForm] = useState(false)
  const [newPipelineName, setNewPipelineName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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
    } catch (err: any) {
      console.error('Error fetching pipelines:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreatePipeline() {
    if (!newPipelineName.trim()) return

    setIsCreating(true)
    setError('')

    try {
      const response = await fetch('/api/admin/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPipelineName,
          description: null,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setShowNewPipelineForm(false)
      setNewPipelineName('')
      await fetchPipelines()
      setEditingPipelineId(data.pipeline.id) // Immediately edit new pipeline
    } catch (err: any) {
      console.error('Error creating pipeline:', err)
      setError(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeletePipeline(pipelineId: string) {
    if (!confirm('Are you sure you want to delete this pipeline? All opportunities in this pipeline will need to be reassigned.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/pipelines/${pipelineId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      await fetchPipelines()
      onUpdate() // Refresh parent
    } catch (err: any) {
      console.error('Error deleting pipeline:', err)
      setError(err.message)
    }
  }

  async function handleSetDefault(pipelineId: string) {
    try {
      const response = await fetch(`/api/admin/pipelines/${pipelineId}/set-default`, {
        method: 'PATCH',
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      await fetchPipelines()
      onUpdate()
    } catch (err: any) {
      console.error('Error setting default pipeline:', err)
      setError(err.message)
    }
  }

  if (editingPipelineId) {
    return (
      <PipelineEditor
        pipelineId={editingPipelineId}
        onClose={() => {
          setEditingPipelineId(null)
          fetchPipelines()
          onUpdate()
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">Manage Pipelines</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Create and customize sales pipelines for different campaigns
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Create New Pipeline */}
          <div className="border border-dashed border-slate-300 rounded-lg p-4">
            {showNewPipelineForm ? (
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                  placeholder="Pipeline name..."
                  className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleCreatePipeline()
                  }}
                />
                <Button onClick={handleCreatePipeline} isLoading={isCreating}>
                  Create
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewPipelineForm(false)
                    setNewPipelineName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewPipelineForm(true)}
                className="w-full text-left text-sm text-slate-600 hover:text-slate-900 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Pipeline
              </button>
            )}
          </div>

          {/* Pipeline List */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {pipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className={`border rounded-lg p-4 hover:border-primary-300 transition-colors ${
                    pipeline.is_default ? 'border-primary-500 bg-primary-50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-slate-900">
                          {pipeline.name}
                        </h3>
                        {pipeline.is_default && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {pipeline.stage_count} stages
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setEditingPipelineId(pipeline.id)}
                        className="text-slate-400 hover:text-primary-600"
                        title="Edit pipeline"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {!pipeline.is_default && (
                        <>
                          <button
                            onClick={() => handleSetDefault(pipeline.id)}
                            className="text-slate-400 hover:text-primary-600"
                            title="Set as default"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleDeletePipeline(pipeline.id)}
                            className="text-slate-400 hover:text-red-600"
                            title="Delete pipeline"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
