import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, FileCheck, Upload, CheckCircle, XCircle } from 'lucide-react';
import { validatePrescription, type PrescriptionValidation } from '@/utils/prescriptionValidator';
import { toast } from 'sonner';

interface PrescriptionValidatorProps {
  onValidPrescription: (file: File, validation: PrescriptionValidation) => void;
  title?: string;
  description?: string;
}

const PrescriptionValidator: React.FC<PrescriptionValidatorProps> = ({ 
  onValidPrescription, 
  title = "Upload Prescription",
  description = "Please ensure prescription meets all requirements"
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [doctorName, setDoctorName] = useState('');
  const [doctorQualification, setDoctorQualification] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [hasRubberStamp, setHasRubberStamp] = useState(false);
  const [validation, setValidation] = useState<PrescriptionValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidation(null);
    }
  };

  const validateAndSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a prescription file');
      return;
    }

    setIsValidating(true);

    try {
      const validationResult = validatePrescription(
        selectedFile,
        doctorName,
        doctorQualification,
        hasRubberStamp,
        registrationNumber
      );

      setValidation(validationResult);

      if (validationResult.isValid) {
        toast.success('Prescription validation successful');
        onValidPrescription(selectedFile, validationResult);
      } else {
        toast.error('Prescription validation failed');
      }
    } catch (error) {
      toast.error('Error validating prescription');
    } finally {
      setIsValidating(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setDoctorName('');
    setDoctorQualification('');
    setRegistrationNumber('');
    setHasRubberStamp(false);
    setValidation(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs md:text-sm">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Requirements Notice */}
        <Alert className="text-xs md:text-sm">
          <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 mt-0.5" />
          <AlertDescription className="text-xs md:text-sm">
            <strong>Prescription Requirements:</strong>
            <ul className="list-disc list-inside mt-1 md:mt-2 text-xs md:text-sm space-y-0.5 md:space-y-1">
              <li>Must contain doctor's full name and MBBS/MD qualification</li>
              <li>Doctor's rubber stamp/seal clearly visible</li>
              <li>Valid SLMC registration number</li>
              <li>Clear prescription details and patient information</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* File Upload */}
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="prescription-file" className="text-xs md:text-sm font-semibold">Prescription Document</Label>
          <Input
            id="prescription-file"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="cursor-pointer text-xs md:text-sm h-9 md:h-10"
          />
          {selectedFile && (
            <div className="text-xs md:text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        {/* Doctor Information */}
        <div className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="doctor-name" className="text-xs md:text-sm font-semibold">Doctor's Full Name</Label>
              <Input
                id="doctor-name"
                placeholder="Dr. John Doe"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                required
                className="text-xs md:text-sm h-9 md:h-10"
              />
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="doctor-qualification" className="text-xs md:text-sm font-semibold">Medical Qualification</Label>
              <Input
                id="doctor-qualification"
                placeholder="MBBS, MD, MS, etc."
                value={doctorQualification}
                onChange={(e) => setDoctorQualification(e.target.value)}
                required
                className="text-xs md:text-sm h-9 md:h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="registration-number" className="text-xs md:text-sm font-semibold">SLMC Registration Number</Label>
            <Input
              id="registration-number"
              placeholder="e.g., SLMC 12345"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              required
              className="text-xs md:text-sm h-9 md:h-10"
            />
          </div>
        </div>

        {/* Rubber Stamp Confirmation */}
        <div className="flex items-center space-x-2 p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-200">
          <Checkbox
            id="rubber-stamp"
            checked={hasRubberStamp}
            onCheckedChange={(checked) => setHasRubberStamp(checked as boolean)}
          />
          <Label htmlFor="rubber-stamp" className="text-xs md:text-sm font-medium cursor-pointer">
            Prescription contains doctor's rubber stamp/official seal
          </Label>
        </div>

        {/* Validation Results */}
        {validation && (
          <div className="space-y-2 md:space-y-3">
            <div className={`flex items-center gap-2 p-2 md:p-3 rounded-lg text-xs md:text-sm ${
              validation.isValid ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
              )}
              <span className="font-medium">
                {validation.isValid ? 'Prescription Valid' : 'Validation Failed'}
              </span>
            </div>

            {validation.errors.length > 0 && (
              <Alert variant="destructive" className="text-xs md:text-sm">
                <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                <AlertDescription className="text-xs md:text-sm">
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-xs md:text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {validation.warnings.length > 0 && (
              <Alert className="text-xs md:text-sm">
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                <AlertDescription className="text-xs md:text-sm">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside mt-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-xs md:text-sm">{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col xs:flex-row gap-2 md:gap-3 w-full">
          <Button
            onClick={validateAndSubmit}
            disabled={!selectedFile || isValidating}
            className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-xs md:text-sm py-2 md:py-2.5 h-auto"
          >
            {isValidating ? (
              <>
                <FileCheck className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 animate-pulse" />
                <span className="hidden md:inline">Validating...</span>
                <span className="md:hidden">Validating</span>
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Validate & Submit</span>
                <span className="md:hidden">Validate</span>
              </>
            )}
          </Button>
          
          <Button
            onClick={resetForm}
            variant="outline"
            disabled={isValidating}
            className="flex-1 text-xs md:text-sm py-2 md:py-2.5 h-auto"
          >
            Reset
          </Button>
        </div>

        {/* Upload Guidelines */}
        <div className="text-xs text-gray-500 border-t pt-2 md:pt-4 space-y-1">
          <p><strong>File Requirements:</strong> JPEG, PNG, WEBP, or PDF files up to 10MB</p>
          <p><strong>Quality:</strong> Ensure clear, readable text and visible rubber stamp</p>
          <p><strong>Privacy:</strong> Personal information is processed securely and not stored</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrescriptionValidator;