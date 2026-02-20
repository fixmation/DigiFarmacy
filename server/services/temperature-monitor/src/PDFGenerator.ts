/**
 * @fileoverview Generates a 'Stability Deviation Report' PDF compliant with
 * NMRA Good Storage Practice (GSP) standards.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TemperatureLog } from './AlertService';
import { config } from './config';
import { getStabilityAssessment, calculateAverageTemperature, calculateDurationHours, RiskAssessment } from './StabilityAssessmentService';
import fs from 'fs';
import path from 'path';

/**
 * Generates and saves a PDF report for a temperature breach with stability assessment.
 * Fetches shelf-life loss data from Formus API and includes Risk Assessment.
 * @param deviceId The ID of the device that had the breach.
 * @param breachLogs The temperature logs that constitute the breach.
 * @param drugId Optional drug/batch ID for stability assessment lookup
 */
export const generateStabilityReportPDF = async (
  deviceId: string,
  breachLogs: TemperatureLog[],
  drugId?: string
): Promise<void> => {
  const doc = new jsPDF();
  const reportDate = new Date();
  const reportTitle = 'Cold Chain Stability Deviation Report';
  const fileName = `Deviation-Report-${deviceId}-${reportDate.toISOString().split('T')[0]}.pdf`;

  // --- PDF Header ---
  doc.setFontSize(18);
  doc.text(reportTitle, 14, 22);
  doc.setFontSize(11);
  doc.text(`Generated: ${reportDate.toLocaleString()}`, 14, 30);
  doc.line(14, 32, 196, 32); // Horizontal line

  // --- Report Details ---
  autoTable(doc, {
    startY: 35,
    head: [['Parameter', 'Details']],
    body: [
      ['Pharmacy', config.pharmacyDetails.name],
      ['Pharmacy Address', config.pharmacyDetails.address],
      ['Monitored Unit', deviceId],
      ['Report ID', `REP-${Date.now()}`],
    ],
    theme: 'plain',
    styles: { fontSize: 10 },
  });

  // --- Breach Summary ---
  const breachStartTime = breachLogs[0].timestamp;
  const breachEndTime = breachLogs[breachLogs.length - 1].timestamp;
  const durationMs = breachEndTime.getTime() - breachStartTime.getTime();
  const durationMinutes = Math.round(durationMs / 60000);
  const maxTemp = Math.max(...breachLogs.map(l => l.temperature));

  autoTable(doc, {
    head: [['Breach Summary']],
    body: [[
      `A temperature excursion was detected where the temperature rose above the GSP threshold of ${config.temperatureThreshold}°C. ` +
      `The deviation persisted for approximately ${durationMinutes} minutes. ` +
      `Immediate corrective action is required.`
    ]],
    theme: 'striped',
    headStyles: { fillColor: [200, 0, 0] }, // Red header for summary
  });

  autoTable(doc, {
    body: [
        ['Breach Start Time', breachStartTime.toLocaleString()],
        ['Breach End Time', breachEndTime.toLocaleString()],
        ['Approximate Duration', `${durationMinutes} minutes`],
        ['Maximum Temperature Recorded', `${maxTemp.toFixed(2)} °C`],
    ],
    theme: 'grid'
  })

  // --- Temperature Log Table ---
  autoTable(doc, {
    head: [['Temperature Log']],
    theme: 'striped',
    headStyles: { fillColor: [50, 50, 50] },
  });

  autoTable(doc, {
    head: [['Timestamp', 'Temperature (°C)', 'Status']],
    body: breachLogs.map(log => [
      log.timestamp.toLocaleString(),
      log.temperature.toFixed(2),
      { content: 'DEVIATION', styles: { textColor: [200, 0, 0] } },
    ]),
    theme: 'grid',
    headStyles: { fillColor: [100, 100, 100] },
  });

  // --- Risk Assessment Section (from Formus API) ---
  let riskAssessment: RiskAssessment | null = null;
  
  if (drugId) {
    try {
      const averageTemp = calculateAverageTemperature(breachLogs.map(l => l.temperature));
      const durationHours = calculateDurationHours(durationMs);
      riskAssessment = await getStabilityAssessment(drugId, averageTemp, durationHours);
      
      // Determine color based on risk level
      let riskColor = [0, 200, 0]; // Green for LOW
      if (riskAssessment.riskLevel === 'MEDIUM') riskColor = [255, 165, 0]; // Orange
      else if (riskAssessment.riskLevel === 'HIGH') riskColor = [255, 100, 0]; // Dark orange
      else if (riskAssessment.riskLevel === 'CRITICAL') riskColor = [200, 0, 0]; // Red

      autoTable(doc, {
        head: [['Risk Assessment (Formus API)']],
        theme: 'striped',
        headStyles: { fillColor: riskColor },
      });

      autoTable(doc, {
        body: [
          ['Drug/Batch ID', drugId],
          ['Average Temperature During Breach', `${riskAssessment.averageTemperature.toFixed(2)} °C`],
          ['Breach Duration', `${riskAssessment.durationHours} hours`],
          ['Shelf-Life Loss Percentage', `${riskAssessment.shelfLifeLossPercentage}%`],
          ['Risk Level', riskAssessment.riskLevel],
          ['Estimated Remaining Shelf-Life', `${riskAssessment.estimatedRemainingShelfLifeDays} days`],
          ['Recommendation', riskAssessment.recommendation],
        ],
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
      });
    } catch (error) {
      console.error('Failed to retrieve stability assessment:', error);
      autoTable(doc, {
        head: [['Risk Assessment']],
        body: [[`Note: Stability assessment unavailable. Please contact Formus support. Error: ${error instanceof Error ? error.message : 'Unknown error'}`]],
        theme: 'striped',
        headStyles: { fillColor: [200, 100, 0] }, // Orange for warning
      });
    }
  } else {
    autoTable(doc, {
      head: [['Risk Assessment']],
      body: [['Note: Drug/Batch ID not provided. Please supply drug_id for Formus stability assessment.']],
      theme: 'striped',
      headStyles: { fillColor: [150, 150, 150] }, // Gray for informational
    });
  }
  
  // --- Footer ---
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount} | ${reportTitle}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // --- Save the PDF ---
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  const filePath = path.join(reportsDir, fileName);
  doc.save(filePath);
  
  console.log(`Successfully generated deviation report: ${filePath}`);
};
