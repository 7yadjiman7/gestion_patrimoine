import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import materialService from '@/services/materialService'; // Importez le service
import AppSidebar from '@/components/app-sidebar'; // Assurez-vous d'avoir la sidebar pour le layout

// Définition des colonnes du tableau
const tableHeaders = [
  "Référence", "Demandeur", "Département (Demandeur)", "Type Demandé", "Quantité", "Motif", "Date Demande", "Statut", "Actions"
];

export default function AdminDemandesMateriel() {
  const navigate = useNavigate();
  const [demandes, setDemandes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour charger les demandes depuis l'API
  const loadDemandes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Appel à la fonction de service pour lister les demandes
      const data = await materialService.fetchDemandes();
      setDemandes(Array.isArray(data) ? data : []); // S'assurer que c'est un tableau
      console.log("Demandes chargées:", data);
    } catch (err) {
      console.error("Erreur chargement des demandes:", err);
      setError(err.message || "Impossible de charger les demandes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement des demandes au montage du composant
  useEffect(() => {
    loadDemandes();
  }, []);

  // Gère l'action "Accepter" ou "Refuser"
  const handleProcessDemande = async (demandeId, action) => {
    if (!window.confirm(`Voulez-vous vraiment ${action === 'approve' ? 'ACCEPTER' : 'REJETER'} cette demande (Référence: ${demandeId}) ?`)) {
      return; // Annuler si l'utilisateur ne confirme pas
    }
    try {
      setIsLoading(true); // Afficher un spinner pendant le traitement
      const response = await materialService.processDemande(demandeId, action);
      
      if (response && response.status === 'success') {
          alert(`Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès !`);
          // Recharger les demandes pour mettre à jour l'affichage
          loadDemandes(); // Re-appel de la fonction de chargement
          
          // Si acceptée, et s'il s'agit d'une seule demande de matériel,
          // rediriger vers le formulaire de mouvement pour l'affectation.
          // Note: La redirection directe pour "Accepter" vers AdminMouvement.jsx
          // est une logique front-end. Le backend a déjà changé le statut.
          if (action === 'approve') {
            // Vous devrez récupérer les détails de la demande (type, quantité)
            // et les passer au formulaire de mouvement si vous voulez pré-remplir.
            // Pour l'instant, on redirige vers le formulaire de mouvement générique.
            navigate(`/admin/mouvement?demandeId=${demandeId}`); // Redirige vers AdminMouvement avec l'ID de la demande
          }
      } else {
          // Gérer les erreurs spécifiques renvoyées par le backend
          throw new Error(response.message || "Réponse inattendue du serveur lors du traitement.");
      }
    } catch (err) {
      console.error(`Erreur lors du traitement de la demande ${demandeId}:`, err);
      alert(`Erreur lors du traitement: ${err.message || "Veuillez réessayer."}`);
    } finally {
      // setIsLoading(false); // Sera géré par loadDemandes() qui se termine en finally
    }
  };

  // Gère l'action "Voir" les détails de la demande (si vous avez une page dédiée pour ça)
  const handleVoirDetails = (demandeId) => {
    // Par exemple, naviguer vers une page de détail de demande
    // navigate(`/admin/demande/${demandeId}`); 
    alert(`Action: Voir les détails de la demande ID ${demandeId}`);
  };

  // Affichage des états (loading, error)
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
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 p-6 ml-[250px] text-center text-red-600">
          <h2 className="text-xl font-bold mb-4">Erreur de chargement</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar /> {/* Inclusion de la sidebar pour le layout */}

      <div className="flex-1 p-6 ml-[180px]"> {/* Ajustez la marge si AppSidebar est plus large */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gestion des Demandes de Matériel</h1>
          <p className="text-gray-600">Liste des demandes soumises par les directeurs.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demandes en attente de traitement</CardTitle>
          </CardHeader>
          <CardContent>
            {demandes.length === 0 ? (
              <p className="text-gray-500 text-center">Aucune demande de matériel à traiter pour le moment.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th key={index} className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {demandes.map((demande) => (
                      <tr key={demande.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{demande.name}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{demande.demandeur_name}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{demande.demandeur_department || 'N/A'}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">
                          {demande.demande_subcategory_name || demande.demande_type_general}
                        </td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{demande.quantite}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{demande.motif_demande}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{demande.date_demande ? new Date(demande.date_demande).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">
                          <Badge variant={demande.state === 'pending' ? 'secondary' : (demande.state === 'approved' ? 'default' : 'destructive')}>
                            {demande.state}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">
                          {demande.state === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleProcessDemande(demande.id, 'approve')}>Accepter</Button>
                              <Button size="sm" variant="outline" onClick={() => handleProcessDemande(demande.id, 'reject')}>Refuser</Button>
                            </div>
                          )}
                          {demande.state === 'approved' && (
                            <div className="flex gap-2 items-center text-green-600">
                                <span className="font-semibold">Approuvée</span>
                                {/* Bouton pour allouer le matériel (facultatif si le processus est manuel après approbation) */}
                                {/* <Button size="sm" onClick={() => navigate(`/admin/allouer-materiel?demandeId=${demande.id}`)}>Allouer</Button> */}
                            </div>
                          )}
                          {demande.state === 'rejected' && (
                            <p className="text-red-600 font-semibold">Rejetée</p>
                          )}
                           {demande.state === 'allocated' && (
                            <p className="text-blue-600 font-semibold">Allouée</p>
                          )}
                           <Button size="sm" variant="secondary" onClick={() => handleVoirDetails(demande.id)} className="ml-2">Voir</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
