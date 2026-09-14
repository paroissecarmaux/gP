import { v1Stores } from './schemas/v1.js';
import { v2Stores } from './schemas/v2.js';
import { v3Stores } from './schemas/v3.js';
import { v4Stores } from './schemas/v4.js';
import { v5Stores } from './schemas/v5.js';
import { v6Stores } from './schemas/v6.js';
import { v7Stores } from './schemas/v7.js';
import { v8Stores } from './schemas/v8.js';
import { v9Stores } from './schemas/v9.js';
import { v10Stores } from './schemas/v10.js';
import { v11Stores } from './schemas/v11.js';

// Chaque entrée décrit une version du schéma Dexie. `stores` suit la syntaxe
// Dexie (premier champ = clé primaire, suivants = index). `upgrade`, quand
// présent, transforme les données existantes lors du passage à cette version.
export const migrations = [
  { version: 1, stores: v1Stores },
  { version: 2, stores: v2Stores },
  { version: 3, stores: v3Stores },
  { version: 4, stores: v4Stores },
  { version: 5, stores: v5Stores },
  { version: 6, stores: v6Stores },
  { version: 7, stores: v7Stores },
  { version: 8, stores: v8Stores },
  { version: 9, stores: v9Stores },
  { version: 10, stores: v10Stores },
  { version: 11, stores: v11Stores },
];
