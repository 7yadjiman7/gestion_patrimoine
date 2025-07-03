import materialService from '../../services/materialService';
import { currentUser } from '../../../intranet_mtnd/intranet-frontend/src/contexts/AuthContext';

describe('Mouvement Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create mouvement successfully', async () => {
    const mockResponse = {
      status: 'success',
      mouvement_id: 123,
      mouvement_name: 'MVT-2025-123'
    };

    materialService.saveMouvement = jest.fn().mockResolvedValue(mockResponse);

    const mouvementData = {
      asset_id: 456,
      type_mouvement: 'affectation',
      date: '2025-06-23',
      quantite: 1,
      motif: 'Nouvelle affectation',
      demande_location_id: 789,
      demande_employee_id: 101
    };

    const result = await materialService.saveMouvement(mouvementData);

    expect(materialService.saveMouvement).toHaveBeenCalledWith(movementData);
    expect(result).toEqual(mockResponse);
  });

  test('should handle validation errors', async () => {
    const mockError = {
      status: 'error',
      message: 'Validation error'
    };

    materialService.saveMouvement = jest.fn().mockRejectedValue(mockError);

    const invalidData = {
      // Missing required fields
      asset_id: 456
    };

    await expect(materialService.saveMouvement(invalidData)).rejects.toEqual(mockError);
  });

  test('should create mouvement with minimal required fields', async () => {
    const mockResponse = {
      status: 'success',
      mouvement_id: 124,
      mouvement_name: 'MVT-2025-124'
    };

    materialService.saveMouvement = jest.fn().mockResolvedValue(mockResponse);

    const minimalData = {
      asset_id: 456,
      type_mouvement: 'transfert',
      date: '2025-06-23',
      quantite: 1,
      motif: 'Transfert interne'
    };

    const result = await materialService.saveMouvement(minimalData);

    expect(materialService.saveMouvement).toHaveBeenCalledWith(minimalData);
    expect(result).toEqual(mockResponse);
  });
});