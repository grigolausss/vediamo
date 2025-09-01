"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('employeeAuthToken');
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <Link href="/admin/dashboard">
            <h1 className="text-2xl font-bold text-blue-900 cursor-pointer">Pannello ADA</h1>
        </Link>
        <nav className="space-x-4">
            {/* Add more nav links as pages are created */}
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-blue-700">Dashboard</Link>
            <Link href="/admin/immobili" className="text-gray-600 hover:text-blue-700">Immobili</Link>
            <Link href="/admin/utenti" className="text-gray-600 hover:text-blue-700">Utenti</Link>
            <Link href="/admin/logs" className="text-gray-600 hover:text-blue-700">Log Attività</Link>
        </nav>
        <div>
          {/* User info can be fetched and displayed here later */}
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </header>
      <main className="p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}
