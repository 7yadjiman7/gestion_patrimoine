import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import materialService from "@/services/materialService"
import { useAuth } from "@/context/AuthContext"
import { toast } from "react-hot-toast"
import { StatCard } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Search,
    PlusCircle,
    Package,
    CheckCircle,
    Archive,
    AlertTriangle,
    User,
    MapPin,
    Euro,
} from "lucide-react"

// Styles des cartes pour la cohérence visuelle
const cardClasses = {
    base: "relative group w-full h-96 rounded-2xl overflow-hidden shadow-lg cursor-pointer transform hover:-translate-y-2 transition-all duration-300 hover:shadow-indigo-100",
    imageContainer: "relative w-full h-full overflow-hidden",
    image: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105",
    imageOverlay:
        "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
    content: "absolute bottom-0 left-0 right-0 p-6",
    title: "font-bold text-lg text-white truncate",
    code: "text-xs font-mono text-white opacity-80",
    statusBar: "absolute top-4 right-4",
    statusBadge:
        "text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm",
    hoverDetails:
        "absolute inset-0 bg-white bg-opacity-95 p-6 flex flex-col justify-center items-start gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
    detailItem: "flex items-center gap-2 text-sm text-gray-700",
}

const getStatusColor = status => {
    switch (status?.toLowerCase()) {
        case "service":
            return "#16a34a" // vert
        case "stock":
            return "#eab308" // jaune
        default:
            return "#dc2626" // rouge
    }
}

export default function DirDashboardPage() {
    const { currentUser: user } = useAuth()
    const navigate = useNavigate()

    const [materials, setMaterials] = useState([])
    const [stats, setStats] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    const directorDepartmentId = user?.department_id

    useEffect(() => {
        const loadData = async () => {
            if (!directorDepartmentId) {
                setIsLoading(false)
                setError(
                    "Impossible de déterminer le département du directeur."
                )
                return
            }
            setIsLoading(true)
            try {
                const [materialsApiResult, departmentStatsData] =
                    await Promise.all([
                        materialService.getMaterialsByDepartment(
                            directorDepartmentId
                        ),
                        materialService.fetchStatsForOneDepartment(
                            directorDepartmentId
                        ),
                    ])
                setMaterials(
                    Array.isArray(materialsApiResult) ? materialsApiResult : []
                )
                setStats(departmentStatsData)
            } catch (err) {
                setError(err.message || "Une erreur est survenue.")
                toast.error("Erreur de chargement des données.")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [directorDepartmentId])

    const filteredMaterials = Array.isArray(materials)
        ? materials.filter(
              material =>
                  material.name
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                  material.code
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase())
          )
        : []

    const handleMaterialClick = materialId => {
        navigate(`/admin/materiel/${materialId}`)
    }

    if (isLoading)
        return (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
        )
    if (error)
        return <div className="p-8 text-center text-red-400">{error}</div>

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">
                    Matériels de la Direction - {user?.department_name || "N/A"}
                </h1>
                <p className="text-gray-400 mt-1">
                    Consultez les biens affectés à votre direction.
                </p>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Matériels"
                        value={stats.total}
                        icon={<Package />}
                        className="bg-blue-600 text-white"
                    />
                    <StatCard
                        title="En Service"
                        value={stats.inService}
                        icon={<CheckCircle />}
                        className="bg-green-600 text-white"
                    />
                    <StatCard
                        title="En Stock"
                        value={stats.inStock}
                        icon={<Archive />}
                        className="bg-yellow-500 text-white"
                    />
                    <StatCard
                        title="Hors Service"
                        value={stats.outOfService}
                        icon={<AlertTriangle />}
                        className="bg-red-600 text-white"
                    />
                </div>
            )}

            <div className="mb-8 w-full flex justify-between items-center">
                <div className="relative flex-grow max-w-lg">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                    <Input
                        placeholder="Rechercher dans les matériels de la direction..."
                        className="pl-12 w-full py-3 text-base bg-slate-800 border-slate-700 text-white rounded-lg"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    className="ml-4 gap-2"
                    onClick={() => navigate("/director/demandes")}
                >
                    <PlusCircle className="h-4 w-4" />
                    Faire une demande
                </Button>
            </div>

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
                                            ? `http://localhost:8069${material.image}`
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
                                <div className={cardClasses.hoverDetails}>
                                    <div className={cardClasses.detailItem}>
                                        <User className="h-4 w-4 text-purple-500" />
                                        <span>
                                            {material.assignedTo ||
                                                "Non affecté"}
                                        </span>
                                    </div>
                                    <div className={cardClasses.detailItem}>
                                        <Euro className="h-4 w-4 text-green-500" />
                                        <span>
                                            {material.value
                                                ? `${material.value.toLocaleString("fr-FR")} €`
                                                : "N/A"}
                                        </span>
                                    </div>
                                    <div className={cardClasses.detailItem}>
                                        <MapPin className="h-4 w-4 text-red-500" />
                                        <span>
                                            {material.location || "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className={cardClasses.content}>
                                <h3 className={cardClasses.title}>
                                    {material.name}
                                </h3>
                                <p className={cardClasses.code}>
                                    {material.code || "N/A"}
                                </p>
                            </div>
                            <div className={cardClasses.statusBar}>
                                <span
                                    className={cardClasses.statusBadge}
                                    style={{
                                        backgroundColor: getStatusColor(
                                            material.status
                                        ),
                                    }}
                                >
                                    {material.status || "N/A"}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full">
                        <Card className="border-dashed bg-slate-800/50 border-slate-700">
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Package className="h-16 w-16 text-slate-600 mb-4" />
                                <h3 className="text-lg font-semibold text-white">
                                    Aucun matériel trouvé
                                </h3>
                                <p className="text-slate-400">
                                    Aucun matériel n'est actuellement affecté à
                                    votre direction.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
