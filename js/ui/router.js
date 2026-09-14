// Routeur hash minimaliste avec paramètres (ex. "/annuaire/:id"). Parmi
// plusieurs routes dont le nombre de segments correspond au chemin demandé,
// une route sans paramètre l'emporte toujours sur une route avec paramètre
// qui matcherait aussi ce chemin (ex. "/taches/en-retard" face à
// "/taches/:id") : le nombre de segments dynamiques sert de score de
// spécificité, indépendamment de l'ordre d'enregistrement des routes.
(function (gP) {
  'use strict';

  class Router {
    constructor(routes, outlet) {
      this.routes = Object.entries(routes).map(([path, factory]) => ({
        segments: path.split('/').filter(Boolean),
        factory,
      }));
      this.outlet = outlet;
      this.current = null;
      window.addEventListener('hashchange', () => this.resolve());
    }

    start() {
      this.resolve();
    }

    navigate(path) {
      window.location.hash = path;
    }

    match(path) {
      const segments = path.split('/').filter(Boolean);
      let best = null;
      let bestWildcards = Infinity;

      for (const route of this.routes) {
        if (route.segments.length !== segments.length) continue;
        const params = {};
        let wildcards = 0;
        let ok = true;

        for (let i = 0; i < segments.length; i++) {
          const routeSegment = route.segments[i];
          if (routeSegment.startsWith(':')) {
            wildcards += 1;
            params[routeSegment.slice(1)] = decodeURIComponent(segments[i]);
          } else if (routeSegment !== segments[i]) {
            ok = false;
            break;
          }
        }

        if (ok && wildcards < bestWildcards) {
          best = { factory: route.factory, params };
          bestWildcards = wildcards;
          if (wildcards === 0) break;
        }
      }

      return best;
    }

    resolve() {
      const path = window.location.hash.slice(1) || '/';
      const match = this.match(path) ?? this.match('/');

      this.current?.unmount();
      this.current = match.factory(match.params);
      this.current.mount(this.outlet);
    }
  }

  gP.ui.Router = Router;
})(window.gP);
