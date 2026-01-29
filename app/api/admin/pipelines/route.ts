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

    // Get all pipelines
    const { data: pipelines, error: pipelinesError } = await supabase
      .from('pipelines')
      .select('*')
      .order('created_at', { ascending: false })

    if (pipelinesError) {
      throw pipelinesError
    }

    // Get stage counts for each pipeline
    const pipelinesWithCounts = await Promise.all(
      (pipelines || []).map(async (pipeline: any) => {
        const { count } = await supabase
          .from('pipeline_stages')
          .select('*', { count: 'exact', head: true })
          .eq('pipeline_id', pipeline.id)

        return {
          ...pipeline,
          stage_count: count || 0,
        }
      })
    )

    return NextResponse.json({ pipelines: pipelinesWithCounts })
  } catch (error: any) {
    console.error('Error fetching pipelines:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch pipelines' },
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
    const { name, description } = body

    // Create pipeline
    const { data: pipeline, error: createError } = await supabase
      .from('pipelines')
      .insert({
        name,
        description,
        is_default: false,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    // Create default stages for new pipeline
    const defaultStages = [
      { name: 'New', color: 'gray', position: 1 },
      { name: 'Contacted', color: 'blue', position: 2 },
      { name: 'Qualified', color: 'yellow', position: 3 },
      { name: 'Proposal', color: 'green', position: 4 },
      { name: 'Won', color: 'indigo', position: 5 },
      { name: 'Lost', color: 'red', position: 6 },
    ]

    await supabase.from('pipeline_stages').insert(
      defaultStages.map((stage) => ({
        pipeline_id: pipeline.id,
        ...stage,
      }))
    )

    return NextResponse.json({ pipeline })
  } catch (error: any) {
    console.error('Error creating pipeline:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create pipeline' },
      { status: 500 }
    )
  }
}
