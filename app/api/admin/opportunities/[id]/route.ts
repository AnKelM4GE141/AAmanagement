import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const body = await request.json()
    const { stage_id, stage, property_id, expected_move_in, value, notes } = body

    // Build update object with only provided fields
    const update: Record<string, any> = {}

    if (stage_id !== undefined) {
      update.stage_id = stage_id

      // Map pipeline stage name to the legacy `stage` CHECK constraint values
      const { data: stageRow } = await supabase
        .from('pipeline_stages')
        .select('name')
        .eq('id', stage_id)
        .single()

      if (stageRow) {
        const legacyMap: Record<string, string> = {
          'lead': 'lead',
          'contacted': 'contacted',
          'application submitted': 'application_submitted',
          'reviewing': 'application_reviewing',
          'approved': 'approved',
          'lease signed': 'lease_signed',
          'moved in': 'moved_in',
          'lost': 'lost',
        }
        const mapped = legacyMap[stageRow.name.toLowerCase()]
        if (mapped) {
          update.stage = mapped
        }
        // If no mapping found, don't update legacy stage field to avoid CHECK violation
      }
    }

    if (stage !== undefined && stage_id === undefined) {
      update.stage = stage
    }
    if (property_id !== undefined) update.property_id = property_id
    if (expected_move_in !== undefined) update.expected_move_in = expected_move_in
    if (value !== undefined) update.value = value
    if (notes !== undefined) update.notes = notes

    // Update opportunity
    const { data: opportunity, error: updateError } = await supabase
      .from('opportunities')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ opportunity })
  } catch (error: any) {
    console.error('Error updating opportunity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update opportunity' },
      { status: 500 }
    )
  }
}
