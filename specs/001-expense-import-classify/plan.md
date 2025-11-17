# Implementation Plan: Credit Card Expense Import and Classification

**Branch**: `001-expense-import-classify` | **Date**: 2025-11-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-expense-import-classify/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature enables users to import credit card expense data from CSV files (Nubank format), visualize expenses in a sortable table, assign meaningful names to expenses, and automatically classify them into categories using deterministic rules and local AI assistance. The system learns from user corrections to improve classification accuracy over time. Technical approach: TypeScript/Node.js web application running on localhost with SQLite database, Express.js backend, and modern frontend framework (to be determined in research). AI classification via Ollama local service.

## Technical Context

**Language/Version**: TypeScript 5.3+, Node.js 20 LTS
**Primary Dependencies**: Solid.js 1.8.11 (frontend), Kysely 0.27.2 (query builder), Express.js 4.18.2 (backend), better-sqlite3 9.2.2, csv-parse 5.5.3
**Storage**: SQLite (lightweight, cross-platform, zero-config) via better-sqlite3
**Testing**: Vitest 1.0.4 (unit/integration), @solidjs/testing-library 0.8.5 (UI), Supertest 6.3.3 (API contracts)
**Target Platform**: localhost web application (Unix systems primary, macOS/Linux)
**Project Type**: web (frontend + backend)
**Performance Goals**: Import 100 expenses in <5s, table sorting <1s, AI classification <3s per expense, startup <2s
**Constraints**: Local-only (no network except Ollama localhost API), database transactions for rollback testing, handle 500 expenses without degradation
**Scale/Scope**: Single user, ~500 expenses per month, 7+ categories, unlimited vendor history

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Test-First Development (TDD) - NON-NEGOTIABLE
- ✅ **Compliant**: Feature spec has detailed acceptance scenarios ready for test writing
- ✅ **Compliant**: Integration tests will rollback database changes (SQLite transaction support)
- ✅ **Compliant**: UI tests will verify contracts and validation, not implementation
- ✅ **Compliant**: Classification logic (deterministic + AI) will have comprehensive unit tests
- ⚠️ **Action Required**: Must write tests FIRST before implementation in Phase 2 (tasks.md)

### II. Security & Privacy First
- ✅ **Compliant**: All data stored in local SQLite database only
- ✅ **Compliant**: No cloud services or external APIs (except Ollama on localhost)
- ⚠️ **Action Required**: Must version-pin frontend dependencies (at least 1 month old)
- ⚠️ **Action Required**: Must create threat model document covering CSV parsing, file upload, AI integration
- ⚠️ **Action Required**: Must create SBOM documenting all dependencies with versions

### III. Local-First Architecture
- ✅ **Compliant**: SQLite is lightweight, cross-platform, zero-config
- ✅ **Compliant**: No cloud dependencies, runs entirely on localhost
- ✅ **Compliant**: Ollama AI service runs locally on user's machine
- ✅ **Compliant**: Web architecture allows future portability if needed

### IV. Simplicity & Performance
- ✅ **Compliant**: Using SQLite avoids complex database setup
- ✅ **Compliant**: Performance targets defined in success criteria
- ⚠️ **Action Required**: Database schema must be documented with ER diagrams
- ✅ **Compliant**: Deterministic rules preferred over AI for performance

### V. Dependency Minimization
- ⚠️ **Action Required**: Evaluate custom CSV parser vs library (csv-parse vs custom)
- ⚠️ **Action Required**: Evaluate minimal frontend framework options (Preact/Solid vs React)
- ⚠️ **Action Required**: Consider custom table sorting vs library
- ⚠️ **Action Required**: Each dependency must be justified in SBOM

### VI. Beautiful, Practical Design
- ✅ **Compliant**: Feature specifies clean table UI with sorting
- ✅ **Compliant**: Visual tags for categories and payment types
- ✅ **Compliant**: Icons for visual distinction, no decorative emojis
- ⚠️ **Action Required**: Choose minimal, functional icon library

