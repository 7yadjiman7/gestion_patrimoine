import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import materialService from "@/services/materialService"
import { PlusCircle, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import Select from "react-select"
import makeAnimated from "react-select/animated"

const animatedComponents = makeAnimated()

const customStyles = {
    control: (base, state) => ({
        ...base,
        borderWidth: "1px",
        borderRadius: "0.5rem", // équivalent à rounded-lg
        padding: "0.125rem 0.25rem",
        backgroundColor: "white",
        borderColor: state.isFocused ? "#f97316" : "#d1d5db", // orange-500 ou slate-300
        boxShadow: state.isFocused
            ? "0 0 0 2px rgba(249, 115, 22, 0.5)" // correspond à focus:ring-orange-500
            : "none",
        "&:hover": {
            borderColor: "#fb923c", // orange-400
        },
        transition: "all 0.2s ease",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "#fed7aa" : "white", // orange-100
        color: "#1f2937", // slate-800
        "&:hover": {
            backgroundColor: "#fb923c", // orange-400
            color: "white",
        },
        cursor: "pointer",
    }),
    singleValue: base => ({
        ...base,
        color: "#1f2937", // slate-800
    }),
    menu: base => ({
        ...base,
        zIndex: 9999,
    }),
}

export default function DirDemandeMateriel() {
    const navigate = useNavigate()

    const [motif, setMotif] = useState("")
    const [lignes, setLignes] = useState([
        {
            type_id: "",
            demande_subcategory_id: "",
            quantite: 1,
            destinataire_department_id: "",
            destinataire_location_id: "",
            destinataire_employee_id: "",
        },
    ])

    const [typesGeneraux, setTypesGeneraux] = useState([])
    const [allSubcategories, setAllSubcategories] = useState([])
    const [departments, setDepartments] = useState([])
    const [locations, setLocations] = useState([])
    const [employees, setEmployees] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadDropdownData = async () => {
            setIsLoading(true)
            try {
                const [typesData, subcatsData, deptsData, locsData, empsData] =
                    await Promise.all([
                        materialService.fetchTypesGeneraux(),
                        materialService.fetchSubcategories(0), // "0" pour récupérer toutes les sous-catégories
                        materialService.fetchDepartments(),
                        materialService.fetchLocations(),
                        materialService.fetchEmployees(),
                    ])
                setTypesGeneraux(typesData)
                setAllSubcategories(subcatsData)
                setDepartments(deptsData)
                setLocations(locsData)
                setEmployees(empsData)
            } catch (error) {
                console.error(
                    "Erreur chargement des données pour le formulaire:",
                    error
                )
                alert(
                    "Impossible de charger les données nécessaires au formulaire."
                )
            } finally {
                setIsLoading(false)
            }
        }
        loadDropdownData()
    }, [])

    const handleLigneChange = (index, field, value) => {
        const nouvellesLignes = [...lignes]
        nouvellesLignes[index][field] = value
        if (field === "type_id") {
            nouvellesLignes[index]["demande_subcategory_id"] = ""
        }
        setLignes(nouvellesLignes)
    }

    const ajouterLigne = () => {
        setLignes([
            ...lignes,
            {
                type_id: "",
                demande_subcategory_id: "",
                quantite: 1,
                destinataire_department_id: "",
                destinataire_location_id: "",
                destinataire_employee_id: "",
            },
        ])
    }

    const supprimerLigne = index => {
        const nouvellesLignes = lignes.filter((_, i) => i !== index)
        setLignes(nouvellesLignes)
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (
            !motif.trim() ||
            lignes.length === 0 ||
            lignes.some(l => !l.type_id || !l.demande_subcategory_id)
        ) {
            alert(
                "Veuillez renseigner le motif et compléter tous les champs requis (Type et Catégorie) pour chaque article."
            )
            return
        }

        const dataToSend = {
            motif_demande: motif,
            lignes: lignes.map(l => ({
                demande_subcategory_id: parseInt(l.demande_subcategory_id, 10),
                quantite: parseInt(l.quantite, 10) || 1,
                destinataire_department_id: l.destinataire_department_id
                    ? parseInt(l.destinataire_department_id, 10)
                    : null,
                destinataire_location_id: l.destinataire_location_id
                    ? parseInt(l.destinataire_location_id, 10)
                    : null,
                destinataire_employee_id: l.destinataire_employee_id
                    ? parseInt(l.destinataire_employee_id, 10)
                    : null,
            })),
        }

        try {
            setIsLoading(true)
            await materialService.createDemande(dataToSend)
            alert("Demande soumise avec succès !")
            navigate("/director/dashboard")
        } catch (error) {
            console.error("Erreur lors de la soumission :", error)
            alert(`Erreur: ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading && typesGeneraux.length === 0) {
        return (
            <div className="p-8 text-center text-gray-600">
                Chargement des ressources...
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="rounded-t bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                    <div className="p-6 border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-white">
                            Nouvelle demande
                        </h1>
                        <p className="mt-1 text-sm text-white">
                            Faites une Demande de Matériel.
                        </p>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="bg-white shadow-lg border border-slate-200">
                        <div className="p-6 space-y-8">
                            <div>
                                <label
                                    htmlFor="motif_demande"
                                    className="block text-sm font-semibold text-slate-700 mb-2"
                                >
                                    Motif Général de la Demande
                                </label>
                                <textarea
                                    id="motif_demande"
                                    value={motif}
                                    onChange={e => setMotif(e.target.value)}
                                    required
                                    rows="3"
                                    className="md:col-span-2 w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                    placeholder="Ex: Équipement pour le nouveau projet Alpha, remplacement de matériel obsolète..."
                                ></textarea>
                            </div>

                            <div className="space-y-6">
                                {lignes.map((ligne, index) => {
                                    const filteredSubcategories = ligne.type_id
                                        ? allSubcategories.filter(
                                              sc =>
                                                  sc.category_id ===
                                                  parseInt(ligne.type_id)
                                          )
                                        : []
                                    return (
                                        <div
                                            key={index}
                                            className="p-5 border border-slate-200 rounded-lg space-y-4 relative bg-slate-50/50 shadow-sm"
                                        >
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-slate-800">
                                                    Article #{index + 1}
                                                </h3>
                                                {lignes.length > 1 && (
                                                    <button
                                                        type="button"
                                                        aria-label="Supprimer l'article"
                                                        className="p-1.5 text-red-500 rounded-full hover:bg-red-100 transition-colors"
                                                        onClick={() =>
                                                            supprimerLigne(
                                                                index
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Type de matériel
                                                    </label>
                                                    <Select
                                                        value={typesGeneraux
                                                            .map(t => ({
                                                                value: t.id,
                                                                label: t.name,
                                                            }))
                                                            .find(
                                                                option =>
                                                                    option.value ===
                                                                    ligne.type_id
                                                            )}
                                                        onChange={selected =>
                                                            handleLigneChange(
                                                                index,
                                                                "type_id",
                                                                selected?.value ||
                                                                    ""
                                                            )
                                                        }
                                                        options={typesGeneraux.map(
                                                            t => ({
                                                                value: t.id,
                                                                label: t.name,
                                                            })
                                                        )}
                                                        styles={customStyles}
                                                        components={
                                                            animatedComponents
                                                        }
                                                        placeholder="Choisir un type..."
                                                        isClearable
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Catégorie / Matériel
                                                    </label>
                                                    <Select
                                                        value={filteredSubcategories
                                                            .map(sc => ({
                                                                value: sc.id,
                                                                label: sc.name,
                                                            }))
                                                            .find(
                                                                option =>
                                                                    option.value ===
                                                                    ligne.demande_subcategory_id
                                                            )}
                                                        onChange={selected =>
                                                            handleLigneChange(
                                                                index,
                                                                "demande_subcategory_id",
                                                                selected?.value ||
                                                                    ""
                                                            )
                                                        }
                                                        options={filteredSubcategories.map(
                                                            sc => ({
                                                                value: sc.id,
                                                                label: sc.name,
                                                            })
                                                        )}
                                                        styles={customStyles}
                                                        components={
                                                            animatedComponents
                                                        }
                                                        placeholder="Choisir un matériel..."
                                                        isDisabled={
                                                            !ligne.type_id
                                                        }
                                                        isClearable
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Quantité
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={ligne.quantite}
                                                        onChange={e =>
                                                            handleLigneChange(
                                                                index,
                                                                "quantite",
                                                                e.target.value
                                                            )
                                                        }
                                                        required
                                                        className="w-full p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                        hover:border-orange-400 transition duration-200"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Département Destinataire
                                                    </label>
                                                    <Select
                                                        value={departments
                                                            .map(d => ({
                                                                value: d.id,
                                                                label: d.name,
                                                            }))
                                                            .find(
                                                                option =>
                                                                    option.value ===
                                                                    ligne.destinataire_department_id
                                                            )}
                                                        onChange={selected =>
                                                            handleLigneChange(
                                                                index,
                                                                "destinataire_department_id",
                                                                selected?.value ||
                                                                    ""
                                                            )
                                                        }
                                                        options={departments.map(
                                                            d => ({
                                                                value: d.id,
                                                                label: d.name,
                                                            })
                                                        )}
                                                        styles={customStyles}
                                                        components={
                                                            animatedComponents
                                                        }
                                                        placeholder="Optionnel..."
                                                        isClearable
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Bureau/Localisation
                                                    </label>
                                                    <Select
                                                        value={locations
                                                            .map(l => ({
                                                                value: l.id,
                                                                label: l.name,
                                                            }))
                                                            .find(
                                                                option =>
                                                                    option.value ===
                                                                    ligne.destinataire_location_id
                                                            )}
                                                        onChange={selected =>
                                                            handleLigneChange(
                                                                index,
                                                                "destinataire_location_id",
                                                                selected?.value ||
                                                                    ""
                                                            )
                                                        }
                                                        options={locations.map(
                                                            l => ({
                                                                value: l.id,
                                                                label: l.name,
                                                            })
                                                        )}
                                                        styles={customStyles}
                                                        components={
                                                            animatedComponents
                                                        }
                                                        placeholder="Optionnel..."
                                                        isClearable
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Employé Destinataire
                                                    </label>
                                                    <Select
                                                        value={employees
                                                            .map(emp => ({
                                                                value: emp.id,
                                                                label: emp.name,
                                                            }))
                                                            .find(
                                                                option =>
                                                                    option.value ===
                                                                    ligne.destinataire_employee_id
                                                            )}
                                                        onChange={selected =>
                                                            handleLigneChange(
                                                                index,
                                                                "destinataire_employee_id",
                                                                selected?.value ||
                                                                    ""
                                                            )
                                                        }
                                                        options={employees.map(
                                                            emp => ({
                                                                value: emp.id,
                                                                label: emp.name,
                                                            })
                                                        )}
                                                        styles={customStyles}
                                                        components={
                                                            animatedComponents
                                                        }
                                                        placeholder="Optionnel..."
                                                        isClearable
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <button
                                type="button"
                                onClick={ajouterLigne}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 hover:border-slate-400 transition-all"
                            >
                                <PlusCircle className="h-5 w-5" /> Ajouter un
                                article
                            </button>
                        </div>
                        <div className="p-6 bg-slate-50/70 border-t border-slate-200 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
                            >
                                {isLoading
                                    ? "Envoi..."
                                    : "Soumettre la Demande"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
