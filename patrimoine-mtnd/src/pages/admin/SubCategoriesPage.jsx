import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/card';

export default function SubCategoriesPage() {
  const { type } = useParams();
  const navigate = useNavigate();

  // Données statiques des sous-catégories par type
  const subCategories = {
    informatique: [
      { id: 1, name: 'Ordinateurs', image: '/public/images/pc2.jpeg' },
      { id: 2, name: 'Imprimantes', image: '/public/images/imprimante1.jpeg' },
      { id: 3, name: 'Accessoires', image: '/public/images/pc3.jpeg' }
    ],
    mobilier: [
      { id: 1, name: 'Bureaux', image: '/public/images/tableBureau2.jpeg' },
      { id: 2, name: 'Chaises', image: '/public/images/fauteuille1.jpeg' },
      { id: 3, name: 'Armoires', image: '/public/images/tableBureau3.jpeg' }
    ],
    vehicule: [
      { id: 1, name: 'Voitures', image: '/public/images/voiture2.jpeg' },
      { id: 2, name: 'Motos', image: '/public/images/voiture3.jpeg' }
    ]
  };

  return (
    <div className="flex justify-center items-center h-screen gap-8">
      {subCategories[type]?.map((category) => (
        <Card 
          key={category.id}
          className="w-64 h-80 relative overflow-hidden cursor-pointer transition-all hover:scale-105"
          onClick={() => navigate(`/admin/${type}/${category.name.toLowerCase()}`)}
        >
          <img 
            src={category.image} 
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center transition-all">
            <h2 className="text-white text-2xl font-bold opacity-0 hover:opacity-100 transition-all">
              {category.name}
            </h2>
          </div>
        </Card>
      ))}
    </div>
  );
}
