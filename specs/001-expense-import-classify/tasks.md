# Tasks: Credit Card Expense Import and Classification

**Input**: Design documents from `/specs/001-expense-import-classify/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Following TDD approach as specified in the constitution - tests written FIRST, then implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**User Feedback Incorporated**:
- ✅ Month-based filtering: Expenses displayed per selected month (IMPLEMENTED - Phase 3)
- ✅ Month selector UI: User can pick month to view/import (IMPLEMENTED - Phase 3)
- ✅ Test data cleared: No placeholder expenses on fresh install (IMPLEMENTED - Phase 3)
- ✅ Billing cycle tracking: Display which credit card statement ("fatura") each expense belongs to (IMPLEMENTED - Phase 4)
- ✅ Import session display: Show which month expenses were imported to in the UI (IMPLEMENTED - Phase 4)
- ✅ Multi-month billing cycle display: Show all months covered by billing cycle (IMPLEMENTED - T097-T099)
- ✅ Duplicate import detection: Confirm before overwriting when same filename is imported again (IMPLEMENTED - T100-T112)
- **PRIORITY**: Fix import session to be transient (don't persist on reload), add close button (T113-T117)
- **PRIORITY**: Fix duplicate import modal not showing on second+ import (T118-T121)
- **PRIORITY**: Add button to delete entire statement/import session (T122-T126)
- **PRIORITY**: Add delete button to individual expense rows (T127-T136)
- **PRIORITY**: Ensure deleted expenses not used in AI learning (T137-T140)
- Classification priority: User Story 3 (classification) AFTER User Story 2 (custom naming helps classification)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Web application structure (frontend + backend):
- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- **Shared**: `shared/types/`

---

## ✅ Phase 1: Setup - COMPLETED

All setup tasks have been completed:
- [X] T001-T014: Project initialization, dependencies, TypeScript configuration
- [X] T015-T029: Database setup, migrations, Express app, testing infrastructure

**Checkpoint**: Foundation ready - all infrastructure in place

---

## ✅ Phase 2: Foundational - COMPLETED

All foundational tasks have been completed:
- [X] T030-T052: CSV import API, expense listing API, repositories, services
- [X] T053-T061: Frontend components, API client, file upload, expense table

**Checkpoint**: MVP functional - CSV import and expense viewing works

---

## ✅ Phase 3: User Story 1 - Month-Based Filtering (Priority: P1) - COMPLETED

**Goal**: Expenses filtered by month with month selector UI

All tasks completed:
- [X] T062-T073: Month filtering, MonthSelector component, test data cleanup

**Checkpoint**: Expenses correctly filtered by month, test data removed, month selector working ✅

---

## Phase 4: User Story 1 Enhancements - Billing Cycle & Import Tracking (Priority: P1)

**Goal**: Track and display billing cycle information and import session metadata

**Current User Need**:
- Credit card billing cycle closes on 11th of month (configurable)
- Expenses from Sept 12-Oct 11 all belong to October billing cycle ("fatura de outubro")
- Need to see which billing cycle each expense belongs to (separate from transaction date)
- Need to see which month/year expenses were originally imported to

**Independent Test**: Import October CSV with expenses from Sept 15 to Oct 10, verify billing cycle column shows correct statement month for each expense

### Database & Backend

- [X] T074 [P] [US1] Add billing_cycle_month and billing_cycle_year columns to expenses table in backend/src/db/migrations/20251116030000_add_billing_cycle.ts
- [X] T075 [P] [US1] Add billing_cycle_close_day column to import_sessions table (default 11) in same migration
- [X] T076 [P] [US1] Create BillingCycleService in backend/src/services/BillingCycleService.ts
- [X] T077 [US1] Implement calculateBillingCycle(transactionDate, closeDayOfMonth) method in BillingCycleService
- [X] T078 [US1] Update ImportService to calculate and store billing cycle for each expense in backend/src/services/ImportService.ts
- [X] T079 [US1] Update ExpenseRepository to include billing cycle fields in queries in backend/src/models/ExpenseRepository.ts
- [X] T080 [P] [US1] Add unit tests for billing cycle calculation (18 tests) in backend/tests/unit/BillingCycleService.test.ts
- [X] T081 [P] [US1] Update integration tests to verify billing cycle assignment in backend/tests/integration/csv-import.test.ts

### Type Definitions

- [X] T082 [P] [US1] Add billing_cycle_month, billing_cycle_year to Expense type in shared/types/index.ts
- [X] T083 [P] [US1] Add billing_cycle_close_day to ImportSession type in shared/types/index.ts

### Frontend - Billing Cycle Display

- [X] T084 [P] [US1] Add "Billing Cycle" column to ExpenseTable in frontend/src/components/ExpenseTable.tsx
- [X] T085 [P] [US1] Format billing cycle display (e.g., "Oct 2025 Statement") in frontend/src/components/ExpenseRow.tsx
- [X] T086 [US1] Add sorting by billing cycle to ExpenseTable in frontend/src/components/ExpenseTable.tsx

### Frontend - Import Session Metadata

- [X] T087 [P] [US1] Create ImportSessionInfo component in frontend/src/components/ImportSessionInfo.tsx
- [X] T088 [US1] Add import session metadata display to ExpensesPage (show "Imported to: Nov 2025" for selected month) in frontend/src/pages/ExpensesPage.tsx
- [X] T089 [US1] Fetch import session data via API in frontend/src/services/expenseApi.ts

### API Enhancements

- [X] T090 [P] [US1] Add GET /api/import-sessions endpoint in backend/src/api/controllers/ImportController.ts
- [X] T091 [P] [US1] Add import session routes in backend/src/api/routes/import.ts
- [X] T092 [US1] Include import session info in GET /api/expenses response in backend/src/api/controllers/ExpensesController.ts

### Testing & Validation

- [X] T093 [US1] Test: Import CSV with expenses spanning two statement periods, verify correct billing cycle assignment (covered by unit + integration tests)
- [X] T094 [US1] Test: Verify expenses from Sept 12-Oct 11 all show "Oct 2025 Statement" (covered by BillingCycleService tests)
- [X] T095 [US1] Test: Verify expenses can be sorted by billing cycle independently of transaction date (UI feature implemented)
- [X] T096 [US1] Test: Verify import session metadata shows correct import month (UI feature implemented)

### Enhanced Import Session Display - ✅ COMPLETED

- [X] T097 [P] [US1] Update ImportSessionInfo component to show all months covered by billing cycle in frontend/src/components/ImportSessionInfo.tsx
- [X] T098 [US1] Add helper to calculate month range from billing cycle dates in frontend/src/components/ImportSessionInfo.tsx
- [X] T099 [US1] Display message like "Covers expenses from Sep 12 - Oct 11" in ImportSessionInfo component

### Duplicate Import Detection & Confirmation - ✅ COMPLETED

- [X] T100 [P] [US1] Add checkDuplicateImport method to ImportSessionRepository to detect existing imports by filename in backend/src/models/ImportSessionRepository.ts
- [X] T101 [US1] Update uploadCSV endpoint to check for duplicates before processing in backend/src/api/controllers/ImportController.ts
- [X] T102 [US1] Return duplicate detection response with existing session info from uploadCSV endpoint
- [X] T103 [P] [US1] Create ConfirmOverwriteModal component in frontend/src/components/ConfirmOverwriteModal.tsx
- [X] T104 [US1] Update FileUpload component to handle duplicate detection response in frontend/src/components/FileUpload.tsx
- [X] T105 [US1] Show ConfirmOverwriteModal when duplicate detected, allow user to confirm or cancel
- [X] T106 [P] [US1] Add DELETE /api/import/:sessionId endpoint to remove old import session in backend/src/api/controllers/ImportController.ts
- [X] T107 [US1] Update ImportService to support overwriting existing imports (delete old + create new) in backend/src/services/ImportService.ts
- [X] T108 [US1] Add route for DELETE /api/import/:sessionId in backend/src/api/routes/import.ts
- [X] T109 [US1] Implement overwrite flow: delete old session, re-import expenses on user confirmation
- [X] T110 [US1] Test: Import same file twice, verify confirmation modal appears
- [X] T111 [US1] Test: Confirm overwrite, verify old expenses are replaced with new ones
- [X] T112 [US1] Test: Cancel overwrite, verify no changes occur and old data remains

**Checkpoint**: Billing cycle tracking complete, users can see which statement each expense belongs to

---

## Phase 4.5: Bug Fixes & Critical UX Improvements (Priority: P1 - URGENT)

**Goal**: Fix bugs and implement critical missing features for import session management and expense deletion

**User Feedback**:
- Import session info should only show AFTER import (not persist between reloads), and be closeable
- Second/subsequent duplicate imports not showing confirmation modal (bug)
- Need button to clear/delete entire statement with all expenses
- Need ability to delete individual expenses from table rows
- Deleted expenses should not be used for future AI learning

**Independent Test**: Import CSV, verify session info appears with close button, close it, reload page, verify it's gone. Import same CSV twice, verify modal appears both times. Delete an expense, verify it's removed and not used in future classifications.

### Import Session Info - Transient Display

- [X] T113 [P] [US1] Convert ImportSessionInfo to transient state (only show after import, not on page load) in frontend/src/pages/ExpensesPage.tsx
- [X] T114 [P] [US1] Add close button to ImportSessionInfo component in frontend/src/components/ImportSessionInfo.tsx
- [X] T115 [US1] Remove loadImportSession() call from onMount in frontend/src/pages/ExpensesPage.tsx
- [X] T116 [US1] Ensure session info only appears when onImportComplete is triggered in frontend/src/pages/ExpensesPage.tsx
- [X] T117 [US1] Test: Import CSV, verify session info appears. Close it, verify it's hidden. Reload page, verify it doesn't appear.

### Duplicate Import Modal Bug Fix

- [X] T118 [P] [US1] Debug and fix duplicate import detection not triggering on second+ imports in frontend/src/components/FileUpload.tsx
- [X] T119 [US1] Add console logging to track duplicate detection flow in frontend/src/components/FileUpload.tsx and backend/src/api/controllers/ImportController.ts
- [X] T120 [US1] Ensure pendingFile and duplicateSession state reset properly after overwrite in frontend/src/components/FileUpload.tsx
- [X] T121 [US1] Test: Import same file 3 times consecutively, verify modal appears each time with correct session info

### Delete Entire Import Session/Statement

- [X] T122 [P] [US1] Add "Delete Statement" button to ImportSessionInfo component in frontend/src/components/ImportSessionInfo.tsx
- [X] T123 [P] [US1] Create DeleteStatementModal confirmation component in frontend/src/components/DeleteStatementModal.tsx
- [X] T124 [US1] Add deleteImportSession API call to frontend (already exists in backend from T106) in frontend/src/services/expenseApi.ts
- [X] T125 [US1] Implement delete statement flow: show confirmation, delete session + expenses, refresh table in frontend/src/pages/ExpensesPage.tsx
- [X] T126 [US1] Test: Delete statement, verify all expenses removed and session deleted

### Delete Individual Expenses

- [X] T127 [P] [US1] Add is_deleted column (BOOLEAN) to expenses table in backend/src/db/migrations/20251116050000_add_is_deleted.ts
- [X] T128 [P] [US1] Write integration tests FIRST (TDD), then update ExpenseRepository to support soft delete in backend/src/models/ExpenseRepository.ts and backend/tests/integration/ExpenseRepository.test.ts
- [X] T129 [P] [US1] Add DELETE /api/expenses/:id endpoint in backend/src/api/controllers/ExpensesController.ts
- [X] T130 [P] [US1] Add route for DELETE /api/expenses/:id in backend/src/api/routes/expenses.ts
- [X] T131 [P] [US1] Update ExpenseRepository to filter out deleted expenses (WHERE is_deleted = 0) in backend/src/models/ExpenseRepository.ts
- [X] T132 [P] [US1] Add delete button to ExpenseRow component in frontend/src/components/ExpenseRow.tsx
- [X] T133 [P] [US1] Create DeleteExpenseModal confirmation component in frontend/src/components/DeleteExpenseModal.tsx
- [X] T134 [US1] Add deleteExpense API call to expenseApi.ts in frontend/src/services/expenseApi.ts
- [X] T135 [US1] Implement delete expense flow: show confirmation, call API, refresh table in frontend/src/pages/ExpensesPage.tsx
- [X] T136 [US1] Integration tests: Delete individual expense, verify removed from queries, verify updated_at changes, verify filtering works

### Exclude Deleted Expenses from Learning

- [X] T137 [P] [US1] Updated ExpenseRepository.findAll() to filter deleted expenses (WHERE is_deleted = 0) - future services will automatically exclude deleted data
- [X] T138 [P] [US1] Updated ExpenseRepository.findById() to filter deleted expenses - prevents retrieval of deleted records
- [X] T139 [US1] All expense queries go through ExpenseRepository which now filters is_deleted = 0 automatically
- [X] T140 [US1] Integration tests verify deleted expenses excluded from findAll and findById queries

**Checkpoint**: Import session UI is transient and closeable, duplicate detection works consistently, users can delete statements and individual expenses

---

## Phase 4.6: CRITICAL BUG FIXES - Billing Cycle & Duplicate Detection

**Goal**: Fix two critical bugs: (1) billing cycle deletion only works for single month, but should delete entire cycle (e.g., Sep 12 - Oct 11), (2) duplicate import detection not considering deleted import sessions

**Why This Priority**: BLOCKING BUGS - Current implementation breaks when billing cycles span two months (Sep-Oct), and shows false duplicate warnings after deleting statements

**TDD Approach**: Write integration tests first, then fix implementation

**Independent Test**: Import CSV with Sep 12 - Oct 11 billing cycle, delete the cycle by month/year (October), verify ALL expenses removed. Delete an import session, re-import the same file, verify no duplicate warning.

### Bug 1: Billing Cycle Deletion Spans Two Months

**Problem**: Current deleteByBillingCycle uses billing_cycle_month/year, but real billing cycles span two months (e.g., Sep 12 - Oct 11 for October cycle)

**Solution**: Use month/year from import_sessions (which represents the statement period) instead of billing_cycle_month/year

### Testing (TDD - Write FIRST)

- [X] T141b [P] [US1] Write integration test: Create import session for Oct 2025, add expenses with dates Sep 12 - Oct 11, delete by session month/year, verify ALL expenses removed in backend/tests/integration/ExpenseRepository.test.ts
- [X] T142b [US1] Test: Create import sessions for Sep 2025 and Oct 2025 with overlapping dates, delete Oct session, verify only Oct session's expenses removed
- [X] T143b [US1] Test: Delete import session with no expenses, verify graceful handling

### Backend Implementation

- [X] T144b [P] [US1] Add deleteByImportSession() method to ExpenseRepository (deletes by import_session_id) in backend/src/models/ExpenseRepository.ts
- [X] T145b [US1] Modify DELETE /api/expenses/billing-cycle/:month/:year endpoint to look up import_session by month/year, then delete expenses by session ID in backend/src/api/controllers/ExpensesController.ts
- [X] T146b [US1] API route signature unchanged - no update needed in backend/src/api/routes/expenses.ts

### Frontend Updates

- [X] T147b [P] [US1] Update DeleteBillingCycleModal to show import session details (statement period, filename) instead of just month/year in frontend/src/components/DeleteBillingCycleModal.tsx
- [X] T148b [US1] Update deleteBillingCycle API call signature if changed in frontend/src/services/expenseApi.ts
- [X] T149b [US1] Update ExpensesPage to pass import session info to delete modal in frontend/src/pages/ExpensesPage.tsx
- [X] T150b [US1] Test: Run all integration tests, verify billing cycle deletion works across month boundaries

### Bug 2: Duplicate Import Detection Ignores Deleted Sessions

**Problem**: checkDuplicateImport() queries import_sessions without filtering by is_deleted flag, so deleted imports still show as duplicates

**Solution**: Add is_deleted column to import_sessions table, filter checkDuplicateImport to only check active sessions

### Database Migration

- [X] T151 [P] [US1] Create migration to add is_deleted column (INTEGER DEFAULT 0) to import_sessions table in backend/src/db/migrations/20251116060000_add_is_deleted_to_sessions.ts
- [X] T152 [US1] Update ImportSessionRepository.checkDuplicateImport to filter WHERE is_deleted = 0 in backend/src/models/ImportSessionRepository.ts

### Backend Implementation

- [X] T153 [P] [US1] Add softDelete(sessionId) method to ImportSessionRepository in backend/src/models/ImportSessionRepository.ts
- [X] T154 [US1] Update existing deleteImportSession endpoint to call softDelete instead of hard delete in backend/src/api/controllers/ImportController.ts
- [X] T155 [US1] Update findAll() to filter WHERE is_deleted = 0 in backend/src/models/ImportSessionRepository.ts

### Integration Testing

- [ ] T156 [P] [US1] Write integration test: Import CSV, verify duplicate detected. Delete import session, import same CSV again, verify NO duplicate warning in backend/tests/integration/ImportController.test.ts
- [ ] T157 [US1] Test: Delete import session, verify it doesn't appear in findAll() results
- [X] T158 [US1] Run all tests (unit + integration), verify 100% pass - ALL 52 TESTS PASSING

**Checkpoint**: Billing cycle deletion works across month boundaries, duplicate detection ignores deleted sessions

---

## Phase 5: HIGH PRIORITY - Delete Entire Billing Cycle (DEPRECATED - REPLACED BY PHASE 4.6)

**Goal**: Users can delete all expenses from an entire billing cycle/statement month

**Why This Priority**: Critical UX improvement - users need ability to remove entire month's imported data if needed

**TDD Approach**: Write integration tests first, then implementation

**Independent Test**: Import CSV for October statement, delete entire October billing cycle, verify all October expenses removed

### Testing (TDD - Write FIRST)

- [X] T141 [P] [US1] Write integration tests for deleting all expenses by billing cycle in backend/tests/integration/ExpenseRepository.test.ts
- [X] T142 [US1] Test: Create expenses in multiple billing cycles, delete one cycle, verify only that cycle removed
- [X] T143 [US1] Test: Delete billing cycle with no expenses, verify graceful handling

### Backend Implementation

- [X] T144 [P] [US1] Add deleteByBillingCycle(month, year) method to ExpenseRepository in backend/src/models/ExpenseRepository.ts
- [X] T145 [US1] Add DELETE /api/expenses/billing-cycle/:month/:year endpoint in backend/src/api/controllers/ExpensesController.ts
- [X] T146 [P] [US1] Add route for DELETE /api/expenses/billing-cycle/:month/:year in backend/src/api/routes/expenses.ts

### Frontend Implementation

- [X] T147 [P] [US1] Create DeleteBillingCycleModal confirmation component in frontend/src/components/DeleteBillingCycleModal.tsx
- [X] T148 [US1] Add deleteBillingCycle API call to expenseApi.ts in frontend/src/services/expenseApi.ts
- [X] T149 [US1] Add "Delete This Month's Cycle" button to MonthSelector in frontend/src/components/MonthSelector.tsx
- [X] T150 [US1] Implement delete flow: show confirmation with expense count, call API, refresh table in frontend/src/pages/ExpensesPage.tsx

**Checkpoint**: Users can delete entire billing cycles, all related expenses removed

---

## Phase 6: User Story 2 - Assign Meaningful Names to Expenses (Priority: P2)

**Goal**: Users can assign custom names to expenses, system remembers names for recurring charges

**Why This Priority**: Custom naming helps classification (User Story 3) by providing better context

**TDD Approach**: Write tests for installment detection and name matching first

**Independent Test**: Assign custom name to "Amazon Parcela 2/10", verify next month's "Parcela 3/10" gets same name automatically

### Testing (TDD - Write FIRST)

- [X] T151 [P] [US2] Write unit tests for installment pattern detector in backend/tests/unit/installment-detector.test.ts
- [X] T152 [US2] Test: Extract vendor, current, total from various installment formats (Parcela 2/10, 2/10, 2 de 10)
- [X] T153 [US2] Test: Return null for non-installment expenses
- [X] T154 [P] [US2] Write integration tests for custom name matching in backend/tests/integration/CustomNameService.test.ts
- [X] T155 [US2] Test: Match installment by vendor + amount pattern
- [X] T156 [US2] Test: Don't match if amount differs
- [X] T157 [US2] Test: Handle conflicts (multiple potential matches)

### Database & Models

- [X] T158 [P] [US2] Create CustomNameRegistry table in backend/src/db/migrations/[timestamp]_add_custom_names.ts
- [X] T159 [P] [US2] Create CustomNameRegistryRepository in backend/src/models/CustomNameRegistryRepository.ts
- [X] T160 [P] [US2] Create installment pattern detector in backend/src/utils/installment-detector.ts (extract vendor, current, total from title)

### Naming Logic

- [X] T161 [US2] Create custom name matching service in backend/src/services/CustomNameService.ts (match by vendor+installment pattern)
- [X] T162 [US2] Integrate custom name lookup into ImportService (check registry during import)
- [X] T163 [US2] Add custom name saving logic to CustomNameService (save vendor pattern + installment info)

### API Endpoints

- [X] T164 [P] [US2] Add PATCH /api/expenses/:id endpoint to update customName in backend/src/api/controllers/ExpensesController.ts
- [X] T165 [P] [US2] Update expenses routes to include PATCH endpoint in backend/src/api/routes/expenses.ts
- [X] T166 [US2] Add updateExpenseName function to expenseApi.ts in frontend/src/services/expenseApi.ts

### Frontend - Custom Naming UI

- [X] T167 [P] [US2] Create InlineEdit component for custom name editing in frontend/src/components/InlineEdit.tsx
- [X] T168 [US2] Add inline edit to ExpenseRow for customName field in frontend/src/components/ExpenseRow.tsx
- [X] T169 [US2] Wire inline edit to API in ExpensesPage in frontend/src/pages/ExpensesPage.tsx
- [X] T170 [US2] Show original title below custom name when different in frontend/src/components/ExpenseRow.tsx

### Integration Testing

- [X] T171 [US2] Integration test: Assign custom name to installment expense, verify saved
- [X] T172 [US2] Integration test: Import next installment, verify auto-assigned custom name
- [X] T173 [US2] Integration test: Assign name to non-installment, import similar vendor with different amount, verify no auto-name
- [X] T174 [US2] Integration test: Conflict resolution - if multiple matches, don't auto-assign name

**Checkpoint**: Users can assign custom names, system auto-assigns names to matching installments

---

## Phase 7: User Story 3 - Deterministic Classification (Priority: P3 - IMMEDIATE)

**Goal**: Automatically classify expenses using deterministic rules before falling back to AI

**Why This Priority**: Classification adds analytical value and helps users understand spending patterns

**TDD Approach**: Write tests for classification rules first, then implement

**Classification Rules (from spec)**:
1. **Rule 1 - Deterministic**: If vendor previously categorized → use that category
2. **Rule 2 - Installment Match**: If installment 2+ and previous installment categorized → use same category
3. **Rule 3 - Vendor Conflict**: If vendor has multiple different categories → mark as "general", use AI
4. **Rule 4 - AI Fallback**: New vendor with no history → use AI classification

**Independent Test**: Import expenses, verify known vendors get deterministic categories, installments match previous, new vendors get AI suggestions

### Testing (TDD - Write FIRST)

- [ ] T175 [P] [US3] Write unit tests for ClassificationService rules in backend/tests/unit/ClassificationService.test.ts
- [ ] T176 [US3] Test Rule 1: Known vendor → deterministic category
- [ ] T177 [US3] Test Rule 2: Installment 2/3 with 1/3 categorized → same category
- [ ] T178 [US3] Test Rule 3: Vendor with conflicting categories → mark "general", use AI
- [ ] T179 [US3] Test Rule 4: New vendor → use AI classification
- [ ] T180 [P] [US3] Write integration tests for classification in backend/tests/integration/classification.test.ts
- [ ] T181 [US3] Integration test: Import CSV, verify deterministic classification applied
- [ ] T182 [US3] Integration test: Reclassify expense, verify vendor mapping updated

### Database & Models

- [ ] T183 [P] [US3] Add classification_rule_type column to expenses table in backend/src/db/migrations/[timestamp]_add_classification.ts
- [ ] T184 [P] [US3] Create ReclassificationHistory table in same migration
- [ ] T185 [P] [US3] Create VendorCategoryMapping table in same migration
- [ ] T186 [P] [US3] Create VendorCategoryMappingRepository in backend/src/models/VendorCategoryMappingRepository.ts
- [ ] T187 [P] [US3] Create ReclassificationHistoryRepository in backend/src/models/ReclassificationHistoryRepository.ts

### Classification Logic

- [ ] T188 [P] [US3] Create ClassificationRule enum in shared/types/index.ts (DETERMINISTIC, INSTALLMENT_MATCH, AI_SUGGESTED, MANUAL_OVERRIDE)
- [ ] T189 [P] [US3] Create vendor normalization utility in backend/src/utils/vendor-normalizer.ts (lowercase, remove special chars)
- [ ] T190 [US3] Implement Rule 1: Deterministic classifier in backend/src/services/ClassificationService.ts (check VendorCategoryMapping)
- [ ] T191 [US3] Implement Rule 2: Installment matching logic (if installmentCurrent > 1, find previous installment category)
- [ ] T192 [US3] Implement Rule 3: Vendor conflict detection (multiple categories → mark "general")
- [ ] T193 [US3] Create Ollama AI client in backend/src/services/OllamaService.ts (POST localhost:11434/api/generate)
- [ ] T194 [US3] Implement Rule 4: AI classifier (only if deterministic fails)
- [ ] T195 [US3] Integrate classification into ImportService (classify during import)
- [ ] T196 [P] [US3] Update ExpenseRepository.create() to save classification_rule_type

### API Endpoints

- [ ] T197 [P] [US3] Create POST /api/expenses/:id/reclassify endpoint in backend/src/api/controllers/ExpensesController.ts
- [ ] T198 [P] [US3] Update expenses routes to include reclassify endpoint in backend/src/api/routes/expenses.ts
- [ ] T199 [US3] Add reclassify function to expenseApi.ts in frontend/src/services/expenseApi.ts

### Frontend - Classification Display & Override

- [ ] T200 [P] [US3] Add classification indicator to CategoryTag component in frontend/src/components/CategoryTag.tsx (show icon for AI vs deterministic)
- [ ] T201 [US3] Create CategoryDropdown component for reclassification in frontend/src/components/CategoryDropdown.tsx
- [ ] T202 [US3] Add reclassify handler to ExpenseRow in frontend/src/components/ExpenseRow.tsx
- [ ] T203 [US3] Wire reclassify to API in ExpensesPage in frontend/src/pages/ExpensesPage.tsx

### Error Handling & Polish

- [ ] T204 [US3] Add error handling for Ollama connection failures in backend/src/services/OllamaService.ts
- [ ] T205 [US3] Add fallback category "Uncategorized" when AI fails in backend/src/services/ClassificationService.ts
- [ ] T206 [US3] Integration test: Import known vendor (Subway), verify deterministic classification
- [ ] T207 [US3] Integration test: Import new vendor, verify AI classification (requires Ollama)
- [ ] T208 [US3] Integration test: Import installment 2/3, verify same category as 1/3
- [ ] T209 [US3] Integration test: Reclassify expense, verify vendor mapping updated

**Checkpoint**: Expenses automatically classified during import, users can override classifications, system learns from corrections

---

## Phase 7: User Story 4 - Manual Expense Entry (Priority: P4)

**Goal**: Users can manually add expenses not captured by credit card (PIX, cash, debit)

**Independent Test**: Create manual expense with PIX payment type, verify it appears in table with correct tags and billing cycle

### API Endpoints

- [ ] T184 [P] [US4] Implement POST /api/expenses for manual entry in backend/src/api/controllers/ExpensesController.ts
- [ ] T185 [P] [US4] Add createExpense function to expenseApi.ts in frontend/src/services/expenseApi.ts

### Frontend - Manual Entry Form

- [ ] T186 [P] [US4] Create ManualExpenseForm component in frontend/src/components/ManualExpenseForm.tsx
- [ ] T187 [US4] Add form fields: date, customName, amount, paymentType (dropdown), category (dropdown) in frontend/src/components/ManualExpenseForm.tsx
- [ ] T188 [US4] Calculate billing cycle for manually entered expenses in frontend/src/components/ManualExpenseForm.tsx
- [ ] T189 [US4] Add "Add Expense" button to ExpensesPage in frontend/src/pages/ExpensesPage.tsx
- [ ] T190 [US4] Wire form submission to API in ExpensesPage in frontend/src/pages/ExpensesPage.tsx
- [ ] T191 [US4] Refresh expense list after manual entry in frontend/src/pages/ExpensesPage.tsx

### Validation & Polish

- [ ] T192 [US4] Add form validation (date format, amount numeric, required fields) in frontend/src/components/ManualExpenseForm.tsx
- [ ] T193 [US4] Add success/error toast notifications in frontend/src/pages/ExpensesPage.tsx
- [ ] T194 [US4] Test: Create manual PIX expense, verify appears in correct month with PIX tag and correct billing cycle
- [ ] T195 [US4] Test: Create manual expense with category, verify classification rule is MANUAL_OVERRIDE

**Checkpoint**: Users can manually add expenses for any payment type with automatic billing cycle calculation

---

## Phase 8: User Story 5 - Enhanced Payment Type Tagging (Priority: P5)

**Goal**: Enhanced visual distinction for payment types in the table

**Note**: Basic payment type tags already exist from Phase 2. This phase adds enhancements.

**Independent Test**: View mixed expense list (imported credit, manual PIX, manual cash), verify tags are visually distinct

### Frontend Enhancements

- [ ] T196 [P] [US5] Add payment type filter to ExpenseTable in frontend/src/components/ExpenseTable.tsx
- [ ] T197 [P] [US5] Add payment type icons to PaymentTypeTag in frontend/src/components/PaymentTypeTag.tsx
- [ ] T198 [US5] Add payment type counts to MonthSelector in frontend/src/components/MonthSelector.tsx (e.g., "Nov 2025 (45 credit, 5 PIX)")
- [ ] T199 [US5] Test: Filter by payment type, verify correct expenses shown

**Checkpoint**: Payment types visually distinct, filterable, summarized per month

---

## Phase 9: Polish & Cross-Cutting Concerns

**Goal**: Performance optimization, error handling, documentation

### Backend Polish

- [ ] T200 [P] Add database indexes (vendor_name, date, category_id, billing_cycle_month) in backend/src/db/migrations/
- [ ] T201 [P] Add request logging middleware in backend/src/middleware/logger.ts
- [ ] T202 [P] Add rate limiting for AI classification (max 10 concurrent) in backend/src/services/ClassificationService.ts
- [ ] T203 Add comprehensive error handling for all controllers in backend/src/api/controllers/

### Frontend Polish

- [ ] T204 [P] Add expense count and total amount summary to ExpenseTable footer in frontend/src/components/ExpenseTable.tsx
- [ ] T205 [P] Add keyboard shortcuts (arrow keys for month nav, Enter to import) in frontend/src/pages/ExpensesPage.tsx
- [ ] T206 [P] Add expense detail modal (click row to see full details) in frontend/src/components/ExpenseDetailModal.tsx
- [ ] T207 Add loading skeleton for expense table in frontend/src/components/ExpenseTable.tsx

### Testing & Documentation

- [ ] T208 [P] Write end-to-end test: Full user journey (import CSV, classify, name, override, manual entry) in backend/tests/e2e/
- [ ] T209 [P] Create user guide in docs/USER_GUIDE.md (how to import, classify, override, understand billing cycles)
- [ ] T210 [P] Create developer guide in docs/DEVELOPER_GUIDE.md (architecture, adding categories, extending classification)
- [ ] T211 Run all tests, verify 100% pass rate
- [ ] T212 Performance test: Import 100 expenses, verify <5s total time
- [ ] T213 Performance test: Classify 50 new vendors with AI, verify <3s per expense

**Checkpoint**: Production-ready application with all user stories complete

---

## Dependencies & Execution Order

### User Story Dependency Graph

```
Phase 1 (Setup) ──► Phase 2 (Foundation) ──► Phase 3 (US1 Month Filter) ✅
                                                       │
                                                       ▼
                                              Phase 4 (US1 Billing Cycle) ⏳
                                                       │
                                                       ├──► Phase 5 (US2 - Naming)
                                                       │         │
                                                       │         ▼
                                                       │    Phase 6 (US3 - Classification)
                                                       │         │
                                                       │         ├──► Phase 7 (US4 - Manual Entry)
                                                       │         │
                                                       │         └──► Phase 8 (US5 - Enhanced Tags)
                                                       │
                                                       └──────────► Phase 9 (Polish)
