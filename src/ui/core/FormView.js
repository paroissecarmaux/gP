import { Component } from './Component.js';
import { reportError } from '../../errors/errorHandler.js';
import { buildFieldInput, readFieldValue } from './formFields.js';

export class FormView extends Component {
  render() {
    const el = document.createElement('section');
    el.className = 'form-view';
    el.innerHTML = `
      <div class="form-view-header">
        <h2>${this.props.title}</h2>
        <a href="#${this.props.backPath}">← Retour</a>
      </div>
      <form class="entity-form">
        <div class="form-fields"><p>Chargement…</p></div>
        <div class="form-actions">
          <button type="submit">Enregistrer</button>
          <a class="button-secondary" href="#${this.props.backPath}">Annuler</a>
        </div>
      </form>
    `;
    return el;
  }

  async onMount() {
    try {
      this.ctx = this.props.prepareContext ? await this.props.prepareContext() : {};
      this.entity = this.props.id ? await this.props.repository.get(this.props.id) : null;

      const fieldsContainer = this.el.querySelector('.form-fields');
      fieldsContainer.replaceChildren();
      for (const field of this.props.fields) {
        const value = this.entity ? this.entity[field.name] : field.default;
        const input = await buildFieldInput(field, value, this.ctx);
        fieldsContainer.appendChild(input);
      }

      this.el.querySelector('form').addEventListener('submit', (event) => this.handleSubmit(event));

      if (this.entity && this.props.extraLinks) {
        const actions = this.el.querySelector('.form-actions');
        for (const extra of this.props.extraLinks) {
          const link = document.createElement('a');
          link.className = 'button-secondary';
          link.href = `#${extra.path(this.entity)}`;
          link.textContent = extra.label;
          actions.appendChild(link);
        }
      }
    } catch (error) {
      reportError(error, { source: this.props.title });
    }
  }

  async handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    try {
      const values = {};
      for (const field of this.props.fields) {
        const value = readFieldValue(field, form);
        if (value !== undefined) values[field.name] = value;
      }
      if (this.props.transform) Object.assign(values, this.props.transform(values, this.ctx));

      const saved = this.entity
        ? await this.props.repository.update(this.entity.id, values)
        : await this.props.repository.create(values);

      this.props.afterSave?.(saved);
      window.location.hash = this.props.backPath;
    } catch (error) {
      reportError(error, { source: this.props.title });
    }
  }
}
