// Système de composants minimal : sépare la construction du DOM (render)
// du cycle de vie (mount/unmount). Les hooks onMount/onUnmount sont
// optionnels et servent à charger des données ou se désabonner d'événements.
export class Component {
  constructor(props = {}) {
    this.props = props;
    this.el = null;
  }

  render() {
    throw new Error(`${this.constructor.name}.render() doit être implémenté`);
  }

  mount(container) {
    this.el = this.render();
    container.replaceChildren(this.el);
    this.onMount?.();
    return this.el;
  }

  unmount() {
    this.onUnmount?.();
    this.el = null;
  }
}

// Coquille persistante de l'application : en-tête, navigation, zone de
// contenu (outlet) pour le routeur, et emplacement pour les notifications.
export class AppShell extends Component {
  render() {
    const el = document.createElement('div');
    el.className = 'app-shell';

    const nav = (this.props.navItems ?? [])
      .map((item) => `<li><a href="#${item.path}">${item.label}</a></li>`)
      .join('');

    el.innerHTML = `
      <header class="app-header">
        <a class="app-title" href="#/">gParoisse</a>
        <nav class="app-nav"><ul>${nav}</ul></nav>
      </header>
      <div class="notifications-slot"></div>
      <main class="app-outlet"></main>
    `;
    return el;
  }

  get outlet() {
    return this.el.querySelector('.app-outlet');
  }

  get notificationsSlot() {
    return this.el.querySelector('.notifications-slot');
  }
}
