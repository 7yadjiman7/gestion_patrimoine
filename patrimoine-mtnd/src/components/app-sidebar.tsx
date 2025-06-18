import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Home, PlusSquare, List, Move, AlertCircle, LogOut, Menu, BarChart2 } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface AppSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function AppSidebar({ onCollapseChange }: AppSidebarProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('odoo_session_id');
    navigate('/');
  };

  const menuItems = [
    // pages admin
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard', path: '/admin' },
    { icon: <PlusSquare className="h-5 w-5" />, label: 'Ajouter Matériel', path: '/admin/ajouter' },
    { icon: <List className="h-5 w-5" />, label: 'Demandes', path: '/admin/demandes' },
    { icon: <Move className="h-5 w-5" />, label: 'Mouvement', path: '/admin/mouvement' },
    { icon: <AlertCircle className="h-5 w-5" />, label: 'Pertes', path: '/admin/pertes' },
    { icon: <BarChart2 className="h-5 w-5" />, label: 'Statistiques', path: '/admin/statistiques' },

    // Pages directeur
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard Directeur', path: '/director/dashboard' },
    { icon: <List className="h-5 w-5" />, label: 'Demandes Directeur', path: '/director/demandes' },

    // Pages agent
    { icon: <Home className="h-5 w-5" />, label: 'Dashboard Agent', path: '/agent/dashboard' },
    
        // page générale
    { icon: <AlertCircle className="h-5 w-5" />, label: 'Déclarer Perte', path: '/declaration-pertes' },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-md border-r transition-all duration-300 z-50
      ${collapsed ? 'w-16' : 'w-64'}`}>
      
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && (
          <img 
            src="/images/logos/logo.png" 
            alt="Logo MTND" 
            className="h-12 mx-auto"
          />
        )}
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => {
            const newCollapsed = !collapsed;
            setCollapsed(newCollapsed);
            onCollapseChange?.(newCollapsed);
          }}
          className="ml-auto"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="p-4 space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            className={`w-full justify-start gap-3 px-4 py-3 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors
              ${collapsed ? 'justify-center' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {!collapsed && item.label}
          </Button>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-3 px-4 py-3 text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors
            ${collapsed ? 'justify-center' : ''}`}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && 'Déconnexion'}
        </Button>
      </div>
    </div>
  );
}
