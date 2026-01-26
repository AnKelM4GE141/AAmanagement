import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      user_id,
      property_id,
      unit_number,
      rent_amount,
      lease_start,
      lease_end,
      move_in_date,
      security_deposit,
    } = body

    if (!user_id || !property_id) {
      return NextResponse.json(
        { error: 'User ID and Property ID are required' },
        { status: 400 }
      )
    }

    // Check if tenant assignment already exists
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', user_id)
      .single()

    let result

    if (existing) {
      // Update existing tenant record
      const { data, error } = await supabase
        .from('tenants')
        .update({
          property_id,
          unit_number,
          rent_amount,
          lease_start,
          lease_end,
          move_in_date,
          security_deposit,
          status: 'active',
        })
        .eq('user_id', user_id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Create new tenant record
      const { data, error } = await supabase
        .from('tenants')
        .insert({
          user_id,
          property_id,
          unit_number,
          rent_amount,
          lease_start,
          lease_end,
          move_in_date,
          security_deposit,
          status: 'active',
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error('Tenant assignment error:', result.error)
      return NextResponse.json(
        { error: 'Failed to assign tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tenant assigned successfully',
      tenant: result.data,
    })
  } catch (error) {
    console.error('Tenant assign API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
