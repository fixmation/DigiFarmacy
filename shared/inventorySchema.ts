/**
 * @fileoverview Defines the TypeScript schema for a Pharmacy Inventory SaaS.
 * This includes interfaces for inventory items and transactions, along with utility
 * functions for business logic such as calculating expiry dates.
 */

/**
 * Represents a single item in the pharmacy's inventory.
 */
export interface InventoryItem {
  /**
   * Global Trade Item Number (GTIN) for the product.
   */
  gtin: string;

  /**
   * The specific batch number for this inventory item.
   */
  batchNumber: string;

  /**
   * The expiration date of the item.
   */
  expiryDate: Date;

  /**
   * The total number of individual tablets in this inventory item.
   */
  totalTablets: number;

  /**
   * The number of tablets per strip, to handle partial pack sales.
   * Common in regions like Sri Lanka.
   * @default 10
   */
  tabletsPerStrip?: number;
}

/**
 * Represents a transaction for dispensing medication.
 * This tracks the process from scanning to completion.
 */
export interface Transaction {
  /**
   * A unique identifier for the transaction.
   */
  transactionId: string;

  /**
   * The inventory item being dispensed.
   */
  item: InventoryItem;

  /**
   * The number of tablets dispensed in this transaction.
   */
  dispensedTablets: number;

  /**
   * The status of the transaction.
   * - PENDING_RECONCILIATION: The transaction is logged but not yet finalized.
   * - COMPLETED: The transaction is finalized and inventory is updated.
   */
  status: 'PENDING_RECONCILIATION' | 'COMPLETED';

  /**
   * The timestamp of when the transaction occurred.
   */
  transactionDate: Date;
}

/**
 * Configuration for expiry alerts.
 */
const EXPIRY_ALERT_THRESHOLD_DAYS = 60;

/**
 * Calculates the number of days until an inventory item expires.
 *
 * @param item The inventory item to check.
 * @returns The number of days until expiry. Returns a negative number if expired.
 */
export const calculateDaysToExpiry = (item: InventoryItem): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Normalize to the start of the day
  
  const expiry = new Date(item.expiryDate);
  expiry.setHours(0, 0, 0, 0); // Normalize to the start of the day

  const timeDiff = expiry.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  return daysDiff;
};

/**
 * Checks if an inventory item is nearing its expiry date based on a predefined threshold.
 *
 * @param item The inventory item to check.
 * @returns True if the item is within the expiry alert threshold, false otherwise.
 */
export const hasExpiryAlert = (item: InventoryItem): boolean => {
  const daysToExpiry = calculateDaysToExpiry(item);
  return daysToExpiry <= EXPIRY_ALERT_THRESHOLD_DAYS;
};

/**
 * Creates a new inventory item with default values.
 * 
 * @param gtin GTIN of the product.
 * @param batchNumber The batch number.
 * @param expiryDate The expiry date.
 * @param totalTablets The total number of tablets.
 * @param tabletsPerStrip The number of tablets per strip (defaults to 10).
 * @returns A new InventoryItem object.
 */
export const createInventoryItem = (
  gtin: string,
  batchNumber: string,
  expiryDate: Date,
  totalTablets: number,
  tabletsPerStrip: number = 10
): InventoryItem => ({
  gtin,
  batchNumber,
  expiryDate,
  totalTablets,
  tabletsPerStrip,
});
