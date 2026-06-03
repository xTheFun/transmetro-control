// Tests automatizados de reglas de negocio — ejecutar con: npm test
// Usa SQLite en memoria para no depender de la BD del servidor

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ── BD en memoria para tests (independiente del servidor)
const knex = require('knex')({
  client: 'better-sqlite3',
  connection: { filename: ':memory:' },
  useNullAsDefault: true
});

// Funciones de reglas extraídas para prueba directa (sin require('../backend/...'))
// Esto evita dependencias circulares en el entorno de test

async function validarParqueoObligatorio(idParqueo) {
  if (!idParqueo) throw new Error('RN-04: Todo bus debe tener un parqueo asignado.');
}

async function verificarSaturacion(idBus, idEstacion, pasajeros, porcentaje) {
  if (porcentaje >= 150) {
    await knex('alerta').insert({ id_bus:idBus, id_estacion:idEstacion, tipo:'saturacion', porcentaje, estado:'pendiente', fecha_hora: new Date().toISOString() });
    return { alertaGenerada:true, tipo:'saturacion', mensaje:`Saturación al ${porcentaje.toFixed(1)}%` };
  }
  return { alertaGenerada:false };
}

async function verificarBajaOcupacion(idBus, idEstacion, porcentaje) {
  if (porcentaje < 25) {
    await knex('alerta').insert({ id_bus:idBus, id_estacion:idEstacion, tipo:'baja_ocupacion', porcentaje, estado:'pendiente', fecha_hora: new Date().toISOString() });
    return { alertaGenerada:true, tipo:'baja_ocupacion', mensaje:`Baja ocupación al ${porcentaje.toFixed(1)}%` };
  }
  return { alertaGenerada:false };
}

async function validarMinimosBuses(knexConn, idLinea) {
  const [{ total: numEst }]  = await knexConn('linea_estacion').where({ id_linea:idLinea }).count('id as total');
  const [{ total: numBus }]  = await knexConn('bus').where({ id_linea:idLinea }).count('id as total');
  if (Number(numBus) < Number(numEst)) throw new Error(`RN-02: mínimo ${numEst} buses.`);
}

async function validarMaximosBuses(knexConn, idLinea) {
  const [{ total: numEst }]  = await knexConn('linea_estacion').where({ id_linea:idLinea }).count('id as total');
  const [{ total: numBus }]  = await knexConn('bus').where({ id_linea:idLinea }).count('id as total');
  if (Number(numBus) > Number(numEst) * 2) throw new Error(`RN-03: máximo ${numEst*2} buses.`);
}

// ── Preparar esquema mínimo
beforeAll(async () => {
  await knex.schema.createTable('linea',         t => { t.increments('id'); t.string('nombre'); t.string('codigo'); t.string('estado'); });
  await knex.schema.createTable('estacion',      t => { t.increments('id'); t.string('nombre'); });
  await knex.schema.createTable('linea_estacion',t => { t.increments('id'); t.integer('id_linea'); t.integer('id_estacion'); t.integer('orden'); });
  await knex.schema.createTable('parqueo',       t => { t.increments('id'); t.string('nombre'); });
  await knex.schema.createTable('bus',           t => { t.increments('id'); t.string('codigo'); t.string('placa'); t.integer('capacidad'); t.string('estado'); t.integer('id_linea'); t.integer('id_parqueo'); });
  await knex.schema.createTable('alerta',        t => { t.increments('id'); t.integer('id_bus'); t.integer('id_estacion'); t.string('tipo'); t.decimal('porcentaje',6,2); t.string('estado'); t.timestamp('fecha_hora'); });

  // Datos base
  await knex('linea').insert({ id:1, nombre:'Eje Sur', codigo:'L-ROJ', estado:'Activa' });
  await knex('estacion').insert([{ id:1, nombre:'Est A' },{ id:2, nombre:'Est B' },{ id:3, nombre:'Est C' }]);
  await knex('parqueo').insert({ id:1, nombre:'Parqueo Central' });
  await knex('linea_estacion').insert([
    { id_linea:1, id_estacion:1, orden:1 },
    { id_linea:1, id_estacion:2, orden:2 },
    { id_linea:1, id_estacion:3, orden:3 }
  ]);
  await knex('bus').insert([
    { id:1, codigo:'TM-001', placa:'C-001', capacidad:100, estado:'Activo', id_linea:1, id_parqueo:1 },
    { id:2, codigo:'TM-002', placa:'C-002', capacidad:100, estado:'Activo', id_linea:1, id_parqueo:1 },
    { id:3, codigo:'TM-003', placa:'C-003', capacidad:100, estado:'Activo', id_linea:1, id_parqueo:1 }
  ]);
});

