import React from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './app-sidebar';
import { Toaster } from './ui/sonner';

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar onCollapseChange={setSidebarCollapsed} />
      
      <div className={`flex-1 overflow-auto transition-all duration-300
        ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" />
    </div>
  );
}
