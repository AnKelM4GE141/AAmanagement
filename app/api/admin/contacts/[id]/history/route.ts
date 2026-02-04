import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: history, error: historyError } = await supabase
      .from('contact_history')
      .select('id, contact_id, field_name, old_value, new_value, changed_by, changed_at')
      .eq('contact_id', id)
      .order('changed_at', { ascending: false })

    if (historyError) {
      throw historyError
    }

    // Fetch names for changed_by users
    const changedByIds = [...new Set((history || []).map((h: any) => h.changed_by).filter(Boolean))]
    let userNames: Record<string, string> = {}

    if (changedByIds.length > 0) {
      const { data: users } = await supabase
        .from('users_profile')
        .select('id, full_name')
        .in('id', changedByIds)

      userNames = (users || []).reduce((acc: Record<string, string>, u: any) => {
        acc[u.id] = u.full_name
        return acc
      }, {})
    }

    const historyWithNames = (history || []).map((entry: any) => ({
      ...entry,
      changed_by_name: entry.changed_by ? userNames[entry.changed_by] || 'Unknown' : 'System',
    }))

    return NextResponse.json({ history: historyWithNames })
  } catch (error: any) {
    console.error('Error fetching contact history:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact history' },
      { status: 500 }
    )
  }
}