### Security Requirements - Threat Modeling & SBOM
- ⚠️ **Action Required**: Threat model must cover:
  - CSV file parsing (malformed data, code injection)
  - File upload (path traversal, file size limits)
  - SQLite injection (prepared statements required)
  - Ollama API calls (localhost validation, timeout handling)
  - Frontend XSS (input sanitization, output encoding)

### Development Standards - Testing Hierarchy
- ✅ **Compliant**: Integration tests prioritized (user journeys)
- ✅ **Compliant**: Contract tests for API endpoints
- ✅ **Compliant**: Unit tests for classification logic

### Development Standards - Database Standards
- ⚠️ **Action Required**: Create ER diagram in data-model.md
- ⚠️ **Action Required**: Document table relationships and purpose
- ⚠️ **Action Required**: Design migrations (versioned, reversible)

**Gate Status**: ⚠️ CONDITIONAL PASS - No violations, but action items must be completed during Phase 0 (research) and Phase 1 (design)

## Project Structure

### Documentation (this feature)

```text
specs/001-expense-import-classify/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── api.yaml         # OpenAPI specification for backend
├── checklists/
│   └── requirements.md  # Already created
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/          # SQLite models (Expense, Category, VendorHistory, etc.)
│   ├── services/        # Business logic (ClassificationService, ImportService)
│   ├── api/             # Express routes and controllers
│   ├── db/              # Database setup, migrations
│   └── utils/           # CSV parser, logging, validation
├── tests/
│   ├── integration/     # Full user journey tests (CSV import → classification)
│   ├── contract/        # API endpoint contract tests
│   └── unit/            # Classification logic, parsing, validation
└── package.json

frontend/
├── src/
│   ├── components/      # Table, ExpenseRow, CategoryTag, FileUpload, ManualEntryForm
│   ├── pages/           # ExpensesPage (main view)
│   ├── services/        # API client for backend communication
│   └── types/           # TypeScript interfaces shared with backend
├── tests/
│   ├── integration/     # Component integration tests
│   └── unit/            # Component unit tests (validation, rendering)
└── package.json

shared/
└── types/               # Shared TypeScript interfaces (Expense, Category, etc.)
```

**Structure Decision**: Web application structure (Option 2) selected because this is a TypeScript/Node.js web app running on localhost. Frontend handles UI (table, forms, visualization), backend handles business logic (classification, database, AI integration). Shared types folder ensures type safety across frontend/backend boundary. This structure supports future portability while maintaining clear separation of concerns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All constitutional principles are satisfied or have clear action items for compliance.

---

## Post-Design Constitution Re-Check

*All "NEEDS CLARIFICATION" items resolved in research.md. Re-evaluating compliance after Phase 1 design.*

### I. Test-First Development (TDD) - NON-NEGOTIABLE
- ✅ **READY**: Test structures documented in quickstart.md (Vitest + testing libraries)
- ✅ **READY**: Integration test strategy defined (transaction rollback with SQLite)
- ✅ **READY**: Contract test approach defined (Supertest for API endpoints)
- ✅ **READY**: Unit test targets identified (classification logic, CSV parsing, validation)
- ⚠️ **Phase 2 Action**: Write tests FIRST in tasks.md generation

### II. Security & Privacy First
- ✅ **ADDRESSED**: All dependencies version-pinned in research.md (1+ month old requirement met)
- ⚠️ **Phase 2 Action**: Create threat model document (template in research.md)
- ⚠️ **Phase 2 Action**: Create SBOM document (template in research.md)
- ✅ **DESIGN COMPLETE**: Security mitigations designed (CSV validation, file size limits, Kysely parameterized queries, XSS protection via Solid.js)

### III. Local-First Architecture
- ✅ **VERIFIED**: SQLite with better-sqlite3 meets all requirements
- ✅ **VERIFIED**: No cloud dependencies in design
- ✅ **VERIFIED**: Ollama localhost-only in contracts
- ✅ **VERIFIED**: Web architecture supports future portability

