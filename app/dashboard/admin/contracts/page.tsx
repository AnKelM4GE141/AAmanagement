import { requireRole } from '@/lib/auth/helpers'
import ContractsView from '@/components/admin/contracts/ContractsView'

export default async function ContractsPage() {
  await requireRole(['admin'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
        <p className="text-gray-600 mt-1">Manage lease agreements and contract signing</p>
      </div>
      <ContractsView />
    </div>
  )
}
