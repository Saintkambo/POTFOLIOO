import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { clientAuthService } from '../../infrastructure/auth/auth-service';
import { Book, BusinessCategory } from '../../domain/models/book';
import { Transaction, TransactionType, PaymentStatus, PaymentMethod, DebtRepayment } from '../../domain/models/transaction';
import { MonthSummary, calculateMonthSummary } from '../../domain/models/summary';
import { getCurrentMonthString, offsetMonth, getMonthFromDate } from '../../domain/date';
import { DexieBookRepository } from '../../infrastructure/db/dexie-book-repository';
import { DexieTransactionRepository } from '../../infrastructure/db/dexie-transaction-repository';
import { JsonBackupAdapter } from '../../infrastructure/backup/json-backup-adapter';
import { createBook } from '../../application/use-cases/initialize-book';
import { recordTransaction } from '../../application/use-cases/record-transaction';
import { updateTransaction, deleteTransaction } from '../../application/use-cases/update-transaction';
import { exportBackup, restoreBackup, exportCSV, exportExcel, exportPDF, validateBackup } from '../../application/use-cases/export-backup';
import { checkStorageStatus, requestPersistentStorage } from '../../infrastructure/storage/storage-manager';
import { BackupValidationResult } from '../../application/ports/backup-port';
import { supabaseSyncService, SyncResult } from '../../infrastructure/supabase/supabase-sync-service';
import { isSupabaseConfigured } from '../../infrastructure/supabase/supabase-client';
import { calculateDueDate, evaluateDueStatus, DueReminder } from '../../domain/models/rental';
import {
  InventoryItem,
  BestSellingItem,
  InventoryAlert,
  DebtorRecord,
  DebtorAlert,
  getInventoryAlerts,
  getDebtorsReport,
  getDebtorAlerts,
  calculateRetailTodaySummary,
  calculateRetailPeriodStatement,
  calculateItemProfitability,
  getBestSellingItems,
  RetailTodaySummary,
  RetailPeriodStatement,
  ItemProfitability,
} from '../../domain/models/inventory';
import { DexieInventoryRepository } from '../../infrastructure/db/dexie-inventory-repository';
import { DexieBusinessRepository } from '../../infrastructure/db/dexie-business-repository';
import { db } from '../../infrastructure/db/database';
import { BusinessOnboardingData } from '../../domain/models/business';
import {
  DEMO_RETAIL_BOOK,
  DEMO_RENTAL_BOOK,
  getInitialDemoInventory,
  getInitialDemoTransactions,
} from '../../domain/models/demo';
import { parseAmountToMinor, DEFAULT_CURRENCY } from '../../domain/money';

// Repositories
const bookRepo = new DexieBookRepository();
const txnRepo = new DexieTransactionRepository();
const inventoryRepo = new DexieInventoryRepository();
const businessRepo = new DexieBusinessRepository();
const backupAdapter = new JsonBackupAdapter();

function getLocalTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type CloudSyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface RentalSummary {
  totalRentsCollectedMinor: number;
  totalPropertyExpensesMinor: number;
  netRentalIncomeMinor: number;
  totalTenantsCount: number;
  activeRemindersCount: number;
}

interface BookContextType {
  // Business / Book state
  book: Book | null;
  books: Book[];
  switchBook: (id: string) => Promise<void>;
  createBusiness: (
    name: string,
    category: BusinessCategory,
    onboardingData?: Partial<BusinessOnboardingData>
  ) => Promise<Book>;
  deleteBusiness: (id: string) => Promise<void>;
  renameBook: (name: string) => Promise<void>;
  updateCurrency: (currencyCode: string) => Promise<void>;
  updateCategory: (category: BusinessCategory) => Promise<void>;

  // Data & reporting
  selectedMonth: string;
  summary: MonthSummary;
  monthTransactions: Transaction[];
  allTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  isStoragePersisted: boolean;

  // Rental specific features
  isRentalBusiness: boolean;
  rentalSummary: RentalSummary;
  rentalReminders: DueReminder[];
  addRentalPayment: (data: {
    tenantName: string;
    roomNumber: string;
    phoneNumber?: string;
    amountInput: string;
    chargePerRoomInput: string;
    datePaid: string;
    dueDate?: string;
    note?: string;
  }) => Promise<void>;
  addPropertyExpense: (data: {
    amountInput: string;
    transactionDate: string;
    category: string;
    note?: string;
  }) => Promise<void>;

