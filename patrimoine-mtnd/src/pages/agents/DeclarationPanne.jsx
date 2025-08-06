import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import Select from "react-select"
import makeAnimated from "react-select/animated"
import materialService from "@/services/materialService"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const animatedComponents = makeAnimated()

const customStyles = {
    control: (base, state) => ({
        ...base,
        borderWidth: "1px",
        borderRadius: "0.5rem",
        padding: "0.25rem",
        backgroundColor: "white",
        borderColor: state.isFocused ? "#f97316" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 2px rgba(249,115,22,0.5)" : "none",
        "&:hover": { borderColor: "#fb923c" },
        transition: "all 0.2s ease",
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isFocused ? "#fed7aa" : "white",
        color: "#1f2937",
        "&:hover": { backgroundColor: "#fb923c", color: "white" },
        cursor: "pointer",
    }),
    singleValue: base => ({ ...base, color: "#1f2937" }),
    menu: base => ({ ...base, zIndex: 9999 }),
}

export default function DeclarationPanne() {
    const navigate = useNavigate()
    const [assets, setAssets] = useState([])
    const [loading, setLoading] = useState(true)
    const [formData, setFormData] = useState({ asset_id: "", description: "" })

    useEffect(() => {
        materialService
            .fetchMaterialsByUser()
            .then(setAssets)
            .catch(() => toast.error("Impossible de charger vos matériels."))
            .finally(() => setLoading(false))
    }, [])

    const handleSubmit = async e => {
        e.preventDefault()
        if (!formData.asset_id || !formData.description.trim()) {
            toast.error(
                "Veuillez sélectionner le matériel et décrire la panne."
            )
            return
        }
        try {
            await materialService.createPanne(formData)
            toast.success("Panne déclarée avec succès.")
            navigate("/agent") // Ou une autre page de confirmation
        } catch (err) {
            toast.error(`Erreur lors de la déclaration : ${err.message}`)
        }
    }

    if (loading) return <div className="p-8 text-center">Chargement...</div>

    return (
        <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* --- DÉBUT DE LA NOUVELLE STRUCTURE --- */}
                <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
                    {/* En-tête du formulaire */}
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
                        <h1 className="text-2xl font-bold text-white">
                            Déclaration de Panne
                        </h1>
                        <p className="mt-1 text-sm text-white">
                            Signalez une panne sur un matériel qui vous est
                            affecté.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Corps du formulaire */}
                        <div className="p-8 space-y-6">
                            <div>
                                <Label
                                    htmlFor="asset"
                                    className="text-xl font-semibold text-black mb-2"
                                >
                                    Matériel concerné *
                                </Label>
                                <Select
                                    inputId="asset"
                                    styles={customStyles}
                                    components={animatedComponents}
                                    options={assets.map(a => ({
                                        value: a.id,
                                        label: `${a.name} (${a.code})`,
                                    }))}
                                    onChange={opt =>
                                        setFormData(prev => ({
                                            ...prev,
                                            asset_id: opt?.value || "",
                                        }))
                                    }
                                    placeholder="Choisir un de vos matériels..."
                                    className="mt-2"
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor="description"
                                    className="text-xl font-semibold text-black mb-2"
                                >
                                    Description de la panne *
                                </Label>
                                <Textarea
                                    id="description"
                                    required
                                    rows={5}
                                    value={formData.description}
                                    onChange={e =>
                                        setFormData(prev => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Décrivez le plus précisément possible la panne rencontrée..."
                                    className="w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-400 transition duration-200 mt-2"
                                />
                            </div>
                        </div>

                        {/* Pied de page du formulaire */}
                        <div className="flex justify-end space-x-4 p-6 bg-slate-50 border-t">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => navigate(-1)}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                Soumettre la Déclaration
                            </Button>
                        </div>
                    </form>
                </div>
                {/* --- FIN DE LA NOUVELLE STRUCTURE --- */}
            </div>
        </div>
    )
}
