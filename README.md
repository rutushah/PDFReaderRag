# PDFReaderRag

A full-stack RAG (Retrieval-Augmented Generation) chatbot that lets you ask natural language questions about any PDF document. Built with LangChain, OpenAI, Express, and React.

> **Example:** The included demo loads Nike annual reports (`nke-10k-2023.pdf`, `Nike-Inc-2025_10K.pdf`, etc.) — swap in any PDFs of your choice.

## Architecture

```
PDFReaderRag/
├── Backend/
│   ├── server.ts         # Express HTTP server with /ask endpoint (uses gpt-4o + RAG middleware)
│   ├── ragAgent.ts       # Standalone RAG exploration script (similarity search, MMR retriever)
│   ├── ragAgent2.ts      # Agent with dynamicSystemPromptMiddleware (single PDF, gpt-4o)
│   ├── ragAgentGraph.ts  # LangGraph agent with tools + RAG middleware; exported as `graph`
│   ├── langgraph.json    # LangGraph config — wires ragAgentGraph.ts:graph as "rag_agent"
│   └── MCPServerEx.ts    # MCP server integration example
└── frontend/             # React + Vite chat UI
    └── src/App.tsx       # Single-page chatbot interface
```

## Agents

### `ragAgent.ts` — Exploration script
A simple standalone script for experimenting with the RAG pipeline. Loads a single PDF, chunks and embeds it, then runs a hardcoded similarity search. Also demonstrates the MMR retriever config. Not used by the server — meant for learning and debugging.

### `ragAgent2.ts` — Agent with RAG middleware
Introduces `createAgent` and `dynamicSystemPromptMiddleware` from LangChain. On each invocation, the middleware runs a similarity search against the vector store and injects the retrieved context into the system prompt dynamically. Uses `gpt-4o` with no tools.

### `ragAgentGraph.ts` — LangGraph agent with tools
The most complete agent. Loads multiple PDFs, uses `dynamicSystemPromptMiddleware` for RAG context injection, and adds two tools:
- `getWeather` — returns a mocked weather forecast for a given city
- `sendEmail` — simulates sending an email to a recipient

The agent (`gpt-4o-mini`) is exported as `graph` and registered in `langgraph.json` under the key `"rag_agent"`, making it deployable via the LangGraph server.

### `server.ts` — Express API server
Production-style server that initializes the RAG pipeline on startup (loading all three Nike PDFs into a `MemoryVectorStore`), then exposes a `POST /ask` endpoint. Each request retrieves the top 3 relevant chunks and passes them as context to `gpt-4o` via `dynamicSystemPromptMiddleware`.

## How it works

1. **Document loading** — Loads one or more PDF files using `PDFLoader` from `@langchain/community`
2. **Chunking** — Splits documents with `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap)
3. **Embedding** — Embeds chunks using OpenAI `text-embedding-3-large`
4. **Vector store** — Stores embeddings in an in-memory vector store (`MemoryVectorStore`)
5. **Query** — On each `/ask` request, retrieves the top 3 similar chunks and injects them into the system prompt via `dynamicSystemPromptMiddleware`
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

Place your PDF files in `Backend/documents/` and update the `pdfPaths` array in `server.ts`:

```ts
const pdfPaths = [
  "documents/your-document.pdf",
  "documents/another-document.pdf",
];
```

Start the server:

```bash
npx tsx server.ts
```

The server starts on `http://localhost:3000`.

### Standalone LangGraph agent (`ragAgentGraph.ts`)

Add your LangSmith keys to `.env` to enable tracing:

```
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=pdf-reader-rag
```

Then serve the agent locally with the LangGraph CLI:

```bash
cd Backend
npx @langchain/langgraph-cli dev
```

This reads `langgraph.json`, starts a LangGraph server, and exposes the `rag_agent` graph. Open the LangGraph Studio URL printed in the terminal to run and trace the agent interactively.

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
{ "question": "What is the main topic of the document?" }
```

**Response:**
```json
{ "answer": "..." }
```

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | OpenAI `gpt-4o` / `gpt-4o-mini` |
| Embeddings | OpenAI `text-embedding-3-large` |
| RAG framework | LangChain (`langchain`, `@langchain/openai`, `@langchain/community`, `@langchain/textsplitters`) |
| Agent framework | LangGraph (`langgraph.json` + `createAgent`) |
| Vector store | `MemoryVectorStore` (in-process, no external DB) |
| Backend | Express 5 + TypeScript (`tsx` for running) |
| Frontend | React 19 + Vite + TypeScript |

## Key LangChain concepts covered

- **Document loaders** — `PDFLoader` to ingest PDF files
- **Text splitters** — `RecursiveCharacterTextSplitter` for chunking
- **Embeddings** — `OpenAIEmbeddings` for vector representations
- **Vector stores** — `MemoryVectorStore` for similarity search (MMR supported)
- **Agent middleware** — `dynamicSystemPromptMiddleware` for injecting retrieved context dynamically into the system prompt
- **Tool use** — `tool()` helper with Zod schemas for type-safe agent tools (`getWeather`, `sendEmail`)
- **LangGraph deployment** — `langgraph.json` wiring an exported agent graph for the LangGraph server
- **MCP integration** — MCP server example in `MCPServerEx.ts`
