
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-slate via-medical-mint to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-medical-blue hover:text-medical-blue/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto shadow-blue-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#00bfff] to-green-500 bg-clip-text text-transparent">
              Terms of Service
            </CardTitle>
            <p className="text-muted-foreground">Last updated: July 2025</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Important Fee Notice</h4>
                  <p className="text-yellow-700 text-sm mt-1">
                    By uploading prescriptions to pharmacies through DigiFarmacy, you may incur additional fees of LKR 100 or more for collection or delivery services. These fees are set by individual pharmacies and will be clearly displayed before confirmation.
                  </p>
                </div>
              </div>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using DigiFarmacy ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">2. Service Description</h2>
              <p className="text-gray-700 mb-3">
                DigiFarmacy is an AI-enhanced health companion that provides:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Pharmacy location services across Sri Lanka</li>
                <li>Prescription scanning and analysis using AI technology</li>
                <li>Multi-language voice assistance (English, Sinhala, Tamil)</li>
                <li>Drug information and safety warnings</li>
                <li>Laboratory booking services</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">3. User Responsibilities</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide accurate and up-to-date information during registration</li>
                <li>Use the service only for lawful purposes</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Verify prescription information with qualified healthcare professionals</li>
                <li>Comply with Sri Lanka's Personal Data Protection Act (PDPA)</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">4. Prescription and Medical Information</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium">Medical Disclaimer</p>
                <p className="text-blue-700 text-sm mt-1">
                  FarmaFinder is not a substitute for professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>AI analysis is for informational purposes only</li>
                <li>Users are responsible for verifying prescription accuracy</li>
                <li>Pharmacy fees for collection/delivery services may apply (LKR 100+)</li>
                <li>We do not guarantee drug availability at listed pharmacies</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">5. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-3">
                We are committed to protecting your privacy in accordance with Sri Lanka's PDPA:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Personal data is collected with explicit consent</li>
                <li>Medical information is encrypted and securely stored</li>
                <li>Data is not shared with third parties without consent</li>
                <li>Users have the right to access, correct, or delete their data</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">6. Pharmacy and Laboratory Partners</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All pharmacy partners are verified and licensed</li>
                <li>Laboratory partners hold valid SLMC registrations</li>
                <li>Service fees are determined by individual partners</li>
                <li>Quality of services is the responsibility of partner establishments</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                DigiFarmacy shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service. Our liability is limited to the maximum extent permitted by Sri Lankan law.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">8. Modifications to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through the application.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">9. Governing Law</h2>
              <p className="text-gray-700">
                These terms are governed by the laws of Sri Lanka. Any disputes shall be resolved in the courts of Colombo, Sri Lanka.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">10. Contact Information</h2>
              <p className="text-gray-700">
                For questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> support@digifarmacy.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +94 715883884</p>
                <p className="text-gray-700"><strong>Developer:</strong> Fixmation Technologies, Puttalam 61300</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
