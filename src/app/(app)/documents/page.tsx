'use client';

import { useState } from 'react';
import DocumentUpload from '@/components/DocumentUpload';
import DocumentSearch from '@/components/DocumentSearch';

type Tab = 'upload' | 'search';

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('upload');

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manajemen Dokumen</h1>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-3 px-6 font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📤 Upload Dokumen
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-3 px-6 font-medium border-b-2 transition-colors ${
                activeTab === 'search'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🔍 Cari Dokumen
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 'upload' && <DocumentUpload />}
          {activeTab === 'search' && <DocumentSearch />}
        </div>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">📋 Tentang Upload</h3>
            <p className="text-sm text-gray-600">
              Upload dokumen untuk menambahkan knowledge base chatbot. Dokumen akan di-chunk dan di-index menggunakan vector database untuk semantic search.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-800 mb-2">🔎 Tentang Search</h3>
            <p className="text-sm text-gray-600">
              Cari dokumen dalam knowledge base menggunakan AI-powered semantic search. Hasil akan menampilkan chunk yang paling relevan dengan query Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
