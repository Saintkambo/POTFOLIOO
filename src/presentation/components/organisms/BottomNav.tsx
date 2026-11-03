import React from 'react';
import { LayoutDashboard, ListOrdered, BarChart3, Settings } from 'lucide-react';

export type NavigationTab = 'dashboard' | 'transactions' | 'reports' | 'settings';

interface BottomNavProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as const, label: 'Ledger', icon: ListOrdered },
    { id: 'reports' as const, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-surface border-2 border-blackstone rounded-3xl h-[66px] shadow-brutal flex items-center justify-around px-2 max-w-[400px] mx-auto w-full relative">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 h-full flex flex-col items-center justify-end pb-2 relative transition-all cursor-pointer neo-press-none select-none"
            aria-label={tab.label}
          >
            {isActive ? (
              <>
                {/* Raised Circular Active Icon extending noticeably above top edge */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-slate-navy text-white border-2 border-blackstone shadow-brutal flex items-center justify-center transition-transform active:scale-95">
                  <Icon className="w-5 h-5 text-white stroke-[2.2]" />
                </div>
                {/* Active Text Label aligned horizontally with other labels */}
                <span className="text-[10px] font-black font-heading text-blackstone leading-tight tracking-tight">
                  {tab.label}
                </span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 flex items-center justify-center mb-0.5">
                  <Icon className="w-5 h-5 text-blackstone/70 stroke-[1.8]" />
                </div>
                <span className="text-[10px] font-bold text-text-secondary leading-tight tracking-tight">
                  {tab.label}
                </span>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );
};
