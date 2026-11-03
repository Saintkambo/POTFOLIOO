export interface StorageStatus {
  isPersisted: boolean;
  quotaBytes?: number;
  usageBytes?: number;
  percentUsed?: number;
}

export async function checkStorageStatus(): Promise<StorageStatus> {
  const result: StorageStatus = { isPersisted: false };

  if (navigator.storage && navigator.storage.persisted) {
    try {
      result.isPersisted = await navigator.storage.persisted();
    } catch {
      result.isPersisted = false;
    }
  }

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        result.quotaBytes = estimate.quota;
        result.usageBytes = estimate.usage;
        result.percentUsed = Math.round((estimate.usage / estimate.quota) * 100);
      }
    } catch {
      // Ignore estimation errors
    }
  }

  return result;
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}
