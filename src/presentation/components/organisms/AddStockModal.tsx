import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, PackagePlus, PlusCircle, RefreshCw, AlertTriangle, Calculator } from 'lucide-react';
import { InventoryItem, calculateWeightedAverageCost } from '../../../domain/models/inventory';
import { formatMoney } from '../../../domain/money';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyCode: string;
  inventoryItems: InventoryItem[];
  preselectedItemId?: string;
  onAddNewItem: (data: {
    name: string;
    initialQuantity: number;
    purchasePriceInput: string;
  }) => Promise<any>;
  onReplenishStock: (data: {
    itemId: string;
    quantityAdded: number;
    purchasePriceInput: string;
  }) => Promise<any>;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  currencyCode,
  inventoryItems,
  preselectedItemId,
  onAddNewItem,
  onReplenishStock,
}) => {
  const [tab, setTab] = useState<'new' | 'restock'>('new');

  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [initialPriceInput, setInitialPriceInput] = useState('');

  // Restock State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [addedQuantity, setAddedQuantity] = useState('');
  const [addedPriceInput, setAddedPriceInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedItemId && inventoryItems.some((i) => i.id === preselectedItemId)) {
        setTab('restock');
        setSelectedItemId(preselectedItemId);
      } else if (inventoryItems.length === 0) {
        setTab('new');
        setSelectedItemId('');
      } else {
        setSelectedItemId(inventoryItems[0].id);
      }
      setNewItemName('');
      setInitialQuantity('');
      setInitialPriceInput('');
      setAddedQuantity('');
      setAddedPriceInput('');
      setError(null);
    }
  }, [isOpen, preselectedItemId, inventoryItems]);

  if (!isOpen) return null;

  // Selected item for restock
  const currentItem = inventoryItems.find((i) => i.id === selectedItemId);

  // Live calculation of restocked weighted average cost
  const parsedAddedQty = parseInt(addedQuantity, 10) || 0;
  const parsedAddedPrice = parseFloat(addedPriceInput.replace(/,/g, '')) || 0;
  const addedPriceMinor = Math.round(parsedAddedPrice * 100);

  const previewNewAvgCostMinor = currentItem && parsedAddedQty > 0
    ? calculateWeightedAverageCost(
        currentItem.currentQuantity,
        currentItem.avgPurchasePriceMinor,
        parsedAddedQty,
        addedPriceMinor
      )
    : (currentItem ? currentItem.avgPurchasePriceMinor : 0);

  const handleNewItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      setError('Item name is required');
      return;
    }
    const qty = parseInt(initialQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      setError('Initial quantity must be 0 or more');
      return;
    }
    const price = parseFloat(initialPriceInput.replace(/,/g, ''));
    if (isNaN(price) || price < 0) {
      setError('Purchase price cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onAddNewItem({
        name: newItemName.trim(),
        initialQuantity: qty,
        purchasePriceInput: initialPriceInput,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) {
      setError('Please select an item to replenish');
      return;
    }
    if (parsedAddedQty <= 0) {
      setError('Quantity added must be greater than zero');
      return;
    }
    if (parsedAddedPrice < 0) {
      setError('Purchase price cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onReplenishStock({
        itemId: currentItem.id,
        quantityAdded: parsedAddedQty,
        purchasePriceInput: addedPriceInput,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to replenish stock');
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
        <div className="flex items-center justify-between p-4 border-b-2 border-blackstone bg-canvas">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-electric-sky border border-blackstone flex items-center justify-center">
              <PackagePlus className="w-4 h-4 text-blackstone stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black font-heading text-blackstone leading-none">
                Inventory Stock Management
              </h2>
              <p className="text-[11px] font-bold text-text-secondary mt-0.5">
                Add new items or replenish stock with weighted average costing
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

        {/* Tab Switcher */}
        <div className="flex border-b-2 border-blackstone bg-canvas p-1 gap-1">
          <button
            type="button"
            onClick={() => { setTab('new'); setError(null); }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-control border-2 flex items-center justify-center gap-1.5 transition-all ${
              tab === 'new'
                ? 'bg-citron-lime text-blackstone border-blackstone shadow-brutal-sm'
                : 'bg-surface text-blackstone/60 border-transparent hover:text-blackstone'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Item</span>
          </button>

          <button
            type="button"
            onClick={() => { setTab('restock'); setError(null); }}
            disabled={inventoryItems.length === 0}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-control border-2 flex items-center justify-center gap-1.5 transition-all ${
              tab === 'restock'
                ? 'bg-electric-sky text-blackstone border-blackstone shadow-brutal-sm'
                : 'bg-surface text-blackstone/60 border-transparent hover:text-blackstone disabled:opacity-40'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restock Existing</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-control bg-vivid-amber-tint border-2 border-vivid-amber-dark text-blackstone text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-vivid-amber-dark shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'new' ? (
            /* TAB 1: NEW ITEM FORM */
            <form onSubmit={handleNewItemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                  Item Name *
                </label>
                <Input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Sugar 1kg, Cooking Oil 5L"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                    Initial Quantity *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    required
                  />
                  <span className="text-[10px] font-bold text-text-secondary block mt-1">
                    Units on hand
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                    Purchase Price / Unit *
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={initialPriceInput}
                    onChange={(e) => setInitialPriceInput(e.target.value)}
                    placeholder="e.g. 2,800"
                    required
                  />
                  <span className="text-[10px] font-bold text-text-secondary block mt-1">
                    Currency: {currencyCode}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-control bg-citron-lime-tint border border-citron-lime text-blackstone text-xs font-bold space-y-1">
                <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[11px]">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Cost Accounting Invariant</span>
                </div>
                <p className="text-[11px] font-normal leading-relaxed text-blackstone/90">
                  Inventory purchases are capitalized into stock value. They do not appear as operating expenses on the income statement until the items are sold (as COGS).
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-blackstone/10">
                <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="bg-citron-lime text-blackstone border-2 border-blackstone font-black shadow-brutal neo-press"
                >
                  {isSubmitting ? 'Creating...' : 'Create Item'}
                </Button>
              </div>
            </form>
          ) : (
            /* TAB 2: RESTOCK EXISTING ITEM FORM */
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                  Select Item to Restock *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full h-11 px-3 text-sm font-bold border-2 border-blackstone rounded-control bg-surface focus:outline-hidden focus:border-electric-sky focus:ring-1 focus:ring-electric-sky"
                  required
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.currentQuantity} units @ {formatMoney(item.avgPurchasePriceMinor, currencyCode)})
                    </option>
                  ))}
                </select>
              </div>

              {currentItem && (
                <div className="p-3 rounded-control bg-canvas border border-blackstone grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Current Stock
                    </span>
                    <span className="text-sm font-black text-blackstone">
                      {currentItem.currentQuantity} units
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-text-secondary block">
                      Current Avg Cost
                    </span>
                    <span className="text-sm font-black text-blackstone">
                      {formatMoney(currentItem.avgPurchasePriceMinor, currencyCode)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                    Quantity Added *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={addedQuantity}
                    onChange={(e) => setAddedQuantity(e.target.value)}
                    placeholder="e.g. 20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                    New Purchase Price / Unit *
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={addedPriceInput}
                    onChange={(e) => setAddedPriceInput(e.target.value)}
                    placeholder="e.g. 3,000"
                    required
                  />
                </div>
              </div>

              {/* Weighted Average Live Preview */}
              {currentItem && parsedAddedQty > 0 && (
                <div className="p-3 rounded-control bg-electric-sky-tint border-2 border-blackstone space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-blackstone">
                    <span>New Total Quantity:</span>
                    <span className="font-mono font-black">{currentItem.currentQuantity + parsedAddedQty} units</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-blackstone border-t border-blackstone/10 pt-1">
                    <span>Recalculated Weighted Avg Cost:</span>
                    <span className="font-heading font-black text-sm text-blackstone tabular-nums">
                      {formatMoney(previewNewAvgCostMinor, currencyCode)} / unit
                    </span>
                  </div>
                  <p className="text-[10px] font-normal text-text-secondary">
                    Weighted average automatically balances previous stock cost with the incoming delivery cost.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-blackstone/10">
                <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting || parsedAddedQty <= 0}
                  className="bg-electric-sky text-blackstone border-2 border-blackstone font-black shadow-brutal neo-press"
                >
                  {isSubmitting ? 'Updating...' : 'Update Stock'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};
