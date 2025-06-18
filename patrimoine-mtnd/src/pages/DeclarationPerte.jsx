// pages/pertes/CreatePerteForm.jsx (Exemple d'un nouveau composant)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import materialService from '@/services/materialService'; // Import du service

export default function CreatePerteForm() {
    const navigate = useNavigate();
    const [perteData, setPerteData] = useState({
        asset_id: '',
        motif: '',
    });
    const [materials, setMaterials] = useState([]); // Liste des matériels pour le dropdown
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadMaterials = async () => {
            try {
                setIsLoading(true);
                setError(null);
                // Récupérer tous les assets pour permettre à l'utilisateur de sélectionner celui concerné
                const data = await materialService.fetchMaterials(); // Utilise fetchMaterials qui renvoie tous les assets
                setMaterials(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Erreur chargement des matériels:", err);
                setError(err.message || "Impossible de charger la liste des matériels.");
            } finally {
                setIsLoading(false);
            }
        };
        loadMaterials();
    }, []);

    const handleChange = (field, value) => {
        setPerteData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Convertir asset_id en entier
            const dataToSend = {
                asset_id: perteData.asset_id ? parseInt(perteData.asset_id) : false,
                motif: perteData.motif,
            };

            if (!dataToSend.asset_id || !dataToSend.motif) {
                alert("Veuillez renseigner tous les champs obligatoires (Matériel, Motif).");
                return;
            }

            const response = await materialService.createPerte(dataToSend);
            if (response && response.status === 'success') {
                alert(`Déclaration de perte soumise avec succès ! Référence: ${response.perte_name}`);
                navigate("/admin/pertes"); // Rediriger vers la liste des déclarations de perte
            } else if (response && response.message) {
                throw new Error(response.message);
            } else {
                throw new Error("Réponse inattendue du serveur.");
            }
        } catch (err) {
            console.error("Erreur lors de la soumission de la déclaration:", err);
            alert(`Erreur: ${err.message || "Échec de la soumission de la déclaration."}`);
        }
    };

    if (isLoading) return <div>Chargement des matériels...</div>;
    if (error) return <div>Erreur: {error}</div>;

    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Déclarer une Perte de Matériel</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sélection du Bien concerné */}
                        <div>
                            <Label htmlFor="asset_id">Bien concerné</Label>
                            <Select
                                value={perteData.asset_id}
                                onValueChange={val => handleChange("asset_id", val)}
                                required
                            >
                                <SelectTrigger><SelectValue placeholder="Sélectionner un matériel" /></SelectTrigger>
                                <SelectContent>
                                    {materials.map(material => (
                                        <SelectItem key={material.id} value={material.id}>
                                            {material.name} ({material.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Motif de la perte */}
                        <div>
                            <Label htmlFor="motif">Motif de la Perte</Label>
                            <Textarea
                                value={perteData.motif}
                                onChange={e => handleChange('motif', e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex justify-end mt-6">
                            <Button type="submit">Déclarer la Perte</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}