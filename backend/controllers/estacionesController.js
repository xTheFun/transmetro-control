// CRUD de estaciones con accesos, guardias y parqueos
const db = require('../config/db');

async function listar(req, res) {
  const estaciones = await db('estacion as e')
    .leftJoin('municipalidad as m', 'e.id_municipalidad', 'm.id')
    .select('e.*', 'm.nombre as municipalidad');

  // Para cada estación agregar conteos
  const resultado = await Promise.all(estaciones.map(async est => {
    const accesos = await db('acceso').where({ id_estacion: est.id });
    let totalGuardias = 0;
    for (const acc of accesos) {
      const [{ total }] = await db('guardia').where({ id_acceso: acc.id }).count('id as total');
      totalGuardias += Number(total);
    }
    const [{ total: parqueos }] = await db('parqueo').where({ id_estacion: est.id }).count('id as total');
    const lineas = await db('linea_estacion as le')
      .join('linea as l', 'le.id_linea', 'l.id')
      .where('le.id_estacion', est.id)
      .select('l.nombre', 'l.codigo');
    return { ...est, num_accesos: accesos.length, num_guardias: totalGuardias, num_parqueos: Number(parqueos), lineas };
  }));

  res.json(resultado);
}

async function obtener(req, res) {
  const est = await db('estacion').where({ id: req.params.id }).first();
  if (!est) return res.status(404).json({ error: 'Estación no encontrada.' });

  const accesos = await db('acceso').where({ id_estacion: est.id });
  for (const acc of accesos) {
    acc.guardias = await db('guardia').where({ id_acceso: acc.id });
  }
  const parqueos = await db('parqueo').where({ id_estacion: est.id });
  const operadores = await db('operador').where({ id_estacion: est.id });

  res.json({ ...est, accesos, parqueos, operadores });
}

async function crear(req, res) {
  const { nombre, ubicacion, estado, id_municipalidad } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido.' });
  const [id] = await db('estacion').insert({ nombre, ubicacion, estado: estado || 'Activa', id_municipalidad });
  res.status(201).json({ id, nombre, ubicacion, estado, id_municipalidad });
}

async function actualizar(req, res) {
  const { nombre, ubicacion, estado, id_municipalidad } = req.body;
  const est = await db('estacion').where({ id: req.params.id }).first();
  if (!est) return res.status(404).json({ error: 'Estación no encontrada.' });
  await db('estacion').where({ id: req.params.id }).update({ nombre, ubicacion, estado, id_municipalidad });
  res.json({ mensaje: 'Estación actualizada.' });
}

async function eliminar(req, res) {
  const est = await db('estacion').where({ id: req.params.id }).first();
  if (!est) return res.status(404).json({ error: 'Estación no encontrada.' });
  await db('estacion').where({ id: req.params.id }).del();
  res.json({ mensaje: 'Estación eliminada.' });
}

// Accesos
async function crearAcceso(req, res) {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre del acceso requerido.' });
  const [id] = await db('acceso').insert({ id_estacion: req.params.id, nombre });
  res.status(201).json({ id, id_estacion: req.params.id, nombre });
}

// Guardias
async function crearGuardia(req, res) {
  const { id_acceso, nombre, turno } = req.body;
  if (!id_acceso || !nombre) return res.status(400).json({ error: 'Acceso y nombre requeridos.' });
  const [id] = await db('guardia').insert({ id_acceso, nombre, turno });
  res.status(201).json({ id, id_acceso, nombre, turno });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, crearAcceso, crearGuardia };
