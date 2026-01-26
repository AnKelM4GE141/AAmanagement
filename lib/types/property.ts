export interface Property {
  id: string
  name: string | null
  address: string
  description: string | null
  total_units: number
  property_type: string | null
  landlord_id: string
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  user_id: string
  property_id: string | null
  unit_number: string | null
  lease_start: string | null
  lease_end: string | null
  rent_amount: number | null
  move_in_date: string | null
  move_out_date: string | null
  security_deposit: number | null
  status: string
  created_at: string
  updated_at: string
}

export interface TenantWithUser extends Tenant {
  user: {
    full_name: string
    email: string
    phone: string | null
  }
}

export interface PropertyWithTenants extends Property {
  tenants: TenantWithUser[]
  tenant_count: number
}
