"use client";

import { useState, useEffect } from 'react';

// Define the structure of the property data
export interface PropertyData {
  rif: string;
  title: string;
  typology: string;
  zone: string;
  status: string;
  address: string;
  surface: number;
  price: number;
  floorPlan: string;
  images: string[];
  isActive: boolean;
  yearOfConstruction?: number;
  description?: string;
}

interface PropertyFormProps {
  initialData?: Partial<PropertyData>;
  onSubmit: (data: PropertyData) => void;
  isSaving: boolean;
  error?: string | null;
}

export default function PropertyForm({ initialData = {}, onSubmit, isSaving, error }: PropertyFormProps) {
  const [property, setProperty] = useState<Partial<PropertyData>>({
    rif: '',
    title: '',
    typology: '',
    zone: '',
    status: 'Disponibile',
    address: '',
    surface: 0,
    price: 0,
    floorPlan: '',
    images: [],
    isActive: true,
    ...initialData,
  });

  useEffect(() => {
    setProperty(prev => ({ ...prev, ...initialData }));
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setProperty(prev => ({ ...prev, [name]: checked }));
    } else {
        setProperty(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Simple comma-separated string to array for image URLs
    setProperty(prev => ({ ...prev, images: value.split(',').map(url => url.trim()) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(property as PropertyData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Required Fields */}
        <div><label>RIF (univoco)</label><input name="rif" value={property.rif} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>
        <div><label>Titolo</label><input name="title" value={property.title} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>
        <div><label>Tipologia</label><input name="typology" value={property.typology} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>
        <div><label>Zona</label><input name="zone" value={property.zone} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>
        <div><label>Indirizzo Completo</label><input name="address" value={property.address} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>
        <div><label>Metratura (mq)</label><input name="surface" type="number" value={property.surface} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>
        <div><label>Prezzo</label><input name="price" type="number" value={property.price} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>
        <div><label>Stato</label><select name="status" value={property.status} onChange={handleChange} className="w-full p-2 border rounded-md"><option>Disponibile</option><option>In trattativa</option><option>Venduto</option></select></div>
        <div><label>URL Planimetria</label><input name="floorPlan" value={property.floorPlan} onChange={handleChange} required className="w-full p-2 border rounded-md" /></div>

        {/* Optional Fields */}
        <div className="md:col-span-2"><label>Descrizione</label><textarea name="description" value={property.description} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>
        <div className="md:col-span-2"><label>URL Immagini (separate da virgola)</label><input name="images" value={property.images?.join(', ')} onChange={handleImageChange} className="w-full p-2 border rounded-md" /></div>
        <div><label>Anno di Costruzione</label><input name="yearOfConstruction" type="number" value={property.yearOfConstruction} onChange={handleChange} className="w-full p-2 border rounded-md" /></div>

        <div className="flex items-center gap-2"><input name="isActive" type="checkbox" checked={property.isActive} onChange={handleChange} className="h-5 w-5" /><label>Immobile Attivo</label></div>
      </div>

      {error && <p className="text-red-600 text-center">{error}</p>}

      <button type="submit" disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-400">
        {isSaving ? 'Salvataggio...' : 'Salva Immobile'}
      </button>
    </form>
  );
}
