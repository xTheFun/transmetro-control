// Reportes operativos del sistema
const db = require('../config/db');

// GET /api/reportes/ocupacion-por-estacion
async function ocupacionPorEstacion(req, res) {
  const estaciones = await db('estacion').select('*');
  const resultado = await Promise.all(estaciones.map(async est => {
    // Último registro de ocupación por estación
    const reg = await db('registro_ocupacion')
      .where({ id_estacion: est.id })
      .orderBy('fecha_hora', 'desc')
      .first();
    return {
      estacion: est.nombre,
      porcentaje: reg ? Number(reg.porcentaje) : 0,
      pasajeros: reg ? reg.cantidad_pasajeros : 0
    };
  }));
  res.json(resultado);
}

// GET /api/reportes/estado-lineas
async function estadoLineas(req, res) {
  const lineas = await db('linea').select('*');
  const resultado = await Promise.all(lineas.map(async l => {
    const [{ total: buses }] = await db('bus').where({ id_linea: l.id }).count('id as total');
    const [{ total: estaciones }] = await db('linea_estacion').where({ id_linea: l.id }).count('id as total');
    const [{ total: alertas }] = await db('alerta').where({ id_bus: db('bus').where({ id_linea: l.id }).select('id'), estado: 'pendiente' }).count('id as total').catch(() => [{ total: 0 }]);
    return { ...l, num_buses: Number(buses), num_estaciones: Number(estaciones), alertas_pendientes: Number(alertas) };
  }));
  res.json(resultado);
}

// GET /api/reportes/estado-flota
async function estadoFlota(req, res) {
  const [activos]      = await db('bus').where({ estado: 'Activo' }).count('id as total');
  const [mantenimiento]= await db('bus').where({ estado: 'Mantenimiento' }).count('id as total');
  const [inactivos]    = await db('bus').where({ estado: 'Inactivo' }).count('id as total');
  const [total]        = await db('bus').count('id as total');
  res.json({
    total: Number(total.total),
    activos: Number(activos.total),
    mantenimiento: Number(mantenimiento.total),
    inactivos: Number(inactivos.total)
  });
}

// GET /api/reportes/resumen
async function resumen(req, res) {
  const hoy = new Date().toISOString().split('T')[0];
  const [alertasHoy]    = await db('alerta').whereRaw("DATE(fecha_hora) = ?", [hoy]).count('id as total');
  const [busesEnOp]     = await db('bus').where({ estado: 'Activo' }).count('id as total');
  const regs = await db('registro_ocupacion').select('porcentaje');
  const promedio = regs.length ? (regs.reduce((a, r) => a + Number(r.porcentaje), 0) / regs.length).toFixed(1) : 0;
  res.json({ alertas_hoy: Number(alertasHoy.total), buses_en_operacion: Number(busesEnOp.total), ocupacion_promedio: Number(promedio) });
}

module.exports = { ocupacionPorEstacion, estadoLineas, estadoFlota, resumen };
