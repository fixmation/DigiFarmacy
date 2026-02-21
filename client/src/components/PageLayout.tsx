import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from './Footer';
import LanguageSelector from './LanguageSelector';

interface PageLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backUrl?: string;
  title?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  showBackButton = true, 
  backUrl = '/',
  title 
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Back Button */}
      {showBackButton && (
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Link to={backUrl}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-gradient-to-r from-[#00bfff] to-green-500 hover:from-[#0099cc] hover:to-green-600 text-white border-none"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
                {title && (
                  <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                )}
              </div>
              <LanguageSelector />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer - Hidden on Mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default PageLayout;