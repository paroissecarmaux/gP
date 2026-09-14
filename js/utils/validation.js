// Validation centralisée (section 9 du cahier des charges : « Validation
// centralisée »). Chaque règle prend une valeur et renvoie un message
// d'erreur (chaîne) ou rien si la valeur est valide.
export const rules = {
  required: (value) => {
    if (value == null) return 'Ce champ est obligatoire.';
    if (typeof value === 'string' && value.trim() === '') return 'Ce champ est obligatoire.';
    if (Array.isArray(value) && value.length === 0) return 'Ce champ est obligatoire.';
  },
  email: (value) => {
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Adresse email invalide.';
  },
};

/**
 * Valide un objet `values` par rapport à une liste de champs
 * `{ name, required, rules: [...] }`. Renvoie une Map<name, message>,
 * vide si tout est valide.
 */
export function validate(fields, values) {
  const errors = new Map();

  for (const field of fields) {
    const value = values[field.name];

    if (field.required) {
      const message = rules.required(value);
      if (message) {
        errors.set(field.name, message);
        continue;
      }
    }

    for (const ruleName of field.rules ?? []) {
      const message = rules[ruleName]?.(value);
      if (message) {
        errors.set(field.name, message);
        break;
      }
    }
  }

  return errors;
}
