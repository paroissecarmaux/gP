import { Component } from '../core/Component.js';
import { onError } from '../../errors/errorHandler.js';

export class AppShell extends Component {
  render() {
    const el = document.createElement('div');
    el.className = 'app-shell';

    const nav = (this.props.navSections ?? [])
      .map(
        (section) => `
          <div class="nav-section">
            <h3>${section.section}</h3>
            <ul>
              ${section.items.map((item) => `<li><a href="#${item.path}">${item.label}</a></li>`).join('')}
            </ul>
          </div>
        `,
      )
      .join('');

    el.innerHTML = `
      <header class="app-header">
        <a class="app-title" href="#/">gParoisse</a>
      </header>
      <div class="app-body">
        <nav class="app-nav">${nav}</nav>
        <div class="app-content">
          <div class="error-banner" role="alert" hidden></div>
          <main class="app-outlet"></main>
        </div>
      </div>
    `;
    return el;
  }

  onMount() {
    this.unsubscribe = onError((error) => this.showError(error));
  }

  onUnmount() {
    this.unsubscribe?.();
  }

  showError(error) {
    const banner = this.el.querySelector('.error-banner');
    banner.textContent = error.message;
    banner.hidden = false;
  }

  get outlet() {
    return this.el.querySelector('.app-outlet');
  }
}
