import { db } from '../db/database.js';
import { createEntity, touch } from '../utils/syncMeta.js';
import { DatabaseError } from '../errors/AppError.js';

const CURRENT_INSTALLATION_KEY = 'currentInstallationId';

async function withDatabaseError(action, message) {
  try {
    return await action();
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(message, { cause: error });
  }
}

export async function getCurrentInstallation() {
  return withDatabaseError(async () => {
    const meta = await db._appMeta.get(CURRENT_INSTALLATION_KEY);
    if (!meta) return null;
    const installation = await db.installations.get(meta.value);
    return installation ?? null;
  }, "Impossible de récupérer l'installation courante");
}

export async function createInstallation(name) {
  return withDatabaseError(async () => {
    const draft = createEntity({ name }, null);
    const installation = { ...draft, originInstallationId: draft.id };
    await db.installations.put(installation);
    return installation;
  }, "Impossible de créer l'installation");
}

export async function setCurrentInstallation(installationId) {
  return withDatabaseError(async () => {
    await db._appMeta.put({ key: CURRENT_INSTALLATION_KEY, value: installationId });
  }, "Impossible d'enregistrer l'installation courante");
}

export async function ensureCurrentInstallation(defaultName) {
  const existing = await getCurrentInstallation();
  if (existing) return existing;

  const installation = await createInstallation(defaultName);
  await setCurrentInstallation(installation.id);
  return installation;
}

export async function renameInstallation(installationId, name) {
  return withDatabaseError(async () => {
    const installation = await db.installations.get(installationId);
    if (!installation) {
      throw new DatabaseError(`Installation ${installationId} introuvable`);
    }
    const updated = touch({ ...installation, name });
    await db.installations.put(updated);
    return updated;
  }, "Impossible de renommer l'installation");
}
