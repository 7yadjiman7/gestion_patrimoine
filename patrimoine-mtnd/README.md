# Frontend Intranet MTND

Ce projet React utilise Vite et Tailwind CSS pour l'interface de l'intranet. Il communique avec le backend Odoo via les routes `/api/*`.

## Installation

```bash
npm install
```

## Lancement en développement

```bash
npm run dev
```


Le serveur de développement utilise un proxy afin de communiquer avec Odoo. Les routes `/api`, `/web`, `/websocket` ainsi que `/longpolling` sont redirigées vers les ports locaux d'Odoo. Pour `/longpolling`, la cible est `http://localhost:8072` et les options `changeOrigin` et `secure` correspondent aux autres règles.

## Configuration de la base de données

Par défaut, l'application se connecte à la base **odoo17_2**. Vous pouvez personnaliser ce nom en créant un fichier `.env` à la racine du projet et en définissant la variable `VITE_ODOO_DB` :

```bash
echo "VITE_ODOO_DB=ma_base_odoo" > .env
```

Si aucune valeur n'est spécifiée, la valeur `odoo17_2` sera utilisée automatiquement.

## Construction pour la production

```bash
npm run build
```

Assurez-vous qu'un serveur Odoo configuré avec le module **gestion_patrimoine** tourne sur le même hôte afin que les requêtes API soient résolues correctement.

## Intégration avec Odoo

Avant d'installer le module Odoo, compilez l'application front‑end afin de
générer les fichiers JavaScript et CSS référencés dans `__manifest__.py`.

```bash
npm install
npm run build
```

Les ressources produites se trouvent dans le dossier `dist/` et seront servies
par Odoo via les bundles d'actifs. Exécutez de nouveau cette commande après toute
mise à jour du code React.


## Exécution des tests

Les tests Jest sont situés dans `src/tests`.

1. Installez les dépendances du projet avant d'exécuter les tests :

```bash
npm install
```

   Cette étape requiert un accès Internet ou un registre local déjà configuré afin de récupérer les dépendances de développement définies dans `package.json`, telles que **Jest**.

2. Lancez ensuite les tests :

```bash
npm test
```