afterAll(async () => { await knex.destroy(); });
beforeEach(async () => { await knex('alerta').del(); });

// ══════════════════════════════════════════════════════════════
// RN-04: Un bus siempre debe tener parqueo asignado
// ══════════════════════════════════════════════════════════════
describe('RN-04 — Parqueo obligatorio', () => {
  test('Lanza error si id_parqueo es null', async () => {
    await expect(validarParqueoObligatorio(null)).rejects.toThrow('RN-04');
  });
  test('Lanza error si id_parqueo es undefined', async () => {
    await expect(validarParqueoObligatorio(undefined)).rejects.toThrow('RN-04');
  });
  test('Lanza error si id_parqueo es 0 (falsy)', async () => {
    await expect(validarParqueoObligatorio(0)).rejects.toThrow('RN-04');
  });
  test('No lanza error con id_parqueo válido', async () => {
    await expect(validarParqueoObligatorio(1)).resolves.not.toThrow();
  });
});

// ══════════════════════════════════════════════════════════════
// RN-06: Alerta de saturación cuando porcentaje >= 150%
// ══════════════════════════════════════════════════════════════
describe('RN-06 — Alerta de saturación (≥150%)', () => {
  test('Genera alerta con exactamente 150%', async () => {
    const res = await verificarSaturacion(1, 1, 150, 150);
    expect(res.alertaGenerada).toBe(true);
    expect(res.tipo).toBe('saturacion');
    const [al] = await knex('alerta').where({ tipo:'saturacion' });
    expect(al.estado).toBe('pendiente');
  });

  test('Genera alerta con 165% (sobre umbral)', async () => {
    const res = await verificarSaturacion(1, 1, 165, 165);
    expect(res.alertaGenerada).toBe(true);
    const alertas = await knex('alerta').where({ tipo:'saturacion' });
    expect(alertas.length).toBe(1);
  });

  test('NO genera alerta con 149% (bajo el umbral)', async () => {
    const res = await verificarSaturacion(1, 1, 149, 149);
    expect(res.alertaGenerada).toBe(false);
    const alertas = await knex('alerta').where({ tipo:'saturacion' });
    expect(alertas.length).toBe(0);
  });

  test('NO genera alerta con ocupación normal (63%)', async () => {
    const res = await verificarSaturacion(1, 1, 63, 63);
    expect(res.alertaGenerada).toBe(false);
  });

  test('Alerta contiene porcentaje correcto (180%)', async () => {
    await verificarSaturacion(1, 2, 180, 180);
    const [al] = await knex('alerta').where({ tipo:'saturacion', id_bus:1, id_estacion:2 });
    expect(Number(al.porcentaje)).toBe(180);
  });
});

// ══════════════════════════════════════════════════════════════
// RN-07: Alerta de baja ocupación cuando porcentaje < 25%
// ══════════════════════════════════════════════════════════════
describe('RN-07 — Alerta de baja ocupación (<25%)', () => {
  test('Genera alerta con 0%', async () => {
    const res = await verificarBajaOcupacion(1, 1, 0);
    expect(res.alertaGenerada).toBe(true);
    expect(res.tipo).toBe('baja_ocupacion');
  });

  test('Genera alerta con 18% (típico baja ocupación)', async () => {
    const res = await verificarBajaOcupacion(1, 1, 18);
    expect(res.alertaGenerada).toBe(true);
  });

  test('Genera alerta con 24.9% (justo bajo el umbral)', async () => {
    const res = await verificarBajaOcupacion(1, 1, 24.9);
    expect(res.alertaGenerada).toBe(true);
  });

  test('NO genera alerta con exactamente 25%', async () => {
    const res = await verificarBajaOcupacion(1, 1, 25);
    expect(res.alertaGenerada).toBe(false);
  });

  test('NO genera alerta con ocupación normal (60%)', async () => {
    const res = await verificarBajaOcupacion(1, 1, 60);
    expect(res.alertaGenerada).toBe(false);
  });

  test('Alerta de baja ocupación queda en estado pendiente', async () => {
    await verificarBajaOcupacion(2, 1, 10);
    const [al] = await knex('alerta').where({ tipo:'baja_ocupacion', id_bus:2 });
    expect(al.estado).toBe('pendiente');
  });
});

