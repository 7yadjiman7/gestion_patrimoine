import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import materialService from '@/services/materialService';

export default function SubCategoriesPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSubcategories = async () => {
      try {
        setIsLoading(true);
        const categories = await materialService.fetchTypesGeneraux();
        const filtered = categories.filter((c) => c.type === type);

        let allSubcats = [];
        for (const cat of filtered) {
          const subs = await materialService.fetchSubcategories(cat.id);
          allSubcats = [...allSubcats, ...subs];
        }
        setSubCategories(allSubcats);
      } catch (err) {
        console.error('Error loading subcategories:', err);
        setError('Erreur lors du chargement des catégories');
      } finally {
        setIsLoading(false);
      }
    };
    loadSubcategories();
  }, [type]);

  const cardClasses = {
    base: 'group relative w-64 h-80 overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer',
    image: 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
    overlay: 'absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity',
    title: 'absolute bottom-0 left-0 right-0 p-4 text-white text-xl font-semibold'
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen gap-8 flex-wrap">
      {subCategories.map((category) => (
        <Card
          key={category.id}
          className={cardClasses.base}
          onClick={() => navigate(`/admin/${type}/${category.code}`)}
        >
          <img
            src={category.image || '/images/default-material.jpg'}
            alt={category.name}
            className={cardClasses.image}
          />
          <div className={cardClasses.overlay} />
          <h2 className={cardClasses.title}>{category.name}</h2>
        </Card>
      ))}
    </div>
  );
}
