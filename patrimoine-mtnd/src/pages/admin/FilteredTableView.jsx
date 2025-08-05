import React, { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import materialService from "@/services/materialService"
import { toast } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Printer, Search } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function FilteredTableView() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const [materials, setMaterials] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState("")
    const tableRef = useRef()

    useEffect(() => {
        const filters = Object.fromEntries(searchParams.entries())

        setIsLoading(true)
        materialService
            .fetchFilteredMaterials(filters)
            .then(data => setMaterials(Array.isArray(data) ? data : []))
            .catch(err => {
                toast.error("Erreur lors du chargement des matériels.")
                console.error(err)
            })
            .finally(() => setIsLoading(false))
    }, [searchParams])

    const filteredMaterials = useMemo(() => {
        if (!filter) return materials
        const q = filter.toLowerCase()
        return materials.filter(m =>
            Object.values(m).some(val => String(val).toLowerCase().includes(q))
        )
    }, [materials, filter])

    const handlePrint = () => {
        const printContent = tableRef.current
        if (!printContent) return

        const documentTitle = "Liste du Matériel Filtré"
        const printDate = `Date d'impression : ${new Date().toLocaleDateString("fr-FR")}`

        const printWindow = window.open("", "_blank", "height=800,width=1000")

        printWindow.document.write(`<html><head><title>${documentTitle}</title>`)

        Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(link => {
            printWindow.document.head.appendChild(link.cloneNode(true))
        })

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
        printWindow.document.write(`
            <div class="print-header">
                <h2>${documentTitle}</h2>
                <p>${printDate}</p>
            </div>
        `)
        printWindow.document.write(printContent.innerHTML)
        printWindow.document.write("</body></html>")
        printWindow.document.close()

        setTimeout(() => {
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        }, 500)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <Spinner />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
                <Button variant="outline" onClick={() => navigate(-1)}>
                    Retour 
                </Button>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Filtrer le tableau..."
                            className="pl-10"
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                </div>
            </div>

            <div
                ref={tableRef}
                className="p-4 bg-white rounded-lg shadow-md text-black"
            >
                <h1 className="text-2xl font-bold mb-4 text-center">
                    Liste du Matériel Filtré
                </h1>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Emplacement</TableHead>
                            <TableHead>Assigné à</TableHead>
                            <TableHead className="text-right">Valeur</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredMaterials.map(material => (
                            <TableRow key={material.id}>
                                <TableCell>{material.name}</TableCell>
                                <TableCell>{material.code}</TableCell>
                                <TableCell>{material.type}</TableCell>
                                <TableCell>{material.status}</TableCell>
                                <TableCell>{material.location}</TableCell>
                                <TableCell>{material.assignedTo}</TableCell>
                                <TableCell className="text-right">
                                    {material.value
                                        ? `${material.value} €`
                                        : "N/A"}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {filteredMaterials.length === 0 && (
                    <p className="text-center py-10">
                        Aucun matériel ne correspond à ces critères.
                    </p>
                )}
            </div>
        </div>
    )
}
