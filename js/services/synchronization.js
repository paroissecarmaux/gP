// Synchronisation par échange de fichier (sans serveur) — voir
// docs/SYNCHRONIZATION.md pour la conception complète. Résumé de
// l'algorithme de fusion implémenté ici (basé sur `updatedAt` comparé à la
// date du dernier échange avec CETTE installation précise — `revision`
// seul ne suffit pas, deux éditions indépendantes depuis le dernier
// échange atteignent souvent la même révision avec un contenu différent) :
//   1. Absent localement                              → insertion
//   2. Rien de neuf dans le paquet pour cet
//      enregistrement (incoming pas modifié depuis)    → rien à faire
//   3. Rien changé localement depuis le dernier
//      échange avec cette installation                 → intégration propre
//   4. Modifié des deux côtés depuis le dernier
//      échange, contenus différents                    → conflit
//      (ConflitSynchronisation)
(function (gP) {
  'use strict';

  const syncLogRepository = new gP.db.Repository('syncLog', 'Synchronisation');
  const syncConflictRepository = new gP.db.Repository('syncConflicts', 'Conflit de synchronisation');

  const LOCAL_ONLY_TABLES = new Set(['localSettings']);

  const DATE_FIELDS = new Set([
    'createdAt', 'updatedAt', 'deletedAt', 'occurredAt', 'birthDate', 'deathDate', 'startAt', 'endAt',
    'dueDate', 'date', 'countedAt', 'joinedDate', 'leftDate', 'startDate', 'endDate', 'ordinationDate',
    'openedAt', 'closedAt', 'generatedAt', 'resolvedAt', 'recurrenceUntil',
  ]);

  function reviveDates(row) {
    for (const key of Object.keys(row)) {
      if (DATE_FIELDS.has(key) && typeof row[key] === 'string') row[key] = new Date(row[key]);
    }
    return row;
  }

  function lastSyncKey(installationId) {
    return `lastSyncWith:${installationId}`;
  }

  async function getLastSyncWith(installationId) {
    const setting = await gP.db.db.localSettings.get(lastSyncKey(installationId));
    return setting ? new Date(setting.value) : null;
  }

  async function setLastSyncWith(installationId, date) {
    await gP.db.db.localSettings.put({ key: lastSyncKey(installationId), value: date.toISOString() });
  }

  async function buildBackup() {
    const data = {};
    let recordCount = 0;
    for (const table of gP.db.db.tables) {
      if (LOCAL_ONLY_TABLES.has(table.name)) continue;
      const rows = await table.toArray();
      data[table.name] = rows;
      recordCount += rows.length;
    }
    return {
      originInstallationId: gP.services.getCurrentInstallationId(),
      exportedAt: new Date().toISOString(),
      recordCount,
      data,
    };
  }

  async function downloadBackup() {
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

  /** Contrôle d'intégrité minimal avant fusion : refuse un paquet
   * incompatible ou manifestement corrompu (section 7 du cahier des
   * charges : « refuser les paquets incompatibles ou corrompus »). */
  function validatePackage(backup) {
    if (!backup || typeof backup !== 'object') throw new gP.utils.ValidationError('Fichier de sauvegarde illisible.');
    if (!backup.originInstallationId || !backup.data || typeof backup.data !== 'object') {
      throw new gP.utils.ValidationError("Ce fichier n'est pas un paquet de synchronisation gParoisse valide.");
    }
  }

  async function importBackup(file) {
    const text = await file.text();
    let backup;
    try {
      backup = JSON.parse(text);
    } catch {
      throw new gP.utils.ValidationError('Fichier de sauvegarde illisible (JSON invalide).');
    }
    validatePackage(backup);

    let imported = 0;
    let merged = 0;
    let skipped = 0;
    let conflicts = 0;
    const lastSync = await getLastSyncWith(backup.originInstallationId);

    for (const [tableName, rows] of Object.entries(backup.data)) {
      if (LOCAL_ONLY_TABLES.has(tableName) || tableName === 'syncConflicts') continue;
      const table = gP.db.db.tables.find((t) => t.name === tableName);
      if (!table) continue;

      for (const rawRow of rows) {
        const incoming = reviveDates({ ...rawRow });
        const existing = await table.get(incoming.id);

        if (!existing) {
          await table.put(incoming);
          imported += 1;
          continue;
        }

        // NB : comparer uniquement `revision` ne suffit pas — si les deux
        // côtés éditent indépendamment depuis le dernier échange, ils
        // atteignent chacun `revision + 1`, donc la MÊME révision, avec un
        // contenu DIFFÉRENT. Le signal fiable est le temps écoulé depuis le
        // dernier échange avec CETTE installation précise (`lastSync`),
        // comparé à `updatedAt` de chaque côté — pas le compteur `revision`.
        const existingChangedSinceSync = !lastSync || new Date(existing.updatedAt) > lastSync;
        const incomingChangedSinceSync = !lastSync || new Date(incoming.updatedAt) > lastSync;

        if (!incomingChangedSinceSync) {
          // Le paquet ne contient rien de neuf pour cet enregistrement.
          skipped += 1;
          continue;
        }

        if (!existingChangedSinceSync) {
          // Cas 3 : rien changé localement depuis le dernier échange avec
          // cette installation → intégration propre.
          await table.put(incoming);
          merged += 1;
          continue;
        }

        if (JSON.stringify(incoming) === JSON.stringify(existing)) {
          // Les deux côtés ont changé, mais sont arrivés au même résultat.
          skipped += 1;
        } else {
          // Cas 4 : modifié des deux côtés depuis le dernier échange, avec
          // des résultats différents → conflit. On ne touche pas à
          // l'enregistrement local tant qu'il n'est pas résolu.
          await syncConflictRepository.create({
            entityType: tableName,
            entityId: incoming.id,
            localSnapshot: existing,
            incomingSnapshot: incoming,
            detectedAt: new Date(),
            resolvedAt: null,
            resolution: null,
          });
          conflicts += 1;
        }
      }
    }

    await setLastSyncWith(backup.originInstallationId, new Date());

    await syncLogRepository.create({
      type: 'import',
      summary: `Import : ${imported} nouveaux, ${merged} fusionnés, ${skipped} ignorés, ${conflicts} conflit(s)`,
      occurredAt: new Date(),
    });

    return { imported, merged, skipped, conflicts };
  }

  async function resolveConflict(conflictId, resolution) {
    const conflict = await syncConflictRepository.get(conflictId);
    if (!conflict) throw new gP.utils.DatabaseError('Conflit introuvable');

    const table = gP.db.db.tables.find((t) => t.name === conflict.entityType);
    let finalRecord;

    if (resolution === 'local') {
      finalRecord = gP.utils.touch(conflict.localSnapshot);
    } else if (resolution === 'incoming') {
      finalRecord = gP.utils.touch({ ...conflict.incomingSnapshot, revision: conflict.localSnapshot.revision });
    } else if (resolution?.merged) {
      finalRecord = gP.utils.touch({ ...conflict.localSnapshot, ...resolution.merged });
    } else {
      throw new gP.utils.ValidationError('Résolution invalide.');
    }

    await table.put(finalRecord);
    await syncConflictRepository.update(conflictId, { resolvedAt: new Date(), resolution: typeof resolution === 'string' ? resolution : 'merged' });
    return finalRecord;
  }

  Object.assign(gP.services, {
    syncLogRepository,
    syncConflictRepository,
    downloadBackup,
    importBackup,
    resolveConflict,
  });

  gP.db.registerEntity({ key: 'syncLog', label: 'Synchronisation', repository: syncLogRepository });
  gP.db.registerEntity({ key: 'syncConflicts', label: 'Conflit de synchronisation', repository: syncConflictRepository });
})(window.gP);
