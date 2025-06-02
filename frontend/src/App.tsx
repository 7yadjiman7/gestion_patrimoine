import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Navbar } from './components/layout/Navbar';
import { LoginPage } from './pages/LoginPage';
import { PatrimoineDashboard } from './pages/PatrimoineDashboard';
import AssetList from './pages/AssetList';
import AssetDetail from './pages/AssetDetail';
import Loading from './components/common/Loading';

const ProtectedRoute = ({ children }: { children: React.JSX.Element }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    setInitialCheckDone(true);
  }, []);

  if (!initialCheckDone && isLoading) {
    return <Loading />;
  }
  
  console.log('App render - isLoading:', isLoading, 'user:', user);

  if (isLoading) {
    console.log('Showing loading state');
    return <Loading />;
  }

  console.log('Rendering main app content');

  const handleLoginSuccess = () => navigate('/');
  const handleLogoutSuccess = () => navigate('/login');

  return (
    <>
      {user && <Navbar onLogout={handleLogoutSuccess} />}
      <div className="app-content">
        <Routes>
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PatrimoineDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <AssetList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets/:id"
            element={
              <ProtectedRoute>
                <AssetDetail />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
};
