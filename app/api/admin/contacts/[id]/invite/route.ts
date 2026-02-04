import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

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

    // Get the contact
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, full_name, email, user_id')
      .eq('id', id)
      .single()

    if (contactError || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    if (contact.user_id) {
      return NextResponse.json({ error: 'Contact already has a user account' }, { status: 400 })
    }

    if (!contact.email) {
      return NextResponse.json({ error: 'Contact must have an email to be invited' }, { status: 400 })
    }

    // Check if email already has a user account
    const { data: existingUser } = await supabase
      .from('users_profile')
      .select('id')
      .eq('email', contact.email)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: 'A user account already exists with this email' }, { status: 400 })
    }

    // Check for existing active invitation
    const { data: existingInvite } = await supabase
      .from('user_invitations')
      .select('id')
      .eq('email', contact.email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json({ error: 'An active invitation already exists for this email' }, { status: 400 })
    }

    const body = await request.json()
    const role = body.role || 'applicant'

    if (!['applicant', 'tenant'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be applicant or tenant.' }, { status: 400 })
    }

    // Create invitation with contact_id link
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .insert({
        email: contact.email,
        invited_by: user.id,
        role,
        token,
        expires_at: expiresAt.toISOString(),
        contact_id: contact.id,
      })
      .select()
      .single()

    if (inviteError) {
      throw inviteError
    }

    // Log in contact history
    await supabase.from('contact_history').insert({
      contact_id: contact.id,
      field_name: 'invitation_sent',
      old_value: null,
      new_value: `Invited as ${role}`,
      changed_by: user.id,
    })

    const inviteUrl = `/auth/invite/${token}`

    return NextResponse.json({ invitation, invite_url: inviteUrl })
  } catch (error: any) {
    console.error('Error inviting contact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
