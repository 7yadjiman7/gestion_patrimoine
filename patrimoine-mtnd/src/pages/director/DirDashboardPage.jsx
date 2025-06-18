// pages/director/DirDashboardPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Retire useParams
import materialService from "@/services/materialService"; // Import du service
import AppSidebar from "@/components/app-sidebar"; // Pour le layout
import { StatCard } from "@/components/ui/stat-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, PlusCircle } from "lucide-react";
import { useAuth } from "@/auth/authService"; // <-- Import du hook d'authentification

// Styles pour les cartes (réutilisés)
const cardClasses = {
  base: "group relative h-64 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all",
  image: "absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-110",
  hoverInfo: "absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300",
  baseInfo: "absolute bottom-0 left-0 right-0 p-4"
};

export default function DirDashboardPage() { // Renommage du composant
  const { user } = useAuth(); // Récupère l'utilisateur connecté
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Le département du directeur sera le filtre principal
  const directorDepartmentId = user?.department_id; // <-- ID du département du directeur

  useEffect(() => {
    const loadData = async () => {
      // Ne charge les données que si le directeur est bien connecté et a un département
      if (!directorDepartmentId) {
        setIsLoading(false);
        // Si user est null (pas connecté) ou pas de department_id, afficher un message spécifique.
        setError("Impossible de déterminer le département du directeur.");
        return;
      }

      setIsLoading(true);
      setError(null);
      console.log('Début du chargement des matériels pour le département:', user?.department_name, ' (ID:', directorDepartmentId, ')');

      try {
        // APPEL AU SERVICE : Filtrer les matériels par département
        // Nouvelle fonction materialService.getMaterialsByDepartment
        const materialsApiResult = await materialService.getMaterialsByDepartment(directorDepartmentId);
        
        // Récupérer les statistiques pour ce département
        // materialService.getStatsByDepartment renvoie déjà les stats agrégées.
        const departmentStatsData = await materialService.fetchStatsByDepartment(directorDepartmentId); 

        setMaterials(Array.isArray(materialsApiResult) ? materialsApiResult : []); // Assurez-vous que c'est le tableau de données directement
        setStats(departmentStatsData); // statsApiResult est déjà l'objet stats
        
        console.log('Matériels pour le département mis à jour dans le state');
      } catch (err) {
        console.error("Erreur chargement matériels/stats pour le département:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des données pour ce département.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [directorDepartmentId, user]); // Dépend de l'ID du département du directeur et de l'objet user

  // Filtrage local (seulement la barre de recherche)
  const filteredMaterials = Array.isArray(materials) ? materials.filter(material => {
    const lowerSearchQuery = searchQuery.toLowerCase();
    return (
        lowerSearchQuery === '' || 
        material.name.toLowerCase().includes(lowerSearchQuery) ||
        material.code?.toLowerCase().includes(lowerSearchQuery)
    );
  }) : [];


  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 p-6 ml-[250px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex">
        <AppSidebar />
        <div className="flex-1 p-6 ml-[250px] text-center text-red-600">
          <h2 className="text-xl font-bold mb-4">Erreur de chargement</h2>
          <p>{error}</p>
          {(!user || !directorDepartmentId) && (
              <p className="mt-4 text-gray-700">Assurez-vous d'être connecté en tant que directeur et d'avoir un département assigné dans Odoo.</p>
          )}
        </div>
      </div>
    );
  }

  // Affiche un message si l'utilisateur n'est pas connecté ou n'a pas de département
  if (!user || (!directorDepartmentId && user.role === 'director')) { // Condition plus précise
    return (
        <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex-1 p-6 ml-[250px] text-center text-gray-500">
                <h2 className="text-xl font-bold mb-4">Accès Refusé</h2>
                <p>Pour accéder à cette page, veuillez vous connecter en tant que directeur et assurez-vous que votre profil employé dans Odoo est lié à un département.</p>
                <Button onClick={() => navigate("/login")} className="mt-4">Se connecter</Button>
            </div>
        </div>
    );
  }


  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      
      <div className="flex-1 p-6 ml-[180px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Matériels de la Direction - {user?.department_name || 'Non défini'}</h1>
          <p className="text-gray-600">Liste des biens affectés à votre direction.</p>
        </div>

        {/* Stats Section (si disponible) */}
        {stats && ( // Assurez-vous que stats contient total, inService, etc.
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard 
              title="Total Matériels" 
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

        {/* Search and Actions */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Rechercher un matériel dans votre direction...`}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Button className="gap-2" onClick={() => navigate(`/director/demander-materiel`)}>
              <PlusCircle className="h-4 w-4" />
              Faire une demande
            </Button>
          </div>
        </div>

        {/* Materials List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map(material => (
              <div key={material.id} className={cardClasses.base}>
                <div 
                  className={cardClasses.image}
                  style={{
                    backgroundImage: `url(${material.image || '/images/default-material.jpg'})`,
                    filter: 'brightness(0.7)'
                  }}
                />
                
                <div className={cardClasses.hoverInfo}>
                  <h3 className="text-white font-bold text-lg">{material.name}</h3>
                  <div className="flex justify-between text-white text-sm mt-1">
                    <span>Code: {material.code || 'N/A'}</span>
                    <Badge variant={material.status === 'service' ? 'default' : 'destructive'}>
                      {material.status}
                    </Badge>
                  </div>
                  <div className="text-white text-xs mt-2">
                    <p>Date: {material.acquisitionDate ? new Date(material.acquisitionDate).toLocaleDateString() : 'Inconnue'}</p>
                    <p>Valeur: {material.value || 'N/A'} €</p>
                    <p>Localisation: {material.location || 'N/A'}</p>
                    <p>Département: {material.department || 'N/A'}</p>
                    <p>Assigné à: {material.assignedTo || 'Non affecté'}</p>
                  </div>
                </div>

                <div className={cardClasses.baseInfo}>
                  <h3 className="text-white font-semibold truncate">{material.name}</h3>
                  <p className="text-white/80 text-xs truncate">{material.code || 'Aucun code'} • {material.status}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Aucun matériel trouvé pour votre direction.</p>
              <Button onClick={() => navigate(`/director/demander-materiel`)} className="mt-4">Faire une demande de matériel</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}