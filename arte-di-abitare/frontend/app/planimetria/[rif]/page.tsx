"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function FloorPlanPage() {
  const params = useParams();
  const router = useRouter();
  const rif = params.rif as string;

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (!rif) return;

    let objectUrl: string;

    const fetchWatermarkedImage = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Autenticazione richiesta. Per favore, torna alla homepage e riverifica la tua email.');

        const response = await fetch(`/api/properties/${rif}/planimetria`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          // Try to parse error message if response is JSON, otherwise use status text
          let errorMessage = `Errore nel caricamento della planimetria: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // Response was not JSON, stick with the status text
          }
          throw new Error(errorMessage);
        }

        const imageBlob = await response.blob();
        objectUrl = URL.createObjectURL(imageBlob);
        setImageUrl(objectUrl);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWatermarkedImage();

    // Cleanup function to revoke the object URL to prevent memory leaks
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [rif]);

  const handleNextStep = () => {
    router.push(`/questionario2/${rif}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-xl">Caricamento planimetria...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen bg-gray-100"><p className="text-red-600 text-xl text-center p-4">{error}</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Planimetria</h1>
        <p className="text-md text-gray-500 mb-6">RIF: {rif ? rif.toUpperCase() : ''}</p>

        <p className="text-sm text-gray-600 mb-4">Clicca sull'immagine per ingrandire/rimpicciolire.</p>

        <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden cursor-pointer border" onClick={() => setIsZoomed(!isZoomed)}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Planimetria per RIF ${rif}`}
              className={`w-full h-full object-contain transition-transform duration-300 ease-in-out ${isZoomed ? 'scale-150' : 'scale-100'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><p>Nessuna immagine da visualizzare.</p></div>
          )}
        </div>

        <button onClick={handleNextStep} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors text-lg">
          Prosegui
        </button>
      </div>
    </div>
  );
}