### IV. Simplicity & Performance
- ✅ **COMPLETE**: Database schema documented with ER diagram in data-model.md
- ✅ **COMPLETE**: Performance optimization strategies defined (indexes, batch inserts, WAL mode)
- ✅ **VERIFIED**: Deterministic rules prioritized over AI
- ✅ **VERIFIED**: Minimal dependencies selected (research.md justifications)

### V. Dependency Minimization
- ✅ **EVALUATED**: CSV parser - library chosen over custom (security + RFC 4180 compliance)
- ✅ **EVALUATED**: Frontend framework - Solid.js chosen (7KB vs React's 40KB)
- ✅ **EVALUATED**: Table sorting - built-in (SQL ORDER BY, no library needed)
- ✅ **EVALUATED**: Icon library - Lucide chosen (tree-shakeable, ~1KB per icon)
- ✅ **COMPLETE**: All dependencies justified in research.md

### VI. Beautiful, Practical Design
- ✅ **DESIGN COMPLETE**: UI contracts defined in api.yaml (table, tags, forms)
- ✅ **DESIGN COMPLETE**: Icon strategy defined (Lucide, functional icons only)
- ✅ **VERIFIED**: No decorative elements in design

### Security Requirements - Threat Modeling & SBOM
- ✅ **COMPLETE**: Threat model template in research.md (CSV, file upload, SQL, XSS, Ollama)
- ✅ **COMPLETE**: SBOM template in research.md with all dependencies listed
- ⚠️ **Phase 2 Action**: Formalize threat model in docs/threat-model.md
- ⚠️ **Phase 2 Action**: Create docs/SBOM.md from template

### Development Standards - Database Standards
- ✅ **COMPLETE**: ER diagram in data-model.md
- ✅ **COMPLETE**: Table relationships documented
- ✅ **COMPLETE**: Migration strategy defined (Kysely, versioned, reversible)

**Final Gate Status**: ✅ **PASS** - All constitutional requirements met in design phase. Remaining action items are implementation tasks for Phase 2 (/speckit.tasks).

---

## Artifacts Generated

### Phase 0: Research
- ✅ `research.md`: Technology stack decisions, security analysis, best practices

### Phase 1: Design
- ✅ `data-model.md`: Complete database schema with ER diagram, migrations, validation rules
- ✅ `contracts/api.yaml`: OpenAPI 3.0 specification for all backend endpoints
- ✅ `quickstart.md`: Setup instructions, development workflow, TDD examples
- ✅ `CLAUDE.md`: Updated agent context with technology stack

### Ready for Phase 2
- ⏭️ `tasks.md`: Implementation task breakdown (run `/speckit.tasks` to generate)

---

## Summary

**Feature**: Credit Card Expense Import and Classification

**Architecture**: TypeScript/Node.js web application (localhost)
- **Frontend**: Solid.js 1.8.11, Lucide icons, Vite build
- **Backend**: Express.js 4.18.2, Kysely 0.27.2 query builder, SQLite via better-sqlite3
- **Testing**: Vitest 1.0.4 across all layers
- **AI**: Ollama (localhost:11434)

**Key Design Decisions**:
1. Solid.js over React for performance and bundle size
2. Kysely query builder over full ORM for simplicity and type safety
3. csv-parse library for security (RFC 4180 compliance, injection protection)
4. Deterministic classification rules prioritized over AI for common vendors
5. SQLite WAL mode with transaction rollback for testing

**Constitutional Compliance**: ✅ All principles satisfied
- TDD ready (test frameworks configured, strategies defined)
- Security addressed (threat model template, SBOM template, mitigations designed)
- Local-first verified (no cloud dependencies)
- Performance optimized (indexes, batch operations, minimal bundles)
- Dependencies minimized and justified
- Design is functional and practical

**Next Command**: `/speckit.tasks` to generate implementation task breakdown
