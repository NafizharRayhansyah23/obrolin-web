'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

const categories = [
  { id: 'Capstone', name: 'Capstone (Tugas Akhir)' },
  { id: 'KP', name: 'KP (Kerja Praktek)' },
  { id: 'MBKM', name: 'MBKM' },
  { id: 'Registrasi MK', name: 'Registrasi MK' },
  { id: 'General', name: 'General' },
];

export default function DocumentUpload() {
  const { data: session } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('General');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setUploadResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Pilih file terlebih dahulu');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress('Memulai upload...');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      setUploadProgress('Mengupload dokumen...');
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload gagal');
      }

      const result = await response.json();
      setUploadResult(result);
      setUploadProgress('Upload berhasil!');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Terjadi kesalahan saat upload');
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Silakan login terlebih dahulu untuk upload dokumen.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload Dokumen</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        {/* Category Selection */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* File Selection */}
        <div>
          <label htmlFor="file-input" className="block text-sm font-medium text-gray-700 mb-2">
            Pilih File
          </label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            accept=".pdf,.doc,.docx,.txt,.md"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              File dipilih: <span className="font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isUploading ? 'Mengupload...' : 'Upload Dokumen'}
        </button>
      </form>

      {/* Progress/Status */}
      {uploadProgress && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">{uploadProgress}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Success Result */}
      {uploadResult && uploadResult.success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="font-semibold text-green-800 mb-2">✅ Upload Berhasil!</h3>
          {uploadResult.message && (
            <p className="text-green-700 text-sm mb-2">{uploadResult.message}</p>
          )}
          {uploadResult.stats && (
            <div className="text-sm text-green-700 space-y-1">
              <p>Total chunks: {uploadResult.stats.total_chunks}</p>
              <p>New chunks: {uploadResult.stats.new_chunks}</p>
              <p>Duplicates skipped: {uploadResult.stats.duplicates_skipped}</p>
              {uploadResult.stats.total_points_in_collection && (
                <p>Total dokumen di database: {uploadResult.stats.total_points_in_collection}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Supported Formats Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="font-semibold text-gray-800 mb-2">Format yang Didukung:</h3>
        <p className="text-sm text-gray-600">
          PDF, DOC, DOCX, TXT, MD
        </p>
      </div>
    </div>
  );
}
