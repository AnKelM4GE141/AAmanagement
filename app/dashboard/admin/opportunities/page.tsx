import { requireRole } from '@/lib/auth/helpers'
import OpportunitiesView from '@/components/admin/opportunities/OpportunitiesView'

export default async function OpportunitiesPage() {
  await requireRole(['admin'])

  return <OpportunitiesView />
}
