import React, { useState, useEffect, useRef, useMemo } from "react"
import { toast } from "react-hot-toast"
import { Input } from "@/components/ui/input"
import { Search, Printer } from "lucide-react"
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
import materialService from "@/services/materialService"
import PerteDetailModal from "@/components/PerteDetailModal" // <-- 1. IMPORTER LA MODALE


export default function DirValidationPerte() {
    const [declarations, setDeclarations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedPerte, setSelectedPerte] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [search, setSearch] = useState("")
    const tableRef = useRef()

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


    const loadDeclarationsForManager = () => {
        setLoading(true)
        materialService
            .fetchPertesForManager()
            .then(data => setDeclarations(Array.isArray(data) ? data : []))
            .catch(err => {
                setError("Erreur de chargement des déclarations à valider.")
                console.error(err)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadDeclarationsForManager()
    }, [])

    const handleProcess = async (id, action) => {
        try {
            await materialService.processPerteForManager(id, action)
            toast.success(
                `Déclaration ${action === "approve" ? "validée" : "rejetée"}.`
            )
            loadDeclarationsForManager() // Rafraîchir la liste
        } catch (err) {
            toast.error(`Échec de l'opération: ${err.message}`)
        }
    }

    const handleViewDetails = perte => {
        setSelectedPerte(perte)
        setIsModalOpen(true)
    }

    const getStatusBadge = status => {
        const statusMap = {
            to_approve: {
                label: "En attente de votre validation",
                variant: "destructive",
            },
        }
        const { label, ...props } = statusMap[status] || {
            label: status,
            variant: "outline",
        }
        return <Badge {...props}>{label}</Badge>
    }

    const filteredDeclarations = useMemo(() => {
        if (!search) return declarations
        const q = search.toLowerCase()
        return declarations.filter(d => {
            const declarantMatch = (d.declarer_par_name || "").toLowerCase().includes(q)
            const assetMatch = (d.asset_name || "").toLowerCase().includes(q)
            const dateString = d.date_perte
                ? new Date(d.date_perte).toLocaleDateString("fr-FR").toLowerCase()
                : ""
            const dateMatch = dateString.includes(q)
            return declarantMatch || assetMatch || dateMatch
        })
    }, [declarations, search])

    if (loading) return <div className="p-8 text-center">Chargement...</div>
    if (error)
        return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-5xl mb-10 text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                    Validation des Déclarations de Perte
                </h1>
            </div>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Rechercher par déclarant, matériel ou date"
                            className="pl-10"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="hover:bg-orange-500 hover:text-white"
                    >
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimer le tableau
                    </Button>
                </div>
            </div>
            <div ref={tableRef} className="rounded-md border bg-white">
                <div className="print-only:block hidden p-4 border-b">
                    <h2 className="text-xl font-bold">
                        Liste des Déclarations de perte
                    </h2>
                    <p>Imprimé le {new Date().toLocaleDateString("fr-FR")}</p>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Déclaré par</TableHead>
                            <TableHead>Matériel Perdu</TableHead>
                            <TableHead>Date de la Perte</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDeclarations.length > 0 ? (
                            filteredDeclarations.map(perte => (
                                <TableRow key={perte.id}>
                                    <TableCell className="font-medium">
                                        {perte.declarer_par_name}
                                    </TableCell>
                                    <TableCell>{perte.asset_name}</TableCell>
                                    <TableCell>
                                        {new Date(
                                            perte.date_perte
                                        ).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(perte.state)}
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleViewDetails(perte)
                                            }
                                        >
                                            Voir
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() =>
                                                handleProcess(
                                                    perte.id,
                                                    "approve"
                                                )
                                            }
                                        >
                                            Confirmer
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() =>
                                                handleProcess(
                                                    perte.id,
                                                    "reject"
                                                )
                                            }
                                        >
                                            Rejeter
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan="5"
                                    className="h-24 text-center text-gray-500"
                                >
                                    Aucune déclaration de votre équipe n'est en
                                    attente de validation.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Le code pour la modal de détails sera ici si vous la créez */}
            {isModalOpen && (
                <PerteDetailModal
                    perte={selectedPerte}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}
