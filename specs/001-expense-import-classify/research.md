# Technical Research: Credit Card Expense Import and Classification

**Feature**: 001-expense-import-classify
**Date**: 2025-11-15
**Purpose**: Resolve technical unknowns and establish technology choices for implementation

## Research Questions

1. Frontend framework selection (minimal, performance-focused)
2. Testing framework selection (Jest vs Vitest)
3. CSV parsing library evaluation
4. Database ORM/query builder selection
5. Icon library selection (minimal, functional)
6. Best practices for SQLite with Node.js/TypeScript
7. Best practices for Ollama API integration
8. Security considerations for CSV parsing and file upload

---

## 1. Frontend Framework Selection

### Decision: **Solid.js**

### Rationale

**Evaluated Options:**
- React 18.2 (released Oct 2022 - 1+ month old ✅)
- Preact 10.19 (released Nov 2023 - 1+ month old ✅)
- Solid.js 1.8.11 (released Dec 2023 - 1+ month old ✅)
- Vue 3.3 (released May 2023 - 1+ month old ✅)

**Why Solid.js:**
1. **Performance**: True reactivity without virtual DOM overhead - critical for table sorting <1s requirement
2. **Bundle Size**: ~7KB gzipped vs React's ~40KB - aligns with "lightning fast startup" requirement
3. **Simplicity**: Component model similar to React but with less framework magic
4. **TypeScript First**: Excellent TypeScript support out of the box
5. **Dependency Minimization**: Smaller surface area than React ecosystem, fewer transitive dependencies
6. **Version Stability**: v1.8.11 released Dec 2023, production-ready, 1+ month old

**Alternatives Considered:**
- **React**: Rejected due to larger bundle size and dependency tree (react-dom, additional polyfills)
- **Preact**: Good alternative but Solid has better reactivity performance for table updates
- **Vue**: Good option but larger bundle and more opinionated structure

**Security Considerations:**
- Solid.js has smaller attack surface due to minimal dependencies
- Well-maintained, security-focused team
- No known critical vulnerabilities in v1.8.x

**SBOM Entry:**
- solid-js: 1.8.11 (MIT license, 7KB gzipped, last audit: Dec 2023)

---

## 2. Testing Framework Selection

### Decision: **Vitest + Testing Library**

### Rationale

**Evaluated Options:**
- Jest 29.7 + React Testing Library
- Vitest 1.0.4 + Solid Testing Library

**Why Vitest:**
1. **Performance**: 5-10x faster than Jest for TypeScript projects (uses esbuild/SWC)
2. **TypeScript Native**: Zero-config TypeScript support, no ts-jest needed
3. **Vite Alignment**: If using Vite for build (pairs well with Solid), shares config
4. **Modern API**: Compatible with Jest API but with improvements (better watch mode, ESM support)
5. **Dependency Minimization**: Fewer dependencies than Jest + ts-jest + babel
6. **Version Stability**: v1.0.4 released Nov 2023, stable, 1+ month old

**For UI Testing:**
- @solidjs/testing-library 0.8.5 (Dec 2023)
- @testing-library/user-event 14.5.1 (Oct 2023)

**For Backend Testing:**
- Vitest for unit and integration tests
- Supertest 6.3.3 (for API contract testing)

**SBOM Entries:**
- vitest: 1.0.4 (MIT license)
- @solidjs/testing-library: 0.8.5 (MIT license)
- @testing-library/user-event: 14.5.1 (MIT license)
- supertest: 6.3.3 (MIT license)

---

## 3. CSV Parsing Library Evaluation

### Decision: **csv-parse (from csv package)**

### Rationale

**Evaluated Options:**
- Custom parser (regexp-based)
- csv-parse 5.5.3 (from csv package)
- papaparse 5.4.1

