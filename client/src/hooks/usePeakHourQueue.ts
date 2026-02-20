/**
 * @fileoverview React hook to manage an asynchronous dispensing queue for peak hours.
 * This allows for 'Quick Scans' to be processed in a batch after the rush period.
 */

import { useState } from 'react';

/**
 * Represents a single, lightweight scan performed during peak hours.
 * Only captures the essential information needed for later reconciliation.
 */
export interface QuickScan {
  /**
   * The Global Trade Item Number (GTIN) of the scanned product.
   */
  gtin: string;

  /**
   * The batch number of the scanned product.
   */
  batchId: string;

  /**
   * The timestamp of when the scan occurred.
   */
  timestamp: Date;
}

/**
 * Represents a group of scans for a single medicine after reconciliation.
 * It includes a suggested count for the pharmacist to confirm.
 */
export interface ReconciledItem {
  /**
   * The GTIN of the product.
   */
  gtin: string;

  /**
   * The name of the medicine, fetched based on the GTIN.
   */
  medicineName: string;

  /**
   * The number of tablets per strip for this medicine.
   */
  tabletsPerStrip: number;

  /**
   * An array of the individual quick scans for this item.
   */
  scans: QuickScan[];

  /**
   * The system-suggested total number of tablets sold, based on scan count and strip size.
   */
  suggestedTabletsSold: number;

  /**
   * The actual number of tablets sold, which the pharmacist can edit and confirm.
   */
  actualTabletsSold: number;
}

/**
 * Mock function to simulate fetching medicine details from a database via an API.
 * In a real application, this would be an API call to your backend.
 * @param gtin The GTIN of the product to look up.
 * @returns A promise that resolves with the medicine's name and tablets per strip.
 */
const getMedicineDetailsByGtin = async (
  gtin: string
): Promise<{ medicineName: string; tabletsPerStrip: number }> => {
  console.log(`Fetching details for GTIN: ${gtin}`);
  // e.g., const response = await fetch(`/api/drugs/gtin/${gtin}`);
  // For demonstration, we'll return mock data.
  return {
    medicineName: `Medicine GTIN ...${gtin.slice(-4)}`,
    tabletsPerStrip: 10, // Default or fetched from DB
  };
};

/**
 * A React hook to manage a queue of asynchronously dispensed items during peak hours.
 */
export const usePeakHourQueue = () => {
  const [peakHourQueue, setPeakHourQueue] = useState<QuickScan[]>([]);
  const [reconciledQueue, setReconciledQueue] = useState<ReconciledItem[]>([]);
  const [isReconciling, setIsReconciling] = useState(false);

  /**
   * Adds a new item to the peak hour queue in 'Quick Scan' mode.
   * @param scanData The core scan data, typically from a barcode scanner.
   */
  const addToQueue = (scanData: Omit<QuickScan, 'timestamp'>) => {
    const newScan: QuickScan = {
      ...scanData,
      timestamp: new Date(),
    };
    setPeakHourQueue(prev => [...prev, newScan]);
  };

  /**
   * Groups the queued scans by medicine and suggests dispense counts.
   * This function prepares the queue for pharmacist review.
   */
  const reconcileQueue = async () => {
    setIsReconciling(true);

    const groupedByGtin = peakHourQueue.reduce<Record<string, QuickScan[]>>((acc, scan) => {
      acc[scan.gtin] = [...(acc[scan.gtin] || []), scan];
      return acc;
    }, {});

    const processedItems = await Promise.all(
      Object.entries(groupedByGtin).map(async ([gtin, scans]) => {
        const { medicineName, tabletsPerStrip } = await getMedicineDetailsByGtin(gtin);
        const suggestedTabletsSold = scans.length * tabletsPerStrip;

        return {
          gtin,
          medicineName,
          tabletsPerStrip,
          scans,
          suggestedTabletsSold,
          actualTabletsSold: suggestedTabletsSold, // Default actual to suggested
        };
      })
    );

    setReconciledQueue(processedItems.sort((a, b) => a.medicineName.localeCompare(b.medicineName)));
    setIsReconciling(false);
  };

  /**
   * Allows updating the actual count for a reconciled item before final confirmation.
   * @param gtin The GTIN of the item to update.
   * @param newCount The pharmacist-confirmed count.
   */
  const updateActualCount = (gtin: string, newCount: number) => {
    setReconciledQueue(prev =>
      prev.map(item =>
        item.gtin === gtin ? { ...item, actualTabletsSold: newCount } : item
      )
    );
  };

  /**
   * The final step where the confirmed data is sent to the backend to update the main inventory.
   */
  const confirmReconciliation = async () => {
    // In a real application, this function would make an API call to your
    // PostgreSQL/Supabase backend to persist the changes.
    // e.g., await fetch('/api/inventory/reconcile', { 
    //   method: 'POST', 
    //   body: JSON.stringify(reconciledQueue) 
    // });
    console.log('Confirming reconciliation. Data to be sent to backend:', reconciledQueue);

    // After successful confirmation, clear the local queues.
    setPeakHourQueue([]);
    setReconciledQueue([]);

    return { success: true, message: 'Inventory reconciliation has been submitted.' };
  };

  return {
    peakHourQueue,
    reconciledQueue,
    isReconciling,
    addToQueue,
    reconcileQueue,
    updateActualCount,
    confirmReconciliation,
    clearQueue: () => {
      setPeakHourQueue([]);
      setReconciledQueue([]);
    },
  };
};
