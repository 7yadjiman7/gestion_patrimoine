import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PostNotificationProvider } from './context/PostNotificationContext';

// Importez vos pages...
import AdminMaterialTypes from './pages/admin/AdminMaterialTypes';
import SubCategoriesPage from './pages/admin/SubCategoriesPage';
import AdminAjouterMateriel from './pages/admin/AdminAjouterMateriel';
import MaterialDetailPage from './pages/admin/MaterialDetailPage';
import AgentDashboardPage from './pages/agents/AgentDashboardPage';
import AgentMaterialActionsPage from './pages/agents/AgentMaterialActionsPage';
import DirDemandeMateriel from './pages/director/DirDemandeMateriel';
import DirValidationPerte from './pages/director/DirValidationPerte';
import CategoryItemsPage from './pages/admin/CategoryItemsPage';
import AdminDemandeMateriel from './pages/admin/AdminDemandesMateriel';
import AdminMouvement from './pages/admin/AdminMouvement';
import AdminDeclarationsPerte from './pages/admin/AdminDeclarationsPerte';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import PostDetailPage from './pages/admin/PostDetailPage';
import AdminStatsPage from './pages/admin/AdminStatsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminSubCategoriesPage from './pages/admin/AdminSubCategoriesPage';
import DeclarationPerte from './pages/user/DeclarationPerte';
import DeclarationPanne from './pages/user/DeclarationPanne';
import MyDeclarationsPage from './pages/user/MyDeclarationsPage';
import DirDashboardPage from './pages/director/DirDashboardPage';
import ManagerValidationPanne from './pages/manager/ManagerValidationPanne';
import UnauthorizedPage from './pages/UnauthorizedPage'; // N'oubliez pas l'import
import ChatPage from './pages/chat/ChatPage';
import PostsPage from './pages/posts/PostsPage';
import MyPostsPage from "./pages/posts/MyPostsPage"
import CommentThreadPage from './pages/posts/CommentThreadPage';
import FilteredTableView from "./pages/admin/FilteredTableView"

// Définir les rôles pour une meilleure lisibilité
const ROLES = {
    ADMIN: "admin_patrimoine",
    ADMIN_INTRANET: "admin_intranet",
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
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <AdminMaterialTypes />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/statistiques"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <AdminStatsPage />
                      </ProtectedRoute>
                  }
              />
              {/* CORRECTION : Mettez la route spécifique des filtres AVANT la route dynamique */}
              <Route
                  path="/admin/materiels/filtres"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <CategoryItemsPage />
                      </ProtectedRoute>
                  }
              />

              <Route
                  path="/admin/ajouter"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <AdminAjouterMateriel />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/materiel/:id"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
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
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
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
              <Route
                  path="/admin/posts"
                  element={
                      <ProtectedRoute roles={[ROLES.ADMIN_INTRANET]}>
                          <AdminPostsPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/posts/:postId"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <PostDetailPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/categories"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <AdminCategoriesPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/categories/:categoryId/subcategories"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <AdminSubCategoriesPage />
                      </ProtectedRoute>
                  }
              />
              {/* Alias pour éviter l'erreur 404 lorsque l'on utilise l'ancien chemin */}
              <Route
                  path="/subCategoriesPage/:type"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <SubCategoriesPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/:type/:category"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <CategoryItemsPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/:type"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <SubCategoriesPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/admin/materiels/table"
                  element={
                      <ProtectedRoute
                          roles={[ROLES.ADMIN, ROLES.ADMIN_INTRANET]}
                      >
                          <FilteredTableView />
                      </ProtectedRoute>
                  }
              />

              {/* --- Routes pour les pages directeur --- */}
              {/* Les directeurs et les admins y ont accès */}
              <Route
                  path="/director/demandes"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <DirDemandeMateriel />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/director/dashboard"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <DirDashboardPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/director/validation-pertes"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <DirValidationPerte />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/manager/validation-pannes"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.MANAGER,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <ManagerValidationPanne />
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
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <AgentDashboardPage />
                      </ProtectedRoute>
                  }
              />
              {/* Permettre l'accès via l'ancien chemin /agent/dashboard */}
              <Route
                  path="/agent/dashboard"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <AgentDashboardPage />
                      </ProtectedRoute>
                  }
              />

              <Route
                  path="/agent/materiel/:id/actions"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <AgentMaterialActionsPage />
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
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <DeclarationPerte />
                      </ProtectedRoute>
                  }
              />

              <Route
                  path="/declaration-pannes"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <DeclarationPanne />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="declaration-pannes"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <DeclarationPanne />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/mes-pertes"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <MyDeclarationsPage />
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
                              ROLES.ADMIN_INTRANET,
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
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <PostsPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/my-posts"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <MyPostsPage />
                      </ProtectedRoute>
                  }
              />
              <Route
                  path="/posts/comment/:commentId"
                  element={
                      <ProtectedRoute
                          roles={[
                              ROLES.AGENT,
                              ROLES.MANAGER,
                              ROLES.DIRECTOR,
                              ROLES.ADMIN,
                              ROLES.ADMIN_INTRANET,
                          ]}
                      >
                          <CommentThreadPage />
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
                              ROLES.ADMIN_INTRANET,
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
        <PostNotificationProvider>
          <AppContent />
        </PostNotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