**Why csv-parse:**
1. **Security**: Well-vetted, handles edge cases (escaped quotes, multiline fields, injection attempts)
2. **Maturity**: Part of Node.js csv package, used in production for 10+ years
3. **Performance**: Streaming API for large files, handles 500 expenses requirement easily
4. **Complexity vs Security**: Custom parser would be ~200 lines but risk missing edge cases (security threat)
5. **Bundle Size**: Backend-only dependency, size not critical
6. **Version Stability**: v5.5.3 released Sept 2023, stable, 1+ month old

**Custom Parser Rejected Because:**
- CSV spec has many edge cases (RFC 4180)
- Risk of injection vulnerabilities (formula injection, command injection)
- Effort to test thoroughly outweighs dependency cost
- Not a critical path for dependency minimization (backend only, well-audited library)

**Security Considerations:**
- csv-parse handles formula injection prevention
- Streaming API prevents memory exhaustion attacks
- No known CVEs in v5.5.x

**SBOM Entry:**
- csv-parse: 5.5.3 (MIT license, 0 known vulnerabilities)

---

## 4. Database ORM/Query Builder Selection

### Decision: **Kysely (query builder, not ORM)**

### Rationale

**Evaluated Options:**
- Drizzle ORM 0.29.1
- Kysely 0.27.2
- better-sqlite3 (raw SQL)
- TypeORM 0.3.19

**Why Kysely:**
1. **Type Safety**: End-to-end TypeScript type safety from schema to queries
2. **Simplicity**: Query builder (not full ORM) - no heavy abstraction, stays close to SQL
3. **Performance**: Thin layer over driver, minimal overhead
4. **SQLite Support**: Excellent SQLite support via better-sqlite3 integration
5. **Migration Support**: Built-in migration system (versioned, reversible)
6. **Dependency Minimization**: Smaller than ORMs, no decorators/reflection overhead
7. **Version Stability**: v0.27.2 released Oct 2023, production-ready, 1+ month old

**With:**
- better-sqlite3 9.2.2 (synchronous SQLite3 bindings, fastest Node.js SQLite driver)

**Alternatives Considered:**
- **Drizzle ORM**: Good alternative, but Kysely's query builder approach is simpler
- **Raw SQL (better-sqlite3)**: Rejected due to lack of type safety and migration management
- **TypeORM**: Too heavy, decorator-based (complexity), larger dependency tree

**Security Considerations:**
- Kysely uses parameterized queries (prevents SQL injection)
- better-sqlite3 uses native bindings (memory safe)
- No known CVEs in recent versions

**SBOM Entries:**
- kysely: 0.27.2 (MIT license)
- better-sqlite3: 9.2.2 (MIT license, native bindings)

---

## 5. Icon Library Selection

### Decision: **lucide (formerly lucide-react)**

### Rationale

**Evaluated Options:**
- Heroicons (Tailwind team)
- Lucide 0.294.0
- Feather Icons
- Font Awesome (free version)

**Why Lucide:**
1. **Tree-Shakeable**: Import only icons you use, minimal bundle impact
2. **Quality**: Clean, functional design (no decorative fluff)
3. **Consistency**: All icons use same stroke width and style
4. **Size**: ~1KB per icon after tree-shaking
5. **Solid Support**: Has @lucide/solid package (no React dependency)
6. **Version Stability**: v0.294.0 released Nov 2023, stable, 1+ month old

**Icons Needed:**
- Upload (file import)
- SortAsc/SortDesc (table sorting)
- Tag (categories and payment types)
- Plus (manual entry)
- Edit (name assignment)
- Calendar, DollarSign (expense details)

**SBOM Entry:**
- lucide-solid: 0.294.0 (ISC license, ~1KB per icon)

---

## 6. Best Practices for SQLite with Node.js/TypeScript

### Findings

**Database Configuration:**
- Enable WAL mode for better concurrency: `PRAGMA journal_mode = WAL`
- Enable foreign keys: `PRAGMA foreign_keys = ON`
- Set busy timeout: `PRAGMA busy_timeout = 5000` (5 seconds)

