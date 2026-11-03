# POTFOLIOO — UI/UX Design System

**Status:** Proposed visual and interaction system  
**Version:** 1.0  
**Date:** 2 November 2026

## 1. Design intent

POTFOLIOO should feel confident, practical, and a little playful. Use the attached mobile UI as inspiration for its heavy black outlines, crisp white cards, offset shadows, bold headline type, and small icon tiles with bright fills. Translate those visual cues to bookkeeping: prioritize legible figures, calm transaction rows, and clear income/expense distinctions.

The reference image is a visual sample for composition and icon treatment. Its bookmark-collection content, labels, and exact colors do not carry over. POTFOLIOO uses the refined palette: **Deep Slate Navy (`#33415C`)**, **Vivid Amber Orange (`#FFA200`)**, **Vibrant Citron Lime (`#BFD200`)**, and **Electric Sky Cyan (`#48CAE4`)**, anchored by **Blackstone (`#171717`)** outlines and warm neutrals.

## 2. Design principles

1. **Figures first:** Make monthly income, expenses, and net result the clearest information on the dashboard.
2. **Bold but readable:** Use the reference's strong outlines and offset shadows on key containers and actions, with restrained decoration around dense financial data.
3. **Color with meaning:** Blue marks primary actions and income; orange marks expenses and attention. Always include a text label or icon so meaning never depends on color alone.
4. **Fast daily entry:** Keep the add transaction action visible and make amount, type, and date easy to reach.
5. **Consistent across devices:** Use the same type, color, and component rules on phone and desktop; adapt layout rather than changing the visual language.

## 3. Color palette

### Brand colors

| Token | Hex | Role & Functional Use |
|---|---|---|
| `Slate Navy` | `#33415C` | Primary button fill, header chrome accents, high-emphasis containers, authoritative brand styling |
| `Slate Navy Dark` | `#1F2737` | Pressed/hover primary action state, dark borders |
| `Slate Navy Tint` | `#EEF1F5` | Muted neutral card backgrounds, subtle active row highlights |
| `Electric Sky` | `#48CAE4` | Interactive link accent, active tab highlight, focus rings, secondary interactive cues |
| `Electric Sky Tint` | `#EEF9FD` | Selected filter background, interactive chip highlights |
| `Citron Lime` | `#BFD200` | Inflows, income icon tiles, net profit indicators, positive delta tags (paired with dark text) |
| `Citron Lime Dark` | `#8C9B00` | High-contrast lime text/borders on white surfaces where needed |
| `Citron Lime Tint` | `#F7FAE4` | Soft income card surfaces, credit table row badges |
| `Vivid Amber` | `#FFA200` | Outflows, expense icon tiles, attention badges, financial warnings (paired with dark text) |
| `Vivid Amber Dark` | `#C67C00` | High-contrast amber text/borders on light surfaces |
| `Vivid Amber Tint` | `#FFF3DF` | Soft expense card surfaces, debit table row badges |
| `Blackstone` | `#171717` | Structural 2px borders, display typography, iconography, 4px hard offset drop shadows |

### Supporting neutrals

| Token | Hex | Use |
|---|---|---|
| `Canvas` | `#FFFDF8` | Main page background; warm, quiet base |
| `Surface` | `#FFFFFF` | Cards, forms, menus, dialogs |
| `Surface Muted` | `#F4F2EC` | Table headers, secondary panels, disabled areas |
| `Text Secondary` | `#5B5B5B` | Supporting labels and metadata |
| `Border Subtle` | `#D9D6CE` | Dividers and low-emphasis boundaries |
| `Success` | `#237A45` | Saved/complete status with text or icon |
| `Danger` | `#B42318` | Destructive deletions and validation errors |

### Color rules

- Use Blackstone (`#171717`) or Slate Navy (`#33415C`) for text and structural outlines; do not use light saturated colors for long body copy on white.
- Use Slate Navy (`#33415C`) as the primary button action color, paired with Electric Sky (`#48CAE4`) for active tabs, selected states, and focus rings.
- Use Citron Lime (`#BFD200`) strictly for income and profit cues. Always render text and icons inside Citron Lime tiles in Blackstone (`#171717`) or Slate Navy (`#33415C`) for maximum contrast (10.5:1 ratio).
- Use Vivid Amber (`#FFA200`) strictly for expense and outflow cues. Render icons and labels inside Vivid Amber tiles in Blackstone (`#171717`) for high contrast (6.8:1 ratio).
- Net profit uses Blackstone (`#171717`) as its base numeral color with a Citron Lime (`#BFD200`) or Electric Sky (`#48CAE4`) pill and a clear “Profit” or “Loss” label; never communicate financial status with color alone.
- Reserve Success (`#237A45`) and Danger (`#B42318`) for database status and destructive deletion dialogs, not routine income/expense classification.
- Maintain accessible contrast (WCAG 2.2 AA / AAA): all interactive touchpoints and text meet or exceed 4.5:1 (normal text) and 3:1 (large text/controls).

