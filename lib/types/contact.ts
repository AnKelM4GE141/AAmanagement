export type ContactSource = 'manual' | 'signup' | 'invitation' | 'facebook' | 'email' | 'phone' | 'other'

export interface Contact {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  source: ContactSource
  notes: string | null
  user_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ContactHistory {
  id: string
  contact_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  changed_at: string
}

export interface ContactWithDetails extends Contact {
  opportunity_count: number
  latest_opportunity_stage: string | null
  latest_opportunity: {
    id: string
    stage: string | null
    stage_id: string | null
    pipeline_id: string | null
    property_id: string | null
    expected_move_in: string | null
    value: number | null
    notes: string | null
  } | null
  has_user_account: boolean
}
