import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';

export default function AgentDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord Agent</h1>
      <div className="space-y-4">
        <Button onClick={() => navigate('/agent/materiels')}>
          Voir mes matériels
        </Button>
        <Button onClick={() => navigate('/agent/declarer-perte')}>
          Déclarer une perte
        </Button>
      </div>
    </div>
  );
}
