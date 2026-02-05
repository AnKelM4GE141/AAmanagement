'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import type { ContractWithDetails, ContractStatus } from '@/lib/types/contract'

const statusSteps: { key: ContractStatus; label: string }[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'sent', label: 'Sent' },
  { key: 'viewed', label: 'Viewed' },
  { key: 'signed', label: 'Signed' },
]

interface ContractDetailModalProps {
  contract: ContractWithDetails
  onClose: () => void
  onUpdate: () => void
}

export default function ContractDetailModal({
  contract,
  onClose,
  onUpdate,
}: ContractDetailModalProps) {
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'document' | 'audit'>('document')

  const statusIndex = statusSteps.findIndex((s) => s.key === contract.status)
  const isSigned = contract.status === 'signed'

  async function handleSend() {
    setSending(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}/send`, { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      onUpdate()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/sign/${contract.signing_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-slate-900">Contract Details</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Status Timeline */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Status</h3>
            <div className="flex items-center gap-2">
              {statusSteps.map((step, i) => {
                const isActive = i <= statusIndex
                return (
                  <div key={step.key} className="flex items-center">
                    {i > 0 && (
                      <div className={`w-8 h-0.5 ${isActive ? 'bg-primary-500' : 'bg-slate-200'}`} />
                    )}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          isActive
                            ? step.key === 'signed' && isSigned
                              ? 'bg-green-600 text-white'
                              : 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isActive && step.key === 'signed' && isSigned ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`mt-1 text-xs ${isActive ? 'text-primary-600 font-medium' : 'text-slate-400'}`}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contract Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Applicant</p>
              <p className="text-sm text-slate-900 mt-1">{contract.applicant.full_name}</p>
              <p className="text-xs text-slate-500">{contract.applicant.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Property</p>
              <p className="text-sm text-slate-900 mt-1">{contract.property?.address || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Document</p>
              <p className="text-sm text-slate-900 mt-1">{contract.document_file_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Created</p>
              <p className="text-sm text-slate-900 mt-1">
                {new Date(contract.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200">
            <nav className="flex gap-6">
              <button
                onClick={() => setActiveTab('document')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'document'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {isSigned && contract.signed_document_url ? 'Signed Document' : 'Document'}
              </button>
              {isSigned && (
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'audit'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Audit Trail
                </button>
              )}
            </nav>
          </div>

          {/* Document Tab */}
          {activeTab === 'document' && (
            <div>
              <iframe
                src={isSigned && contract.signed_document_url ? contract.signed_document_url : contract.document_url}
                className="w-full rounded-md border border-slate-200"
                style={{ height: '400px' }}
                title="Contract PDF"
              />
              {isSigned && contract.signed_document_url && (
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Viewing signed document with embedded signature
                </p>
              )}
            </div>
          )}

          {/* Audit Trail Tab */}
          {activeTab === 'audit' && isSigned && (
            <div className="space-y-4">
              {/* Signature */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Signature</h4>
                {contract.signature_data_url && (
                  <div className="bg-white border border-slate-200 rounded-md p-3 inline-block">
                    <img
                      src={contract.signature_data_url}
                      alt="Applicant signature"
                      className="max-h-24"
                    />
                  </div>
                )}
                <div className="mt-2">
                  <p className="text-sm text-slate-900">{contract.applicant.full_name}</p>
                  <p className="text-xs text-slate-500">{contract.applicant.email}</p>
                </div>
              </div>

              {/* Audit Details */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Signing Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Signed at</span>
                    <span className="text-slate-900 font-medium">
                      {contract.signed_at
                        ? new Date(contract.signed_at).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            timeZoneName: 'short',
                          })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Signer IP</span>
                    <span className="text-slate-900 font-mono text-xs">
                      {contract.signer_ip || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">User Agent</span>
                    <span className="text-slate-900 font-mono text-xs max-w-xs truncate" title={contract.signer_user_agent || ''}>
                      {contract.signer_user_agent || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Event Timeline</h4>
                <div className="space-y-3">
                  <TimelineEvent
                    label="Contract created"
                    date={contract.created_at}
                    icon="create"
                  />
                  {contract.sent_at && (
                    <TimelineEvent
                      label="Sent to applicant"
                      date={contract.sent_at}
                      icon="send"
                    />
                  )}
                  {contract.viewed_at && (
                    <TimelineEvent
                      label="Viewed by applicant"
                      date={contract.viewed_at}
                      icon="view"
                    />
                  )}
                  {contract.signed_at && (
                    <TimelineEvent
                      label={`Signed by ${contract.applicant.full_name}`}
                      date={contract.signed_at}
                      icon="sign"
                      highlight
                    />
                  )}
                  {contract.signed_document_url && contract.signed_at && (
                    <TimelineEvent
                      label="Signed PDF generated"
                      date={contract.signed_at}
                      icon="pdf"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex gap-2">
              {contract.status === 'draft' && (
                <Button variant="primary" isLoading={sending} onClick={handleSend}>
                  Send to Applicant
                </Button>
              )}
              {contract.status !== 'draft' && (
                <Button variant="secondary" onClick={copyLink}>
                  {copied ? 'Copied!' : 'Copy Signing Link'}
                </Button>
              )}
              {isSigned && contract.signed_document_url ? (
                <a
                  href={contract.signed_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" type="button">
                    Download Signed PDF
                  </Button>
                </a>
              ) : (
                <a
                  href={contract.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" type="button">
                    Download Original PDF
                  </Button>
                </a>
              )}
            </div>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineEvent({
  label,
  date,
  icon,
  highlight,
}: {
  label: string
  date: string
  icon: 'create' | 'send' | 'view' | 'sign' | 'pdf'
  highlight?: boolean
}) {
  const iconColors: Record<string, string> = {
    create: 'bg-slate-200 text-slate-600',
    send: 'bg-primary-100 text-primary-600',
    view: 'bg-yellow-100 text-yellow-600',
    sign: 'bg-green-100 text-green-600',
    pdf: 'bg-purple-100 text-purple-600',
  }

  const icons: Record<string, React.ReactNode> = {
    create: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
    send: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
    view: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    sign: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    ),
    pdf: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  }

  return (
    <div className="flex items-start gap-3">
      <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${iconColors[icon]}`}>
        {icons[icon]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${highlight ? 'text-green-700 font-medium' : 'text-slate-700'}`}>
          {label}
        </p>
        <p className="text-xs text-slate-400">
          {new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  )
}
