import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// Importez vos pages...
import AdminMaterialTypes from './pages/admin/AdminMaterialTypes';
import SubCategoriesPage from './pages/admin/SubCategoriesPage';
import AdminAjouterMateriel from './pages/admin/AdminAjouterMateriel';
import MaterialDetailPage from './pages/admin/MaterialDetailPage';
import AgentDashboardPage from './pages/agents/AgentDashboardPage';
import DirDemandeMateriel from './pages/director/DirDemandeMateriel';
import DirValidationPerte from './pages/director/DirValidationPerte';
import CategoryItemsPage from './pages/admin/CategoryItemsPage';
import AdminDemandeMateriel from './pages/admin/AdminDemandesMateriel';
import AdminMouvement from './pages/admin/AdminMouvement';
import AdminDeclarationsPerte from './pages/admin/AdminDeclarationsPerte';
import AdminStatsPage from './pages/admin/AdminStatsPage';
import DeclarationPerte from './pages/DeclarationPerte';
import DirDashboardPage from './pages/director/DirDashboardPage';
import UnauthorizedPage from './pages/UnauthorizedPage'; // N'oubliez pas l'import
import ChatPage from './pages/chat/ChatPage';
import PostsPage from './pages/posts/PostsPage';

// Définir les rôles pour une meilleure lisibilité
const ROLES = {
    ADMIN: "admin_patrimoine",
    DIRECTOR: "director",
    MANAGER: "manager",
    AGENT: "agent",
}

function AppContent() {
  const { currentUser: user, loading } = useAuth();
  
  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
      <Routes>
          {/* Routes publiques non protégées */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Routes protégées qui partagent la même mise en page (header, sidebar...) */}
          <Route element={<AppLayout />}>
              {/* --- Routes pour les pages admin --- */}
              {/* Seul un admin du patrimoine peut accéder à ces routes */}
              <Route
                  path="/admin"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <AdminMaterialTypes />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/statistiques"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <AdminStatsPage />
                      </ProtectedRoute>
                  }
              />
              {/* CORRECTION : Mettez la route spécifique des filtres AVANT la route dynamique */}
              <Route
                  path="/admin/materiels/filtres"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <CategoryItemsPage />
                      </ProtectedRoute>
                  }
              />

              <Route
                  path="/admin/ajouter"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <AdminAjouterMateriel />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/materiel/:id"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <MaterialDetailPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/demandes"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <AdminDemandeMateriel />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/mouvement"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <AdminMouvement />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/pertes"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <AdminDeclarationsPerte />
                      </ProtectedRoute>
                  }
              />
              {/* Alias pour éviter l'erreur 404 lorsque l'on utilise l'ancien chemin */}
              <Route
                  path="/subCategoriesPage/:type"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <SubCategoriesPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/:type/:category"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <CategoryItemsPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/:type"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN]}>
                          <SubCategoriesPage />
                      </ProtectedRoute>
                  }
              />

              {/* --- Routes pour les pages directeur --- */}
              {/* Les directeurs et les admins y ont accès */}
              <Route
                  path="/director/demandes"
                  element={
                      <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.ADMIN]}>
                          <DirDemandeMateriel />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/director/dashboard"
                  element={
                      <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.ADMIN]}>
                          <DirDashboardPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/director/validation-pertes"
                  element={
                      <ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.ADMIN]}>
                          <DirValidationPerte />
                      </ProtectedRoute>
                  }
              />

              {/* --- Route pour les pages agent --- */}
              {/* Tous les utilisateurs connectés ayant un rôle peuvent voir leur dashboard */}
              <Route
                  path="/agent"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                          ]}
                      >
                          <AgentDashboardPage />
                      </ProtectedRoute>
                  }
              />

              {/* --- Route pour les pages générale --- */}
              {/* Tout utilisateur du système de patrimoine peut déclarer une perte */}
              <Route
                  path="declaration-pertes"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                          ]}
                      >
                          <DeclarationPerte />
                      </ProtectedRoute>
                  }
              />

              {/* --- Routes intranet --- */}
              <Route
                  path="/chat"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                          ]}
                      >
                          <ChatPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/posts"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                          ]}
                      >
                          <PostsPage />
                      </ProtectedRoute>
                  }
              />
          </Route>

          {/* Redirection intelligente selon l'authentification */}
          <Route
              path="*"
              element={
                  !user ? (
                      <Navigate to="/login" replace />
                  ) : (
                      <ProtectedRoute
                          roles={[
                              ROLES.ADMIN,
                              ROLES.DIRECTOR,
                              ROLES.MANAGER,
                              ROLES.AGENT,
                          ]}
                      >
                          <Navigate
                              to={
                                  user.is_admin
                                      ? "/admin"
                                      : user.role === "director"
                                        ? "/director/dashboard"
                                        : "/agent"
                              }
                              replace
                          />
                      </ProtectedRoute>
                  )
              }
          />
      </Routes>
  )
}

function App() {
  // Effacer le localStorage en développement si nécessaire
  if (process.env.NODE_ENV === 'development' && window.location.search.includes('reset')) {
    localStorage.clear();
    window.location.search = '';
  }

  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
