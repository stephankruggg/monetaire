# Data Model: Credit Card Expense Import and Classification

**Feature**: 001-expense-import-classify
**Date**: 2025-11-15
**Database**: SQLite (via Kysely + better-sqlite3)

## Entity-Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          IMPORT_SESSIONS                             │
├─────────────────────────────────────────────────────────────────────┤
│ id (INTEGER PRIMARY KEY)                                             │
│ filename (TEXT NOT NULL)                                             │
│ import_date (TEXT NOT NULL) -- ISO 8601 datetime                    │
│ expenses_imported (INTEGER NOT NULL)                                 │
│ expenses_failed (INTEGER NOT NULL)                                   │
│ month (INTEGER NOT NULL) -- 1-12                                     │
│ year (INTEGER NOT NULL)                                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                             EXPENSES                                 │
├─────────────────────────────────────────────────────────────────────┤
│ id (INTEGER PRIMARY KEY)                                             │
│ date (TEXT NOT NULL) -- ISO 8601 date YYYY-MM-DD                    │
│ custom_name (TEXT) -- User-assigned name, nullable                  │
│ original_title (TEXT NOT NULL) -- From CSV or user input            │
│ amount (REAL NOT NULL) -- Brazilian Reais                           │
│ payment_type (TEXT NOT NULL) -- 'credit'|'debit'|'pix'|'cash'|...   │
│ source (TEXT NOT NULL) -- 'imported'|'manual'                       │
│ vendor_name (TEXT NOT NULL) -- Extracted from title or user input   │
│ category_id (INTEGER) -- FK to CATEGORIES, nullable until classified│
│ import_session_id (INTEGER) -- FK, nullable for manual entries      │
│ installment_current (INTEGER) -- Nullable, e.g., 2 in "Parcela 2/10"│
│ installment_total (INTEGER) -- Nullable, e.g., 10 in "Parcela 2/10" │
│ created_at (TEXT NOT NULL) -- ISO 8601 datetime                     │
│ updated_at (TEXT NOT NULL) -- ISO 8601 datetime                     │
├─────────────────────────────────────────────────────────────────────┤
│ FOREIGN KEY (category_id) REFERENCES CATEGORIES(id)                 │
│ FOREIGN KEY (import_session_id) REFERENCES IMPORT_SESSIONS(id)      │
│ INDEX idx_expenses_vendor (vendor_name)                              │
│ INDEX idx_expenses_date (date)                                       │
│ INDEX idx_expenses_category (category_id)                            │
│ INDEX idx_expenses_installment (installment_current, installment_total, amount) │
└─────────────────────────────────────────────────────────────────────┘
                │                               │
                │ N:1                           │ 1:N
                ▼                               ▼
