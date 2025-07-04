import React, { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom" // CORRECTION: On utilise useLocation
import materialService from "@/services/materialService"
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
  

const etatOptions = [
    { value: "stock", label: "En stock" },
    { value: "service", label: "En service" },
    { value: "hs", label: "Hors service" },
    { value: "reforme", label: "Réformé" },
]

export default function AdminAjouterMateriel() {
    // CORRECTION : On utilise useLocation() pour récupérer l'ID passé par le bouton "Modifier".
    const location = useLocation()
    const navigate = useNavigate()
    console.log(
        "État de la navigation reçu sur la page formulaire :",
        location.state
    )
    const materialIdToEdit = location.state?.materialId || null
    const isEditMode = Boolean(materialIdToEdit)

    const [activeTab, setActiveTab] = useState("general")
    const [isLoading, setIsLoading] = useState(true)

    // États pour les fichiers
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [factureFile, setFactureFile] = useState(null)
    const [bonLivraisonFile, setBonLivraisonFile] = useState(null)

    // États pour les listes des menus déroulants
    const [generalAssetTypes, setGeneralAssetTypes] = useState([])
    const [allSubcategories, setAllSubcategories] = useState([]) // Stocke TOUTES les sous-catégories
    const [locations, setLocations] = useState([])
    const [employees, setEmployees] = useState([])
    const [departments, setDepartments] = useState([])
    const [fournisseurs, setFournisseurs] = useState([])

    // États pour les valeurs sélectionnées dans le formulaire
    const [selectedGeneralType, setSelectedGeneralType] = useState("")
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("")
    const [assetData, setAssetData] = useState({
        name: "",
        date_acquisition: new Date().toISOString().split("T")[0],
        valeur_acquisition: "",
        etat: "stock",
        department_id: "",
        employee_id: "",
        location_id: "",
        fournisseur: "",
    })
    const [specificData, setSpecificData] = useState({})

    useEffect(() => {
        console.log("--- LE COMPOSANT SE CHARGE ---")
        console.log("Mode édition détecté ?", isEditMode)
        console.log("ID à modifier :", materialIdToEdit)
        const loadDependencies = async () => {
            try {
                // On charge toutes les listes nécessaires pour les menus déroulants
                const [types, locs, emps, depts, fours, subcats] =
                    await Promise.all([
                        materialService.fetchTypesGeneraux(),
                        materialService.fetchLocations(),
                        materialService.fetchEmployees(),
                        materialService.fetchDepartments(),
                        materialService.fetchFournisseurs(),
                        materialService.fetchSubcategories(0), // 0 pour récupérer toutes les sous-catégories
                    ])
                setGeneralAssetTypes(types)
                setLocations(locs)
                setEmployees(emps)
                setDepartments(depts)
                setFournisseurs(fours)
                setAllSubcategories(subcats)

                console.log("Listes pour les menus déroulants chargées.")
                // Si on est en mode édition, on charge les données du matériel
                if (isEditMode) {
                    console.log("--- DÉBUT DU PRÉ-REMPLISSAGE ---")
                    const materialToEdit =
                        await materialService.fetchMaterialDetails(
                            materialIdToEdit
                        )

                    // LE LOG LE PLUS IMPORTANT : AFFICHE LES DONNÉES BRUTES DE L'API
                    console.log(
                        "Données brutes reçues de l'API pour le matériel :",
                        materialToEdit
                    )

                    const generalType = types.find(
                        t => t.name === materialToEdit.category
                    )
                    console.log("Type général trouvé :", generalType)

                    setAssetData({
                        name: materialToEdit.name ?? "",
                        date_acquisition: materialToEdit.acquisitionDate
                            ? new Date(materialToEdit.acquisitionDate)
                                  .toISOString()
                                  .split("T")[0]
                            : "",
                        valeur_acquisition: materialToEdit.value ?? "",
                        etat: materialToEdit.status ?? "stock",
                        department_id: materialToEdit.department_id ?? "",
                        employee_id: materialToEdit.assignedTo_id ?? "",
                        location_id: materialToEdit.location_id ?? "",
                        fournisseur: materialToEdit.fournisseur_id ?? "",
                    })

                    // On pré-sélectionne les catégories
                    setSelectedGeneralType(generalType ? generalType.code : "")
                    setSelectedSubcategoryId(
                        materialToEdit.subcategory_id || ""
                    )

                    setSpecificData(materialToEdit.details || {})
                    if (materialToEdit.image) {
                        setImagePreview(
                            `http://localhost:8069${materialToEdit.image}`
                        )
                    }
                } else { console.log("Mode création détecté (pas d'ID)."); }
            } catch (error) {
                console.error("Erreur chargement des données:", error)
                toast.error("Impossible de charger les données nécessaires.")
            } finally {
                setIsLoading(false)
            }
        }

        loadDependencies()
    }, [materialIdToEdit, isEditMode]) // Le useEffect se déclenche si on a un ID à modifier

    const handleChangeSelect = (selectedOption, { name }) => {
        setAssetData(prev => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : "",
        }))
    }

    const handleAssetChange = e => {
        const { name, value } = e.target
        setAssetData(prev => ({ ...prev, [name]: value }))
    }

    const handleSpecificDataChange = e => {
        const { name, value } = e.target
        setSpecificData(prev => ({ ...prev, [name]: value }))
    }

    const handleImageChange = e => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const handleFactureChange = e => {
        const file = e.target.files[0]
        if (file) {
            setFactureFile(file)
        }
    }

    const handleBonLivraisonChange = e => {
        const file = e.target.files[0]
        if (file) {
            setBonLivraisonFile(file)
        }
    }

    const handleSubmit = async e => {
        e.preventDefault()
        setIsLoading(true)
        const formData = new FormData()

        // Ajout des données générales
        Object.entries(assetData).forEach(([key, value]) =>
            formData.append(key, value)
        )
        formData.append("subcategory_id", selectedSubcategoryId)

        // Ajout des données spécifiques
        Object.entries(specificData).forEach(([key, value]) =>
            formData.append(`specific_inherited_data[${key}]`, value)
        )

        // Ajout des fichiers
        if (imageFile) formData.append("image", imageFile)
        if (factureFile) formData.append("facture", factureFile)
        if (bonLivraisonFile) formData.append("bon_livraison", bonLivraisonFile)

        try {
            if (isEditMode) {
                await materialService.updateItem(materialIdToEdit, formData)
                toast.success("Matériel mis à jour avec succès !")
                navigate(`/admin/materiel/${materialIdToEdit}`)
            } else {
                const response = await materialService.createItem(formData)
                toast.success("Matériel ajouté avec succès !")
                navigate(`/admin/materiel/${response.item_id}`)
            }
        } catch (error) {
            console.error("Erreur lors de l'enregistrement:", error)
            toast.error(
                `Erreur: ${error.message || "Échec de l'enregistrement"}`
            )
        } finally {
            setIsLoading(false)
        }
    }


    const renderSpecificFields = () => {
        switch (selectedGeneralType) {
            case "informatique":
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Marque
                            </label>
                            <input
                                name="marque"
                                value={specificData.marque || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Modèle
                            </label>
                            <input
                                name="modele"
                                value={specificData.modele || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Numéro de série
                            </label>
                            <input
                                name="numero_serie"
                                value={specificData.numero_serie || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Fin de garantie
                            </label>
                            <input
                                type="date"
                                name="date_garantie_fin"
                                value={specificData.date_garantie_fin || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                    </>
                )
            case "mobilier":
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Catégorie de mobilier
                            </label>
                            <input
                                name="categorie_mobilier"
                                value={specificData.categorie_mobilier || ""}
                                onChange={handleSpecificDataChange}
                                placeholder="Ex: Chaise, Bureau..."
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                État de conservation
                            </label>
                            <select
                                name="etat_conservation"
                                value={specificData.etat_conservation || ""}
                                onChange={e =>
                                    setSpecificData(prev => ({
                                        ...prev,
                                        etat_conservation: e.target.value,
                                    }))
                                }
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            >
                                <option value="">Sélectionnez...</option>
                                <option value="bon">Bon</option>
                                <option value="moyen">Moyen</option>
                                <option value="a_reparer">À réparer</option>
                            </select>
                        </div>
                    </>
                )
            case "vehicule":
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Immatriculation
                            </label>
                            <input
                                name="immatriculation"
                                value={specificData.immatriculation || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Marque
                            </label>
                            <input
                                name="marque"
                                value={specificData.marque || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-2.5 border border-slate-300 rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Modèle
                            </label>
                            <input
                                name="modele"
                                value={specificData.modele || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Kilométrage
                            </label>
                            <input
                                type="number"
                                name="kilometrage"
                                value={specificData.kilometrage || ""}
                                onChange={handleSpecificDataChange}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                            />
                        </div>
                    </>
                )
            default:
                return (
                    <p className="text-slate-500 col-span-full">
                        Sélectionnez un type de matériel pour voir les champs
                        spécifiques.
                    </p>
                )
        }
    }

    if (isLoading)
        return (
            <div className="p-8 text-center">Chargement du formulaire...</div>
        )

    const filteredSubcategories = selectedGeneralType
        ? allSubcategories.filter(
                sc => sc.category_type === selectedGeneralType
            )
        : []
    
    const locationOptions = locations.map(l => ({
        value: l.id,
        label: l.name,
    }))
    const departmentOptions = departments.map(d => ({
        value: d.id,
        label: d.name,
    }))
    const employeeOptions = employees.map(e => ({
        value: e.id,
        label: e.name,
    }))
    const fournisseurOptions = fournisseurs.map(f => ({
        value: f.id,
        label: f.name,
    }))
        

    return (
        <div>
            <div className="max-w-5xl mx-auto">
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                        <div className="p-6 border-b border-slate-200">
                            <h1 className="text-2xl font-bold text-white">
                                {isEditMode
                                    ? "Modification de Matériel"
                                    : "Nouveau Matériel"}
                            </h1>
                            <p className="mt-1 text-sm text-white">
                                {isEditMode
                                    ? `Mise à jour des informations pour ${assetData.name}.`
                                    : "Remplissez les informations pour enregistrer un nouvel actif."}
                            </p>
                        </div>
                    </div>
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-xl shadow-2xl border border-slate-200/70 backdrop-blur-sm transition-all duration-300 hover:shadow-3xl"
                    >
                        <div className="border-b border-slate-200 bg-slate-50">
                            <nav className="flex -mb-px">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("general")}
                                    className={`w-1/2 py-4 px-1 text-center font-medium text-sm border-b-2 transition-all duration-300 ${activeTab === "general" ? "border-orange-500 text-orange-600 bg-orange-50/70" : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-orange-100/50"}`}
                                >
                                    Informations Générales
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab("specific")}
                                    className={`w-1/2 py-4 px-1 text-center font-medium text-sm border-b-2 transition-all duration-300 ${activeTab === "specific" ? "border-orange-500 text-orange-600 bg-orange-50/70" : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-orange-100/50"}`}
                                >
                                    Détails Spécifiques
                                </button>
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === "general" && (
                                <div className="space-y-6">
                                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                                        {/* Section Type */}
                                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                            <div className="w-2 h-6 bg-orange-500 rounded-full mr-3"></div>
                                            Catégorie du Matériel
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Type de matériel */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Type de matériel
                                                </label>
                                                <Select
                                                    options={generalAssetTypes.map(
                                                        t => ({
                                                            value: t.code,
                                                            label: t.name,
                                                        })
                                                    )}
                                                    value={
                                                        selectedGeneralType
                                                            ? {
                                                                  value: selectedGeneralType,
                                                                  label: generalAssetTypes.find(
                                                                      t =>
                                                                          t.code ===
                                                                          selectedGeneralType
                                                                  )?.name,
                                                              }
                                                            : null
                                                    }
                                                    onChange={selected =>
                                                        setSelectedGeneralType(
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        )
                                                    }
                                                    styles={customStyles}
                                                    placeholder="Sélectionnez un type"
                                                    isClearable
                                                />
                                            </div>

                                            {/* Sous-catégorie */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Sous-catégorie
                                                </label>
                                                <Select
                                                    options={filteredSubcategories.map(
                                                        sc => ({
                                                            value: sc.id,
                                                            label: sc.name,
                                                        })
                                                    )}
                                                    value={
                                                        selectedSubcategoryId
                                                            ? {
                                                                  value: selectedSubcategoryId,
                                                                  label: filteredSubcategories.find(
                                                                      sc =>
                                                                          sc.id ===
                                                                          selectedSubcategoryId
                                                                  )?.name,
                                                              }
                                                            : null
                                                    }
                                                    onChange={selected =>
                                                        setSelectedSubcategoryId(
                                                            selected
                                                                ? selected.value
                                                                : ""
                                                        )
                                                    }
                                                    isDisabled={
                                                        !selectedGeneralType
                                                    }
                                                    styles={customStyles}
                                                    placeholder="Sélectionnez une sous-catégorie"
                                                    isClearable
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                            <div className="w-2 h-6 bg-orange-500 rounded-full mr-3"></div>
                                            Informations d'Acquisition
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {/* Nom du matériel */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Nom du matériel
                                                </label>
                                                <input
                                                    name="name"
                                                    value={assetData.name}
                                                    onChange={handleAssetChange}
                                                    required
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                                />
                                            </div>

                                            {/* Date d'acquisition */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Date d'acquisition
                                                </label>
                                                <input
                                                    type="date"
                                                    name="date_acquisition"
                                                    value={
                                                        assetData.date_acquisition
                                                    }
                                                    onChange={handleAssetChange}
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                                />
                                            </div>

                                            {/* Valeur (€) */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    Valeur (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    name="valeur_acquisition"
                                                    value={
                                                        assetData.valeur_acquisition
                                                    }
                                                    onChange={handleAssetChange}
                                                    className="w-full p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                                />
                                            </div>

                                            {/* État */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                                    État
                                                </label>
                                                <Select
                                                    name="etat"
                                                    options={etatOptions}
                                                    value={
                                                        etatOptions.find(
                                                            option =>
                                                                option.value ===
                                                                assetData.etat
                                                        ) || null
                                                    }
                                                    onChange={selected =>
                                                        setAssetData(prev => ({
                                                            ...prev,
                                                            etat:
                                                                selected?.value ||
                                                                "",
                                                        }))
                                                    }
                                                    styles={customStyles}
                                                    placeholder="Sélectionnez l'état"
                                                    isClearable
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Affectation */}
                                    <div className="bg-gray-50 rounded-xl p-6">
                                        <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                            <div className="w-2 h-6 bg-orange-500 rounded-full mr-3"></div>
                                            Affectation et Fournisseur
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Localisation */}
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-1">
                                                    Localisation
                                                </label>
                                                <Select
                                                    name="location_id"
                                                    value={
                                                        locationOptions.find(
                                                            opt =>
                                                                opt.value ===
                                                                assetData.location_id
                                                        ) || null
                                                    }
                                                    onChange={selected =>
                                                        setAssetData(prev => ({
                                                            ...prev,
                                                            location_id:
                                                                selected
                                                                    ? selected.value
                                                                    : "",
                                                        }))
                                                    }
                                                    options={locationOptions}
                                                    styles={customStyles}
                                                    placeholder="Sélectionnez..."
                                                    isClearable
                                                />
                                            </div>

                                            {/* Département */}
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-1">
                                                    Département
                                                </label>
                                                <Select
                                                    name="department_id"
                                                    value={
                                                        departmentOptions.find(
                                                            opt =>
                                                                opt.value ===
                                                                assetData.department_id
                                                        ) || null
                                                    }
                                                    onChange={selected =>
                                                        setAssetData(prev => ({
                                                            ...prev,
                                                            department_id:
                                                                selected
                                                                    ? selected.value
                                                                    : "",
                                                        }))
                                                    }
                                                    options={departmentOptions}
                                                    styles={customStyles}
                                                    placeholder="Sélectionnez..."
                                                    isClearable
                                                />
                                            </div>

                                            {/* Employé */}
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-1">
                                                    Employé
                                                </label>
                                                <Select
                                                    name="employee_id"
                                                    value={
                                                        employeeOptions.find(
                                                            opt =>
                                                                opt.value ===
                                                                assetData.employee_id
                                                        ) || null
                                                    }
                                                    onChange={selected =>
                                                        setAssetData(prev => ({
                                                            ...prev,
                                                            employee_id:
                                                                selected
                                                                    ? selected.value
                                                                    : "",
                                                        }))
                                                    }
                                                    options={employeeOptions}
                                                    styles={customStyles}
                                                    placeholder="Sélectionnez..."
                                                    isClearable
                                                />
                                            </div>

                                            {/* Fournisseur */}
                                            <div>
                                                <label className="block text-sm font-medium text-white mb-1">
                                                    Fournisseur
                                                </label>
                                                <Select
                                                    name="fournisseur"
                                                    value={
                                                        fournisseurOptions.find(
                                                            opt =>
                                                                opt.value ===
                                                                assetData.fournisseur
                                                        ) || null
                                                    }
                                                    onChange={selected =>
                                                        setAssetData(prev => ({
                                                            ...prev,
                                                            fournisseur:
                                                                selected
                                                                    ? selected.value
                                                                    : "",
                                                        }))
                                                    }
                                                    options={fournisseurOptions}
                                                    styles={customStyles}
                                                    placeholder="Sélectionnez..."
                                                    isClearable
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === "specific" && (
                                <div className="space-y-6">
                                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                                        <h3 className="font-semibold text-lg mb-4 text-slate-800">
                                            Champs Spécifiques au Type
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {renderSpecificFields()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Section Documents */}
                        <div className="bg-gray-50 rounded-xl p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                                <div className="w-2 h-6 bg-green-500 rounded-full mr-3"></div>
                                Documents Associés
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Image du matériel
                                    </label>
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="w-full border-2 border-green-400 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors bg-green-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-white hover:file:bg-green-600"
                                    />
                                    {imagePreview && (
                                        <img
                                            src={imagePreview}
                                            alt="Prévisualisation"
                                            className="mt-2 h-24 object-contain"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Facture (PDF/Image)
                                    </label>
                                    <input
                                        type="file"
                                        name="facture"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFactureChange}
                                        className="w-full border-2 border-green-400 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors bg-green-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-white hover:file:bg-green-600"
                                    />
                                    {factureFile && (
                                        <p className="mt-2 text-sm text-gray-700">
                                            {factureFile.name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bon de livraison
                                    </label>
                                    <input
                                        type="file"
                                        name="bon_livraison"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleBonLivraisonChange}
                                        className="w-full border-2 border-green-400 rounded-lg px-4 py-3 focus:border-green-500 focus:outline-none transition-colors bg-green-50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-500 file:text-white hover:file:bg-green-600"
                                    />
                                    {bonLivraisonFile && (
                                        <p className="mt-2 text-sm text-gray-700">
                                            {bonLivraisonFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center space-x-2"
                            >
                                Annuler
                            </button>
                            {activeTab === "general" ? (
                                <button
                                    type="button"
                                    onClick={e => {
                                        e.preventDefault()
                                        if (
                                            !selectedGeneralType ||
                                            !selectedSubcategoryId ||
                                            !assetData.name
                                        ) {
                                            toast.error(
                                                "Veuillez remplir tous les champs obligatoires"
                                            )
                                            return
                                        }
                                        setActiveTab("specific")
                                    }}
                                    className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
                                >
                                    Suivant
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
                                >
                                    {/* CORRECTION : On utilise la variable isEditMode pour changer le texte */}
                                    {isEditMode ? "Modifier" : "Enregistrer"}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
