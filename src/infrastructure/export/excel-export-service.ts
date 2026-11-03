import { Book } from '../../domain/models/book';
import { Transaction } from '../../domain/models/transaction';
import { InventoryItem } from '../../domain/models/inventory';

// CRC-32 Lookup Table for standard ZIP compliance
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function computeCrc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/**
 * Builds a valid PKZIP 2.0 archive (Stored / Method 0) compatible with
 * Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice.
 */
function buildZipArchive(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const fileEntries: {
    nameBytes: Uint8Array;
    data: Uint8Array;
    crc: number;
    offset: number;
  }[] = [];

  let currentOffset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = computeCrc32(entry.data);
    fileEntries.push({
      nameBytes,
      data: entry.data,
      crc,
      offset: currentOffset,
    });
    // Local header: 30 bytes + filename + data
    currentOffset += 30 + nameBytes.length + entry.data.length;
  }

  const centralDirOffset = currentOffset;
  let centralDirSize = 0;

  for (const file of fileEntries) {
    // Central directory entry: 46 bytes + filename
    centralDirSize += 46 + file.nameBytes.length;
  }

  // End of Central Directory record: 22 bytes
  const totalArchiveSize = centralDirOffset + centralDirSize + 22;
  const buffer = new Uint8Array(totalArchiveSize);
  const view = new DataView(buffer.buffer);
  let pos = 0;

  // 1. Write Local File Headers and Content
  for (const file of fileEntries) {
    view.setUint32(pos, 0x04034b50, true); // Local header signature
    view.setUint16(pos + 4, 20, true); // Version needed (2.0)
    view.setUint16(pos + 6, 0x0800, true); // Bit flag: UTF-8 filename
    view.setUint16(pos + 8, 0, true); // Method 0: Stored
    view.setUint16(pos + 10, 0, true); // Mod time
    view.setUint16(pos + 12, 0, true); // Mod date
    view.setUint32(pos + 14, file.crc, true);
    view.setUint32(pos + 18, file.data.length, true); // Compressed size
    view.setUint32(pos + 22, file.data.length, true); // Uncompressed size
    view.setUint16(pos + 26, file.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true); // Extra field length
    pos += 30;

    buffer.set(file.nameBytes, pos);
    pos += file.nameBytes.length;

    buffer.set(file.data, pos);
    pos += file.data.length;
  }

  // 2. Write Central Directory Headers
  for (const file of fileEntries) {
    view.setUint32(pos, 0x02014b50, true); // Central header signature
    view.setUint16(pos + 4, 20, true); // Version made by
    view.setUint16(pos + 6, 20, true); // Version needed
    view.setUint16(pos + 8, 0x0800, true); // Bit flag: UTF-8
    view.setUint16(pos + 10, 0, true); // Method 0
    view.setUint16(pos + 12, 0, true); // Mod time
    view.setUint16(pos + 14, 0, true); // Mod date
    view.setUint32(pos + 16, file.crc, true);
    view.setUint32(pos + 20, file.data.length, true);
    view.setUint32(pos + 24, file.data.length, true);
    view.setUint16(pos + 28, file.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true); // Extra field length
    view.setUint16(pos + 32, 0, true); // Comment length
    view.setUint16(pos + 34, 0, true); // Disk start
    view.setUint16(pos + 36, 0, true); // Internal attributes
    view.setUint32(pos + 38, 0, true); // External attributes
    view.setUint32(pos + 42, file.offset, true); // Relative offset
    pos += 46;

    buffer.set(file.nameBytes, pos);
    pos += file.nameBytes.length;
  }

  // 3. Write End of Central Directory Record (EOCD)
  view.setUint32(pos, 0x06054b50, true); // EOCD signature
  view.setUint16(pos + 4, 0, true); // Disk number
  view.setUint16(pos + 6, 0, true); // Start disk
  view.setUint16(pos + 8, fileEntries.length, true); // Records on this disk
  view.setUint16(pos + 10, fileEntries.length, true); // Total records
  view.setUint32(pos + 12, centralDirSize, true); // Central dir size
  view.setUint32(pos + 16, centralDirOffset, true); // Central dir offset
  view.setUint16(pos + 20, 0, true); // Comment length

  return buffer;
}

