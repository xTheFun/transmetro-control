// ============================================================
// REGLAS DE NEGOCIO DEL SISTEMA TRANSMETRO
// Todas las reglas están documentadas y centralizadas aquí
// ============================================================
const db = require('../config/db');

// RN-01: Un bus puede tener máximo 1 línea asignada (o ninguna)
// Se garantiza por el modelo de datos (columna id_linea en bus)

// RN-02: Una línea debe tener mínimo tantos buses como estaciones tenga
async function validarMinimosBuses(idLinea) {
  const [{ total: numEstaciones }] = await db('linea_estacion')
    .where({ id_linea: idLinea }).count('id as total');
  const [{ total: numBuses }] = await db('bus')
    .where({ id_linea: idLinea }).count('id as total');

  if (Number(numBuses) < Number(numEstaciones)) {
    throw new Error(
      `RN-02: La línea debe tener al menos ${numEstaciones} buses (uno por estación). Tiene ${numBuses}.`
    );
  }
}

// RN-03: Una línea puede tener máximo el doble de buses que estaciones
async function validarMaximosBuses(idLinea) {
  const [{ total: numEstaciones }] = await db('linea_estacion')
    .where({ id_linea: idLinea }).count('id as total');
  const [{ total: numBuses }] = await db('bus')
    .where({ id_linea: idLinea }).count('id as total');

  if (Number(numBuses) > Number(numEstaciones) * 2) {
    throw new Error(
      `RN-03: La línea no puede tener más de ${numEstaciones * 2} buses (doble de estaciones). Tiene ${numBuses}.`
    );
  }
}

// RN-04: Un bus SIEMPRE tiene parqueo asignado (id_parqueo NOT NULL)
// Se garantiza en la migración como columna NOT NULL.
// Esta función verifica explícitamente antes de insertar/actualizar
function validarParqueoObligatorio(idParqueo) {
  if (!idParqueo) {
    throw new Error('RN-04: Todo bus debe tener un parqueo asignado.');
  }
}

// RN-05: Cada acceso de estación tiene mínimo 1 guardia
// Se verifica al eliminar guardias o al crear accesos sin guardia
async function validarGuardiaMinimo(idAcceso) {
  const [{ total }] = await db('guardia')
    .where({ id_acceso: idAcceso }).count('id as total');
  if (Number(total) < 1) {
    throw new Error('RN-05: Cada acceso debe tener al menos un guardia asignado.');
  }
}

// RN-06: ALERTA DE SATURACIÓN
// Cuando cantidad_pasajeros >= 150% de la capacidad del bus,
// el backend inserta automáticamente una alerta tipo 'saturacion'.
// NUNCA se delega al frontend.
async function verificarSaturacion(idBus, idEstacion, cantidadPasajeros, porcentaje) {
  if (porcentaje >= 150) {
    await db('alerta').insert({
      id_bus: idBus,
      id_estacion: idEstacion,
      tipo: 'saturacion',
      porcentaje: porcentaje,
      estado: 'pendiente',
      fecha_hora: new Date().toISOString()
    });
    return { alertaGenerada: true, tipo: 'saturacion', mensaje: `Saturación al ${porcentaje.toFixed(1)}%` };
  }
  return { alertaGenerada: false };
}

// RN-07: ESPERA POR BAJA OCUPACIÓN
// Cuando cantidad_pasajeros < 25% de la capacidad del bus,
// genera alerta tipo 'baja_ocupacion'.
// El frontend mostrará el aviso de espera de 5 minutos.
async function verificarBajaOcupacion(idBus, idEstacion, porcentaje) {
  if (porcentaje < 25) {
    await db('alerta').insert({
      id_bus: idBus,
      id_estacion: idEstacion,
      tipo: 'baja_ocupacion',
      porcentaje: porcentaje,
      estado: 'pendiente',
      fecha_hora: new Date().toISOString()
    });
    return { alertaGenerada: true, tipo: 'baja_ocupacion', mensaje: `Baja ocupación al ${porcentaje.toFixed(1)}%: espera de 5 min activa.` };
  }
  return { alertaGenerada: false };
}

// RN-08: Una estación puede pertenecer a varias líneas
// Garantizado por el modelo: linea_estacion es tabla de relación N:M

// RN-09: Cada línea y estación pertenece a una municipalidad
// Garantizado por id_municipalidad FK en las tablas respectivas

module.exports = {
  validarMinimosBuses,
  validarMaximosBuses,
  validarParqueoObligatorio,
  validarGuardiaMinimo,
  verificarSaturacion,
  verificarBajaOcupacion,
};
