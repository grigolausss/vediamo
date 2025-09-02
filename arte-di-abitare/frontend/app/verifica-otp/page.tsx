"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyOtpComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!email) {
            // If no email is in the URL, redirect to home
            router.push('/');
        }
    }, [email, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/users/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Errore durante la verifica del codice OTP.');
            }
            // Save the token for the public user session
            localStorage.setItem('authToken', data.token);
            // Redirect to the RIF search page
            router.push('/cerca-rif');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-blue-900 mb-4 text-center">Verifica il tuo indirizzo Email</h1>
                <p className="text-center text-gray-700 mb-6">Ti abbiamo inviato una mail a <strong>{email}</strong>. Inserisci il codice a 6 cifre che hai ricevuto.</p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="otp" className="sr-only">Codice OTP</label>
                        <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-center text-2xl tracking-widest" placeholder="------"/>
                    </div>
                    <p className="text-xs text-gray-500 text-center">Controlla anche la cartella spam. Il codice scade tra pochi minuti.</p>
                    {error && <p className="text-red-600 text-center text-sm">{error}</p>}
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400">
                        {isLoading ? 'Verifico...' : 'Verifica e Continua'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Using Suspense is a good practice when using useSearchParams
export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<div>Caricamento...</div>}>
            <VerifyOtpComponent />
        </Suspense>
    );
}
