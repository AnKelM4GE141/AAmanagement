import { UserRole } from './user'

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          role: UserRole
          is_owner: boolean
          invited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          role?: UserRole
          is_owner?: boolean
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          role?: UserRole
          is_owner?: boolean
          invited_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_invitations: {
        Row: {
          id: string
          email: string
          invited_by: string
          role: UserRole
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          invited_by: string
          role: UserRole
          token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          invited_by?: string
          role?: UserRole
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          address: string
          landlord_id: string
          created_at: string
        }
        Insert: {
          id?: string
          address: string
          landlord_id: string
          created_at?: string
        }
        Update: {
          id?: string
          address?: string
          landlord_id?: string
          created_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          user_id: string
          property_id: string | null
          unit_number: string | null
          lease_start: string | null
          lease_end: string | null
          rent_amount: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id?: string | null
          unit_number?: string | null
          lease_start?: string | null
          lease_end?: string | null
          rent_amount?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string | null
          unit_number?: string | null
          lease_start?: string | null
          lease_end?: string | null
          rent_amount?: number | null
          created_at?: string
        }
      }
    }
  }
}
