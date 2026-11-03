# POTFOLIOO — Google Stitch UI Generation Prompts

**Version:** 1.0  
**Date:** 2 November 2026  
**Status:** Ready for Google Stitch Prompt Execution  
**Target Design Engine:** Google Stitch (Text-to-UI / StitchMCP)  
**Associated Specs:** [DESIGN.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/DESIGN.md) | [ARCHITECTURE.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/ARCHITECTURE.md) | [PRD.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/PRD.md)

---

## Master Design System Directives for Google Stitch

Whenever prompting Google Stitch for POTFOLIOO screens, enforce this **Global Style Envelope**:

> **Art Direction & Aesthetic:** Neo-brutalist tactile fintech UI for an offline-first bookkeeping app.
> - **Canvas & Cards:** Background canvas is warm cream (`#FFFDF8`). Content containers and cards are pure white (`#FFFFFF`) with prominent **2px solid Blackstone (`#171717`) outlines** and distinct **4px 4px 0px `#171717` hard offset drop shadows** (no soft blur).
> - **Corners:** Outer cards `16px` border-radius, buttons and inputs `12px` border-radius, icon tiles `10px` border-radius, badges fully rounded capsules (`9999px`).
> - **Color Scheme:**
>   - **Primary Action & Structural Brand:** Slate Navy (`#33415C`), pressed dark (`#1F2737`), soft neutral tint (`#EEF1F5`).
>   - **Income, Profit & Inflows:** Citron Lime (`#BFD200`), dark text (`#171717`), soft surface tint (`#F7FAE4`).
>   - **Expenses, Outflows & Attention:** Vivid Amber (`#FFA200`), dark text (`#171717`), soft surface tint (`#FFF3DF`).
>   - **Active Navigation, Links & Focus:** Electric Sky (`#48CAE4`), soft surface tint (`#EEF9FD`).
>   - **Base Neutral & Text:** Blackstone (`#171717`), secondary text (`#5B5B5B`), subtle borders (`#D9D6CE`).
>   - **Status:** Success (`#237A45`), Danger (`#B42318`).
> - **Typography:** Geometric modern sans-serif (`Manrope`), with strict **tabular figures** (`tabular-nums`) for currency figures, counts, and dates.
> - **Accessibility:** Figures first. Never communicate income vs expense by color alone—always pair colors with explicit labels ("Income", "Expense", "Profit", "Loss") and directional icons. Minimum touch target height 48px.

---

## Screen Prompts Catalog

```
├── Prompts
│   ├── STITCH-01: First-Run Onboarding & Book Setup (Mobile 390px)
│   ├── STITCH-02: Monthly Dashboard — Full Data State (Mobile 390px)
│   ├── STITCH-02D: Monthly Dashboard (Desktop 1200px Responsive View)
│   ├── STITCH-03: Monthly Dashboard — Zero-Data Empty State (Mobile 390px)
│   ├── STITCH-04: Transactions Ledger & Filter View (Mobile 390px)
│   ├── STITCH-05: Add / Record New Transaction Drawer (Mobile 390px)
│   ├── STITCH-06: Edit Transaction with Delete Trigger (Mobile 390px)
│   ├── STITCH-07: Monthly Cash Flow & Category Reports (Mobile 390px)
│   ├── STITCH-08: Settings & Data Portability Hub (Mobile 390px)
│   ├── STITCH-09: Restore Backup Validation Modal (Universal Overlay)
│   └── STITCH-10: Delete Transaction Confirmation Dialog (Universal Overlay)
```

---

### Prompt STITCH-01: First-Run Onboarding & Book Setup

- **Screen ID:** `STITCH-01-SETUP`
- **Device Viewport:** Mobile PWA (390 × 844 px)
- **Role:** First launch onboarding screen where a new user initializes their local bookkeeping ledger.

#### Prompt Text:
```text
Design a mobile PWA onboarding screen (390x844px) for "POTFOLIOO", an offline-first personal & small business bookkeeping app.

Visual Style:
- Aesthetic: Neo-brutalist tactile fintech. Warm cream canvas background (#FFFDF8).
- High contrast: 2px solid Blackstone (#171717) outlines on all cards, inputs, and buttons.
- Hard offset shadows: 4px 4px 0 #171717 on prominent cards and primary buttons (zero blur).
- Card corners: 16px radius. Buttons and inputs: 12px radius.
- Primary Accent: Slate Navy (#33415C) & Electric Sky (#48CAE4). Secondary Neutral: Blackstone (#171717).

Screen Layout & Content:
1. Top Section / Brand Intro:
   - Centered app icon tile (56x56px, Royal Blue fill with 2px Blackstone border, 3px shadow, featuring a clean white ledger/wallet icon).
   - App title: "POTFOLIOO" in bold 800-weight Display font (28px).
   - Subtitle: "Simple, offline-first bookkeeping. Fast records, crystal-clear monthly cash flow."

2. Local Storage Notice Card:
   - A white surface card with 2px Blackstone outline and 3px offset shadow.
   - Header with a subtle lock/device icon and bold title: "Your Data Stays on This Device".
   - Explanatory copy: "POTFOLIOO works completely offline without accounts or cloud tracking. Your records stay private in this browser. You can export a backup anytime from Settings."

3. Setup Form Card:
   - White card container with 2px Blackstone border and 4px offset shadow.
   - Field 1: "Book Name" label. Input pre-filled with "My Book" (48px height, white fill, 2px border, 12px radius). Helper text: "You can rename your book anytime."
   - Field 2: "Base Currency" label. Dropdown selector displaying "USD ($) - United States Dollar" with a clear down chevron. Explanatory text below: "Default currency for amounts. Changing currency later does not convert past numbers."

4. Action Footer:
   - Sticky primary button: "Create My Book" (Royal Blue #33415C fill, crisp white bold text, 2px Blackstone outline, 4px hard shadow, 52px height).
   - Below button: Centered subtle caption: "Version 1.0 • Offline Ready".
```

---

### Prompt STITCH-02: Monthly Dashboard (Full Data State)

- **Screen ID:** `STITCH-02-DASHBOARD`
- **Device Viewport:** Mobile PWA (390 × 844 px)
- **Role:** The main daily dashboard displaying monthly totals, recent transactions, and quick action trigger.

#### Prompt Text:
```text
Design a mobile PWA home dashboard screen (390x844px) for "POTFOLIOO" offline bookkeeping app with active financial records.

Visual Style:
- Warm Canvas background (#FFFDF8), pure white (#FFFFFF) cards with 2px solid Blackstone (#171717) outlines and 4px 4px 0 #171717 hard offset shadows.
- Typography: Bold Manrope with tabular numbers (tabular-nums) for all currency figures.
- Color system: Slate Navy (#33415C) & Electric Sky (#48CAE4) for primary action and income; Vivid Amber (#FFA200) for expenses; Blackstone (#171717) for borders, text, and shadows.

Screen Layout & Content:
1. Top Header:
   - Left: Book title "My Book" in bold 20px with a small edit pencil icon. Below it, an offline status pill badge (rounded capsule, 6px green dot, "Local Storage • Offline Ready").
   - Right: Settings gear icon button (44x44px, white surface, 2px Blackstone outline, 3px shadow).

2. Month Switcher Bar:
   - Centered month navigation card: Left arrow button "←", bold month label "November 2026", right arrow button "→".
   - Small text button below: "Current Month".

3. Visual Anchor — Net Profit Hero Card:
   - Prominent white card with 2px Blackstone outline, 16px radius, and 4px offset shadow.
   - Top row: Caption "NET CASH FLOW" and a bold pill badge "● Net Profit" (Royal Blue tint #F7FAE4 background, Royal Blue text, 12px).
   - Center: Massive tabular currency amount "+$3,420.00" in 34px bold Blackstone numbers.
   - Bottom row: Subtle meta text "Based on 14 transactions this month".

4. Income & Expenses Summary Duo:
   - Two side-by-side cards (or compact stacked pair):
     Card A (Income): White card, 2px border, 3px shadow. Icon tile (40x40px, Royal Blue fill with white down-arrow). Label "Total Income". Tabular amount "$5,650.00" with "8 entries".
     Card B (Expense): White card, 2px border, 3px shadow. Icon tile (40x40px, Nitro Orange fill with white up-arrow). Label "Total Expenses". Tabular amount "$2,230.00" with "6 entries".

5. Recent Activity Section:
   - Section header with title "Recent Transactions" and right-aligned link "See all (14) →".
   - List of 3 transaction items in white card rows with 2px borders:
     Row 1: Royal Blue arrow-down tile. Title "Client Retainer - Acme Corp", Date "Nov 02", Category "Consulting". Right side: "+$1,500.00" in bold Blackstone, with a small blue "Income" tag.
     Row 2: Nitro Orange arrow-up tile. Title "Office Supplies & Paper", Date "Nov 01", Category "Supplies". Right side: "-$84.50" in bold Blackstone, with a small orange "Expense" tag.
     Row 3: Nitro Orange arrow-up tile. Title "High-Speed Internet Bill", Date "Oct 31", Category "Utilities". Right side: "-$120.00" in bold Blackstone, with a small orange "Expense" tag.

6. Persistent Actions & Bottom Navigation:
   - Floating thumb-friendly button above nav: "+ Add Transaction" (Royal Blue #33415C fill, white bold text, 2px Blackstone outline, 4px shadow, full width with 16px margins).
   - Fixed Bottom Nav Bar (64px height, white surface, 2px Blackstone top border): 4 items:
     1. [Dashboard] (Active, Royal Blue icon & text)
     2. [Transactions] (Blackstone icon & text)
     3. [Reports] (Blackstone icon & text)
     4. [Settings] (Blackstone icon & text)
```

