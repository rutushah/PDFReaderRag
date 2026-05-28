# PDFReaderRag

A full-stack RAG (Retrieval-Augmented Generation) chatbot that answers questions about Nike PDF documents. Built with LangChain, OpenAI, Express, and React.

## Architecture

```
PDFReaderRag/
├── Backend/          # Express API server with RAG pipeline
│   ├── server.ts     # HTTP server with /ask endpoint
│   ├── ragAgent.ts   # Standalone RAG pipeline (exploration script)
│   └── ragAgent2.ts  # RAG pipeline using LangChain agent middleware
└── frontend/         # React + Vite chat UI
    └── src/App.tsx   # Single-page chatbot interface
```

## How it works

1. **Document loading** — Loads multiple Nike PDF reports using `PDFLoader` from `@langchain/community`
2. **Chunking** — Splits documents with `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap)
3. **Embedding** — Embeds chunks using OpenAI `text-embedding-3-large`
4. **Vector store** — Stores embeddings in an in-memory vector store (`MemoryVectorStore`)
5. **Query** — On each `/ask` request, retrieves the top 3 similar chunks and passes them as context to `gpt-4o`
6. **Frontend** — React UI sends questions to the backend and displays answers

## Setup

### Prerequisites

- Node.js 18+
- An OpenAI API key

### Backend

```bash
cd Backend
npm install
```

Create a `.env` file:

```
OPENAI_API_KEY=your_openai_api_key_here
```

Place PDF files in `Backend/documents/`:
- `nke-10k-2023.pdf`
- `nike-growth-story.pdf`
- `Nike-Inc-2025_10K.pdf`

Start the server:

```bash
npx tsx server.ts
```

The server starts on `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173` by default.

## API

### `POST /ask`

**Request body:**
```json
{ "question": "When was Nike incorporated?" }
```

**Response:**
```json
{ "answer": "Nike was incorporated in 1968..." }
```

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | OpenAI `gpt-4o` |
| Embeddings | OpenAI `text-embedding-3-large` |
| RAG framework | LangChain (`langchain`, `@langchain/openai`, `@langchain/community`, `@langchain/textsplitters`) |
| Vector store | `MemoryVectorStore` (in-process, no external DB) |
| Backend | Express 5 + TypeScript (`tsx` for running) |
| Frontend | React 19 + Vite + TypeScript |

## Key LangChain concepts covered

- **Document loaders** — `PDFLoader` to ingest PDF files
- **Text splitters** — `RecursiveCharacterTextSplitter` for chunking
- **Embeddings** — `OpenAIEmbeddings` for vector representations
- **Vector stores** — `MemoryVectorStore` for similarity search (MMR supported)
- **Agent middleware** — `dynamicSystemPromptMiddleware` for injecting retrieved context into the system prompt (`ragAgent2.ts`)
