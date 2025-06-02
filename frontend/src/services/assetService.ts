import axios from 'axios';
import type { Asset } from '../types/asset';

const API_BASE_URL = '/api/patrimoine';

export const getAssets = async (): Promise<Asset[]> => {
  const response = await axios.get(`${API_BASE_URL}/assets`);
  return response.data;
};

export const getAssetById = async (id: string): Promise<Asset> => {
  const response = await axios.get(`${API_BASE_URL}/assets/${id}`);
  return response.data;
};

export const createAsset = async (asset: Omit<Asset, 'id'>): Promise<Asset> => {
  const response = await axios.post(`${API_BASE_URL}/assets`, asset);
  return response.data;
};

export const updateAsset = async (id: string, asset: Partial<Asset>): Promise<Asset> => {
  const response = await axios.put(`${API_BASE_URL}/assets/${id}`, asset);
  return response.data;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/assets/${id}`);
};

import type { LossDeclaration } from '../types/lossDeclaration';
import type { AssetDemand } from '../types/assetDemand';

export const getLossDeclarations = async (): Promise<LossDeclaration[]> => {
  const response = await axios.get(`${API_BASE_URL}/loss-declarations`);
  return response.data;
};

export const validateLossDeclaration = async (id: string): Promise<void> => {
  await axios.post(`${API_BASE_URL}/loss-declarations/${id}/validate`);
};

export const getDemands = async (): Promise<AssetDemand[]> => {
  const response = await axios.get(`${API_BASE_URL}/demands`);
  return response.data;
};

export const processDemand = async (id: string, accepted: boolean): Promise<void> => {
  await axios.post(`${API_BASE_URL}/demands/${id}/process`, { accepted });
};
