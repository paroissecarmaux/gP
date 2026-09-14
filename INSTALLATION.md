# Installer gParoisse sur un nouvel ordinateur

gParoisse tourne entièrement en local : les données restent sur
l'ordinateur qui l'exécute. Aucune installation de dépendances n'est
nécessaire (pas de `npm install`) : un seul prérequis, Node.js, utilisé
uniquement pour servir les fichiers de l'application sur
`http://localhost`.

## Prérequis

- **Windows 10/11** (macOS et Linux fonctionnent aussi, voir la note en
  bas de page).
- **Node.js** — gratuit, à installer une seule fois :
  https://nodejs.org (choisir la version « LTS »).
- **Git**, ou à défaut le bouton « Download ZIP » sur GitHub.

## Installation (une seule fois)

1. Installer Node.js (options par défaut de l'installateur), puis
   redémarrer l'ordinateur si l'installateur le demande.
2. Récupérer le code, par exemple dans une invite de commandes
   (touche Windows, taper `cmd`, Entrée) :
   ```
   cd Documents
   git clone https://github.com/paroissecarmaux/gP.git
   ```
   (Sans Git : bouton vert « Code » → « Download ZIP » sur
   https://github.com/paroissecarmaux/gP, puis extraire le dossier.)
3. Double-cliquer sur `demarrer-gParoisse.bat`, à la racine du dossier
   `gP`. L'application s'ouvre directement dans le navigateur — pas
   d'attente d'installation, il n'y a rien à télécharger d'autre.

## Utilisation au quotidien

Double-cliquer sur `demarrer-gParoisse.bat`. Ne pas fermer la fenêtre
noire qui s'ouvre à côté du navigateur : c'est elle qui fait fonctionner
l'application. La fermer arrête gParoisse.

## Mettre à jour l'application

Dans le dossier `gP` :
```
git pull
```
puis relancer `demarrer-gParoisse.bat` normalement.

## Problèmes fréquents

- **« Node.js n'est pas installé »** : Node.js n'a pas été installé, ou
  l'ordinateur n'a pas redémarré depuis. Réinstaller depuis
  https://nodejs.org, redémarrer, réessayer.
- **« Le port 5500 est déjà utilisé »** : gParoisse tourne probablement
  déjà — ouvrir http://localhost:5500 dans le navigateur au lieu de
  relancer.
- **Le navigateur ne s'ouvre pas tout seul** : ouvrir manuellement
  http://localhost:5500 une fois que la fenêtre noire affiche
  « gParoisse est prêt ».
- **Antivirus/pare-feu** : Node.js peut déclencher une alerte au premier
  lancement (accès réseau local) ; autoriser l'accès — gParoisse ne
  communique qu'avec lui-même sur cet ordinateur (`localhost`), jamais
  vers l'extérieur.

## Les données restent sur cet ordinateur

Chaque installation de gParoisse a ses propres données locales
(IndexedDB, dans le navigateur). La synchronisation entre plusieurs
postes (secrétariat, presbytère…) est prévue en V10 — voir
[docs/SYNCHRONIZATION.md](docs/SYNCHRONIZATION.md).

## macOS / Linux

Étapes identiques, dans un Terminal plutôt qu'une invite de commandes, en
remplaçant l'étape 3 par :
```
node serve.js
```
