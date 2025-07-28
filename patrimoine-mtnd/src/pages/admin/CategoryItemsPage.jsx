import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StatCard } from "@/components/ui/stat-card"
import materialService from "@/services/materialService"
import { ArrowLeft, PlusCircle, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"

// Nouveaux styles pour les cartes (inspirés de AdminMaterialTypes.jsx)
const cardClasses = {
    base: "relative group w-full h-96 rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform hover:-translate-y-3 transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-indigo-500/50",
    imageContainer: "relative w-full h-full overflow-hidden",
    image: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ease-in-out",
    imageOverlay:
        "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-90",
    content: "absolute bottom-0 left-0 right-0 p-6",
    statusBar: "flex justify-between items-center gap-2",
    typeBadge:
        "text-white text-sm font-medium bg-indigo-600/90 px-3 py-1 rounded-full backdrop-blur-sm",
    statusBadge:
        "text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm",
}

// Fonction pour obtenir la couleur selon le statut
const getStatusColor = status => {
    switch (status?.toLowerCase()) {
        case "service":
        case "en service":
            return "#16a34a" // vert
        case "stock":
        case "en stock":
            return "#eab308" // jaune
        default:
            return "#dc2626" // rouge
    }
}

// Fonction pour obtenir l'icône du statut
const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
        case "service":
        case "en service":
            return "🔄"
        case "stock":
        case "en stock":
            return "📦"
        case "maintenance":
            return "🔧"
        case "hors service":
        case "défaillant":
            return "⚠️"
        default:
            return "📋"
    }
}

export default function CategoryItemsPage() {
    const { type: paramType, category: paramCategory } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const [materials, setMaterials] = useState([])
    const [stats, setStats] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [pageTitle, setPageTitle] = useState("Matériels")

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            setError(null)

            const filters = {}
            if (paramCategory) filters.subcategoryCode = paramCategory
            if (paramType) filters.type = paramType

            for (const [key, value] of searchParams.entries()) {
                filters[key] = value
            }

            let title = "Matériels Filtrés"
            if (filters.subcategoryCode)
                title = `Catégorie : ${filters.subcategoryCode.charAt(0).toUpperCase() + filters.subcategoryCode.slice(1)}`
            else if (filters.type)
                title = `Type : ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`
            else if (filters.status)
                title = `Matériels avec le statut : ${filters.status}`
            setPageTitle(title)

            try {
                const [materialsData, statsData] = await Promise.all([
                    materialService.fetchFilteredMaterials(filters),
                    materialService.getCategoryStats(
                        filters.type,
                        filters.subcategoryCode
                    ),
                ])

                setMaterials(Array.isArray(materialsData) ? materialsData : [])
                setStats(statsData)
            } catch (err) {
                console.error("Erreur chargement des données:", err)
                setError(err.message || "Une erreur est survenue.")
                toast.error(
                    "Impossible de charger les données pour cette sélection."
                )
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [paramType, paramCategory, searchParams])

    const filteredMaterials = Array.isArray(materials)
        ? materials.filter(material => {
              const query = searchQuery.toLowerCase()
              return (
                  (material.name &&
                      material.name.toLowerCase().includes(query)) ||
                  (material.code &&
                      material.code.toLowerCase().includes(query)) ||
                  (material.status &&
                      material.status.toLowerCase().includes(query)) ||
                  (material.type &&
                      material.type.toLowerCase().includes(query)) ||
                  (material.category_general_name &&
                      material.category_general_name
                          .toLowerCase()
                          .includes(query)) ||
                  (material.category_detailed_name &&
                      material.category_detailed_name
                          .toLowerCase()
                          .includes(query)) ||
                  (material.location &&
                      material.location.toLowerCase().includes(query)) ||
                  (material.assignedTo &&
                      material.assignedTo.toLowerCase().includes(query)) ||
                  (material.acquisitionDate &&
                      material.acquisitionDate.toLowerCase().includes(query)) ||
                  (material.value &&
                      material.value.toString().toLowerCase().includes(query))
              )
          })
        : []

    const handleMaterialClick = materialId => {
        navigate(`/admin/materiel/${materialId}`)
    }

    if (isLoading) {
        return (
            <div className="flex-1 min-w-0 p-6 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-gray-600">Chargement des matériels...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 min-w-0 p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold text-red-700 mb-4">
                        Erreur de chargement
                    </h2>
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
        )
    }

    return (
        <div className="flex-1 p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => navigate(-1)}>
                            Retour
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-100">
                                {pageTitle}
                            </h1>
                            <p className="text-gray-400">
                                Consultez les biens correspondant à votre
                                sélection.
                            </p>
                        </div>
                    </div>
                    <Button
                        className="gap-2 bg-orange-600 hover:bg-orange-500 text-white"
                        onClick={() => navigate(`/admin/ajouter`)}
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

            {/* Search Bar */}
            <div className="mb-8 w-full">
                <div className="relative w-full max-w-4xl mx-auto">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                    <Input
                        placeholder="Rechercher un matériel dans cette liste..."
                        className="pl-12 w-full py-5 text-lg bg-slate-800 text-slate-100 border-slate-600 rounded-xl shadow-sm placeholder:text-slate-400"
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
                            onClick={() => handleMaterialClick(material.id)}
                        >
                            <div className={cardClasses.imageContainer}>
                                <img
                                    src={
                                        material.image
                                            ? `${import.meta.env.VITE_ODOO_URL || "http://localhost:8069"}${material.image}`
                                            : "/images/default-material.jpg"
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
                            <div className={cardClasses.content}>
                                {/* Ajout des informations supplémentaires */}
                                <div className="mt-2 mb-10 text-white">
                                    <h2 className="text-xl font-semibold truncate">
                                        Nom: {material.name}
                                    </h2>

                                    {material.value && (
                                        <p className="text-sm text-white">
                                            Valeur : {material.value}
                                        </p>
                                    )}
                                    {material.assignedTo && (
                                        <p className="text-sm text-white">
                                            Attribué à : {material.assignedTo}
                                        </p>
                                    )}
                                </div>
                                <div className={cardClasses.statusBar}>
                                    <span className={cardClasses.typeBadge}>
                                        {material.type || "Type"}
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
                    <div className="col-span-full">
                        <Card className="bg-slate-800 border-slate-700 text-white">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Search className="h-12 w-12 text-slate-400 mb-4" />
                                <h3 className="text-lg font-semibold">
                                    Aucun matériel trouvé
                                </h3>
                                <p className="text-gray-400">
                                    {searchQuery
                                        ? `Aucun résultat pour "${searchQuery}".`
                                        : "Aucun matériel ne correspond à vos filtres."}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
