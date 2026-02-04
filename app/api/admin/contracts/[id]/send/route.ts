import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(
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

    const { data: contract } = await adminDb
      .from('contracts')
      .select('status')
      .eq('id', id)
      .single()

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    if (contract.status !== 'draft') {
      return NextResponse.json(
        { error: 'Contract has already been sent' },
        { status: 400 }
      )
    }

    const { data: updated, error: updateError } = await adminDb
      .from('contracts')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ contract: updated })
  } catch (error: any) {
    console.error('Error sending contract:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send contract' },
      { status: 500 }
    )
  }
}
