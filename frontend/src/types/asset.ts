export interface Asset {
  id: string;
  name: string;
  type: 'vehicule' | 'informatique' | 'mobilier';
  location: string;
  category: string;
  acquisitionDate: string;
  value: number;
  status: 'actif' | 'inactif' | 'maintenance';
  assignedTo?: string;
  // Ajouter d'autres champs selon les besoins
}

export type AssetType = Asset['type'];
