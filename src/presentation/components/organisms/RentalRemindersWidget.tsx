import React, { useState } from 'react';
import { DueReminder } from '../../../domain/models/rental';
import { Card } from '../ui/Card';
import { Bell, Calendar, Phone, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { formatMoney } from '../../../domain/money';

interface RentalRemindersWidgetProps {
  reminders: DueReminder[];
  currencyCode: string;
}

export const RentalRemindersWidget: React.FC<RentalRemindersWidgetProps> = ({ reminders, currencyCode }) => {
  // Filter for active reminders: due in <= 10 days or overdue
  const activeAlerts = reminders.filter((r) => r.daysRemaining <= 10);

  // Message banner state for invalid or missing phone numbers
  const [phoneNotice, setPhoneNotice] = useState<{
    tenantName: string;
    message: string;
  } | null>(null);

  const handleCallTenant = (reminder: DueReminder) => {
    const rawPhone = reminder.phoneNumber?.trim() || '';
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    if (!cleanPhone || !/\d/.test(cleanPhone)) {
      setPhoneNotice({
        tenantName: reminder.tenantName,
        message: `No valid phone number saved for "${reminder.tenantName}" (Room ${reminder.roomNumber}). Please update their phone number in the rental ledger before calling.`,
      });
      return;
    }

    // Clear any existing notice
    setPhoneNotice(null);

    // Launch native dialer with prefilled phone number ready to call.
    // The tel: URI protocol opens the native dialer without placing the call automatically,
    // requiring the user to confirm and initiate the call.
    window.location.href = `tel:${cleanPhone}`;
  };

  if (activeAlerts.length === 0) {
    return (
      <Card shadowSize="sm" className="bg-citron-lime-tint border-2 border-blackstone p-4">
        <div className="flex items-center gap-2.5 text-xs font-extrabold text-blackstone">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>All Rent Payments Up to Date!</span>
        </div>
        <p className="text-[11px] text-text-secondary mt-1">
          No tenant rent is due within the next 10 days.
        </p>
      </Card>
    );
  }

  return (
    <Card shadowSize="md" className="bg-canvas border-2 border-blackstone p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-vivid-amber border border-blackstone flex items-center justify-center">
            <Bell className="w-3 h-3 text-blackstone animate-bounce" />
          </div>
          <h3 className="text-xs font-black font-heading uppercase tracking-wider text-blackstone">
            Rent Due Reminders ({activeAlerts.length})
          </h3>
        </div>
        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tight">
          10-Day & Due Alerts
        </span>
      </div>

      {phoneNotice && (
        <div
          role="alert"
          className="p-3 bg-rose-50 border-2 border-danger rounded-control text-xs font-bold text-danger flex items-start justify-between gap-2 animate-in fade-in"
        >
          <div className="flex items-start gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-extrabold text-blackstone leading-tight">Unable to Call Tenant</p>
              <p className="text-[11px] leading-snug">{phoneNotice.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhoneNotice(null)}
            className="text-blackstone/60 hover:text-blackstone p-1 rounded cursor-pointer shrink-0 font-black text-xs"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      <div className="space-y-2">
        {activeAlerts.map((reminder) => {
          const isOverdue = reminder.daysRemaining < 0;
          const isDueToday = reminder.daysRemaining === 0;
          const isDueSoon = reminder.daysRemaining > 0 && reminder.daysRemaining <= 10;

          return (
            <div
              key={reminder.transactionId}
              className={`p-3 rounded-control border-2 border-blackstone flex items-center justify-between gap-3 shadow-brutal transition-all ${
                isOverdue
                  ? 'bg-rose-50 border-danger'
                  : isDueToday
                  ? 'bg-vivid-amber-tint border-vivid-amber'
                  : 'bg-surface'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-blackstone text-white text-[10px] font-black tracking-tight">
                    Room {reminder.roomNumber}
                  </span>
                  <span className="font-extrabold text-sm text-blackstone truncate">
                    {reminder.tenantName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-text-secondary font-medium">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-2.5 h-2.5 text-blackstone/60" />
                    Due: {reminder.dueDate}
                  </span>
                  <span>•</span>
                  <span>Last: {formatMoney(reminder.lastAmountPaidMinor, currencyCode)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Status Badge */}
                {isOverdue && (
                  <span className="px-2 py-1 rounded bg-danger text-white text-[10px] font-black uppercase flex items-center gap-1 border border-blackstone">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {Math.abs(reminder.daysRemaining)}d Overdue
                  </span>
                )}

                {isDueToday && (
                  <span className="px-2 py-1 rounded bg-vivid-amber text-blackstone text-[10px] font-black uppercase flex items-center gap-1 border border-blackstone animate-pulse">
                    <Clock className="w-2.5 h-2.5" />
                    Due Today!
                  </span>
                )}

                {isDueSoon && (
                  <span className="px-2 py-1 rounded bg-citron-lime text-blackstone text-[10px] font-black uppercase flex items-center gap-1 border border-blackstone">
                    <Clock className="w-2.5 h-2.5" />
                    Due in {reminder.daysRemaining}d
                  </span>
                )}

                {/* Call Overdue Rental Customer Button */}
                {isOverdue ? (
                  <button
                    type="button"
                    onClick={() => handleCallTenant(reminder)}
                    className="px-2.5 py-1.5 rounded-control bg-blackstone text-white hover:bg-blackstone/85 text-xs font-black flex items-center gap-1.5 shadow-brutal-sm cursor-pointer neo-press transition-all shrink-0 border border-blackstone active:translate-x-0.5 active:translate-y-0.5"
                    title={
                      reminder.phoneNumber
                        ? `Call ${reminder.tenantName} (${reminder.phoneNumber})`
                        : `Call ${reminder.tenantName}`
                    }
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>Call</span>
                  </button>
                ) : (
                  reminder.phoneNumber && (
                    <button
                      type="button"
                      onClick={() => handleCallTenant(reminder)}
                      title={`Call ${reminder.tenantName} (${reminder.phoneNumber})`}
                      className="w-8 h-8 rounded-control bg-surface border-2 border-blackstone flex items-center justify-center hover:bg-canvas transition-colors shadow-sm cursor-pointer"
                    >
                      <Phone className="w-3 h-3 text-blackstone" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
