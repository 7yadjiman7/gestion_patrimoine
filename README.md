# Module de Gestion du Patrimoine pour Odoo 17

## Description
Module complet pour la gestion du patrimoine matériel d'un ministère ou organisation, incluant :
- Véhicules (voitures de service, motos)
- Matériel informatique (ordinateurs, imprimantes, serveurs)
- Mobilier (bureaux, chaises, armoires)

## Fonctionnalités principales

### Gestion des biens
- Enregistrement et catégorisation des biens (code, libellé, type, description, date d'acquisition, valeur)
- Localisation physique via stock.location
- Affectation aux services (hr.department) et agents (hr.employee)
- Historique des changements de localisation/affectation

### Gestion des véhicules
- Suivi des entretiens périodiques (vidange, contrôle technique)
- Gestion des kilométrages
- Rappels automatiques pour les échéances (assurance, contrôle technique)

### Mouvements et maintenance
- Enregistrement des transferts, réformes et sorties de parc
- Suivi des interventions de maintenance (préventive/corrective)
- Alertes automatiques pour les garanties et contrats

### Intégrations
- Module RH (liaison avec hr.employee et hr.department)
- Module Stock (gestion des emplacements via stock.location)  
- Module Comptabilité (gestion des immobilisations via account.asset.asset)

## Modèles de données principaux
- `patrimoine.asset` : Bien patrimonial générique
- `patrimoine.asset.vehicule` : Détails spécifiques aux véhicules
- `patrimoine.asset.informatique` : Matériel informatique
- `patrimoine.asset.mobilier` : Mobilier
- `patrimoine.categorie` : Catégories de biens
- `patrimoine.mouvement` : Mouvements de biens
- `patrimoine.entretien` : Historique d'entretien

## Vues et interface
- Formulaires détaillés par type de bien
- Vues liste avec filtres avancés
- Tableaux de bord analytiques
- Rapports personnalisables

## Sécurité et rôles
- Administrateur technique : droits complets
- Administrateur Patrimoine : gestion complète du module
- Gestionnaire de service : droits limités à son département
- Agent : consultation et déclaration limitée

## Installation
1. Copier le dossier `gestion_patrimoine` dans custom-addons
2. Redémarrer Odoo
3. Installer le module via l'interface administrateur

## Dépendances
- Odoo 17
- Modules requis : base, hr, stock, account, fleet

## Auteur
**Ministère des Transports et du Numérique**  
Contact: [http://www.mtnd.gov.ci](http://www.mtnd.gov.ci)

## Licence
LGPL-3
