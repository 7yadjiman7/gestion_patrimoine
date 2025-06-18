import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppSidebar from "@/components/app-sidebar";
import { StatCard } from "@/components/ui/stat-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle, Calendar, MapPin, Euro } from "lucide-react";
import materialService from "@/services/materialService"; 

// Styles améliorés pour les cartes
const cardClasses = {
  base: "group relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100",
  imageContainer: "relative h-48 overflow-hidden",
  image: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
  imageOverlay: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
  content: "p-4",
  statusBar: "flex justify-between items-center mb-3",
  title: "font-bold text-lg text-gray-900 mb-2 line-clamp-1",
  code: "text-sm text-gray-500 mb-3",
  hoverDetails: "absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col justify-center p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0",
  detailItem: "flex items-center gap-2 text-sm text-gray-600 mb-2"
};

// Fonction pour obtenir la couleur du badge selon le statut
const getStatusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'service':
    case 'en service':
      return 'default';
    case 'stock':
    case 'en stock':
      return 'secondary';
    case 'maintenance':
      return 'outline';
    case 'hors service':
    case 'défaillant':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Fonction pour obtenir l'icône du statut
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'service':
    case 'en service':
      return '🔄';
    case 'stock':
    case 'en stock':
      return '📦';
    case 'maintenance':
      return '🔧';
    case 'hors service':
    case 'défaillant':
      return '⚠️';
    default:
      return '📋';
  }
};

export default function CategoryItemsPage() {
  const { type, category } = useParams();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null); 
      console.log('Début du chargement des données pour la catégorie:', category);
      
      try {
        const [materialsApiResult, statsApiResult] = await Promise.all([
          materialService.getMaterialsByCategory(type, category),
          materialService.getCategoryStats(type, category)
        ]);
        
        console.log("Réponse API matériels (complète):", materialsApiResult); 
        console.log("Tableau de données matériels (materialsApiResult.data):", materialsApiResult); 

        setMaterials(Array.isArray(materialsApiResult) ? materialsApiResult: []);
        setStats(statsApiResult);
        
        console.log('Données mises à jour dans le state');
      } catch (err) {
        console.error("Erreur chargement matériels/stats:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des données.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [type, category]); 

  const filteredMaterials = Array.isArray(materials) ? materials.filter(material => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    
    const matchesSearch = lowerSearchQuery === '' || 
                          material.name.toLowerCase().includes(lowerSearchQuery) ||
                          material.code?.toLowerCase().includes(lowerSearchQuery);
    
    return matchesSearch; 
  }) : [];

  const handleMaterialClick = (materialId) => {
    navigate(`/admin/materiel/${materialId}`);
  };

  if (isLoading) {
    return (
      <div className="flex">
        <AppSidebar /> 
        <div className="flex-1 min-w-0 p-6 ml-[250px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Chargement des matériels...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <AppSidebar />
        <div className="flex-1 min-w-0 p-6 ml-[250px]">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-700 mb-4">Erreur de chargement</h2>
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar />
      
      <div className="flex-1 p-6 ml-[180px]">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Matériels'}
              </h1>
              <p className="text-gray-600">Gestion des {category} du parc matériel</p>
            </div>
            <Button 
              className="gap-2 bg-blue-600 hover:bg-blue-700" 
              onClick={() => navigate(`/admin/ajouter?type=${type}&category=${category}`)}
            > 
              <PlusCircle className="h-4 w-4" />
              Nouveau matériel
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        {stats && ( 
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Total" 
              value={stats.total}
              icon="📊" 
              trend="neutral"
            />
            <StatCard 
              title="En Service" 
              value={stats.inService}
              icon="🔄"
              trend={stats.inService > 0 ? "up" : "neutral"}
            />
            <StatCard 
              title="En Stock" 
              value={stats.inStock}
              icon="📦"
              trend="neutral"
            />
            <StatCard 
              title="Hors Service" 
              value={stats.outOfService}
              icon="⚠️"
              trend={stats.outOfService > 0 ? "down" : "neutral"}
            />
          </div>
        )}

        {/* Search Bar */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Rechercher un ${category}...`}
                className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMaterials.length > 0 ? ( 
            filteredMaterials.map(material => (
              <div 
                key={material.id} 
                className={cardClasses.base} 
                onClick={() => handleMaterialClick(material.id)}
                style={{ cursor: 'pointer' }}
              >
                {/* Image Container */}
                <div className={cardClasses.imageContainer}>
                  <img 
                    src={material.image || '/images/default-material.jpg'}
                    alt={material.name}
                    className={cardClasses.image}
                    onError={(e) => {
                      e.target.src = '/images/default-material.jpg';
                    }}
                  />
                  <div className={cardClasses.imageOverlay} />
                  
                  {/* Hover Details Overlay */}
                  <div className={cardClasses.hoverDetails}>
                    <h3 className="font-bold text-lg text-gray-900 mb-4">Détails</h3>
                    
                    <div className={cardClasses.detailItem}>
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span>
                        {material.acquisitionDate 
                          ? new Date(material.acquisitionDate).toLocaleDateString('fr-FR')
                          : 'Date inconnue'
                        }
                      </span>
                    </div>
                    
                    <div className={cardClasses.detailItem}>
                      <Euro className="h-4 w-4 text-green-500" />
                      <span>{material.value ? `${material.value} €` : 'Valeur N/A'}</span>
                    </div>
                    
                    <div className={cardClasses.detailItem}>
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span>{material.location || 'Non affecté'}</span>
                    </div>
                    
                    {material.category_general_name && (
                      <div className={cardClasses.detailItem}>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {material.category_general_name}
                        </span>
                      </div>
                    )}
                    
                    {material.category_detailed_name && (
                      <div className={cardClasses.detailItem}>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {material.category_detailed_name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className={cardClasses.content}>
                  {/* Status Bar - Toujours visible */}
                  <div className={cardClasses.statusBar}>
                    <Badge variant="outline" className="text-xs font-medium">
                      {type || material.category_general_name || 'Type'}
                    </Badge>
                    <Badge 
                      variant={getStatusVariant(material.status)}
                      className="text-xs font-medium"
                    >
                      {getStatusIcon(material.status)} {material.status || 'Statut'}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className={cardClasses.title} title={material.name}>
                    {material.name}
                  </h3>

                  {/* Code */}
                  <p className={cardClasses.code}>
                    Code: {material.code || 'Non défini'}
                  </p>
                </div>
              </div>
            ))
          ) : ( 
            <div className="col-span-full">
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Aucun matériel trouvé
                  </h3>
                  <p className="text-gray-500 text-center mb-6">
                    {searchQuery 
                      ? `Aucun résultat pour "${searchQuery}" dans cette catégorie.`
                      : 'Cette catégorie ne contient aucun matériel pour le moment.'
                    }
                  </p>
                  <Button 
                    onClick={() => navigate(`/admin/ajouter?type=${type}&category=${category}`)}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Ajouter le premier matériel
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
