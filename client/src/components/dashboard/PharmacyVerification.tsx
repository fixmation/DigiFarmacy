
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/useAuth';
import { toast } from 'sonner';

interface PharmacyVerificationProps {
  pharmacyDetails: any;
  onUpdate: () => void;
}

export const PharmacyVerification: React.FC<PharmacyVerificationProps> = ({ 
  pharmacyDetails, 
  onUpdate 
}) => {
  const { profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: pharmacyDetails?.business_name || '',
    registrationNumber: pharmacyDetails?.registration_number || '',
    address: pharmacyDetails?.address || '',
    contactPhone: pharmacyDetails?.contact_phone || '',
    contactEmail: pharmacyDetails?.contact_email || '',
    operatingHours: pharmacyDetails?.operating_hours || {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '18:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    }
  });

  const uploadDocument = async (file: File, documentType: 'certificate' | 'registration') => {
    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}/${documentType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pharmacy-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pharmacy-documents')
        .getPublicUrl(fileName);

      // Update pharmacy details with document URL
      const updateField = documentType === 'certificate' ? 
        'pharmacist_certificate_url' : 'business_registration_url';

      const { error: updateError } = await supabase
        .from('pharmacy_details')
        .update({ [updateField]: publicUrl })
        .eq('user_id', profile?.id);

      if (updateError) throw updateError;

      toast.success(`${documentType === 'certificate' ? 'Certificate' : 'Registration'} uploaded successfully`);
      onUpdate();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, documentType: 'certificate' | 'registration') => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocument(file, documentType);
    }
  };

  const savePharmacyDetails = async () => {
    try {
      if (!pharmacyDetails) {
        // Create new pharmacy details
        const { error } = await supabase
          .from('pharmacy_details')
          .insert({
            user_id: profile?.id,
            business_name: formData.businessName,
            registration_number: formData.registrationNumber,
            address: formData.address,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail,
            operating_hours: formData.operatingHours
          });

        if (error) throw error;
      } else {
        // Update existing pharmacy details
        const { error } = await supabase
          .from('pharmacy_details')
          .update({
            business_name: formData.businessName,
            registration_number: formData.registrationNumber,
            address: formData.address,
            contact_phone: formData.contactPhone,
            contact_email: formData.contactEmail,
            operating_hours: formData.operatingHours
          })
          .eq('user_id', profile?.id);

        if (error) throw error;
      }

      toast.success('Pharmacy details saved successfully');
      onUpdate();
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save pharmacy details');
    }
  };

  const getVerificationStatus = () => {
    if (!pharmacyDetails) return 'incomplete';
    if (pharmacyDetails.verified_at) return 'verified';
    if (profile?.status === 'pending') return 'pending';
    if (profile?.status === 'rejected') return 'rejected';
    return 'incomplete';
  };

  const status = getVerificationStatus();

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {status === 'verified' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : status === 'pending' ? (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={
                status === 'verified' ? 'default' : 
                status === 'pending' ? 'secondary' : 'destructive'
              }>
                {status === 'verified' ? 'Verified' :
                 status === 'pending' ? 'Pending Review' :
                 status === 'rejected' ? 'Rejected' : 'Incomplete'}
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {status === 'verified' && 'Your pharmacy is verified and discoverable on the map.'}
                {status === 'pending' && 'Your documents are being reviewed by our team.'}
                {status === 'rejected' && 'Please check the verification notes and resubmit.'}
                {status === 'incomplete' && 'Complete your profile and upload required documents.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Details Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Complete your pharmacy business details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="ABC Pharmacy"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registration-number">Registration Number</Label>
              <Input
                id="registration-number"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="PH/2024/001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Complete address with city and postal code"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact Phone</Label>
              <Input
                id="contact-phone"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+94 11 234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Contact Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="info@abcpharmacy.lk"
              />
            </div>
          </div>

          <Button onClick={savePharmacyDetails}>
            Save Business Details
          </Button>
        </CardContent>
      </Card>

      {/* Document Upload */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Pharmacist Certificate
            </CardTitle>
            <CardDescription>
              Upload your valid pharmacist certificate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pharmacyDetails?.pharmacist_certificate_url ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Certificate uploaded</span>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload certificate
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'certificate')}
                  className="hidden"
                  id="certificate-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('certificate-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Certificate'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Business Registration
            </CardTitle>
            <CardDescription>
              Upload your business registration document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pharmacyDetails?.business_registration_url ? (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Registration uploaded</span>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload registration
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileUpload(e, 'registration')}
                  className="hidden"
                  id="registration-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('registration-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Registration'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
