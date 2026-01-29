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

    // Get business settings
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      throw settingsError
    }

    return NextResponse.json({ settings: settings || null })
  } catch (error: any) {
    console.error('Error fetching business settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
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
      business_name,
      logo_url,
      primary_email,
      primary_phone,
      address,
      timezone,
    } = body

    // Check if settings already exist
    const { data: existing } = await supabase
      .from('business_settings')
      .select('id')
      .single()

    let result

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('business_settings')
        .update({
          business_name,
          logo_url,
          primary_email,
          primary_phone,
          address,
          timezone,
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Create new settings
      const { data, error } = await supabase
        .from('business_settings')
        .insert({
          owner_id: user.id,
          business_name,
          logo_url,
          primary_email,
          primary_phone,
          address,
          timezone,
        })
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return NextResponse.json({ settings: result })
  } catch (error: any) {
    console.error('Error saving business settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    )
  }
}
