// Schéma Dexie, une entrée par version livrée. Règle absolue : une version
// déjà publiée ne se modifie jamais — toute évolution ajoute une nouvelle
// entrée (voir docs/MIGRATIONS.md). Syntaxe des tables : chaîne Dexie
// "clé primaire, index1, index2...".
export const SCHEMA = {
  1: {
    // Un enregistrement par poste connu (le sien, et ceux découverts lors
    // de synchronisations futures). `originInstallationId` vaut son propre
    // `id` pour la toute première installation créée sur ce poste.
    installations: 'id, updatedAt, deletedAt, originInstallationId',
    // Réglages strictement locaux à ce poste (ex. quelle ligne de
    // `installations` représente CE poste) : jamais synchronisés, jamais
    // exportés. Pas de métadonnées de synchro ici, par nature.
    localSettings: 'key',
  },
};
