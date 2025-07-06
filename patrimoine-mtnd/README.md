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

## Construction pour la production

```bash
npm run build
```

Assurez-vous qu'un serveur Odoo configuré avec le module **gestion_patrimoine** tourne sur le même hôte afin que les requêtes API soient résolues correctement.


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

