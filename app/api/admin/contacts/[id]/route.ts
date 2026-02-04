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

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (contactError) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Fetch opportunities for this contact
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('id, stage, stage_id, pipeline_id, property_id, expected_move_in, value, notes, created_at')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })

    // Fetch linked user info if exists
    let linkedUser = null
    if (contact.user_id) {
      const { data: userProfile } = await supabase
        .from('users_profile')
        .select('id, email, full_name, role, created_at')
        .eq('id', contact.user_id)
        .single()
      linkedUser = userProfile
    }

    return NextResponse.json({
      contact,
      opportunities: opportunities || [],
      linked_user: linkedUser,
    })
  } catch (error: any) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Get current contact for history tracking
    const { data: currentContact, error: fetchError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const body = await request.json()
    const updatableFields = ['full_name', 'email', 'phone', 'source', 'notes']
    const updates: Record<string, any> = {}
    const historyEntries: any[] = []

    for (const field of updatableFields) {
      if (body[field] !== undefined && body[field] !== currentContact[field]) {
        const newValue = typeof body[field] === 'string' ? body[field].trim() || null : body[field]
        if (newValue !== currentContact[field]) {
          updates[field] = newValue
          historyEntries.push({
            contact_id: id,
            field_name: field,
            old_value: currentContact[field]?.toString() || null,
            new_value: newValue?.toString() || null,
            changed_by: user.id,
          })
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ contact: currentContact })
    }

    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Insert history entries
    if (historyEntries.length > 0) {
      await supabase.from('contact_history').insert(historyEntries)
    }

    return NextResponse.json({ contact })
  } catch (error: any) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