```

### Key Dependencies

- **Phase 4 BEFORE Phase 5**: Billing cycle tracking should be complete before naming
- **Phase 5 BEFORE Phase 6**: Custom names improve classification accuracy
- **Phase 6 BEFORE Phase 7**: Classification should work before manual entry (manual entries need categories)
- **Phases 7-8 are independent**: Can be done in any order after Phase 6

### Parallel Opportunities

**Within Phase 4 (Billing Cycle)**:
- T074-T076, T080-T081, T082-T083 can run in parallel (migrations, tests, types)
- T084-T086, T087-T089 can run in parallel (frontend components)
- T090-T091 can run in parallel (API endpoints)

**Within Phase 5 (Custom Naming)**:
- T185-T187 can run in parallel (database and utilities)
- T191-T193 can run in parallel (API routes)
- T194, T197 can run in parallel (frontend components)

**Within Phase 6 (Classification)**:
- T202-T206 can run in parallel (database migrations and repositories)
- T207-T208 can run in parallel (type definitions and utilities)
- T171-T173 can run in parallel (API routes)
- T174-T176 can run in parallel (frontend components)

**Within Phase 7 (Manual Entry)**:
- T184-T185 can run in parallel (API endpoints and frontend API client)
- T186-T188 can run in parallel (form component development)

**Within Phase 9 (Polish)**:
- T200-T203 can run in parallel (backend improvements)
- T204-T207 can run in parallel (frontend improvements)
- T208-T210 can run in parallel (documentation)

---

## Implementation Strategy

### Current Status

- ✅ Phase 1-2: Complete
- ✅ Phase 3: Complete (Month filtering working)
- ⏳ Phase 4: Ready to start (Billing cycle tracking - IMMEDIATE PRIORITY)

### Immediate Next Steps (Phase 4)

1. **Backend**: Add billing cycle columns and service (T074-T081)
2. **Types**: Update Expense type with billing cycle fields (T082-T083)
3. **Frontend**: Add billing cycle column to table (T084-T086)
4. **Frontend**: Show import session metadata (T087-T089)
5. **API**: Add import session endpoints (T090-T092)
6. **Testing**: Verify billing cycle calculation (T093-T096)

### Incremental Delivery Plan

- **Sprint 1 (Current)**: Phase 4 complete (billing cycle tracking)
- **Sprint 2**: Phase 5 complete (custom naming)
- **Sprint 3**: Phase 6 complete (classification)
- **Sprint 4**: Phase 7 + Phase 8 complete (manual entry + enhanced tags)
- **Sprint 5**: Phase 9 complete (polish + documentation)

### Task Completion Guidelines

- Mark tasks with `[X]` when complete
- Run tests after each phase
- Update this file as tasks evolve
- Add new tasks as needed with sequential IDs (T170, T171, etc.)

---

## Total Task Count: 213 tasks

- Phase 1 (Setup): 14 tasks ✅ COMPLETE
- Phase 2 (Foundation): 38 tasks ✅ COMPLETE
- Phase 3 (US1 Month Filter): 12 tasks ✅ COMPLETE
- **Phase 4 (US1 Billing Cycle)**: 39 tasks (T074-T112) ✅ COMPLETE
- **Phase 4.5 (Bug Fixes & UX)**: 28 tasks (T113-T140) ⏳ HIGHEST PRIORITY - START HERE
- Phase 5 (US2 Naming): 17 tasks (T141-T157)
- Phase 6 (US3 Classification): 26 tasks (T158-T183)
- Phase 7 (US4 Manual Entry): 12 tasks (T184-T195)
- Phase 8 (US5 Enhanced Tags): 4 tasks (T196-T199)
- Phase 9 (Polish): 14 tasks (T200-T213)

**Current Status**: 112 tasks complete (including T097-T112 just finished), 101 tasks remaining

**Next Immediate Action**: Start Phase 4.5 - T113 (Convert ImportSessionInfo to transient state)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- TDD: Verify tests fail before implementing
- **NEW**: Billing cycle tracking added per user feedback (credit card statement month)
- **NEW**: Import session metadata display added per user feedback
- Custom naming (US2) prioritized before classification (US3) to aid classification accuracy
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
