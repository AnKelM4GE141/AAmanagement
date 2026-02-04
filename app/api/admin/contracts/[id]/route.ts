import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()

    const { data: contract, error } = await adminDb
      .from('contracts')
      .select(`
        *,
        users_profile!applicant_id (
          id,
          full_name,
          email
        ),
        properties!property_id (
          id,
          address,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      contract: {
        ...contract,
        applicant: contract.users_profile || { id: contract.applicant_id, full_name: 'Unknown', email: '' },
        property: contract.properties || null,
        users_profile: undefined,
        properties: undefined,
      },
    })
  } catch (error: any) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contract' },
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()

    const { error: deleteError } = await adminDb
      .from('contracts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting contract:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete contract' },
      { status: 500 }
    )
  }
}
