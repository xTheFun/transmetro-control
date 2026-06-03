// CRUD de pilotos con historial educativo
const db = require('../config/db');

async function listar(req, res) {
  const pilotos = await db('piloto as p')
    .leftJoin('bus as b', 'p.id_bus', 'b.id')
    .select('p.*', 'b.codigo as bus_codigo', 'b.estado as bus_estado');
  res.json(pilotos);
}

async function obtener(req, res) {
  const piloto = await db('piloto as p')
    .leftJoin('bus as b', 'p.id_bus', 'b.id')
    .where('p.id', req.params.id)
    .select('p.*', 'b.codigo as bus_codigo', 'b.estado as bus_estado')
    .first();
  if (!piloto) return res.status(404).json({ error: 'Piloto no encontrado.' });
  piloto.historial = await db('historial_educativo').where({ id_piloto: piloto.id }).orderBy('fecha', 'desc');
  res.json(piloto);
}

async function crear(req, res) {
  const { nombre, dpi, residencia, id_bus } = req.body;
  if (!nombre || !dpi) return res.status(400).json({ error: 'Nombre y DPI son requeridos.' });
  const existe = await db('piloto').where({ dpi }).first();
  if (existe) return res.status(409).json({ error: 'Ya existe un piloto con ese DPI.' });
  const [id] = await db('piloto').insert({ nombre, dpi, residencia, id_bus: id_bus || null });
  res.status(201).json({ id, nombre, dpi, residencia, id_bus });
}

async function actualizar(req, res) {
  const { nombre, dpi, residencia, id_bus } = req.body;
  const piloto = await db('piloto').where({ id: req.params.id }).first();
  if (!piloto) return res.status(404).json({ error: 'Piloto no encontrado.' });
  await db('piloto').where({ id: req.params.id }).update({ nombre, dpi, residencia, id_bus: id_bus || null });
  res.json({ mensaje: 'Piloto actualizado.' });
}

async function eliminar(req, res) {
  const piloto = await db('piloto').where({ id: req.params.id }).first();
  if (!piloto) return res.status(404).json({ error: 'Piloto no encontrado.' });
  await db('piloto').where({ id: req.params.id }).del();
  res.json({ mensaje: 'Piloto eliminado.' });
}

// Historial educativo
async function agregarHistorial(req, res) {
  const { tipo_licencia, curso, fecha } = req.body;
  if (!tipo_licencia || !curso) return res.status(400).json({ error: 'Tipo de licencia y curso son requeridos.' });
  const [id] = await db('historial_educativo').insert({ id_piloto: req.params.id, tipo_licencia, curso, fecha });
  res.status(201).json({ id, id_piloto: req.params.id, tipo_licencia, curso, fecha });
}

async function eliminarHistorial(req, res) {
  await db('historial_educativo').where({ id: req.params.idHistorial, id_piloto: req.params.id }).del();
  res.json({ mensaje: 'Registro eliminado.' });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, agregarHistorial, eliminarHistorial };
