<div align="center">

# ⚡ DevPulse AI

### AI-Powered Developer Productivity Dashboard

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<br/>

> **Track your GitHub activity, manage tasks with drag-and-drop Kanban, visualize coding analytics, and discover top developers — all in one sleek, dark-mode-first dashboard.**

<br/>

![DevPulse Dashboard Preview](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=600&fit=crop&q=80)

</div>

---

## ✨ Features

### 🏠 Live GitHub Dashboard
- Pulls your GitHub profile, repositories, recent commits, and language stats in real time using the GitHub REST API (unauthenticated, no token required)
- Displays followers, public repos, starred repos, and contribution activity
- Language distribution pie chart with color-coded breakdowns
- Productivity score calculated from commit frequency and repo health

### 🔍 Developer Search
- Debounced GitHub user search with instant results
- Paginated results with user cards showing avatar, bio, and key stats
- **Favorite** any developer — saved permanently to PostgreSQL via the REST API
- One-click removal from favorites with optimistic UI updates

### 📋 Kanban Task Board
- Three-column board: **To Do → In Progress → Completed**
- **Drag-and-drop** reordering within and between columns (powered by `@dnd-kit`)
- Create, edit, and delete tasks with title, description, priority, and tags
- Priority badges: Low / Medium / High with color coding
- Task stats bar showing counts per column and overall completion rate

### 📊 Analytics & Charts
- Commit activity timeline (last 12 months)
- Repository growth curve
- Language usage bar chart
- Contribution heatmap
- All charts built with **Recharts** — responsive and animated

### 🌓 Dark / Light Theme
- System-preference aware with manual override
- Smooth transitions powered by `next-themes`
- Electric purple accent color throughout
- Fully accessible contrast ratios

### 🔐 Auth Flow (localStorage)
- Register and login with email + password (≥ 6 chars)
- Sessions persist across page refreshes via localStorage
- Demo Login button for instant access — no signup required
- Protected routes redirect unauthenticated users to `/login`

---

## 🏗️ Architecture

```
devpulse-ai/
├── artifacts/
│   ├── devpulse/              # React + Vite frontend SPA
│   │   └── src/
│   │       ├── pages/         # Dashboard, Search, Tasks, Analytics, Settings, Login, Register
│   │       ├── components/    # Layout, UI primitives, common helpers
│   │       ├── services/      # github.ts — GitHub REST API helpers
│   │       ├── store/         # Zustand store (auth + UI state)
│   │       └── App.tsx        # Wouter router + lazy-loaded pages
│   │
│   └── api-server/            # Express 5 REST API
│       └── src/
│           ├── routes/
│           │   ├── tasks.ts   # Full CRUD + /tasks/stats
│           │   └── favorites.ts # GET, POST (upsert), DELETE
│           └── app.ts         # CORS, logging, middleware
│
└── lib/
    ├── db/                    # Drizzle ORM + PostgreSQL schema
    │   └── src/schema/
    │       ├── tasks.ts       # tasksTable
    │       └── favorites.ts   # favoriteDevelopersTable
    ├── api-spec/              # OpenAPI 3.1 specification (source of truth)
    ├── api-client-react/      # Auto-generated TanStack Query hooks (via Orval)
    └── api-zod/               # Auto-generated Zod validation schemas (via Orval)
```

### Data Flow

```
GitHub REST API ──────────────────────► Frontend (React)
                                              │
                         ┌────────────────────┤
                         ▼                    ▼
                   Tasks CRUD          Favorites CRUD
                         │                    │
                         └────────┬───────────┘
                                  ▼
                          Express API Server
                                  │
                                  ▼
                          PostgreSQL (Drizzle ORM)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 5 |
| **Styling** | Tailwind CSS 3, Radix UI primitives |
| **Routing** | Wouter (lightweight client-side routing) |
| **State** | Zustand (global), TanStack Query (server state) |
| **Charts** | Recharts |
| **Animation** | Framer Motion |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |
| **Theme** | next-themes |
| **Backend** | Express 5, TypeScript |
| **Database** | PostgreSQL 16 + Drizzle ORM |
| **Validation** | Zod (auto-generated from OpenAPI spec) |
| **API Client** | Orval codegen → TanStack Query hooks |
| **Logging** | Pino + pino-http |
| **Monorepo** | pnpm workspaces |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** 16+

### 1. Clone the repo

```bash
git clone https://github.com/2003mahi/DevPulse-AI.git
cd DevPulse-AI
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

