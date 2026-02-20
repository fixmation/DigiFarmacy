/**
 * @fileoverview Usage Examples for Stability Assessment Service
 * 
 * This file demonstrates how to use the getStabilityAssessment service
 * to fetch shelf-life loss data from Formus API when temperature breaches occur.
 */

import { getStabilityAssessment, RiskAssessment } from './src/StabilityAssessmentService';

/**
 * Example 1: Basic usage - Get stability assessment for a drug batch
 */
async function example1_basicUsage() {
  try {
    const assessment: RiskAssessment = await getStabilityAssessment(
      'GTIN-5901234123457',  // Drug ID (GTIN or internal batch ID)
      10.5,                   // Average temperature during breach (°C)
      2.5                     // Duration of breach (hours)
    );

    console.log('Stability Assessment Results:');
    console.log(`Drug ID: ${assessment.drugId}`);
    console.log(`Shelf-Life Loss: ${assessment.shelfLifeLossPercentage}%`);
    console.log(`Risk Level: ${assessment.riskLevel}`);
    console.log(`Recommendation: ${assessment.recommendation}`);
    console.log(`Estimated Remaining Shelf-Life: ${assessment.estimatedRemainingShelfLifeDays} days`);
  } catch (error) {
    console.error('Failed to get stability assessment:', error);
  }
}

/**
 * Example 2: Integration with Pharmacy IoT System
 * This shows how to use getStabilityAssessment when a temperature breach is detected
 */
async function example2_temperatureBreachWorkflow() {
  // Simulated breach detection
  const breachData = {
    deviceId: 'FRIDGE-PHY-001',
    drugId: 'AMOXICILLIN-500MG-BATCH-2025-001',
    temperaturesRecorded: [7.8, 8.5, 9.2, 10.1, 11.2, 10.8], // Temperature readings during breach
    breachStartTime: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
    breachEndTime: new Date(),
  };

  try {
    // Calculate average temperature and duration
    const avgTemp = breachData.temperaturesRecorded.reduce((a, b) => a + b) / breachData.temperaturesRecorded.length;
    const durationHours = (breachData.breachEndTime.getTime() - breachData.breachStartTime.getTime()) / (1000 * 60 * 60);

    // Get stability assessment from Formus
    const assessment = await getStabilityAssessment(
      breachData.drugId,
      avgTemp,
      durationHours
    );

    // Process the result based on risk level
    if (assessment.riskLevel === 'CRITICAL') {
      // CRITICAL: Immediately quarantine and destroy batch
      console.log(`⚠️ CRITICAL ALERT: Batch ${breachData.drugId} must be quarantined and destroyed.`);
      console.log(`Reason: ${assessment.recommendation}`);
      // Trigger quarantine workflow in your system
    } else if (assessment.riskLevel === 'HIGH') {
      // HIGH: Request pharmacist review
      console.log(`⚠️ HIGH RISK: Batch ${breachData.drugId} requires pharmacist review.`);
      console.log(`Shelf-life loss: ${assessment.shelfLifeLossPercentage}%`);
      console.log(`Action: ${assessment.recommendation}`);
      // Notify pharmacist via dashboard
    } else if (assessment.riskLevel === 'MEDIUM') {
      // MEDIUM: Log for audit trail, prioritize dispensing
      console.log(`ℹ️ MEDIUM RISK: Batch ${breachData.drugId} flagged for special handling.`);
      console.log(`${assessment.recommendation}`);
      // Add to priority dispensing queue
    } else {
      // LOW: Continue monitoring
      console.log(`✓ LOW RISK: Batch ${breachData.drugId} remains safe for use.`);
    }
  } catch (error) {
    console.error('Error in breach workflow:', error);
    // Fallback: Generate conservative risk assessment
  }
}

/**
 * Example 3: Calculating metrics for Bulk Assessment
 * Shows how to use helper functions for calculating average temp and duration
 */
async function example3_bulkAssessment() {
  import { calculateAverageTemperature, calculateDurationHours } from './src/StabilityAssessmentService';

  const breachLogs = [
    { timestamp: new Date('2026-02-21T10:00:00Z'), temperature: 8.2 },
    { timestamp: new Date('2026-02-21T10:05:00Z'), temperature: 8.7 },
    { timestamp: new Date('2026-02-21T10:10:00Z'), temperature: 9.1 },
    { timestamp: new Date('2026-02-21T10:15:00Z'), temperature: 9.8 },
  ];

  const temperatures = breachLogs.map(log => log.temperature);
  const durationMs = breachLogs[breachLogs.length - 1].timestamp.getTime() - breachLogs[0].timestamp.getTime();

  const avgTemp = calculateAverageTemperature(temperatures);
  const durationHours = calculateDurationHours(durationMs);

  console.log(`Average Temperature: ${avgTemp}°C`);
  console.log(`Duration: ${durationHours} hours`);

  // Now get assessment
  const assessment = await getStabilityAssessment('BATCH-123', avgTemp, durationHours);
  console.log(`Assessment: ${assessment.riskLevel} risk level`);
}

/**
 * Example 4: Environment Setup for Formus API
 * 
 * Set these environment variables to use the real Formus API:
 * 
 * FORMOS_API_URL=https://api.formos.io/v1/stability-assessment
 * FORMOS_API_KEY=your_formos_api_key_here
 * 
 * If these are not set, the service will use mock calculations
 * based on temperature excursion formulas.
 */
function example4_environmentSetup() {
  console.log('Required environment variables:');
  console.log('FORMOS_API_URL: Formus stability assessment endpoint');
  console.log('FORMOS_API_KEY: API key for Formus authentication');
  console.log('');
  console.log('Example .env file:');
  console.log('FORMOS_API_URL=https://api.formos.io/v1/stability-assessment');
  console.log('FORMOS_API_KEY=sk_live_1234567890abcdef');
}

/**
 * Example 5: Response Structure
 * Shows the complete RiskAssessment interface returned by getStabilityAssessment
 */
function example5_responseStructure() {
  const sampleResponse = {
    // Input data
    drugId: 'AMOXICILLIN-500MG-BATCH-2025-001',
    averageTemperature: 9.8,
    durationHours: 2.5,

    // Formus API results
    shelfLifeLossPercentage: 35.5,
    riskLevel: 'HIGH',
    estimatedRemainingShelfLifeDays: 360,

    // Recommendation
    recommendation: 'Consider reducing shelf-life label. Review batch viability before dispensing.',
    assessmentTimestamp: new Date('2026-02-21T14:30:00Z'),
  };

  console.log('Sample RiskAssessment response:');
  console.log(JSON.stringify(sampleResponse, null, 2));
}

/**
 * Example 6: Error Handling
 * Demonstrates proper error handling when Formus API is unavailable
 */
async function example6_errorHandling() {
  try {
    const assessment = await getStabilityAssessment('INVALID-ID', 15.0, -1);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Stability assessment failed:', error.message);
      // Fallback: Use conservative risk assessment
      console.log('Using fallback: Assuming HIGH risk for all affected batches');
      // Implement quarantine workflow
    }
  }
}

// Export for testing
export { example1_basicUsage, example2_temperatureBreachWorkflow };
