"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PropertyForm from '@/components/admin/PropertyForm';
import type { PropertyData } from '@/components/admin/PropertyForm';
import Link from 'next/link';

export default function NewPropertyPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: PropertyData) => {
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }
            const res = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Errore nella creazione dell\'immobile.');
            }
            router.push('/admin/immobili');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/immobili" className="text-blue-600 hover:underline">
                    &larr; Torna alla lista
                </Link>
                <h1 className="text-3xl font-bold">Aggiungi Nuovo Immobile</h1>
            </div>
            <PropertyForm onSubmit={handleSubmit} isSaving={isSaving} error={error} />
        </div>
    );
}
