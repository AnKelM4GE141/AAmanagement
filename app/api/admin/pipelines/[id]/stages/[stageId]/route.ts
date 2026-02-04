import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params
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
    const { name, color } = body

    // Update stage
    const { data: stage, error: updateError } = await supabase
      .from('pipeline_stages')
      .update({ name, color })
      .eq('id', stageId)
      .eq('pipeline_id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ stage })
  } catch (error: any) {
    console.error('Error updating stage:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update stage' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id, stageId } = await params
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

    // Get first stage of this pipeline to move opportunities to
    const { data: firstStage } = await supabase
      .from('pipeline_stages')
      .select('id')
      .eq('pipeline_id', id)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    // Move opportunities to first stage before deleting
    if (firstStage && firstStage.id !== stageId) {
      await supabase
        .from('opportunities')
        .update({ stage_id: firstStage.id })
        .eq('stage_id', stageId)
    }

    // Delete stage
    const { error: deleteError } = await supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId)
      .eq('pipeline_id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting stage:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete stage' },
      { status: 500 }
    )
  }
}
