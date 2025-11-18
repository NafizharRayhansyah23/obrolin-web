# 🚀 Integrasi FastAPI Backend dengan Next.js Frontend

## 📋 Overview

Dokumentasi ini menjelaskan integrasi lengkap antara FastAPI backend (`fastapi-app.py`) dengan Next.js frontend (`obrolin-web`).

## 🔗 Endpoint API yang Terintegrasi

### 1. **Conversation Endpoints**

#### ✅ `POST /conversations/create/`
- **Frontend Route**: `/api/chat/start`
- **Deskripsi**: Membuat conversation ID baru
- **Digunakan di**: `ChatWindow.tsx` (auto-initialize saat login)

#### ✅ `POST /conversations/chat/`
- **Frontend Route**: `/api/chat`
- **Deskripsi**: Mengirim pesan dan mendapat response dari chatbot
- **Parameter**: 
  - `conversation_id`: string
  - `content`: string (pertanyaan user)
  - `category`: string (Capstone, KP, MBKM, Registrasi MK)
- **Digunakan di**: `ChatWindow.tsx` (saat user kirim pesan)

#### ✅ `GET /conversations/list/`
- **Frontend**: `ragClient.ts` - `listConversations()`
- **Deskripsi**: List semua conversation history

#### ✅ `POST /conversations/history/`
- **Frontend**: `ragClient.ts` - `getConversationHistory()`
- **Deskripsi**: Mendapat history pesan dari conversation tertentu

#### ✅ `DELETE /conversations/delete/`
- **Frontend**: `ragClient.ts` - `deleteConversation()`
- **Deskripsi**: Hapus conversation

### 2. **Document Endpoints**

#### ✅ `POST /documents/upload/`
- **Frontend Route**: `/api/documents/upload`
- **Component**: `DocumentUpload.tsx`
- **Deskripsi**: Upload dokumen ke vector database
- **Parameter**:
  - `file`: File (PDF, DOC, DOCX, TXT, MD)
  - `category`: string
- **Response**: Stats upload (chunks, duplicates, etc)

#### ✅ `POST /documents/upload-stream`
- **Frontend**: `ragClient.ts` - `uploadDocumentStream()`
- **Deskripsi**: Upload dengan real-time progress (Server-Sent Events)

#### ✅ `POST /documents/search/`
- **Frontend Route**: `/api/documents/search`
- **Component**: `DocumentSearch.tsx`
- **Deskripsi**: Semantic search dokumen
- **Parameter**:
  - `query`: string
  - `category`: string (optional)
  - `limit`: number (default: 5)

#### ✅ `GET /documents/list/`
- **Frontend Route**: `/api/documents/upload` (GET)
- **Frontend**: `ragClient.ts` - `listDocuments()`
- **Deskripsi**: List semua dokumen

#### ✅ `GET /documents/categories/`
- **Frontend Route**: `/api/documents/categories`
- **Frontend**: `ragClient.ts` - `getCategories()`
- **Deskripsi**: List semua categories yang ada

#### ✅ `DELETE /documents/delete/`
- **Frontend Route**: `/api/documents/upload` (DELETE)
- **Frontend**: `ragClient.ts` - `deleteDocument()`
- **Deskripsi**: Hapus dokumen

#### ✅ `GET /documents/formats/`
- **Frontend**: `ragClient.ts` - `getSupportedFormats()`
- **Deskripsi**: Info format file yang didukung

### 3. **Health Check**

#### ✅ `GET /health/`
- **Frontend**: `ragClient.ts` - `healthCheck()`
- **Deskripsi**: Cek status backend

## 📁 Struktur File yang Dibuat/Diupdate

```
obrolin-web/
├── src/
│   ├── lib/
│   │   └── ragClient.ts              ✅ UPDATED - Semua endpoint FastAPI
│   │
│   ├── components/
│   │   ├── ChatWindow.tsx             ✅ UPDATED - Category mapping
│   │   ├── DocumentUpload.tsx         ✅ NEW - Upload dokumen
│   │   └── DocumentSearch.tsx         ✅ NEW - Search dokumen
│   │
│   └── app/
│       ├── (app)/
│       │   └── documents/
│       │       └── page.tsx           ✅ NEW - Halaman manajemen dokumen
│       │
│       └── api/
│           ├── chat/
│           │   ├── route.ts           ✅ EXISTING - Chat endpoint
│           │   └── start/
│           │       └── route.ts       ✅ EXISTING - Create conversation
│           │
│           └── documents/
│               ├── upload/
│               │   └── route.ts       ✅ NEW - Upload/list/delete dokumen
│               ├── search/
│               │   └── route.ts       ✅ NEW - Search dokumen
│               └── categories/
│                   └── route.ts       ✅ NEW - List categories
```

## 🎯 Category Mapping

Categories yang digunakan (sesuai antara frontend & backend):

```typescript
const categories = [
  'Capstone',        // Tugas Akhir
  'KP',             // Kerja Praktek
  'MBKM',           // Merdeka Belajar Kampus Merdeka
  'Registrasi MK',  // Registrasi Mata Kuliah
  'General',        // Umum
];
```

## 🔧 Environment Variables

