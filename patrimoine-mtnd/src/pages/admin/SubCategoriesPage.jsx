import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import materialService from "@/services/materialService";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import ApiImage from "@/components/ui/ApiImage";
import { API_BASE_URL } from "@/config/api";

export default function SubCategoriesPage() {
  const { type } = useParams();
  const navigate = useNavigate();

  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generalTypeName, setGeneralTypeName] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPageData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const types = await materialService.fetchTypesGeneraux();
        const generalCategory = types.find(
          (t) => t.code.toLowerCase() === type.toLowerCase(),
        );

        if (generalCategory) {
          setGeneralTypeName(generalCategory.name);
          const allSubcats = await materialService.fetchSubcategories(0); // 0 => all
          const data = allSubcats.filter(
            (sc) => sc.category_id === generalCategory.id,
          );
          if (!data || data.error)
            throw new Error(data?.error || "Erreur chargement");
          setSubCategories(data);
        } else throw new Error(`Type "${type}" introuvable.`);
      } catch (error) {
        console.error("[SubCategoriesPage] Error:", error);
        if (error?.response) {
          console.error(
            `[SubCategoriesPage] HTTP status ${error.response.status}`,
            error.response.data,
          );
        }
        toast.error(`Erreur: ${error.message}`);
        setError(error.message || "Erreur lors du chargement");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [type]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-6xl mx-auto mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full border-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
          {generalTypeName}
        </h1>
        <p className="mt-3 text-xl text-gray-300">
          Veuillez sélectionner une sous-catégorie à consulter.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full max-w-6xl mx-auto">
        {subCategories.map((category) => (
          <div
            key={category.id}
            onClick={() => navigate(`/admin/${type}/${category.code}`)}
            className="relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer group"
          >
            <ApiImage
              src={
                category.image_url
                  ? `${API_BASE_URL}${category.image_url}`
                  : "/placeholder.jpeg"
              }
              alt={category.name}
              className="w-full h-80 object-cover brightness-110 contrast-110 saturate-125 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-5">
              <h2 className="text-2xl font-bold text-white drop-shadow-md">
                {category.name}
              </h2>
              {category.item_count !== undefined && (
                <p className="text-sm text-gray-300 font-semibold mt-1">
                  {category.item_count} articles
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
