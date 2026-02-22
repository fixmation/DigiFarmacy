
import { useState, useRef } from 'react';
import { useAuth } from './auth/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


interface PrescriptionUploadProps {
  onDrugExtracted: (drugName: string) => void;
}

interface ExtractedMedication {
  name: string;
  dosage: string;
  frequency: string;
  confidence: number;
}

const PrescriptionUpload = ({ onDrugExtracted }: PrescriptionUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedMeds, setExtractedMeds] = useState<(ExtractedMedication & { analysis?: any })[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Helper to convert file to base64
  const fileToBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip data:*/*;base64, prefix
      const idx = result.indexOf(',');
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    if (!profile || profile.role !== 'pharmacy') {
      toast({ title: 'Access denied', description: 'This feature is available to verified pharmacists only.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch('/api/prescriptions/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });

      if (!response.ok) throw new Error('Audit failed');

      const data = await response.json();
      // data.extracted and data.analyses
      const extractedResults: (ExtractedMedication & { analysis?: any })[] = (data.extracted || []).map((name: string) => ({
        name,
        dosage: 'Not available',
        frequency: 'Not available',
        confidence: 0.9,
        analysis: (data.analyses || []).find((a: any) => a.drugName === name)?.analysis ?? null
      }));

      setExtractedMeds(extractedResults);

      toast({ title: 'Audit complete', description: `Found ${extractedResults.length} medication(s).` });

      if (extractedResults.length > 0) {
        onDrugExtracted(extractedResults[0].name);
      }

    } catch (error) {
      console.error(error);
      toast({ title: 'Processing failed', description: 'Failed to audit the prescription. Please try again.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleCameraCapture = () => {
    // In a real app, this would open the camera
    toast({
      title: "Camera feature",
      description: "Camera capture would be available in the mobile app version.",
    });
  };

  const clearUpload = () => {
    setUploadedFile(null);
    setExtractedMeds([]);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
            <FileText className="h-5 w-5 text-medical-blue" />
            Pharmacist Audit Tool
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm mt-2">
            Upload a doctor's handwritten prescription for pharmacist-only AI-assisted review and second-opinion warnings.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6">
          {!uploadedFile ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-medical-blue/30 rounded-lg p-4 sm:p-6 md:p-8 text-center hover:border-medical-blue/50 transition-colors">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 md:gap-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="medical-gradient text-white text-sm sm:text-base"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Upload Prescription Image</span>
                      <span className="sm:hidden">Upload</span>
                    </Button>
                    
                    <Button
                      onClick={handleCameraCapture}
                      variant="outline"
                      size="sm"
                      className="border-medical-teal text-medical-teal hover:bg-medical-teal/10 text-sm sm:text-base"
                    >
                      <Camera className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Take Photo</span>
                      <span className="sm:hidden">Camera</span>
                    </Button>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Formats: JPG, PNG • Max: 10MB
                  </p>
                </div>
              </div>
              
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {/* Preview */}
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Prescription preview"
                    className="max-h-48 sm:max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <Button
                    onClick={clearUpload}
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                  >
                    ✕
                  </Button>
                </div>
              )}
              
              {/* Processing Status */}
              {isUploading && (
                <div className="text-center py-3 sm:py-4">
                  <div className="animate-pulse-glow inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-medical-blue/10 rounded-full">
                    <div className="w-2 h-2 bg-medical-blue rounded-full animate-pulse"></div>
                    <span className="text-medical-blue font-medium text-xs sm:text-sm">Processing prescription...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extracted Medications (visible to pharmacists only) */}
      {profile && profile.role === 'pharmacy' && extractedMeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-medical-green" />
              Extracted Medications & AI Warnings
            </CardTitle>
            <CardDescription>
              Review medications detected and pharmacist-facing AI warnings (interactions, side effects)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {extractedMeds.map((med, index) => (
                <Card key={index} className="border-l-4 border-l-medical-green">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{med.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`${
                              med.confidence > 0.9 
                                ? 'bg-medical-green/10 text-medical-green' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {Math.round(med.confidence * 100)}% confidence
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Dosage:</span>
                            <p className="font-medium">{med.dosage}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Frequency:</span>
                            <p className="font-medium">{med.frequency}</p>
                          </div>
                        </div>
                        {/* Show AI warnings if available */}
                        {med.analysis && (
                          <div className="mt-3 space-y-2">
                            {med.analysis.interactions && med.analysis.interactions.length > 0 && (
                              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="text-sm font-medium text-yellow-800">Drug Interaction Warnings</div>
                                <ul className="text-sm mt-1 list-disc pl-5">
                                  {med.analysis.interactions.map((i: string, ii: number) => (
                                    <li key={ii}>{i}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {med.analysis.sideEffects && med.analysis.sideEffects.length > 0 && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded">
                                <div className="text-sm font-medium text-red-800">Side Effects</div>
                                <ul className="text-sm mt-1 list-disc pl-5">
                                  {med.analysis.sideEffects.map((s: string, si: number) => (
                                    <li key={si}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => onDrugExtracted(med.name)}
                        size="sm"
                        className="bg-medical-teal/10 text-medical-teal hover:bg-medical-teal/20"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {extractedMeds.some(med => med.confidence < 0.9) && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Please verify extracted information</p>
                    <p className="text-yellow-700">
                      Some medications were extracted with lower confidence. Please double-check the details.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PrescriptionUpload;