---

### Prompt STITCH-02D: Monthly Dashboard (Desktop 1200px View)

- **Screen ID:** `STITCH-02D-DESKTOP`
- **Device Viewport:** Desktop Responsive Browser (1200 × 800 px)
- **Role:** Desktop presentation of the monthly dashboard showcasing the multi-column layout and expansive data tables.

#### Prompt Text:
```text
Design a responsive desktop web view (1200x800px) for "POTFOLIOO" offline bookkeeping dashboard.

Visual Style:
- Warm Canvas background (#FFFDF8), 1200px centered max-width content container with 32px gutters.
- Neo-brutalist tactile styling: 2px solid Blackstone (#171717) outlines, 4px 4px 0 #171717 offset shadows, 16px card radius.
- Manrope typography with tabular figures. Slate Navy (#33415C) & Electric Sky (#48CAE4) and Vivid Amber (#FFA200) semantic accents.

Desktop Header & Navigation:
- Top full-width navigation bar: Left logo "POTFOLIOO" with ledger icon tile. Next: "My Book (USD)" book switcher dropdown.
- Center nav links: [Dashboard - Active with blue underline], [Transactions], [Reports], [Settings].
- Right side: Local Storage offline status pill ("Offline Storage Active") and Primary "+ Add Transaction" button (Royal Blue, 4px shadow, 44px height).

Dashboard Grid Layout:
1. Top Control Bar:
   - Left: "November 2026 Overview".
   - Right: Month Switcher widget with [← Prev], "November 2026", [Next →], and "Today" button.

2. Three-Card Summary Row (3 columns):
   - Card 1 (Net Result): Large hero card. Title "Net Profit", amount "+$3,420.00" in 32px bold tabular font, "+24% vs last month" badge.
   - Card 2 (Income): Royal Blue accent. Icon tile with down arrow. Title "Total Income", amount "$5,650.00", "8 transactions".
   - Card 3 (Expenses): Nitro Orange accent. Icon tile with up arrow. Title "Total Expenses", amount "$2,230.00", "6 transactions".

3. Main Content Split:
   - Left Column (65% width): "Recent Transactions Ledger". A clean table with columns: Date, Type, Category & Note, Amount, Actions.
     Includes 4 rows with alternating subtle dividers, explicit "Income"/"Expense" badges, right-aligned amounts, and "..." edit menu buttons.
   - Right Column (35% width): "Quick Stats & Breakdown". Compact cards showing:
     - Top spending category: "Operations: $1,200.00 (54%)".
     - Data Portability Quick Card: "Export Backup" button and "Last backup: 2 days ago".
```

---

### Prompt STITCH-03: Monthly Dashboard (Zero-Data / Empty State)

- **Screen ID:** `STITCH-03-EMPTY`
- **Device Viewport:** Mobile PWA (390 × 844 px)
- **Role:** Empty state dashboard shown for a fresh book or a month with no recorded entries.

