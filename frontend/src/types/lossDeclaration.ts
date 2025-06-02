export interface LossDeclaration {
  id: string
  asset_name: string
  user_name: string
  declaration_date: string
  description: string
  status: 'pending' | 'validated' | 'rejected'
}
