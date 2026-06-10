import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomTabBar } from './BottomTabBar';
import { useTopBarActions } from '../contexts/TopBarActionsContext';

interface AppShellProps {
  title: string;
}

export function AppShell({ title }: AppShellProps) {
  const { actions } = useTopBarActions();

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f6f2]">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <TopBar title={title} actions={actions} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>

        <BottomTabBar />
      </div>
    </div>
  );
}
