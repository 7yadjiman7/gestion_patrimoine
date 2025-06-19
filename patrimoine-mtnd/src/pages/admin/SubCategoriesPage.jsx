import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "../../components/ui/card";
import materialService from "@/services/materialService";

export default function SubCategoriesPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [subCategories, setSubCategories] = useState([]);

  useEffect(() => {
    const loadSubCats = async () => {
      try {
        const data = await materialService.fetchSubcategoriesByType(type);
        setSubCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading sub categories:", error);
        setSubCategories([]);
      }
    };
    loadSubCats();
  }, [type]);

  const imageMap = {
    ordinateurs: "/public/images/pc2.jpeg",
    imprimantes: "/public/images/imprimante1.jpeg",
    accessoires: "/public/images/pc3.jpeg",
    bureaux: "/public/images/tableBureau2.jpeg",
    chaises: "/public/images/fauteuille1.jpeg",
    armoires: "/public/images/tableBureau3.jpeg",
    voitures: "/public/images/voiture2.jpeg",
    motos: "/public/images/voiture3.jpeg",
  };

  return (
    <div className="flex flex-wrap justify-center gap-8">
      {subCategories.map((category) => (
        <Card
          key={category.id}
          className="group relative w-64 h-72 overflow-hidden rounded-xl shadow-md cursor-pointer transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
          onClick={() =>
            navigate(`/admin/${type}/${category.name.toLowerCase()}`)
          }
        >
          <img
            src={
              imageMap[category.name.toLowerCase()] ||
              "/images/default-material.jpg"
            }
            alt={category.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <h2 className="text-white text-xl font-semibold text-center px-2">
              {category.name}
            </h2>
          </div>
        </Card>
      ))}
    </div>
  );
}
