# Product Requirements Document: POTFOLIOO

**Status:** Draft for implementation planning  
**Version:** 1.0  
**Date:** 2 November 2026

## 1. Product summary

POTFOLIOO is a simple offline-first bookkeeping app for a person or small business. It records daily income and expenses and shows monthly income, expenses, and net profit. It runs as an installable responsive web app on phones and computers. Data stays on the device by default; no account or internet connection is needed for normal use after the app shell is available.

Because local data is separate on each device, the app must explain this boundary and provide a simple manual backup and restore flow.

## 2. Problem and goals

People who need basic bookkeeping often find spreadsheets cumbersome and accounting suites too complex. They need to record money in and out, then understand monthly performance, even when offline.

- Record income or an expense in a few steps on phone or PC.
- Show accurate monthly income, expense, and net totals.
- Keep core workflows usable offline after initial load/install.
- Keep records local by default, with user-controlled export and restore.
- Make type, amount, and date explicit to reduce entry errors.

## 3. Users and key use cases

**Primary user:** A sole trader, household manager, or small business owner who wants simple cash-basis tracking and can manage backups.

1. Add today's income with an amount, date, and optional note/category.
2. Record an expense, including a past date when entering receipts later.
3. Review a month and see income, expenses, and net profit/loss.
4. Find, correct, or remove an entry.
5. Export a backup and restore it on another device.

## 4. Scope

### In scope for the first release

- One local book per device, with a name and exclusive currency: **TZS (Tanzanian Shilling, TSh)**.
- Income and expense transactions with date, amount, optional category, and note.
- Monthly dashboard, transaction list, filtering, editing, and deletion.
- Versioned JSON backup and restore; optionally CSV export.
- Responsive installable PWA with offline app shell and local persistence.

### Out of scope

- Automatic cloud sync, multiple users, bank feeds, payment processing, invoicing, payroll, inventory, tax filing, or double-entry accounting.
- Multi-currency conversion, CSV import, attachments, and recurring transactions.
- Financial advice or audited accounting reports.

## 5. Functional requirements

### First run and settings

- Let the user choose a book name (default “My Book”) and currency code from a supported list.
- A browser locale may suggest a currency, but the user must explicitly confirm it.
- Explain that data is stored in this browser/device and must be exported to move it elsewhere.
- Allow changing book name. Changing currency requires a warning: existing amounts will not be converted.

### Transaction capture

- Each entry contains a unique ID, type (`income` or `expense`), positive amount, transaction date, optional category and note, and created/updated timestamps. Currency is inherited from the book.
- Amount must be positive and follow the supported currency's fraction digits. Use integer minor units internally (such as cents), never floating-point arithmetic for totals.
- Date is required and defaults to today's local calendar date. The transaction date determines its reporting month.
- Allow save, cancel, edit, and delete. Confirm deletion and offer undo when practical.
- Category and note are optional; they must not block quick capture. Validation errors are inline and preserve entered form values.

### Transaction list

- Display newest transaction date first, with a stable ordering for entries on the same date.
- Show date, type, amount, and optional category/note; do not rely on color alone to convey type.
- Filter by month and type. Search notes/categories if it fits the MVP budget.
- Include useful empty states and a clear filter reset.
- Reflect edits and deletions immediately in both the list and summary.

### Monthly dashboard

- Default to the current local calendar month; allow navigating to past and future months.
- Display total income, total expenses, and net profit/loss, plus transaction count.
- Calculation: `net = sum(income) - sum(expense)` for entries dated in the selected local month.
- Clearly label a negative result as a loss/negative net. Show a zero-data state for months without entries.
- Keep all figures refreshed after every successful add, edit, or delete.

### Backup and portability

- Export all book settings and transactions to a versioned JSON file, including an export timestamp.
- Validate a selected backup before restore. Preview book name, currency, backup date, and transaction count.
- MVP restore replaces the current local book only after clear confirmation. Recommend exporting current data first. Merge is out of scope unless duplicate detection and conflict handling are implemented.
- CSV transaction export is optional for MVP; CSV import is out of scope.
- All export/restore operations happen locally through user-selected files.

## 6. Non-functional requirements

- **Offline:** After initial app load/install, core routes, styles, and workflows work without network. Runtime must not depend on external fonts, scripts, or APIs.
- **Persistence:** Use durable browser-managed storage with versioned schema and migrations. Report storage/quota failures; never indicate success if a write failed.
- **Responsive:** Support phone and desktop screens, touch input, keyboard, and screen readers.
- **Accessibility:** Target WCAG 2.2 AA for core flows: semantic controls, labels, visible focus, adequate contrast, and announcements for saved/error states.
- **Performance:** Common screens remain responsive with 10,000 transactions on a typical supported device.
- **Privacy:** Financial data stays local. No analytics or diagnostics may contain amounts, notes, categories, or backup contents.
- **Browser baseline:** Select and document current evergreen browser versions during implementation. The app remains usable in browsers that cannot install PWAs.

## 7. Information architecture

1. **Dashboard:** selected month, three totals, recent activity, add action.
2. **Transactions:** list, filters/search, edit and delete.
3. **Add/Edit:** type, amount, date, category, note, save/cancel.
4. **Settings & data:** book details, currency, export, restore, local storage explanation.

On phones, use compact navigation and keep “Add transaction” easy to reach. Desktop may use a side or top navigation but should have the same features.

## 8. Primary flows

**Record an entry:** Open Add → choose income/expense → enter amount → confirm date → optionally add details → Save → show confirmation and updated totals.

**Review a month:** Open Dashboard → choose month → review income, expenses, and net → open the filtered transaction list for details.

**Move to another device:** Export a backup on the current device → save it somewhere accessible → open the app on the new device → select Restore → review backup → confirm replacement → verify totals.

## 9. Success measures and release acceptance

Validate through usability sessions rather than collecting financial telemetry:

- A first-time user records an entry without help in under one minute.
- A user can correctly explain monthly net from the dashboard.
- A user can export and restore a sample book without missing or duplicate records.
- Supported offline/reopen scenarios do not lose data.
- Core flows work with keyboard navigation and common phone screen readers.

Release criteria:

- Create a book, add/edit/delete income and expenses, and see correct month totals.
- Entries persist after restart; core workflows work offline after app shell caching.
- Local timezone month boundaries produce correct results.
- Money parsing, formatting, and arithmetic avoid binary floating-point.
- Backup restores settings and transactions on another supported device with matching totals.
- Invalid/corrupt backups are rejected without modifying existing records.
- Storage failures are visible and never show a false save success.
- Local storage and backup behavior are explained in the app.

## 10. Assumptions to confirm before implementation

- One person/book per device; no automatic phone-to-PC sync.
- Cash-basis reporting by transaction date and one currency per book.
- PWA is the preferred shared codebase for phone and PC.
- Browser storage can be cleared by the user or operating system; manual backups are the portability mechanism.
- Restore replaces the current book in the MVP.
