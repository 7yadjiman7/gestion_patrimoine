import { useState } from 'react';
import { OdooService } from '../services/odooService';
import type {
  AssetCreateDto,
  VehicleCreateDto,
  ITEquipmentCreateDto,
  AssetResponseDto
} from '../types/odoo.dtos';

export const useOdoo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : 'Une erreur inconnue est survenue';
    setError(message);
    setLoading(false);
    throw err;
  };

  const getAssets = async () => {
    setLoading(true);
    try {
      return await OdooService.getAssets();
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const createAsset = async (data: AssetCreateDto) => {
    setLoading(true);
    try {
      return await OdooService.createAsset(data);
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const createVehicle = async (data: VehicleCreateDto) => {
    setLoading(true);
    try {
      return await OdooService.createVehicle(data);
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const createITEquipment = async (data: ITEquipmentCreateDto) => {
    setLoading(true);
    try {
      return await OdooService.createITEquipment(data);
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAssets,
    createAsset,
    createVehicle,
    createITEquipment,
    clearError: () => setError(null)
  };
};
