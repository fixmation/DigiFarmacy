/**
 * @fileoverview Configuration for the Temperature Monitoring Service.
 * It is best practice to use environment variables for sensitive data.
 */
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.TEMP_MONITOR_PORT || 5002,
  
  // -- Breach conditions --
  // Temperature threshold in Celsius
  temperatureThreshold: 8.0, 
  // Duration of breach in minutes before an alert is triggered
  breachDurationMinutes: 15,

  // -- Twilio Configuration --
  // It's highly recommended to use environment variables for these
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'YOUR_TWILIO_ACCOUNT_SID',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'YOUR_TWILIO_AUTH_TOKEN',
    fromPhoneNumber: process.env.TWILIO_FROM_PHONE_NUMBER || 'YOUR_TWILIO_PHONE_NUMBER',
    // The number to call when an alert is triggered
    pharmacistPhoneNumber: process.env.PHARMACIST_PHONE_NUMBER || 'PHARMACIST_PHONE_NUMBER_TO_CALL'
  },
  
  // -- Pharmacy Details for PDF Report --
  pharmacyDetails: {
    name: 'DigiFarmacy Central Pharmacy',
    address: '123 Health Lane, Colombo, Sri Lanka',
    contact: 'gsp@digifarmacy.lk'
  }
};
