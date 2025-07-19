import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AgentMaterialActionsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col items-center gap-6">
      <h1 className="text-2xl font-bold">Actions sur le matériel</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button onClick={() => navigate("/declaration-pertes")}>Déclarer une perte</Button>
        <Button variant="outline" onClick={() => navigate("/declaration-pannes")}>Déclarer une panne</Button>
      </div>
    </div>
  );
}
