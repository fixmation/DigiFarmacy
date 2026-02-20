
import React from 'react';
import { MapPin, Camera, Mic, MessageCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'upload', label: 'Scan', icon: Camera },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'drugs', label: 'Drugs', icon: Upload },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-blue-lg z-50 md:hidden">
      <div className="flex justify-around items-center py-2 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-1 sm:px-2 py-2 min-w-0 text-xs sm:text-sm ${
                isActive 
                  ? 'text-medical-blue bg-blue-50' 
                  : 'text-gray-600 hover:text-medical-blue'
              }`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="font-medium truncate">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
