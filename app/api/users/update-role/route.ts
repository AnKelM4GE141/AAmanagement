import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    const { userId, newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'User ID and new role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'tenant', 'applicant'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Prevent admins from demoting themselves
    if (userId === user.id && profile.role === 'admin' && newRole !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot demote yourself from admin' },
        { status: 403 }
      )
    }

    // Prevent changing owner role
    const { data: targetUser } = await supabase
      .from('users_profile')
      .select('is_owner')
      .eq('id', userId)
      .single()

    if (targetUser?.is_owner) {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 403 }
      )
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('users_profile')
      .update({ role: newRole })
      .eq('id', userId)

    if (updateError) {
      console.error('Role update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Role updated successfully',
    })
  } catch (error) {
    console.error('Update role API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
