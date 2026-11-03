# POTFOLIOO — Generated Screen Artifacts

**Stitch Project:** POTFOLIOO Bookkeeping Dashboard  
**Stitch Project ID:** `16393139376876804870`  
**Generated At:** 2 November 2026  
**Design Reference:** [DESIGN.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/DESIGN.md)  
**System Architecture:** [ARCHITECTURE.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/ARCHITECTURE.md)  
**Product Requirements:** [PRD.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/PRD.md)

---

## Screen Catalog

| # | Screen Name | Screen ID | Code (HTML) | Screenshot (PNG) |
|---|---|---|---|---|
| 1 | **POTFOLIOO Mobile Dashboard** | `ba5cb643db92417699da6cd413f9797f` | [01_mobile_dashboard.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/01_mobile_dashboard.html) | [01_mobile_dashboard.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/01_mobile_dashboard.png) |
| 2 | **POTFOLIOO Mobile Record Transaction Screen** | `43e643d18d934541abd17217f9bb4a48` | [02_mobile_record_transaction.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/02_mobile_record_transaction.html) | [02_mobile_record_transaction.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/02_mobile_record_transaction.png) |
| 3 | **POTFOLIOO Mobile Edit Expense Screen** | `192c93d865724c18836c1fbdecf7c05c` | [03_mobile_edit_expense.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/03_mobile_edit_expense.html) | [03_mobile_edit_expense.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/03_mobile_edit_expense.png) |
| 4 | **POTFOLIOO Desktop Dashboard** | `bbb0d937df2b434393bed14a979c424d` | [04_desktop_dashboard.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/04_desktop_dashboard.html) | [04_desktop_dashboard.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/04_desktop_dashboard.png) |
| 5 | **POTFOLIOO Mobile Settings & Data Screen** | `e9db095a78d24b02a3978c760cb3750f` | [05_mobile_settings_data.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/05_mobile_settings_data.html) | [05_mobile_settings_data.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/05_mobile_settings_data.png) |
| 6 | **POTFOLIOO Restore Backup Modal** | `6200bb51e2e44a1c859bef97f7441236` | [06_restore_backup_modal.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/06_restore_backup_modal.html) | [06_restore_backup_modal.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/06_restore_backup_modal.png) |
| 7 | **POTFOLIOO Delete Transaction Modal** | `1b9391da594148a0baaa5c897cee598d` | [07_delete_transaction_modal.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/07_delete_transaction_modal.html) | [07_delete_transaction_modal.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/07_delete_transaction_modal.png) |
| 8 | **POTFOLIOO Mobile Dashboard - Empty State** | `cafc06821c0849c0a9066b78265ea2c7` | [08_mobile_dashboard_empty_state.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/08_mobile_dashboard_empty_state.html) | [08_mobile_dashboard_empty_state.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/08_mobile_dashboard_empty_state.png) |
| 9 | **POTFOLIOO Mobile Transactions Ledger** | `1e7c6b7079894c3c9b18ef8337d69904` | [09_mobile_transactions_ledger.html](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/09_mobile_transactions_ledger.html) | [09_mobile_transactions_ledger.png](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/09_mobile_transactions_ledger.png) |


---

## Motion Animation Integration (Vanilla JavaScript API)

All screens use the official **Motion JavaScript API** via [`motion-controller.js`](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/motion-controller.js) (`https://motion.dev/docs/quick-start`).

- **ES Module Import:** Loaded via browser-compatible ES module import (`https://cdn.jsdelivr.net/npm/motion@latest/+esm`) with offline vendor fallback in `screens/vendor/motion.esm.js`.
- **Card Entrance:** Subtle upward slide (`y: [18, 0]`) and fade-in (`opacity: [0, 1]`) with natural spring/cubic-bezier easing.
- **Tactile Button Effects:** Neo-brutalist pointer interaction: hover lift (`y: -1px`, `scale: 1.015`) and tactile press translation (`x: 2px, y: 2px`) with compressed drop shadow.
- **Modal Physics:** Spring pop-in (`scale: [0.93, 1]`, `y: [16, 0]`) with backdrop blur fade.
- **Accessibility:** Fully honors `prefers-reduced-motion` media queries.

To test all screens and live animations interactively, launch [`screens/index.html`](file:///c:/Users/DELL/Downloads/POTFOLIOO/screens/index.html) in your browser.
