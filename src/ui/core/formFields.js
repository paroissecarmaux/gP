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

export async function buildFieldInput(field, value, ctx) {
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
    const options = await field.options(ctx);
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
  } else if (field.type === 'file') {
    input = document.createElement('input');
    input.type = 'file';
    if (field.accept) input.accept = field.accept;
    if (value?.name) {
      const current = document.createElement('p');
      current.className = 'form-field-current';
      current.textContent = `Fichier actuel : ${value.name}`;
      wrapper.appendChild(current);
    }
  } else {
    input = document.createElement('input');
    input.type = field.type === 'date' ? 'date' : field.type === 'datetime' ? 'datetime-local' : field.type === 'number' ? 'number' : 'text';
    if (field.type === 'date') input.value = toDateInputValue(value);
    else if (field.type === 'datetime') input.value = toDatetimeInputValue(value);
    else input.value = value ?? '';
    if (field.step != null) input.step = field.step;
  }

  input.id = inputId;
  input.name = field.name;
  if (field.required && field.type !== 'checkbox') input.required = true;

  wrapper.appendChild(input);
  return wrapper;
}

export function readFieldValue(field, form) {
  const input = form.elements.namedItem(field.name);

  if (field.type === 'checkbox') return input.checked;
  if (field.type === 'file') return input.files.length > 0 ? input.files[0] : undefined;
  if (field.type === 'multiselect') return Array.from(input.selectedOptions).map((o) => o.value);
  if (field.type === 'number') return input.value === '' ? null : Number(input.value);
  if (field.type === 'date' || field.type === 'datetime') return input.value === '' ? null : new Date(input.value);
  if (field.type === 'select') return input.value === '' ? null : input.value;

  return input.value.trim() === '' ? null : input.value;
}