## 4. Typography

### Typeface

Use a locally bundled **Manrope** variable font if licensing and build setup permit, with an offline-safe fallback stack: `Manrope, Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`. Bundle the font with the app rather than fetching it from a remote service. If no font asset is available, the system fallback remains the intended design.

Use a compact, confident headline style inspired by the reference. Keep body copy neutral and highly legible. Use tabular numerals for all money and count values so columns align while scanning.

### Type scale

| Style | Size / line height | Weight | Use |
|---|---:|---:|---|
| Display | 36 / 40 px | 800 | Dashboard welcome or main headline; one per screen at most |
| H1 | 30 / 34 px | 800 | Page title on phone; up to 36 px on wide screens |
| H2 | 22 / 28 px | 750 | Section and summary-card headings |
| H3 | 18 / 24 px | 700 | Card title and dialog heading |
| Body | 16 / 24 px | 450–550 | Main copy, form values, transaction descriptions |
| Body Small | 14 / 20 px | 450–550 | Secondary labels and metadata |
| Caption | 12 / 16 px | 600 | Compact status, date labels, helper text |
| Money Large | 30–36 / 38–42 px | 750 | Primary monthly net amount |
| Money Standard | 18–20 / 26 px | 700 | Income/expense totals and list amounts |

### Typography rules

- Use sentence case for headings and buttons.
- Use `font-variant-numeric: tabular-nums` for currency, dates, and transaction counts.
- Preserve the currency symbol/code alongside amounts; never rely on symbol alone where ambiguity is possible.
- Avoid all-caps labels except for tiny decorative tags; use regular case for financial categories and controls.
- Keep line lengths short on mobile; do not let a display heading push transaction data below the fold unnecessarily.

## 5. Spacing, layout, and shape

### Spacing scale

Use a 4 px base grid and these spacing tokens:

| Token | Value | Typical use |
|---|---:|---|
| `space-1` | 4 px | Icon-to-label micro gap |
| `space-2` | 8 px | Compact inline gap |
| `space-3` | 12 px | Form label/control gap |
| `space-4` | 16 px | Standard card and row padding |
| `space-5` | 20 px | Card internal spacing |
| `space-6` | 24 px | Section spacing on phone |
| `space-8` | 32 px | Major content group separation |
| `space-10` | 40 px | Desktop section separation |
| `space-12` | 48 px | Page-level vertical rhythm |

### Layout rules

- **Phone:** 16 px page gutters; single-column dashboard; full-width amount input and primary actions; transaction list uses compact rows.
- **Tablet:** 24 px gutters; use a two-column summary grid when cards remain comfortably readable.
- **Desktop:** Center content in a 1200 px maximum-width region with 32 px gutters. Keep dashboard summaries in a row and use a main-plus-sidebar layout only when it improves scanning.
- Use 12–16 px gaps between dashboard cards and 24–32 px between major sections.
- Forms should fit a narrow screen without horizontal scrolling. Keep labels visible above fields.
- Maintain a clear focus order and generous separation between destructive actions and normal actions.

### Shape and elevation

- Standard card radius: 16 px. Buttons and inputs: 12 px. Small icon tile: 10 px. Pill labels: fully rounded.
- Use Blackstone outlines of 2 px for primary cards and fields; use 1 px subtle borders for dense table separators.
- Apply the reference's offset hard shadow selectively: `4px 4px 0 #171717` for primary cards and prominent controls. Use `3px 3px 0 #171717` for compact icon tiles.
- Do not place hard shadows on every transaction row. Use them on hero summaries, the add action, dialogs, and featured cards to keep financial screens calm.
- Pressed state reduces the shadow and moves the control 2 px toward its shadow to create a tactile response.

## 6. Iconography

### Style

Adapt the reference's icon treatment: simple recognizable pictograms, bold black outlines, minimal interior detail, and square rounded tiles with a bright solid fill. Use one consistent icon source and stroke weight across the product; prefer bundled SVG icons so every screen works offline.

