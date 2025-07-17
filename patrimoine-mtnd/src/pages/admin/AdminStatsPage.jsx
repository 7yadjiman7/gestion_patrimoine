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
} from "recharts"

const COLORS_PIE = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]
const COLORS_BAR = ["#8884d8", "#82ca9d", "#ffc658", "#ff80b3", "#a4de6c"]
const toCfa = value =>
    new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XOF",
    }).format(value)

export default function AdminStatsPage() {
    const navigate = useNavigate()

    const [globalStatusStats, setGlobalStatusStats] = useState(null)
    const [statsByDepartment, setStatsByDepartment] = useState([])
    const [statsByType, setStatsByType] = useState([])
    const [statsByAge, setStatsByAge] = useState([])
    const [statsByDepartmentValue, setStatsByDepartmentValue] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadAllStats = async () => {
            setIsLoading(true)
            try {
                const [globalData, deptData, typeData, ageData, deptValueData] =
                    await Promise.all([
                        materialService.fetchStats(),
                        materialService.fetchAllDepartmentStats(),
                        materialService.fetchStatsByType(),
                        materialService.fetchStatsByAge(),
                        materialService.fetchStatsByDepartmentValue(),
                    ])

                setGlobalStatusStats(globalData)
                setStatsByDepartment(deptData)
                setStatsByType(typeData)
                setStatsByAge(ageData)
                setStatsByDepartmentValue(deptValueData)
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

    const handleAgeClick = data => {
        if (data?.activeLabel) {
            navigate(
                `/admin/materiels/filtres?age=${encodeURIComponent(data.activeLabel)}`
            )
        }
    }

    const handleDepartmentValueClick = data => {
        if (data?.activePayload?.[0]?.payload?.id) {
            navigate(
                `/admin/materiels/filtres?departmentId=${data.activePayload[0].payload.id}`
            )
        }
    }

    if (isLoading) return <div className="p-8 text-center">Chargement...</div>
    if (error)
        return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-12 mt-10">
                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Statistiques du Parc Matériel
                </h1>
            </div>
            <div className="grid grid-cols-1 text-black lg:grid-cols-2 gap-8">
                <Card className="bg-white">
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

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Matériels par Département</CardTitle>
                    </CardHeader>
                    <CardContent
                        className="bg-white"
                        style={{ height: "300px" }}
                    >
                        <ResponsiveContainer>
                            <BarChart
                                data={statsByDepartment}
                                onClick={handleDepartmentClick}
                                style={{ cursor: "pointer" }}
                            >
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
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

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Matériels par Type Général</CardTitle>
                    </CardHeader>
                    <CardContent
                        className="bg-white"
                        style={{ height: "300px" }}
                    >
                        <ResponsiveContainer>
                            <BarChart
                                data={statsByType}
                                onClick={handleTypeClick}
                                style={{ cursor: "pointer" }}
                            >
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
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

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Âge du Parc Matériel</CardTitle>
                    </CardHeader>
                    <CardContent
                        className="bg-white"
                        style={{ height: "300px" }}
                    >
                        <ResponsiveContainer>
                            <BarChart
                                data={statsByAge}
                                onClick={handleAgeClick}
                                style={{ cursor: "pointer" }}
                            >
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

                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Valeur du Parc par Département</CardTitle>
                    </CardHeader>
                    <CardContent
                        className="bg-white"
                        style={{ height: "300px" }}
                    >
                        <ResponsiveContainer>
                            <BarChart
                                data={statsByDepartmentValue}
                                onClick={handleDepartmentValueClick}
                                style={{ cursor: "pointer" }}
                            >
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={toCfa} width={90} />
                                <Tooltip formatter={toCfa} />
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
