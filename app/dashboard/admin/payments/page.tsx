import { requireRole } from '@/lib/auth/helpers'
import TenantPaymentOverview from '@/components/admin/payments/TenantPaymentOverview'

export default async function AdminPaymentsPage() {
  await requireRole(['admin'])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor rent payments and lease progress for all tenants
          </p>
        </div>
      </div>

      <TenantPaymentOverview />
    </div>
  )
}
