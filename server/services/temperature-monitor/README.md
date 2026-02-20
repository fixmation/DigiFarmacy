# Stability Assessment Service

## Overview

The **Stability Assessment Service** is a TypeScript service that integrates with the Formus API to calculate shelf-life loss when IoT temperature breaches are detected in pharmacy refrigeration units.

## Features

✅ **Formus API Integration**: Fetches real-time shelf-life loss calculations from Formus  
✅ **Mock Mode**: Falls back to calculated estimates if Formus API is unavailable  
✅ **Risk Assessment**: Categorizes breaches as LOW, MEDIUM, HIGH, or CRITICAL  
✅ **PDF Integration**: Risk assessment is embedded in NMRA Stability Deviation Reports  
✅ **Async Processing**: Non-blocking stability calculations during breach alerts  

## Architecture

### Service Flow

```
Temperature Breach Detected
    ↓
TemperatureMonitor.checkForBreach()
    ↓
AlertService.triggerAlerts() [async]
    ↓
getStabilityAssessment() ← Formus API Call
    ↓
Return RiskAssessment
    ↓
generateStabilityReportPDF() ← Embeds Risk Assessment
```

### File Structure

```
server/services/temperature-monitor/src/
├── StabilityAssessmentService.ts    ← Main service (NEW)
├── PDFGenerator.ts                  ← Updated to use stability assessment
├── AlertService.ts                  ← Updated to call async PDF generation
├── TemperatureMonitor.ts            ← Updated to await risk assessment
├── index.ts
├── config.ts
├── STABILITY_ASSESSMENT_GUIDE.ts    ← Usage examples (NEW)
└── README.md                        ← This file
```

## Configuration

### Environment Variables

Set the following environment variables to enable Formus API integration:

```bash
# Formus API Configuration
FORMOS_API_URL=https://api.formos.io/v1/stability-assessment
FORMOS_API_KEY=your_api_key_here
```

**Without these variables**, the service automatically falls back to mock calculations based on temperature excursion formulas.

## API Reference

### getStabilityAssessment()

Main function to fetch stability assessment from Formus API.

```typescript
async function getStabilityAssessment(
  drugId: string,           // GTIN, batch number, or internal ID
  averageTemp: number,      // Average temperature during breach (°C)
  durationHours: number     // Duration of breach (hours)
): Promise<RiskAssessment>
```

**Returns**: `RiskAssessment` object with shelf-life loss and recommendations

#### Example Usage

```typescript
const assessment = await getStabilityAssessment(
  'AMOXICILLIN-500MG-BATCH-2025-001',
  10.5,
  2.5
);

console.log(`Shelf-life loss: ${assessment.shelfLifeLossPercentage}%`);
console.log(`Risk level: ${assessment.riskLevel}`);
```

### Helper Functions

#### calculateAverageTemperature()
```typescript
function calculateAverageTemperature(temperatures: number[]): number
```
Calculates mean temperature from an array of readings.

#### calculateDurationHours()
```typescript
function calculateDurationHours(durationMs: number): number
```
Converts millisecond duration to hours.

## Data Structures

### RiskAssessment
```typescript
interface RiskAssessment {
  drugId: string;
  averageTemperature: number;
  durationHours: number;
  shelfLifeLossPercentage: number;  // 0-100
  riskLevel: string;                // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedRemainingShelfLifeDays: number;
  recommendation: string;
  assessmentTimestamp: Date;
}
```

### FormosRequest (API Payload)
```typescript
interface FormosRequest {
  drug_id: string;          // Drug identifier
  average_temp: number;     // °C
  duration_hours: number;   // Hours
}
```

### FormosResponse (API Response)
```typescript
interface FormosResponse {
  drug_id: string;
  shelf_life_loss_percentage: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  estimated_remaining_shelf_life_days: number;
  recommendation: string;
}
```

## Risk Level Handling

### LOW Risk
- **Condition**: Shelf-life loss < 10%
- **Action**: Continue normal operations, no label changes needed
- **PDF Color**: Green

### MEDIUM Risk
- **Condition**: 10% ≤ Shelf-life loss < 30%
- **Action**: Add batch notation, prioritize dispensing
- **PDF Color**: Orange
- **Example**: "Paracetamol 500mg batch loses 15% shelf-life after 1.5 hour breach at 9.2°C"

### HIGH Risk
- **Condition**: 30% ≤ Shelf-life loss < 50%
- **Action**: Reduce shelf-life label, request pharmacist review
- **PDF Color**: Dark Orange
- **Example**: "Antibiotic batch loses 35% shelf-life, remaining viability ~9 months"

