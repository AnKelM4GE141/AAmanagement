import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get business settings
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .single()

    return NextResponse.json({
      settings,
      error: error?.message
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