  // Retail / Wholesale specific features
  isRetailBusiness: boolean;
  lowStockThreshold: number;
  updateLowStockThreshold: (threshold: number) => Promise<void>;
  inventoryItems: InventoryItem[];
  inventoryAlerts: InventoryAlert[];
  debtorAlerts: DebtorAlert[];
  debtorList: DebtorRecord[];
  allDebtorList: DebtorRecord[];
  retailTodaySummary: RetailTodaySummary;
  retailPeriodStatement: RetailPeriodStatement;
  itemProfitabilityList: ItemProfitability[];
  bestSellersList: BestSellingItem[];
  addInventoryItem: (data: {
    name: string;
    initialQuantity: number;
    purchasePriceInput: string;
  }) => Promise<InventoryItem | undefined>;
  replenishStock: (data: {
    itemId: string;
    quantityAdded: number;
    purchasePriceInput: string;
  }) => Promise<InventoryItem | undefined>;
  recordRetailSale: (data: {
    itemId: string;
    quantitySold: number;
    sellingPriceInput: string;
    transactionDate: string;
    customerName?: string;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    amountPaidInput?: string;
    note?: string;
  }) => Promise<void>;
  recordDebtRepayment: (data: {
    transactionId: string;
    amountInput: string;
    paymentMethod: PaymentMethod;
    repaymentDate: string;
    note?: string;
  }) => Promise<void>;
  recordOperatingExpense: (data: {
    amountInput: string;
    transactionDate: string;
    category: string;
    note?: string;
  }) => Promise<void>;
  deleteInventoryItem: (id: string) => Promise<void>;

  // Supabase Cloud Sync
  cloudSyncStatus: CloudSyncStatus;
  lastSyncTime: string | null;
  isCloudConfigured: boolean;
  triggerCloudSync: () => Promise<SyncResult | null>;

  // Navigation
  setSelectedMonth: (month: string) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  resetToCurrentMonth: () => void;

  // General Transaction operations
  addTransaction: (data: {
    type: TransactionType;
    amountInput: string;
    transactionDate: string;
    category?: string;
    note?: string;
    tenantName?: string;
    roomNumber?: string;
    phoneNumber?: string;
    chargePerRoomInput?: string;
    monthsPaid?: number;
    dueDate?: string;
  }) => Promise<void>;
  editTransaction: (data: {
    id: string;
    type: TransactionType;
    amountInput: string;
    transactionDate: string;
    category?: string;
    note?: string;
    tenantName?: string;
    roomNumber?: string;
    phoneNumber?: string;
    chargePerRoomInput?: string;
    monthsPaid?: number;
    dueDate?: string;
  }) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  // Portability
  downloadBackup: () => Promise<void>;
  inspectBackup: (content: string) => BackupValidationResult;
  applyRestore: (content: string) => Promise<void>;
  downloadCSV: () => Promise<void>;
  downloadExcel: () => Promise<void>;
  downloadPDF: () => Promise<void>;

  // Fresh Start & Data Reset
  resetBusinessData: (bookId: string) => Promise<void>;
  restartOnboarding: () => Promise<void>;

  clearError: () => void;
}

const BookContext = createContext<BookContextType | null>(null);

