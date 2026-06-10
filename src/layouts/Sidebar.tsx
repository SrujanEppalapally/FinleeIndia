import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  Target,
  Calculator,
  Settings,
  LogOut,
  Wallet,
  X,
} from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/budget', icon: PiggyBank, label: 'Budget' },
  { to: '/networth', icon: TrendingUp, label: 'Net Worth' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/calculators', icon: Calculator, label: 'Calculators' },
  { to: '/settings/profile', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { userName, logout } = useAuth();

  const linkClasses = (isActive: boolean) =>
    [
      'flex items-center gap-3 rounded-[6px] transition-colors duration-150 text-sm font-medium',
      collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
      isActive
        ? 'bg-[#01696f] text-white'
        : 'text-[#7a7974] hover:bg-[#f7f6f2] hover:text-[#28251d]',
    ].join(' ');

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-[#e9e7e1] flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-[#01696f] rounded-[8px] flex items-center justify-center flex-shrink-0">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold text-[#28251d]">Finley</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => linkClasses(isActive)}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className={`border-t border-[#e9e7e1] px-3 py-3 flex-shrink-0 ${collapsed ? 'flex flex-col items-center gap-2' : 'flex items-center gap-3'}`}>
        <div className="w-8 h-8 rounded-full bg-[#01696f]/10 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-[#01696f]">
            {userName.split(' ').map((n) => n[0]).join('')}
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#28251d] truncate">{userName}</p>
            <p className="text-xs text-[#7a7974] truncate">Personal Account</p>
          </div>
        )}
        <button
          onClick={logout}
          className={`text-[#7a7974] hover:text-[#a12c7b] transition-colors ${collapsed ? 'p-1' : ''}`}
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={[
          'fixed top-0 left-0 h-full bg-white z-50 w-[240px] flex flex-col transition-transform duration-200 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-3 text-[#7a7974] hover:text-[#28251d] z-10"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={[
          'hidden lg:flex flex-col h-screen bg-white border-r border-[#e9e7e1] flex-shrink-0 sticky top-0 transition-all duration-200',
          collapsed ? 'w-[68px]' : 'w-[240px]',
        ].join(' ')}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
