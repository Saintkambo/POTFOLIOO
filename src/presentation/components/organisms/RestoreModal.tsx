import React from 'react';
import { BackupValidationResult } from '../../../application/ports/backup-port';
import { Button } from '../ui/Button';
import { AlertTriangle, X } from 'lucide-react';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewResult: BackupValidationResult | null;
  onConfirmRestore: () => void;
  onExportCurrentFirst: () => void;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  previewResult,
  onConfirmRestore,
  onExportCurrentFirst,
}) => {
  if (!isOpen || !previewResult || !previewResult.preview) return null;
  const { preview } = previewResult;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blackstone/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-surface border-2 border-blackstone rounded-card p-5 shadow-brutal-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-blackstone/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-vivid-amber flex items-center justify-center border border-blackstone">
              <AlertTriangle className="w-3.5 h-3.5 text-blackstone stroke-[2.2]" />
            </div>
            <h2 className="text-lg font-bold font-heading text-blackstone">Confirm Ledger Restore</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-blackstone/5 rounded">
            <X className="w-4 h-4 text-blackstone" />
          </button>
        </div>

        {/* Backup details inspection box */}
        <div className="mt-4 p-3.5 bg-surface-muted border-2 border-blackstone rounded-control text-xs space-y-1.5 font-medium">
          <div className="flex justify-between">
            <span className="text-text-secondary">Target Book:</span>
            <span className="font-extrabold text-blackstone">{preview.bookName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Currency:</span>
            <span className="font-bold text-blackstone">{preview.currencyCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Export Timestamp:</span>
            <span className="text-blackstone">{new Date(preview.exportedAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Transactions to Restore:</span>
            <span className="font-black text-blackstone">{preview.transactionCount} entries</span>
          </div>
        </div>

        {/* Warning callout */}
        <div className="mt-4 p-3 bg-vivid-amber-tint border border-vivid-amber rounded-control text-xs text-blackstone font-medium">
          <p className="font-extrabold mb-0.5">Warning: Existing records will be replaced.</p>
          Restoring this backup overwrites your current local ledger. If you have unbacked-up data, export it first.
        </div>

        {/* Action buttons */}
        <div className="mt-5 space-y-2">
          <Button
            variant="destructive"
            size="lg"
            className="w-full bg-danger text-white hover:bg-danger/90 border-blackstone"
            onClick={onConfirmRestore}
          >
            Replace Current Book
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onExportCurrentFirst}
          >
            Export Current Book First
          </Button>
          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
