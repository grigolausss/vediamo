"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Define the structure of the answers
interface Answers {
  searchZone: string;
  minBedrooms: string; // Use string for input, convert to number on submission
  mustHaveFeatures: string;
  urgency: string;
  finalFeedback: string;
}

export default function Questionnaire2Page() {
  const params = useParams();
  const router = useRouter();
  const rif = params.rif as string;

  const [answers, setAnswers] = useState<Answers>({
    searchZone: '',
    minBedrooms: '1',
    mustHaveFeatures: '',
    urgency: 'poca',
    finalFeedback: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (choice: 'discoverAddress' | 'getAlternatives') => {
    setIsSubmitting(true);
    setError(null);

    // First, submit the questionnaire answers
    try {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('Autenticazione richiesta.');

        const response = await fetch('/api/leads/questionnaire2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                propertyRif: rif,
                answers: {
                    ...answers,
                    minBedrooms: Number(answers.minBedrooms) // Convert to number
                }
            }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Errore nell\'invio del questionario.');

        // After successful submission, handle the user's choice
        if (choice === 'discoverAddress') {
            // Navigate to the address page (to be created)
            router.push(`/indirizzo/${rif}?action=scopri`);
        } else {
            // Navigate to the alternatives page (to be created)
            router.push(`/alternative/${rif}`);
        }

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6 text-center">Feedback e Passi Successivi</h1>

        <div className="space-y-6">
            <div>
                <label htmlFor="searchZone" className="block text-lg font-semibold text-gray-800 mb-2">In quale zona stai cercando?</label>
                <input type="text" name="searchZone" id="searchZone" value={answers.searchZone} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="minBedrooms" className="block text-lg font-semibold text-gray-800 mb-2">Quante camere minime necessiti?</label>
                <select name="minBedrooms" id="minBedrooms" value={answers.minBedrooms} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4 o più</option>
                </select>
            </div>
            <div>
                <label htmlFor="mustHaveFeatures" className="block text-lg font-semibold text-gray-800 mb-2">Cosa non può mancare nella tua nuova casa?</label>
                <textarea name="mustHaveFeatures" id="mustHaveFeatures" value={answers.mustHaveFeatures} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
                <label htmlFor="urgency" className="block text-lg font-semibold text-gray-800 mb-2">Urgenza:</label>
                <select name="urgency" id="urgency" value={answers.urgency} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="poca">Poca</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="subito">Subito</option>
                </select>
            </div>
            <div>
                <label htmlFor="finalFeedback" className="block text-lg font-semibold text-gray-800 mb-2">Feedback finale: Cosa ne pensi?</label>
                <textarea name="finalFeedback" id="finalFeedback" value={answers.finalFeedback} onChange={handleInputChange} rows={3} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" />
            </div>
        </div>

        {error && <p className="text-red-600 text-center mt-6">{error}</p>}

        <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
            <button
                onClick={() => handleSubmit('discoverAddress')}
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Invio...' : 'Sono interessato, voglio scoprire l’indirizzo esatto'}
            </button>
            <button
                onClick={() => handleSubmit('getAlternatives')}
                disabled={isSubmitting}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Invio...' : 'Non mi convince, voglio spiegare il perché e vedere alternative'}
            </button>
        </div>
      </div>
    </div>
  );
}
