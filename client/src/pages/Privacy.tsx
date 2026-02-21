import React from 'react';
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle, Clock, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PageLayout from '@/components/PageLayout';

const Privacy = () => {
  return (
    <PageLayout title="Privacy Policy">
        <div className="min-h-screen bg-gradient-to-br from-white to-[#7aebcf]/20">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#7aebcf] to-blue-500 rounded-full mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your privacy and data protection are our highest priorities
          </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
          {/* Overview */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Introduction</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <p className="mb-3">
                DigiFarmacy ("we," "us," "our," or "Company") is committed to protecting your privacy and ensuring you have a positive experience on our app. 
                This Privacy Policy explains our information practices and the choices you can make about the way your information is collected and used.
              </p>
              <p>
                This policy applies to all users of the DigiFarmacy mobile application and web services. If you do not agree with our policies and practices, 
                please do not use our services.
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Name, email address, and phone number</li>
                  <li>• Location data for pharmacy recommendations</li>
                  <li>• Prescription images and medical information</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Device Information</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Device type, operating system, and app version</li>
                  <li>• Advertising ID and device identifiers</li>
                  <li>• Crash reports and app performance data</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Sensitive Health Information</h4>
                <ul className="text-sm text-gray-600 space-y-1 ml-4">
                  <li>• Prescription details and medication information</li>
                  <li>• Drug interaction data and allergies</li>
                  <li>• Health preferences and medical history</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#7aebcf] rounded-full mt-2 flex-shrink-0"></div>
                  Provide personalized pharmacy and laboratory recommendations
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#7aebcf] rounded-full mt-2 flex-shrink-0"></div>
                  Process prescription analysis and medication information
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#7aebcf] rounded-full mt-2 flex-shrink-0"></div>
                  Improve our AI algorithms and service quality
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#7aebcf] rounded-full mt-2 flex-shrink-0"></div>
                  Send important notifications about your bookings and prescriptions
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-[#7aebcf] rounded-full mt-2 flex-shrink-0"></div>
                  Comply with healthcare regulations and legal requirements
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Protection & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Encryption & Storage</h4>
                <p className="text-sm text-gray-600">
                  All personal and medical data is encrypted both in transit and at rest using industry-standard encryption protocols. 
                  Your prescription images are stored securely and automatically deleted after 30 days.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Access Controls</h4>
                <p className="text-sm text-gray-600">
                  Only authorized personnel have access to your data, and all access is logged and monitored. 
                  We use multi-factor authentication and regular security audits to protect your information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Rights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Your Rights & Choices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Access & Portability</h4>
                  <p className="text-sm text-gray-600">
                    Request a copy of your personal data and download your information at any time.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Correction & Updates</h4>
                  <p className="text-sm text-gray-600">
                    Update or correct your personal information through your account settings.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Data Deletion</h4>
                  <p className="text-sm text-gray-600">
                    Request deletion of your account and all associated data permanently.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Opt-out Options</h4>
                  <p className="text-sm text-gray-600">
                    Control communication preferences and data processing activities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                We work with trusted partners to provide our services:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• <strong>Mapbox:</strong> Location services and pharmacy mapping</li>
                <li>• <strong>Cloud Storage:</strong> Secure prescription image storage</li>
                <li>• <strong>AI Services:</strong> Prescription analysis and drug information</li>
                <li>• <strong>Payment Processors:</strong> Secure transaction processing</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">
                All third-party services are required to maintain the same level of data protection 
                and are bound by strict confidentiality agreements.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions about this Privacy Policy or your data:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> support@digifarmacy.com</p>
                <p><strong>Phone:</strong> +94 715883884</p>
                <p><strong>Developer:</strong> Fixmation Technologies, Puttalam 61300</p>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="h-5 w-5" />
                Children's Privacy (COPPA Compliance)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-800">
                DigiFarmacy is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. 
                If we learn that we have collected personal information from a child under 13, we will promptly delete such information. 
                If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Retention Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">How Long We Keep Your Data:</h4>
                <ul className="text-sm text-gray-600 space-y-2 ml-4">
                  <li>• <strong>Account Information:</strong> Retained while your account is active and for 6 months after deletion</li>
                  <li>• <strong>Prescription Images:</strong> Deleted automatically after 30 days</li>
                  <li>• <strong>Transaction Records:</strong> Kept for 7 years for legal and compliance purposes</li>
                  <li>• <strong>Usage Analytics:</strong> Aggregated data retained indefinitely; personal identifiers removed after 12 months</li>
                  <li>• <strong>Customer Support Interactions:</strong> Retained for 2 years</li>
                </ul>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  You may request deletion of your data at any time by contacting our support team.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* International Data Transfer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Your information may be transferred to, stored in, and processed in countries other than your country of residence. 
                These countries may not have the same data protection laws as your home country.
              </p>
              <p className="text-sm text-gray-600">
                When we transfer data internationally, we implement safeguards including encryption, contractual data protection addendums, 
                and standard contractual clauses to ensure your information remains protected.
              </p>
            </CardContent>
          </Card>

          {/* Policy Changes */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, and other factors. 
                We will notify you of any material changes by updating the "Last Updated" date of this Privacy Policy.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold">
                  Your continued use of DigiFarmacy after changes become effective constitutes your acceptance of the updated Privacy Policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Developer Information */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle>About DigiFarmacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">About DigiFarmacy</h4>
                <p className="text-sm text-gray-600 mb-3">
                  DigiFarmacy is developed and maintained by Fixmation Technologies, based in Puttalam 61300, Sri Lanka.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Notices */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Regulatory Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-green-900">Sri Lanka's Personal Data Protection Act (PDPA)</h4>
                <p className="text-sm text-green-800">
                  This Privacy Policy complies with Sri Lanka's Personal Data Protection Act No. 9 of 2022. 
                  <a href="/pdpa" className="text-blue-600 hover:underline ml-1">Learn more about PDPA compliance</a>
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-green-900">Google Play Store Compliance</h4>
                <p className="text-sm text-green-800">
                  This app complies with all Google Play Store policies regarding user data privacy and security requirements.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-green-900">Healthcare Data Protection</h4>
                <p className="text-sm text-green-800">
                  All sensitive health information is treated as per international healthcare data protection standards and practices.
                </p>
              </div>
            </CardContent>
          </Card>
            </div>
          </div>
        </div>
    </PageLayout>
  );
};

export default Privacy;