function xmlEscape(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function colName(index: number): string {
  let name = '';
  let temp = index;
  while (temp >= 0) {
    name = String.fromCharCode((temp % 26) + 65) + name;
    temp = Math.floor(temp / 26) - 1;
  }
  return name;
}

interface WorksheetSpec {
  name: string;
  columns: { header: string; width: number }[];
  rows: (string | number | null | undefined)[][];
}

/**
 * Generates OpenXML spreadsheet files for given worksheet specifications.
 */
function createOpenXmlWorkbook(sheets: WorksheetSpec[]): Uint8Array {
  const enc = new TextEncoder();
  const entries: ZipEntry[] = [];

  // 1. [Content_Types].xml
  let contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>`;

  for (let i = 0; i < sheets.length; i++) {
    contentTypesXml += `\n  <Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }
  contentTypesXml += `\n</Types>`;
  entries.push({ name: '[Content_Types].xml', data: enc.encode(contentTypesXml) });

  // 2. _rels/.rels
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
  entries.push({ name: '_rels/.rels', data: enc.encode(rootRels) });

  // 3. xl/_rels/workbook.xml.rels
  let workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;
  for (let i = 0; i < sheets.length; i++) {
    workbookRelsXml += `\n  <Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`;
  }
  workbookRelsXml += `\n  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
  entries.push({ name: 'xl/_rels/workbook.xml.rels', data: enc.encode(workbookRelsXml) });

  // 4. xl/workbook.xml
  let workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>`;
  for (let i = 0; i < sheets.length; i++) {
    workbookXml += `\n    <sheet name="${xmlEscape(sheets[i].name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`;
  }
  workbookXml += `\n  </sheets>
</workbook>`;
  entries.push({ name: 'xl/workbook.xml', data: enc.encode(workbookXml) });

  // 5. xl/styles.xml
  // Cell styles:
  // s="0": Default
  // s="1": Header Row (Bold, Soft Slate Background, Solid Border)
  // s="2": Currency / Decimal Numeric (#,##0)
  // s="3": Integer Numeric (0)
  // s="4": Summary / Total Row (Bold, Currency Number, Top Border)
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="#,##0"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/><color rgb="FF171717"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FF171717"/></font>
    <font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF000000"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF4F2EC"/></patternFill></fill>
  </fills>
  <borders count="3">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD9D6CE"/></left>
      <right style="thin"><color rgb="FFD9D6CE"/></right>
      <top style="thin"><color rgb="FFD9D6CE"/></top>
      <bottom style="medium"><color rgb="FF171717"/></bottom>
    </border>
    <border>
      <left/><right/>
      <top style="thin"><color rgb="FF171717"/></top>
      <bottom style="double"><color rgb="FF171717"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="5">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="164" fontId="1" fillId="0" borderId="2" xfId="0" applyFont="1" applyNumberFormat="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`;
  entries.push({ name: 'xl/styles.xml', data: enc.encode(stylesXml) });

  // 6. Worksheets
  for (let sIdx = 0; sIdx < sheets.length; sIdx++) {
    const sheet = sheets[sIdx];
    let sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">`;

    // Column widths
    sheetXml += `\n  <cols>`;
    for (let cIdx = 0; cIdx < sheet.columns.length; cIdx++) {
      const col = sheet.columns[cIdx];
      sheetXml += `\n    <col min="${cIdx + 1}" max="${cIdx + 1}" width="${col.width}" customWidth="1"/>`;
    }
    sheetXml += `\n  </cols>`;

    sheetXml += `\n  <sheetData>`;

    // Row 1: Headers
    sheetXml += `\n    <row r="1" customHeight="1" ht="26">`;
    for (let cIdx = 0; cIdx < sheet.columns.length; cIdx++) {
      const colRef = `${colName(cIdx)}1`;
      sheetXml += `<c r="${colRef}" s="1" t="inlineStr"><is><t>${xmlEscape(sheet.columns[cIdx].header)}</t></is></c>`;
    }
    sheetXml += `</row>`;

    // Data Rows
    for (let rIdx = 0; rIdx < sheet.rows.length; rIdx++) {
      const rowNum = rIdx + 2;
      const rowData = sheet.rows[rIdx];
      sheetXml += `\n    <row r="${rowNum}">`;

      for (let cIdx = 0; cIdx < sheet.columns.length; cIdx++) {
        const val = rowData[cIdx];
        const cellRef = `${colName(cIdx)}${rowNum}`;

        if (typeof val === 'number') {
          // Number formatting: integer vs currency/float
          const isInt = Number.isInteger(val);
          const styleId = isInt && val < 1000 ? 3 : 2;
          sheetXml += `<c r="${cellRef}" s="${styleId}" t="n"><v>${val}</v></c>`;
        } else if (val === null || val === undefined || val === '') {
          sheetXml += `<c r="${cellRef}" s="0"/>`;
        } else {
          sheetXml += `<c r="${cellRef}" s="0" t="inlineStr"><is><t>${xmlEscape(val)}</t></is></c>`;
        }
      }

      sheetXml += `</row>`;
    }

    sheetXml += `\n  </sheetData>\n</worksheet>`;
    entries.push({ name: `xl/worksheets/sheet${sIdx + 1}.xml`, data: enc.encode(sheetXml) });
  }

  return buildZipArchive(entries);
}

