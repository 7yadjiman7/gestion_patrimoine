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

// Fonction pour obtenir la couleur selon le statut
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'service':
    case 'en service':
      return '#16a34a'; // vert
    case 'stock':
    case 'en stock':
      return '#eab308'; // jaune
    case 'maintenance':
      return '#9333ea'; // violet
    case 'hors service':
    case 'défaillant':
      return '#dc2626'; // rouge
    default:
      return '#64748b'; // gris
  }
};

// Nouveaux styles pour les cartes (inspirés de CategoryItemsPage.jsx)
const cardClasses = {
  base: "relative group w-full h-96 rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform hover:-translate-y-3 transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-indigo-500/50",
  imageContainer: "relative w-full h-full overflow-hidden",
  image: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ease-in-out",
  imageOverlay: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-90",
  content: "absolute bottom-0 left-0 right-0 p-6",
  statusBar: "flex justify-between items-center gap-2",
  typeBadge: "text-white text-sm font-medium bg-indigo-600/90 px-3 py-1 rounded-full backdrop-blur-sm",
  statusBadge: "text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm"
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
          const materialsApiResult =
              await materialService.getMaterialsByDepartment(
                  directorDepartmentId
              )

          // Récupérer les statistiques pour ce département
          // materialService.getStatsByDepartment renvoie déjà les stats agrégées.
          const departmentStatsData =
              await materialService.fetchStatsForOneDepartment(directorDepartmentId)

          // --- AJOUTEZ CES DEUX LIGNES DE DÉBOGAGE ---
          console.log(
              "Données brutes reçues pour les MATÉRIELS :",
              materialsApiResult
          )
          console.log(
              "Données brutes reçues pour les STATS :",
              departmentStatsData
          )
          // -----------------------------------------

          setMaterials(
              Array.isArray(materialsApiResult) ? materialsApiResult : []
          ) // Assurez-vous que c'est le tableau de données directement
          setStats(departmentStatsData) // statsApiResult est déjà l'objet stats

          console.log("Matériels pour le département mis à jour dans le state")
      } catch (err) {
        console.error("Erreur chargement matériels/stats pour le département:", err);
        setError(err.message || "Une erreur est survenue lors du chargement des données pour ce département.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [directorDepartmentId]); // Dépend de l'ID du département du directeur et de l'objet user

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
                  <h1 className="text-2xl font-bold">
                      Matériels de la Direction -{" "}
                      {user?.department_name || "Non défini"}
                  </h1>
                  <p className="text-gray-600">
                      Liste des biens affectés à votre direction.
                  </p>
              </div>

              {/* Stats Section (si disponible) */}
              {stats && ( // Assurez-vous que stats contient total, inService, etc.
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <StatCard
                          title="Total Matériels"
                          value={stats.total}
                          icon="📊"
                          className="bg-blue-600 text-white"
                      />
                      <StatCard
                          title="En Service"
                          value={stats.inService}
                          icon="🔄"
                          className="bg-green-600 text-white"
                      />
                      <StatCard
                          title="En Stock"
                          value={stats.inStock}
                          icon="📦"
                          className="bg-yellow-500 text-white"
                      />
                      <StatCard
                          title="Hors Service"
                          value={stats.outOfService}
                          icon="⚠️"
                          className="bg-red-600 text-white"
                      />
                  </div>
              )}

              {/* Search Bar - Nouvelle version pleine largeur */}
              <div className="mb-8 w-full">
                  <div className="relative w-full max-w-4xl mx-auto">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                          placeholder={`Rechercher un matériel dans votre direction...`}
                          className="pl-12 w-full py-5 text-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                      />
                  </div>
              </div>

              {/* Materials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredMaterials.length > 0 ? (
                      filteredMaterials.map(material => (
                          <div
                              key={material.id}
                              className={cardClasses.base}
                              onClick={() =>
                                  navigate(`/director/materiel/${material.id}`)
                              }
                              style={{ cursor: "pointer" }}
                          >
                              {/* Image Container */}
                              <div className={cardClasses.imageContainer}>
                                  <img
                                      src={
                                          material.image ||
                                          "/images/default-material.jpg"
                                      }
                                      alt={material.name}
                                      className={cardClasses.image}
                                      onError={e => {
                                          e.target.src =
                                              "/images/default-material.jpg"
                                      }}
                                  />
                                  <div className={cardClasses.imageOverlay} />
                              </div>

                              {/* Card Content */}
                              <div className={cardClasses.content}>
                                  <div className={cardClasses.statusBar}>
                                      <span className={cardClasses.typeBadge}>
                                          {material.category_general_name ||
                                              "Type"}
                                      </span>
                                      <span
                                          className={cardClasses.statusBadge}
                                          style={{
                                              backgroundColor: getStatusColor(
                                                  material.status
                                              ),
                                          }}
                                      >
                                          {material.status || "Statut"}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="col-span-full text-center py-12">
                          <p className="text-gray-500 mb-5">
                              Aucun matériel trouvé pour votre direction.
                          </p>
                          <Button
                              onClick={() =>
                                  navigate(`/director/demander-materiel`)
                              }
                              className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
                          >
                              Faire une demande de matériel
                          </Button>
                      </div>
                  )}
              </div>
          </div>
      </div>
  )
}