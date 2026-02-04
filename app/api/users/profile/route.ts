import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, phone, avatar_url } = body

    // Update users_profile
    const updates: Record<string, any> = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (phone !== undefined) updates.phone = phone || null
    if (avatar_url !== undefined) updates.avatar_url = avatar_url || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('users_profile')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Sync changes to linked contact
    const { data: linkedContact } = await supabase
      .from('contacts')
      .select('id, full_name, phone')
      .eq('user_id', user.id)
      .single()

    if (linkedContact) {
      const contactUpdates: Record<string, any> = {}
      const historyEntries: any[] = []

      if (full_name !== undefined && full_name !== linkedContact.full_name) {
        contactUpdates.full_name = full_name
        historyEntries.push({
          contact_id: linkedContact.id,
          field_name: 'full_name',
          old_value: linkedContact.full_name,
          new_value: full_name,
          changed_by: user.id,
        })
      }

      if (phone !== undefined) {
        const newPhone = phone || null
        if (newPhone !== linkedContact.phone) {
          contactUpdates.phone = newPhone
          historyEntries.push({
            contact_id: linkedContact.id,
            field_name: 'phone',
            old_value: linkedContact.phone,
            new_value: newPhone,
            changed_by: user.id,
          })
        }
      }

      if (Object.keys(contactUpdates).length > 0) {
        await supabase
          .from('contacts')
          .update(contactUpdates)
          .eq('id', linkedContact.id)

        if (historyEntries.length > 0) {
          await supabase.from('contact_history').insert(historyEntries)
        }
      }
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    )
  }
}
