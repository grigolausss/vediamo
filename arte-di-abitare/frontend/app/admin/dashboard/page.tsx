"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Updated Lead interface for the dashboard
interface Lead {
  _id: string;
  user: { name: string; surname: string; email: string; phone?: string; };
  property: { title: string; rif: string; };
  status: string;
  createdAt: string;
  callbackDate?: string;
}

// Reusable Lead Card
const LeadCard = ({ lead }: { lead: Lead }) => (
    <div className="border p-4 rounded-md shadow-sm bg-white hover:shadow-md transition-shadow">
        <p className="font-bold text-lg">{lead.user.name} {lead.user.surname}</p>
        <p className="text-gray-600 text-sm">{lead.user.email}</p>
        <p className="text-gray-600 text-sm">{lead.user.phone || 'Nessun telefono'}</p>
        <p className="text-xs text-gray-500 mt-2">Immobile: {lead.property.rif}</p>
        <p className="text-xs text-gray-500">Data Lead: {new Date(lead.createdAt).toLocaleDateString('it-IT')}</p>
        {lead.callbackDate && <p className="text-xs font-semibold text-red-600">Richiamo: {new Date(lead.callbackDate).toLocaleString('it-IT')}</p>}
        <Link href={`/admin/leads/${lead._id}`} className="text-blue-600 hover:underline mt-2 inline-block font-semibold text-sm">
            Vedi dettaglio
        </Link>
    </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [reminders, setReminders] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for search and sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('più recenti');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('employeeAuthToken');
        if (!token) { router.push('/admin/login'); return; }

        // Fetch all leads (will be updated to support query params)
        const leadsRes = await fetch('/api/leads', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!leadsRes.ok) throw new Error('Errore nel caricamento dei lead.');
        const leadsData = await leadsRes.json();
        setAllLeads(leadsData);

        // Fetch today's reminders (from a new endpoint)
        const remindersRes = await fetch('/api/leads/reminders/today', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!remindersRes.ok) throw new Error('Errore nel caricamento dei promemoria.');
        const remindersData = await remindersRes.json();
        setReminders(remindersData);

      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [router]);

  const handleClearSearch = () => {
      setSearchQuery('');
  };

  const filteredAndSortedLeads = useMemo(() => {
      let filtered = allLeads;

      if (searchQuery) {
          filtered = allLeads.filter(lead =>
              `${lead.user.name} ${lead.user.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
          );
      }

      switch(sortOrder) {
          case 'meno recenti': return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          case 'nome crescente': return filtered.sort((a, b) => a.user.name.localeCompare(b.user.name));
          case 'nome decrescente': return filtered.sort((a, b) => b.user.name.localeCompare(a.user.name));
          case 'più recenti':
          default:
              return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
  }, [allLeads, searchQuery, sortOrder]);

  const leadsToCallNow = useMemo(() => filteredAndSortedLeads.filter(lead => lead.status === 'Da richiamare' && lead.callbackDate && new Date(lead.callbackDate) < new Date()), [filteredAndSortedLeads]);
  const leadsToCallBack = useMemo(() => filteredAndSortedLeads.filter(lead => lead.status === 'Da richiamare' && (!lead.callbackDate || new Date(lead.callbackDate) >= new Date())), [filteredAndSortedLeads]);

  if (loading) return <p className="text-center">Caricamento dashboard...</p>;
  if (error) return <p className="text-center text-red-600">Errore: {error}</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Lead</h1>

      {/* Search and Sort Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg shadow">
          <input type="text" placeholder="Cerca per nome e cognome..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="p-2 border rounded-md"/>
          <div className="flex gap-2">
            <button onClick={() => { /* Implement search logic */ }} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Cerca</button>
            <button onClick={handleClearSearch} className="bg-gray-300 text-black px-4 py-2 rounded-md hover:bg-gray-400">Pulisci</button>
          </div>
          <select value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="p-2 border rounded-md">
              <option>più recenti</option><option>meno recenti</option><option>nome crescente</option><option>nome decrescente</option>
          </select>
      </div>

      {/* Today's Reminders */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Promemoria di Oggi</h2>
          <div className="space-y-2">
            {reminders.length > 0 ? reminders.map(lead => (
                <div key={lead._id} className="flex justify-between items-center">
                    <span>Devi richiamare <strong>{lead.user.name} {lead.user.surname}</strong></span>
                    <Link href={`/admin/leads/${lead._id}`} className="text-blue-600 hover:underline font-semibold">Vai al lead</Link>
                </div>
            )) : <p>Nessun promemoria per oggi.</p>}
          </div>
      </div>

      {/* Lead Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
              <h2 className="text-2xl font-bold text-red-600 mb-4">Da Richiamare Subito (scaduti)</h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 bg-gray-100 rounded-md">
                  {leadsToCallNow.length > 0 ? leadsToCallNow.map(lead => <LeadCard key={lead._id} lead={lead}/>) : <p className="text-gray-500 p-4">Nessun lead scaduto.</p>}
              </div>
          </div>
          <div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">Da Richiamare</h2>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 bg-gray-100 rounded-md">
                  {leadsToCallBack.length > 0 ? leadsToCallBack.map(lead => <LeadCard key={lead._id} lead={lead}/>) : <p className="text-gray-500 p-4">Nessun lead da richiamare.</p>}
              </div>
          </div>
      </div>
    </div>
  );
}
