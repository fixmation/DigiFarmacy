/**
 * @fileoverview Manages the state of temperature readings for multiple IoT devices
 * and detects when a temperature breach occurs.
 */
import { config } from './config.js';
import { AlertService, TemperatureLog } from './AlertService.js';

interface DeviceState {
  logs: TemperatureLog[];
  alertState: 'NORMAL' | 'BREACHED' | 'ALERTED';
}

export class TemperatureMonitor {
  private deviceStates: Map<string, DeviceState>;
  private alertService: AlertService;

  constructor(alertService: AlertService) {
    this.deviceStates = new Map();
    this.alertService = alertService;
  }

  /**
   * Processes a new temperature reading from an IoT device.
   * @param log The incoming temperature log.
   */
  public processReading(log: TemperatureLog): void {
    const { deviceId, temperature } = log;

    // Initialize state for new devices
    if (!this.deviceStates.has(deviceId)) {
      this.deviceStates.set(deviceId, {
        logs: [],
        alertState: 'NORMAL',
      });
    }

    const state = this.deviceStates.get(deviceId)!;
    const now = new Date();

    // Add new log and prune old ones (older than breach duration + a buffer)
    state.logs.push(log);
    const pruneTime = now.getTime() - (config.breachDurationMinutes + 5) * 60 * 1000;
    state.logs = state.logs.filter(l => l.timestamp.getTime() > pruneTime);
    
    this.checkForBreach(deviceId, state);
  }
  
  /**
   * Checks the logs for a specific device to see if a breach condition has been met.
   * @param deviceId The ID of the device to check.
   * @param state The current state of that device.
   */
  private async checkForBreach(deviceId: string, state: DeviceState): Promise<void> {
    const now = new Date().getTime();
    const breachStartTime = now - config.breachDurationMinutes * 60 * 1000;

    const relevantLogs = state.logs.filter(l => l.timestamp.getTime() >= breachStartTime);

    // Condition 1: We must have logs covering the entire breach window.
    if (relevantLogs.length === 0 || relevantLogs[0].timestamp.getTime() > breachStartTime) {
      // Not enough data for the full period, or the period just started.
      this.resetStateIfNecessary(state, deviceId);
      return;
    }

    // Condition 2: Every single log in the window must be above the threshold.
    const isBreached = relevantLogs.every(l => l.temperature > config.temperatureThreshold);

    if (isBreached) {
      // If we haven't already sent an alert for this ongoing breach, send one.
      if (state.alertState !== 'ALERTED') {
        console.log(`CRITICAL: Temperature breach detected for device ${deviceId}!`);
        state.alertState = 'ALERTED';
        
        // Extract drugId from log if available (can be added to TemperatureLog interface)
        const drugId = (relevantLogs[0] as any).drugId;
        await this.alertService.triggerAlerts(deviceId, relevantLogs, drugId);
      }
    } else {
      this.resetStateIfNecessary(state, deviceId);
    }
  }

  /**
   * Resets the device's alert state if it was previously breached but is now normal.
   */
  private resetStateIfNecessary(state: DeviceState, deviceId: string): void {
    if (state.alertState !== 'NORMAL') {
      console.log(`Device ${deviceId} has returned to normal temperature range.`);
      state.alertState = 'NORMAL';
      
      // Optionally, send a "resolved" message to the dashboard
      this.alertService.triggerResolved(deviceId);
    }
  }
}
