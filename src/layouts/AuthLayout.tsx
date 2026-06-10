import { Outlet } from 'react-router-dom';
import { Wallet } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#01696f]/5 via-[#f7f6f2] to-[#01696f]/8 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#01696f] rounded-[8px] flex items-center justify-center mb-3 shadow-card-md">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-[#28251d]">Finley</span>
          <p className="text-sm text-[#7a7974] mt-1">Personal Finance for India</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-[8px] shadow-card-md p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
