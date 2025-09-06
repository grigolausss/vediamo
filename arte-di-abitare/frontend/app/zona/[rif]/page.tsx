"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ZoneData {
  zoneImage: string;
  title: string;
}

export default function ZonePage() {
    const params = useParams();
    const router = useRouter();
    const rif = params.rif as string;

    const [zoneData, setZoneData] = useState<ZoneData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    useEffect(() => {
        if (!rif) return;
        const fetchZoneImage = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('authToken');
                if (!token) { router.push('/'); return; }

                // This will be a new, simple endpoint
                const response = await fetch(`/api/properties/${rif}/zone`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Dati della zona non trovati.');
                }
                const data = await response.json();
                setZoneData(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchZoneImage();
    }, [rif, router]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">Caricamento zona...</p></div>;
    if (error) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-600 text-xl">{error}</p></div>;
    if (!zoneData) return <div className="flex justify-center items-center min-h-screen"><p className="text-xl">Dati non trovati.</p></div>;

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6 sm:p-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800">Zona</h1>
                <p className="text-lg text-gray-600 mt-2 mb-6">Ecco la zona dell'immobile selezionato: {zoneData.title}</p>

                <div className="mb-8 border rounded-lg p-4 bg-gray-50">
                    <img
                        src={`${API_BASE_URL}/uploads/${zoneData.zoneImage}`}
                        alt={`Zona per ${zoneData.title}`}
                        className="rounded-lg shadow-md max-w-full h-auto border"
                    />
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h2 className="text-xl font-bold text-blue-800 mb-4">Ora che conosci la zona esatta, cosa ne pensi?</h2>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                        <Link href={`/ringraziamento/${rif}?source=zona-ok`} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors">
                            La zona va bene
                        </Link>
                        <Link href={`/alternative/${rif}?source=zona-no`} className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors">
                            La zona non va bene
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
