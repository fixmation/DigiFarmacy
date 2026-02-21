/**
 * @fileoverview Subscription Pricing Cards for Pharmacy & Laboratory businesses
 */
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Building2, Beaker, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionPricing: React.FC = () => {
  const navigate = useNavigate();

  const subscriptions = [
    {
      id: 'pharmacy',
      type: 'Pharmacy',
      icon: Building2,
      price: '2,500',
      currency: 'LKR',
      period: '/Month',
      description: 'Complete pharmacy operations management system',
      color: 'from-blue-600 to-blue-400',
      badge: 'Popular',
      features: [
        'Batch scanning and tracking',
        'Inventory management system',
        'Temperature monitoring (cold chain)',
        'NMRA compliance reports (PDF)',
        'Medicine expiry automation',
        'Real-time alerts and notifications',
        'Dashboard analytics',
        'Pharmacist role access',
        'Up to 5 staff accounts',
        'Priority support'
      ],
      buttonText: 'Subscribe Now',
      highlighted: true
    },
    {
      id: 'laboratory',
      type: 'Laboratory',
      icon: Beaker,
      price: '1,500',
      currency: 'LKR',
      period: '/Month',
      description: 'Laboratory information management system',
      color: 'from-green-600 to-green-400',
      badge: 'Affordable',
      features: [
        'Test request management',
        'Sample tracking system',
        'Results reporting',
        'Basic analytics dashboard',
        'Staff management (up to 3 users)',
        'Patient record security',
        'Email notifications',
        'API access for integrations',
        'Monthly data backups',
        'Email support'
      ],
      buttonText: 'Subscribe Now',
      highlighted: false
    }
  ];

  return (
    <div className="w-full py-8 md:py-16 px-4 sm:px-6 lg:px-8 bg-transparent">
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Choose the perfect plan for your pharmacy or laboratory. Subscription includes all core features and support.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {subscriptions.map((sub) => {
            const IconComponent = sub.icon;
            return (
              <Card
                key={sub.id}
                style={{ 
                  backgroundColor: sub.highlighted 
                    ? 'rgba(59, 130, 246, 0.25)' 
                    : 'rgba(168, 85, 247, 0.25)'
                }}
                className={`relative border transition-all duration-300 hover:shadow-2xl overflow-hidden backdrop-blur-md ${
                  sub.highlighted
                    ? 'border-blue-300/60 shadow-lg hover:shadow-blue-lg hover:border-blue-400/80'
                    : 'border-violet-300/60 hover:border-violet-400/80 hover:shadow-2xl'
                }`}
              >
                {/* Glassmorphism Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-transparent pointer-events-none rounded-lg"></div>

                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge
                    className={`bg-gradient-to-r ${sub.color} text-white border-0 px-3 py-1 text-sm font-semibold`}
                  >
                    {sub.badge}
                  </Badge>
                </div>

                <CardHeader className="pb-6 relative z-10">
                  {/* Icon */}
                  <div className="mb-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center shadow-lg backdrop-blur-sm`}
                    >
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="mb-4">
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                      {sub.type}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                      {sub.description}
                    </CardDescription>
                  </div>

                  {/* Pricing */}
                  <div className="backdrop-blur-sm border border-white/30 rounded-lg p-4 mb-4 bg-transparent">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold text-gray-700">{sub.currency}</span>
                      <span className="text-4xl font-bold text-gray-900">{sub.price}</span>
                      <span className="text-sm text-gray-700">{sub.period}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      Cancel anytime. No long-term contracts.
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10">
                  {/* Features List */}
                  <div className="mb-6 space-y-3 backdrop-blur-sm border border-white/30 rounded-lg p-4 bg-transparent">
                    {sub.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-800">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Button
                    onClick={() => navigate('/login')}
                    className={`w-full py-2 text-base font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                      sub.highlighted
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {sub.buttonText}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  {/* Footer Note */}
                  <p className="text-xs text-gray-600 text-center mt-4">
                    Secure payment processing via Stripe
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* FAQ / Additional Info */}
      <div className="max-w-3xl mx-auto backdrop-blur-xl border border-white/30 rounded-lg p-6 md:p-8 bg-transparent">
        <h3 className="text-lg font-bold text-gray-900 mb-4">What's Included?</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">All plans include:</p>
              <p className="text-gray-700 text-sm">24/7 technical support, automatic backups, and security updates</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">No setup fees or hidden charges</p>
              <p className="text-gray-700 text-sm">Only pay the monthly subscription. Cancel anytime without penalties.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">NMRA Compliance Ready</p>
              <p className="text-gray-700 text-sm">Built to meet Sri Lankan pharmaceutical regulations and standards</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPricing;
