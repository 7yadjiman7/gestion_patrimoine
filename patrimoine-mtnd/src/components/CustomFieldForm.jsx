import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/table';
import { Plus, Trash2 } from 'lucide-react';

const fieldTypes = [
  { value: 'char', label: 'Texte' },
  { value: 'integer', label: 'Nombre entier' },
  { value: 'float', label: 'Nombre décimal' },
  { value: 'boolean', label: 'Oui/Non' },
  { value: 'date', label: 'Date' }
];

export default function CustomFieldForm({ fields = [], onChange }) {
  const [newField, setNewField] = useState({
    name: '',
    field_type: 'char',
    required: false
  });

  const handleAddField = () => {
    if (!newField.name) return;
    
    const updatedFields = [...fields, newField];
    onChange(updatedFields);
    setNewField({
      name: '',
      field_type: 'char',
      required: false
    });
  };

  const handleRemoveField = (index) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    onChange(updatedFields);
  };

  const handleNewFieldChange = (name, value) => {
    setNewField(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-4">
        <div className="flex-1 space-y-2">
          <Label>Nom du champ</Label>
          <Input
            value={newField.name}
            onChange={(e) => handleNewFieldChange('name', e.target.value)}
            placeholder="Nom du champ"
          />
        </div>

        <div className="flex-1 space-y-2">
          <Label>Type</Label>
          <Select
            value={newField.field_type}
            onValueChange={(value) => handleNewFieldChange('field_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {fieldTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          onClick={handleAddField}
          disabled={!newField.name}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {fields.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Requis</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={index}>
                  <TableCell>{field.name}</TableCell>
                  <TableCell>
                    {fieldTypes.find(t => t.value === field.field_type)?.label || field.field_type}
                  </TableCell>
                  <TableCell>{field.required ? 'Oui' : 'Non'}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