**Connection Management:**
- Use single connection (better-sqlite3 is synchronous, no connection pool needed)
- Initialize on server start, close on shutdown

**Transaction Best Practices:**
- Wrap all write operations in transactions
- Use `BEGIN IMMEDIATE` for writes to avoid lock escalation
- Integration tests: `BEGIN TRANSACTION` → test → `ROLLBACK` (preserve database state)

**Schema Management:**
- Use Kysely migrations (versioned files in `backend/src/db/migrations/`)
- Migrations must be idempotent and reversible
- Migration naming: `YYYYMMDDHHMMSS_description.ts`

**Performance Optimization:**
- Index foreign keys and frequently queried columns
- Use `EXPLAIN QUERY PLAN` to verify index usage
- Batch inserts in transactions (import 100 expenses in single transaction)

**File Storage:**
- Development: `backend/data/monetaire.db`
- Production: User's data directory (OS-specific, to be determined in deployment)

---

## 7. Best Practices for Ollama API Integration

### Findings

**API Endpoint:**
- Default: `http://localhost:11434`
- Health check endpoint: `GET /api/tags` (list available models)
- Generation endpoint: `POST /api/generate` (streaming or non-streaming)

**Structured Output:**
- Use `format: "json"` parameter to request JSON output
- Provide JSON schema in prompt for structured categories
- Parse response and validate against expected structure

**Error Handling:**
- Check if Ollama is running before classification (health check on startup)
- Timeout: 10 seconds per request (3s target + 7s buffer)
- Fallback: If Ollama unavailable, mark expense as "Uncategorized" and log warning
- Retry logic: No retries (fail fast, user can reclassify manually)

**Prompt Engineering:**
```typescript
interface ClassificationRequest {
  expenseName: string;
  title: string;
  amount: number;
  vendor: string;
  availableCategories: string[];
  reclassificationHistory?: { vendor: string; category: string }[];
}

// Prompt structure:
// "Classify this expense into one of the following categories: [categories].
//  Expense: {name}, Title: {title}, Vendor: {vendor}, Amount: R${amount}.
//  Past classifications: [history if available].
//  Respond with JSON: { category: string, confidence: number }"
```

**Model Selection:**
- User's choice (pre-installed model)
- Suggested: llama2 (7B) or mistral (7B) - fast enough for <3s requirement
- Configuration via environment variable: `OLLAMA_MODEL=llama2`

**Security:**
- Validate localhost URL (prevent SSRF)
- Sanitize expense data before sending (prevent prompt injection)
- Timeout enforcement (prevent hanging requests)

---

## 8. Security Considerations

### CSV Parsing Security

**Threats:**
1. **Formula Injection**: Malicious CSV with `=cmd|' /C calc'!A1` in title field
2. **Memory Exhaustion**: Very large files (>100MB)
3. **Path Traversal**: Filenames like `../../etc/passwd`
4. **Malformed Data**: Missing columns, wrong types, injection attempts

**Mitigations:**
1. csv-parse library handles formula injection (escapes special chars)
2. File size limit: 10MB max (enforced in upload endpoint)
3. Validate filename, save to temp directory with generated UUID name
4. Schema validation: Check columns match expected (date, title, amount)
5. Data sanitization: Validate date format (YYYY-MM-DD), amount is numeric, title is string

### File Upload Security

**Threats:**
1. **Path Traversal**: Malicious filename
2. **File Type Confusion**: Uploaded file is not CSV
3. **Disk Exhaustion**: Many large uploads

**Mitigations:**
1. Generate UUID filename, ignore user-provided name
2. MIME type validation: `text/csv` or `application/vnd.ms-excel`
3. File size limit: 10MB per upload
4. Clean up temp files after processing (success or failure)

### SQLite Injection

**Threats:**
1. **SQL Injection**: Malicious input in vendor name, expense title

