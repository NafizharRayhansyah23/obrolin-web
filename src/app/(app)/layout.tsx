'use client'; // <-- INI ADALAH PERBAIKANNYA

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link'; // Kita tambahkan Link untuk navigasi

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Cek status autentikasi
    if (status === 'loading') {
      return; // Masih memuat, jangan lakukan apa-apa
    }

    if (status === 'unauthenticated') {
      // Jika tidak terautentikasi, paksa kembali ke /login
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading session...</p>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    // Tampilkan null selagi redirect
    return null;
  }

  // Jika status 'authenticated'
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <nav className="max-w-5xl mx-auto p-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/chat" className="text-xl font-bold text-blue-600">
              Obrol.in
            </Link>
            <div className="flex gap-4">
              <Link
                href="/chat"
                className="text-gray-600 hover:text-blue-600"
              >
                Chat
              </Link>
              <Link
                href="/history"
                className="text-gray-600 hover:text-blue-600"
              >
                Riwayat
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700 hidden sm:block">
              {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>
      
      {/* Konten Halaman (misal: /chat atau /history) */}
      <main className="max-w-5xl mx-auto p-4 mt-8">
        {children}
      </main>
    </div>
  );
}