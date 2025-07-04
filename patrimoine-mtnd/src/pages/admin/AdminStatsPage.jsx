import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import materialService from "@/services/materialService"
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts"
import { TrendingUp } from "lucide-react"

const COLORS_PIE = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]
const COLORS_BAR = ["#8884d8", "#82ca9d", "#ffc658", "#ff80b3", "#a4de6c"]
const toEuro = value =>
    new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(value)

export default function AdminStatsPage() {
    const navigate = useNavigate()

    const [statsByDepartment, setStatsByDepartment] = useState([])
    const [statsByType, setStatsByType] = useState([])
    const [statsByDetailedCategory, setStatsByDetailedCategory] = useState([])
    const [globalStatusStats, setGlobalStatusStats] = useState(null)
    const [statsByAge, setStatsByAge] = useState([])
    const [statsByDepartmentValue, setStatsByDepartmentValue] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadAllStats = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const [
                    deptStats,
                    typeStatsRaw,
                    detailedCategoryStatsRaw,
                    globalStatsRaw,
                    ageStats,
                    deptValueStats,
                ] = await Promise.all([
                    materialService.fetchAllDepartmentStats(),
                    materialService.fetchStatsByType(),
                    materialService.fetchStatsByDetailedCategory(),
                    materialService.fetchStats(),
                    materialService.fetchStatsByAge(),
                    materialService.fetchStatsByDepartmentValue(),
                ])

                setStatsByDepartment(Array.isArray(deptStats) ? deptStats : [])
                setStatsByType(Array.isArray(typeStatsRaw) ? typeStatsRaw : [])
                setStatsByDetailedCategory(
                    Array.isArray(detailedCategoryStatsRaw)
                        ? detailedCategoryStatsRaw
                        : []
                )
                setGlobalStatusStats(globalStatsRaw)
                setStatsByAge(Array.isArray(ageStats) ? ageStats : [])
                setStatsByDepartmentValue(
                    Array.isArray(deptValueStats) ? deptValueStats : []
                )
            } catch (err) {
                console.error(
                    "Erreur lors du chargement des statistiques:",
                    err
                )
                setError(
                    err.message || "Impossible de charger les statistiques."
                )
                toast.error("Erreur de chargement des statistiques.")
            } finally {
                setIsLoading(false)
            }
        }
        loadAllStats()
    }, [])

    const statusPieData = globalStatusStats
        ? [
              { name: "En Service", value: globalStatusStats.inService },
              { name: "En Stock", value: globalStatusStats.inStock },
              { name: "Hors Service", value: globalStatusStats.outOfService },
          ].filter(item => item.value > 0)
        : []

    const handlePieClick = data => {
        const statusMap = {
            "En Service": "service",
            "En Stock": "stock",
            "Hors Service": "hs",
        }
        const filterValue = statusMap[data.name]
        if (filterValue)
            navigate(`/admin/materiels/filtres?status=${filterValue}`)
    }

    const handleDepartmentClick = data => {
        if (data?.activePayload?.[0]?.payload?.id) {
            navigate(
                `/admin/materiels/filtres?departmentId=${data.activePayload[0].payload.id}`
            )
        }
    }

    const handleTypeClick = data => {
        if (data?.activePayload?.[0]?.payload?.code) {
            navigate(
                `/admin/materiels/filtres?type=${data.activePayload[0].payload.code}`
            )
        }
    }

    const handleSubcategoryClick = data => {
        if (data?.activePayload?.[0]?.payload?.id) {
            navigate(
                `/admin/materiels/filtres?subcategoryId=${data.activePayload[0].payload.id}`
            )
        }
    }

    if (isLoading) return <div className="p-8 text-center">Chargement...</div>
    if (error)
        return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">
                Statistiques du Parc Matériel
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Répartition par Statut Global</CardTitle>
                    </CardHeader>
                    <CardContent style={{ height: "300px" }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={statusPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label
                                >
                                    {statusPieData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                COLORS_PIE[
                                                    index % COLORS_PIE.length
                                                ]
                                            }
                                            onClick={() =>
                                                handlePieClick(entry)
                                            }
                                            style={{ cursor: "pointer" }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={value => `${value} matériel(s)`}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Matériels par Département</CardTitle>
                    </CardHeader>
                    <CardContent style={{ height: "300px" }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={statsByDepartment}
                                onClick={handleDepartmentClick}
                                style={{ cursor: "pointer" }}
                            >
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={value => `${value} matériel(s)`}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Nombre"
                                    fill={COLORS_BAR[0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Matériels par Type Général</CardTitle>
                    </CardHeader>
                    <CardContent style={{ height: "300px" }}>
                        <ResponsiveContainer>
                            <BarChart
                                data={statsByType}
                                onClick={handleTypeClick}
                                style={{ cursor: "pointer" }}
                            >
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip
                                    formatter={value => `${value} matériel(s)`}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Nombre"
                                    fill={COLORS_BAR[1]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Âge du Parc Matériel</CardTitle>
                    </CardHeader>
                    <CardContent style={{ height: "300px" }}>
                        <ResponsiveContainer>
                            <BarChart data={statsByAge}>
                                <XAxis
                                    dataKey="name"
                                    angle={-20}
                                    textAnchor="end"
                                    height={70}
                                    interval={0}
                                />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    formatter={value => `${value} matériel(s)`}
                                />
                                <Bar
                                    dataKey="count"
                                    name="Nombre"
                                    fill={COLORS_BAR[2]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Valeur du Parc par Département</CardTitle>
                    </CardHeader>
                    <CardContent style={{ height: "300px" }}>
                        <ResponsiveContainer>
                            <BarChart data={statsByDepartmentValue}>
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={toEuro} width={90} />
                                <Tooltip formatter={toEuro} />
                                <Bar
                                    dataKey="value"
                                    name="Valeur totale"
                                    fill={COLORS_BAR[3]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
