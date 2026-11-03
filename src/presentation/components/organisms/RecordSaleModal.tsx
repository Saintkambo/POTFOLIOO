import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, ShoppingBag, AlertTriangle, CreditCard, Banknote, Smartphone, User } from 'lucide-react';
import { InventoryItem } from '../../../domain/models/inventory';
import { PaymentStatus, PaymentMethod } from '../../../domain/models/transaction';
import { formatMoney } from '../../../domain/money';

function getLocalTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyCode: string;
  inventoryItems: InventoryItem[];
  preselectedItemId?: string;
  onRecordSale: (data: {
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
  onOpenAddStock?: () => void;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  currencyCode,
  inventoryItems,
  preselectedItemId,
  onRecordSale,
  onOpenAddStock,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantitySold, setQuantitySold] = useState<string>('1');
  const [sellingPriceInput, setSellingPriceInput] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(getLocalTodayDateString());
  const [customerName, setCustomerName] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedItemId && inventoryItems.some((i) => i.id === preselectedItemId)) {
        setSelectedItemId(preselectedItemId);
      } else if (inventoryItems.length > 0) {
        const inStockItem = inventoryItems.find((i) => i.currentQuantity > 0) || inventoryItems[0];
        setSelectedItemId(inStockItem.id);
      } else {
        setSelectedItemId('');
      }
      setQuantitySold('1');
      setSellingPriceInput('');
      setTransactionDate(getLocalTodayDateString());
      setCustomerName('');
      setPaymentStatus('paid');
      setPaymentMethod('cash');
      setAmountPaidInput('');
      setNote('');
      setError(null);
    }
  }, [isOpen, preselectedItemId, inventoryItems]);

  if (!isOpen) return null;

  const currentItem = inventoryItems.find((i) => i.id === selectedItemId);
  const numQuantity = parseInt(quantitySold, 10) || 0;
  const numPrice = parseFloat(sellingPriceInput.replace(/,/g, '')) || 0;
  const totalRevenueMinor = Math.round(numPrice * 100) * numQuantity;

  // Live amount paid & outstanding calculation
  let computedPaidMinor = totalRevenueMinor;
  if (paymentStatus === 'credit') {
    computedPaidMinor = 0;
  } else if (paymentStatus === 'partial') {
    const rawPartial = parseFloat(amountPaidInput.replace(/,/g, '')) || 0;
    computedPaidMinor = Math.min(totalRevenueMinor, Math.max(0, Math.round(rawPartial * 100)));
  }
  const outstandingBalanceMinor = Math.max(0, totalRevenueMinor - computedPaidMinor);

  const isStockInsufficient = currentItem ? numQuantity > currentItem.currentQuantity : false;
  const isOutOfStock = currentItem ? currentItem.currentQuantity <= 0 : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setError('Please select an inventory item');
      return;
    }
    if (numQuantity <= 0) {
      setError('Quantity sold must be greater than zero');
      return;
    }
    if (numQuantity > currentItem.currentQuantity) {
      setError(`Cannot sell ${numQuantity} units. Only ${currentItem.currentQuantity} units available.`);
      return;
    }
    if (numPrice <= 0) {
      setError('Please enter a valid selling price per unit');
      return;
    }

    if ((paymentStatus === 'partial' || paymentStatus === 'credit') && !customerName.trim()) {
      setError('Customer name is required for partial payments or sales on credit');
      return;
    }

    if (paymentStatus === 'partial') {
      const rawPartial = parseFloat(amountPaidInput.replace(/,/g, '')) || 0;
      if (rawPartial <= 0) {
        setError('Please enter the initial amount paid for a partial payment');
        return;
      }
      if (rawPartial >= (totalRevenueMinor / 100)) {
        setError('Partial payment cannot equal or exceed total sale amount. Select "Paid in full" instead.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onRecordSale({
        itemId: currentItem.id,
        quantitySold: numQuantity,
        sellingPriceInput,
        transactionDate,
        customerName: customerName.trim() || undefined,
        paymentStatus,
        paymentMethod: paymentStatus === 'credit' ? 'cash' : paymentMethod,
        amountPaidInput: paymentStatus === 'partial' ? amountPaidInput : undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-blackstone/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <Card
        shadowSize="lg"
        className="w-full max-w-lg h-[90dvh] sm:h-auto max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-b-none sm:rounded-card border-x-0 sm:border-x-2 border-b-0 sm:border-b-2 border-t-2 border-blackstone bg-surface overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-blackstone bg-canvas shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-citron-lime border border-blackstone flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blackstone stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black font-heading text-blackstone leading-none">
                Record Retail Sale
              </h2>
              <p className="text-[11px] font-bold text-text-secondary mt-0.5">
                Deducts stock immediately and tracks cash or customer debt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-control border border-blackstone bg-surface hover:bg-canvas flex items-center justify-center text-blackstone neo-press cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body & Sticky Action Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 overflow-y-auto space-y-4 flex-1 overscroll-contain">
            {error && (
              <div className="p-3 rounded-control bg-vivid-amber-tint border-2 border-vivid-amber-dark text-blackstone text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-vivid-amber-dark shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {inventoryItems.length === 0 ? (
              <div className="p-6 text-center space-y-3 bg-canvas rounded-card border-2 border-dashed border-blackstone/30">
                <p className="text-xs font-bold text-text-secondary">
                  No inventory items found. Add items to your inventory first before recording sales.
                </p>
                {onOpenAddStock && (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="bg-citron-lime text-blackstone border-2 border-blackstone font-black"
                    onClick={() => {
                      onClose();
                      onOpenAddStock();
                    }}
                  >
                    Add Inventory Item
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Select Item */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                    Select Item to Sell *
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full h-11 px-3 text-sm font-bold border-2 border-blackstone rounded-control bg-surface focus:outline-hidden focus:border-electric-sky focus:ring-1 focus:ring-electric-sky"
                    required
                  >
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — {item.currentQuantity} in stock ({item.status === 'empty' ? 'EMPTY' : item.status === 'low_stock' ? 'LOW' : 'IN STOCK'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Item Stock Status Badge */}
                {currentItem && (
                  <div
                    className={`p-2.5 rounded-control border flex items-center justify-between text-xs font-bold ${
                      isOutOfStock
                        ? 'bg-rose-100 border-rose-400 text-rose-800'
                        : currentItem.status === 'low_stock'
                        ? 'bg-amber-100 border-amber-400 text-amber-900'
                        : 'bg-citron-lime-tint border-citron-lime-dark text-blackstone'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] uppercase tracking-wider font-black">
                        Available Stock:
                      </span>
                      <span className="font-mono font-black text-sm">
                        {currentItem.currentQuantity} units
                      </span>
                    </div>
                    <div className="text-[11px] text-text-secondary">
                      Cost/unit: {formatMoney(currentItem.avgPurchasePriceMinor, currencyCode)}
                    </div>
                  </div>
                )}

                {/* Quantity Sold & Unit Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                      Quantity Sold *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max={currentItem ? currentItem.currentQuantity : undefined}
                      value={quantitySold}
                      onChange={(e) => setQuantitySold(e.target.value)}
                      placeholder="1"
                      required
                    />
                    {isStockInsufficient && (
                      <span className="text-[10px] font-bold text-rose-600 block mt-1">
                        Exceeds available stock ({currentItem?.currentQuantity})
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                      Selling Price / Unit *
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={sellingPriceInput}
                      onChange={(e) => setSellingPriceInput(e.target.value)}
                      placeholder="e.g. 5,000"
                      required
                    />
                    <span className="text-[10px] font-bold text-text-secondary block mt-1">
                      Currency: {currencyCode}
                    </span>
                  </div>
                </div>

                {/* Payment Status Segmented Selection */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1.5 font-heading">
                    Payment Status *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('paid')}
                      className={`py-2 px-2 text-xs font-black border-2 border-blackstone rounded-control text-center neo-press transition-colors ${
                        paymentStatus === 'paid'
                          ? 'bg-citron-lime text-blackstone shadow-brutal'
                          : 'bg-surface text-blackstone hover:bg-canvas'
                      }`}
                    >
                      Paid in full
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('partial')}
                      className={`py-2 px-2 text-xs font-black border-2 border-blackstone rounded-control text-center neo-press transition-colors ${
                        paymentStatus === 'partial'
                          ? 'bg-vivid-amber text-blackstone shadow-brutal'
                          : 'bg-surface text-blackstone hover:bg-canvas'
                      }`}
                    >
                      Partially paid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStatus('credit')}
                      className={`py-2 px-2 text-xs font-black border-2 border-blackstone rounded-control text-center neo-press transition-colors ${
                        paymentStatus === 'credit'
                          ? 'bg-rose-300 text-blackstone shadow-brutal'
                          : 'bg-surface text-blackstone hover:bg-canvas'
                      }`}
                    >
                      On credit
                    </button>
                  </div>
                </div>

                {/* Payment Method (if not 100% on credit) */}
                {paymentStatus !== 'credit' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1.5 font-heading">
                      Payment Method *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`py-1.5 px-2 text-xs font-bold border-2 border-blackstone rounded-control flex items-center justify-center gap-1.5 neo-press ${
                          paymentMethod === 'cash'
                            ? 'bg-electric-sky text-blackstone font-black'
                            : 'bg-surface text-blackstone hover:bg-canvas'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Cash</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('bank')}
                        className={`py-1.5 px-2 text-xs font-bold border-2 border-blackstone rounded-control flex items-center justify-center gap-1.5 neo-press ${
                          paymentMethod === 'bank'
                            ? 'bg-electric-sky text-blackstone font-black'
                            : 'bg-surface text-blackstone hover:bg-canvas'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bank</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mobile')}
                        className={`py-1.5 px-2 text-xs font-bold border-2 border-blackstone rounded-control flex items-center justify-center gap-1.5 neo-press ${
                          paymentMethod === 'mobile'
                            ? 'bg-electric-sky text-blackstone font-black'
                            : 'bg-surface text-blackstone hover:bg-canvas'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Mobile</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Partial Amount Paid Input */}
                {paymentStatus === 'partial' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                      Initial Amount Paid *
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      placeholder="e.g. 2,000"
                      required
                    />
                    <span className="text-[10px] font-bold text-text-secondary block mt-1">
                      Balance of {formatMoney(outstandingBalanceMinor, currencyCode)} will be recorded under Debtors
                    </span>
                  </div>
                )}

                {/* Customer Name (Required for Partial or Credit sales) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading flex items-center gap-1">
                    <User className="w-3 h-3 text-blackstone" />
                    <span>Customer Name {paymentStatus !== 'paid' ? '*' : '(Optional)'}</span>
                  </label>
                  <Input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={paymentStatus !== 'paid' ? "Required for debtor tracking (e.g. John Doe)" : "e.g. Walk-in customer"}
                    required={paymentStatus !== 'paid'}
                  />
                </div>

                {/* Sale & Debt Calculation Box */}
                <div className="p-3 rounded-control bg-canvas border-2 border-blackstone space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                    <span>Total Sale:</span>
                    <span className="font-mono">{numQuantity} × {formatMoney(Math.round(numPrice * 100), currencyCode)} = {formatMoney(totalRevenueMinor, currencyCode)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                    <span>Amount Paid Now:</span>
                    <span className="font-mono text-emerald-700 font-black">{formatMoney(computedPaidMinor, currencyCode)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-blackstone/20 pt-1">
                    <span className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                      Outstanding Debt:
                    </span>
                    <span className={`text-sm font-black font-heading tabular-nums ${outstandingBalanceMinor > 0 ? 'text-rose-600' : 'text-blackstone'}`}>
                      {formatMoney(outstandingBalanceMinor, currencyCode)}
                    </span>
                  </div>
                </div>

                {/* Date & Additional Note */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                      Date of Sale *
                    </label>
                    <Input
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                      Note (Optional)
                    </label>
                    <Input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="e.g. Invoice #1024"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sticky Action Buttons Footer (Always visible, never blocked by taskbar or scrolling) */}
          {inventoryItems.length > 0 && (
            <div className="p-3 border-t-2 border-blackstone/10 bg-canvas/95 backdrop-blur-xs flex items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting || isStockInsufficient || isOutOfStock || numQuantity <= 0}
                className="bg-citron-lime text-blackstone border-2 border-blackstone font-black shadow-brutal neo-press"
              >
                {isSubmitting ? 'Recording...' : 'Record Sale'}
              </Button>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
