# AI-Powered Knowledge Quiz Builder

This is my MVP submission for the take-home assignment.

It generates quizzes from a user topic using Gemini, supports taking and submitting quizzes, and stores quiz history/results per user.
I also added Wikipedia context to improve factual grounding.

## What is implemented

- Web interface (React + Vite)
- Topic-based quiz generation
- Exactly 5 multiple-choice questions (A-D), one correct answer each
- Quiz submission with score and per-question review
- Correct answers and explanations in results
- Quiz history and detailed review pages
- JWT auth (register/login) so data is scoped per user

## Stack

- Frontend: React, Vite
- Backend: Node.js, Express
- Database: MySQL
- AI: Google Gemini (`@google/generative-ai`)
- Retrieval: Wikipedia API

## Run locally

### 1) Database

```bash
mysql -u root -p < database/schema.sql
```

Note: this script recreates `quiz_app`.

### 2) Backend

```bash
cd backend
cp .env.example .env
# fill MYSQL_*, GEMINI_API_KEY, JWT_SECRET in .env
npm install
npm run dev
```

Backend runs on `http://localhost:3001`.

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Core API (backend)

Base URL: `http://localhost:3001/api`

- `GET /api` — short JSON overview (open in browser)
- `GET /api/health` — liveness check

Paths below are under `/api` (e.g. full path `POST http://localhost:3001/api/auth/login`).

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /quizzes` - generate quiz from `{ topic }`
- `GET /quizzes` - quiz history for current user
- `GET /quizzes/:quizId/questions` - questions/options for taking
- `POST /quizzes/:quizId/submissions` - submit answers
- `GET /quizzes/:quizId` - full quiz detail/review

Quiz routes require `Authorization: Bearer <token>`.

## Architecture decisions

- I used a simple layered structure: routes -> controllers -> services -> models.
- Controllers are thin; business logic lives in services.
- `quizService` orchestrates flow (Wikipedia + AI + persistence).
- `aiService` handles prompt, Gemini call, JSON parsing, and output validation.
- Models isolate SQL and keep DB operations in one place.

This made it easier to iterate quickly while keeping code understandable.

## AI / RAG approach

- `wikipediaService` fetches a short context extract for the topic.
- `aiService` injects that context into the Gemini prompt.
- AI output is validated server-side to enforce:
  - 5 questions
  - A-D options
  - single valid correct answer

If output is malformed, the API returns a structured error instead of saving bad data.

## Tradeoffs and limitations

- I prioritized backend correctness and modularity over advanced UI features.
- No automated test suite yet.
- Basic quota/retry handling is present, but not full production-grade rate limiting.

## Project structure

```text
quiz/
├── backend/
├── frontend/
└── database/
```