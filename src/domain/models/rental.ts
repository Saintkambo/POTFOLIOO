/**
 * Rental Domain Calculations & Rules
 */

export interface DueReminder {
  transactionId: string;
  tenantName: string;
  roomNumber: string;
  phoneNumber?: string;
  dueDate: string;
  daysRemaining: number;
  status: 'overdue' | 'due-today' | 'due-soon' | 'paid';
  lastAmountPaidMinor: number;
}

/**
 * Calculates the number of months paid by dividing total amount by monthly charge.
 * Rounded to 1 decimal place (e.g. 1.0, 2.5, 3.0).
 */
export function calculateMonthsPaid(amountMinor: number, chargePerRoomMinor: number): number {
  if (chargePerRoomMinor <= 0 || amountMinor <= 0) return 0;
  const rawMonths = amountMinor / chargePerRoomMinor;
  return Math.round(rawMonths * 10) / 10;
}

/**
 * Calculates due date by adding the given number of months to the paid date.
 * Formatted as YYYY-MM-DD.
 */
export function calculateDueDate(datePaid: string, monthsPaid: number): string {
  if (!datePaid || monthsPaid <= 0) return datePaid;

  const [yearStr, monthStr, dayStr] = datePaid.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const fullMonths = Math.floor(monthsPaid);
  const partialMonthDays = Math.round((monthsPaid - fullMonths) * 30);

  const targetDate = new Date(Date.UTC(year, month + fullMonths, day + partialMonthDays));
  const resYear = targetDate.getUTCFullYear();
  const resMonth = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const resDay = String(targetDate.getUTCDate()).padStart(2, '0');

  return `${resYear}-${resMonth}-${resDay}`;
}

/**
 * Computes the due status relative to today's date.
 * - 'overdue': daysRemaining < 0
 * - 'due-today': daysRemaining === 0
 * - 'due-soon': 1 <= daysRemaining <= 10 (10-day notice)
 * - 'paid': daysRemaining > 10
 */
export function evaluateDueStatus(dueDate: string, todayDateStr?: string): {
  status: 'overdue' | 'due-today' | 'due-soon' | 'paid';
  daysRemaining: number;
} {
  const today = todayDateStr ? new Date(todayDateStr) : new Date();
  today.setHours(0, 0, 0, 0);

  const [year, month, day] = dueDate.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'overdue', daysRemaining };
  }
  if (daysRemaining === 0) {
    return { status: 'due-today', daysRemaining: 0 };
  }
  if (daysRemaining <= 10) {
    return { status: 'due-soon', daysRemaining };
  }
  return { status: 'paid', daysRemaining };
}
