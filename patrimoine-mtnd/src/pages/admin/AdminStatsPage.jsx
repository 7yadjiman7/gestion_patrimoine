// pages/admin/AdminStatsPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast" 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, XAxis, YAxis, Bar, CartesianGrid } from 'recharts';
import { TrendingUp, Filter, Download } from 'lucide-react';
import materialService from '@/services/materialService';
import AppSidebar from '@/components/app-sidebar';
import { StatCard } from '@/components/ui/stat-card';

const COLORS_PIE = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
const COLORS_BAR = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'];

const toEuro = value =>
    new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(value)


export default function AdminStatsPage() {
    // États pour les différentes statistiques
    const navigate = useNavigate()
    const [statsByDepartment, setStatsByDepartment] = useState([])
    const [statsByType, setStatsByType] = useState([]) // Pour les stats agrégées par type général
    const [statsByAge, setStatsByAge] = useState([])
    const [statsByDepartmentValue, setStatsByDepartmentValue] = useState([])// Pour les stats agrégées par sous-catégorie
    const [globalStatusStats, setGlobalStatusStats] = useState(null) // Pour les stats par statut global du parc

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadAllStats = async () => {
            try {
                setIsLoading(true)
                setError(null)

                // --- APPELS CORRIGÉS POUR LES STATISTIQUES ---
                const [
                    deptStats,
                    typeStatsRaw,
                    ageStats, // <-- Appel de la nouvelle fonction
                    deptValueStats, // <-- Appel de la nouvelle fonction
                    globalStatsRaw,
                ] = await Promise.all([
                    materialService.fetchAllDepartmentStats(), // API: /api/patrimoine/stats/by_department
                    materialService.fetchStatsByType(), // API: /api/patrimoine/stats/by_type
                    materialService.fetchStatsByAge(),
                    materialService.fetchStatsByDepartmentValue(), // API: /api/patrimoine/stats/by_detailed_category
                    materialService.fetchStats(), // API: /api/patrimoine/stats (sans filtre, pour les stats globales par statut)
                ])

                // Setters pour les états
                setStatsByDepartment(Array.isArray(deptStats) ? deptStats : [])
                setStatsByType(Array.isArray(typeStatsRaw) ? typeStatsRaw : []) 
                setStatsByAge(Array.isArray(ageStats) ? ageStats : [])
                setStatsByDepartmentValue(
                    Array.isArray(deptValueStats) ? deptValueStats : []
                )
                setGlobalStatusStats(globalStatsRaw)
            } catch (err) {
                console.error(
                    "Erreur lors du chargement des statistiques:",
                    err
                )
                setError(
                    err.message ||
                        "Impossible de charger toutes les statistiques."
                )
                toast.error("Erreur de chargement des statistiques.")
            } finally {
                setIsLoading(false)
            }
        }
        loadAllStats()
    }, [])

    // Fonctions de navigation appelées par les clics sur les graphiques
    const handlePieClick = data => {
        // On doit mapper le nom lisible ("En Service") au statut système ("service")
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
        if (data && data.activePayload && data.activePayload[0]) {
            const departmentId = data.activePayload[0].payload.id
            if (departmentId)
                navigate(
                    `/admin/materiels/filtres?departmentId=${departmentId}`
                )
        }
    }

    const handleTypeClick = data => {
        if (data && data.activePayload && data.activePayload[0]) {
            const typeCode = data.activePayload[0].payload.code
            if (typeCode) navigate(`/admin/materiels/filtres?type=${typeCode}`)
        }
    }

    // const handleSubcategoryClick = data => {
    //     if (data && data.activePayload && data.activePayload[0]) {
    //         const subcategoryId = data.activePayload[0].payload.id
    //         if (subcategoryId)
    //             navigate(
    //                 `/admin/materiels/filtres?subcategoryId=${subcategoryId}`
    //             )
    //     }
    // }
    

    // Préparer les données pour le Pie Chart des statuts globaux
    const statusPieData = globalStatusStats
        ? [
              { name: "En Service", value: globalStatusStats.inService },
              { name: "En Stock", value: globalStatusStats.inStock },
              { name: "Hors Service", value: globalStatusStats.outOfService },
          ].filter(s => s.value > 0)
        : []

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <AppSidebar />
                <div className="flex-1 p-6 ml-[250px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <AppSidebar />
                <div className="flex-1 p-6 ml-[250px] text-center text-red-600">
                    <h2 className="text-xl font-bold mb-4">
                        Erreur de chargement
                    </h2>
                    <p>{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-ful">
            <AppSidebar />

            <div className="flex-1 p-6 ml-[180px]">
                {/* Header moderne */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-5xl mb-10 text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                            Dashboard
                        </h1>
                        <p className="text-white mt-1">
                            Voici vos détails analytiques.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filtrer par
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <Download className="w-4 h-4" />
                            Exporter
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                    {/* Statistique par Statut Global - Style moderne */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Répartition par Statut Global
                                </CardTitle>
                                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                    Voir Rapport{" "}
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statusPieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusPieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            label={({ percent }) =>
                                                `${(percent * 100).toFixed(0)}%`
                                            }
                                            labelLine={false}
                                        >
                                            {statusPieData.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-status-${index}`}
                                                        fill={
                                                            COLORS_PIE[
                                                                index %
                                                                    COLORS_PIE.length
                                                            ]
                                                        }
                                                        onClick={() =>
                                                            handlePieClick(
                                                                entry
                                                            )
                                                        }
                                                        style={{
                                                            cursor: "pointer",
                                                        }}
                                                    />
                                                )
                                            )}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                boxShadow:
                                                    "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">
                                    Aucune donnée de statut global.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Statistique par Département - Style moderne */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Matériels par Département
                                </CardTitle>
                                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                    Voir Rapport{" "}
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statsByDepartment.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={statsByDepartment}
                                        onClick={handleDepartmentClick}
                                        style={{ cursor: "pointer" }}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: "#6b7280",
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: "#6b7280",
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                boxShadow:
                                                    "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill={COLORS_BAR[0]}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">
                                    Aucune donnée par département.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Statistique par Type Général - Style moderne */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold text-gray-900">
                                    Matériels par Type Général
                                </CardTitle>
                                <button className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1">
                                    Voir Rapport{" "}
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statsByType.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={statsByType}
                                        onClick={handleTypeClick}
                                        style={{ cursor: "pointer" }}
                                        margin={{
                                            top: 5,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#f0f0f0"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: "#6b7280",
                                            }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: "#6b7280",
                                            }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "white",
                                                border: "none",
                                                borderRadius: "8px",
                                                boxShadow:
                                                    "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                            }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            fill={COLORS_BAR[1]}
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">
                                    Aucune donnée par type général.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* --- NOUVEAU GRAPHIQUE : Âge du Parc Matériel --- */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Âge du Parc Matériel
                            </CardTitle>
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
                                    <YAxis />
                                    <Tooltip
                                        formatter={value =>
                                            `${value} matériel(s)`
                                        }
                                    />
                                    <Bar
                                        dataKey="count"
                                        name="Nombre de matériels"
                                        fill="#8884d8"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* --- NOUVEAU GRAPHIQUE : Valeur par Département --- */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-gray-900">
                                Valeur du Parc par Département
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ height: "300px" }}>
                            <ResponsiveContainer>
                                <BarChart data={statsByDepartmentValue}>
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={toEuro} />
                                    <Tooltip formatter={toEuro} />
                                    <Bar
                                        dataKey="value"
                                        name="Valeur totale"
                                        fill="#82ca9d"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}