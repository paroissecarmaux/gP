# Installer gParoisse sur un nouvel ordinateur

gParoisse est un site 100 % statique (HTML/CSS/JS) : aucune installation,
aucun serveur, aucune dépendance. Les données restent sur l'ordinateur qui
l'exécute (navigateur, IndexedDB).

## Installation (une seule fois)

1. Récupérer le code :
   - Avec Git : `git clone https://github.com/paroissecarmaux/gP.git`
   - Sans Git : sur https://github.com/paroissecarmaux/gP, bouton vert
     « Code » → « Download ZIP », puis extraire le dossier.
2. Ouvrir le dossier `gP` et **double-cliquer sur `index.html`**.

C'est tout. L'application s'ouvre dans le navigateur par défaut.

## Utilisation au quotidien

Double-cliquer sur `index.html`. Les données de la dernière session sont
toujours là (IndexedDB persiste tant que le navigateur ne les efface pas).

## Mettre à jour l'application

Dans le dossier `gP` :
```
git pull
```
puis rouvrir `index.html` normalement.

## Navigateur recommandé

Chrome, Edge ou Firefox récents. `index.html` charge tout en scripts
classiques (pas de modules ES, bloqués par certains navigateurs en
ouverture directe de fichier) — voir
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) pour le détail technique.

## Les données restent sur cet ordinateur

Chaque installation de gParoisse a ses propres données locales
(IndexedDB, dans le navigateur). La synchronisation entre plusieurs
postes (secrétariat, presbytère…) est prévue en V10 — voir
[docs/SYNCHRONIZATION.md](docs/SYNCHRONIZATION.md).
