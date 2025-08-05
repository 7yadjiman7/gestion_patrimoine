import React, { useState, useEffect, useRef, useMemo } from "react"
import { toast } from "react-hot-toast"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import materialService from "@/services/materialService"
import DemandeDetailModal from "@/components/DemandeDetailModal" // Importer la modal
import { Printer, Search } from "lucide-react"

export default function AdminDemandeMateriel() {
    const [demandes, setDemandes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState("")
    const tableRef = useRef()

    // États pour gérer la modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedDemande, setSelectedDemande] = useState(null)

    // --- FONCTION D'IMPRESSION AMÉLIORÉE ---
    const handlePrint = () => {
        const printContent = tableRef.current
        if (!printContent) return

        const printWindow = window.open("", "_blank", "height=800,width=1000")
        printWindow.document.write(
            "<html><head><title>Imprimer la Liste</title>"
        )

        // 1. On copie tous les styles de la page actuelle (la méthode la plus fiable)
        Array.from(
            document.querySelectorAll('link[rel="stylesheet"], style')
        ).forEach(link => {
            printWindow.document.head.appendChild(link.cloneNode(true))
        })

        // 2. On ajoute des styles spécifiques pour l'impression
        printWindow.document.write(`
        <style>
            body {
                padding: 20px;
                font-family: Arial, sans-serif;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
            }
            .no-print {
                display: none !important;
            }
        </style>
    `)

        printWindow.document.write("</head><body>")
        printWindow.document.write(printContent.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()

        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    const fetchDemandesData = async () => {
        setLoading(true)
        try {
            const data = await materialService.fetchDemandes()
            setDemandes(data)
        } catch (err) {
            setError("Impossible de charger les demandes.")
            console.error("Error fetching demandes:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDemandesData()
    }, [])

    const filteredDemandes = useMemo(() => {
        if (!search) return demandes
        const q = search.toLowerCase()
        return demandes.filter(d => {
            const demandeurMatch = (d.demandeur_name || "").toLowerCase().includes(q)
            const deptMatch = (d.departement_demandeur || "").toLowerCase().includes(q)
            const dateString = d.date_demande
                ? new Date(d.date_demande).toLocaleDateString("fr-FR").toLowerCase()
                : ""
            const dateMatch = dateString.includes(q)
            return demandeurMatch || deptMatch || dateMatch
        })
    }, [demandes, search])

    const handleProcessDemand = async (demandeId, action) => {
        try {
            await materialService.processDemande(demandeId, action)
            toast.success(
                `Demande ${action === "approve" ? "approuvée" : "rejetée"} avec succès !`
            )
            fetchDemandesData() // Rafraîchir la liste
        } catch (err) {
            toast.error(`Échec de l'opération : ${err.message}`)
            console.error(`Processing demand failed:`, err)
        }
    }

    const handleViewDetails = demande => {
        setSelectedDemande(demande)
        setIsModalOpen(true)
    }

    const getStatusBadge = status => {
        switch (status) {
            case "pending":
                return <Badge variant="secondary">En attente</Badge>
            case "approved":
                return (
                    <Badge className="bg-green-500 text-white">Approuvée</Badge>
                )
            case "rejected":
                return <Badge variant="destructive">Rejetée</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    if (loading) return <div>Chargement des demandes...</div>
    if (error) return <div className="text-red-500">{error}</div>

    return (
        <div >
            <h1 className="text-5xl mb-10 text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                Gestion des Demandes de Matériel
            </h1>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Rechercher par demandeur, département ou date"
                            className="pl-10"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                </div>
            </div>
            <div ref={tableRef} className="rounded-md border bg-white text-black">
                <div className="print-only:block hidden p-4 border-b">
                    <h2 className="text-xl font-bold">
                        Liste des Demandes de matériel
                    </h2>
                    <p>Imprimé le {new Date().toLocaleDateString("fr-FR")}</p>
                </div>
                <Table className="[&_th]:bg-white [&_td]:bg-white">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Demandeur</TableHead>
                            <TableHead>Département</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right no-print">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDemandes.length > 0 ? (
                            filteredDemandes.map(demande => (
                                <TableRow key={demande.id}>
                                    <TableCell className="font-medium">
                                        {demande.demandeur_name}
                                    </TableCell>
                                    <TableCell>
                                        {demande.departement_demandeur}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            demande.date_demande
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(demande.state)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2 no-print">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleViewDetails(demande)
                                            }
                                        >
                                            Voir
                                        </Button>
                                        {demande.state === "pending" && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-green-600 hover:bg-green-100"
                                                    onClick={() =>
                                                        handleProcessDemand(
                                                            demande.id,
                                                            "approve"
                                                        )
                                                    }
                                                >
                                                    Confirmer
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:bg-red-100"
                                                    onClick={() =>
                                                        handleProcessDemand(
                                                            demande.id,
                                                            "reject"
                                                        )
                                                    }
                                                >
                                                    Rejeter
                                                </Button>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan="5"
                                    className="h-24 text-center"
                                >
                                    Aucune demande trouvée.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {isModalOpen && (
                <DemandeDetailModal
                    demande={selectedDemande}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}