┌──────────────────────────┐      ┌────────────────────────────────────┐
│      CATEGORIES          │      │  RECLASSIFICATION_HISTORY          │
├──────────────────────────┤      ├────────────────────────────────────┤
│ id (INTEGER PRIMARY KEY) │      │ id (INTEGER PRIMARY KEY)           │
│ name (TEXT NOT NULL      │      │ expense_id (INTEGER NOT NULL)      │
│      UNIQUE)             │      │ original_category_id (INTEGER)     │
│ description (TEXT)       │      │ new_category_id (INTEGER NOT NULL) │
│ is_user_defined (INTEGER │      │ vendor_name (TEXT NOT NULL)        │
│      NOT NULL) -- BOOLEAN│      │ timestamp (TEXT NOT NULL)          │
│ is_active (INTEGER       │      │ reason (TEXT)                      │
│      NOT NULL DEFAULT 1) │      ├────────────────────────────────────┤
│      -- BOOLEAN          │      │ FOREIGN KEY (expense_id)           │
│ created_at (TEXT NOT NULL│      │   REFERENCES EXPENSES(id)          │
│      )                   │      │ FOREIGN KEY (original_category_id) │
└──────────────────────────┘      │   REFERENCES CATEGORIES(id)        │
                │                 │ FOREIGN KEY (new_category_id)      │
                │                 │   REFERENCES CATEGORIES(id)        │
                │                 │ INDEX idx_reclassification_vendor  │
                │                 │   (vendor_name)                    │
                │                 └────────────────────────────────────┘
                │
                │ N:N (via vendor_name)
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        VENDOR_HISTORY                                │
├─────────────────────────────────────────────────────────────────────┤
│ id (INTEGER PRIMARY KEY)                                             │
│ vendor_name (TEXT NOT NULL UNIQUE)                                   │
│ is_general (INTEGER NOT NULL DEFAULT 0) -- BOOLEAN: multiple categories│
│ category_counts (TEXT NOT NULL) -- JSON: {"Food": 5, "Hobbies": 2}  │
│ last_updated (TEXT NOT NULL) -- ISO 8601 datetime                   │
├─────────────────────────────────────────────────────────────────────┤
│ INDEX idx_vendor_name (vendor_name)                                  │
└─────────────────────────────────────────────────────────────────────┘
                │
                │ 1:N
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     CUSTOM_NAME_REGISTRY                             │
├─────────────────────────────────────────────────────────────────────┤
│ id (INTEGER PRIMARY KEY)                                             │
│ vendor_pattern (TEXT NOT NULL) -- Base vendor name (e.g., "Amazon")  │
│ installment_total (INTEGER NOT NULL) -- Total installments          │
│ amount (REAL NOT NULL) -- Installment amount for matching           │
│ custom_name (TEXT NOT NULL) -- User's custom name                   │
│ first_assigned_date (TEXT NOT NULL) -- ISO 8601 datetime            │
├─────────────────────────────────────────────────────────────────────┤
│ UNIQUE (vendor_pattern, installment_total, amount)                   │
│ INDEX idx_custom_name_vendor (vendor_pattern)                        │
└─────────────────────────────────────────────────────────────────────┘
```

## Entity Descriptions

### EXPENSES

**Purpose**: Core table storing all financial transactions (imported from CSV or manually entered).

**Fields:**
- `id`: Auto-incrementing primary key
- `date`: Transaction date in ISO 8601 format (YYYY-MM-DD)
- `custom_name`: User-assigned meaningful name (e.g., "New Laptop" for "Amazon Parcela 2/10"), nullable until assigned
- `original_title`: Original description from bank CSV or user input for manual entries
- `amount`: Transaction amount in Brazilian Reais (positive for expenses)
- `payment_type`: One of: 'credit', 'debit', 'pix', 'cash', 'other'
- `source`: 'imported' (from CSV) or 'manual' (user-entered)
- `vendor_name`: Extracted vendor/merchant name (e.g., "Amazon" from "Amazon Marketplace - Parcela 2/10")
- `category_id`: Foreign key to CATEGORIES table, nullable if not yet classified
- `import_session_id`: Foreign key to IMPORT_SESSIONS, nullable for manual entries
- `installment_current`: For recurring expenses (e.g., 2 from "Parcela 2/10"), nullable for single transactions
- `installment_total`: Total installments (e.g., 10 from "Parcela 2/10"), nullable for single transactions
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Indexes:**
- `idx_expenses_vendor`: Fast lookups by vendor for classification
- `idx_expenses_date`: Sorting and filtering by date
- `idx_expenses_category`: Filtering by category
- `idx_expenses_installment`: Matching recurring installments (current, total, amount)

**Relationships:**
- Many-to-One with CATEGORIES (expense has one category)
- Many-to-One with IMPORT_SESSIONS (expense belongs to one import session, if imported)
- One-to-Many with RECLASSIFICATION_HISTORY (expense can be reclassified multiple times)

---

### CATEGORIES

**Purpose**: Stores expense categories (predefined and user-defined).

**Fields:**
- `id`: Auto-incrementing primary key
- `name`: Category name (e.g., "Food", "Travel"), unique
- `description`: Optional description of category purpose
- `is_user_defined`: Boolean (1 = user-created, 0 = system predefined)
- `is_active`: Boolean (1 = active, 0 = archived), default 1
- `created_at`: Record creation timestamp

**Predefined Categories** (seeded in migration):
1. Food
2. Travel
3. Library (books)
4. Hobbies
5. Housing (rent, maintenance)
6. Subscriptions
7. Other (catch-all)

**Relationships:**
- One-to-Many with EXPENSES (category has many expenses)
- One-to-Many with RECLASSIFICATION_HISTORY (category appears in reclassification records)

---

### IMPORT_SESSIONS

**Purpose**: Tracks CSV import operations for auditing and debugging.

**Fields:**
- `id`: Auto-incrementing primary key
- `filename`: Original CSV filename
- `import_date`: When import occurred (ISO 8601 datetime)
- `expenses_imported`: Count of successfully imported expenses
- `expenses_failed`: Count of rows that failed validation
- `month`: Month of expenses in import (1-12)
- `year`: Year of expenses in import

**Relationships:**
- One-to-Many with EXPENSES (import session contains many expenses)

---

### RECLASSIFICATION_HISTORY

**Purpose**: Records all manual category changes for learning and auditing.

**Fields:**
- `id`: Auto-incrementing primary key
- `expense_id`: Foreign key to EXPENSES table
- `original_category_id`: Category before reclassification (nullable if first classification)
- `new_category_id`: Category after reclassification
- `vendor_name`: Denormalized vendor name for fast lookup
- `timestamp`: When reclassification occurred (ISO 8601 datetime)
- `reason`: Optional user note explaining reclassification

**Indexes:**
- `idx_reclassification_vendor`: Fast lookups for vendor reclassification history

**Relationships:**
- Many-to-One with EXPENSES (reclassification belongs to one expense)
- Many-to-One with CATEGORIES (original_category_id)
- Many-to-One with CATEGORIES (new_category_id)

---

### VENDOR_HISTORY

**Purpose**: Tracks which categories have been assigned to each vendor for deterministic classification.

**Fields:**
- `id`: Auto-incrementing primary key
- `vendor_name`: Vendor/merchant name (unique)
- `is_general`: Boolean (1 = vendor has multiple categories, 0 = single category)
- `category_counts`: JSON object mapping category names to counts (e.g., `{"Food": 5, "Hobbies": 2}`)
- `last_updated`: Last time this record was updated (ISO 8601 datetime)

**Indexes:**
- `idx_vendor_name`: Fast lookups during classification

**Logic:**
- Updated after each expense classification (initial or reclassified)
- If `category_counts` has >1 category, set `is_general = 1`
- Used by deterministic classifier to auto-assign categories for single-category vendors

**Example:**
```json
{
  "vendor_name": "Subway",
  "is_general": 0,
  "category_counts": "{\"Food\": 12}",
  "last_updated": "2025-11-15T10:30:00Z"
}

