import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get team members (admins only — non-admin users are tracked as contacts)
    const { data: members, error: membersError } = await supabase
      .from('users_profile')
      .select('id, full_name, email, role, is_owner, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: false })

    if (membersError) {
      throw membersError
    }

    return NextResponse.json({ members })
  } catch (error: any) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}
