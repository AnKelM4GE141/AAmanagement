'use client'

import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

interface Opportunity {
  id: string
  contact_id: string
  contact_name: string
  contact_email: string
  property_id: string | null
  property_address: string | null
  stage: string
}

interface CreateContractModalProps {
  templateUrl?: string | null
  onClose: () => void
  onSuccess: () => void
}

export default function CreateContractModal({ templateUrl, onClose, onSuccess }: CreateContractModalProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [selectedOppId, setSelectedOppId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [templateLoaded, setTemplateLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/admin/opportunities')
      .then((res) => res.json())
      .then((data) => {
        const approved = (data.opportunities || []).filter(
          (o: Opportunity) => o.stage === 'approved'
        )
        setOpportunities(approved)
      })
      .catch((err) => console.error('Error fetching opportunities:', err))
  }, [])

  // Auto-load template PDF if provided
  useEffect(() => {
    if (!templateUrl) return
    fetch(templateUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const fileName = templateUrl.split('/').pop() || 'template.pdf'
        const templateFile = new File([blob], fileName, { type: 'application/pdf' })
        setFile(templateFile)
        setTemplateLoaded(true)
      })
      .catch(() => setError('Failed to load template file'))
  }, [templateUrl])

  const selectedOpp = opportunities.find((o) => o.id === selectedOppId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedOppId) {
      setError('Please select an opportunity')
      return
    }
    if (!file) {
      setError('Please upload a PDF file')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('opportunity_id', selectedOppId)
      formData.append('applicant_id', selectedOpp!.contact_id)
      if (selectedOpp?.property_id) {
        formData.append('property_id', selectedOpp.property_id)
      }

      const res = await fetch('/api/admin/contracts', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      onSuccess()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function clearTemplate() {
    setFile(null)
    setTemplateLoaded(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">New Contract</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {templateUrl ? 'Create a contract from template' : 'Upload a lease PDF for an approved applicant to sign'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Opportunity Select */}
          <div>
            <label htmlFor="opportunity" className="block text-sm font-medium text-slate-700 mb-1">
              Approved Opportunity
            </label>
            {opportunities.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No approved opportunities. Approve an opportunity first before creating a contract.
              </p>
            ) : (
              <select
                id="opportunity"
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              >
                <option value="">Select an opportunity...</option>
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.contact_name} — {opp.property_address || 'No property'}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Auto-filled info */}
          {selectedOpp && (
            <div className="bg-slate-50 rounded-md p-3 space-y-1">
              <p className="text-sm">
                <span className="font-medium text-slate-700">Applicant:</span>{' '}
                <span className="text-slate-900">{selectedOpp.contact_name}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-slate-700">Email:</span>{' '}
                <span className="text-slate-600">{selectedOpp.contact_email}</span>
              </p>
              {selectedOpp.property_address && (
                <p className="text-sm">
                  <span className="font-medium text-slate-700">Property:</span>{' '}
                  <span className="text-slate-600">{selectedOpp.property_address}</span>
                </p>
              )}
            </div>
          )}

          {/* PDF Upload / Template indicator */}
          <div>
            <label htmlFor="pdf" className="block text-sm font-medium text-slate-700 mb-1">
              Lease Document (PDF)
            </label>
            {templateLoaded && file ? (
              <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-md">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  <span className="text-sm text-primary-800 font-medium">{file.name}</span>
                  <span className="text-xs text-primary-600">(template)</span>
                </div>
                <button
                  type="button"
                  onClick={clearTemplate}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  id="pdf"
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => { setFile(e.target.files?.[0] || null); setTemplateLoaded(false) }}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  required={!file}
                />
                <p className="mt-1 text-xs text-slate-500">Max 10MB</p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={opportunities.length === 0}>
              Create Contract
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
