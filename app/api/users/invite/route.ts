import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'tenant', 'applicant'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users_profile')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Check if invitation already exists and is not expired
    const { data: existingInvite } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Active invitation already exists for this email' },
        { status: 400 }
      )
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex')

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { data: invitation, error: inviteError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        invited_by: user.id,
        role,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Invitation creation error:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // In production, you would send an email here with the invitation link
    // For now, we'll return the invitation URL
    const inviteUrl = `${request.nextUrl.origin}/auth/invite/${token}`

    return NextResponse.json({
      message: 'Invitation created successfully',
      inviteUrl,
      invitation,
    })
  } catch (error) {
    console.error('Invite API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
