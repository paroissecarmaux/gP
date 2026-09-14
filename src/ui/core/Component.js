export class Component {
  constructor(props = {}) {
    this.props = props;
    this.el = null;
  }

  render() {
    throw new Error(`${this.constructor.name}.render() must be implemented`);
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
