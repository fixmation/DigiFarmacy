/**
 * @fileoverview Cron job service to automate the handling of expiring medicine batches.
 * This service runs once every 24 hours.
 */
import { storage } from './storage'; // Assuming storage handles DB interactions
import * as cron from 'node-cron';

// --- Type Definitions ---
interface MedicineBatch {
  id: string;
  gtin: string;
  batchId: string;
  medicineName: string;
  expiryDate: Date;
  stockCount: number;
  costPrice: number; // The price the pharmacy paid
  sellingPrice: number;
  isPromotional: boolean;
  location: string; // e.g., 'Shelf A-3'
}

// --- Mock/Placeholder Functions for External APIs ---

/**
 * Simulates pushing a notification to the 'Nearby Pharmacy' map API.
 * In a real application, this would be an API call to update map data.
 */
const pushToMapApi = async (notification: object) => {
  console.log('Pushing notification to Map API:', notification);
  // Example: await fetch('https://api.digifarmacy.lk/map/notifications', { ... });
  return { success: true };
};

/**
 * Simulates sending a task to a pharmacist via a WhatsApp API.
 * This requires a WhatsApp Business API provider like Twilio.
 */
const sendWhatsAppTask = async (pharmacistId: string, task: string) => {
  console.log(`Sending WhatsApp task to Pharmacist ${pharmacistId}: "${task}"`);
  // Example: await twilioClient.messages.create({ ... });
  return { success: true, messageId: `wha_${Date.now()}` };
};

// --- Core Logic ---

/**
 * Calculates a 'Flash Sale' price for an expiring item.
 * The discount is capped at 15% to protect the NMRA-mandated 20% profit margin.
 * @param sellingPrice The original selling price.
 * @returns The new promotional price.
 */
const calculateFlashSalePrice = (sellingPrice: number): number => {
  const maxDiscount = 0.15; // 15%
  const discountAmount = sellingPrice * maxDiscount;
  const newPrice = sellingPrice - discountAmount;
  // Return price rounded to the nearest whole number
  return Math.round(newPrice);
};


/**
 * A cron job function to handle stock rotation for items expiring soon (61-90 days).
 */
export const checkRotationAutomation = async () => {
  console.log(`[${new Date().toISOString()}] Running Stock Rotation Cron Job (FEFO)...`);

  try {
    // 1. Query for batches expiring between 61 and 90 days from now.
    const rotationNeededBatches = await storage.getRotationNeededBatches(60, 90);

    if (rotationNeededBatches.length === 0) {
      console.log('No batches needing rotation found. Job finished.');
      return;
    }

    console.log(`Found ${rotationNeededBatches.length} batches needing rotation. Processing...`);

    for (const batch of rotationNeededBatches) {
      // 2. Send a WhatsApp task to the pharmacist to rotate the stock (First-Expiry-First-Out).
      const pharmacistId = 'PHARMACIST_001'; // This would be dynamic in a real app
      await sendWhatsAppTask(
        pharmacistId,
        `Task: Rotate stock (FEFO). Medicine is nearing expiry. Details: ${batch.medicineName}, Batch ID: ${batch.batchId}, Expiry: ${batch.expiryDate.toISOString().split('T')[0]}, Location: ${batch.location}.`
      );
    }

    console.log('Stock Rotation Cron Job finished successfully.');

  } catch (error) {
    console.error('Error during Stock Rotation Cron Job:', error);
  }
};


/**
 * The main cron job function. It finds expiring batches and processes them for flash sale (< 60 days).
 */
export const checkExpiryAutomation = async () => {
  console.log(`[${new Date().toISOString()}] Running Flash Sale Automation Cron Job...`);

  try {
    // This is a simulated call; you would replace it with your actual Drizzle query
    const expiringBatches = await storage.getExpiringBatches(60);
    
    if (expiringBatches.length === 0) {
      console.log('No expiring batches found. Job finished.');
      return;
    }

    console.log(`Found ${expiringBatches.length} expiring batches for flash sale. Processing...`);

    for (const batch of expiringBatches) {
      // 2. Update the isPromotional flag and calculate the new price
      const flashSalePrice = calculateFlashSalePrice(batch.sellingPrice);
      
      // This is a simulated update call
      await storage.updateBatchForPromotion(batch.id, {
        isPromotional: true,
        sellingPrice: flashSalePrice,
      });

      console.log(`Batch ${batch.batchId} for ${batch.medicineName} is now promotional at price ${flashSalePrice}.`);

      // 3. Push a notification to the 'Nearby Pharmacy' map API
      await pushToMapApi({
        type: 'LIMITED_STOCK_DEAL',
        gtin: batch.gtin,
        pharmacyId: 'YOUR_PHARMACY_ID', // This would come from config or the batch data
        deal: {
          originalPrice: batch.sellingPrice,
          salePrice: flashSalePrice,
          expiry: batch.expiryDate.toISOString().split('T')[0],
        },
      });

      // 4. Send a WhatsApp task to the pharmacist
      // Assuming you can get a pharmacist ID associated with the pharmacy/location
      const pharmacistId = 'PHARMACIST_001'; 
      await sendWhatsAppTask(
        pharmacistId,
        `Task: Move medicine batch to front shelf for flash sale. Details: ${batch.medicineName}, Batch ID: ${batch.batchId}, Location: ${batch.location}.`
      );
    }
    
    console.log('Flash Sale Automation Cron Job finished successfully.');

  } catch (error) {
    console.error('Error during Flash Sale Automation Cron Job:', error);
  }
};

/**
 * Schedules all cron jobs for the application.
 */
export const scheduleExpiryAutomation = () => {
  // Schedule 1: Flash sale for items expiring in < 60 days. Runs at 1:00 AM.
  cron.schedule('0 1 * * *', () => checkExpiryAutomation(), {
    scheduled: true,
    timezone: "Asia/Colombo"
  });
  console.log('Scheduled Flash Sale Automation job to run every 24 hours at 1:00 AM (Asia/Colombo).');

  // Schedule 2: Stock rotation warning for items expiring in 61-90 days. Runs at 2:00 AM.
  cron.schedule('0 2 * * *', () => checkRotationAutomation(), {
    scheduled: true,
    timezone: "Asia/Colombo"
  });
  console.log('Scheduled Stock Rotation job to run every 24 hours at 2:00 AM (Asia/Colombo).');
};
