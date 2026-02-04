import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: contracts, error } = await supabase
      .from('contracts')
      .select(`
        id,
        document_file_name,
        document_url,
        status,
        signing_token,
        signed_at,
        sent_at,
        created_at,
        properties!property_id (
          id,
          address,
          name
        )
      `)
      .eq('applicant_id', user.id)
      .in('status', ['sent', 'viewed', 'signed'])
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const formatted = (contracts || []).map((c: any) => ({
      ...c,
      property: c.properties || null,
      properties: undefined,
    }))

    return NextResponse.json({ contracts: formatted })
  } catch (error: any) {
    console.error('Error fetching applicant contracts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}
