import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const pipelineId = searchParams.get('pipeline_id')

    // Build query — join contacts via contact_id (points to contacts table after finalize migration)
    let query = supabase
      .from('opportunities')
      .select(`
        id,
        contact_id,
        legacy_user_contact_id,
        stage,
        stage_id,
        pipeline_id,
        property_id,
        expected_move_in,
        value,
        notes,
        created_at,
        contacts!contact_id (
          full_name,
          email
        ),
        properties!property_id (
          address
        )
      `)
      .order('created_at', { ascending: false })

    // Filter by pipeline_id if provided
    if (pipelineId) {
      query = query.eq('pipeline_id', pipelineId)
    }

    const { data: opportunities, error: opportunitiesError } = await query

    if (opportunitiesError) {
      throw opportunitiesError
    }

    // Format the response
    const formattedOpportunities = (opportunities || []).map((opp: any) => ({
      id: opp.id,
      contact_id: opp.contact_id,
      stage: opp.stage,
      stage_id: opp.stage_id,
      pipeline_id: opp.pipeline_id,
      property_id: opp.property_id,
      expected_move_in: opp.expected_move_in,
      value: opp.value,
      notes: opp.notes,
      created_at: opp.created_at,
      contact_name: opp.contacts?.full_name || 'Unknown',
      contact_email: opp.contacts?.email || '',
      property_address: opp.properties?.address || null,
    }))

    return NextResponse.json({ opportunities: formattedOpportunities })
  } catch (error: any) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const {
      contact_id,
      stage,
      stage_id,
      pipeline_id,
      property_id,
      expected_move_in,
      value,
      notes,
    } = body

    // Check if contact already has an opportunity in this pipeline
    if (pipeline_id) {
      const { data: existing } = await supabase
        .from('opportunities')
        .select('id')
        .eq('contact_id', contact_id)
        .eq('pipeline_id', pipeline_id)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'This contact already has an opportunity in this pipeline. Edit the existing one instead.' },
          { status: 400 }
        )
      }
    }

    // Resolve user_id from contact for legacy contact_id field
    const { data: contactRecord } = await supabase
      .from('contacts')
      .select('user_id')
      .eq('id', contact_id)
      .single()

    const legacyContactId = contactRecord?.user_id || null

    // Map stage_id to a valid legacy stage value
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

    let resolvedStage = stage || 'lead'
    if (stage_id) {
      const { data: stageRow } = await supabase
        .from('pipeline_stages')
        .select('name')
        .eq('id', stage_id)
        .single()

      if (stageRow) {
        resolvedStage = legacyMap[stageRow.name.toLowerCase()] || 'lead'
      }
    }

    // Create opportunity — contact_id points to contacts table
    const insertData: any = {
      contact_id: contact_id,
      stage: resolvedStage,
      stage_id: stage_id || null,
      pipeline_id: pipeline_id || null,
      property_id: property_id || null,
      expected_move_in: expected_move_in || null,
      value: value || null,
      notes: notes || null,
      assigned_to: user.id,
    }

    // Only set legacy_user_contact_id if the contact has a linked user
    if (legacyContactId) {
      insertData.legacy_user_contact_id = legacyContactId
    }

    const { data: opportunity, error: createError } = await supabase
      .from('opportunities')
      .insert(insertData)
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({ opportunity })
  } catch (error: any) {
    console.error('Error creating opportunity:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create opportunity' },
      { status: 500 }
    )
  }
}
