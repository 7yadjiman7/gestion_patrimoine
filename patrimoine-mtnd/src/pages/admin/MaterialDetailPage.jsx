import React, { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useParams, useNavigate } from "react-router-dom"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Menu } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import materialService from "@/services/materialService"
import AppLayout from "@/components/AppLayout"
import { API_BASE_URL } from "@/config/api"
import {
    Edit,
    FileText,
    CheckCircle,
    RefreshCw,
    AlertTriangle,
    Trash2,
    Wrench,
} from "lucide-react"

export default function MaterialDetailPage() {
    console.log("[DEBUG] Rendering MaterialDetailPage")
    const { id } = useParams()
    console.log("[DEBUG] Material ID from params:", id)
    const navigate = useNavigate()

    const [material, setMaterial] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState("informations")

    // Fonction pour charger les données, réutilisable pour rafraîchir la page
    const loadMaterial = () => {
        console.log("[DEBUG] Loading material data for ID:", id)
        setIsLoading(true)
        materialService
            .fetchMaterialDetails(id)
            .then(responseData => {
                // Le service retourne maintenant directement l'objet matériel
                console.log("[DEBUG] Material data loaded:", responseData)
                setMaterial(responseData)
            })
            .catch(err => {
                console.error("[DEBUG] Error loading material:", err)
                setError(err.message || "Erreur de chargement des détails.")
            })
            .finally(() => setIsLoading(false))
    }

    useEffect(() => {
        loadMaterial()
    }, [id])

    const handleNavigateToMouvement = mouvementType => {
        if (!material) return

        // Prépare les données à transmettre
        const navigationState = {
            sourceLocationId: material.location_id,
            sourceEmployeeId: material.assigned_to_id,
        }

        navigate(
            // On garde les paramètres dans l'URL pour la compatibilité
            `/admin/mouvement?assetId=${material.id}&type=${mouvementType}`,
            {
                // On ajoute l'état "invisible" qui contient les IDs sources
                state: navigationState,
            }
        )
    }

    const handleModifier = () => {
        // On navigue vers la page d'ajout...
        navigate("/admin/ajouter", {
            // ...en passant l'ID du matériel à modifier dans l'état de la navigation.
            // La page d'ajout pourra ainsi récupérer cet ID.
            state: { materialId: id },
        })
    }

    // CORRECTION : Fonction unifiée pour mettre à jour le statut
    const handleStatusUpdate = async newStatus => {
        if (!material) return

        // Création d'un FormData pour envoyer la mise à jour
        const formData = new FormData()
        formData.append("etat", newStatus)

        try {
            await materialService.updateItem(material.id, formData)
            toast.success(`Statut du matériel mis à jour avec succès !`)
            loadMaterial() // On recharge les données pour afficher le nouveau statut
        } catch (error) {
            console.error(
                `Erreur lors de la mise à jour du statut vers ${newStatus}:`,
                error
            )
            toast.error(`Échec de la mise à jour: ${error.message}`)
        }
    }

    const handleVoirFicheVie = async () => {
        if (!material) return
        try {
            // Utilise la bonne fonction du service
            await materialService.printFicheViePdf(material.id)
        } catch (err) {
            toast.error(
                `Erreur lors de l'ouverture de la fiche de vie : ${err.message}`
            )
        }
    }

    const handleSupprimer = async () => {
        if (!material) return
        if (
            window.confirm(
                "Êtes-vous sûr de vouloir supprimer ce matériel ? Cette action est irréversible."
            )
        ) {
            try {
                // On appelle la fonction corrigée du service
                await materialService.deleteMaterial(material.id)
                toast.success("Matériel supprimé avec succès")
                navigate("/admin") // Redirige vers la page principale
            } catch (error) {
                console.error("Erreur lors de la suppression:", error)
                toast.error(`Échec de la suppression: ${error.message}`)
            }
        }
    }

    console.log("[DEBUG] Render state - isLoading:", isLoading, "error:", error, "material:", material)
    if (isLoading) {
        return (
            <div className="flex-1 p-6 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            
        )
    }

    if (error) {
        return (
            <div className="flex-1 p-6 text-center">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="text-red-600">
                            Erreur de chargement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4">{error}</p>
                        <Button onClick={() => navigate("/admin")}>
                            Retour au Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!material) {
        return (
            
                <div className="flex-1 p-6 text-center">
                    <Card className="max-w-md mx-auto">
                        <CardHeader>
                            <CardTitle>Matériel non trouvé</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => navigate("/admin")}>
                                Retour au Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            
        )
    }

    console.log("[DEBUG] Rendering main component content")
    return (
        <div className="flex-1 p-4 md:p-6 rounded-lg shadow-sm ">
            {/* Main content */}
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Retour
                </Button>
            </div>
            <div className="space-y-2">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Détails du Matériel
                </h1>
                <p className="text-gray-800 text-center">
                    Informations complètes et actions disponibles
                </p>
            </div>

            <Tabs defaultValue="informations" className="space-y-6">
                <div className="flex border-b border-orange-500 rounded-t overflow-hidden bg-white">
                    <button
                        type="button"
                        onClick={() => setActiveTab("informations")}
                        className={`w-1/3 py-4 px-1 text-center font-medium text-sm border-b-2 transition-all duration-300 ${
                            activeTab === "informations"
                                ? "border-orange-500 text-orange-600 bg-orange-50"
                                : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-orange-100/50"
                        }`}
                    >
                        Informations Générales
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("historique")}
                        className={`w-1/3 py-4 px-1 text-center font-medium text-sm border-b-2 transition-all duration-300 ${
                            activeTab === "historique"
                                ? "border-orange-500 text-orange-600 bg-orange-50"
                                : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-orange-100/50"
                        }`}
                    >
                        Historique
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab("documents")}
                        className={`w-1/3 py-4 px-1 text-center font-medium text-sm border-b-2 transition-all duration-300 ${
                            activeTab === "documents"
                                ? "border-orange-500 text-orange-600 bg-orange-50"
                                : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-orange-100/50"
                        }`}
                    >
                        Documents
                    </button>
                </div>

                {activeTab === "informations" && (
                    <div className="mt-6">
                        <Card>
                            <CardHeader className="pb-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-3">
                                            {material.name}
                                            <Badge
                                                variant="outline"
                                                className="text-sm"
                                            >
                                                {material.code}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {/* CORRECTION : Utilise material.category qui existe dans les données */}
                                            {material.category ||
                                                "Catégorie non définie"}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Image à gauche */}
                                    <div className="w-full md:w-1/3 flex justify-center">
                                        <img
                                            src={
                                                material.image
                                                    ? `${import.meta.env.VITE_ODOO_URL || "http://localhost:8069"}${material.image}`
                                                    : "/images/default-material.jpg"
                                            }
                                            alt={material.name}
                                            className="rounded-lg border shadow-sm max-h-96 w-full object-contain"
                                            onError={e => {
                                                e.target.src =
                                                    "/images/default-material.jpg"
                                            }}
                                        />
                                    </div>

                                    {/* Informations à droite */}
                                    <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Section Principale */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">
                                                Informations Générales
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Type
                                                    </p>
                                                    <p>{material.type}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Statut
                                                    </p>
                                                    <Badge
                                                        className={
                                                            material.status ===
                                                            "service"
                                                                ? "bg-green-500 hover:bg-green-600"
                                                                : material.status ===
                                                                    "stock"
                                                                  ? "bg-yellow-500 hover:bg-yellow-600"
                                                                  : "bg-red-500 hover:bg-red-600"
                                                        }
                                                    >
                                                        {material.status}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Date d'acquisition
                                                    </p>
                                                    <p>
                                                        {material.acquisitionDate
                                                            ? new Date(
                                                                  material.acquisitionDate
                                                              ).toLocaleDateString()
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Valeur
                                                    </p>
                                                    <p>
                                                        {material.value
                                                            ? `${material.value} €`
                                                            : "N/A"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section Localisation */}
                                        <div className="space-y-4">
                                            <h3 className="font-semibold text-lg">
                                                Localisation
                                            </h3>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Emplacement
                                                    </p>
                                                    <p>
                                                        {material.location ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Département
                                                    </p>
                                                    <p>
                                                        {material.department ||
                                                            "N/A"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Assigné à
                                                    </p>
                                                    <p>
                                                        {material.assignedTo ||
                                                            "Non affecté"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section Détails Spécifiques */}
                                        {material.type === "informatique" &&
                                            material.details && (
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-lg">
                                                        Détails Informatique
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Marque
                                                            </p>
                                                            <p>
                                                                {material
                                                                    .details
                                                                    .marque ||
                                                                    "N/A"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Modèle
                                                            </p>
                                                            <p>
                                                                {material
                                                                    .details
                                                                    .modele ||
                                                                    "N/A"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">
                                                                N° de série
                                                            </p>
                                                            <p>
                                                                {material
                                                                    .details
                                                                    .numero_serie ||
                                                                    "N/A"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        {material.type === "vehicule" &&
                                            material.details && (
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-lg">
                                                        Détails Véhicule
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Immatriculation
                                                            </p>
                                                            <p>
                                                                {material
                                                                    .details
                                                                    .immatriculation ||
                                                                    "N/A"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">
                                                                Kilométrage
                                                            </p>
                                                            <p>
                                                                {material
                                                                    .details
                                                                    .kilometrage ||
                                                                    "N/A"}{" "}
                                                                km
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        {material.customValues && (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-lg">
                                                    Champs Personnalisés
                                                </h3>
                                                <div className="space-y-3">
                                                    {Object.entries(
                                                        material.customValues
                                                    ).map(([key, value]) => (
                                                        <div key={key}>
                                                            <p className="text-sm text-muted-foreground">
                                                                {key}
                                                            </p>
                                                            <p>
                                                                {String(value)}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>

                            <Separator className="my-4" />

                            <CardContent>
                                <h3 className="font-semibold text-lg mb-4">
                                    Actions
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={handleModifier}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 font-semibold rounded-lg shadow-sm hover:bg-yellow-500 transition-colors"
                                    >
                                        <Edit size={16} />
                                        Modifier
                                    </button>

                                    {/* Actions selon le statut du matériel */}
                                    {material.status === "stock" && (
                                        <button
                                            onClick={() =>
                                                handleNavigateToMouvement(
                                                    "affectation"
                                                )
                                            }
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 transition-colors"
                                        >
                                            <CheckCircle size={16} />
                                            Affecter
                                        </button>
                                    )}

                                    {material.status === "service" && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    handleNavigateToMouvement(
                                                        "transfert"
                                                    )
                                                }
                                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-sm hover:bg-cyan-700 transition-colors"
                                            >
                                                <RefreshCw size={16} />
                                                Transférer
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleNavigateToMouvement(
                                                        "reparation"
                                                    )
                                                }
                                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-sm hover:bg-purple-700 transition-colors"
                                            >
                                                <Wrench size={16} />
                                                Réparation
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleNavigateToMouvement(
                                                        "sortie"
                                                    )
                                                }
                                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-colors"
                                            >
                                                <AlertTriangle size={16} />
                                                Mettre HS
                                            </button>
                                            <button
                                                onClick={handleVoirFicheVie}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                                            >
                                                <FileText size={16} />
                                                Fiche de vie
                                            </button>
                                        </>
                                    )}

                                    {material.status === "hs" && (
                                        <button
                                            onClick={handleVoirFicheVie}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
                                        >
                                            <FileText size={16} />
                                            Fiche de vie
                                        </button>
                                    )}

                                    <button
                                        onClick={handleSupprimer}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-red-700 transition-colors ml-auto hover:text-white"
                                    >
                                        <Trash2 size={16} />
                                        Supprimer
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "historique" && (
                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historique des mouvements</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Fonctionnalité à venir
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === "documents" && (
                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents associés</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Fonctionnalité à venir
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </Tabs>
        </div>
    )
}
