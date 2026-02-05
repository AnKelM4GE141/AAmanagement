'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import CreateContractModal from './CreateContractModal'
import ContractDetailModal from './ContractDetailModal'
import type { ContractWithDetails, ContractStatus } from '@/lib/types/contract'

const statusBadge: Record<ContractStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-800', label: 'Draft' },
  sent: { bg: 'bg-primary-100', text: 'text-primary-800', label: 'Sent' },
  viewed: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Viewed' },
  signed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Signed' },
}

interface Template {
  name: string
  description: string
  fileName: string
  url: string
}

const templates: Template[] = [
  {
    name: 'Sample Residential Lease',
    description: 'Standard 12-month residential lease agreement with common terms and conditions.',
    fileName: 'sample-lease-agreement.pdf',
    url: '/templates/sample-lease-agreement.pdf',
  },
]

export default function ContractsView() {
  const [contracts, setContracts] = useState<ContractWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ContractStatus | 'all'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [createTemplateUrl, setCreateTemplateUrl] = useState<string | null>(null)
  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchContracts()
  }, [])

  async function fetchContracts() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/contracts')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setContracts(data.contracts || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSend(id: string) {
    try {
      const res = await fetch(`/api/admin/contracts/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchContracts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleDelete(id: string, status: ContractStatus) {
    const msg = status === 'signed'
      ? 'This contract has been signed. Are you sure you want to delete it?'
      : 'Delete this contract?'
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/admin/contracts/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      fetchContracts()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function copySigningLink(contract: ContractWithDetails) {
    const url = `${window.location.origin}/sign/${contract.signing_token}`
    navigator.clipboard.writeText(url)
    setCopiedId(contract.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleUseTemplate(template: Template) {
    setCreateTemplateUrl(template.url)
    setShowCreate(true)
  }

  const filtered = filter === 'all'
    ? contracts
    : contracts.filter((c) => c.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Templates Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.fileName}
              className="bg-white rounded-lg border border-slate-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-slate-900">{template.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{template.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={template.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Preview
                </a>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contracts Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Contracts</h2>
            <div className="flex gap-1">
              {(['all', 'draft', 'sent', 'viewed', 'signed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filter === s
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s === 'all' ? 'All' : statusBadge[s].label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={() => { setCreateTemplateUrl(null); setShowCreate(true) }}>New Contract</Button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">
              {contracts.length === 0 ? 'No contracts yet. Create one to get started.' : 'No contracts match this filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Applicant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Property</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filtered.map((contract) => {
                    const badge = statusBadge[contract.status]
                    return (
                      <tr key={contract.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-slate-900">{contract.applicant.full_name}</div>
                          <div className="text-xs text-slate-500">{contract.applicant.email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {contract.property?.address || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {contract.document_file_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {contract.signed_at
                            ? new Date(contract.signed_at).toLocaleDateString()
                            : contract.sent_at
                            ? new Date(contract.sent_at).toLocaleDateString()
                            : new Date(contract.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedContract(contract)}
                              className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                            >
                              View
                            </button>
                            {contract.status === 'draft' && (
                              <button
                                onClick={() => handleSend(contract.id)}
                                className="text-sm text-green-600 hover:text-green-800 font-medium"
                              >
                                Send
                              </button>
                            )}
                            {contract.status !== 'draft' && (
                              <button
                                onClick={() => copySigningLink(contract)}
                                className="text-sm text-slate-600 hover:text-slate-800 font-medium"
                              >
                                {copiedId === contract.id ? 'Copied!' : 'Copy Link'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(contract.id, contract.status)}
                              className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateContractModal
          templateUrl={createTemplateUrl}
          onClose={() => { setShowCreate(false); setCreateTemplateUrl(null) }}
          onSuccess={() => {
            setShowCreate(false)
            setCreateTemplateUrl(null)
            fetchContracts()
          }}
        />
      )}
      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onUpdate={fetchContracts}
        />
      )}
    </div>
  )
}
