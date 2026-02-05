'use client'

import { useState } from 'react'
import Link from 'next/link'

interface TenantPaymentStatus {
  tenant_id: string
  tenant_name: string
  unit_number: string | null
  property_name: string
  rent_amount: number
  autopay_enrolled: boolean
  autopay_discount: number
  current_amount_due: number
  payment_status: 'paid' | 'unpaid' | 'overdue' | 'processing'
  payment_date: string | null
  payment_method: string | null
  last_payment_id: string | null
}

interface PaymentStatusTableProps {
  tenants: TenantPaymentStatus[]
  onRefresh?: () => void
}

export default function PaymentStatusTable({
  tenants,
  onRefresh,
}: PaymentStatusTableProps) {
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid' | 'overdue'>(
    'all'
  )

  const statusConfig = {
    paid: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      label: 'Paid',
    },
    unpaid: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      label: 'Unpaid',
    },
    overdue: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      label: 'Overdue',
    },
    processing: {
      bgColor: 'bg-primary-100',
      textColor: 'text-primary-800',
      label: 'Processing',
    },
  }

  const filteredTenants = tenants.filter(
    (t) => filter === 'all' || t.payment_status === filter
  )

  const summary = {
    total: tenants.length,
    paid: tenants.filter((t) => t.payment_status === 'paid').length,
    unpaid: tenants.filter((t) => t.payment_status === 'unpaid').length,
    overdue: tenants.filter((t) => t.payment_status === 'overdue').length,
    processing: tenants.filter((t) => t.payment_status === 'processing').length,
    totalExpected: tenants.reduce((sum, t) => sum + t.current_amount_due, 0),
    totalCollected: tenants
      .filter((t) => t.payment_status === 'paid')
      .reduce((sum, t) => sum + t.current_amount_due, 0),
    autopayEnrollmentRate:
      tenants.length > 0
        ? ((tenants.filter((t) => t.autopay_enrolled).length / tenants.length) *
            100
          ).toFixed(0)
        : 0,
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <p className="text-sm text-slate-600">Total Expected</p>
          <p className="text-2xl font-bold text-slate-900">
            ${summary.totalExpected.toFixed(2)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Collected</p>
          <p className="text-2xl font-bold text-green-900">
            ${summary.totalCollected.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {summary.paid} of {summary.total} tenants
          </p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">
            ${(summary.totalExpected - summary.totalCollected).toFixed(2)}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            {summary.unpaid + summary.overdue + summary.processing} tenants
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700">Autopay Rate</p>
          <p className="text-2xl font-bold text-purple-900">
            {summary.autopayEnrollmentRate}%
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {tenants.filter((t) => t.autopay_enrolled).length} enrolled
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({summary.total})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'paid'
                ? 'bg-green-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Paid ({summary.paid})
          </button>
          <button
            onClick={() => setFilter('unpaid')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unpaid'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Unpaid ({summary.unpaid})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'overdue'
                ? 'bg-red-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Overdue ({summary.overdue})
          </button>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm text-slate-700 hover:text-slate-900"
          >
            <svg
              className="w-5 h-5 inline mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Property / Unit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Amount Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No tenants found for this filter
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const config = statusConfig[tenant.payment_status]
                  return (
                    <tr key={tenant.tenant_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          {tenant.tenant_name}
                        </div>
                        {tenant.autopay_enrolled && (
                          <div className="text-xs text-purple-600">
                            💳 Autopay (-${tenant.autopay_discount.toFixed(2)})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {tenant.property_name}
                        </div>
                        {tenant.unit_number && (
                          <div className="text-xs text-slate-500">
                            Unit {tenant.unit_number}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">
                          ${tenant.current_amount_due.toFixed(2)}
                        </div>
                        {tenant.autopay_enrolled && (
                          <div className="text-xs text-slate-500">
                            (Base: ${tenant.rent_amount.toFixed(2)})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
                        >
                          {config.label}
                        </span>
                        {tenant.payment_date && (
                          <div className="text-xs text-slate-500 mt-1">
                            {new Date(tenant.payment_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {tenant.payment_method
                          ? tenant.payment_method.replace('stripe_', '').toUpperCase()
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`#`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
