// CRUD de flota de buses — aplica RN-04 (parqueo obligatorio)
const db = require('../config/db');
const { validarParqueoObligatorio } = require('../rules/reglasNegocio');

async function listar(req, res) {
  const buses = await db('bus as b')
    .leftJoin('linea as l', 'b.id_linea', 'l.id')
    .leftJoin('parqueo as p', 'b.id_parqueo', 'p.id')
    .leftJoin('piloto as pi', 'b.id', 'pi.id_bus')
    .select('b.*', 'l.nombre as linea_nombre', 'p.nombre as parqueo_nombre', 'pi.nombre as piloto_nombre');
  res.json(buses);
}

async function obtener(req, res) {
  const bus = await db('bus as b')
    .leftJoin('linea as l', 'b.id_linea', 'l.id')
    .leftJoin('parqueo as p', 'b.id_parqueo', 'p.id')
    .leftJoin('piloto as pi', 'b.id', 'pi.id_bus')
    .where('b.id', req.params.id)
    .select('b.*', 'l.nombre as linea_nombre', 'p.nombre as parqueo_nombre', 'pi.nombre as piloto_nombre')
    .first();
  if (!bus) return res.status(404).json({ error: 'Bus no encontrado.' });
  res.json(bus);
}

async function crear(req, res) {
  const { codigo, placa, capacidad, estado, id_linea, id_parqueo } = req.body;
  if (!codigo || !placa || !capacidad) {
    return res.status(400).json({ error: 'Código, placa y capacidad son requeridos.' });
  }
  // RN-04: parqueo obligatorio
  try { validarParqueoObligatorio(id_parqueo); } catch (e) { return res.status(422).json({ error: e.message }); }

  const existeCod = await db('bus').where({ codigo }).first();
  if (existeCod) return res.status(409).json({ error: 'Ya existe un bus con ese código.' });

  const [id] = await db('bus').insert({ codigo, placa, capacidad, estado: estado || 'Activo', id_linea: id_linea || null, id_parqueo });
  res.status(201).json({ id, codigo, placa, capacidad, estado, id_linea, id_parqueo });
}

async function actualizar(req, res) {
  const { codigo, placa, capacidad, estado, id_linea, id_parqueo } = req.body;
  const bus = await db('bus').where({ id: req.params.id }).first();
  if (!bus) return res.status(404).json({ error: 'Bus no encontrado.' });

  // RN-04: parqueo obligatorio
  try { validarParqueoObligatorio(id_parqueo); } catch (e) { return res.status(422).json({ error: e.message }); }

  // Si cambia de línea, guardar historial
  if (id_linea !== bus.id_linea && bus.id_linea) {
    await db('historial_asignacion_bus').where({ id_bus: bus.id, id_linea: bus.id_linea, fecha_fin: null })
      .update({ fecha_fin: new Date().toISOString().split('T')[0] });
  }
  if (id_linea && id_linea !== bus.id_linea) {
    await db('historial_asignacion_bus').insert({
      id_bus: bus.id, id_linea, fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: null
    });
  }

  await db('bus').where({ id: req.params.id }).update({ codigo, placa, capacidad, estado, id_linea: id_linea || null, id_parqueo });
  res.json({ mensaje: 'Bus actualizado.' });
}

async function eliminar(req, res) {
  const bus = await db('bus').where({ id: req.params.id }).first();
  if (!bus) return res.status(404).json({ error: 'Bus no encontrado.' });
  await db('bus').where({ id: req.params.id }).del();
  res.json({ mensaje: 'Bus eliminado.' });
}

async function listarParqueos(req, res) {
  const parqueos = await db('parqueo as p')
    .leftJoin('estacion as e', 'p.id_estacion', 'e.id')
    .select('p.*', 'e.nombre as estacion_nombre');
  res.json(parqueos);
}

module.exports = { listar, obtener, crear, actualizar, eliminar, listarParqueos };
