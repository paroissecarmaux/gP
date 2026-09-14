import { db } from '../db/database.js';
import { generateId } from '../utils/uuid.js';
import { getCurrentInstallationId } from './session.js';

export async function recordHistory(entityType, entityId, action, summary = '') {
  await db.history.put({
    id: generateId(),
    entityType,
    entityId,
    action,
    summary,
    occurredAt: new Date(),
    installationId: getCurrentInstallationId(),
  });
}

export async function historyForEntity(entityType, entityId) {
  const rows = await db.history.where({ entityType, entityId }).toArray();
  return rows.sort((a, b) => b.occurredAt - a.occurredAt);
}

export async function recentHistory(limit = 50) {
  const rows = await db.history.orderBy('occurredAt').reverse().limit(limit).toArray();
  return rows;
}