export const BookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, authSession, isDemoMode } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthString());
  const [monthTransactions, setMonthTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthSummary>(() => calculateMonthSummary(selectedMonth, []));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isStoragePersisted, setIsStoragePersisted] = useState<boolean>(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Supabase Sync States
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('potfolioo_last_sync'));

  // Load Book and Transactions
  const reloadData = useCallback(async (currentBook: Book, month: string) => {
    if (isDemoMode) {
      const demoTxns = getInitialDemoTransactions();
      const demoItems = getInitialDemoInventory();
      setMonthTransactions(demoTxns);
      setAllTransactions(demoTxns);
      setInventoryItems(demoItems);
      setSummary(calculateMonthSummary(month, demoTxns));
      return;
    }

    try {
      const [txnsForMonth, allTxns, allBks, items] = await Promise.all([
        txnRepo.listByMonth(currentBook.id, month),
        txnRepo.listAllByBook(currentBook.id),
        bookRepo.getAllBooks(),
        inventoryRepo.getItemsByBook(currentBook.id),
      ]);

      setMonthTransactions(txnsForMonth);
      setAllTransactions(allTxns);
      setSummary(calculateMonthSummary(month, txnsForMonth));
      setBooks(allBks);
      setInventoryItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction data');
    }
  }, [isDemoMode]);

  // Background Cloud Sync Trigger
  const triggerCloudSync = useCallback(async (): Promise<SyncResult | null> => {
    if (isDemoMode) return null;
    if (!book || !isSupabaseConfigured) {
      setCloudSyncStatus('offline');
      return null;
    }

    try {
      setCloudSyncStatus('syncing');
      // Sync active book
      const result = await supabaseSyncService.syncFull(book);
      // Also discover any books created on other devices
      const remoteBooks = await supabaseSyncService.pullAllBooksFromCloud();
      if (remoteBooks.length > 0) {
        setBooks(remoteBooks);
      }

      if (result.success) {
        setCloudSyncStatus('synced');
        setLastSyncTime(result.timestamp);
        localStorage.setItem('potfolioo_last_sync', result.timestamp);
        await reloadData(book, selectedMonth);
      } else {
        setCloudSyncStatus('error');
        console.warn('Supabase sync warning:', result.error);
      }
      return result;
    } catch (err) {
      setCloudSyncStatus('error');
      console.warn('Supabase sync error:', err);
      return null;
    }
  }, [book, reloadData, selectedMonth, isDemoMode]);

  useEffect(() => {
    async function startup() {
      // If in interactive demo mode, initialize isolated demo state
      if (isDemoMode) {
        setBook(DEMO_RETAIL_BOOK);
        setBooks([DEMO_RETAIL_BOOK, DEMO_RENTAL_BOOK]);
        const demoTxns = getInitialDemoTransactions();
        const demoItems = getInitialDemoInventory();
        setMonthTransactions(demoTxns);
        setAllTransactions(demoTxns);
        setInventoryItems(demoItems);
        setSummary(calculateMonthSummary(selectedMonth, demoTxns));
        setCloudSyncStatus('offline');
        setIsLoading(false);
        return;
      }

      if (!currentUser) {
        setBook(null);
        setBooks([]);
        setAllTransactions([]);
        setMonthTransactions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // 1. Reconcile and self-heal any existing local books (never purge real user data!)
        const allLocalBooks = await bookRepo.getAllBooks();
        for (const b of allLocalBooks) {
          if (b.id === DEMO_RETAIL_BOOK.id || b.id === DEMO_RENTAL_BOOK.id) continue;
          let modified = false;
          if (!b.userId && currentUser) {
            b.userId = currentUser.id;
            modified = true;
          }
          if (!b.businessId) {
            b.businessId = b.id;
            modified = true;
          }
          if (!b.currencyCode || b.currencyCode === 'USD') {
            b.currencyCode = 'TZS';
            modified = true;
          }
          if (modified) {
            await db.books.put(b);
          }
        }

        // 2. Fetch all business books for current user
        let userBooks = await bookRepo.getBooksByUserId(currentUser.id);

        // 3. If user has no local books yet, attempt cloud sync from Supabase
        if (userBooks.length === 0 && isSupabaseConfigured) {
          try {
            const cloudBooks = await supabaseSyncService.pullAllBooksFromCloud();
            if (cloudBooks.length > 0) {
              for (const cb of cloudBooks) {
                cb.userId = currentUser.id;
                cb.businessId = cb.businessId || cb.id;
                await db.books.put(cb);
              }
              userBooks = await bookRepo.getBooksByUserId(currentUser.id);
            }
          } catch (syncErr) {
            console.warn('Initial cloud sync notice:', syncErr);
          }
        }

        // 4. If user still has no business books, leave book as null so user enters onboarding
        if (userBooks.length === 0) {
          setBooks([]);
          setBook(null);
          setMonthTransactions([]);
          setAllTransactions([]);
          setInventoryItems([]);
          setSummary(calculateMonthSummary(selectedMonth, []));
          localStorage.removeItem('potfolioo_active_book_id');
          setIsLoading(false);
          return;
        }

        // Normalize currency
        userBooks = userBooks.map((b) => {
          if (!b.currencyCode || b.currencyCode === 'USD') {
            b.currencyCode = 'TZS';
          }
          return b;
        });

        setBooks(userBooks);
        const storedActiveId = localStorage.getItem('potfolioo_active_book_id');
        const activeBook = userBooks.find((b) => b.id === storedActiveId) || userBooks[0];
        setBook(activeBook);

        if (activeBook) {
          await reloadData(activeBook, selectedMonth);

          // Check connectivity
          if (authSession?.token) {
            clientAuthService
              .syncUserCloudData(currentUser.id, authSession.token)
              .then(() => setCloudSyncStatus('synced'))
              .catch(() => setCloudSyncStatus('offline'));
          } else if (isSupabaseConfigured) {
            const isOnline = await supabaseSyncService.checkConnection();
            if (isOnline) {
              setCloudSyncStatus('synced');
            } else {
              setCloudSyncStatus('offline');
            }
          }
        }

        const storageStatus = await checkStorageStatus();
        setIsStoragePersisted(storageStatus.isPersisted);
        if (!storageStatus.isPersisted) {
          const granted = await requestPersistentStorage();
          setIsStoragePersisted(granted);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      } finally {
        setIsLoading(false);
      }
    }
    startup();
  }, [currentUser, authSession, reloadData, isDemoMode]);

  // Reload transactions whenever active book or selectedMonth changes
  useEffect(() => {
    if (book && !isDemoMode) {
      reloadData(book, selectedMonth);
    }
  }, [book?.id, selectedMonth, reloadData, isDemoMode]);

  // Switch Active Business
  const switchBook = async (id: string) => {
    if (isDemoMode) {
      if (id === DEMO_RENTAL_BOOK.id) {
        setBook(DEMO_RENTAL_BOOK);
      } else {
        setBook(DEMO_RETAIL_BOOK);
      }
      return;
    }

    const target = books.find((b) => b.id === id);
    if (!target) return;
    try {
      setIsLoading(true);
      localStorage.setItem('potfolioo_active_book_id', target.id);
      setBook(target);
      await reloadData(target, selectedMonth);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a New Business (Rental, Retail, or Other) with Onboarding support
  const createBusiness = async (
    name: string,
    category: BusinessCategory,
    onboardingData?: Partial<BusinessOnboardingData>
  ): Promise<Book> => {
    try {
      setIsLoading(true);

      let businessId: string | undefined = undefined;
      if (currentUser) {
        try {
          const { business } = await businessRepo.createBusiness(
            {
              name,
              type: onboardingData?.type || (category === 'rental' ? 'rental' : 'retail'),
              category,
              location: onboardingData?.location || 'Dar es Salaam',
              address: onboardingData?.address,
              currencyCode: onboardingData?.currencyCode || DEFAULT_CURRENCY,
              financialYearStart: onboardingData?.financialYearStart || '01-01',
              accountingPreferences: onboardingData?.accountingPreferences || { basis: 'cash', vatRegistered: false },
            },
            currentUser.id
          );
          businessId = business.id;
        } catch (bErr) {
          console.warn('Business repository notice:', bErr);
        }
      }

      const newBook = await createBook(bookRepo, {
        name,
        category,
        currencyCode: onboardingData?.currencyCode || DEFAULT_CURRENCY,
        userId: currentUser?.id,
        businessId,
      });

      const updatedBooks = currentUser
        ? await bookRepo.getBooksByUserId(currentUser.id)
        : await bookRepo.getAllBooks();
      setBooks(updatedBooks);
      setBook(newBook);
      localStorage.setItem('potfolioo_active_book_id', newBook.id);
      await reloadData(newBook, selectedMonth);

      if (authSession?.token && currentUser) {
        clientAuthService.syncUserCloudData(currentUser.id, authSession.token).catch((e: unknown) => console.warn('Cloud sync error on create:', e));
      } else if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(newBook, []).catch((e: unknown) => console.warn('Supabase sync error on create:', e));
      }

      return newBook;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create business');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete a Business
  const deleteBusiness = async (id: string) => {
    try {
      setIsLoading(true);
      await bookRepo.deleteBook(id);
      if (isSupabaseConfigured) {
        supabaseSyncService.deleteRemoteBook(id).catch((e) => console.warn('Supabase delete error:', e));
      }

      const remaining = await bookRepo.getAllBooks();
      setBooks(remaining);
      if (remaining.length > 0) {
        const nextActive = remaining[0];
        setBook(nextActive);
        localStorage.setItem('potfolioo_active_book_id', nextActive.id);
        await reloadData(nextActive, selectedMonth);
      } else {
        const newDefault = await createBook(bookRepo, { name: 'My Business', category: 'other' });
        setBook(newDefault);
        setBooks([newDefault]);
        await reloadData(newDefault, selectedMonth);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete business');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all transactions & inventory for an active business (Start fresh)
  const resetBusinessData = async (bookId: string) => {
    try {
      setIsLoading(true);
      await db.transaction('rw', db.transactions, db.inventoryItems, async () => {
        await db.transactions.where('bookId').equals(bookId).delete();
        await db.inventoryItems.where('bookId').equals(bookId).delete();
      });
      if (book && book.id === bookId) {
        setMonthTransactions([]);
        setAllTransactions([]);
        setInventoryItems([]);
        setSummary(calculateMonthSummary(selectedMonth, []));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset business data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Restart onboarding from scratch (clears all current business records)
  const restartOnboarding = async () => {
    try {
      setIsLoading(true);
      if (currentUser) {
        const userBooks = await bookRepo.getBooksByUserId(currentUser.id);
        for (const b of userBooks) {
          await bookRepo.deleteBook(b.id);
        }
        await db.businesses.clear();
        await db.businessMembers.clear();
      }
      setBook(null);
      setBooks([]);
      setMonthTransactions([]);
      setAllTransactions([]);
      setInventoryItems([]);
      setSummary(calculateMonthSummary(selectedMonth, []));
      localStorage.removeItem('potfolioo_active_book_id');
      localStorage.removeItem('potfolioo_onboarding_draft');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restart onboarding');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const renameBook = async (name: string) => {
    if (!book) return;
    try {
      await bookRepo.updateBookName(book.id, name);
      const updated: Book = { ...book, name: name.trim(), updatedAt: new Date().toISOString() };
      setBook(updated);
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(updated, monthTransactions).catch((e) => console.warn('Cloud sync error:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename book');
      throw err;
    }
  };

  const updateCategory = async (category: BusinessCategory) => {
    if (!book) return;
    try {
      await bookRepo.updateBookCategory(book.id, category);
      const updated: Book = { ...book, category, updatedAt: new Date().toISOString() };
      setBook(updated);
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(updated, monthTransactions).catch((e) => console.warn('Cloud sync error:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
      throw err;
    }
  };

  const updateCurrency = async (currencyCode: string) => {
    if (!book) return;
    try {
      await bookRepo.updateCurrency(book.id, currencyCode);
      const updated = { ...book, currencyCode, updatedAt: new Date().toISOString() };
      setBook(updated);
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(updated, monthTransactions).catch((e) => console.warn('Cloud sync error:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update currency');
      throw err;
    }
  };

  // General Transaction Operations
  const addTransaction = async (data: {
    type: TransactionType;
    amountInput: string;
    transactionDate: string;
    category?: string;
    note?: string;
    tenantName?: string;
    roomNumber?: string;
    phoneNumber?: string;
    chargePerRoomInput?: string;
    monthsPaid?: number;
    dueDate?: string;
  }) => {
    let targetBook = book;
    if (!targetBook) {
      const allBooks = await bookRepo.getAllBooks();
      if (allBooks.length > 0) {
        targetBook = allBooks[0];
        setBook(targetBook);
      } else {
        throw new Error('No active business book selected. Please create or select a business first.');
      }
    }

    try {
      const savedTxn = await recordTransaction(txnRepo, {
        bookId: targetBook.id,
        businessId: targetBook.businessId || targetBook.id,
        type: data.type,
        amountInput: data.amountInput,
        currencyCode: targetBook.currencyCode,
        transactionDate: data.transactionDate,
        category: data.category,
        note: data.note,
        tenantName: data.tenantName,
        roomNumber: data.roomNumber,
        phoneNumber: data.phoneNumber,
        chargePerRoomInput: data.chargePerRoomInput,
        monthsPaid: data.monthsPaid,
        dueDate: data.dueDate,
      });

      // Synchronize active month if recorded payment belongs to a different month
      let txnMonth = selectedMonth;
      try {
        txnMonth = getMonthFromDate(data.transactionDate);
        if (txnMonth !== selectedMonth) {
          setSelectedMonth(txnMonth);
        }
      } catch {
        txnMonth = selectedMonth;
      }

      await reloadData(targetBook, txnMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(targetBook, [savedTxn]).catch((e) => console.warn('Cloud sync error on add:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
      throw err;
    }
  };

  // Specialized Rental Payment
  const addRentalPayment = async (data: {
    tenantName: string;
    roomNumber: string;
    phoneNumber?: string;
    amountInput: string;
    chargePerRoomInput: string;
    datePaid: string;
    dueDate?: string;
    note?: string;
  }) => {
    let targetBook = book;
    if (!targetBook) {
      const allBooks = await bookRepo.getAllBooks();
      if (allBooks.length > 0) {
        targetBook = allBooks[0];
        setBook(targetBook);
      } else {
        throw new Error('No active rental business found. Please select or create a rental business first.');
      }
    }

    // Calculate months paid
    const numAmount = parseFloat(data.amountInput.replace(/,/g, '')) || 0;
    const numCharge = parseFloat(data.chargePerRoomInput.replace(/,/g, '')) || 0;
    const monthsPaid = numCharge > 0 ? Math.round((numAmount / numCharge) * 10) / 10 : 1;

    // Calculate due date if not explicitly provided
    let calculatedDueDate = data.dueDate && data.dueDate.trim().length > 0 ? data.dueDate.trim() : '';
    if (!calculatedDueDate) {
      calculatedDueDate = calculateDueDate(data.datePaid, monthsPaid > 0 ? monthsPaid : 1);
    }

    await addTransaction({
      type: 'income',
      amountInput: data.amountInput,
      transactionDate: data.datePaid,
      category: 'Rent Payment',
      note: data.note,
      tenantName: data.tenantName,
      roomNumber: data.roomNumber,
      phoneNumber: data.phoneNumber,
      chargePerRoomInput: data.chargePerRoomInput,
      monthsPaid,
      dueDate: calculatedDueDate,
    });
  };

  // Specialized Property Expense
  const addPropertyExpense = async (data: {
    amountInput: string;
    transactionDate: string;
    category: string;
    note?: string;
  }) => {
    await addTransaction({
      type: 'expense',
      amountInput: data.amountInput,
      transactionDate: data.transactionDate,
      category: data.category, // e.g. "Renovations", "Decorating", "Plumbing", "Repairs"
      note: data.note,
    });
  };

  const editTransaction = async (data: {
    id: string;
    type: TransactionType;
    amountInput: string;
    transactionDate: string;
    category?: string;
    note?: string;
    tenantName?: string;
    roomNumber?: string;
    phoneNumber?: string;
    chargePerRoomInput?: string;
    monthsPaid?: number;
    dueDate?: string;
  }) => {
    if (!book) return;
    try {
      const updatedTxn = await updateTransaction(txnRepo, {
        id: data.id,
        type: data.type,
        amountInput: data.amountInput,
        currencyCode: book.currencyCode,
        transactionDate: data.transactionDate,
        category: data.category,
        note: data.note,
        tenantName: data.tenantName,
        roomNumber: data.roomNumber,
        phoneNumber: data.phoneNumber,
        chargePerRoomInput: data.chargePerRoomInput,
        monthsPaid: data.monthsPaid,
        dueDate: data.dueDate,
      });
      await reloadData(book, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(book, [updatedTxn]).catch((e) => console.warn('Cloud sync error on edit:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update transaction');
      throw err;
    }
  };

  const removeTransaction = async (id: string) => {
    if (!book) return;
    try {
      await deleteTransaction(txnRepo, id);
      await reloadData(book, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.deleteRemoteTransaction(id).catch((e) => console.warn('Cloud sync error on delete:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      throw err;
    }
  };

  // Rental Computed Metrics
  const isRentalBusiness = book?.category === 'rental';

  const rentalSummary: RentalSummary = useMemo(() => {
    if (!isRentalBusiness) {
      return {
        totalRentsCollectedMinor: 0,
        totalPropertyExpensesMinor: 0,
        netRentalIncomeMinor: 0,
        totalTenantsCount: 0,
        activeRemindersCount: 0,
      };
    }

    let rentsCollected = 0;
    let propertyExpenses = 0;
    const uniqueTenants = new Set<string>();

    monthTransactions.forEach((txn) => {
      if (txn.type === 'income') {
        rentsCollected += txn.amountMinor;
        if (txn.roomNumber || txn.tenantName) {
          uniqueTenants.add(txn.roomNumber || txn.tenantName || txn.id);
        }
      } else {
        propertyExpenses += txn.amountMinor;
      }
    });

    return {
      totalRentsCollectedMinor: rentsCollected,
      totalPropertyExpensesMinor: propertyExpenses,
      netRentalIncomeMinor: rentsCollected - propertyExpenses,
      totalTenantsCount: uniqueTenants.size,
      activeRemindersCount: 0, // updated below
    };
  }, [isRentalBusiness, monthTransactions]);

  // Compute Rent Due Reminders (Due in 10 days, due today, or overdue)
  const rentalReminders: DueReminder[] = useMemo(() => {
    if (!isRentalBusiness) return [];

    // Group transactions by room/tenant to find latest rent record
    const latestByRoom = new Map<string, Transaction>();
    allTransactions.forEach((txn) => {
      if (txn.dueDate && txn.tenantName && txn.roomNumber) {
        const key = `${txn.roomNumber}-${txn.tenantName}`;
        const existing = latestByRoom.get(key);
        if (!existing || txn.transactionDate > existing.transactionDate) {
          latestByRoom.set(key, txn);
        }
      }
    });

    const reminders: DueReminder[] = [];
    latestByRoom.forEach((txn) => {
      if (txn.dueDate) {
        const { status, daysRemaining } = evaluateDueStatus(txn.dueDate);
        reminders.push({
          transactionId: txn.id,
          tenantName: txn.tenantName || 'Unknown Tenant',
          roomNumber: txn.roomNumber || 'N/A',
          phoneNumber: txn.phoneNumber || undefined,
          dueDate: txn.dueDate,
          daysRemaining,
          status,
          lastAmountPaidMinor: txn.amountMinor,
        });
      }
    });

    // Sort: overdue (< 0) -> due-today (0) -> due-soon (1-10) -> paid (> 10)
    reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
    return reminders;
  }, [isRentalBusiness, allTransactions]);

  // Retail Computed Metrics
  const isRetailBusiness = book?.category === 'retail';
  const lowStockThreshold = book?.lowStockThreshold ?? 10;

  const updateLowStockThreshold = async (threshold: number) => {
    if (!book) return;
    try {
      await bookRepo.updateLowStockThreshold(book.id, threshold);
      await inventoryRepo.updateAllStatuses(book.id, threshold);
      const updated: Book = { ...book, lowStockThreshold: threshold, updatedAt: new Date().toISOString() };
      setBook(updated);
      setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      await reloadData(updated, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(updated, monthTransactions).catch((e) => console.warn('Cloud sync error on threshold update:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update low stock threshold');
      throw err;
    }
  };

  const inventoryAlerts: InventoryAlert[] = useMemo(() => {
    if (!isRetailBusiness) return [];
    return getInventoryAlerts(inventoryItems, lowStockThreshold);
  }, [isRetailBusiness, inventoryItems, lowStockThreshold]);

  const debtorList: DebtorRecord[] = useMemo(() => {
    if (!isRetailBusiness) return [];
    return getDebtorsReport(monthTransactions);
  }, [isRetailBusiness, monthTransactions]);

  const allDebtorList: DebtorRecord[] = useMemo(() => {
    if (!isRetailBusiness) return [];
    return getDebtorsReport(allTransactions);
  }, [isRetailBusiness, allTransactions]);

  const debtorAlerts: DebtorAlert[] = useMemo(() => {
    if (!isRetailBusiness) return [];
    return getDebtorAlerts(allTransactions);
  }, [isRetailBusiness, allTransactions]);

  const retailTodaySummary: RetailTodaySummary = useMemo(() => {
    if (!isRetailBusiness) {
      return {
        todaySalesMinor: 0,
        todayExpensesMinor: 0,
        todayNetMinor: 0,
        todaySalesCount: 0,
        todayExpensesCount: 0,
      };
    }
    const todayStr = getLocalTodayDateString();
    return calculateRetailTodaySummary(todayStr, allTransactions);
  }, [isRetailBusiness, allTransactions]);

  const retailPeriodStatement: RetailPeriodStatement = useMemo(() => {
    if (!isRetailBusiness) {
      return {
        salesRevenueMinor: 0,
        cogsMinor: 0,
        grossProfitMinor: 0,
        operatingExpensesMinor: 0,
        netProfitMinor: 0,
      };
    }
    return calculateRetailPeriodStatement(monthTransactions);
  }, [isRetailBusiness, monthTransactions]);

  const itemProfitabilityList: ItemProfitability[] = useMemo(() => {
    if (!isRetailBusiness) return [];
    return calculateItemProfitability(inventoryItems, monthTransactions);
  }, [isRetailBusiness, inventoryItems, monthTransactions]);

  const bestSellersList: BestSellingItem[] = useMemo(() => {
    if (!isRetailBusiness) return [];
    return getBestSellingItems(inventoryItems, monthTransactions);
  }, [isRetailBusiness, inventoryItems, monthTransactions]);

  // Retail Action Handlers
  const addInventoryItem = async (data: {
    name: string;
    initialQuantity: number;
    purchasePriceInput: string;
  }): Promise<InventoryItem | undefined> => {
    if (!book) return;
    try {
      const priceMinor = parseAmountToMinor(data.purchasePriceInput, book.currencyCode);
      const created = await inventoryRepo.createItem({
        bookId: book.id,
        name: data.name,
        initialQuantity: data.initialQuantity,
        purchasePriceMinor: priceMinor,
        lowStockThreshold,
      });
      await reloadData(book, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(book, []).catch((e) => console.warn('Cloud sync error on add item:', e));
      }

      return created;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add inventory item');
      throw err;
    }
  };

  const replenishStock = async (data: {
    itemId: string;
    quantityAdded: number;
    purchasePriceInput: string;
  }): Promise<InventoryItem | undefined> => {
    if (!book) return;
    try {
      const priceMinor = parseAmountToMinor(data.purchasePriceInput, book.currencyCode);
      const updated = await inventoryRepo.replenishStock(
        data.itemId,
        data.quantityAdded,
        priceMinor,
        lowStockThreshold
      );
      await reloadData(book, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(book, []).catch((e) => console.warn('Cloud sync error on replenish:', e));
      }

      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replenish inventory');
      throw err;
    }
  };

  const recordRetailSale = async (data: {
    itemId: string;
    quantitySold: number;
    sellingPriceInput: string;
    transactionDate: string;
    customerName?: string;
    paymentStatus: PaymentStatus;
    paymentMethod?: PaymentMethod;
    amountPaidInput?: string;
    note?: string;
  }) => {
    if (!book) return;
    try {
      const sellingPriceMinor = parseAmountToMinor(data.sellingPriceInput, book.currencyCode);
      const totalSaleAmountMinor = sellingPriceMinor * data.quantitySold;

      // Validate customer name if partial or on credit
      if (
        (data.paymentStatus === 'partial' || data.paymentStatus === 'credit') &&
        (!data.customerName || !data.customerName.trim())
      ) {
        throw new Error('Customer name is required for partial payments or sales on credit');
      }

      // Compute amount paid & outstanding balance
      let amountPaidMinor = 0;
      if (data.paymentStatus === 'paid') {
        amountPaidMinor = totalSaleAmountMinor;
      } else if (data.paymentStatus === 'credit') {
        amountPaidMinor = 0;
      } else if (data.paymentStatus === 'partial') {
        const rawPaid = parseAmountToMinor(data.amountPaidInput || '0', book.currencyCode);
        amountPaidMinor = Math.min(totalSaleAmountMinor, Math.max(0, rawPaid));
      }

      const outstandingBalanceMinor = Math.max(0, totalSaleAmountMinor - amountPaidMinor);

      // Re-verify resolved status based on exact amounts
      let resolvedStatus: PaymentStatus = data.paymentStatus;
      if (outstandingBalanceMinor === 0) {
        resolvedStatus = 'paid';
      } else if (amountPaidMinor === 0) {
        resolvedStatus = 'credit';
      } else {
        resolvedStatus = 'partial';
      }

      // Deduct stock immediately with threshold check
      const { item, unitCostMinor, cogsMinor } = await inventoryRepo.deductStockForSale(
        data.itemId,
        data.quantitySold,
        lowStockThreshold
      );

      // Initial repayment if any amount was paid today
      const repayments: DebtRepayment[] = [];
      if (amountPaidMinor > 0) {
        repayments.push({
          id: crypto.randomUUID(),
          amountMinor: amountPaidMinor,
          paymentMethod: data.paymentMethod || 'cash',
          repaymentDate: data.transactionDate,
          note: 'Initial payment upon sale',
          createdAt: new Date().toISOString(),
        });
      }

      const now = new Date().toISOString();
      const savedTxn: Transaction = {
        id: crypto.randomUUID(),
        bookId: book.id,
        type: 'income',
        amountMinor: totalSaleAmountMinor,
        transactionDate: data.transactionDate,
        category: 'Retail Sale',
        note: data.note || `Sold ${data.quantitySold}x ${item.name}`,
        itemId: item.id,
        itemName: item.name,
        quantitySold: data.quantitySold,
        unitPriceMinor: sellingPriceMinor,
        unitCostMinor: unitCostMinor,
        cogsMinor: cogsMinor,
        customerName: data.customerName?.trim() || undefined,
        paymentStatus: resolvedStatus,
        paymentMethod: data.paymentMethod || 'cash',
        amountPaidMinor,
        outstandingBalanceMinor,
        repayments,
        createdAt: now,
        updatedAt: now,
      };

      await txnRepo.create(savedTxn);
      await reloadData(book, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(book, [savedTxn]).catch((e) => console.warn('Cloud sync error on sale:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale');
      throw err;
    }
  };

  const recordDebtRepayment = async (data: {
    transactionId: string;
    amountInput: string;
    paymentMethod: PaymentMethod;
    repaymentDate: string;
    note?: string;
  }) => {
    if (!book) return;
    try {
      const txn = allTransactions.find((t) => t.id === data.transactionId) || (await txnRepo.getById(data.transactionId));
      if (!txn) {
        throw new Error('Transaction not found');
      }

      const repayMinor = parseAmountToMinor(data.amountInput, book.currencyCode);
      if (repayMinor <= 0) {
        throw new Error('Repayment amount must be greater than zero');
      }

      const currentOutstanding = txn.outstandingBalanceMinor ?? Math.max(0, txn.amountMinor - (txn.amountPaidMinor ?? 0));
      if (currentOutstanding <= 0) {
        throw new Error('This debt is already paid in full');
      }

      const actualRepay = Math.min(repayMinor, currentOutstanding);
      const newAmountPaidMinor = (txn.amountPaidMinor ?? 0) + actualRepay;
      const newOutstandingBalanceMinor = Math.max(0, currentOutstanding - actualRepay);
      const newStatus: PaymentStatus = newOutstandingBalanceMinor <= 0 ? 'paid' : 'partial';

      const repaymentEntry: DebtRepayment = {
        id: crypto.randomUUID(),
        amountMinor: actualRepay,
        paymentMethod: data.paymentMethod,
        repaymentDate: data.repaymentDate,
        note: data.note,
        createdAt: new Date().toISOString(),
      };

      const updatedRepayments: DebtRepayment[] = [...(txn.repayments || []), repaymentEntry];

      const updatedTxn: Transaction = {
        ...txn,
        amountPaidMinor: newAmountPaidMinor,
        outstandingBalanceMinor: newOutstandingBalanceMinor,
        paymentStatus: newStatus,
        repayments: updatedRepayments,
        updatedAt: new Date().toISOString(),
      };

      await txnRepo.update(updatedTxn);
      await reloadData(book, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.pushToCloud(book, [updatedTxn]).catch((e) => console.warn('Cloud sync error on repayment:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record repayment');
      throw err;
    }
  };

  const recordOperatingExpense = async (data: {
    amountInput: string;
    transactionDate: string;
    category: string;
    note?: string;
  }) => {
    await addTransaction({
      type: 'expense',
      amountInput: data.amountInput,
      transactionDate: data.transactionDate,
      category: data.category,
      note: data.note,
    });
  };

  const deleteInventoryItem = async (id: string) => {
    if (!book) return;
    try {
      await inventoryRepo.deleteItem(id);
      await reloadData(book, selectedMonth);

      if (isSupabaseConfigured) {
        supabaseSyncService.deleteRemoteInventoryItem(id).catch((e) => console.warn('Cloud sync error on delete item:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inventory item');
      throw err;
    }
  };

  const nextMonth = () => setSelectedMonth((prev) => offsetMonth(prev, 1));
  const prevMonth = () => setSelectedMonth((prev) => offsetMonth(prev, -1));
  const resetToCurrentMonth = () => setSelectedMonth(getCurrentMonthString());

  const downloadBackup = async () => {
    const { filename, content } = await exportBackup(bookRepo, txnRepo, backupAdapter);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inspectBackup = (content: string) => {
    return validateBackup(backupAdapter, content);
  };

  const applyRestore = async (content: string) => {
    setIsLoading(true);
    try {
      const result = await restoreBackup(bookRepo, txnRepo, backupAdapter, content);
      setBook(result.book);
      const allBks = await bookRepo.getAllBooks();
      setBooks(allBks);
      await reloadData(result.book, selectedMonth);

      if (isSupabaseConfigured) {
        triggerCloudSync().catch((e) => console.warn('Cloud sync error on restore:', e));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSV = async () => {
    const { filename, content } = await exportCSV(bookRepo, txnRepo, backupAdapter);
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async () => {
    const { filename, content } = await exportExcel(bookRepo, txnRepo, inventoryItems, selectedMonth);
    const blob = new Blob([content], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    const { filename, content } = await exportPDF(bookRepo, txnRepo, inventoryItems, selectedMonth);
    const blob = new Blob([content], {
      type: 'application/pdf',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <BookContext.Provider
      value={{
        book,
        books,
        switchBook,
        createBusiness,
        deleteBusiness,
        renameBook,
        updateCurrency,
        updateCategory,
        selectedMonth,
        summary,
        monthTransactions,
        allTransactions,
        isLoading,
        error,
        isStoragePersisted,
        isRentalBusiness,
        rentalSummary,
        rentalReminders,
        addRentalPayment,
        addPropertyExpense,
        isRetailBusiness,
        lowStockThreshold,
        updateLowStockThreshold,
        inventoryItems,
        inventoryAlerts,
        debtorAlerts,
        debtorList,
        allDebtorList,
        retailTodaySummary,
        retailPeriodStatement,
        itemProfitabilityList,
        bestSellersList,
        addInventoryItem,
        replenishStock,
        recordRetailSale,
        recordDebtRepayment,
        recordOperatingExpense,
        deleteInventoryItem,
        cloudSyncStatus,
        lastSyncTime,
        isCloudConfigured: isSupabaseConfigured,
        triggerCloudSync,
        setSelectedMonth,
        nextMonth,
        prevMonth,
        resetToCurrentMonth,
        addTransaction,
        editTransaction,
        removeTransaction,
        downloadBackup,
        inspectBackup,
        applyRestore,
        downloadCSV,
        downloadExcel,
        downloadPDF,
        resetBusinessData,
        restartOnboarding,
        clearError: () => setError(null),
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export const useBook = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};
