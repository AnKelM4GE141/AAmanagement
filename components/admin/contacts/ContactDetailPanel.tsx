'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

interface ContactDetail {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  source: string
  notes: string | null
  user_id: string | null
  created_at: string
  updated_at: string
}

interface LinkedUser {
  id: string
  email: string
  full_name: string
  role: string
  created_at: string
}

interface Opportunity {
  id: string
  stage: string | null
  stage_id: string | null
  pipeline_id: string | null
  property_id: string | null
  expected_move_in: string | null
  value: number | null
  notes: string | null
  created_at: string
}

interface HistoryEntry {
  id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by_name: string
  changed_at: string
}

interface ContactDetailPanelProps {
  contactId: string
  onClose: () => void
  onContactUpdated: () => void
}

export default function ContactDetailPanel({
  contactId,
  onClose,
  onContactUpdated,
}: ContactDetailPanelProps) {
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [linkedUser, setLinkedUser] = useState<LinkedUser | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ full_name: '', email: '', phone: '', notes: '' })
  const [isSaving, setIsSaving] = useState(false)

  // Invite
  const [showInvite, setShowInvite] = useState(false)
  const [inviteRole, setInviteRole] = useState('applicant')
  const [inviteUrl, setInviteUrl] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    fetchContactDetail()
    fetchHistory()
  }, [contactId])

  async function fetchContactDetail() {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/contacts/${contactId}`)
      if (!response.ok) throw new Error('Failed to fetch contact')
      const data = await response.json()

      setContact(data.contact)
      setLinkedUser(data.linked_user)
      setOpportunities(data.opportunities || [])
      setEditData({
        full_name: data.contact.full_name,
        email: data.contact.email || '',
        phone: data.contact.phone || '',
        notes: data.contact.notes || '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}/history`)
      if (!response.ok) return
      const data = await response.json()
      setHistory(data.history || [])
    } catch (err) {
      console.error('Error fetching history:', err)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update contact')
      }

      setIsEditing(false)
      fetchContactDetail()
      fetchHistory()
      onContactUpdated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleInvite() {
    setIsInviting(true)
    setInviteError('')
    setInviteUrl('')
    try {
      const response = await fetch(`/api/admin/contacts/${contactId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: inviteRole }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setInviteUrl(window.location.origin + data.invite_url)
    } catch (err: any) {
      setInviteError(err.message)
    } finally {
      setIsInviting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this contact? This will also delete all their opportunities.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete contact')
      }

      onContactUpdated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    }
  }

  function formatFieldName(field: string) {
    return field
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  function formatStageName(stage: string | null) {
    if (!stage) return 'Unknown'
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-600 bg-opacity-50" onClick={onClose} />

        {/* Panel */}
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-lg">
            <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="p-6">
                  <Alert variant="error">{error}</Alert>
                </div>
              ) : contact ? (
                <div className="flex-1 overflow-y-auto">
                  {/* Contact Header */}
                  <div className="px-6 py-4 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-medium">
                        {contact.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">{contact.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-500 capitalize">{contact.source}</span>
                          {linkedUser && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                              Linked: {linkedUser.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-gray-200 px-6">
                    <nav className="-mb-px flex gap-6">
                      <button
                        onClick={() => setActiveTab('info')}
                        className={`py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'info'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Information
                      </button>
                      <button
                        onClick={() => setActiveTab('history')}
                        className={`py-3 text-sm font-medium border-b-2 ${
                          activeTab === 'history'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        History ({history.length})
                      </button>
                    </nav>
                  </div>

                  {activeTab === 'info' ? (
                    <div className="px-6 py-4 space-y-6">
                      {/* Contact Info */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact Info</h4>
                          {!isEditing ? (
                            <Button variant="ghost" onClick={() => setIsEditing(true)} className="text-xs">
                              Edit
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button variant="ghost" onClick={() => setIsEditing(false)} className="text-xs">
                                Cancel
                              </Button>
                              <Button onClick={handleSave} disabled={isSaving} className="text-xs">
                                {isSaving ? 'Saving...' : 'Save'}
                              </Button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                              <input
                                type="text"
                                value={editData.full_name}
                                onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                              <input
                                type="email"
                                value={editData.email}
                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                              <input
                                type="tel"
                                value={editData.phone}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                              <textarea
                                value={editData.notes}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                rows={3}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <dl className="space-y-3">
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Email</dt>
                              <dd className="text-sm text-gray-900">{contact.email || 'Not provided'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Phone</dt>
                              <dd className="text-sm text-gray-900">{contact.phone || 'Not provided'}</dd>
                            </div>
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Source</dt>
                              <dd className="text-sm text-gray-900 capitalize">{contact.source}</dd>
                            </div>
                            {contact.notes && (
                              <div>
                                <dt className="text-xs font-medium text-gray-500">Notes</dt>
                                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{contact.notes}</dd>
                              </div>
                            )}
                            <div>
                              <dt className="text-xs font-medium text-gray-500">Added</dt>
                              <dd className="text-sm text-gray-900">{new Date(contact.created_at).toLocaleString()}</dd>
                            </div>
                          </dl>
                        )}
                      </div>

                      {/* User Account Section */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">User Account</h4>
                        {linkedUser ? (
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-emerald-800">Linked to user account</span>
                            </div>
                            <div className="mt-2 text-sm text-emerald-700">
                              <p>Role: <span className="capitalize font-medium">{linkedUser.role}</span></p>
                              <p>Email: {linkedUser.email}</p>
                              <p>Joined: {new Date(linkedUser.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm text-gray-500 mb-3">This contact does not have a user account.</p>
                            {contact.email ? (
                              <>
                                {!showInvite ? (
                                  <Button variant="secondary" onClick={() => setShowInvite(true)} className="text-sm">
                                    Invite to Create Account
                                  </Button>
                                ) : (
                                  <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                                    {inviteError && <Alert variant="error">{inviteError}</Alert>}
                                    {inviteUrl ? (
                                      <div>
                                        <p className="text-sm text-gray-700 mb-2">Invitation created! Share this link:</p>
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            readOnly
                                            value={inviteUrl}
                                            className="flex-1 rounded-md border-gray-300 bg-white text-sm"
                                          />
                                          <Button
                                            variant="secondary"
                                            onClick={() => {
                                              navigator.clipboard.writeText(inviteUrl)
                                            }}
                                            className="text-xs"
                                          >
                                            Copy
                                          </Button>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Expires in 7 days.</p>
                                      </div>
                                    ) : (
                                      <>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Invite as</label>
                                          <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value)}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                          >
                                            <option value="applicant">Applicant</option>
                                            <option value="tenant">Tenant</option>
                                          </select>
                                        </div>
                                        <div className="flex gap-2">
                                          <Button variant="ghost" onClick={() => setShowInvite(false)} className="text-xs">
                                            Cancel
                                          </Button>
                                          <Button onClick={handleInvite} disabled={isInviting} className="text-xs">
                                            {isInviting ? 'Creating...' : 'Send Invite'}
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <p className="text-xs text-gray-400">Add an email to this contact to enable invitations.</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Opportunities */}
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                          Opportunities ({opportunities.length})
                        </h4>
                        {opportunities.length === 0 ? (
                          <p className="text-sm text-gray-500">No opportunities yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {opportunities.map((opp) => (
                              <div key={opp.id} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatStageName(opp.stage)}
                                  </span>
                                  {opp.value && (
                                    <span className="text-sm text-gray-600">
                                      ${Number(opp.value).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                {opp.expected_move_in && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Move-in: {new Date(opp.expected_move_in).toLocaleDateString()}
                                  </p>
                                )}
                                {opp.notes && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{opp.notes}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Delete */}
                      <div className="border-t border-gray-200 pt-4">
                        <Button variant="ghost" onClick={handleDelete} className="text-red-600 hover:text-red-700 text-sm">
                          Delete Contact
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* History Tab */
                    <div className="px-6 py-4">
                      {history.length === 0 ? (
                        <p className="text-sm text-gray-500">No history yet.</p>
                      ) : (
                        <div className="flow-root">
                          <ul className="-mb-8">
                            {history.map((entry, idx) => (
                              <li key={entry.id}>
                                <div className="relative pb-8">
                                  {idx !== history.length - 1 && (
                                    <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                        </svg>
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-900">
                                        <span className="font-medium">{formatFieldName(entry.field_name)}</span>
                                        {entry.old_value && entry.new_value ? (
                                          <> changed from <span className="text-gray-500 line-through">{entry.old_value}</span> to <span className="font-medium">{entry.new_value}</span></>
                                        ) : entry.new_value ? (
                                          <>: {entry.new_value}</>
                                        ) : entry.old_value ? (
                                          <> removed (was: {entry.old_value})</>
                                        ) : null}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {entry.changed_by_name} &middot; {new Date(entry.changed_at).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
