import React, { useEffect, useState } from "react"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import materialService from "@/services/materialService"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"

export default function MyDeclarationsPage() {
    const { currentUser } = useAuth()
    const navigate = useNavigate()
    const [declarations, setDeclarations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        materialService
            .fetchDeclarationsPerte()
            .then(data => {
                const userDecl = Array.isArray(data)
                    ? data.filter(d => d.declarer_par_id === currentUser?.id)
                    : []
                setDeclarations(userDecl)
            })
            .catch(err => {
                console.error(err)
                setError("Erreur lors du chargement des déclarations.")
                toast.error("Impossible de charger vos déclarations")
            })
            .finally(() => setLoading(false))
    }, [currentUser])

    const getStatusBadge = status => {
        const statusMap = {
            draft: { label: "Brouillon", variant: "outline" },
            to_approve: { label: "En attente", variant: "secondary" },
            manager_approved: {
                label: "Attente Admin",
                className: "bg-yellow-500 text-white",
            },
            approved: {
                label: "Approuvée",
                className: "bg-green-500 text-white",
            },
            rejected: { label: "Rejetée", variant: "destructive" },
            confirm: { label: "Confirmée", className: "bg-green-500 text-white" },
            reject: { label: "Rejetée", variant: "destructive" },
        }
        const { label, ...props } = statusMap[status] || { label: status, variant: "outline" }
        return <Badge {...props}>{label}</Badge>
    }

    if (loading) return <div className="p-8 text-center">Chargement...</div>
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Mes Déclarations de Perte</h1>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/declaration-pertes")}
                        className="hover:bg-orange-500 hover:text-white"
                    >
                        Nouvelle déclaration
                    </Button>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Statut</TableHead>
                                <TableHead>Matériel</TableHead>
                                <TableHead>Date de la perte</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {declarations.length > 0 ? (
                                declarations.map(perte => (
                                    <TableRow key={perte.id}>
                                        <TableCell>{getStatusBadge(perte.state)}</TableCell>
                                        <TableCell>{perte.asset_name}</TableCell>
                                        <TableCell>{new Date(perte.date_perte).toLocaleDateString()}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan="3" className="h-24 text-center">
                                        Aucune déclaration trouvée.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
