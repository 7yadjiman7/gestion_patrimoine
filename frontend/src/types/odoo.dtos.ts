export interface AssetCreateDto {
  name: string;
  code: string;
  category_id: number;
  date_acquisition: string;
  value: number;
  department_id?: number;
  employee_id?: number;
  location_id?: number;
}

export interface VehicleCreateDto extends AssetCreateDto {
  immatriculation: string;
  brand: string;
  model: string;
  mileage: number;
}

export interface ITEquipmentCreateDto extends AssetCreateDto {
  serial_number: string;
  equipment_type: string;
  warranty_expiration?: string;
}

export interface AuthRequestDto {
  username: string;
  password: string;
}

export interface AssetResponseDto {
  id: number;
  name: string;
  code: string;
  status: string;
  category: string;
  acquisition_date: string;
  current_value: number;
  location?: string;
  assigned_to?: string;
}
