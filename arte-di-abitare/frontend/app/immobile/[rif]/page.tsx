"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Updated interface to include the skip-logic flag
interface Property {
  _id: string;
  title: string;
  rif: string;
  dossierImage: string;
  questionnairesCompleted: boolean;
}

export default function PropertyDossierPage() {
  const params = useParams();
  const router = useRouter();
  const rif = params.rif as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!rif) return;
    const fetchProperty = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) { router.push('/'); return; }

        const response = await fetch('/api/properties/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ rif }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Dettagli immobile non trovati.');
        }

        const data: Property = await response.json();
        setProperty(data);
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchProperty();
  }, [rif, router]);

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">Caricamento dossier...</p></div>;
  if (error) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600 text-xl text-center p-4">{error}</p></div>;
  if (!property) return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">Immobile non trovato.</p></div>;

  const nextStepLink = property.questionnairesCompleted ? `/planimetria/${rif}` : `/questionario/${rif}`;
  const buttonText = property.questionnairesCompleted ? 'Visualizza la planimetria' : 'Inizia il questionario';
  const subText = property.questionnairesCompleted
    ? 'Hai già risposto alle nostre domande. Puoi procedere direttamente alla visualizzazione della planimetria.'
    : 'Per vedere le planimetrie e ottenere maggiori dettagli completa il nostro breve questionario.';

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{property.title}</h1>
        <p className="text-md sm:text-lg text-gray-500 mb-6">RIF: {property.rif}</p>

        <div className="mb-8 border rounded-lg p-4 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">Dossier Immobile</h2>
            <div className="flex justify-center">
                <img
                    src={`${API_BASE_URL}/uploads/${property.dossierImage}`}
                    alt={`Dossier per ${property.title}`}
                    className="rounded-lg shadow-md max-w-full h-auto border"
                    style={{ maxHeight: '80vh' }}
                />
            </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg text-center border border-blue-200">
          <h2 className="text-xl font-bold text-blue-800 mb-2">{subText}</h2>
          <Link href={nextStepLink} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg mt-4">
            {buttonText}
          </Link>
        </div>
      </div>
    </div>
  );
}