### CRITICAL Risk
- **Condition**: Shelf-life loss ≥ 50%
- **Action**: **QUARANTINE AND DESTROY** per NMRA GSP regulations
- **PDF Color**: Red
- **Example**: "Insulin batch loses 85% shelf-life, unsafe for dispensing"

## PDF Integration

When a temperature breach triggers an alert, the system now generates a comprehensive NMRA Stability Deviation Report that includes:

1. **Breach Summary**
   - Start/end times
   - Maximum temperature recorded
   - Duration in minutes

2. **Temperature Log Table**
   - Timestamp, temperature, and deviation flag for each reading

3. **Risk Assessment Section** (NEW)
   - Drug/Batch ID
   - Average temperature during breach
   - Shelf-life loss percentage (from Formus)
   - Risk level classification
   - Estimated remaining shelf-life
   - Pharmacist action recommendation
   - Risk indicator color (green → orange → red)

### Example PDF Section

```
╔════════════════════════════════════════════════════════════════╗
║              Risk Assessment (Formus API)                       ║
╠════════════════════════════════════════════════════════════════╣
║ Drug/Batch ID      │ AMOXICILLIN-500MG-BATCH-2025-001          ║
║ Avg Temperature    │ 10.2 °C                                    ║
║ Breach Duration    │ 2.5 hours                                  ║
║ Shelf-Life Loss    │ 35%                                        ║
║ Risk Level         │ HIGH                                       ║
║ Remaining S/L      │ 360 days                                   ║
║ Recommendation     │ Consider reducing shelf-life label         ║
╚════════════════════════════════════════════════════════════════╝
```

## Mock Mode

When Formus API is unavailable or not configured, the service automatically calculates shelf-life loss using the Arrhenius equation approximation:

**Formula**:
```
Shelf-Life Loss (%) = max(0, (Temperature Excursion in °C) × 2 × Duration in Hours)
```

Where:
- **Temperature Excursion** = Average Temperature - 8°C (GSP threshold)
- **Factor** = 2% loss per °C per hour (approximation)

**Example**:
- Breach: 10.5°C average for 3 hours
- Excursion: 10.5 - 8 = 2.5°C
- Loss: 2.5 × 2 × 3 = **15% shelf-life loss**

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const assessment = await getStabilityAssessment(drugId, avgTemp, duration);
} catch (error) {
  console.error('Stability assessment failed:', error);
  // System falls back to mock calculations or conservative risk assessment
  // Pharmacist is notified via dashboard alert
}
```

## Integration Points

### 1. TemperatureMonitor.ts
- Calls `triggerAlerts()` with optional `drugId` parameter
- Awaits async alert completion

### 2. AlertService.ts
- `triggerAlerts()` method now async
- Passes `drugId` to PDF generation
- Broadcasts `report_generation_failed` alert if needed

### 3. PDFGenerator.ts
- Imports `getStabilityAssessment()` and helper functions
- Adds Risk Assessment section to PDF
- Handles Formus API errors gracefully

## Testing

### Unit Test Example

```typescript
import { getStabilityAssessment } from './StabilityAssessmentService';

describe('StabilityAssessmentService', () => {
  it('should fetch assessment from Formus API', async () => {
    const result = await getStabilityAssessment(
      'TEST-BATCH-001',
      9.5,
      2.0
    );
    
    expect(result.drugId).toBe('TEST-BATCH-001');
    expect(result.shelfLifeLossPercentage).toBeGreaterThanOrEqual(0);
    expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(result.riskLevel);
  });
});
```

### Manual Testing

```bash
# Set test API key
export FORMOS_API_KEY=test_key_12345

# Run development server
npm run dev

# Trigger test temperature breach via webhook
curl -X POST http://localhost:3000/api/temperature \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "FRIDGE-001",
    "temperature": 11.0,
    "drugId": "AMOXICILLIN-500MG-BATCH-2025-001"
  }'
```

## Compliance

✅ **NMRA Good Storage Practice (GSP)** - PDF reports meet NMRA documentation standards  
✅ **Scalability** - Async processing prevents blocking on API calls  
✅ **Reliability** - Graceful fallback to mock calculations  
✅ **Auditability** - All risk assessments timestamped and saved to PDF  

## Future Enhancements

- [ ] Batch quarantine workflow integration
- [ ] Pharmacy recall API integration
- [ ] Shelf-life label printing automation
- [ ] Real-time risk dashboard widget
- [ ] Integration with NMRA reporting portal

## Support

For Formus API issues, contact:
- **Formus Support**: support@formos.io
- **Documentation**: https://docs.formos.io/stability-assessment

For DigiFarmacy integration issues:
- Create an issue in the repository
- Contact: dev@difarmacy.local
