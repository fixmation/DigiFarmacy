/**
 * @fileoverview Redesigned "How DigiFarmacy Works" section showing the 4-step process
 */
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Camera, Mic, FileText, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HowDigiFarmacyWorks: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: 'Find Pharmacies',
      icon: MapPin,
      color: 'from-orange-500 to-green-500',
      bgColor: 'bg-orange-50',
      description: 'Search and locate verified pharmacies on our interactive map with real-time information',
      features: ['Location-based search', 'Verified pharmacies', 'Real-time availability']
    },
    {
      number: 2,
      title: 'Smart Scan',
      icon: Camera,
      color: 'from-blue-500 to-green-500',
      bgColor: 'bg-blue-50',
      description: 'Scan medicine barcodes and batch numbers for instant validation and information',
      features: ['Batch scanning', 'Barcode recognition', 'GS1 parsing']
    },
    {
      number: 3,
      title: 'Enhanced Voice AI',
      icon: Mic,
      color: 'from-pink-500 to-green-500',
      bgColor: 'bg-pink-50',
      description: 'Talk to our AI assistant for drug interactions, side effects, and pharmacy guidance',
      features: ['Multi-language support', 'Drug analysis', 'Real-time assistance']
    },
    {
      number: 4,
      title: 'Smart Reports',
      icon: FileText,
      color: 'from-yellow-500 to-green-500',
      bgColor: 'bg-yellow-50',
      description: 'Generate NMRA-compliant PDF reports for temperature logs and medicine batches',
      features: ['Temperature monitoring', 'PDF generation', 'NMRA compliance']
    }
  ];

  return (
    <div className="w-full py-8 md:py-16 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          How DigiFarmacy Works
        </h2>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          A comprehensive pharmacy ecosystem built for pharmacists and laboratories. Manage medicines, monitor storage conditions, and ensure regulatory compliance.
        </p>
      </div>

      {/* Steps Grid */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="flex flex-col">
                {/* Step Card */}
                <Card className={`flex-1 ${step.bgColor} border-2 border-gray-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 overflow-hidden`}>
                  <CardContent className="p-6">
                    {/* Number Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {step.number}
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-md`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2">
                      {step.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-500"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Arrow Connector */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex justify-center py-4">
                    <ArrowRight className="h-6 w-6 text-gray-400 transform rotate-90 lg:rotate-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <Button
          onClick={() => navigate('/workflow')}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto"
        >
          Explore Full Workflow
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default HowDigiFarmacyWorks;
