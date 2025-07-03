import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import materialService from "@/services/materialService";
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

const mouvementOptions = [
    { value: "affectation", label: "Affectation" },
    { value: "transfert", label: "Transfert" },
    { value: "reparation", label: "Réparation / Maintenance" },
    { value: "sortie", label: "Sortie (Mise HS, Perte, etc.)" },
    { value: "retour_stock", label: "Retour en stock" },
    { value: "amortissement", label: "Amortissement" },
]

const sortieOptions = [
    { value: "perte", label: "Perte" },
    { value: "vol", label: "Vol" },
    { value: "obsolescence", label: "Obsolescence" },
    { value: "autre", label: "Autre" },
]
const fournisseurOptions = [
    { value: "Fournisseur 1", label: "Fournisseur 1" },
    { value: "Fournisseur 2", label: "Fournisseur 2" },
    // ...
]
  
const amortissementOptions = [
    { value: "usure", label: "Usure normale" },
    { value: "defaillance", label: "Défaillance technique" },
    { value: "fin_cycle", label: "Fin de cycle de vie" },
    { value: "autre", label: "Autre" },
]

function AdminMouvement() {
    const navigate = useNavigate()
    // --- Utilisation de useSearchParams pour lire l'URL ---
    const [searchParams] = useSearchParams()
    const location = useLocation()

    // CORRECTION : On récupère les IDs sources depuis location.state
    const sourceLocationId = location.state?.sourceLocationId
    const sourceEmployeeId = location.state?.sourceEmployeeId

    const [materials, setMaterials] = useState([])
    const [departments, setDepartments] = useState([])
    const [employees, setEmployees] = useState([])
    const [locations, setLocations] = useState([])
    const [loading, setLoading] = useState(true)

    // --- L'état initial du formulaire est DÉFINI par les paramètres de l'URL ---
    const [formData, setFormData] = useState({
        asset_id: searchParams.get("assetId") || "",
        type_mouvement: searchParams.get("type") || "",
        date: new Date().toISOString().split("T")[0],
        from_location_id: sourceLocationId || "",
        from_employee_id: sourceEmployeeId || "",
        to_department_id: "",
        to_employee_id: "",
        to_location_id: "",
        motif: "",
    })

    useEffect(() => {
        const loadDropdownData = async () => {
            setLoading(true)
            try {
                const [mats, depts, emps, locs] = await Promise.all([
                    materialService.fetchMaterials(),
                    materialService.fetchDepartments(),
                    materialService.fetchEmployees(),
                    materialService.fetchLocations(),
                ])
                setMaterials(mats)
                setDepartments(depts)
                setEmployees(emps)
                setLocations(locs)
            } catch (error) {
                console.error("Error loading dropdown data:", error)
            } finally {
                setLoading(false)
            }
        }
        loadDropdownData()
    }, [])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async e => {
        e.preventDefault()
        try {
            const dataToSend = { ...formData }
            await materialService.saveMouvement(dataToSend)
            alert("Mouvement enregistré avec succès !")
            navigate(-1)
        } catch (error) {
            console.error("Erreur lors de l'enregistrement:", error)
            alert(error.message || "Échec de l'enregistrement.")
        }
    }

    const renderConditionalFields = () => {
        const { type_mouvement } = formData
        if (!type_mouvement) return null

        const fieldComponents = {
            affectation: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Département Destination
                        </label>
                        <Select
                            name="to_department_id"
                            value={
                                departments
                                    .map(dept => ({
                                        value: dept.id,
                                        label: dept.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.to_department_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "to_department_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={departments.map(dept => ({
                                value: dept.id,
                                label: dept.name,
                            }))}
                            placeholder="Sélectionner un département"
                            isClearable
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Employé Destination
                        </label>
                        <Select
                            name="to_employee_id"
                            value={
                                employees
                                    .map(emp => ({
                                        value: emp.id,
                                        label: emp.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.to_employee_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "to_employee_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={employees.map(emp => ({
                                value: emp.id,
                                label: emp.name,
                            }))}
                            placeholder="Sélectionner un employé"
                            isClearable
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Localisation Destination
                        </label>
                        <Select
                            name="to_location_id"
                            value={
                                locations
                                    .map(loc => ({
                                        value: loc.id,
                                        label: loc.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.to_location_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "to_location_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={locations.map(loc => ({
                                value: loc.id,
                                label: loc.name,
                            }))}
                            placeholder="Sélectionner une localisation"
                            isClearable
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>
                </div>
            ),
            transfert: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Localisation Source
                        </label>
                        <Select
                            name="from_location_id"
                            value={
                                locations
                                    .map(loc => ({
                                        value: loc.id,
                                        label: loc.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.from_location_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "from_location_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={locations.map(loc => ({
                                value: loc.id,
                                label: loc.name,
                            }))}
                            placeholder="Localisation actuelle"
                            isDisabled={!formData.asset_id}
                            isClearable
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Employé Source
                        </label>
                        <Select
                            name="from_employee_id"
                            value={
                                employees
                                    .map(emp => ({
                                        value: emp.id,
                                        label: emp.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.from_employee_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "from_employee_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={employees.map(emp => ({
                                value: emp.id,
                                label: emp.name,
                            }))}
                            placeholder="Employé actuel"
                            isClearable
                            isDisabled={!formData.asset_id}
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Département Destination
                        </label>
                        <Select
                            name="to_department_id"
                            value={
                                departments
                                    .map(dept => ({
                                        value: dept.id,
                                        label: dept.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.to_department_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "to_department_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={departments.map(dept => ({
                                value: dept.id,
                                label: dept.name,
                            }))}
                            placeholder="Sélectionner un département"
                            isClearable
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Employé Destination
                        </label>
                        <Select
                            name="to_employee_id"
                            value={
                                employees
                                    .map(emp => ({
                                        value: emp.id,
                                        label: emp.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.to_employee_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "to_employee_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={employees.map(emp => ({
                                value: emp.id,
                                label: emp.name,
                            }))}
                            placeholder="Sélectionner un employé"
                            isClearable
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Localisation Destination
                        </label>
                        <Select
                            name="to_location_id"
                            value={
                                locations
                                    .map(loc => ({
                                        value: loc.id,
                                        label: loc.name,
                                    }))
                                    .find(
                                        option =>
                                            option.value ===
                                            formData.to_location_id
                                    ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "to_location_id",
                                    selected ? selected.value : ""
                                )
                            }
                            options={locations.map(loc => ({
                                value: loc.id,
                                label: loc.name,
                            }))}
                            placeholder="Sélectionner une localisation"
                            isClearable
                            styles={customStyles}
                            components={animatedComponents}
                        />
                    </div>
                </div>
            ),
            sortie: (
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Raison de la sortie
                        </label>
                        <Select
                            name="sortie_reason"
                            value={
                                sortieOptions.find(
                                    option =>
                                        option.value === formData.sortie_reason
                                ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "sortie_reason",
                                    selected ? selected.value : ""
                                )
                            }
                            options={[
                                { value: "perte", label: "Perte" },
                                { value: "vol", label: "Vol" },
                                {
                                    value: "obsolescence",
                                    label: "Obsolescence",
                                },
                                { value: "autre", label: "Autre" },
                            ]}
                            placeholder="Sélectionner une raison"
                            isClearable
                            components={animatedComponents}
                            styles={customStyles}
                        />
                    </div>
                </div>
            ),

            reparation: (
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Fournisseur de réparation
                        </label>
                        <Select
                            name="reparation_provider"
                            value={
                                fournisseurOptions.find(
                                    opt =>
                                        opt.value ===
                                        formData.reparation_provider
                                ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "reparation_provider",
                                    selected ? selected.value : ""
                                )
                            }
                            options={fournisseurOptions}
                            placeholder="Sélectionnez un fournisseur"
                            isClearable
                            components={animatedComponents}
                            styles={customStyles}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Date de retour prévue
                        </label>
                        <input
                            type="date"
                            value={formData.reparation_return_date}
                            onChange={e =>
                                handleChange(
                                    "reparation_return_date",
                                    e.target.value
                                )
                            }
                            required
                            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
            ),
            amortissement: (
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Raison de l'amortissement
                        </label>
                        <Select
                            name="amortissement_reason"
                            value={
                                amortissementOptions.find(
                                    opt =>
                                        opt.value ===
                                        formData.amortissement_reason
                                ) || null
                            }
                            onChange={selected =>
                                handleChange(
                                    "amortissement_reason",
                                    selected ? selected.value : ""
                                )
                            }
                            options={amortissementOptions}
                            placeholder="Sélectionnez une raison"
                            isClearable
                            components={animatedComponents}
                            styles={customStyles}
                        />
                    </div>
                </div>
            ),
        }

        return fieldComponents[type_mouvement] || null
    }

    if (loading)
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        )

    return (
        <div className="min-h-screen w-full">
            <div className="max-w-4xl mx-auto">
                <div className="rounded-t bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                    <div className="p-6 border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-white">
                            Nouveau Mouvement
                        </h1>
                        <p className="mt-1 text-sm text-white">
                            Suivez le cycle de vie d'un bien en enregistrant une
                            nouvelle action.
                        </p>
                    </div>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="bg-white  shadow-lg border border-slate-200"
                >
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bien concerné */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Bien concerné
                                </label>
                                <Select
                                    isDisabled={!!searchParams.get("assetId")}
                                    name="asset_id"
                                    value={
                                        materials
                                            .map(m => ({
                                                value: m.id,
                                                label: `${m.name} (${m.code})`,
                                            }))
                                            .find(
                                                opt =>
                                                    opt.value ===
                                                    formData.asset_id
                                            ) || null
                                    }
                                    onChange={selected =>
                                        handleChange(
                                            "asset_id",
                                            selected ? selected.value : ""
                                        )
                                    }
                                    options={materials.map(m => ({
                                        value: m.id,
                                        label: `${m.name} (${m.code})`,
                                    }))}
                                    styles={customStyles}
                                    components={animatedComponents}
                                    placeholder="Sélectionner un bien..."
                                    isClearable
                                />
                            </div>
                            {/* Type de mouvement */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Type de mouvement
                                </label>
                                <Select
                                    name="type_mouvement"
                                    value={
                                        mouvementOptions.find(
                                            opt =>
                                                opt.value ===
                                                formData.type_mouvement
                                        ) || null
                                    }
                                    onChange={selected =>
                                        handleChange(
                                            "type_mouvement",
                                            selected ? selected.value : ""
                                        )
                                    }
                                    options={mouvementOptions}
                                    styles={customStyles}
                                    components={animatedComponents}
                                    placeholder="Sélectionner un type..."
                                    isClearable
                                />
                            </div>
                        </div>

                        {renderConditionalFields()}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Date et Motif
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e =>
                                        handleChange("date", e.target.value)
                                    }
                                    required
                                    className="w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                />
                                <textarea
                                    value={formData.motif}
                                    onChange={e =>
                                        handleChange("motif", e.target.value)
                                    }
                                    required
                                    rows="3"
                                    className="md:col-span-2 w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                    placeholder="Raison du mouvement..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50/70 border-t border-slate-200 flex justify-end items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AdminMouvement;