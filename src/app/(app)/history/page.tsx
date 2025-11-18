'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns'; // Library untuk format tanggal

// Tipe data ini harus cocok dengan 'schema.prisma' Anda
interface ChatRecord {
  Chat_id: number;
  Category: string;
  Question: string;
  Answer: string;
  created_at: string; // ISO string date
  Feedback: boolean | null;
  userId: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ChatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect akan berjalan saat halaman dimuat
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Panggil API backend kita (method GET adalah default)
        const res = await fetch('/api/chat');
        if (!res.ok) {
          throw new Error('Gagal memuat riwayat');
        }
        const data: ChatRecord[] = await res.json();
        setHistory(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []); // Array kosong berarti 'hanya jalankan sekali saat memuat'

  if (isLoading) {
    return <p className="text-center text-gray-500">Memuat riwayat...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Riwayat Percakapan Anda
      </h1>

      {history.length === 0 ? (
        <p className="text-center text-gray-500">
          Anda belum memiliki riwayat percakapan.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Loop (map) setiap item riwayat */}
          {history.map((chat) => (
            <div
              key={chat.Chat_id}
              className="bg-white p-4 rounded-lg shadow-md border"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {/* Gunakan nama kolom yang benar: 'Category' */}
                  {chat.Category}
                </span>
                <span className="text-xs text-gray-500">
                  {/* Format tanggal agar mudah dibaca */}
                  {format(new Date(chat.created_at), 'd MMM yyyy, HH:mm')}
                </span>
              </div>
              <div className="mt-4">
                <p className="font-semibold text-gray-700">
                  {/* Gunakan nama kolom yang benar: 'Question' */}
                  Anda:
                </p>
                <p className="text-gray-800 pl-2">{chat.Question}</p>
              </div>
              <div className="mt-3">
                <p className="font-semibold text-gray-500">Bot:</p>
                <p className="text-gray-600 pl-2 whitespace-pre-wrap">
                  {/* Gunakan nama kolom yang benar: 'Answer' */}
                  {chat.Answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}