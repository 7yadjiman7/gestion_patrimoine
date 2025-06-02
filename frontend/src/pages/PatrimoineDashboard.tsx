import { useEffect, useState } from 'react';
import { FaBoxes, FaEuroSign, FaCar, FaLaptop } from 'react-icons/fa';
import { AssetList } from '../components/AssetList';
import Loading from '../components/common/Loading';
import PageContainer from '../components/common/PageContainer';
import { StatCard } from '../components/common/StatCard';
import { useAuth } from '../hooks/useAuth';
import { useOdoo } from '../hooks/useOdoo';

export const PatrimoineDashboard = () => {
  const { user } = useAuth();
  const { getAssets, loading, error } = useOdoo();
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalValue: 0,
    vehiclesCount: 0,
    itEquipmentCount: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const assets = await getAssets();
        const totalValue = assets.reduce((sum, asset) => sum + (asset.current_value || 0), 0);
        const vehiclesCount = assets.filter(a => a.category === 'Véhicule').length;
        const itEquipmentCount = assets.filter(a => a.category === 'Informatique').length;
        
        setStats({
          totalAssets: assets.length,
          totalValue,
          vehiclesCount,
          itEquipmentCount
        });
      } catch (err) {
        console.error('Failed to load assets:', err);
      }
    };
    loadStats();
  }, [getAssets]);

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 p-4">Erreur lors du chargement des données</div>;

  return (
    <PageContainer title={`Tableau de bord Patrimoine - ${user?.name || ''}`}>
      <div className="grid gap-8 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard 
            title="Total des biens" 
            value={stats.totalAssets} 
            icon={<FaBoxes />}
          />
          <StatCard 
            title="Valeur totale" 
            value={`${stats.totalValue.toLocaleString()} €`}
            icon={<FaEuroSign />}
          />
          <StatCard 
            title="Véhicules" 
            value={stats.vehiclesCount}
            icon={<FaCar />}
          />
          <StatCard 
            title="Matériel IT" 
            value={stats.itEquipmentCount}
            icon={<FaLaptop />}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Derniers biens ajoutés</h3>
          <AssetList />
        </div>
      </div>
    </PageContainer>
  );
};
