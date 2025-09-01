"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Define interfaces for the data
interface Lead {
  _id: string;
  user: {
    name: string;
    surname: string;
    email: string;
    phone: string;
  };
  property: {
    title: string;
    rif: string;
  };
  status: string;
  postViewingAnswers?: {
    urgency?: string;
  };
  createdAt: string;
}

// A reusable component for displaying lead info
const LeadCard = ({ lead }: { lead: Lead }) => (
    <div className="border p-4 rounded-md shadow-sm bg-gray-50 hover:shadow-md transition-shadow">
        <p className="font-bold text-lg">{lead.user.name} {lead.user.surname}</p>
        <p className="text-gray-700">{lead.user.email}</p>
        <p className="text-gray-700">{lead.user.phone || 'Telefono non fornito'}</p>
        <p className="text-sm text-gray-500 mt-2">Immobile: {lead.property.title} ({lead.property.rif})</p>
        <p className="text-sm text-gray-500">Data: {new Date(lead.createdAt).toLocaleDateString('it-IT')}</p>
        <Link href={`/admin/leads/${lead._id}`} className="text-blue-600 hover:underline mt-2 inline-block font-semibold">
            Vedi dettaglio lead
        </Link>
    </div>
);


export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('employeeAuthToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const res = await fetch('/api/leads', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (res.status === 401) {
            router.push('/admin/login');
            return;
        }
        if (!res.ok) throw new Error('Errore nel caricamento dei lead.');

        const data = await res.json();
        setLeads(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, [router]);

  const hotLeads = leads.filter(lead =>
    lead.postViewingAnswers?.urgency === 'alta' || lead.postViewingAnswers?.urgency === 'subito'
  );
  const recallLeads = leads.filter(lead => lead.status === 'Da richiamare');

  if (loading) return <p className="text-center text-lg">Caricamento dashboard...</p>;
  if (error) return <p className="text-center text-lg text-red-600">Errore: {error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Da Richiamare Subito</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {hotLeads.length > 0 ? hotLeads.map(lead => (
              <LeadCard key={lead._id} lead={lead} />
            )) : <p className="text-gray-500">Nessun contatto caldo.</p>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Da Richiamare</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recallLeads.length > 0 ? recallLeads.map(lead => (
              <LeadCard key={lead._id} lead={lead} />
            )) : <p className="text-gray-500">Nessun contatto da richiamare.</p>}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Calendario</h2>
          <div className="bg-gray-200 h-96 flex items-center justify-center rounded-md">
            <p className="text-gray-500">Placeholder per il calendario</p>
          </div>
        </div>
      </div>
    </div>
  );
}
