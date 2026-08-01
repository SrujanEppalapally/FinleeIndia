import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { TopBarActionsProvider } from './contexts/TopBarActionsContext';
import { AppShell } from './layouts/AppShell';
import { AuthLayout } from './layouts/AuthLayout';
import { ComponentsPage } from './pages/ComponentsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/app/DashboardPage';
import { TransactionsPage } from './pages/app/TransactionsPage';
import { BudgetPage } from './pages/app/BudgetPage';
import { NetWorthPage } from './pages/app/NetWorthPage';
import { CalculatorsPage } from './pages/app/CalculatorsPage';
import { SipCalculatorPage } from './pages/app/calculators/SipCalculatorPage';
import { EmiCalculatorPage } from './pages/app/calculators/EmiCalculatorPage';
import { RetirementCalculatorPage } from './pages/app/calculators/RetirementCalculatorPage';
import { CtcInhandCalculatorPage } from './pages/app/calculators/CtcInhandCalculatorPage';
import { TaxRegimeCalculatorPage } from './pages/app/calculators/TaxRegimeCalculatorPage';
import { DreamHouseCalculatorPage } from './pages/app/calculators/DreamHouseCalculatorPage';
import { DreamVehicleCalculatorPage } from './pages/app/calculators/DreamVehicleCalculatorPage';
import { FireCalculatorPage } from './pages/app/calculators/FireCalculatorPage';
import { TripBudgetCalculatorPage } from './pages/app/calculators/TripBudgetCalculatorPage';
import { RentalYieldCalculatorPage } from './pages/app/calculators/RentalYieldCalculatorPage';
import { LumpsumVsSipCalculatorPage } from './pages/app/calculators/LumpsumVsSipCalculatorPage';
import { DebtPayoffCalculatorPage } from './pages/app/calculators/DebtPayoffCalculatorPage';
import { MonthlyBudgetPlannerPage } from './pages/app/calculators/MonthlyBudgetPlannerPage';
import { ProfilePage } from './pages/app/ProfilePage';
import { CategoriesPage } from './pages/app/CategoriesPage';
import { SettingsLayout } from './layouts/SettingsLayout';
import { GoalsPage } from './pages/app/goals/GoalsPage';
import { GoalDetailPage } from './pages/app/goals/GoalDetailPage';

function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RedirectIfAuth() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

function PageFade({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-fade contents">
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<RedirectIfAuth />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>
      </Route>

      {/* Protected app routes */}
      <Route element={<RequireAuth />}>
        <Route element={<SidebarProvider />}>
          <Route element={<TopBarActionsProvider />}>
            <Route path="/dashboard" element={<AppShell title="Dashboard" />}>
              <Route index element={<PageFade><DashboardPage /></PageFade>} />
            </Route>
            <Route path="/transactions" element={<AppShell title="Transactions" />}>
              <Route index element={<PageFade><TransactionsPage /></PageFade>} />
            </Route>
            <Route path="/budget" element={<AppShell title="Budget" />}>
              <Route index element={<PageFade><BudgetPage /></PageFade>} />
            </Route>
            <Route path="/networth" element={<AppShell title="Net Worth" />}>
              <Route index element={<PageFade><NetWorthPage /></PageFade>} />
            </Route>
            <Route path="/goals" element={<AppShell title="My Goals" />}>
              <Route index element={<PageFade><GoalsPage /></PageFade>} />
              <Route path=":id" element={<PageFade><GoalDetailPage /></PageFade>} />
            </Route>
            <Route path="/calculators" element={<AppShell title="Calculators" />}>
              <Route index element={<PageFade><CalculatorsPage /></PageFade>} />
              <Route path="sip" element={<PageFade><SipCalculatorPage /></PageFade>} />
              <Route path="emi" element={<PageFade><EmiCalculatorPage /></PageFade>} />
              <Route path="retirement" element={<PageFade><RetirementCalculatorPage /></PageFade>} />
              <Route path="ctc-inhand" element={<PageFade><CtcInhandCalculatorPage /></PageFade>} />
              <Route path="tax-regime" element={<PageFade><TaxRegimeCalculatorPage /></PageFade>} />
              <Route path="dream-house" element={<PageFade><DreamHouseCalculatorPage /></PageFade>} />
              <Route path="dream-vehicle" element={<PageFade><DreamVehicleCalculatorPage /></PageFade>} />
              <Route path="fire" element={<PageFade><FireCalculatorPage /></PageFade>} />
              <Route path="trip-budget" element={<PageFade><TripBudgetCalculatorPage /></PageFade>} />
              <Route path="rental-yield" element={<PageFade><RentalYieldCalculatorPage /></PageFade>} />
              <Route path="lumpsum-vs-sip" element={<PageFade><LumpsumVsSipCalculatorPage /></PageFade>} />
              <Route path="debt-payoff" element={<PageFade><DebtPayoffCalculatorPage /></PageFade>} />
              <Route path="monthly-budget-planner" element={<PageFade><MonthlyBudgetPlannerPage /></PageFade>} />
            </Route>
            <Route path="/settings" element={<AppShell title="Settings" />}>
              <Route element={<SettingsLayout />}>
                <Route path="profile" element={<PageFade><ProfilePage /></PageFade>} />
                <Route path="categories" element={<PageFade><CategoriesPage /></PageFade>} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Route>

      {/* Component library (always accessible) */}
      <Route path="/components" element={<ComponentsPage />} />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
