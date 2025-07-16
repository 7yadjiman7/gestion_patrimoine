import PerteDetailModal from "@/components/PerteDetailModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import materialService from "@/services/materialService"
import { Printer } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "react-hot-toast"

export default function AdminDeclarationsPerte() {
    const [declarations, setDeclarations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedPerte, setSelectedPerte] = useState(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // La référence pour cibler le tableau est toujours nécessaire
    const tableRef = useRef()

    // --- FONCTION D'IMPRESSION AMÉLIORÉE ---
    const handlePrint = () => {
        const printContent = tableRef.current
        if (!printContent) return

        // --- CORRECTION DÉFINITIVE ---

        // 1. Définissez ici les titres et dates que vous souhaitez.
        const documentTitle = "Liste des Déclarations de Perte"
        const printDate = `Date d'impression : ${new Date().toLocaleDateString("fr-FR")}`

        const printWindow = window.open("", "_blank", "height=800,width=1000")

        // On passe le titre personnalisé à la fenêtre
        printWindow.document.write(
            `<html><head><title>${documentTitle}</title>`
        )

        // On copie les styles pour que le tableau soit joli
        Array.from(
            document.querySelectorAll('link[rel="stylesheet"], style')
        ).forEach(link => {
            printWindow.document.head.appendChild(link.cloneNode(true))
        })

        // On ajoute des styles spécifiques pour l'impression
        printWindow.document.write(`
            <style>
                body { padding: 30px; font-family: Arial, sans-serif; }
                .print-header { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
                .print-header h2 { font-size: 24px; margin: 0; }
                .print-header p { font-size: 14px; margin: 5px 0 0 0; color: #555; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .no-print { display: none !important; }
            </style>
        `)

        printWindow.document.write("</head><body>")

        // 2. On injecte notre en-tête personnalisé
        printWindow.document.write(`
            <div class="print-header">
                <h2>${documentTitle}</h2>
                <p>${printDate}</p>
            </div>
        `)

        // 3. On injecte le contenu du tableau
        printWindow.document.write(printContent.innerHTML)

        printWindow.document.write("</body></html>")
        printWindow.document.close()

        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    const loadDeclarations = () => {
        setLoading(true)
        materialService
            .fetchDeclarationsPerte()
            .then(setDeclarations)
            .catch(err => {
                setError("Erreur de chargement des déclarations.")
                console.error(err)
            })
            .finally(() => setLoading(false))
    }

    useEffect(loadDeclarations, [])

    const handleProcess = async (id, action) => {
        try {
            await materialService.processPerte(id, action)
            toast.success(
                `Déclaration ${action === "approve" ? "approuvée" : "rejetée"} avec succès.`
            )
            loadDeclarations()
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
            draft: { label: "Brouillon", variant: "outline" },
            to_approve: { label: "Attente Manager", variant: "secondary" },
            manager_approved: {
                label: "Attente Admin",
                className: "bg-yellow-500 text-white",
            },
            approved: {
                label: "Approuvée",
                className: "bg-green-500 text-white",
            },
            rejected: {
                label: "Rejetée",
                variant: "destructive",
            },
            confirm: {
                label: "Confirmée",
                className: "bg-green-500 text-white",
            },
            reject: {
                label: "Rejetée",
                variant: "destructive",
            },
        }
        const { label, ...props } = statusMap[status] || {
            label: status,
            variant: "outline",
        }
        return <Badge {...props}>{label}</Badge>
    }

    if (loading) return <div className="p-8 text-center">Chargement...</div>
    if (error)
        return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="min-h-screen w-full">
            <h1 className="text-5xl mb-10 text-center font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
                Gestion des Déclarations de Perte
            </h1>
            <Button
                onClick={handlePrint}
                variant="outline"
                className="hover:bg-orange-500 hover:text-white"
            >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer le tableau
            </Button>
            <div ref={tableRef} className="rounded-md border ">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Déclaré par</TableHead>
                            <TableHead>Matériel</TableHead>
                            <TableHead>Date de la Perte</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right no-print">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {declarations.length > 0 ? (
                            declarations.map(perte => (
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
                                    <TableCell className="text-right space-x-2 no-print">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleViewDetails(perte)
                                            }
                                        >
                                            Voir Détails
                                        </Button>
                                        {(perte.state === "manager_approved" ||
                                            perte.state === "to_approve") && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleProcess(
                                                            perte.id,
                                                            "approve"
                                                        )
                                                    }
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Approuver
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
                                    Aucune déclaration trouvée.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {isModalOpen && (
                <PerteDetailModal
                    perte={selectedPerte}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    )
}
