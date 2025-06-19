// pages/admin/AdminStatsPage.jsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend, BarChart, XAxis, YAxis, Bar, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, Filter, Download } from 'lucide-react';
import materialService from '@/services/materialService';
import AppSidebar from '@/components/app-sidebar';
import { StatCard } from '@/components/ui/stat-card';

const COLORS_PIE = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)'
];
const COLORS_BAR = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)'
];

export default function AdminStatsPage() {
    // États pour les différentes statistiques
    const [statsByDepartment, setStatsByDepartment] = useState([]);
    const [statsByType, setStatsByType] = useState([]); // Pour les stats agrégées par type général
    const [statsByDetailedCategory, setStatsByDetailedCategory] = useState([]); // Pour les stats agrégées par sous-catégorie
    const [globalStatusStats, setGlobalStatusStats] = useState(null); // Pour les stats par statut global du parc
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAllStats = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // --- APPELS CORRIGÉS POUR LES STATISTIQUES ---
                const [deptStats, typeStatsRaw, detailedCategoryStatsRaw, globalStatsRaw] = await Promise.all([
                    materialService.fetchStatsByDepartment(), // API: /api/patrimoine/stats/by_department
                    materialService.fetchStatsByType(), // API: /api/patrimoine/stats/by_type
                    materialService.fetchStatsByDetailedCategory(), // API: /api/patrimoine/stats/by_detailed_category
                    materialService.fetchStats(), // API: /api/patrimoine/stats (sans filtre, pour les stats globales par statut)
                ]);
                
                // Setters pour les états
                setStatsByDepartment(Array.isArray(deptStats) ? deptStats : []);
                setStatsByType(Array.isArray(typeStatsRaw) ? typeStatsRaw : []); // C'est ici que l'erreur 'function is not iterable' était. C'est du côté Odoo.
                setStatsByDetailedCategory(Array.isArray(detailedCategoryStatsRaw) ? detailedCategoryStatsRaw : []);
                setGlobalStatusStats(globalStatsRaw); 

            } catch (err) {
                console.error("Erreur lors du chargement des statistiques:", err);
                setError(err.message || "Impossible de charger toutes les statistiques.");
            } finally {
                setIsLoading(false);
            }
        };
        loadAllStats();
    }, []);

    // Préparer les données pour le Pie Chart des statuts globaux
    const statusPieData = globalStatusStats ? [
        { name: 'En Service', value: globalStatusStats.inService, fill: COLORS_PIE[0] },
        { name: 'En Stock', value: globalStatusStats.inStock, fill: COLORS_PIE[1] },
        { name: 'Hors Service', value: globalStatusStats.outOfService, fill: COLORS_PIE[2] },
    ].filter(s => s.value > 0) : [];

    const statusChartConfig = {
        'En Service': { label: 'En Service', color: COLORS_PIE[0] },
        'En Stock': { label: 'En Stock', color: COLORS_PIE[1] },
        'Hors Service': { label: 'Hors Service', color: COLORS_PIE[2] },
    };

    const barChartConfig = {
        count: { label: 'Matériels', color: COLORS_BAR[0] }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <AppSidebar />
                <div className="flex-1 p-6 ml-[250px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <AppSidebar />
                <div className="flex-1 p-6 ml-[250px] text-center text-red-600">
                    <h2 className="text-xl font-bold mb-4">Erreur de chargement</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <AppSidebar />

            <div className="flex-1 p-6 ml-[180px]">
                {/* Header moderne */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1">Voici vos détails analytiques.</p>
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

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Statistique par Statut Global - Style moderne */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold text-gray-900">Répartition par Statut Global</CardTitle>
                                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                    Voir Rapport <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statusPieData.length > 0 ? (
                                <ChartContainer config={statusChartConfig} className="h-[300px] w-full">
                                    <PieChart>
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Pie
                                            data={statusPieData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={120}
                                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {statusPieData.map((entry, index) => (
                                                <Cell key={`cell-status-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Legend />
                                    </PieChart>
                                </ChartContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">Aucune donnée de statut global.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Statistique par Département - Style moderne */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold text-gray-900">Matériels par Département</CardTitle>
                                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1">
                                    Voir Rapport <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statsByDepartment.length > 0 ? (
                                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                                    <BarChart data={statsByDepartment} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" fill={COLORS_BAR[0]} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">Aucune donnée par département.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Statistique par Type Général - Style moderne */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold text-gray-900">Matériels par Type Général</CardTitle>
                                <button className="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1">
                                    Voir Rapport <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statsByType.length > 0 ? (
                                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                                    <BarChart data={statsByType} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" fill={COLORS_BAR[1]} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">Aucune donnée par type général.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Statistique par Catégorie Détaillée - Style moderne */}
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg font-semibold text-gray-900">Matériels par Catégorie Détaillée</CardTitle>
                                <button className="text-sm text-cyan-600 font-medium hover:text-cyan-700 flex items-center gap-1">
                                    Voir Rapport <TrendingUp className="w-4 h-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {statsByDetailedCategory.length > 0 ? (
                                <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                                    <BarChart data={statsByDetailedCategory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6b7280' }}
                                        />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="count" fill={COLORS_BAR[2]} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <p className="text-gray-500 text-center py-12">Aucune donnée par catégorie détaillée.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}