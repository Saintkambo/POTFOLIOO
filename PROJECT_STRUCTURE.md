# POTFOLIOO — Project Structure & Architectural Alignment

**Date:** 2 November 2026  
**Status:** Active Implementation Architecture  
**System Architecture:** [ARCHITECTURE.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/ARCHITECTURE.md)  
**Product Requirements:** [PRD.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/PRD.md)  
**Design System:** [DESIGN.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/DESIGN.md)

---

## 1. Directory Tree Overview

The codebase is organized in strict adherence to the Clean Architecture / Hexagonal Ports-and-Adapters structure defined in `ARCHITECTURE.md` Section 4:

```
POTFOLIOO/
├── .gitignore
├── ARCHITECTURE.md                  # System architecture specification
├── DESIGN.md                        # Visual design system & token definitions
├── PAGES_AND_COMPONENTS.md          # Complete page catalog & atomic component inventory
├── PRD.md                           # Product requirements document
├── PROJECT_STRUCTURE.md             # This structural reference document
├── STITCH_PROMPTS.md                # Google Stitch prompt library
├── index.html                       # PWA entry HTML with Manrope & meta tags
├── package.json                     # React 19 + TypeScript + Dexie + Vite + Tailwind
├── postcss.config.js                # PostCSS Tailwind processor
├── tailwind.config.js               # Design tokens (#33415C, #FFA200, #BFD200, #48CAE4)
├── tsconfig.json                    # TypeScript compiler configuration & path aliases
├── vite.config.ts                   # Vite bundler with PWA Service Worker precaching
│
├── public/                          # PWA static assets & webmanifest
│   ├── favicon.svg
│   └── manifest.webmanifest         # PWA standalone manifest
│
├── screens/                         # High-fidelity Stitch UI mockups & HTML templates
│   ├── README.md
│   ├── 01_mobile_dashboard.html & .png
│   ├── 02_mobile_record_transaction.html & .png
│   ├── 03_mobile_edit_expense.html & .png
│   ├── 04_desktop_dashboard.html & .png
│   ├── 05_mobile_settings_data.html & .png
│   ├── 06_restore_backup_modal.html & .png
│   ├── 07_delete_transaction_modal.html & .png
│   ├── 08_mobile_dashboard_empty_state.html & .png
│   └── 09_mobile_transactions_ledger.html & .png
│
└── src/
    ├── main.tsx                     # PWA client mount & service worker bootstrap
    ├── App.tsx                      # Root conditional router (Onboarding vs AppShell)
    ├── vite-env.d.ts
    │
    ├── domain/                      # 1. FRAMEWORK-INDEPENDENT DOMAIN LAYER
    │   ├── errors.ts                # Domain & validation error classes
    │   ├── money.ts                 # Integer minor unit parsing, arithmetic & Intl formatting
    │   ├── date.ts                  # Date-only YYYY-MM-DD parsing & local calendar bounds
    │   └── models/
    │       ├── book.ts              # Book entity, schema versioning, validation
    │       ├── transaction.ts       # Transaction entity (minor units, explicit type)
    │       └── summary.ts           # Pure month summary calculation (zero float drift)
    │
    ├── application/                 # 2. APPLICATION USE CASES & PORTS
    │   ├── ports/
    │   │   ├── book-repository.ts         # Book persistence port
    │   │   ├── transaction-repository.ts  # Transaction persistence & querying port
    │   │   └── backup-port.ts             # Serialization & validation port
    │   └── use-cases/
    │       ├── initialize-book.ts         # First-run initialization
    │       ├── record-transaction.ts      # Transaction creation
    │       ├── update-transaction.ts      # Transaction edit & delete
    │       ├── get-monthly-summary.ts     # Cash flow computation
    │       └── export-backup.ts           # JSON backup, restore & CSV export
    │
    ├── infrastructure/              # 3. INFRASTRUCTURE & ADAPTERS
    │   ├── db/
    │   │   ├── database.ts                      # Dexie.js IndexedDB schema & indexes
    │   │   ├── dexie-book-repository.ts         # BookRepositoryPort implementation
    │   │   └── dexie-transaction-repository.ts  # TransactionRepositoryPort implementation
    │   ├── backup/
    │   │   └── json-backup-adapter.ts           # potfolioo-backup JSON & CSV adapter
    │   └── storage/
    │       └── storage-manager.ts               # Storage quota & persistence checker
    │
    ├── presentation/                # 4. USER INTERFACE & REACT PRESENTATION
    │   ├── context/
    │   │   └── BookContext.tsx      # Dependency injection & reactive ledger state
    │   ├── components/
    │   │   ├── ui/                  # Atomic primitives (2px borders, 4px hard shadows)
    │   │   │   ├── Button.tsx       # Primary, Secondary, Destructive, Ghost
    │   │   │   ├── Card.tsx         # White container with offset shadow
    │   │   │   ├── Input.tsx        # Accessible form field with inline error
    │   │   │   ├── Badge.tsx        # Income / Expense / Profit / Loss pills
    │   │   │   └── IconTile.tsx     # 44px/48px square tile with solid fill
    │   │   ├── molecules/
    │   │   │   ├── MonthNavigator.tsx    # Carousel month switcher
    │   │   │   ├── TypeSwitcher.tsx      # Segmented [+ Income] / [- Expense]
    │   │   │   └── TransactionRow.tsx    # Ledger item with tabular amounts
    │   │   ├── organisms/
    │   │   │   ├── Header.tsx            # Sticky chrome with rename & offline badge
    │   │   │   ├── BottomNav.tsx         # Mobile 4-tab docked navigation bar
    │   │   │   ├── NetHeroCard.tsx       # Primary visual anchor (Net Profit/Loss)
    │   │   │   ├── SummaryCards.tsx      # Total Income & Total Expenses duo
    │   │   │   ├── TransactionModal.tsx  # Add & Edit transaction drawer
    │   │   │   ├── RestoreModal.tsx      # Backup inspection & replacement modal
    │   │   │   └── DeleteModal.tsx       # Destructive deletion confirmation
    │   │   └── layout/
    │   │       └── AppShell.tsx          # Responsive mobile (390px) to desktop chassis
    │   └── pages/
    │       ├── OnboardingPage.tsx        # First-run setup (PG-01)
    │       ├── DashboardPage.tsx         # Monthly dashboard (PG-02)
    │       ├── TransactionsPage.tsx      # Filterable transaction ledger (PG-03)
    │       ├── ReportsPage.tsx           # Cash flow breakdown & categories (PG-05)
    │       └── SettingsPage.tsx          # Portability, JSON/CSV & privacy (PG-06)
    │
    └── styles/
        └── index.css                # Tailwind directives & CSS design tokens
```

