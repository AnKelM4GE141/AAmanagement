'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import CreateOpportunityModal from '../opportunities/CreateOpportunityModal'
import CreateContactModal from './CreateContactModal'
import ContactDetailPanel from './ContactDetailPanel'

interface Contact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  source: string
  notes: string | null
  user_id: string | null
  created_at: string
  opportunity_count: number
  latest_opportunity_stage: string | null
  has_user_account: boolean
  latest_opportunity?: {
    id: string
    stage: string | null
    stage_id: string | null
    pipeline_id: string | null
    property_id: string | null
    expected_move_in: string | null
    value: number | null
    notes: string | null
  } | null
}

export default function ContactsTable() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showOpportunityModal, setShowOpportunityModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    filterContacts()
  }, [contacts, searchQuery, sourceFilter])

  async function fetchContacts() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/contacts')
      if (!response.ok) {
        throw new Error('Failed to fetch contacts')
      }
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setContacts(data.contacts || [])
    } catch (err: any) {
      console.error('Error fetching contacts:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function filterContacts() {
    let filtered = [...contacts]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (contact) =>
          contact.full_name.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query)
      )
    }

    if (sourceFilter !== 'all') {
      filtered = filtered.filter((contact) => contact.source === sourceFilter)
    }

    setFilteredContacts(filtered)
  }

  function getSourceBadgeColor(source: string) {
    switch (source) {
      case 'signup':
        return 'bg-primary-100 text-primary-800'
      case 'invitation':
        return 'bg-purple-100 text-purple-800'
      case 'facebook':
        return 'bg-indigo-100 text-indigo-800'
      case 'email':
        return 'bg-green-100 text-green-800'
      case 'phone':
        return 'bg-yellow-100 text-yellow-800'
      case 'manual':
        return 'bg-slate-100 text-slate-800'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  function getStageBadgeColor(stage: string | null) {
    if (!stage) return 'bg-slate-100 text-slate-600'
    switch (stage) {
      case 'lead':
        return 'bg-slate-100 text-slate-800'
      case 'contacted':
        return 'bg-primary-100 text-primary-800'
      case 'application_submitted':
      case 'application_reviewing':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
      case 'lease_signed':
        return 'bg-green-100 text-green-800'
      case 'moved_in':
        return 'bg-indigo-100 text-indigo-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  function formatStageName(stage: string | null) {
    if (!stage) return 'No opportunity'
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  function formatSourceName(source: string) {
    return source.charAt(0).toUpperCase() + source.slice(1)
  }

  function handleOpportunityAction(contact: Contact, e: React.MouseEvent) {
    e.stopPropagation()
    setSelectedContact(contact)
    setShowOpportunityModal(true)
  }

  function handleRowClick(contact: Contact) {
    setSelectedContact(contact)
    setShowDetailPanel(true)
  }

  function handleOpportunitySaved() {
    setShowOpportunityModal(false)
    setSelectedContact(null)
    fetchContacts()
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
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setShowCreateModal(true)}>+ New Contact</Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium text-slate-700 mb-1">
              Filter by Source
            </label>
            <select
              id="source"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="block w-full rounded-md border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All Sources</option>
              <option value="manual">Manual</option>
              <option value="signup">Signup</option>
              <option value="invitation">Invitation</option>
              <option value="facebook">Facebook</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-slate-600">
        Showing {filteredContacts.length} of {contacts.length} contacts
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="mt-4 text-sm text-slate-600">
              No contacts found. Click &quot;+ New Contact&quot; to add one.
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Latest Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Added
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredContacts.map((contact) => {
                const hasOpportunity = contact.opportunity_count > 0
                return (
                  <tr
                    key={contact.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleRowClick(contact)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                            {contact.full_name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-900">
                              {contact.full_name}
                            </span>
                            {contact.has_user_account && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700" title="Has user account">
                                User
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">{contact.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {contact.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(
                          contact.source
                        )}`}
                      >
                        {formatSourceName(contact.source)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStageBadgeColor(
                          contact.latest_opportunity_stage
                        )}`}
                      >
                        {formatStageName(contact.latest_opportunity_stage)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant={hasOpportunity ? 'ghost' : 'secondary'}
                        onClick={(e) => handleOpportunityAction(contact, e)}
                        className="text-xs"
                      >
                        {hasOpportunity ? 'Edit Opportunity' : '+ Opportunity'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Contact Modal */}
      {showCreateModal && (
        <CreateContactModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchContacts()
          }}
        />
      )}

      {/* Contact Detail Panel */}
      {showDetailPanel && selectedContact && (
        <ContactDetailPanel
          contactId={selectedContact.id}
          onClose={() => {
            setShowDetailPanel(false)
            setSelectedContact(null)
          }}
          onContactUpdated={fetchContacts}
        />
      )}

      {/* Create/Edit Opportunity Modal */}
      {showOpportunityModal && selectedContact && (
        <CreateOpportunityModal
          contact={selectedContact}
          existingOpportunity={selectedContact.latest_opportunity}
          onClose={() => {
            setShowOpportunityModal(false)
            setSelectedContact(null)
          }}
          onSuccess={handleOpportunitySaved}
        />
      )}
    </div>
  )
}
