export interface AssetDemand {
  id: string
  user_name: string
  asset_type: string
  quantity: number
  justification: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
