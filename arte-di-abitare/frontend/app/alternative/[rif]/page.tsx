"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Define an interface for the alternative property data
interface AlternativeProperty {
  _id: string;
  title: string;
  rif: string;
  zone: string;
  surface: number;
  price: number;
}

export default function AlternativesPage() {
  const params = useParams();
  const router = useRouter();
  const rif = params.rif as string;

  const [step, setStep] = useState('loading'); // loading, showingAlternatives, askingPhone, thankYou, error
  const [alternatives, setAlternatives] = useState<AlternativeProperty[]>([]);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!rif) return;

    const fetchAlternatives = async () => {
      setStep('loading');
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Autenticazione richiesta.');

        const response = await fetch('/api/leads/final-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ propertyRif: rif, choice: 'getAlternatives' }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Errore nel recuperare le alternative.');

        setAlternatives(data.alternatives);
        setStep('showingAlternatives');
      } catch (err: any) {
        setError(err.message);
        setStep('error');
      }
    };

    fetchAlternatives();
  }, [rif]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Autenticazione richiesta.');

        await fetch('/api/leads/final-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ propertyRif: rif, choice: 'getAlternatives', phone }),
        });

        setStep('thankYou');
        setTimeout(() => router.push('https://www.artediabitare.it'), 5000);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return <p className="text-xl text-center">Ricerca alternative...</p>;
      case 'error':
        return <p className="text-red-600 text-xl text-center">Errore: {error}</p>;
      case 'thankYou':
        return (
            <div className="text-center">
                <h1 className="text-3xl font-bold text-green-600 mb-4">Grazie!</h1>
                <p className="text-lg text-gray-700">Un nostro consulente ti contatterà al più presto. Verrai reindirizzato al nostro sito principale tra 5 secondi.</p>
            </div>
        );
      case 'showingAlternatives':
        if (alternatives.length > 0) {
            return (
                <>
                    <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">Ecco alcune alternative che potrebbero interessarti:</h1>
                    <div className="space-y-4">
                        {alternatives.map(alt => (
                            <div key={alt._id} className="bg-white p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="text-center sm:text-left">
                                    <h2 className="text-xl font-bold text-blue-800">{alt.title}</h2>
                                    <p className="text-gray-600">RIF: {alt.rif} | Zona: {alt.zone} | {alt.surface} mq | €{alt.price.toLocaleString('it-IT')}</p>
                                </div>
                                <Link href={`/immobile/${alt.rif}`} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors whitespace-nowrap">
                                    Vedi informazioni
                                </Link>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t text-center">
                        <p className="text-gray-700 mb-2">Nessuna di queste alternative ti convince?</p>
                        <button onClick={() => setStep('askingPhone')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Parla con un nostro consulente</button>
                    </div>
                </>
            );
        } else {
            return (
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-blue-900 mb-6">Nessuna alternativa trovata.</h1>
                    <p className="text-lg text-gray-700 mb-4">Non abbiamo trovato alternative automatiche in questo momento.</p>
                    <button onClick={() => setStep('askingPhone')} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors">Parla con un nostro consulente</button>
                </div>
            );
        }
    case 'askingPhone':
        return (
            <form onSubmit={handlePhoneSubmit} className="text-center">
                <label htmlFor="phone" className="block text-xl font-semibold text-gray-800 mb-2">Lasciaci il tuo numero di telefono per discutere le tue esigenze con un consulente.</label>
                <input type="tel" name="phone" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full max-w-sm mx-auto p-2 border border-gray-300 rounded-md text-center text-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Il tuo numero di telefono" />
                {error && <p className="text-red-600 text-center mt-2">{error}</p>}
                <button type="submit" disabled={isSubmitting} className="mt-4 w-full max-w-sm mx-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:bg-gray-400">
                    {isSubmitting ? 'Invio...' : 'Invia e richiedi contatto'}
                </button>
            </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-xl p-8">
        {renderContent()}
      </div>
    </div>
  );
}