/**
 * Calculates total payments actually received per payment channel (Cash, Mobile/Phone, Bank),
 * correctly accounting for down payments, partial payments, and subsequent debt repayments.
 * Excludes unpaid balances.
 */
export function calculatePaymentMethodTotals(salesTransactions: Transaction[]): {
  cashReceivedMinor: number;
  mobileReceivedMinor: number;
  bankReceivedMinor: number;
  totalReceivedMinor: number;
} {
  let cashReceivedMinor = 0;
  let mobileReceivedMinor = 0;
  let bankReceivedMinor = 0;

  for (const t of salesTransactions) {
    if (t.repayments && t.repayments.length > 0) {
      let repaymentsSumMinor = 0;
      for (const r of t.repayments) {
        const amt = r.amountMinor || 0;
        repaymentsSumMinor += amt;
        const method = (r.paymentMethod || 'cash').toLowerCase();
        if (method === 'mobile') {
          mobileReceivedMinor += amt;
        } else if (method === 'bank') {
          bankReceivedMinor += amt;
        } else {
          cashReceivedMinor += amt;
        }
      }

      // If amountPaidMinor exceeds sum of recorded repayments (e.g. direct amountPaid without repayment entry),
      // attribute the difference to the sale's primary payment method
      const diff = (t.amountPaidMinor || 0) - repaymentsSumMinor;
      if (diff > 0) {
        const method = (t.paymentMethod || 'cash').toLowerCase();
        if (method === 'mobile') {
          mobileReceivedMinor += diff;
        } else if (method === 'bank') {
          bankReceivedMinor += diff;
        } else {
          cashReceivedMinor += diff;
        }
      }
    } else {
      // No repayments list: calculate based on actual paid amount
      const receivedMinor =
        t.amountPaidMinor !== undefined && t.amountPaidMinor !== null
          ? t.amountPaidMinor
          : t.paymentStatus === 'paid'
          ? t.amountMinor
          : 0;

      if (receivedMinor > 0) {
        const method = (t.paymentMethod || 'cash').toLowerCase();
        if (method === 'mobile') {
          mobileReceivedMinor += receivedMinor;
        } else if (method === 'bank') {
          bankReceivedMinor += receivedMinor;
        } else {
          cashReceivedMinor += receivedMinor;
        }
      }
    }
  }

  const totalReceivedMinor = cashReceivedMinor + mobileReceivedMinor + bankReceivedMinor;
  return { cashReceivedMinor, mobileReceivedMinor, bankReceivedMinor, totalReceivedMinor };
}

/**
 * Builds the complete formatted Excel workbook (.xlsx) tailored for each business type.
 */