#### Prompt Text:
```text
Design a mobile PWA screen (390x844px) for the empty / zero-data state of "POTFOLIOO" bookkeeping app.

Visual Style:
- Neo-brutalist design: Warm Canvas background (#FFFDF8), 2px solid Blackstone (#171717) borders, 4px hard offset shadows.
- Slate Navy (#33415C) & Electric Sky (#48CAE4) action color, Blackstone (#171717) text.

Screen Layout:
1. Header: Book title "My Book", offline status badge, Settings icon.
2. Month Switcher: Centered card showing "December 2026" with arrow buttons.
3. Zero Summary Cards:
   - Net Profit Card showing "$0.00" in large tabular font, with a neutral pill badge "No activity yet".
   - Dual row with Income "$0.00" (0 entries) and Expense "$0.00" (0 entries).
4. Central Empty State Illustration & Prompt:
   - Centered white card with 2px Blackstone outline and 4px offset shadow.
   - Large 64x64px rounded icon tile with Royal Blue Tint background (#F7FAE4), 2px Blackstone outline, showing an open notebook and pencil icon.
   - Bold headline: "No transactions in December".
   - Description copy: "Record your first income or expense for this month to see your cash flow and net totals update automatically."
   - Prominent primary CTA button: "+ Add First Transaction" (Royal Blue #33415C, white text, 2px border, 4px shadow, 50px height).
5. Fixed Bottom Navigation Bar (Dashboard selected).
```

---

### Prompt STITCH-04: Transactions Ledger & Filter View

- **Screen ID:** `STITCH-04-TRANSACTIONS`
- **Device Viewport:** Mobile PWA (390 × 844 px)
- **Role:** Full transaction ledger with search, multi-factor filtering, and transaction management.

#### Prompt Text:
```text
Design a mobile PWA transactions ledger screen (390x844px) for "POTFOLIOO" bookkeeping app.

Visual Style:
- Neo-brutalist tactile fintech UI: Warm Canvas (#FFFDF8), 2px Blackstone (#171717) outlines, 4px 4px 0 #171717 offset shadows.
- Slate Navy (#33415C) & Electric Sky (#48CAE4) for income/active filters; Vivid Amber (#FFA200) for expenses; Blackstone (#171717) for text.

Screen Content:
1. Header & Search Bar:
   - Page Title: "Transactions" in bold 24px font.
   - Search input box (48px height, white fill, 2px Blackstone outline, search magnifying glass icon, placeholder: "Search notes or categories...").

2. Month & Type Filter Controls:
   - Month selector pill: White chip with 2px border, calendar icon, "November 2026 ▾".
   - Segmented filter chips row:
     - [All (14)] -> Active chip: Royal Blue fill (#33415C), white text, 2px Blackstone border, 3px shadow.
     - [Income (8)] -> Inactive chip: White fill, Blackstone text, 2px border.
     - [Expenses (6)] -> Inactive chip: White fill, Blackstone text, 2px border.
   - Summary counter text: "Showing 14 records • Total Net: +$3,420.00".

3. Transaction List:
   - Grouped by Date Headers (e.g. "Today - Monday, Nov 2", "Yesterday - Sunday, Nov 1").
   - Transaction item cards (White surface, 2px Blackstone border, 12px radius):
     - Item 1: Royal Blue tile with incoming arrow. Title: "Web Design Project", Category: "Consulting", Date: "Nov 02". Right side: Amount "+$2,400.00" in bold tabular numbers, with a pill badge "Income".
     - Item 2: Nitro Orange tile with outgoing arrow. Title: "SaaS Software Subscription", Category: "Software", Date: "Nov 02". Right side: Amount "-$49.00", pill badge "Expense".
     - Item 3: Nitro Orange tile with outgoing arrow. Title: "Business Lunch with Client", Category: "Meals", Date: "Nov 01". Right side: Amount "-$64.20", pill badge "Expense".
     - Item 4: Royal Blue tile with incoming arrow. Title: "Digital Asset Sale", Category: "Royalties", Date: "Nov 01". Right side: Amount "+$350.00", pill badge "Income".

4. Floating Add Button & Bottom Nav:
   - Floating "+ Add" action button (Royal Blue, 4px shadow).
   - Bottom Tab Bar with "Transactions" tab highlighted in Royal Blue.
```

---

### Prompt STITCH-05: Add / Record New Transaction (Drawer / Modal)

- **Screen ID:** `STITCH-05-ADD-TXN`
- **Device Viewport:** Mobile PWA (390 × 844 px) Slide-Up Drawer / Screen
- **Role:** High-speed, distraction-free transaction recording flow.

