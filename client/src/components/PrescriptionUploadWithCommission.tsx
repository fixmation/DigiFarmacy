
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Camera, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';

interface PrescriptionUploadProps {
  pharmacyId?: string;
  pharmacyName?: string;
  onUploadComplete?: (uploadId: string) => void;
}

export const PrescriptionUploadWithCommission: React.FC<PrescriptionUploadProps> = ({
  pharmacyId,
  pharmacyName,
  onUploadComplete
}) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadPrescription = async () => {
    if (!selectedFile || !pharmacyId || !user) {
      toast.error('Please select a file and ensure you are logged in');
      return;
    }

    setUploading(true);
    
    try {
      // Upload file to Supabase storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pharmacy-documents')
        .upload(`prescriptions/${fileName}`, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pharmacy-documents')
        .getPublicUrl(`prescriptions/${fileName}`);

      // Create prescription upload record using commission_transactions table as fallback
      let prescriptionId = null;
      try {
        const { data: prescriptionData, error: prescriptionError } = await supabase
          .from('commission_transactions')
          .insert({
            amount_lkr: 100,
            description: `Prescription upload to ${pharmacyName || 'pharmacy'}`,
            pharmacy_id: pharmacyId,
            status: 'completed'
          })
          .select();

        if (!prescriptionError && prescriptionData && prescriptionData.length > 0) {
          prescriptionId = prescriptionData[0].id;
        }
      } catch (error) {
        console.error('Error creating prescription record:', error);
      }

      // Create commission transaction (simplified approach)
      try {
        const { error: commissionError } = await supabase
          .from('commission_transactions')
          .insert({
            amount_lkr: 100,
            description: 'Commission for prescription upload',
            pharmacy_id: pharmacyId,
            status: 'completed'
          });

        if (commissionError) {
          console.error('Commission creation error:', commissionError);
          toast.success('Prescription uploaded successfully, but commission tracking may have failed');
        } else {
          toast.success('Prescription uploaded successfully! Commission processed.');
        }
      } catch (error) {
        console.error('Commission processing error:', error);
        toast.success('Prescription uploaded successfully, but commission tracking may have failed');
      }

      setUploadSuccess(true);
      
      if (onUploadComplete && prescriptionId) {
        onUploadComplete(prescriptionId);
      }

      // Reset form
      setSelectedFile(null);
      const fileInput = document.getElementById('prescription-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast.error('Failed to upload prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = () => {
    // This would typically open the camera
    // For now, we'll trigger the file input
    const fileInput = document.getElementById('prescription-file') as HTMLInputElement;
    if (fileInput) {
      fileInput.setAttribute('capture', 'camera');
      fileInput.click();
    }
  };

  return (
    <Card className="glass-card shadow-blue-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Prescription
        </CardTitle>
        <CardDescription>
          {pharmacyName ? `Upload to ${pharmacyName}` : 'Upload your prescription for processing'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Fee Notice */}
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Service Fee Notice:</strong> By uploading your prescription to this pharmacy, 
            you may be charged LKR 100 or more for collection or delivery services. 
            Please contact the pharmacy directly to confirm fees before proceeding.
          </AlertDescription>
        </Alert>

        {uploadSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Prescription uploaded successfully! The pharmacy will contact you shortly.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="prescription-file">Select Prescription Image</Label>
            <Input
              id="prescription-file"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: JPG, PNG, WebP. Max size: 10MB
            </p>
          </div>

          {selectedFile && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">Selected File:</p>
              <p className="text-sm text-blue-700">{selectedFile.name}</p>
              <p className="text-xs text-blue-600">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={uploadPrescription}
              disabled={!selectedFile || uploading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Prescription'}
            </Button>
            
            <Button
              onClick={takePhoto}
              variant="outline"
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Ensure prescription is clearly visible and readable</p>
          <p>• Include doctor's signature and date</p>
          <p>• Commission of LKR 100 will be processed automatically</p>
          <p>• You will be contacted by the pharmacy for collection/delivery</p>
        </div>
      </CardContent>
    </Card>
  );
};
