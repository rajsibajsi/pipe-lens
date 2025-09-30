# Development Guide

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose (for local MongoDB)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start MongoDB

```bash
docker compose up -d
```

This will start:
- MongoDB on `localhost:27017`
- Mongo Express (web UI) on `http://localhost:8081`

Default credentials:
- Username: `admin`
- Password: `password`

### 3. Configure Environment Variables

**Frontend (`apps/web/.env`):**
```bash
# No environment variables needed yet
```

**Backend (`apps/api/.env`):**
```bash
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@localhost:27017/pipe-lens?authSource=admin
JWT_SECRET=your-secret-key-change-in-production
```

### 4. Run Development Servers

**Run all apps:**
```bash
pnpm dev
```

**Run specific app:**
```bash
# Frontend only
pnpm --filter @pipe-lens/web dev

# Backend only
pnpm --filter @pipe-lens/api dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Mongo Express: http://localhost:8081

## Project Structure

```
pipe-lens/
├── apps/
│   ├── web/           # SvelteKit frontend
│   └── api/           # Node.js/Express backend
├── packages/          # Shared packages (future)
├── docs/              # Documentation
├── .husky/            # Git hooks
└── docker-compose.yml # Local MongoDB setup
```

## Available Scripts

**Root:**
- `pnpm dev` - Start all development servers
- `pnpm build` - Build all apps
- `pnpm test` - Run all tests
- `pnpm lint` - Lint all code
- `pnpm format` - Format code with Prettier

**Frontend (`apps/web`):**
- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run Vitest unit tests
- `pnpm test:e2e` - Run Playwright E2E tests
- `pnpm check` - Check TypeScript and Svelte

**Backend (`apps/api`):**
- `pnpm dev` - Start with hot reload (tsx watch)
- `pnpm build` - Compile TypeScript
- `pnpm start` - Run compiled JavaScript
- `pnpm test` - Run tests

## Testing

### Unit Tests (Vitest)
```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm --filter @pipe-lens/web test:watch
```

### E2E Tests (Playwright)
```bash
# Install Playwright browsers (first time only)
cd apps/web
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e
```

## Code Quality

### Pre-commit Hooks

Husky is configured to run lint-staged on commit:
- ESLint fixes
- Prettier formatting

### Manual Checks

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format

# Type check frontend
cd apps/web
pnpm check
```

## Database Management

### View Database
Access Mongo Express at http://localhost:8081

### Reset Database
```bash
docker compose down -v
docker compose up -d
```

### Backup/Restore
```bash
# Backup
docker exec pipe-lens-mongodb mongodump --out /dump

# Restore
docker exec pipe-lens-mongodb mongorestore /dump
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5173 (frontend)
lsof -ti:5173 | xargs kill -9

# Find process using port 3001 (backend)
lsof -ti:3001 | xargs kill -9
```

### Clear Node Modules
```bash
# Remove all node_modules
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +

# Reinstall
pnpm install
```

### MongoDB Connection Issues
```bash
# Check MongoDB logs
docker logs pipe-lens-mongodb

# Restart MongoDB
docker compose restart mongodb
```

## Phase 0 Checklist

- [x] Monorepo structure with pnpm workspaces
- [x] SvelteKit frontend scaffolding
- [x] Node.js/Express backend scaffolding
- [x] ESLint and Prettier configuration
- [x] Husky pre-commit hooks
- [x] Tailwind CSS setup
- [x] Vitest and Playwright setup
- [x] Docker Compose for MongoDB
- [x] Database schema design

**Next: Phase 1 - Core Pipeline Builder**