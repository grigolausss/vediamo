"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Define an interface for the property data
interface Property {
  title: string;
  rif: string;
  typology: string;
  zone: string;
  surface: number;
  price: number;
  status: string;
  images: string[];
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const rif = params.rif as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rif) return;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real application, the token would be stored securely after login.
        const token = localStorage.getItem('authToken');
        if (!token) {
            // In a real app, you might redirect to login or show an error message.
            throw new Error('Autenticazione richiesta. Per favore, effettua di nuovo la verifica via email.');
        }

        const response = await fetch('/api/properties/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ rif }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Dettagli immobile non trovati.');
        }

        const data = await response.json();
        setProperty(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [rif]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">Caricamento in corso...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600 text-xl">Errore: {error}</p></div>;
  }

  if (!property) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">Immobile non trovato.</p></div>;
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-900 mb-2">{property.title}</h1>
        <p className="text-md sm:text-lg text-gray-500 mb-6">RIF: {property.rif}</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg text-center shadow-sm">
            <p className="text-sm text-blue-800 font-semibold">Tipologia</p>
            <p className="text-lg sm:text-xl">{property.typology}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg text-center shadow-sm">
            <p className="text-sm text-blue-800 font-semibold">Zona</p>
            <p className="text-lg sm:text-xl">{property.zone}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg text-center shadow-sm">
            <p className="text-sm text-blue-800 font-semibold">Superficie</p>
            <p className="text-lg sm:text-xl">{property.surface} mq</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg text-center shadow-sm">
            <p className="text-sm text-blue-800 font-semibold">Prezzo</p>
            <p className="text-lg sm:text-xl">€ {property.price.toLocaleString('it-IT')}</p>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg text-center shadow-sm">
            <p className="text-sm text-blue-800 font-semibold">Stato</p>
            <p className="text-lg sm:text-xl">{property.status}</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Galleria</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {property.images.length > 0 ? (
              property.images.map((image, index) => (
                <img key={index} src={image} alt={`Immagine ${index + 1}`} className="rounded-lg shadow-md w-full h-auto object-cover aspect-square" />
              ))
            ) : (
              <p className="text-gray-500 col-span-full">Nessuna immagine disponibile.</p>
            )}
          </div>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg text-center border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Per vedere le planimetrie e ottenere maggiori dettagli completa il nostro breve questionario.
          </h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg mt-4">
            Inizia questionario
          </button>
        </div>
      </div>
    </div>
  );
}
