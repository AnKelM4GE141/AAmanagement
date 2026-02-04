'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

interface Contact {
  id: string
  full_name: string
  email: string | null
}

interface Property {
  id: string
  address: string
}

interface Pipeline {
  id: string
  name: string
  is_default: boolean
}

interface PipelineStage {
  id: string
  name: string
  color: string
  position: number
}

interface ExistingOpportunity {
  id: string
  stage_id: string | null
  stage: string | null
  pipeline_id: string | null
  property_id: string | null
  expected_move_in: string | null
  value: number | null
  notes: string | null
}

interface CreateOpportunityModalProps {
  contact: Contact
  existingOpportunity?: ExistingOpportunity | null
  onClose: () => void
  onSuccess: () => void
}

export default function CreateOpportunityModal({
  contact,
  existingOpportunity,
  onClose,
  onSuccess,
}: CreateOpportunityModalProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState('')

  const isEditing = !!existingOpportunity

  const [formData, setFormData] = useState({
    pipeline_id: existingOpportunity?.pipeline_id || '',
    stage_id: existingOpportunity?.stage_id || '',
    property_id: existingOpportunity?.property_id || '',
    expected_move_in: existingOpportunity?.expected_move_in || '',
    value: existingOpportunity?.value?.toString() || '',
    notes: existingOpportunity?.notes || '',
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setIsLoadingData(true)
    try {
      const [propsRes, pipelinesRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/admin/pipelines'),
      ])

      const propsData = await propsRes.json()
      setProperties(propsData.properties || [])

      const pipelinesData = await pipelinesRes.json()
      const allPipelines = pipelinesData.pipelines || []
      setPipelines(allPipelines)

      // Auto-select pipeline: use existing, or default, or first
      let selectedPipelineId = formData.pipeline_id
      if (!selectedPipelineId && allPipelines.length > 0) {
        const defaultPipeline = allPipelines.find((p: Pipeline) => p.is_default)
        selectedPipelineId = defaultPipeline?.id || allPipelines[0].id
        setFormData(prev => ({ ...prev, pipeline_id: selectedPipelineId }))
      }

      if (selectedPipelineId) {
        await fetchStages(selectedPipelineId)
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoadingData(false)
    }
  }

  async function fetchStages(pipelineId: string) {
    try {
      const res = await fetch(`/api/admin/pipelines/${pipelineId}`)
      const data = await res.json()
      const pipelineStages = data.stages || []
      setStages(pipelineStages)

      // Auto-select first stage if no stage is set
      if (!formData.stage_id && pipelineStages.length > 0) {
        setFormData(prev => ({ ...prev, stage_id: pipelineStages[0].id }))
      }
    } catch (err: any) {
      console.error('Error fetching stages:', err)
    }
  }

  async function handlePipelineChange(pipelineId: string) {
    setFormData(prev => ({ ...prev, pipeline_id: pipelineId, stage_id: '' }))
    setStages([])
    if (pipelineId) {
      await fetchStages(pipelineId)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isEditing && existingOpportunity) {
        // Update existing opportunity
        const response = await fetch(`/api/admin/opportunities/${existingOpportunity.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage_id: formData.stage_id || null,
            property_id: formData.property_id || null,
            expected_move_in: formData.expected_move_in || null,
            value: formData.value ? parseFloat(formData.value) : null,
            notes: formData.notes || null,
          }),
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error)
      } else {
        // Create new opportunity
        const selectedStage = stages.find(s => s.id === formData.stage_id)
        const stageName = selectedStage
          ? selectedStage.name.toLowerCase().replace(/\s+/g, '_')
          : 'lead'

        const response = await fetch('/api/admin/opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contact_id: contact.id,
            stage: stageName,
            stage_id: formData.stage_id || null,
            pipeline_id: formData.pipeline_id || null,
            property_id: formData.property_id || null,
            expected_move_in: formData.expected_move_in || null,
            value: formData.value ? parseFloat(formData.value) : null,
            notes: formData.notes || null,
          }),
        })

        const data = await response.json()
        if (data.error) throw new Error(data.error)
      }

      onSuccess()
    } catch (err: any) {
      console.error('Error saving opportunity:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">
              {isEditing ? 'Edit Opportunity' : 'Create Opportunity'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {isEditing ? `Update opportunity for ${contact.full_name}` : `Create a new opportunity for ${contact.full_name}`}
          </p>
        </div>

        {isLoadingData ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            {/* Pipeline */}
            {!isEditing && pipelines.length > 1 && (
              <div>
                <label htmlFor="pipeline" className="block text-sm font-medium text-gray-700 mb-1">
                  Pipeline
                </label>
                <select
                  id="pipeline"
                  value={formData.pipeline_id}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}{pipeline.is_default ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Stage */}
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                Stage
              </label>
              <select
                id="stage"
                value={formData.stage_id}
                onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="">Select a stage...</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Property */}
            <div>
              <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">
                Property (Optional)
              </label>
              <select
                id="property"
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="">No property selected</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Move-in Date */}
            <Input
              label="Expected Move-in Date (Optional)"
              type="date"
              value={formData.expected_move_in}
              onChange={(e) => setFormData({ ...formData, expected_move_in: e.target.value })}
            />

            {/* Value */}
            <Input
              label="Expected Value (Optional)"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="e.g., 1200"
            />

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Any additional notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {isEditing ? 'Save Changes' : 'Create Opportunity'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
