# gParoisse

Application locale de gestion paroissiale — Carmaux / Valence. 100 %
locale : HTML, CSS, JavaScript vanilla, IndexedDB via Dexie.js. Sans
backend, sans serveur distant, sans cloud.

## Lancer l'application

Sur Windows : double-cliquer sur `demarrer-gParoisse.bat` (Node.js requis,
voir [INSTALLATION.md](INSTALLATION.md)).

En ligne de commande, sur n'importe quel système avec Node.js installé :
```
node serve.js
```
puis ouvrir http://localhost:5500 si le navigateur ne s'ouvre pas
automatiquement.

## Documentation

- [INSTALLATION.md](INSTALLATION.md) — installer et lancer sur un nouveau poste
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — structure du projet, décisions techniques
- [docs/DATABASE.md](docs/DATABASE.md) — schéma IndexedDB/Dexie
- [docs/ENTITIES.md](docs/ENTITIES.md) — catalogue complet des entités (toutes versions)
- [docs/RELATIONS.md](docs/RELATIONS.md) — relations entre entités
- [docs/MIGRATIONS.md](docs/MIGRATIONS.md) — méthode de versionnement du schéma
- [docs/SYNCHRONIZATION.md](docs/SYNCHRONIZATION.md) — conception de la synchronisation entre postes
- [docs/ROADMAP.md](docs/ROADMAP.md) — versions V1 à V11
