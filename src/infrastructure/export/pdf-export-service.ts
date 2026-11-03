import { Book } from '../../domain/models/book';
import { Transaction } from '../../domain/models/transaction';
import { InventoryItem } from '../../domain/models/inventory';
import { formatMoney } from '../../domain/money';
import { calculatePaymentMethodTotals } from './excel-export-service';

/**
 * Text width calculation for standard Helvetica.
 */
function estimateTextWidth(text: string, fontSize: number, isBold: boolean = false): number {
  const factor = isBold ? 0.58 : 0.52;
  return text.length * fontSize * factor;
}

/**
 * Truncates text with ellipsis if it exceeds maxWidth.
 */
function truncateText(text: string, maxWidth: number, fontSize: number, isBold: boolean = false): string {
  if (estimateTextWidth(text, fontSize, isBold) <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (truncated.length > 0 && estimateTextWidth(truncated + '...', fontSize, isBold) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated.length > 0 ? truncated + '...' : '';
}

/**
 * Escapes characters for PDF string literals.
 */
function escapePdfString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

interface ColumnDef {
  header: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

interface TableRow {
  cells: string[];
  isHeader?: boolean;
  isSummary?: boolean;
}

/**
 * Native, zero-dependency PDF 1.4 document builder.
 * Generates standards-compliant, printable A4 Landscape PDF reports with pagination.
 */
class PdfDocument {
  private pages: string[] = [];
  private currentPageContent: string[] = [];
  public readonly pageWidth = 841.89; // A4 Landscape width in pt
  public readonly pageHeight = 595.28; // A4 Landscape height in pt
  public readonly marginLeft = 40;
  public readonly marginRight = 40;
  public readonly marginTop = 40;
  public readonly marginBottom = 45;
  public currentY: number;

  constructor() {
    this.currentY = this.pageHeight - this.marginTop;
  }

  get contentWidth(): number {
    return this.pageWidth - this.marginLeft - this.marginRight;
  }

  public newPage(): void {
    if (this.currentPageContent.length > 0) {
      this.pages.push(this.currentPageContent.join('\n'));
      this.currentPageContent = [];
    }
    this.currentY = this.pageHeight - this.marginTop;
  }

  public ensureSpace(requiredHeight: number, onPageBreak?: () => void): void {
    if (this.currentY - requiredHeight < this.marginBottom) {
      this.newPage();
      if (onPageBreak) {
        onPageBreak();
      }
    }
  }

  public drawRect(
    x: number,
    y: number,
    w: number,
    h: number,
    options?: { fillColor?: [number, number, number]; strokeColor?: [number, number, number]; lineWidth?: number }
  ): void {
    const commands: string[] = ['q'];
    if (options?.lineWidth) {
      commands.push(`${options.lineWidth} w`);
    }
    if (options?.fillColor) {
      const [r, g, b] = options.fillColor;
      commands.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`);
    }
    if (options?.strokeColor) {
      const [r, g, b] = options.strokeColor;
      commands.push(`${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`);
    }
    commands.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re`);
    if (options?.fillColor && options?.strokeColor) {
      commands.push('B');
    } else if (options?.fillColor) {
      commands.push('f');
    } else if (options?.strokeColor) {
      commands.push('S');
    }
    commands.push('Q');
    this.currentPageContent.push(commands.join(' '));
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: [number, number, number] = [217, 214, 206],
    lineWidth: number = 0.5
  ): void {
    const [r, g, b] = color;
    this.currentPageContent.push(
      `q ${lineWidth} w ${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`
    );
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    options?: {
      fontSize?: number;
      isBold?: boolean;
      color?: [number, number, number];
      align?: 'left' | 'center' | 'right';
      maxWidth?: number;
    }
  ): void {
    const fontSize = options?.fontSize || 9;
    const isBold = options?.isBold || false;
    const font = isBold ? '/F2' : '/F1';
    const color = options?.color || [23, 23, 23];
    const align = options?.align || 'left';
    let safeText = text;

    if (options?.maxWidth) {
      safeText = truncateText(safeText, options.maxWidth, fontSize, isBold);
    }

    const estimatedWidth = estimateTextWidth(safeText, fontSize, isBold);
    let startX = x;
    if (align === 'center') {
      startX = x - estimatedWidth / 2;
    } else if (align === 'right') {
      startX = x - estimatedWidth;
    }

    const [r, g, b] = color;
    const escaped = escapePdfString(safeText);
    this.currentPageContent.push(
      `BT ${font} ${fontSize} Tf ${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg ${startX.toFixed(2)} ${y.toFixed(2)} Td (${escaped}) Tj ET`
    );
  }

  /**
   * Draws a multi-row table with repeating headers across page breaks.
   */
  public drawTable(columns: ColumnDef[], rows: TableRow[], options?: { rowHeight?: number; headerHeight?: number }): void {
    const rowHeight = options?.rowHeight || 18;
    const headerHeight = options?.headerHeight || 22;

    const renderHeader = () => {
      this.drawRect(this.marginLeft, this.currentY - headerHeight, this.contentWidth, headerHeight, {
        fillColor: [23, 23, 23],
        strokeColor: [23, 23, 23],
        lineWidth: 1,
      });

      let currentX = this.marginLeft;
      for (const col of columns) {
        const textX =
          col.align === 'right'
            ? currentX + col.width - 6
            : col.align === 'center'
            ? currentX + col.width / 2
            : currentX + 6;

        this.drawText(col.header, textX, this.currentY - headerHeight + 7, {
          fontSize: 8.5,
          isBold: true,
          color: [255, 255, 255],
          align: col.align || 'left',
          maxWidth: col.width - 10,
        });

        currentX += col.width;
      }
      this.currentY -= headerHeight;
    };

    // Ensure space for header + at least 1 row
    this.ensureSpace(headerHeight + rowHeight + 10);
    renderHeader();

    // Data rows
    for (let rIdx = 0; rIdx < rows.length; rIdx++) {
      const row = rows[rIdx];

      // Auto-paginate and repeat header if approaching bottom
      if (this.currentY - rowHeight < this.marginBottom) {
        this.newPage();
        renderHeader();
      }

      const isEven = rIdx % 2 === 0;
      const isSummary = row.isSummary;

      // Row background
      if (isSummary) {
        this.drawRect(this.marginLeft, this.currentY - rowHeight, this.contentWidth, rowHeight, {
          fillColor: [238, 241, 245],
          strokeColor: [23, 23, 23],
          lineWidth: 0.8,
        });
      } else if (!isEven) {
        this.drawRect(this.marginLeft, this.currentY - rowHeight, this.contentWidth, rowHeight, {
          fillColor: [248, 249, 250],
        });
      }

      // Bottom row border
      this.drawLine(
        this.marginLeft,
        this.currentY - rowHeight,
        this.marginLeft + this.contentWidth,
        this.currentY - rowHeight,
        isSummary ? [23, 23, 23] : [229, 231, 235],
        isSummary ? 0.8 : 0.5
      );

      // Cell contents
      let currentX = this.marginLeft;
      for (let cIdx = 0; cIdx < columns.length; cIdx++) {
        const col = columns[cIdx];
        const cellVal = row.cells[cIdx] || '';
        const textX =
          col.align === 'right'
            ? currentX + col.width - 6
            : col.align === 'center'
            ? currentX + col.width / 2
            : currentX + 6;

        this.drawText(cellVal, textX, this.currentY - rowHeight + 5.5, {
          fontSize: isSummary ? 8.5 : 8,
          isBold: isSummary || cIdx === 0,
          color: isSummary ? [23, 23, 23] : [31, 39, 55],
          align: col.align || 'left',
          maxWidth: col.width - 12,
        });

        currentX += col.width;
      }

      this.currentY -= rowHeight;
    }

    this.currentY -= 12; // Gap after table
  }

  /**
   * Builds the finalized PDF 1.4 byte buffer with xref table and trailer.
   */
  public toUint8Array(): Uint8Array {
    if (this.currentPageContent.length > 0) {
      this.pages.push(this.currentPageContent.join('\n'));
      this.currentPageContent = [];
    }

    if (this.pages.length === 0) {
      this.pages.push('');
    }

    const totalPages = this.pages.length;
    const objects: string[] = [];

    // Obj 1: Catalog
    objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`);

    // Obj 2: Pages root
    const pageObjIds = this.pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
    objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pageObjIds}] /Count ${totalPages} >>\nendobj`);

    // Fonts definition (Helvetica / Helvetica-Bold)
    const fontRes = `/Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >>`;

    // Page and Content Stream objects
    for (let i = 0; i < totalPages; i++) {
      const pageNum = i + 1;
      const pageObjNum = 3 + i * 2;
      const contentObjNum = 4 + i * 2;

      // Append page footer to content stream
      const footerY = 22;
      const footerLeft = `BT /F1 8 Tf 0.45 0.45 0.45 rg ${this.marginLeft} ${footerY} Td (POTFOLIOO Financial Report • Tanzanian Shillings TZS) Tj ET`;
      const footerRightText = `Page ${pageNum} of ${totalPages}`;
      const footerRightWidth = estimateTextWidth(footerRightText, 8, false);
      const footerRight = `BT /F2 8 Tf 0.2 0.2 0.2 rg ${(this.pageWidth - this.marginRight - footerRightWidth).toFixed(2)} ${footerY} Td (${footerRightText}) Tj ET`;
      const footerLine = `q 0.5 w 0.85 0.85 0.85 RG ${this.marginLeft} ${footerY + 10} m ${(this.pageWidth - this.marginRight).toFixed(2)} ${footerY + 10} l S Q`;

      const finalStreamContent = `${this.pages[i]}\n${footerLine}\n${footerLeft}\n${footerRight}`;
      const enc = new TextEncoder();
      const streamBytes = enc.encode(finalStreamContent);

      // Page Object
      objects.push(
        `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.pageWidth} ${this.pageHeight}] /Contents ${contentObjNum} 0 R /Resources << ${fontRes} >> >>\nendobj`
      );

      // Content Stream Object
      objects.push(`${contentObjNum} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n${finalStreamContent}\nendstream\nendobj`);
    }

    // Assemble PDF file with correct byte offsets for XREF
    let body = `%PDF-1.4\n%POTFOLIOO-EXPORT\n`;
    const xrefOffsets: number[] = [0];

    const enc = new TextEncoder();

    for (let i = 0; i < objects.length; i++) {
      xrefOffsets.push(enc.encode(body).length);
      body += `${objects[i]}\n`;
    }

    const startXref = enc.encode(body).length;
    body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      const offset = String(xrefOffsets[i]).padStart(10, '0');
      body += `${offset} 00000 n \n`;
    }

    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

    return enc.encode(body);
  }
}

/**
 * Generates a complete printable PDF business report for Retail / Wholesale Inventory businesses.
 * Sections:
 * 1. Inventory
 * 2. Sales, including Cash, Mobile/Phone, and Bank payment totals
 * 3. Debtors
 * 4. Daily Expenses
 */
export function generateRetailPdfReport(
  book: Book,
  transactions: Transaction[],
  inventoryItems: InventoryItem[] = [],
  reportingPeriod?: string
): { filename: string; content: Uint8Array } {
  const doc = new PdfDocument();

  const salesTransactions = transactions.filter((t) => t.type === 'income');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const paymentTotals = calculatePaymentMethodTotals(salesTransactions);

  // -----------------------------------------------------------------
  // Document Header Banner
  // -----------------------------------------------------------------
  doc.drawRect(doc.marginLeft, doc.currentY - 50, doc.contentWidth, 50, {
    fillColor: [23, 23, 23],
    strokeColor: [23, 23, 23],
    lineWidth: 1,
  });

  doc.drawText(book.name.toUpperCase(), doc.marginLeft + 14, doc.currentY - 24, {
    fontSize: 16,
    isBold: true,
    color: [255, 255, 255],
  });

  const periodLabel = reportingPeriod ? `Period: ${reportingPeriod}` : `All Recorded Activity`;
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.drawText(
    `RETAIL / WHOLESALE BUSINESS REPORT • ${periodLabel} • Exported on ${dateStr}`,
    doc.marginLeft + 14,
    doc.currentY - 40,
    {
      fontSize: 8.5,
      isBold: false,
      color: [191, 210, 0], // Citron Lime accent
    }
  );

  doc.drawText(`POTFOLIOO`, doc.pageWidth - doc.marginRight - 14, doc.currentY - 24, {
    fontSize: 12,
    isBold: true,
    color: [255, 255, 255],
    align: 'right',
  });

  doc.drawText(`TZS Whole Shillings`, doc.pageWidth - doc.marginRight - 14, doc.currentY - 40, {
    fontSize: 8.5,
    isBold: false,
    color: [200, 200, 200],
    align: 'right',
  });

  doc.currentY -= 65;

  // -----------------------------------------------------------------
  // SECTION 1: INVENTORY
  // -----------------------------------------------------------------
  doc.drawText('1. CURRENT INVENTORY STATUS', doc.marginLeft, doc.currentY - 2, {
    fontSize: 11,
    isBold: true,
    color: [23, 23, 23],
  });
  doc.currentY -= 14;

  const inventoryCols: ColumnDef[] = [
    { header: 'Item Name', width: 260, align: 'left' },
    { header: 'Available Stock Quantity', width: 150, align: 'center' },
    { header: 'Purchase Price per Unit (TSH)', width: 200, align: 'right' },
    { header: 'Stock Status', width: 151, align: 'center' },
  ];

  const inventoryRows: TableRow[] =
    inventoryItems.length > 0
      ? inventoryItems.map((item) => ({
          cells: [
            item.name,
            `${item.currentQuantity} units`,
            formatMoney(item.avgPurchasePriceMinor),
            item.status === 'in_stock' ? 'In stock' : item.status === 'low_stock' ? 'Running low' : 'Empty',
          ],
        }))
      : [{ cells: ['No inventory items recorded yet', '-', '-', '-'] }];

  doc.drawTable(inventoryCols, inventoryRows);

  // -----------------------------------------------------------------
  // SECTION 2: SALES & PAYMENT SUMMARY (Cash, Mobile/Phone, Bank)
  // -----------------------------------------------------------------
  doc.ensureSpace(120);

  doc.drawText('2. SALES TRANSACTIONS & PAYMENT METHOD SUMMARY', doc.marginLeft, doc.currentY - 2, {
    fontSize: 11,
    isBold: true,
    color: [23, 23, 23],
  });
  doc.currentY -= 14;

  // Payment Channel Summary Boxes
  const cardWidth = (doc.contentWidth - 24) / 4;
  const cardHeight = 42;

  const summaryCards = [
    { label: 'CASH RECEIVED', amount: paymentTotals.cashReceivedMinor, color: [238, 241, 245] as [number, number, number] },
    { label: 'MOBILE / PHONE', amount: paymentTotals.mobileReceivedMinor, color: [238, 249, 253] as [number, number, number] },
    { label: 'BANK TRANSFERS', amount: paymentTotals.bankReceivedMinor, color: [247, 250, 228] as [number, number, number] },
    { label: 'TOTAL RECEIVED', amount: paymentTotals.totalReceivedMinor, color: [255, 243, 223] as [number, number, number] },
  ];

  for (let i = 0; i < summaryCards.length; i++) {
    const card = summaryCards[i];
    const cardX = doc.marginLeft + i * (cardWidth + 8);
    doc.drawRect(cardX, doc.currentY - cardHeight, cardWidth, cardHeight, {
      fillColor: card.color,
      strokeColor: [23, 23, 23],
      lineWidth: 1,
    });
    doc.drawText(card.label, cardX + 8, doc.currentY - 14, {
      fontSize: 7.5,
      isBold: true,
      color: [91, 91, 91],
    });
    doc.drawText(formatMoney(card.amount), cardX + 8, doc.currentY - 32, {
      fontSize: 11,
      isBold: true,
      color: [23, 23, 23],
    });
  }

  doc.currentY -= cardHeight + 14;

  // Sales Records Table (10 columns, total 761 pt)
  const salesCols: ColumnDef[] = [
    { header: 'Sale Date', width: 62, align: 'left' },
    { header: 'Customer Name', width: 95, align: 'left' },
    { header: 'Item Sold', width: 110, align: 'left' },
    { header: 'Qty', width: 38, align: 'center' },
    { header: 'Selling Price (TSH)', width: 80, align: 'right' },
    { header: 'Total Sale (TSH)', width: 85, align: 'right' },
    { header: 'Amount Paid (TSH)', width: 85, align: 'right' },
    { header: 'Balance (TSH)', width: 76, align: 'right' },
    { header: 'Method', width: 65, align: 'center' },
    { header: 'Status', width: 65, align: 'center' },
  ];

  const salesRows: TableRow[] =
    salesTransactions.length > 0
      ? salesTransactions.map((t) => {
          const totalMinor = t.amountMinor;
          const paidMinor = t.amountPaidMinor !== undefined && t.amountPaidMinor !== null ? t.amountPaidMinor : totalMinor;
          const balanceMinor =
            t.outstandingBalanceMinor !== undefined && t.outstandingBalanceMinor !== null
              ? t.outstandingBalanceMinor
              : Math.max(0, totalMinor - paidMinor);
          const unitPriceMinor =
            t.unitPriceMinor !== undefined && t.unitPriceMinor !== null
              ? t.unitPriceMinor
              : t.quantitySold
              ? Math.round(totalMinor / t.quantitySold)
              : totalMinor;

          return {
            cells: [
              t.transactionDate,
              t.customerName || '-',
              t.itemName || t.note || 'Retail Item',
              String(t.quantitySold || 1),
              formatMoney(unitPriceMinor),
              formatMoney(totalMinor),
              formatMoney(paidMinor),
              formatMoney(balanceMinor),
              (t.paymentMethod || 'cash').toUpperCase(),
              t.paymentStatus === 'paid' ? 'Paid' : t.paymentStatus === 'partial' ? 'Partial' : 'Credit',
            ],
          };
        })
      : [{ cells: ['No sales recorded for this period', '-', '-', '-', '-', '-', '-', '-', '-', '-'] }];

  // Payment totals summary row inside sales table
  salesRows.push({
    isSummary: true,
    cells: [
      'TOTALS',
      'All Recorded Payments',
      '-',
      '-',
      '-',
      '-',
      formatMoney(paymentTotals.totalReceivedMinor),
      '-',
      'ALL',
      'Received',
    ],
  });

  doc.drawTable(salesCols, salesRows);

  // -----------------------------------------------------------------
  // SECTION 3: DEBTORS (Outstanding Customer Credit)
  // -----------------------------------------------------------------
  doc.ensureSpace(90);

  doc.drawText('3. CUSTOMER DEBTORS & RECEIVABLES', doc.marginLeft, doc.currentY - 2, {
    fontSize: 11,
    isBold: true,
    color: [23, 23, 23],
  });
  doc.currentY -= 14;

  const debtorTransactions = salesTransactions.filter((t) => {
    const balance =
      t.outstandingBalanceMinor !== undefined && t.outstandingBalanceMinor !== null
        ? t.outstandingBalanceMinor
        : (t.paymentStatus === 'partial' || t.paymentStatus === 'credit')
        ? t.amountMinor - (t.amountPaidMinor || 0)
        : 0;
    return balance > 0;
  });

  const debtorCols: ColumnDef[] = [
    { header: 'Customer Name', width: 170, align: 'left' },
    { header: 'Item Purchased', width: 210, align: 'left' },
    { header: 'Quantity', width: 70, align: 'center' },
    { header: 'Amount Paid (TSH)', width: 155, align: 'right' },
    { header: 'Amount Due (TSH)', width: 156, align: 'right' },
  ];

  let totalDueMinor = 0;
  const debtorRows: TableRow[] =
    debtorTransactions.length > 0
      ? debtorTransactions.map((t) => {
          const paidMinor = t.amountPaidMinor || 0;
          const balanceMinor =
            t.outstandingBalanceMinor !== undefined && t.outstandingBalanceMinor !== null
              ? t.outstandingBalanceMinor
              : t.amountMinor - paidMinor;
          totalDueMinor += balanceMinor;

          return {
            cells: [
              t.customerName || 'Customer',
              t.itemName || t.note || 'Retail Item',
              String(t.quantitySold || 1),
              formatMoney(paidMinor),
              formatMoney(balanceMinor),
            ],
          };
        })
      : [{ cells: ['No outstanding customer debts for this period', '-', '-', '-', '-'] }];

  if (debtorTransactions.length > 0) {
    debtorRows.push({
      isSummary: true,
      cells: ['TOTAL OUTSTANDING', 'All Unpaid Debt', '-', '-', formatMoney(totalDueMinor)],
    });
  }

  doc.drawTable(debtorCols, debtorRows);

  // -----------------------------------------------------------------
  // SECTION 4: DAILY OPERATING EXPENSES
  // -----------------------------------------------------------------
  doc.ensureSpace(90);

  doc.drawText('4. DAILY OPERATING EXPENSES', doc.marginLeft, doc.currentY - 2, {
    fontSize: 11,
    isBold: true,
    color: [23, 23, 23],
  });
  doc.currentY -= 14;

  const expenseCols: ColumnDef[] = [
    { header: 'Expense Date', width: 120, align: 'left' },
    { header: 'Expense Name / Description', width: 440, align: 'left' },
    { header: 'Amount (TSH)', width: 201, align: 'right' },
  ];

  let totalExpenseMinor = 0;
  const expenseRows: TableRow[] =
    expenseTransactions.length > 0
      ? expenseTransactions.map((t) => {
          totalExpenseMinor += t.amountMinor;
          const description = t.category ? `${t.category}${t.note ? ` - ${t.note}` : ''}` : t.note || 'Operating Expense';
          return {
            cells: [t.transactionDate, description, formatMoney(t.amountMinor)],
          };
        })
      : [{ cells: ['No operating expenses recorded for this period', '-', '-'] }];

  if (expenseTransactions.length > 0) {
    expenseRows.push({
      isSummary: true,
      cells: ['TOTAL EXPENSES', 'All Operating Costs', formatMoney(totalExpenseMinor)],
    });
  }

  doc.drawTable(expenseCols, expenseRows);

  const cleanName = book.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanName}_retail_report_${dateStr}.pdf`;
  const content = doc.toUint8Array();

  return { filename, content };
}
