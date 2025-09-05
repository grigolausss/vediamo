"use client";

import { useState, useEffect } from 'react';

// Define the new structure for the property data, including the new fields
export interface PropertyData {
  _id?: string;
  rif: string;
  title: string;
  zone: string;
  price: number;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  dossierImage: File | string;
  planimetryImage: File | string;
  zoneImage: File | string;
  isActive: boolean;
}

interface PropertyFormProps {
  initialData?: Partial<PropertyData>;
  onSubmit: (data: FormData) => void;
  isSaving: boolean;
  error?: string | null;
}

export default function PropertyForm({ initialData = {}, onSubmit, isSaving, error }: PropertyFormProps) {
  const [property, setProperty] = useState<Partial<PropertyData>>({
    rif: '',
    title: '',
    zone: '',
    price: 0,
    surface: 0,
    bedrooms: 0,
    bathrooms: 0,
    dossierImage: '',
    planimetryImage: '',
    zoneImage: '',
    isActive: true,
    ...initialData,
  });

  const [previews, setPreviews] = useState({
      dossierImage: typeof initialData.dossierImage === 'string' ? initialData.dossierImage : undefined,
      planimetryImage: typeof initialData.planimetryImage === 'string' ? initialData.planimetryImage : undefined,
      zoneImage: typeof initialData.zoneImage === 'string' ? initialData.zoneImage : undefined,
  });

  useEffect(() => {
    setProperty(prev => ({ ...prev, ...initialData }));
    setPreviews({
        dossierImage: typeof initialData.dossierImage === 'string' ? initialData.dossierImage : undefined,
        planimetryImage: typeof initialData.planimetryImage === 'string' ? initialData.planimetryImage : undefined,
        zoneImage: typeof initialData.zoneImage === 'string' ? initialData.zoneImage : undefined,
    });
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setProperty(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      const file = files[0];
      setProperty(prev => ({ ...prev, [name]: file }));
      setPreviews(prev => ({...prev, [name]: URL.createObjectURL(file)}));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();

    Object.keys(property).forEach(key => {
      const value = property[key as keyof typeof property];
      if (value !== undefined && value !== null) {
          formData.append(key, value as string | Blob);
      }
    });

    onSubmit(formData);
  };

  const renderPreview = (src: string | undefined) => {
      if (!src) return null;
      return <img src={src} alt="Preview" className="mt-2 h-32 w-auto object-contain rounded-md border" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-lg shadow-lg">
      {/* Section 1: Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b pb-8">
        <div><label className="block font-medium">RIF (univoco)</label><input name="rif" value={property.rif} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
        <div><label className="block font-medium">Titolo</label><input name="title" value={property.title} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
      </div>

      {/* Section 2: Property Details */}
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 border-b pb-8">
          <div><label className="block font-medium">Zona</label><input name="zone" value={property.zone} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">Prezzo (€)</label><input name="price" type="number" value={property.price} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">Superficie (mq)</label><input name="surface" type="number" value={property.surface} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">N. Camere</label><input name="bedrooms" type="number" value={property.bedrooms} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
          <div><label className="block font-medium">N. Bagni</label><input name="bathrooms" type="number" value={property.bathrooms} onChange={handleChange} required className="w-full p-2 border rounded-md mt-1" /></div>
      </div>

      {/* Section 3: File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b pb-8">
          <div><label className="block font-medium">1. Foto Dossier (A4)</label><input name="dossierImage" type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mt-1"/>{renderPreview(previews.dossierImage)}</div>
          <div><label className="block font-medium">2. Foto Planimetria</label><input name="planimetryImage" type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mt-1"/>{renderPreview(previews.planimetryImage)}</div>
          <div><label className="block font-medium">3. Foto Zona</label><input name="zoneImage" type="file" onChange={handleFileChange} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 mt-1"/>{renderPreview(previews.zoneImage)}</div>
      </div>

      <div className="flex items-center gap-2 pt-4"><input name="isActive" type="checkbox" checked={property.isActive} onChange={handleChange} className="h-5 w-5" /><label>Immobile Attivo</label></div>

      {error && <p className="text-red-600 text-center font-semibold">{error}</p>}

      <button type="submit" disabled={isSaving} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg disabled:bg-gray-400 transition-colors">
        {isSaving ? 'Salvataggio in corso...' : 'Salva Immobile'}
      </button>
    </form>
  );
}
