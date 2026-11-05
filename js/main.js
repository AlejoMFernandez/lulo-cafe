import { initKit } from '../kit/kit.js?v=1';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const html = document.documentElement;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esDesk = () => matchMedia('(min-width: 1100px)').matches;

/* ---------------- INTRO ---------------- */
function intro() {
  const box = $('#intro');
  const listo = () => document.body.classList.add('listo');
  if (!html.classList.contains('con-intro') || !box) { listo(); return; }
  const t0 = performance.now();
  const minimo = esDesk() ? 1550 : 1150;
  const heroImg = $('#platoHero img');
  const espera = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
  ]);
  const tope = new Promise(r => setTimeout(r, 2600));
  Promise.race([espera, tope]).then(() => {
    const falta = Math.max(0, minimo - (performance.now() - t0));
    setTimeout(() => {
      const r = $('#platoHero').getBoundingClientRect();
      box.style.setProperty('--cx', `${r.left + r.width / 2}px`);
      box.style.setProperty('--cy', `${r.top + r.height / 2}px`);
      box.style.setProperty('--r', '0px');
      box.classList.add('cierra');
      listo();
      setTimeout(() => { html.classList.remove('con-intro'); box.remove(); }, 720);
    }, falta);
  });
}
intro();

/* ---------------- BARRA + MENÚ ---------------- */
const barra = $('#barra');
const hero = $('#inicio');
let ticking = false;
function pintarBarra() {
  ticking = false;
  if (document.body.style.position === 'fixed') return;
  const lim = (hero?.offsetHeight || 600) - 70;
  barra.classList.toggle('solida', scrollY > lim);
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(pintarBarra); } }, { passive: true });
pintarBarra();

const menu = $('#menu');
const btnMenu = $('.btn-menu');
let scrollGuardado = 0;
function bloquear(on) {
  if (on) {
    scrollGuardado = scrollY;
    document.body.style.position = 'fixed'; document.body.style.top = `-${scrollGuardado}px`; document.body.style.width = '100%';
  } else {
    document.body.style.position = ''; document.body.style.top = ''; document.body.style.width = '';
    html.style.scrollBehavior = 'auto'; scrollTo(0, scrollGuardado); html.style.scrollBehavior = '';
  }
}
function toggleMenu(on) {
  menu.hidden = !on;
  document.body.classList.toggle('menu-abierto', on);
  btnMenu.setAttribute('aria-expanded', on);
  btnMenu.setAttribute('aria-label', on ? 'Cerrar menú' : 'Abrir menú');
  bloquear(on);
}
btnMenu.addEventListener('click', () => toggleMenu(menu.hidden));
menu.addEventListener('click', (e) => {
  const a = e.target.closest('a'); if (!a) return;
  e.preventDefault();
  const dest = $(a.getAttribute('href'));
  toggleMenu(false);
  requestAnimationFrame(() => dest?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) toggleMenu(false); });