#### Prompt Text:
```text
Design a mobile PWA transaction entry screen (390x844px) for "POTFOLIOO" bookkeeping app.

Visual Style:
- Neo-brutalist tactile aesthetic: White surface card (#FFFFFF) with 2px solid Blackstone (#171717) outline and 4px offset shadow.
- Clear color cues: Slate Navy (#33415C) & Electric Sky (#48CAE4) for Income, Vivid Amber (#FFA200) for Expense.
- Bold typography with large tabular numerals for amounts.

Screen Layout & Form Elements:
1. Header Bar:
   - Left: "Cancel" text button (Blackstone).
   - Center: Title "Record Transaction" in bold 18px font.
   - Right: "Save" text action button (Royal Blue, bold).

2. Type Segmented Switcher (Crucial control):
   - Two large segmented buttons side-by-side with 2px Blackstone outline:
     - Button A: "[ + Income ]" (Active: Royal Blue fill #33415C, white text, 3px shadow, checkmark icon).
     - Button B: "[ - Expense ]" (Inactive: White fill, Nitro Orange text #C63E0A, 2px border).

3. Amount Input Section (Visual Centerpiece):
   - Large amount card with 2px Blackstone border and 3px shadow.
   - Label: "Amount (USD)".
   - Massive numeric input display: "$ 1,250.00" in 36px bold tabular font (Manrope).
   - Inline note: "Stored accurately in integer minor units (cents)."

4. Transaction Date Field:
   - Label: "Transaction Date (Determines reporting month)".
   - Input box with calendar icon: "2026-11-02" (Pre-filled with today's local date).

5. Category Selector:
   - Label: "Category (Optional)".
   - Text input with dropdown arrow: "Client Payment".
   - Quick category suggestion chips below: [Consulting] [Sales] [Services] [Reimbursement].

6. Note / Description:
   - Label: "Note or Description (Optional)".
   - Text field: "Final milestone payment for Q4 redesign".

7. Bottom Action Bar:
   - Sticky primary button: "Save Transaction" (Royal Blue #33415C fill, white bold text, 2px Blackstone border, 4px hard shadow, 52px height).
   - Secondary button below: "Cancel" (White fill, Blackstone text, 2px border).
```

---

### Prompt STITCH-06: Edit Transaction with Delete Trigger

- **Screen ID:** `STITCH-06-EDIT-TXN`
- **Device Viewport:** Mobile PWA (390 × 844 px)
- **Role:** Transaction modification screen with pre-filled inputs and destructive delete action.

#### Prompt Text:
```text
Design a mobile PWA edit transaction screen (390x844px) for "POTFOLIOO" bookkeeping app.

Visual Style:
- Neo-brutalist style with 2px Blackstone (#171717) outlines, 4px hard offset shadows.
- Vivid Amber (#FFA200) expense accent, Danger (#B42318) for destructive actions, Slate Navy (#33415C) & Electric Sky (#48CAE4) for save.

Screen Layout & Details:
1. Header:
   - Title: "Edit Expense" with a Close "✕" icon button.
   - Subtitle: "ID: txn_94a2f8c1 • Created Oct 31, 2026".

2. Pre-filled Transaction Form:
   - Segmented type control with "Expense" selected (Nitro Orange fill #FFA200, white text, 2px Blackstone border).
   - Amount input pre-filled with "$ 120.00" in 32px tabular font.
   - Date picker displaying "2026-10-31".
   - Category input: "Utilities".
   - Note field: "High-speed office internet connection".

3. Action Controls:
   - Primary Save Button: "Update Transaction" (Royal Blue fill #33415C, white text, 2px border, 4px shadow, 50px height).
   - Destructive Delete Button: "Delete This Entry" (White surface, Danger red #B42318 text and 2px border, trash can icon, 3px shadow).
   - Explanatory note: "Deleting this transaction will instantly recalculate October 2026 totals."
```

---

### Prompt STITCH-07: Monthly Cash Flow & Category Reports

- **Screen ID:** `STITCH-07-REPORTS`
- **Device Viewport:** Mobile PWA (390 × 844 px)
- **Role:** High-level monthly analytics, cash flow breakdown, and ranked category spending.