{
  "vendor_name": "Amazon",
  "is_general": 1,
  "category_counts": "{\"Food\": 3, \"Hobbies\": 5, \"Library\": 8}",
  "last_updated": "2025-11-15T11:45:00Z"
}
```

---

### CUSTOM_NAME_REGISTRY

**Purpose**: Stores custom names for recurring installment expenses to auto-assign names in subsequent months.

**Fields:**
- `id`: Auto-incrementing primary key
- `vendor_pattern`: Base vendor name extracted from title (e.g., "Amazon Marketplace")
- `installment_total`: Total number of installments (e.g., 10)
- `amount`: Installment amount for matching (e.g., 33.39)
- `custom_name`: User's custom name (e.g., "New Laptop")
- `first_assigned_date`: When user first assigned this name (ISO 8601 datetime)

**Indexes:**
- `idx_custom_name_vendor`: Fast lookups during import

**Unique Constraint:**
- (vendor_pattern, installment_total, amount) - one custom name per installment series

**Matching Logic:**
When importing "Amazon Marketplace - Parcela 3/10" with amount 33.39:
1. Extract vendor_pattern = "Amazon Marketplace"
2. Extract installment_total = 10, installment_current = 3
3. Query: `SELECT custom_name FROM CUSTOM_NAME_REGISTRY WHERE vendor_pattern = 'Amazon Marketplace' AND installment_total = 10 AND amount = 33.39`
4. If found, auto-assign custom_name to expense

---

## Database Schema (SQLite DDL)

### Migration 001: Initial Schema

```sql
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Enable WAL mode for better concurrency
PRAGMA journal_mode = WAL;

-- CATEGORIES table
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_user_defined INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed predefined categories
INSERT INTO categories (name, is_user_defined) VALUES
    ('Food', 0),
    ('Travel', 0),
    ('Library', 0),
    ('Hobbies', 0),
    ('Housing', 0),
    ('Subscriptions', 0),
    ('Other', 0);

-- IMPORT_SESSIONS table
CREATE TABLE import_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    import_date TEXT NOT NULL DEFAULT (datetime('now')),
    expenses_imported INTEGER NOT NULL DEFAULT 0,
    expenses_failed INTEGER NOT NULL DEFAULT 0,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 1900 AND year <= 2100)
);

-- EXPENSES table
CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    custom_name TEXT,
    original_title TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    payment_type TEXT NOT NULL CHECK (payment_type IN ('credit', 'debit', 'pix', 'cash', 'other')),
    source TEXT NOT NULL CHECK (source IN ('imported', 'manual')),
    vendor_name TEXT NOT NULL,
    category_id INTEGER,
    import_session_id INTEGER,
    installment_current INTEGER CHECK (installment_current IS NULL OR installment_current > 0),
    installment_total INTEGER CHECK (installment_total IS NULL OR installment_total > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (import_session_id) REFERENCES import_sessions(id)
);

