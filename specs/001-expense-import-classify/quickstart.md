# Quickstart Guide: Credit Card Expense Import and Classification

**Feature**: 001-expense-import-classify
**Date**: 2025-11-15
**Purpose**: Setup instructions and development workflow guide

## Prerequisites

### System Requirements

- **Node.js**: 20 LTS (20.10.0 or later)
- **npm**: 10.2.0 or later (comes with Node.js)
- **Ollama**: Installed and running (for AI classification)
- **Operating System**: macOS or Linux (Unix-based)

### Verify Prerequisites

```bash
# Check Node.js version
node --version  # Should be v20.x.x

# Check npm version
npm --version   # Should be 10.x.x

# Check Ollama is running
curl http://localhost:11434/api/tags
# Should return JSON with available models
```

### Install Ollama (if not installed)

```bash
# macOS
brew install ollama

# Linux
curl https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Pull a model (in another terminal)
ollama pull llama2  # or mistral
```

---

## Project Setup

### 1. Initialize Backend

```bash
# Navigate to project root
cd /Users/arthur.rodrigues/Projects/Monetaire.V3

# Create backend directory structure
mkdir -p backend/src/{models,services,api,db/{migrations,seeds},utils}
mkdir -p backend/tests/{integration,contract,unit}
mkdir -p backend/data

# Initialize backend package
cd backend
npm init -y

# Install dependencies (versions from research.md)
npm install --save \
  express@4.18.2 \
  kysely@0.27.2 \
  better-sqlite3@9.2.2 \
  csv-parse@5.5.3 \
  cors@2.8.5

# Install dev dependencies
npm install --save-dev \
  typescript@5.3.3 \
  @types/node@20.10.5 \
  @types/express@4.17.21 \
  @types/better-sqlite3@7.6.8 \
  vitest@1.0.4 \
  supertest@6.3.3 \
  @types/supertest@6.0.2 \
  tsx@4.7.0

# Go back to project root
cd ..
```

### 2. Initialize Frontend

```bash
# Create frontend directory
mkdir -p frontend/src/{components,pages,services,types}
mkdir -p frontend/tests/{integration,unit}

# Initialize frontend with Vite + Solid
cd frontend
npm create vite@latest . -- --template solid-ts

# Install additional dependencies
npm install --save \
  solid-js@1.8.11 \
  lucide-solid@0.294.0

# Install dev dependencies
npm install --save-dev \
  vitest@1.0.4 \
  @solidjs/testing-library@0.8.5 \
  @testing-library/user-event@14.5.1

# Go back to project root
cd ..
```

### 3. Initialize Shared Types

```bash
# Create shared types directory
mkdir -p shared/types

# Initialize shared package
cd shared
npm init -y

# Install TypeScript
npm install --save-dev typescript@5.3.3

# Go back to project root
cd ..
```

---

## Configuration

### Backend Configuration

**File**: `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**File**: `backend/package.json` (add scripts)

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run tests/integration",
    "test:unit": "vitest run tests/unit",
    "test:contract": "vitest run tests/contract",
    "migrate:latest": "tsx src/db/migrate.ts up",
    "migrate:down": "tsx src/db/migrate.ts down",
    "migrate:status": "tsx src/db/migrate.ts status"
  }
}
```

**File**: `backend/.env` (create this file)

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DATABASE_PATH=./data/monetaire.db

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# File Upload Configuration
MAX_FILE_SIZE_MB=10
UPLOAD_TEMP_DIR=./data/uploads

# Logging
LOG_LEVEL=debug
```

### Frontend Configuration

**File**: `frontend/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

**File**: `frontend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Database Setup

### Initialize Database

**File**: `backend/src/db/database.ts`

```typescript
import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/monetaire.db');

export const db = new Kysely({
  dialect: new SqliteDialect({
    database: new Database(dbPath),
  }),
});

// Enable SQLite optimizations
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');
```

### Run Initial Migration

```bash
cd backend

# Create migration file (will be populated with schema from data-model.md)
npm run migrate:latest

# Verify database created
ls -lh data/monetaire.db
```

---

## Development Workflow

### Start Development Servers

**Terminal 1**: Backend server

```bash
cd backend
npm run dev

