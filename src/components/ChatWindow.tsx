'use client';

import { useState, useRef, useEffect } from 'react';
import ChatBubble from './ChatBubble';
import { useSession } from 'next-auth/react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const categories = [
  { id: 'akademik', name: 'Akademik Umum' },
  { id: 'magang', name: 'Magang & MBKM' },
  { id: 'kp', name: 'Kerja Praktik' },
  { id: 'tugas-akhir', name: 'Tugas Akhir' },
  { id: 'lainnya', name: 'Lainnya' },
];

export default function ChatWindow() {
  const { data: session, status: sessionStatus } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);
  
  const initRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hanya jalankan jika:
    // 1. Status authenticated
    // 2. Session ada dan punya user.id
    // 3. Belum punya conversation_id
    // 4. Tidak sedang initializing
    // 5. Belum pernah dijalankan (initRef)
    if (
      sessionStatus !== 'authenticated' || 
      !session?.user?.id ||
      conversationId || 
      isInitializing ||
      initRef.current
    ) {
      return;
    }

    initRef.current = true;
    setIsInitializing(true);

    const startConversation = async (attempt = 1) => {
      const maxAttempts = 5;
      setError('');
      
      console.log(`[ChatWindow] 🔄 Starting conversation (attempt ${attempt}/${maxAttempts})`);
      console.log('[ChatWindow] Session:', {
        status: sessionStatus,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
      });

      try {
        // Delay yang makin lama untuk setiap attempt
        const delay = attempt === 1 ? 1000 : 1500 * attempt;
        console.log(`[ChatWindow] ⏳ Waiting ${delay}ms before request...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        console.log('[ChatWindow] 📡 Fetching /api/chat/start...');
        const res = await fetch('/api/chat/start', { 
          method: 'POST',
          cache: 'no-store',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('[ChatWindow] Response:', {
          status: res.status,
          ok: res.ok,
          statusText: res.statusText,
        });

        if (!res.ok) {
          if (res.status === 401 && attempt < maxAttempts) {
            console.log(`[ChatWindow] ⚠️ Unauthorized (attempt ${attempt}/${maxAttempts}), retrying...`);
            // Retry
            return startConversation(attempt + 1);
          }

          // Gagal setelah semua attempt
          const errorData = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        
        if (!data.conversation_id) {
          throw new Error('Server tidak mengembalikan conversation_id');
        }

        console.log('[ChatWindow] ✅ Success! conversation_id:', data.conversation_id);
        setConversationId(data.conversation_id);
        setError('');
      } catch (err: any) {
        console.error('[ChatWindow] ❌ Error:', err);
        const errorMsg = err.message || 'Gagal menginisialisasi chat';
        setError(`Error: ${errorMsg}`);
        initRef.current = false; // Allow manual retry
      } finally {
        setIsInitializing(false);
      }
    };

    startConversation();
  }, [sessionStatus, session, conversationId, isInitializing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    setError('');
    setIsLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: input,
      isUser: true,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.text,
          category: selectedCategory,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.answer || 'Gagal mengirim pesan');
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        text: data.answer,
        isUser: false,
      };
      setMessages((current) => [...current, botMessage]);
    } catch (err: any) {
      console.error('[ChatWindow] Submit error:', err);
      setError(err.message);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        text: `Error: ${err.message}`,
        isUser: false,
      };
      setMessages((current) => [...current, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryInit = () => {
    initRef.current = false;
    setError('');
    setIsInitializing(false);
    setConversationId('');
  };

  const isSessionLoading = sessionStatus === 'loading' || isInitializing;

  // Debug info untuk development
  const showDebugInfo = process.env.NODE_ENV === 'development';

  return (
    <div className="border rounded-lg shadow-lg bg-white">
      {/* Debug Info (hanya di development) */}
      {showDebugInfo && (
        <div className="bg-gray-100 p-2 text-xs font-mono border-b">
          <div>Status: {sessionStatus}</div>
          <div>User ID: {session?.user?.id || 'none'}</div>
          <div>Conv ID: {conversationId || 'none'}</div>
          <div>Initializing: {isInitializing ? 'yes' : 'no'}</div>
        </div>
      )}

      {/* 1. Pemilihan Kategori */}
      <div className="p-4 border-b">
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Langkah 1: Pilih Kategori (Wajib Sesuai Use Case)
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
          disabled={isSessionLoading}
        >
          <option value="" disabled>
            {isSessionLoading ? 'Memuat sesi...' : '-- Pilih Kategori --'}
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Area Pesan */}
      <div className="h-96 p-4 overflow-y-auto flex flex-col space-y-2">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-md text-sm">
            <p className="font-semibold">❌ {error}</p>
            <div className="mt-3 space-y-2">
              <p className="text-xs">
                💡 Solusi: Coba refresh halaman (F5) atau logout & login kembali
              </p>
              <button
                onClick={handleRetryInit}
                className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 transition"
              >
                🔄 Coba Lagi
              </button>
            </div>
          </div>
        )}
        
        {messages.length === 0 && !error && (
          <div className="text-center text-gray-500 m-auto">
            {isSessionLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse text-lg">⏳</div>
                <div className="font-medium">Mempersiapkan sesi chat...</div>
                <p className="text-xs text-gray-400">
                  Proses ini memakan waktu 3-10 detik
                </p>
              </div>
            ) : conversationId ? (
              <div className="space-y-2">
                <div className="text-2xl">✅</div>
                <div>Sesi siap! Pilih kategori dan mulai bertanya.</div>
              </div>
            ) : (
              '🔄 Menginisialisasi...'
            )}
          </div>
        )}
        
        {messages.map((msg) => (
          <ChatBubble key={msg.id} text={msg.text} isUser={msg.isUser} />
        ))}
        
        {isLoading && (
          <ChatBubble text="Sedang mengetik..." isUser={false} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Form */}
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isSessionLoading
              ? 'Mempersiapkan sesi...'
              : !conversationId
              ? 'Menunggu sesi siap...'
              : !selectedCategory
              ? 'Pilih kategori terlebih dahulu...'
              : 'Ketik pertanyaan Anda...'
          }
          className="flex-grow p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          disabled={isSessionLoading || !conversationId || !selectedCategory || isLoading}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={
            isSessionLoading ||
            !conversationId ||
            !selectedCategory ||
            !input.trim() ||
            isLoading
          }
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </form>
    </div>
  );
}