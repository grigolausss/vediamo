"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Import useRouter

// Define the structure of the answers
interface Answers {
  maxBudget: string;
  purchaseTimeline: string;
  mortgagePreApproval: string;
  isFirstHome: string;
  availabilityForVisit: string;
}

export default function QuestionnairePage() {
  const params = useParams();
  const router = useRouter(); // Initialize router for navigation
  const rif = params.rif as string;

  const [answers, setAnswers] = useState<Answers>({
    maxBudget: '',
    purchaseTimeline: '',
    mortgagePreApproval: '',
    isFirstHome: '',
    availabilityForVisit: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const isFormComplete = Object.values(answers).every(answer => answer !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Autenticazione richiesta. Per favore, effettua di nuovo la verifica via email.');
        }

        const response = await fetch('/api/leads/questionnaire1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ propertyRif: rif, answers }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Si è verificato un errore durante l\'invio.');
        }

        setSuccess(true);
        // Redirect to the floor plan page after a short delay
        setTimeout(() => {
            // Redirect to the floor plan page, as per the user flow.
            router.push(`/planimetria/${rif}`);
        }, 2000);

    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsSubmitting(false);
    }
  };

  const questions = [
    { name: 'maxBudget', question: 'Budget massimo:', options: ['<150.000', '150.000–250.000', '250.000–350.000', '>350.000'] },
    { name: 'purchaseTimeline', question: 'Quando prevedi di acquistare:', options: ['entro 3 mesi', 'entro 6 mesi', 'entro 1 anno', 'non ho fretta'] },
    { name: 'mortgagePreApproval', question: 'Hai una pre-approvazione del mutuo?', options: ['Sì', 'No, ma ho già parlato con la banca', 'No, devo ancora iniziare', 'Comprerò in contanti'] },
    { name: 'isFirstHome', question: 'È la tua prima casa?', options: ['Sì', 'No'] },
    { name: 'availabilityForVisit', question: 'Disponibile per visite nei prossimi 7 giorni?', options: ['Sì', 'No'] }
  ];

  if (success) {
    return (
        <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-8 text-center">
                <h1 className="text-3xl font-bold text-green-600 mb-4">Grazie!</h1>
                <p className="text-lg text-gray-700">Il tuo questionario è stato inviato con successo. Verrai reindirizzato a breve.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6 text-center">Questionario di Qualificazione</h1>
        <p className="text-center text-gray-600 mb-8">Per continuare, per favore rispondi a queste brevi domande.</p>
        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map(({ name, question, options }) => (
            <fieldset key={name} className="border-t border-gray-200 pt-6">
              <legend className="text-lg font-semibold text-gray-800 mb-3">{question}</legend>
              <div className="space-y-2">
                {options.map(option => (
                  <label key={option} className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name={name}
                      value={option}
                      checked={answers[name as keyof Answers] === option}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-md text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          {error && <p className="text-red-600 text-center">{error}</p>}

          <button
            type="submit"
            disabled={!isFormComplete || isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Invio in corso...' : 'Invia Questionario'}
          </button>
        </form>
      </div>
    </div>
  );
}
