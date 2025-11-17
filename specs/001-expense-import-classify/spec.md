# Feature Specification: Credit Card Expense Import and Classification

**Feature Branch**: `001-expense-import-classify`
**Created**: 2025-11-15
**Status**: Draft
**Input**: User description: "Importing credit card expenditure and visualizing it, classifying the expenses"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Import and View Monthly Expenses (Priority: P1)

As a user, I want to import my credit card expenses from a CSV file and view them in a sortable table, so I can see all my monthly spending in one place.

**Why this priority**: This is the foundation of the entire feature. Without the ability to import and view expenses, no other functionality (classification, manual entry) has value. This provides immediate utility by centralizing expense data.

**Independent Test**: Can be fully tested by uploading a Nubank CSV file and verifying that all expenses appear in the table with correct values. Delivers immediate value by consolidating expense data in a single view.

**Acceptance Scenarios**:

1. **Given** I have a Nubank credit card CSV file with expense data, **When** I upload the file, **Then** the system imports all expenses and displays them in a table with date, title, and amount columns
2. **Given** expenses are displayed in the table, **When** I click on a column header (date, amount, title), **Then** the table sorts by that column in ascending/descending order
3. **Given** the table contains multiple expenses, **When** I view the table, **Then** each expense shows its original title exactly as it appears in the CSV file
4. **Given** I have imported expenses for a specific month, **When** I view the table, **Then** all expenses for that month are visible and none are missing

---

### User Story 2 - Assign Meaningful Names to Expenses (Priority: P2)