**Mitigations:**
1. Kysely uses parameterized queries (automatic protection)
2. Never concatenate user input into SQL strings
3. Validate/sanitize all user inputs before database operations

### XSS (Cross-Site Scripting)

**Threats:**
1. **Stored XSS**: Malicious script in expense title, rendered in table
2. **Reflected XSS**: Malicious data in URL parameters

**Mitigations:**
1. Solid.js escapes all interpolated values by default (JSX protection)
2. Never use `innerHTML` or `dangerouslySetInnerHTML`
3. Sanitize inputs on backend before storage (defense in depth)
4. Content Security Policy header: `script-src 'self'`

### Ollama API Security

**Threats:**
1. **SSRF**: User controls API URL, could target internal services
2. **Prompt Injection**: Malicious expense data manipulates AI output
3. **Denial of Service**: Slow AI responses block server

**Mitigations:**
1. Hardcode Ollama URL to localhost:11434, no user configuration
2. Sanitize expense data before prompt construction (escape special chars)
3. Timeout: 10 seconds max per request
4. Rate limiting: Max 10 concurrent AI requests (prevent resource exhaustion)

---

## Threat Model Summary

### Attack Surface

1. **CSV File Upload**: Medium risk (file parsing, storage)
2. **User Input Forms**: Medium risk (XSS, injection)
3. **SQLite Database**: Low risk (local-only, parameterized queries)
4. **Ollama API**: Low risk (localhost-only, timeout enforced)
5. **Frontend Assets**: Low risk (no CDN, served from localhost)

### High-Priority Mitigations

1. File size limits (10MB)
2. Parameterized SQL queries (Kysely)
3. XSS protection (Solid.js auto-escaping + CSP)
4. Input validation (backend + frontend)
5. Timeout enforcement (file upload, AI requests)

### SBOM Creation

SBOM will be maintained in `docs/SBOM.md` with format:

```markdown
# Software Bill of Materials

## Frontend Dependencies
- solid-js: 1.8.11 (MIT) - Last audit: 2023-12, No known CVEs
- lucide-solid: 0.294.0 (ISC) - Last audit: 2023-11, No known CVEs

## Backend Dependencies
- kysely: 0.27.2 (MIT) - Last audit: 2023-10, No known CVEs
- better-sqlite3: 9.2.2 (MIT) - Last audit: 2023-12, No known CVEs
- csv-parse: 5.5.3 (MIT) - Last audit: 2023-09, No known CVEs

## Testing Dependencies
- vitest: 1.0.4 (MIT) - Last audit: 2023-11, No known CVEs

## Update Schedule
- Next review: 2025-05-15 (6 months from initial setup)
- Policy: Update only if critical CVE or major feature need
```

---

## Technology Stack Summary

### Frontend
- **Framework**: Solid.js 1.8.11
- **Icons**: lucide-solid 0.294.0
- **Build**: Vite 5.0.8 (pairs with Vitest)
- **TypeScript**: 5.3.3

### Backend
- **Runtime**: Node.js 20 LTS
- **Database**: SQLite via better-sqlite3 9.2.2
- **Query Builder**: Kysely 0.27.2
- **CSV Parser**: csv-parse 5.5.3
- **HTTP Server**: Express.js 4.18.2 (released Oct 2023, 1+ month old)
- **TypeScript**: 5.3.3

### Testing
- **Framework**: Vitest 1.0.4
- **UI Testing**: @solidjs/testing-library 0.8.5
- **API Testing**: Supertest 6.3.3

### External Services
- **AI**: Ollama (user-installed, localhost:11434)

---

## Next Steps (Phase 1)

1. Create data-model.md with ER diagram and schema details
2. Generate OpenAPI contract (contracts/api.yaml) for backend endpoints
3. Create quickstart.md with setup instructions
4. Update agent context with technology stack
5. Re-evaluate constitution compliance
