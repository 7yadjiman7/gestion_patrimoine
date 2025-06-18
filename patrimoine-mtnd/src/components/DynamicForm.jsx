import React from 'react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export default function DynamicForm({ fields, values, onChange }) {
  const handleFieldChange = (fieldName, value) => {
    onChange(fieldName, value);
  };

  const renderField = (field) => {
    const value = values[field.name] || '';
    
    switch (field.field_type) {
      case 'char':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );
      
      case 'integer':
      case 'float':
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.name, 
                field.field_type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)
              )}
              required={field.required}
              step={field.field_type === 'float' ? '0.01' : '1'}
            />
          </div>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={field.name}
              checked={value}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
              required={field.required}
            />
            <Label htmlFor={field.name}>{field.name}</Label>
          </div>
        );
      
      case 'date':
        return (
          <div className="space-y-2">
            <Label>{field.name}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), "PPP") : <span>Choisir une date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => handleFieldChange(field.name, date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={field.name}>{field.name}</Label>
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          {renderField(field)}
        </div>
      ))}
    </div>
  );
}