As a user, I want to assign meaningful names to my expenses (separate from the bank's title) and have the system remember these names for recurring charges, so I can easily identify what each expense represents across multiple months.

**Why this priority**: Raw bank titles (like "Amazon 8/10") are not meaningful. This feature adds critical context that makes expense tracking useful. It also introduces smart recognition for installment payments, reducing manual work in future months.

**Independent Test**: Can be tested independently by importing expenses, assigning custom names, and verifying that recurring installments automatically receive the same name in subsequent imports.

**Acceptance Scenarios**:

1. **Given** I have imported expenses, **When** I assign a custom name to an expense (e.g., "New Laptop" for "Amazon Marketplace - Parcela 2/10"), **Then** the system saves this name and displays it alongside the original title
2. **Given** I previously named an installment expense (e.g., "Amazon Marketplace - Parcela 2/10" = "New Laptop"), **When** I import next month's expenses containing "Amazon Marketplace - Parcela 3/10" with the same amount, **Then** the system automatically assigns the name "New Laptop" to the new installment
3. **Given** I have expenses with custom names, **When** I view the expense table, **Then** I see both the custom name and the original bank title for each expense
4. **Given** I import an expense that matches a previous installment pattern but has a different amount, **When** the system processes it, **Then** it does not automatically assign the previous name (requires manual naming)

---

### User Story 3 - Automatic Expense Classification (Priority: P3)

As a user, I want expenses to be automatically classified into categories (Food, Travel, Housing, etc.) using intelligent rules and AI assistance, so I can understand my spending patterns without manual categorization work.

**Why this priority**: Builds on the foundation of P1 and P2. Classification adds analytical value but requires expenses to be imported and named first. This is the intelligence layer that makes the system truly useful for financial insights.

**Independent Test**: Can be tested by importing expenses and verifying that they receive appropriate category tags based on deterministic rules (for known vendors) and AI suggestions (for new vendors).

**Acceptance Scenarios**:

1. **Given** I have previously categorized expenses from a specific vendor (e.g., "Subway" as Food), **When** I import a new expense from the same vendor, **Then** the system automatically assigns the Food category without requiring AI classification
2. **Given** I have an expense from a vendor I've never seen before, **When** the system processes it, **Then** it sends the expense details to the local AI service and assigns the suggested category
3. **Given** I have recurring installment expenses (e.g., "Amazon - Parcela 2/3"), **When** the system processes the next installment (Parcela 3/3), **Then** it automatically assigns the same category as the previous installment without AI classification
4. **Given** I have expenses from a vendor with multiple different categories in the past (e.g., Amazon has Food, Hobbies, Library), **When** a new Amazon expense is imported, **Then** the system marks Amazon as "general" and uses AI to classify based on the expense name and amount
5. **Given** the system classified an expense, **When** I view the expense table, **Then** I see the category displayed as a tag next to the expense

---

### User Story 4 - Manual Expense Entry and Classification Override (Priority: P4)

As a user, I want to manually add expenses not captured by my credit card (like cash or PIX transfers) and override AI classifications when they're incorrect, so the system learns my preferences and improves its accuracy over time.

**Why this priority**: Completes the expense tracking system by handling non-credit-card transactions and enabling user corrections. This creates a feedback loop that improves classification accuracy over time.

**Independent Test**: Can be tested by manually creating an expense, assigning it a category, and verifying that similar expenses from the same vendor are influenced by this manual classification in the future.

**Acceptance Scenarios**:

1. **Given** I am viewing the expense table, **When** I add a manual expense with name, amount, date, and category, **Then** the system stores it and displays it in the table with a "manual" payment type tag
2. **Given** the AI classified an expense as "Food" but it should be "Hobbies", **When** I manually change the category to "Hobbies", **Then** the system records this reclassification in the learning history
3. **Given** I previously reclassified a vendor's expense (e.g., changed "Store X" from Travel to Food), **When** a new expense from "Store X" is imported, **Then** the system gives higher weight to the Food category based on my manual correction
4. **Given** I have a manual expense entry form, **When** I submit it, **Then** the expense appears in the table with fields: date, custom name, original title (can be same as name), payment type (manual/PIX/cash), category, and amount
5. **Given** I manually classify expenses from a vendor multiple times with different categories, **When** future expenses from that vendor are processed, **Then** the system marks the vendor as "general" and uses AI with context from all past classifications

---

### User Story 5 - Expense Type Tagging (Priority: P5)

As a user, I want to see visual tags indicating whether each expense was a credit card charge, debit transaction, manual entry, or other payment type, so I can quickly distinguish between different payment methods.

**Why this priority**: Adds visual clarity and organization to the expense table. This is a UX enhancement that makes the data easier to scan but doesn't add new functional capabilities.

**Independent Test**: Can be tested by importing credit card expenses, adding manual expenses, and verifying that appropriate tags (credit card, debit, manual, PIX) appear correctly for each expense type.

**Acceptance Scenarios**:

1. **Given** I import expenses from my Nubank credit card CSV, **When** I view the table, **Then** all imported expenses display a "Credit Card" tag
2. **Given** I manually add a PIX transfer expense, **When** I save it, **Then** it displays a "PIX" tag in the expense table
3. **Given** I manually add a debit transaction, **When** I save it, **Then** it displays a "Debit" tag in the expense table
4. **Given** expenses have payment type tags, **When** I view the table, **Then** tags use distinct colors or icons to make different payment types visually distinguishable
5. **Given** I am entering a manual expense, **When** I fill out the form, **Then** I can select the payment type from options: Credit Card, Debit, PIX, Cash, Other

---

### Edge Cases

- What happens when the CSV file has malformed data (missing columns, incorrect date format, non-numeric amounts)?
- How does the system handle duplicate imports (same expense imported twice)?
- What happens when the AI service (Ollama) is unavailable or returns an error?
- How does the system handle expenses with negative amounts (refunds)?
- What happens when a recurring installment has the same charge number/total/amount pattern but is actually a different purchase?
- How does the system handle expenses with special characters or Unicode in the title (e.g., emojis, accented characters)?
- What happens when a user tries to sort by a column with mixed data types or empty values?
- How does the system handle very large CSV files (thousands of expenses)?
- What happens when two different vendors have similar names (e.g., "Amazon" vs "Amazon Marketplace")?

## Requirements *(mandatory)*

### Functional Requirements

#### Import & Display

- **FR-001**: System MUST accept CSV files in Nubank format with columns: date (YYYY-MM-DD), title (string, may contain quotes), amount (numeric in Brazilian Reais)
- **FR-002**: System MUST parse CSV files and extract all expenses, handling escaped quotes within title fields correctly
- **FR-003**: System MUST display imported expenses in a table with columns: date charged, custom name, original title, payment type tag, category tag(s), and amount
- **FR-004**: System MUST allow users to sort the expense table by any column (date, name, title, amount, category) in ascending or descending order
- **FR-005**: System MUST persist all imported expenses to the local database
- **FR-006**: System MUST validate CSV data before import and reject files with missing required columns or invalid data formats

#### Naming & Recognition

- **FR-007**: System MUST allow users to assign a custom name to any expense, separate from the original bank title
- **FR-008**: System MUST save custom names and associate them with the expense record
- **FR-009**: System MUST detect recurring installment expenses using the pattern "[vendor] - Parcela X/Y" where X is current installment and Y is total installments
- **FR-010**: System MUST automatically assign the same custom name to subsequent installments that match the pattern: (installment_number - 1, total_installments, amount)
- **FR-011**: System MUST display both the custom name (if assigned) and the original title in the expense table

#### Classification - Deterministic Rules

- **FR-012**: System MUST support user-defined expense categories (initial set: Food, Travel, Library, Hobbies, Housing, Subscriptions, Other)
- **FR-013**: System MUST allow users to create additional expense categories beyond the initial set
- **FR-014**: System MUST maintain a vendor history that tracks which categories have been assigned to each vendor across all expenses
- **FR-015**: System MUST automatically classify expenses from vendors with exactly one historical category using that category (no AI required)
- **FR-016**: System MUST automatically assign the same category to recurring installment expenses (Parcela X/Y) by matching against the previous installment using tuple (current_installment - 1, total_installments, amount)
- **FR-017**: System MUST mark vendors as "general" when they have been assigned more than one category across different expenses
- **FR-018**: System MUST skip deterministic classification and proceed to AI classification for vendors marked as "general" or vendors with no classification history

#### Classification - AI Assisted

- **FR-019**: System MUST send expenses to a local AI service (Ollama) for classification when deterministic rules cannot be applied
- **FR-020**: System MUST provide the AI with expense details including: custom name, original title, amount, date, and vendor name
- **FR-021**: System MUST include reclassification history in AI prompts when available, giving higher weight to user-corrected categories
- **FR-022**: System MUST accept structured output from the AI service containing the expense and its suggested category
- **FR-023**: System MUST handle AI service failures gracefully by marking expenses as "Uncategorized" or "Other" when AI is unavailable

#### Manual Entry & Override

- **FR-024**: System MUST allow users to manually add expenses with fields: date, name, title, amount, payment type, and category
- **FR-025**: System MUST support manual expense payment types: Credit Card, Debit, PIX, Cash, Other
- **FR-026**: System MUST allow users to manually change the category of any expense (imported or manual)
- **FR-027**: System MUST record all manual category changes in a reclassification history table, linked to the expense and vendor
- **FR-028**: System MUST use reclassification history to influence future AI classifications for the same vendor

#### Payment Type & Tagging

- **FR-029**: System MUST tag all imported CSV expenses as "Credit Card" payment type by default
- **FR-030**: System MUST display payment type as a visual tag in the expense table
- **FR-031**: System MUST display expense category as a visual tag in the expense table
- **FR-032**: System MUST use icons and colors to make tags visually distinct and easy to scan

#### Logging & Debugging

- **FR-033**: System MUST log all classification decisions (both deterministic and AI-based) with sufficient detail for debugging
- **FR-034**: System MUST log which classification method was used for each expense (deterministic rule, AI, manual override)
- **FR-035**: System MUST log AI request/response data for troubleshooting classification issues

### Key Entities

- **Expense**: Represents a single financial transaction with attributes: unique ID, date, custom name (optional), original title, amount, payment type (credit/debit/manual/PIX/cash/other), category, vendor name, source (imported/manual), import month/year, installment info (current/total, if applicable)

- **Category**: Represents an expense classification with attributes: unique ID, category name, description (optional), user-defined flag, active/archived status

- **Vendor History**: Tracks categorization patterns per vendor with attributes: vendor name, list of categories assigned historically, count per category, "general" vendor flag (true if multiple categories)

- **Reclassification History**: Records user corrections to classifications with attributes: expense ID, original category, new category, timestamp, vendor name, reason/notes (optional)

- **Custom Name Registry**: Associates custom names with installment patterns with attributes: vendor pattern, installment total, amount, custom name, first assigned date

- **Import Session**: Represents a single CSV import operation with attributes: session ID, import date/time, filename, number of expenses imported, number of errors, month/year of expenses

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can import a CSV file with 100 expenses and see all expenses displayed in the table within 5 seconds
- **SC-002**: Users can sort the expense table by any column and see results reordered within 1 second
- **SC-003**: System correctly auto-assigns names to 95% of recurring installment expenses without user intervention
- **SC-004**: System correctly auto-classifies 80% of expenses from known vendors using deterministic rules (no AI calls needed)
- **SC-005**: AI classification completes for new vendor expenses within 3 seconds per expense
- **SC-006**: Users can manually add an expense and see it appear in the table within 2 seconds
- **SC-007**: System successfully handles CSV files with up to 500 expenses without errors or performance degradation
- **SC-008**: User can identify expense payment types at a glance using visual tags without reading text labels
- **SC-009**: System learns from user reclassifications and applies them to future expenses from the same vendor with 100% consistency for single-category vendors
- **SC-010**: Classification decisions are logged with sufficient detail that a developer can trace why any expense received its category within 1 minute of reviewing logs

## Assumptions

### Technology Stack
- **Platform**: TypeScript with Node.js backend, web application accessible via localhost
- **UI Framework**: Modern web framework with component-based architecture (specifics to be determined in planning phase)
- **Database**: Lightweight, cross-platform database suitable for local storage (SQLite assumed based on constitution requirements)
- **AI Service**: Ollama running locally on the user's machine, accessible via HTTP API

### Scope Boundaries
- **Out of Scope**: User authentication, multi-user support, cloud synchronization, mobile apps
- **Out of Scope**: Dashboard visualizations, charts, spending trends (future features)
- **Out of Scope**: Budget tracking, financial goals, bill reminders
- **Out of Scope**: Integration with bank APIs for automatic import
- **Out of Scope**: Export functionality for reports or data backups
- **In Scope**: Basic table-based expense viewing and management
- **In Scope**: CSV import from Nubank format only (other banks future work)

### Business Rules
- **Currency**: All amounts are in Brazilian Reais (R$)
- **Date Format**: CSV uses YYYY-MM-DD, display format to be determined based on Brazilian locale preferences
- **Installment Detection**: Follows Brazilian credit card convention of "Parcela X/Y" pattern
- **Category Defaults**: System starts with 7 predefined categories, user can add more
- **AI Model**: Uses Ollama with default model selection (specific model to be configured during setup)
- **Classification Priority**: Deterministic rules always preferred over AI for performance and consistency

### Data Handling
- **Duplicate Prevention**: Assumed that user will not import the same CSV file twice; duplicate detection not required for MVP
- **Data Retention**: All expenses retained indefinitely unless manually deleted
- **Reclassification History**: Kept indefinitely to improve learning over time
- **Error Handling**: Invalid CSV rows are skipped and logged; import continues for valid rows
