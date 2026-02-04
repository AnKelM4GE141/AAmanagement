import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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

    // Fetch from contacts table (not users_profile)
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, full_name, email, phone, source, notes, user_id, created_by, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (contactsError) {
      throw contactsError
    }

    // For each contact, get their opportunity data
    const contactsWithOpportunities = await Promise.all(
      (contacts || []).map(async (contact: any) => {
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('id, stage, stage_id, pipeline_id, property_id, expected_move_in, value, notes')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })

        const latest = opportunities?.[0] || null

        return {
          ...contact,
          opportunity_count: opportunities?.length || 0,
          latest_opportunity_stage: latest?.stage || null,
          latest_opportunity: latest,
          has_user_account: !!contact.user_id,
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

export async function POST(request: Request) {
  try {
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

    const body = await request.json()
    const { full_name, email, phone, source, notes } = body

    if (!full_name?.trim()) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    }

    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        full_name: full_name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        source: source || 'manual',
        notes: notes?.trim() || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Log creation in history
    await supabase.from('contact_history').insert({
      contact_id: contact.id,
      field_name: 'created',
      old_value: null,
      new_value: 'Contact created',
      changed_by: user.id,
    })

    return NextResponse.json({ contact })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create contact' },
      { status: 500 }
    )
  }
}
