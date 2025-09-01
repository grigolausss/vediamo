"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PropertyForm from '@/components/admin/PropertyForm';
import type { PropertyData } from '@/components/admin/PropertyForm';
import Link from 'next/link';

export default function EditPropertyPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [property, setProperty] = useState<Partial<PropertyData> | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        const fetchProperty = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem('employeeAuthToken');
                if (!token) { router.push('/admin/login'); return; }
                const res = await fetch(`/api/properties/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Immobile non trovato.');
                const data = await res.json();
                setProperty(data);
            } catch (err: any) { setError(err.message); }
            finally { setIsLoading(false); }
        };
        fetchProperty();
    }, [id, router]);

    const handleSubmit = async (data: PropertyData) => {
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }
            const res = await fetch(`/api/properties/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Errore nell\'aggiornamento dell\'immobile.');
            }
            router.push('/admin/immobili');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <p className="text-center">Caricamento immobile...</p>;
    if (error && !property) return <p className="text-center text-red-600">Errore: {error}</p>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                 <Link href="/admin/immobili" className="text-blue-600 hover:underline">
                    &larr; Torna alla lista
                </Link>
                <h1 className="text-3xl font-bold">Modifica Immobile <span className="text-gray-500 font-mono">{property?.rif}</span></h1>
            </div>
            <PropertyForm initialData={property || {}} onSubmit={handleSubmit} isSaving={isSaving} error={error} />
        </div>
    );
}
