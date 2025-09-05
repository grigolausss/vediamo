"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function DecisionPage() {
    const params = useParams();
    const rif = params.rif as string;

    // A placeholder for logic that might be needed later, e.g., fetching property title
    const propertyTitle = "Immobile Selezionato"; // This could be fetched or passed via state

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800">Cosa ne pensi?</h1>
                <p className="text-lg text-gray-600 mt-2">Grazie per aver completato il questionario. Ora hai due opzioni.</p>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Option A: Interested */}
                    <div className="border-2 border-green-500 rounded-lg p-6 flex flex-col items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-700">Sono interessato.</h2>
                        <p className="my-4 text-gray-600">Vorrei scoprire la zona esatta dell’immobile per valutare la posizione.</p>
                        <Link href={`/zona/${rif}`} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg">
                            Scopri la zona
                        </Link>
                    </div>

                    {/* Option B: Not Interested */}
                     <div className="border-2 border-red-500 rounded-lg p-6 flex flex-col items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-700">Non fa per me.</h2>
                        <p className="my-4 text-gray-600">L'immobile non mi convince. Vorrei spiegare il perché e vedere delle alternative.</p>
                        <Link href={`/alternative/${rif}`} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors text-lg">
                            Non sono interessato
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
