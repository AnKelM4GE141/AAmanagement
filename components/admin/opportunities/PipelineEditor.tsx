'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

interface Stage {
  id: string
  name: string
  color: string
  position: number
}

interface PipelineEditorProps {
  pipelineId: string
  onClose: () => void
}

const COLORS = [
  { value: 'gray', label: 'Gray', bg: 'bg-slate-100', text: 'text-slate-800' },
  { value: 'blue', label: 'Blue', bg: 'bg-primary-100', text: 'text-primary-800' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { value: 'green', label: 'Green', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { value: 'red', label: 'Red', bg: 'bg-red-100', text: 'text-red-800' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100', text: 'text-purple-800' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-100', text: 'text-pink-800' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-100', text: 'text-orange-800' },
]

export default function PipelineEditor({ pipelineId, onClose }: PipelineEditorProps) {
  const [pipelineName, setPipelineName] = useState('')
  const [stages, setStages] = useState<Stage[]>([])
  const [newStageName, setNewStageName] = useState('')
  const [newStageColor, setNewStageColor] = useState('blue')
  const [editingStageId, setEditingStageId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPipeline()
  }, [pipelineId])

  async function fetchPipeline() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/pipelines/${pipelineId}`)
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setPipelineName(data.pipeline.name)
      setStages(data.stages || [])
    } catch (err: any) {
      console.error('Error fetching pipeline:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAddStage() {
    if (!newStageName.trim()) return

    setIsSaving(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/pipelines/${pipelineId}/stages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStageName,
          color: newStageColor,
          position: stages.length + 1,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setNewStageName('')
      await fetchPipeline()
    } catch (err: any) {
      console.error('Error adding stage:', err)
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleUpdateStage(stageId: string, updates: Partial<Stage>) {
    try {
      const response = await fetch(`/api/admin/pipelines/${pipelineId}/stages/${stageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      await fetchPipeline()
      setEditingStageId(null)
    } catch (err: any) {
      console.error('Error updating stage:', err)
      setError(err.message)
    }
  }

  async function handleDeleteStage(stageId: string) {
    if (!confirm('Are you sure you want to delete this stage? Opportunities in this stage will be moved to the first stage.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/pipelines/${pipelineId}/stages/${stageId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      await fetchPipeline()
    } catch (err: any) {
      console.error('Error deleting stage:', err)
      setError(err.message)
    }
  }

  function handleMoveStage(index: number, direction: 'up' | 'down') {
    const newStages = [...stages]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newStages.length) return

    // Swap positions
    ;[newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]]

    // Update positions
    const updatedStages = newStages.map((stage, idx) => ({
      ...stage,
      position: idx + 1,
    }))

    setStages(updatedStages)
    saveStageOrder(updatedStages)
  }

  async function saveStageOrder(orderedStages: Stage[]) {
    try {
      await fetch(`/api/admin/pipelines/${pipelineId}/stages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stages: orderedStages.map((s) => ({ id: s.id, position: s.position })),
        }),
      })
    } catch (err: any) {
      console.error('Error reordering stages:', err)
      setError(err.message)
    }
  }

  const getColorDisplay = (colorValue: string) => {
    const color = COLORS.find((c) => c.value === colorValue)
    return color || COLORS[0]
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-slate-900">Edit Pipeline</h2>
              <p className="mt-1 text-sm text-slate-600">{pipelineName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Add New Stage */}
          <div className="border border-dashed border-slate-300 rounded-lg p-4">
            <h3 className="text-sm font-medium text-slate-900 mb-3">Add New Stage</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Stage name..."
                className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAddStage()
                }}
              />
              <select
                value={newStageColor}
                onChange={(e) => setNewStageColor(e.target.value)}
                className="rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                {COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
              <Button onClick={handleAddStage} isLoading={isSaving}>
                Add Stage
              </Button>
            </div>
          </div>

          {/* Stages List */}
          <div>
            <h3 className="text-sm font-medium text-slate-900 mb-3">Pipeline Stages</h3>
            <div className="space-y-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  {editingStageId === stage.id ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        defaultValue={stage.name}
                        onBlur={(e) =>
                          e.target.value !== stage.name &&
                          handleUpdateStage(stage.id, { name: e.target.value })
                        }
                        className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        autoFocus
                      />
                      <select
                        defaultValue={stage.color}
                        onChange={(e) =>
                          handleUpdateStage(stage.id, { color: e.target.value })
                        }
                        className="rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        {COLORS.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="secondary"
                        onClick={() => setEditingStageId(null)}
                      >
                        Done
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm font-medium w-8">
                          {index + 1}.
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            getColorDisplay(stage.color).bg
                          } ${getColorDisplay(stage.color).text}`}
                        >
                          {stage.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        {/* Move Up */}
                        <button
                          onClick={() => handleMoveStage(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move up"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => handleMoveStage(index, 'down')}
                          disabled={index === stages.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                          title="Move down"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => setEditingStageId(stage.id)}
                          className="p-1 text-slate-400 hover:text-primary-600"
                          title="Edit stage"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteStage(stage.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                          title="Delete stage"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
