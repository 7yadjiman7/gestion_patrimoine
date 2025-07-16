# Module Intranet MTND pour Odoo 17

## Description
Application intranet complète intégrant la gestion du patrimoine matériel et deux nouvelles fonctionnalités :
un espace de chat interne et un mur de posts pour partager les annonces du ministère. Le module permet la gestion du patrimoine matériel, incluant :
- Véhicules (voitures de service, motos)
- Matériel informatique (ordinateurs, imprimantes, serveurs)
- Mobilier (bureaux, chaises, armoires)

## Fonctionnalités principales

### Intranet
- Messagerie interne temps réel (page **Chat**)
- Mur d'annonces et de publications (page **Posts**)

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
1. Copier le dossier `gestion_patrimoine` dans le répertoire `custom-addons`
2. Redémarrer Odoo
3. Installer le module via l'interface administrateur
4. Dans le menu **Gestion du Patrimoine**, ouvrez l'élément **Posts** pour gérer les annonces internes.

## Dépendances
- Odoo 17
- Modules requis : base, hr, stock, account, fleet
- Le serveur longpolling doit être actif pour permettre la messagerie temps réel

## Auteur
**Ministère des Transports et du Numérique**  
Contact: [http://www.mtnd.gov.ci](http://www.mtnd.gov.ci)

## Licence
LGPL-3

## Migration
Lors de la migration depuis une version antérieure, le groupe « Administrateur Patrimoine » peut déjà exister mais avec un identifiant XML différent.
Les hooks d'initialisation recherchent donc ce groupe et, s'il est trouvé, lui
associent l'identifiant `gestion_patrimoine.group_patrimoine_admin` au lieu d'en créer un nouveau. Ce processus s'exécute aussi bien lors d'une nouvelle installation que lors d'une mise à jour du module.

## Chat API

Ces routes REST permettent d'accéder au module de messagerie. Elles nécessitent
une session authentifiée ou le paramètre `db` désignant la base de données.

### `/api/chat/conversations`
* **GET** : liste les conversations du compte connecté.
* **POST** : crée une nouvelle conversation.

### `/api/chat/conversations/<id>/messages`
`<id>` doit être un entier représentant l'identifiant de la conversation.
* **GET** : renvoie tous les messages de la conversation.
* **POST** : ajoute un message dans cette conversation.

#### Exemples `curl`

```bash
# Liste des conversations
curl -X GET -H "Cookie: session_id=<SESSION>" \
  "http://localhost:8069/api/chat/conversations?db=<DB>"

# Messages de la conversation 1
curl -X GET -H "Cookie: session_id=<SESSION>" \
  "http://localhost:8069/api/chat/conversations/1/messages?db=<DB>"
```

## Intranet Posts API

### `/api/intranet/posts`
* **GET** : liste les publications intranet.
* **POST** : crée une publication. Le champ `name` est obligatoire. Les champs
  `body`, `department_id`, `image` et d’autres sont facultatifs.

#### Exemple `curl`

```bash
curl -X POST -H "Cookie: session_id=<SESSION>" \
  -F "name=Nouvelle annonce" \
  -F "body=Contenu optionnel" \
  http://localhost:8069/api/intranet/posts?db=<DB>
```

### `/api/intranet/posts/<post_id>/comments`
`<post_id>` doit être l'identifiant numérique du post.
* **GET** : renvoie la liste des commentaires du post (hiérarchie complète).
* **POST** : ajoute un commentaire. Le champ `content` est obligatoire ; utilisez
  `parent_id` pour répondre à un commentaire existant.

#### Exemples `curl`

```bash
# Récupérer les commentaires du post 1
curl -X GET -H "Cookie: session_id=<SESSION>" \
  http://localhost:8069/api/intranet/posts/1/comments?db=<DB>

# Ajouter un commentaire au post 1
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=<SESSION>" \
  -d '{"content": "Mon commentaire"}' \
  http://localhost:8069/api/intranet/posts/1/comments?db=<DB>

# Répondre au commentaire 42
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: session_id=<SESSION>" \
  -d '{"content": "Ma réponse", "parent_id": 42}' \
  http://localhost:8069/api/intranet/posts/1/comments?db=<DB>
```


## Troubleshooting

### Couldn't bind the websocket
If you see the error "Couldn't bind the websocket," make sure the Odoo server is started with longpolling enabled. Run it with `--longpolling-port=8072` or via the `gevent` service so the chat features work properly.

### CORS configuration
When the frontend and backend run on different origins, each API route exposes
the `Access-Control-Allow-Origin` header. Set the environment variable
`ALLOWED_ORIGIN` on the Odoo server to the URL of your frontend (for example
`http://localhost:5174`). All controller routes will then respond with that
origin, ensuring browsers accept requests that include credentials.

