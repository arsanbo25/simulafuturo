/**
 * SimulaFuturo · Recepción de evaluaciones y uso (Google Apps Script)
 *
 * Pega este código en: tu hoja de Google → Extensiones → Apps Script.
 * Luego cambia CLAVE_DOCENTE (abajo) y publícalo como «Aplicación web».
 * La guía completa está en GUIA-PASO-A-PASO.md.
 *
 * Qué hace:
 *  - doPost: recibe, desde SimulaFuturo, los datos ANÓNIMOS de cada dispositivo
 *    (números de uso y, si el estudiante evaluó, sus respuestas) y los guarda
 *    en la pestaña «Respuestas». Una fila por dispositivo: si llegan datos
 *    nuevos del mismo dispositivo, se actualiza su fila.
 *  - doGet: entrega los resultados al Panel docente SOLO si recibe CLAVE_DOCENTE.
 *
 * No recibe nombres, correos, contraseñas ni claves de IA.
 */

// 1) CAMBIA ESTA CLAVE. Úsala en el Panel docente para ver los resultados.
//    Usa al menos 12 caracteres y no la compartas con estudiantes.
const CLAVE_DOCENTE = 'CAMBIA-ESTA-CLAVE';

const HOJA = 'Respuestas';
const MODULOS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
const ITEMS = ['c1', 'c2', 'c3', 'c4', 'p1', 'p2', 'p3', 'p4', 'n1', 'n2', 'n3', 'n4', 'n5', 'd1', 'd2', 'd3', 'd4', 'i1', 'i2', 'i3', 'i4', 'i5'];
const ENCABEZADOS = [].concat(
  ['id_anonimo', 'ultima_actualizacion', 'dispositivo', 'comparte_uso', 'sesiones', 'minutos_activos'],
  MODULOS.map(function (m) { return 'visitas_' + m; }),
  MODULOS.map(function (m) { return 'minutos_' + m; }),
  MODULOS.map(function (m) { return 'pasos_mision_' + m; }),
  ['situaciones', 'decisiones', 'reconsideraciones', 'metas', 'profesiones_vistas', 'profesiones_guardadas', 'sugerencias_basicas', 'ia_clave_propia', 'pdf_exportados', 'acciones', 'evaluo'],
  ITEMS,
  ['lo_mas_util', 'mejoras', 'idea_recordada', 'datos_json']
);

/* ---------- Recepción desde la app ---------- */
function doPost(e) {
  try {
    const raw = e && e.postData ? String(e.postData.contents || '') : '';
    if (!raw || raw.length > 12000) return responder({ ok: false, error: 'tamano' });
    const snap = limpiar(JSON.parse(raw));
    if (!snap) return responder({ ok: false, error: 'formato' });

    // Evita ráfagas desde el mismo dispositivo (máximo 1 escritura cada 10 s).
    const cache = CacheService.getScriptCache();
    const llave = 'rl_' + snap.id;
    if (cache.get(llave)) return responder({ ok: false, error: 'espera' });
    cache.put(llave, '1', 10);

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const hoja = obtenerHoja();
      const fila = aFila(snap);
      const ids = hoja.getLastRow() > 1 ? hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues() : [];
      let pos = -1;
      for (let i = 0; i < ids.length; i++) { if (ids[i][0] === snap.id) { pos = i + 2; break; } }
      if (pos > 0) hoja.getRange(pos, 1, 1, fila.length).setValues([fila]);
      else hoja.appendRow(fila);
    } finally {
      lock.releaseLock();
    }
    return responder({ ok: true, guardado: true });
  } catch (err) {
    return responder({ ok: false, error: 'servidor' });
  }
}

