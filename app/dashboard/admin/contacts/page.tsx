import { requireRole } from '@/lib/auth/helpers'
import ContactsTable from '@/components/admin/contacts/ContactsTable'

export default async function ContactsPage() {
  await requireRole(['admin'])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-600">
            View and manage all contacts in your database
          </p>
        </div>
      </div>

      <ContactsTable />
    </div>
  )
}