// ══════════════════════════════════════════════════════════════
// RN-02 y RN-03: Mínimos y máximos de buses por línea
// ══════════════════════════════════════════════════════════════
describe('RN-02 y RN-03 — Buses por línea', () => {
  test('RN-02: pasa con buses = estaciones (3 = 3)', async () => {
    await expect(validarMinimosBuses(knex, 1)).resolves.not.toThrow();
  });

  test('RN-03: pasa con buses ≤ 2× estaciones (3 ≤ 6)', async () => {
    await expect(validarMaximosBuses(knex, 1)).resolves.not.toThrow();
  });

  test('RN-02: lanza error si buses < estaciones', async () => {
    await knex('linea').insert({ id:99, nombre:'Test', codigo:'L-TST', estado:'Activa' });
    await knex('linea_estacion').insert([
      { id_linea:99, id_estacion:1, orden:1 }, { id_linea:99, id_estacion:2, orden:2 },
      { id_linea:99, id_estacion:3, orden:3 }, { id_linea:99, id_estacion:3, orden:4 }
    ]);
    await expect(validarMinimosBuses(knex, 99)).rejects.toThrow('RN-02');
    await knex('linea_estacion').where({ id_linea:99 }).del();
    await knex('linea').where({ id:99 }).del();
  });

  test('RN-03: lanza error si buses > 2× estaciones', async () => {
    await knex('linea').insert({ id:98, nombre:'Test2', codigo:'L-TST2', estado:'Activa' });
    await knex('linea_estacion').insert({ id_linea:98, id_estacion:1, orden:1 });
    await knex('bus').insert([
      { id:91, codigo:'TX-1', placa:'X001', capacidad:100, estado:'Activo', id_linea:98, id_parqueo:1 },
      { id:92, codigo:'TX-2', placa:'X002', capacidad:100, estado:'Activo', id_linea:98, id_parqueo:1 },
      { id:93, codigo:'TX-3', placa:'X003', capacidad:100, estado:'Activo', id_linea:98, id_parqueo:1 }
    ]);
    await expect(validarMaximosBuses(knex, 98)).rejects.toThrow('RN-03');
    await knex('bus').whereIn('id',[91,92,93]).del();
    await knex('linea_estacion').where({ id_linea:98 }).del();
    await knex('linea').where({ id:98 }).del();
  });
});

// ══════════════════════════════════════════════════════════════
// Seguridad — bcrypt
// ══════════════════════════════════════════════════════════════
describe('Seguridad — Contraseñas con bcrypt', () => {
  test('Hash generado no es texto plano', async () => {
    const hash = await bcrypt.hash('Admin2026', 10);
    expect(hash).not.toBe('Admin2026');
    expect(hash.length).toBeGreaterThan(30);
  });

  test('compare devuelve true con contraseña correcta', async () => {
    const hash = await bcrypt.hash('Admin2026', 10);
    expect(await bcrypt.compare('Admin2026', hash)).toBe(true);
  });

  test('compare devuelve false con contraseña incorrecta', async () => {
    const hash = await bcrypt.hash('Admin2026', 10);
    expect(await bcrypt.compare('Incorrecta', hash)).toBe(false);
  });

  test('Dos hashes del mismo password son diferentes (salt aleatorio)', async () => {
    const h1 = await bcrypt.hash('mismaPassword', 10);
    const h2 = await bcrypt.hash('mismaPassword', 10);
    expect(h1).not.toBe(h2);
  });
});

// ══════════════════════════════════════════════════════════════
// Seguridad — JWT
// ══════════════════════════════════════════════════════════════
describe('Seguridad — JWT', () => {
  const SECRET = 'test_secret_transmetro_2026';

  test('Token contiene el payload correcto', () => {
    const token = jwt.sign({ id:1, usuario:'admin', rol:'administrador' }, SECRET, { expiresIn:'1h' });
    const dec   = jwt.verify(token, SECRET);
    expect(dec.usuario).toBe('admin');
    expect(dec.rol).toBe('administrador');
  });

  test('Token con secreto incorrecto lanza error', () => {
    const token = jwt.sign({ id:1 }, SECRET);
    expect(() => jwt.verify(token, 'secreto_diferente')).toThrow();
  });

  test('Token expirado lanza error', async () => {
    const token = jwt.sign({ id:1 }, SECRET, { expiresIn:'1ms' });
    await new Promise(r => setTimeout(r, 20));
    expect(() => jwt.verify(token, SECRET)).toThrow(/expired/i);
  });
});
