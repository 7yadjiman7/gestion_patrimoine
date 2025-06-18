import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import materialService from "@/services/materialService";
import AppSidebar from "@/components/app-sidebar";

export default function MaterialDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [material, setMaterial] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadMaterial = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const materialData = await materialService.fetchMaterialDetails(id);
                setMaterial(materialData);
            } catch (error) {
                console.error("Error loading material details:", error);
                setError(error.message || "Impossible de charger les détails du matériel.");
            } finally {
                setIsLoading(false);
            }
        };
        loadMaterial();
    }, [id]);

    // Fonctions d'action
    const handleModifier = () => navigate(`/admin/ajouter?assetId=${material.id}`);
    const handleAffecter = () => navigate(`/admin/mouvement?assetId=${material.id}`);
    const handleMettreHorsService = () => navigate(`/admin/mouvement?assetId=${material.id}`);
    const handleRetourStock = () => navigate(`/admin/ajouter?assetId=${material.id}`);

    const handleVoirFicheVie = async () => {
        try {
            await materialService.printFicheViePdf(material.id);
        } catch (err) {
            alert(`Erreur lors de l'impression de la fiche de vie: ${err.message}`);
            console.error('Error printing fiche vie:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex">
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
                <div className="flex-1 p-6 ml-[250px] text-center">
                    <Card className="max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle className="text-red-600">Erreur de chargement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="mb-4">{error}</p>
                            <Button onClick={() => navigate("/admin")}>Retour au Dashboard</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="flex">
                <AppSidebar />
                <div className="flex-1 p-6 ml-[250px] text-center">
                    <Card className="max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>Matériel non trouvé</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/admin")}>Retour au Dashboard</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <AppSidebar />

            <div className="flex-1 p-6 ml-[180px] space-y-6">
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Détails du Matériel</h1>
                    <p className="text-muted-foreground">Informations complètes et actions disponibles</p>
                </div>

                <Tabs defaultValue="informations" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="informations">Informations</TabsTrigger>
                        <TabsTrigger value="historique">Historique</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="informations">
                        <Card>
                            <CardHeader className="pb-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-3">
                                            {material.name} 
                                            <Badge variant="outline" className="text-sm">
                                                {material.code}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {material.category_general_name || 'N/A'} &gt; {material.category_detailed_name || 'N/A'}
                                        </CardDescription>
                                    </div>
                                    <Badge 
                                        variant={
                                            material.status === 'service' ? 'default' : 
                                            material.status === 'stock' ? 'secondary' : 'destructive'
                                        }
                                    >
                                        {material.status}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {/* Section Principale */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Informations Générales</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Type</p>
                                                <p>{material.type}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Statut</p>
                                                <p>{material.status}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Date d'acquisition</p>
                                                <p>{material.acquisitionDate ? new Date(material.acquisitionDate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Valeur</p>
                                                <p>{material.value ? `${material.value} €` : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Localisation */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg">Localisation</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Emplacement</p>
                                                <p>{material.location || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Département</p>
                                                <p>{material.department || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Assigné à</p>
                                                <p>{material.assignedTo || 'Non affecté'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Détails Spécifiques */}
                                    {material.type === 'informatique' && material.details && (
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">Détails Informatique</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Marque</p>
                                                    <p>{material.details.marque || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Modèle</p>
                                                    <p>{material.details.modele || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">N° de série</p>
                                                    <p>{material.details.numero_serie || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {material.type === 'vehicule' && material.details && (
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">Détails Véhicule</h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Immatriculation</p>
                                                    <p>{material.details.immatriculation || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Kilométrage</p>
                                                    <p>{material.details.kilometrage || 'N/A'} km</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {material.customValues && (
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">Champs Personnalisés</h3>
                                            <div className="space-y-3">
                                                {Object.entries(material.customValues).map(([key, value]) => (
                                                    <div key={key}>
                                                        <p className="text-sm text-muted-foreground">{key}</p>
                                                        <p>{String(value)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {material.image && (
                                        <div className="lg:col-span-1 flex justify-center items-start">
                                            <img 
                                                src={material.image} 
                                                alt={material.name} 
                                                className="rounded-lg border shadow-sm max-h-64 object-contain"
                                            />
                                        </div>
                                    )}
                                </div>
                            </CardContent>

                            <Separator className="my-4" />

                            <CardContent>
                                <h3 className="font-semibold text-lg mb-4">Actions</h3>
                                <div className="flex flex-wrap gap-3">
                                    <Button onClick={handleModifier} variant="outline">
                                        Modifier
                                    </Button>

                                    {material.status === "stock" && (
                                        <Button onClick={handleAffecter} className="bg-green-600 hover:bg-green-700">
                                            Affecter
                                        </Button>
                                    )}

                                    {material.status === "service" && (
                                        <>
                                            <Button onClick={handleVoirFicheVie} variant="secondary">
                                                Fiche de vie
                                            </Button>
                                            <Button onClick={handleMettreHorsService} variant="destructive">
                                                Mettre HS
                                            </Button>
                                        </>
                                    )}

                                    {material.status === "hs" && (
                                        <Button onClick={handleRetourStock} className="bg-purple-600 hover:bg-purple-700">
                                            Retour en stock
                                        </Button>
                                    )}

                                    <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                                        Supprimer
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="historique">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historique des mouvements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Fonctionnalité à venir</p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents associés</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">Fonctionnalité à venir</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}