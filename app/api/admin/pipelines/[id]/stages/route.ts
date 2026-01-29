import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { name, color, position } = body

    // Create stage
    const { data: stage, error: createError } = await supabase
      .from('pipeline_stages')
      .insert({
        pipeline_id: params.id,
        name,
        color,
        position,
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({ stage })
  } catch (error: any) {
    console.error('Error creating stage:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create stage' },
      { status: 500 }
    )
  }
}