# Should see:
# > Server running on http://localhost:3000
# > Database connected: ./data/monetaire.db
```

**Terminal 2**: Frontend dev server

```bash
cd frontend
npm run dev

# Should see:
# > Local: http://localhost:5173/
```

**Terminal 3**: Ollama service (if not already running)

```bash
ollama serve

# Should see:
# > Ollama server listening on http://localhost:11434
```

### Verify Setup

1. **Check backend API**: Visit `http://localhost:3000/api/categories`
   - Should return JSON with 7 predefined categories

2. **Check frontend**: Visit `http://localhost:5173`
   - Should see expense table UI (empty initially)

3. **Check Ollama**: Run `curl http://localhost:11434/api/tags`
   - Should return list of installed models

---

## Testing Setup

### Backend Tests

**File**: `backend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

**File**: `backend/tests/setup.ts`

```typescript
import { beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';

// Use in-memory database for tests
const testDb = new Database(':memory:');

beforeEach(() => {
  // Run migrations on test database
  // (will be implemented in migration files)
});

afterEach(() => {
  // Clean up test data (or use transactions with rollback)
});
```

### Frontend Tests

**File**: `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

### Run Tests

```bash
# Backend tests
cd backend
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:contract     # API contract tests only

# Frontend tests
cd frontend
npm run test              # Run all tests
```

---

## First Feature Test (Sanity Check)

### 1. Create Sample CSV

**File**: `backend/data/sample_nubank.csv`

```csv
date,title,amount
2025-10-10,"IOF de ""Rch-Kagi.Com""",1.94
2025-10-10,Mp \*Wshpatinetes,10.27
2025-10-10,Rch-Kagi.Com,55.68
2025-10-11,Subway,25.50
2025-10-12,Amazon Marketplace - Parcela 1/3,45.99
```

### 2. Import via API

```bash
curl -X POST http://localhost:3000/api/import/csv \
  -F "file=@backend/data/sample_nubank.csv"

# Should return:
# {
#   "sessionId": 1,
#   "imported": 5,
#   "failed": 0,
#   "classificationSummary": {
#     "deterministic": 0,
#     "ai": 0,
#     "uncategorized": 5
#   }
# }
```

### 3. Verify in UI

Visit `http://localhost:5173` and verify:
- 5 expenses appear in table
- All columns display correctly (date, title, amount, etc.)
- Table sorting works (click column headers)

### 4. Classify an Expense

```bash
# Classify first expense (ID=1)
curl -X POST http://localhost:3000/api/classification/classify \
  -H "Content-Type: application/json" \
  -d '{"expenseId": 1}'

# Should return suggested category from AI
```

---

## TDD Workflow

### Red-Green-Refactor Cycle

**Example: Adding expense manual entry**

#### 1. RED - Write failing test first

**File**: `backend/tests/integration/manual-expense.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { testDb, seedCategories } from '../helpers';
import { createManualExpense } from '../../src/services/expense-service';

describe('Manual Expense Entry', () => {
  beforeEach(async () => {
    await testDb.beginTransaction();
    await seedCategories(testDb);
  });

  afterEach(async () => {
    await testDb.rollback();
  });

  it('should create manual expense with all required fields', async () => {
    const expense = await createManualExpense({
      date: '2025-10-15',
      title: 'PIX to João Silva',
      amount: 1200.0,
      paymentType: 'pix',
      categoryId: 5, // Housing
    });

    expect(expense).toBeDefined();
    expect(expense.source).toBe('manual');
    expect(expense.amount).toBe(1200.0);
    expect(expense.category.name).toBe('Housing');
  });
});
```

#### 2. Run test - should FAIL

```bash
cd backend
npm run test:integration

# Should see RED (test fails - function not implemented)
```

#### 3. GREEN - Implement minimal code to pass

**File**: `backend/src/services/expense-service.ts`

```typescript
export async function createManualExpense(data: CreateExpenseDTO): Promise<Expense> {
  // Implementation here
  // ... minimal code to make test pass
}
```

#### 4. Run test - should PASS

```bash
npm run test:integration

# Should see GREEN (test passes)
```

#### 5. REFACTOR - Improve code quality

Refactor service code, run tests again to ensure they still pass.

---

## Security Checklist (Per Constitution)

### Before Merging Any Code

- [ ] All SQL queries use parameterized queries (Kysely handles this)
- [ ] File uploads have size limits (10MB max)
- [ ] Input validation on all API endpoints
- [ ] XSS protection (Solid.js auto-escaping + CSP header)
- [ ] CSV parsing uses csv-parse library (not custom regex)
- [ ] Ollama URL is hardcoded to localhost (no user config)
- [ ] No sensitive data in logs (sanitize expense titles)
- [ ] SBOM updated with new dependencies
- [ ] Threat model updated if adding new attack surface

---

## Common Commands

### Backend

```bash
# Development
npm run dev                 # Start dev server with hot reload
npm run build              # Compile TypeScript to JavaScript
npm run start              # Run production build

# Testing
npm run test               # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:integration   # Integration tests only
npm run test:unit          # Unit tests only
npm run test:contract      # API contract tests only

# Database
npm run migrate:latest     # Run all pending migrations
npm run migrate:down       # Rollback last migration
npm run migrate:status     # Show migration status
```

### Frontend

```bash
# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run preview            # Preview production build

# Testing
npm run test               # Run all tests
npm run test:watch         # Run tests in watch mode
```

---

## Troubleshooting

### Database Locked Error

**Symptom**: `Error: database is locked`

**Solution**: Ensure only one process accesses database, or increase busy_timeout:

```typescript
sqlite.pragma('busy_timeout = 10000'); // 10 seconds
```

### Ollama Not Responding

**Symptom**: `Error: connect ECONNREFUSED 127.0.0.1:11434`

**Solution**: Start Ollama service:

```bash
ollama serve
```

Verify with: `curl http://localhost:11434/api/tags`

### CSV Import Fails

**Symptom**: `400 Bad Request - Invalid CSV format`

**Solution**: Verify CSV format matches Nubank structure:

```csv
date,title,amount
YYYY-MM-DD,"Title with ""escaped quotes""",123.45
```

### Frontend Can't Reach Backend

**Symptom**: `Network Error` in browser console

**Solution**: Check Vite proxy config in `vite.config.ts`:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

Ensure backend is running on port 3000.

---

## Next Steps

1. **Review**: Read data-model.md for database schema
2. **Review**: Read contracts/api.yaml for API specification
3. **Implement**: Run `/speckit.tasks` to generate implementation tasks
4. **TDD**: Write tests FIRST for each task, then implement

---

## Resources

### Documentation

- **Solid.js**: https://www.solidjs.com/docs/latest
- **Kysely**: https://kysely.dev/docs/intro
- **Vitest**: https://vitest.dev/guide/
- **Ollama**: https://ollama.ai/docs

### Project Structure Reference

```
Monetaire.V3/
├── backend/
│   ├── src/
│   │   ├── models/        # Database models (Kysely types)
│   │   ├── services/      # Business logic
│   │   ├── api/           # Express routes
│   │   ├── db/            # Database setup, migrations
│   │   └── utils/         # Helpers (CSV parser, logging)
│   ├── tests/
│   │   ├── integration/   # User journey tests
│   │   ├── contract/      # API contract tests
│   │   └── unit/          # Service/util unit tests
│   └── data/              # SQLite database, uploads
├── frontend/
│   ├── src/
│   │   ├── components/    # Solid components
│   │   ├── pages/         # Page components
│   │   └── services/      # API client
│   └── tests/
├── shared/
│   └── types/             # Shared TypeScript types
└── specs/
    └── 001-expense-import-classify/
        ├── plan.md
        ├── spec.md
        ├── research.md
        ├── data-model.md
        ├── quickstart.md (this file)
        └── contracts/
            └── api.yaml
```

---

## Support

For questions or issues:
1. Review constitution.md for project principles
2. Check data-model.md for database schema questions
3. Check contracts/api.yaml for API endpoint details
4. Review research.md for technology decisions and rationale
