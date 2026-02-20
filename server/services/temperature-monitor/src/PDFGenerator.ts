/**
 * @fileoverview Generates a 'Stability Deviation Report' PDF compliant with
 * NMRA Good Storage Practice (GSP) standards.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TemperatureLog } from './AlertService';
import { config } from './config';
import fs from 'fs';
import path from 'path';

/**
 * Generates and saves a PDF report for a temperature breach.
 * @param deviceId The ID of the device that had the breach.
 * @param breachLogs The temperature logs that constitute the breach.
 */
export const generateStabilityReportPDF = (deviceId: string, breachLogs: TemperatureLog[]): void => {
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
