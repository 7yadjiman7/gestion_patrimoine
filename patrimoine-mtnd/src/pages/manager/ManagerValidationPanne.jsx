import React, { useEffect, useState, useRef } from "react"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table"
import { Printer } from "lucide-react"
import materialService from "@/services/materialService"

export default function ManagerValidationPanne() {
    const [declarations, setDeclarations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const tableRef = useRef()

    const loadDeclarations = () => {
        setLoading(true)
        materialService
            .fetchPannesForManager()
            .then(data => setDeclarations(Array.isArray(data) ? data : []))
            .catch(err => {
                setError("Erreur de chargement des déclarations.")
                console.error(err)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadDeclarations()
    }, [])

    const handleProcess = async (id, action) => {
        try {
            await materialService.processPanneForManager(id, action)
            toast.success(
                `Déclaration ${action === "approve" ? "validée" : "rejetée"}.`
            )
            loadDeclarations()
        } catch (err) {
            toast.error(`Échec de l'opération: ${err.message}`)
        }
    }

    const handlePrint = () => {
        const content = tableRef.current
        if (!content) return
        const w = window.open("", "_blank", "height=800,width=1000")
        w.document.write("<html><head><title>Liste des Pannes</title>")
        Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(link => {
            w.document.head.appendChild(link.cloneNode(true))
        })
        w.document.write("</head><body>")
        w.document.write(content.innerHTML)
        w.document.write("</body></html>")
        w.document.close()
        setTimeout(() => {
            w.focus()
            w.print()
            w.close()
        }, 500)
    }

    const getStatusBadge = status => {
        const statusMap = {
            draft: { label: "Brouillon", variant: "outline" },
            to_approve: { label: "En attente", variant: "secondary" },
            approved: { label: "Approuvée", className: "bg-green-500 text-white" },
            rejected: { label: "Rejetée", variant: "destructive" },
        }
        const { label, ...props } = statusMap[status] || {
            label: status,
            variant: "outline",
        }
        return <Badge {...props}>{label}</Badge>
    }

    if (loading) return <div className="p-8 text-center">Chargement...</div>
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-center">
                    Validation des Déclarations de Panne
                </h1>
            </div>
            <Button
                onClick={handlePrint}
                variant="outline"
                className="hover:bg-orange-500 hover:text-white"
            >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer le tableau
            </Button>
            <div ref={tableRef} className="rounded-md border mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Déclaré par</TableHead>
                            <TableHead>Matériel</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {declarations.length > 0 ? (
                            declarations.map(panne => (
                                <TableRow key={panne.id}>
                                    <TableCell className="font-medium">
                                        {panne.declarer_par_name}
                                    </TableCell>
                                    <TableCell>{panne.asset_name}</TableCell>
                                    <TableCell>{getStatusBadge(panne.state)}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => handleProcess(panne.id, "approve")}
                                        >
                                            Confirmer
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleProcess(panne.id, "reject")}
                                        >
                                            Rejeter
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan="4" className="h-24 text-center text-gray-500">
                                    Aucune déclaration en attente.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
