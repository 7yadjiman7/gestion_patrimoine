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
    singleValue: base => ({
        ...base,
        color: "#1f2937",
    }),
    menu: base => ({
        ...base,
        zIndex: 9999,
    }),
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
            toast.error("Veuillez sélectionner le matériel et décrire la panne.")
            return
        }
        try {
            await materialService.createPanne(formData)
            toast.success("Panne déclarée avec succès.")
            navigate("/agent")
        } catch (err) {
            toast.error(`Erreur lors de la déclaration : ${err.message}`)
        }
    }

    return (
        <div className="min-h-screen w-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold">Déclaration de Panne</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="asset" className="font-semibold text-black">
                            Matériel concerné *
                        </Label>
                        <Select
                            inputId="asset"
                            styles={customStyles}
                            components={animatedComponents}
                            options={assets.map(a => ({ value: a.id, label: a.name }))}
                            onChange={opt =>
                                setFormData(prev => ({ ...prev, asset_id: opt?.value || "" }))
                            }
                            isDisabled={loading}
                            placeholder="Choisir un matériel"
                        />
                    </div>
                    <div>
                        <Label htmlFor="description" className="font-semibold text-black">
                            Description de la panne *
                        </Label>
                        <Textarea
                            id="description"
                            required
                            rows={4}
                            value={formData.description}
                            onChange={e =>
                                setFormData(prev => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Décrivez la panne rencontrée..."
                            className="w-full text-black p-2.5 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 hover:border-orange-400 transition duration-200"
                        />
                    </div>
                    <div className="flex justify-end space-x-4 pt-2">
                        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
                            Soumettre
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