- Standard icon stroke: 2.25–2.5 px, rounded joins/caps where available.
- Common control icon: 20–24 px; navigation icon: 22–24 px; colored icon tile: 44–48 px.
- Use Royal Blue, Nitro Orange, or a neutral tint as the icon-tile background; keep the icon itself Blackstone or white only when contrast is strong.
- Every icon-only control needs an accessible name and visible focus state. Add text for key actions such as Add transaction, Export backup, and Delete.
- Use familiar finance metaphors: plus for add, arrow-down/in for income, arrow-up/out for expense, calendar for date, wallet/book for ledger, chart for report, gear for settings, download/upload for backup and restore.
- Do not copy the sample's folder, bookmark, or collection icons unless they map clearly to a real POTFOLIOO task.

## 7. Core component specifications

### Buttons

- **Primary:** Royal Blue fill, Blackstone 2 px outline, white label, 4 px offset Blackstone shadow. Minimum height 48 px.
- **Secondary:** Surface fill, Blackstone outline and text, 3 px offset shadow; Nitro Orange may appear as a small icon accent.
- **Tertiary:** Text action with no hard shadow; use for low-emphasis navigation and cancel actions.
- **Destructive:** Danger text/icon on white or pale red surface with confirmation for deletion. Do not style destructive actions as the primary blue action.
- Provide hover, pressed, focus-visible, disabled, and loading states. Disabled state must remain legible and must not appear interactive.

### Form fields

- Labels sit above controls; helper text/error sits below.
- Inputs have a 48–56 px minimum height, white surface, Blackstone border, 12 px radius, and clear focus ring.
- Amount field uses large tabular numerals and a currency prefix/suffix separated from editable digits. Do not prefill ambiguous zeroes.
- Type selector uses two labeled segments: **Income** with a blue cue and **Expense** with an orange cue. The selected state also has a check/selected indicator.
- Date picker has a calendar icon and supports keyboard entry where the platform control permits.
- Errors use both Danger color and a short text explanation; retain the entered values.

### Summary cards

- Dashboard net card is the visual anchor: large amount, month label, “Profit” or “Loss,” and optional compact trend/context line.
- Income and expense cards use quieter blue and orange icon tiles with clearly labeled amounts.
- Cards use consistent padding (20–24 px), 2 px outline, 16 px radius, and selective offset shadow.
- Do not use charts as the only way to read totals; figures and labels remain visible without graphics.

### Transaction rows

- Each row shows a small type icon tile, description/category, date, and a right-aligned tabular amount.
- Show an explicit “Income” or “Expense” cue, especially in filtered or color-independent contexts.
- Use a thin separator or restrained card outline; reserve offset shadows for the first/featured item or compact empty states.
- Desktop may display a table with columns; phone uses stacked rows with amount aligned to the trailing edge.
- Row actions appear on selection/overflow, not as a cluster of tiny icons beside every amount.

### Navigation and feedback

- Navigation labels: Dashboard, Transactions, Reports, Settings. Use the same icon family and selected Royal Blue accent.
- On phones, use a compact bottom bar or top navigation and a persistent add action that does not cover content.
- Toast/snackbar feedback should be brief, announced to assistive technology, and not require color to understand.
- Dialogs use a white surface, Blackstone outline, modest hard shadow, clear title, and explicit cancel/confirm labels.

## 8. Screen-by-screen application

### 8.1 First-run setup

- Warm Canvas background with one short bold headline and a simple ledger/wallet icon tile.
- Show the local-storage explanation in plain language before entering data.
- Book name and currency selection use the shared form field system. Make the suggested currency editable and require confirmation.
- One Royal Blue primary action, “Create my book.” Keep setup short and avoid decorative illustrations that delay the first entry.

### 8.2 Dashboard

- Header contains book name/greeting and a clear month switcher. Settings access uses a familiar gear icon with accessible label.
- Put the large net summary first; present income and expense as adjacent cards on desktop and stacked/paired cards on phone.
- Show a recent-activity section with a clear “See all” route to Transactions.
- Keep a strong add button visible in the header on desktop and thumb-reachable near the bottom on phone.
- Use a tasteful blue/orange tile accent and sparse highlight blocks; avoid a rainbow of category colors.

### 8.3 Transactions

- Page title and search/filter controls sit above the list. Month and type filters are compact labeled chips or a clear filter sheet on phone.
- Use blue/orange icon tiles for type, but keep labels and amounts explicit.
- Desktop: align date, description, type, and amount into a readable table. Phone: use stacked rows with enough spacing for touch.
- Empty state: ledger icon tile, concise message, one “Add first transaction” primary action.

### 8.4 Add/Edit transaction

