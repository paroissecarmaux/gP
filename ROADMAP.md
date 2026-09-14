# Roadmap gParoisse

> **Statut :** V1 à V11 implémentées. Voir [ARCHITECTURE.md](ARCHITECTURE.md)
> et [DATABASE.md](DATABASE.md) pour le détail technique, y compris les
> simplifications assumées pour tenir l'ensemble dans une base de code
> cohérente (voir [DATABASE.md § Simplifications de modélisation](DATABASE.md#simplifications-de-modélisation)).

### Principes de priorité (toujours respectés)
1. Intégrité des données
2. Architecture solide
3. Ergonomie
4. Fonctionnalités métier
5. Recherche
6. Synchronisation
7. Statistiques / KPI
8. Esthétique

---

## V1 — Fondation (Base technique)

**Objectif :** Poser une architecture ultra-solide et réutilisable.

**Livrables :**
- Structure complète des dossiers
- Configuration Dexie.js + IndexedDB
- Schéma initial versionné
- Système de migrations
- Identifiants uniques (UUID) + métadonnées de synchronisation (`createdAt`, `updatedAt`, `deletedAt`, `originInstallationId`, `revision`)
- Entité `Installation`
- Architecture JavaScript modulaire (services, ui, utils, db)
- Routeur simple
- Système de composants de base
- Gestion centralisée des erreurs
- Documentation de base (`ARCHITECTURE.md`, `DATABASE.md`)

**Definition of Done :**
On peut lancer l'application, la base est créée, versionnée, et l'architecture est prête à accueillir les modules métier sans être refaite.

---

## V2 — Annuaire

**Objectif :** Gérer les personnes et leur organisation.

**Livrables :**
- CRUD Personne (fiche complète)
- Familles (avec membres)
- Coordonnées & Adresses
- Fonctions
- Groupes + Participation
- Bénévoles
- Clergé
- Salariés
- Soft delete + Corbeille de base
- Recherche simple dans l'annuaire

**Definition of Done :**
On peut créer, modifier, lier et rechercher des personnes, familles et groupes de façon fiable.

---

## V3 — Territoire + Agenda

**Objectif :** Gérer les lieux et la planification.

**Livrables :**
- Secteurs
- Clochers
- Lieux
- Événements
- Célébrations (avec types + récurrence)
- Participants
- Filtres (secteur, clocher, lieu, période)
- Détection de conflits d'agenda (même lieu, même personne, même célébrant…)
- Vues : jour / semaine / mois / liste

**Definition of Done :**
L'agenda est utilisable au quotidien et détecte les principaux conflits.

---

## V4 — Tâches

**Objectif :** Suivre le travail à faire.

**Livrables :**
- CRUD Tâches
- Statuts (À faire, En cours, Terminé, Annulé)
- Priorités (Normale, Importante, Urgente)
- Affectation à une ou plusieurs personnes / groupes
- Lien avec événements et célébrations
- Filtres (retard, urgent, par personne, par clocher…)

**Definition of Done :**
On sait clairement qui doit faire quoi, pour quand, et pour quel événement.

---

## V5 — Intentions de messe + Paiements

**Objectif :** Gérer les intentions de A à Z.

**Livrables :**
- CRUD Intentions
- Statuts complets (Demandée → À planifier → Planifiée → Célébrée…)
- Lien avec célébrations
- Module Paiements (montant, mode, date, historique)
- Suivi « gratuit / à payer / partiellement payé / payé »
- Historique des paiements (jamais de suppression silencieuse)

**Definition of Done :**
On peut suivre une intention depuis la demande jusqu'à la célébration + paiement.

---

## V6 — Secrétariat

**Objectif :** Suivre les demandes administratives.

**Livrables :**
- Demandes du secrétariat (certificats, baptêmes, mariages, administratives…)
- Statuts + priorités + échéances
- Affectation d'un responsable
- Lien avec tâches et documents
- Tableau de suivi des demandes ouvertes / en retard

**Definition of Done :**
Le secrétariat a une vision claire de tout ce qui est en cours.

---

## V7 — Sacrements + Certificats

**Objectif :** Gérer les registres sacramentels correctement.

**Livrables :**
- Registres sacramentels (baptêmes, mariages, confirmations…)
- Actes sacramentels
- Mentions sacramentelles
- Génération de certificats (sans ressaisie)
- Aperçu + impression + export PDF
- Historique des certificats générés

**Definition of Done :**
On peut enregistrer un acte et générer le certificat correspondant proprement.

---

## V8 — Finances opérationnelles (Quêtes)

**Objectif :** Suivre les quêtes simplement et proprement.

**Livrables :**
- Collectes (liées aux célébrations)
- Comptage (bénévoles compteurs, espèces, chèques, total)
- Remise des quêtes
- Historique complet
- Statistiques simples (par clocher, par secteur, par mois)

**Definition of Done :**
On sait exactement ce qui a été collecté, qui a compté, et si la remise a été faite.

---

## V9 — Fournisseurs + Documents + Historique + Corbeille

**Objectif :** Compléter le système transversal.

**Livrables :**
- Module Fournisseurs
- Système de Documents (lié à presque tout)
- Historique transversal complet
- Corbeille avancée (restauration + suppression définitive)
- Contrôles d'intégrité de base

**Definition of Done :**
Tout a un historique et on peut restaurer ce qui a été supprimé par erreur.

---

## V10 — Recherche + Sauvegarde + Synchronisation + KPI

**Objectif :** Rendre l'outil puissant et multi-postes.

**Livrables :**
- Recherche globale (personnes, familles, événements, intentions, actes…)
- Export / Import / Sauvegarde complète
- Restauration de sauvegarde
- Synchronisation entre installations (fusion intelligente + gestion des conflits)
- Tableau de bord avec vrais KPI cliquables
- Comparaison entre secteurs
- Historique des synchronisations

**Definition of Done :**
Deux ordinateurs peuvent travailler hors ligne et fusionner leurs données proprement. Le tableau de bord est fiable.

---

## V11 — Calendrier liturgique + Finalisation

**Objectif :** Peaufiner et rendre l'application vraiment agréable et robuste.

**Livrables :**
- Calendrier liturgique (fêtes, temps liturgiques, saints)
- Particularités diocésaines (architecture prête)
- Amélioration des performances
- Accessibilité
- Responsive (mobile / tablette)
- Tests complets
- Nettoyage du code
- Documentation finale

**Definition of Done :**
L'application est stable, agréable à utiliser au quotidien, et prête pour une utilisation réelle en paroisse.

---

### Résumé visuel du Roadmap

| Version | Nom                        | Focus principal                      | Priorité |
|---------|---------------------------|--------------------------------------|----------|
| V1      | Fondation                 | Architecture + Dexie + Sync meta     | Critique |
| V2      | Annuaire                  | Personnes & Organisation             | Haute    |
| V3      | Territoire + Agenda       | Lieux + Planification                | Haute    |
| V4      | Tâches                    | Suivi du travail                     | Haute    |
| V5      | Intentions                | Intentions + Paiements               | Haute    |
| V6      | Secrétariat               | Demandes administratives             | Moyenne  |
| V7      | Sacrements                | Registres + Certificats              | Haute    |
| V8      | Quêtes                    | Finances opérationnelles             | Moyenne  |
| V9      | Transversal               | Documents + Historique + Corbeille   | Moyenne  |
| V10     | Puissance                 | Sync + Recherche + KPI               | Haute    |
| V11     | Finalisation              | Liturgie + Qualité                   | Moyenne  |
