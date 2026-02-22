
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, AlertTriangle, Shield } from 'lucide-react';
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
            <p className="text-muted-foreground">Last updated: February 2026</p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-800">Security & Authentication Update</h4>
                  <p className="text-blue-700 text-sm mt-1">
                    DigiFarmacy now employs enterprise-grade bcrypt password hashing, role-based access control (Pharmacy, Laboratory, Admin), and secure API endpoints for all authentication and data operations. Your account is protected with military-grade encryption.
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
                DigiFarmacy is an AI-enhanced health companion platform that provides:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Real-time pharmacy and laboratory location services across Sri Lanka</li>
                <li>Advanced prescription scanning and OCR-powered analysis using AI technology</li>
                <li>Multi-language voice assistance (English, Sinhala, Tamil)</li>
                <li>Comprehensive drug information database with safety warnings and alternatives</li>
                <li>Laboratory booking and test scheduling services</li>
                <li>Pharmacy and Laboratory operations dashboards with inventory management</li>
                <li>Batch tracking and medicine stock rotation optimization</li>
                <li>Commission-based transaction tracking for pharmacies and laboratories</li>
                <li>Role-based access control with secure authentication for different user types</li>
                <li>NMRA-verified pharmaceutical database with pricing information</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">3. User Accounts and Roles</h2>
              <p className="text-gray-700 mb-3">
                DigiFarmacy supports multiple user roles with specific permissions:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="font-semibold text-green-800">Pharmacy Users</p>
                  <p className="text-sm text-green-700 mt-1">Access operations dashboard, inventory management, prescription processing, and commission tracking.</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="font-semibold text-blue-800">Laboratory Users</p>
                  <p className="text-sm text-blue-700 mt-1">Manage test bookings, scheduling, results processing, and commission analytics.</p>
                </div>
                <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                  <p className="font-semibold text-purple-800">Admin Users</p>
                  <p className="text-sm text-purple-700 mt-1">System administration, user verification, partner management, and platform oversight (requires secret key).</p>
                </div>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="font-semibold text-gray-800">Customer Users</p>
                  <p className="text-sm text-gray-700 mt-1">Access public pharmacy/lab locations, view drug information, and use voice assistance.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-3">
                User Responsibilities:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Provide accurate and verifiable business information during registration</li>
                <li>Maintain confidentiality of account credentials and authentication tokens</li>
                <li>Comply with Sri Lanka's regulations and the Personal Data Protection Act (PDPA)</li>
                <li>Use the service only for authorized, lawful purposes</li>
                <li>Report security breaches or unauthorized access immediately</li>
                <li>Pharmacists and lab directors must personally verify prescription and test data</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">4. Prescription and Medical Information</h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-medium">WARNING: Medical Disclaimer</p>
                <p className="text-red-700 text-sm mt-1">
                  DigiFarmacy is NOT a substitute for professional medical advice, diagnosis, or treatment. AI analysis is for informational purposes only. Always consult with licensed healthcare providers before making medical decisions.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Prescription data is processed through secure encrypted channels</li>
                <li>OCR and AI analysis is automated but always requires human verification by licensed professionals</li>
                <li>Users are responsible for verifying prescription accuracy before confirmation</li>
                <li>Pharmacists must manually confirm all prescription details against original documents</li>
                <li>Prescription images are encrypted and purged after 30 days</li>
                <li>Drug availability at pharmacies is not guaranteed; inventory varies by location</li>
                <li>Price information is updated in real-time from partner establishments</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">5. Privacy, Security & Data Protection</h2>
              <p className="text-gray-700 mb-3">
                We are committed to protecting your privacy in accordance with Sri Lanka's PDPA and international security standards:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All passwords are hashed using bcrypt (12 rounds) - we never store plain text passwords</li>
                <li>Personal and medical data is encrypted at rest and in transit (HTTPS/TLS)</li>
                <li>Data collection requires explicit informed consent from users</li>
                <li>Medical information is segmented and access-controlled by role</li>
                <li>Data is not shared with third parties without explicit consent</li>
                <li>Users have the right to access, correct, update, or delete their data</li>
                <li>Session tokens expire automatically for security</li>
                <li>Audit logs track all administrative actions for security compliance</li>
                <li>Pharmacy and lab partners must comply with PDPA and healthcare regulations</li>
                <li>Prescription images are retained for 30 days then permanently deleted</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">6. Pharmacy and Laboratory Partners</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>All pharmacy partners must hold valid NMRA (National Medicines Regulatory Authority) licenses</li>
                <li>Laboratory partners must be SLMC (Sri Lanka Medical Council) registered</li>
                <li>Partners are responsible for accurate inventory, pricing, and availability information</li>
                <li>Partner establishments must maintain business hours as displayed in the system</li>
                <li>Quality of services and products is the responsibility of the partner establishment</li>
                <li>Disputes regarding services should be resolved directly between customers and partners</li>
                <li>DigiFarmacy reserves the right to verify partner credentials and audit compliance</li>
                <li>Partners must maintain PDPA compliance for customer data shared through the platform</li>
                <li>Commission calculations are based on actual verified transactions</li>
                <li>Partners must update their business information within 7 days of any changes</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">7. Admin Authentication & System Access</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Administrator accounts are created only with correct authentication credentials</li>
                <li>Initial admin setup requires a secure secret key (environment-controlled)</li>
                <li>Multi-factor authentication considerations may be required for future releases</li>
                <li>Admin actions are logged and auditable for compliance and security</li>
                <li>Admins have elevated permissions for user verification and platform management</li>
                <li>Admin privileges should not be shared or delegated without explicit authorization</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">8. Operations Dashboard & Inventory Management</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Pharmacy and laboratory dashboards provide real-time inventory tracking</li>
                <li>Batch tracking enables monitoring of expiry dates and stock rotation</li>
                <li>Medicine cost price and selling price data must be maintained accurate</li>
                <li>Stock count discrepancies must be reported to system administrators</li>
                <li>Promotional medicines must be clearly flagged in the inventory system</li>
                <li>Automated alerts are generated for inventory below minimum thresholds</li>
                <li>Historical data and transaction records are retained for 12 months</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">9. AI & Automated Features</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>AI-powered prescription analysis is probabilistic and may contain errors</li>
                <li>OCR technology has accuracy limitations for handwritten prescriptions</li>
                <li>Drug interaction warnings are informational and not exhaustive</li>
                <li>Alternative drug suggestions are based on therapeutic category only</li>
                <li>Voice assistant responses are generated by AI and may require verification</li>
                <li>Automated alerts and recommendations should be reviewed by qualified professionals</li>
                <li>DigiFarmacy continuously improves AI models using anonymized, aggregated data</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-3">
                DigiFarmacy shall not be liable for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Indirect, incidental, special, consequential, or punitive damages</li>
                <li>Service interruptions, data loss, or system failures beyond reasonable control</li>
                <li>Errors or omissions in prescription analysis or OCR processing</li>
                <li>Inaccurate drug information or pharmaceutical data</li>
                <li>Actions or omissions of pharmacy or laboratory partners</li>
                <li>Third-party systems, integrations, or APIs that fail or become unavailable</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Our total liability is limited to the maximum extent permitted by Sri Lankan law. In no event shall DigiFarmacy's liability exceed LKR 100,000 for any claim.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">11. Modifications to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes via email or through the application. Continued use of the service after changes constitute acceptance of the updated terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">12. Termination & Account Suspension</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>DigiFarmacy reserves the right to suspend or terminate accounts for PDPA violations</li>
                <li>Misuse of admin privileges will result in immediate account termination</li>
                <li>Pharmacy or lab partners may be removed for regulatory non-compliance</li>
                <li>Users may request account deletion at any time via support contact</li>
                <li>Terminated accounts will have their data permanently deleted within 30 days</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">13. Governing Law</h2>
              <p className="text-gray-700">
                These terms are governed by the laws of Sri Lanka, specifically subject to the Personal Data Protection Act (PDPA) 2022 and relevant pharmaceutical regulations. Any disputes shall be resolved in the courts of Colombo, Sri Lanka.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold text-medical-blue mb-3">14. Contact Information</h2>
              <p className="text-gray-700 mb-3">
                For questions about these Terms of Service, privacy concerns, or to exercise your PDPA rights, please contact:
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                <p className="text-gray-700"><strong>Email:</strong> support@digifarmacy.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> +94 715883884</p>
                <p className="text-gray-700"><strong>Developer:</strong> Fixmation Technologies</p>
                <p className="text-gray-700"><strong>Location:</strong> Puttalam 61300, Sri Lanka</p>
                <p className="text-gray-700"><strong>Response Time:</strong> Within 48 hours for all inquiries</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
