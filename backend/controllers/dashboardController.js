// Dashboard — métricas generales del sistema
const db = require('../config/db');

// GET /api/dashboard
async function obtenerDashboard(req, res) {
  const [busesActivos]    = await db('bus').where({ estado: 'Activo' }).count('id as total');
  const [totalBuses]      = await db('bus').count('id as total');
  const [estacionesOp]    = await db('estacion').where({ estado: 'Activa' }).count('id as total');
  const [lineasActivas]   = await db('linea').where({ estado: 'Activa' }).count('id as total');
  const [alertasPend]     = await db('alerta').where({ estado: 'pendiente' }).count('id as total');

  // Ocupación promedio: última lectura por bus
  const ocupaciones = await db('registro_ocupacion')
    .select('id_bus', db.raw('MAX(fecha_hora) as ult'))
    .groupBy('id_bus');

  let sumaPorc = 0, contPorc = 0;
  for (const o of ocupaciones) {
    const reg = await db('registro_ocupacion')
      .where({ id_bus: o.id_bus, fecha_hora: o.ult }).first();
    if (reg) { sumaPorc += Number(reg.porcentaje); contPorc++; }
  }
  const ocupacionPromedio = contPorc > 0 ? (sumaPorc / contPorc).toFixed(1) : 0;

  // Estado de líneas con ocupación promedio por línea
  const lineas = await db('linea').select('*');
  const lineasEstado = await Promise.all(lineas.map(async l => {
    const [nbuses] = await db('bus').where({ id_linea: l.id }).count('id as total');
    const [nested] = await db('linea_estacion').where({ id_linea: l.id }).count('id as total');
    return { ...l, num_buses: Number(nbuses.total), num_estaciones: Number(nested.total) };
  }));

  // Alertas recientes (últimas 5)
  const alertas = await db('alerta as a')
    .join('bus as b', 'a.id_bus', 'b.id')
    .join('estacion as e', 'a.id_estacion', 'e.id')
    .select('a.*', 'b.codigo as bus_codigo', 'e.nombre as estacion_nombre')
    .where('a.estado', 'pendiente')
    .orderBy('a.fecha_hora', 'desc')
    .limit(5);

  res.json({
    metricas: {
      buses_activos:       Number(busesActivos.total),
      total_buses:         Number(totalBuses.total),
      estaciones_operativas: Number(estacionesOp.total),
      lineas_activas:      Number(lineasActivas.total),
      alertas_pendientes:  Number(alertasPend.total),
      ocupacion_promedio:  Number(ocupacionPromedio)
    },
    lineas: lineasEstado,
    alertas_recientes: alertas
  });
}

module.exports = { obtenerDashboard };
