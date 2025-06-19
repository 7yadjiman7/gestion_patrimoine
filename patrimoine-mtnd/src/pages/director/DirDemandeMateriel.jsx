// components/director/DirDemandeMateriel.jsx (FORTEMENT MODIFIÉ)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import materialService from '@/services/materialService';
import { PlusCircle, Trash2 } from 'lucide-react'; // Icônes pour l'ergonomie

export default function DirDemandeMateriel() {
    const navigate = useNavigate();
    
    // --- NOUVELLE STRUCTURE DE L'ÉTAT ---
    const [motif, setMotif] = useState('');
    const [lignes, setLignes] = useState([
        { demande_subcategory_id: '', quantite: 1, destinataire_location_id: '', destinataire_employee_id: '' }
    ]);

    // États pour les données des dropdowns
    const [subcategories, setSubcategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]);
    const [employees, setEmployees] = useState([]);

    useEffect(() => {
        const loadDropdownData = async () => {
            try {
                // On a besoin de TOUTES les sous-catégories, et non par type
                const [allSubcats, locs, emps] = await Promise.all([
                    // Note: Il vous faudra peut-être une nouvelle route API qui renvoie toutes les subcategories
                    // ou modifier la route existante pour ne pas exiger de category_id
                    materialService.fetchSubcategories(0), // "0" ou une valeur pour "toutes"
                    materialService.fetchDepartments(),
                    materialService.fetchLocations(),
                    materialService.fetchEmployees()
                ]);
                setSubcategories(allSubcats);
                setDepartments(deptData)
                setLocations(locs);
                setEmployees(emps);
            } catch (error) {
                console.error("Erreur chargement des données:", error);
            }
        };
        loadDropdownData();
    }, []);

    const handleLigneChange = (index, field, value) => {
        const nouvellesLignes = [...lignes];
        nouvellesLignes[index][field] = value;
        setLignes(nouvellesLignes);
    };

    const ajouterLigne = () => {
        setLignes([...lignes, { demande_subcategory_id: '', quantite: 1, destinataire_location_id: '', destinataire_employee_id: '' }]);
    };

    const supprimerLigne = (index) => {
        const nouvellesLignes = lignes.filter((_, i) => i !== index);
        setLignes(nouvellesLignes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!motif || lignes.length === 0) {
            alert("Veuillez renseigner le motif et au moins une ligne de demande.");
            return;
        }

        const dataToSend = {
            motif_demande: motif,
            lignes: lignes.map(l => ({
                ...l,
                quantite: parseInt(l.quantite, 10),
            }))
        };
        
        try {
            await materialService.createDemande(dataToSend);
            alert("Demande soumise avec succès !");
            navigate("/director/dashboard");
        } catch (error) {
            console.error("Erreur lors de la soumission :", error);
            alert(`Erreur: ${error.message}`);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Nouvelle Demande de Matériel (Multi-lignes)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="motif">Motif de la demande</Label>
                            <Textarea
                                value={motif}
                                onChange={e => setMotif(e.target.value)}
                                required
                            />
                        </div>

                        {/* --- BOUCLE SUR LES LIGNES --- */}
                        {lignes.map((ligne, index) => (
                            <div key={index} className="p-4 border rounded-md space-y-4 relative">
                                <Label className="font-bold">Ligne de Matériel #{index + 1}</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <Label>Matériel</Label>
                                        <Select value={ligne.demande_subcategory_id} onValueChange={val => handleLigneChange(index, 'demande_subcategory_id', val)} required>
                                            <SelectTrigger><SelectValue placeholder="Choisir un matériel..." /></SelectTrigger>
                                            <SelectContent>{subcategories.map(sc => <SelectItem key={sc.id} value={sc.id}>{sc.category_name} / {sc.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Quantité</Label>
                                        <Input type="number" min="1" value={ligne.quantite} onChange={e => handleLigneChange(index, 'quantite', e.target.value)} required />
                                    </div>
                                    <div>
                                        <Label>Employé Destinataire</Label>
                                        <Select value={ligne.destinataire_employee_id} onValueChange={val => handleLigneChange(index, 'destinataire_employee_id', val)}>
                                            <SelectTrigger><SelectValue placeholder="Optionnel..." /></SelectTrigger>
                                            <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Bureau/Localisation</Label>
                                        <Select value={ligne.destinataire_location_id} onValueChange={val => handleLigneChange(index, 'destinataire_location_id', val)}>
                                            <SelectTrigger><SelectValue placeholder="Optionnel..." /></SelectTrigger>
                                            <SelectContent>{locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Departement/Direction</Label>
                                        <Select value={ligne.destinataire_department_id} onValueChange={val => handleLigneChange(index, 'destinataire_department_id', val)}>
                                            <SelectTrigger><SelectValue placeholder="Optionnel..." /></SelectTrigger>
                                            <SelectContent>{departments.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={() => supprimerLigne(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        
                        <Button type="button" variant="outline" onClick={ajouterLigne}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une ligne
                        </Button>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Soumettre la Demande Complète</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}