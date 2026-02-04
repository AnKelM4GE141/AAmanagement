import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
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

    // Get pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('id', id)
      .single()

    if (pipelineError) {
      throw pipelineError
    }

    // Get stages
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', id)
      .order('position', { ascending: true })

    if (stagesError) {
      throw stagesError
    }

    return NextResponse.json({ pipeline, stages })
  } catch (error: any) {
    console.error('Error fetching pipeline:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pipeline' },
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

    // Check if it's the default pipeline
    const { data: pipeline } = await supabase
      .from('pipelines')
      .select('is_default')
      .eq('id', id)
      .single()

    if (pipeline?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default pipeline' },
        { status: 400 }
      )
    }

    // Delete pipeline (stages will cascade delete)
    const { error: deleteError } = await supabase
      .from('pipelines')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting pipeline:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete pipeline' },
      { status: 500 }
    )
  }
}
