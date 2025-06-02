import React, { useEffect, useState } from 'react';
import { getAssets } from '../services/assetService';
import type { Asset } from '../types/asset';
import { Link } from 'react-router-dom';
import PageContainer from '../components/common/PageContainer';

const AssetList = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await getAssets();
        setAssets(data);
      } catch (error) {
        console.error('Error fetching assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  if (loading) return (
    <PageContainer title="Chargement...">
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </PageContainer>
  );

  return (
    <PageContainer title="Liste des Biens Patrimoniaux">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((asset) => (
          <div 
            key={asset.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <Link to={`/assets/${asset.id}`} className="block p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{asset.name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Type:</span> {asset.type}</p>
                <p><span className="font-medium">Localisation:</span> {asset.location}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </PageContainer>
  );
};

export default AssetList;
