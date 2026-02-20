/**
 * @fileoverview Handles the side effects of a temperature alert, such as
 * sending dashboard notifications, making Twilio calls, and generating PDF reports.
 */
import { Twilio } from 'twilio';
import { generateStabilityReportPDF } from './PDFGenerator';
import { config } from './config';

export interface TemperatureLog {
  deviceId: string;
  temperature: number;
  timestamp: Date;
}

export class AlertService {
  private twilioClient: Twilio | null = null;
  private broadcastAlert: (alert: object) => void;

  constructor(broadcastAlert: (alert: object) => void) {
    this.broadcastAlert = broadcastAlert;
    
    if (config.twilio.accountSid !== 'YOUR_TWILIO_ACCOUNT_SID' && config.twilio.authToken !== 'YOUR_TWILIO_AUTH_TOKEN') {
      this.twilioClient = new Twilio(config.twilio.accountSid, config.twilio.authToken);
    } else {
      console.warn('Twilio credentials not configured. Voice calls will be skipped.');
    }
  }

  /**
   * Orchestrates all alerts for a temperature breach.
   * @param deviceId The device that has the breach.
   * @param breachLogs The logs associated with the breach.
   */
  public triggerAlerts(deviceId: string, breachLogs: TemperatureLog[]): void {
    // 1. Trigger B2B Dashboard Alert
    this.sendDashboardAlert(deviceId, breachLogs);

    // 2. Make Twilio Voice Call
    this.makeTwilioVoiceCall(deviceId);

    // 3. Generate Stability Deviation Report
    generateStabilityReportPDF(deviceId, breachLogs);
  }
  
  /**
    * Sends a 'resolved' message to the dashboard when temperature returns to normal.
    * @param deviceId The device that has returned to normal.
    */
  public triggerResolved(deviceId: string): void {
    this.broadcastAlert({
        type: 'alert_resolved',
        deviceId,
        timestamp: new Date().toISOString(),
        message: `Device ${deviceId} temperature has returned to normal.`,
    });
  }

  private sendDashboardAlert(deviceId: string, breachLogs: TemperatureLog[]): void {
    const maxTemp = Math.max(...breachLogs.map(l => l.temperature));
    this.broadcastAlert({
      type: 'critical_alert',
      deviceId,
      timestamp: new Date().toISOString(),
      message: `CRITICAL: Temperature for ${deviceId} has exceeded ${config.temperatureThreshold}°C for ${config.breachDurationMinutes} minutes.`,
      details: {
        maxTemperature: maxTemp.toFixed(2),
        breachStartTime: breachLogs[0].timestamp.toISOString(),
      }
    });
  }

  private makeTwilioVoiceCall(deviceId: string): void {
    if (!this.twilioClient) {
      console.log('Skipping Twilio call as client is not initialized.');
      return;
    }

    const message = `
      This is a critical alert from DigiFarmacy Monitoring. 
      The temperature for device, ${deviceId.split('-').join(' ')}, has exceeded the safe limit. 
      Please check the system immediately.
      This message will repeat.
      This is a critical alert from DigiFarmacy Monitoring. 
      The temperature for device, ${deviceId.split('-').join(' ')}, has exceeded the safe limit. 
      Please check the system immediately.
    `;

    this.twilioClient.calls.create({
      twiml: `<Response><Say>${message}</Say></Response>`,
      to: config.twilio.pharmacistPhoneNumber,
      from: config.twilio.fromPhoneNumber,
    })
    .then(call => console.log(`Twilio call initiated successfully. SID: ${call.sid}`))
    .catch(error => console.error('Error making Twilio call:', error));
  }
}
