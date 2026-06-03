// Registro de ocupación — aplica RN-06 y RN-07 automáticamente
const db = require('../config/db');
const { verificarSaturacion, verificarBajaOcupacion } = require('../rules/reglasNegocio');

// GET /api/ocupacion — historial reciente
async function listar(req, res) {
  const registros = await db('registro_ocupacion as ro')
    .join('bus as b', 'ro.id_bus', 'b.id')
    .join('estacion as e', 'ro.id_estacion', 'e.id')
    .leftJoin('operador as op', 'ro.id_operador', 'op.id')
    .select('ro.*', 'b.codigo as bus_codigo', 'b.capacidad', 'e.nombre as estacion_nombre', 'op.nombre as operador_nombre')
    .orderBy('ro.fecha_hora', 'desc')
    .limit(100);
  res.json(registros);
}

// POST /api/ocupacion — registrar nueva lectura
// ← AQUÍ se aplican RN-06 y RN-07
async function registrar(req, res) {
  const { id_bus, id_estacion, id_operador, cantidad_pasajeros } = req.body;

  if (!id_bus || !id_estacion || cantidad_pasajeros === undefined) {
    return res.status(400).json({ error: 'Bus, estación y cantidad de pasajeros son requeridos.' });
  }
  if (cantidad_pasajeros < 0) {
    return res.status(400).json({ error: 'La cantidad de pasajeros no puede ser negativa.' });
  }

  const bus = await db('bus').where({ id: id_bus }).first();
  if (!bus) return res.status(404).json({ error: 'Bus no encontrado.' });

  // Calcular porcentaje de ocupación
  const porcentaje = (cantidad_pasajeros / bus.capacidad) * 100;

  const [id] = await db('registro_ocupacion').insert({
    id_bus,
    id_estacion,
    id_operador: id_operador || null,
    cantidad_pasajeros,
    porcentaje: porcentaje.toFixed(2),
    fecha_hora: new Date().toISOString()
  });

  // Registrar visita del bus a la estación
  await db('visita_bus').insert({ id_bus, id_estacion, fecha_hora: new Date().toISOString() });

  // RN-06: Alerta de saturación si porcentaje >= 150%
  const alertaSat = await verificarSaturacion(id_bus, id_estacion, cantidad_pasajeros, porcentaje);

  // RN-07: Alerta de baja ocupación si porcentaje < 25%
  const alertaBaja = !alertaSat.alertaGenerada
    ? await verificarBajaOcupacion(id_bus, id_estacion, porcentaje)
    : { alertaGenerada: false };

  res.status(201).json({
    id,
    id_bus,
    id_estacion,
    cantidad_pasajeros,
    porcentaje: Number(porcentaje.toFixed(2)),
    capacidad_bus: bus.capacidad,
    alerta: alertaSat.alertaGenerada
      ? alertaSat
      : alertaBaja.alertaGenerada
        ? alertaBaja
        : { alertaGenerada: false }
  });
}

// GET /api/ocupacion/operadores — lista de operadores para el selector
async function listarOperadores(req, res) {
  const operadores = await db('operador as o')
    .leftJoin('estacion as e', 'o.id_estacion', 'e.id')
    .leftJoin('turno_operador as t', 'o.id', 't.id_operador')
    .select('o.*', 'e.nombre as estacion_nombre', 't.hora_inicio', 't.hora_fin');
  res.json(operadores);
}

module.exports = { listar, registrar, listarOperadores };
