import { NavLink } from 'react-router-dom';
import { Home, Calculator, Target, TrendingUp, ArrowLeftRight } from 'lucide-react';

const tabs = [
  { to: '/dashboard',    icon: Home,           label: 'Home'         },
  { to: '/calculators',  icon: Calculator,     label: 'Calculators'  },
  { to: '/goals',        icon: Target,         label: 'Goals'        },
  { to: '/networth',     icon: TrendingUp,     label: 'Net Worth'    },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
];

export function BottomTabBar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e9e7e1] z-30 flex items-center justify-around h-16 px-1 lg:hidden">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [
              'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
              isActive ? 'text-[#01696f]' : 'text-[#7a7974]',
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <tab.icon className="w-5 h-5" />
              <span className={`text-[10px] font-medium ${isActive ? 'text-[#01696f]' : 'text-[#7a7974]'}`}>
                {tab.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