/* ---------- Lectura para el Panel docente ---------- */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'ping') return responder({ ok: true, servicio: 'SimulaFuturo' });
  if (CLAVE_DOCENTE === 'CAMBIA-ESTA-CLAVE' || String(CLAVE_DOCENTE).length < 12) return responder({ ok: false, error: 'clave_sin_configurar' });
  if (String(p.key || '') !== CLAVE_DOCENTE) return responder({ ok: false, error: 'clave_incorrecta' });
  const hoja = obtenerHoja();
  const n = hoja.getLastRow() - 1;
  if (n < 1) return responder({ ok: true, filas: [] });
  const col = ENCABEZADOS.indexOf('datos_json') + 1;
  const filas = hoja.getRange(2, col, n, 1).getValues()
    .map(function (r) { try { return JSON.parse(String(r[0]).replace(/^'/, '')); } catch (x) { return null; } })
    .filter(function (x) { return x; });
  return responder({ ok: true, filas: filas });
}

/* ---------- Utilidades ---------- */
function obtenerHoja() {
  const libro = SpreadsheetApp.getActiveSpreadsheet();
  let hoja = libro.getSheetByName(HOJA);
  if (!hoja) hoja = libro.insertSheet(HOJA);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Texto seguro para la hoja: corta, quita correos y teléfonos, y evita fórmulas.
function texto(v, max) {
  let s = String(v == null ? '' : v)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[correo]')
    .replace(/\+?\d[\d\s().-]{6,}\d/g, '[número]')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}
function num(v, max) { const n = Math.round(Number(v)); return isFinite(n) && n >= 0 ? Math.min(n, max) : 0; }

function limpiar(o) {
  if (!o || o.v !== 1 || !/^[a-z0-9]{6,40}$/.test(String(o.id || ''))) return null;
  const dev = ['Celular', 'Tableta', 'Computador'].indexOf(o.dev) >= 0 ? o.dev : 'Otro';
  const mod = {};
  MODULOS.forEach(function (m) { const x = (o.mod || {})[m] || [0, 0]; mod[m] = [num(x[0], 9999), num(x[1], 9999)]; });
  const mis = MODULOS.map(function (m, i) { return num((o.mis || [])[i], 3); });
  let ev = null;
  if (o.ev && typeof o.ev === 'object') {
    const r = {};
    ITEMS.forEach(function (k) { const v = (o.ev.r || {})[k]; if (v === 0 || v === 1 || v === 2 || v === 3 || v === 4) r[k] = v; });
    const c = o.ev.c || {};
    ev = { r: r, c: { util: texto(c.util, 300), mejor: texto(c.mejor, 300), idea: texto(c.idea, 300) } };
  }
  return {
    v: 1, id: String(o.id), ts: Date.now(), dev: dev, u: o.u !== false,
    ses: num(o.ses, 9999), min: num(o.min, 99999), mod: mod, mis: mis,
    sit: num(o.sit, 99), dec: num(o.dec, 99), rec: num(o.rec, 999), gol: num(o.gol, 999),
    prf: num(o.prf, 99), sav: num(o.sav, 99), aib: num(o.aib, 9999), aik: num(o.aik, 9999),
    pdf: num(o.pdf, 9999), act: num(o.act, 99999), ev: ev
  };
}

function aFila(s) {
  const ev = s.ev;
  return [].concat(
    [s.id, new Date(s.ts), s.dev, s.u ? 'sí' : 'no', s.ses, s.min],
    MODULOS.map(function (m) { return s.mod[m][0]; }),
    MODULOS.map(function (m) { return s.mod[m][1]; }),
    s.mis,
    [s.sit, s.dec, s.rec, s.gol, s.prf, s.sav, s.aib, s.aik, s.pdf, s.act, ev ? 'sí' : 'no'],
    ITEMS.map(function (k) { if (!ev || ev.r[k] === undefined) return ''; return ev.r[k] === 0 ? 'No sé' : ev.r[k]; }),
    [ev ? ev.c.util : '', ev ? ev.c.mejor : '', ev ? ev.c.idea : '', JSON.stringify(s)]
  );
}
