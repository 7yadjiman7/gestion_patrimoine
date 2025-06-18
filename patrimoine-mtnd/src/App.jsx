import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute'; // Assurez-vous d'importer le composant
import AppLayout from './components/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import { AuthProvider } from './hooks/useAuth';

// Importez vos pages...
import AdminMaterialTypes from './pages/admin/AdminMaterialTypes';
import SubCategoriesPage from './pages/admin/SubCategoriesPage';
import AdminAjouterMateriel from './pages/admin/AdminAjouterMateriel';
import MaterialDetailPage from './pages/admin/MaterialDetailPage';
import AgentDashboardPage from './pages/agents/AgentDashboardPage';
import DirDemandeMateriel from './pages/director/DirDemandeMateriel';
import CategoryItemsPage from './pages/admin/CategoryItemsPage';
import AdminDemandesMateriel from './pages/admin/AdminDemandesMateriel';
import AdminMouvement from './pages/admin/AdminMouvement';
import AdminDeclarationsPerte from './pages/admin/AdminDeclarationsPerte';
import AdminStatsPage from './pages/admin/AdminStatsPage';
import DeclarationPerte from './pages/DeclarationPerte';
import DirDashboardPage from './pages/director/DirDashboardPage';

// Définir les rôles pour une meilleure lisibilité
const ROLES = {
  ADMIN: 'admin_patrimoine',
  DIRECTOR: 'director',
  MANAGER: 'manager',
  AGENT: 'agent'
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Routes publiques non protégées */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Routes protégées qui partagent la même mise en page (header, sidebar...) */}
          <Route element={<AppLayout />}>
            
            {/* --- Routes pour les pages admin --- */}
            {/* Seul un admin du patrimoine peut accéder à ces routes */}
            <Route path="/admin" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AdminMaterialTypes /></ProtectedRoute>} />
            <Route path="/admin/statistiques" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AdminStatsPage/></ProtectedRoute>} />
            <Route path="/admin/:type" element={<ProtectedRoute roles={[ROLES.ADMIN]}><SubCategoriesPage /></ProtectedRoute>} />
            <Route path="/admin/:type/:category" element={<ProtectedRoute roles={[ROLES.ADMIN]}><CategoryItemsPage/></ProtectedRoute>}/>
            <Route path="/admin/ajouter" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AdminAjouterMateriel /></ProtectedRoute>} />
            <Route path="/admin/materiel/:id" element={<ProtectedRoute roles={[ROLES.ADMIN]}><MaterialDetailPage /></ProtectedRoute>} />
            <Route path="/admin/demandes" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AdminDemandesMateriel /></ProtectedRoute>} />
            <Route path="/admin/mouvement" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AdminMouvement/></ProtectedRoute>} />
            <Route path="/admin/pertes" element={<ProtectedRoute roles={[ROLES.ADMIN]}><AdminDeclarationsPerte/></ProtectedRoute>} />

            {/* --- Routes pour les pages directeur --- */}
            {/* Les directeurs et les admins y ont accès */}
            <Route path="/director/demandes" element={<ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.ADMIN]}><DirDemandeMateriel /></ProtectedRoute>} />
            <Route path="/director/dashboard" element={<ProtectedRoute roles={[ROLES.DIRECTOR, ROLES.ADMIN]}><DirDashboardPage /></ProtectedRoute>} />

            {/* --- Route pour les pages agent --- */}
            {/* Tous les utilisateurs connectés ayant un rôle peuvent voir leur dashboard */}
            <Route path="/agent" element={<ProtectedRoute roles={[ROLES.AGENT, ROLES.MANAGER, ROLES.DIRECTOR, ROLES.ADMIN]}><AgentDashboardPage /></ProtectedRoute>} />

            {/* --- Route pour les pages générale --- */}
            {/* Tout utilisateur du système de patrimoine peut déclarer une perte */}
            <Route path="declaration-pertes" element={<ProtectedRoute roles={[ROLES.AGENT, ROLES.MANAGER, ROLES.DIRECTOR, ROLES.ADMIN]}><DeclarationPerte /></ProtectedRoute>} />

          </Route>

          {/* Redirection par défaut : si aucune autre route ne correspond, renvoyer vers la page de connexion */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;