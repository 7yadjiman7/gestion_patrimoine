import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { StatCard } from '../../components/ui/stat-card';
import materialService from '@/services/materialService';

export default function AdminMaterialTypes() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await materialService.fetchStatsByType();
        const parsed = {};
        if (Array.isArray(data)) {
          data.forEach((s) => {
            parsed[s.code] = s.count;
          });
        }
        setStats(parsed);
      } catch (err) {
        console.error('Error loading type statistics:', err);
      }
    };
    fetchStats();
  }, []);
  
  const materialTypes = [
    { 
      id: 1,
      name: 'Matériel Informatique',
      image: '/public/images/pc1.jpeg',
      route: '/admin/informatique'
    },
    { 
      id: 2,
      name: 'Matériel Mobilier', 
      image: '/public/images/tableBureau1.jpeg',
      route: '/admin/mobilier'
    },
    { 
      id: 3,
      name: 'Matériel Véhicule',
      image: '/public/images/voiture1.jpeg',
      route: '/admin/vehicule'
    }
  ];

  const cardClasses = {
    base: 'group relative w-64 h-80 overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer',
    image: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
    overlay: 'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity',
    title: 'absolute bottom-0 left-0 right-0 p-4 text-white text-xl font-semibold'
  };

  return (
    <div className="p-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard title="Informatique" value={stats.informatique || 0} icon="💻" />
        <StatCard title="Mobilier" value={stats.mobilier || 0} icon="🪑" />
        <StatCard title="Roulant" value={stats.roulant || stats.vehicule || 0} icon="🚗" />
      </div>

      <div className="flex justify-center items-center gap-8 flex-wrap">
        {materialTypes.map((type) => (
          <Card
            key={type.id}
            className={cardClasses.base}
            onClick={() => navigate(type.route)}
          >
            <img
              src={type.image}
              alt={type.name}
              className={cardClasses.image}
            />
            <div className={cardClasses.overlay} />
            <h2 className={cardClasses.title}>{type.name}</h2>
          </Card>
        ))}
      </div>
    </div>
  );
}
