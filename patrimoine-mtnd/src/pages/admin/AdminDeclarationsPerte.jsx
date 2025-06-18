import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import materialService from '@/services/materialService'; // Importez le service
import AppSidebar from '@/components/app-sidebar'; // Inclusion de la sidebar

// Définition des colonnes du tableau pour les déclarations de perte
const tableHeaders = [
  "Référence", "Bien concerné", "Code Bien", "Date Déclaration", "Motif", "Déclaré par", "Statut", "Actions"
];

export default function AdminDeclarationsPerte() {
  const navigate = useNavigate();
  const [pertes, setPertes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour charger les déclarations de perte depuis l'API
  const loadPertes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await materialService.fetchDeclarationsPerte();
      setPertes(Array.isArray(data) ? data : []); // S'assurer que c'est un tableau
      console.log("Déclarations de perte chargées:", data);
    } catch (err) {
      console.error("Erreur chargement des déclarations de perte:", err);
      setError(err.message || "Impossible de charger les déclarations de perte.");
    } finally {
      setIsLoading(false);
    }
  };

  // Chargement des déclarations de perte au montage du composant
  useEffect(() => {
    loadPertes();
  }, []);

  // Gère l'action "Confirmer" ou "Rejeter" une déclaration de perte
  const handleProcessPerte = async (perteId, action) => {
    if (!window.confirm(`Voulez-vous vraiment ${action === 'confirm' ? 'CONFIRMER' : 'REJETER'} cette déclaration (Référence: ${perteId}) ?`)) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await materialService.processPerte(perteId, action);
      
      if (response && response.status === 'success') {
          alert(`Déclaration ${action === 'confirm' ? 'confirmée' : 'rejetée'} avec succès !`);
          loadPertes(); // Recharger les déclarations pour mettre à jour l'affichage
          // Si confirmée, vous pouvez rediriger vers une page de suivi ou d'allocation si nécessaire.
          // navigate(`/admin/traiter-perte?perteId=${perteId}`);
      } else {
          throw new Error(response.message || "Réponse inattendue du serveur lors du traitement.");
      }
    } catch (err) {
      console.error(`Erreur lors du traitement de la déclaration ${perteId}:`, err);
      alert(`Erreur lors du traitement: ${err.message || "Veuillez réessayer."}`);
    } finally {
      // setIsLoading(false); // Sera géré par loadPertes() qui se termine en finally
    }
  };

  // Gère l'action "Voir" les détails de la déclaration de perte
  const handleVoirDetails = (perteId) => {
    alert(`Action: Voir les détails de la déclaration de perte ID ${perteId}`);
    // navigate(`/admin/perte/${perteId}`); // Exemple de redirection vers une page de détail de perte
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
      <AppSidebar />

      <div className="flex-1 p-6 ml-[180px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gestion des Déclarations de Perte</h1>
          <p className="text-gray-600">Liste des déclarations de perte soumises.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Déclarations en attente de traitement</CardTitle>
          </CardHeader>
          <CardContent>
            {pertes.length === 0 ? (
              <p className="text-gray-500 text-center">Aucune déclaration de perte à traiter pour le moment.</p>
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
                    {pertes.map((perte) => (
                      <tr key={perte.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{perte.name}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{perte.asset_name} ({perte.asset_code})</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{perte.date ? new Date(perte.date).toLocaleDateString() : 'N/A'}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{perte.motif}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">{perte.declarer_par_name}</td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">
                          <Badge variant={perte.state === 'pending' ? 'secondary' : (perte.state === 'confirmed' ? 'default' : 'destructive')}>
                            {perte.state}
                          </Badge>
                        </td>
                        <td className="py-2 px-4 border-b text-sm text-gray-900">
                          {perte.state === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleProcessPerte(perte.id, 'confirm')}>Confirmer</Button>
                              <Button size="sm" variant="outline" onClick={() => handleProcessDemande(perte.id, 'reject')}>Refuser</Button>
                            </div>
                          )}
                          {perte.state === 'confirmed' && (
                            <div className="flex gap-2 items-center text-green-600">
                                <span className="font-semibold">Confirmée</span>
                                {/* Optionnel: Bouton pour marquer comme 'traitée' après la confirmation */}
                                {/* <Button size="sm" onClick={() => handleProcessPerte(perte.id, 'processed')}>Traiter</Button> */}
                            </div>
                          )}
                          {perte.state === 'rejected' && (
                            <p className="text-red-600 font-semibold">Rejetée</p>
                          )}
                          {perte.state === 'processed' && (
                            <p className="text-blue-600 font-semibold">Traitée</p>
                          )}
                          <Button size="sm" variant="secondary" onClick={() => handleVoirDetails(perte.id)} className="ml-2">Voir</Button>
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