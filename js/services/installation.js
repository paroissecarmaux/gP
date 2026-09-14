import { db } from '../db/database.js';
import { createEntity, touch } from '../utils/syncMeta.js';
import { DatabaseError, AppError } from '../utils/errors.js';

const CURRENT_INSTALLATION_KEY = 'currentInstallationId';

let currentInstallationId = null;

async function withDatabaseError(action, message) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(message, { cause: error });
  }
}

async function getCurrentInstallation() {
  return withDatabaseError(async () => {
    const setting = await db.localSettings.get(CURRENT_INSTALLATION_KEY);
    if (!setting) return null;
    return (await db.installations.get(setting.value)) ?? null;
  }, "Impossible de récupérer l'installation courante");
}

async function createInstallation(name) {
  return withDatabaseError(async () => {
    // Auto-référencée : cette installation est sa propre origine, avant
    // toute synchronisation avec un autre poste.
    const draft = createEntity({ name }, null);
    const installation = { ...draft, originInstallationId: draft.id };
    await db.installations.put(installation);
    return installation;
  }, "Impossible de créer l'installation");
}

/**
 * Garantit qu'une installation locale existe pour ce poste et la renvoie.
 * À appeler une fois au démarrage de l'application.
 */
export async function ensureCurrentInstallation(defaultName) {
  const existing = await getCurrentInstallation();
  if (existing) {
    currentInstallationId = existing.id;
    return existing;
  }

  const installation = await createInstallation(defaultName);
  await withDatabaseError(
    () => db.localSettings.put({ key: CURRENT_INSTALLATION_KEY, value: installation.id }),
    "Impossible d'enregistrer l'installation courante",
  );
  currentInstallationId = installation.id;
  return installation;
}

/**
 * Identifiant de l'installation courante, utilisé par tout code créant une
 * entité (métadonnée `originInstallationId`). Lève une erreur si appelé
 * avant `ensureCurrentInstallation()`.
 */
export function getCurrentInstallationId() {
  if (!currentInstallationId) {
    throw new AppError('Installation courante non initialisée');
  }
  return currentInstallationId;
}

export async function renameInstallation(installationId, name) {
  return withDatabaseError(async () => {
    const installation = await db.installations.get(installationId);
    if (!installation) throw new DatabaseError(`Installation ${installationId} introuvable`);
    const updated = touch({ ...installation, name });
    await db.installations.put(updated);
    return updated;
  }, "Impossible de renommer l'installation");
}
