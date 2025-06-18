import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import materialService from '@/services/materialService';

export default function AdminMouvement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const demandeIdFromUrl = searchParams.get('demandeId');

  const [materials, setMaterials] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    asset_id: '',
    type_mouvement: '',
    date: new Date().toISOString().split('T')[0],
    from_location_id: '',
    from_employee_id: '',
    to_department_id: '',
    to_employee_id: '',
    to_location_id: '',
    motif: ''
  });

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        setLoading(true);
        const [mats, depts, emps, locs] = await Promise.all([
          materialService.fetchMaterials(),
          materialService.fetchDepartments(),
          materialService.fetchEmployees(),
          materialService.fetchLocations()
        ]);
        setMaterials(mats);
        setDepartments(depts);
        setEmployees(emps);
        setLocations(locs);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
        alert("Erreur lors du chargement des options du formulaire.");
      } finally {
        setLoading(false);
      }
    };
    loadDropdownData();
  }, []);

  useEffect(() => {
    const prefillFromDemande = async () => {
      if (demandeIdFromUrl) {
        try {
          const demandeDetails = await materialService.fetchDemandeDetails(demandeIdFromUrl);
          
          if (demandeDetails) {
            setFormData(prev => ({
              ...prev,
              asset_id: demandeDetails.allocated_asset_id ? demandeDetails.allocated_asset_id.id : '',
              type_mouvement: demandeDetails.demande_type_general === 'affectation' ? 'affectation' : 'transfert',
              quantite: demandeDetails.quantite,
              motif: demandeDetails.motif_demande,
              to_department_id: demandeDetails.demande_department_id || '',
              to_employee_id: demandeDetails.demande_employee_id || '',
              to_location_id: demandeDetails.demande_location_id || '',
            }));
            
            if (demandeDetails.allocated_asset_id) {
                const assetDetails = await materialService.fetchMaterialDetails(demandeDetails.allocated_asset_id.id);
                setFormData(prev => ({
                    ...prev,
                    from_location_id: assetDetails.location_id.id || '',
                    from_employee_id: assetDetails.employee_id.id || '',
                }));
            }
          }
        } catch (error) {
          console.error("Erreur lors du pré-remplissage de la demande:", error);
          alert("Erreur lors du pré-remplissage de la demande.");
        }
      }
    };
    prefillFromDemande();
  }, [demandeIdFromUrl, materials, departments, employees, locations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      dataToSend.asset_id = dataToSend.asset_id ? parseInt(dataToSend.asset_id) : false;
      dataToSend.to_department_id = dataToSend.to_department_id ? parseInt(dataToSend.to_department_id) : false;
      dataToSend.to_employee_id = dataToSend.to_employee_id ? parseInt(dataToSend.to_employee_id) : false;
      dataToSend.to_location_id = dataToSend.to_location_id ? parseInt(dataToSend.to_location_id) : false;
      dataToSend.from_location_id = dataToSend.from_location_id ? parseInt(dataToSend.from_location_id) : false;
      dataToSend.from_employee_id = dataToSend.from_employee_id ? parseInt(dataToSend.from_employee_id) : false;
      dataToSend.quantite = parseInt(dataToSend.quantite);
      dataToSend.motif = dataToSend.motif;

      const response = await materialService.saveMouvement(dataToSend);
      console.log('Réponse serveur (saveMouvement):', response);
      
      if (response && response.status === 'success') {
        alert('Mouvement enregistré avec succès !');
        navigate("/admin/mouvements"); 
        
        if (demandeIdFromUrl) {
            await materialService.processDemande(demandeIdFromUrl, 'allocated');
            alert("La demande a été mise à jour comme 'allouée' !");
        }

      } else if (response && response.message) {
          throw new Error(response.message);
      } else {
          throw new Error('Réponse inattendue du serveur.');
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert(`Erreur: ${error.message || "Échec de l'enregistrement"}`);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderConditionalFields = () => {
    const { type_mouvement } = formData;
    switch (type_mouvement) {
      case 'affectation':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-700">Département Destination</Label>
              <Select name="to_department_id" value={formData.to_department_id} onValueChange={val => handleChange('to_department_id', val)} required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un département" /></SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Employé Destination</Label>
              <Select name="to_employee_id" value={formData.to_employee_id} onValueChange={val => handleChange('to_employee_id', val)} required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Localisation Destination</Label>
              <Select name="to_location_id" value={formData.to_location_id} onValueChange={val => handleChange('to_location_id', val)} required>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner une localisation" /></SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (<SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'transfert':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-700">Localisation Source (Bien actuel)</Label>
              <Select name="from_location_id" value={formData.from_location_id} onValueChange={val => handleChange('from_location_id', val)} disabled={!formData.asset_id}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Localisation actuelle du bien" /></SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (<SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Employé Source (Bien actuel)</Label>
              <Select name="from_employee_id" value={formData.from_employee_id} onValueChange={val => handleChange('from_employee_id', val)} disabled={!formData.asset_id}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Employé actuel du bien" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Département Destination</Label>
              <Select name="to_department_id" value={formData.to_department_id} onValueChange={val => handleChange('to_department_id', val)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un département" /></SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (<SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Employé Destination</Label>
              <Select name="to_employee_id" value={formData.to_employee_id} onValueChange={val => handleChange('to_employee_id', val)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner un employé" /></SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Localisation Destination</Label>
              <Select name="to_location_id" value={formData.to_location_id} onValueChange={val => handleChange('to_location_id', val)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Sélectionner une localisation" /></SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (<SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'sortie':
      case 'reparation':
      case 'amortissement':
        return null;
      default:
        return null;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">
            {demandeIdFromUrl ? "Traiter une demande" : "Enregistrer un nouveau mouvement"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Bien concerné</Label>
                <Select
                  value={formData.asset_id}
                  onValueChange={val => handleChange("asset_id", val)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un bien" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map(material => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Type de mouvement</Label>
                <Select
                  value={formData.type_mouvement}
                  onValueChange={val => handleChange("type_mouvement", val)}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="affectation">Affectation</SelectItem>
                    <SelectItem value="transfert">Transfert</SelectItem>
                    <SelectItem value="reparation">Réparation / Maintenance</SelectItem>
                    <SelectItem value="amortissement">Amortissement</SelectItem>
                    <SelectItem value="sortie">Sortie définitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Date du mouvement</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={e => handleChange('date', e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              {formData.quantite && (
                <div className="space-y-2">
                  <Label className="text-gray-700">Quantité</Label>
                  <Input
                    type="number"
                    value={formData.quantite}
                    onChange={e => handleChange('quantite', e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderConditionalFields()}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Motif</Label>
              <Textarea
                value={formData.motif}
                onChange={e => handleChange('motif', e.target.value)}
                required
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/mouvements")}
                className="px-6 py-2"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
              >
                {demandeIdFromUrl ? "Traiter la demande" : "Enregistrer le mouvement"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}