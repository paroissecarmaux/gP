import { db } from '../../db/database.js';
import { syncLogRepository } from './repositories.js';

const LOCAL_ONLY_TABLES = new Set(['_appMeta']);

const DATE_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'deletedAt',
  'occurredAt',
  'birthDate',
  'deathDate',
  'startAt',
  'endAt',
  'dueDate',
  'date',
  'countedAt',
  'clergyOrdinationDate',
  'employeeStartDate',
  'recurrenceUntil',
]);

function reviveDates(row) {
  for (const key of Object.keys(row)) {
    if (DATE_FIELDS.has(key) && typeof row[key] === 'string') {
      row[key] = new Date(row[key]);
    }
  }
  return row;
}

export async function buildBackup() {
  const data = {};
  let recordCount = 0;
  for (const table of db.tables) {
    if (LOCAL_ONLY_TABLES.has(table.name)) continue;
    const rows = await table.toArray();
    data[table.name] = rows;
    recordCount += rows.length;
  }
  return { exportedAt: new Date().toISOString(), data, recordCount };
}

export async function downloadBackup() {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gparoisse-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  await syncLogRepository.create({
    type: 'export',
    summary: `Sauvegarde complète (${backup.recordCount} enregistrements)`,
    occurredAt: new Date(),
  });
  return backup;
}

export async function importBackup(file) {
  const text = await file.text();
  const backup = JSON.parse(text);

  let imported = 0;
  let merged = 0;
  let skipped = 0;

  for (const [tableName, rows] of Object.entries(backup.data ?? {})) {
    if (LOCAL_ONLY_TABLES.has(tableName)) continue;
    const table = db.tables.find((t) => t.name === tableName);
    if (!table) continue;

    for (const rawRow of rows) {
      const row = reviveDates({ ...rawRow });
      const existing = await table.get(row.id);

      if (!existing) {
        await table.put(row);
        imported += 1;
        continue;
      }

      const incomingRevision = row.revision ?? 0;
      const existingRevision = existing.revision ?? 0;
      const incomingIsNewer =
        incomingRevision > existingRevision ||
        (incomingRevision === existingRevision && new Date(row.updatedAt ?? 0) > new Date(existing.updatedAt ?? 0));

      if (incomingIsNewer) {
        await table.put(row);
        merged += 1;
      } else {
        skipped += 1;
      }
    }
  }

  await syncLogRepository.create({
    type: 'import',
    summary: `Import : ${imported} nouveaux, ${merged} fusionnés, ${skipped} ignorés (déjà à jour)`,
    occurredAt: new Date(),
  });

  return { imported, merged, skipped };
}
