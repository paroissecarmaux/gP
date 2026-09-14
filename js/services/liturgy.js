// Calendrier liturgique romain (rite ordinaire), calculé — pas stocké, à
// l'exception des particularités diocésaines (voir docs/ENTITIES.md § V11).
// Simplification assumée : l'Épiphanie est fixée au 6 janvier (non
// reportée au dimanche) ; les dates peuvent différer de quelques jours des
// usages locaux autour de Noël/Épiphanie — à corriger via les
// particularités diocésaines si besoin.
(function (gP) {
  'use strict';

  const diocesanFeastRepository = new gP.db.Repository('diocesanFeasts', 'Particularité diocésaine');

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function nearestSunday(date) {
    const day = date.getDay();
    const diff = day <= 3 ? -day : 7 - day;
    return addDays(date, diff);
  }

  function nextSundayStrictlyAfter(date) {
    let result = addDays(date, 1);
    while (result.getDay() !== 0) result = addDays(result, 1);
    return result;
  }

  // Algorithme de Meeus/Jones/Butcher (calendrier grégorien).
  function computeEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  const FIXED_FEASTS = [
    { month: 1, day: 1, name: 'Sainte Marie, Mère de Dieu' },
    { month: 1, day: 6, name: 'Épiphanie' },
    { month: 2, day: 2, name: 'Présentation du Seigneur' },
    { month: 3, day: 19, name: 'Saint Joseph' },
    { month: 3, day: 25, name: 'Annonciation' },
    { month: 6, day: 24, name: 'Nativité de saint Jean-Baptiste' },
    { month: 6, day: 29, name: 'Saints Pierre et Paul' },
    { month: 8, day: 15, name: 'Assomption' },
    { month: 11, day: 1, name: 'Toussaint' },
    { month: 11, day: 2, name: 'Commémoration des fidèles défunts' },
    { month: 12, day: 8, name: 'Immaculée Conception' },
    { month: 12, day: 25, name: 'Noël' },
  ];

  function movableFeasts(year) {
    const easter = computeEaster(year);
    const epiphany = new Date(year, 0, 6);
    return [
      { date: addDays(easter, -46), name: 'Mercredi des Cendres' },
      { date: addDays(easter, -7), name: 'Dimanche des Rameaux' },
      { date: addDays(easter, -3), name: 'Jeudi saint' },
      { date: addDays(easter, -2), name: 'Vendredi saint' },
      { date: addDays(easter, -1), name: 'Vigile pascale' },
      { date: easter, name: 'Pâques' },
      { date: addDays(easter, 39), name: 'Ascension' },
      { date: addDays(easter, 49), name: 'Pentecôte' },
      { date: nearestSunday(new Date(year, 10, 30)), name: "1er dimanche de l'Avent" },
      { date: nextSundayStrictlyAfter(epiphany), name: 'Baptême du Seigneur' },
    ];
  }

  function liturgicalSeasons(year) {
    const easter = computeEaster(year);
    const ashWednesday = addDays(easter, -46);
    const pentecost = addDays(easter, 49);
    const adventStart = nearestSunday(new Date(year, 10, 30));
    const baptism = nextSundayStrictlyAfter(new Date(year, 0, 6));

    return [
      { name: 'Temps ordinaire', start: addDays(baptism, 1), end: addDays(ashWednesday, -1) },
      { name: 'Carême', start: ashWednesday, end: addDays(easter, -1) },
      { name: 'Temps pascal', start: easter, end: pentecost },
      { name: 'Temps ordinaire', start: addDays(pentecost, 1), end: addDays(adventStart, -1) },
      { name: 'Avent', start: adventStart, end: new Date(year, 11, 24) },
      { name: 'Noël', start: new Date(year, 11, 25), end: new Date(year, 11, 31) },
    ];
  }

  function seasonOn(date) {
    const seasons = liturgicalSeasons(date.getFullYear());
    return seasons.find((s) => date >= s.start && date <= s.end)?.name ?? 'Temps ordinaire';
  }

  function feastsForYear(year, diocesanFeasts = []) {
    const fixed = FIXED_FEASTS.map((f) => ({ date: new Date(year, f.month - 1, f.day), name: f.name, source: 'Calendrier romain' }));
    const movable = movableFeasts(year).map((f) => ({ ...f, source: 'Calendrier romain' }));
    const diocesan = diocesanFeasts.map((f) => ({ date: new Date(year, f.month - 1, f.day), name: f.name, source: 'Diocèse' }));
    return [...fixed, ...movable, ...diocesan].sort((a, b) => a.date - b.date);
  }

  Object.assign(gP.services, { diocesanFeastRepository, computeEaster, feastsForYear, seasonOn });

  gP.db.registerEntity({ key: 'diocesanFeasts', label: 'Particularité diocésaine', repository: diocesanFeastRepository, searchFields: ['name'], path: '/liturgie/particularites' });
})(window.gP);
