/**
 * @fileoverview A dark-themed operational dashboard for pharmacists.
 * Displays critical real-time information about system health, inventory, and pending tasks.
 */
import React from 'react';
import { Fridge, AlertTriangle, PackageCheck, Thermometer } from 'lucide-react';
import { usePeakHourQueue } from '../hooks/usePeakHourQueue'; // Assuming hook is available

// Mock interface for dashboard display
interface MedicineBatch {
  id: string;
  drugName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
}

// --- Widget Components ---

/**
 * A gauge widget for displaying real-time refrigerator temperature.
 */
const SystemHealthWidget: React.FC<{ temperature: number }> = ({ temperature }) => {
  const isHealthy = temperature <= 8.0;
  const isWarning = temperature > 8.0 && temperature <= 10.0;
  const isCritical = temperature > 10.0;

  let statusColor = 'text-green-400';
  if (isWarning) statusColor = 'text-amber-400';
  if (isCritical) statusColor = 'text-red-500';

  const rotation = Math.max(-90, Math.min(90, (temperature - 5) * 18)); // Simple mapping: 5C -> -90deg, 15C -> 90deg

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center justify-between h-full">
      <div className="flex items-center text-gray-300">
        <Thermometer className="h-5 w-5 mr-2" />
        <h3 className="text-lg font-semibold">System Health</h3>
      </div>
      <div className="relative w-48 h-24 mt-4 mb-2 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full border-t-8 border-l-8 border-r-8 border-gray-700 rounded-t-full"></div>
        <div
          className={`absolute bottom-0 left-1/2 w-1 h-24 origin-bottom transform-gpu transition-transform duration-500 ${statusColor}`}
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <div className="w-full h-1/2 bg-current rounded-t-full"></div>
        </div>
      </div>
      <p className={`text-5xl font-bold ${statusColor}`}>{temperature.toFixed(1)}°C</p>
      <p className={`text-sm font-semibold ${statusColor}`}>
        {isHealthy ? 'Normal' : isCritical ? 'Critical Failure' : 'Warning'}
      </p>
    </div>
  );
};

/**
 * A widget to display the total value of stock expiring in less than 60 days.
 */
const InventoryLeakageWidget: React.FC<{ expiringStock: MedicineBatch[] }> = ({ expiringStock }) => {
  const totalLeakageValue = expiringStock.reduce((acc, item) => acc + (item.costPrice * item.stockCount), 0);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center text-gray-300">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold">Inventory Leakage</h3>
        </div>
        <p className="text-sm text-gray-400">Value of stock expiring in &lt; 60 days.</p>
      </div>
      <div className="text-right mt-4">
        <p className="text-5xl font-bold text-amber-400">
          {totalLeakageValue.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
        </p>
        <p className="text-amber-400 font-semibold">{expiringStock.length} Batches Affected</p>
      </div>
    </div>
  );
};

/**
 * A widget showing the count of pending scans from the peak-hour rush.
 */
const ReconciliationWidget: React.FC<{ pendingScans: number }> = ({ pendingScans }) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center text-gray-300">
          <PackageCheck className="h-5 w-5 mr-2" />
          <h3 className="text-lg font-semibold">Reconciliation Needed</h3>
        </div>
        <p className="text-sm text-gray-400">Scans from peak-hour rush awaiting confirmation.</p>
      </div>
      <div className="text-right mt-4">
        <p className={`text-6xl font-bold ${pendingScans > 0 ? 'text-blue-400' : 'text-gray-400'}`}>
          {pendingScans}
        </p>
        <p className={`${pendingScans > 0 ? 'text-blue-400' : 'text-gray-400'} font-semibold`}>Pending Scans</p>
      </div>
    </div>
  );
};


// --- Main Dashboard Page ---

const OpsDashboard: React.FC = () => {
  // Mock data hooks
  const { peakHourQueue } = usePeakHourQueue();
  const [expiringStock, setExpiringStock] = React.useState<MedicineBatch[]>([]);
  const [temperature, setTemperature] = React.useState(7.2);

  React.useEffect(() => {
    // Mock expiring stock data
    const mockExpiringStock: MedicineBatch[] = [
      {
        id: '1',
        drugName: 'Amoxicillin 500mg',
        batchNumber: 'AMOX-2025-001',
        expiryDate: '2025-03-15',
        quantity: 45,
      },
      {
        id: '2',
        drugName: 'Paracetamol 500mg',
        batchNumber: 'PARA-2025-002',
        expiryDate: '2025-04-20',
        quantity: 120,
      },
    ];
    setExpiringStock(mockExpiringStock);

    // Simulate real-time temperature updates
    const tempInterval = setInterval(() => {
        // Fluctuate temperature, occasionally breaching the threshold
        const fluctuation = (Math.random() - 0.45) * 0.5;
        const newTemp = temperature + fluctuation;
        setTemperature(Math.max(4.0, Math.min(10.5, newTemp))); // Clamp between 4.0 and 10.5
    }, 3000);

    return () => clearInterval(tempInterval);
  }, [temperature]);

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Pharmacy Ops Dashboard</h1>
        <p className="text-gray-400">Real-time operational overview.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health Widget */}
        <div className="lg:col-span-1">
          <SystemHealthWidget temperature={temperature} />
        </div>

        {/* Inventory Leakage Widget */}
        <div className="lg:col-span-1">
          <InventoryLeakageWidget expiringStock={expiringStock} />
        </div>
        
        {/* Reconciliation Needed Widget */}
        <div className="lg:col-span-1">
          <ReconciliationWidget pendingScans={peakHourQueue.length} />
        </div>
      </main>
    </div>
  );
};

export default OpsDashboard;
