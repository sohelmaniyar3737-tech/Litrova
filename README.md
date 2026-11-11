# Litrova — Where Books Come Alive

Litrova is a full-stack web-app starter for turning uploaded books and documents into conversational reading experiences.

## Product direction

- Warm editorial visual identity: Cream `#F5F0E6`, Olive Green `#69765D`, Black `#22221F`.
- Typography: Fraunces headings + DM Sans interface/body text.
- Collapsible desktop sidebar; slide-out mobile navigation.
- Global top bar with search, notifications, theme and profile controls.
- Selected-book workspace with horizontal Reader, Intelligence, Characters and Voice tabs.
- Primary app destinations: Dashboard, My Library, My Workspace and Settings. Reader and Intelligence are book-context routes; Characters and Voice are contextual studios.
- The CTA button styling adapts the shared Uiverse-inspired `.button-container` / `.button-border` idea. The earlier full source snippet was not present in the project files, so this is a Litrova-native adaptation rather than a byte-for-byte copy.

## Stack

- Frontend: React, Vite, React Router, Tailwind CSS, Framer Motion, Lucide icons
- Backend: Node.js, Express
- Database: Neon PostgreSQL + pgvector
- Auth: JWT + bcryptjs
- AI: Google Gemini via `@google/genai`
- PDF extraction: `pdf-parse`

## Requirements

- Node.js 20+
- Neon PostgreSQL project with pgvector available
- Gemini API key from Google AI Studio

## 1. Install

From the project root:

```bash
npm run install:all
```

## 2. Environment variables

Copy `server/.env.example` to `server/.env`, then set:

- `DATABASE_URL`: Neon connection string (use SSL as supplied by Neon)
- `JWT_SECRET`: long random secret
- `GEMINI_API_KEY`: your Gemini API key

Never put secrets in `client/` or commit `server/.env`.

## 3. Database setup

Open the Neon SQL Editor and run `server/sql/001_init.sql`.

This creates the pgvector extension and the users, books, chunks, conversations and messages tables.

## 4. Start the app

From the project root:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend health: http://localhost:5001/api/health

You can also run the frontend and backend separately:

```bash
npm run dev:client
npm run dev:server
```

## Current functional foundation

- Landing page and signup/login connected to the Express API
- JWT-protected user library
- PDF upload, text extraction, chunking and Gemini embeddings
- Neon pgvector storage and retrieval
- Book chat API with source/page references
- Library search, upload state and refresh
- Collapsible sidebar, mobile drawer, global book search (`Ctrl + K`), theme toggle
- Dashboard overview based on available library data
- Book-specific Reader, Intelligence, Character and Voice routes
- Notes can currently be saved in browser local storage from the Reader and viewed in My Workspace

## UI foundation vs connected functionality

The following screens are included as UI/UX foundations but are **not yet fully implemented as product features**:

- Reader Studio currently has a reading-workspace prototype and page controls; actual PDF rendering, text selection, highlights and PDF outline navigation still need integration.
- Character Studio is a planned UI. Character detection, relationship extraction and POV chat are not connected yet.
- Voice Studio is a planned UI. Microphone capture, speech-to-text, text-to-speech and real-time voice are not connected yet.
- My Workspace currently persists Reader notes in local storage. Cloud-synced bookmarks, highlights, saved AI answers and conversation history need backend endpoints.
- Dashboard conversation counts and reading activity are placeholders until those events are stored.
- Settings currently provides profile display and a working light/dark theme preference; additional account preferences are future work.

## Important limitations before public launch

This is a development starter, not a production-ready service. Before real users:

- Add rate limiting and per-user AI usage limits.
- Add background processing for large PDFs; current upload processing runs in the API request.
- Add OCR for scanned/image-only PDFs.
- Validate and test Gemini chat/embedding model availability and vector dimensions against your Neon schema.
- Add robust file validation, malware scanning, storage lifecycle and deletion handling.
- Add monitoring, backups, privacy policy, terms, abuse reporting and deployment secrets.
- Review authentication/session storage for production hardening; this starter uses a JWT client session and should be upgraded to secure HttpOnly cookies before launch.
- Run dependency audits and update packages deliberately; avoid force-upgrading dependencies without reviewing breaking changes.

## Project structure

```text
litrova/
  client/
    public/                 favicon and static assets
    src/
      App.jsx               routes, app shell and page components
      styles.css            Litrova design system and responsive styles
      lib/api.js            API/session helper
  server/
    src/
      config/               Neon and Gemini setup
      middleware/           JWT authentication
      routes/               auth, books and chat APIs
      services/              PDF extraction, embeddings and RAG
      utils/                 text chunking
    sql/                    database schema
```

## UI design notes

- Expanded sidebar: about 252px; collapsed: about 78px.
- Desktop content uses a sticky top bar and contextual book header.
- On mobile the sidebar becomes a drawer and book tabs scroll horizontally.
- Motion is intentionally subtle; avoid heavy animation that competes with reading.
- The current favicon is included at `client/public/litrova-favicon.png`.
