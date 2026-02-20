
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Camera, FileText, CheckCircle, Shield, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import PrescriptionValidator from './PrescriptionValidator';
import { type PrescriptionValidation } from '@/utils/prescriptionValidator';

interface Pharmacy {
  id: string;
  business_name: string;
  address: string;
  contact_phone?: string;
}

interface PharmacyDetails {
  id: string;
  business_name: string;
  address: string;
  contact_phone?: string;
}

export const EnhancedPrescriptionUpload: React.FC = () => {
  const { profile } = useAuth();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<string>('');
  const [currentPharmacyData, setCurrentPharmacyData] = useState<PharmacyDetails | null>(null);
  const [validatedPrescription, setValidatedPrescription] = useState<{ file: File; validation: PrescriptionValidation } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (profile?.role === 'pharmacy') {
      // If user is pharmacy, fetch their own pharmacy details
      fetchCurrentPharmacy();
    } else {
      // Otherwise, fetch list of all pharmacies
      fetchPharmacies();
    }
  }, [profile]);

  const fetchCurrentPharmacy = async () => {
    try {
      const response = await fetch('/api/pharmacies/current');
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacy details');
      }
      const data = await response.json();
      setCurrentPharmacyData(data);
      setSelectedPharmacy(data.id);
    } catch (error) {
      console.error('Error fetching current pharmacy:', error);
      toast.error('Failed to load pharmacy details');
    }
  };

  const fetchPharmacies = async () => {
    try {
      const response = await fetch('/api/pharmacies');
      if (!response.ok) {
        throw new Error('Failed to fetch pharmacies');
      }
      const data = await response.json();
      setPharmacies(data);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      toast.error('Failed to load pharmacies');
    }
  };

  const handleValidPrescription = (file: File, validation: PrescriptionValidation) => {
    setValidatedPrescription({ file, validation });
  };

  const uploadPrescription = async () => {
    if (!validatedPrescription || !selectedPharmacy) {
      toast.error('Please validate prescription and select pharmacy');
      return;
    }

    setUploading(true);
    
    try {
      // Create FormData for file upload with validation data
      const formData = new FormData();
      formData.append('file', validatedPrescription.file);
      formData.append('pharmacy_id', selectedPharmacy);
      formData.append('validation_data', JSON.stringify(validatedPrescription.validation));

      // Upload to server
      const response = await fetch('/api/prescriptions/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload prescription');
      }

      const result = await response.json();
      
      setUploadSuccess(true);
      toast.success('Prescription uploaded successfully!');
      
      // Reset form
      setValidatedPrescription(null);
      if (!currentPharmacyData) {
        setSelectedPharmacy('');
      }
      const fileInput = document.getElementById('prescription-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Reset success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);

    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast.error('Failed to upload prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = () => {
    const fileInput = document.getElementById('prescription-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.setAttribute('capture', 'camera');
      fileInput.click();
    }
  };

  const selectedPharmacyData = currentPharmacyData || pharmacies.find(p => p.id === selectedPharmacy);

  // Show placeholder for non-pharmacy users
  if (!profile || profile.role !== 'pharmacy') {
    return (
      <div className="w-full p-0 md:p-0 space-y-4">
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center min-h-64 md:min-h-72 space-y-4">
            <FileText className="h-12 w-12 md:h-16 md:w-16 text-gray-400" />
            <div className="text-center space-y-2">
              <h3 className="text-sm md:text-base font-semibold text-gray-700">Pharmacy Enhanced Prescription Upload</h3>
              <p className="text-xs md:text-sm text-gray-600 max-w-sm">
                To use Pharmacy Enhanced Prescription Upload component, for Pharmacy, Laboratory staff and Admins only. Please sign in to continue.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-0 md:p-0 space-y-4">
      <Card className="border border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg w-full">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-lg md:text-2xl">
            <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
            <span className="truncate">Smart Prescription Upload</span>
          </CardTitle>
          <CardDescription className="text-xs md:text-base mt-1">
            Upload prescriptions to manage and process patient orders
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-4">
          {uploadSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-xs md:text-sm text-green-800 font-medium">
                ✓ Prescription uploaded successfully! The pharmacy will contact you within 24 hours.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 w-full">
            {/* Pharmacy Info */}
            {currentPharmacyData && (
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-semibold text-gray-700">Your Pharmacy</Label>
                <div className="p-3 md:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200">
                  <div className="flex items-start gap-2 md:gap-3">
                    <Building2 className="h-4 w-4 md:h-5 md:w-5 text-blue-600 mt-0.5 md:mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs md:text-sm text-gray-900 truncate">{currentPharmacyData.business_name}</p>
                      <p className="text-xs md:text-sm text-gray-700 mt-1 line-clamp-2">{currentPharmacyData.address}</p>
                      {currentPharmacyData.contact_phone && (
                        <p className="text-xs md:text-sm text-gray-600 mt-1">📞 {currentPharmacyData.contact_phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prescription Validation - Mobile Responsive */}
            <div className="space-y-2">
              <Label className="text-xs md:text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="h-3 w-3 md:h-4 md:w-4" />
                <span className="truncate">Upload Prescription Document</span>
              </Label>
              <div className="w-full">
                <PrescriptionValidator
                  onValidPrescription={handleValidPrescription}
                  title=""
                  description=""
                />
              </div>
              
              {validatedPrescription && (
                <div className="p-3 md:p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <div className="flex items-start gap-2 md:gap-3">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-green-600 mt-0.5 md:mt-1 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-semibold text-green-900">✓ Valid Prescription Uploaded</p>
                      <p className="text-xs md:text-sm text-green-700 mt-1 truncate">{validatedPrescription.file.name}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Size: {(validatedPrescription.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col xs:flex-row gap-2 md:gap-3 pt-2 w-full">
            <Button
              onClick={uploadPrescription}
              disabled={!validatedPrescription || !selectedPharmacy || uploading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-none shadow-lg text-xs md:text-base font-semibold py-2 md:py-2.5"
            >
              <Upload className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">{uploading ? 'Uploading...' : 'Upload Prescription'}</span>
              <span className="md:hidden">{uploading ? 'Uploading...' : 'Upload'}</span>
            </Button>
            
            <Button
              onClick={takePhoto}
              variant="outline"
              className="flex-1 border-2 border-green-300 bg-green-50 text-green-700 hover:bg-green-100 font-semibold text-xs md:text-base py-2 md:py-2.5"
            >
              <Camera className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden md:inline">Take Photo</span>
              <span className="md:hidden">Photo</span>
            </Button>
          </div>

          {/* Upload Requirements */}
          <div className="text-xs text-gray-600 space-y-1 md:space-y-1.5 border-t pt-3 md:pt-4 bg-gray-50 p-2 md:p-3 rounded-lg">
            <h4 className="font-semibold text-xs md:text-sm text-gray-900">📋 Requirements:</h4>
            <ul className="space-y-0.5 text-xs">
              <li>✓ Clear and legible prescription</li>
              <li>✓ Doctor's signature and date</li>
              <li>✓ All medication names readable</li>
              <li>✓ Prescription not expired</li>
              <li>✓ Pharmacy will contact within 24 hours</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Add default export
export default EnhancedPrescriptionUpload;
