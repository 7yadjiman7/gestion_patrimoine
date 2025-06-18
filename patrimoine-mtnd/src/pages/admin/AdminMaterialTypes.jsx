import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';

export default function AdminMaterialTypes() {
  const navigate = useNavigate();
  
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

  return (
    <div className="flex justify-center items-center h-screen gap-8">

      {materialTypes.map((type) => (
        <Card 
          key={type.id}
          className="w-64 h-80 relative overflow-hidden cursor-pointer transition-all hover:scale-105"
          onClick={() => navigate(type.route)}
        >
          <img 
            src={type.image} 
            alt={type.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center transition-all">
            <h2 className="text-white text-2xl font-bold opacity-0 hover:opacity-100 transition-all">
              {type.name}
            </h2>
          </div>
        </Card>
      ))}
    </div>
  );
}