---

## 2. Alignment Matrix with ARCHITECTURE.md

| ARCHITECTURE.md Requirement | Implementation Artifact | Architectural Verification |
|---|---|---|
| **Separation of Concerns** | `src/domain/`, `src/application/`, `src/infrastructure/`, `src/presentation/` | Domain logic contains no React or Dexie dependencies; UI interacts strictly through use cases and repository ports. |
| **IndexedDB Persistence** | `src/infrastructure/db/database.ts` | Uses `Dexie` wrapper with typed stores (`books`, `transactions`) and composite indexes (`[bookId+transactionDate]`). |
| **Integer Minor Units** | `src/domain/money.ts` | Amounts are stored in cents/integers (`amountMinor`). Decimal strings are parsed with string splitting to eliminate float errors. |
| **Date-Only Strings** | `src/domain/date.ts` | Dates are stored strictly as `YYYY-MM-DD` strings. Calendar queries use local month bounds (`2026-11-01` to `2026-11-30`), avoiding UTC shifts. |
| **Versioned JSON Backup** | `src/infrastructure/backup/json-backup-adapter.ts` | Implements envelope `format: 'potfolioo-backup'`, validates IDs, timestamps, and schema version before restoration. |
| **Formula-Safe CSV** | `src/infrastructure/backup/json-backup-adapter.ts` | Quotes values and prepends single quotes to values starting with `=`, `+`, `-`, or `@`. |
| **PWA & Offline Readiness** | `vite.config.ts`, `manifest.webmanifest`, `src/main.tsx` | App shell cached via service worker; persistence requested via `navigator.storage.persist()`. |

---

## 3. Alignment Matrix with PRD.md

| PRD.md Requirement | Implementation Artifact | Functional Verification |
|---|---|---|
| **First Run & Settings** | `src/presentation/pages/OnboardingPage.tsx` | Lets user choose Book Name (default "My Book") and confirm currency code; explains local storage boundary. |
| **Fast Transaction Capture** | `src/presentation/components/organisms/TransactionModal.tsx` | Segmented type toggle, auto-focused amount, default today's date, optional category/note. |
| **Monthly Dashboard** | `src/presentation/pages/DashboardPage.tsx` | Net Profit hero card, Income and Expense duo cards, zero-data empty state, recent transactions. |
| **Transaction List & Filter** | `src/presentation/pages/TransactionsPage.tsx` | Search by notes/categories, type filter chips (All, Income, Expense), chronological ordering. |
| **Cash-Basis Monthly Reporting** | `src/domain/models/summary.ts` & `src/presentation/pages/ReportsPage.tsx` | `net = sum(income) - sum(expense)`; category distribution bars. |
| **Backup and Restore Safety** | `src/presentation/components/organisms/RestoreModal.tsx` | Previews book name, currency, backup timestamp, and record count before atomic replacement. |

---

## 4. Visual & Token Alignment (DESIGN.md)

All presentation elements use the updated brand color palette:
- **`#33415C` (Slate Navy):** Primary buttons (`Button.tsx`), header chrome branding, and authoritative card framing.
- **`#BFD200` (Citron Lime):** Inflows, Income tiles (`IconTile.tsx`), Net Profit indicators, and "+ Income" toggle segment.
- **`#FFA200` (Vivid Amber):** Outflows, Expense tiles (`IconTile.tsx`), "- Expense" toggle segment, and warning callouts.
- **`#48CAE4` (Electric Sky):** Active navigation tabs (`BottomNav.tsx`), focus rings, and interactive chips.
- **`#171717` (Blackstone):** Heavy 2px solid outlines and `4px 4px 0 #171717` hard offset shadows.
