import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import materialService from "@/services/materialService";

export default function AdminMaterialTypes() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  const materialTypes = [
    {
      id: "informatique",
      name: "Matériel Informatique",
      image: "/public/images/pc1.jpeg",
      route: "/admin/informatique",
    },
    {
      id: "mobilier",
      name: "Matériel Mobilier",
      image: "/public/images/tableBureau1.jpeg",
      route: "/admin/mobilier",
    },
    {
      id: "vehicule",
      name: "Matériel Véhicule",
      image: "/public/images/voiture1.jpeg",
      route: "/admin/vehicule",
    },
  ];

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await materialService.fetchStatsByType();
        const statsMap = {};
        if (Array.isArray(data)) {
          data.forEach((s) => {
            statsMap[s.code] = s.count;
          });
        }
        setCounts(statsMap);
      } catch (error) {
        console.error("Error loading type stats:", error);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="Informatique"
          value={counts.informatique || 0}
          icon="💻"
        />
        <StatCard title="Mobilier" value={counts.mobilier || 0} icon="🪑" />
        <StatCard
          title="Roulant"
          value={counts.vehicule || counts.roulant || 0}
          icon="🚗"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-8">
        {materialTypes.map((type) => (
          <Card
            key={type.id}
            className="group relative w-64 h-72 overflow-hidden rounded-xl shadow-md cursor-pointer transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
            onClick={() => navigate(type.route)}
          >
            <img
              src={type.image}
              alt={type.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <h2 className="text-white text-xl font-semibold text-center px-2">
                {type.name}
              </h2>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
