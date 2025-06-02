import { ODOO_CONFIG, buildOdooUrl } from '../config/odoo.config';
import type { 
  AssetCreateDto,
  VehicleCreateDto,
  ITEquipmentCreateDto,
  AuthRequestDto,
  AssetResponseDto
} from '../types/odoo.dtos';

export class OdooService {
  static async authenticate(username: string, password: string): Promise<{token: string}> {
    try {
      const response = await fetch(buildOdooUrl(ODOO_CONFIG.ENDPOINTS.AUTH), {
        method: 'POST',
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({ username, password })
      });
      if (!response.ok) throw new Error('Authentication failed');
      return response.json();
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  static async getAssets(): Promise<AssetResponseDto[]> {
    try {
      const response = await fetch(buildOdooUrl(ODOO_CONFIG.ENDPOINTS.ASSETS), {
        headers: ODOO_CONFIG.DEFAULT_HEADERS
      });
      if (!response.ok) throw new Error('Failed to fetch assets');
      return response.json();
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw error;
    }
  }

  static async getVehicles(): Promise<AssetResponseDto[]> {
    try {
      const response = await fetch(buildOdooUrl(ODOO_CONFIG.ENDPOINTS.VEHICLES), {
        headers: ODOO_CONFIG.DEFAULT_HEADERS
      });
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      return response.json();
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  static async createAsset(assetData: AssetCreateDto): Promise<AssetResponseDto> {
    try {
      const response = await fetch(buildOdooUrl(ODOO_CONFIG.ENDPOINTS.ASSETS), {
        method: 'POST',
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(assetData)
      });
      if (!response.ok) throw new Error('Failed to create asset');
      return response.json();
    } catch (error) {
      console.error('Error creating asset:', error);
      throw error;
    }
  }

  static async createVehicle(vehicleData: VehicleCreateDto): Promise<AssetResponseDto> {
    try {
      const response = await fetch(buildOdooUrl(ODOO_CONFIG.ENDPOINTS.VEHICLES), {
        method: 'POST',
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(vehicleData)
      });
      if (!response.ok) throw new Error('Failed to create vehicle');
      return response.json();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  static async createITEquipment(itData: ITEquipmentCreateDto): Promise<AssetResponseDto> {
    try {
      const response = await fetch(buildOdooUrl(ODOO_CONFIG.ENDPOINTS.IT_EQUIPMENT), {
        method: 'POST',
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(itData)
      });
      if (!response.ok) throw new Error('Failed to create IT equipment');
      return response.json();
    } catch (error) {
      console.error('Error creating IT equipment:', error);
      throw error;
    }
  }

  static async login(authData: AuthRequestDto): Promise<{token: string}> {
    try {
      const response = await fetch(buildOdooUrl(ODOO_CONFIG.ENDPOINTS.AUTH), {
        method: 'POST',
        headers: ODOO_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify(authData)
      });
      if (!response.ok) throw new Error('Login failed');
      return response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
}
