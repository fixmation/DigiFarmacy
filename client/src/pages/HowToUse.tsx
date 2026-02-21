import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MapPin, Camera, Mic, MessageCircle, Upload, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HowToUse: React.FC = () => {
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
              How to Use DigiFarmacy
            </CardTitle>
            <p className="text-muted-foreground">Your complete guide to using our AI-enhanced health companion</p>
          </CardHeader>

          <CardContent className="space-y-8">
            
            {/* Getting Started Section */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4 flex items-center gap-2">
                <Heart className="h-6 w-6" />
                Getting Started
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-medium">Welcome to DigiFarmacy!</p>
                <p className="text-green-700 text-sm mt-1">
                  No registration required to start using our basic features. Sign up for free to access premium features and save your data.
                </p>
              </div>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 text-sm ml-4">
                <li>Visit the DigiFarmacy homepage</li>
                <li>Choose from our main features: Find Pharmacies, Smart Scan, Voice AI, or Drug Info</li>
                <li>For enhanced features, click "Sign In / Sign Up" (completely free)</li>
                <li>Start exploring and managing your health information</li>
              </ol>
            </section>

            <Separator />

            {/* Find Pharmacies Section */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4 flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Finding Nearby Pharmacies
              </h2>
              <div className="space-y-3 text-gray-700 text-sm">
                <p><strong>Step 1:</strong> Click on the "Map" tab or the "Find Pharmacies" card</p>
                <p><strong>Step 2:</strong> Allow location access when prompted for best results</p>
                <p><strong>Step 3:</strong> Use the search bar to find pharmacies in specific areas</p>
                <p><strong>Step 4:</strong> View pharmacy details including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Operating hours and contact information</li>
                  <li>Available services and specializations</li>
                  <li>Distance from your location</li>
                  <li>Customer reviews and ratings</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Smart Scan Section */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4 flex items-center gap-2">
                <Camera className="h-6 w-6" />
                Smart Prescription Scanning
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800 font-medium">AI-Powered Analysis</p>
                <p className="text-blue-700 text-sm mt-1">
                  Our Gemini AI analyzes your prescription and provides detailed medication information, dietary recommendations, and safety warnings.
                </p>
              </div>
              <div className="space-y-3 text-gray-700 text-sm">
                <p><strong>Step 1:</strong> Click on "Smart Scan" tab or camera icon</p>
                <p><strong>Step 2:</strong> Take a clear photo of your prescription or upload an existing image</p>
                <p><strong>Step 3:</strong> Wait for AI analysis (usually takes 10-30 seconds)</p>
                <p><strong>Step 4:</strong> Review the extracted information:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Medication names and dosages</li>
                  <li>Usage instructions and frequency</li>
                  <li>Dietary recommendations</li>
                  <li>Potential side effects and warnings</li>
                </ul>
                <p><strong>Step 5:</strong> Generate a detailed PDF report for your records</p>
              </div>
            </section>

            <Separator />

            {/* Voice Assistant Section */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4 flex items-center gap-2">
                <Mic className="h-6 w-6" />
                Voice Assistant (Multi-Language)
              </h2>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                <p className="text-purple-800 font-medium">Multi-Language Support</p>
                <p className="text-purple-700 text-sm mt-1">
                  Communicate in English, Sinhala, or Tamil with high-quality voice synthesis powered by ElevenLabs.
                </p>
              </div>
              <div className="space-y-3 text-gray-700 text-sm">
                <p><strong>Step 1:</strong> Click on "Voice AI" tab</p>
                <p><strong>Step 2:</strong> Select your preferred language (English, Sinhala, Tamil)</p>
                <p><strong>Step 3:</strong> Choose voice type and speaking speed</p>
                <p><strong>Step 4:</strong> Click the microphone button and speak your health question</p>
                <p><strong>Step 5:</strong> Listen to the AI response in your chosen language</p>
                <p><strong>Available Features:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Drug information queries</li>
                  <li>Symptom discussions</li>
                  <li>Medication reminders</li>
                  <li>Health advice (general)</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Chat Support */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4 flex items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                Chat Assistant
              </h2>
              <div className="space-y-3 text-gray-700 text-sm">
                <p><strong>Step 1:</strong> Click on "Chat" tab</p>
                <p><strong>Step 2:</strong> Type your health-related questions</p>
                <p><strong>Step 3:</strong> Get instant AI-powered responses</p>
                <p><strong>Features:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Drug interaction checks</li>
                  <li>Side effect information</li>
                  <li>Dosage guidance</li>
                  <li>General health queries</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Drug Information */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4 flex items-center gap-2">
                <Upload className="h-6 w-6" />
                Drug Information Database
              </h2>
              <div className="space-y-3 text-gray-700 text-sm">
                <p><strong>Step 1:</strong> Click on "Drug Info" tab</p>
                <p><strong>Step 2:</strong> Search for specific medications by name</p>
                <p><strong>Step 3:</strong> Access comprehensive drug information including:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Generic and brand names</li>
                  <li>Usage and indications</li>
                  <li>Dosage information</li>
                  <li>Side effects and warnings</li>
                  <li>Drug interactions</li>
                  <li>Storage instructions</li>
                </ul>
              </div>
            </section>

            <Separator />

            {/* Privacy & Safety */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4">Privacy & Data Protection</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-medium">PDPA Compliant</p>
                <p className="text-yellow-700 text-sm mt-1">
                  We comply with Sri Lanka's Personal Data Protection Act (PDPA) to ensure your medical information is secure and private.
                </p>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm ml-4">
                <li>All prescription images are encrypted and securely stored</li>
                <li>Personal health data is never shared without consent</li>
                <li>You can delete your data at any time</li>
                <li>AI analysis is performed with privacy-first principles</li>
              </ul>
            </section>

            <Separator />

            {/* Support */}
            <section>
              <h2 className="text-2xl font-semibold text-medical-blue mb-4">Need Help?</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => navigate('/contact')}
                  className="bg-gradient-to-r from-[#00bfff] to-green-500 text-white"
                >
                  Contact Support
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/privacy')}
                >
                  Privacy Policy
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/terms')}
                >
                  Terms of Service
                </Button>
              </div>
            </section>

            {/* Bottom Back Button */}
            <div className="pt-8 border-t">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-medical-blue hover:text-medical-blue/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowToUse;
