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

    // First, remove default from all pipelines
    await supabase
      .from('pipelines')
      .update({ is_default: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    // Set this pipeline as default
    const { data: pipeline, error: updateError } = await supabase
      .from('pipelines')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ pipeline })
  } catch (error: any) {
    console.error('Error setting default pipeline:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set default pipeline' },
      { status: 500 }
    )
  }
}
