import React from 'react';
import { Transaction } from '../../../domain/models/transaction';
import { formatMoney } from '../../../domain/money';
import { Button } from '../ui/Button';
import { Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currencyCode: string;
  onConfirmDelete: (id: string) => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  transaction,
  currencyCode,
  onConfirmDelete,
}) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blackstone/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm bg-surface border-2 border-blackstone rounded-card p-5 shadow-brutal-xl">
        <div className="flex justify-between items-start">
          <div className="w-12 h-12 rounded-xl bg-danger/10 border-2 border-danger flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-danger" />
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blackstone/5 rounded">
            <X className="w-4 h-4 text-blackstone" />
          </button>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-bold font-heading text-blackstone">Delete Transaction?</h3>
          <p className="text-xs text-text-secondary mt-1">
            Are you sure you want to remove <span className="font-extrabold text-blackstone">"{transaction.note || transaction.category || 'this transaction'}"</span> for <span className="font-extrabold text-blackstone">{formatMoney(transaction.amountMinor, currencyCode)}</span> dated {transaction.transactionDate}?
          </p>
          <p className="text-[11px] text-blackstone/70 mt-2 font-medium bg-canvas p-2 rounded border border-border-subtle">
            This will immediately update your monthly summary figures.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <Button
            variant="destructive"
            size="md"
            className="w-full bg-danger text-white hover:bg-danger/90 border-blackstone"
            onClick={() => {
              onConfirmDelete(transaction.id);
              onClose();
            }}
          >
            Yes, Delete Entry
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onClose}
          >
            Keep Transaction
          </Button>
        </div>
      </div>
    </div>
  );
};
