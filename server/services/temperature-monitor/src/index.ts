/**
 * @fileoverview Main entry point for the Temperature Monitoring Service.
 * Sets up an Express server to listen for IoT webhooks and a WebSocket
 * server to push alerts to the B2B dashboard.
 */
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { TemperatureMonitor } from './TemperatureMonitor.js';
import { AlertService } from './AlertService.js';
import { config } from './config.js';

// --- Export Stability Assessment Types ---
export { getStabilityAssessment, calculateAverageTemperature, calculateDurationHours } from './StabilityAssessmentService.js';
export type { RiskAssessment, FormosRequest, FormosResponse } from './StabilityAssessmentService.js';

// --- Server Initialization ---
const app = express();
app.use(express.json());
const server = http.createServer(app);

// --- WebSocket Setup for Dashboard Alerts ---
const wss = new WebSocket.Server({ server });
let connectedClients: WebSocket[] = [];

wss.on('connection', (ws) => {
  console.log('Dashboard client connected');
  connectedClients.push(ws);
  ws.on('close', () => {
    connectedClients = connectedClients.filter(client => client !== ws);
    console.log('Dashboard client disconnected');
  });
  ws.send(JSON.stringify({ message: 'Connection established. Awaiting temperature alerts.' }));
});

// Function to broadcast alerts to all connected dashboard clients
const broadcastAlert = (alert: object) => {
  if (connectedClients.length === 0) {
    console.log('Alert generated, but no dashboard clients are connected.');
    return;
  }
  console.log(`Broadcasting alert to ${connectedClients.length} clients.`);
  const message = JSON.stringify(alert);
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// --- Service Instantiation ---
const alertService = new AlertService(broadcastAlert);
const temperatureMonitor = new TemperatureMonitor(alertService);

// --- API Endpoints ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Temperature monitoring service is running.' });
});

/**
 * Webhook endpoint to receive temperature data from IoT devices.
 * Expects a JSON body: { deviceId: string, temperature: number, timestamp: string }
 */
app.post('/webhook/temperature', (req, res) => {
  const { deviceId, temperature, timestamp } = req.body;

  if (typeof deviceId !== 'string' || typeof temperature !== 'number' || typeof timestamp !== 'string') {
    return res.status(400).json({
      error: 'Invalid payload. Expecting deviceId (string), temperature (number), and timestamp (string).',
    });
  }
  
  const log = { deviceId, temperature, timestamp: new Date(timestamp) };
  temperatureMonitor.processReading(log);
  
  res.status(202).json({ message: 'Accepted' });
});

// --- Start Server ---
server.listen(config.port, () => {
  console.log(`Temperature Monitoring Service listening on http://localhost:${config.port}`);
});
