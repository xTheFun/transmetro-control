// CRUD de líneas y sus recorridos
const db = require('../config/db');
const { validarMinimosBuses, validarMaximosBuses } = require('../rules/reglasNegocio');

// GET /api/lineas
async function listar(req, res) {
  const lineas = await db('linea as l')
    .leftJoin('municipalidad as m', 'l.id_municipalidad', 'm.id')
    .select('l.*', 'm.nombre as municipalidad');
  res.json(lineas);
}

// GET /api/lineas/:id
async function obtener(req, res) {
  const linea = await db('linea as l')
    .leftJoin('municipalidad as m', 'l.id_municipalidad', 'm.id')
    .where('l.id', req.params.id)
    .select('l.*', 'm.nombre as municipalidad')
    .first();
  if (!linea) return res.status(404).json({ error: 'Línea no encontrada.' });

  // Recorrido con estaciones en orden
  const estaciones = await db('linea_estacion as le')
    .join('estacion as e', 'le.id_estacion', 'e.id')
    .where('le.id_linea', req.params.id)
    .orderBy('le.orden')
    .select('le.*', 'e.nombre as estacion_nombre', 'e.estado as estacion_estado');

  // Buses asignados
  const buses = await db('bus').where({ id_linea: req.params.id });

  res.json({ ...linea, estaciones, buses });
}

// POST /api/lineas
async function crear(req, res) {
  const { nombre, codigo, distancia_total, estado, id_municipalidad } = req.body;
  if (!nombre || !codigo) return res.status(400).json({ error: 'Nombre y código son requeridos.' });

  const existe = await db('linea').where({ codigo }).first();
  if (existe) return res.status(409).json({ error: 'Ya existe una línea con ese código.' });

  const [id] = await db('linea').insert({ nombre, codigo, distancia_total: distancia_total || 0, estado: estado || 'Activa', id_municipalidad });
  res.status(201).json({ id, nombre, codigo, distancia_total, estado, id_municipalidad });
}

// PUT /api/lineas/:id
async function actualizar(req, res) {
  const { nombre, codigo, distancia_total, estado, id_municipalidad } = req.body;
  const linea = await db('linea').where({ id: req.params.id }).first();
  if (!linea) return res.status(404).json({ error: 'Línea no encontrada.' });

  await db('linea').where({ id: req.params.id }).update({ nombre, codigo, distancia_total, estado, id_municipalidad });
  res.json({ mensaje: 'Línea actualizada.' });
}

// DELETE /api/lineas/:id
async function eliminar(req, res) {
  const linea = await db('linea').where({ id: req.params.id }).first();
  if (!linea) return res.status(404).json({ error: 'Línea no encontrada.' });
  await db('linea').where({ id: req.params.id }).del();
  res.json({ mensaje: 'Línea eliminada.' });
}

// POST /api/lineas/:id/estaciones — agregar estación al recorrido
async function agregarEstacion(req, res) {
  const { id_estacion, orden, distancia_tramo } = req.body;
  const [id] = await db('linea_estacion').insert({
    id_linea: req.params.id, id_estacion, orden, distancia_tramo: distancia_tramo || 0
  });
  res.status(201).json({ id });
}

// DELETE /api/lineas/:id/estaciones/:idEstacion
async function quitarEstacion(req, res) {
  await db('linea_estacion').where({ id_linea: req.params.id, id_estacion: req.params.idEstacion }).del();
  res.json({ mensaje: 'Estación removida del recorrido.' });
}

// GET /api/lineas/:id/validar
// Verifica RN-02 y RN-03 para la línea indicada
async function validarLinea(req, res) {
  try {
    await validarMinimosBuses(req.params.id);
    await validarMaximosBuses(req.params.id);
    res.json({ valida: true, mensaje: 'La línea cumple con las reglas RN-02 y RN-03.' });
  } catch (err) {
    res.status(422).json({ valida: false, error: err.message });
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, agregarEstacion, quitarEstacion, validarLinea };
