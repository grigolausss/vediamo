"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import EmployeeForm from '@/components/admin/EmployeeForm';
import type { EmployeeData } from '@/components/admin/EmployeeForm';
import Link from 'next/link';

export default function NewUserPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (data: EmployeeData) => {
        setIsSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Errore nella creazione dell\'utente.');
            }
            router.push('/admin/utenti');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/utenti" className="text-blue-600 hover:underline">
                    &larr; Torna alla lista
                </Link>
                <h1 className="text-3xl font-bold">Aggiungi Nuovo Utente</h1>
            </div>
            <EmployeeForm onSubmit={handleSubmit} isSaving={isSaving} error={error} isEditing={false} />
        </div>
    );
}
