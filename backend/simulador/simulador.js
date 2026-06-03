// Simulador de ocupación — genera registros aleatorios para el modo demo
// Activo solo cuando SIMULADOR=on en el .env
// Si la ocupación simulada supera 150%, dispara la alerta real (RN-06)
const db = require('../config/db');
const { verificarSaturacion, verificarBajaOcupacion } = require('../rules/reglasNegocio');

async function simularCiclo() {
  try {
    const buses = await db('bus').where({ estado: 'Activo' });
    const estaciones = await db('estacion').where({ estado: 'Activa' });
    if (!buses.length || !estaciones.length) return;

    // Simular 1-3 buses aleatorios por ciclo
    const cantidad = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < cantidad; i++) {
      const bus = buses[Math.floor(Math.random() * buses.length)];
      const est = estaciones[Math.floor(Math.random() * estaciones.length)];

      // Generar ocupación aleatoria con tendencia a valores normales
      // pero con 10% de probabilidad de saturación y 10% de baja
      const rand = Math.random();
      let pasajeros;
      if (rand < 0.10) {
        // Saturación: 150-200% de capacidad
        pasajeros = Math.floor(bus.capacidad * (1.5 + Math.random() * 0.5));
      } else if (rand < 0.20) {
        // Baja ocupación: 0-24%
        pasajeros = Math.floor(bus.capacidad * Math.random() * 0.24);
      } else {
        // Normal: 25-130%
        pasajeros = Math.floor(bus.capacidad * (0.25 + Math.random() * 1.05));
      }

      const porcentaje = (pasajeros / bus.capacidad) * 100;

      await db('registro_ocupacion').insert({
        id_bus: bus.id,
        id_estacion: est.id,
        cantidad_pasajeros: pasajeros,
        porcentaje: porcentaje.toFixed(2),
        fecha_hora: new Date().toISOString()
      });

      // Respetar RN-06 y RN-07
      await verificarSaturacion(bus.id, est.id, pasajeros, porcentaje);
      if (porcentaje < 25) await verificarBajaOcupacion(bus.id, est.id, porcentaje);

      console.log(`[SIMULADOR] Bus ${bus.codigo} en ${est.nombre}: ${pasajeros} pasajeros (${porcentaje.toFixed(0)}%)`);
    }
  } catch (err) {
    console.error('[SIMULADOR] Error:', err.message);
  }
}

function iniciarSimulador(intervaloSegs) {
  const ms = (intervaloSegs || 15) * 1000;
  console.log(`🚌 Simulador activo — ciclo cada ${intervaloSegs}s`);
  setInterval(simularCiclo, ms);
  simularCiclo(); // Ejecutar inmediatamente
}

module.exports = { iniciarSimulador };
