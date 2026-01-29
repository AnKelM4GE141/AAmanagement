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

    // Get all contacts (users_profile) with their opportunity counts
    const { data: contacts, error: contactsError } = await supabase
      .from('users_profile')
      .select('id, full_name, email, phone, role, created_at')
      .order('created_at', { ascending: false })

    if (contactsError) {
      throw contactsError
    }

    // For each contact, get their opportunity count and latest stage
    const contactsWithOpportunities = await Promise.all(
      (contacts || []).map(async (contact: any) => {
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('id, stage')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })

        return {
          ...contact,
          opportunity_count: opportunities?.length || 0,
          latest_opportunity_stage: opportunities?.[0]?.stage || null,
        }
      })
    )

    return NextResponse.json({ contacts: contactsWithOpportunities })
  } catch (error: any) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}
