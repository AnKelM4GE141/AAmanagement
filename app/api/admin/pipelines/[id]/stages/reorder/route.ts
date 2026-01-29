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
    const { stages } = body // Array of { id, position }

    // Update each stage's position
    for (const stage of stages) {
      await supabase
        .from('pipeline_stages')
        .update({ position: stage.position })
        .eq('id', stage.id)
        .eq('pipeline_id', params.id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error reordering stages:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reorder stages' },
      { status: 500 }
    )
  }
}