CREATE INDEX idx_expenses_vendor ON expenses(vendor_name);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_installment ON expenses(installment_current, installment_total, amount);

-- RECLASSIFICATION_HISTORY table
CREATE TABLE reclassification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expense_id INTEGER NOT NULL,
    original_category_id INTEGER,
    new_category_id INTEGER NOT NULL,
    vendor_name TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    reason TEXT,
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (original_category_id) REFERENCES categories(id),
    FOREIGN KEY (new_category_id) REFERENCES categories(id)
);

CREATE INDEX idx_reclassification_vendor ON reclassification_history(vendor_name);

-- VENDOR_HISTORY table
CREATE TABLE vendor_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_name TEXT NOT NULL UNIQUE,
    is_general INTEGER NOT NULL DEFAULT 0,
    category_counts TEXT NOT NULL DEFAULT '{}',
    last_updated TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_vendor_name ON vendor_history(vendor_name);

-- CUSTOM_NAME_REGISTRY table
CREATE TABLE custom_name_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_pattern TEXT NOT NULL,
    installment_total INTEGER NOT NULL CHECK (installment_total > 0),
    amount REAL NOT NULL CHECK (amount > 0),
    custom_name TEXT NOT NULL,
    first_assigned_date TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (vendor_pattern, installment_total, amount)
);

CREATE INDEX idx_custom_name_vendor ON custom_name_registry(vendor_pattern);
```

---

## Data Validation Rules

### EXPENSES
- `date`: Must be valid ISO 8601 date (YYYY-MM-DD)
- `amount`: Must be positive number (> 0)
- `payment_type`: Must be one of: 'credit', 'debit', 'pix', 'cash', 'other'
- `source`: Must be 'imported' or 'manual'
- `vendor_name`: Required, non-empty string
- `installment_current` ≤ `installment_total` (if both not null)

### CATEGORIES
- `name`: Required, unique, non-empty
- `is_user_defined`: 0 or 1 (boolean)
- `is_active`: 0 or 1 (boolean)

### IMPORT_SESSIONS
- `month`: 1-12
- `year`: 1900-2100
- `expenses_imported`: ≥ 0
- `expenses_failed`: ≥ 0

### VENDOR_HISTORY
- `category_counts`: Valid JSON object
- `is_general`: 0 or 1 (boolean)

### CUSTOM_NAME_REGISTRY
- `installment_total`: > 0
- `amount`: > 0
- Unique constraint enforced on (vendor_pattern, installment_total, amount)

---

## State Transitions

### Expense Classification Lifecycle

```
┌─────────────┐
│  Imported/  │
│   Manual    │
│   Entry     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Uncategorized                      │
│  (category_id = NULL)               │
└──────┬──────────────────────────────┘
       │
       │ Deterministic Rule Match?
       ├──Yes──────────────────────┐
       │                            ▼
       │                   ┌────────────────┐
       │                   │  Auto-         │
       │                   │  Classified    │
       │                   │  (category_id  │
       │                   │   assigned)    │
       │                   └────────┬───────┘
       │                            │
       ├──No──────────────────────┐ │
       │                          ▼ ▼
       ▼                   ┌──────────────────┐
┌──────────────┐           │  AI Classified   │
│  Send to AI  │──────────▶│  (category_id    │
│  Service     │           │   assigned)      │
└──────────────┘           └────────┬─────────┘
       │                            │
       │ AI Failed?                 │
       ├──Yes──────────┐            │
       │                ▼            │
       │         ┌─────────────┐    │
       │         │  Other/     │    │
       │         │  Uncategorized│  │
       │         └─────────────┘    │
       │                            │
       └────────────────────────────┘
                                    │
                         User Reclassifies?
                                    │
                                    ▼
                           ┌────────────────────┐
                           │  Reclassified      │
                           │  (category_id      │
                           │   updated,         │
                           │   history recorded)│
                           └────────────────────┘
```

### Vendor History Update

After each expense classification (initial or reclassified):

1. Check if vendor exists in VENDOR_HISTORY
2. If not, create new record with category_counts = `{"CategoryName": 1}`
3. If exists, parse category_counts JSON, increment count for category
4. If category_counts has >1 unique category, set is_general = 1
5. Update last_updated timestamp

---

## Query Patterns

### Import CSV (Insert Expenses)

```sql
-- Wrapped in transaction
BEGIN IMMEDIATE TRANSACTION;

