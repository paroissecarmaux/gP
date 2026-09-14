# Installer gParoisse sur un nouvel ordinateur

gParoisse est une application qui tourne entièrement en local : les
données restent sur l'ordinateur qui l'exécute (voir « Sauvegarde &
synchro » dans l'application pour échanger des données entre postes).
Pas d'abonnement, pas de serveur à payer — juste ce dépôt de code.

## Prérequis

- **Windows 10/11** (Mac et Linux fonctionnent aussi, voir la note en
  bas de page).
- **Node.js** (version 20 ou plus récente) — gratuit, à installer une
  seule fois : https://nodejs.org (choisir la version « LTS »).
- **Git** — gratuit, pour récupérer le code : https://git-scm.com/downloads
  (ou télécharger le code en ZIP depuis GitHub, voir plus bas).

## Installation (une seule fois)

1. Installer Node.js en suivant l'installateur (options par défaut).
2. Installer Git en suivant l'installateur (options par défaut).
3. Ouvrir une invite de commandes (touche Windows, taper `cmd`, Entrée)
   et se placer dans le dossier où l'on veut ranger l'application, par
   exemple :
   ```
   cd Documents
   ```
4. Récupérer le code :
   ```
   git clone https://github.com/paroissecarmaux/gP.git
   cd gP
   ```
   (Sans Git : télécharger le ZIP depuis
   https://github.com/paroissecarmaux/gP → bouton vert « Code » →
   « Download ZIP », puis extraire le dossier.)
5. Double-cliquer sur `demarrer-gParoisse.bat` à la racine du dossier.
   Au premier lancement, l'installation des composants prend quelques
   minutes (barre de progression dans la fenêtre noire) ; l'application
   s'ouvre ensuite automatiquement dans le navigateur.

## Utilisation au quotidien

Double-cliquer sur `demarrer-gParoisse.bat`. L'application s'ouvre dans
le navigateur après quelques secondes. Pour l'arrêter, fermer la fenêtre
noire (invite de commandes) qui s'est ouverte à côté.

Ne pas fermer cette fenêtre noire pendant l'utilisation : c'est elle qui
fait fonctionner l'application.

## Mettre à jour l'application

Quand du nouveau code est disponible sur GitHub, dans le dossier `gP` :
```
git pull
```
puis relancer `demarrer-gParoisse.bat` normalement.

## Problèmes fréquents

- **« Node.js n'est pas installé »** au lancement du `.bat` : Node.js
  n'a pas été installé, ou l'ordinateur n'a pas été redémarré depuis.
  Réinstaller depuis https://nodejs.org, redémarrer, réessayer.
- **La fenêtre se ferme immédiatement** : rouvrir une invite de
  commandes manuellement, se placer dans le dossier `gP` (`cd chemin\vers\gP`)
  et taper `demarrer-gParoisse.bat` pour voir le message d'erreur complet.
- **Le navigateur affiche « Impossible d'accéder à ce site »** : attendre
  quelques secondes de plus, ou ouvrir manuellement
  http://localhost:5173 une fois que la fenêtre noire affiche `ready`.
- **Antivirus/pare-feu** : Node.js peut déclencher une alerte au premier
  lancement (accès réseau local) ; autoriser l'accès, l'application ne
  communique qu'avec elle-même sur cet ordinateur (`localhost`).

## Les données restent sur cet ordinateur

Chaque installation de gParoisse a ses propres données locales
(navigateur, IndexedDB). Pour partager les données entre plusieurs
postes (ex. secrétariat + presbytère), utiliser l'écran
**Sauvegarde & synchro** dans l'application : il permet d'exporter un
fichier de sauvegarde sur un poste et de l'importer sur l'autre pour
fusionner les données.

## Mac / Linux

Les étapes sont identiques, dans un Terminal plutôt qu'une invite de
commandes, en remplaçant l'étape 5 par :
```
npm install
npm run dev
```
