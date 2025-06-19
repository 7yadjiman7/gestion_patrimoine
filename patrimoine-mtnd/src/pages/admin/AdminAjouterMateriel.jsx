import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import materialService from "@/services/materialService";

export default function AdminAjouterMateriel() {
    const [searchParams] = useSearchParams();
    const typeGeneralFromUrl = searchParams.get("type") || "";
    const navigate = useNavigate();

    // Déclarer selectedGeneralType avant son utilisation dans le JSX
    const [selectedGeneralType, setSelectedGeneralType] = useState(typeGeneralFromUrl);

    const [locations, setLocations] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [generalAssetTypes, setGeneralAssetTypes] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
    const [customFields, setCustomFields] = useState([]);
    const [customFieldValues, setCustomFieldValues] = useState({});

    const [assetData, setAssetData] = useState({
        name: "",
        subcategory_id: "",
        date_acquisition: new Date().toISOString().split("T")[0],
        valeur_acquisition: "",
        etat: "stock",
        department_id: "",
        employee_id: "",
        location_id: "",
        fournisseur: "",
    });

    const [files, setFiles] = useState({
        image: null,
        facture: null,
        bon_livraison: null
    });

    useEffect(() => {
        const loadGeneralData = async () => {
            try {
                const typesGenerauxData = await materialService.fetchTypesGeneraux();
                setGeneralAssetTypes(typesGenerauxData);

                const [locData, empData, deptData, fourData] = await Promise.all([
                    materialService.fetchLocations(),
                    materialService.fetchEmployees(),
                    materialService.fetchDepartments(),
                    materialService.fetchFournisseurs()
                ]);
                setLocations(locData);
                setEmployees(empData);
                setDepartments(deptData);
                setFournisseurs(fourData);
            } catch (error) {
                console.error("Erreur chargement des données générales:", error);
            }
        };
        loadGeneralData();
    }, []);

    useEffect(() => {
        if (selectedGeneralType) {
            const loadSubcategories = async () => {
                try {
                    const generalCategory = generalAssetTypes.find(cat => cat.code === selectedGeneralType);
                    if (generalCategory) {
                        const subcategoriesData = await materialService.fetchSubcategories(generalCategory.id);
                        setSubcategories(subcategoriesData);
                    } else {
                        setSubcategories([]);
                    }
                    setSelectedSubcategoryId("");
                    setCustomFields([]);
                    setCustomFieldValues({});
                } catch (error) {
                    console.error("Erreur chargement des sous-catégories:", error);
                }
            };
            loadSubcategories();
        } else {
            setSubcategories([]);
            setSelectedSubcategoryId("");
            setCustomFields([]);
            setCustomFieldValues({});
        }
    }, [selectedGeneralType, generalAssetTypes]);

    useEffect(() => {
        if (selectedSubcategoryId) {
            const loadCustomFields = async () => {
                try {
                    const fieldsData = await materialService.fetchCustomFields(selectedSubcategoryId);
                    setCustomFields(fieldsData);
                    setCustomFieldValues({});
                } catch (error) {
                    console.error("Erreur chargement des champs personnalisés:", error);
                }
            };
            loadCustomFields();
        } else {
            setCustomFields([]);
            setCustomFieldValues({});
        }
    }, [selectedSubcategoryId]);

    useEffect(() => {
        if (typeGeneralFromUrl && generalAssetTypes.length > 0) {
            const isValidType = generalAssetTypes.some(typeItem => typeItem.code === typeGeneralFromUrl);
            if (!isValidType) {
                navigate("/admin");
            } else {
                setSelectedGeneralType(typeGeneralFromUrl);
            }
        }
    }, [typeGeneralFromUrl, navigate, generalAssetTypes]);

    const handleAssetChange = e => {
        const { name, value } = e.target;
        setAssetData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomFieldChange = (fieldName, value) => {
        setCustomFieldValues(prev => ({ ...prev, [fieldName]: value }));
    };

    const handleFileChange = (e, fileType) => {
        setFiles(prev => ({ ...prev, [fileType]: e.target.files[0] }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        try {
            const formData = new FormData();
            
            Object.entries(assetData).forEach(([key, value]) => {
                if (['department_id', 'employee_id', 'location_id', 'fournisseur'].includes(key) && value) {
                    formData.append(key, parseInt(value));
                } else if (key === 'valeur_acquisition' && value) {
                    formData.append(key, parseFloat(value));
                } else {
                    formData.append(key, value);
                }
            });

            formData.append("subcategory_id", parseInt(selectedSubcategoryId));

            Object.entries(files).forEach(([key, file]) => {
                if (file) formData.append(key, file);
            });

            if (Object.keys(customFieldValues).length > 0) {
                formData.append("custom_values", JSON.stringify(customFieldValues));
            }

            await materialService.createItem(formData); 
            alert("Matériel ajouté avec succès");
            navigate("/admin");
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du matériel:", error);
            alert(`Erreur: ${error.message || "Échec de l'enregistrement du matériel"}`);
        }
    };

    const renderDynamicCustomFields = () => {
        if (!customFields || customFields.length === 0) {
            return (
                <p className="text-gray-500">
                    Aucun champ personnalisé défini pour cette sous-catégorie.
                </p>
            );
        }
        return (
            <div className="space-y-4">
                {customFields.map(field => (
                    <div key={field.id}>
                        <Label htmlFor={field.technical_name}>
                            {field.name} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        {field.type === 'text' && (
                            <Input
                                type="text"
                                id={field.technical_name}
                                name={field.technical_name}
                                value={customFieldValues[field.technical_name] || ''}
                                onChange={(e) => handleCustomFieldChange(field.technical_name, e.target.value)}
                                required={field.required}
                            />
                        )}
                        {field.type === 'textarea' && (
                            <textarea
                                id={field.technical_name}
                                name={field.technical_name}
                                value={customFieldValues[field.technical_name] || ''}
                                onChange={(e) => handleCustomFieldChange(field.technical_name, e.target.value)}
                                required={field.required}
                                className="w-full p-2 border rounded resize-y"
                            />
                        )}
                        {field.type === 'integer' && (
                            <Input
                                type="number"
                                id={field.technical_name}
                                name={field.technical_name}
                                value={customFieldValues[field.technical_name] || ''}
                                onChange={(e) => handleCustomFieldChange(field.technical_name, parseInt(e.target.value) || 0)}
                                required={field.required}
                            />
                        )}
                        {field.type === 'float' && (
                            <Input
                                type="number"
                                step="any"
                                id={field.technical_name}
                                name={field.technical_name}
                                value={customFieldValues[field.technical_name] || ''}
                                onChange={(e) => handleCustomFieldChange(field.technical_name, parseFloat(e.target.value) || 0.0)}
                                required={field.required}
                            />
                        )}
                        {field.type === 'date' && (
                            <Input
                                type="date"
                                id={field.technical_name}
                                name={field.technical_name}
                                value={customFieldValues[field.technical_name] || ''}
                                onChange={(e) => handleCustomFieldChange(field.technical_name, e.target.value)}
                                required={field.required}
                            />
                        )}
                        {field.type === 'boolean' && (
                            <input
                                type="checkbox"
                                id={field.technical_name}
                                name={field.technical_name}
                                checked={customFieldValues[field.technical_name] || false}
                                onChange={(e) => handleCustomFieldChange(field.technical_name, e.target.checked)}
                                required={field.required}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        )}
                        {field.type === 'selection' && (
                            <Select
                                id={field.technical_name}
                                name={field.technical_name}
                                value={customFieldValues[field.technical_name] || ''}
                                onValueChange={(value) => handleCustomFieldChange(field.technical_name, value)}
                                required={field.required}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez une option" />
                                </SelectTrigger>
                                <SelectContent className="z-50">
                                    {field.selection_values && field.selection_values.map((option, index) => (
                                        <SelectItem key={index} value={option}>{option}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800">Ajouter un matériel {selectedGeneralType && `- ${selectedGeneralType}`}</h1>

            <Tabs defaultValue="general" className="bg-white rounded-lg shadow-sm relative">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-t-lg">
                    <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
                        Informations générales
                    </TabsTrigger>
                    <TabsTrigger value="specific" className="data-[state=active]:bg-white data-[state=active]:shadow-sm py-2">
                        Détails spécifiques
                    </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="px-6 pb-6">
                    <TabsContent value="general" className="mt-6 space-y-8">
                        {/* Section 1 : Type et catégorie */}
                        <Card className="border-0 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-800">Catégorisation</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Type de matériel</Label>
                                    <Select
                                        value={selectedGeneralType}
                                        onValueChange={setSelectedGeneralType}
                                        required
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sélectionnez le type" />
                                        </SelectTrigger>
                                        <SelectContent className="z-50">
                                            {generalAssetTypes.map(typeItem => (
                                                <SelectItem key={typeItem.code} value={typeItem.code}>
                                                    {typeItem.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedGeneralType && (
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Sous-catégorie</Label>
                                        <Select
                                            value={selectedSubcategoryId}
                                            onValueChange={setSelectedSubcategoryId}
                                            required
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Sélectionnez une sous-catégorie" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50">
                                                {subcategories.map(subcat => (
                                                    <SelectItem key={subcat.id} value={subcat.id}>
                                                        {subcat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Section 2 : Informations de base */}
                        <Card className="border-0 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-800">Description</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 overflow-visible">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Nom du matériel</Label>
                                    <Input
                                        name="name"
                                        value={assetData.name}
                                        onChange={handleAssetChange}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Date d'acquisition</Label>
                                        <Input
                                            type="date"
                                            name="date_acquisition"
                                            value={assetData.date_acquisition}
                                            onChange={handleAssetChange}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Valeur (€)</Label>
                                        <Input
                                            type="number"
                                            name="valeur_acquisition"
                                            value={assetData.valeur_acquisition}
                                            onChange={handleAssetChange}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">État</Label>
                                        <Select
                                            name="etat"
                                            value={assetData.etat}
                                            onValueChange={value => setAssetData(prev => ({ ...prev, etat: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="z-50">
                                                <SelectItem value="stock">En stock</SelectItem>
                                                <SelectItem value="service">En service</SelectItem>
                                                <SelectItem value="hs">Hors service</SelectItem>
                                                <SelectItem value="reforme">Réformé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 3 : Localisation et affectation */}
                        <Card className="border-0 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-800">Localisation</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Localisation actuelle</Label>
                                    <Select
                                        name="location_id"
                                        value={assetData.location_id}
                                        onValueChange={value => setAssetData(prev => ({ ...prev, location_id: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                        <SelectContent className="z-50">
                                            {locations.map(location => (
                                                <SelectItem key={location.id} value={location.id}>
                                                    {location.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Département</Label>
                                    <Select
                                        name="department_id"
                                        value={assetData.department_id}
                                        onValueChange={value => setAssetData(prev => ({ ...prev, department_id: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                        <SelectContent className="z-50">
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Employé</Label>
                                    <Select
                                        name="employee_id"
                                        value={assetData.employee_id}
                                        onValueChange={value => setAssetData(prev => ({ ...prev, employee_id: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                        <SelectContent className="z-50">
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Fournisseur</Label>
                                    <Select
                                        name="fournisseur"
                                        value={assetData.fournisseur}
                                        onValueChange={value => setAssetData(prev => ({ ...prev, fournisseur: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionnez" />
                                        </SelectTrigger>
                                        <SelectContent className="z-50">
                                            {fournisseurs.map(four => (
                                                <SelectItem key={four.id} value={four.id}>
                                                    {four.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Section 4 : Fichiers joints */}
                        <Card className="border-0 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-800">Documents</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-visible">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Image</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'image')}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Facture</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => handleFileChange(e, 'facture')}
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Bon de livraison</Label>
                                    <Input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => handleFileChange(e, 'bon_livraison')}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="specific" className="mt-6">
                        <Card className="border-0 shadow-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-semibold text-gray-800">Détails spécifiques</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-visible">
                                {selectedSubcategoryId ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {renderDynamicCustomFields()}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">
                                        Veuillez sélectionner une sous-catégorie pour afficher les champs personnalisés.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="mt-8 flex justify-end gap-4 sticky bottom-0 z-40 bg-white py-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/admin")}
                            className="px-6 py-2"
                        >
                            Annuler
                        </Button>
                        <Button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700">
                            Enregistrer
                        </Button>
                    </div>
                </form>
            </Tabs>
        </div>
    );
}