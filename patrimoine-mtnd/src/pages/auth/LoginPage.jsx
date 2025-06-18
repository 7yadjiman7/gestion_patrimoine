import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
// Composant spinner simple
function Spinner() {
  return (
    <div className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent">
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const success = await login(email, password);
        if (success) {
          // Récupérer la route d'origine depuis l'état de navigation
          const from = window.history.state?.from || '/admin';
          
          // Vérifier le rôle de l'utilisateur et rediriger
          const user = JSON.parse(localStorage.getItem('odoo_user'));
          if (user && user.is_admin) {
            navigate(from, { replace: true });
          } else if (user && user.role === 'director') {
            navigate('/director/demandes', { replace: true });
          } else {
            navigate('/agent', { replace: true });
          }
        }
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img 
            src="/images/logos/logo.png" 
            alt="Logo MTND" 
            className="h-20"
          />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6">Connexion à Odoo</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner />
                Connexion en cours...
              </>
            ) : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}