export function generateExcelWorkbook(
  book: Book,
  transactions: Transaction[],
  inventoryItems: InventoryItem[] = [],
  _reportingPeriod?: string
): { filename: string; content: Uint8Array } {
  const isRental = book.category === 'rental';
  const isRetail = book.category === 'retail';
  const sheets: WorksheetSpec[] = [];

  if (isRental) {
    // -------------------------------------------------------------
    // RENTAL BUSINESS WORKBOOK
    // Worksheet 1: "Rent Ledger"
    // Specified columns:
    // Tenant Name, Phone Number, Date Paid, Amount Paid, Date Due, Price per Room, Months Paid
    // -------------------------------------------------------------
    const rentalPayments = transactions.filter((t) => t.type === 'income');
    const propertyExpenses = transactions.filter((t) => t.type === 'expense');

    const rentRows = rentalPayments.map((t) => {
      const amountMajor = t.amountMinor / 100;
      const months = t.monthsPaid || (t.chargePerRoom && t.chargePerRoom > 0 ? Math.round(t.amountMinor / t.chargePerRoom) : 1);
      const pricePerRoomMajor = t.chargePerRoom ? t.chargePerRoom / 100 : (months > 0 ? amountMajor / months : amountMajor);

      return [
        t.tenantName || (t.roomNumber ? `Room ${t.roomNumber} Tenant` : 'Unknown Tenant'),
        t.phoneNumber || '-',
        t.transactionDate,
        amountMajor,
        t.dueDate || '-',
        pricePerRoomMajor,
        months,
      ];
    });

    sheets.push({
      name: 'Rent Ledger',
      columns: [
        { header: 'Tenant Name', width: 24 },
        { header: 'Phone Number', width: 16 },
        { header: 'Date Paid', width: 14 },
        { header: 'Amount Paid', width: 16 },
        { header: 'Date Due', width: 14 },
        { header: 'Price per Room', width: 16 },
        { header: 'Months Paid', width: 14 },
      ],
      rows: rentRows,
    });

    // Worksheet 2: "Property Expenses" (Renovations, maintenance, decorating, etc.)
    const expenseRows = propertyExpenses.map((t) => [
      t.transactionDate,
      t.category || 'General Property Expense',
      t.amountMinor / 100,
      t.note || '-',
    ]);

    sheets.push({
      name: 'Property Expenses',
      columns: [
        { header: 'Date Incurred', width: 15 },
        { header: 'Expense Category', width: 25 },
        { header: 'Amount Paid', width: 18 },
        { header: 'Description / Note', width: 35 },
      ],
      rows: expenseRows,
    });
  } else if (isRetail) {
    // -------------------------------------------------------------
    // RETAIL / WHOLESALE BUSINESS WORKBOOK (EXACTLY 4 WORKSHEETS)
    // 1. "Inventory" worksheet
    // 2. "Sales" worksheet
    // 3. "Debtors" worksheet (only sales with outstanding balance)
    // 4. "Daily Expenses" worksheet
    // -------------------------------------------------------------

    // 1. Inventory worksheet
    const inventoryRows = inventoryItems.map((item) => {
      const avgCostMajor = item.avgPurchasePriceMinor / 100;
      const statusLabel =
        item.status === 'in_stock'
          ? 'In stock'
          : item.status === 'low_stock'
          ? 'Running low'
          : 'Empty';

      return [
        item.name,
        item.currentQuantity,
        avgCostMajor,
        statusLabel,
      ];
    });

    sheets.push({
      name: 'Inventory',
      columns: [
        { header: 'Item Name', width: 26 },
        { header: 'Available Stock Quantity', width: 24 },
        { header: 'Purchase Price per Unit (TSH)', width: 28 },
        { header: 'Stock Status', width: 18 },
      ],
      rows: inventoryRows,
    });

    // 2. Sales worksheet
    const salesTransactions = transactions.filter((t) => t.type === 'income');
    const salesRows = salesTransactions.map((t) => {
      const totalAmountMajor = t.amountMinor / 100;
      const amountPaidMajor =
        t.amountPaidMinor !== undefined && t.amountPaidMinor !== null
          ? t.amountPaidMinor / 100
          : totalAmountMajor;
      const outstandingMajor =
        t.outstandingBalanceMinor !== undefined && t.outstandingBalanceMinor !== null
          ? t.outstandingBalanceMinor / 100
          : 0;
      const unitPriceMajor =
        t.unitPriceMinor !== undefined && t.unitPriceMinor !== null
          ? t.unitPriceMinor / 100
          : t.quantitySold
          ? totalAmountMajor / t.quantitySold
          : totalAmountMajor;

      const paymentMethodStr = t.paymentMethod
        ? t.paymentMethod.toUpperCase()
        : 'CASH';

      const paymentStatusStr =
        t.paymentStatus === 'paid'
          ? 'Paid in full'
          : t.paymentStatus === 'partial'
          ? 'Partially paid'
          : t.paymentStatus === 'credit'
          ? 'On credit'
          : 'Paid in full';

      return [
        t.transactionDate,
        t.customerName || '-',
        t.itemName || t.note || 'Retail Item',
        t.quantitySold || 1,
        unitPriceMajor,
        totalAmountMajor,
        amountPaidMajor,
        outstandingMajor,
        paymentMethodStr,
        paymentStatusStr,
      ];
    });

    // Payment Summary totals received by Cash, Mobile/Phone, and Bank
    const paymentTotals = calculatePaymentMethodTotals(salesTransactions);
    const cashMajor = paymentTotals.cashReceivedMinor / 100;
    const mobileMajor = paymentTotals.mobileReceivedMinor / 100;
    const bankMajor = paymentTotals.bankReceivedMinor / 100;
    const totalReceivedMajor = paymentTotals.totalReceivedMinor / 100;

    // Distinguishable Summary Rows appended to Sales sheet
    salesRows.push(['', '', '', '', '', '', '', '', '', '']);
    salesRows.push([
      '--- PAYMENT SUMMARY ---',
      'Payment Channel',
      '',
      '',
      '',
      '',
      'Amount Received (TSH)',
      '',
      'Channel',
      'Actual Received'
    ]);
    salesRows.push([
      'Payment Summary',
      'Cash',
      '-',
      '-',
      '-',
      '-',
      cashMajor,
      0,
      'CASH',
      'Paid'
    ]);
    salesRows.push([
      'Payment Summary',
      'Mobile/Phone',
      '-',
      '-',
      '-',
      '-',
      mobileMajor,
      0,
      'MOBILE',
      'Paid'
    ]);
    salesRows.push([
      'Payment Summary',
      'Bank',
      '-',
      '-',
      '-',
      '-',
      bankMajor,
      0,
      'BANK',
      'Paid'
    ]);
    salesRows.push([
      'TOTAL RECEIVED',
      'All Payment Channels',
      '-',
      '-',
      '-',
      '-',
      totalReceivedMajor,
      0,
      'TOTAL',
      'All Received'
    ]);

    sheets.push({
      name: 'Sales',
      columns: [
        { header: 'Sale Date', width: 14 },
        { header: 'Customer Name', width: 22 },
        { header: 'Item Sold', width: 24 },
        { header: 'Quantity', width: 14 },
        { header: 'Selling Price per Unit (TSH)', width: 24 },
        { header: 'Total Sale Amount (TSH)', width: 22 },
        { header: 'Amount Paid (TSH)', width: 18 },
        { header: 'Outstanding Balance (TSH)', width: 22 },
        { header: 'Payment Method', width: 16 },
        { header: 'Payment Status', width: 16 },
      ],
      rows: salesRows,
    });

    // 3. Debtors worksheet (contains ONLY sales with an outstanding balance)
    const debtorTransactions = salesTransactions.filter((t) => {
      const balance =
        t.outstandingBalanceMinor !== undefined && t.outstandingBalanceMinor !== null
          ? t.outstandingBalanceMinor
          : (t.paymentStatus === 'partial' || t.paymentStatus === 'credit')
          ? t.amountMinor - (t.amountPaidMinor || 0)
          : 0;
      return balance > 0;
    });

    const debtorRows = debtorTransactions.map((t) => {
      const amountPaidMajor = (t.amountPaidMinor || 0) / 100;
      const balanceMinor =
        t.outstandingBalanceMinor !== undefined && t.outstandingBalanceMinor !== null
          ? t.outstandingBalanceMinor
          : t.amountMinor - (t.amountPaidMinor || 0);

      return [
        t.customerName || 'Customer',
        t.itemName || t.note || 'Retail Item',
        t.quantitySold || 1,
        amountPaidMajor,
        balanceMinor / 100,
      ];
    });

    sheets.push({
      name: 'Debtors',
      columns: [
        { header: 'Customer Name', width: 24 },
        { header: 'Item Purchased', width: 24 },
        { header: 'Quantity', width: 14 },
        { header: 'Amount Paid (TSH)', width: 18 },
        { header: 'Amount Due (TSH)', width: 18 },
      ],
      rows: debtorRows,
    });

    // 4. Daily Expenses worksheet
    const expenseTransactions = transactions.filter((t) => t.type === 'expense');
    const expenseRows = expenseTransactions.map((t) => [
      t.transactionDate,
      t.category ? `${t.category}${t.note ? ` - ${t.note}` : ''}` : t.note || 'Operating Expense',
      t.amountMinor / 100,
    ]);

    sheets.push({
      name: 'Daily Expenses',
      columns: [
        { header: 'Expense Date', width: 15 },
        { header: 'Expense Name / Description', width: 35 },
        { header: 'Amount (TSH)', width: 18 },
      ],
      rows: expenseRows,
    });
  } else {
    // -------------------------------------------------------------
    // OTHER BUSINESS WORKBOOK
    // Requirements: Include daily income and daily expenses.
    // Use clear date, income, and expense columns, preserving recorded daily totals.
    // -------------------------------------------------------------

    // Aggregate by date
    const dailyMap = new Map<string, { incomeMajor: number; expenseMajor: number; count: number }>();

    for (const t of transactions) {
      const date = t.transactionDate;
      const entry = dailyMap.get(date) || { incomeMajor: 0, expenseMajor: 0, count: 0 };
      if (t.type === 'income') {
        entry.incomeMajor += t.amountMinor / 100;
      } else {
        entry.expenseMajor += t.amountMinor / 100;
      }
      entry.count += 1;
      dailyMap.set(date, entry);
    }

    // Sort dates chronologically descending
    const sortedDates = Array.from(dailyMap.keys()).sort().reverse();

    const dailyRows = sortedDates.map((date) => {
      const day = dailyMap.get(date)!;
      const net = day.incomeMajor - day.expenseMajor;
      return [date, day.incomeMajor, day.expenseMajor, net, day.count];
    });

    sheets.push({
      name: 'Daily Cash Flow',
      columns: [
        { header: 'Date', width: 15 },
        { header: 'Daily Income (TSH)', width: 18 },
        { header: 'Daily Expenses (TSH)', width: 18 },
        { header: 'Daily Net Cash Flow (TSH)', width: 22 },
        { header: 'Transactions Count', width: 18 },
      ],
      rows: dailyRows,
    });

    // Worksheet 2: Detailed Transaction Records
    const detailRows = transactions.map((t) => [
      t.transactionDate,
      t.type === 'income' ? 'Income' : 'Expense',
      t.category || 'General',
      t.amountMinor / 100,
      t.note || '-',
    ]);

    sheets.push({
      name: 'All Transactions',
      columns: [
        { header: 'Date', width: 14 },
        { header: 'Type', width: 14 },
        { header: 'Category', width: 22 },
        { header: 'Amount (TSH)', width: 16 },
        { header: 'Description / Note', width: 35 },
      ],
      rows: detailRows,
    });
  }

  const content = createOpenXmlWorkbook(sheets);
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanName = book.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${cleanName}_${book.category || 'business'}_export_${dateStr}.xlsx`;

  return { filename, content };
}