- Use a dedicated screen on phone and a centered dialog/drawer on desktop if the form remains spacious and accessible.
- Order fields: type → amount → date → category → note. Focus the amount field on opening only when that does not disrupt assistive technology.
- Keep Save anchored at the bottom on small screens, above the keyboard/safe-area when practical. Cancel remains secondary.
- Use the same Blackstone outline, blue/orange type cues, and 48 px minimum controls on every platform.

### 8.5 Monthly reports

- Reuse the dashboard month switcher and summary cards so reporting has no new visual language.
- Present total income, total expenses, and net before any chart.
- Optional chart uses only Royal Blue and Nitro Orange with a labeled legend, visible values, and accessible text summary. Never rely on color-only distinctions.
- Provide a transaction-detail link for each total where it can filter the list correctly.

### 8.6 Settings and data portability

- Group controls into clear cards: Book & currency, Backup & restore, About/local data.
- Export backup uses a download icon tile and a primary or strong secondary button; restore uses upload icon and a confirm/preview flow.
- Explain that data is stored on this device/browser and does not automatically sync to other devices.
- Separate Replace backup data as a destructive action with confirmation; use Danger styling only for this destructive step.

### 8.7 Shared overlays and states

- Apply the same dialogs, validation, loading, offline, storage failure, no-results, and restore-preview styles across every screen.
- Offline indicator is a compact text label with a small neutral/blue icon; do not use a large warning banner while core features remain usable.
- Skeletons should preserve content layout, use muted neutral blocks, and never imitate sensitive transaction amounts.

## 9. Responsive behavior and accessibility

- Design for 360 px phone widths and scale through tablet and desktop without horizontal scrolling.
- Use minimum 44 × 44 px touch targets; primary form controls should be at least 48 px high.
- Preserve visible keyboard focus using a high-contrast 3 px Royal Blue outline with offset; do not remove browser focus styling without replacement.
- Ensure text/background contrast meets WCAG AA; verify brand color combinations rather than assuming the palette is accessible.
- Support 200% zoom and dynamic text sizing without clipped amounts or hidden actions.
- Respect reduced-motion preferences. Limit animation to short press/transition feedback; no essential state is conveyed by motion alone.
- Use semantic headings, associated labels, descriptive button names, accessible dialogs, and live announcements for save/error feedback.
- Keep income/expense distinctions available as words, symbols, and layout—not hue alone.

## 10. Interaction and state language

Use consistent verbs and labels:

- Add transaction, Save transaction, Edit, Delete, Cancel.
- Income, Expense, Net profit, Net loss.
- Export backup, Restore backup, Replace this book.
- “Saved on this device” for success; “Couldn’t save” for failure; explain the next action where useful.

Avoid ambiguous labels such as “Plus,” “Done,” or “Sync” where the app does not provide that behavior.

## 11. Design tokens for implementation

```css
:root {
  /* Core 4 Brand Palette */
  --color-slate-navy: #33415c;
  --color-slate-navy-dark: #1f2737;
  --color-slate-navy-tint: #eef1f5;
  --color-electric-sky: #48cae4;
  --color-electric-sky-dark: #0096c7;
  --color-electric-sky-tint: #eef9fd;
  --color-citron-lime: #bfd200;
  --color-citron-lime-dark: #8c9b00;
  --color-citron-lime-tint: #f7fae4;
  --color-vivid-amber: #ffa200;
  --color-vivid-amber-dark: #c67c00;
  --color-vivid-amber-tint: #fff3df;

  /* Neutrals & Semantics */
  --color-blackstone: #171717;
  --color-canvas: #fffdf8;
  --color-surface: #ffffff;
  --color-surface-muted: #f4f2ec;
  --color-text-secondary: #5b5b5b;
  --color-border-subtle: #d9d6ce;
  --color-success: #237a45;
  --color-danger: #b42318;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Structural Geometry & Depth */
  --border-strong: 2px solid var(--color-blackstone);
  --radius-control: 12px;
  --radius-card: 16px;
  --shadow-hard: 4px 4px 0 var(--color-blackstone);
  --shadow-hard-small: 3px 3px 0 var(--color-blackstone);
}
```

## 12. Design review checklist

- Does each screen make its primary action obvious?
- Are monthly totals and every transaction amount easy to scan?
- Is Royal Blue used consistently for primary action/income and Nitro Orange for expense emphasis?
- Are labels and icons present so financial meaning is not color-only?
- Are outlines/shadows used as a hierarchy tool rather than decoration on every element?
- Do phone and desktop layouts share the same components and design tokens?
- Do empty, error, offline, restore, and destructive states receive the same design quality as the default state?
- Does the interface remain legible offline, at 200% zoom, with keyboard navigation, and with screen readers?
