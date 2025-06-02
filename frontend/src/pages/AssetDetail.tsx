import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAssetById } from '../services/assetService';
import type { Asset } from '../types/asset';
import PageContainer from '../components/common/PageContainer';

const AssetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        if (id) {
          const data = await getAssetById(id);
          setAsset(data);
        }
      } catch (error) {
        console.error('Error fetching asset:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id]);

  if (loading) return (
    <PageContainer title="Chargement...">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </PageContainer>
  );
  
  if (!asset) return (
    <PageContainer title="Erreur">
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-gray-900">Bien non trouvé</h2>
      </div>
    </PageContainer>
  );

  return (
    <PageContainer title={`Détails - ${asset.name}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
          <p className="text-gray-600">{asset.type} • {asset.category}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Informations principales</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">Localisation:</span> {asset.location}</p>
                  <p><span className="font-medium">Date d'acquisition:</span> {asset.acquisitionDate}</p>
                  <p><span className="font-medium">Valeur:</span> {asset.value}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Statut</h3>
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-medium">Statut:</span> {asset.status}</p>
                  {asset.assignedTo && <p><span className="font-medium">Assigné à:</span> {asset.assignedTo}</p>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition">
                Modifier
              </button>
              <button className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition">
                Historique
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AssetDetail;
