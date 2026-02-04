export type ContractStatus = 'draft' | 'sent' | 'viewed' | 'signed'

export interface Contract {
  id: string
  opportunity_id: string
  applicant_id: string
  property_id: string | null
  document_file_name: string
  document_url: string
  signed_document_url: string | null
  status: ContractStatus
  signing_token: string
  signature_data_url: string | null
  signed_at: string | null
  signer_ip: string | null
  signer_user_agent: string | null
  sent_at: string | null
  viewed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ContractWithDetails extends Contract {
  applicant: {
    id: string
    full_name: string
    email: string
  }
  property: {
    id: string
    address: string
    name: string | null
  } | null
}
