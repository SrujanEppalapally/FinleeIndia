import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';

interface TopBarProps {
  title: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, actions }: TopBarProps) {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="h-14 bg-white border-b border-[#e9e7e1] flex items-center px-4 lg:px-6 flex-shrink-0 sticky top-0 z-20">
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden mr-3 text-[#7a7974] hover:text-[#28251d] transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="text-base font-semibold text-[#28251d] flex-1">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
