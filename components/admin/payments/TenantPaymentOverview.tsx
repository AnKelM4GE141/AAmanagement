'use client'

import { useState, useEffect } from 'react'
import Alert from '@/components/ui/Alert'

interface PaymentMethod {
  id: string
  type: 'ach' | 'card'
  last4: string | null
  bank_name: string | null
  card_brand: string | null
  is_default: boolean
  status: string
}

interface TenantPaymentData {
  id: string
  full_name: string
  email: string
  property_address: string
  unit_number: string | null
  lease_start: string
  lease_end: string
  rent_amount: number
  current_month_paid: boolean
  is_autopay: boolean
  days_into_lease: number
  total_lease_days: number
  lease_progress_percent: number
  payment_due_date: string
  is_overdue: boolean
  payment_methods: PaymentMethod[]
}

export default function TenantPaymentOverview() {
  const [tenants, setTenants] = useState<TenantPaymentData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTenantPaymentData()
  }, [])

  async function fetchTenantPaymentData() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/payments/overview')
      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setTenants(data.tenants || [])
    } catch (err: any) {
      console.error('Error fetching tenant payment data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

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

  if (tenants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="mt-4 text-sm text-gray-600">No active tenants with leases</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Total Tenants</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {tenants.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Paid This Month</div>
          <div className="mt-1 text-2xl font-bold text-green-600">
            {tenants.filter((t) => t.current_month_paid).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Autopay Enrolled</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {tenants.filter((t) => t.is_autopay).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Overdue</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {tenants.filter((t) => t.is_overdue).length}
          </div>
        </div>
      </div>

      {/* Tenant List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="p-6 hover:bg-gray-50 transition-colors">
              {/* Tenant Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {tenant.full_name}
                    </h3>
                    {tenant.is_autopay && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Autopay
                      </span>
                    )}
                    {tenant.current_month_paid ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Paid
                      </span>
                    ) : tenant.is_overdue ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {tenant.property_address}
                    {tenant.unit_number && ` • Unit ${tenant.unit_number}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{tenant.email}</p>

                  {/* Payment Methods */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tenant.payment_methods.length > 0 ? (
                      tenant.payment_methods.map((method) => (
                        <span
                          key={method.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300"
                        >
                          {method.type === 'ach' ? (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                              </svg>
                              ACH {method.bank_name && `• ${method.bank_name}`} ••••{method.last4}
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                              </svg>
                              {method.card_brand?.toUpperCase()} ••••{method.last4}
                            </>
                          )}
                          {method.is_default && (
                            <span className="ml-1 text-blue-600">★</span>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        No payment method on file
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency(tenant.rent_amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Due: {formatDate(tenant.payment_due_date)}
                  </div>
                </div>
              </div>

              {/* Lease Progress Bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span>Lease Progress</span>
                  <span>
                    {formatDate(tenant.lease_start)} - {formatDate(tenant.lease_end)}
                  </span>
                </div>
                <div className="relative">
                  <div className="overflow-hidden h-4 text-xs flex rounded-full bg-gray-200">
                    <div
                      style={{ width: `${tenant.lease_progress_percent}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {tenant.days_into_lease} days ({tenant.lease_progress_percent}%)
                    </span>
                    <span>{tenant.total_lease_days - tenant.days_into_lease} days left</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
