interface PaymentStatusCardProps {
  status: 'paid' | 'unpaid' | 'overdue' | 'partial' | 'processing'
  dueDate: string
  amount: number
  lastPaymentDate?: string | null
  isEnrolledInAutopay?: boolean
  autopayDiscount?: number
}

export default function PaymentStatusCard({
  status,
  dueDate,
  amount,
  lastPaymentDate,
  isEnrolledInAutopay,
  autopayDiscount,
}: PaymentStatusCardProps) {
  const statusConfig = {
    paid: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Rent Paid',
      message: 'Your rent for this month has been paid',
    },
    unpaid: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      title: 'Payment Due',
      message: 'Your rent payment is due',
    },
    overdue: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      title: 'Payment Overdue',
      message: 'Your rent payment is past due',
    },
    processing: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
      icon: (
        <svg
          className="w-6 h-6 animate-spin"
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
      ),
      title: 'Payment Processing',
      message: 'Your payment is being processed',
    },
    partial: {
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-800',
      icon: (
        <svg
          className="w-6 h-6"
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
      ),
      title: 'Partial Payment',
      message: 'Partial payment received',
    },
  }

  const config = statusConfig[status]

  return (
    <div
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className={`${config.textColor} flex-shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${config.textColor}`}>
              {config.title}
            </h3>
            <p className={`text-sm ${config.textColor} mt-1`}>
              {config.message}
            </p>

            {/* Payment Details */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className={`text-sm ${config.textColor}`}>
                  Amount Due:
                </span>
                <span className={`text-2xl font-bold ${config.textColor}`}>
                  ${amount.toFixed(2)}
                </span>
              </div>

              {isEnrolledInAutopay && autopayDiscount && autopayDiscount > 0 && (
                <div className="mt-2 p-2 bg-white bg-opacity-50 rounded border border-purple-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-purple-700 font-medium">
                      💳 Autopay Active
                    </span>
                    <span className="text-purple-700 font-semibold">
                      Saving ${autopayDiscount.toFixed(2)}/mo
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className={config.textColor}>Due Date:</span>
                <span className={`font-medium ${config.textColor}`}>
                  {new Date(dueDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {lastPaymentDate && status === 'paid' && (
                <div className="flex justify-between items-center text-sm">
                  <span className={config.textColor}>Paid On:</span>
                  <span className={`font-medium ${config.textColor}`}>
                    {new Date(lastPaymentDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.badgeBg} ${config.badgeText}`}
          >
            {config.title}
          </span>
        </div>
      </div>

      {/* Helpful Messages */}
      {status === 'overdue' && (
        <div className="mt-4 text-sm text-red-700">
          ⚠️ Please make your payment as soon as possible to avoid late fees.
        </div>
      )}

      {status === 'processing' && (
        <div className="mt-4 text-sm text-blue-700">
          ⏳ ACH payments typically take 5-7 business days to complete.
        </div>
      )}

      {status === 'unpaid' && !isEnrolledInAutopay && (
        <div className="mt-4 text-sm text-yellow-700">
          💡 Enroll in autopay and save ${autopayDiscount?.toFixed(2) || '25.00'}/month!
        </div>
      )}
    </div>
  )
}
