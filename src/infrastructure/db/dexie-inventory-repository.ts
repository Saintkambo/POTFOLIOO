import { db } from './database';
import { InventoryItem, computeStockStatus, calculateWeightedAverageCost } from '../../domain/models/inventory';
import { StorageError, ValidationError } from '../../domain/errors';

export class DexieInventoryRepository {
  async getItemsByBook(bookId: string): Promise<InventoryItem[]> {
    try {
      return await db.inventoryItems.where('bookId').equals(bookId).toArray();
    } catch (err) {
      throw new StorageError('Failed to list inventory items', err);
    }
  }

  async getItem(id: string): Promise<InventoryItem | null> {
    try {
      const item = await db.inventoryItems.get(id);
      return item || null;
    } catch (err) {
      throw new StorageError('Failed to get inventory item', err);
    }
  }

  async saveItem(item: InventoryItem): Promise<void> {
    try {
      await db.inventoryItems.put(item);
    } catch (err) {
      throw new StorageError('Failed to save inventory item', err);
    }
  }

  async createItem(data: {
    id?: string;
    bookId: string;
    name: string;
    initialQuantity: number;
    purchasePriceMinor: number;
    lowStockThreshold?: number;
  }): Promise<InventoryItem> {
    if (!data.name.trim()) {
      throw new ValidationError('name', 'Item name cannot be empty');
    }
    if (data.initialQuantity < 0) {
      throw new ValidationError('initialQuantity', 'Initial quantity cannot be negative');
    }
    if (data.purchasePriceMinor < 0) {
      throw new ValidationError('purchasePriceMinor', 'Purchase price cannot be negative');
    }

    const now = new Date().toISOString();
    const item: InventoryItem = {
      id: data.id || crypto.randomUUID(),
      bookId: data.bookId,
      name: data.name.trim(),
      currentQuantity: data.initialQuantity,
      avgPurchasePriceMinor: data.purchasePriceMinor,
      status: computeStockStatus(data.initialQuantity, data.lowStockThreshold ?? 10),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.inventoryItems.put(item);
      return item;
    } catch (err) {
      throw new StorageError('Failed to create inventory item', err);
    }
  }

  /**
   * Replenishes stock for an existing item and recalculates the weighted average purchase cost.
   */
  async replenishStock(
    itemId: string,
    quantityAdded: number,
    purchasePriceMinor: number,
    lowStockThreshold?: number
  ): Promise<InventoryItem> {
    if (quantityAdded <= 0) {
      throw new ValidationError('quantityAdded', 'Quantity added must be greater than zero');
    }
    if (purchasePriceMinor < 0) {
      throw new ValidationError('purchasePriceMinor', 'Purchase price cannot be negative');
    }

    const item = await this.getItem(itemId);
    if (!item) {
      throw new ValidationError('itemId', 'Inventory item not found');
    }

    const newAvgCost = calculateWeightedAverageCost(
      item.currentQuantity,
      item.avgPurchasePriceMinor,
      quantityAdded,
      purchasePriceMinor
    );

    const updatedQuantity = item.currentQuantity + quantityAdded;
    const updatedItem: InventoryItem = {
      ...item,
      currentQuantity: updatedQuantity,
      avgPurchasePriceMinor: newAvgCost,
      status: computeStockStatus(updatedQuantity, lowStockThreshold ?? 10),
      updatedAt: new Date().toISOString(),
    };

    try {
      await db.inventoryItems.put(updatedItem);
      return updatedItem;
    } catch (err) {
      throw new StorageError('Failed to replenish inventory stock', err);
    }
  }

  /**
   * Deducts quantity when a sale is recorded.
   * Strictly prevents requested quantity from exceeding available stock,
   * and prevents inventory from ever becoming negative.
   */
  async deductStockForSale(
    itemId: string,
    quantitySold: number,
    lowStockThreshold?: number
  ): Promise<{ item: InventoryItem; unitCostMinor: number; cogsMinor: number }> {
    if (quantitySold <= 0) {
      throw new ValidationError('quantitySold', 'Quantity sold must be greater than zero');
    }

    const item = await this.getItem(itemId);
    if (!item) {
      throw new ValidationError('itemId', 'Inventory item not found');
    }

    // Prevent sales beyond available stock!
    if (quantitySold > item.currentQuantity) {
      throw new ValidationError(
        'quantitySold',
        `Cannot sell ${quantitySold} units of "${item.name}". Only ${item.currentQuantity} units in stock.`
      );
    }

    const remainingQuantity = item.currentQuantity - quantitySold;
    const unitCostMinor = item.avgPurchasePriceMinor;
    const cogsMinor = Math.round(quantitySold * unitCostMinor);

    const updatedItem: InventoryItem = {
      ...item,
      currentQuantity: remainingQuantity,
      status: computeStockStatus(remainingQuantity, lowStockThreshold ?? 10),
      updatedAt: new Date().toISOString(),
    };

    try {
      await db.inventoryItems.put(updatedItem);
      return { item: updatedItem, unitCostMinor, cogsMinor };
    } catch (err) {
      throw new StorageError('Failed to update stock after sale', err);
    }
  }

  /**
   * Re-evaluates stock statuses for all items of a book when the threshold changes.
   */
  async updateAllStatuses(bookId: string, lowStockThreshold: number): Promise<void> {
    try {
      const items = await this.getItemsByBook(bookId);
      const updated = items.map((i) => ({
        ...i,
        status: computeStockStatus(i.currentQuantity, lowStockThreshold),
        updatedAt: new Date().toISOString(),
      }));
      await db.inventoryItems.bulkPut(updated);
    } catch (err) {
      throw new StorageError('Failed to update stock statuses', err);
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      await db.inventoryItems.delete(id);
    } catch (err) {
      throw new StorageError('Failed to delete inventory item', err);
    }
  }

  async deleteAllByBook(bookId: string): Promise<void> {
    try {
      await db.inventoryItems.where('bookId').equals(bookId).delete();
    } catch (err) {
      throw new StorageError('Failed to delete inventory items for book', err);
    }
  }
}
