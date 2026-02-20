import React, { useState } from 'react';
import { MapPin, Camera, Mic, MessageCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  hoverClass: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const tabs: TabConfig[] = [
    { 
      id: 'map', 
      label: 'Map', 
      icon: <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />,
      activeClass: 'bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg scale-105',
      hoverClass: 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-md scale-105'
    },
    { 
      id: 'upload', 
      label: 'Scan', 
      icon: <Camera className="h-4 w-4 sm:h-5 sm:w-5" />,
      activeClass: 'bg-gradient-to-br from-green-600 to-green-500 text-white shadow-lg scale-105',
      hoverClass: 'bg-gradient-to-br from-green-500 to-emerald-400 text-white shadow-md scale-105'
    },
    { 
      id: 'voice', 
      label: 'Voice', 
      icon: <Mic className="h-4 w-4 sm:h-5 sm:w-5" />,
      activeClass: 'bg-gradient-to-br from-purple-600 to-purple-500 text-white shadow-lg scale-105',
      hoverClass: 'bg-gradient-to-br from-purple-500 to-pink-400 text-white shadow-md scale-105'
    },
    { 
      id: 'chat', 
      label: 'Chat', 
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
      activeClass: 'bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-lg scale-105',
      hoverClass: 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-md scale-105'
    },
    { 
      id: 'drugs', 
      label: 'Drugs', 
      icon: <Upload className="h-4 w-4 sm:h-5 sm:w-5" />,
      activeClass: 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg scale-105',
      hoverClass: 'bg-gradient-to-br from-red-500 to-pink-400 text-white shadow-md scale-105'
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-white/20 shadow-2xl z-50 md:hidden">
      <div className="flex justify-around items-center py-2 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          
          let buttonClass = 'flex flex-col items-center gap-0.5 px-1 sm:px-2 py-2 min-w-0 text-xs sm:text-sm rounded-lg transition-all duration-200 font-medium';
          
          if (isActive) {
            buttonClass += ` ${tab.activeClass}`;
          } else if (isHovered) {
            buttonClass += ` ${tab.hoverClass}`;
          } else {
            buttonClass += ' text-gray-600 hover:text-gray-800';
          }
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              className={buttonClass}
            >
              {tab.icon}
              <span className="truncate">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};