/* ---------------- ENTRADAS AL SCROLL ---------------- */
const io = new IntersectionObserver((ents) => {
  ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } });
}, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
function observar(root = document) { $$('.rv:not(.visto)', root).forEach(el => io.observe(el)); }
observar();
// grupos escalonados
$$('.llevar, .eventos, .resenas').forEach(g => $$(':scope > *', g).forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', i); }));
$$('.galeria .g').forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--d', i % 3); });
observar();

/* ---------------- FILAS DESLIZABLES (arrastre con mouse) ---------------- */
function deslizable(fila) {
  let x0 = 0, s0 = 0, activo = false, movio = false, id = null, vx = 0, last = 0, lastT = 0, raf = 0;
  fila.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || fila.scrollWidth <= fila.clientWidth + 2) return;
    activo = true; movio = false; x0 = e.clientX; s0 = fila.scrollLeft; id = e.pointerId; last = e.clientX; lastT = performance.now(); vx = 0;
    cancelAnimationFrame(raf);
  });
  addEventListener('pointermove', (e) => {
    if (!activo || e.pointerId !== id) return;
    const dx = e.clientX - x0;
    if (!movio && Math.abs(dx) > 5) { movio = true; fila.classList.add('arrastra'); }
    if (movio) {
      e.preventDefault();
      fila.scrollLeft = s0 - dx;
      const now = performance.now(); vx = (e.clientX - last) / Math.max(1, now - lastT); last = e.clientX; lastT = now;
    }
  }, { passive: false });
  const fin = () => {
    if (!activo) return; activo = false;
    if (!movio) return;
    let v = vx * 16;
    const asentar = () => {
      fila.classList.remove('arrastra');
      const hijos = Array.from(fila.children); if (!hijos.length) return;
      const base = hijos[0].offsetLeft;
      const cerca = hijos.reduce((m, h) => Math.abs(h.offsetLeft - base - fila.scrollLeft) < Math.abs(m.offsetLeft - base - fila.scrollLeft) ? h : m, hijos[0]);
      fila.scrollTo({ left: cerca.offsetLeft - base, behavior: reduce ? 'auto' : 'smooth' });
    };
    const paso = () => {
      if (Math.abs(v) < 0.4) { asentar(); return; }
      fila.scrollLeft -= v; v *= 0.92; raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    const bloqueaClick = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    fila.addEventListener('click', bloqueaClick, { capture: true, once: true });
    setTimeout(() => fila.removeEventListener('click', bloqueaClick, { capture: true }), 60);
  };
  addEventListener('pointerup', fin);
  addEventListener('pointercancel', fin);
  fila.addEventListener('dragstart', (e) => e.preventDefault());
}
$$('[data-desliza]').forEach(deslizable);
$$('[data-mover]').forEach(b => b.addEventListener('click', () => {
  const fila = $('#resenas-fila'); const card = fila.firstElementChild;
  fila.scrollBy({ left: Number(b.dataset.mover) * (card.offsetWidth + 28), behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---------------- HORARIO / ABIERTO ---------------- */
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
function diaBA() {
  const w = new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires', weekday: 'short' });
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(w);
}
const hs = (h) => String(h).replace(/^0(\d)/, '$1');
function pintarEstado(kit) {
  const hoy = diaBA();
  $$('#horario li').forEach(li => li.classList.toggle('hoy', Number(li.dataset.dia) === hoy));
  let txt = 'Martes a sábados 9:00 a 19:00 hs';
  let abierto = false;
  try {
    const e = kit.abierto();
    abierto = e.abierto;
    if (e.abierto) txt = `Abierto ahora · hasta las ${hs(e.cierra)} hs`;
    else if (e.abre) txt = `Cerrado ahora · abre hoy a las ${hs(e.abre)} hs`;
    else {
      const H = kit.config.horarios;
      for (let i = 1; i <= 7; i++) {
        const d = (hoy + i) % 7; const f = H[KEYS[d]];
        if (f && f.length) { txt = `Cerrado ahora · abre ${i === 1 ? 'mañana' : 'el ' + DIAS[d]} a las ${hs(f[0][0])} hs`; break; }
      }
    }
  } catch (err) { /* sin kit: queda el horario fijo */ }
  $$('[data-estado]').forEach(el => { if (el.closest('.menu__pie')) el.textContent = `${txt} · Manuela Pedraza 4035`; else el.textContent = txt; });
  $$('[data-punto]').forEach(p => p.classList.toggle('is-abierto', abierto));
}

/* ---------------- CARTA: taza que se arma + visor ---------------- */
// ml reales de su carta: [café, leche/agua, espuma] + el recipiente donde se sirve
const TAZAS = {
  'espresso': [30, 0, 0, '', 'demi'], 'espresso-doble': [60, 0, 0, '', 'demi2'], 'macchiato': [30, 0, 10, '', 'demi'], 'macchiato-doble': [60, 0, 20, '', 'demi2'],
  'americano': [30, 150, 0, 'agua', 'taza'], 'capuccino': [30, 110, 40, '', 'taza'], 'cortado': [30, 60, 0, '', 'vaso'], 'magic': [60, 60, 0, '', 'vaso'],
  'flat-white': [60, 165, 15, '', 'flat'], 'latte': [60, 190, 30, '', 'alto'],
};
// recipientes: ancho y alto del cuerpo (px en el visor), capacidad (ml), si tiene asa y plato o es vaso
const VAJILLA = {
  demi:  { w: 78,  h: 62,  cap: 45,  asa: true,  r: '8px 8px 34px 34px', nombre: 'Pocillo' },
  demi2: { w: 96,  h: 78,  cap: 90,  asa: true,  r: '9px 9px 42px 42px', nombre: 'Pocillo doble' },
  vaso:  { w: 84,  h: 112, cap: 140, asa: false, r: '6px 6px 16px 16px', nombre: 'Vasito' },
  taza:  { w: 150, h: 118, cap: 190, asa: true,  r: '10px 10px 70px 70px', nombre: 'Taza' },
  flat:  { w: 156, h: 136, cap: 260, asa: true,  r: '10px 10px 74px 74px', nombre: 'Taza grande' },
  alto:  { w: 104, h: 188, cap: 300, asa: false, r: '8px 8px 20px 20px', nombre: 'Vaso alto' },
};
const svgTaza = (id) => {
  const t = TAZAS[id]; const v = VAJILLA[t[4]]; const k = 22 / 196;
  const w = Math.max(9, v.w * k), h = Math.max(8, v.h * k), x = (v.asa ? 14 : 16) - w / 2, y = 27 - h;
  const tot = (t[0] + t[1] + t[2]) / v.cap; const hl = h * tot, hc = h * t[0] / v.cap;
  const rx = v.asa ? Math.min(w / 2, h * .55) : 1.6;
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><clipPath id="cp-${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/></clipPath><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${v.asa ? '#F3E9DC' : 'rgba(243,233,220,.55)'}" stroke="#2D4741" stroke-width="1.4"/><g clip-path="url(#cp-${id})"><rect x="${x}" y="${27 - hl}" width="${w}" height="${Math.max(0, hl - hc).toFixed(2)}" fill="${t[3] === 'agua' ? '#B98A62' : '#D9BFA0'}"/><rect x="${x}" y="${27 - hc}" width="${w}" height="${hc}" fill="#5A3A22"/></g>${v.asa ? `<path d="M${x + w} ${y + h * .2}h1.8a${h * .2} ${h * .2} 0 0 1 0 ${h * .4}h-2" fill="none" stroke="#2D4741" stroke-width="1.4"/>` : ''}</svg>`;
};
const PLANTA_MINI = '<svg viewBox="0 0 1555 1425" aria-hidden="true"><use href="img/sprite.svg#planta"/></svg>';
let productos = [];
const prodPor = (id) => productos.find(p => p.id === id);

function fotoGrande(p) { return p?.foto ? p.foto.replace('-240.webp', '-640.webp') : null; }

function pintarTaza(root, id) {
  const t = TAZAS[id] || [0, 0, 0, '', 'taza'];
  const v = VAJILLA[t[4]] || VAJILLA.taza;
  const taza = root.classList?.contains('taza') ? root : $('.taza', root);
  taza.style.setProperty('--w', `${v.w}px`);
  taza.style.setProperty('--h', `${v.h}px`);
  taza.style.setProperty('--rad', v.r);
  taza.classList.toggle('es-vaso', !v.asa);
  const px = v.h / v.cap;
  const [cafe, leche, espuma] = $$('.taza__capa', taza);
  cafe.style.height = `${t[0] * px}px`;
  leche.style.height = `${t[1] * px}px`;
  leche.classList.toggle('agua', t[3] === 'agua');
  espuma.style.height = `${t[2] * px}px`;
  const n = $('.taza__tipo', taza.parentElement); if (n) n.textContent = v.nombre;
}
const visor = $('#visor');
let visorId = null;
function mostrarEnVisor(id) {
  const p = prodPor(id); if (!p || visorId === id) return;
  visorId = id;
  $('#visorNombre').textContent = p.nombre;
  $('#visorDesc').textContent = p.descripcion || ' ';
  const esTaza = !!TAZAS[id];
  const foto = $('#visorFoto');
  visor.classList.toggle('sin-taza', !esTaza);
  $('#visorLey').style.visibility = esTaza ? 'visible' : 'hidden';
  $('#leyLeche').className = `ley ${TAZAS[id]?.[3] === 'agua' ? 'ley--agua' : 'ley--leche'}`;
  $('#visorLey li:nth-child(2)').lastChild.textContent = TAZAS[id]?.[3] === 'agua' ? 'agua' : 'leche';
  if (esTaza) { foto.hidden = true; pintarTaza($('#taza'), id); }
  else {
    const src = fotoGrande(p);
    foto.hidden = false;
    const img = $('img', foto);
    if (src) { img.src = src; img.alt = p.nombre; img.style.display = ''; foto.classList.remove('plato--vacio'); }
    else { img.style.display = 'none'; foto.classList.add('plato--vacio'); }
    foto.querySelector('.plato__planta')?.remove();
    if (!src) foto.insertAdjacentHTML('beforeend', `<span class="plato__planta">${PLANTA_MINI}</span>`);
  }
  $$('.item.is-sel').forEach(el => el.classList.remove('is-sel'));
  $$(`.item[data-id="${CSS.escape(id)}"]`).forEach(el => el.classList.add('is-sel'));
}

function itemTemplate(p, ctx) {
  const precio = ctx.money(p.precio) ?? (ctx.pedible(p) ? 'A confirmar' : 'Consultar');
  const mini = TAZAS[p.id] ? `<span class="item__mini">${svgTaza(p.id)}</span>`
    : p.foto ? `<span class="item__mini"><img src="${ctx.asset(p.foto)}" alt="" width="240" height="240" loading="lazy" decoding="async"></span>`
    : `<span class="item__mini item__mini--vacio">${PLANTA_MINI}</span>`;
  return `${mini}
    <span class="item__txt"><span class="item__nombre">${esc(p.nombre)} ${(p.etiquetas || []).map(ctx.etiquetaHTML).join('')}</span>${p.descripcion ? `<span class="item__desc">${esc(p.descripcion)}</span>` : ''}</span>
    <span class="item__lado"><span class="item__precio">${precio}</span>${ctx.carrito && ctx.pedible(p) ? `<span class="kit-qty" data-kit-qty="${p.id}"></span>` : ''}</span>`;
}

const LLEVAR_TXT = { caliente: 'Todo también para llevar', frio: 'Todo también para llevar', otras: 'Para acompañar', pasteleria: 'Casera, de la vitrina', salado: 'Para el mediodía', llevar: 'Para llevarte a casa' };
function armarPaneles(e) {
  const el = e.detail.el; if (el.id !== 'cartaLocal') return;
  productos = e.detail.productos;
  const tabs = $$('.kit-tab', el);
  const paneles = $$('.kit-carta__panel', el);
  paneles.forEach((panel, i) => {
    const tab = tabs[i]; const n = $$('.kit-item', panel).length; const cat = tab?.dataset.cat;
    panel.insertAdjacentHTML('afterbegin', `<header class="panel-head"><h3>${tab?.textContent || ''}</h3><p>${n} ${n === 1 ? 'opción' : 'opciones'} · ${LLEVAR_TXT[cat] || 'Para llevar'}</p></header>`);
    const prev = tabs[i - 1], next = tabs[i + 1];
    panel.insertAdjacentHTML('beforeend', `<nav class="panel-nav" aria-label="Secciones de la carta">${prev ? `<button type="button" data-ir="${i - 1}">‹ ${prev.textContent}</button>` : ''}${next ? `<button type="button" class="sig" data-ir="${i + 1}">${next.textContent} ›</button>` : ''}</nav>`);
  });
  if (!visorId || !prodPor(visorId)) { visorId = null; mostrarEnVisor(prodPor('flat-white') ? 'flat-white' : productos[0]?.id); }
  else { const v = visorId; visorId = null; mostrarEnVisor(v); }
}
document.addEventListener('kit:carta', armarPaneles);

const carta = $('#cartaLocal');
carta.addEventListener('click', (e) => {
  const ir = e.target.closest('[data-ir]');
  if (ir) {
    const tab = $$('.kit-tab', carta)[Number(ir.dataset.ir)]; tab?.click();
    const top = carta.getBoundingClientRect().top + scrollY - (barra.offsetHeight + 12);
    if (scrollY > top) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    return;
  }
  const tab = e.target.closest('.kit-tab');
  if (tab) {
    const fila = tab.parentElement;
    if (fila.scrollWidth > fila.clientWidth) fila.scrollTo({ left: tab.offsetLeft - (fila.clientWidth - tab.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    return;
  }
  if (e.target.closest('.kit-qty')) return;
  const it = e.target.closest('.kit-item'); if (!it) return;
  if (esDesk()) mostrarEnVisor(it.dataset.id);
  else abrirHoja(it.dataset.id);
});
let hoverRaf = 0;
carta.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse' || !esDesk()) return;
  const it = e.target.closest('.kit-item'); if (!it) return;
  cancelAnimationFrame(hoverRaf);
  hoverRaf = requestAnimationFrame(() => mostrarEnVisor(it.dataset.id));
});

/* hoja de detalle en el celu */
const hoja = $('#hoja');
let kitRef = null;
function abrirHoja(id) {
  const p = prodPor(id); if (!p) return;
  const arte = $('#hojaArte');
  if (TAZAS[id]) {
    arte.innerHTML = $('#taza').outerHTML.replace('id="taza"', '');
    $$('.taza__capa', arte).forEach(c => { c.style.height = '0px'; });
    requestAnimationFrame(() => requestAnimationFrame(() => pintarTaza(arte, id)));
  } else if (p.foto) {
    arte.innerHTML = `<figure class="plato"><img src="${fotoGrande(p)}" alt="${esc(p.nombre)}" width="640" height="640" decoding="async"></figure>`;
  } else {
    arte.innerHTML = `<figure class="plato plato--vacio"><span class="plato__planta">${PLANTA_MINI}</span></figure>`;
  }
  $('#hojaNombre').textContent = p.nombre;
  $('#hojaDesc').textContent = p.descripcion || '';
  const q = $('#hojaQty');
  q.innerHTML = ''; q.dataset.kitQty = id;
  kitRef?.carrito?.sync(hoja);
  hoja.hidden = false; document.body.classList.add('hoja-abierta'); bloquear(true);
  $('.hoja__x').focus({ preventScroll: true });
}
function cerrarHoja() { if (hoja.hidden) return; hoja.hidden = true; document.body.classList.remove('hoja-abierta'); bloquear(false); }
hoja.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar]')) cerrarHoja(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarHoja(); });

/* ---------------- NUESTRO CAFÉ: rueda de sabores ---------------- */
const CAT = {
  choc: ['chocolate', '#6B4A2E', true], nuez: ['nuez', '#E07A2F', false], esp: ['especias', '#C23A2E', true],
  dulce: ['dulce', '#E9CF6A', false], frutal: ['frutal', '#A8274B', true], citrico: ['cítrico', '#D3D95A', false], fsecas: ['frutos secos', '#4A5FB0', true],
};
const ORIGENES = [
  { id: 'peru', corto: 'Perú', pais: 'PERÚ · AMAZONAS', nombre: 'Comité Monteverde · Lavado', puntaje: '84,25',
    notas: 'Viene de muchas pequeñas familias caficultoras del Comité Café Monteverde. Clásico perfil de la región: chocolate con leche y frutos secos, con una acidez moderada y untuosa. Ideal para espresso.',
    rueda: [['esp', ['canela', 'nuez moscada']], ['nuez', ['avellana', 'almendra']], ['choc', ['chocolate', 'chocolate de leche']]],
    attrs: [8, 8, 7.75, 7.75, 7.5, 7.5],
    ficha: [['Altura', '1900 m'], ['Varietal', 'Caturra, Typica, Bourbon, Catuaí'], ['Caficultor', 'Comité Café Monteverde'], ['Beneficio', 'Lavado'], ['Secado', 'Camas africanas'], ['Zafra', '2023']] },
  { id: 'durazno', corto: 'Durazno', pais: 'GUATEMALA · HUEHUETENANGO', nombre: 'Durazno · Lavado', puntaje: '85,5',
    notas: 'Un café estructurado y dulce, con notas a almendras y cuerpo medio. Acidez limpia y radiante, con marcadas notas a pasas de uva y chocolate con leche. Ideal para espresso.',
    rueda: [['dulce', ['caramelo']], ['choc', ['chocolate con leche']], ['frutal', ['cítrico', 'uva', 'frutas secas']], ['nuez', ['almendra', 'nuez']]],
    attrs: [8.25, 8, 7.75, 7.75, 7.75, 8],
    ficha: [['Altura', '1950 m'], ['Varietal', 'Bourbon, Caturra'], ['Caficultor', 'Francisco Morales'], ['Beneficio', 'Lavado'], ['Secado', 'Camas africanas'], ['Zafra', '2023']] },
  { id: 'penon', corto: 'El Peñón', pais: 'GUATEMALA · HUEHUETENANGO', nombre: 'El Peñón · Lavado', puntaje: '85,25',
    notas: 'Bourbon amarillo de tercera generación: dos generaciones de caficultores seleccionaron lotes puros de amarillo, con más grados brix y más dulzura en taza. Mandarina, lima, nougat y dátiles.',
    rueda: [['citrico', ['mandarina', 'lima']], ['frutal', ['fruta amarilla']], ['fsecas', ['dátiles']], ['dulce', ['nougat', 'manteca']], ['nuez', ['avellana', 'almendra', 'nuez moscada']]],
    attrs: [8, 8, 8, 7.75, 7.75, 7.75],
    ficha: [['Altura', '1530 m'], ['Varietal', 'Bourbon amarillo'], ['Caficultor', 'Iván Ovalle'], ['Beneficio', 'Lavado'], ['Secado', 'Camas africanas'], ['Zafra', '2023']] },
  { id: 'honey', corto: 'Caturra Honey', pais: 'GUATEMALA · HUEHUETENANGO', nombre: 'Caturra · Honey', puntaje: '84,25',
    notas: 'Resalta por su fragancia a frutos secos y chocolate; en boca tiene un cuerpo cremoso y aterciopelado, con sabores que recuerdan a dátiles y almendras. Gran café para espresso y para bebidas con leche.',
    rueda: [['choc', ['chocolate', 'chocolate de leche']], ['dulce', ['azúcar morena']], ['frutal', ['frutal']], ['fsecas', ['frutos secos', 'dátiles']], ['nuez', ['nuez', 'avellana', 'almendra']]],
    attrs: [7.75, 7.75, 7.75, 8, 8, 7.5],
    ficha: [['Altura', '1650 m'], ['Varietal', 'Caturra'], ['Caficultor', 'Iván Ovalle · Finca El Peñón'], ['Beneficio', 'Honey'], ['Secado', 'Camas africanas'], ['Zafra', '2024']] },
];
const ATTRS = ['Fragancia', 'Sabor', 'Retrogusto', 'Acidez', 'Cuerpo', 'Balance'];
let origenActual = 0, enMaquina = -1;

function arco(r0, r1, a0, a1) {
  const p = (r, a) => [(r * Math.sin(a)).toFixed(2), (-r * Math.cos(a)).toFixed(2)];
  const g = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(r1, a0), [x1, y1] = p(r1, a1), [x2, y2] = p(r0, a1), [x3, y3] = p(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 ${g} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${g} 0 ${x3} ${y3}Z`;
}
const aclarar = (hex, k) => {
  const n = parseInt(hex.slice(1), 16); const m = (c) => Math.round(c + (243 - c) * k);
  return `rgb(${m(n >> 16)},${m((n >> 8) & 255)},${m(n & 255)})`;
};
let animandoNums = 0;
function contar(el, desde, hasta) {
  const t0 = performance.now(), dur = reduce ? 0 : 650;
  const paso = (now) => {
    const k = dur ? Math.min(1, (now - t0) / dur) : 1; const e = 1 - Math.pow(1 - k, 3);
    const v = desde + (hasta - desde) * e;
    el.textContent = (Math.round(v * 100) / 100).toString().replace('.', ',');
    if (k < 1) requestAnimationFrame(paso); else el.textContent = String(hasta).replace('.', ',');
  };
  requestAnimationFrame(paso);
}
function cambiarTexto(el, txt) {
  if (el.textContent === txt) return;
  if (reduce) { el.textContent = txt; return; }
  el.classList.add('sale');
  setTimeout(() => { el.textContent = txt; el.classList.remove('sale'); el.classList.add('entra-txt'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('entra-txt'))); }, 180);
}
let barrasHechas = false;
function pintarOrigen(i, animar = true) {
  const previo = ORIGENES[origenActual];
  origenActual = i;
  const o = ORIGENES[i];
  $$('#origenChips button').forEach((b, j) => b.setAttribute('aria-selected', j === i));
  cambiarTexto($('#origenPais'), o.pais);
  cambiarTexto($('#origenNombre'), o.nombre);
  cambiarTexto($('#origenNotas'), o.notas);
  $('#enMaquina').hidden = i !== enMaquina;
  centro('Puntaje', o.puntaje);
  const barras = $('#origenBarras');
  if (!barrasHechas) {
    barras.innerHTML = ATTRS.map((a, k) => `<div class="barra-n"><span>${a}</span><i><b></b></i><span class="num">${String(o.attrs[k]).replace('.', ',')}</span></div>`).join('');
    barrasHechas = true;
  }
  $$('.barra-n', barras).forEach((fila, k) => {
    const b = $('b', fila); const v = ((o.attrs[k] - 6) / 3 * 100).toFixed(1);
    b.style.transitionDelay = `${k * 55}ms`;
    b.style.width = `${v}%`;
    const antes = previo && previo !== o ? previo.attrs[k] : o.attrs[k];
    if (antes !== o.attrs[k]) { contar($('.num', fila), antes, o.attrs[k]); fila.classList.remove('late'); void fila.offsetWidth; fila.classList.add('late'); }
    else $('.num', fila).textContent = String(o.attrs[k]).replace('.', ',');
  });
  const ficha = $('#origenFicha');
  if (!ficha.children.length) ficha.innerHTML = o.ficha.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  else $$('div', ficha).forEach((d, k) => { $('dt', d).textContent = o.ficha[k][0]; cambiarTexto($('dd', d), o.ficha[k][1]); });
  // rueda: anillos pegados (sin huecos entre el de adentro y el de afuera), separados solo por el trazo
  const total = o.rueda.length;
  let a = 0, k = 0, out = '';
  const paso = (Math.PI * 2) / total;
  o.rueda.forEach(([c, notas]) => {
    const [label, color, oscuro] = CAT[c];
    const a0 = a, a1 = a + paso;
    out += `<path class="seg${animar ? ' seg-in' : ''}" style="--k:${k++}" d="${arco(54, 104, a0, a1)}" fill="${color}" data-n="${label}" data-s="${notas.join(', ')}"/>`;
    const mid = (a0 + a1) / 2; const tx = 79 * Math.sin(mid), ty = -79 * Math.cos(mid);
    let rot = mid * 180 / Math.PI; if (rot > 90 && rot < 270) rot += 180;
    out += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${rot.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})" class="${oscuro ? 'claro' : ''}${animar ? ' txt-in' : ''}" style="font-size:11px">${label}</text>`;
    const sub = paso / notas.length;
    notas.forEach((n, j) => {
      const b0 = a0 + j * sub, b1 = b0 + sub;
      out += `<path class="seg${animar ? ' seg-in' : ''}" style="--k:${k++}" d="${arco(104, 152, b0, b1)}" fill="${aclarar(color, .38)}" data-n="${n}" data-s="${label}"/>`;
    });
    a = a1;
  });
  $('#ruedaSvg').innerHTML = out;
  $('#rueda').classList.remove('foco'); focoActual = null;
}
let centroTimer = 0;
function centro(n, s) {
  const c = $('#ruedaCentro');
  clearTimeout(centroTimer);
  if ($('#ruedaNota').textContent === n && $('#ruedaSub').textContent === s) { c.classList.remove('sale'); return; }
  c.classList.add('sale');
  centroTimer = setTimeout(() => { $('#ruedaNota').textContent = n; $('#ruedaSub').textContent = s; c.classList.remove('sale'); }, 140);
}
let focoActual = null, focoTimer = 0;
function initRueda() {
  $('#origenChips').innerHTML = ORIGENES.map((o, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-o="${i}">${o.corto}</button>`).join('');
  $('#origenChips').addEventListener('click', (e) => { const b = e.target.closest('[data-o]'); if (b && Number(b.dataset.o) !== origenActual) pintarOrigen(Number(b.dataset.o)); });
  const rueda = $('#rueda');
  const aplicar = (p) => {
    if (p === focoActual) return;
    focoActual?.classList.remove('on');
    focoActual = p;
    if (!p) { rueda.classList.remove('foco'); centro('Puntaje', ORIGENES[origenActual].puntaje); return; }
    p.classList.add('on'); rueda.classList.add('foco');
    centro(p.dataset.n, p.dataset.s);
  };
  // intención de hover: espera un instante antes de cambiar, y los huecos (centro, bordes) no resetean
  const pedir = (p, ms) => { clearTimeout(focoTimer); focoTimer = setTimeout(() => aplicar(p), ms); };
  rueda.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const p = e.target.closest('path.seg');
    if (p && p !== focoActual) pedir(p, focoActual ? 70 : 110);
    else if (p === focoActual) clearTimeout(focoTimer);
  });
  rueda.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') pedir(null, 220); });
  rueda.addEventListener('click', (e) => { const p = e.target.closest('path.seg'); clearTimeout(focoTimer); aplicar(p && p !== focoActual ? p : null); });
  pintarOrigen(0, false);
  const svg = $('#ruedaSvg');
  const ioR = new IntersectionObserver(([en]) => { if (en.isIntersecting) { pintarOrigen(origenActual, true); ioR.disconnect(); } }, { threshold: .3 });
  ioR.observe(svg);
}
initRueda();
function aplicarMaquina(dest) {
  const nombre = (dest?.tolva?.origen || '').toLowerCase();
  const i = ORIGENES.findIndex(o => nombre && (o.corto.toLowerCase().includes(nombre) || nombre.includes(o.corto.toLowerCase())));
  enMaquina = i;
  $$('#origenChips button').forEach((b, j) => { b.querySelector('.punto')?.remove(); if (j === i) b.insertAdjacentHTML('afterbegin', '<span class="punto punto--fruto" aria-hidden="true"></span>'); });
  if (i >= 0) pintarOrigen(i, false); else $('#enMaquina').hidden = true;
}

/* ---------------- KIT ---------------- */
const VEGANO = '<svg viewBox="0 0 24 24"><path d="M20 4C10 4 4 9 4 16c0 2 1 4 1 4s2-7 9-10c-5 4-7 8-7 10 9 0 13-7 13-16Z" fill="currentColor"/></svg>';
let molienda = 'grano';
$('#molienda').addEventListener('click', (e) => {
  const b = e.target.closest('[data-mol]'); if (!b) return;
  molienda = b.dataset.mol;
  $$('#molienda button').forEach(x => x.setAttribute('aria-checked', x === b));
});

function contarCarrito(lineas) {
  const n = (lineas || []).reduce((s, l) => s + (l.cant || 0), 0);
  const el = $('.btn-carrito__n'); el.textContent = n; el.dataset.n = n;
}

(async () => {
  let kit;
  try {
    kit = await initKit({
      config: 'cliente.json',
      carta: { template: itemTemplate, itemClass: 'item', etiquetas: { vegano: { label: 'Vegano', icono: VEGANO } } },
      carrito: { label: 'Tu Lulo', fab: false },
      imagenes: { lqip: 'img/lqip.json' },
    });
  } catch (err) { console.error('[lulo] kit', err); return; }
  kitRef = kit;
  pintarEstado(kit);
  setInterval(() => pintarEstado(kit), 60000);
  document.addEventListener('kit:carrito', (e) => contarCarrito(e.detail.lineas));
  kit.carrito?.listo?.then(() => contarCarrito(kit.carrito.lineas));
  contarCarrito(kit.carrito?.lineas);
  const dest = () => { try { aplicarMaquina(kit.destacados || {}); } catch (err) { /* sin destacados */ } };
  document.addEventListener('kit:destacados', (e) => aplicarMaquina(e.detail));
  dest();
  $('#sumarGrano').addEventListener('click', (e) => kit.carrito.agregar('cafe-grano', 1, { opc: { molienda }, origen: e.currentTarget }));
  $('#llevarOrigen').addEventListener('click', (e) => kit.carrito.agregar('cafe-grano', 1, { opc: { molienda: 'grano' }, nota: `Origen: ${ORIGENES[origenActual].corto}`, origen: e.currentTarget }));
})();
