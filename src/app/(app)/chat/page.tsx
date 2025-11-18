import ChatWindow from '@/components/ChatWindow';

// Halaman ini dilindungi oleh (app)/layout.tsx
// Jadi hanya user yang login yang bisa melihat inis
export default function ChatPage() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Obrol.in Chatbot</h1>
      <p className="mb-4 text-gray-600">
        Layanan Informasi Akademik S1 Sistem Informasi
      </p>

      {/* Memuat komponen chat utama */}
      <ChatWindow />
    </div>
  );
}