import { NavLink, Outlet } from 'react-router-dom';
import { User, Tag } from 'lucide-react';

const TABS = [
  { to: '/settings/profile', icon: User, label: 'Profile' },
  { to: '/settings/categories', icon: Tag, label: 'Categories' },
];

export function SettingsLayout() {
  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* Mobile: horizontal scrollable tab strip */}
      <nav className="lg:hidden w-full flex gap-1 overflow-x-auto bg-white rounded-[8px] shadow-card p-1 flex-shrink-0">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 px-4 py-2 rounded-[6px] text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'bg-[#01696f] text-white'
                  : 'text-[#7a7974] hover:bg-[#f7f6f2] hover:text-[#28251d]',
              ].join(' ')
            }
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Desktop: vertical tab list */}
      <nav className="hidden lg:flex flex-col w-[180px] flex-shrink-0 bg-white rounded-[8px] shadow-card p-2 sticky top-6">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#01696f] text-white'
                  : 'text-[#7a7974] hover:bg-[#f7f6f2] hover:text-[#28251d]',
              ].join(' ')
            }
          >
            <tab.icon className="w-4 h-4 flex-shrink-0" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
