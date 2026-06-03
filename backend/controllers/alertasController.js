// Gestión de alertas generadas por RN-06 y RN-07
const db = require('../config/db');

async function listar(req, res) {
  const { estado } = req.query; // pendiente | atendida
  let q = db('alerta as a')
    .join('bus as b', 'a.id_bus', 'b.id')
    .join('estacion as e', 'a.id_estacion', 'e.id')
    .select('a.*', 'b.codigo as bus_codigo', 'b.capacidad', 'e.nombre as estacion_nombre')
    .orderBy('a.fecha_hora', 'desc');
  if (estado) q = q.where('a.estado', estado);
  res.json(await q);
}

// PUT /api/alertas/:id/atender
async function atender(req, res) {
  const alerta = await db('alerta').where({ id: req.params.id }).first();
  if (!alerta) return res.status(404).json({ error: 'Alerta no encontrada.' });
  await db('alerta').where({ id: req.params.id }).update({ estado: 'atendida' });
  res.json({ mensaje: 'Alerta marcada como atendida.' });
}

// PUT /api/alertas/:id/apoyo
// Marca la alerta como atendida y simula el envío de apoyo
async function enviarApoyo(req, res) {
  const alerta = await db('alerta').where({ id: req.params.id }).first();
  if (!alerta) return res.status(404).json({ error: 'Alerta no encontrada.' });
  await db('alerta').where({ id: req.params.id }).update({ estado: 'atendida' });
  res.json({ mensaje: 'Unidad de apoyo enviada y alerta atendida.' });
}

module.exports = { listar, atender, enviarApoyo };
