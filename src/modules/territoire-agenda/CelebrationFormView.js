import { FormView } from '../../ui/core/FormView.js';
import { readFieldValue } from '../../ui/core/formFields.js';
import { reportError } from '../../errors/errorHandler.js';
import { findConflictsFor } from './conflicts.js';

function addInterval(date, frequency) {
  const next = new Date(date);
  if (frequency === 'Hebdomadaire') next.setDate(next.getDate() + 7);
  else if (frequency === 'Mensuelle') next.setMonth(next.getMonth() + 1);
  return next;
}

function computeOccurrences(startAt, endAt, frequency, until) {
  if (!frequency || frequency === 'Aucune' || !until) return [{ startAt, endAt }];

  const occurrences = [];
  let start = startAt;
  let end = endAt;
  const untilDate = new Date(until);
  untilDate.setHours(23, 59, 59, 999);

  while (start <= untilDate) {
    occurrences.push({ startAt: start, endAt: end });
    start = addInterval(start, frequency);
    end = addInterval(end, frequency);
  }
  return occurrences;
}

export class CelebrationFormView extends FormView {
  async handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      const values = {};
      for (const field of this.props.fields) values[field.name] = readFieldValue(field, form);
      const { recurrenceFrequency, recurrenceUntil, ...rest } = values;

      const occurrences = computeOccurrences(rest.startAt, rest.endAt, recurrenceFrequency, recurrenceUntil);

      const conflicts = occurrences.flatMap((occurrence) =>
        findConflictsFor({ ...rest, ...occurrence, id: this.entity?.id }, this.ctx.celebrations),
      );
      if (conflicts.length > 0) {
        const names = [...new Set(conflicts.map((c) => c.title))].join(', ');
        const proceed = confirm(
          `Conflit d'agenda détecté avec : ${names}. Enregistrer quand même ?`,
        );
        if (!proceed) return;
      }

      let first = true;
      for (const occurrence of occurrences) {
        const data = { ...rest, ...occurrence };
        if (this.entity && first) {
          await this.props.repository.update(this.entity.id, data);
        } else {
          await this.props.repository.create(data);
        }
        first = false;
      }

      window.location.hash = this.props.backPath;
    } catch (error) {
      reportError(error, { source: this.props.title });
    }
  }
}
