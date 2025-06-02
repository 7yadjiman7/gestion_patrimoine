import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  onLogout: () => void;
}

export const Navbar = ({ onLogout }: NavbarProps) => {
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold text-primary-dark hover:text-primary"
            >
              Gestion Patrimoine
            </Link>
          </div>
          
          {user && (
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/assets" 
                className="border-primary-dark text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Biens
              </Link>
              <Link 
                to="/movements" 
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Mouvements
              </Link>
              <Link 
                to="/maintenance" 
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Entretiens
              </Link>
              {user.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Admin
                </Link>
              )}
            </div>
          )}
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <button
                onClick={onLogout}
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark"
              >
                Déconnexion
              </button>
            ) : (
              <Link
                to="/login"
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary-dark"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