-- Create import session
INSERT INTO import_sessions (filename, month, year)
VALUES (?, ?, ?)
RETURNING id;

-- Insert expenses (bulk)
INSERT INTO expenses (date, original_title, amount, payment_type, source, vendor_name, import_session_id, installment_current, installment_total)
VALUES
    (?, ?, ?, 'credit', 'imported', ?, ?, ?, ?),
    (?, ?, ?, 'credit', 'imported', ?, ?, ?, ?),
    ...;

-- Update session counts
UPDATE import_sessions
SET expenses_imported = ?, expenses_failed = ?
WHERE id = ?;

COMMIT;
```

### Deterministic Classification

```sql
-- Check if vendor has exactly one category
SELECT category_id, COUNT(DISTINCT category_id) as cat_count
FROM expenses
WHERE vendor_name = ? AND category_id IS NOT NULL
GROUP BY vendor_name;

-- If cat_count = 1, auto-assign category
UPDATE expenses
SET category_id = ?, updated_at = datetime('now')
WHERE id = ?;
```

### Recurring Installment Auto-Name

```sql
-- Lookup custom name
SELECT custom_name
FROM custom_name_registry
WHERE vendor_pattern = ?
  AND installment_total = ?
  AND amount = ?;

-- If found, assign name
UPDATE expenses
SET custom_name = ?, updated_at = datetime('now')
WHERE id = ?;
```

### Reclassify Expense

```sql
-- Wrapped in transaction
BEGIN IMMEDIATE TRANSACTION;

-- Record reclassification
INSERT INTO reclassification_history (expense_id, original_category_id, new_category_id, vendor_name)
VALUES (?, ?, ?, ?);

-- Update expense
UPDATE expenses
SET category_id = ?, updated_at = datetime('now')
WHERE id = ?;

-- Update vendor history (complex, handled in application logic)
-- Fetch vendor_history, update category_counts JSON, save back

COMMIT;
```

### Fetch Expenses for Table Display

```sql
SELECT
    e.id,
    e.date,
    e.custom_name,
    e.original_title,
    e.amount,
    e.payment_type,
    c.name as category_name,
    e.vendor_name
FROM expenses e
LEFT JOIN categories c ON e.category_id = c.id
ORDER BY e.date DESC;
```

---

## Migration Strategy

### Migration Files

Location: `backend/src/db/migrations/`

Naming: `YYYYMMDDHHMMSS_description.ts`

Example:
- `20251115120000_initial_schema.ts`
- `20251120150000_add_expense_notes_column.ts`

### Migration Structure (Kysely)

```typescript
import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Forward migration
  await db.schema
    .createTable('expenses')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    // ... rest of columns
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Rollback migration
  await db.schema.dropTable('expenses').execute();
}
```

### Migration CLI Commands

```bash
# Run all pending migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:down

# Show migration status
npm run migrate:status
```

---

## Performance Considerations

### Indexes

All frequently queried columns have indexes:
- Vendor lookups (classification): `idx_expenses_vendor`, `idx_vendor_name`
- Date sorting/filtering: `idx_expenses_date`
- Category filtering: `idx_expenses_category`
- Installment matching: `idx_expenses_installment`

### Batch Operations

Import: Insert all expenses from CSV in single transaction (bulk insert)

### Query Optimization

Use `EXPLAIN QUERY PLAN` to verify index usage:

```sql
EXPLAIN QUERY PLAN
SELECT * FROM expenses WHERE vendor_name = 'Amazon';
```

Expected: `SEARCH expenses USING INDEX idx_expenses_vendor (vendor_name=?)`

---

## Backup & Recovery

### Backup Strategy

SQLite database file: `backend/data/monetaire.db`

**Backup methods:**
1. File copy (database must be idle): `cp monetaire.db monetaire.db.backup`
2. SQLite backup API (safe during writes): Use `.backup` command or Node.js `better-sqlite3` backup method

**Frequency**: User-initiated (future feature: automatic daily backups)

### Recovery

Restore from backup: `cp monetaire.db.backup monetaire.db`

**Data integrity**: SQLite WAL mode ensures crash recovery automatically

---

## Next Steps

1. Generate API contracts (contracts/api.yaml) based on this data model
2. Create quickstart.md with database setup instructions
3. Update agent context with technology stack details