#### Prompt Text:
```text
Design a mobile PWA monthly reports screen (390x844px) for "POTFOLIOO" bookkeeping app.

Visual Style:
- Neo-brutalist layout: Warm Canvas (#FFFDF8), white cards (#FFFFFF) with 2px Blackstone (#171717) outlines and 4px offset shadows.
- Visual charts strictly use Slate Navy (#33415C) & Electric Sky (#48CAE4) for Income and Vivid Amber (#FFA200) for Expense with accessible text labels and legends.

Screen Layout:
1. Header & Period Selector:
   - Title: "Cash Flow Reports".
   - Month selector carousel: [←] "November 2026" [→].

2. Cash Flow Breakdown Card:
   - White card, 2px border, 4px shadow.
   - Row 1: "Total Income" -> "$5,650.00" (Royal Blue marker).
   - Row 2: "Total Expenses" -> "$2,230.00" (Nitro Orange marker).
   - Divider line (2px Blackstone).
   - Row 3: "Net Margin" -> "+$3,420.00 (60.5% profit)".
   - Proportional split bar below: Visual stacked horizontal bar where 72% is Slate Navy (#33415C) & Electric Sky (#48CAE4) and 28% is Vivid Amber (#FFA200), with clear percentage tags.

3. Top Spending Categories Card:
   - Title: "Expenses by Category".
   - Ranked list of category bars:
     1. "Office & Rent": $1,200.00 (54%) with an orange progress bar.
     2. "Software & Hosting": $450.00 (20%) with an orange progress bar.
     3. "Equipment & Hardware": $380.00 (17%).
     4. "Travel & Meals": $200.00 (9%).
   - Text link below: "View all expense transactions →".

4. Export Report Link:
   - Secondary button: "Download Month CSV" with spreadsheet icon (White fill, 2px border, 3px shadow).

5. Bottom Navigation Bar with "Reports" tab active.
```

---

### Prompt STITCH-08: Settings & Data Portability Hub

- **Screen ID:** `STITCH-08-SETTINGS`
- **Device Viewport:** Mobile PWA (390 × 844 px)
- **Role:** Ledger settings, currency management, JSON backup export/restore, and privacy documentation.

#### Prompt Text:
```text
Design a mobile PWA settings and data portability screen (390x844px) for "POTFOLIOO" bookkeeping app.

Visual Style:
- Neo-brutalist architecture: Warm Canvas (#FFFDF8), 2px solid Blackstone (#171717) outlines, 4px offset shadows.
- Primary actions in Slate Navy (#33415C) & Electric Sky (#48CAE4); Danger (#B42318) for destructive restore warnings.

Screen Sections:
1. Header: Title "Settings & Data" with subtitle "Manage your book and offline backups".

2. Book Configuration Card:
   - White card, 2px border, 4px shadow.
   - Field 1: Book Name input displaying "My Book" with a "Rename" button.
   - Field 2: Book Currency dropdown displaying "USD - US Dollar ($)".
   - Warning callout box inside card: Soft orange background (#FFF3DF), 1px border (#FFA200), warning triangle icon:
     "Warning: Changing currency updates future display only. Existing recorded amounts are not converted."

3. Backup & Data Portability Card (Critical feature):
   - White card, 2px border, 4px shadow.
   - Section Title: "Data Backup & Migration".
   - Description: "All bookkeeping records are stored exclusively in your device browser. To transfer to another phone or computer, export a backup file."
   - Action Button 1: "Export JSON Backup" (Primary Royal Blue button, 48px height, download icon, 4px shadow). Caption: "Downloads a full versioned backup file".
   - Action Button 2: "Restore Backup" (Secondary white button with upload icon, 2px Blackstone outline, 3px shadow). Caption: "Restores records from an existing backup file".
   - Action Button 3: "Export Transactions as CSV" (Secondary text action for Excel / Google Sheets).

4. Storage & Privacy Info Card:
   - White card with 2px border.
   - Privacy guarantee: "100% Offline & Private. No accounts, no telemetry, no cloud storage. Total records: 14 transactions • Database version: v1.0."

5. Bottom Navigation Bar with "Settings" active.
```

---

### Prompt STITCH-09: Restore Backup Validation Modal (Overlay)

- **Screen ID:** `STITCH-09-RESTORE-MODAL`
- **Device Viewport:** Universal Modal Dialog (360 × 600 px centered on darkened backdrop)
- **Role:** Strict safety check previewing imported backup metadata before overwriting local records.

