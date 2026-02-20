/**
 * @fileoverview Stability Assessment Service
 * Integrates with Formus API to calculate shelf-life loss percentage
 * when temperature breaches are detected.
 */

import { config } from './config.js';

/**
 * Request payload for Formus API
 */
export interface FormosRequest {
  drug_id: string;
  average_temp: number;
  duration_hours: number;
}

/**
 * Response from Formus API
 */
export interface FormosResponse {
  drug_id: string;
  shelf_life_loss_percentage: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_remaining_shelf_life_days: number;
  recommendation: string;
}

/**
 * Risk assessment result combining Formus data with our sensor data
 */
export interface RiskAssessment {
  drugId: string;
  averageTemperature: number;
  durationHours: number;
  shelfLifeLossPercentage: number;
  riskLevel: string;
  estimatedRemainingShelfLifeDays: number;
  recommendation: string;
  assessmentTimestamp: Date;
}

/**
 * Calls the Formus API to get stability assessment data for a specific drug
 * when a temperature breach is detected.
 * 
 * @param drugId - The unique identifier of the drug/batch
 * @param averageTemp - The average temperature recorded during the breach (°C)
 * @param durationHours - How long the breach lasted (hours)
 * @returns Promise<RiskAssessment> - Stability assessment with shelf-life loss data
 * @throws Error if the Formus API call fails
 */
export async function getStabilityAssessment(
  drugId: string,
  averageTemp: number,
  durationHours: number
): Promise<RiskAssessment> {
  try {
    // Construct Formus API endpoint
    const formosApiUrl = process.env.FORMOS_API_URL || 'https://api.formos.io/v1/stability-assessment';
    const formosApiKey = process.env.FORMOS_API_KEY || '';

    if (!formosApiKey) {
      console.warn('FORMOS_API_KEY not configured. Using mock stability assessment data.');
      return getMockStabilityAssessment(drugId, averageTemp, durationHours);
    }

    const payload: FormosRequest = {
      drug_id: drugId,
      average_temp: averageTemp,
      duration_hours: durationHours,
    };

    // Call Formus API via fetch
    const response = await fetch(formosApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${formosApiKey}`,
        'X-Request-ID': `${drugId}-${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Formus API error: ${response.status} ${response.statusText}`);
    }

    const formosData: FormosResponse = await response.json();

    // Map Formus response to our RiskAssessment format
    const assessment: RiskAssessment = {
      drugId: formosData.drug_id,
      averageTemperature: averageTemp,
      durationHours: durationHours,
      shelfLifeLossPercentage: formosData.shelf_life_loss_percentage,
      riskLevel: formosData.risk_level.toUpperCase(),
      estimatedRemainingShelfLifeDays: formosData.estimated_remaining_shelf_life_days,
      recommendation: formosData.recommendation,
      assessmentTimestamp: new Date(),
    };

    console.log(`Stability assessment for ${drugId}: ${formosData.shelf_life_loss_percentage.toFixed(2)}% shelf-life loss`);

    return assessment;
  } catch (error) {
    console.error('Failed to get stability assessment from Formus API:', error);
    throw new Error(`Stability assessment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates mock stability assessment data for development/testing
 * when Formos API is not available or configured
 */
function getMockStabilityAssessment(
  drugId: string,
  averageTemp: number,
  durationHours: number
): RiskAssessment {
  // Calculate shelf-life loss based on temperature excursion
  // Rough approximation: 2% loss per hour at 2°C above threshold (8°C)
  const temperatureExcursion = averageTemp - config.temperatureThreshold;
  const baseShelfLifeLossPercentage = Math.max(0, temperatureExcursion * 2 * durationHours);
  
  // Cap at 100%
  const shelfLifeLossPercentage = Math.min(100, baseShelfLifeLossPercentage);
  
  // Determine risk level
  let riskLevel = 'LOW';
  if (shelfLifeLossPercentage > 50) riskLevel = 'CRITICAL';
  else if (shelfLifeLossPercentage > 30) riskLevel = 'HIGH';
  else if (shelfLifeLossPercentage > 10) riskLevel = 'MEDIUM';

  // Estimate remaining shelf life (assuming standard 24-month shelf life)
  const standardShelfLifeDays = 24 * 30; // 24 months
  const remainingShelfLifeDays = Math.round(standardShelfLifeDays * (1 - shelfLifeLossPercentage / 100));

  // Generate recommendation
  let recommendation = 'No action needed. Continue monitoring.';
  if (riskLevel === 'CRITICAL') {
    recommendation = 'QUARANTINE IMMEDIATELY. Batch must be destroyed per NMRA GSP guidelines.';
  } else if (riskLevel === 'HIGH') {
    recommendation = 'Consider reducing shelf-life label. Review batch viability before dispensing.';
  } else if (riskLevel === 'MEDIUM') {
    recommendation = 'Add notation to batch record. Prioritize dispensing of affected batch.';
  }

  return {
    drugId,
    averageTemperature: averageTemp,
    durationHours,
    shelfLifeLossPercentage: parseFloat(shelfLifeLossPercentage.toFixed(2)),
    riskLevel,
    estimatedRemainingShelfLifeDays: remainingShelfLifeDays,
    recommendation,
    assessmentTimestamp: new Date(),
  };
}

/**
 * Calculates the average temperature from a set of temperature logs
 */
export function calculateAverageTemperature(temperatures: number[]): number {
  if (temperatures.length === 0) return 0;
  const sum = temperatures.reduce((acc, temp) => acc + temp, 0);
  return parseFloat((sum / temperatures.length).toFixed(2));
}

/**
 * Calculates duration in hours from milliseconds
 */
export function calculateDurationHours(durationMs: number): number {
  return parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
}
