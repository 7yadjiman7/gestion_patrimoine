import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import materialService from "@/services/materialService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

export default function DeclarationPerte() {
    const navigate = useNavigate()
    const [myAssets, setMyAssets] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [formData, setFormData] = useState({
        asset_id: "",
        date_perte: new Date().toISOString().split("T")[0],
        lieu_perte: "",
        circonstances: "",
        actions_entreprises: "",
        rapport_police: false,
    })
    const [documentFile, setDocumentFile] = useState(null)

    useEffect(() => {
        materialService
            .fetchMaterialsByUser()
            .then(setMyAssets)
            .catch(err =>
                toast.error("Impossible de charger la liste de vos matériels.")
            )
            .finally(() => setIsLoading(false))
    }, [])

    const handleChange = e => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleCheckboxChange = checked => {
        setFormData(prev => ({ ...prev, rapport_police: checked }))
    }

    const handleFileChange = e => {
        setDocumentFile(e.target.files[0])
    }

    const handleSubmit = async e => {
        e.preventDefault()
        if (!formData.asset_id || !formData.circonstances) {
            toast.error(
                "Veuillez sélectionner le matériel et décrire les circonstances."
            )
            return
        }

        const data = new FormData()
        // Append all form data fields
        for (const key in formData) {
            data.append(key, formData[key])
        }
        if (documentFile) {
            data.append("document", documentFile)
        }

        setIsLoading(true)
        try {
            // Assurez-vous que materialService.createPerte peut gérer FormData
            await materialService.createPerte(data)
            toast.success(
                "Déclaration de perte soumise avec succès pour validation."
            )
            navigate("/agent")
        } catch (error) {
            toast.error(`Erreur lors de la soumission : ${error.message}`)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center">Chargement...</div>
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="rounded-t bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                    <div className="p-6 border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-white">
                            Nouvelle déclaration
                        </h1>
                        <p className="mt-1 text-sm text-white">
                            Faites une Déclaration de Perte.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end my-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate("/mes-pertes")}
                        className="hover:bg-orange-500 hover:text-white"
                    >
                        Mes déclarations
                    </Button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white shadow-lg border border-slate-200">
                        <div className="p-6 space-y-8">
                            <div>
                                <Label
                                    htmlFor="asset_id"
                                    className="font-semibold"
                                >
                                    Matériel Perdu *
                                </Label>
                                <Select
                                    id="asset_id"
                                    name="asset_id"
                                    value={
                                        myAssets
                                            .map(asset => ({
                                                value: asset.id,
                                                label: `${asset.name} (${asset.code})`,
                                            }))
                                            .find(
                                                option =>
                                                    option.value ===
                                                    formData.asset_id
                                            ) || null
                                    }
                                    onChange={selected =>
                                        handleChange({
                                            target: {
                                                name: "asset_id",
                                                value: selected?.value || "",
                                            },
                                        })
                                    }
                                    options={myAssets.map(asset => ({
                                        value: asset.id,
                                        label: `${asset.name} (${asset.code})`,
                                    }))}
                                    placeholder="-- Sélectionnez un matériel --"
                                    styles={customStyles}
                                    components={animatedComponents}
                                    isClearable
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label
                                        htmlFor="date_perte"
                                        className="font-semibold text-black"
                                    >
                                        Date de la Perte *
                                    </Label>
                                    <Input
                                        type="date"
                                        id="date_perte"
                                        name="date_perte"
                                        value={formData.date_perte}
                                        onChange={handleChange}
                                        required
                                        className="w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                    />
                                </div>
                                <div>
                                    <Label
                                        htmlFor="lieu_perte"
                                        className="font-semibold text-black"
                                    >
                                        Lieu de la Perte
                                    </Label>
                                    <Input
                                        type="text"
                                        id="lieu_perte"
                                        name="lieu_perte"
                                        value={formData.lieu_perte}
                                        onChange={handleChange}
                                        placeholder="Ex: Bureau 301, en déplacement à..."
                                        className="w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label
                                    htmlFor="circonstances"
                                    className="font-semibold text-black"
                                >
                                    Circonstances Détaillées *
                                </Label>
                                <Textarea
                                    id="circonstances"
                                    name="circonstances"
                                    value={formData.circonstances}
                                    onChange={handleChange}
                                    required
                                    rows={4}
                                    placeholder="Décrivez précisément comment la perte s'est produite..."
                                    className="w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                />
                            </div>

                            <div>
                                <Label
                                    htmlFor="actions_entreprises"
                                    className="font-semibold text-black"
                                >
                                    Actions Immédiates Entreprises
                                </Label>
                                <Textarea
                                    id="actions_entreprises"
                                    name="actions_entreprises"
                                    value={formData.actions_entreprises}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Ex: J'ai cherché partout dans le bureau, j'ai prévenu mon manager..."
                                    className="w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm 
                                                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                                                    hover:border-orange-400 transition duration-200"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="rapport_police"
                                        checked={formData.rapport_police}
                                        onCheckedChange={handleCheckboxChange}
                                    />
                                    <Label
                                        htmlFor="rapport_police"
                                        className="font-semibold text-black"
                                    >
                                        Une déclaration à la police a-t-elle été
                                        effectuée ?
                                    </Label>
                                </div>
                                {formData.rapport_police && (
                                    <div>
                                        <Label
                                            htmlFor="document"
                                            className="font-semibold"
                                        >
                                            Joindre le Procès-Verbal (PDF, PNG,
                                            JPG) *
                                        </Label>
                                        <Input
                                            type="file"
                                            id="document"
                                            name="document"
                                            onChange={handleFileChange}
                                            required={formData.rapport_police}
                                            accept=".pdf,.png,.jpg,.jpeg"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="px-8 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
                                >
                                    {isLoading
                                        ? "Soumission en cours..."
                                        : "Soumettre la Déclaration"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
