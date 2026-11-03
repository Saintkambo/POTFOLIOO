import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBook } from '../../context/BookContext';
import { Header } from '../organisms/Header';
import { BottomNav, NavigationTab } from '../organisms/BottomNav';
import { DashboardPage } from '../../pages/DashboardPage';
import { TransactionsPage } from '../../pages/TransactionsPage';
import { ReportsPage } from '../../pages/ReportsPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { TransactionModal } from '../organisms/TransactionModal';
import { RentalTransactionModal } from '../organisms/RentalTransactionModal';
import { RestoreModal } from '../organisms/RestoreModal';
import { DeleteModal } from '../organisms/DeleteModal';
import { Transaction } from '../../../domain/models/transaction';
import { BackupValidationResult } from '../../../application/ports/backup-port';
import { Sparkles } from 'lucide-react';

export const AppShell: React.FC = () => {
  const { isDemoMode, exitDemoMode } = useAuth();
  const {
    book,
    isRentalBusiness,
    removeTransaction,
    applyRestore,
    downloadBackup,
    addRentalPayment,
    addPropertyExpense,
  } = useBook();

  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const [restorePreview, setRestorePreview] = useState<BackupValidationResult | null>(null);
  const [restoreRawContent, setRestoreRawContent] = useState<string>('');

  const handleOpenEdit = (txn: Transaction) => {
    setEditingTransaction(txn);
  };

  const handleOpenRestore = (result: BackupValidationResult, rawContent: string) => {
    setRestorePreview(result);
    setRestoreRawContent(rawContent);
  };

  const handleConfirmRestore = async () => {
    if (restoreRawContent) {
      await applyRestore(restoreRawContent);
      setRestorePreview(null);
      setRestoreRawContent('');
      setCurrentTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center selection:bg-electric-sky selection:text-blackstone">
      {/* Container simulating compact mobile first or centered desktop frame */}
      <div className="w-full max-w-[420px] md:max-w-xl lg:max-w-3xl min-h-screen flex flex-col relative pb-32 border-x border-blackstone/10 bg-canvas shadow-2xl">
        {/* Interactive Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-vivid-amber text-blackstone border-b-2 border-blackstone px-4 py-2.5 flex items-center justify-between gap-3 shadow-brutal-sm text-xs font-black z-30">
            <div className="flex items-center gap-2 truncate">
              <Sparkles className="w-4 h-4 shrink-0 text-blackstone animate-pulse" />
              <span className="truncate">INTERACTIVE DEMO • Sample SME Data (Real records untouched)</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={exitDemoMode}
                className="bg-slate-navy text-white text-[11px] font-extrabold px-3 py-1 rounded-control border-2 border-blackstone hover:bg-slate-navy-dark cursor-pointer shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5"
              >
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* Top Header: Business name, switcher, and Settings control on Dashboard only */}
        {currentTab === 'dashboard' && (
          <Header onOpenSettings={() => setCurrentTab('settings')} />
        )}

        {/* Page Content */}
        <main className="px-4 pt-3 flex-1">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenEditModal={handleOpenEdit}
              onNavigateToLedger={() => setCurrentTab('transactions')}
              onNavigateToReports={() => setCurrentTab('reports')}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onOpenEditModal={handleOpenEdit}
            />
          )}

          {currentTab === 'reports' && <ReportsPage />}

          {currentTab === 'settings' && (
            <SettingsPage onOpenRestoreModal={handleOpenRestore} />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[420px] md:max-w-xl lg:max-w-3xl z-40 px-4 pb-3 pointer-events-none">
          <div className="pointer-events-auto">
            <BottomNav
              currentTab={currentTab}
              onTabChange={(tab) => setCurrentTab(tab)}
            />
          </div>
        </div>
      </div>

      {/* Transaction Add / Edit Modal Drawer (Standard Business) */}
      {!isRentalBusiness && (
        <TransactionModal
          isOpen={isAddModalOpen || editingTransaction !== null}
          initialTransaction={editingTransaction}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
          onDeleteRequest={(txn) => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
            setDeletingTransaction(txn);
          }}
        />
      )}

      {/* Rental Transaction Modal (Rental Business Add Modal) */}
      {isRentalBusiness && isAddModalOpen && !editingTransaction && (
        <RentalTransactionModal
          isOpen={isAddModalOpen}
          currencyCode={book?.currencyCode || 'TZS'}
          onClose={() => setIsAddModalOpen(false)}
          onSaveRentPayment={addRentalPayment}
          onSavePropertyExpense={addPropertyExpense}
        />
      )}

      {/* Rental Transaction Modal (when editing) */}
      {isRentalBusiness && editingTransaction !== null && (
        <TransactionModal
          isOpen={editingTransaction !== null}
          initialTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onDeleteRequest={(txn) => {
            setEditingTransaction(null);
            setDeletingTransaction(txn);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deletingTransaction !== null}
        transaction={deletingTransaction}
        currencyCode={book?.currencyCode || 'TZS'}
        onClose={() => setDeletingTransaction(null)}
        onConfirmDelete={(id) => removeTransaction(id)}
      />

      {/* Restore Backup Preview Modal */}
      <RestoreModal
        isOpen={restorePreview !== null}
        previewResult={restorePreview}
        onClose={() => {
          setRestorePreview(null);
          setRestoreRawContent('');
        }}
        onConfirmRestore={handleConfirmRestore}
        onExportCurrentFirst={downloadBackup}
      />
    </div>
  );
};
