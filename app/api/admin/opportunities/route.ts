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

    // Get all opportunities with contact and property info
    const { data: opportunities, error: opportunitiesError } = await supabase
      .from('opportunities')
      .select(`
        id,
        contact_id,
        stage,
        property_id,
        expected_move_in,
        value,
        notes,
        created_at,
        users_profile!contact_id (
          full_name,
          email
        ),
        properties!property_id (
          address
        )
      `)
      .order('created_at', { ascending: false })

    if (opportunitiesError) {
      throw opportunitiesError
    }

    // Format the response
    const formattedOpportunities = (opportunities || []).map((opp: any) => ({
      id: opp.id,
      contact_id: opp.contact_id,
      stage: opp.stage,
      property_id: opp.property_id,
      expected_move_in: opp.expected_move_in,
      value: opp.value,
      notes: opp.notes,
      created_at: opp.created_at,
      contact_name: opp.users_profile?.full_name || 'Unknown',
      contact_email: opp.users_profile?.email || '',
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
      property_id,
      expected_move_in,
      value,
      notes,
    } = body

    // Create opportunity
    const { data: opportunity, error: createError } = await supabase
      .from('opportunities')
      .insert({
        contact_id,
        stage,
        property_id,
        expected_move_in,
        value,
        notes,
        assigned_to: user.id,
      })
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