Pastikan `.env` di `obrolin-web` memiliki:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/db_website"

# FastAPI Backend
RAG_API_URL="http://localhost:5000"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=Ha/Bc7gJm2YnhhI1qnz8cx6xp4fUTzAi1d3DOaMUToQ=
```

## 🚀 Cara Menjalankan

### 1. Setup Database

```bash
# Di folder obrolin-web
cd obrolin-web
npx prisma generate
npx prisma migrate deploy
```

### 2. Jalankan FastAPI Backend

```bash
# Di folder root
python fastapi-app.py
```

Backend akan berjalan di: `http://localhost:5000`

### 3. Jalankan Next.js Frontend

```bash
# Di folder obrolin-web
cd obrolin-web
npm install
npm run dev
```

Frontend akan berjalan di: `http://localhost:3000`

## 📊 Flow Data

### Chat Flow:
1. User login → Next.js `/api/auth`
2. ChatWindow load → `/api/chat/start` → FastAPI `/conversations/create/`
3. User kirim pesan → `/api/chat` → FastAPI `/conversations/chat/`
4. Response disimpan ke PostgreSQL (Chat table)

### Document Upload Flow:
1. User upload file → `/api/documents/upload`
2. Forward ke FastAPI `/documents/upload/`
3. FastAPI:
   - Extract text dari dokumen
   - Chunk text
   - Generate embeddings (dense + sparse)
   - Store ke Qdrant vector DB
4. Return stats ke frontend

### Document Search Flow:
1. User input query → `/api/documents/search`
2. Forward ke FastAPI `/documents/search/`
3. FastAPI:
   - Generate embedding dari query
   - Search di Qdrant (hybrid: dense + sparse)
   - Return top-k results
4. Frontend display results

## 🧪 Testing Endpoint

### Test Health Check:
```bash
curl http://localhost:5000/health/
```

### Test Create Conversation:
```bash
curl -X POST http://localhost:5000/conversations/create/ \
  -H "Content-Type: application/json"
```

### Test Chat:
```bash
curl -X POST http://localhost:5000/conversations/chat/ \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_id": "YOUR_CONVERSATION_ID",
    "content": "Apa itu MBKM?",
    "category": "MBKM"
  }'
```

### Test Upload Document:
```bash
curl -X POST http://localhost:5000/documents/upload/ \
  -F "file=@document.pdf" \
  -F "category=Capstone"
```

### Test Search:
```bash
curl -X POST http://localhost:5000/documents/search/ \
  -H "Content-Type: application/json" \
  -d '{
    "query": "cara daftar MBKM",
    "category": "MBKM",
    "limit": 5
  }'
```

## 🎨 Frontend Pages

1. **Chat Page** (`/`) - Main chatbot interface
   - Auto-create conversation
   - Category selection (mandatory)
   - Real-time chat dengan AI

2. **History Page** (`/history`) - Chat history
   - List semua chat user
   - Filter by date/category

3. **Documents Page** (`/documents`) - Document management
   - Upload dokumen
   - Search semantic
   - List & delete dokumen

## 🔐 Authentication Flow

Semua API routes di Next.js menggunakan `getServerSession`:

```typescript
const session = await getServerSession(authOptions);
if (!session || !session.user || !session.user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## 📈 Database Schema

### PostgreSQL (Next.js - Prisma):
- **User**: id, Name, Email, Password, Role
- **Chat**: Chat_id, userId, Category, Question, Answer, created_at, Feedback

### Qdrant (FastAPI - Vector DB):
- **Collection**: knowledge_base
- **Vectors**: Dense (1024-dim) + Sparse
- **Payload**: text, filename, category, content_hash, chunk_index, metadata

## ⚡ Performance Tips

1. **Pagination**: Implement untuk list conversations & documents
2. **Caching**: Consider Redis untuk frequently accessed data
3. **Rate Limiting**: Implement di FastAPI untuk prevent abuse
4. **Batch Processing**: Upload multiple documents
5. **Streaming**: Gunakan SSE untuk long-running operations

## 🐛 Troubleshooting

### Error: "Failed to connect to RAG server"
- Pastikan FastAPI running di port 5000
- Check `RAG_API_URL` di `.env`

### Error: "Unauthorized"
- Clear cookies dan login ulang
- Check `NEXTAUTH_SECRET` valid

### Error: "Database connection failed"
- Pastikan PostgreSQL running
- Check `DATABASE_URL` di `.env`

### Upload gagal:
- Check file format (PDF, DOC, DOCX, TXT, MD)
- Check file size (max 10MB)
- Check Qdrant collection exists

## 📝 Next Steps

- [ ] Implement pagination untuk list endpoints
- [ ] Add real-time notifications (WebSocket)
- [ ] Implement file preview
- [ ] Add document versioning
- [ ] Implement advanced search filters
- [ ] Add analytics dashboard
- [ ] Implement feedback system untuk responses
- [ ] Add export chat history

## 🤝 Contributing

Untuk menambah endpoint baru:
1. Tambahkan di `fastapi-app.py`
2. Update `ragClient.ts`
3. Buat Next.js API route di `/api`
4. Update dokumentasi ini

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Maintainer**: obrolin-chatbot team
