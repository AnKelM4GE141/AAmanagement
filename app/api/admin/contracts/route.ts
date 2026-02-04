import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()

    const { data: contracts, error: contractsError } = await adminDb
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
      .order('created_at', { ascending: false })

    if (contractsError) {
      throw contractsError
    }

    const formatted = (contracts || []).map((c: any) => ({
      ...c,
      applicant: c.users_profile || { id: c.applicant_id, full_name: 'Unknown', email: '' },
      property: c.properties || null,
      users_profile: undefined,
      properties: undefined,
    }))

    return NextResponse.json({ contracts: formatted })
  } catch (error: any) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const opportunityId = formData.get('opportunity_id') as string
    const applicantId = formData.get('applicant_id') as string
    const propertyId = formData.get('property_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!opportunityId || !applicantId) {
      return NextResponse.json({ error: 'opportunity_id and applicant_id are required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const fileName = `contract-${Date.now()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminDb.storage
      .from('contracts')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    const {
      data: { publicUrl },
    } = adminDb.storage.from('contracts').getPublicUrl(fileName)

    const { data: contract, error: createError } = await adminDb
      .from('contracts')
      .insert({
        opportunity_id: opportunityId,
        applicant_id: applicantId,
        property_id: propertyId || null,
        document_file_name: file.name,
        document_url: publicUrl,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({ contract })
  } catch (error: any) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create contract' },
      { status: 500 }
    )
  }
}
