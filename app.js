const $ = (selector) => document.querySelector(selector);
const fallbackLocale = 'en';
const supportedLocales = ['ru', 'en', 'cs', 'de'];
const stored = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, String(value)); } catch { /* Storage may be disabled. */ } };
const browserLocale = (navigator.languages || [navigator.language || fallbackLocale]).map((language) => language.split('-')[0]).find((language) => supportedLocales.includes(language));
let locale = supportedLocales.includes(stored('denkmit.locale', browserLocale || fallbackLocale)) ? stored('denkmit.locale', browserLocale || fallbackLocale) : fallbackLocale;
let translations = {};
let products = [];
const state = {
  product: stored('denkmit.product', 'color-gel'),
  hardness: [0, 1, 2].includes(Number(stored('denkmit.hardness', '0'))) ? Number(stored('denkmit.hardness', '0')) : 0,
  soil: 1,
  weight: 2.5,
};
function format(number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(number);
}
function translate(key, values = {}) {
  return Object.entries(values).reduce((value, [name, replacement]) => value.replaceAll(`{${name}}`, replacement), translations[key] || key);
}
function renderTranslations() {
  document.documentElement.lang = locale;
  document.title = translate('title');
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.textContent = translate(element.dataset.i18n); });
  $('#language').value = locale;
}
async function changeLocale(nextLocale) {
  if (!supportedLocales.includes(nextLocale)) return;
  try {
    const response = await fetch(`./locales/${nextLocale}.json`);
    if (!response.ok) throw new Error('Translation request failed');
    const nextTranslations = await response.json();
    locale = nextLocale;
    translations = nextTranslations;
    save('denkmit.locale', locale);
    renderTranslations();
    $('#weight-label').textContent = `${format(state.weight)} kg`;
    renderResult();
  } catch (error) { console.warn('Unable to switch language', error); }
}
function estimatedDosage(product, baseDose, weight) {
  if (product.kind === 'additive') return product.fixedMl;
  if (product.loadAdjustments) {
    const rules = product.loadAdjustments;
    if (weight <= rules.smallKgMax) return Math.max(5, baseDose + rules.smallMl);
    if (weight >= rules.largeKgMin && weight <= rules.largeKgMax) return baseDose + rules.largeMl;
  }
  const ratio = weight / product.standardKg;
  if (ratio === 1) return baseDose;
  // Non-standard loads have no verified manufacturer table; apply a conservative floor.
  const scaled = baseDose * Math.max(0.55, ratio);
  return Math.max(5, Math.round(scaled / 5) * 5);
}
function renderProductArt(product) {
  const colors = product.kind === 'powder' ? ['#edf2eb', '#438a78'] : product.id === 'black-gel' ? ['#32263c', '#b38dc2'] : product.id === 'sport-gel' ? ['#c5e7ef', '#2184aa'] : product.id === 'care-gel' ? ['#d8eef1', '#68a9b8'] : product.id === 'wool-gel' ? ['#f2f5eb', '#86a99a'] : product.id === 'hygiene-rinse' ? ['#dcecf7', '#4d91b8'] : ['#eef2ef', '#8bb4b1'];
  const [body, accent] = colors;
  const art = document.querySelector('#product-art');
  art.replaceChildren();
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 36 48');
  const shapes = [
    ['path', {d:'M13 3h10v5l5 6 2 28q0 4-4 4H10q-4 0-4-4l2-28 5-6Z',fill:body,stroke:'#829b92','stroke-width':'1.1'}],
    ['rect', {x:11,y:1,width:14,height:6,rx:2,fill:accent}],
    ['rect', {x:9,y:19,width:18,height:19,rx:3,fill:'#ffffff',stroke:'#dce6e1'}],
    ['rect', {x:10,y:25,width:16,height:9,rx:1,fill:accent}],
    ['path', {d:'M13 22h10',stroke:'#67877b','stroke-width':1.5}]
  ];
  for (const [tag, attrs] of shapes) {
    const node = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    svg.append(node);
  }
  art.append(svg);
}
function renderResult() {
  const product = products.find((item) => item.id === state.product);
  if (!product) return;
  const base = product.kind === 'additive' ? product.fixedMl : product.doses[state.hardness][state.soil];
  renderProductArt(product);
  const dose = estimatedDosage(product, base, state.weight);
  $('#dose').textContent = `${format(dose, 0)} ml`;
  const extras = [];
  if (product.kind === 'liquid' && product.capMl) extras.push(translate('cap', { n: format(dose / product.capMl) }));
  if (product.kind === 'powder' && product.gramsPerMl) extras.push(translate('grams', { n: format(dose * product.gramsPerMl, 0) }));
  $('#secondary').textContent = extras.join(' · ');
  const rules = product.loadAdjustments;
  const isSmall = rules && state.weight <= rules.smallKgMax;
  const isLarge = rules && state.weight >= rules.largeKgMin && state.weight <= rules.largeKgMax;
  const key = product.kind === 'additive' ? 'additive' : isSmall ? 'smallAdjustment' : isLarge ? 'largeAdjustment' : state.weight === product.standardKg ? 'standard' : state.weight < product.standardKg ? 'estimate' : 'larger';
  $('#basis').textContent = translate(key, { kg: format(product.standardKg || 0) });
  $('#source').hidden = product.kind === 'additive';
  if (product.kind !== 'additive') $('#source').href = product.source;
  const additive = product.kind === 'additive';
  document.querySelectorAll('.controls .field:nth-child(2), .controls fieldset').forEach((element) => { element.hidden = additive; });
}
async function start() {
  try {
    const response = await fetch('./products.json');
    if (!response.ok) throw new Error('Product request failed');
    ({ products } = await response.json());
    if (!products.some((product) => product.id === state.product)) state.product = products[0].id;
    const detergentGroup = document.createElement('optgroup');
    detergentGroup.label = 'Detergents';
    const additiveGroup = document.createElement('optgroup');
    additiveGroup.label = 'Additives';
    products.forEach((product) => (product.kind === 'additive' ? additiveGroup : detergentGroup).append(new Option(product.name, product.id)));
    $('#product').replaceChildren(detergentGroup, additiveGroup);
    $('#product').value = state.product;
    $('#weight').value = String(state.weight);
    document.querySelector(`input[name="hardness"][value="${state.hardness}"]`).checked = true;
    await changeLocale(locale);
    $('#product').addEventListener('change', (event) => { state.product = event.target.value; save('denkmit.product', state.product); renderResult(); });
    $('#weight').addEventListener('input', (event) => { state.weight = Number(event.target.value); $('#weight-label').textContent = `${format(state.weight)} kg`; renderResult(); });
    document.querySelectorAll('input[name="hardness"]').forEach((input) => input.addEventListener('change', (event) => { state.hardness = Number(event.target.value); save('denkmit.hardness', state.hardness); renderResult(); }));
    document.querySelectorAll('input[name="soil"]').forEach((input) => input.addEventListener('change', (event) => { state.soil = Number(event.target.value); renderResult(); }));
    $('#language').addEventListener('change', (event) => { void changeLocale(event.target.value); });
    $('#weight-label').textContent = `${format(state.weight)} kg`;
    if ('serviceWorker' in navigator) window.addEventListener('load', () => { void navigator.serviceWorker.register('./sw.js'); });
  } catch (error) {
    console.error(error);
    $('#dose').textContent = '—';
    $('#basis').textContent = translations.error || 'Could not load dosage data. Try again online.';
  }
}
void start();