Create a `.env` file at the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/devpulse

# Session
SESSION_SECRET=your-super-secret-session-key-min-32-chars

# Frontend (optional — defaults to localhost:3001)
VITE_API_BASE_URL=http://localhost:3001
```

### 4. Set up the database

```bash
# Push the schema to PostgreSQL
pnpm --filter @workspace/db run db:push
```

### 5. Start the dev servers

```bash
# Terminal 1 — API server (port 3001)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5173)
pnpm --filter @workspace/devpulse run dev
```

Open [http://localhost:5173](http://localhost:5173) and click **Demo Login**.

---

## 📡 API Reference

The API is defined in `lib/api-spec/openapi.yaml` and auto-generates client hooks and Zod validators via Orval.

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/tasks/stats` | Task counts per column |

### Favorites

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/favorites` | List saved developers |
| `POST` | `/api/favorites` | Save / upsert a developer |
| `DELETE` | `/api/favorites/:githubLogin` | Remove a developer |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/healthz` | Service health check |

---

## 🗄️ Database Schema

### `tasks`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `title` | `text` | Required |
| `description` | `text` | Optional |
| `column` | `enum` | `todo` \| `in_progress` \| `completed` |
| `priority` | `enum` | `low` \| `medium` \| `high` |
| `tags` | `text[]` | Array of tag strings |
| `position` | `integer` | Sort order within column |
| `createdAt` | `timestamp` | Auto-set |
| `updatedAt` | `timestamp` | Auto-updated |

### `favorite_developers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Primary key |
| `githubLogin` | `text` | Unique GitHub username |
| `avatarUrl` | `text` | Profile image URL |
| `name` | `text` | Display name |
| `bio` | `text` | Profile bio |
| `followers` | `integer` | Follower count |
| `publicRepos` | `integer` | Public repository count |
| `savedAt` | `timestamp` | When the user favorited them |

---

## 📁 Key Source Files

```
artifacts/devpulse/src/
├── App.tsx                        # Root router + lazy loading
├── store/store.ts                 # Zustand: auth state, sidebar
├── services/github.ts             # GitHub REST API helpers
├── pages/
│   ├── Dashboard.tsx              # Live GitHub stats + charts
│   ├── Search.tsx                 # Developer search + favorites
│   ├── Tasks.tsx                  # Kanban board
│   ├── Analytics.tsx              # Recharts analytics
│   ├── Settings.tsx               # Profile + theme settings
│   ├── Login.tsx                  # Auth with Demo Login
│   └── Register.tsx               # New account flow
└── components/
    ├── layout/AppLayout.tsx       # Sidebar + auth guard
    └── common/ThemeToggle.tsx     # Dark/light switcher

artifacts/api-server/src/
├── app.ts                         # Express setup, middleware, CORS
├── index.ts                       # Server entry point
└── routes/
    ├── index.ts                   # Route aggregator
    ├── tasks.ts                   # Task CRUD handlers
    └── favorites.ts               # Favorites CRUD handlers

lib/
├── db/src/schema/
│   ├── tasks.ts                   # Drizzle tasks table
│   └── favorites.ts               # Drizzle favorites table
├── api-spec/openapi.yaml          # OpenAPI 3.1 source of truth
├── api-client-react/src/generated/api.ts   # Auto-generated hooks
└── api-zod/src/generated/api.ts            # Auto-generated Zod schemas
```

---

## 🔧 Development Scripts

```bash
# Install all workspace dependencies
pnpm install

# Run the frontend dev server
pnpm --filter @workspace/devpulse run dev

# Run the API server
pnpm --filter @workspace/api-server run dev

# Push DB schema (Drizzle)
pnpm --filter @workspace/db run db:push

# Open Drizzle Studio (DB GUI)
pnpm --filter @workspace/db run db:studio

# Regenerate API client + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run generate
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [GitHub REST API](https://docs.github.com/en/rest) — public developer data
- [Radix UI](https://www.radix-ui.com/) — accessible UI primitives
- [Drizzle ORM](https://orm.drizzle.team/) — TypeScript-first ORM
- [TanStack Query](https://tanstack.com/query) — powerful async state management
- [dnd kit](https://dndkit.com/) — modern drag-and-drop
- [Recharts](https://recharts.org/) — composable charting library
- [Framer Motion](https://www.framer.com/motion/) — production-ready animations

---

<div align="center">

**Built with ❤️ by [2003mahi](https://github.com/2003mahi)**

⭐ Star this repo if you found it useful!

</div>
