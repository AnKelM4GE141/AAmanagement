import type { Payment } from '@/lib/types/payment'

interface PaymentHistoryProps {
  payments: Payment[]
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="mt-2 text-sm text-slate-600">No payment history yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Your payments will appear here once you make your first payment
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Period
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-slate-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900">
                {payment.payment_date
                  ? new Date(payment.payment_date).toLocaleDateString()
                  : new Date(payment.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                ${payment.amount.toLocaleString()}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                {formatPaymentMethod(payment.payment_method)}
                {payment.is_autopay && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                    Autopay
                  </span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {getStatusBadge(payment.status)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                {payment.period_start && payment.period_end
                  ? `${new Date(payment.period_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    stripe_ach: 'ACH',
    stripe_card: 'Card',
    check: 'Check',
    cash: 'Cash',
    money_order: 'Money Order',
  }
  return methodMap[method] || method
}

function getStatusBadge(status: string) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string }
  > = {
    completed: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Paid',
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      label: 'Pending',
    },
    processing: {
      bg: 'bg-primary-100',
      text: 'text-primary-800',
      label: 'Processing',
    },
    failed: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Failed',
    },
    refunded: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      label: 'Refunded',
    },
  }

  const config = statusConfig[status] || {
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    label: status,
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  )
}
