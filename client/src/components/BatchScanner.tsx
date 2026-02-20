import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import type { InventoryItem } from '../../../shared/inventorySchema';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScanLine, CheckCircle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';

// GS1 Application Identifiers (AIs)
const AI = {
  GTIN: '01',
  EXPIRY: '17',
  BATCH: '10',
};

// Simple debounce to prevent overwhelming state updates from ultra-fast scanning
const scanDebounceMs = 500; 

/**
 * Parses a GS1 DataMatrix string to extract GTIN, expiry date, and batch number.
 * @param gs1String The raw string from the scanned code.
 * @returns A structured object with parsed data or null if parsing fails.
 */
const parseGS1DataMatrix = (gs1String: string): Omit<InventoryItem, 'totalTablets' | 'tabletsPerStrip'> | null => {
  try {
    const gtinMatch = gs1String.match(new RegExp(`\\(${AI.GTIN}\\)(\\d{14})`));
    const expiryMatch = gs1String.match(new RegExp(`\\(${AI.EXPIRY}\\)(\\d{6})`));
    const batchMatch = gs1String.match(new RegExp(`\\(${AI.BATCH}\\)([^\\(]+)`));

    if (!gtinMatch || !expiryMatch || !batchMatch) {
      console.warn("GS1 string missing required AIs (01, 17, 10).", { gtinMatch, expiryMatch, batchMatch });
      return null;
    }

    const gtin = gtinMatch[1];
    const expiryStr = expiryMatch[1];
    const batchNumber = batchMatch[1].trim();

    // Handle YYMMDD date format
    const year = parseInt(expiryStr.substring(0, 2), 10);
    const month = parseInt(expiryStr.substring(2, 4), 10) - 1; // Month is 0-indexed
    const day = parseInt(expiryStr.substring(4, 6), 10);
    const currentCentury = Math.floor(new Date().getFullYear() / 100) * 100;
    const expiryDate = new Date(currentCentury + year, month, day);

    // Handle century rollover for expiry (e.g., '23' is 2023, not 1923)
    if (expiryDate < new Date()) {
        expiryDate.setFullYear(expiryDate.getFullYear() + 100);
    }

    return { gtin, expiryDate, batchNumber };
  } catch (error) {
    console.error('Error parsing GS1 string:', error);
    return null;
  }
};

const BatchScanner: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanningQueue, setScanningQueue] = useState<InventoryItem[]>([]);
  const [lastScanned, setLastScanned] = useState<InventoryItem | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const readerElementId = "html5-qrcode-reader";

  // Initialize the scanner on component mount
  useEffect(() => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode(readerElementId);
    }
    
    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current?.isScanning) {
        stopScanning();
      }
    };
  }, []);

  const handleSuccess = useCallback((decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < scanDebounceMs) {
      return; // Debounce
    }
    lastScanTimeRef.current = now;

    setScanError(null);
    const parsedData = parseGS1DataMatrix(decodedText);

    if (parsedData) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }

      const newItem: InventoryItem = {
        ...parsedData,
        totalTablets: 0, // Default value, to be updated in bulk processing
        tabletsPerStrip: 10,
      };

      setLastScanned(newItem);
      setScanningQueue(prevQueue => [...prevQueue, newItem]);

    } else {
      setScanError("Invalid GS1 Code. Required: GTIN (01), Expiry (17), Batch (10).");
    }
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    // Ignore common non-error messages
    if (errorMessage.includes("QR code parse error") || errorMessage.includes("NotFoundException")) {
        return;
    }
    setScanError(errorMessage);
  }, []);
  
  const startScanning = async () => {
    if (!html5QrCodeRef.current || html5QrCodeRef.current.isScanning) return;
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      supportedScanTypes: [],
      rememberLastUsedCamera: true,
    };

    try {
      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        handleSuccess,
        handleError
      );
      setIsScanning(true);
      setScanError(null);
    } catch (err) {
      setScanError(`Failed to start scanner: ${err}`);
      console.error("Failed to start scanner:", err);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current?.isScanning) {
        try {
            await html5QrCodeRef.current.stop();
        } catch (err) {
            console.error("Failed to stop scanner gracefully:", err);
        }
    }
    setIsScanning(false);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg fixed bottom-0 left-0 right-0 md:relative rounded-b-none md:rounded-lg">
      <CardHeader 
        className="flex flex-row items-center justify-between p-4 cursor-pointer md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg font-bold">High-Speed Batch Scanner</CardTitle>
        <div className="flex items-center gap-4">
          <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
            {scanningQueue.length} items
          </span>
          <button className="md:hidden">
            {isExpanded ? <ChevronDown className="h-6 w-6" /> : <ChevronUp className="h-6 w-6" />}
          </button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-4 space-y-4">
          <div id={readerElementId} className={isScanning ? '' : 'border-2 border-dashed rounded-lg bg-gray-50 flex items-center justify-center h-48'}>
            {!isScanning && <p className="text-gray-500">Camera appears here</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="w-full bg-green-600 hover:bg-green-700">
                <ScanLine className="mr-2 h-4 w-4" /> Start Scan
              </Button>
            ) : (
              <Button onClick={stopScanning} className="w-full bg-red-600 hover:bg-red-700">
                Stop Scan
              </Button>
            )}
            <Button 
                variant="outline" 
                className="w-full"
                disabled={scanningQueue.length === 0}
            >
                Process Batch ({scanningQueue.length})
            </Button>
          </div>

          {scanError && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md flex items-center">
              <XCircle className="h-5 w-5 mr-3" />
              <p className="text-sm">{scanError}</p>
            </div>
          )}

          {lastScanned && !scanError && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded-md animate-pulse-once">
              <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-3"/>
                  <p className="text-sm font-semibold">Last Scan Successful</p>
              </div>
              <div className="text-xs mt-2 pl-8">
                  <p>GTIN: {lastScanned.gtin}</p>
                  <p>Batch: {lastScanned.batchNumber}</p>
                  <p>Expiry: {lastScanned.expiryDate.toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default BatchScanner;
