import { useParams } from 'react-router-dom';
import { getItemsByCategory } from '../../services/itemService';
import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';

export default function AdminDashboardPage() {
  const { type, category } = useParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getItemsByCategory(type, category);
        setItems(data);
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    };
    fetchItems();
  }, [type, category]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Matériels {category} ({type})</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold">{item.name}</h3>
            <p className="text-gray-600">{item.description}</p>
            <p className="mt-2 text-sm text-gray-500">
              Référence: {item.reference}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
