"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Interfaces
interface LeadDetails {
  _id: string;
  user: { name: string; surname: string; email: string; phone: string; };
  property: { title: string; rif: string; };
  status: string;
  qualificationAnswers: { maxBudget: string; purchaseTimeline: string; mortgagePreApproval: string; isFirstHome: string; availabilityForVisit: string; };
  postViewingAnswers?: { searchZone: string; minBedrooms: number; mustHaveFeatures: string; urgency: string; finalFeedback: string; };
  notes: { text: string; employee: { email: string }; date: string; _id: string; }[];
  createdAt: string;
}

export default function LeadDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [lead, setLead] = useState<LeadDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [newStatus, setNewStatus] = useState('');
    const [noteText, setNoteText] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!id) return;
        const fetchLead = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('employeeAuthToken');
                if (!token) { router.push('/admin/login'); return; }
                const res = await fetch(`/api/leads/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (!res.ok) throw new Error('Lead non trovato.');
                const data = await res.json();
                setLead(data);
                setNewStatus(data.status);
            } catch (err: any) { setError(err.message); }
            finally { setLoading(false); }
        };
        fetchLead();
    }, [id, router]);

    const handleStatusUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const token = localStorage.getItem('employeeAuthToken');
            if (!token) { router.push('/admin/login'); return; }
            const res = await fetch(`/api/leads/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus, noteText }),
            });
            if (!res.ok) throw new Error('Errore durante l\'aggiornamento.');
            const updatedLead = await res.json();
            setLead(updatedLead);
            setNoteText('');
        } catch (err: any) { setError(err.message); }
        finally { setIsUpdating(false); }
    };

    if (loading) return <p className="text-center">Caricamento lead...</p>;
    if (error) return <p className="text-center text-red-600">Errore: {error}</p>;
    if (!lead) return <p className="text-center">Lead non trovato.</p>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold mb-4">{lead.user.name} {lead.user.surname}</h1>
                <p><strong>Email:</strong> {lead.user.email}</p>
                <p><strong>Telefono:</strong> {lead.user.phone || 'Non fornito'}</p>
                <p><strong>Immobile di interesse:</strong> {lead.property.title} (<Link href={`/admin/immobili/${lead.property._id}`} className="text-blue-600 hover:underline">{lead.property.rif}</Link>)</p>
                <p><strong>Stato attuale:</strong> <span className="font-semibold px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-sm">{lead.status}</span></p>

                <div className="mt-6 border-t pt-4">
                    <h2 className="text-2xl font-bold mb-2">Questionario 1: Qualificazione</h2>
                    <ul>
                        <li><strong>Budget Massimo:</strong> {lead.qualificationAnswers.maxBudget}</li>
                        <li><strong>Tempistica Acquisto:</strong> {lead.qualificationAnswers.purchaseTimeline}</li>
                        <li><strong>Pre-approvazione Mutuo:</strong> {lead.qualificationAnswers.mortgagePreApproval}</li>
                        <li><strong>Prima Casa:</strong> {lead.qualificationAnswers.isFirstHome}</li>
                        <li><strong>Disponibilità Visite:</strong> {lead.qualificationAnswers.availabilityForVisit}</li>
                    </ul>
                </div>
                {lead.postViewingAnswers && (
                    <div className="mt-6 border-t pt-4">
                        <h2 className="text-2xl font-bold mb-2">Questionario 2: Feedback Post-Visita</h2>
                        <ul>
                            <li><strong>Zona di Ricerca:</strong> {lead.postViewingAnswers.searchZone}</li>
                            <li><strong>Camere Minime:</strong> {lead.postViewingAnswers.minBedrooms}</li>
                            <li><strong>Caratteristiche Essenziali:</strong> {lead.postViewingAnswers.mustHaveFeatures}</li>
                            <li><strong>Urgenza:</strong> {lead.postViewingAnswers.urgency}</li>
                            <li><strong>Feedback Finale:</strong> {lead.postViewingAnswers.finalFeedback}</li>
                        </ul>
                    </div>
                )}
            </div>

            <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Aggiorna Stato Lead</h2>
                <form onSubmit={handleStatusUpdate}>
                    <label htmlFor="status" className="block font-semibold mb-1">Nuovo Stato</label>
                    <select id="status" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full p-2 border rounded-md mb-4">
                        <option value="Nuovo">Nuovo</option>
                        <option value="Contattato">Contattato</option>
                        <option value="Da richiamare">Da richiamare</option>
                        <option value="Non interessato">Non interessato</option>
                    </select>
                    <label htmlFor="noteText" className="block font-semibold mb-1">Aggiungi Nota</label>
                    <textarea id="noteText" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Es. Chiamato, fissato appuntamento per..." className="w-full p-2 border rounded-md mb-4" rows={4}></textarea>
                    <button type="submit" disabled={isUpdating} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400">{isUpdating ? 'Salvataggio...' : 'Salva Modifiche'}</button>
                </form>

                <div className="mt-6 border-t pt-4">
                    <h2 className="text-2xl font-bold mb-2">Cronologia Note</h2>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {lead.notes.slice().reverse().map((note) => (
                            <div key={note._id} className="bg-gray-100 p-3 rounded-md text-sm">
                                <p>{note.text}</p>
                                <p className="text-xs text-gray-500 mt-1">Da: {note.employee?.email || 'N/A'} - {new Date(note.date).toLocaleString('it-IT')}</p>
                            </div>
                        ))}
                        {lead.notes.length === 0 && <p className="text-gray-500">Nessuna nota presente.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
