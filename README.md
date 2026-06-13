# 🐜 Ant Flow Task Management Application

A modern full-stack task management platform featuring a premium SaaS experience, playful productivity-focused animations, and a subtle ant-colony inspired interaction system.

---

## Tech Stack

| Layer      | Technology                                        |
| ---------- | ------------------------------------------------- |
| Frontend   | Next.js 16.2, TypeScript, Tailwind CSS, ShadCN UI |
| Animations | Framer Motion                                     |
| State      | TanStack Query, Zustand                           |
| Forms      | React Hook Form + Zod                             |
| Backend    | Go 1.22 + Gin                                     |
| Auth       | JWT (access + refresh tokens)                     |
| Database   | PostgreSQL 16                                     |
| DevOps     | Docker Compose, GitHub Actions                    |

---

## Project Structure

```
task_management/
├── backend/              # Go + Gin API server
│   ├── cmd/server/       # Entry point
│   ├── internal/
│   │   ├── config/       # App configuration
│   │   ├── database/     # DB connection + migrations
│   │   ├── handlers/     # HTTP handlers
│   │   ├── middleware/   # Auth, CORS, logging
│   │   ├── models/       # Domain models
│   │   ├── repository/   # DB queries
│   │   └── services/     # Business logic
│   ├── migrations/       # SQL migrations
│   └── tests/            # Integration tests
├── frontend/             # Next.js 14 App Router
│   └── src/
│       ├── app/          # Pages & routing
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # API client, utils
│       ├── store/        # Zustand stores
│       └── types/        # TypeScript types
└── .github/workflows/    # CI/CD pipelines
```

---

## Prerequisites

- Go 1.22+
- Node.js 22 (LTS) — Next.js 16 requires ≥20.9
- Docker + Docker Compose
- PostgreSQL 16 (or use Docker)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Fa-had/task_management.git
cd task_management
```

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
```

Edit both `.env` files with your values.

### 3. Start PostgreSQL (via Docker)

```bash
docker compose up -d postgres
```

### 4. Run the backend

```bash
cd backend
go mod download
make migrate   # Run DB migrations
go mod tidy
make dev       # Start dev server (hot reload via air)
```

Backend runs at: `http://localhost:8080`

### 5. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## API Reference

### Auth

| Method | Endpoint      | Description          |
| ------ | ------------- | -------------------- |
| POST   | /auth/signup  | Register new user    |
| POST   | /auth/login   | Login + get tokens   |
| POST   | /auth/refresh | Refresh access token |
| POST   | /auth/logout  | Invalidate tokens    |

### Tasks (all protected — require `Authorization: Bearer <token>`)

| Method | Endpoint   | Description                             |
| ------ | ---------- | --------------------------------------- |
| GET    | /tasks     | List tasks (search, filter, sort, page) |
| POST   | /tasks     | Create a task                           |
| GET    | /tasks/:id | Get a single task                       |
| PATCH  | /tasks/:id | Update a task                           |
| DELETE | /tasks/:id | Delete a task                           |

### Query Parameters for `GET /tasks`

| Param    | Type   | Example               |
| -------- | ------ | --------------------- |
| page     | int    | `?page=1`             |
| limit    | int    | `?limit=10`           |
| search   | string | `?search=implement`   |
| status   | string | `?status=in_progress` |
| priority | string | `?priority=high`      |
| sort_by  | string | `?sort_by=due_date`   |
| order    | string | `?order=asc`          |

---

## Running Tests

```bash
# Backend tests
cd backend && make test

# Frontend tests
cd frontend && npm test
```

---

## Assumptions & Architecture Decisions

1. **Monorepo structure** — Backend and frontend coexist in one repo for easier review and atomic commits across the stack.
2. **Go + Gin over NestJS** — Go gives better performance, type safety, and is more idiomatic for REST APIs at this scale.
3. **Layered architecture** — `handler → service → repository` keeps each layer independently testable.
4. **JWT with refresh tokens** — Access tokens expire in 15 min; refresh tokens in 7 days, stored in httpOnly cookies.
5. **TanStack Query for server state** — Separates server state (tasks) from UI state (modals, filters) cleanly.
6. **Optimistic updates** — Task completions and deletions update the UI immediately; roll back on API failure.

## Trade-Offs

- **No WebSockets in v1** — Real-time updates are a bonus feature; polling via TanStack Query refetch is used instead.
- **No file attachments in v1** — S3/storage integration was descoped to keep the core solid.
- **Role-based access (admin)** — Data model supports roles; admin UI is scaffolded but not fully built.

## Future Improvements

- WebSocket-based live collaboration
- Task attachments
- Full admin dashboard
- Email notifications (task due reminders)
- Rate limiting and API key management
