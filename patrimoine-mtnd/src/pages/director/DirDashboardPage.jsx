import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import materialService from "@/services/materialService"
import { useAuth } from "@/context/AuthContext"
import { toast } from "react-hot-toast"
import { StatCard } from "@/components/ui/stat-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { API_BASE_URL } from "@/config/api"
import { motion } from "framer-motion"
import {
    Search,
    PlusCircle,
    Package,
    CheckCircle,
    Archive,
    AlertTriangle,
} from "lucide-react"

// Styles des cartes (alignés sur CategoryItemsPage)
const cardClasses = {
    base: "relative group w-full h-96 rounded-2xl overflow-hidden shadow-2xl cursor-pointer transform hover:-translate-y-3 transition-all duration-500 hover:shadow-2xl hover:ring-2 hover:ring-indigo-500/50",
    imageContainer: "relative w-full h-full overflow-hidden",
    image: "w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ease-in-out",
    imageOverlay:
        "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-90",
    content: "absolute bottom-0 left-0 right-0 p-6",
    statusBar: "flex justify-between items-center gap-2",
    typeBadge: "text-white text-sm font-medium bg-indigo-600/90 px-3 py-1 rounded-full backdrop-blur-sm",
    statusBadge: "text-white text-sm font-medium px-3 py-1 rounded-full backdrop-blur-sm",
}

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

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

    if (isLoading)
        return (
            <div className="p-8 text-center text-gray-400">Chargement...</div>
        )
    if (error)
        return <div className="p-8 text-center text-red-400">{error}</div>

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Matériels de la Direction - {user?.department_name || "N/A"}
                </h1>
                <p className="text-black mt-1">
                    Consultez les biens affectés à votre direction.
                </p>
            </div>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

            <div className="mb-8 w-full flex justify-between items-center">
                <div className="relative w-full max-w-lg">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                    <Input
                        placeholder="Rechercher dans les matériels de la direction..."
                        className="pl-12 w-full py-5 text-lg bg-slate-800 text-slate-100 border-slate-600 rounded-xl shadow-sm placeholder:text-slate-400"
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

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
                {filteredMaterials.length > 0 ? (
                    filteredMaterials.map(material => (
                        <motion.div
                            variants={itemVariants}
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
                        </motion.div>
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
            </motion.div>
        </div>
    )
}