#### Prompt Text:
```text
Design a high-contrast modal dialog (360x600px) centered over a darkened backdrop for restoring a backup in "POTFOLIOO" bookkeeping app.

Visual Style:
- Heavy neo-brutalist modal: Surface white (#FFFFFF), 2px solid Blackstone (#171717) border, prominent 6px 6px 0 #171717 hard offset shadow, 16px radius.
- Danger and warning cues: Soft yellow/orange warning container, Danger red (#B42318) button for replacement confirmation.

Modal Content & Elements:
1. Header:
   - Warning icon tile (44x44px, Nitro Orange fill, white exclamation mark, 2px Blackstone border).
   - Modal Title: "Confirm Ledger Restore".
   - Close icon "✕" in top right.

2. Backup File Inspection Summary:
   - A nested preview box with 2px Blackstone outline and #F4F2EC muted background:
     - "File Format": potfolioo-backup (Version 1)
     - "Book Name": Northstar Studio
     - "Currency": USD ($)
     - "Backup Created": 2026-11-01 14:30 UTC
     - "Transactions to Import": 142 entries

3. Destructive Warning Box:
   - Light red container (#FFF3DF) with 1px border (#B42318).
   - Bold warning copy: "Warning: Restoring this file will completely replace your current local book ('My Book', 14 entries). This action cannot be undone unless you export your current data first."

4. Action Buttons:
   - Button 1: "Replace Current Book" (Destructive button: Danger Red #B42318 fill, white text, 2px Blackstone border, 4px shadow, 48px height).
   - Button 2: "Export Current Book First" (Royal Blue outline button).
   - Button 3: "Cancel" (Tertiary text button).
```

---

### Prompt STITCH-10: Delete Transaction Confirmation Dialog

- **Screen ID:** `STITCH-10-DELETE-MODAL`
- **Device Viewport:** Compact Modal Sheet (340 × 420 px)
- **Role:** Explicit confirmation dialog preventing accidental transaction deletion.

#### Prompt Text:
```text
Design a compact delete confirmation modal (340x420px) for "POTFOLIOO" offline bookkeeping app.

Visual Style:
- Neo-brutalist alert: White surface (#FFFFFF), 2px solid Blackstone (#171717) outline, 4px offset shadow, 16px radius.
- Danger Red (#B42318) for delete action, Blackstone (#171717) for cancel.

Modal Content:
1. Centered Icon Tile:
   - 48x48px square tile, soft red tint (#FFF3DF), 2px Blackstone outline, showing a bold Blackstone trash can icon.

2. Text Hierarchy:
   - Headline: "Delete Transaction?" (20px bold font).
   - Description copy: "Are you sure you want to remove 'Client Retainer - Acme Corp' (+$1,500.00, Nov 02, 2026)? This will immediately recalculate your monthly net totals."

3. Action Buttons:
   - Primary Destructive CTA: "Yes, Delete Entry" (Danger Red #B42318 fill, white bold text, 2px Blackstone outline, 4px shadow, 48px height).
   - Secondary Button: "Keep Transaction" (White surface, Blackstone text, 2px border, 3px shadow, 48px height).
```

---

## 5. Instructions for Running Prompts in Google Stitch

To generate screens in Google Stitch using StitchMCP or the web UI:

1. **Create or select the Stitch project:** e.g., using `create_project` tool or web console with the title `"POTFOLIOO - Offline PWA Bookkeeping"`.
2. **Apply Design System:** Upload [DESIGN.md](file:///c:/Users/DELL/Downloads/POTFOLIOO/DESIGN.md) to define color tokens (`#33415C`, `#FFA200`, `#171717`, `#FFFDF8`), typography (Manrope + tabular numerals), and 2px border / 4px hard shadow rules.
3. **Execute Prompts Sequentially:**
   - Execute `STITCH-01` (Onboarding Setup)
   - Execute `STITCH-02` (Monthly Dashboard Full)
   - Execute `STITCH-04` (Transactions Ledger)
   - Execute `STITCH-05` (Add Transaction Drawer)
   - Execute `STITCH-07` (Reports)
   - Execute `STITCH-08` (Settings & Data Portability)
   - Execute `STITCH-09` & `STITCH-10` (Modal Overlays)
4. **Inspect Generated Screens:** Verify high contrast, tabular numeral alignment, and proper neo-brutalist shadow offset.
