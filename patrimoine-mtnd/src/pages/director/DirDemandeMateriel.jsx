import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import materialService from "@/services/materialService"
import { PlusCircle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Select from "react-select"

const customStyles = {
    control: (base, state) => ({
        ...base,
        borderWidth: "1px",
        borderRadius: "0.5rem",
        padding: "0.25rem",
        borderColor: state.isFocused ? "#f97316" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #f97316" : "none",
        "&:hover": { borderColor: "#fb923c" },
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "#f97316"
            : state.isFocused
              ? "#fed7aa"
              : "white",
        color: state.isSelected ? "white" : "#1f2937",
    }),
}

export default function DirDemandeMateriel() {
    const navigate = useNavigate()

    const [motif, setMotif] = useState("")
    const [destinataireDepartmentId, setDestinataireDepartmentId] =
        useState(null)
    const [lignes, setLignes] = useState([
        {
            demande_subcategory_id: null,
            quantite: 1,
            destinataire_employee_id: null,
            destinataire_location_id: null,
        },
    ])
    const [options, setOptions] = useState({
        subcats: [],
        emps: [],
        depts: [],
        locs: [],
    })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadDropdownData = async () => {
            setIsLoading(true)
            try {
                const [allSubcats, deptsData, locsData, empsData] =
                    await Promise.all([
                        // 0 permet de récupérer toutes les sous-catégories
                        materialService.fetchSubcategories(0),
                        materialService.fetchDepartments(),
                        materialService.fetchLocations(),
                        materialService.fetchEmployees(),
                    ])
                setOptions({
                    subcats: allSubcats.map(sc => ({
                        value: sc.id,
                        label: `${sc.category_name} / ${sc.name}`,
                    })),
                    depts: deptsData.map(d => ({ value: d.id, label: d.name })),
                    locs: locsData.map(l => ({ value: l.id, label: l.name })),
                    emps: empsData.map(e => ({ value: e.id, label: e.name })),
                })
            } catch (error) {
                toast.error("Erreur lors du chargement des listes.")
            } finally {
                setIsLoading(false)
            }
        }
        loadDropdownData()
    }, [])

    const handleLigneChange = (index, field, selectedOption) => {
        const nouvellesLignes = [...lignes]
        nouvellesLignes[index][field] = selectedOption
            ? selectedOption.value
            : null
        setLignes(nouvellesLignes)
    }

    const handleQuantiteChange = (index, value) => {
        const nouvellesLignes = [...lignes]
        nouvellesLignes[index]["quantite"] = parseInt(value, 10) || 1
        setLignes(nouvellesLignes)
    }

    const ajouterLigne = () => {
        setLignes([
            ...lignes,
            {
                demande_subcategory_id: null,
                quantite: 1,
                destinataire_employee_id: null,
                destinataire_location_id: null,
            },
        ])
    }

    const supprimerLigne = index => {
        setLignes(lignes.filter((_, i) => i !== index))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (lignes.some(l => !l.demande_subcategory_id) || !motif) {
            toast.error(
                "Veuillez renseigner le motif et sélectionner un matériel pour chaque ligne."
            )
            return
        }

        const dataToSend = {
            motif_demande: motif,
            lignes: lignes.map(l => ({
                ...l,
                destinataire_department_id: destinataireDepartmentId,
                quantite: parseInt(l.quantite, 10),
            })),
        }

        setIsLoading(true)
        try {
            await materialService.createDemande(dataToSend)
            toast.success("Demande soumise avec succès !")
            navigate("/director/dashboard")
        } catch (error) {
            toast.error(`Erreur: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) return <div className="p-8 text-center">Chargement...</div>

    return (
        <div className="min-h-screen bg-slate-800 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                        <h1 className="text-2xl font-bold text-white">
                            Nouvelle Demande de Matériel
                        </h1>
                        <p className="mt-1 text-sm text-white">
                            Renseignez le motif et le département, puis ajoutez
                            les articles souhaités.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label
                                        htmlFor="motif"
                                        className="text-xl font-semibold text-gray-800 mb-2"
                                    >
                                        Motif de la Demande *
                                    </Label>
                                    <Textarea
                                        id="motif"
                                        value={motif}
                                        onChange={e => setMotif(e.target.value)}
                                        required
                                        placeholder="Raison générale de cette demande..."
                                        className="mt-2"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xl font-semibold text-gray-800 mb-2">
                                        Département de Destination
                                    </Label>
                                    <Select
                                        value={options.depts.find(
                                            opt =>
                                                opt.value ===
                                                destinataireDepartmentId
                                        )}
                                        onChange={option =>
                                            setDestinataireDepartmentId(
                                                option ? option.value : null
                                            )
                                        }
                                        options={options.depts}
                                        styles={customStyles}
                                        placeholder="Optionnel..."
                                        isClearable
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                {lignes.map((ligne, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border rounded-lg space-y-4 relative bg-slate-50"
                                    >
                                        <Label className="font-bold text-slate-700">
                                            Article #{index + 1}
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <Label>
                                                    Matériel demandé *
                                                </Label>
                                                <Select
                                                    value={options.subcats.find(
                                                        opt =>
                                                            opt.value ===
                                                            ligne.demande_subcategory_id
                                                    )}
                                                    onChange={option =>
                                                        handleLigneChange(
                                                            index,
                                                            "demande_subcategory_id",
                                                            option
                                                        )
                                                    }
                                                    options={options.subcats}
                                                    styles={customStyles}
                                                    placeholder="Choisir un matériel..."
                                                    isClearable
                                                />
                                            </div>
                                            <div>
                                                <Label>Quantité *</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={ligne.quantite}
                                                    onChange={e =>
                                                        handleQuantiteChange(
                                                            index,
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label>
                                                    Employé Destinataire
                                                </Label>
                                                <Select
                                                    value={options.emps.find(
                                                        opt =>
                                                            opt.value ===
                                                            ligne.destinataire_employee_id
                                                    )}
                                                    onChange={option =>
                                                        handleLigneChange(
                                                            index,
                                                            "destinataire_employee_id",
                                                            option
                                                        )
                                                    }
                                                    options={options.emps}
                                                    styles={customStyles}
                                                    placeholder="Optionnel..."
                                                    isClearable
                                                />
                                            </div>
                                            <div>
                                                <Label>
                                                    Localisation Destinataire
                                                </Label>
                                                <Select
                                                    value={options.locs.find(
                                                        opt =>
                                                            opt.value ===
                                                            ligne.destinataire_location_id
                                                    )}
                                                    onChange={option =>
                                                        handleLigneChange(
                                                            index,
                                                            "destinataire_location_id",
                                                            option
                                                        )
                                                    }
                                                    options={options.locs}
                                                    styles={customStyles}
                                                    placeholder="Optionnel..."
                                                    isClearable
                                                />
                                            </div>
                                        </div>
                                        {lignes.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-2 right-2 text-red-500 hover:bg-red-100"
                                                onClick={() =>
                                                    supprimerLigne(index)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={ajouterLigne}
                                className="w-full gap-2"
                            >
                                <PlusCircle className="h-4 w-4" /> Ajouter une
                                ligne d'article
                            </Button>
                        </div>

                        <div className="flex justify-end space-x-4 p-6 bg-slate-50 border-t">
                            <Button
                                type="button"
                                onClick={() => navigate(-1)}
                                variant="destructive"
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-orange-500 hover:bg-orange-600"
                            >
                                {isLoading
                                    ? "Soumission..."
                                    : "Soumettre la Demande"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
