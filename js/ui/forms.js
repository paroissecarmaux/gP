// Construction et lecture de champs de formulaire à partir d'une
// configuration déclarative `{ name, label, type, required, options, rules }`.
// Réutilisé par toutes les pages de saisie (section 9 : validation
// centralisée, cohérence visuelle).
(function (gP) {
  'use strict';

  function toDateInputValue(value) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  function toDatetimeInputValue(value) {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
  }

  async function buildField(field, value, ctx) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-field';
    const inputId = `field-${field.name}`;

    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.textContent = field.label + (field.required ? ' *' : '');
    wrapper.appendChild(label);

    let input;

    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = field.rows ?? 3;
      input.value = value ?? '';
    } else if (field.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(value);
    } else if (field.type === 'select' || field.type === 'multiselect') {
      input = document.createElement('select');
      input.multiple = field.type === 'multiselect';
      if (field.type === 'select' && !field.required) {
        const empty = document.createElement('option');
        empty.value = '';
        empty.textContent = '—';
        input.appendChild(empty);
      }
      const options = (await field.options?.(ctx)) ?? [];
      for (const option of options) {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        input.appendChild(opt);
      }
      if (field.type === 'multiselect') {
        const selected = new Set(value ?? []);
        for (const opt of input.options) opt.selected = selected.has(opt.value);
        input.size = Math.min(6, Math.max(3, options.length));
      } else {
        input.value = value ?? '';
      }
    } else {
      input = document.createElement('input');
      input.type =
        field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text';
      if (field.type === 'date') input.value = toDateInputValue(value);
      else if (field.type === 'datetime') input.value = toDatetimeInputValue(value);
      else input.value = value ?? '';
      if (field.step != null) input.step = field.step;
    }

    input.id = inputId;
    input.name = field.name;
    if (field.required && field.type !== 'checkbox') input.setAttribute('aria-required', 'true');

    const errorEl = document.createElement('p');
    errorEl.className = 'field-error';
    errorEl.id = `${inputId}-error`;
    errorEl.hidden = true;
    input.setAttribute('aria-describedby', errorEl.id);

    wrapper.appendChild(input);
    wrapper.appendChild(errorEl);
    return wrapper;
  }

  function readFieldValue(field, form) {
    const input = form.elements.namedItem(field.name);

    if (field.type === 'checkbox') return input.checked;
    if (field.type === 'multiselect') return Array.from(input.selectedOptions).map((o) => o.value);
    if (field.type === 'number') return input.value === '' ? null : Number(input.value);
    if (field.type === 'date' || field.type === 'datetime') return input.value === '' ? null : new Date(input.value);
    if (field.type === 'select') return input.value === '' ? null : input.value;

    return input.value.trim() === '' ? null : input.value;
  }

  function readFormValues(fields, form) {
    const values = {};
    for (const field of fields) values[field.name] = readFieldValue(field, form);
    return values;
  }

  function showFormErrors(form, errors) {
    for (const [name, message] of errors) {
      const input = form.elements.namedItem(name);
      const errorEl = form.querySelector(`#field-${name}-error`);
      input?.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    }
  }

  function clearFormErrors(form) {
    form.querySelectorAll('.field-error').forEach((el) => {
      el.hidden = true;
      el.textContent = '';
    });
    form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  }

  Object.assign(gP.ui, { buildField, readFieldValue, readFormValues, showFormErrors, clearFormErrors });
})(window.gP);
