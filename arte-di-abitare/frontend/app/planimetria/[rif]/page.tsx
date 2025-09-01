"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Define an interface for the property data we need
interface Property {
  title: string;
  rif: string;
  floorPlan: string;
}

export default function FloorPlanPage() {
  const params = useParams();
  const router = useRouter();
  const rif = params.rif as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!rif) return;

    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('Autenticazione richiesta.');
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

  const handleNextStep = () => {
    // Navigate to the second questionnaire
    router.push(`/questionario2/${rif}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-xl">Caricamento planimetria...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-red-600 text-xl">Errore: {error}</p></div>;
  }

  if (!property || !property.floorPlan) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-xl">Planimetria non disponibile per questo immobile.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Planimetria - {property.title}</h1>
        <p className="text-md text-gray-500 mb-6">RIF: {property.rif}</p>

        <p className="text-sm text-gray-600 mb-4">Clicca sull'immagine per ingrandire/rimpicciolire.</p>

        {/* Container for the image with overflow hidden to contain the zoom */}
        <div
          className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden cursor-pointer border"
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={property.floorPlan}
            alt={`Planimetria per ${property.title}`}
            className={`w-full h-full object-contain transition-transform duration-300 ease-in-out ${isZoomed ? 'scale-150' : 'scale-100'}`}
          />
        </div>

        <button
          onClick={handleNextStep}
          className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors text-lg"
        >
          Prosegui
        </button>
      </div>
    </div>
  );
}
